import React, { useState, useMemo, useEffect } from 'react';
import {
  initialCustomers,
  initialArticles,
  initialSizeSeries,
  getStoredData,
  setStoredData,
  getStoredColorsMaster,
  setStoredColorsMaster
} from '../../data/salesOrderData';
import { initialFabrics as procurementFabrics } from '../../data/procurementData';
import { api } from '../../services/api';
import CustomerMasterView from '../Masters/CustomerMasterView';
import ArticleMasterView from '../Masters/ArticleMasterView';
import FabricMasterView from '../Procurement/FabricMasterView';
import AddColorModal from '../Procurement/AddColorModal';

// Clean and normalize color palette, removing duplicates and ensuring seasonal metadata
export const deduplicateColors = (list) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const result = [];
  
  list.forEach((col, idx) => {
    if (!col || !col.name) return;
    const rawName = col.name.trim();
    const norm = rawName.toLowerCase();
    if (seen.has(norm)) return;
    seen.add(norm);

    let quarterTag = col.quarterTag || col.quarter || 'All Season';
    const isTrending = Boolean(col.isTrending);

    result.push({
      id: col.id || `COL-${String(idx + 1).padStart(3, '0')}`,
      name: rawName,
      hex: col.hex || col.hexCode || '#333333',
      hexCode: col.hex || col.hexCode || '#333333',
      pantone: (col.pantone || col.pantoneCode || '').trim(),
      category: col.category || 'Primary',
      quarterTag,
      isTrending,
      active: col.active !== false
    });
  });

  return result;
};

// Synchronize articles directly from Article Master (erp_articles_v1 / initialArticles)
export const loadSyncedArticles = () => {
  const stored = getStoredData('erp_articles_v1', null);
  const source = (Array.isArray(stored) && stored.length > 0) ? stored : initialArticles;
  return source.filter(a => a.active !== false).map((a, idx) => ({
    id: a.id || `ART-${idx + 1}`,
    name: a.name,
    emoji: a.icon || a.emoji || '👕',
    icon: a.icon || a.emoji || '👕',
    sortOrder: Number(a.sortOrder) || (idx + 1),
    active: a.active !== false,
    description: a.description || ''
  }));
};

// Prohibit dummy/fallback fabric names from ever showing up
const DUMMY_FABRIC_NAMES = ['suh cotton', '100/100 mulmul', '2.40/20s cf', '600s cambryc'];

export const filterRealFabrics = (list) => {
  if (!Array.isArray(list)) return [];
  return list.filter(f => {
    const q = (f?.qualityName || f?.quality || f?.name || '').toLowerCase().trim();
    return q && !DUMMY_FABRIC_NAMES.includes(q);
  });
};

// Preset Master Fabrics with genuine fabric master properties
const DEFAULT_FABRICS = [
  { id: 'FAB-001', quality: 'Grey Cotton Fabrics (100*100)', qualityName: 'Grey Cotton Fabrics (100*100)', type: 'Cotton', widths: ['44"', '58"'], shrinkage: 3.5, maxBuffer: 2.0, defRate: 50, dyedRate: 65, active: true },
  { id: 'FAB-002', quality: 'Rayon 14kg Liva', qualityName: 'Rayon 14kg Liva', type: 'Rayon', widths: ['44"', '48"', '58"'], shrinkage: 4.5, maxBuffer: 2.0, defRate: 58, dyedRate: 76, active: true },
  { id: 'FAB-003', quality: 'Cotton Cambric 60*60', qualityName: 'Cotton Cambric 60*60', type: 'Cotton', widths: ['44"', '58"'], shrinkage: 4.0, maxBuffer: 2.0, defRate: 55, dyedRate: 70, active: true },
  { id: 'FAB-004', quality: 'Modal Satin Premium', qualityName: 'Modal Satin Premium', type: 'Silk/Modal', widths: ['44"', '58"'], shrinkage: 2.0, maxBuffer: 1.5, defRate: 85, dyedRate: 110, active: true }
];

// Helper to capitalize the first character of each word (Title Case)
export const autoCapitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};
export const capitalizeWords = autoCapitalizeWords;

