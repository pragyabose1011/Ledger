from datetime import datetime, timedelta, timezone
import os
import re
import secrets

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, validator
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.db.session import SessionLocal
from app.db.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Config
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-me-dev-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ── Email validation ─────────────────────────────────────────────────
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

BLOCKED_DOMAINS = {
    "example.com", "example.org", "example.net",
    "test.com", "test.org", "test.net",
    "mailinator.com", "guerrillamail.com", "tempmail.com",
    "throwaway.email", "yopmail.com", "sharklasers.com",
    "trashmail.com", "fakeinbox.com", "dispostable.com",
    "getnada.com", "maildrop.cc", "10minutemail.com",
    "temp-mail.org", "guerrillamailblock.com", "grr.la",
    "tempail.com", "mohmal.com",
}


def validate_password(password: str) -> str:
    """Shared password strength validator."""
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one number")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValueError("Password must contain at least one special character")
    return password


def validate_email(email: str) -> str:
    """Validate email format and reject fake/disposable domains."""
    email = email.strip().lower()

    if not EMAIL_REGEX.match(email):
        raise ValueError("Invalid email format")

    domain = email.split("@")[1]
    if domain in BLOCKED_DOMAINS:
        raise ValueError(
            f"'{domain}' is not allowed. Please use a real email address."
        )

    return email


# ── DB dependency ────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Schemas ──────────────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return v.strip().lower()


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        return validate_password(v)


class OAuthLoginRequest(BaseModel):
    email: str
    name: str
    provider: str


# ── Helpers ──────────────────────────────────────────────────────────
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ── Routes ───────────────────────────────────────────────────────────
@router.post("/signup", response_model=Token)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """Create a new user account."""
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": user.id})
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    if user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please use OAuth login or reset your password",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    access_token = create_access_token({"sub": user.id})
    return Token(access_token=access_token)


@router.post("/oauth", response_model=Token)
def oauth_login(payload: OAuthLoginRequest, db: Session = Depends(get_db)):
    """OAuth login - creates account if doesn't exist."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        user = User(name=payload.name, email=payload.email)
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token({
        "sub": user.id,
        "auth": "oauth",
        "provider": payload.provider,
    })
    return Token(access_token=access_token)


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @validator("new_password")
    def check_password(cls, v):
        return validate_password(v)


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a password reset token. In dev, returns the token directly."""
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    # Always return 200 to avoid email enumeration
    if not user:
        return {"message": "If that email exists, a reset link has been sent."}

    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=1)

    user.password_reset_token = token
    user.password_reset_expires = expires
    db.commit()

    # Try to send email; fall back to returning token in dev
    from app.services.email_notifier import send_email, is_email_configured
    reset_url = f"{os.environ.get('FRONTEND_URL', 'http://localhost:5173')}/reset-password?token={token}"

    if is_email_configured():
        send_email(
            to=user.email,
            subject="[Ledger] Reset your password",
            body=f"Hi {user.name},\n\nClick the link below to reset your password (expires in 1 hour):\n\n{reset_url}\n\nIf you didn't request this, ignore this email.\n\n— Ledger",
        )
        return {"message": "If that email exists, a reset link has been sent."}
    else:
        # Dev mode: return token so it can be tested without email
        return {"message": "Email not configured. Use the token below for testing.", "dev_token": token, "reset_url": reset_url}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using a valid token."""
    now = datetime.now(timezone.utc)
    user = db.query(User).filter(User.password_reset_token == payload.token).first()

    if not user:
        raise HTTPException(400, "Invalid or expired reset token")

    expires = user.password_reset_expires
    if expires is None:
        raise HTTPException(400, "Invalid or expired reset token")
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if now > expires:
        raise HTTPException(400, "Reset token has expired")

    user.password_hash = get_password_hash(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()

    return {"message": "Password reset successfully. You can now log in."}


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).get(user_id)
    if user is None:
        raise credentials_exception
    return user