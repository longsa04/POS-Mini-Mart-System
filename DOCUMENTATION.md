# Mini-Mart POS System — Project Documentation

**Version:** 1.0  
**Last Updated:** April 2026  
**Stack:** Spring Boot 3.5.5 · React 18 · MySQL 8  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Project Structure](#4-project-structure)
5. [Setup & Installation](#5-setup--installation)
6. [Configuration Reference](#6-configuration-reference)
7. [Demo Accounts & Test Credentials](#7-demo-accounts--test-credentials)
8. [Role-Based Access Control (RBAC)](#8-role-based-access-control-rbac)
9. [Feature Guide by Module](#9-feature-guide-by-module)
   - [9.1 Login & Authentication](#91-login--authentication)
   - [9.2 Dashboard](#92-dashboard)
   - [9.3 Point-of-Sale (POS) Checkout](#93-point-of-sale-pos-checkout)
   - [9.4 Inventory Management](#94-inventory-management)
   - [9.5 Purchasing & Suppliers](#95-purchasing--suppliers)
   - [9.6 Expenses (Finance)](#96-expenses-finance)
   - [9.7 Reports](#97-reports)
   - [9.8 People & Users](#98-people--users)
   - [9.9 Settings](#99-settings)
10. [API Reference](#10-api-reference)
11. [Database Schema](#11-database-schema)
12. [Training Guide](#12-training-guide)
13. [Demo Walkthrough Scenarios](#13-demo-walkthrough-scenarios)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Project Overview

Mini-Mart POS System is a full-stack **Point-of-Sale and back-office management** solution designed for small retail stores such as mini-marts and grocery shops.

It provides everything needed to run daily retail operations:

- Cashier checkout with receipt printing
- Inventory tracking with stock alerts
- Purchase orders and supplier management
- Expense tracking and financial reporting
- Profit & Loss reports with date-range filtering
- Role-based access so each user only sees what they need

The system is designed as a **demo-ready** project suitable for presentations and academic submissions.

---

## 2. Technology Stack

### Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | Java | 21 |
| Framework | Spring Boot | 3.5.5 |
| Security | Spring Security + JWT | JJWT 0.11.5 |
| ORM | Spring Data JPA / Hibernate | — |
| Database Driver | MySQL Connector/J | 8.x |
| Build Tool | Maven | 3.9+ |
| Boilerplate Reduction | Lombok | — |
| Server Port | — | **8090** |

### Frontend

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | JavaScript (ES2022) | — |
| UI Library | React | 18.3.1 |
| Build Tool | Vite | 7.1.5 |
| Routing | React Router DOM | 6.26.2 |
| HTTP Client | Axios | 1.7.7 |
| UI Framework | Bootstrap | 5.3.8 |
| PDF Generation | jsPDF + html2canvas | — |
| Printing | react-to-print | 3.0.2 |
| Dev Port | — | **5173** |

### Database

| Component | Technology | Version |
|-----------|-----------|---------|
| RDBMS | MySQL | 8.0+ |
| Schema | 19 tables | — |
| Database Name | `pos` | — |

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Browser (User)                     │
│           React 18 SPA — localhost:5173               │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Pages: Dashboard, POS, Inventory, Reports ...  │ │
│  │  Auth Context → JWT token stored in memory      │ │
│  │  API Layer (api/*.js) → HTTP calls with headers │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────┘
                           │  HTTP/JSON  (port 8090)
                           │  Authorization: Bearer <jwt>
┌──────────────────────────▼───────────────────────────┐
│              Spring Boot REST API                     │
│                  localhost:8090                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │
│  │ Security │ │Controllers│ │ Service + Repository │  │
│  │ (JWT     │ │ 16 REST  │ │ 19 Services          │  │
│  │  Filter) │ │ endpoints│ │ 19 JPA Repos         │  │
│  └──────────┘ └──────────┘ └──────────────────────┘  │
└──────────────────────────┬───────────────────────────┘
                           │  JDBC
┌──────────────────────────▼───────────────────────────┐
│                   MySQL Database                      │
│                  localhost:3306/pos                   │
│          19 tables · pre-seeded demo data             │
└──────────────────────────────────────────────────────┘
```

**Request Flow:**
1. User interacts with a React page
2. React calls the API layer (`api/http.js` attaches the JWT token)
3. Spring Boot verifies the JWT and checks the user's role
4. The controller delegates to the service, which queries the database via JPA
5. JSON response returns to the frontend and is rendered

---

## 4. Project Structure

```
Mini-Mart-System 07/
├── README.md                          # Quick start guide
├── DOCUMENTATION.md                   # This file
├── user and password.txt              # Demo credentials
│
├── Database/
│   ├── pos.sql                        # Main schema (tables + minimal seed data)
│   └── pos-mini-mart.sql             # Extended demo data (recommended for demo)
│
├── cmspos-backend/
│   └── cmspos-backend/
│       ├── pom.xml                    # Maven build configuration
│       └── src/main/java/net/cmspos/cmspos/
│           ├── CmsposBackendApplication.java   # Entry point
│           ├── config/
│           │   └── SecurityConfig.java         # Security + CORS rules
│           ├── controller/                     # 16 REST controllers
│           ├── model/
│           │   ├── dto/                        # Data Transfer Objects
│           │   ├── entity/                     # JPA entities (19 tables)
│           │   └── enums/                      # Enums for status fields
│           ├── repository/                     # Spring Data JPA repos
│           ├── service/                        # Service interfaces
│           │   └── implement/                  # Service implementations
│           └── security/                       # JWT + UserDetails
│               ├── JwtService.java
│               ├── JwtAuthenticationFilter.java
│               └── CustomUserDetailsService.java
│       └── src/main/resources/
│           └── application.properties          # Database + JWT config
│
└── Frontend-MiniMart/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx                   # React entry point
        ├── App.jsx                    # Routes + role guards
        ├── api/                       # One file per backend endpoint
        │   ├── http.js                # Base URL + auth headers
        │   ├── auth.js
        │   ├── products.js
        │   ├── orders.js
        │   ├── expenses.js
        │   ├── reports.js
        │   └── ...
        ├── context/
        │   └── AuthContext.jsx        # Login state + user info
        ├── config/
        │   ├── permissions.js         # Role menus + route guards
        │   └── posConfig.js
        ├── components/
        │   └── DateRangeFilter.jsx    # Reusable date preset filter
        ├── utils/
        │   └── datePresets.js         # Date range calculation helpers
        └── layout/
            ├── AppLayout.jsx          # Sidebar + topbar shell
            ├── menu/
            │   └── Menu.jsx
            └── page/                  # One folder per module
                ├── auth/Login.jsx
                ├── dashboard/Dashboard.jsx
                ├── pos/Pos.jsx
                ├── inventory/
                ├── purchasing/
                ├── finance/Expenses.jsx
                ├── reports/Reports.jsx
                ├── people/
                └── settings/
```

---

## 5. Setup & Installation

### Prerequisites

Install the following before starting:

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 21+ | https://adoptium.net |
| Maven | 3.9+ | (bundled with backend `mvnw` wrapper) |
| Node.js | 18+ | https://nodejs.org |
| MySQL Server | 8.0+ | https://dev.mysql.com/downloads |
| MySQL Workbench | 8.x (optional) | https://dev.mysql.com/downloads/workbench |

---

### Step 1 — Database Setup

1. Open MySQL Workbench (or any MySQL client).

2. Create the database:
   ```sql
   CREATE DATABASE pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. Import the demo data file:
   - Go to **Server → Data Import**
   - Choose **Import from Self-Contained File**
   - Select `Database/pos-mini-mart.sql`
   - Target schema: `pos`
   - Click **Start Import**

   > **Tip:** Use `pos-mini-mart.sql` (not `pos.sql`) for the full demo dataset with realistic orders, expenses, and stock history from Dec 2025 – Apr 2026.

---

### Step 2 — Backend Setup

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd "cmspos-backend/cmspos-backend"
   ```

2. Edit `src/main/resources/application.properties` with your MySQL credentials:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/pos
   spring.datasource.username=root
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   ```

3. Run the backend:
   ```bash
   ./mvnw spring-boot:run
   ```
   On Windows:
   ```bash
   mvnw.cmd spring-boot:run
   ```

4. Wait for the startup message:
   ```
   Started CmsposBackendApplication in X seconds
   ```
   The API is now running at **http://localhost:8090**

---

### Step 3 — Frontend Setup

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd Frontend-MiniMart
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to **http://localhost:5173**

---

### Step 4 — Verify Installation

1. Go to http://localhost:5173
2. You should see the **Login** page
3. Log in with: `admin` / `admin`
4. You should see the **Dashboard** with sales data

If you see the dashboard with charts and numbers, the installation is complete.

---

## 6. Configuration Reference

### Backend — `application.properties`

```properties
# ──── Database ────────────────────────────────────
spring.datasource.url=jdbc:mysql://localhost:3306/pos?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=UTF-8
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD

# ──── JPA / Hibernate ─────────────────────────────
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.hibernate.ddl-auto=update        # auto-creates/updates tables
spring.jpa.show-sql=true                    # prints SQL in console (set false in prod)
spring.jpa.properties.hibernate.format_sql=true

# ──── Server ──────────────────────────────────────
server.port=8090

# ──── Business Logic ──────────────────────────────
pos.tax.rate=0.12                           # 12% tax rate applied to orders

# ──── JWT Security ────────────────────────────────
security.jwt.secret=RHVtbXlKd3RTZWNyZXRLZXlGb3JvTmluZUJhY2tlbmQxMjM0NQ==
security.jwt.expiration-ms=3600000          # 1 hour token expiry
```

### Frontend — API Base URL

Located in `Frontend-MiniMart/src/api/http.js`:
```js
export const API_BASE_URL = "http://localhost:8090";
```

Change this if your backend runs on a different host or port.

---

## 7. Demo Accounts & Test Credentials

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| Admin | `admin` | `admin` | Full access to all features |
| Manager | `manager` | `manager` | Operations, Finance, Reports (no user/system management) |
| Cashier | `cashier` | `cashier` | POS checkout only |

> **Note:** Passwords are stored as BCrypt hashes in the database.

---

## 8. Role-Based Access Control (RBAC)

### What Each Role Can See and Do

| Feature | Admin | Manager | Cashier |
|---------|-------|---------|---------|
| Dashboard | Yes | Yes | No |
| POS Checkout | Yes | Yes | Yes |
| Inventory Overview | Yes | No | No |
| Stock Levels | Yes | No | No |
| Product Catalog | Yes | No | No |
| Categories | Yes | No | No |
| Suppliers | Yes | No | No |
| Purchase Orders | Yes | No | No |
| Employees | Yes | Yes | No |
| Users & Roles | Yes | No | No |
| Expenses | Yes | Yes | No |
| Sales Summary | Yes | Yes | No |
| Profit & Loss | Yes | Yes | No |
| Activity Log | Yes | Yes | No |
| Branch Settings | Yes | No | No |
| Receipt Branding | Yes | No | No |

### How It Works

**Backend (Spring Security):**
Each API endpoint is protected with role annotations in `SecurityConfig.java`. For example:
```java
.requestMatchers(HttpMethod.GET, "/expenses/**").hasAnyRole("ADMIN", "MANAGER")
.requestMatchers(HttpMethod.POST, "/expenses/**").hasAnyRole("ADMIN", "MANAGER")
.requestMatchers(HttpMethod.DELETE, "/expenses/**").hasRole("ADMIN")
```

**Frontend (React Router):**
Routes are wrapped with `withRole()` in `App.jsx`:
```jsx
<Route path="/finance/expenses"
  element={withRole(Expenses, [ROLE.ADMIN, ROLE.MANAGER])} />
```

If a user tries to access an unauthorized URL, they are redirected to the Unauthorized page.

**Navigation Menus:**
The sidebar menu is built dynamically in `permissions.js` — each role sees only the menu items relevant to their role.

---

## 9. Feature Guide by Module

### 9.1 Login & Authentication

**URL:** `/login`  
**All roles**

1. Enter your username and password
2. Click **Login**
3. The system returns a JWT token and stores your user info
4. You are redirected to your role's default page:
   - Admin / Manager → Dashboard (`/`)
   - Cashier → POS (`/pos`)

**Session Duration:** 1 hour. After expiry, you will be redirected back to login.

---

### 9.2 Dashboard

**URL:** `/`  
**Admin, Manager**

The dashboard shows a live snapshot of today's operations at a glance.

**Cards (KPIs):**
- Today's Revenue
- Orders Today
- Pending Payments
- Low Stock Alert count

**Sections:**
- **Sales Trend** — Daily revenue chart for the current period
- **Recent Orders** — Last 10 orders with status
- **Top Products** — Best-selling items by quantity
- **Loyalty Leaders** — Top customers by loyalty points
- **Low Stock Alerts** — Products below the minimum stock threshold

---

### 9.3 Point-of-Sale (POS) Checkout

**URL:** `/pos`  
**Admin, Manager, Cashier**

The POS is designed for speed. The cashier can process a full transaction without a mouse.

**Step-by-Step Checkout:**

1. **Search for a product** — type a name or SKU in the search box
2. **Add to cart** — click a product or press Enter
3. **Adjust quantities** — use the +/- buttons in the cart
4. **Apply discount** — optional, enter discount amount
5. **Select payment method** — Cash, Card, E-Wallet, or Transfer
6. **Enter amount received** — the system calculates change automatically
7. **Submit Order** — click Checkout
8. **Print Receipt** — click Print to generate a PDF receipt

**Receipt contains:**
- Branch name and address
- Order number and date
- Cashier name
- Itemized list with prices
- Subtotal, tax, discount, total
- Payment method and change

---

### 9.4 Inventory Management

**URL:** `/inventory/*`  
**Admin only**

#### Inventory Overview (`/inventory`)
- Shows all products with current stock quantities
- Color-coded low stock alerts
- Filter by category

#### Stock Levels (`/inventory/stock-levels`)
- Stock per product per location
- Minimum stock threshold tracking
- Export or review reorder needs

#### Product Catalog (`/inventory/products`)
- Full list of all products
- Add new products (name, SKU, price, cost price, category)
- Edit or delete existing products
- Link products to suppliers

#### Categories (`/inventory/categories`)
- Create and manage product categories
- 10 default categories: Beverages, Snacks, Household, Personal Care, Frozen Foods, Bakery, Dairy, Produce, Health & Wellness, Electronics & Accessories

---

### 9.5 Purchasing & Suppliers

**URL:** `/purchasing/*`  
**Admin only**

#### Suppliers (`/purchasing/suppliers`)
- Manage supplier records (name, email, phone)
- View products linked to each supplier

#### Purchase Orders (`/purchasing/purchase-orders`)
- Create purchase orders for restocking
- Track order statuses: **OPEN → PARTIAL → RECEIVED**
- Receive stock: entering received quantities automatically updates inventory
- View purchase history per supplier

**Purchase Order Statuses:**
| Status | Meaning |
|--------|---------|
| OPEN | Order created, not yet received |
| PARTIAL | Some items received |
| RECEIVED | All items received, stock updated |
| CANCELLED | Order cancelled |

---

### 9.6 Expenses (Finance)

**URL:** `/finance/expenses`  
**Admin, Manager**

Track all operating costs in one place.

**Expense Categories:**
| Category | Color | Use For |
|----------|-------|---------|
| Utilities | Blue | Electricity, water, internet |
| Supplies | Yellow | Cleaning, packaging materials |
| Rent | Blue (dark) | Monthly rent |
| Salary | Green | Staff wages |
| Other | Gray | Miscellaneous |

**How to Log an Expense:**
1. Click **Log Expense**
2. Enter description (e.g., "Monthly electricity bill")
3. Enter amount
4. Select category
5. Select date & time (defaults to now if left blank)
6. Click **Save Expense**

**Filtering:**
- Use the **Date Range Filter** to view expenses by period
- Preset buttons: Yesterday, Last 7 Days, This Week, Last Week, This Month, Last Month, This Year
- Or pick custom start and end dates

**Category Summary:**
- Colored pill badges show the total per category for the selected period
- Grand total shown below the date filter

**Delete Expense:**
- Only **Admin** can delete expenses
- Manager can view and create but not delete

---

### 9.7 Reports

**URL:** `/reports/*`  
**Admin, Manager**

#### Sales Summary
Provides a snapshot of overall sales performance.

**Includes:**
- Total revenue and order count
- Revenue by payment method breakdown
- Category sales mix
- Top selling products
- Purchases by supplier

#### Profit & Loss Report

Shows financial performance over a date range.

**How to Use:**
1. Select a date range using the preset buttons or custom dates
2. Select a location (or All Locations)
3. The report automatically refreshes

**Report Sections:**
- **Revenue** — Total sales from orders
- **Cost of Goods Sold (COGS)** — Cost price × quantity sold
- **Gross Profit** — Revenue minus COGS
- **Operating Expenses** — Sum of logged expenses in the period
- **Net Profit / Net Loss** — Gross Profit minus Expenses
- **Product Breakdown** — Per-product revenue, cost, and profit

**Date Range Presets (available on P&L and Expenses):**

| Preset | Description |
|--------|-------------|
| Yesterday | Previous calendar day |
| Last 7 Days | Rolling 7-day window ending today |
| This Week | Monday to today (current week) |
| Last Week | Monday–Sunday of last week |
| This Month | 1st of current month to today |
| Last Month | Full previous calendar month |
| This Year | January 1st to today |

#### Activity Log

Shows a chronological audit trail of all system actions.

- Auto-refreshes every 10 seconds
- Shows: date/time, user, role, action description
- Useful for reviewing who did what and when

---

### 9.8 People & Users

**URL:** `/people/*`

#### Employees (`/people/employees`)
**Admin, Manager**  
- View and manage employee records
- Assign employees to locations

#### Users & Roles (`/people/users`)
**Admin only**  
- Create new system user accounts
- Assign roles: ADMIN, MANAGER, CASHIER
- Reset passwords
- Link users to a branch location

---

### 9.9 Settings

**URL:** `/settings/*`  
**Admin only**

#### Branch Details (`/settings/branch`)
- Edit the store name and address
- This information appears on printed receipts

#### Receipt Branding (`/settings/receipts`)
- Customize the receipt header and footer text
- Upload a logo for printed receipts

---

## 10. API Reference

The backend runs at `http://localhost:8090`. All endpoints (except login) require a `Bearer` token in the `Authorization` header.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Log in, returns JWT token |

**Login Request:**
```json
POST /auth/login
{
  "username": "admin",
  "password": "admin"
}
```

**Login Response:**
```json
{
  "token": "eyJhbGc...",
  "userId": 1,
  "username": "admin",
  "role": "ADMIN",
  "locationId": 1
}
```

---

### Core Endpoints Summary

| Module | Method | Endpoint | Roles |
|--------|--------|----------|-------|
| Products | GET | `/products` | ADMIN, MANAGER, CASHIER |
| Products | POST/PUT/DELETE | `/products/**` | ADMIN |
| Categories | GET | `/categories` | ADMIN, MANAGER |
| Categories | POST/DELETE | `/categories/**` | ADMIN |
| Suppliers | GET | `/suppliers` | ADMIN, MANAGER, CASHIER |
| Suppliers | POST/PUT/DELETE | `/suppliers/**` | ADMIN |
| Purchase Orders | ALL | `/purchase-orders/**` | ADMIN |
| Orders | GET/POST | `/orders/**` | ADMIN, MANAGER, CASHIER |
| Orders | PATCH | `/orders/**` | ADMIN, MANAGER |
| Orders | DELETE | `/orders/**` | ADMIN |
| Expenses | GET/POST | `/expenses/**` | ADMIN, MANAGER |
| Expenses | DELETE | `/expenses/**` | ADMIN |
| Inventory | GET | `/inventory/**` | ADMIN, MANAGER |
| Reports | ALL | `/reports/**` | ADMIN, MANAGER |
| Users | ALL | `/users/**` | ADMIN, MANAGER |
| Activity Logs | GET | `/activity-logs/**` | ADMIN, MANAGER |
| Cash Registers | GET | `/cash-registers/**` | ADMIN, MANAGER |

---

### Expense Endpoints

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/expenses` | `start=YYYY-MM-DD`, `end=YYYY-MM-DD`, `locationId` | List expenses |
| POST | `/expenses` | — | Create expense |
| DELETE | `/expenses/{id}` | — | Delete expense (Admin only) |

**Create Expense Request Body:**
```json
{
  "locationId": 1,
  "userId": 1,
  "description": "Monthly electricity bill",
  "amount": 52.00,
  "category": "UTILITIES",
  "expenseDate": "2026-04-01T10:30:00"
}
```

### Report Endpoints

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/reports/profit-loss` | `startDate`, `endDate`, `locationId` | Profit & Loss report |
| GET | `/reports/sales-summary` | `locationId` | Live sales summary |
| GET | `/reports/dashboard` | `locationId` | Dashboard KPIs |

---

## 11. Database Schema

### Entity Relationship Overview

```
location ─── user ─── orders ─── order_detail ─── product ─── category
   │           │          │                           │
   │           │          └─── payment            product_supplier
   │           │                                      │
   │           └─── expense                        supplier ─── purchase_order
   │           └─── cash_register                             └── purchase_order_detail
   │
   └─── stock ─── stock_batch
         │
         └─── stock_movement
```

### Table Summary

| Table | Rows (Demo) | Purpose |
|-------|-------------|---------|
| `location` | 3 | Store branches |
| `user` | 3 | System accounts |
| `category` | 10 | Product groupings |
| `product` | 17 | Retail products with cost/price |
| `supplier` | 2 | Vendors/distributors |
| `product_supplier` | 17 | Product-supplier links |
| `customer` | 6 | Loyalty customers |
| `orders` | 62 | Sales transactions |
| `order_detail` | ~150 | Line items per order |
| `payment` | 62 | Payment records |
| `purchase_order` | 10 | Restocking orders |
| `purchase_order_detail` | ~30 | PO line items |
| `stock` | 17 | Current inventory per location |
| `stock_batch` | 20+ | Expiry-tracked batches |
| `stock_movement` | 213 | Full inventory audit trail |
| `expense` | 6 | Operating expenses |
| `tax` | 1 | Tax rate config (12%) |
| `cash_register` | — | Shift registers |
| `activity_log` | — | User action audit trail |

### Key Enums

**UserRole:** `ADMIN`, `MANAGER`, `CASHIER`

**ExpenseCategory:** `UTILITIES`, `SUPPLIES`, `RENT`, `SALARY`, `OTHER`

**PurchaseOrderStatus:** `OPEN`, `PARTIAL`, `RECEIVED`, `CANCELLED`

**PaymentMethod:** `CASH`, `CARD`, `EWALLET`, `TRANSFER`

**PaymentStatus:** `PENDING`, `PAID`, `CANCELLED`

**StockMovementType:** `INBOUND`, `OUTBOUND`, `ADJUSTMENT`

**Shift:** `MORNING`, `AFTERNOON`, `EVENING`

---

## 12. Training Guide

This section explains how to train staff or demo the system to stakeholders.

---

### Training: Cashier Role

**Goal:** Process a sale end-to-end

**Estimated Time:** 15 minutes

**Steps:**

1. Log in as `cashier` / `cashier`
2. You land directly on the POS screen
3. Search for "Water" in the product search box
4. Click on "Mineral Water" to add it to the cart
5. Search and add one more product (e.g., "Bread")
6. In the cart, change the water quantity to 3
7. Select payment method: **Cash**
8. Enter received amount: e.g., 20.00
9. Observe the change calculation at the bottom
10. Click **Checkout** / **Submit Order**
11. A receipt dialog appears — click **Print** to generate the PDF
12. The order is recorded and stock is automatically deducted

**Key Points to Teach:**
- SKU search: type the exact product code for faster lookup
- Discounts: enter a dollar amount (not percentage) in the discount field
- If a product is out of stock, it cannot be added to the cart
- The receipt PDF includes the branch name, cashier name, and tax breakdown

---

### Training: Manager Role

**Goal:** Review financials and manage expenses

**Estimated Time:** 20 minutes

**Steps:**

1. Log in as `manager` / `manager`
2. Review the **Dashboard** — note the revenue card and pending orders
3. Navigate to **Finance → Expenses**
4. Use the **This Month** preset to see current month expenses
5. Click **Log Expense** and add:
   - Description: "Internet Bill"
   - Amount: 45.00
   - Category: Utilities
   - Date: today
6. Save and confirm it appears in the table
7. Navigate to **Reports → Profit & Loss**
8. Select **This Month** preset
9. Review Revenue, COGS, Gross Profit, Expenses, Net Profit
10. Navigate to **Reports → Activity Log** and see the expense you just logged

**Key Points to Teach:**
- Managers can log expenses but cannot delete them (Admin only)
- The P&L date range can be filtered with preset buttons for quick analysis
- The Sales Summary shows a live snapshot — it does not filter by date

---

### Training: Admin Role

**Goal:** Full system management walkthrough

**Estimated Time:** 45 minutes

**Sections:**

**A. Inventory Management**
1. Log in as `admin` / `admin`
2. Go to **Inventory → Product Catalog**
3. Add a new product:
   - Name: "Test Chips"
   - Price: 1.50
   - Cost Price: 0.80
   - Category: Snacks
4. Go to **Inventory → Stock Levels** and find the new product
5. Adjust stock using the Adjustment feature

**B. Purchasing**
1. Go to **Purchasing → Suppliers** — review existing suppliers
2. Go to **Purchasing → Purchase Orders**
3. Create a new PO for a supplier
4. Add line items (products and quantities)
5. Save as OPEN status
6. Click Receive — enter received quantities
7. Status changes to RECEIVED and stock is updated

**C. User Management**
1. Go to **People → Users & Roles**
2. Create a new user:
   - Username: "cashier2"
   - Password: set a password
   - Role: CASHIER
   - Location: Branch 1
3. Log out and log in as "cashier2" to verify access

**D. Reporting**
1. Go to **Reports → Profit & Loss**
2. Select **Last Month** preset
3. Review the full financial breakdown
4. Export or screenshot for presentation
5. Go to **Reports → Activity Log** — review the audit trail

**E. Settings**
1. Go to **Settings → Branch Details**
2. Update the store name
3. Go to **Settings → Receipt Branding**
4. Add a footer message
5. Process a sale in POS and print a receipt to see the change

---

## 13. Demo Walkthrough Scenarios

Use these scenarios for a structured live demo to stakeholders or evaluators.

---

### Scenario 1: End-to-End Sale (5 minutes)

**Story:** A customer buys snacks and pays with cash.

1. Log in as `cashier`
2. Add "Potato Chips" (qty: 2) and "Mineral Water" (qty: 1) to cart
3. Select Cash payment, enter $10.00 received
4. Submit — show the change calculation
5. Print receipt PDF — point out branch name, tax, cashier ID

**Highlights:** Speed of checkout, auto stock deduction, printable receipt

---

### Scenario 2: Stock Management (5 minutes)

**Story:** Admin reviews low stock and creates a purchase order.

1. Log in as `admin`
2. Go to Dashboard — show the Low Stock Alerts widget
3. Go to Inventory → Stock Levels — highlight low items
4. Go to Purchasing → Purchase Orders → Create New PO
5. Select supplier, add restocking items
6. Save and receive the PO — show stock level updated

**Highlights:** Integrated inventory tracking, PO to stock flow

---

### Scenario 3: Financial Overview (5 minutes)

**Story:** Manager reviews this month's performance.

1. Log in as `manager`
2. Go to Finance → Expenses → select "This Month"
3. Show category breakdown (Utilities, Supplies totals)
4. Go to Reports → Profit & Loss → select "This Month"
5. Walk through: Revenue → COGS → Gross Profit → Expenses → Net Profit
6. Click "Last Month" to compare

**Highlights:** Date preset filter, P&L breakdown, expense integration

---

### Scenario 4: Role-Based Access (3 minutes)

**Story:** Demonstrating the security model.

1. Log in as `cashier` — show only POS in the menu
2. Try to navigate to `/inventory` — show Unauthorized page
3. Log out, log in as `manager` — show broader menu
4. Note that Users & Roles is not visible
5. Log out, log in as `admin` — show full access

**Highlights:** RBAC, JWT security, role-appropriate UI

---

## 14. Troubleshooting

### Backend won't start

**Problem:** Error on `mvnw spring-boot:run`

**Check:**
1. Java 21 is installed: `java -version`
2. MySQL is running: check MySQL service in Windows Services or `mysql -u root -p`
3. Database credentials in `application.properties` are correct
4. Port 8090 is not already in use: `netstat -an | findstr 8090`

---

### Frontend shows "Network Error" or blank page

**Problem:** API calls fail

**Check:**
1. Backend is running on port 8090
2. Open http://localhost:8090/auth/login in browser — should return a 405 (Method Not Allowed, which is correct)
3. Check browser console for CORS errors
4. Verify `API_BASE_URL` in `Frontend-MiniMart/src/api/http.js` is `http://localhost:8090`

---

### Login fails with "Invalid credentials"

**Check:**
1. Using correct username/password from the Demo Accounts table
2. Database was imported from `pos-mini-mart.sql` (not the empty schema)
3. Users table is not empty: `SELECT * FROM pos.user;`

---

### Manager gets 403 Forbidden on Expenses

**Problem:** Manager sees "Failed to load expenses (status 403)"

**Cause:** A previous version of `SecurityConfig.java` blocked Manager from expense endpoints.

**Fix:** Verify `SecurityConfig.java` has these rules (not a blanket ADMIN-only rule):
```java
.requestMatchers(HttpMethod.GET, "/expenses/**").hasAnyRole("ADMIN", "MANAGER")
.requestMatchers(HttpMethod.POST, "/expenses/**").hasAnyRole("ADMIN", "MANAGER")
.requestMatchers(HttpMethod.DELETE, "/expenses/**").hasRole("ADMIN")
```
After editing, **restart the Spring Boot backend**.

---

### Receipt PDF is blank or not printing

**Check:**
1. Browser is allowing pop-ups for localhost:5173
2. The order was successfully submitted (check Orders page)
3. Try a different browser (Chrome recommended)

---

### Stock not updating after a sale

**Check:**
1. Order status is PAID (not PENDING)
2. The product has a stock record for that location (`SELECT * FROM stock WHERE product_id = X`)
3. Check `stock_movement` table for the OUTBOUND record

---

### Date presets not showing or not working

**Check:**
1. `Frontend-MiniMart/src/utils/datePresets.js` exists
2. `Frontend-MiniMart/src/components/DateRangeFilter.jsx` exists
3. The page imports `DateRangeFilter` correctly
4. Browser console shows no import errors

---

*End of Documentation*
