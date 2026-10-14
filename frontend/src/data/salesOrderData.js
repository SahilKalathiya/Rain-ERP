// =========================================================================
// Rain Drop ERP - Sales Order & Master Data Store (Local & Seed Data)
// Route 1 - Sales Order Masters & Order Detail Form Module
// =========================================================================

export const initialCustomers = [
  {
    id: 'CUST-001',
    name: 'Manyavar Trends Retail',
    type: 'B2B Retailer',
    phone: '9898012345',
    email: 'orders@manyavar.com',
    address: 'Plot 102, Ring Road Industrial Area',
    city: 'Surat',
    state: 'Gujarat',
    gstin: '24AAACM1234F1Z1',
    active: true,
    notes: 'Premium festive menswear retailer'
  },
  {
    id: 'CUST-002',
    name: 'FabIndia Lifestyle Hub',
    type: 'Distributor',
    phone: '9822054321',
    email: 'supply@fabindia.net',
    address: 'Unit 44, Phoenix Mills, Lower Parel',
    city: 'Mumbai',
    state: 'Maharashtra',
    gstin: '27AABCF5678G1Z2',
    active: true,
    notes: 'Natural organic cotton orders'
  },
  {
    id: 'CUST-003',
    name: 'Ethnicity Boutiques',
    type: 'Direct Customer',
    phone: '9711098765',
    email: 'purchase@ethnicity.co.in',
    address: 'Johari Bazaar, Pink City',
    city: 'Jaipur',
    state: 'Rajasthan',
    gstin: '08AACCE9012H1Z3',
    active: true,
    notes: 'Handcrafted prints & ikkat specialist'
  }
];

export const initialColors = [
  { id: 'COL-001', name: 'Charcoal', hexCode: '#333333', pantoneCode: 'PANTONE 19-4008', quarterTag: 'Q1', isTrending: true, active: true },
  { id: 'COL-002', name: 'Green', hexCode: '#228B22', pantoneCode: 'PANTONE 18-6030', quarterTag: 'Q1', isTrending: true, active: true },
  { id: 'COL-003', name: 'Ivory', hexCode: '#FFFFF0', pantoneCode: 'PANTONE 11-0601', quarterTag: 'Q2', isTrending: true, active: true },
  { id: 'COL-004', name: 'Jamun', hexCode: '#4B0082', pantoneCode: 'PANTONE 19-3518', quarterTag: 'Q3', isTrending: true, active: true },
  { id: 'COL-005', name: 'Lavender', hexCode: '#E6E6FA', pantoneCode: 'PANTONE 14-3907', quarterTag: 'Q2', isTrending: false, active: true },
  { id: 'COL-006', name: 'Maroon', hexCode: '#800000', pantoneCode: 'PANTONE 19-1528', quarterTag: 'Q4', isTrending: true, active: true },
  { id: 'COL-007', name: 'Navy Blue', hexCode: '#000080', pantoneCode: 'PANTONE 19-3832', quarterTag: 'Q1', isTrending: true, active: true },
  { id: 'COL-008', name: 'Pastel Red', hexCode: '#FF6961', pantoneCode: 'PANTONE 16-1546', quarterTag: 'Q2', isTrending: false, active: true },
  { id: 'COL-009', name: 'Rama Green', hexCode: '#20B2AA', pantoneCode: 'PANTONE 16-5121', quarterTag: 'Q3', isTrending: true, active: true },
  { id: 'COL-010', name: 'Rust Light', hexCode: '#B7410E', pantoneCode: 'PANTONE 18-1248', quarterTag: 'Q4', isTrending: true, active: true },
  { id: 'COL-011', name: 'Sea Green', hexCode: '#2E8B57', pantoneCode: 'PANTONE 16-5418', quarterTag: 'Q1', isTrending: false, active: true },
  { id: 'COL-012', name: 'Watermelon', hexCode: '#FC6C85', pantoneCode: 'PANTONE 16-1735', quarterTag: 'Q2', isTrending: true, active: true },
  { id: 'COL-013', name: 'Wine', hexCode: '#722F37', pantoneCode: 'PANTONE 19-1815', quarterTag: 'Q4', isTrending: true, active: true },
  { id: 'COL-014', name: 'Yellow', hexCode: '#FFD700', pantoneCode: 'PANTONE 13-0858', quarterTag: 'Q3', isTrending: false, active: true }
];

