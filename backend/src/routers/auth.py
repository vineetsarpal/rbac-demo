from fastapi import APIRouter, Depends, status, HTTPException, Response
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Annotated
from src import schemas, models, security, utils
from src.database import get_db
from datetime import timedelta
from src.config import settings
import os

ACCESS_TOKEN_EXPIRE_MINUTES = int(settings.ACCESS_TOKEN_EXPIRE_MINUTES)

router = APIRouter(
    prefix='/auth',
    tags=['Auth']
)

@router.post("/login")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> schemas.Token:
    org_username = form_data.username.split('\\', 1) # Split on first backslash

    if len(org_username) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Login format must be 'organization_slug\\username'"
        )
    
    org_slug, username = org_username[0].lower(), org_username[1].lower()

    organization = db.query(models.Organization).filter(models.Organization.slug == org_slug).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid organization or username",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(models.User).join(models.Organization).filter(
        models.User.username == username,
        models.User.organization_id == organization.id
    ).first()

    if not user or not utils.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get all unique permissions associated with the user's roles
    permissions = set()
    for role in user.roles:
        for permission in role.permissions:
            permissions.add(permission.name)
    user_permissions = list(permissions)

    # Add organization id to token
    organization_id = None
    if user.organization:
        organization_id = user.organization_id

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    tokenData = {
        "sub": user.username,
        "permissions": user_permissions,
        "organization_id": organization_id
    }
    access_token = security.create_access_token(data=tokenData, expires_delta=access_token_expires)
    return schemas.Token(access_token=access_token, token_type="bearer")


@router.get("/users/me/", response_model=schemas.CurrentUser)
async def read_users_me(current_user: Annotated[schemas.UserPublic, Depends(security.get_current_active_user)],):
    return current_user


@router.get("/users/me/organization", response_model=schemas.OrganizationPublic)
async def read_users_me_organization(db: Session = Depends(get_db), current_user: schemas.UserPublic = Depends(security.get_current_active_user)):
    user_org_query = db.query(models.Organization).join(models.User,
                                                models.Organization.id == models.User.organization_id)
    user_org = user_org_query.filter(models.Organization.id == current_user.organization_id).first()
    if not user_org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Organization not found for Current user")
    return user_org