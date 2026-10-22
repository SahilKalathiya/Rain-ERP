// =========================================================================
// Rain Drop ERP - Sales Order & Master Data Store (Local & Seed Data)
// Route 1 - Sales Order Masters & Order Detail Form Module
// =========================================================================

export const initialCustomers = [];

export const initialColors = [
  { id: 'COL-001', name: 'Charcoal', hex: '#333333', hexCode: '#333333', pantone: '19-4008', pantoneCode: '19-4008', category: 'Dark', quarterTag: 'Q1', isTrending: true, active: true },
  { id: 'COL-002', name: 'Green', hex: '#228B22', hexCode: '#228B22', pantone: '18-6030', pantoneCode: '18-6030', category: 'Primary', quarterTag: 'Q1', isTrending: true, active: true },
  { id: 'COL-003', name: 'Navy Blue', hex: '#000080', hexCode: '#000080', pantone: '19-3832', pantoneCode: '19-3832', category: 'Dark', quarterTag: 'Q1', isTrending: true, active: true },
  { id: 'COL-004', name: 'Sea Green', hex: '#2E8B57', hexCode: '#2E8B57', pantone: '16-5418', pantoneCode: '16-5418', category: 'Cool', quarterTag: 'Q1', isTrending: false, active: true },
  { id: 'COL-005', name: 'Royal Blue', hex: '#4169E1', hexCode: '#4169E1', pantone: '19-4052', pantoneCode: '19-4052', category: 'Primary', quarterTag: 'Q1', isTrending: true, active: true },
  { id: 'COL-006', name: 'Ivory', hex: '#FFFFF0', hexCode: '#FFFFF0', pantone: '11-0601', pantoneCode: '11-0601', category: 'Pastel', quarterTag: 'Q2', isTrending: true, active: true },
  { id: 'COL-007', name: 'Lavender', hex: '#E6E6FA', hexCode: '#E6E6FA', pantone: '14-3907', pantoneCode: '14-3907', category: 'Pastel', quarterTag: 'Q2', isTrending: false, active: true },
  { id: 'COL-008', name: 'Pastel Red', hex: '#FF6961', hexCode: '#FF6961', pantone: '16-1546', pantoneCode: '16-1546', category: 'Pastel', quarterTag: 'Q2', isTrending: false, active: true },
  { id: 'COL-009', name: 'White', hex: '#FFFFFF', hexCode: '#FFFFFF', pantone: '11-0601', pantoneCode: '11-0601', category: 'Neutral', quarterTag: 'Q2', isTrending: true, active: true },
  { id: 'COL-010', name: 'Watermelon', hex: '#FC6C85', hexCode: '#FC6C85', pantone: '16-1735', pantoneCode: '16-1735', category: 'Pastel', quarterTag: 'Q2', isTrending: true, active: true },
  { id: 'COL-011', name: 'Jamun', hex: '#4B0082', hexCode: '#4B0082', pantone: '19-3518', pantoneCode: '19-3518', category: 'Dark', quarterTag: 'Q3', isTrending: true, active: true },
  { id: 'COL-012', name: 'Rama Green', hex: '#20B2AA', hexCode: '#20B2AA', pantone: '16-5121', pantoneCode: '16-5121', category: 'Cool', quarterTag: 'Q3', isTrending: true, active: true },
  { id: 'COL-013', name: 'Teal', hex: '#008080', hexCode: '#008080', pantone: '19-4916', pantoneCode: '19-4916', category: 'Dark', quarterTag: 'Q3', isTrending: false, active: true },
  { id: 'COL-014', name: 'Yellow', hex: '#FFD700', hexCode: '#FFD700', pantone: '13-0858', pantoneCode: '13-0858', category: 'Primary', quarterTag: 'Q3', isTrending: false, active: true },
  { id: 'COL-015', name: 'Maroon', hex: '#800000', hexCode: '#800000', pantone: '19-1528', pantoneCode: '19-1528', category: 'Dark', quarterTag: 'Q4', isTrending: true, active: true },
  { id: 'COL-016', name: 'Rust', hex: '#B7410E', hexCode: '#B7410E', pantone: '18-1248', pantoneCode: '18-1248', category: 'Warm', quarterTag: 'Q4', isTrending: true, active: true },
  { id: 'COL-017', name: 'Rust Light', hex: '#C86D51', hexCode: '#C86D51', pantone: '17-1444', pantoneCode: '17-1444', category: 'Warm', quarterTag: 'Q4', isTrending: true, active: true },
  { id: 'COL-018', name: 'Wine', hex: '#722F37', hexCode: '#722F37', pantone: '19-1815', pantoneCode: '19-1815', category: 'Dark', quarterTag: 'Q4', isTrending: true, active: true },
  { id: 'COL-019', name: 'Black', hex: '#111827', hexCode: '#111827', pantone: '19-4008', pantoneCode: '19-4008', category: 'Neutral', quarterTag: 'Q4', isTrending: true, active: true },
];

export const initialArticles = [];

export const initialSizeSeries = [];

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

export const getStoredColorsMaster = () => {
  let stored = getStoredData('erp_colors_master_v1', null);
  if (!Array.isArray(stored) || stored.length === 0) {
    stored = getStoredData('raindrop_colors_v1', null);
  }
  const source = (Array.isArray(stored) && stored.length > 0) ? stored : initialColors;
  return source.map((c, idx) => ({
    id: c.id || `COL-${String(idx + 1).padStart(3, '0')}`,
    name: c.name || c.colorName || '',
    hex: c.hexCode || c.hex || '#333333',
    hexCode: c.hexCode || c.hex || '#333333',
    pantone: c.pantoneCode || c.pantone || '',
    pantoneCode: c.pantoneCode || c.pantone || '',
    category: c.category || 'Primary',
    quarterTag: c.quarterTag || 'Q1',
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
