from fastapi import status, HTTPException, Depends, APIRouter, Response
from typing import Annotated
from src import models, schemas, security, utils
from sqlalchemy.orm import Session
from src.database import get_db
from typing import List

router = APIRouter(
    prefix="/roles",
    tags=["Roles"]
)

# Create a Role
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.RolePublic)
async def create_role(role: schemas.RoleCreate, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    utils.has_permission(current_user, "create:roles")
    
    new_role = models.Role(**role.model_dump())
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

# Get All Roles
@router.get("/")
async def get_roles(skip: int = 0, limit: int = 10, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    utils.has_permission(current_user, "read:roles")
    
    roles_query = db.query(models.Role)
    if not current_user.is_platform_admin:
        roles_query = roles_query.filter(models.Role.is_platform_level == False)

    roles = roles_query.offset(skip).limit(limit).all()
    return roles

# Get Role with id
@router.get("/{role_id}", response_model=schemas.RolePublic)
async def get_role(role_id: int, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    utils.has_permission(current_user, "read:roles")
    
    role_query = db.query(models.Role)
    if not current_user.is_platform_admin:
        role_query = role_query.filter(models.Role.is_platform_level == False)
        
    role  = role_query.filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Role with id:  {role_id} not found")
    return role

# Update Role with id
@router.put("/{role_id}", response_model=schemas.RolePublic)
def update_role(role_id: int, updated_role: schemas.RoleCreate, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    utils.has_permission(current_user, "update:roles")
    
    role_query = db.query(models.Role).filter(models.Role.id == role_id)
    role = role_query.first()
    if role == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Role with id: {role_id} does not exist")
    role_query.update(updated_role.model_dump(), synchronize_session=False)
    db.commit()
    return role_query.first()


# Delete Role with id
@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    utils.has_permission(current_user, "delete:roles")
    
    role_query = db.query(models.Role).filter(models.Role.id == role_id)
    role = role_query.first()
    if role == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Role with id: {role_id} does not exist")
    role_query.delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# Get all Permissions for a Role
@router.get("/{role_id}/permissions", response_model=List[schemas.PermissionWithAssignment])
def get_role_permissions(role_id: int, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    utils.has_permission(current_user, "read:roles")
    
    role_query = db.query(models.Role)
    if not current_user.is_platform_admin:
        role_query = role_query.filter(models.Role.is_platform_level == False)
    role = role_query.filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Role with id: {role_id} not found")

    # Fetch all permissions and check if assigned to role
    permissions_query = db.query(models.Permission)
    if not current_user.is_platform_admin:
        permissions_query = permissions_query.filter(models.Permission.is_platform_level == False)

    all_permissions = permissions_query.all()
    assigned_permission_ids = {permission.id for permission in role.permissions}

    permissions_with_assignment: List[schemas.PermissionWithAssignment] = []

    for permission in all_permissions:
        is_assigned = permission.id in assigned_permission_ids
        permissions_with_assignment.append(schemas.PermissionWithAssignment(id=permission.id, name=permission.name, assigned=is_assigned))
    
    return permissions_with_assignment


# Batch assign/remove permissions to a Role
@router.post("/{role_id}/permissions")
def update_role_permissions(role_id: int, permission_ids: List[int], db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    utils.has_permission(current_user, "update:roles")
    
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    new_permissions = db.query(models.Permission).filter(models.Permission.id.in_(permission_ids)).all()
    role.permissions = new_permissions  # Replaces all existing permissions
    db.commit()
    return {"message": "Permissions updated successfully"}