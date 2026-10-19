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
  // Buttons Category (Matching Image 2 Specification)
  {
    id: 'ACC-BTN-01',
    name: 'Coconut',
    category: 'Buttons',
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: '',
    hsnCode: '',
    active: true,
    sizes: [],
    colors: [],
    buttonSizes: '',
    buttonColors: ''
  },
  {
    id: 'ACC-BTN-02',
    name: 'Coconut Button',
    category: 'Buttons',
    subType: 'Coconut',
    size: '',
    color: '',
    sizes: [],
    colors: [],
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: '',
    hsnCode: '',
    active: true
  },
  {
    id: 'ACC-BTN-03',
    name: 'Embroidered',
    category: 'Buttons',
    size: '',
    sizes: [],
    colors: [],
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: '',
    hsnCode: '',
    active: true
  },
  {
    id: 'ACC-BTN-04',
    name: 'Eyelet',
    category: 'Buttons',
    size: '',
    sizes: [],
    color: '',
    colors: [],
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: '',
    hsnCode: '',
    active: true
  },
  {
    id: 'ACC-BTN-05',
    name: 'Eyelet Test',
    category: 'Buttons',
    sizes: [],
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: '',
    hsnCode: '',
    active: true
  },
  {
    id: 'ACC-BTN-06',
    name: 'Gold Eyelet',
    category: 'Buttons',
    size: '',
    sizes: [],
    color: '',
    colors: [],
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: '',
    hsnCode: '',
    active: true
  },
  {
    id: 'ACC-BTN-07',
    name: 'MOP',
    category: 'Buttons',
    sizes: [],
    colors: [],
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: '',
    hsnCode: '',
    active: true
  },
  {
    id: 'ACC-BTN-08',
    name: 'Metal 2 hole',
    category: 'Buttons',
    sizes: [],
    colors: [],
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: '',
    hsnCode: '',
    active: true
  },
  {
    id: 'ACC-BTN-09',
    name: 'Mould',
    category: 'Buttons',
    sizes: [],
    colors: [],
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: '',
    hsnCode: '',
    active: true
  },
  {
    id: 'ACC-BTN-10',
    name: 'Pignose',
    category: 'Buttons',
    size: '',
    sizes: [],
    color: '',
    colors: [],
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: '',
    hsnCode: '',
    active: true
  },
  {
    id: 'ACC-BTN-11',
    name: 'Plastic',
    category: 'Buttons',
    sizes: [],
    colors: [],
    unit: 'Piece',
    piecesPerUnit: 1,
    maxBuffer: '',
    hsnCode: '',
    active: true
  },
  // Lace Category
  {
    id: 'ACC-LAC-01',
    name: 'Cotton Crochet 18mm',
    category: 'Lace',
    unit: 'Meter',
    piecesPerUnit: 1,
    laceSize: '18 mm',
    defaultShrinkage: 3.0,
    maxBuffer: '',
    hsnCode: '',
    description: '18mm cotton crochet lace border',
    active: true
  },
  {
    id: 'ACC-LAC-02',
    name: 'Zari Border 2 inch',
    category: 'Lace',
    unit: 'Meter',
    piecesPerUnit: 1,
    laceSize: '2 inch',
    defaultShrinkage: 1.0,
    maxBuffer: '',
    hsnCode: '',
    description: '2 inch metallic zari decorative border',
    active: true
  },
  {
    id: 'ACC-LAC-03',
    name: 'Gota Patti Lace',
    category: 'Lace',
    unit: 'Meter',
    piecesPerUnit: 1,
    laceSize: '1 inch',
    defaultShrinkage: 0,
    maxBuffer: '',
    hsnCode: '',
    description: 'Gold gota patti lace ribbon',
    active: true
  },
  {
    id: 'ACC-LAC-04',
    name: 'Chemical Lace',
    category: 'Lace',
    unit: 'Meter',
    piecesPerUnit: 1,
    laceSize: '1.5 inch',
    defaultShrinkage: 2.0,
    maxBuffer: '',
    hsnCode: '',
    description: 'Detailed chemical cutwork lace',
    active: true
  },

  // Tassels Category
  {
    id: 'ACC-TAS-01',
    name: 'Ready Made Silk Latkan',
    category: 'Tassels',
    tasselType: 'Ready Made',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: '2.5 inch',
    maxBuffer: '',
    hsnCode: '',
    description: 'Readymade silk thread latkan with golden beads',
    active: true
  },
  {
    id: 'ACC-TAS-02',
    name: 'Job Work Handmade Tassel',
    category: 'Tassels',
    tasselType: 'Job Work',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: '3 inch',
    threadConsumption: 15,
    maxBuffer: '',
    hsnCode: '',
    description: 'Handcrafted job work tassel for garment dori',
    active: true
  },
  {
    id: 'ACC-TAS-03',
    name: 'Beaded Latkan',
    category: 'Tassels',
    tasselType: 'Ready Made',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: '2 inch',
    maxBuffer: '',
    hsnCode: '',
    description: 'Glass bead & pearl hanging latkan',
    active: true
  },
  {
    id: 'ACC-TAS-04',
    name: 'Cotton Thread Tassel',
    category: 'Tassels',
    tasselType: 'Job Work',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: '2.5 inch',
    threadConsumption: 20,
    maxBuffer: '',
    hsnCode: '',
    description: 'Cotton fringed tassel for dupattas & kurtas',
    active: true
  },

  // Thread Category (Sections 7.1 - 7.5)
  // Thread Category (Sections 7.1 - 7.5) - Clean defaults per PDF
  {
    id: 'ACC-THR-01',
    name: 'Kantha Pattern Thread',
    category: 'Thread',
    threadSize: '',
    unit: 'Cone',
    piecesPerUnit: 1,
    threadPattern: 'Kantha',
    threadPerStitch: 15, // Explicit PDF Default (Page 11 & 12)
    globalThreadMetric: 15, // Explicit PDF Default (Page 12)
    boxes: [],
    coneSizes: [],
    placements: [],
    articlePlacements: [],
    maxBuffer: '',
    hsnCode: '',
    description: '',
    active: true
  },
  {
    id: 'ACC-THR-02',
    name: 'Couching Pattern Thread',
    category: 'Thread',
    threadSize: '',
    unit: 'Cone',
    piecesPerUnit: 1,
    threadPattern: 'Couching',
    threadPerStitch: 15, // Explicit PDF Default (Page 11 & 12)
    globalThreadMetric: 15, // Explicit PDF Default (Page 12)
    boxes: [],
    coneSizes: [],
    placements: [],
    articlePlacements: [],
    maxBuffer: '',
    hsnCode: '',
    description: '',
    active: true
  },
  {
    id: 'ACC-THR-03',
    name: 'Standard Stitching Thread',
    category: 'Thread',
    threadSize: '',
    unit: 'Reel',
    piecesPerUnit: 1,
    threadPattern: 'Stitching',
    threadPerPiece: 60, // Explicit PDF Default (Page 13)
    boxes: [],
    coneSizes: [],
    stitchingArticles: [],
    consumptionPer100Pcs: {},
    maxBuffer: '',
    hsnCode: '',
    description: '',
    active: true
  },
  {
    id: 'ACC-THR-04',
    name: 'Overlock Thread',
    category: 'Thread',
    threadSize: '',
    unit: 'Cone',
    piecesPerUnit: 1,
    threadPattern: 'Stitching',
    threadPerPiece: 60, // Explicit PDF Default (Page 13)
    boxes: [],
    coneSizes: [],
    stitchingArticles: [],
    consumptionPer100Pcs: {},
    maxBuffer: '',
    hsnCode: '',
    description: '',
    active: true
  },

  // Dori Category
  {
    id: 'ACC-DOR-01',
    name: 'Matching Fabric Dori',
    category: 'Dori',
    unit: 'Meter',
    piecesPerUnit: 1,
    doriRequiredSize: '40 cm',
    maxBuffer: '',
    hsnCode: '',
    description: 'Self fabric turned dori for pajama waist & necklines',
    active: true
  },
  {
    id: 'ACC-DOR-02',
    name: 'Cotton Braided Dori',
    category: 'Dori',
    unit: 'Meter',
    piecesPerUnit: 1,
    doriRequiredSize: '45 cm',
    maxBuffer: '',
    hsnCode: '',
    description: 'Braided cotton cord for waist tie-ups',
    active: true
  },
  {
    id: 'ACC-DOR-03',
    name: 'Metallic Zari Dori',
    category: 'Dori',
    unit: 'Meter',
    piecesPerUnit: 1,
    doriRequiredSize: '40 cm',
    maxBuffer: '',
    hsnCode: '',
    description: 'Twisted metallic gold & silver cord',
    active: true
  },
  {
    id: 'ACC-DOR-04',
    name: 'Elasticated Dori',
    category: 'Dori',
    unit: 'Meter',
    piecesPerUnit: 1,
    doriRequiredSize: '35 cm',
    maxBuffer: '',
    hsnCode: '',
    description: 'Stretch cord for comfortable gathers & drawstrings',
    active: true
  },

  // Elastic Category
  {
    id: 'ACC-ELA-01',
    name: '1 inch Woven Waistband Elastic',
    category: 'Elastic',
    unit: 'Meter',
    piecesPerUnit: 1,
    requiredSize: '1 inch',
    fabricConsumption: 0.85,
    maxBuffer: '',
    hsnCode: '',
    description: '1 inch non-roll woven elastic band for pants & pajamas',
    active: true
  },
  {
    id: 'ACC-ELA-02',
    name: '1.5 inch Knitted Elastic',
    category: 'Elastic',
    unit: 'Meter',
    piecesPerUnit: 1,
    requiredSize: '1.5 inch',
    fabricConsumption: 0.90,
    maxBuffer: '',
    hsnCode: '',
    description: '1.5 inch soft knitted waistband elastic',
    active: true
  },
  {
    id: 'ACC-ELA-03',
    name: '0.5 inch Braided Elastic',
    category: 'Elastic',
    unit: 'Meter',
    piecesPerUnit: 1,
    requiredSize: '0.5 inch',
    fabricConsumption: 0.50,
    maxBuffer: '',
    hsnCode: '',
    description: '0.5 inch elastic for sleeve cuffs & necklines',
    active: true
  },
  {
    id: 'ACC-ELA-04',
    name: 'Cord Elastic 3mm',
    category: 'Elastic',
    unit: 'Meter',
    piecesPerUnit: 1,
    requiredSize: '3mm',
    fabricConsumption: 0.40,
    maxBuffer: '',
    hsnCode: '',
    description: 'Round thin elastic cord for loops & buttons',
    active: true
  },

  // Beads & Sequins Category
  {
    id: 'ACC-BDS-01',
    name: 'Gold Sequin 5mm',
    category: 'Beads & Sequins',
    unit: 'Piece',
    piecesPerUnit: 1,
    requiredSize: '5mm',
    maxBuffer: '',
    hsnCode: '',
    description: '5mm shiny gold flat sequins for embroidery',
    active: true
  },
  {
    id: 'ACC-BDS-02',
    name: 'Moti / Pearl Beads 4mm',
    category: 'Beads & Sequins',
    unit: 'Piece',
    piecesPerUnit: 1,
    requiredSize: '4mm',
    maxBuffer: '',
    hsnCode: '',
    description: 'Off-white round glass pearls for neck work',
    active: true
  },
  {
    id: 'ACC-BDS-03',
    name: 'Silver Cutdana Beads',
    category: 'Beads & Sequins',
    unit: 'Piece',
    piecesPerUnit: 1,
    requiredSize: '2mm',
    maxBuffer: '',
    hsnCode: '',
    description: 'Glass cutdana bugle beads for hand embellishments',
    active: true
  },
  {
    id: 'ACC-BDS-04',
    name: 'Acrylic Mirror Sequins',
    category: 'Beads & Sequins',
    unit: 'Piece',
    piecesPerUnit: 1,
    requiredSize: '10mm',
    maxBuffer: '',
    hsnCode: '',
    description: 'Round mirror sequins for festive kurtas',
    active: true
  },

  // Hook Category
  {
    id: 'ACC-HOK-01',
    name: 'Hook & Eye (Silver)',
    category: 'Hook',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: 'Standard',
    maxBuffer: '',
    hsnCode: '',
    description: 'Silver nickel plated hook and eye fasteners',
    active: true
  },
  {
    id: 'ACC-HOK-02',
    name: 'Pant Hook Metal',
    category: 'Hook',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: 'Standard',
    maxBuffer: '',
    hsnCode: '',
    description: 'Steel waistband clasps for trousers & pajamas',
    active: true
  },
  {
    id: 'ACC-HOK-03',
    name: 'Collar Hook & Eye',
    category: 'Hook',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: 'Small',
    maxBuffer: '',
    hsnCode: '',
    description: 'Small discreet hook for Nehru collar closure',
    active: true
  },
  {
    id: 'ACC-HOK-04',
    name: 'Heavy Duty Coat Hook',
    category: 'Hook',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: 'Large',
    maxBuffer: '',
    hsnCode: '',
    description: 'Reinforced hook for sherwanis & jackets',
    active: true
  },

  // Zipper Category
  {
    id: 'ACC-ZIP-01',
    name: 'Concealed Zipper [8 inch]',
    category: 'Zipper',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: '8 inch',
    maxBuffer: '',
    hsnCode: '',
    description: '8 inch invisible nylon zip for side plackets',
    active: true
  },
  {
    id: 'ACC-ZIP-02',
    name: 'Metal Zipper [12 inch]',
    category: 'Zipper',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: '12 inch',
    maxBuffer: '',
    hsnCode: '',
    description: 'Antique brass metal teeth zipper for jackets',
    active: true
  },
  {
    id: 'ACC-ZIP-03',
    name: 'Nylon Coil Zipper [7 inch]',
    category: 'Zipper',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: '7 inch',
    maxBuffer: '',
    hsnCode: '',
    description: '7 inch standard nylon zipper for pocket closures',
    active: true
  },
  {
    id: 'ACC-ZIP-04',
    name: 'Invisible Zipper 16 inch',
    category: 'Zipper',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: '16 inch',
    maxBuffer: '',
    hsnCode: '',
    description: '16 inch concealed back zip for women tops & kurtas',
    active: true
  },

  // Label Category
  {
    id: 'ACC-LBL-01',
    name: 'Brand Main Woven Label',
    category: 'Label',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: 'Standard',
    maxBuffer: '',
    hsnCode: '',
    description: 'High-density woven neck label with brand logo',
    active: true
  },
  {
    id: 'ACC-LBL-02',
    name: 'Wash Care Satin Label',
    category: 'Label',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: 'Standard',
    maxBuffer: '',
    hsnCode: '',
    description: 'Printed satin care & composition instruction label',
    active: true
  },
  {
    id: 'ACC-LBL-03',
    name: 'Size Pip Label',
    category: 'Label',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: 'Standard',
    maxBuffer: '',
    hsnCode: '',
    description: 'Small folded size indicator label (XS, S, M, L, XL, XXL)',
    active: true
  },
  {
    id: 'ACC-LBL-04',
    name: 'Country of Origin / MRP Tag',
    category: 'Label',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: 'Standard',
    maxBuffer: '',
    hsnCode: '',
    description: 'Cardboard paper price & compliance barcode hangtag',
    active: true
  },

  // Packaging Category
  {
    id: 'ACC-PKG-01',
    name: 'Polybag (12x15)',
    category: 'Packaging',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: '12x15',
    maxBuffer: '',
    hsnCode: '',
    description: '12x15 inch transparent self-adhesive garment polybag',
    active: true
  },
  {
    id: 'ACC-PKG-02',
    name: 'Butter Paper',
    category: 'Packaging',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: 'Standard',
    maxBuffer: '',
    hsnCode: '',
    description: 'Acid-free tissue paper for garment folding',
    active: true
  },
  {
    id: 'ACC-PKG-03',
    name: 'Hangtag with String',
    category: 'Packaging',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: 'Standard',
    maxBuffer: '',
    hsnCode: '',
    description: 'Premium branded card hangtag with cotton thread string',
    active: true
  },
  {
    id: 'ACC-PKG-04',
    name: 'Carton Box (5-Ply)',
    category: 'Packaging',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: '24x18x12',
    maxBuffer: '',
    hsnCode: '',
    description: 'Heavy duty corrugated shipping box for 50 pieces',
    active: true
  },

  // Other Category
  {
    id: 'ACC-OTH-01',
    name: 'Safety Pin',
    category: 'Other',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: 'Standard',
    maxBuffer: '',
    hsnCode: '',
    description: 'Rust-proof nickel steel safety pins for tag attachment',
    active: true
  },
  {
    id: 'ACC-OTH-02',
    name: 'Hanger Loop Tape',
    category: 'Other',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: 'Standard',
    maxBuffer: '',
    hsnCode: '',
    description: 'Thin satin ribbon tape for internal shoulder hanging loops',
    active: true
  },
  {
    id: 'ACC-OTH-03',
    name: 'Collar Stay Bone',
    category: 'Other',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: 'Standard',
    maxBuffer: '',
    hsnCode: '',
    description: 'Plastic insert bones to keep shirt/kurta collar firm',
    active: true
  },
  {
    id: 'ACC-OTH-04',
    name: 'Shoulder Pad (Cotton)',
    category: 'Other',
    unit: 'Piece',
    piecesPerUnit: 1,
    size: 'Standard',
    maxBuffer: '',
    hsnCode: '',
    description: 'Cotton padded inserts for structured blazers & sherwanis',
    active: true
  }
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

