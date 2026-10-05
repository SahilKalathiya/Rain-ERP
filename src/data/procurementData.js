// =========================================================================
// Raindrop Garments - Phase 1: Raw Material Procurement Initial Data
// Accurately reflects client documents (M.S. Textiles, Keshav Freight, etc.)
// =========================================================================

export const initialVendors = [
  {
    id: "VEND-0001",
    name: "M.S. Textiles",
    type: "Fabric Supplier",
    contactPerson: "Mohammad Salim",
    phone: "9890018629",
    alternatePhone: "9820018630",
    email: "m.s.textiles1947@gmail.com",
    address: "H. No. 416, New Gauripada, Narpoli",
    city: "Bhiwandi",
    state: "Maharashtra",
    gstin: "27AFQPA0986G1ZA",
    rating: 5,
    bankName: "Bank of Maharashtra",
    accountNumber: "60567470510",
    ifscCode: "MAHB0000025",
    active: true,
    createdBy: "System Admin",
    createdDate: "01-09-2026",
    lastModifiedBy: "System Admin",
    lastModifiedDate: "01-09-2026"
  },
  {
    id: "VEND-0002",
    name: "Surat Rayon & Silk Mills",
    type: "Fabric Supplier",
    contactPerson: "Dinesh Patel",
    phone: "9825123456",
    alternatePhone: "",
    email: "sales@suratrayonmills.com",
    address: "Plot 42, Ring Road Industrial Estate",
    city: "Surat",
    state: "Gujarat",
    gstin: "24AAACS1234F1Z1",
    rating: 4,
    bankName: "State Bank of India",
    accountNumber: "38921049281",
    ifscCode: "SBIN0001234",
    active: true,
    createdBy: "System Admin",
    createdDate: "05-09-2026",
    lastModifiedBy: "System Admin",
    lastModifiedDate: "05-09-2026"
  },
  {
    id: "VEND-0003",
    name: "Krishna Dyeing & Printing",
    type: "Job Worker",
    contactPerson: "Ghanshyam Bhai",
    phone: "9879054321",
    alternatePhone: "",
    email: "krishnadyeing@gmail.com",
    address: "GIDC Pandesara",
    city: "Surat",
    state: "Gujarat",
    gstin: "24BKAPS9876K1Z9",
    rating: 4,
    bankName: "HDFC Bank",
    accountNumber: "50200039281928",
    ifscCode: "HDFC0000241",
    active: true,
    createdBy: "System Admin",
    createdDate: "10-09-2026",
    lastModifiedBy: "System Admin",
    lastModifiedDate: "10-09-2026"
  }
];

export const initialFabrics = [
  {
    id: "FAB-0001",
    qualityName: "Grey Cotton Fabrics (100*100)",
    fabricType: "Cotton",
    gsm: 140,
    widths: ["44", "58"],
    defaultShrinkage: 3.5,
    hsnCode: "520811",
    description: "High quality grey cotton fabric for base printing & dyeing, 100 Taka packing",
    active: true,
    createdBy: "System Admin",
    createdDate: "01-09-2026",
    lastModifiedBy: "System Admin",
    lastModifiedDate: "01-09-2026"
  },
  {
    id: "FAB-0002",
    qualityName: "Rayon 14kg Liva",
    fabricType: "Rayon",
    gsm: 160,
    widths: ["44", "48", "58"],
    defaultShrinkage: 4.0,
    hsnCode: "540752",
    description: "Premium heavy rayon fabric for ladies kurtis & tops",
    active: true,
    createdBy: "System Admin",
    createdDate: "02-09-2026",
    lastModifiedBy: "System Admin",
    lastModifiedDate: "02-09-2026"
  },
  {
    id: "FAB-0003",
    qualityName: "Georgette 60g Micro",
    fabricType: "Polyester",
    gsm: 60,
    widths: ["44"],
    defaultShrinkage: 1.5,
    hsnCode: "540772",
    description: "Lightweight sheer georgette for anarkalis and dupattas",
    active: true,
    createdBy: "System Admin",
    createdDate: "03-09-2026",
    lastModifiedBy: "System Admin",
    lastModifiedDate: "03-09-2026"
  }
];

