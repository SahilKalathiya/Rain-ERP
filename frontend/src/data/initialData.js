// =========================================================================
// Rain Drop ERP - Sample & Initial Mock Data
// =========================================================================

export const initialEmbroideryPOs = [
  {
    id: "EMB-2026-0001",
    status: "In Progress",
    orderRef: "ORD-2026-001 (Summer Kurti)",
    vendor: "Surat Embroidery Hub",
    embType: "Computer Embroidery",
    designName: "Floral Neck Motif #42",
    date: "01/10/2026",
    expectedReturn: "08/10/2026",
    amount: "₹18,000.00",
    amountNum: 18000,
    totalSent: "450 pcs",
    totalSentNum: 450,
    totalReceived: "250 pcs",
    totalReceivedNum: 250,
    items: [
      { id: "item-1", article: "ART-101 Kurti Front", color: "Royal Blue", cutStock: "CP-STOCK-01", pcsSent: 250, rate: 40, total: 10000, received: 250 },
      { id: "item-2", article: "ART-102 Sleeves Pair", color: "Maroon Red", cutStock: "CP-STOCK-02", pcsSent: 200, rate: 40, total: 8000, received: 0 }
    ],
    notes: "Strict thread color matching as per master swatch #7. High needle tension."
  },
  {
    id: "EMB-2026-0002",
    status: "Draft",
    orderRef: "ORD-2026-002 (Designer Anarkali)",
    vendor: "Krishna Thread Art",
    embType: "Aari",
    designName: "Zari Border Traditional",
    date: "30/09/2026",
    expectedReturn: "12/10/2026",
    amount: "₹24,500.00",
    amountNum: 24500,
    totalSent: "350 pcs",
    totalSentNum: 350,
    totalReceived: "0 pcs",
    totalReceivedNum: 0,
    items: [
      { id: "item-3", article: "ART-205 Anarkali Flare", color: "Emerald Green", cutStock: "CP-STOCK-03", pcsSent: 350, rate: 70, total: 24500, received: 0 }
    ],
    notes: "Golden zari 3-ply thread to be used. Send sample first before full lot."
  }
];

export const initialSingleCuts = [
  {
    id: "SC-2026-0001",
    orderRef: "ORD-2026-001 (Summer Kurti)",
    article: "ART-101 Kurti Front",
    color: "Royal Blue",
    reason: "Shortage",
    size: "M",
    quantity: 12,
    date: "01/10/2026",
    details: "Cutting lot shortage identified during bundle prep. 12 front panels needed urgently.",
    status: "Completed"
  },
  {
    id: "SC-2026-0002",
    orderRef: "ORD-2026-002 (Designer Anarkali)",
    article: "ART-205 Anarkali Flare",
    color: "Emerald Green",
    reason: "Defect Replacement",
    size: "L",
    quantity: 5,
    date: "02/10/2026",
    details: "Fabric weaving defect found on 5 panels during quality check.",
    status: "In Progress"
  }
];

export const initialStitchingJobs = [
  {
    id: "ST-2026-0001",
    status: "In Progress",
    orderRef: "ORD-2026-001 (Summer Kurti)",
    vendor: "Shree Ganesh Stitching Works",
    jobType: "Tailoring Order",
    date: "01/10/2026",
    expectedReturn: "10/10/2026",
    amount: "₹27,000.00",
    amountNum: 27000,
    totalSent: "600 pcs",
    totalSentNum: 600,
    totalReceived: "400 pcs",
    totalReceivedNum: 400,
    ratePerPc: 45,
    items: [
      { id: "st-item-1", article: "ART-101 Kurti Front + Back", color: "Royal Blue", cutStock: "CP-STOCK-01", pcsSent: 350, rate: 45, total: 15750, received: 250 },
      { id: "st-item-2", article: "ART-102 Sleeves & Collar", color: "Maroon Red", cutStock: "CP-STOCK-02", pcsSent: 250, rate: 45, total: 11250, received: 150 }
    ],
    notes: "Double lock stitching on armholes. Overlock finish on all inner seams."
  },
  {
    id: "ST-2026-0002",
    status: "Draft",
    orderRef: "ORD-2026-003 (Festive Silk Kurta)",
    vendor: "Radhe Garments & Tailors",
    jobType: "Tailoring Order",
    date: "02/10/2026",
    expectedReturn: "15/10/2026",
    amount: "₹18,000.00",
    amountNum: 18000,
    totalSent: "300 pcs",
    totalSentNum: 300,
    totalReceived: "0 pcs",
    totalReceivedNum: 0,
    ratePerPc: 60,
    items: [
      { id: "st-item-3", article: "ART-301 Silk Kurta Body", color: "Gold Ochre", cutStock: "CP-STOCK-04", pcsSent: 300, rate: 60, total: 18000, received: 0 }
    ],
    notes: "Piping on placket and sleeve cuffs as per master approved sample."
  }
];

export const sampleOrders = [
  "ORD-2026-001 (Summer Kurti)",
  "ORD-2026-002 (Designer Anarkali)",
  "ORD-2026-003 (Festive Silk Kurta)",
  "ORD-2026-004 (Cotton Casual Shirt)"
];

export const sampleEmbroideryVendors = [
  "Surat Embroidery Hub",
  "Krishna Thread Art",
  "Om Sai Multi-Head Embroidery",
  "Shiv Shakti Job Works"
];

export const sampleStitchingVendors = [
  "Shree Ganesh Stitching Works",
  "Radhe Garments & Tailors",
  "Surat Craft Unit #4",
  "Ambica Tailoring Unit"
];

export const sampleArticles = [
  "ART-101 Kurti Front",
  "ART-102 Sleeves Pair",
  "ART-205 Anarkali Flare",
  "ART-301 Silk Kurta Body",
  "ART-401 Shirt Front & Collar"
];

export const sampleColors = [
  "Royal Blue",
  "Maroon Red",
  "Emerald Green",
  "Gold Ochre",
  "White",
  "Jet Black"
];

export const sampleCutStock = [
  "CP-STOCK-01 (500 pcs)",
  "CP-STOCK-02 (350 pcs)",
  "CP-STOCK-03 (400 pcs)",
  "CP-STOCK-04 (600 pcs)"
];
