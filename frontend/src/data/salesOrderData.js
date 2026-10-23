// =========================================================================
// Rain Drop ERP - Sales Order & Master Data Store (Local & Seed Data)
// Route 1 - Sales Order Masters & Order Detail Form Module
// =========================================================================

export const initialCustomers = [];

export const initialColors = [];

export const initialArticles = [];

export const DEFAULT_SIZE_SERIES = [
  {
    id: 'SER-001',
    name: 'Alphabetic',
    displayOrder: 1,
    active: true,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
    sizeDetails: [
      { size: 'XS', label: 'Extra Small' },
      { size: 'S', label: 'Small' },
      { size: 'M', label: 'Medium' },
      { size: 'L', label: 'Large' },
      { size: 'XL', label: 'Extra Large' },
      { size: 'XXL', label: 'Double Extra Large' },
      { size: '3XL', label: 'Triple Extra Large' }
    ],
    sizeRecords: [
      { id: 'SZ-SER-001-01', seriesId: 'SER-001', sizeName: 'XS', displayName: 'Extra Small', description: 'Extra Small' },
      { id: 'SZ-SER-001-02', seriesId: 'SER-001', sizeName: 'S', displayName: 'Small', description: 'Small' },
      { id: 'SZ-SER-001-03', seriesId: 'SER-001', sizeName: 'M', displayName: 'Medium', description: 'Medium' },
      { id: 'SZ-SER-001-04', seriesId: 'SER-001', sizeName: 'L', displayName: 'Large', description: 'Large' },
      { id: 'SZ-SER-001-05', seriesId: 'SER-001', sizeName: 'XL', displayName: 'Extra Large', description: 'Extra Large' },
      { id: 'SZ-SER-001-06', seriesId: 'SER-001', sizeName: 'XXL', displayName: 'Double Extra Large', description: 'Double Extra Large' },
      { id: 'SZ-SER-001-07', seriesId: 'SER-001', sizeName: '3XL', displayName: 'Triple Extra Large', description: 'Triple Extra Large' }
    ]
  },
  {
    id: 'SER-002',
    name: 'Numeric',
    displayOrder: 2,
    active: true,
    sizes: ['28', '30', '32', '34', '36', '38', '40', '42'],
    sizeDetails: [
      { size: '28', label: 'Size 28' },
      { size: '30', label: 'Size 30' },
      { size: '32', label: 'Size 32' },
      { size: '34', label: 'Size 34' },
      { size: '36', label: 'Size 36' },
      { size: '38', label: 'Size 38' },
      { size: '40', label: 'Size 40' },
      { size: '42', label: 'Size 42' }
    ],
    sizeRecords: [
      { id: 'SZ-SER-002-01', seriesId: 'SER-002', sizeName: '28', displayName: 'Size 28', description: 'Size 28' },
      { id: 'SZ-SER-002-02', seriesId: 'SER-002', sizeName: '30', displayName: 'Size 30', description: 'Size 30' },
      { id: 'SZ-SER-002-03', seriesId: 'SER-002', sizeName: '32', displayName: 'Size 32', description: 'Size 32' },
      { id: 'SZ-SER-002-04', seriesId: 'SER-002', sizeName: '34', displayName: 'Size 34', description: 'Size 34' },
      { id: 'SZ-SER-002-05', seriesId: 'SER-002', sizeName: '36', displayName: 'Size 36', description: 'Size 36' },
      { id: 'SZ-SER-002-06', seriesId: 'SER-002', sizeName: '38', displayName: 'Size 38', description: 'Size 38' },
      { id: 'SZ-SER-002-07', seriesId: 'SER-002', sizeName: '40', displayName: 'Size 40', description: 'Size 40' },
      { id: 'SZ-SER-002-08', seriesId: 'SER-002', sizeName: '42', displayName: 'Size 42', description: 'Size 42' }
    ]
  }
];

export const initialSizeSeries = DEFAULT_SIZE_SERIES;

export const initialAccessoryMasters = [];

export const initialSalesOrders = [];

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
  return getStoredData('erp_accessories_master_v1', initialAccessoryMasters);
};

const LEGACY_MOCK_NAMES = [
  'charcoal', 'green', 'navy blue', 'sea green', 'royal blue', 'ivory',
  'lavender', 'pastel red', 'white', 'watermelon', 'jamun', 'rama green',
  'teal', 'yellow', 'maroon', 'rust', 'rust light', 'wine', 'black'
];

export const getStoredColorsMaster = () => {
  // One-time cleanup for pre-seeded mock colors so Color Master accurately reflects user data
  try {
    const cleaned = localStorage.getItem('erp_colors_cleared_mock_v2');
    if (!cleaned) {
      const existing = getStoredData('erp_colors_master_v1', null);
      if (Array.isArray(existing) && existing.length > 0) {
        const isPureMock = existing.every(c =>
          LEGACY_MOCK_NAMES.includes((c.name || '').toLowerCase().trim())
        );
        if (isPureMock) {
          localStorage.setItem('erp_colors_master_v1', JSON.stringify([]));
          localStorage.setItem('raindrop_colors_v1', JSON.stringify([]));
        }
      }
      localStorage.setItem('erp_colors_cleared_mock_v2', 'true');
    }
  } catch (e) {}

  let stored = getStoredData('erp_colors_master_v1', null);
  if (stored === null) {
    stored = getStoredData('raindrop_colors_v1', null);
  }
  const source = Array.isArray(stored) ? stored : (initialColors || []);
  return source.map((c, idx) => ({
    id: c.id || `COL-${String(idx + 1).padStart(3, '0')}`,
    name: c.name || c.colorName || '',
    hex: c.hexCode || c.hex || '#333333',
    hexCode: c.hexCode || c.hex || '#333333',
    pantone: c.pantoneCode || c.pantone || '',
    pantoneCode: c.pantoneCode || c.pantone || '',
    category: c.category || 'Primary',
    quarterTag: c.quarterTag || 'All Season',
    isTrending: Boolean(c.isTrending),
    active: c.active !== false
  }));
};

export const setStoredColorsMaster = (colorsList) => {
  setStoredData('erp_colors_master_v1', colorsList);
  setStoredData('raindrop_colors_v1', colorsList);
  try {
    window.dispatchEvent(new Event('erp_colors_updated'));
    window.dispatchEvent(new Event('raindrop_colors_updated'));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}
};

// =========================================================================
// Section 8: New Masters for Threads (Requirements Document Pages 14-15)
// =========================================================================

// 8.1 Thread Sizes Master (Packaging & Units)
export const initialThreadSizes = [];

export const getStoredThreadSizes = () => {
  return getStoredData('erp_thread_sizes_v1', initialThreadSizes);
};

export const setStoredThreadSizes = (data) => {
  setStoredData('erp_thread_sizes_v1', data);
};

// 8.2 Thread Brand & Color Code Master
export const initialThreadBrandColors = [];

export const getStoredThreadBrandColors = () => {
  return getStoredData('erp_thread_brand_colors_v1', initialThreadBrandColors);
};

export const setStoredThreadBrandColors = (data) => {
  setStoredData('erp_thread_brand_colors_v1', data);
};
