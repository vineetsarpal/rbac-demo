# RBAC Starter Kit

A modern, full-stack starter kit for **Role-Based Access Control (RBAC)** using **FastAPI** (Python), **React** (TypeScript), and **PostgreSQL**

## Features

* **Multi-tenant** (organization-level data isolation)
* **Granular permissions**
* **Secure JWT authentication**
* **FastAPI REST API** with SQLAlchemy ORM
* **React frontend** (Chakra UI, TanStack Router, React Query)
* **Example seed script** for quick setup
* **API documentation** with Swagger UI
* **Ready for extension and customization**


## Get Started

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/vineetsarpal/rbac-starterkit
    ```

### Backend

1.  **Install dependencies:**
    ```bash
    cd rbac-starterkit/backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
2.  **Set up Postgres:**
    * Create a Postgres instance and get its connection URL
3.  **Configure environment:**
    * Create a `.env` file (see `.env.example`). Set your secrets and DB connection URL
4.  **Seed data:**
    ```bash
    python3 scripts/seed_reset_db.py
    ```
5.  **Start API:**
    ```bash
    fastapi dev src/main.py
    ```

### Frontend

1.  **Install dependencies:**
    ```bash
    cd ../frontend
    npm install
    ```
2.  **Start App:**
    ```bash
    npm run dev
    ```

### Access

* **API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Frontend App:** [http://localhost:5173](http://localhost:5173)


## Test Users (Created by Seed Script)

| Role          | Username        | Password   | Description                       |
| :------------ | :-------------- | :--------- | :-------------------------------- |
| Superadmin    | \superadmin     | superadmin | Full system access                |
| Acme Admin    | acme\admin      | admin      | Admin access for Acme org         |
| Acme Editor   | acme\editor     | editor     | Edit access for Acme org          |
| Acme Viewer   | acme\viewer     | viewer     | View access for Acme org          |
| FooBar Admin  | foobar\admin    | admin      | Admin access for FooBar org       |
| FooBar Editor | foobar\editor   | editor     | Edit access for FooBar org        |
| FooBar Viewer | foobar\viewer   | viewer     | View access for FooBar org        |


## Role & Permission Highlights

* **Organization Isolation:** Users only access data within their organization. Superadmin sees all
* **Default Capabilities:**
    * **Admin:** Full org access, manage users/roles/permissions.
    * **Editor:** Create/edit/delete items
    * **Viewer:** View items
* **Configurable Permissions:** Easily customize permissions like `create:users`, `read:items`, etc.


## Scope & Use Cases

This kit is perfect for **prototyping, MVPs, and small to medium-sized applications** that need integrated RBAC. It's a hands-on example of building robust access control

For **enterprise-grade applications** needing vast scale, strict compliance, or advanced features (like comprehensive MFA/SSO across many services), consider specialized external Identity and Access Management (IAM) solutions


## Best Practices

* **Centralize permissions:** Avoid scattered checks
* **Meaningful roles:** Prevent "role explosion"
* **Seed scripts are key:** Great for demos and onboarding
* **Backend rules:** Never trust frontend permissions alone