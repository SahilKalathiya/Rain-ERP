# 🌧️ Rain ERP - Full Stack Architecture (React + Node.js + MySQL)

Enterprise ERP for Raw Material Procurement, Purchase Orders, 3-Level GRN Inward, Quality Control, and Vendor Buffer Management.

---

## 📁 Directory Structure

```text
ERP Rain/
├── backend/                       <-- Node.js + Express + MySQL Server
│   ├── config/
│   │   └── db.js                  (MySQL Connection Pool)
│   ├── controllers/
│   │   ├── authController.js      (Login, Register, JWT Auth)
│   │   └── procurementController.js (PO, GRN, QC, Masters, Rejected Stock)
│   ├── database/
│   │   └── schema.sql             (Complete MySQL Tables & Seed Data)
│   ├── routes/
│   │   ├── authRoutes.js          (/api/auth/login, /api/auth/register)
│   │   └── procurementRoutes.js   (/api/procurement/...)
│   ├── server.js                  (Express API Entry Point - Port 5000)
│   ├── .env                       (Database & Port Configuration)
│   └── package.json
│
├── src/                           <-- React Frontend Application
│   ├── components/
│   │   ├── Auth/                  (AuthPage, AuthModal)
│   │   ├── Profile/               (ProfileSettingsView, Notifications)
│   │   ├── Procurement/           (PO, GRN, QC, RejectedStock, Overview)
│   │   ├── Header/                (Navbar & Profile Dropdown)
│   │   └── Sidebar/               (Navigation)
│   └── App.jsx
│
├── build-client.js
└── package.json
```

---

## 🗄️ MySQL Database Setup (Quick Guide)

### Step 1: Start MySQL
- **Using XAMPP**: Open **XAMPP Control Panel** and click **Start** on **MySQL** and **Apache**.
- **Using MySQL Server**: Ensure MySQL service is running on port `3306`.

### Step 2: Import Schema
1. Open **phpMyAdmin** (`http://localhost/phpmyadmin`) or MySQL Workbench.
2. Click on **SQL** tab or **Import**.
3. Open `backend/database/schema.sql` and run/import it.
4. It will automatically create:
   - Database: `rain_erp_db`
   - Tables: `users`, `vendors`, `fabrics`, `transporters`, `purchase_orders`, `purchase_order_items`, `goods_receipt_notes`, `grn_bales`, `grn_pieces`, `quality_checks`, `rejected_stock_pool`, `audit_logs`.
   - Pre-loaded demo data for users, vendors, fabrics, and transporters.

---

## 🚀 How to Run the Full Stack App

### 1. Run Backend Server (Port 5000):
```bash
cd backend
npm start
```
*Backend runs on `http://localhost:5000/api`*

### 2. Run Frontend Client (Port 3000):
```bash
npm run dev
```
*Frontend runs on `http://localhost:3000/react/dashboard`*
