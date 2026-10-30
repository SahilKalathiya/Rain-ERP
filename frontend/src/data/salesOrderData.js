// =========================================================================
// Rain Drop ERP - Sales Order & Master Data Store (Local & Seed Data)
// Route 1 - Sales Order Masters & Order Detail Form Module
// =========================================================================

export const initialCustomers = [];

export const initialColors = [];

export const initialArticles = [];

export const DEFAULT_SIZE_SERIES = [];

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
  const data = getStoredData('erp_accessories_master_v1', initialAccessoryMasters);
  if (Array.isArray(data)) {
    return data.map(item => {
      let current = item;
      if (current && current.category && !['Thread'].includes(current.category) && current.threadPattern) {
        const { threadPattern, ...rest } = current;
        current = rest;
      }
      if (current && ['Lace', 'Laces'].includes(current.category) && current.piecesPerUnit !== undefined) {
        const { piecesPerUnit, ...rest } = current;
        current = rest;
      }
      return current;
    });
  }
  return data;
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
