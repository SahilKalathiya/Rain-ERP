# Rain Drop ERP - React Source Code Documentation

આ ફોલ્ડરમાં તમારા ERP Rain પ્રોજેક્ટનો સંપૂર્ણ **Modular React Source Code (`src/`)** ઉમેરી દેવામાં આવ્યો છે.

---

## 📁 ફોલ્ડર સ્ટ્રક્ચર (Folder Structure)

```
ERP Rain/
├── src/
│   ├── main.jsx                          # React DOM Root Entry
│   ├── App.jsx                           # Master Application Component (Sidebar + Header + Routing)
│   │
│   ├── components/
│   │   ├── Production/                   # 🔥 મુખ્ય Production Module (Screenshots 1 to 5)
│   │   │   ├── ProductionModule.jsx      # Tabs Switcher (Embroidery, Single Cuts, Stitching) + State Sync
│   │   │   ├── EmbroideryList.jsx        # Screenshot 1: "Embroidery After Cut" (कटिंग के बाद कढ़ाई)
│   │   │   ├── NewEmbroideryPO.jsx       # Screenshot 2: "New Embroidery-After-Cut PO" Form & Items Table
│   │   │   ├── EmbroideryInward.jsx      # Screenshot 3: "Embroidery Inward" Form & Challan Receipt
│   │   │   ├── EmbroideryPODetail.jsx    # PO Breakdown View with Items, Rates & Print PO
│   │   │   ├── SingleCutOrder.jsx        # Screenshot 4: "Single Cut Order" Form & History Log
│   │   │   ├── StitchingJobsList.jsx     # Screenshot 5: "Stitching Jobs" Tailoring List (सिलाई जॉब)
│   │   │   ├── NewStitchingJob.jsx       # New Tailoring Job Order Form
│   │   │   ├── StitchingInward.jsx       # Stitching Inward with Size-Wise Matrix (M, L, XL, Good/Rej)
│   │   │   └── StitchingJobDetail.jsx    # Stitching Job Detail View
│   │   │
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.jsx               # Left Navigation Bar with Collapsible Submenus
│   │   │   └── menuConfig.js             # All Menu Routes (Fixed "Record Inward" labels)
│   │   │
│   │   ├── Header/
│   │   │   └── Header.jsx                # Top Header Bar with Search, AI Assistant, Notifications
│   │   │
│   │   ├── Orders/
│   │   │   └── OrdersModule.jsx          # Garment Orders List & Status Tracking
│   │   │
│   │   └── Cutting/
│   │       └── CuttingModule.jsx         # Cutting Orders, Lay Planning & Plies
│   │
│   └── data/
│       └── initialData.js                # Initial Sample Mock Data (Orders, Vendors, Articles, Stock)
```

---

## 🚀 કયા કોમ્પોનેન્ટમાં શું છે?

### 1. `EmbroideryList.jsx` (Screenshot 1)
- **રૂટ**: `/production-embroidery` અથવા `/production/embroidery`
- **ફીચર્સ**:
  - ટાઈટલ: `Embroidery After Cut` અને સબટાઈટલ: `Post-Cutting Embroidery / कटिंग के बाद कढ़ाई`
  - લાઈવ સર્ચ (PO Number, Design, Vendor)
  - Type Filter (`Computer Embroidery`, `Aari`, વગેરે) અને Status Filter (`Draft`, `In Progress`, `Completed`)
  - PO કાર્ડ્સ (`EMB-2026-0001`), કુલ રકમ (`₹18,000.00`), મોકલેલા પીસ (`450 pcs`), મળેલા પીસ (`250 pcs`)
  - **Inward** અને **View Details** બટન

### 2. `NewEmbroideryPO.jsx` (Screenshot 2)
- **રૂટ**: `/production/embroidery/new`
- **ફીચર્સ**:
  - Order dropdown, Embroidery Vendor dropdown, Emb Type, Design Name, PO Date, Expected Return
  - ડાયનેમિક આઈટમ્સ ટેબલ (`+ Add` રો, Article, Color, Cut Pieces Stock, Pcs Sent, Rate/Pc, Delete)
  - Special Notes અને Draft / Send to Vendor બટન્સ

### 3. `EmbroideryInward.jsx` (Screenshot 3)
- **રૂટ**: `/production/embroidery/inward/new`
- **ફીચર્સ**:
  - Embroidery PO સિલેક્ટર
  - Vendor Challan No *, Received Date *
  - Total Pieces Received *, Rejected Pieces
  - Quality Notes અને ગ્રીન `Record Inward` સબમિટ બટન

### 4. `SingleCutOrder.jsx` (Screenshot 4)
- **રૂટ**: `/production-single-cut` અથવા `/production/single-cuts/new`
- **ફીચર્સ**:
  - Order, Article, Color, Reason (Shortage, Fabric Defect, Printing Defect, Sampling, Rework)
  - Size (XS, S, M, L, XL, XXL), Quantity, Date, Reason Details
  - `Create Single Cut` બટન
  - નીચે ઓડિટ માટે **Recent Single Cut Orders History Table**

### 5. `StitchingJobsList.jsx` (Screenshot 5)
- **રૂટ**: `/production-stitching` અથવા `/production/stitching`
- **ફીચર્સ**:
  - ટાઈટલ: `Stitching Jobs` અને સબટાઈટલ: `Tailoring Orders / सिलाई जॉब`
  - Tailor Vendor, ઓર્ડર રેફરન્સ, ભાવ (`₹45/pc`), કુલ રકમ (`₹27,000.00`), Progress
  - **Inward**, **View Details** અને **+ New Job Order** બટન્સ

### 6. `StitchingInward.jsx`
- **રૂટ**: `/production/stitching/inward/new`
- **ફીચર્સ**:
  - Stitching Job સિલેક્ટર, ચલણ નંબર, તારીખ
  - **Size-Wise Breakdown Grid**: Size M, L, XL માટે Received, A-Grade (Good), B-Grade (Minor Alter), Rejected કોષ્ટક

---

## 🛠️ સ્ટેટ અને લોકલસ્ટોરેજ મેનેજમેન્ટ
બધા ફોર્મ્સ અને એન્ટ્રીઓ બ્રાઉઝરના `localStorage` માં ઑટોમેટિક સેવ થાય છે:
- `erp_embroidery_pos_v1`
- `erp_single_cuts_v1`
- `erp_stitching_jobs_v1`

---

## 🌐 લાઈવ એપ્લિકેશન કેવી રીતે ચલાવવી?
1. ફોલ્ડરમાં રહેલી [`start.bat`](start.bat) ફાઈલ પર ડબલ ક્લિક કરો, અથવા
2. ટર્મિનલમાં `node server.js` રન કરો.
3. બ્રાઉઝરમાં ઓપન કરો: `http://localhost:3000/react/dashboard`
