from fastapi import status, HTTPException, Depends, APIRouter, Response
from typing import Annotated
from src import models, schemas, security
from sqlalchemy.orm import Session
from src.database import get_db

router = APIRouter(
    prefix="/permissions",
    tags=["Permissions"]
)

# Create a Permission
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.PermissionPublic)
async def create_permission(permission: schemas.PermissionCreate, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    user_permissions = current_user.permissions
    if "create:permissions" not in user_permissions:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to perform this action!")
    
    new_permission = models.Permission(**permission.model_dump())
    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)
    return new_permission

# Get All Permissions
@router.get("/")
async def get_permissions(skip: int = 0, limit: int = 10, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    user_permissions = current_user.permissions
    if "read:permissions" not in user_permissions:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to perform this action!")
    
    permissions = db.query(models.Permission).offset(skip).limit(limit).all()
    return permissions


# Get Permission with id
@router.get("/{permission_id}", response_model=schemas.PermissionPublic)
async def get_permission(permission_id: int, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    user_permissions = current_user.permissions
    if "read:permissions" not in user_permissions:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to perform this action!")
    
    permission  = db.query(models.Permission).filter(models.Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Permission with id:  {permission_id} not found")
    return permission

# Update Permission with id
@router.put("/{permission_id}", response_model=schemas.PermissionPublic)
def update_permission(permission_id: int, updated_permission: schemas.PermissionCreate, db: Session = Depends(get_db), current_user = Depends(security.get_current_active_user)):
    # Check permissions
    user_permissions = current_user.permissions
    if "update:permissions" not in user_permissions:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to perform this action!")
    
    permission_query = db.query(models.Permission).filter(models.Permission.id == permission_id)
    permission = permission_query.first()
    if permission == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Permission with id: {permission_id} does not exist")
    permission_query.update(updated_permission.model_dump(), synchronize_session=False)
    db.commit()
    return permission_query.first()

# Delete Permission with id
@router.delete("/{permission_id}")
def delete_permission(permission_id: int, db: Session = Depends(get_db), current_user = Depends(security.get_current_active_user)):
    # Check permissions
    user_permissions = current_user.permissions
    if "delete:permissions" not in user_permissions:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to perform this action!")
    
    permission_query = db.query(models.Permission).filter(models.Permission.id == permission_id)
    permission = permission_query.first()
    if permission == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Permission with id: {permission_id} does not exist")
    permission_query.delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