export const getStoredAccessoriesMaster = () => {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('erp_accessories_master_v1') : null;
    let list = saved ? JSON.parse(saved) : null;
    
    const buttonSeeds = initialAccessoryMasters.filter(a => a.category === 'Buttons');
    
    const genericOldIds = ['ACC-001', 'ACC-002', 'ACC-003', 'ACC-004', 'ACC-005', 'ACC-006', 'ACC-007', 'ACC-008', 'ACC-009', 'ACC-010', 'ACC-011', 'ACC-012'];
    const genericNames = ['Buttons', 'Lace', 'Tassels', 'Dori', 'Dori (Drawstring)', 'Thread', 'Elastic', 'Beads & Sequins', 'Hook', 'Zipper', 'Label', 'Packaging', 'Other'];

    if (!list || !Array.isArray(list) || list.length === 0) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('erp_accessories_master_v1', JSON.stringify(initialAccessoryMasters));
      }
      return [...initialAccessoryMasters];
    }

    // Filter out old generic placeholders
    list = list.filter(item => !(genericOldIds.includes(item.id) && genericNames.includes(item.name)));

    // Ensure all seed items are present in list
    initialAccessoryMasters.forEach(seed => {
      const idx = list.findIndex(m => m.id === seed.id || (m.category === seed.category && m.name.toLowerCase() === seed.name.toLowerCase()));
      if (idx === -1) {
        list.push(seed);
      } else {
        if (seed.category === 'Thread') {
          // Purge old prefilled dummy values from previous runs
          const hasOldDummySize = list[idx].threadSize === '40/2' || list[idx].threadSize === '30/2';
          const hasOldDummyBoxes = Array.isArray(list[idx].boxes) && list[idx].boxes.length > 0 && String(list[idx].boxes[0]?.metersPerReel) === '400';
          const hasOldDummyArticles = Array.isArray(list[idx].stitchingArticles) && list[idx].stitchingArticles.length === 2 && list[idx].stitchingArticles[0] === 'Kurta';
          list[idx] = {
            ...seed,
            ...list[idx],
            threadSize: hasOldDummySize ? '' : (list[idx].threadSize || ''),
            boxes: hasOldDummyBoxes ? [] : (list[idx].boxes || []),
            coneSizes: (list[idx].coneSizes && list[idx].coneSizes.length === 2 && list[idx].coneSizes[0] === '5000 m') ? [] : (list[idx].coneSizes || []),
            placements: (list[idx].placements && list[idx].placements.length >= 3 && list[idx].placements[0] === 'Sleeves') ? [] : (list[idx].placements || []),
            articlePlacements: (list[idx].articlePlacements && list[idx].articlePlacements[0]?.article === 'Kurta') ? [] : (list[idx].articlePlacements || []),
            stitchingArticles: hasOldDummyArticles ? [] : (list[idx].stitchingArticles || []),
            consumptionPer100Pcs: (list[idx].consumptionPer100Pcs && list[idx].consumptionPer100Pcs['Kurta'] === 6000) ? {} : (list[idx].consumptionPer100Pcs || {}),
            name: seed.name,
            category: seed.category,
            active: list[idx].active !== false
          };
        } else {
          list[idx] = {
            ...seed,
            ...list[idx],
            name: seed.name,
            category: seed.category,
            active: list[idx].active !== false
          };
        }
      }
    });

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('erp_accessories_master_v1', JSON.stringify(list));
    }
    return list;
  } catch (e) {
    return [...initialAccessoryMasters];
  }
};

