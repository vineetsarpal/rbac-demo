from typing import List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime, date

# === Token Schemas ===
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None
    organization_id: str | None = None
    permissions: List[str] = []

    
# Organization Schemas ===
class OrganizationBase(BaseModel):
    id: str
    name: str
    slug: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationPublic(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)

# === User Schemas ===
class UserBase(BaseModel):
    username: str
    email: EmailStr | None = None
    name: str | None = None
    organization_id: str

class UserCreate(UserBase):
    password: str

class UserPublic(UserBase):
    id: int
    is_active: bool | None = True
    created_at: datetime 
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CurrentUser(UserPublic):
    permissions: List[str] = []
    is_platform_admin: bool | None = False


# === Permission Schemas ===
class PermissionBase(BaseModel):
    name: str
    description: str | None = None

class PermissionCreate(PermissionBase):
    pass


class PermissionPublic(PermissionBase):
    id: int
    created_at: datetime
    updated_at: datetime

class PermissionWithAssignment(PermissionBase):
    id: int
    assigned: bool


# === Role Schemas ===
class RoleBase(BaseModel):
    name: str
    description: str | None = None

class RoleCreate(RoleBase):
    pass

class RolePublic(RoleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    users: List[UserPublic] = []
    permissions: List[PermissionPublic] = []

    model_config = ConfigDict(from_attributes=True)

class RoleWithAssignment(RoleBase):
    id: int
    assigned: bool | None = None


# === Item Schemas ===
class ItemBase(BaseModel):
    name: str
    price: float

class ItemCreate(ItemBase):
    pass

class ItemPublic(ItemBase):
    id: int
    organization_id: str | None = None
    is_active: bool | None = True

    model_config = ConfigDict(from_attributes=True)