export const initialTransporters = [
  {
    id: "TRN-0001",
    name: "Keshav Freight Carriers",
    address: "Diggi Malpura Road, Opp. Govt. Sr. Sec. School, Near Todi Pulia, Sanganer, Jaipur - 302029",
    phone: "9351585097",
    active: true,
    createdBy: "System Admin",
    createdDate: "01-09-2026",
    lastModifiedBy: "System Admin",
    lastModifiedDate: "01-09-2026"
  },
  {
    id: "TRN-0002",
    name: "Masood Transport Broker",
    address: "H.No. 416, New Gauri Pada, Bhiwandi",
    phone: "9890018629",
    active: true,
    createdBy: "System Admin",
    createdDate: "01-09-2026",
    lastModifiedBy: "System Admin",
    lastModifiedDate: "01-09-2026"
  }
];

export const initialPurchaseOrders = [
  {
    id: "PO-0001",
    date: "01-09-2026",
    vendorId: "VEND-0001",
    vendorName: "M.S. Textiles",
    expectedDeliveryDate: "20-09-2026",
    bufferAllowed: true,
    bufferPercent: 5.0,
    status: "Partially Received", // Draft / Sent / Partially Received / Completed / Cancelled
    terms: "Payment within 20 days. Claims for shortage/quality to be notified within 24 hours of receipt.",
    items: [
      {
        id: "item-1",
        fabricId: "FAB-0001",
        fabricName: "Grey Cotton Fabrics (100*100)",
        width: "44",
        quantity: 10415.25,
        rate: 25.47,
        fold: 97,
        amount: 265276.42
      }
    ],
    totalAmount: 265276.42,
    createdBy: "Saksham Garg",
    createdDate: "01-09-2026 10:15 AM",
    lastModifiedBy: "Saksham Garg",
    lastModifiedDate: "01-09-2026 10:30 AM"
  },
  {
    id: "PO-0002",
    date: "15-09-2026",
    vendorId: "VEND-0002",
    vendorName: "Surat Rayon & Silk Mills",
    expectedDeliveryDate: "05-10-2026",
    bufferAllowed: false,
    bufferPercent: 0,
    status: "Sent",
    terms: "F.O.R. Jaipur godown. Standard packaging in polythene wrap.",
    items: [
      {
        id: "item-2",
        fabricId: "FAB-0002",
        fabricName: "Rayon 14kg Liva",
        width: "44",
        quantity: 5000.0,
        rate: 42.0,
        fold: 100,
        amount: 210000.0
      }
    ],
    totalAmount: 210000.0,
    createdBy: "Saksham Garg",
    createdDate: "15-09-2026 11:00 AM",
    lastModifiedBy: "Saksham Garg",
    lastModifiedDate: "15-09-2026 11:00 AM"
  }
];

