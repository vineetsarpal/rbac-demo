from fastapi import status, HTTPException, Depends, APIRouter, Response
from typing import Annotated, List
from src import models, schemas, security, utils
from sqlalchemy.orm import Session
from src.database import get_db

router = APIRouter(
    prefix="/items",
    tags=["Items"]
)

# Create an Item
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.ItemPublic)
async def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    utils.has_permission(current_user, "create:items")
    
    # Inject organization_id from token
    item_data = item.model_dump()
    item_data["organization_id"] = current_user.organization_id 

    new_item = models.Item(**item_data)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

# Get All Items
@router.get("/", response_model=List[schemas.ItemPublic])
async def get_items(skip: int = 0, limit: int = 10, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    utils.has_permission(current_user, "read:items")
    items_query = db.query(models.Item)
    if not current_user.is_platform_admin:
        items_query = items_query.filter(models.Item.organization_id == current_user.organization_id)
    items = items_query.offset(skip).limit(limit).all()
    return items


# Get Item with id
@router.get("/{item_id}", response_model=schemas.ItemPublic)
async def get_item(item_id: int, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    utils.has_permission(current_user, "read:items")

    item_query = db.query(models.Item)
    if not current_user.is_platform_admin:
        item_query = item_query.filter(models.Item.organization_id == current_user.organization_id)
    item  = item_query.filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Item with id:  {item_id} not found")
    return item

# Update Item with id
@router.put("/{item_id}", response_model=schemas.ItemPublic)
def update_item(item_id: int, updated_item: schemas.ItemCreate, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    utils.has_permission(current_user, "update:items")
    
    item_query = db.query(models.Item).filter(models.Item.organization_id == current_user.organization_id).filter(models.Item.id == item_id)
    item = item_query.first()
    if item == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Item with id: {item_id} does not exist")
    item_query.update(updated_item.model_dump(), synchronize_session=False)
    db.commit()
    return item_query.first()

# Delete Item with id
@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: schemas.CurrentUser = Depends(security.get_current_active_user)):
    # Check permissions
    utils.has_permission(current_user, "delete:items")
        
    item_query = db.query(models.Item).filter(models.Item.id == item_id)
    item = item_query.first()
    if item == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Item with id: {item_id} does not exist")
    item_query.delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
