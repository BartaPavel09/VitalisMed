from datetime import datetime, timedelta, timezone
from typing import Any
import bcrypt
import jwt
from app.core.config import settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """
    Generate a secure bcrypt hash for a plain text password.

    @param password: Plain text password string.
    @return: Salted and hashed password string.
    """
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against an existing bcrypt hash.

    @param plain_password: Password attempt string.
    @param hashed_password: Stored bcrypt hash string.
    @return: True if the password matches the hash, False otherwise.
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def create_access_token(subject: str | Any, role: str, expires_delta: timedelta | None = None) -> str:
    """
    Encode a JWT containing subject identity and authorization role.

    @param subject: Subject identifier, the user email or ID.
    @param role: User role string for role based access control.
    @param expires_delta: Optional custom token expiration duration.
    @return: Encoded JWT string.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(subject),
        "role": str(role),
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    Decode and validate a JWT against the application secret key.

    @param token: Encoded JWT string.
    @return: Decoded payload dictionary if valid, None if expired or corrupted.
    """
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
