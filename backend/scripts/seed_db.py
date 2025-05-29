import os
import sys
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timezone

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(project_root))

from src.database import Base
from src import models, schemas, utils
from src.config import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def seed_data():
    db: Session = next(get_db())
    print("Seeding database...")
    try:
        # --- Create Organizations ---
        org0_id = "superadmin"
        org1_id = "org_1"
        org2_id = "org_2"

        org0 = db.query(models.Organization).filter(models.Organization.id == org1_id).first()
        if not org0:
            org0 = models.Organization(id=org0_id, name="superadmin", slug="default")
            db.add(org0)
            db.commit()
            db.refresh(org0)

        org1 = db.query(models.Organization).filter(models.Organization.id == org1_id).first()
        if not org1:
            org1 = models.Organization(id=org1_id, name="Acme Inc", slug="acme")
            db.add(org1)
            db.commit()
            db.refresh(org1)
        
        org2 = db.query(models.Organization).filter(models.Organization.id == org2_id).first()
        if not org2:
            org2 = models.Organization(id=org2_id, name="FooBar Corp", slug="foobar")
            db.add(org2)
            db.commit()
            db.refresh(org2)

        # --- Create Users ---
        # Org0
        superadmin_password_hash = utils.hash_password("superadmin")
        superadmin_user = db.query(models.User).filter(models.User.username == "superadmin").first()
        if not superadmin_user:
            superadmin_user = models.User(
                username="superadmin",
                password=superadmin_password_hash,
                email="superadmin@superadmin.com",
                name="Super Administrator",
                is_platform_admin=True,
                organization_id=org0_id
            )
            db.add(superadmin_user)
            db.commit()
            db.refresh(superadmin_user)
        else:
            print("super admin user already exists")

        # Org1
        admin_password_hash = utils.hash_password("admin")

        admin_user1 = db.query(models.User).join(models.Organization).filter(models.User.username == "admin",
                                                                             models.Organization.id == org1_id).first()
        if not admin_user1:
            admin_user1 = models.User(
                username="admin",
                password=admin_password_hash,
                email="admin@acme.com",
                name="Administrator",
                organization_id=org1_id
            )
            db.add(admin_user1)
            db.commit()
            db.refresh(admin_user1)
        else:
            print("Admin user already exists")

        editor_password_hash = utils.hash_password("editor")
        editor_user1 = db.query(models.User).join(models.Organization).filter(models.User.username == "editor",
                                                                              models.Organization.id == org1_id).first()
        if not editor_user1:
            editor_user1 = models.User(
                username="editor",
                email="editor@acme.com",
                password=editor_password_hash,
                name="John Doe",
                organization_id=org1_id
            )
            db.add(editor_user1)
            db.commit()
            db.refresh(editor_user1)
        else:
            print("Editor user already exists")
        
        viewer_password_hash = utils.hash_password("viewer")
        viewer_user1 = db.query(models.User).join(models.Organization).filter(models.User.username == "viewer",
                                                                              models.Organization.id == org1_id).first()
        if not viewer_user1:
            viewer_user1 = models.User(
                username="viewer",
                email="viewer@acme.com",
                password=viewer_password_hash,
                name="Jane Doe",
                organization_id=org1_id
            )
            db.add(viewer_user1)
            db.commit()
            db.refresh(viewer_user1)
        else:
            print("Viewer user already exists")

        # Org 2
        admin_password_hash = utils.hash_password("admin")

        admin_user2 = db.query(models.User).join(models.Organization).filter(models.User.username == "admin",
                                                                            models.Organization.id == org2_id).first()
        if not admin_user2:
            admin_user2 = models.User(
                username="admin",
                password=admin_password_hash,
                email="admin@foobar.com",
                name="Administrator",
                organization_id=org2_id
            )
            db.add(admin_user2)
            db.commit()
            db.refresh(admin_user2)
        else:
            print("Admin user already exists")

        editor_password_hash = utils.hash_password("editor")
        editor_user2 = db.query(models.User).join(models.Organization).filter(models.User.username == "editor",
                                                                              models.Organization.id == org2_id).first()
        if not editor_user2:
            editor_user2 = models.User(
                username="editor",
                email="editor@foobar.com",
                password=editor_password_hash,
                name="Bob",
                organization_id=org2_id
            )
            db.add(editor_user2)
            db.commit()
            db.refresh(editor_user2)
        else:
            print("Editor user already exists")
        
        viewer_password_hash = utils.hash_password("viewer")
        viewer_user2 = db.query(models.User).join(models.Organization).filter(models.User.username == "viewer",
                                                                              models.Organization.id == org2_id).first()
        if not viewer_user2:
            viewer_user2 = models.User(
                username="viewer",
                email="viewer@foobar.com",
                password=viewer_password_hash,
                name="Pam",
                organization_id=org2_id
            )
            db.add(viewer_user2)
            db.commit()
            db.refresh(viewer_user2)
        else:
            print("Viewer user already exists")

        # --- Create Roles ---
        superadmin_role = db.query(models.Role).filter(models.Role.name == "superadmin").first()
        if not superadmin_role:
            superadmin_role = models.Role(name="superadmin", description="Super Administrator", is_platform_level=True)
            db.add(superadmin_role)
            db.commit()
            db.refresh(superadmin_role)
            print(f"Created role: {superadmin_role.name}")
        else:
            print(f"Role '{admin_role.name}' already exists.")

        admin_role = db.query(models.Role).filter(models.Role.name == "admin").first()
        if not admin_role:
            admin_role = models.Role(name="admin", description="Administrator")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
            print(f"Created role: {admin_role.name}")
        else:
            print(f"Role '{admin_role.name}' already exists.")

        editor_role = db.query(models.Role).filter(models.Role.name == "editor").first()
        if not editor_role:
            editor_role = models.Role(name="editor", description="Editor")
            db.add(editor_role)
            db.commit()
            db.refresh(editor_role)
            print(f"Created role: {editor_role.name}")
        else:
            print(f"Role '{editor_role.name}' already exists.")

        viewer_role = db.query(models.Role).filter(models.Role.name == "viewer").first()
        if not viewer_role:
            viewer_role = models.Role(name="viewer", description="Viewer")
            db.add(viewer_role)
            db.commit()
            db.refresh(viewer_role)
            print(f"Created role: {viewer_role.name}")
        else:
            print(f"Role '{viewer_role.name}' already exists.")
        

        # --- Create Permissions ---
        perms_to_create = [
            "create:organizations", "read:organizations", "update:organizations", "delete:organizations",
            "create:users", "read:users", "update:users", "delete:users",
            "create:roles", "read:roles", "update:roles", "delete:roles",
            "create:permissions", "read:permissions", "update:permissions", "delete:permissions",
            "create:items", "read:items", "update:items", "delete:items",
        ]

        created_permissions = {}
        for perm_name in perms_to_create:
            permission = db.query(models.Permission).filter(models.Permission.name == perm_name).first()
            if not permission:
                permission = models.Permission(name=perm_name, description=f"Ability to {perm_name.replace(':', ' ')}")
                db.add(permission)
                db.flush
            else:
                print(f"Permission '{permission.name}' already exists.")

            if "organization" in permission.name.lower():
                permission.is_platform_level = True
                print(f"  Setting '{permission.name}' as platform-level.")
            else:
                permission.is_platform_level = False
            db.commit()
            db.refresh(permission)
            created_permissions[perm_name] = permission

        # --- Assign Permissions to Roles ---
        superadmin_role.permissions.extend([p for p in created_permissions.values() if p not in superadmin_role.permissions])
        admin_role_perms = [
            created_permissions["create:users"], created_permissions["read:users"], created_permissions["update:users"], created_permissions["delete:users"],
            created_permissions["create:roles"], created_permissions["read:roles"], created_permissions["update:roles"], created_permissions["delete:roles"],
            created_permissions["create:permissions"], created_permissions["read:permissions"], created_permissions["update:permissions"], created_permissions["delete:permissions"],
            created_permissions["create:items"], created_permissions["read:items"], created_permissions["update:items"], created_permissions["delete:items"]
        ]
        admin_role.permissions.extend([p for p in admin_role_perms if p not in admin_role.permissions])
        editor_role_perms = [
            created_permissions["create:items"], created_permissions["read:items"], created_permissions["update:items"], created_permissions["delete:items"]
        ]
        editor_role.permissions.extend([p for p in editor_role_perms if p not in editor_role.permissions])
        viewer_role_perms = [
            created_permissions["read:items"]   
        ]
        viewer_role.permissions.extend([p for p in viewer_role_perms if p not in viewer_role.permissions])
        db.commit()

        # --- Assign Roles to Users ---
        superadmin_user.roles.append(superadmin_role)
        admin_user1.roles.append(admin_role)
        admin_user2.roles.append(admin_role)
        editor_user1.roles.append(editor_role)
        editor_user2.roles.append(editor_role)
        viewer_user1.roles.append(viewer_role)
        viewer_user2.roles.append(viewer_role)
        db.commit()

        # --- Create items ---
        item1 = models.Item(name="Item 1", description="Foo", price=50, organization_id=org1_id)
        item2 = models.Item(name="Item 2", description="Foo Foo", price=100, organization_id=org2_id)
        db.add_all([item1, item2])
        db.commit()
        db.refresh(item1)
        db.refresh(item2)
        print(f"Created items")


        print("\nDatabase seeding complete!")

    except Exception as e:
        db.rollback()
        print(f"\nError during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Drop tables
    print("Dropping tables...")
    Base.metadata.drop_all(bind=engine)

    # Create tables
    print("Recreating tables...")
    Base.metadata.create_all(bind=engine)

    # Seed data
    seed_data()