export const initialArticles = [
  { id: 'ART-001', name: 'Kurta', icon: '👘', sortOrder: 1, description: 'Men & Women Long Tunics / Kurtas', active: true },
  { id: 'ART-002', name: 'Pant', icon: '👖', sortOrder: 2, description: 'Pants, Churidars & Trousers', active: true },
  { id: 'ART-003', name: 'Dupatta', icon: '🎀', sortOrder: 3, description: 'Stoles & Chiffon/Mulmul Dupattas', active: true },
  { id: 'ART-004', name: 'Jacket', icon: '🧥', sortOrder: 4, description: 'Nehru & Modi Cut Waistcoats', active: true },
  { id: 'ART-005', name: 'Top', icon: '👚', sortOrder: 5, description: 'Short Tunics / Western Tops', active: true },
  { id: 'ART-006', name: 'Bottom', icon: '🩳', sortOrder: 6, description: 'Pants & Palazzos', active: true }
];

export const initialSizeSeries = [
  {
    id: 'SER-ALPHA',
    name: 'Alpha',
    alias: 'Alpha',
    description: '9 sizes · Standard kurta run (XS - 5XL)',
    displayOrder: 1,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
    sizeDetails: [
      { size: 'XS', label: 'EXTRA SMALL' },
      { size: 'S', label: 'SMALL' },
      { size: 'M', label: 'MEDIUM' },
      { size: 'L', label: 'LARGE' },
      { size: 'XL', label: 'EXTRA LARGE' },
      { size: '2XL', label: 'DOUBLE XL' },
      { size: '3XL', label: 'TRIPLE XL' },
      { size: '4XL', label: '4 XL' },
      { size: '5XL', label: '5 XL' }
    ],
    active: true
  },
  {
    id: 'SER-NUMERIC',
    name: 'Numeric',
    alias: 'Numeric',
    description: '10 sizes · Numeric waist/chest run (28 - 46)',
    displayOrder: 2,
    sizes: ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46'],
    sizeDetails: [
      { size: '28', label: '28' },
      { size: '30', label: '30' },
      { size: '32', label: '32' },
      { size: '34', label: '34' },
      { size: '36', label: '36' },
      { size: '38', label: '38' },
      { size: '40', label: '40' },
      { size: '42', label: '42' },
      { size: '44', label: '44' },
      { size: '46', label: '46' }
    ],
    active: true
  },
  {
    id: 'SER-MIX',
    name: 'Mix Sizes',
    alias: 'Mix Sizes',
    description: '3 sizes · Dual fit run (S/M - 2XL/3XL)',
    displayOrder: 3,
    sizes: ['S/M', 'L/XL', '2XL/3XL'],
    sizeDetails: [
      { size: 'S/M', label: 'SMALL/MEDIUM' },
      { size: 'L/XL', label: 'LARGE/EXTRA LARGE' },
      { size: '2XL/3XL', label: '2XL/3XL' }
    ],
    active: true
  }
];

