# Raindrop Garments ERP

> **Modern Garment Manufacturing, Apparel Production, Sourcing, Raw Material Procurement & Fabric Job Work Processing ERP**

Welcome to the **Raindrop Garments ERP** repository. This enterprise application is built with a high-performance React frontend, Bootstrap 5 + Tailwind-inspired design tokens, ESBuild bundler, and an integrated Node.js server.

---

## ⚡ Quick Start

### 1. Start the Server
Run the local Node.js server (serves the SPA and watches for source changes):
```bash
npm start
# or
node server.js
```

### 2. Access the Application
Open your browser and navigate to:
```
http://localhost:3000/react/dashboard
```

### 3. Rebuild Client Bundle (Mandatory After Editing Code)
Whenever any file in `frontend/src/` is created or modified:
```bash
node build-client.js
```
> **⚠️ CRITICAL FOR AI AGENTS & DEVELOPERS:**  
> The browser loads the production bundle at `Rain ERP/preclinic.dreamstechnologies.com/react/assets/index-DX-E0Odo.js`. If you edit files under `frontend/src/` without executing `node build-client.js`, your code changes **will not appear** in the browser!

---

## 🧭 System Architecture & Core Modules

The ERP covers the complete lifecycle of apparel manufacturing:

| Module | Primary Component | Primary Routes | Storage Key |
| :--- | :--- | :--- | :--- |
| **Global ERP Overview** | `GlobalERPOverviewDashboard.jsx` | `/erp-overview`, `/react/dashboard` | Aggregated from all modules |
| **Garment Sales Orders** | `OrdersModule.jsx`, `OrderCreationWizard.jsx`, `OrderDetailView.jsx` | `/sales-orders`, `/sales-orders/new` | `erp_sales_orders_v1` |
| **Raw Material Procurement** | `ProcurementDashboard.jsx`, `PurchaseOrderForm.jsx`, `GRNForm.jsx` | `/procurement`, `/goods-inward`, `/qc-inspection` | `raindrop_pos_v1`, `raindrop_grns_v1`, `raindrop_stock_pool_v1` |
| **Process PO (Job Work)** | `ProcessModule.jsx`, `ProcessPOForm.jsx`, `ProcessChallanForm.jsx` | `/process-orders`, `/process-challans` | `erp_process_pos_v1`, `erp_process_challans_v1` |
| **Cutting & Lay Planning** | `CuttingModule.jsx` | `/cutting-orders` | `erp_cutting_orders_v1` |
| **Garment Production** | `ProductionModule.jsx` (Embroidery, Stitching, Single Cuts) | `/production-embroidery`, `/production-stitching` | `erp_embroidery_pos_v1`, `erp_stitching_jobs_v1` |
| **Master Catalogs** | `FabricMasterView.jsx`, `ColorMasterView.jsx`, `VendorMasterView.jsx` | `/masters` | `raindrop_fabrics_v1`, `raindrop_colors_v1`, `raindrop_vendors_v1` |

---

## 🎨 Complete Design System & Developer Documentation

For an exhaustive, step-by-step technical guide covering:
- **Design System & Visual Tokens** (Brand colors, button hierarchy, typography scale, inputs, badges, modals, tables)
- **Detailed Component Reference** (Props, state, and routing for every module)
- **Business Logic & Industry Rules** (FIFO stock allocation, L98 vs L100 folding, Single Batch Rule, Than/Bale calculations)
- **AI Agent Guidelines** (How to make clean edits, handle state persistence, and avoid breaking changes)

👉 **Please refer to the detailed technical documentation: [README_REACT_CODE.md](README_REACT_CODE.md)**

---

## 🛠️ Tech Stack
- **Frontend Framework**: React 18 (JSX, Functional Components, Hooks)
- **Styling**: Bootstrap 5 + Custom Theme Overrides (`frontend/src/styles/theme-override.css`)
- **Iconography**: Tabler Icons (`ti ti-*`)
- **Bundler**: ESBuild (configured in `build-client.js`)
- **Backend / Mock Server**: Node.js HTTP server (`server.js`) with MySQL sync API layer (`frontend/src/services/api.js`)
- **State Persistence**: Browser `localStorage` with offline resilience

---

## 📄 License & Proprietary Notice
© Raindrop Garments. All rights reserved. Proprietary software for garment factory production management.