// =========================================================================
// Section 8: New Masters for Threads (Requirements Document Pages 14-15)
// =========================================================================

// 8.1 Thread Sizes Master (Packaging & Units)
export const initialThreadSizes = [
  {
    id: 'TSZ-001',
    brandName: 'Coats India',
    packagingType: 'Reel',
    piecesPerBox: 15,
    threadLengthPerPiece: 20, // metres
    boxCapacity: 300,
    cones: 0,
    active: true
  },
  {
    id: 'TSZ-002',
    brandName: 'Vardhman',
    packagingType: 'Cone',
    piecesPerBox: 2,
    threadLengthPerPiece: 500, // metres
    boxCapacity: 1000,
    cones: 2,
    active: true
  },
  {
    id: 'TSZ-003',
    brandName: 'Madura Coats',
    packagingType: 'Cone',
    piecesPerBox: 1,
    threadLengthPerPiece: 1000, // metres
    boxCapacity: 1000,
    cones: 1,
    active: true
  },
  {
    id: 'TSZ-004',
    brandName: 'Astra Poly',
    packagingType: 'Box',
    piecesPerBox: 12,
    threadLengthPerPiece: 150, // metres
    boxCapacity: 1800,
    cones: 0,
    active: true
  }
];

export const getStoredThreadSizes = () => {
  return getStoredData('erp_thread_sizes_v1', initialThreadSizes);
};