export const initialAccessoryMasters = [
  {
    id: 'ACC-BTN-01',
    name: 'Coconut Button',
    category: 'Buttons',
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: 10,
    hsnCode: '96062100',
    description: 'Natural coconut shell buttons for kurtas & shirts (14L, 18L, 20L)',
    buttonSizes: '14L, 18L, 20L',
    buttonColors: 'Natural, Dark Brown, Gold',
    sizes: ['14L', '18L', '20L'],
    colors: ['Natural', 'Dark Brown', 'Gold'],
    defaultReqPerPc: '',
    defaultPlacement: '',
    defaultColor: '',
    defaultSize: '',
    varieties: [
      { id: 'VAR-01', name: 'Coconut', sizes: [], colors: ['Natural', 'Dark Brown', 'Gold'] },
      { id: 'VAR-02', name: 'Coconut Button (Natural) [14L]', sizes: ['14L'], colors: ['Natural'] }
    ],
    active: true
  },
  {
    id: 'ACC-001',
    name: 'Buttons',
    category: 'Buttons',
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: 10,
    hsnCode: '96062100',
    description: 'Natural coconut shell & poly buttons',
    buttonSizes: '14L, 18L, 20L',
    buttonColors: 'Natural, Dark Brown, Gold',
    varieties: [
      { id: 'VAR-01', name: 'Coconut', sizes: [], colors: ['Natural', 'Dark Brown', 'Gold'] },
      { id: 'VAR-02', name: 'Coconut Button (Natural) [14L]', sizes: ['14L'], colors: ['Natural'] },
      { id: 'VAR-03', name: 'Embroidered [18 L]', sizes: ['18L'], colors: ['Multi', 'Gold'] },
      { id: 'VAR-04', name: 'Eyelet (Gold) [18 L]', sizes: ['18L'], colors: ['Gold', 'Silver'] },
      { id: 'VAR-05', name: 'MOP', sizes: ['14L', '16L'], colors: ['Pearl White'] },
      { id: 'VAR-06', name: 'Metal 2 hole', sizes: ['16L', '18L'], colors: ['Antique Brass', 'Silver'] },
      { id: 'VAR-07', name: 'Mould', sizes: ['18L'], colors: ['Dyed Match'] },
      { id: 'VAR-08', name: 'Pignose', sizes: ['16L'], colors: ['Gold'] },
      { id: 'VAR-09', name: 'Plastic', sizes: ['18L', '20L'], colors: ['Black', 'White', 'Clear'] }
    ],
    active: true
  },
  {
    id: 'ACC-002',
    name: 'Lace',
    category: 'Lace',
    unit: 'Meter',
    piecesPerUnit: 1,
    maxBuffer: 5,
    hsnCode: '58081000',
    description: 'Cotton crochet & zari borders',
    varieties: [
      { id: 'LAC-01', name: 'Cotton Crochet 18mm', size: '18mm', defaultShrinkage: 3.0, fabricPerMeterLace: 0.12 },
      { id: 'LAC-02', name: 'Zari Border 2 inch', size: '2 inch', defaultShrinkage: 1.0, fabricPerMeterLace: 0.25 }
    ],
    active: true
  },
  {
    id: 'ACC-003',
    name: 'Tassels',
    category: 'Tassels',
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: 8,
    hsnCode: '58089000',
    description: 'Silk & latkan decorative hangings',
    varieties: [
      { id: 'TAS-01', name: 'Ready Made Silk Latkan', type: 'Ready Made', sizes: ['2 inch', '3 inch'] },
      { id: 'TAS-02', name: 'Job Work Handmade Tassel', type: 'Job Work', sizes: ['2.5 inch'], threadConsumption: 15 }
    ],
    active: true
  },
  {
    id: 'ACC-004',
    name: 'Dori (Drawstring)',
    category: 'Dori',
    unit: 'Meter',
    piecesPerUnit: 1,
    maxBuffer: 5,
    hsnCode: '56075000',
    description: 'Fabric turned drawstrings for pajamas and kurtas',
    varieties: [
      { id: 'DOR-01', name: 'Matching Fabric Dori', fabricQuality: 'Grey Cotton Fabrics (100*100)', widths: ['44', '58'], consumptionPerWidth: { '44': 12.5, '58': 9.8 } }
    ],
    active: true
  },
  {
    id: 'ACC-005',
    name: 'Thread',
    category: 'Thread',
    unit: 'Meter',
    piecesPerUnit: 1,
    maxBuffer: 10,
    hsnCode: '52041100',
    description: 'Stitching, Kantha & Couching thread patterns',
    varieties: [
      { id: 'THR-01', name: 'Kantha Pattern Thread', pattern: 'Kantha', threadPerStitch: 15, defaultBoxMeters: 6000 },
      { id: 'THR-02', name: 'Couching Pattern Thread', pattern: 'Couching', threadPerStitch: 15, defaultBoxMeters: 6000 },
      { id: 'THR-03', name: 'Standard Stitching Thread', pattern: 'Stitching', threadPerPiece: 60, consumptionPer100Pcs: 6000 }
    ],
    active: true
  },
  {
    id: 'ACC-006',
    name: 'Elastic',
    category: 'Elastic',
    unit: 'Meter',
    piecesPerUnit: 1,
    maxBuffer: 5,
    hsnCode: '56041000',
    description: 'Braided waist & cuff elastic band',
    varieties: [
      { id: 'ELA-01', name: '1 inch Woven Waistband Elastic', size: '1 inch', consumption: 0.85 }
    ],
    active: true
  },
  {
    id: 'ACC-007',
    name: 'Beads & Sequins',
    category: 'Beads & Sequins',
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: 5,
    hsnCode: '71179090',
    description: 'Gold & pearl decorative embellishments',
    varieties: [
      { id: 'BD-01', name: 'Gold Sequin 5mm (Gold) [5mm]', size: '5mm', sizes: ['5mm'] },
      { id: 'BD-02', name: 'Moti / Pearl Beads 4mm', size: '4mm', sizes: ['4mm'] }
    ],
    active: true
  },
  {
    id: 'ACC-008',
    name: 'Hook',
    category: 'Hook',
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: 5,
    hsnCode: '83081000',
    description: 'Hook and eye clasps & trouser waistband hooks',
    varieties: [
      { id: 'HK-01', name: 'Hook & Eye (Silver)', size: 'Standard', sizes: ['Small', 'Standard'] },
      { id: 'HK-02', name: 'Pant Hook Metal', size: 'Standard', sizes: ['Standard'] }
    ],
    active: true
  },
  {
    id: 'ACC-009',
    name: 'Zipper',
    category: 'Zipper',
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: 5,
    hsnCode: '96071100',
    description: 'Concealed, nylon and metal zippers',
    varieties: [
      { id: 'ZIP-01', name: 'Concealed Zipper [8 inch]', size: '8 inch', sizes: ['7 inch', '8 inch', '10 inch'] },
      { id: 'ZIP-02', name: 'Metal Zipper [12 inch]', size: '12 inch', sizes: ['10 inch', '12 inch'] },
      { id: 'ZIP-03', name: 'Nylon Coil Zipper [7 inch]', size: '7 inch', sizes: ['7 inch', '9 inch'] }
    ],
    active: true
  },
  {
    id: 'ACC-010',
    name: 'Label',
    category: 'Label',
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: 5,
    hsnCode: '58071000',
    description: 'Brand woven main labels, wash care & size tags',
    varieties: [
      { id: 'LBL-01', name: 'Brand Main Woven Label', size: 'Standard', sizes: ['Standard'] },
      { id: 'LBL-02', name: 'Wash Care Satin Label', size: 'Standard', sizes: ['Standard'] },
      { id: 'LBL-03', name: 'Size Pip Label', size: 'Standard', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] }
    ],
    active: true
  },
  {
    id: 'ACC-011',
    name: 'Packaging',
    category: 'Packaging',
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: 5,
    hsnCode: '39232100',
    description: 'Polybags, butter paper & hang tags',
    varieties: [
      { id: 'PKG-01', name: 'Polybag (12x15)', size: '12x15', sizes: ['10x12', '12x15', '14x18'] },
      { id: 'PKG-02', name: 'Butter Paper', size: 'Standard', sizes: ['Standard'] },
      { id: 'PKG-03', name: 'Hangtag with String', size: 'Standard', sizes: ['Standard'] }
    ],
    active: true
  },
  {
    id: 'ACC-012',
    name: 'Other',
    category: 'Other',
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: 5,
    hsnCode: '99999999',
    description: 'Miscellaneous accessories, pins, tapes and trims',
    varieties: [
      { id: 'OTH-01', name: 'Safety Pin', size: 'Standard', sizes: ['Standard'] },
      { id: 'OTH-02', name: 'Hanger Loop Tape', size: 'Standard', sizes: ['Standard'] }
    ],
    active: true
  }
];

