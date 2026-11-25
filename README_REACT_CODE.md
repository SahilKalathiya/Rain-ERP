# Raindrop Garments ERP - React Architecture & Design System Guide

> **Official Comprehensive Engineering Guide & Design Specifications**  
> *Target Audience: Developers, Software Engineers, and AI Agents working on the Raindrop Garments ERP codebase.*

---

## 📑 Table of Contents
1. [Project Overview & Domain Context](#1-project-overview--domain-context)
2. [Directory Structure & Architecture](#2-directory-structure--architecture)
3. [Design System & UI Guidelines (From Buttons to Colors)](#3-design-system--ui-guidelines)
   - [3.1 Color Palette & Tokens](#31-color-palette--tokens)
   - [3.2 Button System & Styling Hierarchy](#32-button-system--styling-hierarchy)
   - [3.3 Typography & Sizing Scale](#33-typography--sizing-scale)
   - [3.4 Form Inputs, Dropdowns & Portals](#34-form-inputs-dropdowns--portals)
   - [3.5 Tables, Data Grids & Sub-Tables](#35-tables-data-grids--sub-tables)
   - [3.6 Badges, Status Pills & KPI Cards](#36-badges-status-pills--kpi-cards)
   - [3.7 Modals & Expandable Drawers](#37-modals--expandable-drawers)
4. [Functional Modules & Business Logic](#4-functional-modules--business-logic)
   - [4.1 Global ERP Overview & Analytics](#41-global-erp-overview--analytics)
   - [4.2 Garment Sales Orders & Merchandise Planning](#42-garment-sales-orders--merchandise-planning)
   - [4.3 Raw Material Procurement & Inward GRN](#43-raw-material-procurement--inward-grn)
   - [4.4 Process PO & Job Work Challan (Dyeing / Processing)](#44-process-po--job-work-challan)
   - [4.5 Cutting Orders & Lay Planning](#45-cutting-orders--lay-planning)
   - [4.6 Garment Production & Tailoring Outwork](#46-garment-production--tailoring-outwork)
   - [4.7 Master Catalogs](#47-master-catalogs)
5. [State Management & Storage Keys Reference](#5-state-management--storage-keys-reference)
6. [Essential Rules for AI Agents & Developers](#6-essential-rules-for-ai-agents--developers)
7. [Build & Verification Procedures](#7-build--verification-procedures)

---

## 1. Project Overview & Domain Context

**Raindrop Garments ERP** is a full-featured apparel production and manufacturing management platform. The textile manufacturing pipeline is highly specific and follows a strict workflow:

```
[Customer Sales Order] 
       │
       ▼
[Fabric & Accessories Requirement Computation]
       │
       ▼
[Raw Material Procurement PO] ──► [Goods Inward GRN] ──► [Quality Check (QC)] ──► [Warehouse Stock Pool]
       │                                                                                    │
       ▼                                                                                    ▼
[Process PO for Job Work (Dyeing/Printing)] ◄───────────────────────────────────────────────┘
       │
       ▼
[Job Work Dispatch Challan (Bales & Thans Allocation)] ──► [Process Return (Dyed Inward)]
       │
       ▼
[Cutting Order & Lay Planning (Plies & Ratios)]
       │
       ▼
[Production Outwork] ──► [Embroidery After Cut] ──► [Stitching Jobs] ──► [Single Cut Rework]
       │
       ▼
[Final QC & Shipment / Packing]
```

### Domain Terminology Rules:
- **Bale**: A large packaged bundle of fabric (e.g., 500m to 5,000m).
- **Than / Piece**: An individual continuous length or cut of fabric inside a bale (typically 100 meters, 90 meters, or remainder). **Never use the word "Roll"**; the textile industry uses **"Bale"** and **"Than"** (તાકો).
- **Greige / Raw Fabric**: Unprocessed loom-state fabric requiring dyeing or bleaching.
- **Process Fabric**: Finished, dyed, printed, or washed fabric ready for cutting.
- **Folding (L100 vs L98)**: Length calibration notation. `L100` = 100% nominal length. `L98` = 98% nominal length (e.g., a 100m nominal than delivers 98.00m actual yield).
- **Single Batch Rule**: A critical manufacturing constraint. Never mix different invoice/lot batches of grey fabric into the same dyeing challan to avoid visible shade variations.

---

## 2. Directory Structure & Architecture

```
ERP Rain/
├── frontend/
│   └── src/
│       ├── App.jsx                     # Master application shell, router, and global layouts
│       ├── main.jsx                    # React 18 DOM mount entrypoint
│       │
│       ├── components/
│       │   ├── ActivityLog/            # System audit logs and change tracking
│       │   ├── Auth/                   # Authentication forms and user login modals
│       │   ├── Cutting/                # Lay planning, cutting orders, plies & markers
│       │   ├── Header/                 # Top navigation bar, universal search, alert badges
│       │   ├── Masters/                # Catalogs: Fabrics, Colors, Vendors, Accessories, Sizes
│       │   ├── Orders/                 # Garment Sales Orders, Creation Wizard, Requirement Matrix
│       │   ├── ProcessPO/              # Process POs, Job Work Challans, Warehouse Stock Picker
│       │   ├── Procurement/            # Raw Material POs, Goods Inward GRNs, QC inspections
│       │   ├── Production/             # Post-cut Embroidery, Tailoring Stitching, Single Cuts
│       │   ├── Profile/                # User profile and system settings
│       │   └── Sidebar/                # Left-side collapsible navigation hierarchy
│       │
│       ├── data/                       # Initial data masters, seed datasets, and schema models
│       ├── services/                   # API client (api.js) communicating with MySQL backend
│       ├── styles/                     # theme-override.css (High-contrast design tokens)
│       └── utils/                      # Calculations, FIFO allocators, vendor helpers
│
├── build-client.js                     # ESBuild bundling script (Builds to react/assets/bundle.js)
├── server.js                           # Node.js local server with live-rebuild file watcher
└── README_REACT_CODE.md                # This comprehensive engineering manual
```

---

## 3. Design System & UI Guidelines

The design system is heavily optimized for **high contrast, crisp readability, and dense ERP workflows**. All components follow strict UI consistency standards.

### 3.1 Color Palette & Tokens

| Token Name | Hex Code | Role & Usage |
| :--- | :--- | :--- |
| **Brand Primary** | `#4f46e5` (Indigo 600) | Main action buttons, active navigation links, brand accents |
| **Primary Hover** | `#4338ca` (Indigo 700) | Hover state for primary buttons and active indicators |
| **Primary Subtle** | `#eef2ff` (Indigo 50) | Sub-table headers, selected table rows, subtle badges |
| **Primary Border** | `#c7d2fe` (Indigo 200) | Accent borders for active cards and focused containers |
| **Sky / Info** | `#0284c7` (Sky 600) | PO badges, informational indicators, link texts |
| **Sky Subtle** | `#e0f2fe` (Sky 100) | Background for PO badges and metadata tags |
| **Success** | `#10b981` (Emerald 500) | Dispatched meters, available stock, save & inward actions |
| **Success Dark** | `#059669` (Emerald 600) | Text color for positive balances and 100% fulfilled states |
| **Success Subtle** | `#d1fae5` (Emerald 100) | "In Stock", "Completed", "Approved" badge backgrounds |
| **Warning** | `#f59e0b` (Amber 500) | Pending meters, auto-fulfill action triggers, cut notices |
| **Warning Dark** | `#d97706` (Amber 600) | Warning borders, pending alert text |
| **Warning Subtle** | `#fef3c7` (Amber 100) | Warning badges, partial allocation alerts |
| **Danger** | `#ef4444` (Rose 500) | Delete buttons, rejected stock, emergency challan notices |
| **Danger Dark** | `#dc2626` (Rose 600) | High alert indicators, locked states, validation errors |
| **Danger Subtle** | `#fee2e2` (Rose 100) | "Rejected", "Pending PO Link", "Cancelled" badges |
| **Dark Text** | `#0f172a` (Slate 900) | Primary headings, table text, input labels, metric values |
| **Secondary Text**| `#475569` (Slate 600) | Field labels, subheadings, descriptive captions |
| **Muted Text** | `#64748b` (Slate 500) | Timestamps, invoice refs, inactive placeholders |
| **Border Slate** | `#e2e8f0` (Slate 200) | Default card borders, divider lines, table grid lines |
| **Input Border** | `#cbd5e1` (Slate 300) | Default form input and select element borders |
| **Background** | `#f8fafc` (Slate 50) | Page background, modal body background, table thead |
| **Surface** | `#ffffff` (Pure White) | Card containers, modal panels, table row background |

---

### 3.2 Button System & Styling Hierarchy

Buttons must clearly communicate intent. Never place duplicate or conflicting action buttons in the same view.

```jsx
/* 1. Primary Action Button */
<button className="btn btn-primary btn-sm px-3 shadow-xs fw-semibold d-flex align-items-center gap-1.5">
  <i className="ti ti-plus fs-14"></i>
  <span>Create Process PO</span>
</button>

/* 2. Success / Save / Inward Button */
<button className="btn btn-success btn-sm px-3 shadow-xs fw-bold d-flex align-items-center gap-1.5">
  <i className="ti ti-check fs-14"></i>
  <span>Record Inward GRN</span>
</button>

/* 3. Warning / Auto-Fulfill Button */
<button className="btn btn-warning btn-sm px-3 shadow-xs fw-bold d-flex align-items-center gap-1.5">
  <i className="ti ti-bolt fs-14"></i>
  <span>Auto-Fulfill (600m)</span>
</button>

/* 4. Secondary / Outline Button */
<button className="btn btn-outline-primary btn-sm px-2.5 rounded fw-semibold">
  <span>View Details</span>
</button>

/* 5. Compact Table Action Button (btn-xs) */
<button className="btn btn-outline-primary btn-xs py-0.5 px-2 rounded fs-11 fw-semibold">
  + Allocate Than
</button>

/* 6. Cancel / Light Action Button */
<button className="btn btn-light border btn-sm px-3 text-secondary">
  Cancel
</button>

/* 7. Destructive / Delete Button */
<button className="btn btn-outline-danger btn-xs py-1 px-2 rounded">
  <i className="ti ti-trash"></i>
</button>
```

#### Button Size Standards:
- **Standard Action**: `btn-sm` (height: `36px` to `38px`, font size: `13px`).
- **Inline Table Action**: `btn-xs` or `btn-sm py-0.5 px-2` (height: `24px` to `28px`, font size: `11px`).
- **Primary Modal Footer**: `btn-sm px-3.5 py-1.5` (height: `38px`, font size: `13px`, font-weight `600`).

---

### 3.3 Typography & Sizing Scale

The application uses **Inter** as the primary font family and standard system monospace for identifiers, quantities, and meters.

- **Headings (`h1` - `h6`)**: Font weight `700`, color `#0f172a`, letter-spacing `-0.02em`.
- **Card Subtitles**: Font size `11px` to `12px`, font weight `500`, color `#64748b`.
- **Numeric / Metric Data**: Always pair with `font-monospace` and `fw-bold` for rapid scanning.
- **Font Classes**:
  - `fs-10`: `11px` (micro badges, tags)
  - `fs-11`: `12px` (table headers, helper notes)
  - `fs-12`: `13px` (table cell standard text)
  - `fs-13`: `13.5px` (form inputs, default UI)
  - `fs-14`: `14.5px` (card titles, primary buttons)
  - `fs-16`: `16.5px` (summary totals, modal headers)
  - `fs-20`: `20px` (dashboard KPI values)

---

### 3.4 Form Inputs, Dropdowns & Portals

Form controls must have clean borders, proper padding, and high contrast:
- **Border**: `1px solid #cbd5e1`, border radius `6px` or `8px`.
- **Focus Ring**: Border color `#6366f1`, box-shadow `0 0 0 3px rgba(99, 102, 241, 0.15)`.
- **Height**: Standard inputs use `height: 38px`. Compact table inputs use `height: 28px` to `30px`.
- **Required Star**: Always render `<span className="text-danger">*</span>`.

#### Dropdown Clipping Prevention (CRITICAL):
When rendering dropdowns inside tables or scrollable containers, standard `overflow: hidden` will clip the dropdown menu. Always implement custom comboboxes with **React Portals** (`createPortal`) targeting `document.body` with fixed coordinate calculation:
```jsx
createPortal(
  <div 
    style={{
      position: 'fixed',
      top: coords.openUp ? 'auto' : `${coords.top}px`,
      bottom: coords.openUp ? `${coords.bottom}px` : 'auto',
      left: `${coords.left}px`,
      width: `${coords.width}px`,
      zIndex: 999999
    }}
  >
    {/* Dropdown Options */}
  </div>,
  document.body
);
```

---

### 3.5 Tables, Data Grids & Sub-Tables

1. **Table Header (`thead`)**:
   - Background `#f8fafc`.
   - Text uppercase, `fs-11`, `fw-bold`, color `#475569`.
   - Divider `1px solid #e2e8f0`.
2. **Alignment Rules**:
   - Text & Descriptions: **Left-aligned**.
   - Status, Codes, & Folding: **Center-aligned**.
   - Meters, Quantities, Rates, & Totals: **Right-aligned** (`text-end font-monospace`).
3. **Sub-Tables (Replacing Clunky Cards)**:
   - When expanding items (such as individual thans inside a bale, or size matrices in cutting), **never render oversized grid cards**.
   - Render a compact, clean **ERP Sub-Table** directly underneath the parent row with Checkbox, Item No, Length/Qty, Status, and Action buttons.

---

### 3.6 Badges, Status Pills & KPI Cards

Status badges use high-contrast subtle fills with dark matching text:

```jsx
/* In Stock / Completed / Approved */
<span className="badge bg-success-subtle text-success border border-success-subtle fs-11">
  In Stock
</span>

/* Pending / Warning / Partial */
<span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fs-11">
  Pending (250m)
</span>

/* Rejected / Emergency / Error */
<span className="badge bg-danger-subtle text-danger border border-danger-subtle fs-11">
  Rejected
</span>

/* Information / PO Reference / In Progress */
<span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-11 font-monospace">
  PO-2026-0001
</span>
```

---

### 3.7 Modals & Expandable Drawers

- **Backdrop**: `rgba(0, 0, 0, 0.5)` with `zIndex: 1050`.
- **Border Radius**: `10px` or `12px` on modal content.
- **Header**: Background `#ffffff`, padding `16px 24px`, bottom border `#e2e8f0`.
- **Body**: Background `#f8fafc`, padding `20px 24px`.
- **Footer**: Background `#ffffff`, top border `#e2e8f0`, flex justify-between.

---

## 4. Functional Modules & Business Logic

### 4.1 Global ERP Overview & Analytics
- **Component**: `GlobalERPOverviewDashboard.jsx`
- **Purpose**: Real-time KPI aggregation of active Sales Orders, Procurement Spend, Dyeing Process Pipeline, Cutting progress, and In-House Stitching throughput.

### 4.2 Garment Sales Orders & Merchandise Planning
- **Components**: `OrdersModule.jsx`, `OrderCreationWizard.jsx`, `OrderDetailView.jsx`
- **Logic**:
  - Captures Customer Orders with multi-article style configurations (e.g., Kurta + Pyjama + Dupatta).
  - Automatically calculates fabric consumption: `Total Metres = Garment Pieces × Metres Per Piece`.
  - Factors in shrinkage allowance (e.g., +4% or +5% raw fabric requirement).
  - Accessory breakdown: Buttons, Zipper, Laces, Labels, and Polybags calculated per garment piece.

### 4.3 Raw Material Procurement & Inward GRN
- **Components**: `ProcurementDashboard.jsx`, `PurchaseOrderForm.jsx`, `GRNForm.jsx`, `QualityCheckForm.jsx`, `StockPoolView.jsx`
- **Logic**:
  - Creates Procurement POs for Greige fabric from textile mills (e.g., M.S. Textiles).
  - Goods Inward GRN records physical arrival with Invoice No, Transporter, and Bales.
  - Quality Check (QC) inspects incoming goods: assigns A-Grade (Good), B-Grade (Minor Defect), or Rejection.
  - Approved stock is inwarded into `raindrop_stock_pool_v1`.

### 4.4 Process PO & Job Work Challan (Dyeing / Processing)
- **Components**: `ProcessModule.jsx`, `ProcessPOForm.jsx`, `ProcessChallanForm.jsx`, `ProcessReturnForm.jsx`
- **Logic**:
  - **Dynamic Warehouse Stock**: Stock is derived directly from real Procurement POs (`raindrop_pos_v1`) and GRNs (`raindrop_grns_v1`).
  - **Single Batch Rule**: The system warns the user if attempting to mix bales from different purchase invoices on the same dyeing challan.
  - **Allocation Modes**:
    1. `+ Full Bale`: Dispatches the entire bale in one click.
    2. `▾ Pick Thans`: Opens the clean sub-table to pick specific 100m pieces/thans.
    3. `✂ Cut Meters`: Cuts specific meterage (Scenario B).
  - **Folding Factor**: Accounts for `L98` (98% actual yield) vs `L100` (100% actual yield).
  - **Inbound Returns (GRN)**: Records dyed fabric returning from the dyeing mill with shrinkage reconciliation.

### 4.5 Cutting Orders & Lay Planning
- **Component**: `CuttingModule.jsx`
- **Logic**:
  - Converts received dyed fabric into garment plies.
  - Lay planning ratios (e.g., 2:2:1 for S:M:L).
  - Generates cut bundles with unique bundle tags for assembly tracking.

### 4.6 Garment Production & Tailoring Outwork
- **Components**: `ProductionModule.jsx`, `EmbroideryList.jsx`, `NewEmbroideryPO.jsx`, `StitchingJobsList.jsx`, `SingleCutOrder.jsx`
- **Logic**:
  - Post-cut embroidery tracking (dispatched pieces vs received pieces).
  - Stitching tailor job orders with size-wise matrix inwarding (M, L, XL, Good/Altered/Rejected).
  - Single cut rework orders for damaged pieces or shortages during assembly.

### 4.7 Master Catalogs
- **Components**: `FabricMasterView.jsx`, `ColorMasterView.jsx`, `VendorMasterView.jsx`, `AccessoriesMasterView.jsx`, `SizeMasterView.jsx`, `TransporterMasterView.jsx`.

---

## 5. State Management & Storage Keys Reference

All module state is preserved offline in `localStorage` and optionally synchronized with the backend REST API:

| Storage Key | Data Shape / Contents | Used By |
| :--- | :--- | :--- |
| `erp_sales_orders_v1` | Array of Customer Sales Orders with styles, articles, and quantities | `OrdersModule.jsx` |
| `raindrop_pos_v1` | Array of Raw Material Procurement Purchase Orders | `ProcurementDashboard.jsx`, `ProcessChallanForm.jsx` |
| `raindrop_grns_v1` | Array of Goods Inward GRNs with physical inwarded bales and thans | `ProcurementDashboard.jsx`, `ProcessChallanForm.jsx` |
| `raindrop_qc_v1` | Array of QC inspection records and pass/fail statuses | `ProcurementDashboard.jsx` |
| `raindrop_stock_pool_v1` | Available warehouse inventory pool grouped by fabric quality | `StockPoolView.jsx` |
| `raindrop_rejected_stock_v1`| Damaged and rejected fabric batches awaiting debit note / return | `RejectedStockPool.jsx` |
| `erp_process_pos_v1` | Array of Dyeing / Job Work Process Purchase Orders | `ProcessPOForm.jsx`, `ProcessPOList.jsx` |
| `erp_process_challans_v1` | Array of Job Work Dispatch Challans with allocated bales & thans | `ProcessChallanForm.jsx`, `ProcessChallanList.jsx` |
| `erp_process_returns_v1` | Inward receipts of processed/dyed fabric returning from job workers | `ProcessReturnForm.jsx` |
| `erp_warehouse_fabric_bales` | Live warehouse stock pool with remaining meters and than statuses | `ProcessChallanForm.jsx` |
| `raindrop_fabrics_v1` | Fabric Master (Quality names, compositions, widths, shrinkages) | `FabricMasterView.jsx` |
| `raindrop_colors_v1` | Color Master (Color shade names, hex swatches) | `ColorMasterView.jsx` |
| `raindrop_vendors_v1` | Vendor Master (Mills, Dyers, Printers, Tailors, Transporters) | `VendorMasterView.jsx` |
| `erp_embroidery_pos_v1` | Embroidery Job Orders and inward receipts | `EmbroideryList.jsx` |
| `erp_stitching_jobs_v1` | Tailoring Stitching Jobs with size breakdown | `StitchingJobsList.jsx` |
| `erp_single_cuts_v1` | Single Cut replacement orders | `SingleCutOrder.jsx` |

---

## 6. Essential Rules for AI Agents & Developers

When modifying this repository, **follow these rules strictly**:

1. **MANDATORY BUILD AFTER EVERY EDIT**:  
   Always run `node build-client.js` after editing any file in `frontend/src/`. The application serves a bundled output; editing source files without running this command has **zero visual effect** in the browser.
2. **NEVER USE THE WORD "ROLL"**:  
   Always use **"Bale"** for packages and **"Than"** or **"Piece"** for individual pieces/rolls.
3. **DO NOT HARDCODE FAKE MOCK DATA IN WAREHOUSE STOCK**:  
   Warehouse stock in `ProcessChallanForm` dynamically derives from actual user-created Purchase Orders (`raindrop_pos_v1`) and GRNs (`raindrop_grns_v1`). Maintain this dynamic linking.
4. **PORTAL DROPDOWNS FOR TABLE ROWS**:  
   Any dropdown or combobox inside table cells must use React Portals (`createPortal(..., document.body)`) to avoid overflow clipping.
5. **KEEP SUB-TABLES CLEAN & COMPACT**:  
   Do not render oversized 4-column card blocks for items. Use clean, compact tabular layouts with clear badges and action buttons.
6. **PRESERVE OFFLINE RESILIENCE**:  
   Always wrap `localStorage` calls in `try...catch` blocks to prevent browser storage permission crashes.
7. **HIGH CONTRAST TEXT**:  
   Never use cyan, teal, or low-contrast light grey for primary text. Use `#0f172a` for dark text and `#475569` for labels.

---

## 7. Build & Verification Procedures

### Verify & Build:
```powershell
# 1. Execute the bundler
node build-client.js

# Expected Output:
# SUCCESSFULLY_REBUILT_MAIN_BUNDLE
# [CacheBuster] Updated dashboard.html version to <timestamp>
```

### Run Server:
```powershell
# 2. Launch local server
node server.js

# Expected Output:
# [Auto-Build] React bundle compiled successfully.
# Server running at http://localhost:3000/
```

### Browser Verification:
Navigate to:
- Dashboard: `http://localhost:3000/react/dashboard`
- Sales Orders: `http://localhost:3000/sales-orders`
- Procurement: `http://localhost:3000/procurement`
- Process Challans: `http://localhost:3000/process-challans`
