from passlib.context import CryptContext
from fastapi import HTTPException, status
from src.schemas import CurrentUser

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str):
    return pwd_context.hash(password)

from fastapi import HTTPException, status
from src.schemas import CurrentUser

def has_permission(current_user: CurrentUser, required_permission: str):
    if required_permission not in current_user.permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions: '{required_permission}' permission required"
        )
    return True