export const initialThreadSizes = [
  { id: 'THS-001', brandName: 'Vardhman Poly', packagingType: 'Reel', piecesPerBox: 15, threadLengthPerPiece: 20.0, boxCapacity: 6000, active: true },
  { id: 'THS-002', brandName: 'Coats Astra', packagingType: 'Cone', piecesPerBox: 1, threadLengthPerPiece: 5000.0, boxCapacity: 5000, active: true },
  { id: 'THS-003', brandName: 'Madura Coats', packagingType: 'Cone', piecesPerBox: 1, threadLengthPerPiece: 10000.0, boxCapacity: 10000, active: true }
];

export const initialThreadColors = [
  { id: 'TCC-001', brandName: 'Vardhman Poly', colorNumber: 'VR-101 (Black)', colorCode: '#000000', active: true },
  { id: 'TCC-002', brandName: 'Vardhman Poly', colorNumber: 'VR-204 (Off White)', colorCode: '#F8F8FF', active: true },
  { id: 'TCC-003', brandName: 'Coats Astra', colorNumber: 'CA-550 (Golden Zari)', colorCode: '#FFD700', active: true },
  { id: 'TCC-004', brandName: 'Madura Coats', colorNumber: 'MC-890 (Navy)', colorCode: '#000080', active: true }
];

