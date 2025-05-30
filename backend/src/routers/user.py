from fastapi import status, HTTPException, Depends, APIRouter, Response
from src import models, schemas, utils, security
from sqlalchemy.orm import Session
from src.database import get_db
from typing import List

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# Create User
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.UserPublic)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    user_permissions = current_user.permissions
    if "create:users" not in user_permissions:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to perform this action!")
    
    # hash the password
    hashed_password = utils.hash_password(user.password)
    user.password = hashed_password

    new_user = models.User(**user.model_dump())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# Get All Users
@router.get("/")
async def get_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    user_permissions = current_user.permissions
    if "read:users" not in user_permissions:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to perform this action!")
    users = db.query(models.User).filter(models.User.organization_id == current_user.organization_id).offset(skip).limit(limit).all()
    return users


# Get User with id
@router.get("/{user_id}", response_model=schemas.UserPublic)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    user_permissions = current_user.permissions
    if "read:users" not in user_permissions:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to perform this action!")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"user with id: {user_id} not found")
    return user

# Get User's Organization   
@router.get("/{user_id}/organization", response_model=schemas.OrganizationPublic)
async def get_user_organization(user_id: int, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    user_org_query = db.query(models.User).join(models.Organization,
                                                models.User.organization_id == models.Organization.id)
    user = user_org_query.filter(models.User.organization_id == current_user.organization_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"User with ID: {user_id} not found or not accessible by your organization.")
    if user.organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"User with ID: {user_id} is not associated with a specific organization (e.g., a Platform Admin).")
    return user.organization

# Update User with id
@router.put("/{user_id}", response_model=schemas.UserPublic)
def update_user(user_id: int, updated_user: schemas.UserCreate, db: Session = Depends(get_db), current_user = Depends(security.get_current_user)):
    # Check permissions
    user_permissions = current_user.permissions
    if "update:users" not in user_permissions:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to perform this action!")
    
    user_query = db.query(models.User).filter(models.User.id == user_id)
    user = user_query.first()
    if user == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with id: {user_id} does not exist")
    user_query.update(updated_user.model_dump(), synchronize_session=False)
    db.commit()
    return user_query.first()

# Delete User with id
@router.delete("/{user_id}")
def delete_role(user_id: int, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    user_permissions = current_user.permissions
    if "delete:users" not in user_permissions:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to perform this action!")
    
    # Prevent self deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account!"
    )

    user_query = db.query(models.User).filter(models.User.id == user_id)
    user = user_query.first()
    if user == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with id: {user_id} does not exist")
    if user.username.lower().startswith("admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Can not delete an admin user!")
    user_query.delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# Get all Roles for a User
@router.get("/{user_id}/roles", response_model=List[schemas.RoleWithAssignment])
def get_user_roles(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with id: {user_id} not found")
    
    roles_query = db.query(models.Role)
    if not user.is_platform_admin:
        roles_query = roles_query.filter(models.Role.is_platform_level == False)

    # Fetch all roles and check if assigned to current user
    all_roles = roles_query.all()
    assigned_role_ids = { role.id for role in user.roles }

    roles_with_assignment: List[schemas.RoleWithAssignment] = []

    for role in all_roles:
        is_assigned = role.id in assigned_role_ids
        roles_with_assignment.append(schemas.RoleWithAssignment(id=role.id, name=role.name, assigned=is_assigned))
    
    return roles_with_assignment

# Assign/Remove Roles to a User in batch
@router.post("/{user_id}/roles")
def update_user_roles(user_id: int, role_ids: List[int], db: Session = Depends(get_db), current_user = Depends(security.get_current_user)):
    # Check permissions
    user_permissions = current_user.permissions
    if "update:users" not in user_permissions:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to perform this action!")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_roles = db.query(models.Role).filter(models.Role.id.in_(role_ids)).all()
    user.roles = new_roles  # Replaces all existing roles
    db.commit()
    return {"message": "Roles updated successfully"}


