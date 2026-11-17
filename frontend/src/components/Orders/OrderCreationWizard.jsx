import React, { useState, useMemo, useEffect } from 'react';
import {
  initialCustomers,
  initialArticles,
  initialSizeSeries,
  getStoredData,
  setStoredData,
  getStoredColorsMaster,
  setStoredColorsMaster,
  getStoredArticlesMaster,
  setStoredArticlesMaster
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

// Returns normalized quarter category: 'Q1', 'Q2', 'Q3', 'Q4', or 'ALL_SEASON'
export const getColorQuarterTag = (col) => {
  const raw = (col?.quarterTag || col?.quarter_tag || col?.quarter || '').trim().toUpperCase();
  if (raw === 'Q1' || raw === 'Q2' || raw === 'Q3' || raw === 'Q4') {
    return raw;
  }
  return 'ALL_SEASON';
};

// Synchronize articles directly from Article Master (erp_articles_v1 / initialArticles)
export const loadSyncedArticles = () => {
  const source = getStoredArticlesMaster();
  return (Array.isArray(source) ? source : []).filter(a => a.active !== false).map((a, idx) => ({
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
const DEFAULT_FABRICS = [];

// Helper to capitalize the first character of each word (Title Case)
export const autoCapitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};
export const capitalizeWords = autoCapitalizeWords;

export default function OrderCreationWizard({ onSaveOrder, onCancel, editingOrder = null }) {
  // Master Data State
  const [masterSizeSeries, setMasterSizeSeries] = useState(() => {
    const stored = getStoredData('erp_size_series_v1', null);
    if (Array.isArray(stored)) {
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
    if (!Array.isArray(raw)) {
      raw = procurementFabrics || [];
    }
    const filtered = filterRealFabrics(raw);
    return filtered.map(f => ({
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

  // Real-time synchronization with Fabric Master
  useEffect(() => {
    const handleFabricsSync = () => {
      const stored = getStoredData('raindrop_fabrics_v1', null);
      if (Array.isArray(stored)) {
        const filtered = filterRealFabrics(stored);
        setFabrics(filtered.map(f => ({
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
        })));
      }
    };
    window.addEventListener('storage', handleFabricsSync);
    window.addEventListener('raindrop_fabrics_updated', handleFabricsSync);
    return () => {
      window.removeEventListener('storage', handleFabricsSync);
      window.removeEventListener('raindrop_fabrics_updated', handleFabricsSync);
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
  const [activeColorArtTab, setActiveColorArtTab] = useState({});

  // Copy Sizes Modal State
  const [copySizesModal, setCopySizesModal] = useState(null); // { custIdx, articleId, colorId, sourceConfig }

  // 1. Order Information (Populated from editingOrder if provided, else blank default)
  const [orderInfo, setOrderInfo] = useState(() => {
    if (editingOrder) {
      return {
        orderId: editingOrder.id || editingOrder.orderId || '',
        styleName: editingOrder.styleName || '',
        orderDate: editingOrder.orderDate || new Date().toISOString().split('T')[0],
        expectedDelivery: editingOrder.expectedDelivery || '',
        priority: editingOrder.priority || 'Normal'
      };
    }
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

  // 2. Added Articles State (Populated from editingOrder.articles if available)
  const [addedArticles, setAddedArticles] = useState(() => {
    if (editingOrder && Array.isArray(editingOrder.articles) && editingOrder.articles.length > 0) {
      return editingOrder.articles.map(art => ({
        id: art.id || `ART-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        articleTypeId: art.articleTypeId || art.id,
        name: art.name || '',
        avgLength: art.avgLength || art.avgGarmentLength || '',
        fabrics: (Array.isArray(art.fabrics) && art.fabrics.length > 0)
          ? art.fabrics.map(f => ({
            role: f.role || '',
            fabricId: f.fabricId || '',
            fabricQuality: f.fabricQuality || '',
            avgLength: f.avgLength || art.avgLength || ''
          }))
          : [
            {
              role: '',
              fabricId: art.fabricId || '',
              fabricQuality: art.fabricQuality || '',
              avgLength: art.avgLength || ''
            }
          ]
      }));
    }
    return [];
  });

  // 3. Customers & Orders State (Populated from editingOrder.customerOrders / customers if available)
  const [orderCustomers, setOrderCustomers] = useState(() => {
    const rawCusts = editingOrder?.customerOrders || editingOrder?.customers;
    if (Array.isArray(rawCusts) && rawCusts.length > 0) {
      return rawCusts.map(c => ({
        id: c.id || `ORD-CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customerId: c.customerId || '',
        customerName: c.customerName || '',
        assignedArticleIds: Array.isArray(c.assignedArticleIds) ? c.assignedArticleIds : [],
        selectedColors: Array.isArray(c.selectedColors) ? c.selectedColors : [],
        jointCards: c.jointCards || {},
        configMode: c.configMode || {},
        articleColors: c.articleColors || {},
        sizeConfigs: c.sizeConfigs ? JSON.parse(JSON.stringify(c.sizeConfigs)) : {}
      }));
    }
    return [];
  });
  const [expandedCustomerIdx, setExpandedCustomerIdx] = useState(() => {
    const rawCusts = editingOrder?.customerOrders || editingOrder?.customers;
    return (Array.isArray(rawCusts) && rawCusts.length > 0) ? 0 : -1;
  });

  // Synchronize state if editingOrder prop changes
  useEffect(() => {
    if (editingOrder) {
      setOrderInfo({
        orderId: editingOrder.id || editingOrder.orderId || '',
        styleName: editingOrder.styleName || '',
        orderDate: editingOrder.orderDate || new Date().toISOString().split('T')[0],
        expectedDelivery: editingOrder.expectedDelivery || '',
        priority: editingOrder.priority || 'Normal'
      });
      if (Array.isArray(editingOrder.articles) && editingOrder.articles.length > 0) {
        setAddedArticles(editingOrder.articles.map(art => ({
          id: art.id || `ART-${Date.now()}-${Math.floor(Math.random() * 100)}`,
          articleTypeId: art.articleTypeId || art.id,
          name: art.name || '',
          avgLength: art.avgLength || art.avgGarmentLength || '',
          fabrics: (Array.isArray(art.fabrics) && art.fabrics.length > 0)
            ? art.fabrics.map(f => ({
              role: f.role || '',
              fabricId: f.fabricId || '',
              fabricQuality: f.fabricQuality || '',
              avgLength: f.avgLength || art.avgLength || ''
            }))
            : [
              {
                role: '',
                fabricId: art.fabricId || '',
                fabricQuality: art.fabricQuality || '',
                avgLength: art.avgLength || ''
              }
            ]
        })));
      }
      const rawCusts = editingOrder.customerOrders || editingOrder.customers;
      if (Array.isArray(rawCusts) && rawCusts.length > 0) {
        setOrderCustomers(rawCusts.map(c => ({
          id: c.id || `ORD-CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          customerId: c.customerId || '',
          customerName: c.customerName || '',
          assignedArticleIds: Array.isArray(c.assignedArticleIds) ? c.assignedArticleIds : [],
          selectedColors: Array.isArray(c.selectedColors) ? c.selectedColors : [],
          jointCards: c.jointCards || {},
          configMode: c.configMode || {},
          articleColors: c.articleColors || {},
          sizeConfigs: c.sizeConfigs ? JSON.parse(JSON.stringify(c.sizeConfigs)) : {}
        })));
        setExpandedCustomerIdx(0);
      }
    }
  }, [editingOrder]);

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
            } catch (e) { }
            return finalCombined;
          });
        }
      } catch (e) { }

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
      } catch (e) { }

      try {
        const storedSeries = getStoredData('erp_size_series_v1', null);
        if (Array.isArray(storedSeries)) {
          setMasterSizeSeries(storedSeries);
        }
      } catch (e) { }
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
      // Do not auto-assign newly added article to existing customers; user manually chooses
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
        assignedArticleIds: [], // Start empty: do not auto-select articles
        selectedColors: [],
        jointArticles: {},
        configMode: {},
        articleColors: {},
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
      const isAssigned = cur.includes(artId);
      const updated = isAssigned ? cur.filter(id => id !== artId) : [...cur, artId];
      let newSizeConfigs = { ...(c.sizeConfigs || {}) };
      if (isAssigned) {
        // If unassigning article, remove any configured size entries for this article
        newSizeConfigs = Object.fromEntries(
          Object.entries(newSizeConfigs).filter(([key]) => !key.startsWith(`${artId}_`))
        );
      }
      let newJointCards = { ...(c.jointCards || {}) };
      if (isAssigned) {
        // Clean up any cards referencing this unassigned article
        newJointCards = Object.fromEntries(
          Object.entries(newJointCards).filter(([sourceKey, targetKey]) =>
            !sourceKey.startsWith(`${artId}_`) && !targetKey.startsWith(`${artId}_`)
          )
        );
      }

      let nextConfigMode = { ...(c.configMode || {}) };
      if (nextConfigMode.connectionType === 'all') {
        nextConfigMode.connectedArticleIds = [...updated];
      } else if (nextConfigMode.connectionType === 'custom') {
        const curConnected = nextConfigMode.connectedArticleIds || [];
        const validConnected = curConnected.filter(id => updated.includes(id));
        nextConfigMode.connectedArticleIds = validConnected;
      }

      return { ...c, assignedArticleIds: updated, jointCards: newJointCards, jointArticles: {}, configMode: nextConfigMode, sizeConfigs: newSizeConfigs };
    }));
  };

  const toggleCustomerColor = (cIdx, colorName) => {
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const cur = c.selectedColors || [];
      const isSelected = cur.includes(colorName);
      const updated = isSelected ? cur.filter(col => col !== colorName) : [...cur, colorName];
      let newJointCards = { ...(c.jointCards || {}) };
      if (isSelected) {
        // If unselecting color, clean up any jointCards referencing this color
        newJointCards = Object.fromEntries(
          Object.entries(newJointCards).filter(([sourceKey, targetKey]) =>
            !sourceKey.endsWith(`_${colorName}`) && !targetKey.endsWith(`_${colorName}`)
          )
        );
      }
      return { ...c, selectedColors: updated, jointCards: newJointCards };
    }));
  };

  // --- Article Pairing & Card Joint Helpers (Direct Checkbox Jodi / Pairing) ---
  const getRootCardKey = (cust, cardKey) => {
    if (!cust || !cardKey) return cardKey;
    const jointCards = cust.jointCards || {};
    let cur = cardKey;
    let visited = new Set();
    while (jointCards[cur] && !visited.has(cur)) {
      visited.add(cur);
      cur = jointCards[cur];
    }
    return cur;
  };

  const areCardsJointed = (cust, keyA, keyB) => {
    if (!cust || !keyA || !keyB || keyA === keyB) return false;
    const jointCards = cust.jointCards || {};
    const rootA = getRootCardKey(cust, keyA);
    const rootB = getRootCardKey(cust, keyB);
    if (rootA === rootB) {
      return Boolean(jointCards[keyA] || jointCards[keyB] || (rootA !== keyA && rootB !== keyB));
    }
    return false;
  };

  const getSyncedCardKeys = (cust, cardKey) => {
    if (!cust || !cardKey) return [];
    const mode = cust.configMode || {};
    if (!mode.sameValue || !mode.sameSize) {
      return [cardKey];
    }
    const parts = cardKey.split('_');
    const artId = parts[0];
    const colorName = parts.slice(1).join('_');

    if (mode.connectionType === 'independent') {
      return [cardKey];
    }

    const assigned = cust.assignedArticleIds || [];
    const connectedIds = (mode.connectionType === 'custom' && Array.isArray(mode.connectedArticleIds))
      ? mode.connectedArticleIds
      : assigned;

    if (connectedIds.includes(artId)) {
      return connectedIds.map(aId => getSizeConfigKey(aId, colorName));
    }

    return [cardKey];
  };

  const getSizeSyncedCardKeys = (cust, cardKey) => {
    if (!cust || !cardKey) return [];
    const mode = cust.configMode || {};
    if (!mode.sameSize) return [cardKey];

    const parts = cardKey.split('_');
    const artId = parts[0];
    const colorName = parts.slice(1).join('_');

    if (mode.connectionType === 'independent') {
      return [cardKey];
    }

    const assigned = cust.assignedArticleIds || [];
    const connectedIds = (mode.connectionType === 'custom' && Array.isArray(mode.connectedArticleIds))
      ? mode.connectedArticleIds
      : assigned;

    if (connectedIds.includes(artId)) {
      if (mode.sameColor !== false) {
        return connectedIds.map(aId => getSizeConfigKey(aId, colorName));
      }
      // If sameColor is false (e.g. Contrast Combo): sync across corresponding colors
      const thisArtColors = (cust.articleColors && cust.articleColors[artId]) || cust.selectedColors || [];
      const colIdx = thisArtColors.indexOf(colorName);
      return connectedIds.map(aId => {
        if (aId === artId) return cardKey;
        const otherArtColors = (cust.articleColors && cust.articleColors[aId]) || cust.selectedColors || [];
        const targetColor = (colIdx >= 0 && otherArtColors[colIdx]) ? otherArtColors[colIdx] : (otherArtColors[0] || colorName);
        return getSizeConfigKey(aId, targetColor);
      });
    }

    return [cardKey];
  };

  // Helper to compute grouped cards for an order customer based on Set / Combo / Separate setup
  const computeArticleGroups = (cust) => {
    const assigned = (cust?.assignedArticleIds || []).filter(id => addedArticles.some(a => a.id === id));
    if (assigned.length === 0) return [];

    const mode = cust?.configMode || {};
    const isMatchingSet = Boolean(
      mode.connectionType &&
      mode.connectionType !== 'independent' &&
      mode.sameSize !== false &&
      (mode.connectionType === 'all' || mode.connectionType === 'custom')
    );

    if (mode.connectionType === 'custom') {
      const connected = (Array.isArray(mode.connectedArticleIds) && mode.connectedArticleIds.length >= 2)
        ? mode.connectedArticleIds.filter(id => assigned.includes(id))
        : assigned.slice(0, 2);
      const remaining = assigned.filter(aId => !connected.includes(aId));

      const groups = [];
      if (connected.length > 0) {
        const comboNames = connected.map(aId => addedArticles.find(a => a.id === aId)?.name).filter(Boolean);
        groups.push({
          groupKey: connected.join('___'),
          groupArtIds: [...connected],
          leadArtId: connected[0],
          isSet: true,
          isMatrixTable: false,
          label: comboNames.join(' + '),
          badgeLabel: mode.sameValue === false
            ? `✂️ Combo Set (${connected.length} Articles • Custom Qty)`
            : `✂️ 1:1 Combo Set (${connected.length} Articles)`
        });
      }
      remaining.forEach(aId => {
        const art = addedArticles.find(a => a.id === aId);
        groups.push({
          groupKey: aId,
          groupArtIds: [aId],
          leadArtId: aId,
          isSet: false,
          isMatrixTable: false,
          label: art?.name || 'Article',
          badgeLabel: '📦 Separate Article'
        });
      });
      return groups;
    }

    if (!isMatchingSet || assigned.length <= 1) {
      return assigned.map(aId => {
        const art = addedArticles.find(a => a.id === aId);
        return {
          groupKey: aId,
          groupArtIds: [aId],
          leadArtId: aId,
          isSet: false,
          isMatrixTable: false,
          label: art?.name || 'Article',
          badgeLabel: null
        };
      });
    }

    const names = assigned.map(aId => addedArticles.find(a => a.id === aId)?.name).filter(Boolean);
    return [{
      groupKey: assigned.join('___'),
      groupArtIds: [...assigned],
      leadArtId: assigned[0],
      isSet: true,
      isMatrixTable: false,
      label: names.join(' + '),
      badgeLabel: mode.sameValue === false
        ? `⚖️ Multi-Article Box (${assigned.length} Articles • Custom Values)`
        : `⚡ 1:1 Matching Set (${assigned.length} Articles)`
    }];
  };

  const setCustomerConfigMode = (cIdx, newMode) => {
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const updatedCust = {
        ...c,
        configMode: newMode
      };

      if (!newMode.sameColor) {
        const artCols = { ...(c.articleColors || {}) };
        const assigned = c.assignedArticleIds || [];
        assigned.forEach(aId => {
          if (!artCols[aId]) {
            artCols[aId] = [...(c.selectedColors || [])];
          }
        });
        updatedCust.articleColors = artCols;
      }

      if (newMode.sameValue && newMode.sameSize) {
        const assigned = c.assignedArticleIds || [];
        const connectedIds = (newMode.connectionType === 'custom' && Array.isArray(newMode.connectedArticleIds))
          ? newMode.connectedArticleIds
          : (newMode.connectionType === 'independent' ? [] : assigned);

        if (connectedIds.length > 1) {
          const leadArtId = connectedIds[0];
          const nextConfigs = { ...(c.sizeConfigs || {}) };

          if (newMode.sameColor !== false) {
            const colors = c.selectedColors || [];
            colors.forEach(col => {
              const leadKey = getSizeConfigKey(leadArtId, col);
              const leadCfg = nextConfigs[leadKey];
              if (leadCfg) {
                connectedIds.slice(1).forEach(otherArtId => {
                  const otherKey = getSizeConfigKey(otherArtId, col);
                  nextConfigs[otherKey] = JSON.parse(JSON.stringify(leadCfg));
                });
              }
            });
          } else {
            const leadColors = (c.articleColors && c.articleColors[leadArtId]) || c.selectedColors || [];
            leadColors.forEach((leadCol, cIdx) => {
              const leadKey = getSizeConfigKey(leadArtId, leadCol);
              const leadCfg = nextConfigs[leadKey];
              if (leadCfg) {
                connectedIds.slice(1).forEach(otherArtId => {
                  const otherColors = (c.articleColors && c.articleColors[otherArtId]) || c.selectedColors || [];
                  const otherCol = otherColors[cIdx] || otherColors[0];
                  if (otherCol) {
                    const otherKey = getSizeConfigKey(otherArtId, otherCol);
                    nextConfigs[otherKey] = JSON.parse(JSON.stringify(leadCfg));
                  }
                });
              }
            });
          }
          updatedCust.sizeConfigs = nextConfigs;
        }
      }

      return updatedCust;
    }));
  };

  const toggleCustomerArticleColor = (cIdx, artId, colName) => {
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const currentArtColors = c.articleColors || {};
      const artColList = currentArtColors[artId] || [];
      const isSelected = artColList.includes(colName);
      const updatedArtColList = isSelected ? artColList.filter(x => x !== colName) : [...artColList, colName];

      const newArtColors = {
        ...currentArtColors,
        [artId]: updatedArtColList
      };

      const allCols = Array.from(new Set(Object.values(newArtColors).flat()));

      return {
        ...c,
        articleColors: newArtColors,
        selectedColors: allCols
      };
    }));
  };

  const toggleArticleJointInColor = (cIdx, colorName, artIdA, artIdB) => {
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const keyA = getSizeConfigKey(artIdA, colorName);
      const keyB = getSizeConfigKey(artIdB, colorName);
      const nextJoint = { ...(c.jointCards || {}) };

      const currentlyJointed = areCardsJointed(c, keyA, keyB);

      if (currentlyJointed) {
        // Unlink: delete the connection
        if (nextJoint[keyB]) {
          delete nextJoint[keyB];
        } else if (nextJoint[keyA]) {
          delete nextJoint[keyA];
        } else {
          delete nextJoint[keyB];
          delete nextJoint[keyA];
        }
      } else {
        // Link: join them together in jointCards without overwriting values
        const rootA = getRootCardKey(c, keyA);
        const rootB = getRootCardKey(c, keyB);

        let finalRoot = rootA;
        let child = keyB;

        nextJoint[child] = finalRoot;
      }

      return {
        ...c,
        jointCards: nextJoint
      };
    }));
  };

  const getCardJointTarget = (cust, cardKey) => {
    return cust?.jointCards?.[cardKey] || null;
  };

  const toggleJointCard = (cIdx, cardKey, targetCardKey) => {
    // Compatibility adapter
    if (!targetCardKey) {
      setOrderCustomers(prev => prev.map((c, idx) => {
        if (idx !== cIdx) return c;
        const nextJoint = { ...(c.jointCards || {}) };
        delete nextJoint[cardKey];
        return { ...c, jointCards: nextJoint };
      }));
    }
  };

  const setJointCardTarget = (cIdx, cardKey, newTargetCardKey) => {
    // Compatibility adapter
  };

  // Legacy fallback helpers for compatibility
  const getCustomerArticleGroups = (cust) => {
    const assigned = (cust?.assignedArticleIds || []).filter(id => addedArticles.some(a => a.id === id));
    return assigned.map(id => ({
      groupId: id,
      isLinkedGroup: Boolean((cust?.jointArticles || {})[id]),
      leadArtId: (cust?.jointArticles || {})[id] || id,
      articleIds: [id],
      isCustomAddon: false
    }));
  };

  const getJointedArticleIds = (cust, artId) => {
    return [artId];
  };

  const toggleJointArticle = (cIdx, artId, targetArtId) => {
    // Adapter to toggle first color card
    const cust = orderCustomers[cIdx];
    if (cust && cust.selectedColors && cust.selectedColors.length > 0) {
      cust.selectedColors.forEach(col => {
        const cardKey = getSizeConfigKey(artId, col);
        const targetKey = targetArtId ? getSizeConfigKey(targetArtId, col) : null;
        toggleJointCard(cIdx, cardKey, targetKey);
      });
    }
  };

  const setJointTarget = (cIdx, artId, newTargetArtId) => {
    const cust = orderCustomers[cIdx];
    if (cust && cust.selectedColors && cust.selectedColors.length > 0) {
      cust.selectedColors.forEach(col => {
        const cardKey = getSizeConfigKey(artId, col);
        const targetKey = getSizeConfigKey(newTargetArtId, col);
        setJointCardTarget(cIdx, cardKey, targetKey);
      });
    }
  };

  // --- Sizes & Quantities Config per (Article, Color) ---
  const getSizeConfigKey = (artId, colorName) => `${artId}_${colorName}`;

  // Helper to get active series list for a customer (artId, colName) pair
  const getPairSeriesConfigs = (cust, artId, colorName) => {
    const actualColor = Array.isArray(colorName) ? colorName[0] : colorName;
    const key = getSizeConfigKey(artId, actualColor);
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
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      const syncedCardKeys = getSizeSyncedCardKeys(c, key);
      const isSyncingValues = Boolean(c.configMode?.sameValue && c.configMode?.sameSize);
      syncedCardKeys.forEach(k => {
        if (k === key || isSyncingValues) {
          nextConfigs[k] = {
            ...nextConfigs[k],
            seriesConfigs: JSON.parse(JSON.stringify(updatedList)),
            sizeQtys: { ...combinedQtys }
          };
        } else {
          const existingCardCfg = nextConfigs[k] || {};
          const existingSeriesList = existingCardCfg.seriesConfigs || [];
          const clonedSeries = updatedList.map(newSc => {
            const existingSc = existingSeriesList.find(s => s.seriesId === newSc.seriesId || s.seriesName === newSc.seriesName);
            return {
              ...newSc,
              sizeQtys: existingSc ? (existingSc.sizeQtys || {}) : {}
            };
          });
          const recomputed = computeCombinedSizeQtys(clonedSeries);
          nextConfigs[k] = {
            ...existingCardCfg,
            seriesConfigs: clonedSeries,
            sizeQtys: recomputed
          };
        }
      });
      return { ...c, sizeConfigs: nextConfigs };
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
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      const syncedCardKeys = getSizeSyncedCardKeys(c, key);
      syncedCardKeys.forEach(k => {
        const existingCardCfg = nextConfigs[k] || {};
        const cardList = (existingCardCfg.seriesConfigs || []).filter(sc => {
          const scClean = (sc.seriesName || '').toLowerCase();
          const scId = (sc.seriesId || '').toLowerCase();
          return scId !== cleanTarget && scClean !== cleanTarget;
        });
        const combined = computeCombinedSizeQtys(cardList);
        nextConfigs[k] = {
          ...existingCardCfg,
          seriesConfigs: cardList,
          sizeQtys: combined
        };
      });
      return { ...c, sizeConfigs: nextConfigs };
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
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      const syncedCardKeys = getSizeSyncedCardKeys(c, key);
      const isSyncingValues = Boolean(c.configMode?.sameValue && c.configMode?.sameSize);
      syncedCardKeys.forEach(k => {
        if (k === key || isSyncingValues) {
          nextConfigs[k] = {
            ...nextConfigs[k],
            seriesConfigs: JSON.parse(JSON.stringify(updatedList)),
            sizeQtys: { ...combinedQtys }
          };
        } else {
          const existingCardCfg = nextConfigs[k] || {};
          const existingSeriesList = existingCardCfg.seriesConfigs || [];
          const clonedSeries = updatedList.map(newSc => {
            const existingSc = existingSeriesList.find(s => s.seriesId === newSc.seriesId || s.seriesName === newSc.seriesName);
            return {
              ...newSc,
              sizeQtys: existingSc ? (existingSc.sizeQtys || {}) : {}
            };
          });
          const recomputed = computeCombinedSizeQtys(clonedSeries);
          nextConfigs[k] = {
            ...existingCardCfg,
            seriesConfigs: clonedSeries,
            sizeQtys: recomputed
          };
        }
      });
      return { ...c, sizeConfigs: nextConfigs };
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
            const baseNum = parseInt(baseQty, 10);
            if (!isNaN(baseNum) && baseNum > 0) {
              newQtys = {};
              selectedSizes.forEach((sz, sIdx) => {
                newQtys[sz] = String(baseNum * (parseInt(parts[sIdx], 10) || 1));
              });
            }
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
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      const syncedCardKeys = getSyncedCardKeys(c, key);
      syncedCardKeys.forEach(k => {
        nextConfigs[k] = {
          ...nextConfigs[k],
          seriesConfigs: JSON.parse(JSON.stringify(updatedList)),
          sizeQtys: { ...combinedQtys }
        };
      });
      return { ...c, sizeConfigs: nextConfigs };
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
        const cleanBase = baseQty !== undefined ? String(baseQty) : (sc.baseSetQty || '');
        const parts = cleanRatio.split(':').map(p => p.trim());
        const selectedSizes = sc.selectedSizes || [];

        let newQtys = { ...(sc.sizeQtys || {}) };
        // Section 14.4: A ratio string must be validated as a genuine ratio matching the number of selected sizes
        if (parts.length === selectedSizes.length && parts.every(p => p !== '' && !isNaN(parseInt(p, 10)) && parseInt(p, 10) >= 0)) {
          const baseNum = parseInt(cleanBase, 10);
          if (!isNaN(baseNum) && baseNum > 0) {
            newQtys = {};
            selectedSizes.forEach((sz, sIdx) => {
              const mult = parseInt(parts[sIdx], 10) || 0;
              newQtys[sz] = String(baseNum * mult);
            });
          } else {
            // No multiplier entered yet -> keep size quantities empty instead of defaulting to 100
            newQtys = {};
          }
        }
        return {
          ...sc,
          ratioString: cleanRatio,
          baseSetQty: cleanBase,
          _userEditedBase: userEdited || Boolean(cleanBase),
          sizeQtys: newQtys
        };
      });
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      const syncedCardKeys = getSyncedCardKeys(c, key);
      syncedCardKeys.forEach(k => {
        nextConfigs[k] = {
          ...nextConfigs[k],
          seriesConfigs: JSON.parse(JSON.stringify(updatedList)),
          sizeQtys: { ...combinedQtys }
        };
      });
      return { ...c, sizeConfigs: nextConfigs };
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
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      const syncedCardKeys = getSyncedCardKeys(c, key);
      syncedCardKeys.forEach(k => {
        nextConfigs[k] = {
          ...nextConfigs[k],
          seriesConfigs: JSON.parse(JSON.stringify(updatedList)),
          sizeQtys: { ...combinedQtys }
        };
      });
      return { ...c, sizeConfigs: nextConfigs };
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
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      const syncedCardKeys = getSyncedCardKeys(c, key);
      syncedCardKeys.forEach(k => {
        nextConfigs[k] = {
          ...nextConfigs[k],
          seriesConfigs: JSON.parse(JSON.stringify(updatedList)),
          sizeQtys: { ...combinedQtys }
        };
      });
      return { ...c, sizeConfigs: nextConfigs };
    }));
  };

  // Update individual size quantity in a series
  const updateIndividualSizeQtyForPairSeries = (cIdx, artId, colorName, seriesId, sz, qty) => {
    const colors = Array.isArray(colorName) ? colorName : [colorName];
    const leadCol = colors[0];
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, artId, leadCol);
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
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      colors.forEach(col => {
        const key = getSizeConfigKey(artId, col);
        const syncedCardKeys = getSyncedCardKeys(c, key);
        syncedCardKeys.forEach(k => {
          nextConfigs[k] = {
            ...nextConfigs[k],
            seriesConfigs: JSON.parse(JSON.stringify(updatedList)),
            sizeQtys: { ...combinedQtys }
          };
        });
      });
      return { ...c, sizeConfigs: nextConfigs };
    }));
  };

  // Group-aware series and size manipulators (works for 1 article or N linked articles, and 1 or N colors)
  const addSeriesToGroup = (cIdx, groupArtIds, colorName, seriesObj) => {
    const colorsToUpdate = Array.isArray(colorName) ? colorName : [colorName];
    const leadCol = colorsToUpdate[0];
    const leadArtId = groupArtIds[0];
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, leadArtId, leadCol);
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
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      const isIndependentQty = c.configMode?.connectionType === 'independent' || c.configMode?.sameValue === false;
      colorsToUpdate.forEach(cName => {
        groupArtIds.forEach(aId => {
          const key = getSizeConfigKey(aId, cName);
          if (isIndependentQty && aId !== leadArtId) {
            const existingCfg = nextConfigs[key] || {};
            const existingSeries = existingCfg.seriesConfigs || [];
            const mergedSeries = updatedList.map(newSc => {
              const exSc = existingSeries.find(s => s.seriesId === newSc.seriesId || s.seriesName === newSc.seriesName);
              const retainedQtys = { ...(exSc?.sizeQtys || {}) };
              const cleanQtys = {};
              (newSc.selectedSizes || []).forEach(sVal => {
                if (retainedQtys[sVal] !== undefined) cleanQtys[sVal] = retainedQtys[sVal];
              });
              return {
                ...newSc,
                sizeQtys: cleanQtys
              };
            });
            nextConfigs[key] = {
              ...existingCfg,
              seriesConfigs: mergedSeries,
              sizeQtys: computeCombinedSizeQtys(mergedSeries)
            };
          } else {
            nextConfigs[key] = {
              ...nextConfigs[key],
              seriesConfigs: updatedList,
              sizeQtys: combinedQtys
            };
          }
        });
      });
      return { ...c, sizeConfigs: nextConfigs };
    }));
  };

  const removeSeriesFromGroup = (cIdx, groupArtIds, colorName, seriesId) => {
    const colorsToUpdate = Array.isArray(colorName) ? colorName : [colorName];
    const leadCol = colorsToUpdate[0];
    const leadArtId = groupArtIds[0];
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, leadArtId, leadCol);
      const cleanTarget = (seriesId || '').toLowerCase();
      const updatedList = curList.filter(sc => {
        const scClean = (sc.seriesName || '').toLowerCase();
        const scId = (sc.seriesId || '').toLowerCase();
        return scId !== cleanTarget && scClean !== cleanTarget;
      });
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      colorsToUpdate.forEach(cName => {
        groupArtIds.forEach(aId => {
          const key = getSizeConfigKey(aId, cName);
          nextConfigs[key] = {
            ...nextConfigs[key],
            seriesConfigs: updatedList,
            sizeQtys: combinedQtys
          };
        });
      });
      return { ...c, sizeConfigs: nextConfigs };
    }));
  };

  const toggleSeriesInGroup = (cIdx, groupArtIds, colorName, seriesObj) => {
    const colorsToUpdate = Array.isArray(colorName) ? colorName : [colorName];
    const leadCol = colorsToUpdate[0];
    const cust = orderCustomers[cIdx];
    const leadArtId = groupArtIds[0];
    const curList = getPairSeriesConfigs(cust, leadArtId, leadCol);
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
      removeSeriesFromGroup(cIdx, groupArtIds, colorName, existing.seriesId);
    } else {
      addSeriesToGroup(cIdx, groupArtIds, colorName, seriesObj);
    }
  };

  const toggleSizeInGroupSeries = (cIdx, groupArtIds, colorName, seriesId, sz) => {
    const colorsToUpdate = Array.isArray(colorName) ? colorName : [colorName];
    const leadCol = colorsToUpdate[0];
    const leadArtId = groupArtIds[0];
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, leadArtId, leadCol);
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
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      colorsToUpdate.forEach(cName => {
        groupArtIds.forEach(aId => {
          const key = getSizeConfigKey(aId, cName);
          nextConfigs[key] = {
            ...nextConfigs[key],
            seriesConfigs: updatedList,
            sizeQtys: combinedQtys
          };
        });
      });
      return { ...c, sizeConfigs: nextConfigs };
    }));
  };

  const setRatioModeForGroupSeries = (cIdx, groupArtIds, colorName, seriesId, ratioUsed) => {
    const colorsToUpdate = Array.isArray(colorName) ? colorName : [colorName];
    const leadCol = colorsToUpdate[0];
    const leadArtId = groupArtIds[0];
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, leadArtId, leadCol);
      const updatedList = curList.map(sc => {
        if (sc.seriesId !== seriesId && sc.seriesName !== seriesId) return sc;
        const selectedSizes = sc.selectedSizes || [];
        const ratioStr = sc.ratioString || '';
        const baseQty = sc.baseSetQty || '';
        let newQtys = { ...(sc.sizeQtys || {}) };
        if (ratioUsed && ratioStr) {
          const parts = ratioStr.split(':').map(p => p.trim());
          if (parts.length === selectedSizes.length && parts.every(p => !isNaN(parseInt(p, 10)))) {
            const baseNum = parseInt(baseQty, 10);
            if (!isNaN(baseNum) && baseNum > 0) {
              newQtys = {};
              selectedSizes.forEach((sz, sIdx) => {
                newQtys[sz] = String(baseNum * (parseInt(parts[sIdx], 10) || 1));
              });
            }
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
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      colorsToUpdate.forEach(cName => {
        groupArtIds.forEach(aId => {
          const key = getSizeConfigKey(aId, cName);
          nextConfigs[key] = {
            ...nextConfigs[key],
            seriesConfigs: updatedList,
            sizeQtys: combinedQtys
          };
        });
      });
      return { ...c, sizeConfigs: nextConfigs };
    }));
  };

  const updateRatioCalculationForGroupSeries = (cIdx, groupArtIds, colorName, seriesId, ratioStr, baseQty, userEdited = false) => {
    const colorsToUpdate = Array.isArray(colorName) ? colorName : [colorName];
    const leadCol = colorsToUpdate[0];
    const leadArtId = groupArtIds[0];
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, leadArtId, leadCol);
      const updatedList = curList.map(sc => {
        if (sc.seriesId !== seriesId && sc.seriesName !== seriesId) return sc;
        const cleanRatio = ratioStr !== undefined ? ratioStr : (sc.ratioString || '');
        const cleanBase = baseQty !== undefined ? String(baseQty) : (sc.baseSetQty || '');
        const parts = cleanRatio.split(':').map(p => p.trim());
        const selectedSizes = sc.selectedSizes || [];
        let newQtys = { ...(sc.sizeQtys || {}) };
        if (parts.length === selectedSizes.length && parts.every(p => p !== '' && !isNaN(parseInt(p, 10)) && parseInt(p, 10) >= 0)) {
          const baseNum = parseInt(cleanBase, 10);
          if (!isNaN(baseNum) && baseNum > 0) {
            newQtys = {};
            selectedSizes.forEach((sz, sIdx) => {
              const mult = parseInt(parts[sIdx], 10) || 0;
              newQtys[sz] = String(baseNum * mult);
            });
          } else {
            newQtys = {};
          }
        }
        return {
          ...sc,
          ratioString: cleanRatio,
          baseSetQty: cleanBase,
          _userEditedBase: userEdited || Boolean(cleanBase),
          sizeQtys: newQtys
        };
      });
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      colorsToUpdate.forEach(cName => {
        groupArtIds.forEach(aId => {
          const key = getSizeConfigKey(aId, cName);
          nextConfigs[key] = {
            ...nextConfigs[key],
            seriesConfigs: updatedList,
            sizeQtys: combinedQtys
          };
        });
      });
      return { ...c, sizeConfigs: nextConfigs };
    }));
  };

  const setUniformModeForGroupSeries = (cIdx, groupArtIds, colorName, seriesId, isUniform) => {
    const colorsToUpdate = Array.isArray(colorName) ? colorName : [colorName];
    const leadCol = colorsToUpdate[0];
    const leadArtId = groupArtIds[0];
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, leadArtId, leadCol);
      const updatedList = curList.map(sc => {
        if (sc.seriesId !== seriesId && sc.seriesName !== seriesId) return sc;
        return { ...sc, uniform: isUniform };
      });
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      colorsToUpdate.forEach(cName => {
        groupArtIds.forEach(aId => {
          const key = getSizeConfigKey(aId, cName);
          nextConfigs[key] = {
            ...nextConfigs[key],
            seriesConfigs: updatedList,
            sizeQtys: combinedQtys
          };
        });
      });
      return { ...c, sizeConfigs: nextConfigs };
    }));
  };

  const updateUniformQtyForGroupSeries = (cIdx, groupArtIds, colorName, seriesId, qty) => {
    const colorsToUpdate = Array.isArray(colorName) ? colorName : [colorName];
    const leadCol = colorsToUpdate[0];
    const leadArtId = groupArtIds[0];
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, leadArtId, leadCol);
      const updatedList = curList.map(sc => {
        if (sc.seriesId !== seriesId && sc.seriesName !== seriesId) return sc;
        const newQtys = {};
        (sc.selectedSizes || []).forEach(sz => {
          newQtys[sz] = qty;
        });
        return { ...sc, uniformQty: qty, sizeQtys: newQtys };
      });
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      colorsToUpdate.forEach(cName => {
        groupArtIds.forEach(aId => {
          const key = getSizeConfigKey(aId, cName);
          nextConfigs[key] = {
            ...nextConfigs[key],
            seriesConfigs: updatedList,
            sizeQtys: combinedQtys
          };
        });
      });
      return { ...c, sizeConfigs: nextConfigs };
    }));
  };

  const updateIndividualSizeQtyForGroupSeries = (cIdx, groupArtIds, colorName, seriesId, sz, qty) => {
    const colorsToUpdate = Array.isArray(colorName) ? colorName : [colorName];
    const leadCol = colorsToUpdate[0];
    const leadArtId = groupArtIds[0];
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const curList = getPairSeriesConfigs(c, leadArtId, leadCol);
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
      const combinedQtys = computeCombinedSizeQtys(updatedList);
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      colorsToUpdate.forEach(cName => {
        groupArtIds.forEach(aId => {
          const key = getSizeConfigKey(aId, cName);
          nextConfigs[key] = {
            ...nextConfigs[key],
            seriesConfigs: updatedList,
            sizeQtys: combinedQtys
          };
        });
      });
      return { ...c, sizeConfigs: nextConfigs };
    }));
  };

  const updateIndividualSizeQtyForSingleArticle = (cIdx, artId, colorName, seriesId, sz, qty) => {
    const colorsToUpdate = Array.isArray(colorName) ? colorName : [colorName];
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const nextConfigs = { ...(c.sizeConfigs || {}) };
      colorsToUpdate.forEach(cName => {
        const key = getSizeConfigKey(artId, cName);
        const curList = getPairSeriesConfigs(c, artId, cName);
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
        const combinedQtys = computeCombinedSizeQtys(updatedList);
        nextConfigs[key] = {
          ...(nextConfigs[key] || {}),
          seriesConfigs: updatedList,
          sizeQtys: combinedQtys
        };
      });
      return { ...c, sizeConfigs: nextConfigs };
    }));
  };

  const copyArticleQuantities = (cIdx, fromArtId, toArtId, colorName, seriesId) => {
    const colorsToUpdate = Array.isArray(colorName) ? colorName : [colorName];
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== cIdx) return c;
      const leadCol = colorsToUpdate[0];
      const sourceList = getPairSeriesConfigs(c, fromArtId, leadCol);
      const sourceSc = sourceList.find(s => s.seriesId === seriesId || s.seriesName === seriesId);
      if (!sourceSc) return c;

      const nextConfigs = { ...(c.sizeConfigs || {}) };
      colorsToUpdate.forEach(cName => {
        const targetKey = getSizeConfigKey(toArtId, cName);
        const targetList = getPairSeriesConfigs(c, toArtId, cName);
        const updatedList = targetList.map(sc => {
          if (sc.seriesId !== seriesId && sc.seriesName !== seriesId) return sc;
          return {
            ...sc,
            sizeQtys: { ...(sourceSc.sizeQtys || {}) }
          };
        });
        const combinedQtys = computeCombinedSizeQtys(updatedList);
        nextConfigs[targetKey] = {
          ...(nextConfigs[targetKey] || {}),
          seriesConfigs: updatedList,
          sizeQtys: combinedQtys
        };
      });
      return { ...c, sizeConfigs: nextConfigs };
    }));
  };

  const openCopySizesForGroup = (cIdx, groupArtIds, sourceColor) => {
    const cust = orderCustomers[cIdx];
    const leadArtId = groupArtIds[0];
    const sourceCfg = cust?.sizeConfigs?.[getSizeConfigKey(leadArtId, sourceColor)];
    if (!sourceCfg) return;
    const targetColors = (cust.selectedColors || []).filter(c => c !== sourceColor);
    setCopySizesModal({
      custIdx: cIdx,
      articleIds: groupArtIds,
      articleId: leadArtId,
      sourceColor,
      targetColors,
      sourceConfig: sourceCfg
    });
  };

  // --- Copy sizes to other colours modal handler ---
  const openCopySizesDialog = (cIdx, artId, sourceColor) => {
    const cust = orderCustomers[cIdx];
    const sourceCardKey = getSizeConfigKey(artId, sourceColor);
    const sourceCfg = cust?.sizeConfigs?.[sourceCardKey];
    if (!sourceCfg) return;
    const targetColors = (cust.selectedColors || []).filter(c => c !== sourceColor);
    const syncedCardKeys = getSyncedCardKeys(cust, sourceCardKey);
    const groupArtIds = Array.from(new Set(syncedCardKeys.map(k => k.split('_')[0])));
    setCopySizesModal({
      custIdx: cIdx,
      articleIds: groupArtIds,
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
    const { custIdx, articleId, articleIds, sourceConfig } = copySizesModal;
    const targetArtIds = Array.isArray(articleIds) && articleIds.length > 0 ? articleIds : [articleId];
    setOrderCustomers(prev => prev.map((c, idx) => {
      if (idx !== custIdx) return c;
      const updatedConfigs = { ...(c.sizeConfigs || {}) };
      const updatedJoint = { ...(c.jointCards || {}) };
      selectedTargetColors.forEach(tCol => {
        targetArtIds.forEach(aId => {
          updatedConfigs[getSizeConfigKey(aId, tCol)] = JSON.parse(JSON.stringify(sourceConfig));
        });
        if (targetArtIds.length > 1) {
          const leadArt = articleId || targetArtIds[0];
          const leadTargetKey = getSizeConfigKey(leadArt, tCol);
          targetArtIds.forEach(aId => {
            if (aId !== leadArt) {
              updatedJoint[getSizeConfigKey(aId, tCol)] = leadTargetKey;
            }
          });
        }
      });
      return { ...c, sizeConfigs: updatedConfigs, jointCards: updatedJoint };
    }));
    setCopySizesModal(null);
  };

  // Helper: customer total pieces
  const getCustomerTotalPieces = (cust) => {
    let sum = 0;
    const assigned = cust.assignedArticleIds || [];
    assigned.forEach(artId => {
      const artCols = (!cust.configMode || cust.configMode.sameColor)
        ? (cust.selectedColors || [])
        : (cust.articleColors?.[artId] || []);
      artCols.forEach(colName => {
        const key = getSizeConfigKey(artId, colName);
        const cfg = cust.sizeConfigs?.[key];
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
      });
    });
    return sum;
  };

  // Total pieces per (articleId, colorName) across all customers
  const getPiecesForArticleColor = (artId, colorName) => {
    let sum = 0;
    const key = getSizeConfigKey(artId, colorName);
    orderCustomers.forEach(c => {
      const cColors = (!c.configMode || c.configMode.sameColor) ? (c.selectedColors || []) : (c.articleColors?.[artId] || []);
      if ((c.assignedArticleIds || []).includes(artId) && cColors.includes(colorName)) {
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
      if (!(c.assignedArticleIds || []).includes(artId)) return;
      const artCols = (!c.configMode || c.configMode.sameColor)
        ? (c.selectedColors || [])
        : (c.articleColors?.[artId] || []);
      artCols.forEach(colName => {
        const key = getSizeConfigKey(artId, colName);
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
      const artTotalPcs = getPiecesForArticle(art.id, art.name);
      if (artTotalPcs <= 0 && grandTotalOrderPieces > 0) return;
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
        let dyedPerPiece = '';
        const rawAvgLen = parseFloat(art.avgLength || fr.avgLength);
        const isDupatta = /dupatta|stole|chunri|scarf/i.test((art.name || '').trim());
        if (!isNaN(rawAvgLen) && rawAvgLen > 0) {
          // If Dupatta, entered directly in meters (mts); else in inches, convert to meters (1 in = 0.0254 m)
          dyedPerPiece = isDupatta ? Number(rawAvgLen.toFixed(3)) : Number((rawAvgLen * 0.0254).toFixed(3));
        } else if (fr.consumption !== undefined && fr.consumption !== null && fr.consumption !== '') {
          dyedPerPiece = parseFloat(fr.consumption) || '';
        } else if (art.consumption !== undefined && art.consumption !== null && art.consumption !== '') {
          dyedPerPiece = parseFloat(art.consumption) || '';
        } else {
          dyedPerPiece = '';
        }

        // Gather all colors used across customers for this article
        const usedColors = new Set();
        orderCustomers.forEach(c => {
          if ((c.assignedArticleIds || []).includes(art.id)) {
            (c.selectedColors || []).forEach(col => usedColors.add(col));
          }
        });

        const specificColor = fr.color || fr.colorName;
        const colorsToIterate = (specificColor && specificColor !== 'All Colours' && specificColor !== 'All')
          ? [specificColor]
          : (usedColors.size > 0 ? Array.from(usedColors) : ['Standard']);

        colorsToIterate.forEach(colName => {
          const articlePcs = usedColors.size > 0 ? getPiecesForArticleColor(art.id, colName) : 0;
          const isMainFabric = frIdx === 0 || (fr.role || '').toLowerCase() === 'main';
          // All fabrics of an article inherit article ordered pieces unless explicitly specified
          const pcs = (fr.pcs !== undefined && fr.pcs !== null && fr.pcs !== '')
            ? (parseInt(fr.pcs, 10) || 0)
            : articlePcs;
          // Skip if 0 pieces ordered
          if (pcs <= 0) return;

          const colorObj = masterColors.find(c => c.name === colName) || { hex: '#94a3b8' };
          const widthVal = fr.width || art.width || '';

          // RULE 1: Greige length per piece = Avg. (dyed) Length * (1 + Shrinkage%) * (1 + Buffer%)
          const greigeLengthPerPiece = (dyedPerPiece && dyedPerPiece > 0)
            ? Number((dyedPerPiece * (1 + shrinkPct / 100) * (1 + bufferPct / 100)).toFixed(3))
            : 0;

          // RULE 2: Total Greige = Greige length per piece * Pieces
          const totalDyed = (dyedPerPiece && dyedPerPiece > 0 && pcs > 0)
            ? Number((dyedPerPiece * pcs).toFixed(1))
            : 0;
          const totalGreige = (greigeLengthPerPiece && greigeLengthPerPiece > 0 && pcs > 0)
            ? Number((greigeLengthPerPiece * pcs).toFixed(1))
            : 0;
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
            isMainFabric,
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
      isCustomType: newFabric.isCustomType,
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
      } catch (err) { }
      return updated;
    });

    if (api && api.saveFabric) {
      try { api.saveFabric(cleanItem); } catch (err) { }
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
      try { await api.saveColor(created); } catch (err) { }
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

    // Automatically switch active customer's tab to the created color's section so it is immediately visible
    const targetQuarter = getColorQuarterTag(created);
    const targetTab = targetQuarter === 'ALL_SEASON' ? 'allSeason' : targetQuarter;
    if (activeCustomerIndexForNewColor !== null && activeCustomerIndexForNewColor !== undefined) {
      setCustomerColorTab(prev => ({
        ...prev,
        [activeCustomerIndexForNewColor]: targetTab
      }));
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

    const isDraft = status === 'Draft';
    const isAlreadyConfirmed = (editingOrder?.status === 'Confirmed' || editingOrder?.stage === 'Confirmed') && !isDraft;
    const finalStatus = isDraft ? 'Draft' : (isAlreadyConfirmed ? 'Confirmed' : 'Pending Confirmation');
    const finalStage = isDraft ? 'Draft' : (isAlreadyConfirmed ? 'Confirmed' : 'Pending Confirmation');
    const hasProceededToNextStep = !isDraft;

    const payload = {
      ...(editingOrder || {}),
      id: orderInfo.orderId,
      styleName: finalStyleName,
      orderDate: orderInfo.orderDate,
      expectedDelivery: orderInfo.expectedDelivery || '',
      priority: orderInfo.priority || 'Normal',
      status: finalStatus,
      stage: finalStage,
      hasProceededToNextStep: hasProceededToNextStep,
      totalGarments: grandTotalOrderPieces || 0,
      totalFabricGreige: parseFloat(totalGreigeFabric) || 0,
      totalFabricDyed: parseFloat(totalDyedFabric) || 0,
      articles: finalArticles
        .filter(art => {
          const artPieces = getPiecesForArticle(art.id, art.name);
          const hasAnyPieces = finalArticles.some(a => getPiecesForArticle(a.id, a.name) > 0);
          return hasAnyPieces ? artPieces > 0 : true;
        })
        .map(art => {
          const firstFabId = art.fabrics?.[0]?.fabricId;
          const matchingFab = fabrics.find(f => f.id === firstFabId);
          const fabQuality = matchingFab?.qualityName || matchingFab?.quality || matchingFab?.name || art.fabrics?.[0]?.fabricQuality || '';
          const avgLen = art.avgLength || art.fabrics?.[0]?.avgLength || art.avgGarmentLength || '';
          const artPieces = getPiecesForArticle(art.id, art.name);
          return {
            ...art,
            name: autoCapitalizeWords(art.name || primaryArticleName),
            totalPieces: artPieces || 0,
            fabricQuality: fabQuality,
            fabrics: (art.fabrics || []).map(f => {
              const fMatch = fabrics.find(fx => fx.id === f.fabricId);
              return {
                ...f,
                fabricQuality: fMatch?.qualityName || fMatch?.quality || fMatch?.name || f.fabricQuality || '',
                role: autoCapitalizeWords(f.role || ''),
                color: f.color || '',
                colorName: f.color || ''
              };
            }),
            avgGarmentLength: avgLen,
            avgLength: avgLen
          };
        }),
      customerOrders: mappedCustomerOrders,
      fabricConsumptions: fabricConsumptionRows,
      fabricQualityGroups: fabricGroups,
      updatedAt: new Date().toISOString()
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
          <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2 flex-wrap">
            <span className="p-2 rounded-3 text-white d-inline-flex align-items-center justify-content-center" style={{ backgroundColor: '#2e37a4', width: '36px', height: '36px' }}>
              <i className={editingOrder ? "ti ti-edit fs-5" : "ti ti-file-plus fs-5"}></i>
            </span>
            <span>{editingOrder ? (editingOrder.status === 'Draft' && !editingOrder.hasProceededToNextStep ? 'Edit Draft Sales Order' : 'Edit Sales Order') : 'New Sales Order'}</span>
            {editingOrder && (
              <span className="badge font-monospace px-2.5 py-1 rounded-2 ms-1 fs-12 fw-normal" style={{ backgroundColor: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
                {editingOrder.id} &bull; {editingOrder.status || 'Draft'}
              </span>
            )}
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
                  className={`p-3 rounded-3 text-center border transition position-relative cursor-pointer ${isSelected ? 'shadow-xs' : 'bg-white'
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

                {(() => {
                  const isDupatta = /dupatta|stole|chunri|scarf/i.test((art.name || '').trim());
                  return (
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
                        <label className="form-label small text-muted mb-1 fw-semibold">
                          {isDupatta ? 'Avg length (mts)' : 'Avg length (in)'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          className="form-control form-control-sm bg-white"
                          placeholder={isDupatta ? 'e.g. 2.25' : 'e.g. 45'}
                          value={art.avgLength ?? ''}
                          onChange={(e) => updateArticleAvgLength(art.id, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })()}

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
                  className={`btn rounded-3 fw-bold transition ${isSelected ? 'text-white shadow-sm' : 'btn-light border text-secondary'
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
                  {isExpanded && (() => {
                    const configMode = cust.configMode || {};
                    const assignedArticleIds = (cust.assignedArticleIds || []).filter(id => addedArticles.some(a => a.id === id));
                    const isMultiArticle = assignedArticleIds.length > 1;
                    const currentArtTabId = activeColorArtTab[ci] || (assignedArticleIds[0]) || '';
                    const currentArtObj = addedArticles.find(a => a.id === currentArtTabId);
                    const currentArtColors = (configMode.sameColor === false && currentArtTabId)
                      ? (cust.articleColors?.[currentArtTabId] || [])
                      : (cust.selectedColors || []);

                    return (
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
                                    className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5 transition ${isAssigned ? 'btn-primary text-white shadow-xs' : 'btn-light border text-secondary'
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
                                {configMode.sameColor === false ? `Colors for ${currentArtObj?.name || 'Article'}:` : 'Colors for this Customer:'}
                              </label>
                              <span className="text-secondary small ms-2">
                                ({currentArtColors.length} selected &bull; {masterColors.length} in palette)
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
                              <span>Add Colour</span>
                            </button>
                          </div>

                          {/* Article Tabs for Color Assignment when sameColor is false */}
                          {configMode.sameColor === false && (cust.assignedArticleIds || []).length > 1 && (
                            <div className="p-2.5 rounded-3 mb-2.5 bg-white border d-flex flex-wrap align-items-center gap-2" style={{ borderColor: '#cbd5e1' }}>
                              <span className="small fw-bold text-dark d-flex align-items-center gap-1 me-1">
                                <i className="ti ti-shirt text-primary"></i>
                                Select Article to assign colors:
                              </span>
                              {(cust.assignedArticleIds || []).map(aId => {
                                const art = addedArticles.find(a => a.id === aId);
                                if (!art) return null;
                                const artCols = cust.articleColors?.[aId] || [];
                                const isTabActive = (currentArtTabId === aId);
                                return (
                                  <button
                                    key={aId}
                                    type="button"
                                    className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold transition d-inline-flex align-items-center gap-1.5 ${isTabActive ? 'btn-primary text-white shadow-xs' : 'btn-light border text-secondary'
                                      }`}
                                    style={{
                                      backgroundColor: isTabActive ? '#2e37a4' : '#ffffff',
                                      borderColor: isTabActive ? '#2e37a4' : '#cbd5e1',
                                      fontSize: '12px'
                                    }}
                                    onClick={() => setActiveColorArtTab(prev => ({ ...prev, [ci]: aId }))}
                                  >
                                    <span>{art.name}</span>
                                    <span
                                      className={`badge rounded-pill px-1.5 py-0.5 ${isTabActive ? 'bg-white text-primary' : 'bg-light text-muted border'}`}
                                      style={{ fontSize: '10px' }}
                                    >
                                      {artCols.length}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Section 6.2: Seasonal Quarter & Trending Filter Tabs + Search Filter */}
                          <div className="p-2.5 rounded-3 mb-2.5 bg-light border" style={{ borderColor: '#e2e8f0' }}>
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                              {/* Filter Tabs */}
                              <div className="d-flex flex-wrap gap-1">
                                {(() => {
                                  const tabDefinitions = [
                                    { key: 'allSeason', label: 'All Season', icon: '☀️' },
                                    { key: 'Q4', label: 'Oct–Dec (Q4)', icon: '❄️' },
                                    { key: 'Q1', label: 'Jan–Mar (Q1)', icon: '🌸' },
                                    { key: 'Q2', label: 'Apr–Jun (Q2)', icon: '🌱' },
                                    { key: 'Q3', label: 'Jul–Sep (Q3)', icon: '🌧️' },
                                  ];
                                  return tabDefinitions.map(tab => {
                                    const currentTab = customerColorTab[ci] || 'allSeason';
                                    const isActive = currentTab === tab.key;
                                    const count = masterColors.filter(col => {
                                      const q = getColorQuarterTag(col);
                                      if (tab.key === 'allSeason') return q === 'ALL_SEASON';
                                      return q === tab.key;
                                    }).length;

                                    return (
                                      <button
                                        key={tab.key}
                                        type="button"
                                        className={`btn btn-sm py-1 px-2.5 rounded-pill fw-semibold transition d-inline-flex align-items-center gap-1.5 ${isActive ? 'btn-primary text-white shadow-xs' : 'btn-light border text-secondary'
                                          }`}
                                        style={{
                                          fontSize: '12px',
                                          backgroundColor: isActive ? '#2e37a4' : '#ffffff',
                                          borderColor: isActive ? '#2e37a4' : '#cbd5e1'
                                        }}
                                        onClick={() => setCustomerColorTab(prev => ({ ...prev, [ci]: tab.key }))}
                                      >
                                        <span>{tab.icon}</span>
                                        <span>{tab.label}</span>
                                        <span
                                          className={`badge rounded-pill px-1.5 py-0.5 ${isActive ? 'bg-white text-primary' : 'bg-light text-muted border'
                                            }`}
                                          style={{ fontSize: '10px' }}
                                        >
                                          {count}
                                        </span>
                                      </button>
                                    );
                                  });
                                })()}
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
                            {currentArtColors.length > 0 && (
                              <div className="pt-2 border-top d-flex flex-wrap align-items-center gap-1.5" style={{ borderColor: '#e2e8f0' }}>
                                <span className="small fw-bold text-muted me-1" style={{ fontSize: '11px' }}>
                                  {!configMode.sameColor ? `${currentArtObj?.name || 'Article'} Selected (${currentArtColors.length}):` : `Selected (${currentArtColors.length}):`}
                                </span>
                                {currentArtColors.map(colName => {
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
                                        onClick={() => {
                                          if (!configMode.sameColor && currentArtTabId) {
                                            toggleCustomerArticleColor(ci, currentArtTabId, colName);
                                          } else {
                                            toggleCustomerColor(ci, colName);
                                          }
                                        }}
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
                                return (col.name || '').toLowerCase().includes(searchQuery) ||
                                  (col.pantone || '').toLowerCase().includes(searchQuery);
                              }

                              const qTag = getColorQuarterTag(col);
                              // All-season colors are displayed ONLY in the all-season section and NOT mixed in every quarter
                              if (currentTab === 'allSeason') {
                                return qTag === 'ALL_SEASON';
                              }
                              if (currentTab === 'Q1') return qTag === 'Q1';
                              if (currentTab === 'Q2') return qTag === 'Q2';
                              if (currentTab === 'Q3') return qTag === 'Q3';
                              if (currentTab === 'Q4') return qTag === 'Q4';
                              return false;
                            });

                            if (displayedColors.length === 0) {
                              return (
                                <div className="text-muted small py-2 px-1 fst-italic">
                                  No colors found in this section. Click <strong>+ Add Colour</strong> above to add colors for this section.
                                </div>
                              );
                            }

                            return (
                              <div className="d-flex flex-wrap gap-2">
                                {displayedColors.map((col) => {
                                  const isSelected = currentArtColors.includes(col.name);
                                  return (
                                    <button
                                      key={col.id || col.name}
                                      type="button"
                                      className={`btn btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-2 transition ${isSelected ? 'btn-dark text-white shadow-xs' : 'btn-light border text-secondary'
                                        }`}
                                      style={{
                                        backgroundColor: isSelected ? '#1e293b' : '#ffffff',
                                        borderColor: isSelected ? '#0f172a' : '#cbd5e1'
                                      }}
                                      onClick={() => {
                                        if (!configMode.sameColor && currentArtTabId) {
                                          toggleCustomerArticleColor(ci, currentArtTabId, col.name);
                                        } else {
                                          toggleCustomerColor(ci, col.name);
                                        }
                                      }}
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

                        {/* Section: Interactive Article Combination & Guided Questionnaire (Placed right below article selection) */}
                        {(cust.assignedArticleIds || []).length > 1 && (((cust.selectedColors || []).length > 0) || ((cust.assignedArticleIds || []).some(aId => (cust.articleColors?.[aId] || []).length > 0))) && (
                          <div
                            className="p-3.5 rounded-4 mb-4 border shadow-xs"
                            style={{
                              backgroundColor: '#ffffff',
                              borderColor: '#c7d2fe'
                            }}
                          >
                            {/* Header */}
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2.5 border-bottom" style={{ borderColor: '#e0e7ff' }}>
                              <div>
                                <div className="d-flex align-items-center gap-2">
                                  <span className="badge rounded-pill px-2.5 py-1 text-white fw-bold" style={{ fontSize: '11px', backgroundColor: '#2e37a4' }}>
                                    <i className="ti ti-adjustments-horizontal me-1"></i>
                                    Set Matching Setup
                                  </span>
                                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '14px' }}>
                                    Article Combination Setup ({assignedArticleIds.length} Articles)
                                  </h6>
                                </div>
                                <p className="text-secondary small mb-0 mt-1" style={{ fontSize: '12px' }}>
                                  {assignedArticleIds.map(id => addedArticles.find(a => a.id === id)?.name).filter(Boolean).join(' + ')} &mdash; Answer the guided questions below to configure how articles match:
                                </p>
                              </div>

                              {/* Quick Presets */}
                              {(() => {
                                const assignedNames = assignedArticleIds.map(id => addedArticles.find(a => a.id === id)?.name).filter(Boolean);
                                const firstTwoNames = assignedNames.slice(0, 2).join(' + ') || 'Kurta + Pant';
                                const restNames = assignedNames.slice(2).join(', ') || 'Dupatta';
                                const isThreePlus = assignedArticleIds.length > 2;

                                return (
                                  <div className="d-flex flex-wrap align-items-center gap-1.5">
                                    <span className="text-muted small fw-semibold me-1" style={{ fontSize: '11px' }}>Quick Presets:</span>
                                    <button
                                      type="button"
                                      className={`btn btn-xs rounded-pill px-2.5 py-1 fw-semibold transition ${configMode.sameColor === true && configMode.sameSize === true && configMode.sameValue === true && configMode.connectionType === 'all'
                                        ? 'btn-primary text-white shadow-xs'
                                        : 'btn-outline-secondary bg-white text-dark'
                                        }`}
                                      style={{ fontSize: '11px', backgroundColor: configMode.sameColor === true && configMode.sameSize === true && configMode.sameValue === true && configMode.connectionType === 'all' ? '#2e37a4' : '#fff' }}
                                      onClick={() => setCustomerConfigMode(ci, { sameColor: true, sameSize: true, sameValue: true, connectionType: 'all', connectedArticleIds: [...assignedArticleIds] })}
                                      title="Same Colors, Same Sizes, 1:1 Matching Quantities"
                                    >
                                      ⚡ Full Matching Set
                                    </button>
                                    <button
                                      type="button"
                                      className={`btn btn-xs rounded-pill px-2.5 py-1 fw-semibold transition ${configMode.sameColor === false && configMode.sameSize === true && configMode.sameValue === true && configMode.connectionType === 'all'
                                        ? 'btn-primary text-white shadow-xs'
                                        : 'btn-outline-secondary bg-white text-dark'
                                        }`}
                                      style={{ fontSize: '11px', backgroundColor: configMode.sameColor === false && configMode.sameSize === true && configMode.sameValue === true && configMode.connectionType === 'all' ? '#2e37a4' : '#fff' }}
                                      onClick={() => setCustomerConfigMode(ci, { sameColor: false, sameSize: true, sameValue: true, connectionType: 'all', connectedArticleIds: [...assignedArticleIds] })}
                                      title="Different / Contrast Colors, Same Sizes, 1:1 Matching Quantities"
                                    >
                                      🎨 Contrast Set (Jodi)
                                    </button>
                                    {isThreePlus && (
                                      <button
                                        type="button"
                                        className={`btn btn-xs rounded-pill px-2.5 py-1 fw-semibold transition ${configMode.connectionType === 'custom' && configMode.sameValue === true
                                          ? 'btn-primary text-white shadow-xs'
                                          : 'btn-outline-secondary bg-white text-dark'
                                          }`}
                                        style={{ fontSize: '11px', backgroundColor: configMode.connectionType === 'custom' && configMode.sameValue === true ? '#2e37a4' : '#fff' }}
                                        onClick={() => setCustomerConfigMode(ci, { sameColor: true, sameSize: true, sameValue: true, connectionType: 'custom', connectedArticleIds: assignedArticleIds.slice(0, 2) })}
                                        title={`${firstTwoNames} combo set (1:1 sync), ${restNames} separate`}
                                      >
                                        ✂️ {firstTwoNames} Combo
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className={`btn btn-xs rounded-pill px-2.5 py-1 fw-semibold transition ${configMode.sameColor === true && configMode.sameSize === true && configMode.sameValue === false
                                        ? 'btn-primary text-white shadow-xs'
                                        : 'btn-outline-secondary bg-white text-dark'
                                        }`}
                                      style={{ fontSize: '11px', backgroundColor: configMode.sameColor === true && configMode.sameSize === true && configMode.sameValue === false ? '#2e37a4' : '#fff' }}
                                      onClick={() => setCustomerConfigMode(ci, { sameColor: true, sameSize: true, sameValue: false, connectionType: 'independent', connectedArticleIds: [] })}
                                      title="Same Colors, Same Sizes, Separate Quantities per Article"
                                    >
                                      ⚖️ Shared Sizes, Separate Qty
                                    </button>
                                    <button
                                      type="button"
                                      className={`btn btn-xs rounded-pill px-2.5 py-1 fw-semibold transition ${configMode.sameColor === false && configMode.sameSize === false && configMode.sameValue === false
                                        ? 'btn-primary text-white shadow-xs'
                                        : 'btn-outline-secondary bg-white text-dark'
                                        }`}
                                      style={{ fontSize: '11px', backgroundColor: configMode.sameColor === false && configMode.sameSize === false && configMode.sameValue === false ? '#2e37a4' : '#fff' }}
                                      onClick={() => setCustomerConfigMode(ci, { sameColor: false, sameSize: false, sameValue: false, connectionType: 'independent', connectedArticleIds: [] })}
                                      title="Independent Colors, Sizes, and Quantities per Article"
                                    >
                                      🧩 Custom Mix &amp; Match
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Guided Interactive Questions - Clean 3-Step Flow */}
                            <div className="d-flex flex-column gap-3">
                              {/* Question 1: Matching Set (Jodi) vs Separate Articles */}
                              {(() => {
                                const assignedNames = assignedArticleIds.map(id => addedArticles.find(a => a.id === id)?.name).filter(Boolean);
                                const isThreePlus = assignedArticleIds.length > 2;
                                const firstTwoNames = assignedNames.slice(0, 2).join(' + ') || 'Kurta + Pant';
                                const connectedIds = (configMode.connectedArticleIds && configMode.connectedArticleIds.length > 0)
                                  ? configMode.connectedArticleIds
                                  : assignedArticleIds.slice(0, 2);
                                const comboArticleNames = connectedIds.map(id => addedArticles.find(a => a.id === id)?.name).filter(Boolean);
                                const separateArticleNames = assignedArticleIds.filter(id => !connectedIds.includes(id)).map(id => addedArticles.find(a => a.id === id)?.name).filter(Boolean);
                                const isAnswered = configMode.connectionType !== undefined && configMode.connectionType !== null;

                                return (
                                  <div
                                    className="p-3.5 rounded-3 border transition"
                                    style={{
                                      backgroundColor: isAnswered ? '#f8faff' : '#ffffff',
                                      borderColor: isAnswered ? '#c7d2fe' : '#e2e8f0'
                                    }}
                                  >
                                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-1">
                                      <div className="d-flex align-items-center gap-2.5">
                                        <span
                                          className="badge rounded-circle text-white d-inline-flex align-items-center justify-content-center flex-shrink-0"
                                          style={{ width: '26px', height: '26px', fontSize: '12px', fontWeight: 'bold', backgroundColor: isAnswered ? '#2e37a4' : '#94a3b8' }}
                                        >
                                          1
                                        </span>
                                        <div>
                                          <div className="fw-bold text-dark" style={{ fontSize: '14.5px' }}>
                                            {isThreePlus
                                              ? `How should these ${assignedArticleIds.length} articles be grouped?`
                                              : `Are ${assignedNames.join(' & ')} a Matching Set (Jodi) or Separate Articles?`}
                                          </div>
                                          <small className="text-muted">
                                            {configMode.connectionType === 'all'
                                              ? (isThreePlus
                                                ? `⚡ Complete ${assignedArticleIds.length}-Piece Set — all articles match together in equal quantities`
                                                : `⚡ Matching Set (1:1 Jodi) — articles are paired together as a set`)
                                              : configMode.connectionType === 'custom'
                                                ? `✂️ Combo Set: ${comboArticleNames.join(' + ') || firstTwoNames} (1:1 match)${separateArticleNames.length > 0 ? ` • ${separateArticleNames.join(', ')} is separate` : ''}`
                                                : configMode.connectionType === 'independent'
                                                  ? '📦 All Separate Articles — each article is handled independently'
                                                  : (isThreePlus
                                                    ? 'Choose whether articles form a complete set, combo set, or are all separate'
                                                    : 'Choose whether articles are sold as a matching pair or independent items')}
                                          </small>
                                        </div>
                                      </div>
                                      <div className="btn-group btn-group-sm ms-auto" role="group">
                                        {isThreePlus ? (
                                          <>
                                            <button
                                              type="button"
                                              className={`btn px-3 py-1.5 fw-semibold ${configMode.connectionType === 'all' ? 'btn-primary text-white shadow-xs' : 'btn-outline-secondary bg-white text-dark'}`}
                                              style={{ fontSize: '12px', backgroundColor: configMode.connectionType === 'all' ? '#2e37a4' : '#fff' }}
                                              onClick={() => setCustomerConfigMode(ci, {
                                                ...configMode,
                                                connectionType: 'all',
                                                connectedArticleIds: [...assignedArticleIds],
                                                sameValue: (configMode.sameValue !== undefined ? configMode.sameValue : true)
                                              })}
                                            >
                                              {configMode.connectionType === 'all' && <i className="ti ti-check me-1"></i>}
                                              ⚡ Complete {assignedArticleIds.length}-Piece Set
                                            </button>
                                            <button
                                              type="button"
                                              className={`btn px-3 py-1.5 fw-semibold ${configMode.connectionType === 'custom' ? 'btn-primary text-white shadow-xs' : 'btn-outline-secondary bg-white text-dark'}`}
                                              style={{ fontSize: '12px', backgroundColor: configMode.connectionType === 'custom' ? '#2e37a4' : '#fff' }}
                                              onClick={() => {
                                                setCustomerConfigMode(ci, {
                                                  ...configMode,
                                                  connectionType: 'custom',
                                                  connectedArticleIds: assignedArticleIds.slice(0, 2),
                                                  sameValue: (configMode.sameValue !== undefined ? configMode.sameValue : true)
                                                });
                                              }}
                                            >
                                              {configMode.connectionType === 'custom' && <i className="ti ti-check me-1"></i>}
                                              ✂️ Combo Set + Separate
                                            </button>
                                            <button
                                              type="button"
                                              className={`btn px-3 py-1.5 fw-semibold ${configMode.connectionType === 'independent' ? 'btn-dark text-white shadow-xs' : 'btn-outline-secondary bg-white text-dark'}`}
                                              style={{ fontSize: '12px', backgroundColor: configMode.connectionType === 'independent' ? '#1e293b' : '#fff' }}
                                              onClick={() => setCustomerConfigMode(ci, {
                                                ...configMode,
                                                connectionType: 'independent',
                                                connectedArticleIds: [],
                                                sameValue: (configMode.sameValue !== undefined ? configMode.sameValue : false)
                                              })}
                                            >
                                              {configMode.connectionType === 'independent' && <i className="ti ti-check me-1"></i>}
                                              📦 All Separate
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            <button
                                              type="button"
                                              className={`btn px-3.5 py-1.5 fw-semibold ${configMode.connectionType === 'all' ? 'btn-primary text-white shadow-xs' : 'btn-outline-secondary bg-white text-dark'}`}
                                              style={{ fontSize: '12px', backgroundColor: configMode.connectionType === 'all' ? '#2e37a4' : '#fff' }}
                                              onClick={() => setCustomerConfigMode(ci, {
                                                ...configMode,
                                                connectionType: 'all',
                                                connectedArticleIds: [...assignedArticleIds],
                                                sameValue: (configMode.sameValue !== undefined ? configMode.sameValue : true)
                                              })}
                                            >
                                              {configMode.connectionType === 'all' && <i className="ti ti-check me-1"></i>}
                                              ⚡ Matching Set (1:1 Jodi)
                                            </button>
                                            <button
                                              type="button"
                                              className={`btn px-3.5 py-1.5 fw-semibold ${configMode.connectionType === 'independent' ? 'btn-dark text-white shadow-xs' : 'btn-outline-secondary bg-white text-dark'}`}
                                              style={{ fontSize: '12px', backgroundColor: configMode.connectionType === 'independent' ? '#1e293b' : '#fff' }}
                                              onClick={() => setCustomerConfigMode(ci, {
                                                ...configMode,
                                                connectionType: 'independent',
                                                connectedArticleIds: [],
                                                sameValue: (configMode.sameValue !== undefined ? configMode.sameValue : false)
                                              })}
                                            >
                                              {configMode.connectionType === 'independent' && <i className="ti ti-check me-1"></i>}
                                              📦 Separate Articles
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {/* Custom Combo Selector (shown when Combo Set is chosen) */}
                                    {configMode.connectionType === 'custom' && (
                                      <div className="mt-2.5 p-2.5 rounded-3 bg-white border" style={{ borderColor: '#c7d2fe' }}>
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                          <span className="small fw-bold text-dark" style={{ fontSize: '12px' }}>
                                            Select articles that form the Matching Combo Set:
                                          </span>
                                          <span className="badge bg-primary text-white" style={{ fontSize: '10px' }}>
                                            {connectedIds.length} of {assignedArticleIds.length} in Combo ({separateArticleNames.length} Separate)
                                          </span>
                                        </div>
                                        <div className="d-flex flex-wrap gap-2">
                                          {assignedArticleIds.map(aId => {
                                            const art = addedArticles.find(a => a.id === aId);
                                            if (!art) return null;
                                            const isConnected = connectedIds.includes(aId);
                                            return (
                                              <button
                                                key={aId}
                                                type="button"
                                                className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1.5 ${isConnected ? 'btn-primary text-white' : 'btn-outline-secondary bg-white'
                                                  }`}
                                                style={{ fontSize: '11.5px', backgroundColor: isConnected ? '#2e37a4' : undefined }}
                                                onClick={() => {
                                                  let next;
                                                  if (isConnected) {
                                                    if (connectedIds.length <= 2) {
                                                      return; // Maintain at least 2 articles in combo
                                                    }
                                                    next = connectedIds.filter(id => id !== aId);
                                                  } else {
                                                    next = [...connectedIds, aId];
                                                  }
                                                  setCustomerConfigMode(ci, {
                                                    ...configMode,
                                                    connectedArticleIds: next
                                                  });
                                                }}
                                              >
                                                <span>{art.name}</span>
                                                <i className={`ti ti-${isConnected ? 'check' : 'plus'} small`}></i>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Question 2: Colors Setup */}
                              <div
                                className="p-3.5 rounded-3 border transition"
                                style={{
                                  backgroundColor: configMode.sameColor !== undefined && configMode.sameColor !== null ? (configMode.sameColor ? '#f8faff' : '#fffbeb') : '#ffffff',
                                  borderColor: (configMode.sameColor !== undefined && configMode.sameColor !== null) ? '#c7d2fe' : '#e2e8f0'
                                }}
                              >
                                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                                  <div className="d-flex align-items-center gap-2.5">
                                    <span
                                      className="badge rounded-circle text-white d-inline-flex align-items-center justify-content-center flex-shrink-0"
                                      style={{ width: '26px', height: '26px', fontSize: '12px', fontWeight: 'bold', backgroundColor: (configMode.sameColor !== undefined && configMode.sameColor !== null) ? '#2e37a4' : '#94a3b8' }}
                                    >
                                      2
                                    </span>
                                    <div>
                                      <div className="fw-bold text-dark" style={{ fontSize: '14.5px' }}>
                                        Do articles have the same colors or contrast?
                                      </div>
                                      <small className="text-muted">
                                        {configMode.sameColor === true
                                          ? '🎨 Same Colors — color palette selected below applies across all articles'
                                          : configMode.sameColor === false
                                            ? '🎭 Contrast / Different Colors — select independent or contrast colors for each article (e.g. Yellow Kurta + Maroon Pant)'
                                            : 'Choose whether articles share colors or have separate / contrast palettes'}
                                      </small>
                                    </div>
                                  </div>
                                  <div className="btn-group btn-group-sm ms-auto" role="group">
                                    <button
                                      type="button"
                                      className={`btn px-3.5 py-1.5 fw-semibold ${configMode.sameColor === true ? 'btn-primary text-white shadow-xs' : 'btn-outline-secondary bg-white text-dark'}`}
                                      style={{ fontSize: '12px', backgroundColor: configMode.sameColor === true ? '#2e37a4' : '#fff' }}
                                      onClick={() => setCustomerConfigMode(ci, { ...configMode, sameColor: true })}
                                    >
                                      {configMode.sameColor === true && <i className="ti ti-check me-1"></i>}
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      className={`btn px-3.5 py-1.5 fw-semibold ${configMode.sameColor === false ? 'btn-dark text-white shadow-xs' : 'btn-outline-secondary bg-white text-dark'}`}
                                      style={{ fontSize: '12px', backgroundColor: configMode.sameColor === false ? '#1e293b' : '#fff' }}
                                      onClick={() => setCustomerConfigMode(ci, { ...configMode, sameColor: false })}
                                    >
                                      {configMode.sameColor === false && <i className="ti ti-check me-1"></i>}
                                      No
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Question 3: Sizes Setup */}
                              <div
                                className="p-3.5 rounded-3 border transition"
                                style={{
                                  backgroundColor: configMode.sameSize !== undefined && configMode.sameSize !== null ? (configMode.sameSize ? '#f8faff' : '#fffbeb') : '#ffffff',
                                  borderColor: (configMode.sameSize !== undefined && configMode.sameSize !== null) ? '#c7d2fe' : '#e2e8f0'
                                }}
                              >
                                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                                  <div className="d-flex align-items-center gap-2.5">
                                    <span
                                      className="badge rounded-circle text-white d-inline-flex align-items-center justify-content-center flex-shrink-0"
                                      style={{ width: '26px', height: '26px', fontSize: '12px', fontWeight: 'bold', backgroundColor: (configMode.sameSize !== undefined && configMode.sameSize !== null) ? '#2e37a4' : '#94a3b8' }}
                                    >
                                      3
                                    </span>
                                    <div>
                                      <div className="fw-bold text-dark" style={{ fontSize: '14.5px' }}>
                                        Are sizes identical across all articles?
                                      </div>
                                      <small className="text-muted">
                                        {configMode.sameSize === true
                                          ? '📏 Same Sizes — size series (e.g. S, M, L, XL) will be shared across all articles'
                                          : configMode.sameSize === false
                                            ? '📐 Different Sizes — configure different size scales for each article (e.g. Kurta S/M/L, Pant 28/30/32, Dupatta Free Size)'
                                            : 'Choose whether articles share the same size series or have different sizes'}
                                      </small>
                                    </div>
                                  </div>
                                  <div className="btn-group btn-group-sm ms-auto" role="group">
                                    <button
                                      type="button"
                                      className={`btn px-3.5 py-1.5 fw-semibold ${configMode.sameSize === true ? 'btn-primary text-white shadow-xs' : 'btn-outline-secondary bg-white text-dark'}`}
                                      style={{ fontSize: '12px', backgroundColor: configMode.sameSize === true ? '#2e37a4' : '#fff' }}
                                      onClick={() => setCustomerConfigMode(ci, { ...configMode, sameSize: true })}
                                    >
                                      {configMode.sameSize === true && <i className="ti ti-check me-1"></i>}
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      className={`btn px-3.5 py-1.5 fw-semibold ${configMode.sameSize === false ? 'btn-dark text-white shadow-xs' : 'btn-outline-secondary bg-white text-dark'}`}
                                      style={{ fontSize: '12px', backgroundColor: configMode.sameSize === false ? '#1e293b' : '#fff' }}
                                      onClick={() => setCustomerConfigMode(ci, { ...configMode, sameSize: false })}
                                    >
                                      {configMode.sameSize === false && <i className="ti ti-check me-1"></i>}
                                      No
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Question 4: Same Value / Quantity Setup */}
                              {(() => {
                                const isAnswered = configMode.sameValue !== undefined && configMode.sameValue !== null;
                                return (
                                  <div
                                    className="p-3.5 rounded-3 border transition"
                                    style={{
                                      backgroundColor: isAnswered ? (configMode.sameValue ? '#f8faff' : '#fffbeb') : '#ffffff',
                                      borderColor: isAnswered ? '#c7d2fe' : '#e2e8f0'
                                    }}
                                  >
                                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                                      <div className="d-flex align-items-center gap-2.5">
                                        <span
                                          className="badge rounded-circle text-white d-inline-flex align-items-center justify-content-center flex-shrink-0"
                                          style={{
                                            width: '26px',
                                            height: '26px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            backgroundColor: isAnswered ? '#2e37a4' : '#94a3b8'
                                          }}
                                        >
                                          4
                                        </span>
                                        <div>
                                          <div className="fw-bold text-dark" style={{ fontSize: '14.5px' }}>
                                            Do articles have the same value / piece quantities?
                                          </div>
                                          <small className="text-muted">
                                            {configMode.sameValue === true
                                              ? '⚡ Same Value (1:1 Auto-Sync) — quantities entered on one article automatically sync to connected articles'
                                              : configMode.sameValue === false
                                                ? '⚖️ Different / Separate Values — enter independent quantities for each article (e.g. 100 Kurta, 50 Pant, 75 Dupatta)'
                                                : 'Choose whether articles share equal 1:1 piece quantities or have independent quantities'}
                                          </small>
                                        </div>
                                      </div>
                                      <div className="btn-group btn-group-sm ms-auto" role="group">
                                        <button
                                          type="button"
                                          className={`btn px-3.5 py-1.5 fw-semibold ${configMode.sameValue === true ? 'btn-primary text-white shadow-xs' : 'btn-outline-secondary bg-white text-dark'}`}
                                          style={{ fontSize: '12px', minWidth: '70px', backgroundColor: configMode.sameValue === true ? '#2e37a4' : '#fff' }}
                                          onClick={() => setCustomerConfigMode(ci, { ...configMode, sameValue: true })}
                                        >
                                          {configMode.sameValue === true && <i className="ti ti-check me-1"></i>}
                                          Yes
                                        </button>
                                        <button
                                          type="button"
                                          className={`btn px-3.5 py-1.5 fw-semibold ${configMode.sameValue === false ? 'btn-dark text-white shadow-xs' : 'btn-outline-secondary bg-white text-dark'}`}
                                          style={{ fontSize: '12px', minWidth: '70px', backgroundColor: configMode.sameValue === false ? '#1e293b' : '#fff' }}
                                          onClick={() => setCustomerConfigMode(ci, { ...configMode, sameValue: false })}
                                        >
                                          {configMode.sameValue === false && <i className="ti ti-check me-1"></i>}
                                          No
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                            </div>

                            {/* Active Setup Summary Bar */}
                            {(() => {
                              const hasAnySelection = configMode.connectionType !== undefined || configMode.sameColor !== undefined || configMode.sameSize !== undefined || configMode.sameValue !== undefined;
                              if (!hasAnySelection) {
                                return (
                                  <div
                                    className="mt-3 p-2.5 px-3 rounded-3 d-flex align-items-center gap-2 border shadow-xs"
                                    style={{
                                      backgroundColor: '#f8fafc',
                                      borderColor: '#e2e8f0',
                                      fontSize: '12px',
                                      color: '#64748b'
                                    }}
                                  >
                                    <i className="ti ti-hand-click text-primary fs-6"></i>
                                    <span>
                                      <strong className="text-dark">No Default Selection:</strong> Please answer the questions above or click a Quick Preset to configure matching articles.
                                    </span>
                                  </div>
                                );
                              }

                              const isCompleteSet = configMode.connectionType === 'all' && configMode.sameValue;
                              const isComboSet = configMode.connectionType === 'custom';
                              const isIndependent = configMode.connectionType === 'independent' || configMode.sameValue === false;

                              let presetLabel = '⚙️ Custom Setup';
                              if (isCompleteSet && configMode.sameColor === true && configMode.sameSize === true) {
                                presetLabel = '⚡ Full Matching Set';
                              } else if (isCompleteSet && configMode.sameColor === false && configMode.sameSize === true) {
                                presetLabel = '🎨 Contrast Set (Jodi)';
                              } else if (isComboSet) {
                                const comboNames = (configMode.connectedArticleIds || []).map(id => addedArticles.find(a => a.id === id)?.name).filter(Boolean).join(' + ');
                                presetLabel = `✂️ Combo: ${comboNames || 'Combo Set'}`;
                              } else if (isIndependent && configMode.sameColor === true && configMode.sameSize === true) {
                                presetLabel = '⚖️ Shared Sizes, Separate Qty';
                              } else if (isIndependent && configMode.sameColor === true && configMode.sameSize === false) {
                                presetLabel = '📏 Shared Colors, Different Sizes';
                              } else if (isIndependent && configMode.sameColor === false && configMode.sameSize === false) {
                                presetLabel = '🧩 Custom Mix & Match';
                              }

                              const isAutoSync = Boolean(configMode.sameValue && configMode.sameSize && configMode.connectionType !== 'independent');

                              return (
                                <div
                                  className="mt-3 p-2.5 px-3 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-2 border shadow-xs"
                                  style={{
                                    backgroundColor: isAutoSync ? '#f0fdf4' : '#eff6ff',
                                    borderColor: isAutoSync ? '#bbf7d0' : '#bfdbfe',
                                    fontSize: '12px'
                                  }}
                                >
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <span className={`badge ${isAutoSync ? 'bg-success' : 'bg-primary'} text-white fw-bold`} style={{ fontSize: '11px' }}>
                                      {presetLabel}
                                    </span>
                                    <span className="text-dark fw-medium">
                                      {isCompleteSet ? (
                                        <span>Complete <strong>{assignedArticleIds.length}-Piece Matching Set</strong></span>
                                      ) : isComboSet ? (
                                        <span>Matching Combo: <strong>{((configMode.connectedArticleIds || []).map(id => addedArticles.find(a => a.id === id)?.name).filter(Boolean).join(' + ')) || 'Combo'}</strong></span>
                                      ) : configMode.connectionType === 'independent' ? (
                                        <span>Independent Articles</span>
                                      ) : (
                                        <span className="text-muted">Grouping pending</span>
                                      )}
                                      {configMode.sameColor !== undefined && (
                                        <>
                                          {' '}&bull;{' '}
                                          <span className={configMode.sameColor ? 'text-primary' : 'text-purple'}>
                                            {configMode.sameColor === true ? '🎨 Shared Colors' : '🎭 Contrast Colors'}
                                          </span>
                                        </>
                                      )}
                                      {configMode.sameSize !== undefined && (
                                        <>
                                          {' '}&bull;{' '}
                                          <span className={configMode.sameSize ? 'text-primary' : 'text-secondary'}>
                                            {configMode.sameSize === true ? '📏 Shared Sizes' : '📐 Different Sizes'}
                                          </span>
                                        </>
                                      )}
                                      {isAutoSync ? (
                                        <>
                                          {' '}&bull;{' '}
                                          <span className="text-success fw-bold">⚡ 1:1 Matching Quantities</span>
                                        </>
                                      ) : configMode.sameValue === false ? (
                                        <>
                                          {' '}&bull;{' '}
                                          <span className="text-secondary">📦 Separate Quantities</span>
                                        </>
                                      ) : null}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Sizes & Quantities Breakdown per (Group, Color) */}
                        {(() => {
                          const hasConfiguredColors = configMode.sameColor !== false
                            ? (cust.selectedColors || []).length > 0
                            : (cust.assignedArticleIds || []).some(aId => (cust.articleColors?.[aId] || []).length > 0);

                          if ((cust.assignedArticleIds || []).length === 0 || !hasConfiguredColors) return null;

                          const groups = computeArticleGroups(cust);
                          const isAllSameColor = configMode.sameColor !== false;

                          return (
                            <div className="pt-3 border-top">
                              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                <div className="small text-secondary fw-semibold">Sizes &amp; quantities:</div>
                                {configMode.connectionType !== 'independent' && configMode.sameValue && configMode.sameSize && (cust.assignedArticleIds || []).length > 1 && (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1" style={{ fontSize: '11px' }}>
                                    ✨ 1:1 Matching Set: Quantities entered below automatically create full matching sets
                                  </span>
                                )}
                              </div>

                              {groups.map((group) => {
                                const groupColors = isAllSameColor
                                  ? (cust.selectedColors || [])
                                  : (cust.articleColors?.[group.leadArtId] || []);

                                if (groupColors.length === 0) return null;

                                const combineAllColors = Boolean(configMode.sameColor === true);
                                const cardsToRender = combineAllColors
                                  ? [{ colorsInCard: groupColors, isMultiColorCombined: groupColors.length > 1 }]
                                  : groupColors.map(cName => ({ colorsInCard: [cName], isMultiColorCombined: false }));

                                return cardsToRender.map(({ colorsInCard, isMultiColorCombined }) => {
                                  const leadColName = colorsInCard[0];
                                  const colName = isMultiColorCombined ? colorsInCard : leadColName;
                                  const leadKey = getSizeConfigKey(group.leadArtId, leadColName);
                                  const cfg = cust.sizeConfigs?.[leadKey];
                                  const colorObj = masterColors.find(c => c.name === leadColName) || { hex: '#333333' };

                                  let pairTotalPieces = 0;
                                  let matrixTotalPieces = 0;
                                  if (group.isMatrixTable) {
                                    group.groupArtIds.forEach(aId => {
                                      const aKey = getSizeConfigKey(aId, leadColName);
                                      const aCfg = cust.sizeConfigs?.[aKey];
                                      if (aCfg?.sizeQtys) {
                                        Object.values(aCfg.sizeQtys).forEach(q => {
                                          matrixTotalPieces += parseInt(q, 10) || 0;
                                        });
                                      }
                                    });
                                  } else {
                                    if (configMode.sameValue === false && group.groupArtIds.length > 1) {
                                      group.groupArtIds.forEach(aId => {
                                        const aKey = getSizeConfigKey(aId, leadColName);
                                        const aCfg = cust.sizeConfigs?.[aKey];
                                        if (aCfg?.sizeQtys) {
                                          Object.values(aCfg.sizeQtys).forEach(q => {
                                            pairTotalPieces += parseInt(q, 10) || 0;
                                          });
                                        }
                                      });
                                    } else {
                                      if (cfg?.sizeQtys) {
                                        Object.values(cfg.sizeQtys).forEach(q => {
                                          pairTotalPieces += parseInt(q, 10) || 0;
                                        });
                                      }
                                    }
                                  }

                                  const activeSeriesList = getPairSeriesConfigs(cust, group.leadArtId, colName);
                                  const isJointed = group.isSet;

                                  return (
                                    <div
                                      key={isMultiColorCombined ? `${group.groupKey}___all_colors` : `${group.groupKey}_${leadColName}`}
                                      className="p-4 rounded-4 mb-4 bg-white shadow-xs"
                                      style={{
                                        border: isJointed ? '1.5px solid #818cf8' : '1.5px solid #c7d2fe',
                                        backgroundColor: '#ffffff',
                                        borderRadius: '14px',
                                        boxShadow: '0 2px 10px rgba(46, 55, 164, 0.04)'
                                      }}
                                    >
                                      {/* Card Header */}
                                      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                          {isMultiColorCombined ? (
                                            <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                              {colorsInCard.map(cName => {
                                                const cObj = masterColors.find(c => c.name === cName) || { hex: '#333333' };
                                                return (
                                                  <span
                                                    key={cName}
                                                    className="badge rounded-pill d-inline-flex align-items-center gap-1.5 px-2.5 py-1 border shadow-xs"
                                                    style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderColor: '#cbd5e1', fontSize: '12px' }}
                                                  >
                                                    <span className="rounded-circle border" style={{ width: '10px', height: '10px', backgroundColor: cObj.hex }}></span>
                                                    <span>{cName}</span>
                                                  </span>
                                                );
                                              })}
                                              <span className="fw-bold text-dark ms-1" style={{ fontSize: '15px' }}>
                                                {group.label} &mdash; All {colorsInCard.length} Colors
                                              </span>
                                            </div>
                                          ) : (
                                            <>
                                              <span
                                                className="rounded-circle border"
                                                style={{ width: '13px', height: '13px', backgroundColor: colorObj.hex }}
                                              ></span>
                                              <span className="fw-bold text-dark" style={{ fontSize: '15px' }}>
                                                {group.label} &mdash; {leadColName}
                                              </span>
                                            </>
                                          )}

                                          {group.isSet ? (
                                            <span
                                              className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1"
                                              style={{ fontSize: '11px' }}
                                              title="Quantities entered here automatically reflect on all matching articles"
                                            >
                                              <i className="ti ti-link"></i>
                                              <span>{group.badgeLabel || '1:1 Matching Set'}</span>
                                            </span>
                                          ) : null}
                                        </div>

                                        <div className="d-flex align-items-center gap-2">
                                          {!isMultiColorCombined && groupColors.length > 1 && (
                                            <button
                                              type="button"
                                              className="btn btn-xs btn-outline-primary rounded-pill px-2.5 py-1 fw-semibold d-inline-flex align-items-center gap-1 shadow-xs"
                                              style={{ fontSize: '11px', borderColor: '#c7d2fe' }}
                                              onClick={() => openCopySizesForGroup(ci, group.groupArtIds, leadColName)}
                                              title={`Copy these sizes & quantities from ${leadColName} to other colors`}
                                            >
                                              <i className="ti ti-copy"></i>
                                              <span>Copy to other colors</span>
                                            </button>
                                          )}
                                          <span
                                            className="badge rounded-pill px-3 py-1.5 font-monospace fw-bold"
                                            style={{
                                              fontSize: '12px',
                                              backgroundColor: pairTotalPieces > 0 ? '#eef2ff' : '#f1f5f9',
                                              color: pairTotalPieces > 0 ? '#2e37a4' : '#64748b',
                                              border: '1px solid',
                                              borderColor: pairTotalPieces > 0 ? '#c7d2fe' : '#e2e8f0'
                                            }}
                                          >
                                            {isMultiColorCombined
                                              ? `${pairTotalPieces} sets / color × ${colorsInCard.length} colors = ${pairTotalPieces * colorsInCard.length} sets (${pairTotalPieces * colorsInCard.length * group.groupArtIds.length} pcs)`
                                              : group.isSet
                                                ? `${pairTotalPieces} sets (${pairTotalPieces * group.groupArtIds.length} pcs)`
                                                : `${pairTotalPieces} pcs`}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Card Body */}
                                      <div>
                                        {/* Notice banner if group is set */}
                                        {group.isSet && (
                                          <div
                                            className="d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3 mb-3 border"
                                            style={{
                                              backgroundColor: configMode.sameValue === false ? '#fffbeb' : '#f0fdf4',
                                              borderColor: configMode.sameValue === false ? '#fef3c7' : '#bbf7d0',
                                              color: configMode.sameValue === false ? '#92400e' : '#166534',
                                              fontSize: '12px',
                                              fontWeight: 500
                                            }}
                                          >
                                            <i className={configMode.sameValue === false ? "ti ti-scale" : "ti ti-wand"}></i>
                                            <span>
                                              {configMode.sameValue === false ? (
                                                <>
                                                  <strong>⚖️ Multi-Article Box:</strong> {group.groupArtIds.map(id => addedArticles.find(a => a.id === id)?.name).filter(Boolean).join(' + ')} share the same sizes and colors in this single box. You can enter or change quantities for each article independently below.
                                                </>
                                              ) : isMultiColorCombined ? (
                                                <>
                                                  <strong>⚡ 1:1 Matching Across All {colorsInCard.length} Colors &amp; {group.groupArtIds.length} Articles:</strong>
                                                  {' '}{colorsInCard.length} colors ({colorsInCard.join(', ')}) &amp; {group.groupArtIds.length} articles ({group.groupArtIds.map(id => addedArticles.find(a => a.id === id)?.name).filter(Boolean).join(', ')}) are combined into this single box. Quantities entered below automatically apply across all of them.
                                                </>
                                              ) : (
                                                <>
                                                  <strong>1:1 Set Active:</strong> Sizes and quantities entered here automatically apply across all {group.groupArtIds.length} articles ({group.groupArtIds.map(id => addedArticles.find(a => a.id === id)?.name).filter(Boolean).join(', ')}).
                                                </>
                                              )}
                                            </span>
                                          </div>
                                        )}
                                        {/* Pick a size series */}
                                        <div className="mb-3">
                                          <div className="text-muted small mb-2 fw-medium">Pick a size series:</div>
                                          <div className="d-flex flex-wrap gap-2">
                                            {(normalizedMasterSizeSeries || []).map((series) => {
                                              const isOpen = activeSeriesList.some(sc => {
                                                const scClean = (sc.seriesName || '').toLowerCase();
                                                const scId = (sc.seriesId || '').toLowerCase();
                                                const sName = (series.name || '').toLowerCase();
                                                const sClean = getCleanSeriesName(series).toLowerCase();
                                                const sId = (series.id || '').toLowerCase();
                                                return scClean === sName || scClean === sClean || scId === sId || scId === sName;
                                              });
                                              return (
                                                <button
                                                  key={series.id || series.name}
                                                  type="button"
                                                  className={`btn btn-sm rounded-pill transition-all ${isOpen ? 'btn-primary text-white shadow-xs' : 'btn-light border text-secondary'
                                                    }`}
                                                  style={{
                                                    minWidth: '90px',
                                                    height: '36px',
                                                    padding: '6px 14px',
                                                    fontSize: '13px',
                                                    fontWeight: isOpen ? 600 : 500,
                                                    backgroundColor: isOpen ? '#2e37a4' : '#ffffff',
                                                    borderColor: isOpen ? '#2e37a4' : '#e2e8f0',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: isOpen ? '0 2px 6px rgba(46, 55, 164, 0.2)' : 'none'
                                                  }}
                                                  onClick={() => toggleSeriesInGroup(ci, group.groupArtIds, colName, series)}
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
                                                      onClick={() => removeSeriesFromGroup(ci, group.groupArtIds, colName, sc.seriesId)}
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
                                                          className={`btn btn-sm rounded-pill transition ${isSzSelected ? 'fw-bold shadow-xs' : 'text-dark border bg-white shadow-xs'
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
                                                          onClick={() => toggleSizeInGroupSeries(ci, group.groupArtIds, colName, sc.seriesId, sz)}
                                                        >
                                                          {sz} {isSzSelected && <i className="ti ti-check small text-white ms-1"></i>}
                                                        </button>
                                                      );
                                                    })}
                                                  </div>

                                                  {/* Quantity Method Switcher */}
                                                  {(sc.selectedSizes || []).length >= 1 ? (
                                                    <div>
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
                                                                setRatioModeForGroupSeries(ci, group.groupArtIds, colName, sc.seriesId, false);
                                                                setUniformModeForGroupSeries(ci, group.groupArtIds, colName, sc.seriesId, false);
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
                                                                setRatioModeForGroupSeries(ci, group.groupArtIds, colName, sc.seriesId, true);
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
                                                                  backgroundColor: sc.uniform === true ? '#2e37a4' : '#ffffff',
                                                                  color: sc.uniform === true ? '#ffffff' : '#475569',
                                                                  borderColor: sc.uniform === true ? '#2e37a4' : '#cbd5e1',
                                                                  boxShadow: sc.uniform === true ? '0 2px 4px rgba(46,55,164,0.2)' : 'none'
                                                                }}
                                                                onClick={() => {
                                                                  setRatioModeForGroupSeries(ci, group.groupArtIds, colName, sc.seriesId, false);
                                                                  setUniformModeForGroupSeries(ci, group.groupArtIds, colName, sc.seriesId, true);
                                                                }}
                                                              >
                                                                <span>🔢</span>
                                                                <span>Uniform Qty (All sizes same)</span>
                                                              </button>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>

                                                      {/* Ratio inputs */}
                                                      {sc.ratioUsed ? (
                                                        <div className="p-3 mb-3 rounded-3 border" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                                                          <div className="d-flex align-items-center gap-2 mb-2">
                                                            <i className="ti ti-percentage text-success fs-5"></i>
                                                            <span className="fw-bold text-success-emphasis" style={{ fontSize: '13px' }}>
                                                              Set Ratio Multiplication Mode
                                                            </span>
                                                          </div>
                                                          <div className="row g-2 align-items-center">
                                                            <div className="col-auto">
                                                              <label className="form-label small text-muted mb-1">Ratio ({(sc.selectedSizes || []).join(':')}):</label>
                                                              <input
                                                                type="text"
                                                                className="form-control form-control-sm font-monospace text-center fw-bold"
                                                                style={{ width: '130px', fontSize: '13px' }}
                                                                placeholder={(sc.selectedSizes || []).map(() => '1').join(':')}
                                                                value={sc.ratioString || ''}
                                                                onChange={(e) => {
                                                                  const formatted = formatRatioInput(e.target.value, sc.ratioString, (sc.selectedSizes || []).length);
                                                                  updateRatioCalculationForGroupSeries(ci, group.groupArtIds, colName, sc.seriesId, formatted, sc.baseSetQty, true);
                                                                }}
                                                              />
                                                            </div>
                                                            <div className="col-auto">
                                                              <label className="form-label small text-muted mb-1">Base Set Qty:</label>
                                                              <input
                                                                type="number"
                                                                min="1"
                                                                className="form-control form-control-sm font-monospace text-center fw-bold"
                                                                style={{ width: '100px', fontSize: '13px' }}
                                                                placeholder="100"
                                                                value={sc.baseSetQty || ''}
                                                                onChange={(e) => {
                                                                  updateRatioCalculationForGroupSeries(ci, group.groupArtIds, colName, sc.seriesId, sc.ratioString, e.target.value, true);
                                                                }}
                                                              />
                                                            </div>
                                                          </div>
                                                        </div>
                                                      ) : sc.uniform === true ? (
                                                        <div className="p-3 mb-3 rounded-3 border bg-light" style={{ borderColor: '#e2e8f0' }}>
                                                          <div className="d-flex align-items-center gap-2">
                                                            <span className="small text-muted fw-semibold">Uniform quantity for all {(sc.selectedSizes || []).length} sizes:</span>
                                                            <input
                                                              type="number"
                                                              min="0"
                                                              className="form-control form-control-sm text-center font-monospace fw-bold"
                                                              style={{ width: '90px' }}
                                                              placeholder="0"
                                                              value={sc.uniformQty || ''}
                                                              onChange={(e) => updateUniformQtyForGroupSeries(ci, group.groupArtIds, colName, sc.seriesId, e.target.value)}
                                                            />
                                                            <span className="small text-muted">pcs / size</span>
                                                          </div>
                                                        </div>
                                                      ) : null}

                                                      {/* In-box Option: Same Value vs Article-Wise Values */}
                                                      {group.groupArtIds.length > 1 && (
                                                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 p-2 px-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                                                          <div className="d-flex align-items-center gap-2 flex-wrap">
                                                            <span className="small fw-semibold text-secondary" style={{ fontSize: '12px' }}>
                                                              Article Values:
                                                            </span>
                                                            <div className="btn-group btn-group-sm" role="group">
                                                              <button
                                                                type="button"
                                                                className={`btn btn-xs fw-semibold px-2.5 py-1 ${configMode.sameValue !== false ? 'btn-primary text-white shadow-xs' : 'btn-outline-secondary bg-white text-dark'}`}
                                                                style={{ fontSize: '11.5px', backgroundColor: configMode.sameValue !== false ? '#2e37a4' : '#fff' }}
                                                                onClick={() => setCustomerConfigMode(ci, { ...configMode, sameValue: true })}
                                                              >
                                                                <span>⚡</span>
                                                                <span>Same Value (1:1 Equal for All)</span>
                                                              </button>
                                                              <button
                                                                type="button"
                                                                className={`btn btn-xs fw-semibold px-2.5 py-1 ${configMode.sameValue === false ? 'btn-dark text-white shadow-xs' : 'btn-outline-secondary bg-white text-dark'}`}
                                                                style={{ fontSize: '11.5px', backgroundColor: configMode.sameValue === false ? '#1e293b' : '#fff' }}
                                                                onClick={() => setCustomerConfigMode(ci, { ...configMode, sameValue: false })}
                                                              >
                                                                <span>⚖️</span>
                                                                <span>Different Value Per Article</span>
                                                              </button>
                                                            </div>
                                                          </div>
                                                          <span className="small text-muted" style={{ fontSize: '11px' }}>
                                                            {configMode.sameValue !== false
                                                              ? '⚡ Single entry automatically syncs across all articles'
                                                              : '✏️ Enter or tweak quantities for each article below'}
                                                          </span>
                                                        </div>
                                                      )}

                                                      {configMode.sameValue === false && group.groupArtIds.length > 1 ? (
                                                        /* Article-Wise Rows: Kurta, Pant, Dupatta each have their own row */
                                                        <div className="d-flex flex-column gap-3">
                                                          {group.groupArtIds.map((artId, artIdx) => {
                                                            const artObj = addedArticles.find(a => a.id === artId);
                                                            const artSeriesList = getPairSeriesConfigs(cust, artId, leadColName);
                                                            const artSc = artSeriesList.find(s => s.seriesId === sc.seriesId || s.seriesName === sc.seriesId || s.seriesName === sc.seriesName) || sc;
                                                            const artTotal = Object.values(artSc.sizeQtys || {}).reduce((sum, q) => sum + (parseInt(q, 10) || 0), 0);
                                                            const totalWithColors = isMultiColorCombined ? artTotal * colorsInCard.length : artTotal;

                                                            return (
                                                              <div
                                                                key={artId}
                                                                className="p-3 rounded-3 border bg-white shadow-xs"
                                                                style={{ borderColor: artIdx === 0 ? '#c7d2fe' : '#e2e8f0', backgroundColor: '#ffffff' }}
                                                              >
                                                                <div className="d-flex justify-content-between align-items-center mb-2.5 flex-wrap gap-2">
                                                                  <div className="d-flex align-items-center gap-2">
                                                                    <span className="badge rounded-pill bg-light text-dark border px-2.5 py-1 fw-bold" style={{ fontSize: '12px' }}>
                                                                      {artObj?.name || `Article ${artIdx + 1}`}
                                                                    </span>
                                                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-0.5 font-monospace fw-semibold" style={{ fontSize: '11px' }}>
                                                                      {isMultiColorCombined
                                                                        ? `${artTotal} pcs / color × ${colorsInCard.length} colors = ${totalWithColors} pcs`
                                                                        : `${artTotal} pcs`}
                                                                    </span>
                                                                  </div>
                                                                  {artIdx > 0 && (
                                                                    <button
                                                                      type="button"
                                                                      className="btn btn-xs btn-outline-secondary rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 shadow-xs"
                                                                      style={{ fontSize: '11px' }}
                                                                      onClick={() => copyArticleQuantities(ci, group.leadArtId, artId, colName, sc.seriesId)}
                                                                    >
                                                                      <i className="ti ti-copy small"></i>
                                                                      <span>Copy from {addedArticles.find(a => a.id === group.leadArtId)?.name || 'First Article'}</span>
                                                                    </button>
                                                                  )}
                                                                </div>

                                                                <div className="d-flex flex-wrap gap-2.5">
                                                                  {(sc.selectedSizes || []).map((sz) => (
                                                                    <div key={sz} className="d-flex flex-column align-items-center">
                                                                      <span className="badge bg-light text-secondary border mb-1 px-2 py-0.5" style={{ fontSize: '10.5px' }}>
                                                                        {sz}
                                                                      </span>
                                                                      <input
                                                                        type="number"
                                                                        min="0"
                                                                        className="form-control form-control-sm text-center font-monospace fw-semibold"
                                                                        style={{ width: '70px', height: '32px', fontSize: '13px' }}
                                                                        placeholder="0"
                                                                        value={artSc.sizeQtys?.[sz] !== undefined ? artSc.sizeQtys[sz] : ''}
                                                                        onChange={(e) => updateIndividualSizeQtyForSingleArticle(ci, artId, colName, sc.seriesId, sz, e.target.value)}
                                                                      />
                                                                    </div>
                                                                  ))}
                                                                </div>
                                                              </div>
                                                            );
                                                          })}
                                                        </div>
                                                      ) : (
                                                        /* Unified 1:1 Row */
                                                        <div>
                                                          {group.groupArtIds.length > 1 && (
                                                            <div className="small text-success fw-medium mb-2 d-flex align-items-center gap-1">
                                                              <i className="ti ti-link"></i>
                                                              <span>1:1 Equal Quantities — entering numbers below sets all articles ({group.groupArtIds.map(id => addedArticles.find(a => a.id === id)?.name).filter(Boolean).join(', ')}) together:</span>
                                                            </div>
                                                          )}
                                                          <div className="d-flex flex-wrap gap-2.5">
                                                            {(sc.selectedSizes || []).map((sz) => (
                                                              <div key={sz} className="d-flex flex-column align-items-center">
                                                                <span className="badge bg-light text-dark border mb-1 px-2 py-0.5" style={{ fontSize: '11px' }}>
                                                                  {sz}
                                                                </span>
                                                                <input
                                                                  type="number"
                                                                  min="0"
                                                                  className="form-control form-control-sm text-center font-monospace fw-semibold"
                                                                  style={{ width: '70px', height: '32px', fontSize: '13px' }}
                                                                  placeholder="0"
                                                                  value={sc.sizeQtys?.[sz] !== undefined ? sc.sizeQtys[sz] : ''}
                                                                  onChange={(e) => updateIndividualSizeQtyForGroupSeries(ci, group.groupArtIds, colName, sc.seriesId, sz, e.target.value)}
                                                                />
                                                              </div>
                                                            ))}
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  ) : null}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                });
                              })}
                            </div>
                          );
                        })()}                      </div>
                    );
                  })()}
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
              className="btn text-white rounded-3 px-4 py-2 fw-semibold shadow-sm d-inline-flex align-items-center gap-1.5"
              style={{ backgroundColor: '#2e37a4', borderColor: '#2e37a4' }}
              onClick={() => handleFinalSave('Proceed')}
            >
              <i className="ti ti-check"></i>
              <span>Save &amp; Proceed to Next Step</span>
              <i className="ti ti-arrow-right"></i>
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
          isModalEditMode={true}
          initialColor={(() => {
            const activeCustTab = customerColorTab[activeCustomerIndexForNewColor] || 'allSeason';
            const quarterTag = (activeCustTab === 'allSeason') ? 'All Season' : activeCustTab;
            return { quarterTag };
          })()}
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