export const initialSalesOrders = [
  {
    id: 'RD-2610-0002',
    styleName: 'kurta',
    orderDate: '2026-10-12',
    expectedDelivery: '2026-11-20',
    priority: 'Normal',
    status: 'Draft',
    stage: 'Draft',
    totalGarments: 200,
    totalFabricGreige: 0,
    totalFabricDyed: 0,
    articles: [
      {
        id: 'ART-001',
        name: 'Kurta',
        fabricQuality: 'Desizer Flex',
        avgGarmentLength: '40.00',
        totalPieces: 200,
        sourcing: 'Greige',
        shrinkage: 6
      },
      {
        id: 'ART-002',
        name: 'Pant',
        fabricQuality: 'Chanderi Silk',
        avgGarmentLength: '38.00',
        totalPieces: 200,
        sourcing: 'Greige',
        shrinkage: 3
      }
    ],
    customerOrders: [
      { id: 'CUST-001', customerName: 'Customer 1', selectedColors: ['Charcoal', 'Green'], totalPieces: 100 },
      { id: 'CUST-002', customerName: 'Customer 2', selectedColors: ['Charcoal', 'Green'], totalPieces: 100 }
    ],
    fabricConsumptions: [
      {
        key: 'Kurta_Charcoal',
        articleName: 'Kurta',
        articleCode: 'KURTA',
        fabricQuality: 'Desizer Flex',
        width: '—',
        colorName: 'Charcoal',
        colorHex: '#333333',
        dyedRate: 0.00,
        shrinkPct: 6,
        pcs: 100
      },
      {
        key: 'Kurta_Green',
        articleName: 'Kurta',
        articleCode: 'KURTA',
        fabricQuality: 'Desizer Flex',
        width: '—',
        colorName: 'Green',
        colorHex: '#228B22',
        dyedRate: 0.00,
        shrinkPct: 6,
        pcs: 100
      },
      {
        key: 'Pant_Charcoal',
        articleName: 'Pant',
        articleCode: 'PANT',
        fabricQuality: 'Chanderi Silk',
        width: '—',
        colorName: 'Charcoal',
        colorHex: '#333333',
        dyedRate: 0.00,
        shrinkPct: 3,
        pcs: 100
      },
      {
        key: 'Pant_Green',
        articleName: 'Pant',
        articleCode: 'PANT',
        fabricQuality: 'Chanderi Silk',
        width: '—',
        colorName: 'Green',
        colorHex: '#228B22',
        dyedRate: 0.00,
        shrinkPct: 3,
        pcs: 100
      }
    ],
    createdAt: '2026-10-12 10:00 AM'
  },
  {
    id: 'ORD-2026-001',
    styleName: 'Ikkat Black Kurta Set',
    orderDate: '2026-10-09',
    expectedDelivery: '2026-11-15',
    priority: 'High',
    sizeSeriesId: 'SER-ALPHA',
    sizeSeriesName: 'Alphabetic Series',
    status: 'Confirmed',
    stage: 'Fabric Dyeing in Progress',
    totalGarments: 1100,
    totalFabricGreige: 2460.5,
    totalFabricDyed: 2100.0,
    estimatedCost: 88500.0,
    createdBy: 'Saksham Garg',
    createdAt: '2026-10-09 11:30 AM',
    tracking: {
      fabricDyeing: { status: 'In Progress', sentDate: '2026-10-09', expectedReturn: '2026-10-18', metersSent: 2460.5 },
      grn: { totalReceived: 1, status: 'Bale Entry Verified' },
      qc: { totalChecks: 1, result: 'Passed (Grade A)' }
    },
    articles: [
      {
        id: 'ART-001',
        name: 'Kurta',
        avgGarmentLength: 42.5,
        numberOfFabricPieces: 1,
        fabrics: [
          { pieceLabel: 'Main Body', fabricId: 'FAB-001', fabricName: '100/100 Mulmul', width: '44"', shrinkagePercent: 4.0, bufferPercent: 2.0, fabricRate: 28.5, dyedRate: 42.0 }
        ]
      },
      {
        id: 'ART-002',
        name: 'Pant',
        avgGarmentLength: 38.0,
        numberOfFabricPieces: 1,
        fabrics: [
          { pieceLabel: 'Pant Leg', fabricId: 'FAB-002', fabricName: '2.40/20s CF', width: '47"', shrinkagePercent: 3.5, bufferPercent: 2.0, fabricRate: 35.0, dyedRate: 52.0 }
        ]
      }
    ],
    customers: [
      { id: 'CUST-001', name: 'Manyavar Trends Retail', assignedArticles: ['Kurta', 'Pant'] },
      { id: 'CUST-002', name: 'FabIndia Lifestyle Hub', assignedArticles: ['Kurta'] }
    ],
    colors: ['Charcoal', 'Green'],
    matrices: [
      {
        groupName: 'Kurta & Pant Matching Pair',
        isUniform: true,
        ratioUsed: true,
        ratioString: '1:2:2:1',
        baseQuantity: 100,
        quantities: {
          'Charcoal': { S: 100, M: 200, L: 200, XL: 100, Total: 600 },
          'Green': { S: 80, M: 160, L: 160, XL: 100, Total: 500 }
        }
      }
    ],
    fabricConsumptions: [
      {
        articleName: 'Kurta',
        fabricName: '100/100 Mulmul',
        colorName: 'Charcoal',
        width: '44"',
        consumptionPerGarment: 1.50,
        pieces: 600,
        shrinkPercent: 4.0,
        totalDyed: 900.0,
        totalGreige: 954.7,
        fabricRate: 28.5,
        dyedRate: 42.0
      },
      {
        articleName: 'Kurta',
        fabricName: '100/100 Mulmul',
        colorName: 'Green',
        width: '44"',
        consumptionPerGarment: 1.50,
        pieces: 500,
        shrinkPercent: 4.0,
        totalDyed: 750.0,
        totalGreige: 795.6,
        fabricRate: 28.5,
        dyedRate: 42.0
      },
      {
        articleName: 'Pant',
        fabricName: '2.40/20s CF',
        colorName: 'Charcoal',
        width: '47"',
        consumptionPerGarment: 1.20,
        pieces: 600,
        shrinkPercent: 3.5,
        totalDyed: 720.0,
        totalGreige: 760.3,
        fabricRate: 35.0,
        dyedRate: 52.0
      }
    ],
    accessories: [
      {
        category: 'Buttons',
        varietyName: 'Coconut Natural Buttons (18L)',
        unit: 'Piece',
        appliesTo: ['Kurta'],
        rows: [
          {
            article: 'Kurta',
            articleColor: 'All colours',
            totalGarments: 1100,
            placement: '',
            accessoryColor: '',
            size: '',
            source: '',
            reqPerPiece: '',
            extraPerPack: '',
            bufferPercent: '',
            totalQuantity: 0
          }
        ]
      }
    ]
  }
];

// Helper functions for LocalStorage Persistence
export const getStoredData = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return fallback;
};

export const setStoredData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
};