export const initialGRNs = [
  {
    id: "GRN-0001",
    date: "01-10-2026",
    linkedPOs: ["PO-0001"],
    vendorId: "VEND-0001",
    vendorName: "M.S. Textiles",
    transporterId: "TRN-0001",
    transporterName: "Keshav Freight Carriers (LR: 124777)",
    vendorInvoiceNo: "MST/1360/26-27",
    vendorInvoiceDate: "01-09-2026",
    vendorChallanNo: "1360",
    vendorChallanDate: "01-09-2026",
    totalBales: 5,
    declaredTotalMeters: 10415.25,
    totalMetersEntered: 10415.25,
    status: "Completed", // Draft / Header Saved / Bale Entry in Progress / Completed
    excessFlagged: false,
    adminApprovalNeeded: false,
    bales: [
      {
        baleNo: "Bale 01 (Bale 2840)",
        piecesCount: 17,
        totalLength: 1779.0,
        pieces: [
          { pieceNo: "Piece 01", fabric: "Grey Cotton Fabrics (100*100)", length: 104.0, remarks: "Clean" },
          { pieceNo: "Piece 02", fabric: "Grey Cotton Fabrics (100*100)", length: 102.5, remarks: "Clean" },
          { pieceNo: "Piece 03", fabric: "Grey Cotton Fabrics (100*100)", length: 104.0, remarks: "Clean" },
          { pieceNo: "Piece 04", fabric: "Grey Cotton Fabrics (100*100)", length: 106.0, remarks: "Clean" },
          { pieceNo: "Piece 05", fabric: "Grey Cotton Fabrics (100*100)", length: 104.0, remarks: "Clean" },
          { pieceNo: "Piece 06", fabric: "Grey Cotton Fabrics (100*100)", length: 105.0, remarks: "Clean" },
          { pieceNo: "Piece 07", fabric: "Grey Cotton Fabrics (100*100)", length: 104.5, remarks: "Clean" },
          { pieceNo: "Piece 08", fabric: "Grey Cotton Fabrics (100*100)", length: 109.0, remarks: "Clean" },
          { pieceNo: "Piece 09", fabric: "Grey Cotton Fabrics (100*100)", length: 105.0, remarks: "Clean" },
          { pieceNo: "Piece 10", fabric: "Grey Cotton Fabrics (100*100)", length: 105.0, remarks: "Clean" },
          { pieceNo: "Piece 11", fabric: "Grey Cotton Fabrics (100*100)", length: 104.0, remarks: "Clean" },
          { pieceNo: "Piece 12", fabric: "Grey Cotton Fabrics (100*100)", length: 102.5, remarks: "Clean" },
          { pieceNo: "Piece 13", fabric: "Grey Cotton Fabrics (100*100)", length: 103.0, remarks: "Clean" },
          { pieceNo: "Piece 14", fabric: "Grey Cotton Fabrics (100*100)", length: 102.5, remarks: "Clean" },
          { pieceNo: "Piece 15", fabric: "Grey Cotton Fabrics (100*100)", length: 105.0, remarks: "Clean" },
          { pieceNo: "Piece 16", fabric: "Grey Cotton Fabrics (100*100)", length: 105.0, remarks: "Clean" },
          { pieceNo: "Piece 17", fabric: "Grey Cotton Fabrics (100*100)", length: 102.0, remarks: "Clean" }
        ]
      },
      {
        baleNo: "Bale 02 (Bale 2841)",
        piecesCount: 17,
        totalLength: 1759.0,
        pieces: [
          { pieceNo: "Piece 01", fabric: "Grey Cotton Fabrics (100*100)", length: 106.0, remarks: "Clean" },
          { pieceNo: "Piece 02", fabric: "Grey Cotton Fabrics (100*100)", length: 104.0, remarks: "Clean" },
          { pieceNo: "Piece 03", fabric: "Grey Cotton Fabrics (100*100)", length: 103.0, remarks: "Clean" },
          { pieceNo: "Piece 04", fabric: "Grey Cotton Fabrics (100*100)", length: 102.0, remarks: "Clean" },
          { pieceNo: "Piece 05", fabric: "Grey Cotton Fabrics (100*100)", length: 104.0, remarks: "Clean" },
          { pieceNo: "Piece 06", fabric: "Grey Cotton Fabrics (100*100)", length: 104.0, remarks: "Clean" },
          { pieceNo: "Piece 07", fabric: "Grey Cotton Fabrics (100*100)", length: 100.0, remarks: "Clean" },
          { pieceNo: "Piece 08", fabric: "Grey Cotton Fabrics (100*100)", length: 102.0, remarks: "Clean" },
          { pieceNo: "Piece 09", fabric: "Grey Cotton Fabrics (100*100)", length: 103.0, remarks: "Clean" },
          { pieceNo: "Piece 10", fabric: "Grey Cotton Fabrics (100*100)", length: 106.0, remarks: "Clean" },
          { pieceNo: "Piece 11", fabric: "Grey Cotton Fabrics (100*100)", length: 103.0, remarks: "Clean" },
          { pieceNo: "Piece 12", fabric: "Grey Cotton Fabrics (100*100)", length: 105.0, remarks: "Clean" },
          { pieceNo: "Piece 13", fabric: "Grey Cotton Fabrics (100*100)", length: 103.0, remarks: "Clean" },
          { pieceNo: "Piece 14", fabric: "Grey Cotton Fabrics (100*100)", length: 102.0, remarks: "Clean" },
          { pieceNo: "Piece 15", fabric: "Grey Cotton Fabrics (100*100)", length: 104.0, remarks: "Clean" },
          { pieceNo: "Piece 16", fabric: "Grey Cotton Fabrics (100*100)", length: 104.0, remarks: "Clean" },
          { pieceNo: "Piece 17", fabric: "Grey Cotton Fabrics (100*100)", length: 97.0, remarks: "Clean" }
        ]
      }
    ],
    createdBy: "Saksham Garg",
    createdDate: "01-10-2026 02:30 PM",
    lastModifiedBy: "Saksham Garg",
    lastModifiedDate: "01-10-2026 04:00 PM"
  }
];

