from fastapi import status, HTTPException, Depends, APIRouter, Response
from typing import Annotated
from src import models, schemas, security, utils
from sqlalchemy.orm import Session
from src.database import get_db
from typing import List

router = APIRouter(
    prefix="/organizations",
    tags=["Organization"]
)

# Create an Organization
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.OrganizationPublic)
async def create_organization(organization: schemas.OrganizationCreate, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    utils.has_permission(current_user, "create:organizations")
    
    new_org = models.Organization(**organization.model_dump())
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    return new_org

# Get All Organizations
@router.get("/")
async def get_organizations(skip: int = 0, limit: int = 10, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    utils.has_permission(current_user, "read:organizations")
    
    organizations = db.query(models.Organization).offset(skip).limit(limit).all()
    return organizations

# Get Organization with id
@router.get("/{organization_id}", response_model=schemas.OrganizationPublic)
async def get_organization(organization_id: str, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    utils.has_permission(current_user, "read:organizations")
    
    organization  = db.query(models.Organization).filter(models.Organization.id == organization_id).first()
    if not organization:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Organization with id:  {organization_id} not found")
    return organization

# Update Organization with id
@router.put("/{organization_id}", response_model=schemas.OrganizationPublic)
def update_organization(organization_id: str, updated_organization: schemas.OrganizationCreate, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    utils.has_permission(current_user, "update:organizations")
    
    organization_query = db.query(models.Organization).filter(models.Organization.id == organization_id)
    organization = organization_query.first()
    if organization == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Organization with id: {organization_id} does not exist")
    organization_query.update(updated_organization.model_dump(), synchronize_session=False)
    db.commit()
    return organization_query.first()


# Delete Organization with id
@router.delete("/{organization_id}")
def delete_organization(organization_id: str, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    utils.has_permission(current_user, "delete:organizations")
    
    organization_query = db.query(models.Organization).filter(models.Organization.id == organization_id)
    organization = organization_query.first()
    if organization == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Organization with id: {organization_id} does not exist")
    organization_query.delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)