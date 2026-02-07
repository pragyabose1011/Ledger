from datetime import datetime, timedelta, timezone
import os

from typing import Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext  # ← add


from app.db.session import SessionLocal
from app.db.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Config
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-me-dev-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()


class Token(BaseModel):
  access_token: str
  token_type: str = "bearer"


class LoginRequest(BaseModel):
  email: str
  password: str

class OAuthLoginRequest(BaseModel):
  email: str
  name: str
  provider: str


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None ) -> str:
  to_encode = data.copy()
  now = datetime.now(timezone.utc)
  expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
  to_encode.update({"exp": expire, "iat": now})
  return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
  user = db.query(User).filter(User.email == payload.email).first()

  if not user:
    # Auto-register on first login: derive a default name from email
    user = User(
      name=payload.email.split("@")[0],
      email=payload.email,
      password_hash=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
  else:
    # If user has no password yet (legacy users), set it on first password login
    if user.password_hash is None:
      user.password_hash = get_password_hash(payload.password)
      db.commit()
    elif not verify_password(payload.password, user.password_hash):
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Incorrect email or password",
      )

  access_token = create_access_token({"sub": user.id})
  return Token(access_token=access_token)

@router.post("/oauth", response_model=Token)
def oauth_login(payload: OAuthLoginRequest, db: Session = Depends(get_db)):
  """
  Simple OAuth-style login:
  - Caller is expected to have already validated the provider token.
  - We trust the email/name coming from the provider.
  """
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
 
def get_password_hash(password: str) -> str:
  return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
  return pwd_context.verify(plain_password, hashed_password)

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