export const setStoredThreadSizes = (data) => {
  setStoredData('erp_thread_sizes_v1', data);
};

// 8.2 Thread Brand & Color Code Master
export const initialThreadBrandColors = [
  {
    id: 'TBC-001',
    brandName: 'Coats Astra',
    colorNumber: '4001',
    colorCode: '#333333',
    active: true
  },
  {
    id: 'TBC-002',
    brandName: 'Coats Astra',
    colorNumber: '1002',
    colorCode: '#FFFFF0',
    active: true
  },
  {
    id: 'TBC-003',
    brandName: 'Vardhman Poly',
    colorNumber: '5023',
    colorCode: '#800000',
    active: true
  },
  {
    id: 'TBC-004',
    brandName: 'Madura Anchor',
    colorNumber: '7810',
    colorCode: '#FFD700',
    active: true
  },
  {
    id: 'TBC-005',
    brandName: 'Coats Epic',
    colorNumber: '2045',
    colorCode: '#228B22',
    active: true
  },
  {
    id: 'TBC-006',
    brandName: 'Coats Dual Duty',
    colorNumber: '6108',
    colorCode: '#000080',
    active: true
  }
];

export const getStoredThreadBrandColors = () => {
  return getStoredData('erp_thread_brand_colors_v1', initialThreadBrandColors);
};

export const setStoredThreadBrandColors = (data) => {
  setStoredData('erp_thread_brand_colors_v1', data);
};

