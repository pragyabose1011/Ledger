# Code Citations

## License: unknown
https://github.com/ClaudiaQueipo/thesis-chatbot/blob/d60ca95161d1b18e513f725b99d218de4e10c55a/sgav_backend/service/auth.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
    now
```


## License: unknown
https://github.com/ClaudiaQueipo/thesis-chatbot/blob/d60ca95161d1b18e513f725b99d218de4e10c55a/sgav_backend/service/auth.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
    now
```


## License: unknown
https://github.com/ClaudiaQueipo/thesis-chatbot/blob/d60ca95161d1b18e513f725b99d218de4e10c55a/sgav_backend/service/auth.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
    now
```


## License: unknown
https://github.com/ClaudiaQueipo/thesis-chatbot/blob/d60ca95161d1b18e513f725b99d218de4e10c55a/sgav_backend/service/auth.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
    now
```


## License: unknown
https://github.com/ClaudiaQueipo/thesis-chatbot/blob/d60ca95161d1b18e513f725b99d218de4e10c55a/sgav_backend/service/auth.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
    now
```


## License: unknown
https://github.com/ClaudiaQueipo/thesis-chatbot/blob/d60ca95161d1b18e513f725b99d218de4e10c55a/sgav_backend/service/auth.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
    now
```


## License: unknown
https://github.com/ClaudiaQueipo/thesis-chatbot/blob/d60ca95161d1b18e513f725b99d218de4e10c55a/sgav_backend/service/auth.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
    now
```


## License: unknown
https://github.com/ClaudiaQueipo/thesis-chatbot/blob/d60ca95161d1b18e513f725b99d218de4e10c55a/sgav_backend/service/auth.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
    now
```


## License: unknown
https://github.com/ClaudiaQueipo/thesis-chatbot/blob/d60ca95161d1b18e513f725b99d218de4e10c55a/sgav_backend/service/auth.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
    now
```


## License: unknown
https://github.com/ClaudiaQueipo/thesis-chatbot/blob/d60ca95161d1b18e513f725b99d218de4e10c55a/sgav_backend/service/auth.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
    now = datetime.now(timezone.ut
```


## License: MIT
https://github.com/enableops/api-service/blob/71d618e13cdbe4d6ff651f99e1e2301a8456ebd9/app/api/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        payload = jwt.
```


## License: unknown
https://github.com/valeriosantuccioutlook/worth-trust-be/blob/dd090784552ff1baa909df8191eec65131863493/app/v1/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        user_id: Optional[str] =
```


## License: MIT
https://github.com/enableops/api-service/blob/71d618e13cdbe4d6ff651f99e1e2301a8456ebd9/app/api/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        payload = jwt.
```


## License: unknown
https://github.com/valeriosantuccioutlook/worth-trust-be/blob/dd090784552ff1baa909df8191eec65131863493/app/v1/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        user_id: Optional[str] =
```


## License: MIT
https://github.com/enableops/api-service/blob/71d618e13cdbe4d6ff651f99e1e2301a8456ebd9/app/api/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        payload = jwt.
```


## License: unknown
https://github.com/valeriosantuccioutlook/worth-trust-be/blob/dd090784552ff1baa909df8191eec65131863493/app/v1/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        user_id: Optional[str] =
```


## License: unknown
https://github.com/Ayaks7/test_shop/blob/d750b8fe08b9b37cb68208e89f966a375f8c8c6f/auth/auth/utils.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
```


## License: MIT
https://github.com/enableops/api-service/blob/71d618e13cdbe4d6ff651f99e1e2301a8456ebd9/app/api/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        payload = jwt.
```


## License: unknown
https://github.com/valeriosantuccioutlook/worth-trust-be/blob/dd090784552ff1baa909df8191eec65131863493/app/v1/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        user_id: Optional[str] =
```


## License: unknown
https://github.com/Ayaks7/test_shop/blob/d750b8fe08b9b37cb68208e89f966a375f8c8c6f/auth/auth/utils.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
```


