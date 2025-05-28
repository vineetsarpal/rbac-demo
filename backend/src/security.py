from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional, List
from src.database import get_db
from src import schemas, models, utils
from fastapi import Depends, status, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from src.config import settings
import os

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='auth/login')

def authenticate_user(username: str, password: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == username).first()
    if not user:
        return False
    if not utils.verify_password(password, user.password):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Annotated[Optional[str], Depends(oauth2_scheme)], db: Session = Depends(get_db)):
    if not token:
        return None # No token provided for Basic Auth
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Extract username, organization, permissions from JWT
        username = payload.get("sub")
        organization_id: int | None = payload.get("organization_id")
        permissions: List[str] = payload.get("permissions", [])

        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username, permissions=permissions, organization_id=organization_id)

    except JWTError:
        raise credentials_exception
    except Exception as e:
        print(f"Basic Auth validation error: {e}") 
        raise credentials_exception from e
    
    user = db.query(models.User).filter(models.User.email == token_data.username).first()
    if user is None:
        raise credentials_exception
    
    # Attach permissions and organization to user object
    user.permissions = permissions
    user.organization_id = organization_id
    
    return user

async def get_current_active_user(current_user: schemas.UserPublic = Depends(get_current_user)):
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return current_user