export default function OrderCreationWizard({ onSaveOrder, onCancel }) {
  // Master Data State
  const [masterSizeSeries, setMasterSizeSeries] = useState(() => {
    const stored = getStoredData('erp_size_series_v1', null);
    if (Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    return Array.isArray(initialSizeSeries) ? initialSizeSeries : [];
  });

  const getCleanSeriesName = (series) => {
    const n = (series?.name || series?.alias || '').toLowerCase().trim();
    if (n.includes('alpha') || n.includes('basic')) return 'Alpha';
    if (n.includes('num')) return 'Numeric';
    if (n.includes('mix')) return 'Mix Sizes';
    return series?.name || 'Alpha';
  };

  const normalizedMasterSizeSeries = useMemo(() => {
    const combined = [...masterSizeSeries];
    if (Array.isArray(initialSizeSeries) && initialSizeSeries.length > 0) {
      initialSizeSeries.forEach(initS => {
        const initClean = getCleanSeriesName(initS);
        if (!combined.some(s => getCleanSeriesName(s) === initClean || (s.id && s.id === initS.id))) {
          combined.push(initS);
        }
      });
    }
    const list = combined.map(s => ({
      ...s,
      name: s.name || getCleanSeriesName(s),
      displayName: s.name || getCleanSeriesName(s)
    }));
    const orderMap = { 'Alpha': 1, 'Alphabetic': 1, 'Numeric': 2, 'Mix Sizes': 3 };
    return list.sort((a, b) => (orderMap[a.name] || 99) - (orderMap[b.name] || 99));
  }, [masterSizeSeries]);
  const [showAllArticleTypes, setShowAllArticleTypes] = useState(false);
  const [articleTypes, setArticleTypes] = useState(() => loadSyncedArticles());
  const [fabrics, setFabrics] = useState(() => {
    let raw = getStoredData('raindrop_fabrics_v1', null);
    if (!Array.isArray(raw) || raw.length === 0) {
      raw = procurementFabrics;
    }
    const filtered = filterRealFabrics(raw);
    const finalFabrics = filtered.length > 0 ? filtered : filterRealFabrics(DEFAULT_FABRICS);
    return finalFabrics.map(f => ({
      ...f,
      quality: f.qualityName || f.quality || f.name || '',
      qualityName: f.qualityName || f.quality || f.name || '',
      type: f.fabricType || f.type || 'Cotton',
      widths: Array.isArray(f.widths) ? f.widths : (typeof f.widths === 'string' ? f.widths.split(',').map(w => w.trim()).filter(Boolean) : ['44"', '58"']),
      shrinkage: parseFloat(f.defaultShrinkage || f.shrinkage) || 3.5,
      maxBuffer: parseFloat(f.maxBuffer) || 2.0,
      defRate: parseFloat(f.fabricRate || f.defRate) || 50,
      dyedRate: parseFloat(f.dyedRate) || 65,
      active: f.active !== false
    }));
  });
  const [customers, setCustomers] = useState(() => getStoredData('erp_customers_v1', initialCustomers));
  const [masterColors, setMasterColors] = useState(() => {
    return deduplicateColors(getStoredColorsMaster());
  });
  const getCurrentQuarterTag = () => {
    const m = new Date().getMonth();
    if (m <= 2) return 'Q1';
    if (m <= 5) return 'Q2';
    if (m <= 8) return 'Q3';
    return 'Q4';
  };

  const [newlyAddedColorNames, setNewlyAddedColorNames] = useState(() => new Set());
  const [customerColorTab, setCustomerColorTab] = useState({});
  const [customerColorSearch, setCustomerColorSearch] = useState({});

  // Real-time synchronization with Article Master
  useEffect(() => {
    const handleArticlesSync = () => {
      setArticleTypes(loadSyncedArticles());
    };
    window.addEventListener('storage', handleArticlesSync);
    window.addEventListener('erp_articles_updated', handleArticlesSync);
    return () => {
      window.removeEventListener('storage', handleArticlesSync);
      window.removeEventListener('erp_articles_updated', handleArticlesSync);
    };
  }, []);

  // Real-time synchronization with Color Master
  useEffect(() => {
    const handleColorsSync = () => {
      const synced = getStoredColorsMaster();
      setMasterColors(deduplicateColors(synced));
    };
    window.addEventListener('storage', handleColorsSync);
    window.addEventListener('erp_colors_updated', handleColorsSync);
    window.addEventListener('raindrop_colors_updated', handleColorsSync);
    return () => {
      window.removeEventListener('storage', handleColorsSync);
      window.removeEventListener('erp_colors_updated', handleColorsSync);
      window.removeEventListener('raindrop_colors_updated', handleColorsSync);
    };
  }, []);

  // Real-time synchronization with Size Series Master
  useEffect(() => {
    const handleSizeSeriesSync = () => {
      const stored = getStoredData('erp_size_series_v1', null);
      if (Array.isArray(stored)) {
        setMasterSizeSeries(stored);
      }
    };
    window.addEventListener('storage', handleSizeSeriesSync);
    window.addEventListener('erp_size_series_updated', handleSizeSeriesSync);
    return () => {
      window.removeEventListener('storage', handleSizeSeriesSync);
      window.removeEventListener('erp_size_series_updated', handleSizeSeriesSync);
    };
  }, []);

  // Inline Modals State
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [activeCustomerIdxForNewCustomer, setActiveCustomerIdxForNewCustomer] = useState(0);
  const [showNewArticleModal, setShowNewArticleModal] = useState(false);
  const [showNewFabricModal, setShowNewFabricModal] = useState(false);
  const [newFabricData, setNewFabricData] = useState({ quality: '', type: '', widths: '', shrinkage: '', maxBuffer: '', rate: '', dyedRate: '' });
  const [activeFabricRowTarget, setActiveFabricRowTarget] = useState(null); // { artId, fi }
  const [showNewColorModal, setShowNewColorModal] = useState(false);
  const [newColorData, setNewColorData] = useState({ name: '', hex: '#000000', pantone: '', category: 'Dark' });
  const [activeCustomerIndexForNewColor, setActiveCustomerIndexForNewColor] = useState(0);

  // Copy Sizes Modal State
  const [copySizesModal, setCopySizesModal] = useState(null); // { custIdx, articleId, colorId, sourceConfig }

  // 1. Order Information (All fields empty, with placeholders)
  const [orderInfo, setOrderInfo] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return {
      orderId: `RD-${yy}${mm}-${rand}`,
      styleName: '', // empty placeholder
      orderDate: today.toISOString().split('T')[0],
      expectedDelivery: '', // empty placeholder
      priority: 'Normal'
    };
  });

  // 2. Added Articles State (empty initially)
  const [addedArticles, setAddedArticles] = useState([]);

  // 3. Customers & Orders State (empty initially until user clicks 1, 2, 3, 4, 5, 6)
  const [orderCustomers, setOrderCustomers] = useState([]);
  const [expandedCustomerIdx, setExpandedCustomerIdx] = useState(-1);

  // Load latest data from Fabric & Color masters
  useEffect(() => {
    async function loadMasters() {
      try {
        const fabRes = await api.getFabrics();
        if (fabRes && fabRes.success && Array.isArray(fabRes.data) && fabRes.data.length > 0) {
          const cleanApiData = filterRealFabrics(fabRes.data);
          const mapped = cleanApiData.map(f => ({
            id: f.id || Math.random(),
            quality: f.qualityName || f.quality || f.name || '',
            qualityName: f.qualityName || f.quality || f.name || '',
            type: f.fabricType || f.type || 'Cotton',
            widths: Array.isArray(f.widths) ? f.widths.map(w => (typeof w === 'string' && w.includes('"')) ? w : `${w}"`) : ['44"', '58"'],
            shrinkage: parseFloat(f.defaultShrinkage || f.shrinkage) || 3.5,
            maxBuffer: parseFloat(f.maxBuffer) || 2.0,
            defRate: parseFloat(f.fabricRate || f.defaultRate || f.defRate) || 50,
            dyedRate: parseFloat(f.dyedRate) || 65,
            active: f.active !== false
          }));

          setFabrics(prev => {
            const cleanPrev = filterRealFabrics(prev);
            // Keep only newly added fabrics from this session that aren't already in API and aren't dummies
            const userAdded = cleanPrev.filter(p => !mapped.some(m => (m.quality || '').toLowerCase() === (p.quality || '').toLowerCase()));
            const finalCombined = [...mapped, ...userAdded];
            try {
              localStorage.setItem('raindrop_fabrics_v1', JSON.stringify(finalCombined));
            } catch (e) {}
            return finalCombined;
          });
        }
      } catch (e) {}

      try {
        const colRes = await api.getColors();
        if (colRes && colRes.success && Array.isArray(colRes.data) && colRes.data.length > 0) {
          const mappedCol = colRes.data.map(c => ({
            id: c.id,
            name: c.name || c.colorName,
            hex: c.hexCode || c.hex_code || c.hex || '#333333',
            pantone: c.pantoneCode || c.pantone_code || c.pantone || '',
            category: c.category || 'Primary',
            quarterTag: c.quarterTag || c.quarter_tag || c.tag || 'All Season',
            isTrending: Boolean(c.isTrending || c.is_trending),
            active: c.active !== false
          }));
          setMasterColors(prev => {
            const combined = [...mappedCol];
            prev.forEach(pc => {
              if (!combined.some(c => (c.name || '').toLowerCase() === (pc.name || '').toLowerCase())) combined.push(pc);
            });
            const deduplicated = deduplicateColors(combined);
            setStoredColorsMaster(deduplicated);
            return deduplicated;
          });
        }
      } catch (e) {}

      try {
        const storedSeries = getStoredData('erp_size_series_v1', null);
        if (Array.isArray(storedSeries) && storedSeries.length > 0) {
          setMasterSizeSeries(storedSeries);
        }
      } catch (e) {}
    }
    loadMasters();
  }, []);

  // --- Article Selection Handlers ---
  const toggleArticleSelection = (type) => {
    const existing = addedArticles.find(a => (type.id && a.articleTypeId === type.id) || a.name === type.name);
    if (existing) {
      // Rule 4: Each article type can be added to an order only once
      setAddedArticles(prev => prev.filter(a => a.id !== existing.id && a.name !== type.name && (!type.id || a.articleTypeId !== type.id)));
      setOrderCustomers(prev => prev.map(c => ({
        ...c,
        assignedArticleIds: (c.assignedArticleIds || []).filter(id => id !== existing.id),
        sizeConfigs: Object.fromEntries(
          Object.entries(c.sizeConfigs || {}).filter(([key]) => !key.startsWith(`${existing.id}_`))
        )
      })));
    } else {
      const newArticle = {
        id: `ART-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        articleTypeId: type.id || `ART-${Date.now()}`,
        name: type.name,
        avgLength: '',
        fabrics: [
          {
            role: '', // empty placeholder
            fabricId: '',
            avgLength: ''
          }
        ]
      };
      setAddedArticles(prev => [...prev, newArticle]);
      // Auto assign to existing customers
      setOrderCustomers(prev => prev.map(c => ({
        ...c,
        assignedArticleIds: [...(c.assignedArticleIds || []), newArticle.id]
      })));
    }
  };

  const removeArticle = (artId) => {
    setAddedArticles(prev => prev.filter(a => a.id !== artId));
    setOrderCustomers(prev => prev.map(c => ({
      ...c,
      assignedArticleIds: (c.assignedArticleIds || []).filter(id => id !== artId),
      sizeConfigs: Object.fromEntries(
        Object.entries(c.sizeConfigs || {}).filter(([key]) => !key.startsWith(`${artId}_`))
      )
    })));
  };

  const updateArticleName = (artId, name) => {
    const capitalized = autoCapitalizeWords(name);
    setAddedArticles(prev => prev.map(a => a.id === artId ? { ...a, name: capitalized } : a));
  };

  const updateArticleAvgLength = (artId, avgLength) => {
    setAddedArticles(prev => prev.map(a => {
      if (a.id !== artId) return a;
      return {
        ...a,
        avgLength,
        fabrics: (a.fabrics || []).map(f => ({ ...f, avgLength }))
      };
    }));
  };

  const addFabricRow = (artId) => {
    setAddedArticles(prev => prev.map(a => {
      if (a.id !== artId) return a;
      return {
        ...a,
        fabrics: [
          ...(a.fabrics || []),
          {
            role: '', // empty placeholder
            fabricId: '',
            avgLength: a.avgLength || ''
          }
        ]
      };
    }));
  };

  const removeFabricRow = (artId, fi) => {
    setAddedArticles(prev => prev.map(a => {
      if (a.id !== artId) return a;
      const updated = [...(a.fabrics || [])];
      updated.splice(fi, 1);
      return { ...a, fabrics: updated };
    }));
  };

  const updateFabricField = (artId, fi, field, val) => {
    const finalVal = (field === 'role' && typeof val === 'string') ? autoCapitalizeWords(val) : val;
    setAddedArticles(prev => prev.map(a => {
      if (a.id !== artId) return a;
      const updated = [...(a.fabrics || [])];
      updated[fi] = { ...updated[fi], [field]: finalVal };
      if (field === 'fabricId') {
        const matchingFab = fabrics.find(f => f.id === val);
        if (matchingFab) {
          updated[fi].fabricQuality = matchingFab.qualityName || matchingFab.quality || matchingFab.name || '';
        }
      }
      return { ...a, fabrics: updated };
    }));
  };

  // --- Customer Counter (1, 2, 3, 4, 5, 6, + Customer) Handlers ---
  const handleCustomerCountChange = (count) => {
    if (orderCustomers.length === count) {
      // Only toggle off if count is 1, to prevent wiping data when clicking selected button
      if (count === 1) {
        setOrderCustomers([]);
        setExpandedCustomerIdx(-1);
        return;
      }
      return;
    }
    let updated = [...orderCustomers];
    while (updated.length < count) {
      updated.push({
        id: `ORD-CUST-${Date.now()}-${updated.length + 1}`,
        customerId: '',
        assignedArticleIds: addedArticles.map(a => a.id),
        selectedColors: [],
        sizeConfigs: {}
      });
    }
    if (updated.length > count) {
      updated = updated.slice(0, count);
    }
    setOrderCustomers(updated);
    if (expandedCustomerIdx === -1 || expandedCustomerIdx >= updated.length) {
      setExpandedCustomerIdx(0);
    }
  };

  // Dedicated handler for "+ Customer" button:
  // Starts directly from 7 because 1 to 6 buttons are already available on screen!
  const handleAddCustomerPlus = () => {
    const nextCount = Math.max(7, (orderCustomers.length || 0) + 1);
    handleCustomerCountChange(nextCount);
    setExpandedCustomerIdx(nextCount - 1);
  };

  const removeCustomer = (cIdx) => {
    setOrderCustomers(prev => prev.filter((_, idx) => idx !== cIdx));
  };

  const updateCustomerField = (cIdx, field, val) => {
    setOrderCustomers(prev => prev.map((c, idx) => idx === cIdx ? { ...c, [field]: val } : c));
  };

  const toggleCustomerArticle = (cIdx, artId) => {
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const cur = c.assignedArticleIds || [];
      const updated = cur.includes(artId) ? cur.filter(id => id !== artId) : [...cur, artId];
      return { ...c, assignedArticleIds: updated };
    }));
  };

  const toggleCustomerColor = (cIdx, colorName) => {
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const cur = c.selectedColors || [];
      const updated = cur.includes(colorName) ? cur.filter(col => col !== colorName) : [...cur, colorName];
      return { ...c, selectedColors: updated };
    }));
  };

  // --- Sizes & Quantities Config per (Article, Color) ---
  const getSizeConfigKey = (artId, colorName) => `${artId}_${colorName}`;

  // Helper to get active series list for a customer (artId, colName) pair
  const getPairSeriesConfigs = (cust, artId, colorName) => {
    const key = getSizeConfigKey(artId, colorName);
    const curCfg = cust?.sizeConfigs?.[key];
    if (curCfg && Array.isArray(curCfg.seriesConfigs)) {
      return curCfg.seriesConfigs;
    }
    if (curCfg && curCfg.seriesId) {
      return [{
        seriesId: curCfg.seriesId,
        seriesName: curCfg.seriesName || curCfg.seriesId,
        selectedSizes: curCfg.selectedSizes || [],
        uniform: curCfg.uniform,
        uniformQty: curCfg.uniformQty || '',
        sizeQtys: curCfg.sizeQtys || {}
      }];
    }
    return [];
  };

  // Helper to recompute aggregated sizeQtys from series list
  const computeCombinedSizeQtys = (seriesConfigsList) => {
    const combined = {};
    (seriesConfigsList || []).forEach(sc => {
      Object.entries(sc.sizeQtys || {}).forEach(([sz, q]) => {
        if (q !== undefined && q !== '') {
          combined[sz] = (parseInt(combined[sz] || 0, 10) + (parseInt(q, 10) || 0)).toString();
        }
      });
    });
    return combined;
  };

  // Add another series to this (Article, Color)
  const addSeriesToPair = (cIdx, artId, colorName, seriesObj) => {
    const key = getSizeConfigKey(artId, colorName);
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, artId, colorName);
      const cleanName = getCleanSeriesName(seriesObj);
      const cleanLower = cleanName.toLowerCase();
      const seriesNameLower = (seriesObj?.name || '').toLowerCase();
      if (curList.some(sc => {
        const scClean = (sc.seriesName || '').toLowerCase();
        const scId = (sc.seriesId || '').toLowerCase();
        return scClean === cleanLower || scClean === seriesNameLower || scId === cleanLower || scId === seriesNameLower || scId === (seriesObj.id || '').toLowerCase();
      })) {
        return c;
      }
      const fullDef = masterSizeSeries.find(s => 
        (s.id && seriesObj.id && s.id === seriesObj.id) ||
        (s.name && (s.name.toLowerCase() === seriesNameLower || s.name.toLowerCase() === cleanLower)) ||
        getCleanSeriesName(s).toLowerCase() === cleanLower ||
        (s.id || '').toLowerCase() === (seriesObj.id || '').toLowerCase()
      ) || initialSizeSeries.find(s => 
        (s.id && seriesObj.id && s.id === seriesObj.id) ||
        (s.name && (s.name.toLowerCase() === seriesNameLower || s.name.toLowerCase() === cleanLower)) ||
        getCleanSeriesName(s).toLowerCase() === cleanLower
      ) || seriesObj;

      const resolvedSizes = (Array.isArray(fullDef?.sizes) && fullDef.sizes.length > 0)
        ? fullDef.sizes
        : (Array.isArray(fullDef?.sizeRecords) && fullDef.sizeRecords.length > 0)
          ? fullDef.sizeRecords.map(r => r.sizeName).filter(Boolean)
          : (seriesObj.sizes || []);

      const newSeriesEntry = {
        seriesId: seriesObj.id || `SER-${(seriesObj.name || cleanName).toUpperCase().replace(/\s+/g, '')}`,
        seriesName: seriesObj.name || cleanName,
        sizes: resolvedSizes,
        selectedSizes: [],
        uniform: null,
        uniformQty: '',
        sizeQtys: {}
      };
      const updatedList = [...curList, newSeriesEntry];
      return {
        ...c,
        sizeConfigs: {
          ...c.sizeConfigs,
          [key]: {
            ...c.sizeConfigs?.[key],
            seriesConfigs: updatedList,
            sizeQtys: computeCombinedSizeQtys(updatedList)
          }
        }
      };
    }));
  };

  // Remove a series from this (Article, Color)
  const removeSeriesFromPair = (cIdx, artId, colorName, seriesId) => {
    const key = getSizeConfigKey(artId, colorName);
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, artId, colorName);
      const cleanTarget = (seriesId || '').toLowerCase();
      const updatedList = curList.filter(sc => {
        const scClean = (sc.seriesName || '').toLowerCase();
        const scId = (sc.seriesId || '').toLowerCase();
        return scId !== cleanTarget && scClean !== cleanTarget;
      });
      return {
        ...c,
        sizeConfigs: {
          ...c.sizeConfigs,
          [key]: {
            ...c.sizeConfigs?.[key],
            seriesConfigs: updatedList,
            sizeQtys: computeCombinedSizeQtys(updatedList)
          }
        }
      };
    }));
  };

  // Toggle series open/closed for this (Article, Color)
  const toggleSeriesInPair = (cIdx, artId, colorName, seriesObj) => {
    const cust = orderCustomers[cIdx];
    const curList = getPairSeriesConfigs(cust, artId, colorName);
    const cleanName = getCleanSeriesName(seriesObj);
    const cleanLower = cleanName.toLowerCase();
    const seriesNameLower = (seriesObj?.name || '').toLowerCase();
    const existing = curList.find(sc => {
      const scClean = (sc.seriesName || '').toLowerCase();
      const scId = (sc.seriesId || '').toLowerCase();
      return scClean === cleanLower ||
             scClean === seriesNameLower ||
             scId === cleanLower ||
             scId === seriesNameLower ||
             scId === (seriesObj.id || '').toLowerCase();
    });
    if (existing) {
      removeSeriesFromPair(cIdx, artId, colorName, existing.seriesId);
    } else {
      addSeriesToPair(cIdx, artId, colorName, seriesObj);
    }
  };

  // Toggle size selection in a specific series of this pair
  const toggleSizeInPairSeries = (cIdx, artId, colorName, seriesId, sz) => {
    const key = getSizeConfigKey(artId, colorName);
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, artId, colorName);
      const updatedList = curList.map(sc => {
        if (sc.seriesId !== seriesId && sc.seriesName !== seriesId) return sc;
        const curSizes = sc.selectedSizes || [];
        const isSelected = curSizes.includes(sz);
        const updatedSizes = isSelected ? curSizes.filter(s => s !== sz) : [...curSizes, sz];
        const newQtys = { ...(sc.sizeQtys || {}) };
        if (!isSelected) {
          newQtys[sz] = sc.uniform && sc.uniformQty ? sc.uniformQty : '';
        } else {
          delete newQtys[sz];
        }
        let newUniform = sc.uniform;
        if (updatedSizes.length < 2) {
          newUniform = null;
        }
        return {
          ...sc,
          selectedSizes: updatedSizes,
          uniform: newUniform,
          sizeQtys: newQtys
        };
      });
      return {
        ...c,
        sizeConfigs: {
          ...c.sizeConfigs,
          [key]: {
            ...c.sizeConfigs?.[key],
            seriesConfigs: updatedList,
            sizeQtys: computeCombinedSizeQtys(updatedList)
          }
        }
      };
    }));
  };

  // Section 7.1 & 7.2: Set Ratio Mode & Calculation (PDF Page 13-14 & 24)
  const formatRatioInput = (rawVal, prevVal = '', maxSizes = 4) => {
    if (!rawVal) return '';
    // Restrict strictly to digits and colons
    const clean = rawVal.replace(/[^0-9:]/g, '');

    // User deleted character (backspace)
    if (prevVal && clean.length < prevVal.length) {
      return clean.replace(/:+$/, '');
    }

    const digits = clean.replace(/[^0-9]/g, '');
    if (!digits) return '';

    const segments = clean.split(':');
    const hasLongSegment = segments.some(s => s.length > 1);

    if (hasLongSegment || !clean.includes(':')) {
      const capped = digits.slice(0, maxSizes || 6);
      return capped.split('').join(':');
    }
    return clean;
  };

  const setRatioModeForPairSeries = (cIdx, artId, colorName, seriesId, ratioUsed) => {
    const key = getSizeConfigKey(artId, colorName);
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, artId, colorName);
      const updatedList = curList.map(sc => {
        if (sc.seriesId !== seriesId && sc.seriesName !== seriesId) return sc;
        const selectedSizes = sc.selectedSizes || [];
        // Do NOT pre-fill with dummy ratio so user can type freely without instant validation errors
        const ratioStr = sc.ratioString || '';
        const baseQty = sc.baseSetQty || '';

        let newQtys = { ...(sc.sizeQtys || {}) };
        if (ratioUsed && ratioStr) {
          const parts = ratioStr.split(':').map(p => p.trim());
          if (parts.length === selectedSizes.length && parts.every(p => !isNaN(parseInt(p, 10)))) {
            const baseNum = parseInt(baseQty, 10) || 100;
            newQtys = {};
            selectedSizes.forEach((sz, sIdx) => {
              newQtys[sz] = String(baseNum * (parseInt(parts[sIdx], 10) || 1));
            });
          }
        }
        return {
          ...sc,
          ratioUsed: Boolean(ratioUsed),
          ratioString: ratioStr,
          baseSetQty: baseQty,
          uniform: ratioUsed ? false : sc.uniform,
          sizeQtys: newQtys
        };
      });
      return {
        ...c,
        sizeConfigs: {
          ...c.sizeConfigs,
          [key]: {
            ...c.sizeConfigs?.[key],
            seriesConfigs: updatedList,
            sizeQtys: computeCombinedSizeQtys(updatedList)
          }
        }
      };
    }));
  };

  const updateRatioCalculationForPairSeries = (cIdx, artId, colorName, seriesId, ratioStr, baseQty, userEdited = false) => {
    const key = getSizeConfigKey(artId, colorName);
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, artId, colorName);
      const updatedList = curList.map(sc => {
        if (sc.seriesId !== seriesId && sc.seriesName !== seriesId) return sc;
        const cleanRatio = ratioStr !== undefined ? ratioStr : (sc.ratioString || '');
        const cleanBase = baseQty !== undefined ? baseQty : (sc.baseSetQty || '');
        const parts = cleanRatio.split(':').map(p => p.trim());
        const selectedSizes = sc.selectedSizes || [];

        let newQtys = { ...(sc.sizeQtys || {}) };
        // Section 14.4: A ratio string must be validated as a genuine ratio matching the number of selected sizes
        if (parts.length === selectedSizes.length && parts.every(p => p !== '' && !isNaN(parseInt(p, 10)) && parseInt(p, 10) >= 0)) {
          const baseNum = parseInt(cleanBase, 10) || 100;
          newQtys = {};
          selectedSizes.forEach((sz, sIdx) => {
            const mult = parseInt(parts[sIdx], 10) || 0;
            newQtys[sz] = String(baseNum * mult);
          });
        }
        return {
          ...sc,
          ratioString: cleanRatio,
          baseSetQty: cleanBase,
          _userEditedBase: userEdited || Boolean(cleanBase && cleanBase !== '100') || sc._userEditedBase,
          sizeQtys: newQtys
        };
      });
      return {
        ...c,
        sizeConfigs: {
          ...c.sizeConfigs,
          [key]: {
            ...c.sizeConfigs?.[key],
            seriesConfigs: updatedList,
            sizeQtys: computeCombinedSizeQtys(updatedList)
          }
        }
      };
    }));
  };

  // Set uniform mode for a specific series of this pair
  const setUniformModeForPairSeries = (cIdx, artId, colorName, seriesId, isUniform) => {
    const key = getSizeConfigKey(artId, colorName);
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, artId, colorName);
      const updatedList = curList.map(sc => {
        if (sc.seriesId !== seriesId && sc.seriesName !== seriesId) return sc;
        return { ...sc, uniform: isUniform };
      });
      return {
        ...c,
        sizeConfigs: {
          ...c.sizeConfigs,
          [key]: {
            ...c.sizeConfigs?.[key],
            seriesConfigs: updatedList,
            sizeQtys: computeCombinedSizeQtys(updatedList)
          }
        }
      };
    }));
  };

  // Update uniform quantity for all selected sizes of a series
  const updateUniformQtyForPairSeries = (cIdx, artId, colorName, seriesId, qty) => {
    const key = getSizeConfigKey(artId, colorName);
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, artId, colorName);
      const updatedList = curList.map(sc => {
        if (sc.seriesId !== seriesId && sc.seriesName !== seriesId) return sc;
        const newQtys = {};
        (sc.selectedSizes || []).forEach(sz => {
          newQtys[sz] = qty;
        });
        return {
          ...sc,
          uniformQty: qty,
          sizeQtys: newQtys
        };
      });
      return {
        ...c,
        sizeConfigs: {
          ...c.sizeConfigs,
          [key]: {
            ...c.sizeConfigs?.[key],
            seriesConfigs: updatedList,
            sizeQtys: computeCombinedSizeQtys(updatedList)
          }
        }
      };
    }));
  };

  // Update individual size quantity in a series
  const updateIndividualSizeQtyForPairSeries = (cIdx, artId, colorName, seriesId, sz, qty) => {
    const key = getSizeConfigKey(artId, colorName);
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, artId, colorName);
      const updatedList = curList.map(sc => {
        if (sc.seriesId !== seriesId && sc.seriesName !== seriesId) return sc;
        return {
          ...sc,
          sizeQtys: {
            ...(sc.sizeQtys || {}),
            [sz]: qty
          }
        };
      });
      return {
        ...c,
        sizeConfigs: {
          ...c.sizeConfigs,
          [key]: {
            ...c.sizeConfigs?.[key],
            seriesConfigs: updatedList,
            sizeQtys: computeCombinedSizeQtys(updatedList)
          }
        }
      };
    }));
  };

  // --- Copy sizes to other colours modal handler ---
  const openCopySizesDialog = (cIdx, artId, sourceColor) => {
    const cust = orderCustomers[cIdx];
    const sourceCfg = cust?.sizeConfigs?.[getSizeConfigKey(artId, sourceColor)];
    if (!sourceCfg) return;
    const targetColors = (cust.selectedColors || []).filter(c => c !== sourceColor);
    setCopySizesModal({
      custIdx: cIdx,
      articleId: artId,
      sourceColor,
      targetColors,
      sourceConfig: sourceCfg
    });
  };

  const executeCopySizes = (selectedTargetColors) => {
    if (!copySizesModal || !selectedTargetColors.length) {
      setCopySizesModal(null);
      return;
    }
    const { custIdx, articleId, sourceConfig } = copySizesModal;
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== custIdx) return c;
      const updatedConfigs = { ...(c.sizeConfigs || {}) };
      selectedTargetColors.forEach(tCol => {
        const key = getSizeConfigKey(articleId, tCol);
        updatedConfigs[key] = JSON.parse(JSON.stringify(sourceConfig));
      });
      return { ...c, sizeConfigs: updatedConfigs };
    }));
    setCopySizesModal(null);
  };

  // Helper: customer total pieces
  const getCustomerTotalPieces = (cust) => {
    let sum = 0;
    Object.values(cust.sizeConfigs || {}).forEach(cfg => {
      if (Array.isArray(cfg?.seriesConfigs)) {
        cfg.seriesConfigs.forEach(sc => {
          Object.values(sc.sizeQtys || {}).forEach(q => {
            sum += parseInt(q, 10) || 0;
          });
        });
      } else if (cfg?.sizeQtys) {
        Object.values(cfg.sizeQtys || {}).forEach(q => {
          sum += parseInt(q, 10) || 0;
        });
      }
    });
    return sum;
  };

  // Total pieces per (articleId, colorName) across all customers
  const getPiecesForArticleColor = (artId, colorName) => {
    let sum = 0;
    const key = getSizeConfigKey(artId, colorName);
    orderCustomers.forEach(c => {
      if ((c.assignedArticleIds || []).includes(artId) && (c.selectedColors || []).includes(colorName)) {
        const cfg = c.sizeConfigs?.[key];
        if (cfg) {
          if (Array.isArray(cfg.seriesConfigs)) {
            cfg.seriesConfigs.forEach(sc => {
              Object.values(sc.sizeQtys || {}).forEach(q => {
                sum += parseInt(q, 10) || 0;
              });
            });
          } else if (cfg.sizeQtys) {
            Object.values(cfg.sizeQtys || {}).forEach(q => {
              sum += parseInt(q, 10) || 0;
            });
          }
        }
      }
    });
    return sum;
  };

  // Total pieces for a specific article across all customers and colors
  const getPiecesForArticle = (artId, artName) => {
    let sum = 0;
    orderCustomers.forEach(c => {
      Object.entries(c.sizeConfigs || {}).forEach(([key, cfg]) => {
        const matchesArt = (artId && key.startsWith(`${artId}_`)) || 
                           (artName && key.toLowerCase().includes(artName.toLowerCase()));
        if (matchesArt && cfg) {
          if (Array.isArray(cfg.seriesConfigs)) {
            cfg.seriesConfigs.forEach(sc => {
              Object.values(sc.sizeQtys || {}).forEach(q => {
                sum += parseInt(q, 10) || 0;
              });
            });
          } else if (cfg.sizeQtys) {
            Object.values(cfg.sizeQtys || {}).forEach(q => {
              sum += parseInt(q, 10) || 0;
            });
          }
        }
      });
    });
    return sum;
  };

  // Grand total pieces in the order
  const grandTotalOrderPieces = useMemo(() => {
    return orderCustomers.reduce((acc, c) => acc + getCustomerTotalPieces(c), 0);
  }, [orderCustomers]);

  // =========================================================================
  // SECTION 12.5 FABRIC CONSUMPTION FORMULA (STRICT SPECIFICATION)
  // Rule 1: Greige length per piece = Avg. (dyed) Length * (1 + Shrinkage%) * (1 + Buffer%);
  // shrinkage comes from the Fabric master, buffer is set per fabric row.
  // Rule 2: Total Greige for a fabric+width = sum of (Greige length per piece * Pieces)
  // across every colour that uses that fabric+width, across all customers on the order.
  // =========================================================================
  const fabricConsumptionRows = useMemo(() => {
    const rows = [];
    if (addedArticles.length === 0) return rows;

    addedArticles.forEach(art => {
      (art.fabrics || []).forEach((fr, frIdx) => {
        const fab = fabrics.find(f => f.id === fr.fabricId) || fabrics[0];
        const isGreige = fr.source === 'Greige Fabric' || !fr.source || String(fr.source).includes('Greige');
        const rawShrink = fab?.defaultShrinkage !== undefined && fab?.defaultShrinkage !== null && fab?.defaultShrinkage !== '' 
          ? fab.defaultShrinkage 
          : fab?.shrinkage;
        const shrinkPct = isGreige 
          ? (rawShrink !== undefined && rawShrink !== null && rawShrink !== '' ? (parseFloat(String(rawShrink).replace('%', '')) || 0) : 3.5) 
          : 0;
        const rawBuf = fab?.maxBuffer !== undefined && fab?.maxBuffer !== null && fab?.maxBuffer !== '' 
          ? fab.maxBuffer 
          : 2.0;
        const bufferPct = (rawBuf !== undefined && rawBuf !== null && rawBuf !== '') 
          ? (parseFloat(String(rawBuf).replace('%', '')) || 0) 
          : 2.0;

        // Default or parsed dyed length in meters
        let dyedPerPiece = 0;
        const rawAvgLen = parseFloat(art.avgLength || fr.avgLength);
        if (!isNaN(rawAvgLen) && rawAvgLen > 0) {
          // If entered in inches, convert to meters (1 in = 0.0254 m)
          dyedPerPiece = Number((rawAvgLen * 0.0254).toFixed(3));
        } else {
          // Fallback based on garment type
          const lowerName = (art.name || '').toLowerCase();
          if (lowerName.includes('kurta')) dyedPerPiece = 2.500;
          else if (lowerName.includes('pant') || lowerName.includes('pajama')) dyedPerPiece = 2.000;
          else if (lowerName.includes('dupatta')) dyedPerPiece = 2.250;
          else dyedPerPiece = 1.500;
        }

        // Gather all colors used across customers for this article
        const usedColors = new Set();
        orderCustomers.forEach(c => {
          if ((c.assignedArticleIds || []).includes(art.id)) {
            (c.selectedColors || []).forEach(col => usedColors.add(col));
          }
        });

        const colorsToIterate = usedColors.size > 0 ? Array.from(usedColors) : ['Standard'];

        colorsToIterate.forEach(colName => {
          const pcs = usedColors.size > 0 ? getPiecesForArticleColor(art.id, colName) : 0;
          const colorObj = masterColors.find(c => c.name === colName) || { hex: '#94a3b8' };
          const widthVal = fab?.widths?.[0] || '44"';

          // RULE 1: Greige length per piece = Avg. (dyed) Length * (1 + Shrinkage%) * (1 + Buffer%)
          const greigeLengthPerPiece = Number((dyedPerPiece * (1 + shrinkPct / 100) * (1 + bufferPct / 100)).toFixed(3));

          // RULE 2: Total Greige = Greige length per piece * Pieces
          const totalDyed = Number((dyedPerPiece * pcs).toFixed(1));
          const totalGreige = Number((greigeLengthPerPiece * pcs).toFixed(1));
          const orderQty = totalGreige;

          rows.push({
            key: `${art.id}_${frIdx}_${colName}`,
            articleId: art.id,
            articleName: art.name,
            role: autoCapitalizeWords(fr.role || 'Main'),
            fabricId: fab?.id,
            fabricQuality: fab?.qualityName || fab?.quality || fab?.name || fr.fabricQuality || 'Suh Cotton',
            source: fr.source || 'Greige Fabric',
            width: widthVal,
            colorName: colName,
            colorHex: usedColors.size > 0 ? colorObj.hex : '#94a3b8',
            dyedPerPiece,
            shrinkPct,
            bufferPct,
            greigeLengthPerPiece,
            pcs,
            totalDyed,
            totalGreige,
            orderQty
          });
        });
      });
    });

    return rows;
  }, [addedArticles, orderCustomers, fabrics, masterColors]);

  // Group Subtotals by Fabric Quality + Width (Section 12.5 Rule 2)
  const fabricGroups = useMemo(() => {
    const map = {};
    fabricConsumptionRows.forEach(row => {
      const gk = `${row.fabricQuality} (${row.width})`;
      if (!map[gk]) {
        map[gk] = { pcs: 0, dyed: 0, greige: 0, orderQty: 0 };
      }
      map[gk].pcs += row.pcs;
      map[gk].dyed += row.totalDyed;
      map[gk].greige += row.totalGreige;
      map[gk].orderQty += row.orderQty;
    });
    return map;
  }, [fabricConsumptionRows]);

  // Handle Save New Fabric Quality from Fabric Master
  const handleSaveInlineFabric = (newFabric) => {
    if (!newFabric) {
      setShowNewFabricModal(false);
      setActiveFabricRowTarget(null);
      return;
    }
    const cleanItem = {
      ...newFabric,
      id: newFabric.id || `FAB-${Date.now()}`,
      quality: newFabric.qualityName || newFabric.quality || '',
      qualityName: newFabric.qualityName || newFabric.quality || '',
      name: newFabric.qualityName || newFabric.quality || '',
      type: newFabric.fabricType || newFabric.type || 'Cotton',
      fabricType: newFabric.fabricType || newFabric.type || 'Cotton',
      widths: Array.isArray(newFabric.widths)
        ? newFabric.widths
        : (typeof newFabric.widths === 'string'
            ? newFabric.widths.split(',').map(w => w.trim()).filter(Boolean)
            : ['44"', '58"']),
      shrinkage: parseFloat(newFabric.defaultShrinkage || newFabric.shrinkage) || 0,
      active: newFabric.active !== false
    };

    setFabrics(prev => {
      const updated = [cleanItem, ...prev.filter(p => p.id !== cleanItem.id)];
      try {
        localStorage.setItem('raindrop_fabrics_v1', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    if (api && api.saveFabric) {
      try { api.saveFabric(cleanItem); } catch (err) {}
    }

    // Auto-select in active fabric row
    if (activeFabricRowTarget) {
      const { artId, fi } = activeFabricRowTarget;
      updateFabricField(artId, fi, 'fabricId', cleanItem.id);
    }

    setShowNewFabricModal(false);
    setActiveFabricRowTarget(null);
  };

  // Handle Save New Color in Color Master (Matching PO AddColorModal)
  const handleSaveInlineColor = async (colorObj) => {
    if (!colorObj || !colorObj.name) {
      setShowNewColorModal(false);
      return;
    }
    const colorName = colorObj.name.trim();
    const created = {
      id: colorObj.id || `COL-${Date.now()}`,
      name: colorName,
      hex: colorObj.hex || colorObj.hexCode || '#000000',
      hexCode: colorObj.hex || colorObj.hexCode || '#000000',
      pantone: (colorObj.pantone || colorObj.pantoneCode || '').trim(),
      pantoneCode: (colorObj.pantone || colorObj.pantoneCode || '').trim(),
      category: colorObj.category || 'Primary',
      quarterTag: colorObj.quarterTag || 'All Season',
      isTrending: Boolean(colorObj.isTrending),
      active: true
    };
    const updated = deduplicateColors([...masterColors.filter(c => (c.name || '').toLowerCase() !== created.name.toLowerCase()), created]);
    setMasterColors(updated);
    setStoredColorsMaster(updated);
    if (api && api.saveColor) {
      try { await api.saveColor(created); } catch (err) {}
    }

    // Section 14.3: A colour added via "+ Add Colour" mid-order must immediately appear in that order's colour list
    setNewlyAddedColorNames(prev => new Set(prev).add(created.name));

    // Auto-select for active customer
    if (orderCustomers[activeCustomerIndexForNewColor]) {
      const curCust = orderCustomers[activeCustomerIndexForNewColor];
      if (!(curCust.selectedColors || []).includes(created.name)) {
        toggleCustomerColor(activeCustomerIndexForNewColor, created.name);
      }
    }

    setShowNewColorModal(false);
  };

  // Handle Final Order Save
  const handleFinalSave = (status) => {
    // If user didn't enter a styleName, default it to article name or Kurta
    const primaryArticleName = autoCapitalizeWords(addedArticles[0]?.name || 'Kurta');
    const finalStyleName = (orderInfo.styleName && orderInfo.styleName.trim()) 
      ? autoCapitalizeWords(orderInfo.styleName.trim()) 
      : `${primaryArticleName} Style (${orderInfo.orderId})`;

    // If no articles added explicitly, default to Kurta
    let finalArticles = [...addedArticles];
    if (finalArticles.length === 0) {
      finalArticles = [{
        id: `ART-${Date.now()}`,
        name: primaryArticleName,
        fabrics: []
      }];
    }

    const totalGreigeFabric = fabricConsumptionRows.reduce((a, b) => a + (b.totalGreige || 0), 0).toFixed(1);
    const totalDyedFabric = fabricConsumptionRows.reduce((a, b) => a + (b.totalDyed || 0), 0).toFixed(1);

    // Map customer orders with clean customer names
    const mappedCustomerOrders = orderCustomers.map((c, idx) => {
      const custObj = customers.find(cust => cust.id === c.customerId);
      return {
        ...c,
        customerName: custObj?.name || c.customerName || `Customer ${idx + 1}`,
        totalPieces: getCustomerTotalPieces(c)
      };
    });

    const payload = {
      id: orderInfo.orderId,
      styleName: finalStyleName,
      orderDate: orderInfo.orderDate,
      expectedDelivery: orderInfo.expectedDelivery || '',
      priority: orderInfo.priority || 'Normal',
      status: status || 'Saved', // 'Draft' | 'Saved'
      stage: status === 'Draft' ? 'Draft' : 'Confirmed',
      totalGarments: grandTotalOrderPieces || 0,
      totalFabricGreige: parseFloat(totalGreigeFabric) || 0,
      totalFabricDyed: parseFloat(totalDyedFabric) || 0,
      articles: finalArticles.map(art => {
        const firstFabId = art.fabrics?.[0]?.fabricId;
        const matchingFab = fabrics.find(f => f.id === firstFabId);
        const fabQuality = matchingFab?.qualityName || matchingFab?.quality || matchingFab?.name || art.fabrics?.[0]?.fabricQuality || '';
        const avgLen = art.avgLength || art.fabrics?.[0]?.avgLength || art.avgGarmentLength || '';
        const artPieces = getPiecesForArticle(art.id, art.name);
        return {
          ...art,
          name: autoCapitalizeWords(art.name || primaryArticleName),
          totalPieces: artPieces > 0 ? artPieces : Math.round((grandTotalOrderPieces || 0) / (finalArticles.length || 1)),
          fabricQuality: fabQuality,
          fabrics: (art.fabrics || []).map(f => {
            const fMatch = fabrics.find(fx => fx.id === f.fabricId);
            return {
              ...f,
              fabricQuality: fMatch?.qualityName || fMatch?.quality || fMatch?.name || f.fabricQuality || '',
              role: autoCapitalizeWords(f.role || '')
            };
          }),
          avgGarmentLength: avgLen,
          avgLength: avgLen
        };
      }),
      customerOrders: mappedCustomerOrders,
      fabricConsumptions: fabricConsumptionRows,
      fabricQualityGroups: fabricGroups,
      createdAt: new Date().toISOString()
    };

    const saved = getStoredData('erp_sales_orders_v1', []);
    const updated = [payload, ...saved.filter(o => o.id !== payload.id)];
    setStoredData('erp_sales_orders_v1', updated);

    if (onSaveOrder) {
      onSaveOrder(payload, status);
    }
  };

  return (
    <div className="p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', color: '#1e293b' }}>
      <style>{`
        .erp-btn-outline {
          color: #2e37a4 !important;
          background-color: #f0f2fd !important;
          border: 1.5px solid #c7d2fe !important;
          font-weight: 600 !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .erp-btn-outline:hover, .erp-btn-outline:focus, .erp-btn-outline:active {
          color: #ffffff !important;
          background-color: #2e37a4 !important;
          border-color: #2e37a4 !important;
          box-shadow: 0 4px 12px rgba(46, 55, 164, 0.28) !important;
        }
        .erp-article-add-btn {
          border-color: #6366f1 !important;
          color: #2e37a4 !important;
          background-color: #ffffff !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .erp-article-add-btn:hover {
          background-color: #2e37a4 !important;
          color: #ffffff !important;
          border-color: #2e37a4 !important;
          box-shadow: 0 4px 12px rgba(46, 55, 164, 0.2) !important;
        }
      `}</style>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <button
            type="button"
            className="btn btn-link text-decoration-none p-0 mb-1 d-flex align-items-center gap-1.5"
            style={{ color: '#2e37a4', fontWeight: 600, fontSize: '13px' }}
            onClick={onCancel}
          >
            <i className="ti ti-arrow-left"></i> Back to Orders
          </button>
          <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <span className="p-2 rounded-3 text-white d-inline-flex align-items-center justify-content-center" style={{ backgroundColor: '#2e37a4', width: '36px', height: '36px' }}>
              <i className="ti ti-file-plus fs-5"></i>
            </span>
            New Sales Order
          </h4>
          <p className="text-muted small mb-0 mt-1">
            Order intake with article, fabric requirement (incl. dyeing shrinkage &amp; buffer), size series and per-customer colour/quantity breakdown.
          </p>
        </div>
      </div>

      {/* =========================================================================
       * 1. ORDER INFORMATION
       * ========================================================================= */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white" style={{ borderColor: '#e2e8f0' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <span className="badge text-white rounded-circle p-1" style={{ backgroundColor: '#2e37a4' }}>1</span> Order Information
          </h6>
          <span className="badge font-monospace px-2.5 py-1 rounded-2" style={{ backgroundColor: '#eef2ff', color: '#4338ca' }}>
            {orderInfo.orderId}
          </span>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-5">
            <label className="form-label fw-semibold small text-muted mb-1">
              Style Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control rounded-3"
              placeholder="e.g. Ikkat Black Kurta Set"
              style={{ textTransform: 'capitalize' }}
              value={orderInfo.styleName}
              onChange={(e) => setOrderInfo({ ...orderInfo, styleName: autoCapitalizeWords(e.target.value) })}
              onBlur={(e) => setOrderInfo({ ...orderInfo, styleName: autoCapitalizeWords((e.target.value || '').trim()) })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const firstTile = document.getElementById('article-tile-0');
                  if (firstTile) firstTile.focus();
                }
              }}
            />
            <div className="form-text small text-muted" style={{ fontSize: '11px' }}>Auto-capitalised word by word</div>
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label fw-semibold small text-muted mb-1">Order Date</label>
            <input
              type="date"
              className="form-control rounded-3"
              value={orderInfo.orderDate}
              onChange={(e) => setOrderInfo({ ...orderInfo, orderDate: e.target.value })}
            />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label fw-semibold small text-muted mb-1">Expected Delivery</label>
            <input
              type="date"
              className="form-control rounded-3"
              placeholder="dd-mm-yyyy"
              value={orderInfo.expectedDelivery}
              onChange={(e) => setOrderInfo({ ...orderInfo, expectedDelivery: e.target.value })}
            />
          </div>
          <div className="col-12 col-md-2">
            <label className="form-label fw-semibold small text-muted mb-1">Priority</label>
            <select
              className="form-select rounded-3"
              value={orderInfo.priority}
              onChange={(e) => setOrderInfo({ ...orderInfo, priority: e.target.value })}
            >
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
       * 2. ARTICLES & FABRIC REQUIREMENTS
       * ========================================================================= */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white" style={{ borderColor: '#e2e8f0' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <span className="badge text-white rounded-circle p-1" style={{ backgroundColor: '#2e37a4' }}>2</span> Articles
            </h6>
          </div>
          <span className="text-muted small">select article types (each can only be added once)</span>
        </div>

        {/* Article Grid Tiles */}
        <div className="row g-2 mb-3">
          {(showAllArticleTypes ? articleTypes : (articleTypes.length <= 8 ? articleTypes : articleTypes.slice(0, 8))).map((type, tIdx) => {
            const isSelected = addedArticles.some(a => a.articleTypeId === type.id || a.name === type.name);
            return (
              <div key={type.id || type.name} className="col-6 col-md-2">
                <div
                  id={`article-tile-${tIdx}`}
                  role="button"
                  tabIndex={0}
                  className={`p-3 rounded-3 text-center border transition position-relative cursor-pointer ${
                    isSelected ? 'shadow-xs' : 'bg-white'
                  }`}
                  style={{
                    backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                    borderColor: isSelected ? '#2e37a4' : '#e2e8f0',
                    color: isSelected ? '#2e37a4' : '#334155'
                  }}
                  onClick={() => toggleArticleSelection(type)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleArticleSelection(type);
                    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      const nextEl = document.getElementById(`article-tile-${tIdx + 1}`) || document.getElementById('article-tile-more') || document.getElementById('article-tile-new');
                      if (nextEl) nextEl.focus();
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      const prevEl = document.getElementById(`article-tile-${tIdx - 1}`);
                      if (prevEl) prevEl.focus();
                    }
                  }}
                >
                  <div style={{ fontSize: '24px', lineHeight: 1, marginBottom: '6px' }}>{type.icon || type.emoji || '👕'}</div>
                  <div className="fw-semibold small text-truncate" title={type.name}>{type.name}</div>
                  {isSelected && (
                    <span
                      className="position-absolute text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{ top: '6px', right: '8px', width: '18px', height: '18px', backgroundColor: '#2e37a4', fontSize: '11px' }}
                    >
                      ✓
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {!showAllArticleTypes && articleTypes.length > 8 && (
            <div className="col-6 col-md-2">
              <div
                id="article-tile-more"
                role="button"
                tabIndex={0}
                className="p-3 rounded-3 text-center border bg-light text-primary cursor-pointer h-100 d-flex flex-column align-items-center justify-content-center transition shadow-xs"
                style={{ borderColor: '#c7d2fe' }}
                onClick={() => setShowAllArticleTypes(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowAllArticleTypes(true);
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    const newBtn = document.getElementById('article-tile-new');
                    if (newBtn) newBtn.focus();
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prevEl = document.getElementById(`article-tile-${Math.min(8, articleTypes.length) - 1}`);
                    if (prevEl) prevEl.focus();
                  }
                }}
                title="View all articles"
              >
                <div className="fs-5 mb-1 fw-bold">+</div>
                <div className="small fw-semibold">+{articleTypes.length - 8} Others</div>
              </div>
            </div>
          )}

          {showAllArticleTypes && articleTypes.length > 8 && (
            <div className="col-6 col-md-2">
              <div
                id="article-tile-less"
                role="button"
                tabIndex={0}
                className="p-3 rounded-3 text-center border bg-light text-secondary cursor-pointer h-100 d-flex flex-column align-items-center justify-content-center transition"
                style={{ borderColor: '#e2e8f0' }}
                onClick={() => setShowAllArticleTypes(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowAllArticleTypes(false);
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    const newBtn = document.getElementById('article-tile-new');
                    if (newBtn) newBtn.focus();
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prevEl = document.getElementById(`article-tile-${articleTypes.length - 1}`);
                    if (prevEl) prevEl.focus();
                  }
                }}
                title="Collapse view to 8"
              >
                <div className="fs-5 mb-1">&minus;</div>
                <div className="small fw-semibold">Show Less</div>
              </div>
            </div>
          )}

          <div className="col-6 col-md-2">
            <div
              id="article-tile-new"
              role="button"
              tabIndex={0}
              className="p-3 rounded-3 text-center border border-dashed erp-article-add-btn cursor-pointer h-100 d-flex flex-column align-items-center justify-content-center"
              onClick={() => setShowNewArticleModal(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowNewArticleModal(true);
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const moreEl = document.getElementById('article-tile-more') || document.getElementById('article-tile-less');
                  if (moreEl) {
                    moreEl.focus();
                  } else {
                    const maxIdx = (showAllArticleTypes ? articleTypes.length : Math.min(8, articleTypes.length)) - 1;
                    const prevEl = document.getElementById(`article-tile-${maxIdx}`);
                    if (prevEl) prevEl.focus();
                  }
                }
              }}
            >
              <div className="fs-5 mb-1">+</div>
              <div className="small fw-semibold">New Article Type</div>
            </div>
          </div>
        </div>

        {/* Added Articles Configuration Cards */}
        {addedArticles.length > 0 && (
          <div className="mt-3">
            <div className="small fw-bold text-muted mb-2">
              Added articles ({addedArticles.length}):
            </div>

            {addedArticles.map((art, ai) => (
              <div key={art.id} className="card border rounded-3 p-3 mb-3 bg-light" style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="fw-bold text-dark fs-6">
                    {art.name} <span className="text-muted fw-normal small">#{ai + 1}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link text-danger p-0 small text-decoration-none fw-semibold"
                    onClick={() => removeArticle(art.id)}
                  >
                    <i className="ti ti-trash me-1"></i> Remove article
                  </button>
                </div>

                <div className="row g-3 mb-3 align-items-end">
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-muted mb-1 fw-semibold">Article name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-white"
                      placeholder="e.g. Kurta"
                      style={{ textTransform: 'capitalize' }}
                      value={art.name}
                      onChange={(e) => updateArticleName(art.id, autoCapitalizeWords(e.target.value))}
                      onBlur={(e) => updateArticleName(art.id, autoCapitalizeWords((e.target.value || '').trim()))}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label small text-muted mb-1 fw-semibold">Avg length (in)</label>
                    <input
                      type="number"
                      className="form-control form-control-sm bg-white"
                      placeholder="e.g. 45"
                      value={art.avgLength ?? ''}
                      onChange={(e) => updateArticleAvgLength(art.id, e.target.value)}
                    />
                  </div>
                </div>

                <div className="small text-muted mb-2 fw-medium">
                  Fabric requirement — add a row per fabric this article needs (e.g. Outer + Lining for a kurta):
                </div>

                {/* Fabric Rows */}
                {(art.fabrics || []).map((fr, fi) => (
                  <div key={fi} className="row g-2 align-items-end mb-2">
                    <div className="col-12 col-md-3">
                      <label className="form-label small text-muted mb-1">Role</label>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-white"
                        placeholder="e.g. Main, Outer, Lining"
                        style={{ textTransform: 'capitalize' }}
                        value={fr.role || ''}
                        onChange={(e) => updateFabricField(art.id, fi, 'role', autoCapitalizeWords(e.target.value))}
                        onBlur={(e) => updateFabricField(art.id, fi, 'role', autoCapitalizeWords((e.target.value || '').trim()))}
                      />
                    </div>
                    <div className="col-12 col-md-8">
                      <label className="form-label small text-muted mb-1">Fabric Quality</label>
                      <div className="input-group input-group-sm">
                        <select
                          className="form-select bg-white"
                          value={fr.fabricId || ''}
                          onChange={(e) => updateFabricField(art.id, fi, 'fabricId', e.target.value)}
                        >
                          <option value="">Select Fabric Quality...</option>
                          {fabrics.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.qualityName || f.quality || f.name || 'Unnamed Fabric'}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn erp-btn-outline fw-semibold px-2.5 d-inline-flex align-items-center gap-1"
                          style={{ borderColor: '#2e37a4', whiteSpace: 'nowrap' }}
                          title="Add New Fabric Quality"
                          onClick={() => {
                            setActiveFabricRowTarget({ artId: art.id, fi });
                            setNewFabricData({ quality: '', type: '', widths: '', shrinkage: '', maxBuffer: '', rate: '', dyedRate: '' });
                            setShowNewFabricModal(true);
                          }}
                        >
                          <i className="ti ti-plus fs-7"></i>
                          <span>New Fabric</span>
                        </button>
                      </div>
                    </div>
                    <div className="col-12 col-md-1 text-end pb-1">
                      <button
                        type="button"
                        className="btn btn-link text-danger p-0 small text-decoration-none"
                        onClick={() => removeFabricRow(art.id, fi)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div>
                  <button
                    type="button"
                    className="btn btn-link p-0 small text-decoration-none fw-semibold"
                    style={{ color: '#2e37a4' }}
                    onClick={() => addFabricRow(art.id)}
                  >
                    + Add Fabric Row
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
       * 3. CUSTOMER SELECTION & ORDERS (1 2 3 4 5 6 COUNTER)
       * ========================================================================= */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white" style={{ borderColor: '#e2e8f0' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <span className="badge text-white rounded-circle p-1" style={{ backgroundColor: '#2e37a4' }}>3</span> Customers &amp; Orders
          </h6>
        </div>

        {/* Dynamic Counter: 1 2 3 4 5 6 ... and + Customer */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label fw-semibold small text-muted mb-0">How many customers?</label>
            <span className="badge bg-light text-secondary border small fw-normal">
              {orderCustomers.length} {orderCustomers.length === 1 ? 'Customer' : 'Customers'}
            </span>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {Array.from({ length: Math.max(6, orderCustomers.length) }, (_, i) => i + 1).map((num) => {
              const isSelected = orderCustomers.length === num;
              return (
                <button
                  key={num}
                  type="button"
                  className={`btn rounded-3 fw-bold transition ${
                    isSelected ? 'text-white shadow-sm' : 'btn-light border text-secondary'
                  }`}
                  style={{
                    width: '45px',
                    height: '42px',
                    background: isSelected ? '#2e37a4' : '#ffffff',
                    borderColor: isSelected ? '#2e37a4' : '#e2e8f0',
                    color: isSelected ? '#ffffff' : '#475569'
                  }}
                  onClick={() => handleCustomerCountChange(num)}
                >
                  {num}
                </button>
              );
            })}

            {/* + Customer Button (Starts directly from 7 since 1-6 buttons are on screen) */}
            <button
              type="button"
              className="btn btn-outline-primary rounded-3 fw-bold d-inline-flex align-items-center gap-1.5 px-3 transition shadow-xs"
              style={{
                height: '42px',
                borderColor: '#2e37a4',
                color: '#2e37a4',
                backgroundColor: '#f8fafc',
                borderStyle: 'dashed',
                borderWidth: '1.5px'
              }}
              onClick={handleAddCustomerPlus}
              title={orderCustomers.length < 6 ? 'Add 7th Customer' : `Add Customer ${orderCustomers.length + 1}`}
            >
              <i className="ti ti-plus fs-6"></i>
              <span>Customer</span>
            </button>
          </div>
        </div>

        {/* Customer Cards List */}
        {orderCustomers.length === 0 ? null : (
          <div className="d-flex flex-column gap-3">
            {orderCustomers.map((cust, ci) => {
              const custTotalPcs = getCustomerTotalPieces(cust);
              const isExpanded = expandedCustomerIdx === ci;

              return (
                <div key={cust.id || ci} className="card border rounded-4 shadow-xs overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
                  {/* Customer Accordion Header */}
                  <div
                    className="p-3 bg-light d-flex justify-content-between align-items-center cursor-pointer transition"
                    onClick={() => setExpandedCustomerIdx(isExpanded ? -1 : ci)}
                    style={{ borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold fs-6 shadow-xs"
                        style={{ width: '36px', height: '36px', background: '#2e37a4' }}
                      >
                        {ci + 1}
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-0">Customer {ci + 1}</h6>
                        <span className="text-muted small">
                          {(cust.assignedArticleIds || []).length} articles &bull; {(cust.selectedColors || []).length} colors &bull; {custTotalPcs} pcs
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <button
                        type="button"
                        className="btn btn-link text-danger p-0 small text-decoration-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomer(ci);
                        }}
                      >
                        Remove
                      </button>
                      <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'} fs-5 text-muted`}></i>
                    </div>
                  </div>

                  {/* Customer Accordion Body */}
                  {isExpanded && (
                    <div className="p-4 bg-white">
                      {/* Customer Selection */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold small text-muted mb-1">Select Customer</label>
                        <div className="d-flex gap-2 align-items-center">
                          <select
                            className="form-select"
                            value={cust.customerId}
                            onChange={(e) => updateCustomerField(ci, 'customerId', e.target.value)}
                          >
                            <option value="">Choose from list...</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.type || 'B2B'})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn btn-sm erp-btn-outline rounded-3 fw-semibold px-3 py-2 text-nowrap d-inline-flex align-items-center gap-1.5 shadow-xs"
                            onClick={() => {
                              setActiveCustomerIdxForNewCustomer(ci);
                              setShowNewCustomerModal(true);
                            }}
                          >
                            <i className="ti ti-plus fs-7"></i>
                            <span>New Customer</span>
                          </button>
                        </div>
                      </div>

                      {/* Articles for this Customer */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold small text-muted mb-2">
                          Articles for this customer:
                        </label>
                        <div className="d-flex flex-wrap gap-2">
                          {addedArticles.length === 0 ? (
                            <span className="text-muted small">Select articles above first</span>
                          ) : (
                            addedArticles.map((art) => {
                              const isAssigned = (cust.assignedArticleIds || []).includes(art.id);
                              return (
                                <button
                                  key={art.id}
                                  type="button"
                                  className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5 transition ${
                                    isAssigned ? 'btn-primary text-white shadow-xs' : 'btn-light border text-secondary'
                                  }`}
                                  style={{ backgroundColor: isAssigned ? '#2e37a4' : '#f8fafc', borderColor: isAssigned ? '#2e37a4' : '#e2e8f0' }}
                                  onClick={() => toggleCustomerArticle(ci, art.id)}
                                >
                                  <span>{art.name}</span>
                                  {isAssigned && <i className="ti ti-check small"></i>}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Colors for this Customer with Seasonal / Collection Tabs */}
                      <div className="mb-4">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                          <div>
                            <label className="form-label fw-semibold small text-muted mb-0">
                              Colors for this Customer:
                            </label>
                            <span className="text-secondary small ms-2">
                              ({(cust.selectedColors || []).length} selected &bull; {masterColors.length} in palette)
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary rounded-pill px-3 py-1 fw-semibold shadow-xs d-inline-flex align-items-center gap-1.5"
                            style={{ backgroundColor: '#2e37a4', borderColor: '#2e37a4' }}
                            onClick={() => {
                              setActiveCustomerIndexForNewColor(ci);
                              setShowNewColorModal(true);
                            }}
                          >
                            <i className="ti ti-plus fs-6"></i>
                            <span>+ Add Colour</span>
                          </button>
                        </div>

                        {/* Section 6.2: Seasonal Quarter & Trending Filter Tabs + Search Filter */}
                        <div className="p-2.5 rounded-3 mb-2.5 bg-light border" style={{ borderColor: '#e2e8f0' }}>
                          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                            {/* Filter Tabs */}
                            <div className="d-flex flex-wrap gap-1">
                              {(() => {
                                return [
                                  { key: 'allSeason', label: 'All Season', icon: '☀️' },
                                  { key: 'Q4', label: 'Oct–Dec (Q4)', icon: '❄️' },
                                  { key: 'Q1', label: 'Jan–Mar (Q1)', icon: '🌸' },
                                  { key: 'Q2', label: 'Apr–Jun (Q2)', icon: '🌱' },
                                  { key: 'Q3', label: 'Jul–Sep (Q3)', icon: '🌧️' },
                                ];
                              })().map(tab => {
                                const currentTab = customerColorTab[ci] || 'allSeason';
                                const isActive = currentTab === tab.key;
                                return (
                                  <button
                                    key={tab.key}
                                    type="button"
                                    className={`btn btn-sm py-1 px-2.5 rounded-pill fw-semibold transition ${
                                      isActive ? 'btn-primary text-white shadow-xs' : 'btn-light border text-secondary'
                                    }`}
                                    style={{
                                      fontSize: '12px',
                                      backgroundColor: isActive ? '#2e37a4' : '#ffffff',
                                      borderColor: isActive ? '#2e37a4' : '#cbd5e1'
                                    }}
                                    onClick={() => setCustomerColorTab(prev => ({ ...prev, [ci]: tab.key }))}
                                  >
                                    <span className="me-1">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Search filter input */}
                            <div style={{ minWidth: '150px', maxWidth: '200px' }}>
                              <div className="input-group input-group-sm">
                                <span className="input-group-text bg-white border-end-0 text-muted py-1">
                                  <i className="ti ti-search" style={{ fontSize: '12px' }}></i>
                                </span>
                                <input
                                  type="text"
                                  className="form-control border-start-0 py-1"
                                  placeholder="Filter colors..."
                                  style={{ fontSize: '12px' }}
                                  value={customerColorSearch[ci] || ''}
                                  onChange={(e) => setCustomerColorSearch(prev => ({ ...prev, [ci]: e.target.value }))}
                                />
                                {Boolean(customerColorSearch[ci]) && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary py-0 px-2"
                                    onClick={() => setCustomerColorSearch(prev => ({ ...prev, [ci]: '' }))}
                                  >
                                    &times;
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Currently Selected Colors Chips (Always visible so selections are never hidden) */}
                          {(cust.selectedColors || []).length > 0 && (
                            <div className="pt-2 border-top d-flex flex-wrap align-items-center gap-1.5" style={{ borderColor: '#e2e8f0' }}>
                              <span className="small fw-bold text-muted me-1" style={{ fontSize: '11px' }}>
                                Selected ({(cust.selectedColors || []).length}):
                              </span>
                              {(cust.selectedColors || []).map(colName => {
                                const colObj = masterColors.find(c => c.name.toLowerCase() === colName.toLowerCase()) || { hex: '#333333' };
                                return (
                                  <span
                                    key={colName}
                                    className="badge bg-white text-dark border rounded-pill py-1 px-2 d-inline-flex align-items-center gap-1 shadow-xs"
                                    style={{ fontSize: '12px', borderColor: '#cbd5e1' }}
                                  >
                                    <span
                                      className="rounded-circle border"
                                      style={{ width: '10px', height: '10px', backgroundColor: colObj.hex }}
                                    ></span>
                                    <span>{colName}</span>
                                    <button
                                      type="button"
                                      className="btn btn-link p-0 text-danger text-decoration-none ms-1 lh-1"
                                      onClick={() => toggleCustomerColor(ci, colName)}
                                      title="Remove color"
                                      style={{ fontSize: '14px', lineHeight: 1 }}
                                    >
                                      &times;
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Available Color Badges for Selection (Section 6.2 & Section 14.3) */}
                        {(() => {
                          const currentTab = customerColorTab[ci] || 'allSeason';
                          const searchQuery = (customerColorSearch[ci] || '').trim().toLowerCase();
                          const curQ = getCurrentQuarterTag();

                          if (masterColors.length === 0) {
                            return (
                              <div className="p-3 bg-white rounded-3 border text-center text-muted small my-2" style={{ borderColor: '#e2e8f0' }}>
                                <i className="ti ti-palette fs-4 d-block mb-1 text-secondary opacity-75"></i>
                                <span>No colours found in Colour Master yet. Click <strong>+ Add Colour</strong> above to add colours to your master palette.</span>
                              </div>
                            );
                          }

                          const displayedColors = masterColors.filter(col => {
                            // Section 14.3: A colour with no Quarter/Season tag must still be selectable via search
                            if (searchQuery) {
                              return col.name.toLowerCase().includes(searchQuery) ||
                                     (col.pantone || '').toLowerCase().includes(searchQuery);
                            }
                            // Section 14.3: A colour added via "+ Add Colour" mid-order must immediately appear in that order's colour list
                            if (newlyAddedColorNames.has(col.name)) return true;

                            const qTag = (col.quarterTag || 'All Season').toLowerCase();
                            // All Season shows all colors in palette
                            if (currentTab === 'allSeason') {
                              return true;
                            }
                            if (currentTab === 'Q1') return qTag === 'q1' || qTag === 'all' || qTag === 'all season';
                            if (currentTab === 'Q2') return qTag === 'q2' || qTag === 'all' || qTag === 'all season';
                            if (currentTab === 'Q3') return qTag === 'q3' || qTag === 'all' || qTag === 'all season';
                            if (currentTab === 'Q4') return qTag === 'q4' || qTag === 'all' || qTag === 'all season';
                            return true;
                          });

                          if (displayedColors.length === 0) {
                            return (
                              <div className="text-muted small py-2 px-1 fst-italic">
                                No colors match this filter. Try switching tabs or clearing search.
                              </div>
                            );
                          }

                          return (
                            <div className="d-flex flex-wrap gap-2">
                              {displayedColors.map((col) => {
                                const isSelected = (cust.selectedColors || []).includes(col.name);
                                return (
                                  <button
                                    key={col.id || col.name}
                                    type="button"
                                    className={`btn btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-2 transition ${
                                      isSelected ? 'btn-dark text-white shadow-xs' : 'btn-light border text-secondary'
                                    }`}
                                    style={{
                                      backgroundColor: isSelected ? '#1e293b' : '#ffffff',
                                      borderColor: isSelected ? '#0f172a' : '#cbd5e1'
                                    }}
                                    onClick={() => toggleCustomerColor(ci, col.name)}
                                    title={`${col.name} • ${col.quarterTag || 'All Season'}`}
                                  >
                                    <span
                                      className="rounded-circle border"
                                      style={{ width: '12px', height: '12px', backgroundColor: col.hex }}
                                    ></span>
                                    <span className="fw-medium">{col.name}</span>
                                    {isSelected && <i className="ti ti-check small text-white ms-0.5"></i>}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Sizes & Quantities Breakdown per (Article, Color) */}
                      {(cust.assignedArticleIds || []).length > 0 && (cust.selectedColors || []).length > 0 && (
                        <div className="pt-3 border-top">
                          <div className="small text-secondary fw-semibold mb-3">Sizes &amp; quantities:</div>

                          {(cust.assignedArticleIds || []).map((artId) => {
                            const artObj = addedArticles.find(a => a.id === artId);
                            if (!artObj) return null;

                            return (cust.selectedColors || []).map((colName) => {
                              const key = getSizeConfigKey(artId, colName);
                              const cfg = cust.sizeConfigs?.[key];
                              const colorObj = masterColors.find(c => c.name === colName) || { hex: '#333333' };

                              let pairTotalPieces = 0;
                              if (cfg?.sizeQtys) {
                                Object.values(cfg.sizeQtys).forEach(q => {
                                  pairTotalPieces += parseInt(q, 10) || 0;
                                });
                              }

                              return (
                                <div
                                  key={key}
                                  className="p-4 rounded-4 mb-4 bg-white shadow-xs"
                                  style={{
                                    border: '1.5px solid #c7d2fe',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '14px',
                                    boxShadow: '0 2px 10px rgba(46, 55, 164, 0.04)'
                                  }}
                                >
                                  <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="d-flex align-items-center gap-2">
                                      <span
                                        className="rounded-circle border"
                                        style={{ width: '12px', height: '12px', backgroundColor: colorObj.hex }}
                                      ></span>
                                      <span className="fw-bold text-dark" style={{ fontSize: '15px' }}>
                                        {artObj.name} &mdash; {colName}
                                      </span>
                                    </div>

                                    {/* Copy sizes to other colours button */}
                                    {cfg && (cust.selectedColors || []).length > 1 && (
                                      <button
                                        type="button"
                                        className="btn btn-sm erp-btn-outline rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1 shadow-xs"
                                        onClick={() => openCopySizesDialog(ci, artId, colName)}
                                      >
                                        <i className="ti ti-copy me-1"></i> Copy sizes to other colours
                                      </button>
                                    )}
                                  </div>

                                  {/* Series Configuration Section */}
                                  {(() => {
                                    const activeSeriesList = getPairSeriesConfigs(cust, artId, colName);
                                    let pairTotalPieces = 0;
                                    activeSeriesList.forEach(sc => {
                                      Object.values(sc.sizeQtys || {}).forEach(q => {
                                        pairTotalPieces += parseInt(q, 10) || 0;
                                      });
                                    });

                                    return (
                                      <div className="mt-2">
                                        {/* Always show "Pick a size series:" with Alpha, Numeric, Mix Sizes buttons */}
                                        <div className="mb-3">
                                          <div className="small text-muted mb-2 fw-medium" style={{ fontSize: '13px' }}>
                                            Pick a size series:
                                          </div>
                                          <div className="d-flex flex-wrap align-items-center" style={{ gap: '12px' }}>
                                            {normalizedMasterSizeSeries.map((series) => {
                                              const cleanSeries = getCleanSeriesName(series).toLowerCase();
                                              const seriesNameLower = (series.name || '').toLowerCase();
                                              const isOpen = activeSeriesList.some(sc => {
                                                const scClean = (sc.seriesName || '').toLowerCase();
                                                const scId = (sc.seriesId || '').toLowerCase();
                                                return scClean === cleanSeries || 
                                                       scClean === seriesNameLower || 
                                                       scId === cleanSeries || 
                                                       scId === seriesNameLower || 
                                                       scId === (series.id || '').toLowerCase();
                                              });

                                              return (
                                                <button
                                                  key={series.id || series.name}
                                                  type="button"
                                                  className={`btn rounded-3 px-4 py-2 transition ${
                                                    isOpen ? 'text-white fw-bold shadow-sm' : 'btn-white border text-dark fw-medium shadow-xs'
                                                  }`}
                                                  style={{
                                                    borderColor: isOpen ? '#2e37a4' : '#cbd5e1',
                                                    backgroundColor: isOpen ? '#2e37a4' : '#ffffff',
                                                    color: isOpen ? '#ffffff' : '#1e293b',
                                                    minWidth: '105px',
                                                    height: '38px',
                                                    fontSize: '13px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: isOpen ? '0 2px 6px rgba(46, 55, 164, 0.2)' : 'none'
                                                  }}
                                                  onClick={() => toggleSeriesInPair(ci, artId, colName, series)}
                                                >
                                                  <span>{series.displayName || series.name}</span>
                                                  {isOpen && <i className="ti ti-check ms-1.5 small"></i>}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        {/* Series Content */}
                                        {activeSeriesList.length === 0 ? (
                                          <div
                                            className="p-3 rounded-3 text-center border border-dashed bg-light text-muted"
                                            style={{ fontSize: '13px' }}
                                          >
                                            Click a size series above to open it and enter quantities.
                                          </div>
                                        ) : (
                                          <div className="d-flex flex-column gap-3">
                                            {activeSeriesList.map((sc, scIdx) => {
                                              const cleanScName = getCleanSeriesName({ name: sc.seriesName || sc.seriesId });
                                              const scNameLower = (sc.seriesName || '').toLowerCase();
                                              const defSeries = masterSizeSeries.find(s => 
                                                (s.id && sc.seriesId && s.id === sc.seriesId) ||
                                                (s.name && (s.name.toLowerCase() === scNameLower || s.name.toLowerCase() === cleanScName.toLowerCase())) ||
                                                getCleanSeriesName(s).toLowerCase() === cleanScName.toLowerCase() ||
                                                s.id === sc.seriesId || s.name === sc.seriesId
                                              ) || initialSizeSeries.find(s => 
                                                (s.id && sc.seriesId && s.id === sc.seriesId) ||
                                                (s.name && (s.name.toLowerCase() === scNameLower || s.name.toLowerCase() === cleanScName.toLowerCase())) ||
                                                getCleanSeriesName(s).toLowerCase() === cleanScName.toLowerCase()
                                              ) || {
                                                name: sc.seriesName || cleanScName,
                                                sizes: sc.sizes || []
                                              };
                                              const seriesName = sc.seriesName || defSeries.name || cleanScName || sc.seriesId;
                                              const seriesSizes = (defSeries.sizes && defSeries.sizes.length > 0)
                                                ? defSeries.sizes
                                                : (defSeries.sizeRecords && defSeries.sizeRecords.length > 0)
                                                  ? defSeries.sizeRecords.map(r => r.sizeName).filter(Boolean)
                                                  : (sc.sizes || []);

                                              return (
                                                <div
                                                  key={`${sc.seriesId}_${scIdx}`}
                                                  className="bg-white rounded-3 shadow-xs"
                                                  style={{ border: '1px dashed #cbd5e1', borderRadius: '12px', backgroundColor: '#fcfdff', padding: '16px 20px' }}
                                                >
                                                  <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <span
                                                      className="badge rounded-pill px-3 py-1.5 fw-semibold"
                                                      style={{ backgroundColor: '#eef2ff', color: '#2e37a4', border: '1px solid #c7d2fe', fontSize: '12px' }}
                                                    >
                                                      {seriesName}
                                                    </span>
                                                    <button
                                                      type="button"
                                                      className="btn btn-link text-danger p-0 small text-decoration-none fw-medium"
                                                      onClick={() => removeSeriesFromPair(ci, artId, colName, sc.seriesId)}
                                                    >
                                                      Remove series
                                                    </button>
                                                  </div>

                                                  <div className="small text-muted mb-2.5 fw-medium" style={{ fontSize: '13px' }}>Tap the sizes needed:</div>
                                                  <div className="d-flex flex-wrap gap-2 mb-2.5">
                                                    {seriesSizes.map((sz) => {
                                                      const isSzSelected = (sc.selectedSizes || []).includes(sz);
                                                      return (
                                                        <button
                                                          key={sz}
                                                          type="button"
                                                          className={`btn btn-sm rounded-pill transition ${
                                                            isSzSelected ? 'fw-bold shadow-xs' : 'text-dark border bg-white shadow-xs'
                                                          }`}
                                                          style={{
                                                            minWidth: '46px',
                                                            height: '34px',
                                                            padding: '4px 12px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            backgroundColor: isSzSelected ? '#2e37a4' : '#ffffff',
                                                            borderColor: isSzSelected ? '#2e37a4' : '#e2e8f0',
                                                            color: isSzSelected ? '#ffffff' : '#334155',
                                                            fontSize: '13px'
                                                          }}
                                                          onClick={() => toggleSizeInPairSeries(ci, artId, colName, sc.seriesId, sz)}
                                                        >
                                                          {sz} {isSzSelected && <i className="ti ti-check small text-white ms-1"></i>}
                                                        </button>
                                                      );
                                                    })}
                                                  </div>

                                                  {/* Section 7: Size Series, Ratio & Quantity Matrix (PDF Page 13-14 & 24) */}
                                                  {(sc.selectedSizes || []).length >= 1 ? (
                                                    <div>
                                                      {/* Quantity Method Switcher (Ratio vs Uniform vs Manual) */}
                                                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2.5 p-2 rounded-3 bg-white border" style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                                          <span className="small fw-semibold text-muted" style={{ fontSize: '12px' }}>
                                                            Quantity Method:
                                                          </span>
                                                          <div className="btn-group btn-group-sm" role="group">
                                                            <button
                                                              type="button"
                                                              className="btn btn-sm d-inline-flex align-items-center gap-1.5 transition-all"
                                                              style={{
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                backgroundColor: (!sc.ratioUsed && sc.uniform !== true) ? '#2e37a4' : '#ffffff',
                                                                color: (!sc.ratioUsed && sc.uniform !== true) ? '#ffffff' : '#475569',
                                                                borderColor: (!sc.ratioUsed && sc.uniform !== true) ? '#2e37a4' : '#cbd5e1',
                                                                boxShadow: (!sc.ratioUsed && sc.uniform !== true) ? '0 2px 4px rgba(46,55,164,0.2)' : 'none'
                                                              }}
                                                              onClick={() => {
                                                                setRatioModeForPairSeries(ci, artId, colName, sc.seriesId, false);
                                                                setUniformModeForPairSeries(ci, artId, colName, sc.seriesId, false);
                                                              }}
                                                            >
                                                              <span>✍️</span>
                                                              <span>Manual Entry</span>
                                                            </button>

                                                            <button
                                                              type="button"
                                                              className="btn btn-sm d-inline-flex align-items-center gap-1.5 transition-all"
                                                              style={{
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                backgroundColor: sc.ratioUsed ? '#2e37a4' : '#ffffff',
                                                                color: sc.ratioUsed ? '#ffffff' : '#475569',
                                                                borderColor: sc.ratioUsed ? '#2e37a4' : '#cbd5e1',
                                                                boxShadow: sc.ratioUsed ? '0 2px 4px rgba(46,55,164,0.2)' : 'none'
                                                              }}
                                                              onClick={() => {
                                                                setRatioModeForPairSeries(ci, artId, colName, sc.seriesId, true);
                                                              }}
                                                            >
                                                              <span>⚡</span>
                                                              <span>Set Ratio (e.g. 1:2:2:1)</span>
                                                            </button>

                                                            {(sc.selectedSizes || []).length >= 2 && (
                                                              <button
                                                                type="button"
                                                                className="btn btn-sm d-inline-flex align-items-center gap-1.5 transition-all"
                                                                style={{
                                                                  fontSize: '12px',
                                                                  fontWeight: 600,
                                                                  backgroundColor: (sc.uniform === true && !sc.ratioUsed) ? '#2e37a4' : '#ffffff',
                                                                  color: (sc.uniform === true && !sc.ratioUsed) ? '#ffffff' : '#475569',
                                                                  borderColor: (sc.uniform === true && !sc.ratioUsed) ? '#2e37a4' : '#cbd5e1',
                                                                  boxShadow: (sc.uniform === true && !sc.ratioUsed) ? '0 2px 4px rgba(46,55,164,0.2)' : 'none'
                                                                }}
                                                                onClick={() => {
                                                                  setRatioModeForPairSeries(ci, artId, colName, sc.seriesId, false);
                                                                  setUniformModeForPairSeries(ci, artId, colName, sc.seriesId, true);
                                                                }}
                                                              >
                                                                <span>🟰</span>
                                                                <span>Uniform (Same for All)</span>
                                                              </button>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>

                                                      {/* Set Ratio Calculator Card */}
                                                      {sc.ratioUsed && (
                                                        <div
                                                          className="p-3.5 rounded-3 mb-3 shadow-xs"
                                                          style={{
                                                            backgroundColor: '#f8faff',
                                                            border: '1.5px solid #c7d2fe',
                                                            borderRadius: '10px'
                                                          }}
                                                        >
                                                          <div className="d-flex align-items-center justify-content-between mb-2.5 flex-wrap gap-2">
                                                            <div className="d-flex align-items-center gap-2">
                                                              <div
                                                                className="rounded-2 d-flex align-items-center justify-content-center"
                                                                style={{ width: '28px', height: '28px', backgroundColor: '#eef2ff', color: '#2e37a4' }}
                                                              >
                                                                <i className="ti ti-calculator" style={{ fontSize: '16px' }}></i>
                                                              </div>
                                                              <div>
                                                                <span className="fw-bold d-block" style={{ fontSize: '13.5px', color: '#1e293b' }}>
                                                                  Set Ratio Calculator
                                                                </span>
                                                                <span className="text-muted" style={{ fontSize: '11px' }}>
                                                                  Distribute set quantities across selected sizes using ratio
                                                                </span>
                                                              </div>
                                                            </div>
                                                            <span
                                                              className="badge rounded-pill fw-semibold px-2.5 py-1"
                                                              style={{ fontSize: '11.5px', backgroundColor: '#eef2ff', color: '#2e37a4', border: '1px solid #c7d2fe' }}
                                                            >
                                                              {(sc.selectedSizes || []).length} Sizes Selected
                                                            </span>
                                                          </div>

                                                          <div className="row g-2.5 align-items-end">
                                                            {/* Ratio String Input */}
                                                            <div className="col-md-5">
                                                              <label className="form-label small fw-semibold text-dark mb-1" style={{ fontSize: '12px' }}>
                                                                Ratio (Numbers only, e.g. {(sc.selectedSizes || []).map((_, i) => i === 1 || i === 2 ? '2' : '1').join(':')})
                                                              </label>
                                                              <input
                                                                type="text"
                                                                className="form-control form-control-sm font-monospace fw-bold"
                                                                placeholder={`Type numbers (e.g. ${(sc.selectedSizes || []).map((_, i) => i === 1 || i === 2 ? '2' : '1').join('')})`}
                                                                value={sc.ratioString ?? ''}
                                                                onChange={(e) => {
                                                                  const formatted = formatRatioInput(e.target.value, sc.ratioString || '', (sc.selectedSizes || []).length);
                                                                  updateRatioCalculationForPairSeries(ci, artId, colName, sc.seriesId, formatted, sc.baseSetQty);
                                                                }}
                                                                style={{ fontSize: '13px', borderColor: '#cbd5e1', borderRadius: '7px', height: '36px', letterSpacing: '1px' }}
                                                              />
                                                            </div>

                                                            {/* Base Set Quantity */}
                                                            <div className="col-md-4">
                                                              <label className="form-label small fw-semibold text-dark mb-1" style={{ fontSize: '12px' }}>
                                                                Base Set Quantity (Multiplier)
                                                              </label>
                                                              <input
                                                                type="number"
                                                                min="1"
                                                                className="form-control form-control-sm fw-bold"
                                                                placeholder="100"
                                                                value={sc.baseSetQty && (sc._userEditedBase || sc.baseSetQty !== '100') ? sc.baseSetQty : ''}
                                                                onChange={(e) => updateRatioCalculationForPairSeries(ci, artId, colName, sc.seriesId, sc.ratioString, e.target.value, true)}
                                                                style={{ fontSize: '13px', borderColor: '#cbd5e1', borderRadius: '7px', height: '36px' }}
                                                              />
                                                            </div>

                                                            {/* Recalculate Button */}
                                                            <div className="col-md-3">
                                                              <button
                                                                type="button"
                                                                className="btn btn-sm text-white w-100 fw-semibold d-inline-flex align-items-center justify-content-center gap-1.5 shadow-xs"
                                                                style={{ height: '36px', fontSize: '12.5px', backgroundColor: '#2e37a4', borderColor: '#2e37a4', borderRadius: '7px' }}
                                                                onClick={() => {
                                                                  const base = parseInt(sc.baseSetQty, 10) || 100;
                                                                  updateRatioCalculationForPairSeries(ci, artId, colName, sc.seriesId, sc.ratioString, sc.baseSetQty || '', true);
                                                                }}
                                                              >
                                                                <i className="ti ti-refresh" style={{ fontSize: '14px' }}></i>
                                                                <span>Apply Ratio</span>
                                                              </button>
                                                            </div>
                                                          </div>

                                                          {/* Quick Ratio Presets */}
                                                          <div className="d-flex align-items-center gap-1.5 mt-2 flex-wrap">
                                                            <span className="text-muted small fw-semibold" style={{ fontSize: '11px' }}>Quick Presets:</span>
                                                            {[
                                                              (sc.selectedSizes || []).map(() => '1').join(':'),
                                                              (sc.selectedSizes || []).map((_, i) => (i === 1 || i === 2) ? '2' : '1').join(':')
                                                            ].filter((v, idx, arr) => v && arr.indexOf(v) === idx).map(preset => (
                                                              <button
                                                                key={preset}
                                                                type="button"
                                                                className="btn btn-xs py-0.5 px-2 rounded-2 fw-semibold border transition-all"
                                                                style={{
                                                                  fontSize: '11px',
                                                                  backgroundColor: sc.ratioString === preset ? '#eef2ff' : '#ffffff',
                                                                  color: sc.ratioString === preset ? '#2e37a4' : '#64748b',
                                                                  borderColor: sc.ratioString === preset ? '#818cf8' : '#e2e8f0'
                                                                }}
                                                                onClick={() => updateRatioCalculationForPairSeries(ci, artId, colName, sc.seriesId, preset, sc.baseSetQty)}
                                                              >
                                                                {preset}
                                                              </button>
                                                            ))}
                                                          </div>

                                                          {/* Validation & Ratio Preview */}
                                                          {(() => {
                                                            const parts = (sc.ratioString || '').split(':').map(p => p.trim()).filter(Boolean);
                                                            const selectedSizes = sc.selectedSizes || [];
                                                            const hasTyped = Boolean(sc.ratioString && sc.ratioString.trim().length > 0);
                                                            const isCountMatch = parts.length === selectedSizes.length;
                                                            const isValidNums = parts.every(p => !isNaN(parseInt(p, 10)) && parseInt(p, 10) >= 0);

                                                            if (!hasTyped) {
                                                              return (
                                                                <div className="mt-2 text-muted small d-flex align-items-center gap-1.5" style={{ fontSize: '12px' }}>
                                                                  <i className="ti ti-info-circle text-primary"></i>
                                                                  <span>Type numbers only (e.g. {selectedSizes.map((_, i) => i === 1 || i === 2 ? '2' : '1').join('')}). Colons (:) will be added automatically.</span>
                                                                </div>
                                                              );
                                                            }

                                                            if (!isCountMatch || !isValidNums) {
                                                              return (
                                                                <div className="mt-2 text-danger small fw-medium d-flex align-items-center gap-1.5" style={{ fontSize: '12px' }}>
                                                                  <i className="ti ti-alert-triangle"></i>
                                                                  <span>
                                                                    Ratio requires exactly {selectedSizes.length} numbers (currently {parts.length}) for sizes [{selectedSizes.join(', ')}].
                                                                  </span>
                                                                </div>
                                                              );
                                                            }

                                                            const base = parseInt(sc.baseSetQty, 10) || 100;
                                                            const totalMultiplier = parts.reduce((acc, p) => acc + (parseInt(p, 10) || 0), 0);
                                                            const totalOrderPieces = totalMultiplier * base;

                                                            return (
                                                              <div className="mt-3 pt-2.5 border-top" style={{ borderColor: '#e2e8f0', fontSize: '12px' }}>
                                                                <div className="d-flex align-items-center justify-content-between mb-2">
                                                                  <span className="text-muted fw-semibold">
                                                                    Size Ratio Breakdown ({totalMultiplier} pcs/set):
                                                                  </span>
                                                                  <span className="badge bg-primary-subtle text-primary fw-bold px-2 py-1">
                                                                    Total: {totalOrderPieces.toLocaleString()} Pieces ({base} Sets)
                                                                  </span>
                                                                </div>
                                                                <div className="d-flex flex-wrap align-items-center gap-2">
                                                                  {selectedSizes.map((sz, idx) => {
                                                                    const mult = parseInt(parts[idx], 10) || 0;
                                                                    const res = base * mult;
                                                                    return (
                                                                      <span
                                                                        key={sz}
                                                                        className="badge bg-white text-dark border px-2.5 py-1.5 shadow-2xs d-inline-flex align-items-center gap-1"
                                                                        style={{ borderColor: '#cbd5e1', borderRadius: '6px', fontSize: '12px' }}
                                                                      >
                                                                        <span className="fw-bold text-dark">{sz}:</span>
                                                                        <span className="text-muted">{mult} &times; {base} =</span>
                                                                        <span className="fw-bold" style={{ color: '#2e37a4' }}>{res} pcs</span>
                                                                      </span>
                                                                    );
                                                                  })}
                                                                </div>
                                                              </div>
                                                            );
                                                          })()}
                                                        </div>
                                                      )}

                                                      {/* Uniform Quantity Input */}
                                                      {sc.uniform === true && !sc.ratioUsed && (
                                                        <div className="d-flex align-items-center gap-3 mb-2.5 p-3 rounded-3 bg-light border" style={{ borderColor: '#e2e8f0' }}>
                                                          <div style={{ maxWidth: '240px' }}>
                                                            <label className="form-label small text-muted mb-1 fw-semibold">Quantity for all selected sizes</label>
                                                            <input
                                                              type="number"
                                                              className="form-control form-control-sm"
                                                              placeholder="e.g. 100"
                                                              value={sc.uniformQty || ''}
                                                              onChange={(e) => updateUniformQtyForPairSeries(ci, artId, colName, sc.seriesId, e.target.value)}
                                                            />
                                                          </div>
                                                          <div className="small text-muted pt-3">
                                                            Auto-fills {sc.uniformQty || 0} pieces across all {(sc.selectedSizes || []).length} sizes.
                                                          </div>
                                                        </div>
                                                      )}

                                                      {/* Pieces Grid: Size Quantity Inputs */}
                                                      <div className="d-flex flex-wrap gap-2 pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
                                                        {(sc.selectedSizes || []).map((sz, sIdx) => {
                                                          const parts = (sc.ratioString || '').split(':').map(p => p.trim());
                                                          const ratioPart = sc.ratioUsed && parts[sIdx] !== undefined ? parts[sIdx] : null;

                                                          return (
                                                            <div
                                                              key={sz}
                                                              className="d-flex flex-column align-items-center p-2 rounded-3 border bg-white shadow-2xs"
                                                              style={{ borderColor: '#e2e8f0', minWidth: '78px' }}
                                                            >
                                                              <span className="small fw-bold text-dark" style={{ fontSize: '13px' }}>{sz}</span>
                                                              {ratioPart !== null && (
                                                                <span
                                                                  className="badge rounded-pill fw-semibold border px-1.5 py-0.5"
                                                                  style={{ fontSize: '10px', marginTop: '2px', backgroundColor: '#eef2ff', color: '#2e37a4', borderColor: '#c7d2fe' }}
                                                                >
                                                                  &times;{ratioPart}
                                                                </span>
                                                              )}
                                                              <input
                                                                type="number"
                                                                className="form-control form-control-sm text-center bg-white mt-1.5 fw-bold"
                                                                style={{ width: '68px', height: '32px', borderColor: '#cbd5e1', borderRadius: '6px' }}
                                                                placeholder="0"
                                                                value={sc.sizeQtys?.[sz] ?? ''}
                                                                onChange={(e) => updateIndividualSizeQtyForPairSeries(ci, artId, colName, sc.seriesId, sz, e.target.value)}
                                                              />
                                                            </div>
                                                          );
                                                        })}
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div className="text-muted small pt-1" style={{ fontSize: '13px', color: '#64748b' }}>Select at least one size above to enter quantities.</div>
                                                  )}
                                                </div>
                                              );
                                            })}

                                            <div className="d-flex justify-content-end pt-3 border-top" style={{ borderColor: '#f1f5f9' }}>
                                              <span
                                                className="badge rounded-pill p-2 px-3 fw-bold shadow-xs"
                                                style={{ backgroundColor: '#eef2ff', color: '#2e37a4', border: '1px solid #c7d2fe', fontSize: '13px' }}
                                              >
                                                Total: {pairTotalPieces} pcs
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              );
                            });
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Immediate Save Action Bar directly following Customer Details & Quantities */}
        <div
          className="p-3 mt-4 rounded-4 d-flex justify-content-between align-items-center flex-wrap gap-3 border shadow-xs"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#c7d2fe',
            boxShadow: '0 4px 14px rgba(46, 55, 164, 0.08)'
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <span
              className="badge rounded-pill px-3 py-2 fw-bold d-inline-flex align-items-center gap-1.5"
              style={{ backgroundColor: '#2e37a4', color: '#ffffff', fontSize: '13px' }}
            >
              <i className="ti ti-box fs-6"></i>
              <span>{grandTotalOrderPieces} pcs configured</span>
            </span>
            <span className="text-muted small">
              {orderCustomers.length} customer(s) &bull; {addedArticles.length || 1} article(s)
            </span>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-3 px-3 py-2 fw-medium"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn rounded-3 px-3 py-2 fw-semibold"
              style={{ border: '1.5px solid #2e37a4', color: '#2e37a4', backgroundColor: '#ffffff' }}
              onClick={() => handleFinalSave('Draft')}
            >
              <i className="ti ti-file-text me-1"></i> Save as Draft
            </button>
            <button
              type="button"
              className="btn text-white rounded-3 px-4 py-2 fw-semibold shadow-sm"
              style={{ backgroundColor: '#2e37a4', borderColor: '#2e37a4' }}
              onClick={() => handleFinalSave('Saved')}
            >
              <i className="ti ti-check me-1"></i> Save Order
            </button>
          </div>
        </div>
      </div>

      {/* Copy Sizes Dialog Modal */}
      {copySizesModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 p-3">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">Copy sizes &amp; quantities to other colours</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setCopySizesModal(null)}
                ></button>
              </div>
              <div className="modal-body py-3">
                <p className="small text-muted mb-3">
                  This copies the exact series, sizes and quantities from <strong>{copySizesModal.sourceColor}</strong> onto whichever colours you tick below. Each copy stays independently editable afterward.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  {copySizesModal.targetColors.map(tCol => (
                    <label key={tCol} className="btn btn-sm btn-light border rounded-pill px-3 py-1.5 d-flex align-items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        data-target-col={tCol}
                        className="form-check-input mt-0"
                      />
                      <span>{tCol}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light rounded-3 px-3"
                  onClick={() => setCopySizesModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn text-white rounded-3 px-4 fw-semibold"
                  style={{ backgroundColor: '#2e37a4' }}
                  onClick={() => {
                    const checkedInputs = Array.from(document.querySelectorAll('input[data-target-col]:checked'));
                    const selectedCols = checkedInputs.map(el => el.getAttribute('data-target-col'));
                    executeCopySizes(selectedCols);
                  }}
                >
                  Copy Sizes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline New Fabric Modal (+ New Fabric matching Fabric Master) */}
      {showNewFabricModal && (
        <FabricMasterView
          isInline={true}
          fabrics={fabrics}
          onSaveFabric={(newFabric) => {
            handleSaveInlineFabric(newFabric);
          }}
          onCloseInline={(newCreatedFabric) => {
            if (newCreatedFabric) {
              handleSaveInlineFabric(newCreatedFabric);
            } else {
              setShowNewFabricModal(false);
              setActiveFabricRowTarget(null);
            }
          }}
        />
      )}

      {/* Inline Modal: Color Master Creation (Matching PO AddColorModal) */}
      {showNewColorModal && (
        <AddColorModal
          colors={masterColors}
          onSave={(newColor) => {
            handleSaveInlineColor(newColor);
          }}
          onClose={(newColor) => {
            setShowNewColorModal(false);
            if (newColor && newColor.name) {
              handleSaveInlineColor(newColor);
            }
          }}
        />
      )}

      {/* Customer Master Inline View */}
      {showNewCustomerModal && (
        <CustomerMasterView
          isInline={true}
          onSaveInline={(newCust) => {
            setCustomers(prev => [...prev, newCust]);
            if (activeCustomerIdxForNewCustomer !== null && activeCustomerIdxForNewCustomer !== undefined) {
              updateCustomerField(activeCustomerIdxForNewCustomer, 'customerId', newCust.id);
            }
            setShowNewCustomerModal(false);
          }}
          onCloseInline={() => setShowNewCustomerModal(false)}
        />
      )}

      {/* Article Master Inline View */}
      {showNewArticleModal && (
        <ArticleMasterView
          isInline={true}
          onSaveInline={(newArt) => {
            const synced = loadSyncedArticles();
            setArticleTypes(synced);
            const found = synced.find(a => a.id === newArt.id || a.name === newArt.name) || {
              id: newArt.id || `ART-${Date.now()}`,
              name: newArt.name,
              emoji: newArt.icon || newArt.emoji || '👕',
              icon: newArt.icon || newArt.emoji || '👕',
              sortOrder: synced.length + 1,
              active: true
            };
            toggleArticleSelection(found);
            setShowNewArticleModal(false);
          }}
          onCloseInline={() => setShowNewArticleModal(false)}
        />
      )}
    </div>
  );
}