## License: MIT
https://github.com/enableops/api-service/blob/71d618e13cdbe4d6ff651f99e1e2301a8456ebd9/app/api/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        payload = jwt.
```


## License: unknown
https://github.com/valeriosantuccioutlook/worth-trust-be/blob/dd090784552ff1baa909df8191eec65131863493/app/v1/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        user_id: Optional[str] =
```


## License: unknown
https://github.com/Ayaks7/test_shop/blob/d750b8fe08b9b37cb68208e89f966a375f8c8c6f/auth/auth/utils.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
```


## License: MIT
https://github.com/enableops/api-service/blob/71d618e13cdbe4d6ff651f99e1e2301a8456ebd9/app/api/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        payload = jwt.
```


## License: unknown
https://github.com/valeriosantuccioutlook/worth-trust-be/blob/dd090784552ff1baa909df8191eec65131863493/app/v1/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        user_id: Optional[str] =
```


## License: unknown
https://github.com/Ayaks7/test_shop/blob/d750b8fe08b9b37cb68208e89f966a375f8c8c6f/auth/auth/utils.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
```


## License: MIT
https://github.com/enableops/api-service/blob/71d618e13cdbe4d6ff651f99e1e2301a8456ebd9/app/api/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        payload = jwt.
```


## License: unknown
https://github.com/valeriosantuccioutlook/worth-trust-be/blob/dd090784552ff1baa909df8191eec65131863493/app/v1/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        user_id: Optional[str] =
```


## License: unknown
https://github.com/Ayaks7/test_shop/blob/d750b8fe08b9b37cb68208e89f966a375f8c8c6f/auth/auth/utils.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
```


## License: MIT
https://github.com/enableops/api-service/blob/71d618e13cdbe4d6ff651f99e1e2301a8456ebd9/app/api/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        payload = jwt.
```


## License: unknown
https://github.com/valeriosantuccioutlook/worth-trust-be/blob/dd090784552ff1baa909df8191eec65131863493/app/v1/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        user_id: Optional[str] =
```


## License: unknown
https://github.com/Ayaks7/test_shop/blob/d750b8fe08b9b37cb68208e89f966a375f8c8c6f/auth/auth/utils.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
```


## License: MIT
https://github.com/enableops/api-service/blob/71d618e13cdbe4d6ff651f99e1e2301a8456ebd9/app/api/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        payload = jwt.decode(token, SECRET_KEY,
```


## License: unknown
https://github.com/valeriosantuccioutlook/worth-trust-be/blob/dd090784552ff1baa909df8191eec65131863493/app/v1/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
        user_id: Optional[str] =
```


## License: unknown
https://github.com/Ayaks7/test_shop/blob/d750b8fe08b9b37cb68208e89f966a375f8c8c6f/auth/auth/utils.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
```


## License: unknown
https://github.com/Ayaks7/test_shop/blob/d750b8fe08b9b37cb68208e89f966a375f8c8c6f/auth/auth/utils.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
```


## License: MIT
https://github.com/enableops/api-service/blob/71d618e13cdbe4d6ff651f99e1e2301a8456ebd9/app/api/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
```


## License: unknown
https://github.com/valeriosantuccioutlook/worth-trust-be/blob/dd090784552ff1baa909df8191eec65131863493/app/v1/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
```


## License: unknown
https://github.com/Ayaks7/test_shop/blob/d750b8fe08b9b37cb68208e89f966a375f8c8c6f/auth/auth/utils.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
```


## License: MIT
https://github.com/enableops/api-service/blob/71d618e13cdbe4d6ff651f99e1e2301a8456ebd9/app/api/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
```


## License: unknown
https://github.com/valeriosantuccioutlook/worth-trust-be/blob/dd090784552ff1baa909df8191eec65131863493/app/v1/dependencies.py

```


Looking at your `auth.py`, I can see the issue — **there's zero email validation**. Any string that looks like an email gets accepted, including `pragya@example.com`, `test@test.com`, etc.

Here's the fix:

### **Backend `auth.py` — Add email validation**

````python
# filepath: /Users/pragyabose/Ledger/backend/app/api/auth.py
from datetime import datetime, timedelta, timezone
import os
import re

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
        return validate_email(v)


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @validator("email")
    def check_email(cls, v):
        return validate_email(v)

    @validator("password")
    def check_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


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
```