export const initialQualityChecks = [
  {
    id: "QC-0001",
    grnRef: "GRN-0001",
    inspectionScope: "Whole Shipment", // Whole Shipment / Bale-Level / Piece-Level
    baleRef: "",
    pieceRef: "",
    inspectorName: "Saksham Garg",
    expectedWidth: "44",
    actualWidth: 44.0,
    expectedFold: "97",
    actualFold: 97.0,
    photos: [],
    notes: "Fabric GSM and width verified. No warp or weft defects observed. Approved for main stock.",
    qcStatus: "OK", // OK / Send for Admin Approval / Reject
    adminDecision: "",
    adminRemarks: "",
    dateTime: "01-10-2026 04:30 PM",
    createdBy: "Saksham Garg"
  },
  {
    id: "QC-0002",
    grnRef: "GRN-0001",
    inspectionScope: "Piece-Level",
    baleRef: "Bale 03",
    pieceRef: "Piece 07",
    inspectorName: "Saksham Garg",
    expectedWidth: "44",
    actualWidth: 42.5,
    expectedFold: "97",
    actualFold: 94.0,
    photos: [],
    notes: "Width is 1.5 inches short and extensive oil stains found in fold.",
    qcStatus: "Reject",
    adminDecision: "Reject",
    adminRemarks: "Confirmed defective selvedge and oil marks. Move to Rejected Stock Pool for RTV.",
    dateTime: "01-10-2026 05:00 PM",
    createdBy: "Saksham Garg"
  }
];

export const initialRejectedStock = [
  {
    id: "REJ-0001",
    sourceQcRef: "QC-0002",
    grnRef: "GRN-0001",
    poRef: "PO-0001",
    vendorName: "M.S. Textiles",
    baleRef: "Bale 03",
    pieceRef: "Piece 07",
    fabricName: "Grey Cotton Fabrics (100*100)",
    quantity: 102.5,
    reason: "Short width (42.5\") and heavy oil stain on fabric body",
    dateFlagged: "01-10-2026",
    status: "In Pool", // In Pool / RTV Initiated / To Be Sold / Sold / Transferred
    actionDetails: null
  }
];

export const initialAuditLogs = [
  {
    id: "LOG-001",
    dateTime: "01-09-2026 10:15 AM",
    user: "Saksham Garg",
    role: "Procurement Manager",
    action: "Create",
    module: "Purchase Order",
    recordNo: "PO-0001",
    field: "PO Creation",
    previousValue: "None",
    updatedValue: "PO-0001 (10,415.25 Mtrs)",
    remarks: "Initial procurement PO raised to M.S. Textiles"
  },
  {
    id: "LOG-002",
    dateTime: "01-10-2026 02:30 PM",
    user: "Saksham Garg",
    role: "Stores / Inward Officer",
    action: "Create",
    module: "GRN",
    recordNo: "GRN-0001",
    field: "GRN Creation",
    previousValue: "None",
    updatedValue: "GRN-0001 linked to PO-0001",
    remarks: "Received 5 Bales via Keshav Freight Carriers"
  },
  {
    id: "LOG-003",
    dateTime: "01-10-2026 05:00 PM",
    user: "Saksham Garg",
    role: "Quality Inspector",
    action: "Reject",
    module: "Quality Check",
    recordNo: "QC-0002",
    field: "QC Status",
    previousValue: "Pending",
    updatedValue: "Reject",
    remarks: "Short width and oil stains on Piece 07"
  }
];
