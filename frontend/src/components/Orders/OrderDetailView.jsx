import React, { useState, useMemo, useEffect } from 'react';
import { getStoredData, setStoredData, initialAccessoryMasters, getStoredAccessoriesMaster } from '../../data/salesOrderData';
import { initialVendors, initialPurchaseOrders, initialFabrics as procurementFabrics } from '../../data/procurementData';
import {
  GenericAccessoryPOModal,
  TasselPOModal,
  ThreadPOModal
} from './AccessoryPOModals';

const autoCapitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Preset Master Fabrics with genuine fabric master properties
const DEFAULT_FABRICS = [];

export default function OrderDetailView({
  order,
  onBack,
  onEditSection,
  onTriggerProcurement,
  onNavigateToProcurement,
  onUpdateOrder
}) {
  useEffect(() => {
    // Keep user's scroll position without jumping
  }, []);

  const [confirmed, setConfirmed] = useState(
    order?.stage === 'Confirmed' || order?.status === 'Confirmed'
  );
  const [photoType, setPhotoType] = useState('Reference');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [photos, setPhotos] = useState(order?.photos || []);
  const [expandedArticles, setExpandedArticles] = useState({ 0: true, 1: true });
  const [editingLengthIdx, setEditingLengthIdx] = useState(null);
  const [tempLengthVal, setTempLengthVal] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Master Accessories Dynamic State (Sourced from Accessories Master)
  const [masterAccessories, setMasterAccessories] = useState(() => getStoredAccessoriesMaster());

  useEffect(() => {
    const handleUpdate = () => {
      setMasterAccessories(getStoredAccessoriesMaster());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('erp_accessories_master_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('erp_accessories_master_updated', handleUpdate);
    };
  }, []);

  // Master Fabrics Dynamic State (Sourced from Fabric Master)
  const [masterFabricsList, setMasterFabricsList] = useState(() => {
    try {
      const s = getStoredData('raindrop_fabrics_v1', null);
      if (Array.isArray(s)) return s;
    } catch (e) {}
    return procurementFabrics || [];
  });

  // Width Dropdown active article state
  const [activeWidthDropdown, setActiveWidthDropdown] = useState(null);

  useEffect(() => {
    const handleFabricsUpdate = () => {
      try {
        const s = getStoredData('raindrop_fabrics_v1', null);
        if (Array.isArray(s)) setMasterFabricsList(s);
      } catch (e) {}
    };
    const handleCloseWidthDropdown = () => setActiveWidthDropdown(null);

    window.addEventListener('storage', handleFabricsUpdate);
    window.addEventListener('raindrop_fabrics_updated', handleFabricsUpdate);
    document.addEventListener('click', handleCloseWidthDropdown);
    return () => {
      window.removeEventListener('storage', handleFabricsUpdate);
      window.removeEventListener('raindrop_fabrics_updated', handleFabricsUpdate);
      document.removeEventListener('click', handleCloseWidthDropdown);
    };
  }, []);

  // Accessories BOM State
  const [selectedBomCustomer, setSelectedBomCustomer] = useState('');
  const bomCustomerName = selectedBomCustomer || order?.customerOrders?.[0]?.customerName || order?.customerName || 'Black Label';

  // Accessory PO Generation Modals State
  const [activePOModalCategory, setActivePOModalCategory] = useState(null);

  const [vendorsList] = useState(() => {
    try {
      const saved = localStorage.getItem('raindrop_vendors_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialVendors;
  });

  const [orderPurchaseOrders, setOrderPurchaseOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('raindrop_pos_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(p => p.orderId === order?.id || p.order_id === order?.id || p.orderNumber === order?.orderNumber);
        }
      }
    } catch (e) {}
    return [];
  });

  const [allocatedGarments, setAllocatedGarments] = useState(() => {
    const allocated = {};
    try {
      const saved = localStorage.getItem('raindrop_pos_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(po => {
            if ((po.orderId === order?.id || po.order_id === order?.id) && Array.isArray(po.items)) {
              po.items.forEach(it => {
                const key = `${it.accessory_id}__${it.order_article_id}`;
                allocated[key] = (allocated[key] || 0) + (it.no_of_garments || 0);
              });
            }
          });
        }
      }
    } catch (e) {}
    return allocated;
  });

  const handleSaveAccessoryPO = (newPO) => {
    setOrderPurchaseOrders(prev => [newPO, ...prev]);

    try {
      const saved = localStorage.getItem('raindrop_pos_v1');
      let currentList = [];
      if (saved) {
        currentList = JSON.parse(saved);
      } else {
        currentList = [...initialPurchaseOrders];
      }
      const updated = [newPO, ...currentList.filter(p => p.id !== newPO.id)];
      localStorage.setItem('raindrop_pos_v1', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('raindrop_pos_updated', { detail: newPO }));
    } catch (e) {
      console.error('Error saving PO to localStorage:', e);
    }

    setAllocatedGarments(prev => {
      const copy = { ...prev };
      if (Array.isArray(newPO.items)) {
        newPO.items.forEach(it => {
          const key = `${it.accessory_id}__${it.order_article_id}`;
          copy[key] = (copy[key] || 0) + (it.no_of_garments || 0);
        });
      }
      return copy;
    });

    const logText = `${newPO.po_type_display || newPO.poType || 'Accessory PO'} (${newPO.po_number || newPO.poNumber}) created for ₹${parseFloat(newPO.total_amount || 0).toFixed(2)}`;
    setOrderHistory(prev => [
      {
        date: new Date().toISOString(),
        dateFormatted: formatDateWithTime(new Date().toISOString()),
        text: logText
      },
      ...prev
    ]);

    setToastMessage(`Purchase Order ${newPO.po_number || newPO.poNumber} created successfully!`);
    setShowToast(true);
  };

  // Sourced directly from Fabric configuration or Fabric Master (Buffer % allowance per article fabric)
  const getArticleFabricBuffer = (articleName) => {
    const artNameClean = String(articleName || '').toLowerCase().trim();

    // 1. Check order.fabricConsumptions
    if (Array.isArray(order?.fabricConsumptions)) {
      const match = order.fabricConsumptions.find(fc => String(fc.articleName || fc.article || '').toLowerCase().trim() === artNameClean);
      if (match) {
        const raw = match.bufferPercent !== undefined && match.bufferPercent !== null && match.bufferPercent !== ''
          ? match.bufferPercent
          : match.bufferPct;
        if (raw !== undefined && raw !== null && raw !== '') {
          const val = parseFloat(raw);
          if (!isNaN(val) && val >= 0) return val;
        }
      }
    }

    // 2. Check order.articles
    if (Array.isArray(order?.articles)) {
      const match = order.articles.find(a => String(a.name || a.articleName || '').toLowerCase().trim() === artNameClean);
      if (match) {
        const raw = match.bufferPercent !== undefined && match.bufferPercent !== null && match.bufferPercent !== ''
          ? match.bufferPercent
          : match.bufferPct;
        if (raw !== undefined && raw !== null && raw !== '') {
          const val = parseFloat(raw);
          if (!isNaN(val) && val >= 0) return val;
        }
        if (Array.isArray(match.fabrics) && match.fabrics.length > 0) {
          for (const f of match.fabrics) {
            const fBuf = f.bufferPercent !== undefined && f.bufferPercent !== null && f.bufferPercent !== ''
              ? f.bufferPercent
              : (f.bufferPct !== undefined && f.bufferPct !== null && f.bufferPct !== ''
                  ? f.bufferPct
                  : f.maxBuffer);
            if (fBuf !== undefined && fBuf !== null && fBuf !== '') {
              const val = parseFloat(fBuf);
              if (!isNaN(val) && val >= 0) return val;
            }
          }
        }
      }
    }

    // 3. Check Fabric Master
    let allFabrics = Array.isArray(masterFabricsList) && masterFabricsList.length > 0 ? [...masterFabricsList] : [];
    try {
      const stored = getStoredData('raindrop_fabrics_v1', null);
      if (Array.isArray(stored) && stored.length > 0) {
        allFabrics = [...allFabrics, ...stored];
      }
    } catch (e) {}
    if (Array.isArray(procurementFabrics) && procurementFabrics.length > 0) {
      allFabrics = [...allFabrics, ...procurementFabrics];
    }
    const artObj = (order?.articles || []).find(a => String(a.name || a.articleName || '').toLowerCase().trim() === artNameClean);
    const fabQ = artObj?.fabricQuality || artObj?.fabrics?.[0]?.fabricQuality || '';
    if (fabQ) {
      const fqClean = String(fabQ).toLowerCase().trim();
      const matched = allFabrics.find(f => {
        const q = String(f.qualityName || f.quality_name || f.quality || f.name || '').toLowerCase().trim();
        return q && (q === fqClean || fqClean.includes(q) || q.includes(fqClean));
      });
      if (matched) {
        const raw = matched.maxBuffer ?? matched.bufferPercent ?? matched.buffer ?? matched.bufferPct;
        if (raw !== undefined && raw !== null && raw !== '') {
          const val = parseFloat(raw);
          if (!isNaN(val) && val >= 0) return val;
        }
      }
    }

    // 4. Default fallback matching prototype mock
    if (artNameClean.includes('pant')) return 8;
    return 10;
  };

  const CATEGORY_METADATA = {
    'Buttons': { name: 'Buttons', icon: 'ti ti-circle-dot', iconColor: '#475569', bgColor: '#f1f5f9', poBtnText: 'Button PO', poBtnColor: '#2563eb', defaultUnit: 'PCS' },
    'Lace': { name: 'Lace', icon: 'ti ti-cut', iconColor: '#2563eb', bgColor: '#eff6ff', poBtnText: 'Lace PO', poBtnColor: '#9333ea', defaultUnit: 'METER' },
    'Tassels': { name: 'Tassels', icon: 'ti ti-archive', iconColor: '#ea580c', bgColor: '#fff7ed', poBtnText: 'Tassel PO', poBtnColor: '#ea580c', defaultUnit: 'PIECE' },
    'Thread': { name: 'Thread', icon: 'ti ti-needle-thread', iconColor: '#0284c7', bgColor: '#f0f9ff', poBtnText: 'Thread PO', poBtnColor: '#ef4444', defaultUnit: 'METER' },
    'Dori': { name: 'Dori', icon: 'ti ti-wave-sine', iconColor: '#9333ea', bgColor: '#faf5ff', poBtnText: 'Dori PO', poBtnColor: '#0d9488', defaultUnit: 'METER' },
    'Elastic': { name: 'Elastic', icon: 'ti ti-arrows-horizontal', iconColor: '#0284c7', bgColor: '#e0f2fe', poBtnText: 'Elastic PO', poBtnColor: '#0284c7', defaultUnit: 'METER' },
    'Beads & Sequins': { name: 'Beads & Sequins', icon: 'ti ti-sparkles', iconColor: '#ea580c', bgColor: '#fef3c7', poBtnText: 'Beads/Sequins PO', poBtnColor: '#db2777', defaultUnit: 'PIECE' },
    'Hook': { name: 'Hook', icon: 'ti ti-anchor', iconColor: '#0d9488', bgColor: '#f0fdf4', poBtnText: 'Hook PO', poBtnColor: '#0d9488', defaultUnit: 'PCS' },
    'Zipper': { name: 'Zipper', icon: 'ti ti-link', iconColor: '#4f46e5', bgColor: '#eef2ff', poBtnText: 'Zipper PO', poBtnColor: '#4f46e5', defaultUnit: 'PCS' },
    'Label': { name: 'Label', icon: 'ti ti-tag', iconColor: '#b45309', bgColor: '#fefce8', poBtnText: 'Label PO', poBtnColor: '#b45309', defaultUnit: 'PCS' },
    'Packaging': { name: 'Packaging', icon: 'ti ti-package', iconColor: '#0369a1', bgColor: '#f0f9ff', poBtnText: 'Packaging PO', poBtnColor: '#0369a1', defaultUnit: 'PCS' },
    'Other': { name: 'Other', icon: 'ti ti-paperclip', iconColor: '#64748b', bgColor: '#f8fafc', poBtnText: 'Accessory PO', poBtnColor: '#64748b', defaultUnit: 'PIECE' }
  };

  const ACCESSORY_CATEGORIES = useMemo(() => {
    const defaultOrder = [
      'Buttons',
      'Lace',
      'Tassels',
      'Thread',
      'Dori',
      'Elastic',
      'Beads & Sequins',
      'Hook',
      'Zipper',
      'Label',
      'Packaging',
      'Other'
    ];

    const allCatNames = [...defaultOrder];
    masterAccessories.forEach(m => {
      if (m.category && !allCatNames.includes(m.category)) {
        allCatNames.push(m.category);
      }
    });

    return allCatNames.map(catName => {
      const meta = CATEGORY_METADATA[catName] || {
        name: catName,
        icon: 'ti ti-tag',
        iconColor: '#2e37a4',
        bgColor: '#eef2ff',
        poBtnText: `${catName} PO`,
        poBtnColor: '#2e37a4',
        defaultUnit: 'PCS'
      };

      const inCat = masterAccessories.filter(m => (m.category || '').toLowerCase() === catName.toLowerCase());
      const varieties = [];

      inCat.forEach(m => {
        // 1. Explicit varieties in master
        if (Array.isArray(m.varieties) && m.varieties.length > 0) {
          m.varieties.forEach(v => {
            if (v?.name && !varieties.some(x => x.name.toLowerCase() === v.name.toLowerCase())) {
              const sizes = v.sizes || (v.size ? [v.size] : (m.buttonSizes ? m.buttonSizes.split(',').map(s => s.trim()).filter(Boolean) : []));
              const colors = v.colors || (m.buttonColors ? m.buttonColors.split(',').map(s => s.trim()).filter(Boolean) : (m.colors || []));
              varieties.push({
                name: v.name,
                hasSizes: sizes.length > 0,
                sizes: sizes,
                colors: colors,
                defaultSize: v.size || '',
                defaultColor: v.color || '',
                defaultPlacement: '',
                defaultReqPerPc: '',
                type: v.type || m.source || '',
                unit: m.unit || meta.defaultUnit
              });
            }
          });
        }

        // 2. Formatted variety with size/color (Matching Image 3: "+ Coconut Button (Natural) [14L]", "+ Embroidered [18 L]", "+ Eyelet (Gold) [18 L]")
        const hasColor = Boolean(m.color);
        const hasSize = Boolean(m.size);
        if (hasColor || hasSize) {
          const formattedLabel = `${m.name}${hasColor ? ` (${m.color})` : ''}${hasSize ? ` [${m.size}]` : ''}`;
          if (!varieties.some(x => x.name.toLowerCase() === formattedLabel.toLowerCase())) {
            const parsedSizes = m.sizes || (m.size ? [m.size] : []);
            const parsedColors = m.colors || (m.color ? [m.color] : []);
            varieties.push({
              name: formattedLabel,
              baseName: m.name,
              hasSizes: parsedSizes.length > 0,
              sizes: parsedSizes,
              colors: parsedColors,
              defaultSize: m.size || '',
              defaultColor: m.color || '',
              defaultPlacement: '',
              defaultReqPerPc: '',
              type: m.subType || m.source || '',
              unit: m.unit || meta.defaultUnit
            });
          }
        }

        // 3. Base accessory name (Matching Image 3: "+ Coconut", "+ Coconut Button", "+ MOP", "+ Metal 2 hole", "+ Mould", "+ Pignose", "+ Plastic")
        if (m.name && m.name.toLowerCase() !== catName.toLowerCase()) {
          if (!varieties.some(x => x.name.toLowerCase() === m.name.toLowerCase())) {
            const parsedSizes = m.buttonSizes
              ? m.buttonSizes.split(',').map(s => s.trim()).filter(Boolean)
              : (m.sizes || (m.laceSize ? [m.laceSize] : (m.size ? [m.size] : [])));
            const parsedColors = m.buttonColors
              ? m.buttonColors.split(',').map(s => s.trim()).filter(Boolean)
              : (m.colors || (m.color ? [m.color] : []));
            varieties.push({
              name: m.name,
              baseName: m.name,
              hasSizes: parsedSizes.length > 0,
              sizes: parsedSizes,
              colors: parsedColors,
              defaultSize: m.size || '',
              defaultColor: m.color || '',
              defaultPlacement: '',
              defaultReqPerPc: '',
              type: m.subType || m.source || '',
              unit: m.unit || meta.defaultUnit
            });
          }
        }
      });

      // No dummy/fallback variety pushed: only display varieties that genuinely exist in Accessories Master

      return {
        id: catName,
        name: meta.name,
        icon: meta.icon,
        iconColor: meta.iconColor,
        bgColor: meta.bgColor,
        poBtnText: meta.poBtnText,
        poBtnColor: meta.poBtnColor,
        defaultUnit: meta.defaultUnit,
        varieties
      };
    });
  }, [masterAccessories]);

  const [addedAccessories, setAddedAccessories] = useState(() => {
    if (Array.isArray(order?.accessories) && order.accessories.length > 0) {
      const flattened = [];
      order.accessories.forEach((acc, aIdx) => {
        if (Array.isArray(acc.rows) && acc.rows.length > 0) {
          acc.rows.forEach((r, rIdx) => {
            const rawPlacement = r.placement || '';
            const rawColor = r.accessoryColor || '';
            const rawSize = r.size || '';
            const rawReq = r.reqPerPiece ?? r.reqPerPc ?? '';
            const rawExtra = r.extraPerPack ?? '';
            const defaultBuf = getArticleFabricBuffer(r.article || acc.article || 'Kurta');
            const hasUserEdited = r._userEditedBuffer === true;
            const resBuf = (r.bufferPct !== undefined && r.bufferPct !== null && r.bufferPct !== '' && (hasUserEdited || parseFloat(r.bufferPct) > 0))
              ? r.bufferPct
              : defaultBuf;
            flattened.push({
              id: `acc_${acc.category || 'acc'}_${aIdx}_${rIdx}`,
              category: acc.category || 'Buttons',
              varietyName: acc.varietyName || 'Standard',
              unit: acc.unit || 'PCS',
              article: r.article || 'Kurta',
              articleColor: r.articleColor || 'Charcoal (100)',
              totalQty: r.totalGarments || order?.totalGarments || 100,
              placement: (rawPlacement === 'Front Placket' || rawPlacement === 'Front..') ? '' : rawPlacement,
              accessoryColor: (rawColor === 'Natural' || rawColor === 'Gold' || rawColor === 'Natural Brown' || rawColor === 'Pearl White' || rawColor === '—') ? '' : rawColor,
              size: (rawSize === '18L' || rawSize === '—') ? '' : rawSize,
              source: (r.source === 'Ready Made' && (!rawReq || String(rawReq) === '5')) ? '' : (r.source || ''),
              reqPerPc: (String(rawReq) === '5' || String(rawReq) === '0') ? '' : String(rawReq),
              extraPerPack: (String(rawExtra) === '0' || String(rawExtra) === '10') ? '' : String(rawExtra),
              bufferPct: resBuf,
              total: r.totalQuantity || '0.0'
            });
          });
        } else {
          const rawPlacement = acc.placement || '';
          const rawColor = acc.accessoryColor || '';
          const rawSize = acc.size || '';
          const rawReq = acc.reqPerPiece ?? acc.reqPerPc ?? '';
          const rawExtra = acc.extraPerPack ?? '';
          const defaultBuf = getArticleFabricBuffer(acc.article || 'Kurta');
          const hasUserEdited = acc._userEditedBuffer === true;
          const resBuf = (acc.bufferPct !== undefined && acc.bufferPct !== null && acc.bufferPct !== '' && (hasUserEdited || parseFloat(acc.bufferPct) > 0))
            ? acc.bufferPct
            : defaultBuf;
          flattened.push({
            ...acc,
            placement: (rawPlacement === 'Front Placket' || rawPlacement === 'Front..') ? '' : rawPlacement,
            accessoryColor: (rawColor === 'Natural' || rawColor === 'Gold' || rawColor === 'Natural Brown' || rawColor === 'Pearl White' || rawColor === '—') ? '' : rawColor,
            size: (rawSize === '18L' || rawSize === '—') ? '' : rawSize,
            source: (acc.source === 'Ready Made' && (!rawReq || String(rawReq) === '5')) ? '' : (acc.source || ''),
            reqPerPc: (String(rawReq) === '5' || String(rawReq) === '0') ? '' : String(rawReq),
            extraPerPack: (String(rawExtra) === '0' || String(rawExtra) === '10') ? '' : String(rawExtra),
            bufferPct: resBuf
          });
        }
      });
      return flattened.map(item => {
        if (item.articleRows && typeof item.articleRows === 'object') {
          const cleanRows = {};
          Object.entries(item.articleRows).forEach(([art, rList]) => {
            if (Array.isArray(rList)) {
              const seen = new Set();
              cleanRows[art] = rList.filter(r => {
                const raw = (r.articleColor || '').trim();
                const base = raw.replace(/\s*\(\d+\s*pcs\)/i, '').trim().toLowerCase();
                const key = base || raw.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
            }
          });
          return { ...item, articleRows: cleanRows };
        }
        return item;
      });
    }
    return [];
  });

  const totalButtonQty = useMemo(() => {
    let sum = 0;
    (addedAccessories || []).forEach((acc) => {
      const cat = (acc.category || '').toLowerCase();
      if (cat.includes('button')) {
        if (acc.articleRows && typeof acc.articleRows === 'object') {
          Object.entries(acc.articleRows).forEach(([artName, rows]) => {
            if (Array.isArray(rows)) {
              const defaultBuf = getArticleFabricBuffer(artName);
              rows.forEach(r => {
                const reqVal = parseFloat(r.reqPerPc) || 0;
                const packInput = r.extraPerPack !== undefined && r.extraPerPack !== null ? String(r.extraPerPack).trim() : '';
                const packNum = parseFloat(packInput);
                const packVal = (!isNaN(packNum) && packNum >= 0) ? packNum : 0;
                const hasUserEdited = r._userEditedBuffer === true;
                const bufVal = (r.bufferPct !== undefined && r.bufferPct !== null && r.bufferPct !== '' && (hasUserEdited || parseFloat(r.bufferPct) > 0))
                  ? (parseFloat(r.bufferPct) || 0)
                  : defaultBuf;
                const artPcs = parseFloat(r.totalQty) || 0;
                const reqQty = artPcs * reqVal;
                const packQty = artPcs * packVal;
                const baseCalc = reqQty + packQty;
                const bufQty = (baseCalc * bufVal) / 100;
                sum += (baseCalc + bufQty);
              });
            }
          });
        } else {
          const directTotal = parseFloat(acc.total || acc.totalQuantity || 0);
          if (!isNaN(directTotal) && directTotal > 0) {
            sum += directTotal;
          } else {
            const req = parseFloat(acc.reqPerPc || acc.reqPerPiece || 0);
            const gQty = parseFloat(acc.totalQty || acc.totalGarments || 0);
            if (!isNaN(req) && !isNaN(gQty)) {
              sum += req * gQty;
            }
          }
        }
      }
    });
    return Math.round(sum);
  }, [addedAccessories]);

  const [accessorySearchQuery, setAccessorySearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Buttons');
  const [selectedBomArticle, setSelectedBomArticle] = useState('');
  const [editingAccessoryIds, setEditingAccessoryIds] = useState({});

  const formatDateWithTime = (dateStr) => {
    if (!dateStr) return '13 Oct 2026, 10:25 am';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = d.getDate();
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      let hours = d.getHours();
      const mins = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      return `${day} ${month} ${year}, ${hours}:${mins} ${ampm}`;
    } catch (e) {
      return dateStr;
    }
  };

  const [orderHistory, setOrderHistory] = useState(() => {
    if (Array.isArray(order?.history) && order.history.length > 0) {
      return order.history;
    }
    const orderDate = order?.orderDate || order?.createdAt || new Date().toISOString();
    return [
      {
        date: orderDate,
        dateFormatted: formatDateWithTime(orderDate),
        text: 'Order saved (Saksham Garg (Merchandiser))'
      }
    ];
  });

  // Extract all articles across order (ensures Kurta, Plazo, etc. are always available)
  const orderArticles = useMemo(() => {
    const list = [];
    const seen = new Set();
    const addArt = (name, extra = {}) => {
      const trimmed = (name || '').trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        list.push({
          id: extra.id || `ART-${seen.size}`,
          name: trimmed,
          ...extra
        });
      }
    };

    if (Array.isArray(order?.articles)) {
      order.articles.forEach(a => addArt(a.name || a.articleName, a));
    }
    if (Array.isArray(order?.fabricConsumptions)) {
      order.fabricConsumptions.forEach(fc => addArt(fc.articleName || fc.article));
    }
    if (list.length === 0) {
      addArt('Kurta');
      addArt('Plazo');
    }
    return list;
  }, [order]);

  const activeCategoryObj = useMemo(() => {
    return ACCESSORY_CATEGORIES.find(c => c.id === activeCategory) || ACCESSORY_CATEGORIES[0];
  }, [ACCESSORY_CATEGORIES, activeCategory]);


  const availableArticleColors = useMemo(() => {
    const cols = [];
    (order?.customerOrders || []).forEach(co => {
      (co.selectedColors || []).forEach(c => {
        if (!cols.includes(c)) cols.push(c);
      });
    });
    if (cols.length === 0 && Array.isArray(order?.fabricConsumptions)) {
      order.fabricConsumptions.forEach(fc => {
        if (fc.colorName && !cols.includes(fc.colorName)) cols.push(fc.colorName);
      });
    }
    return cols.length > 0 ? cols : ['Red'];
  }, [order]);

  const [popoverState, setPopoverState] = useState(null);
  const [cardSelectedArticles, setCardSelectedArticles] = useState({});

  const getCardSelectedArticles = (item) => {
    if (cardSelectedArticles[item?.id] && Array.isArray(cardSelectedArticles[item?.id])) {
      return cardSelectedArticles[item?.id];
    }
    if (Array.isArray(item?.selectedArticles) && item.selectedArticles.length > 0) {
      return item.selectedArticles;
    }
    if (item?.activeArticle) {
      return [item.activeArticle];
    }
    return [orderArticles[0]?.name || 'Kurta'];
  };

  const handleToggleCardArticle = (itemId, articleName) => {
    const item = addedAccessories.find(a => a.id === itemId);
    const current = getCardSelectedArticles(item);
    const exists = current.some(a => a.toLowerCase() === articleName.toLowerCase());

    let nextSelected = [];
    if (exists) {
      if (current.length === 1) {
        return; // maintain at least one article selected
      }
      nextSelected = current.filter(a => a.toLowerCase() !== articleName.toLowerCase());
    } else {
      nextSelected = orderArticles
        .map(a => a.name)
        .filter(name => {
          if (name.toLowerCase() === articleName.toLowerCase()) return true;
          return current.some(a => a.toLowerCase() === name.toLowerCase());
        });
      if (!nextSelected.some(a => a.toLowerCase() === articleName.toLowerCase())) {
        nextSelected.push(articleName);
      }
    }

    setCardSelectedArticles(prev => ({
      ...prev,
      [itemId]: nextSelected
    }));

    setAddedAccessories(prev => prev.map(a => {
      if (a.id === itemId) {
        return {
          ...a,
          selectedArticles: nextSelected,
          activeArticle: nextSelected[0] || 'Kurta'
        };
      }
      return a;
    }));
  };

  const getArticleColorOptions = (articleName) => {
    const fcRows = (order?.fabricConsumptions || []).filter(fc =>
      (fc.articleName || fc.article || '').toLowerCase().trim() === (articleName || '').toLowerCase().trim()
    );
    if (fcRows.length > 0) {
      // Group by colorName so entries are strictly according to article & colour, NOT per fabric!
      const colorMap = new Map();
      fcRows.forEach(r => {
        const cName = (r.colorName || 'Standard').trim();
        const key = cName.toLowerCase();
        if (!colorMap.has(key)) {
          const rawPcs = (r.pcs !== undefined && r.pcs !== null && r.pcs !== '')
            ? parseInt(r.pcs, 10)
            : (order?.totalGarments || 0);
          const pcsVal = isNaN(rawPcs) ? 0 : rawPcs;
          colorMap.set(key, {
            color: cName,
            qty: pcsVal,
            display: `${cName} (${pcsVal} pcs)`
          });
        }
      });
      const uniqueColors = Array.from(colorMap.values());
      if (uniqueColors.length > 0) {
        return uniqueColors;
      }
    }

    const colors = [];
    (order?.customerOrders || []).forEach(co => {
      (co.selectedColors || []).forEach(c => {
        if (!colors.includes(c)) colors.push(c);
      });
    });
    const fallbackColors = colors.length > 0 ? colors : (order?.id ? ['Standard'] : ['Charcoal', 'Green']);
    const artObj = (orderArticles || []).find(a => (a.name || '').toLowerCase() === (articleName || '').toLowerCase()) ||
      (order?.articles || []).find(a => (a.name || '').toLowerCase() === (articleName || '').toLowerCase());
    const totalArtQty = artObj?.totalPieces || order?.totalGarments || 0;
    const qtyPerColor = fallbackColors.length > 0 ? Math.round(totalArtQty / fallbackColors.length) : 0;

    return fallbackColors.map(c => ({
      color: c,
      qty: qtyPerColor,
      display: `${c} (${qtyPerColor} pcs)`
    }));
  };

  const getCardArticleRows = (item, articleName) => {
    const colorOpts = getArticleColorOptions(articleName);
    const artObj = (orderArticles || []).find(a => (a.name || '').toLowerCase() === (articleName || '').toLowerCase()) ||
      (order?.articles || []).find(a => (a.name || '').toLowerCase() === (articleName || '').toLowerCase());
    const totalArtQty = artObj?.totalPieces || order?.totalGarments || 0;
    const totalAllQty = colorOpts.reduce((sum, co) => sum + (parseFloat(co.qty) || 0), 0) || totalArtQty;

    const defaultBuffer = getArticleFabricBuffer(articleName);

    if (item.articleRows && Array.isArray(item.articleRows[articleName]) && item.articleRows[articleName].length > 0) {
      // Deduplicate rows according to article color (eliminating duplicates caused by multiple fabrics)
      const seen = new Set();
      const deduped = [];
      item.articleRows[articleName].forEach(r => {
        const raw = (r.articleColor || '').trim();
        const base = raw.replace(/\s*\(\d+\s*pcs\)/i, '').trim().toLowerCase();
        const key = base || raw.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          const matchedOpt = colorOpts.find(co => co.color.toLowerCase() === key || co.display.toLowerCase() === raw.toLowerCase());
          const hasUserEdited = r._userEditedBuffer === true;
          const resolvedBuffer = (r.bufferPct !== undefined && r.bufferPct !== null && r.bufferPct !== '' && (hasUserEdited || parseFloat(r.bufferPct) > 0))
            ? r.bufferPct
            : defaultBuffer;
          deduped.push({
            ...r,
            bufferPct: resolvedBuffer,
            totalQty: matchedOpt ? matchedOpt.qty : (key === 'all colours' ? totalAllQty : r.totalQty)
          });
        }
      });
      if (deduped.length > 0) {
        return deduped;
      }
    }

    const initialRows = colorOpts.map((co, idx) => ({
      id: `row_${articleName}_${idx}`,
      articleColor: co.display,
      totalQty: co.qty,
      placement: item.placement || '',
      accessoryColor: item.accessoryColor || '',
      size: item.size || '',
      source: item.source || '',
      fabricColor: (item.fabricColor && item.fabricColor !== '—') ? item.fabricColor : '',
      reqPerPc: item.reqPerPc || '',
      extraPerPack: item.extraPerPack || '',
      bufferPct: (item.bufferPct !== undefined && item.bufferPct !== '' && (item._userEditedBuffer || parseFloat(item.bufferPct) > 0)) ? item.bufferPct : defaultBuffer,
      dyedRate: item.dyedRate || '',
      shrinkPct: item.shrinkPct || '',
      lines: item.lines || ''
    }));
    return initialRows.length > 0 ? initialRows : [
      {
        id: `row_${articleName}_0`,
        articleColor: 'All colours',
        totalQty: totalAllQty,
        placement: '',
        accessoryColor: '',
        size: '',
        source: '',
        fabricColor: '',
        reqPerPc: '',
        extraPerPack: '',
        bufferPct: defaultBuffer
      }
    ];
  };

  const handleUpdateCardRowField = (itemId, articleName, rowIndex, field, value) => {
    let finalValue = value;
    if (field === 'bufferPct') {
      if (value !== '' && value !== null && value !== undefined) {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          if (num > 10) {
            finalValue = '10';
          } else if (num < 0) {
            finalValue = '0';
          } else {
            finalValue = value;
          }
        }
      }
    }

    setAddedAccessories(prev => prev.map(item => {
      if (item.id !== itemId) return item;

      const currentRows = getCardArticleRows(item, articleName);
      const targetRow = currentRows[rowIndex];
      const isAllColoursRow = targetRow?.articleColor === 'All colours';

      const updatedRows = currentRows.map((r, rIdx) => {
        if (rIdx === rowIndex) {
          const custom = { ...(r.customized || {}) };
          if (rIdx > 0 && !isAllColoursRow) {
            const topVal = currentRows[0]?.[field];
            if (finalValue === topVal) {
              delete custom[field];
            } else {
              custom[field] = true;
            }
          }
          return {
            ...r,
            [field]: finalValue,
            ...(field === 'bufferPct' ? { _userEditedBuffer: true } : {}),
            customized: custom
          };
        }

        if (isAllColoursRow) {
          const custom = { ...(r.customized || {}) };
          delete custom[field];
          return {
            ...r,
            [field]: finalValue,
            ...(field === 'bufferPct' ? { _userEditedBuffer: true } : {}),
            customized: custom
          };
        }

        if (rowIndex === 0) {
          const isCustomized = r.customized
            ? Boolean(r.customized[field])
            : (r[field] !== undefined && r[field] !== '' && r[field] !== currentRows[0]?.[field]);
          if (!isCustomized) {
            return {
              ...r,
              [field]: finalValue,
              ...(field === 'bufferPct' ? { _userEditedBuffer: true } : {})
            };
          }
        }

        return r;
      });

      const newArticleRows = {
        ...(item.articleRows || {}),
        [articleName]: updatedRows
      };

      return {
        ...item,
        articleRows: newArticleRows,
        placement: updatedRows[0]?.placement || item.placement,
        accessoryColor: updatedRows[0]?.accessoryColor || item.accessoryColor,
        source: updatedRows[0]?.source || item.source,
        fabricColor: updatedRows[0]?.fabricColor || item.fabricColor,
        reqPerPc: updatedRows[0]?.reqPerPc || item.reqPerPc,
        extraPerPack: updatedRows[0]?.extraPerPack || item.extraPerPack,
        bufferPct: updatedRows[0]?.bufferPct || item.bufferPct
      };
    }));
  };

  const handleUpdateCardRowArticleColor = (itemId, articleName, rowIndex, newColorDisplay) => {
    setAddedAccessories(prev => prev.map(item => {
      if (item.id !== itemId) return item;

      const currentRows = getCardArticleRows(item, articleName);
      const colorOpts = getArticleColorOptions(articleName);
      const artObj = (orderArticles || []).find(a => (a.name || '').toLowerCase() === (articleName || '').toLowerCase()) ||
        (order?.articles || []).find(a => (a.name || '').toLowerCase() === (articleName || '').toLowerCase());
      const totalArtQty = artObj?.totalPieces || order?.totalGarments || 0;
      const totalAllQty = colorOpts.reduce((sum, co) => sum + (parseFloat(co.qty) || 0), 0) || totalArtQty;

      const updatedRows = currentRows.map((r, rIdx) => {
        if (rIdx !== rowIndex) return r;
        if (newColorDisplay === 'All colours') {
          return {
            ...r,
            articleColor: 'All colours',
            totalQty: totalAllQty
          };
        }
        const matchedOpt = colorOpts.find(co => co.display === newColorDisplay);
        return {
          ...r,
          articleColor: newColorDisplay,
          totalQty: matchedOpt?.qty || 100
        };
      });

      return {
        ...item,
        articleRows: {
          ...(item.articleRows || {}),
          [articleName]: updatedRows
        }
      };
    }));
  };

  const handleAddMultipleAccessories = (catId, varName, count = 1) => {
    const catObj = ACCESSORY_CATEGORIES.find(c => c.id === catId);
    const varObj = catObj?.varieties?.find(v => v.name.toLowerCase() === (varName || '').toLowerCase()) || catObj?.varieties?.[0];
    const resolvedVarName = varName || varObj?.name || 'Coconut';
    const existingForVar = addedAccessories.filter(a => a.category === catId && a.varietyName === resolvedVarName);
    const startNum = existingForVar.length + 1;

    const targetArticle = selectedBomArticle || orderArticles[0]?.name || 'Kurta';
    const resolvedSizes = (varObj?.sizes && varObj.sizes.length > 0) ? varObj.sizes : [];
    const resolvedColors = (varObj?.colors && varObj.colors.length > 0) ? varObj.colors : [];
    const initialSize = varObj?.defaultSize || '';
    const initialColor = varObj?.defaultColor || '';

    const newItems = [];
    const newEditingIds = {};

    for (let i = 0; i < count; i++) {
      const instNum = startNum + i;
      const itemId = `acc_${catId}_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`;

      const initialArticleRows = {};
      orderArticles.forEach(art => {
        const colorOpts = getArticleColorOptions(art.name);
        const defaultBuffer = getArticleFabricBuffer(art.name);
        initialArticleRows[art.name] = colorOpts.map((co, cIdx) => ({
          id: `row_${art.name}_${cIdx}`,
          articleColor: co.display,
          totalQty: co.qty,
          placement: '',
          accessoryColor: initialColor,
          size: initialSize,
          source: varObj?.type || '',
          fabricColor: '',
          reqPerPc: '',
          extraPerPack: '',
          bufferPct: defaultBuffer,
          dyedRate: '',
          shrinkPct: '',
          lines: ''
        }));
      });

      newItems.push({
        id: itemId,
        category: catId,
        varietyName: resolvedVarName,
        configIndex: instNum,
        unit: varObj?.unit || catObj?.defaultUnit || 'PCS',
        activeArticle: targetArticle,
        selectedArticles: [targetArticle],
        hasSizes: resolvedSizes.length > 0,
        sizes: resolvedSizes,
        colors: resolvedColors,
        articleRows: initialArticleRows,
        placement: '',
        accessoryColor: initialColor,
        size: initialSize,
        source: varObj?.type || '',
        fabricColor: '',
        reqPerPc: '',
        extraPerPack: '',
        bufferPct: getArticleFabricBuffer(targetArticle),
        total: '0.0'
      });

      newEditingIds[itemId] = true;
    }

    setAddedAccessories(prev => [...prev, ...newItems]);
    setEditingAccessoryIds(prev => ({ ...prev, ...newEditingIds }));
    setToastMessage(`Added ${count}x "${resolvedVarName}"!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleDirectAddAccessory = (catId, varName, articleName) => {
    handleAddMultipleAccessories(catId, varName, 1);
  };

  const handleUpdateItemField = (itemId, field, value) => {
    setAddedAccessories(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleDeleteItem = (itemId) => {
    const currentScroll = typeof window !== 'undefined' ? window.scrollY : 0;
    const remaining = addedAccessories.filter(item => item.id !== itemId);
    setAddedAccessories(remaining);
    setEditingAccessoryIds(prev => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });

    const updatedOrder = {
      ...order,
      accessories: remaining
    };
    const saved = getStoredData('erp_sales_orders_v1', []);
    const updated = [updatedOrder, ...saved.filter(o => o.id !== updatedOrder.id)];
    setStoredData('erp_sales_orders_v1', updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('erp_sales_order_updated', { detail: updatedOrder }));
    }

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    }

    setToastMessage('Accessory removed');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        window.scrollTo({ top: currentScroll, behavior: 'instant' });
      });
    }
  };

  const handleSaveItem = (item) => {
    const currentScroll = typeof window !== 'undefined' ? window.scrollY : 0;
    setEditingAccessoryIds(prev => ({ ...prev, [item.id]: false }));

    const updatedOrder = {
      ...order,
      accessories: addedAccessories
    };
    const saved = getStoredData('erp_sales_orders_v1', []);
    const updated = [updatedOrder, ...saved.filter(o => o.id !== updatedOrder.id)];
    setStoredData('erp_sales_orders_v1', updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('erp_sales_order_updated', { detail: updatedOrder }));
    }

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    }

    setToastMessage(`"${item.varietyName || item.category}" saved successfully!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);

    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        window.scrollTo({ top: currentScroll, behavior: 'instant' });
      });
    }
  };

  const handleSaveFullOrder = (status) => {
    const isDraft = status === 'Draft';
    const newStatus = isDraft ? 'Draft' : 'Confirmed';
    const newStage = isDraft ? 'Draft' : 'Confirmed';
    setConfirmed(!isDraft);

    let userName = 'Saksham Garg';
    let userRole = 'Merchandiser';
    try {
      const currentUserStr = typeof localStorage !== 'undefined' ? localStorage.getItem('erp_user') : null;
      if (currentUserStr) {
        const u = JSON.parse(currentUserStr);
        if (u.name) userName = u.name;
        if (u.role) userRole = u.role.split(' ')[0] || 'Merchandiser';
      }
    } catch (e) {}

    const nowIso = new Date().toISOString();
    const historyText = isDraft
      ? `Order saved as draft (${userName} (${userRole}))`
      : `Order saved (${userName} (${userRole}))`;

    const newHistoryEntry = {
      date: nowIso,
      dateFormatted: formatDateWithTime(nowIso),
      text: historyText
    };

    const updatedHistory = [newHistoryEntry, ...orderHistory];
    setOrderHistory(updatedHistory);

    const updatedOrder = {
      ...order,
      status: newStatus,
      stage: newStage,
      accessories: addedAccessories,
      fabricConsumptions: consumptionRows,
      articleSourcing,
      history: updatedHistory
    };

    const saved = getStoredData('erp_sales_orders_v1', []);
    const updated = [updatedOrder, ...saved.filter(o => o.id !== updatedOrder.id)];
    setStoredData('erp_sales_orders_v1', updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('erp_sales_order_updated', { detail: updatedOrder }));
    }

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    }

    if (isDraft) {
      setToastMessage('Order saved as Draft successfully!');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        if (onBack) onBack();
      }, 600);
    } else {
      setToastMessage(`Order #${updatedOrder.id || ''} saved successfully!`);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 1500);
    }
  };

  const handleSaveAllBOM = () => {
    const currentScroll = typeof window !== 'undefined' ? window.scrollY : 0;
    const updatedOrder = {
      ...order,
      accessories: addedAccessories
    };
    const saved = getStoredData('erp_sales_orders_v1', []);
    const updated = [updatedOrder, ...saved.filter(o => o.id !== updatedOrder.id)];
    setStoredData('erp_sales_orders_v1', updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('erp_sales_order_updated', { detail: updatedOrder }));
    }

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    }

    setToastMessage(`Accessories BOM for ${bomCustomerName} saved successfully!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        window.scrollTo({ top: currentScroll, behavior: 'instant' });
      });
    }
  };


  const renderCategoryCardTable = (cat, item, selectedArticles, isEditing = true) => {
    const inputStyle = {
      border: isEditing ? '1.5px solid #cbd5e1' : '1px solid #e2e8f0',
      borderRadius: '7px',
      height: '36px',
      minHeight: '36px',
      padding: '5px 10px',
      fontSize: '12.5px',
      lineHeight: '1.4',
      backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
      color: '#0f172a',
      cursor: isEditing ? 'text' : 'default',
      boxShadow: 'none',
      width: '100%',
      opacity: 1
    };
    const selectStyle = {
      border: isEditing ? '1.5px solid #cbd5e1' : '1px solid #e2e8f0',
      borderRadius: '7px',
      height: '36px',
      minHeight: '36px',
      padding: '5px 28px 5px 10px',
      fontSize: '12.5px',
      lineHeight: '1.4',
      backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
      color: '#0f172a',
      cursor: isEditing ? 'pointer' : 'default',
      boxShadow: 'none',
      width: '100%',
      opacity: 1
    };

    const articlesToRender = Array.isArray(selectedArticles)
      ? (selectedArticles.length > 0 ? selectedArticles : [orderArticles[0]?.name || 'Kurta'])
      : [selectedArticles || orderArticles[0]?.name || 'Kurta'];

    if (!cat || cat.id === 'Buttons' || !['Lace', 'Tassels', 'Thread', 'Dori'].includes(cat.id)) {
      return (
        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="table table-borderless align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead>
              <tr className="text-muted text-uppercase" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', borderBottom: '1.5px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                <th style={{ padding: '8px 10px' }}>Article</th>
                <th style={{ padding: '8px 10px' }}>Article Colour</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Total Quantity</th>
                <th style={{ padding: '8px 10px' }}>Placement</th>
                <th style={{ padding: '8px 10px' }}>Accessory Colour</th>
                <th style={{ padding: '8px 10px' }}>Size</th>
                <th style={{ padding: '8px 10px' }}>Source</th>
                <th style={{ padding: '8px 10px' }}>Fabric Colour</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Req/Pc</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Pack</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Buffer %</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Total Qty</th>
              </tr>
            </thead>
            <tbody>
              {articlesToRender.map((currentArticle) => {
                const rows = getCardArticleRows(item, currentArticle);
                const colorOptions = getArticleColorOptions(currentArticle);
                const isBottom = /pant|plazo|palazzo|pajama|salwar|bottom|trouser/i.test(currentArticle || '');
                const artObj = (orderArticles || []).find(a => (a.name || '').toLowerCase() === (currentArticle || '').toLowerCase()) ||
                  (order?.articles || []).find(a => (a.name || '').toLowerCase() === (currentArticle || '').toLowerCase());
                const totalArtQty = artObj?.totalPieces || order?.totalGarments || 0;
                const totalAllQty = colorOptions.reduce((sum, co) => sum + (parseFloat(co.qty) || 0), 0) || totalArtQty;

                return rows.map((row, rIdx) => {
                  const isAllColours = row.articleColor === 'All colours';
                  const reqVal = parseFloat(row.reqPerPc) || 0;
                  const packInput = row.extraPerPack !== undefined && row.extraPerPack !== null ? String(row.extraPerPack).trim() : '';
                  const packNum = parseFloat(packInput);
                  const packVal = (!isNaN(packNum) && packNum >= 0) ? packNum : 0;
                  const defaultBuf = getArticleFabricBuffer(currentArticle);
                  const hasUserEdited = row._userEditedBuffer === true;
                  const bufVal = (row.bufferPct !== undefined && row.bufferPct !== null && row.bufferPct !== '' && (hasUserEdited || parseFloat(row.bufferPct) > 0))
                    ? (parseFloat(row.bufferPct) || 0)
                    : defaultBuf;
                  const artPcs = parseFloat(row.totalQty) || (isAllColours ? totalAllQty : 0);
                  const reqQty = artPcs * reqVal;
                  const packQty = artPcs * packVal;
                  const baseCalc = reqQty + packQty;
                  const bufQty = (baseCalc * bufVal) / 100;
                  const liveTotalNum = baseCalc + bufQty;
                  const liveTotal = liveTotalNum % 1 === 0 ? liveTotalNum.toFixed(0) : liveTotalNum.toFixed(1);
                  const isJobWork = /job/i.test(row.source || '');

                  return (
                    <tr key={`${currentArticle}_${row.id || rIdx}`} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ minWidth: '110px', verticalAlign: 'middle', padding: '6px 8px' }}>
                        <div className="d-flex align-items-center gap-1.5 fw-semibold text-dark" style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                          <span>{isBottom ? '👖' : '🎽'}</span>
                          <span>{currentArticle}</span>
                          {isAllColours && (
                            <span
                              className="badge ms-1.5"
                              style={{
                                backgroundColor: '#fef3c7',
                                color: '#b45309',
                                fontSize: '9.5px',
                                fontWeight: 800,
                                padding: '2px 5px',
                                lineHeight: 1.1,
                                borderRadius: '4px',
                                border: '1px solid #fde68a'
                              }}
                            >
                              FILLS<br />ALL
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ minWidth: '165px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <select
                            className="form-select form-select-sm"
                            value={row.articleColor || ''}
                            onChange={(e) => handleUpdateCardRowArticleColor(item.id, currentArticle, rIdx, e.target.value)}
                            style={selectStyle}
                          >
                            <option value="All colours">All colours</option>
                            {colorOptions.map((co, cIdx) => (
                              <option key={cIdx} value={co.display}>{co.display}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-dark fw-medium" style={{ fontSize: '13px' }}>
                            {row.articleColor || '—'}
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'center', minWidth: '95px', padding: '6px 8px' }}>
                        <span className="badge fw-semibold" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontSize: '12px', padding: '6px 12px', borderRadius: '6px' }}>
                          {isAllColours ? (row.totalQty && row.totalQty !== '—' ? row.totalQty : totalAllQty) : (row.totalQty || 0)}
                        </span>
                      </td>

                      <td style={{ minWidth: '130px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Front.."
                            value={row.placement ?? ''}
                            onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'placement', e.target.value)}
                            style={inputStyle}
                          />
                        ) : (
                          <span className="text-dark" style={{ fontSize: '13px' }}>{row.placement || '—'}</span>
                        )}
                      </td>

                      <td style={{ minWidth: '135px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="e.g. Pearl Wh"
                            value={row.accessoryColor ?? ''}
                            onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'accessoryColor', e.target.value)}
                            style={inputStyle}
                          />
                        ) : (
                          <span className="text-dark" style={{ fontSize: '13px' }}>{row.accessoryColor || '—'}</span>
                        )}
                      </td>

                      <td style={{ minWidth: '120px', padding: '6px 8px' }}>
                        {isEditing ? (
                          item.hasSizes && item.sizes && item.sizes.length > 0 ? (
                            <select
                              className="form-select form-select-sm"
                              value={row.size ?? ''}
                              onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'size', e.target.value)}
                              style={selectStyle}
                            >
                              <option value="">Select Size</option>
                              {item.sizes.map((s, sIdx) => <option key={sIdx} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Size"
                              value={row.size ?? ''}
                              onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'size', e.target.value)}
                              style={inputStyle}
                            />
                          )
                        ) : (
                          <span className="text-dark" style={{ fontSize: '13px' }}>{row.size || '—'}</span>
                        )}
                      </td>

                      <td style={{ minWidth: '130px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <select
                            className="form-select form-select-sm"
                            value={row.source ?? ''}
                            onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'source', e.target.value)}
                            style={selectStyle}
                          >
                            <option value="">Select...</option>
                            <option value="Ready Made">Ready Made</option>
                            <option value="Job Work">Job Work</option>
                            <option value="In-House">In-House</option>
                            <option value="Vendor / Mill">Vendor / Mill</option>
                          </select>
                        ) : (
                          <span className="text-dark" style={{ fontSize: '13px' }}>{row.source || '—'}</span>
                        )}
                      </td>

                      <td style={{ minWidth: '125px', padding: '6px 8px' }}>
                        {isEditing ? (
                          isJobWork ? (
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="e.g., Maroon"
                              value={row.fabricColor && row.fabricColor !== '—' ? row.fabricColor : ''}
                              onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'fabricColor', e.target.value)}
                              style={inputStyle}
                            />
                          ) : (
                            <span className="text-muted d-block text-center" style={{ fontSize: '13px' }}>—</span>
                          )
                        ) : (
                          <span className={isJobWork ? "text-dark" : "text-muted d-block text-center"} style={{ fontSize: '13px' }}>
                            {isJobWork ? (row.fabricColor && row.fabricColor !== '—' ? row.fabricColor : '—') : '—'}
                          </span>
                        )}
                      </td>

                      <td style={{ minWidth: '70px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="form-control form-control-sm text-center"
                            value={row.reqPerPc ?? ''}
                            placeholder="0"
                            onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'reqPerPc', e.target.value)}
                            style={inputStyle}
                          />
                        ) : (
                          <span className="d-block text-center text-dark" style={{ fontSize: '13px' }}>{row.reqPerPc || '0'}</span>
                        )}
                      </td>

                      <td style={{ minWidth: '75px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="form-control form-control-sm text-center"
                            value={row.extraPerPack ?? ''}
                            placeholder="0"
                            onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'extraPerPack', e.target.value)}
                            style={inputStyle}
                          />
                        ) : (
                          <span className="d-block text-center text-dark" style={{ fontSize: '13px' }}>{row.extraPerPack || '0'}</span>
                        )}
                      </td>

                      <td style={{ minWidth: '80px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <div className="d-flex flex-column align-items-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              className="form-control form-control-sm text-center"
                              value={row.bufferPct !== undefined && row.bufferPct !== '' && (row._userEditedBuffer || parseFloat(row.bufferPct) > 0) ? row.bufferPct : defaultBuf}
                              placeholder={String(defaultBuf)}
                              onKeyDown={(e) => {
                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'bufferPct', e.target.value)}
                              style={inputStyle}
                            />
                            <span className="text-muted" style={{ fontSize: '10px', marginTop: '2px' }}>max 10</span>
                          </div>
                        ) : (
                          <span className="d-block text-center text-dark" style={{ fontSize: '13px' }}>
                            {bufVal}%
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'center', minWidth: '95px', padding: '6px 8px' }}>
                        <span className="badge fw-bold" style={{ backgroundColor: '#eef2ff', color: '#2e37a4', fontSize: '12.5px', padding: '6px 12px', borderRadius: '6px' }}>
                          {liveTotal} PCS
                        </span>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (cat.id === 'Lace') {
      return (
        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="table table-borderless align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead>
              <tr className="text-muted text-uppercase" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', borderBottom: '1.5px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                <th style={{ padding: '8px 10px' }}>Article</th>
                <th style={{ padding: '8px 10px' }}>Article Colour</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Total Quantity</th>
                <th style={{ padding: '8px 10px' }}>Placement</th>
                <th style={{ padding: '8px 10px' }}>Accessory Colour</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Dyed mtr/pc</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Shrink%</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Greige/Pc</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Buffer %</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', color: '#2e37a4' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {articlesToRender.map((currentArticle) => {
                const rows = getCardArticleRows(item, currentArticle);
                const colorOptions = getArticleColorOptions(currentArticle);
                const isBottom = /pant|plazo|palazzo|pajama|salwar|bottom|trouser/i.test(currentArticle || '');
                const artObj = (orderArticles || []).find(a => (a.name || '').toLowerCase() === (currentArticle || '').toLowerCase()) ||
                  (order?.articles || []).find(a => (a.name || '').toLowerCase() === (currentArticle || '').toLowerCase());
                const totalArtQty = artObj?.totalPieces || order?.totalGarments || 0;
                const totalAllQty = colorOptions.reduce((sum, co) => sum + (parseFloat(co.qty) || 0), 0) || totalArtQty;

                return rows.map((row, rIdx) => {
                  const isAllColours = row.articleColor === 'All colours';
                  const dyedVal = parseFloat(row.dyedRate) || 0;
                  const shrinkVal = parseFloat(row.shrinkPct) || 0;
                  const greigeVal = dyedVal * (1 + shrinkVal / 100);
                  const defaultBuf = getArticleFabricBuffer(currentArticle);
                  const hasUserEdited = row._userEditedBuffer === true;
                  const bufferVal = (row.bufferPct !== undefined && row.bufferPct !== null && row.bufferPct !== '' && (hasUserEdited || parseFloat(row.bufferPct) > 0))
                    ? (parseFloat(row.bufferPct) || 0)
                    : defaultBuf;
                  const qtyVal = parseFloat(row.totalQty) || (isAllColours ? totalAllQty : 0);
                  const totalValNum = (greigeVal * qtyVal * (1 + bufferVal / 100));
                  const totalVal = totalValNum % 1 === 0 ? totalValNum.toFixed(0) : totalValNum.toFixed(1);

                  return (
                    <tr key={`${currentArticle}_${row.id || rIdx}`} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ minWidth: '110px', verticalAlign: 'middle', padding: '6px 8px' }}>
                        <div className="d-flex align-items-center gap-1.5 fw-semibold text-dark" style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                          <span>{isBottom ? '👖' : '🎽'}</span>
                          <span>{currentArticle}</span>
                          {isAllColours && (
                            <span className="badge ms-1.5" style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '9.5px', fontWeight: 800, padding: '2px 5px', lineHeight: 1.1, borderRadius: '4px', border: '1px solid #fde68a' }}>FILLS<br />ALL</span>
                          )}
                        </div>
                      </td>
                      <td style={{ minWidth: '165px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <select className="form-select form-select-sm" value={row.articleColor || ''} onChange={(e) => handleUpdateCardRowArticleColor(item.id, currentArticle, rIdx, e.target.value)} style={selectStyle}>
                            <option value="All colours">All colours</option>
                            {colorOptions.map((co, cIdx) => (
                              <option key={cIdx} value={co.display}>{co.display}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-dark fw-medium" style={{ fontSize: '13px' }}>{row.articleColor || '—'}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', minWidth: '95px', padding: '6px 8px' }}>
                        <span className="badge fw-semibold" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontSize: '12px', padding: '6px 12px', borderRadius: '6px' }}>
                          {isAllColours ? (row.totalQty && row.totalQty !== '—' ? row.totalQty : totalAllQty) : (row.totalQty || 0)}
                        </span>
                      </td>
                      <td style={{ minWidth: '130px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <input type="text" className="form-control form-control-sm" placeholder="Front.." value={row.placement ?? ''} onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'placement', e.target.value)} style={inputStyle} />
                        ) : (
                          <span className="text-dark" style={{ fontSize: '13px' }}>{row.placement || '—'}</span>
                        )}
                      </td>
                      <td style={{ minWidth: '135px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <input type="text" className="form-control form-control-sm" placeholder="e.g. Pearl Wh" value={row.accessoryColor ?? ''} onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'accessoryColor', e.target.value)} style={inputStyle} />
                        ) : (
                          <span className="text-dark" style={{ fontSize: '13px' }}>{row.accessoryColor || '—'}</span>
                        )}
                      </td>
                      <td style={{ minWidth: '90px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <input type="number" step="0.01" min="0" className="form-control form-control-sm text-center" value={row.dyedRate ?? ''} placeholder="0" onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'dyedRate', e.target.value)} style={inputStyle} />
                        ) : (
                          <span className="d-block text-center text-dark" style={{ fontSize: '13px' }}>{row.dyedRate || '0'}</span>
                        )}
                      </td>
                      <td style={{ minWidth: '75px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <input type="number" min="0" className="form-control form-control-sm text-center" value={row.shrinkPct ?? ''} placeholder="0" onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'shrinkPct', e.target.value)} style={inputStyle} />
                        ) : (
                          <span className="d-block text-center text-dark" style={{ fontSize: '13px' }}>{row.shrinkPct ? row.shrinkPct + '%' : '0'}</span>
                        )}
                      </td>
                      <td className="text-center font-monospace" style={{ minWidth: '85px', padding: '6px 8px', fontSize: '13px' }}>
                        {greigeVal.toFixed(3)}
                      </td>
                      <td style={{ minWidth: '80px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <div className="d-flex flex-column align-items-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              className="form-control form-control-sm text-center"
                              value={row.bufferPct !== undefined && row.bufferPct !== '' && (row._userEditedBuffer || parseFloat(row.bufferPct) > 0) ? row.bufferPct : defaultBuf}
                              placeholder={String(defaultBuf)}
                              onKeyDown={(e) => {
                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'bufferPct', e.target.value)}
                              style={inputStyle}
                            />
                            <span className="text-muted" style={{ fontSize: '10px', marginTop: '2px' }}>max 10</span>
                          </div>
                        ) : (
                          <span className="d-block text-center text-dark" style={{ fontSize: '13px' }}>
                            {bufferVal}%
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', minWidth: '95px', padding: '6px 8px' }}>
                        <span className="badge fw-bold" style={{ backgroundColor: '#eef2ff', color: '#2e37a4', fontSize: '12.5px', padding: '6px 12px', borderRadius: '6px' }}>
                          {totalVal} m
                        </span>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (cat.id === 'Tassels') {
      return (
        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="table table-borderless align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead>
              <tr className="text-muted text-uppercase" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', borderBottom: '1.5px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                <th style={{ padding: '8px 10px' }}>Article</th>
                <th style={{ padding: '8px 10px' }}>Article Colour</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Total Quantity</th>
                <th style={{ padding: '8px 10px' }}>Placement</th>
                <th style={{ padding: '8px 10px' }}>Accessory Colour</th>
                <th style={{ padding: '8px 10px' }}>Source</th>
                <th style={{ padding: '8px 10px' }}>Fabric Colour</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Size</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Req/Pc</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Thread Req. (mts)</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Buffer %</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', color: '#2e37a4' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {articlesToRender.map((currentArticle) => {
                const rows = getCardArticleRows(item, currentArticle);
                const colorOptions = getArticleColorOptions(currentArticle);
                const isBottom = /pant|plazo|palazzo|pajama|salwar|bottom|trouser/i.test(currentArticle || '');
                const artObj = (orderArticles || []).find(a => (a.name || '').toLowerCase() === (currentArticle || '').toLowerCase()) ||
                  (order?.articles || []).find(a => (a.name || '').toLowerCase() === (currentArticle || '').toLowerCase());
                const totalArtQty = artObj?.totalPieces || order?.totalGarments || 0;
                const totalAllQty = colorOptions.reduce((sum, co) => sum + (parseFloat(co.qty) || 0), 0) || totalArtQty;

                return rows.map((row, rIdx) => {
                  const isAllColours = row.articleColor === 'All colours';
                  const reqVal = parseFloat(row.reqPerPc) || 0;
                  const defaultBuf = getArticleFabricBuffer(currentArticle);
                  const hasUserEdited = row._userEditedBuffer === true;
                  const bufferVal = (row.bufferPct !== undefined && row.bufferPct !== null && row.bufferPct !== '' && (hasUserEdited || parseFloat(row.bufferPct) > 0))
                    ? (parseFloat(row.bufferPct) || 0)
                    : defaultBuf;
                  const qtyVal = parseFloat(row.totalQty) || (isAllColours ? totalAllQty : 0);
                  const totalValNum = (reqVal * qtyVal * (1 + bufferVal / 100));
                  const totalVal = totalValNum % 1 === 0 ? totalValNum.toFixed(0) : Math.ceil(totalValNum).toFixed(0);
                  const isJobWork = /job/i.test(row.source || '');

                  return (
                    <tr key={`${currentArticle}_${row.id || rIdx}`} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ minWidth: '110px', verticalAlign: 'middle', padding: '6px 8px' }}>
                        <div className="d-flex align-items-center gap-1.5 fw-semibold text-dark" style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                          <span>{isBottom ? '👖' : '🎽'}</span>
                          <span>{currentArticle}</span>
                          {isAllColours && (
                            <span className="badge ms-1.5" style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '9.5px', fontWeight: 800, padding: '2px 5px', lineHeight: 1.1, borderRadius: '4px', border: '1px solid #fde68a' }}>FILLS<br />ALL</span>
                          )}
                        </div>
                      </td>
                      <td style={{ minWidth: '165px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <select className="form-select form-select-sm" value={row.articleColor || ''} onChange={(e) => handleUpdateCardRowArticleColor(item.id, currentArticle, rIdx, e.target.value)} style={selectStyle}>
                            <option value="All colours">All colours</option>
                            {colorOptions.map((co, cIdx) => (
                              <option key={cIdx} value={co.display}>{co.display}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-dark fw-medium" style={{ fontSize: '13px' }}>{row.articleColor || '—'}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', minWidth: '95px', padding: '6px 8px' }}>
                        <span className="badge fw-semibold" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontSize: '12px', padding: '6px 12px', borderRadius: '6px' }}>
                          {isAllColours ? (row.totalQty && row.totalQty !== '—' ? row.totalQty : totalAllQty) : (row.totalQty || 0)}
                        </span>
                      </td>
                      <td style={{ minWidth: '130px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <input type="text" className="form-control form-control-sm" placeholder="Front.." value={row.placement ?? ''} onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'placement', e.target.value)} style={inputStyle} />
                        ) : (
                          <span className="text-dark" style={{ fontSize: '13px' }}>{row.placement || '—'}</span>
                        )}
                      </td>
                      <td style={{ minWidth: '135px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <input type="text" className="form-control form-control-sm" placeholder="e.g. Pearl Wh" value={row.accessoryColor ?? ''} onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'accessoryColor', e.target.value)} style={inputStyle} />
                        ) : (
                          <span className="text-dark" style={{ fontSize: '13px' }}>{row.accessoryColor || '—'}</span>
                        )}
                      </td>
                      <td style={{ minWidth: '130px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <select className="form-select form-select-sm" value={row.source ?? ''} onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'source', e.target.value)} style={selectStyle}>
                            <option value="">Select...</option>
                            <option value="Ready Made">Ready Made</option>
                            <option value="Job Work">Job Work</option>
                          </select>
                        ) : (
                          <span className="text-dark" style={{ fontSize: '13px' }}>{row.source || '—'}</span>
                        )}
                      </td>
                      <td style={{ minWidth: '125px', padding: '6px 8px' }}>
                        {isEditing ? (
                          isJobWork ? (
                            <input type="text" className="form-control form-control-sm" placeholder="e.g., Maroon" value={row.fabricColor && row.fabricColor !== '—' ? row.fabricColor : ''} onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'fabricColor', e.target.value)} style={inputStyle} />
                          ) : (
                            <span className="text-muted d-block text-center" style={{ fontSize: '13px' }}>—</span>
                          )
                        ) : (
                          <span className={isJobWork ? "text-dark" : "text-muted d-block text-center"} style={{ fontSize: '13px' }}>
                            {isJobWork ? (row.fabricColor && row.fabricColor !== '—' ? row.fabricColor : '—') : '—'}
                          </span>
                        )}
                      </td>
                      <td className="text-center text-muted" style={{ minWidth: '70px', padding: '6px 8px' }}>—</td>
                      <td style={{ minWidth: '75px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <input type="number" min="0" className="form-control form-control-sm text-center" value={row.reqPerPc ?? ''} placeholder="0" onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'reqPerPc', e.target.value)} style={inputStyle} />
                        ) : (
                          <span className="d-block text-center text-dark" style={{ fontSize: '13px' }}>{row.reqPerPc || '0'}</span>
                        )}
                      </td>
                      <td className="text-center text-muted" style={{ minWidth: '95px', padding: '6px 8px' }}>—</td>
                      <td style={{ minWidth: '80px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <div className="d-flex flex-column align-items-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              className="form-control form-control-sm text-center"
                              value={row.bufferPct !== undefined && row.bufferPct !== '' && (row._userEditedBuffer || parseFloat(row.bufferPct) > 0) ? row.bufferPct : defaultBuf}
                              placeholder={String(defaultBuf)}
                              onKeyDown={(e) => {
                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'bufferPct', e.target.value)}
                              style={inputStyle}
                            />
                            <span className="text-muted" style={{ fontSize: '10px', marginTop: '2px' }}>max 10</span>
                          </div>
                        ) : (
                          <span className="d-block text-center text-dark" style={{ fontSize: '13px' }}>
                            {bufferVal}%
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', minWidth: '95px', padding: '6px 8px' }}>
                        <span className="badge fw-bold" style={{ backgroundColor: '#eef2ff', color: '#2e37a4', fontSize: '12.5px', padding: '6px 12px', borderRadius: '6px' }}>
                          {totalVal} PCS
                        </span>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="table table-borderless align-middle mb-0" style={{ fontSize: '13px' }}>
          <thead>
            <tr className="text-muted text-uppercase" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', borderBottom: '1.5px solid #e2e8f0', whiteSpace: 'nowrap' }}>
              <th style={{ padding: '8px 10px' }}>Article</th>
              <th style={{ padding: '8px 10px' }}>Article Colour</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Total Quantity</th>
              <th style={{ padding: '8px 10px' }}>Placement</th>
              <th style={{ padding: '8px 10px' }}>Accessory Colour</th>
              <th style={{ padding: '8px 10px' }}>Size</th>
              <th style={{ padding: '8px 10px' }}>Source</th>
              <th style={{ padding: '8px 10px' }}>Fabric Colour</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Req/Pc</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Buffer %</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', color: '#2e37a4' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {articlesToRender.map((currentArticle) => {
              const rows = getCardArticleRows(item, currentArticle);
              const colorOptions = getArticleColorOptions(currentArticle);
              const isBottom = /pant|plazo|palazzo|pajama|salwar|bottom|trouser/i.test(currentArticle || '');
              const artObj = (orderArticles || []).find(a => (a.name || '').toLowerCase() === (currentArticle || '').toLowerCase()) ||
                (order?.articles || []).find(a => (a.name || '').toLowerCase() === (currentArticle || '').toLowerCase());
              const totalArtQty = artObj?.totalPieces || order?.totalGarments || 0;
              const totalAllQty = colorOptions.reduce((sum, co) => sum + (parseFloat(co.qty) || 0), 0) || totalArtQty;

              return rows.map((row, rIdx) => {
                const isAllColours = row.articleColor === 'All colours';
                const reqVal = parseFloat(row.reqPerPc) || 0;
                const defaultBuf = getArticleFabricBuffer(currentArticle);
                const hasUserEdited = row._userEditedBuffer === true;
                const bufferVal = (row.bufferPct !== undefined && row.bufferPct !== null && row.bufferPct !== '' && (hasUserEdited || parseFloat(row.bufferPct) > 0))
                  ? (parseFloat(row.bufferPct) || 0)
                  : defaultBuf;
                const qtyVal = parseFloat(row.totalQty) || (isAllColours ? totalAllQty : 0);
                const totalValNum = (reqVal * qtyVal * (1 + bufferVal / 100));
                const totalVal = totalValNum % 1 === 0 ? totalValNum.toFixed(0) : totalValNum.toFixed(1);
                const isJobWork = /job/i.test(row.source || '');

                return (
                  <tr key={`${currentArticle}_${row.id || rIdx}`} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ minWidth: '110px', verticalAlign: 'middle', padding: '6px 8px' }}>
                      <div className="d-flex align-items-center gap-1.5 fw-semibold text-dark" style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                        <span>{isBottom ? '👖' : '🎽'}</span>
                        <span>{currentArticle}</span>
                        {isAllColours && (
                          <span className="badge ms-1.5" style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '9.5px', fontWeight: 800, padding: '2px 5px', lineHeight: 1.1, borderRadius: '4px', border: '1px solid #fde68a' }}>FILLS<br />ALL</span>
                        )}
                      </div>
                    </td>
                    <td style={{ minWidth: '165px', padding: '6px 8px' }}>
                      {isEditing ? (
                        <select className="form-select form-select-sm" value={row.articleColor || ''} onChange={(e) => handleUpdateCardRowArticleColor(item.id, currentArticle, rIdx, e.target.value)} style={selectStyle}>
                          <option value="All colours">All colours</option>
                          {colorOptions.map((co, cIdx) => (
                            <option key={cIdx} value={co.display}>{co.display}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-dark fw-medium" style={{ fontSize: '13px' }}>{row.articleColor || '—'}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', minWidth: '95px', padding: '6px 8px' }}>
                      <span className="badge fw-semibold" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontSize: '12px', padding: '6px 12px', borderRadius: '6px' }}>
                        {isAllColours ? (row.totalQty && row.totalQty !== '—' ? row.totalQty : totalAllQty) : (row.totalQty || 0)}
                      </span>
                    </td>
                    <td style={{ minWidth: '130px', padding: '6px 8px' }}>
                      {isEditing ? (
                        <input type="text" className="form-control form-control-sm" placeholder="Front.." value={row.placement ?? ''} onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'placement', e.target.value)} style={inputStyle} />
                      ) : (
                        <span className="text-dark" style={{ fontSize: '13px' }}>{row.placement || '—'}</span>
                      )}
                    </td>
                    <td style={{ minWidth: '135px', padding: '6px 8px' }}>
                      {isEditing ? (
                        <input type="text" className="form-control form-control-sm" placeholder="e.g. Pearl Wh" value={row.accessoryColor ?? ''} onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'accessoryColor', e.target.value)} style={inputStyle} />
                      ) : (
                        <span className="text-dark" style={{ fontSize: '13px' }}>{row.accessoryColor || '—'}</span>
                      )}
                    </td>
                    <td style={{ minWidth: '110px', padding: '6px 8px' }}>
                      {isEditing ? (
                        item.hasSizes && item.sizes && item.sizes.length > 0 ? (
                          <select className="form-select form-select-sm" value={row.size ?? ''} onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'size', e.target.value)} style={selectStyle}>
                            <option value="">Select Size</option>
                            {item.sizes.map((s, sIdx) => <option key={sIdx} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Size"
                            value={row.size ?? ''}
                            onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'size', e.target.value)}
                            style={inputStyle}
                          />
                        )
                      ) : (
                        <span className="text-dark" style={{ fontSize: '13px' }}>{row.size || '—'}</span>
                      )}
                    </td>
                    <td style={{ minWidth: '130px', padding: '6px 8px' }}>
                      {isEditing ? (
                        <select className="form-select form-select-sm" value={row.source ?? ''} onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'source', e.target.value)} style={selectStyle}>
                          <option value="">Select...</option>
                          <option value="Ready Made">Ready Made</option>
                          <option value="Job Work">Job Work</option>
                          <option value="In-House">In-House</option>
                          <option value="Vendor / Mill">Vendor / Mill</option>
                        </select>
                      ) : (
                        <span className="text-dark" style={{ fontSize: '13px' }}>{row.source || '—'}</span>
                      )}
                    </td>
                    <td style={{ minWidth: '125px', padding: '6px 8px' }}>
                      {isEditing ? (
                        isJobWork ? (
                          <input type="text" className="form-control form-control-sm" placeholder="e.g., Maroon" value={row.fabricColor && row.fabricColor !== '—' ? row.fabricColor : ''} onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'fabricColor', e.target.value)} style={inputStyle} />
                        ) : (
                          <span className="text-muted d-block text-center" style={{ fontSize: '13px' }}>—</span>
                        )
                      ) : (
                        <span className={isJobWork ? "text-dark" : "text-muted d-block text-center"} style={{ fontSize: '13px' }}>
                          {isJobWork ? (row.fabricColor && row.fabricColor !== '—' ? row.fabricColor : '—') : '—'}
                        </span>
                      )}
                    </td>
                    <td style={{ minWidth: '70px', padding: '6px 8px' }}>
                      {isEditing ? (
                        <input type="number" min="0" className="form-control form-control-sm text-center" value={row.reqPerPc ?? ''} placeholder="0" onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'reqPerPc', e.target.value)} style={inputStyle} />
                      ) : (
                        <span className="d-block text-center text-dark" style={{ fontSize: '13px' }}>{row.reqPerPc || '0'}</span>
                      )}
                    </td>
                      <td style={{ minWidth: '80px', padding: '6px 8px' }}>
                        {isEditing ? (
                          <div className="d-flex flex-column align-items-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              className="form-control form-control-sm text-center"
                              value={row.bufferPct !== undefined && row.bufferPct !== '' && (row._userEditedBuffer || parseFloat(row.bufferPct) > 0) ? row.bufferPct : defaultBuf}
                              placeholder={String(defaultBuf)}
                              onKeyDown={(e) => {
                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'bufferPct', e.target.value)}
                              style={inputStyle}
                            />
                            <span className="text-muted" style={{ fontSize: '10px', marginTop: '2px' }}>max 10</span>
                          </div>
                        ) : (
                          <span className="d-block text-center text-dark" style={{ fontSize: '13px' }}>
                            {bufferVal}%
                          </span>
                        )}
                      </td>
                    <td style={{ textAlign: 'center', minWidth: '95px', padding: '6px 8px' }}>
                      <span className="badge fw-bold" style={{ backgroundColor: '#eef2ff', color: '#2e37a4', fontSize: '12.5px', padding: '6px 12px', borderRadius: '6px' }}>
                        {totalVal} PCS
                      </span>
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCategoryItemTable = (cat, item, isEditing = true) => {
    return renderCategoryCardTable(cat, item, getCardSelectedArticles(item), isEditing);
  };

  // Edit mode vs Saved mode for Fabric Colour & Consumption table
  const [isConsumptionEditing, setIsConsumptionEditing] = useState(false);

  // Sourced directly from Fabric Master (Shrinkage % allowance per fabric quality)
  const getFabricMasterShrinkage = (fabricQuality) => {
    let allFabrics = Array.isArray(masterFabricsList) && masterFabricsList.length > 0 ? [...masterFabricsList] : [];
    try {
      const stored = getStoredData('raindrop_fabrics_v1', null);
      if (Array.isArray(stored) && stored.length > 0) {
        allFabrics = [...allFabrics, ...stored];
      }
    } catch (e) {}
    if (Array.isArray(procurementFabrics) && procurementFabrics.length > 0) {
      allFabrics = [...allFabrics, ...procurementFabrics];
    }

    const fqClean = String(fabricQuality || '').toLowerCase().trim();
    if (!fqClean) return 3.5;

    // 1. Direct or fuzzy match with Fabric Master
    let matched = allFabrics.find(f => {
      const q = String(f.qualityName || f.quality_name || f.quality || f.name || '').toLowerCase().trim();
      const id = String(f.id || '').toLowerCase().trim();
      return (q && (q === fqClean || id === fqClean)) || (q && (fqClean.includes(q) || q.includes(fqClean)));
    });

    // 2. Check if order articles contain genuine shrinkage for this fabric
    if (!matched && Array.isArray(order?.articles)) {
      for (const art of order.articles) {
        if (Array.isArray(art.fabrics)) {
          const found = art.fabrics.find(f => {
            const fn = String(f.fabricQuality || f.fabricName || f.quality || '').toLowerCase().trim();
            return fn && (fn === fqClean || fqClean.includes(fn) || fn.includes(fqClean));
          });
          if (found) {
            const raw = found.defaultShrinkage !== undefined && found.defaultShrinkage !== null && found.defaultShrinkage !== ''
              ? found.defaultShrinkage
              : (found.shrinkage !== undefined && found.shrinkage !== null && found.shrinkage !== ''
                  ? found.shrinkage
                  : found.shrinkagePercent);
            if (raw !== undefined && raw !== null && raw !== '') {
              const parsed = parseFloat(String(raw).replace('%', ''));
              if (!isNaN(parsed) && parsed >= 0) return parsed;
            }
          }
        }
      }
    }

    // 3. If matched in Fabric Master, read shrinkage or defaultShrinkage
    if (matched) {
      const raw = matched.defaultShrinkage !== undefined && matched.defaultShrinkage !== null && matched.defaultShrinkage !== ''
        ? matched.defaultShrinkage
        : (matched.shrinkage !== undefined && matched.shrinkage !== null && matched.shrinkage !== ''
            ? matched.shrinkage
            : (matched.shrinkage_percent !== undefined ? matched.shrinkage_percent : matched.shrinkPct));
      if (raw !== undefined && raw !== null && raw !== '') {
        const parsed = parseFloat(String(raw).replace('%', ''));
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    }

    // 4. Keyword fallback matching genuine industry standards from Fabric Master presets
    if (fqClean.includes('modal') || fqClean.includes('satin')) {
      return 2.0; // Modal Satin Premium default shrinkage is 2.0%
    } else if (fqClean.includes('rayon') || fqClean.includes('reyon') || fqClean.includes('liva')) {
      return 4.5; // Rayon 14kg Liva default shrinkage is 4.5%
    } else if (fqClean.includes('cambric') || fqClean.includes('cambryc')) {
      return 4.0; // Cotton Cambric 60*60 is 4.0%
    } else if (fqClean.includes('cotton') || fqClean.includes('mulmul') || fqClean.includes('voile') || fqClean.includes('gey') || fqClean.includes('grey')) {
      return 3.5; // Grey Cotton Fabrics is 3.5%
    }

    return 3.5;
  };

  // Sourcing mode per article/fabric: { [key]: 'Greige' | 'Dyed' }
  const [articleSourcing, setArticleSourcing] = useState(() => {
    const init = {};
    if (order?.articleSourcing && typeof order.articleSourcing === 'object') {
      return { ...order.articleSourcing };
    }
    const arts = order?.articles || [{ name: 'Kurta' }, { name: 'Plazo' }];
    arts.forEach((a, i) => {
      const artName = a.name || i;
      if (Array.isArray(a.fabrics) && a.fabrics.length > 0) {
        a.fabrics.forEach(f => {
          const fn = f.fabricQuality || f.fabricName || '';
          const role = f.pieceLabel || f.role || '';
          const mode = (f.source || a.sourcing || 'Greige').toLowerCase().includes('dyed') ? 'Dyed' : 'Greige';
          if (role) init[`${artName}___${fn}___${role}`] = mode;
          if (fn) init[`${artName}_${fn}`] = mode;
        });
      } else {
        const mode = (a.sourcing || a.source || 'Greige').toLowerCase().includes('dyed') ? 'Dyed' : 'Greige';
        init[artName] = mode;
        init[i] = mode;
      }
    });
    return init;
  });

  // Fabric Consumption Rows state for interactive table (Demo 5 specification)
  const [consumptionRows, setConsumptionRows] = useState(() => {
    const resolveWidth = (val) => {
      if (!val || val === '—' || val === '-') return '';
      const clean = String(val).replace(/&quot;/g, '').replace(/"/g, '').trim();
      return clean ? `${clean}"` : '';
    };

    const getFabricDefaultWidth = (fq, artFab) => {
      const fromFab = resolveWidth(artFab?.width);
      if (fromFab) return fromFab;
      return '';
    };

    const isMockSample = !order || (!order.id && !order.styleName && (!order.articles || order.articles.length === 0));

    // If order already has saved fabricConsumptions, initialize from them
    if (Array.isArray(order?.fabricConsumptions) && order.fabricConsumptions.length > 0) {
      return order.fabricConsumptions.map((fc, idx) => {
        const artName = fc.articleName || fc.article || (order?.articles?.[idx]?.name) || (idx === 0 ? 'Kurta' : idx === 1 ? 'Pant' : 'Dupatta');
        const artIdx = fc.articleIndex !== undefined
          ? fc.articleIndex
          : (order?.articles ? order.articles.findIndex(a => a.name === artName) : idx);
        const art = (order?.articles && order.articles[artIdx]) || {};
        const artFab = (art.fabrics || []).find(f => (f.fabricQuality || f.fabricName || '').toLowerCase() === (fc.fabricQuality || '').toLowerCase()) || art.fabrics?.[0] || {};
        const fabQuality = fc.fabricQuality || fc.fabricName || artFab.fabricQuality || artFab.fabricName || artFab.quality || art.fabricQuality || '';
        
        // Priority for starting width: do NOT default to 44" unless user selected or explicitly specified
        let initialWidth = '';
        if (fc._userSelectedWidth) {
          initialWidth = resolveWidth(fc.width);
        } else if (resolveWidth(artFab.width)) {
          initialWidth = resolveWidth(artFab.width);
        } else if (resolveWidth(fc.width) && resolveWidth(fc.width) !== '44"' && resolveWidth(fc.width) !== '47"') {
          initialWidth = resolveWidth(fc.width);
        }

        const masterShrink = getFabricMasterShrinkage(fabQuality);
        const shrink = masterShrink;
        const buf = parseFloat(fc.bufferPercent || fc.bufferPct || artFab.bufferPercent || 10);

        const rawPcs = fc.pcs !== undefined ? fc.pcs : fc.pieces;
        const parsedPcs = rawPcs !== undefined && rawPcs !== null && rawPcs !== '' ? parseInt(rawPcs, 10) : NaN;
        const finalPcs = !isNaN(parsedPcs) ? parsedPcs : 0;

        // Dyed Rate: do NOT pre-fill dummy 1.5, 2.5, 3.0 unless explicitly edited by user
        let rawDyed = '';
        if (fc._userEditedDyed) {
          rawDyed = fc.dyedRate;
        } else if (fc.dyedRate !== undefined && fc.dyedRate !== null && fc.dyedRate !== '' &&
                   fc.dyedRate !== 1.5 && fc.dyedRate !== '1.5' &&
                   fc.dyedRate !== 2.5 && fc.dyedRate !== '2.5' &&
                   fc.dyedRate !== 2.0 && fc.dyedRate !== '2.0' &&
                   fc.dyedRate !== 3.0 && fc.dyedRate !== '3.0' &&
                   fc.dyedRate !== 2.25 && fc.dyedRate !== '2.25') {
          rawDyed = fc.dyedRate;
        } else if (artFab.consumption !== undefined && artFab.consumption !== null && artFab.consumption !== '' &&
                   artFab.consumption !== 1.5 && artFab.consumption !== '1.5') {
          rawDyed = artFab.consumption;
        }

        return {
          key: fc.key || `row_${idx}`,
          articleIndex: artIdx >= 0 ? artIdx : idx,
          articleName: artName,
          articleCode: artName.toUpperCase(),
          articleIcon: art.icon || art.emoji || (artName.toLowerCase().includes('kurta') ? '👘' : artName.toLowerCase().includes('pant') ? '👖' : artName.toLowerCase().includes('dupatta') ? '🎀' : '👕'),
          role: autoCapitalizeWords(fc.role || artFab.pieceLabel || artFab.role || 'Main'),
          fabricQuality: fabQuality,
          source: fc.source || artFab.source || (artName.toLowerCase().includes('pant') ? 'Dyed Fabric' : 'Greige Fabric'),
          width: initialWidth,
          colorName: fc.colorName || 'Standard',
          colorHex: fc.colorHex || '#94a3b8',
          dyedRate: rawDyed !== '' ? rawDyed : '',
          shrinkPct: shrink,
          bufferPct: buf,
          pcs: finalPcs,
          locked: fc.locked !== undefined ? !!fc.locked : false,
          _userSelectedWidth: Boolean(initialWidth),
          _userEditedDyed: Boolean(rawDyed !== '')
        };
      });
    }

    // Otherwise, generate rows from order.articles and customer orders or default matching Prototype Demo (Kurta, Pant, Dupatta)
    const articles = (order?.articles && order.articles.length > 0)
      ? order.articles
      : (isMockSample ? [
          { name: 'Kurta', fabricQuality: '100/100 Mulmul', width: '44"', shrinkage: 4, bufferPercent: 10, totalPieces: 700, icon: '👘', consumption: 1.5 },
          { name: 'Pant', fabricQuality: '2.40/20s CF', width: '47"', shrinkage: 3.5, bufferPercent: 8, totalPieces: 700, icon: '👖', consumption: 3.0, sourcing: 'Dyed' },
          { name: 'Dupatta', fabricQuality: '60os Cambryc', width: '', shrinkage: 6, bufferPercent: 10, totalPieces: 400, icon: '🎀', consumption: 0.0 }
        ] : []);

    // Colors list from customer orders
    let colors = [];
    if (order?.customerOrders && order.customerOrders.length > 0) {
      order.customerOrders.forEach(c => {
        (c.selectedColors || []).forEach(col => {
          if (!colors.includes(col)) colors.push(col);
        });
      });
    }
    if (colors.length === 0 && Array.isArray(order?.colors) && order.colors.length > 0) {
      colors = [...order.colors];
    }
    if (colors.length === 0) {
      colors = isMockSample ? ['Charcoal', 'Green'] : ['Standard'];
    }

    const colorHexMap = {
      'Charcoal': '#333333',
      'Green': '#228B22',
      'Ivory': '#FFFFF0',
      'Maroon': '#800000',
      'Navy Blue': '#000080',
      'Rust': '#B7410E',
      'Pastel Red': '#FF6961',
      'Rama Green': '#20B2AA',
      'Sea Green': '#2E8B57',
      'Teal': '#008080',
      'Wine': '#722F37',
      'Yellow': '#FFD700',
      'Standard': '#94a3b8'
    };

    const getCustomerPcs = (artName, colName) => {
      let sum = 0;
      if (Array.isArray(order?.customerOrders)) {
        order.customerOrders.forEach(cust => {
          Object.entries(cust.sizeConfigs || {}).forEach(([key, cfg]) => {
            const kLow = key.toLowerCase();
            const aLow = (artName || '').toLowerCase();
            const cLow = (colName || '').toLowerCase();
            if (kLow.includes(aLow) && (cLow === '' || kLow.includes(cLow))) {
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
            }
          });
        });
      }
      return sum;
    };

    const rows = [];
    articles.forEach((art, aIdx) => {
      const artName = art.name || (aIdx === 0 ? 'Kurta' : aIdx === 1 ? 'Pant' : 'Dupatta');
      const fabricsToIterate = (Array.isArray(art.fabrics) && art.fabrics.length > 0)
        ? art.fabrics
        : [{
            fabricQuality: art.fabricQuality || (aIdx === 0 ? '100/100 Mulmul' : aIdx === 1 ? '2.40/20s CF' : '60os Cambryc'),
            role: 'Main',
            width: art.width,
            source: art.sourcing || art.source,
            shrinkage: art.shrinkage,
            consumption: art.consumption
          }];

      fabricsToIterate.forEach((artFab, fIdx) => {
        const fabName = artFab.fabricQuality || artFab.fabricName || artFab.quality || art.fabricQuality || (aIdx === 0 ? '100/100 Mulmul' : aIdx === 1 ? '2.40/20s CF' : '60os Cambryc');
        const role = autoCapitalizeWords(artFab.pieceLabel || artFab.role || (fIdx === 0 ? 'Main' : 'Outer'));
        const source = artFab.source || art.sourcing || (artName.toLowerCase().includes('pant') ? 'Dyed Fabric' : 'Greige Fabric');
        
        const initialWidth = resolveWidth(artFab.width) || '';

        const masterShrink = getFabricMasterShrinkage(fabName);
        const shrinkVal = masterShrink;
        const bufferVal = parseFloat(artFab.bufferPercent || 10);
        const defaultDyed = (artFab.consumption !== undefined && artFab.consumption !== null && artFab.consumption !== '' && artFab.consumption !== 1.5 && artFab.consumption !== '1.5') 
          ? artFab.consumption 
          : (art.consumption !== undefined && art.consumption !== null && art.consumption !== '' && art.consumption !== 1.5 && art.consumption !== '1.5' ? art.consumption : '');

        // Dupatta might only have 1 color in sample
        const artColors = artName.toLowerCase().includes('dupatta') ? [colors[0] || 'Standard'] : colors;

        artColors.forEach((col, cIdx) => {
          const custPcs = getCustomerPcs(artName, col);
          const pcsVal = custPcs > 0 ? custPcs : 0;

          rows.push({
            key: `${artName}_${fabName}_${role}_${col}_${fIdx}_${cIdx}`,
            articleIndex: aIdx,
            articleName: artName,
            articleCode: (artName || '').toUpperCase(),
            articleIcon: art.icon || art.emoji || (artName.toLowerCase().includes('kurta') ? '👘' : artName.toLowerCase().includes('pant') ? '👖' : artName.toLowerCase().includes('dupatta') ? '🎀' : '👕'),
            role: role,
            fabricQuality: fabName,
            source: source,
            width: initialWidth,
            colorName: col,
            colorHex: colorHexMap[col] || '#94a3b8',
            dyedRate: defaultDyed,
            shrinkPct: shrinkVal,
            bufferPct: bufferVal,
            pcs: pcsVal,
            locked: false
          });
        });
      });
    });

    return rows;
  });

  if (!order) return null;

  // Format date helper: returns DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) {
      const now = new Date();
      return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    }
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Customers calculations
  const customerList = useMemo(() => {
    if (order.customerOrders && order.customerOrders.length > 0) return order.customerOrders;
    if (order.customers && order.customers.length > 0) return order.customers;
    return [{ name: 'Customer 1' }, { name: 'Customer 2' }];
  }, [order]);

  const customerCount = customerList.length;

  // Colors calculations
  const { totalColorsCount, uniqueColorsCount } = useMemo(() => {
    let allCols = [];
    (order.customerOrders || []).forEach((c) => {
      if (Array.isArray(c.selectedColors)) {
        allCols.push(...c.selectedColors);
      }
    });
    if (allCols.length === 0) {
      consumptionRows.forEach((fc) => {
        if (fc.colorName && fc.colorName !== 'Standard' && fc.colorName !== '—' && !allCols.includes(fc.colorName)) allCols.push(fc.colorName);
      });
    }
    const unique = new Set(allCols);
    return {
      totalColorsCount: allCols.length,
      uniqueColorsCount: unique.size
    };
  }, [order, consumptionRows]);

  const articlesList = useMemo(() => {
    const list = [];
    const seen = new Set();
    const rawArticles = Array.isArray(order?.articles) && order.articles.length > 0 ? order.articles : [];
    const totalOrderGarments = parseInt(order?.totalGarments, 10) || 0;

    const add = (item) => {
      const name = (item.name || item.articleName || '').trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());

        // 1. Try to compute from fabricConsumptions
        let computedPcs = 0;
        if (Array.isArray(order?.fabricConsumptions) && order.fabricConsumptions.length > 0) {
          const matchingFc = order.fabricConsumptions.filter(
            fc => (fc.articleName || fc.article || '').toLowerCase().trim() === name.toLowerCase()
          );
          if (matchingFc.length > 0) {
            computedPcs = matchingFc.reduce((acc, fc) => acc + (parseInt(fc.pcs || fc.pieces, 10) || 0), 0);
          }
        }

        // 2. Try to compute from customerOrders sizeConfigs
        if (computedPcs <= 0 && Array.isArray(order?.customerOrders)) {
          order.customerOrders.forEach(cust => {
            Object.entries(cust.sizeConfigs || {}).forEach(([key, cfg]) => {
              if (key.toLowerCase().includes(name.toLowerCase()) || (item.id && key.startsWith(`${item.id}_`))) {
                if (Array.isArray(cfg?.seriesConfigs)) {
                  cfg.seriesConfigs.forEach(sc => {
                    Object.values(sc.sizeQtys || {}).forEach(q => {
                      computedPcs += parseInt(q, 10) || 0;
                    });
                  });
                } else if (cfg?.sizeQtys) {
                  Object.values(cfg.sizeQtys || {}).forEach(q => {
                    computedPcs += parseInt(q, 10) || 0;
                  });
                }
              }
            });
          });
        }

        // 3. Fallback: check item.totalPieces vs totalOrderGarments
        let finalPieces = computedPcs;
        const rawPieces = parseInt(item.totalPieces, 10) || 0;
        const artCount = rawArticles.length || 1;

        if (finalPieces <= 0) {
          if (rawPieces > 0 && (rawPieces !== totalOrderGarments || artCount === 1)) {
            finalPieces = rawPieces;
          } else if (totalOrderGarments > 0 && artCount > 1) {
            finalPieces = Math.round(totalOrderGarments / artCount);
          } else if (rawPieces > 0) {
            finalPieces = rawPieces;
          } else {
            finalPieces = totalOrderGarments > 0 ? Math.round(totalOrderGarments / (artCount || 1)) : 0;
          }
        }

        list.push({
          id: item.id || `ART-${seen.size}`,
          name: name,
          fabricQuality: item.fabricQuality || item.fabricName || '',
          fabrics: item.fabrics || [],
          avgGarmentLength: item.avgGarmentLength || item.avgLength || '',
          totalPieces: finalPieces
        });
      }
    };

    if (rawArticles.length > 0) {
      rawArticles.forEach(add);
    }
    if (Array.isArray(order?.fabricConsumptions)) {
      order.fabricConsumptions.forEach(fc => add({ name: fc.articleName || fc.article, fabricQuality: fc.fabricQuality, totalPieces: fc.pcs }));
    }
    if (Array.isArray(consumptionRows)) {
      consumptionRows.forEach(r => add({ name: r.articleName, fabricQuality: r.fabricQuality, totalPieces: r.pcs }));
    }
    if (list.length === 0) {
      add({ name: 'Kurta', fabricQuality: '', avgGarmentLength: '', totalPieces: 0 });
      add({ name: 'Dupatta', fabricQuality: '', avgGarmentLength: '', totalPieces: 0 });
    }
    return list;
  }, [order, consumptionRows]);

  const articlesCount = articlesList.length;
  const totalQty = parseInt(order.totalGarments, 10) || 0;

  const toggleArticleAccordion = (idx) => {
    setExpandedArticles((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleUpdateDyedRate = (idx, val) => {
    const num = parseFloat(val) || 0;
    setConsumptionRows((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], dyedRate: num };
      return updated;
    });
  };

  const handleUpdateWidth = (idx, val) => {
    setConsumptionRows((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], width: val };
      return updated;
    });
  };

  const toggleSourcing = (artIdx, mode) => {
    setArticleSourcing(prev => ({ ...prev, [artIdx]: mode }));
  };

  const handleSaveConsumption = () => {
    const currentScroll = typeof window !== 'undefined' ? window.scrollY : 0;
    const totalDyedCalculated = consumptionRows.reduce((sum, r) => {
      const dyedRate = parseFloat(r.dyedRate) || 0;
      const pcs = parseInt(r.pcs, 10) || 0;
      return sum + (dyedRate * pcs);
    }, 0);
    const totalGreigeCalculated = consumptionRows.reduce((sum, r) => {
      const groupKey = `${r.articleName}___${r.fabricQuality}___${r.role}`;
      const sourcingKey = `${r.articleName}_${r.fabricQuality}`;
      const artSourcing = (articleSourcing[groupKey] || articleSourcing[sourcingKey] || r.source || 'Greige').toLowerCase();
      const isDyed = artSourcing.includes('dyed');
      const dyedRate = parseFloat(r.dyedRate) || 0;
      const masterShrink = getFabricMasterShrinkage(r.fabricQuality);
      const shrink = isDyed ? 0 : masterShrink;
      const greigeRate = isDyed ? dyedRate : (shrink < 100 ? dyedRate * (1 + shrink / 100) : dyedRate);
      const pcs = parseInt(r.pcs, 10) || 0;
      return sum + (greigeRate * pcs);
    }, 0);

    const updatedOrder = {
      ...order,
      fabricConsumptions: consumptionRows,
      totalFabricGreige: parseFloat(totalGreigeCalculated.toFixed(1)) || order.totalFabricGreige || 0,
      totalFabricDyed: parseFloat(totalDyedCalculated.toFixed(1)) || order.totalFabricDyed || 0,
      articleSourcing
    };

    const saved = getStoredData('erp_sales_orders_v1', []);
    const updated = [updatedOrder, ...saved.filter(o => o.id !== updatedOrder.id)];
    setStoredData('erp_sales_orders_v1', updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('erp_sales_order_updated', { detail: updatedOrder }));
    }

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    }

    setIsConsumptionEditing(false);
    setToastMessage('Fabric consumption details saved successfully!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        window.scrollTo({ top: currentScroll, behavior: 'instant' });
      });
    }
  };

  const handleCancelConsumption = () => {
    if (Array.isArray(order?.fabricConsumptions) && order.fabricConsumptions.length > 0) {
      setConsumptionRows([...order.fabricConsumptions]);
    }
    setShowRateCalculation(false);
    setToastMessage('Changes cancelled.');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleToggleArticleSourcing = (artName, mode, fabricQuality, role) => {
    const groupKey = `${artName}___${fabricQuality}___${role || ''}`;
    const fabricKey = `${artName}_${fabricQuality}`;

    setArticleSourcing(prev => {
      const next = { ...prev };
      next[groupKey] = mode;
      next[fabricKey] = mode;
      // Do NOT set [artName]: mode so that different fabrics of the same article (e.g. Kurta Main vs Kurta Outer) stay completely independent
      delete next[artName];
      return next;
    });

    setConsumptionRows(prev => prev.map(r => {
      const matchArt = r.articleName === artName;
      const matchFab = !fabricQuality || r.fabricQuality === fabricQuality;
      const matchRole = !role || !r.role || r.role.toLowerCase() === role.toLowerCase();
      if (matchArt && matchFab && matchRole) {
        return {
          ...r,
          source: mode === 'Dyed' ? 'Dyed Fabric' : 'Greige Fabric'
        };
      }
      return r;
    }));
  };

  const handleUpdateArticleWidth = (artName, newWidth, fabricQuality, role) => {
    setConsumptionRows(prev => prev.map(r => {
      const matchArt = r.articleName === artName;
      const matchFab = !fabricQuality || r.fabricQuality === fabricQuality;
      const matchRole = !role || !r.role || r.role.toLowerCase() === role.toLowerCase();
      if (matchArt && matchFab && matchRole) {
        return { ...r, width: newWidth === '—' ? '' : newWidth, _userSelectedWidth: true };
      }
      return r;
    }));
  };

  // Sourced directly from Fabric Master (Section 3.2 & Order Consumption)
  const getFabricMasterWidths = (fabricQuality, currentWidth) => {
    let allFabrics = masterFabricsList;
    if (!allFabrics || allFabrics.length === 0) {
      try {
        const stored = getStoredData('raindrop_fabrics_v1', null);
        if (Array.isArray(stored)) allFabrics = stored;
      } catch (e) {}
    }
    if (!allFabrics || allFabrics.length === 0) {
      allFabrics = procurementFabrics || [];
    }

    const fqClean = String(fabricQuality || '').toLowerCase().trim();

    // 1. Direct or fuzzy match with Fabric Master
    let matched = allFabrics.find(f => {
      const q = String(f.qualityName || f.quality_name || f.quality || f.name || '').toLowerCase().trim();
      const id = String(f.id || '').toLowerCase().trim();
      return q === fqClean || id === fqClean;
    });

    if (!matched && fqClean) {
      matched = allFabrics.find(f => {
        const q = String(f.qualityName || f.quality_name || f.quality || f.name || '').toLowerCase().trim();
        if (!q) return false;
        return fqClean.includes(q) || q.includes(fqClean);
      });
    }

    if (!matched && fqClean) {
      const keywords = ['mulmul', 'rayon', 'liva', 'cambric', 'cambryc', 'cotton', 'georgette', 'silk', 'modal', 'chanderi'];
      const foundKeyword = keywords.find(k => fqClean.includes(k));
      if (foundKeyword) {
        matched = allFabrics.find(f => {
          const q = String(f.qualityName || f.quality_name || f.quality || f.name || '').toLowerCase();
          return q.includes(foundKeyword);
        });
      }
    }

    let resultWidths = [];
    if (matched) {
      let rawWidths = matched.widths;
      if (typeof rawWidths === 'string') {
        try {
          rawWidths = JSON.parse(rawWidths);
        } catch (e) {
          rawWidths = rawWidths.split(',').map(s => s.trim());
        }
      }
      if (Array.isArray(rawWidths) && rawWidths.length > 0) {
        resultWidths = rawWidths.map(w => {
          const clean = String(w).replace(/&quot;/g, '').replace(/"/g, '').trim();
          return clean ? `${clean}"` : '';
        }).filter(Boolean);
      }
    }

    if (resultWidths.length === 0 && fqClean) {
      const matchNum = fqClean.match(/(\d{2,3})\s*(?:["”]|inch)?/);
      if (matchNum && Number(matchNum[1]) >= 30 && Number(matchNum[1]) <= 120) {
        resultWidths = [`${matchNum[1]}"`];
      }
    }

    if (resultWidths.length === 0) {
      resultWidths = ['44"', '58"'];
    }

    const cleanCurrent = currentWidth && currentWidth !== '—'
      ? (String(currentWidth).includes('"') ? String(currentWidth) : `${currentWidth}"`)
      : null;
    if (cleanCurrent && !resultWidths.includes(cleanCurrent)) {
      resultWidths.push(cleanCurrent);
    }

    return Array.from(new Set(resultWidths));
  };

  const handleUpdateArticleDyedRate = (artName, val, fabricQuality, role) => {
    const num = val === '' ? '' : (parseFloat(val) || 0);
    setConsumptionRows(prev => prev.map(r => {
      const matchArt = r.articleName === artName;
      const matchFab = !fabricQuality || r.fabricQuality === fabricQuality;
      const matchRole = !role || !r.role || r.role.toLowerCase() === role.toLowerCase();
      if (matchArt && matchFab && matchRole) {
        return { ...r, dyedRate: num, _userEditedDyed: true };
      }
      return r;
    }));
  };

  const [showRateCalculation, setShowRateCalculation] = useState(false);
  const [customMarketRates, setCustomMarketRates] = useState({});

  // Group consumption rows by Article + Fabric Quality + Role for layout (Rowspan per article fabric requirement)
  const articleGroups = useMemo(() => {
    const map = new Map();
    consumptionRows.forEach((row, rIdx) => {
      const artName = row.articleName || 'Article';
      const fabQuality = row.fabricQuality || '';
      const role = row.role || '';
      const groupKey = `${artName}___${fabQuality}___${role}`;

      if (!map.has(groupKey)) {
        const sourcingKey = `${artName}_${fabQuality}`;
        // Prioritize independent fabric/role sourcing mode, then row.source, then Greige (DO NOT fall back to artName)
        const sourcingMode = (
          articleSourcing[groupKey] ||
          articleSourcing[sourcingKey] ||
          row.source ||
          'Greige'
        ).toLowerCase().includes('dyed') ? 'Dyed' : 'Greige';

        // Sourced directly from Fabric Master (or genuine industry standard)
        const masterShrink = getFabricMasterShrinkage(fabQuality);
        const shrinkPct = masterShrink;

        map.set(groupKey, {
          key: groupKey,
          articleName: artName,
          articleCode: (row.articleCode || artName).toUpperCase(),
          articleIndex: row.articleIndex !== undefined ? row.articleIndex : map.size,
          icon: row.articleIcon || (artName.toLowerCase().includes('kurta') ? '👘' : artName.toLowerCase().includes('pant') ? '👖' : artName.toLowerCase().includes('dupatta') ? '🎀' : '👕'),
          fabricQuality: fabQuality,
          role: role,
          width: row.width || '',
          sourcing: sourcingMode,
          shrinkPct: shrinkPct,
          dyedRate: row.dyedRate,
          rows: []
        });
      }
      map.get(groupKey).rows.push({ ...row, originalIndex: rIdx });
    });
    return Array.from(map.values());
  }, [consumptionRows, articleSourcing, masterFabricsList]);

  // Group subtotals for bottom summary rows matching Image 4
  const fabricSummaryRows = useMemo(() => {
    const map = new Map();
    consumptionRows.forEach(r => {
      const fabName = r.fabricQuality || 'Fabric';
      const width = r.width && r.width !== '—' ? r.width : '';
      const key = `${fabName}_${width}`;
      const groupKey = `${r.articleName}___${r.fabricQuality}___${r.role}`;
      const sourcingKey = `${r.articleName}_${r.fabricQuality}`;
      const artSourcing = (articleSourcing[groupKey] || articleSourcing[sourcingKey] || r.source || 'Greige').toLowerCase();
      const isDyed = artSourcing.includes('dyed');
      const masterShrink = getFabricMasterShrinkage(fabName);
      const shrink = isDyed ? 0 : masterShrink;
      const dyed = parseFloat(r.dyedRate) || 0;
      const pcs = parseInt(r.pcs, 10) || 0;
      const greigePerPc = dyed > 0 ? (isDyed ? dyed : dyed * (1 + shrink / 100)) : 0;
      const totalDyed = dyed > 0 ? dyed * pcs : 0;
      const totalGreige = greigePerPc > 0 ? greigePerPc * pcs : 0;

      if (!map.has(key)) {
        map.set(key, {
          fabricName: fabName,
          width: width,
          pcs: 0,
          totalDyed: 0,
          totalGreige: 0,
          hasValues: false
        });
      }
      const cur = map.get(key);
      cur.pcs += pcs;
      cur.totalDyed += totalDyed;
      cur.totalGreige += totalGreige;
      if (dyed > 0) cur.hasValues = true;
    });
    return Array.from(map.values());
  }, [consumptionRows, articleSourcing, masterFabricsList]);

  // Section 8 Rate Calculations & Intelligent Recommendation Engine (Calculates across ALL available widths)
  const rateCalculations = useMemo(() => {
    // Group fabricSummaryRows by fabricQuality name
    const fabricsInOrder = new Map();
    fabricSummaryRows.forEach(fs => {
      const fName = fs.fabricName || 'Fabric';
      if (!fabricsInOrder.has(fName)) {
        fabricsInOrder.set(fName, []);
      }
      fabricsInOrder.get(fName).push(fs);
    });

    const results = [];

    fabricsInOrder.forEach((summaryList, fabricName) => {
      const matchingRows = consumptionRows.filter(r => (r.fabricQuality || '').toLowerCase() === fabricName.toLowerCase());
      const isDyed = matchingRows.some(r => {
        const groupKey = `${r.articleName}___${r.fabricQuality}___${r.role}`;
        const sourcingKey = `${r.articleName}_${r.fabricQuality}`;
        return (articleSourcing[groupKey] || articleSourcing[sourcingKey] || r.source || '').toLowerCase().includes('dyed');
      });

      let baseGreigeRate = 145;
      let dyeingCost = 35;
      const fn = fabricName.toLowerCase();
      if (fn.includes('rayon') || fn.includes('liva') || fn.includes('2.40')) {
        baseGreigeRate = 165;
        dyeingCost = 45;
      } else if (fn.includes('silk') || fn.includes('tussar')) {
        baseGreigeRate = 280;
        dyeingCost = 60;
      } else if (fn.includes('cambryc') || fn.includes('cambric')) {
        baseGreigeRate = 125;
        dyeingCost = 35;
      }

      // Identify currently selected width in order for this fabric
      const primarySummary = summaryList[0] || { pcs: 0, totalDyed: 0, totalGreige: 0, width: '58"' };
      const currentSelectedWidth = primarySummary.width || '58"';
      const currentBaseMetres = isDyed ? primarySummary.totalDyed : primarySummary.totalGreige;
      const pcs = primarySummary.pcs || 0;

      // Fetch ALL available widths for this fabric quality from Fabric Master
      const allWidths = getFabricMasterWidths(fabricName, currentSelectedWidth);
      const currentWidthInches = parseFloat(String(currentSelectedWidth).replace(/"/g, '')) || 58;

      allWidths.forEach(w => {
        const isSelected = w === currentSelectedWidth;
        const targetWidthInches = parseFloat(String(w).replace(/"/g, '')) || 44;

        // In marker nesting & cutting, metres needed is inversely proportional to width:
        // totalMetres = baseMetres * (currentWidthInches / targetWidthInches)
        let totalMetres = currentBaseMetres;
        if (!isSelected && targetWidthInches > 0 && currentWidthInches > 0) {
          totalMetres = currentBaseMetres * (currentWidthInches / targetWidthInches);
        }

        // Market rate adjustments: wider widths have higher linear rate per metre
        let widthRateAdj = 0;
        if (targetWidthInches >= 56) {
          widthRateAdj = 15;
        } else if (targetWidthInches <= 44) {
          widthRateAdj = -5;
        }

        const defaultRate = isDyed
          ? (baseGreigeRate + dyeingCost + 15 + widthRateAdj)
          : (baseGreigeRate + dyeingCost + widthRateAdj);

        const rateKey = `${fabricName}_${w}`;
        const userTypedRate = customMarketRates[rateKey];
        const hasCustomRate = userTypedRate !== undefined && userTypedRate !== '';
        const effectiveRate = hasCustomRate ? (parseFloat(userTypedRate) || 0) : defaultRate;

        const totalCost = totalMetres * effectiveRate;
        const costPerGarment = pcs > 0 ? totalCost / pcs : 0;

        results.push({
          fabricName,
          width: w,
          isSelected,
          isDyed,
          rateKey,
          defaultCalculatedRate: defaultRate,
          ratePerMetre: effectiveRate,
          totalMetres,
          totalCost,
          costPerGarment,
          pcs
        });
      });
    });

    return results;
  }, [fabricSummaryRows, consumptionRows, articleSourcing, masterFabricsList, customMarketRates]);

  const rateTotals = useMemo(() => {
    // Totals for the currently SELECTED widths in the order
    const selectedRows = rateCalculations.filter(r => r.isSelected);
    const activeRows = selectedRows.length > 0 ? selectedRows : rateCalculations;

    const totalCost = activeRows.reduce((sum, r) => sum + r.totalCost, 0);
    const totalMetres = activeRows.reduce((sum, r) => sum + r.totalMetres, 0);
    const totalPcs = activeRows.reduce((sum, r) => sum + r.pcs, 0);
    
    const hasMultipleWidths = rateCalculations.length > activeRows.length;
    let rec = "Greige sourcing path with in-house processing saves ~8.4% margin across standard widths. Optimal marker efficiency achieved with minimal cut wastage.";
    
    if (hasMultipleWidths) {
      rec = "All available widths calculated: Wider widths (e.g. 58\") provide ~12-18% marker nesting efficiency over narrower widths (44\"), reducing total cut metres and lowering overall fabric cost per garment.";
    }

    return { totalCost, totalMetres, totalPcs, recommendation: rec };
  }, [rateCalculations]);

  const handleConfirmOrder = () => {
    setConfirmed(true);
    const updatedOrder = {
      ...order,
      status: 'Confirmed',
      stage: 'Confirmed'
    };
    const saved = getStoredData('erp_sales_orders_v1', []);
    const updated = [updatedOrder, ...saved.filter(o => o.id !== updatedOrder.id)];
    setStoredData('erp_sales_orders_v1', updated);

    // Dispatch real-time synchronization events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('erp_sales_order_updated', { detail: updatedOrder }));
    }

    if (onTriggerProcurement) {
      onTriggerProcurement('Confirm Order', updatedOrder);
    }
    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    }

    setToastMessage(`Order #${order.id} confirmed successfully!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleUploadPhoto = (e) => {
    e.preventDefault();
    if (!photoCaption.trim()) {
      setToastMessage('Please enter an optional caption or description for the photo');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    const newP = {
      id: Date.now(),
      type: photoType,
      caption: photoCaption,
      fileName: photoFileName || 'uploaded_image.jpg',
      date: new Date().toLocaleDateString()
    };
    setPhotos(prev => [...prev, newP]);
    setPhotoCaption('');
    setPhotoFileName('');
  };

  // Group subtotals per fabric quality + width (Demo 5 specification)
  const fabricGroups = useMemo(() => {
    const map = {};
    consumptionRows.forEach(row => {
      const widthStr = row.width || '44"';
      const gk = `${row.fabricQuality} (${widthStr})`;
      if (!map[gk]) {
        map[gk] = { pcs: 0, dyed: 0, greige: 0, orderQty: 0 };
      }
      const isGreige = (row.source || 'Greige Fabric').toLowerCase().includes('greige');
      const rawShrink = (row.shrinkPct !== undefined && row.shrinkPct !== null && row.shrinkPct !== '') ? String(row.shrinkPct).replace('%', '').trim() : '';
      const shrinkVal = (!isNaN(parseFloat(rawShrink)) && isFinite(parseFloat(rawShrink))) ? parseFloat(rawShrink) : 0;
      const shrinkPct = isGreige ? shrinkVal : 0;
      const rawBuffer = (row.bufferPct !== undefined && row.bufferPct !== null && row.bufferPct !== '') ? String(row.bufferPct).replace('%', '').trim() : '';
      const bufferPct = (!isNaN(parseFloat(rawBuffer)) && isFinite(parseFloat(rawBuffer))) ? parseFloat(rawBuffer) : 10;
      const dyed = parseFloat(row.dyedRate) || 0;
      const hasDyed = dyed > 0;
      const greigePerPc = hasDyed ? (isGreige ? dyed * (1 + shrinkPct / 100) : dyed) : 0;
      const totalDyed = hasDyed ? dyed * row.pcs : 0;
      const totalGreige = greigePerPc * row.pcs;
      const orderQty = totalGreige * (1 + bufferPct / 100);

      map[gk].pcs += row.pcs;
      map[gk].dyed += totalDyed;
      map[gk].greige += totalGreige;
      map[gk].orderQty += orderQty;
    });
    return map;
  }, [consumptionRows]);

  const toggleRowLock = (rIdx) => {
    setConsumptionRows(prev => {
      const updated = [...prev];
      updated[rIdx] = { ...updated[rIdx], locked: !updated[rIdx].locked };
      return updated;
    });
  };

  const handleRowOrderFabric = (row, orderQty) => {
    if (!orderQty || orderQty <= 0) {
      setToastMessage('Enter a Dyed (m/pc) value for this row first, so there is a quantity to order');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    handleSaveConsumption();
    if (onTriggerProcurement) {
      onTriggerProcurement('Create PO', {
        ...order,
        targetFabric: row.fabricQuality,
        targetWidth: row.width,
        targetColor: row.colorName,
        targetOrderQty: orderQty
      });
    } else {
      setToastMessage(`Purchase order queued for ${orderQty.toFixed(1)}m of ${row.fabricQuality} (${row.width})`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <div className="p-3 p-md-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', color: '#1e293b' }}>
      {/* Toast Feedback */}
      {showToast && (
        <div
          className="position-fixed bottom-0 end-0 m-4 p-3 rounded-3 shadow-lg text-white d-flex align-items-center gap-2"
          style={{ backgroundColor: '#10b981', zIndex: 9999, transition: 'all 0.3s ease' }}
        >
          <i className="ti ti-check" style={{ fontSize: '18px', lineHeight: 1 }}></i>
          <span className="fw-medium">{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
       * 1. TOP HEADER (Style Name, Status Badge, Order Number, Order Date)
       * ========================================================================= */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div className="d-flex align-items-start gap-3">
          <button
            type="button"
            className="btn btn-white border rounded-3 d-flex align-items-center justify-content-center shadow-xs text-secondary mt-1"
            onClick={onBack}
            title="Back to Orders List"
            style={{ width: '40px', height: '40px', backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: '18px', lineHeight: 1 }}></i>
          </button>
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h3 className="fw-bold text-dark mb-0" style={{ fontSize: '24px' }}>
                {autoCapitalizeWords(order.styleName || 'Kurta')}
              </h3>
              <span
                className="badge border bg-light text-secondary rounded-2 px-2.5 py-1 fw-medium d-inline-flex align-items-center gap-1.5"
                style={{ fontSize: '12px', borderColor: '#e2e8f0' }}
              >
                <i className={confirmed ? 'ti ti-check text-success' : 'ti ti-file-text text-muted'} style={{ fontSize: '13px', lineHeight: 1 }}></i>
                {confirmed ? 'Confirmed' : (order.status || 'Draft')}
              </span>
            </div>
            <div className="d-flex align-items-center gap-3 text-muted small mt-1">
              <span className="d-flex align-items-center gap-1.5 font-monospace">
                <i className="ti ti-hash" style={{ fontSize: '14px', lineHeight: 1 }}></i> {order.id || 'RD-2610-0002'}
              </span>
              <span className="d-flex align-items-center gap-1.5">
                <i className="ti ti-calendar" style={{ fontSize: '14px', lineHeight: 1 }}></i> {formatDate(order.orderDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Action Buttons & Menu */}
        <div className="d-flex align-items-center gap-2">
          {onEditSection && (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3 fw-semibold shadow-xs"
              onClick={() => onEditSection('all')}
              title="Edit order details, styles, and customer quantities"
            >
              <i className="ti ti-edit fs-14"></i>
              <span>{order?.status === 'Draft' ? 'Edit Draft Order' : 'Edit Order'}</span>
            </button>
          )}

          {/* Header Right Action Menu (3 Dots) */}
          <div className="dropdown">
            <button
              type="button"
              className="btn btn-link text-secondary p-1 text-decoration-none d-flex align-items-center justify-content-center"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ border: 'none', width: '36px', height: '36px' }}
            >
              <i className="ti ti-dots-vertical" style={{ fontSize: '20px', lineHeight: 1 }}></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
              {onEditSection && (
                <li>
                  <button
                    type="button"
                    className="dropdown-item py-2 d-flex align-items-center gap-2"
                    onClick={() => onEditSection('all')}
                  >
                    <i className="ti ti-edit text-primary" style={{ fontSize: '16px', lineHeight: 1 }}></i> Edit Order
                  </button>
                </li>
              )}
              <li>
                <button
                  type="button"
                  className="dropdown-item py-2 d-flex align-items-center gap-2"
                  onClick={handleConfirmOrder}
                >
                  <i className="ti ti-circle-check text-success" style={{ fontSize: '16px', lineHeight: 1 }}></i> Confirm Order
                </button>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button
                  type="button"
                  className="dropdown-item py-2 d-flex align-items-center gap-2 text-secondary"
                  onClick={() => window.print()}
                >
                  <i className="ti ti-printer" style={{ fontSize: '16px', lineHeight: 1 }}></i> Print Order
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Draft Order Notice Banner */}
      {order?.status === 'Draft' && (
        <div className="alert border-0 shadow-xs rounded-4 p-3 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7' }}>
          <div className="d-flex align-items-center gap-2.5">
            <div className="p-2 rounded-3 text-warning bg-white shadow-xs d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
              <i className="ti ti-file-text fs-5"></i>
            </div>
            <div>
              <div className="fw-bold text-dark fs-14">This Sales Order is currently saved as a Draft</div>
              <div className="text-muted small" style={{ fontSize: '12px' }}>
                You can edit style info, configure articles, size matrices, and customer breakdowns to proceed to the next step.
              </div>
            </div>
          </div>
          {onEditSection && (
            <button
              type="button"
              className="btn text-white btn-sm px-3 py-2 rounded-3 fw-semibold shadow-sm d-inline-flex align-items-center gap-1.5"
              style={{ backgroundColor: '#2e37a4', borderColor: '#2e37a4' }}
              onClick={() => onEditSection('all')}
            >
              <i className="ti ti-edit"></i>
              <span>Continue Editing Draft</span>
              <i className="ti ti-arrow-right"></i>
            </button>
          )}
        </div>
      )}

      {/* =========================================================================
       * 2. FIVE KPI METRIC CARDS (Customers, Total Colors, Unique Colors, Articles, Total Qty)
       * ========================================================================= */}
      <div className="row g-3 mb-4">
        {/* Card 1: Customers */}
        <div className="col-12 col-sm-6 col-lg">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-row align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
              style={{ width: '44px', height: '44px', background: '#10b981', borderRadius: '10px' }}
            >
              <i className="ti ti-users" style={{ fontSize: '22px', lineHeight: 1 }}></i>
            </div>
            <div>
              <div className="text-muted small fw-medium" style={{ fontSize: '13px' }}>Customers</div>
              <div className="fs-3 fw-bold text-dark lh-1 mt-1">{customerCount}</div>
            </div>
          </div>
        </div>

        {/* Card 2: Total Colors */}
        <div className="col-12 col-sm-6 col-lg">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-row align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
              style={{ width: '44px', height: '44px', background: '#c026d3', borderRadius: '10px' }}
            >
              <i className="ti ti-palette" style={{ fontSize: '22px', lineHeight: 1 }}></i>
            </div>
            <div>
              <div className="text-muted small fw-medium" style={{ fontSize: '13px' }}>Total Colors</div>
              <div className="fs-3 fw-bold text-dark lh-1 mt-1">{totalColorsCount}</div>
            </div>
          </div>
        </div>

        {/* Card 3: Unique Colors */}
        <div className="col-12 col-sm-6 col-lg">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-row align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
              style={{ width: '44px', height: '44px', background: '#e11d48', borderRadius: '10px' }}
            >
              <i className="ti ti-color-swatch" style={{ fontSize: '22px', lineHeight: 1 }}></i>
            </div>
            <div>
              <div className="text-muted small fw-medium" style={{ fontSize: '13px' }}>Unique Colors</div>
              <div className="fs-3 fw-bold text-dark lh-1 mt-1">{uniqueColorsCount}</div>
            </div>
          </div>
        </div>

        {/* Card 4: Articles */}
        <div className="col-12 col-sm-6 col-lg">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-row align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
              style={{ width: '44px', height: '44px', background: '#4f46e5', borderRadius: '10px' }}
            >
              <i className="ti ti-shirt" style={{ fontSize: '22px', lineHeight: 1 }}></i>
            </div>
            <div>
              <div className="text-muted small fw-medium" style={{ fontSize: '13px' }}>Articles</div>
              <div className="fs-3 fw-bold text-dark lh-1 mt-1">{articlesCount}</div>
            </div>
          </div>
        </div>

        {/* Card 5: Total Qty */}
        <div className="col-12 col-sm-6 col-lg">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-row align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
              style={{ width: '44px', height: '44px', background: '#0284c7', borderRadius: '10px' }}
            >
              <i className="ti ti-box" style={{ fontSize: '22px', lineHeight: 1 }}></i>
            </div>
            <div>
              <div className="text-muted small fw-medium" style={{ fontSize: '13px' }}>Total Qty</div>
              <div className="fs-3 fw-bold text-dark lh-1 mt-1">{totalQty}</div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
       * 3. PRODUCTION PROGRESS CARD
       * ========================================================================= */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center gap-2.5 mb-4">
          <div
            className="rounded-2 d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
            style={{ width: '36px', height: '36px', backgroundColor: '#4f46e5', borderRadius: '8px' }}
          >
            <i className="ti ti-activity" style={{ fontSize: '18px', lineHeight: 1 }}></i>
          </div>
          <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '16px' }}>Production Progress</h6>
        </div>

        {/* Stepper Pipeline Timeline (11 Connected Steps) */}
        <div className="d-flex align-items-center overflow-auto py-2 px-1">
          {[
            { icon: 'ti ti-shopping-bag', title: 'Sales Order', active: true },
            { icon: 'ti ti-chart-line', title: 'Order Confirmation', active: confirmed },
            { icon: 'ti ti-truck', title: 'Procurement' },
            { icon: 'ti ti-palette', title: 'Processing' },
            { icon: 'ti ti-cut', title: 'Cutting' },
            { icon: 'ti ti-building-factory-2', title: 'After-Cut' },
            { icon: 'ti ti-sparkles', title: 'Stitching' },
            { icon: 'ti ti-sparkles', title: 'Finishing' },
            { icon: 'ti ti-clipboard-check', title: 'QC' },
            { icon: 'ti ti-box', title: 'Packing' },
            { icon: 'ti ti-truck-delivery', title: 'Dispatch' }
          ].map((step, sIdx, arr) => (
            <React.Fragment key={sIdx}>
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0 transition"
                title={step.title}
                style={{
                  width: '38px',
                  height: '38px',
                  backgroundColor: step.active ? '#eef2ff' : '#f8fafc',
                  border: step.active ? '1.5px solid #6366f1' : '1px solid #e2e8f0',
                  color: step.active ? '#4f46e5' : '#94a3b8'
                }}
              >
                <i className={step.icon} style={{ fontSize: '18px', lineHeight: 1 }}></i>
              </div>
              {sIdx < arr.length - 1 && (
                <div
                  className="flex-grow-1"
                  style={{
                    height: '2px',
                    minWidth: '24px',
                    backgroundColor: step.active && arr[sIdx + 1]?.active ? '#6366f1' : '#e2e8f0'
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* =========================================================================
       * 4. NEXT STEPS CARD (1) - Clean, proportional & theme aligned
       * ========================================================================= */}
      <div
        className="card border-0 shadow-sm rounded-4 bg-white"
        style={{
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '24px',
          borderRadius: '14px',
          backgroundColor: '#ffffff'
        }}
      >
        <div className="d-flex align-items-center" style={{ gap: '14px', marginBottom: '18px' }}>
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
            style={{ width: '38px', height: '38px', minWidth: '38px', backgroundColor: '#8b5cf6', borderRadius: '10px' }}
          >
            <i className="ti ti-arrow-right" style={{ fontSize: '18px', lineHeight: 1 }}></i>
          </div>
          <h6 className="fw-bold text-dark mb-0 d-flex align-items-center" style={{ fontSize: '16px', gap: '8px' }}>
            Next Steps
            <span
              className="badge rounded-pill fw-bold px-2 py-0.5"
              style={{ backgroundColor: '#f3e8ff', color: '#7c3aed', fontSize: '11px' }}
            >
              {confirmed ? '0' : '1'}
            </span>
          </h6>
        </div>

        {confirmed ? (
          <div
            className="rounded-3 d-flex justify-content-between align-items-center"
            style={{
              padding: '16px 20px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px'
            }}
          >
            <div className="d-flex align-items-center" style={{ gap: '14px' }}>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
                style={{ width: '36px', height: '36px', minWidth: '36px', backgroundColor: '#10b981' }}
              >
                <i className="ti ti-check" style={{ fontSize: '18px', lineHeight: 1 }}></i>
              </div>
              <div>
                <h6 className="fw-bold text-dark mb-0.5" style={{ fontSize: '14px' }}>
                  Order Confirmed
                </h6>
                <p className="text-muted small mb-0" style={{ fontSize: '12px' }}>
                  Order has been confirmed and queued for production pipeline.
                </p>
              </div>
            </div>
            <span className="badge rounded-pill fw-semibold px-2.5 py-1" style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '11.5px' }}>
              Confirmed
            </span>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={handleConfirmOrder}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleConfirmOrder();
              }
            }}
            className="rounded-3 d-flex justify-content-between align-items-center transition cursor-pointer shadow-xs"
            style={{
              padding: '16px 20px',
              backgroundColor: '#f8fafd',
              border: '1.5px solid #e0e7ff',
              borderRadius: '10px'
            }}
          >
            <div className="d-flex align-items-center" style={{ gap: '14px' }}>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
                style={{ width: '36px', height: '36px', minWidth: '36px', backgroundColor: '#2e37a4' }}
              >
                <i className="ti ti-circle-check" style={{ fontSize: '18px', lineHeight: 1 }}></i>
              </div>
              <div>
                <h6 className="fw-bold text-dark mb-0.5" style={{ fontSize: '14px' }}>
                  Confirm Order
                </h6>
                <p className="text-muted small mb-0" style={{ fontSize: '12px' }}>
                  Review order details and confirm to start processing.
                </p>
              </div>
            </div>
            <i className="ti ti-arrow-right" style={{ color: '#2e37a4', fontSize: '16px' }}></i>
          </div>
        )}
      </div>

      {/* =========================================================================
       * 5. ORDER INFORMATION CARD
       * ========================================================================= */}
      <div
        className="card border-0 shadow-sm rounded-4 bg-white"
        style={{
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '24px',
          borderRadius: '14px',
          backgroundColor: '#ffffff'
        }}
      >
        <div className="d-flex align-items-center" style={{ gap: '14px', marginBottom: '20px' }}>
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
            style={{ width: '38px', height: '38px', minWidth: '38px', backgroundColor: '#2e37a4', borderRadius: '10px' }}
          >
            <i className="ti ti-tag" style={{ fontSize: '18px', lineHeight: 1 }}></i>
          </div>
          <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '16px' }}>Order Information</h6>
        </div>

        <div className="row g-3">
          <div className="col-12 col-sm-6 col-md-3">
            <div className="rounded-3 bg-light d-flex align-items-center border" style={{ padding: '14px 18px', gap: '14px', borderColor: '#f1f5f9', borderRadius: '10px' }}>
              <i className="ti ti-calendar text-secondary" style={{ fontSize: '22px', lineHeight: 1 }}></i>
              <div>
                <span className="text-muted small d-block" style={{ fontSize: '12px' }}>Order Date</span>
                <span className="fw-bold text-dark" style={{ fontSize: '14.5px' }}>{formatDate(order.orderDate)}</span>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-3">
            <div className="rounded-3 bg-light d-flex align-items-center border" style={{ padding: '14px 18px', gap: '14px', borderColor: '#f1f5f9', borderRadius: '10px' }}>
              <span className="fw-bold text-secondary" style={{ fontSize: '22px', lineHeight: 1 }}>#</span>
              <div>
                <span className="text-muted small d-block" style={{ fontSize: '12px' }}>Order Number</span>
                <span className="fw-bold text-dark font-monospace" style={{ fontSize: '14.5px' }}>{order.id || 'RD-2610-0002'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
       * 6. ARTICLES (N) CARD
       * ========================================================================= */}
      <div
        className="card border-0 shadow-sm rounded-4 bg-white"
        style={{
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '24px',
          borderRadius: '14px',
          backgroundColor: '#ffffff'
        }}
      >
        <div className="d-flex align-items-center" style={{ gap: '14px', marginBottom: '20px' }}>
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
            style={{ width: '38px', height: '38px', minWidth: '38px', backgroundColor: '#3b82f6', borderRadius: '10px' }}
          >
            <i className="ti ti-shirt" style={{ fontSize: '18px', lineHeight: 1 }}></i>
          </div>
          <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '16px' }}>
            Articles ({articlesCount})
          </h6>
        </div>

        {articlesList.map((art, aIdx) => {
          const isExpanded = !!expandedArticles[aIdx];
          const isBottom = /pant|plazo|palazzo|pajama|salwar|bottom|trouser/i.test(art.name || '');
          const artIcon = art.icon || (isBottom ? '👖' : '👕');
          const hasFabric = Boolean(art.fabricQuality && art.fabricQuality.trim() !== '');
          const hasLength = Boolean(art.avgGarmentLength && String(art.avgGarmentLength).trim() !== '' && !isNaN(parseFloat(art.avgGarmentLength)));

          return (
            <div key={aIdx} className="border rounded-4 overflow-hidden mb-3" style={{ borderColor: '#e2e8f0' }}>
              {/* Accordion Header */}
              <div
                className="p-3 d-flex justify-content-between align-items-center cursor-pointer"
                style={{ backgroundColor: '#f8fafd' }}
                onClick={() => toggleArticleAccordion(aIdx)}
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
                    style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)', borderRadius: '10px' }}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{artIcon}</span>
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '15px' }}>{art.name || 'Article'}</h6>
                    <span className="text-muted small" style={{ fontSize: '12px' }}>{art.name || 'Article'}</span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="text-end">
                    <span className="text-muted small d-flex align-items-center gap-1.5 justify-content-end" style={{ fontSize: '12px' }}>
                      <i className="ti ti-box" style={{ fontSize: '14px', lineHeight: 1 }}></i> Quantity
                    </span>
                    <span className="fw-bold" style={{ color: '#2563eb', fontSize: '15px' }}>
                      {art.totalPieces || order?.totalGarments || 0} pcs
                    </span>
                  </div>
                  <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'} text-muted`} style={{ fontSize: '18px', lineHeight: 1 }}></i>
                </div>
              </div>

              {/* Accordion Expanded Body */}
              {isExpanded && (
                <div className="p-3 bg-white">
                  {/* Fabric Banner — Loop through all fabrics configured for this article */}
                  {(() => {
                    const fabricsToShow = (Array.isArray(art.fabrics) && art.fabrics.length > 0)
                      ? art.fabrics
                      : (art.fabricQuality ? [{ fabricQuality: art.fabricQuality, role: 'Main' }] : []);

                    if (fabricsToShow.length === 0) return null;

                    return fabricsToShow.map((fb, fbIdx) => {
                      const fQuality = fb.fabricQuality || fb.fabricName || fb.quality || art.fabricQuality;
                      if (!fQuality) return null;
                      return (
                        <div
                          key={fbIdx}
                          className="p-2.5 px-3 rounded-3 d-flex align-items-center gap-2 mb-2"
                          style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}
                        >
                          <span className="text-warning fs-5">🥞</span>
                          <span className="text-secondary small fw-medium">
                            Fabric: <strong className="text-dark">{fQuality}</strong>
                            {fb.role && (
                              <span className="badge bg-light text-secondary border ms-2">
                                {autoCapitalizeWords(fb.role)}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    });
                  })()}

                  {/* Avg Length Bar — Only show if user actually entered avg length */}
                  {hasLength ? (
                    <div
                      className="p-2.5 px-3 rounded-3 d-flex justify-content-between align-items-center border"
                      style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-secondary small fw-medium">
                          # Avg. Length:
                        </span>
                        {editingLengthIdx === aIdx ? (
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              className="form-control form-control-sm"
                              style={{ width: '90px' }}
                              value={tempLengthVal}
                              onChange={(e) => setTempLengthVal(e.target.value)}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="btn btn-sm text-white py-0 px-2 rounded-2"
                              style={{ backgroundColor: '#2e37a4' }}
                              onClick={() => {
                                art.avgGarmentLength = tempLengthVal;
                                setEditingLengthIdx(null);
                              }}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <strong className="text-dark small">
                            {parseFloat(art.avgGarmentLength).toFixed(2)} inches
                          </strong>
                        )}
                      </div>

                      {editingLengthIdx !== aIdx && (
                        <button
                          type="button"
                          className="btn btn-link text-primary p-0 text-decoration-none"
                          onClick={() => {
                            setTempLengthVal(art.avgGarmentLength);
                            setEditingLengthIdx(aIdx);
                          }}
                          title="Edit Avg Length"
                        >
                          <i className="ti ti-edit" style={{ fontSize: '16px', lineHeight: 1 }}></i>
                        </button>
                      )}
                    </div>
                  ) : null}

                  {/* Empty state if neither fabric nor avg length is configured */}
                  {!hasFabric && !hasLength && (
                    <div className="text-muted small py-1.5 px-2 fst-italic">
                      No fabric or average length specified for this article.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* =========================================================================
       * 7. PRODUCTION PIPELINE CARD
       * ========================================================================= */}
      <div
        className="card border-0 shadow-sm rounded-4 bg-white"
        style={{
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '24px',
          borderRadius: '14px',
          backgroundColor: '#ffffff'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '16px' }}>Production Pipeline</h6>
          <p className="text-muted small mb-0">
            Current stage: 1/11 &bull; Cut pieces: 0 &bull; Garments: 0 &bull; QC passed: 0 &bull; Dispatched: 0
          </p>
        </div>

        <div className="border rounded-4 overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
          {[
            { stage: 'Stage 3 · Procurement', icon: 'ti ti-shopping-cart', btn: '+ New PO', action: 'Create PO' },
            { stage: 'Stage 4 · Processing', icon: 'ti ti-ticket', btn: '+ New Processing PO', action: 'Send to Process' },
            { stage: 'Stage 5 · Cutting', icon: 'ti ti-cut', btn: '+ New Cutting PO', action: 'Cutting PO' },
            { stage: 'Stage 6 · After-Cut', icon: 'ti ti-shirt', btn: '+ New Embroidery PO', action: 'Embroidery PO' },
            { stage: 'Stage 7 · Stitching', icon: 'ti ti-needle-thread', btn: '+ New Stitching Job', action: 'Stitching Job' },
            { stage: 'Stage 9 · Finishing', icon: 'ti ti-box', btn: '+ New Finishing Batch', action: 'Finishing Batch' },
            { stage: 'Stage 10 · QC', icon: 'ti ti-shield-check', btn: '+ New QC Batch', action: 'QC Batch' },
            { stage: 'Stage 11 · Dispatch', icon: 'ti ti-truck-delivery', btn: '+ New Dispatch', action: 'Dispatch' }
          ].map((item, idx, arr) => (
            <div
              key={idx}
              className="p-3 d-flex justify-content-between align-items-center bg-white transition hover-light"
              style={{ borderBottom: idx < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center text-muted bg-light flex-shrink-0"
                  style={{ width: '38px', height: '38px', border: '1px solid #e2e8f0', color: '#64748b' }}
                >
                  <i className={item.icon} style={{ fontSize: '18px', lineHeight: 1 }}></i>
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '14px' }}>{item.stage}</h6>
                  <span className="text-muted small" style={{ fontSize: '12px' }}>No records yet</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm rounded-3 fw-semibold px-3 transition"
                style={{
                  border: '1px solid #c7d2fe',
                  color: '#4f46e5',
                  backgroundColor: '#ffffff'
                }}
                onClick={() => {
                  if (item.action === 'Create PO') {
                    if (onNavigateToProcurement) {
                      onNavigateToProcurement('/procurement-pos', order);
                    } else if (onTriggerProcurement) {
                      onTriggerProcurement('Create PO', order);
                    }
                  } else if (item.action === 'Send to Process') {
                    if (onNavigateToProcurement) {
                      onNavigateToProcurement('/process-po', order);
                    }
                  } else if (item.action === 'QC Batch') {
                    if (onNavigateToProcurement) {
                      onNavigateToProcurement('/quality-batches', order);
                    } else if (onTriggerProcurement) {
                      onTriggerProcurement('QC Batch', order);
                    }
                  } else {
                    setToastMessage(`${item.stage} is under development`);
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                  }
                }}
              >
                {item.btn}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
       * 8. PHOTOS (N) CARD
       * ========================================================================= */}
      <div
        className="card border-0 shadow-sm rounded-4 bg-white"
        style={{
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '24px',
          borderRadius: '14px',
          backgroundColor: '#ffffff'
        }}
      >
        <div className="d-flex align-items-center" style={{ gap: '14px', marginBottom: '20px' }}>
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
            style={{ width: '38px', height: '38px', minWidth: '38px', backgroundColor: '#6366f1', borderRadius: '10px' }}
          >
            <i className="ti ti-camera" style={{ fontSize: '18px', lineHeight: 1 }}></i>
          </div>
          <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '16px' }}>Photos ({photos.length})</h6>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUploadPhoto} className="row g-2 align-items-end mb-4">
          <div className="col-12 col-sm-3 col-md-2">
            <label className="form-label small text-muted mb-1">Type</label>
            <select
              className="form-select form-select-sm rounded-3"
              value={photoType}
              onChange={(e) => setPhotoType(e.target.value)}
            >
              <option value="Reference">Reference</option>
              <option value="Fabric Swatch">Fabric Swatch</option>
              <option value="Sample">Sample</option>
              <option value="QC Defect">QC Defect</option>
            </select>
          </div>
          <div className="col-12 col-sm-4 col-md-5">
            <label className="form-label small text-muted mb-1">Caption</label>
            <input
              type="text"
              className="form-control form-control-sm rounded-3"
              placeholder="Optional description"
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
            />
          </div>
          <div className="col-12 col-sm-3 col-md-3">
            <label className="form-label small text-muted mb-1">File</label>
            <input
              type="file"
              className="form-control form-control-sm rounded-3"
              onChange={(e) => setPhotoFileName(e.target.files?.[0]?.name || '')}
            />
          </div>
          <div className="col-12 col-sm-2 col-md-2">
            <button
              type="submit"
              className="btn btn-sm text-white w-100 rounded-3 fw-semibold shadow-xs"
              style={{ backgroundColor: '#6366f1', height: '31px' }}
            >
              <i className="ti ti-upload me-1" style={{ fontSize: '14px', lineHeight: 1 }}></i> Upload
            </button>
          </div>
        </form>

        {/* Photos Empty State */}
        {photos.length === 0 ? (
          <div className="p-4 text-center rounded-3 bg-light border" style={{ borderColor: '#f1f5f9' }}>
            <div className="text-muted mb-2">
              <i className="ti ti-photo text-secondary opacity-50" style={{ fontSize: '38px', lineHeight: 1 }}></i>
            </div>
            <p className="text-muted small mb-0">
              No photos yet. Upload reference images, fabric swatches, samples, or QC defect evidence.
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {photos.map((p) => (
              <div key={p.id} className="col-md-4">
                <div className="card border p-3 rounded-3 bg-light">
                  <div className="badge bg-secondary mb-1 w-auto align-self-start">{p.type}</div>
                  <strong className="text-dark small">{p.caption}</strong>
                  <span className="text-muted small mt-1">{p.date} &bull; {p.fileName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
       * 9. ACTIVITY LOG (1) CARD
       * ========================================================================= */}
      <div
        className="card border-0 shadow-sm rounded-4 bg-white"
        style={{
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '24px',
          borderRadius: '14px',
          backgroundColor: '#ffffff'
        }}
      >
        <div className="d-flex align-items-center" style={{ gap: '14px', marginBottom: '20px' }}>
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
            style={{ width: '38px', height: '38px', minWidth: '38px', backgroundColor: '#3b82f6', borderRadius: '10px' }}
          >
            <i className="ti ti-history" style={{ fontSize: '18px', lineHeight: 1 }}></i>
          </div>
          <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '16px' }}>Activity Log (1)</h6>
        </div>

        <div className="p-3 rounded-3 bg-light border" style={{ borderColor: '#f1f5f9' }}>
          <div className="d-flex align-items-start gap-2.5">
            <span
              className="badge px-2 py-1 rounded-2 fw-bold text-uppercase flex-shrink-0"
              style={{ backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '11px' }}
            >
              CREATED
            </span>
            <div>
              <div className="fw-semibold text-dark" style={{ fontSize: '14px' }}>
                Order {order.id || 'RD-2610-0002'} created ({autoCapitalizeWords(order.styleName || 'Kurta')})
              </div>
              <div className="text-muted small" style={{ fontSize: '12px' }}>
                {formatDate(order.orderDate)} &bull; order
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
       * 6. FABRIC COLOUR & CONSUMPTION CARD (Matching Image 3 & Image 4 Specifications)
       * ========================================================================= */}
      <div
        className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden"
        style={{
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
          borderRadius: '16px'
        }}
      >
        {/* Card Header (Rain Drop ERP Theme) */}
        <div
          className="d-flex align-items-center gap-3 p-3 px-4 bg-white"
          style={{ borderBottom: '1px solid #f1f5f9' }}
        >
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-primary shadow-xs"
            style={{
              width: '40px',
              height: '40px',
              minWidth: '40px',
              backgroundColor: '#eef2ff',
              borderRadius: '10px'
            }}
          >
            <i className="ti ti-scissors fs-4"></i>
          </div>
          <div>
            <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16.5px', letterSpacing: '-0.01em' }}>
              Fabric Colour &amp; Consumption
            </h5>
            <div className="text-muted small" style={{ fontSize: '12px' }}>
              {consumptionRows.length} article-colour combinations
            </div>
          </div>
        </div>

        {/* Table container */}
        <div
          className="table-responsive bg-white custom-horizontal-scroll"
          style={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            border: 'none',
            paddingBottom: '0'
          }}
        >
          <table
            className="table align-middle mb-0"
            style={{
              fontSize: '13px',
              borderCollapse: 'collapse',
              width: '100%',
              minWidth: '920px'
            }}
          >
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
              <tr>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 14px' }}>Article</th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 14px' }}>Fabric</th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 10px', textAlign: 'center' }}>
                  Width<br/><span style={{ fontSize: '10px', fontWeight: 500, color: '#94a3b8' }}>(in)</span>
                </th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 14px' }}>Colour</th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 10px', textAlign: 'center' }}>
                  Dyed<br/><span style={{ fontSize: '10px', fontWeight: 500, color: '#94a3b8' }}>(m/pc)</span>
                </th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 10px', textAlign: 'center' }}>Shrink %</th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 10px', textAlign: 'center' }}>
                  Greige<br/><span style={{ fontSize: '10px', fontWeight: 500, color: '#94a3b8' }}>(m/pc)</span>
                </th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 10px', textAlign: 'center' }}>Pcs</th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 12px', textAlign: 'center' }}>Total Dyed</th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 12px', textAlign: 'center' }}>Total Greige</th>
              </tr>
            </thead>
            <tbody>
              {articleGroups.map((group) => {
                const isDyedSourced = group.sourcing === 'Dyed';
                const dyedVal = parseFloat(group.dyedRate) || 0;
                const hasDyedVal = dyedVal > 0;
                const shrinkPct = isDyedSourced ? 0 : (group.shrinkPct || 0);

                const widthOptions = getFabricMasterWidths(group.fabricQuality, group.width);

                return group.rows.map((row, rIdx) => {
                  const isFirstRow = rIdx === 0;
                  const pcs = parseInt(row.pcs, 10) || 0;
                  const greigePerPc = hasDyedVal ? (isDyedSourced ? dyedVal : dyedVal * (1 + shrinkPct / 100)) : null;
                  const totalDyed = hasDyedVal ? dyedVal * pcs : null;
                  const totalGreige = greigePerPc !== null ? greigePerPc * pcs : null;

                  return (
                    <tr
                      key={row.key || `${group.articleName}_${rIdx}`}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        verticalAlign: 'middle',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      {/* ARTICLE (Rowspan per article) */}
                      {isFirstRow && (
                        <td
                          rowSpan={group.rows.length}
                          style={{
                            verticalAlign: 'middle',
                            padding: '12px 14px',
                            borderRight: '1px solid #f1f5f9',
                            borderBottom: '1px solid #e2e8f0'
                          }}
                        >
                          <div className="d-flex align-items-center gap-2 mb-1.5">
                            <span className="fs-5">{group.icon}</span>
                            <div>
                              <div className="fw-bold text-dark fs-14" style={{ lineHeight: 1.2 }}>
                                {group.articleName}
                              </div>
                              <div className="text-muted text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.04em' }}>
                                {group.articleCode}
                              </div>
                            </div>
                          </div>

                          {/* Toggle Buttons: [ Greige ] [ Dyed ] */}
                          <div className="d-inline-flex p-0.5 rounded-2 border bg-light" style={{ gap: '2px', borderColor: '#e2e8f0' }}>
                            <button
                              type="button"
                              className={`btn btn-xs py-0.5 px-2.5 rounded-1 fw-semibold transition-all ${
                                !isDyedSourced ? 'text-white shadow-xs' : 'text-muted bg-transparent'
                              }`}
                              style={{
                                fontSize: '11px',
                                backgroundColor: !isDyedSourced ? '#4361ee' : 'transparent',
                                border: 'none'
                              }}
                              onClick={() => handleToggleArticleSourcing(group.articleName, 'Greige', group.fabricQuality, group.role)}
                              title="Greige Fabric (Dyed -> Greige conversion using shrinkage)"
                            >
                              Greige
                            </button>
                            <button
                              type="button"
                              className={`btn btn-xs py-0.5 px-2.5 rounded-1 fw-semibold transition-all ${
                                isDyedSourced ? 'text-white shadow-xs' : 'text-muted bg-transparent'
                              }`}
                              style={{
                                fontSize: '11px',
                                backgroundColor: isDyedSourced ? '#0284c7' : 'transparent',
                                border: 'none'
                              }}
                              onClick={() => handleToggleArticleSourcing(group.articleName, 'Dyed', group.fabricQuality, group.role)}
                              title="Dyed Fabric (No shrinkage conversion, Shrink % blank)"
                            >
                              Dyed
                            </button>
                          </div>
                        </td>
                      )}

                      {/* FABRIC (Rowspan per article-fabric requirement) */}
                      {isFirstRow && (
                        <td
                          rowSpan={group.rows.length}
                          style={{
                            verticalAlign: 'middle',
                            padding: '12px 14px',
                            borderRight: '1px solid #f1f5f9',
                            borderBottom: '1px solid #e2e8f0'
                          }}
                        >
                          <div className="fw-semibold text-dark fs-13">
                            {group.fabricQuality || 'Grey Cotton Reyon'}
                            {group.role && (
                              <span className="badge bg-light text-secondary border ms-2" style={{ fontSize: '10.5px' }}>
                                {autoCapitalizeWords(group.role)}
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* WIDTH (IN) (Rowspan per article fabric - comes from selected fabric) */}
                      {isFirstRow && (
                        <td
                          rowSpan={group.rows.length}
                          style={{
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            padding: '10px 8px',
                            borderRight: '1px solid #f1f5f9',
                            borderBottom: '1px solid #e2e8f0'
                          }}
                        >
                          <div className="position-relative d-inline-block">
                            <button
                              type="button"
                              className="btn btn-sm d-inline-flex align-items-center justify-content-center gap-1.5 fw-semibold transition-all shadow-none"
                              style={{
                                minWidth: '66px',
                                height: '30px',
                                padding: '2px 8px',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                color: group.width && group.width !== '—' ? '#4361ee' : '#64748b',
                                backgroundColor: group.width && group.width !== '—' ? '#eef2ff' : '#ffffff',
                                border: activeWidthDropdown === group.key
                                  ? '1.5px solid #4361ee'
                                  : (group.width && group.width !== '—' ? '1.5px solid #c7d2fe' : '1.5px solid #cbd5e1'),
                                borderRadius: '6px',
                                cursor: 'pointer',
                                boxShadow: activeWidthDropdown === group.key
                                  ? '0 0 0 3px rgba(67, 97, 238, 0.15)'
                                  : 'none'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveWidthDropdown(activeWidthDropdown === group.key ? null : group.key);
                              }}
                              title="Select fabric width from Fabric Master"
                            >
                              <span>{group.width || '—'}</span>
                              <i
                                className={`ti ti-chevron-${activeWidthDropdown === group.key ? 'up' : 'down'}`}
                                style={{ fontSize: '11px', color: '#4361ee', transition: 'transform 0.15s ease' }}
                              ></i>
                            </button>

                            {activeWidthDropdown === group.key && (
                              <div
                                className="position-absolute bg-white rounded-3 border py-1 animate__animated animate__fadeIn"
                                style={{
                                  top: 'calc(100% + 4px)',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  zIndex: 1060,
                                  minWidth: '95px',
                                  borderColor: '#c7d2fe',
                                  boxShadow: '0 10px 25px -5px rgba(67, 97, 238, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.06)',
                                  borderRadius: '8px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div
                                  className="px-2.5 py-1 border-bottom mb-1 fw-bold"
                                  style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6366f1' }}
                                >
                                  Fabric Width
                                </div>
                                <button
                                  type="button"
                                  className="w-100 border-0 bg-transparent px-3 py-1.5 d-flex align-items-center justify-content-between text-start fw-semibold transition-all"
                                  style={{
                                    fontSize: '12.5px',
                                    color: (!group.width || group.width === '—') ? '#4361ee' : '#64748b',
                                    backgroundColor: (!group.width || group.width === '—') ? '#eef2ff' : 'transparent',
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (group.width && group.width !== '—') e.currentTarget.style.backgroundColor = '#f8fafc';
                                  }}
                                  onMouseLeave={(e) => {
                                    if (group.width && group.width !== '—') e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                  onClick={() => {
                                    handleUpdateArticleWidth(group.articleName, '', group.fabricQuality, group.role);
                                    setActiveWidthDropdown(null);
                                  }}
                                >
                                  <span>—</span>
                                  {(!group.width || group.width === '—') && (
                                    <i className="ti ti-check" style={{ fontSize: '12px', color: '#4361ee' }}></i>
                                  )}
                                </button>
                                {widthOptions.map((w) => {
                                  const isSelected = group.width === w;
                                  return (
                                    <button
                                      key={w}
                                      type="button"
                                      className="w-100 border-0 bg-transparent px-3 py-1.5 d-flex align-items-center justify-content-between text-start fw-semibold transition-all"
                                      style={{
                                        fontSize: '12.5px',
                                        color: isSelected ? '#4361ee' : '#334155',
                                        backgroundColor: isSelected ? '#eef2ff' : 'transparent',
                                        cursor: 'pointer'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                      }}
                                      onClick={() => {
                                        handleUpdateArticleWidth(group.articleName, w, group.fabricQuality, group.role);
                                        setActiveWidthDropdown(null);
                                      }}
                                    >
                                      <span>{w}</span>
                                      {isSelected && (
                                        <i className="ti ti-check" style={{ fontSize: '12px', color: '#4361ee' }}></i>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      )}

                      {/* COLOUR (Per row) */}
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <div className="d-flex align-items-center gap-2" style={{ whiteSpace: 'nowrap' }}>
                          <span
                            className="d-inline-block rounded-circle flex-shrink-0"
                            style={{
                              width: '11px',
                              height: '11px',
                              backgroundColor: row.colorHex || '#333333',
                              border: '1px solid rgba(0,0,0,0.1)'
                            }}
                          />
                          <span className="text-dark fw-medium" style={{ fontSize: '13px' }}>
                            {row.colorName}
                          </span>
                        </div>
                      </td>

                      {/* DYED (M/PC) (Rowspan per article) */}
                      {isFirstRow && (
                        <td
                          rowSpan={group.rows.length}
                          style={{
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            padding: '10px 8px',
                            borderRight: '1px solid #f1f5f9',
                            borderBottom: '1px solid #e2e8f0'
                          }}
                        >
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            className="form-control form-control-sm text-center font-monospace"
                            style={{
                              width: '78px',
                              height: '32px',
                              margin: '0 auto',
                              border: '1.5px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#1e293b',
                              transition: 'all 0.15s ease'
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#4361ee';
                              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(67, 97, 238, 0.15)';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#cbd5e1';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            placeholder="0.000"
                            value={group.dyedRate !== undefined && group.dyedRate !== null && group.dyedRate !== '' ? group.dyedRate : ''}
                            onChange={(e) => handleUpdateArticleDyedRate(group.articleName, e.target.value, group.fabricQuality, group.role)}
                          />
                        </td>
                      )}

                      {/* SHRINK % (Rowspan per article - blank if Dyed) */}
                      {isFirstRow && (
                        <td
                          rowSpan={group.rows.length}
                          style={{
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            padding: '10px 8px',
                            borderRight: '1px solid #f1f5f9',
                            borderBottom: '1px solid #e2e8f0',
                            fontSize: '13px',
                            color: '#475569',
                            fontWeight: 500
                          }}
                        >
                          {isDyedSourced ? '—' : (group.shrinkPct ? `${group.shrinkPct}%` : '—')}
                        </td>
                      )}

                      {/* GREIGE (M/PC) */}
                      <td
                        style={{
                          padding: '10px 8px',
                          textAlign: 'center',
                          fontVariantNumeric: 'tabular-nums',
                          color: '#334155',
                          fontSize: '13px',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        {greigePerPc !== null && greigePerPc > 0 ? greigePerPc.toFixed(2) : '—'}
                      </td>

                      {/* PCS */}
                      <td
                        style={{
                          padding: '10px 8px',
                          textAlign: 'center',
                          fontVariantNumeric: 'tabular-nums',
                          color: '#1e293b',
                          fontWeight: 600,
                          fontSize: '13px',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        {pcs}
                      </td>

                      {/* TOTAL DYED */}
                      <td
                        style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: '#1d4ed8',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        {totalDyed !== null && totalDyed > 0 ? totalDyed.toFixed(2) : '—'}
                      </td>

                      {/* TOTAL GREIGE */}
                      <td
                        style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: '#7e22ce',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        {totalGreige !== null && totalGreige > 0 ? totalGreige.toFixed(2) : '—'}
                      </td>
                    </tr>
                  );
                });
              })}

              {/* SUMMARY ROWS AT BOTTOM */}
              {fabricSummaryRows.map((fs, idx) => (
                <tr
                  key={`summary_${idx}`}
                  style={{
                    borderTop: idx === 0 ? '2px solid #cbd5e1' : '1px solid #e2e8f0',
                    borderBottom: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <td
                    colSpan={7}
                    className="fw-bold text-dark ps-3 py-2.5"
                    style={{ fontSize: '13.5px' }}
                  >
                    <span>{fs.fabricName}</span>
                    {fs.width ? (
                      <span className="badge bg-white text-primary border ms-2 font-monospace" style={{ fontSize: '11px', borderColor: '#c7d2fe' }}>
                        {fs.width}
                      </span>
                    ) : ''}
                  </td>
                  <td
                    className="text-center fw-bold text-dark py-2.5"
                    style={{ fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {fs.pcs}
                  </td>
                  <td
                    className="text-center fw-bold py-2.5"
                    style={{
                      fontSize: '13px',
                      color: '#4361ee',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {fs.hasValues && fs.totalDyed > 0 ? fs.totalDyed.toFixed(2) : '—'}
                  </td>
                  <td
                    className="text-center fw-bold py-2.5"
                    style={{
                      fontSize: '13px',
                      color: '#0284c7',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {fs.hasValues && fs.totalGreige > 0 ? fs.totalGreige.toFixed(2) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Actions Bar */}
        <div
          className="d-flex align-items-center justify-content-end gap-2.5 p-3 px-4 bg-white"
          style={{ borderTop: '1px solid #f1f5f9' }}
        >
          <button
            type="button"
            className="btn btn-outline-secondary px-3.5 py-2 rounded-3 fw-semibold bg-white shadow-xs transition-all"
            style={{ borderColor: '#cbd5e1', color: '#475569', fontSize: '13px' }}
            onClick={handleCancelConsumption}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn px-3.5 py-2 rounded-3 fw-semibold text-primary shadow-xs d-flex align-items-center gap-2 transition-all"
            style={{
              backgroundColor: '#eef2ff',
              borderColor: '#c7d2fe',
              fontSize: '13px'
            }}
            onClick={() => setShowRateCalculation(prev => !prev)}
            title="Calculate Rate & View Costing Breakdown"
          >
            <i className="ti ti-calculator fs-5"></i>
            <span>Calculate Rate</span>
          </button>

          <button
            type="button"
            className="btn px-4 py-2 rounded-3 fw-semibold text-white shadow-sm d-flex align-items-center gap-2 transition-all"
            style={{
              backgroundColor: '#2e37a4',
              borderColor: '#2e37a4',
              fontSize: '13px'
            }}
            onClick={handleSaveConsumption}
          >
            <i className="ti ti-device-floppy fs-5"></i>
            <span>Save</span>
          </button>
        </div>

        {/* Section 8 Intelligent Costing & Rate Calculation Breakdown */}
        {showRateCalculation && (
          <div className="p-4 border-top" style={{ backgroundColor: '#f8fafc' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary-subtle text-primary p-2 rounded-2">
                  <i className="ti ti-chart-arrows fs-5"></i>
                </span>
                <div>
                  <h6 className="fw-bold text-dark mb-0 fs-15">Fabric Rate Calculation &amp; Procurement Costing</h6>
                  <small className="text-muted">Market Rate, Fabric Cost per Garment &amp; Margin Optimization Engine</small>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowRateCalculation(false)}
                title="Close breakdown"
              ></button>
            </div>

            {/* Rates table with ALL width calculations */}
            <div className="table-responsive rounded-3 border bg-white mb-3 shadow-2xs">
              <table className="table table-sm align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="bg-light">
                  <tr>
                    <th className="py-2.5 px-3">Fabric Quality</th>
                    <th className="py-2.5 px-3 text-center">Width</th>
                    <th className="py-2.5 px-3 text-center">Sourcing Path</th>
                    <th className="py-2.5 px-3 text-end">Market Rate (₹/m)</th>
                    <th className="py-2.5 px-3 text-end">Total Metres</th>
                    <th className="py-2.5 px-3 text-end">Est. Fabric Cost</th>
                    <th className="py-2.5 px-3 text-end">Cost / Garment</th>
                  </tr>
                </thead>
                <tbody>
                  {rateCalculations.map((rc, idx) => (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor: rc.isSelected ? '#ffffff' : '#fcfcfd'
                      }}
                    >
                      <td className="py-2.5 px-3 fw-semibold text-dark">
                        {rc.fabricName}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="d-inline-flex align-items-center gap-1.5">
                          <span className="fw-bold font-monospace">{rc.width}</span>
                          {rc.isSelected ? (
                            <span
                              className="badge rounded-pill fw-semibold px-2 py-0.5 text-white shadow-2xs"
                              style={{ backgroundColor: '#2e37a4', fontSize: '10px' }}
                            >
                              Selected
                            </span>
                          ) : (
                            <span
                              className="badge rounded-pill fw-medium px-2 py-0.5 bg-light text-muted border"
                              style={{ fontSize: '10px' }}
                            >
                              Alternative
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`badge ${rc.isDyed ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'} px-2 py-1`}>
                          {rc.isDyed ? 'Dyed / Stock' : 'Greige + Dyeing'}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-end" style={{ width: '145px' }}>
                        <div
                          className="input-group input-group-sm ms-auto rounded-2 overflow-hidden shadow-2xs"
                          style={{
                            maxWidth: '135px',
                            border: '1.5px solid #cbd5e1',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <span
                            className="input-group-text px-2 py-0 bg-light text-dark fw-bold border-0"
                            style={{ fontSize: '12.5px', color: '#334155' }}
                          >
                            ₹
                          </span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            className="form-control form-control-sm text-end fw-bold font-monospace bg-white border-0 ps-1 pe-2 shadow-none"
                            style={{ fontSize: '13px', height: '32px', color: '#0f172a' }}
                            placeholder={rc.defaultCalculatedRate.toFixed(2)}
                            value={customMarketRates[rc.rateKey] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomMarketRates(prev => ({
                                ...prev,
                                [rc.rateKey]: val
                              }));
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-end font-monospace fw-semibold">
                        {rc.totalMetres.toFixed(1)}m
                      </td>
                      <td className={`py-2.5 px-3 text-end font-monospace fw-bold ${rc.isSelected ? 'text-dark' : 'text-secondary'}`}>
                        ₹{rc.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td
                        className="py-2.5 px-3 text-end font-monospace fw-semibold"
                        style={{ color: rc.isSelected ? '#2e37a4' : '#64748b' }}
                      >
                        ₹{rc.costPerGarment.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-light fw-bold">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-dark">
                      Total Order Procurement Cost (Active Selected Widths)
                    </td>
                    <td className="py-2.5 px-3 text-end font-monospace">{rateTotals.totalMetres.toFixed(1)}m</td>
                    <td className="py-2.5 px-3 text-end font-monospace text-success fs-14">
                      ₹{rateTotals.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-end font-monospace text-primary">
                      Avg ₹{(rateTotals.totalCost / (rateTotals.totalPcs || 1)).toFixed(2)}/pc
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>



      {/* =========================================================================
       * 11. ACCESSORIES BOM CARD (Matching Screenshots 1, 3, 4)
       * ========================================================================= */}
      <div
        className="card border-0 shadow-sm rounded-4 bg-white"
        style={{
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '24px',
          borderRadius: '14px',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Header with Theme Diamond Icon */}
        <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: '14px', marginBottom: '20px' }}>
          <div className="d-flex align-items-center" style={{ gap: '14px' }}>
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm flex-shrink-0"
              style={{ width: '38px', height: '38px', minWidth: '38px', backgroundColor: '#2e37a4', borderRadius: '10px' }}
            >
              <i className="ti ti-diamond" style={{ fontSize: '18px', lineHeight: 1 }}></i>
            </div>
            <div>
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '16px' }}>
                Accessories BOM — {bomCustomerName}
              </h6>
              <div className="text-muted small" style={{ fontSize: '12px', marginTop: '2px' }}>
                Select accessories for each article
              </div>
            </div>
          </div>

          {/* Customer selector pills if order has multiple customers */}
          {order?.customerOrders && order.customerOrders.length > 1 && (
            <div className="d-flex align-items-center gap-1.5">
              {order.customerOrders.map((co, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  className="btn btn-xs rounded-2 fw-semibold px-2.5 py-1"
                  style={{
                    fontSize: '11.5px',
                    backgroundColor: bomCustomerName === co.customerName ? '#2e37a4' : '#f8fafc',
                    color: bomCustomerName === co.customerName ? '#ffffff' : '#475569',
                    border: '1px solid',
                    borderColor: bomCustomerName === co.customerName ? '#2e37a4' : '#e2e8f0'
                  }}
                  onClick={() => setSelectedBomCustomer(co.customerName)}
                >
                  {co.customerName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '20px' }}>
          <div className="input-group rounded-3 overflow-hidden shadow-xs border" style={{ borderColor: '#e2e8f0' }}>
            <span className="input-group-text bg-white border-0 text-muted ps-3">
              <i className="ti ti-search" style={{ fontSize: '16px' }}></i>
            </span>
            <input
              type="text"
              className="form-control border-0 shadow-none ps-2"
              placeholder="Search accessories across all categories..."
              value={accessorySearchQuery}
              onChange={(e) => setAccessorySearchQuery(e.target.value)}
              style={{ fontSize: '13px', height: '42px' }}
            />
            {accessorySearchQuery && (
              <button
                type="button"
                className="btn btn-link text-muted pe-3 text-decoration-none"
                onClick={() => setAccessorySearchQuery('')}
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* 1. Category Buttons Grid (Evenly spaced, responsive columns) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}
        >
          {ACCESSORY_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const categoryItems = addedAccessories.filter(item => item.category === cat.id);

            return (
              <button
                key={cat.id}
                type="button"
                className={`btn rounded-3 d-flex flex-column align-items-center justify-content-center p-2 transition-all shadow-xs ${
                  isActive ? 'fw-bold' : ''
                }`}
                style={{
                  width: '100%',
                  height: '76px',
                  backgroundColor: isActive ? '#eef2ff' : '#ffffff',
                  borderColor: isActive ? '#2e37a4' : '#e2e8f0',
                  borderWidth: isActive ? '2px' : '1px',
                  borderStyle: 'solid',
                  color: isActive ? '#2e37a4' : '#475569',
                  boxShadow: isActive ? '0 2px 8px rgba(46, 55, 164, 0.15)' : 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveCategory(cat.id)}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mb-1"
                  style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: isActive ? '#2e37a4' : cat.bgColor,
                    color: isActive ? '#ffffff' : cat.iconColor
                  }}
                >
                  <i className={cat.icon} style={{ fontSize: '14px' }}></i>
                </div>
                <span style={{ fontSize: '12px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100%' }}>
                  {cat.name} ({categoryItems.length})
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. Active Category Header Line (Matching Image 2) */}
        <div className="d-flex align-items-center" style={{ gap: '10px', marginTop: '16px', marginBottom: '14px' }}>
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '26px', height: '26px', minWidth: '26px', backgroundColor: '#eef2ff', color: '#2e37a4' }}
          >
            <i className={activeCategoryObj.icon} style={{ fontSize: '14px' }}></i>
          </div>
          <span className="fw-semibold text-dark" style={{ fontSize: '14.5px' }}>
            {activeCategoryObj.name} {(activeCategoryObj?.varieties?.length > 0) ? '— click one to add and configure it:' : ''}
          </span>
        </div>

        {/* 3. Article Buttons (e.g. [ Kurta ], [ Pajama ]) Matching Image 2 */}
        <div className="d-flex flex-wrap align-items-center" style={{ gap: '12px', marginBottom: '18px' }}>
          {orderArticles.map((art) => {
            const isSelected = (selectedBomArticle || orderArticles[0]?.name) === art.name;
            const isBottom = /pant|plazo|palazzo|pajama|salwar|bottom|trouser/i.test(art.name || '');
            return (
              <button
                key={art.name || art.id || 'Kurta'}
                type="button"
                className="btn rounded-3 d-flex flex-column align-items-center justify-content-center p-2 transition-all shadow-xs"
                style={{
                  width: '110px',
                  height: '74px',
                  backgroundColor: isSelected ? '#f0f2fd' : '#ffffff',
                  border: isSelected ? '2px solid #2e37a4' : '1.5px solid #cbd5e1',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setSelectedBomArticle(art.name);
                }}
                title={`Select ${art.name || 'Kurta'} to configure accessories`}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mb-1"
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: isSelected ? '#2e37a4' : '#eef2ff',
                    color: isSelected ? '#ffffff' : '#2e37a4'
                  }}
                >
                  <span style={{ fontSize: '15px' }}>{isBottom ? '👖' : '👕'}</span>
                </div>
                <span className="fw-semibold text-dark small" style={{ fontSize: '13px' }}>
                  {art.name || 'Kurta'}
                </span>
              </button>
            );
          })}
        </div>

        {/* 4. Quick Variety Pills — click one to open popover */}
        <div className="position-relative d-flex flex-wrap align-items-center" style={{ gap: '10px', marginBottom: '24px' }}>
          {(activeCategoryObj?.varieties || []).length === 0 ? (
            <div className="text-muted small py-2 px-3 rounded-3 d-flex align-items-center gap-2" style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13px' }}>
              <i className="ti ti-info-circle" style={{ color: '#94a3b8', fontSize: '16px' }}></i>
              <span>No accessories added in <strong>{activeCategoryObj?.name || activeCategory} Master</strong> yet. Add items in Accessories Master to select them here.</span>
            </div>
          ) : (
            (activeCategoryObj?.varieties || []).map((v, vIdx) => (
              <button
                key={vIdx}
                type="button"
                className="btn btn-sm d-inline-flex align-items-center gap-1.5 rounded-pill transition-all"
                style={{
                  fontSize: '12.5px',
                  fontWeight: 500,
                  padding: '7px 16px',
                  backgroundColor: '#ffffff',
                  borderColor: '#c7d2fe',
                  color: '#2e37a4',
                  boxShadow: 'none',
                  borderRadius: '50px',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const containerRect = e.currentTarget.parentElement.getBoundingClientRect();
                  setPopoverState({
                    catId: activeCategoryObj?.id || activeCategory,
                    varName: v.name,
                    x: rect.left - containerRect.left,
                    y: rect.bottom - containerRect.top + 6
                  });
                }}
                title={`Add ${v.name}`}
              >
                <span style={{ color: '#2e37a4', fontWeight: 700 }}>+</span>
                <span>{v.name}</span>
              </button>
            ))
          )}

          {/* How many to add? Popover */}
          {popoverState && (
            <div
              className="position-absolute bg-white rounded-3 shadow-lg p-3"
              style={{
                zIndex: 1050,
                width: '230px',
                top: `${popoverState.y}px`,
                left: `${Math.max(0, popoverState.x)}px`,
                border: '1.5px solid #cbd5e1',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div className="fw-bold text-dark small mb-2 text-center" style={{ fontSize: '13px' }}>
                How many to add?
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '6px',
                  marginBottom: '10px'
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <button
                    key={num}
                    type="button"
                    className="btn btn-sm btn-outline-secondary p-1 fw-bold transition-all"
                    style={{ fontSize: '13px', borderRadius: '6px' }}
                    onClick={() => {
                      handleAddMultipleAccessories(popoverState.catId, popoverState.varName, num);
                      setPopoverState(null);
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                  style={{ fontSize: '12px' }}
                  onClick={() => setPopoverState(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. Configured Accessories List or Empty State */}
        {(() => {
          const categoryItems = addedAccessories.filter(item => item.category === (activeCategoryObj?.id || activeCategory));

          if (categoryItems.length === 0) {
            return (
              <div
                className="rounded-3 p-4 text-center my-3"
                style={{
                  border: '1.5px dashed #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#64748b'
                }}
              >
                <div className="small fw-medium">
                  No accessories configured yet — pick a category and click a variety above to add.
                </div>
              </div>
            );
          }

          return (
            <div className="d-flex flex-column gap-3 mb-4">
              {categoryItems.map((item) => {
                const isEditing = Boolean(editingAccessoryIds[item.id]);
                const selectedArticles = getCardSelectedArticles(item);

                return (
                  <div
                    key={item.id}
                    className="bg-white shadow-xs"
                    style={{
                      border: isEditing ? '1.5px solid #818cf8' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '18px 20px',
                      backgroundColor: '#ffffff',
                      marginBottom: '20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  >
                    {/* Header with Title and Save / Edit / Trash buttons (Matching Image 3) */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: '12px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold text-dark" style={{ fontSize: '16px' }}>
                          {item.category || item.varietyName || 'Accessory'}
                        </span>
                        <span
                          className="badge rounded-pill px-2.5 py-0.5 fw-bold"
                          style={{ fontSize: '11px', backgroundColor: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff' }}
                        >
                          #{item.configIndex || item.instanceNum || 1}
                        </span>
                        <span className="fw-bold" style={{ fontSize: '13.5px', color: '#7c3aed' }}>
                          {item.unit || (['Lace', 'Thread', 'Dori', 'Elastic'].includes(item.category) ? 'Meter' : 'Pcs')}
                        </span>
                        {item.varietyName && item.varietyName.toLowerCase() !== (item.category || '').toLowerCase() && (
                          <span className="text-muted fw-normal" style={{ fontSize: '12.5px' }}>
                            · {item.varietyName}
                          </span>
                        )}
                      </div>

                      <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                        {isEditing ? (
                          <button
                            type="button"
                            className="btn btn-sm text-white rounded-2 px-3.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
                            style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed', fontSize: '12.5px' }}
                            onClick={() => handleSaveItem(item)}
                          >
                            <i className="ti ti-device-floppy" style={{ fontSize: '15px' }}></i>
                            <span>Save</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm rounded-2 px-3.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs transition-all"
                            style={{ color: '#7c3aed', borderColor: '#c4b5fd', backgroundColor: '#ffffff', fontSize: '12.5px' }}
                            onClick={() => setEditingAccessoryIds(prev => ({ ...prev, [item.id]: true }))}
                            title="Edit Accessory"
                          >
                            <i className="ti ti-edit" style={{ fontSize: '14px' }}></i>
                            <span>Edit</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-link text-muted p-1"
                          onClick={() => handleDeleteItem(item.id)}
                          title="Delete accessory"
                        >
                          <i className="ti ti-trash" style={{ fontSize: '16px' }}></i>
                        </button>
                      </div>
                    </div>

                    {/* Article Selector Buttons / Tabs inside card (Matching Image 3 & Video) */}
                    <div className="d-flex align-items-center gap-2 mb-3">
                      {orderArticles.map((art) => {
                        const isSelected = selectedArticles.some(a => a.toLowerCase() === (art.name || '').toLowerCase());
                        const isBottom = /pant|plazo|palazzo|pajama|salwar|bottom|trouser/i.test(art.name || '');
                        return (
                          <button
                            key={art.name}
                            type="button"
                            className="btn d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-3 fw-semibold transition-all"
                            style={{
                              fontSize: '13px',
                              backgroundColor: isSelected ? '#7c3aed' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#334155',
                              border: isSelected ? '1.5px solid #7c3aed' : '1px solid #cbd5e1',
                              boxShadow: isSelected ? '0 2px 6px rgba(124, 58, 237, 0.25)' : 'none',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              handleToggleCardArticle(item.id, art.name);
                            }}
                          >
                            <span style={{ fontSize: '15px' }}>{isBottom ? '👖' : '🎽'}</span>
                            <span>{art.name}</span>
                            <span style={{ fontSize: '11px', opacity: 0.85 }}>{isSelected ? '∨' : '>'}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Category-Specific Table Layout */}
                    <div>
                      {renderCategoryCardTable(activeCategoryObj, item, selectedArticles, isEditing)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Bottom Save Button for Accessories BOM */}
        <div className="d-flex justify-content-end align-items-center" style={{ gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
          <button
            type="button"
            className="btn text-white rounded-3 px-4 py-2.5 fw-semibold d-flex align-items-center gap-2 shadow-sm"
            style={{ backgroundColor: '#2e37a4', borderColor: '#2e37a4', fontSize: '13.5px' }}
            onClick={handleSaveAllBOM}
          >
            <i className="ti ti-device-floppy" style={{ fontSize: '18px' }}></i>
            <span>Save Accessories BOM</span>
          </button>
        </div>
      </div>



      {/* =========================================================================
       * BOTTOM ACTION BUTTONS ROW (No background card, clean direct buttons)
       * ========================================================================= */}
      <div className="d-flex align-items-center gap-3 my-4 flex-wrap">
        <button
          type="button"
          className="btn rounded-3 px-4 py-2.5 fw-semibold d-inline-flex align-items-center gap-2 shadow-xs transition-all"
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            color: '#334155',
            fontSize: '13.5px'
          }}
          onClick={() => handleSaveFullOrder('Draft')}
        >
          <i className="ti ti-file-text" style={{ fontSize: '16px', color: '#64748b' }}></i>
          <span>Save as Draft</span>
        </button>

        <button
          type="button"
          className="btn text-white rounded-3 px-4 py-2.5 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm transition-all"
          style={{
            backgroundColor: '#2e37a4',
            border: '1.5px solid #2e37a4',
            fontSize: '13.5px',
            boxShadow: '0 4px 12px rgba(46, 55, 164, 0.25)'
          }}
          onClick={() => handleSaveFullOrder('Saved')}
        >
          <i className="ti ti-device-floppy" style={{ fontSize: '16px' }}></i>
          <span>Save Order</span>
        </button>

        <button
          type="button"
          className="btn rounded-3 px-4 py-2.5 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs transition-all"
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #fecaca',
            color: '#dc2626',
            fontSize: '13.5px'
          }}
          onClick={onBack}
        >
          <i className="ti ti-x" style={{ fontSize: '15px' }}></i>
          <span>Cancel</span>
        </button>

        {confirmed && (
          <button
            type="button"
            className="btn rounded-3 px-4 py-2.5 fw-semibold d-inline-flex align-items-center gap-2 shadow-xs transition-all"
            style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #2e37a4',
              color: '#2e37a4',
              fontSize: '13.5px'
            }}
            onClick={onBack}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: '15px' }}></i>
            <span>Back to Orders List</span>
          </button>
        )}
      </div>

      {/* =========================================================================
       * ORDER HISTORY CARD (Matching Image 2)
       * ========================================================================= */}
      <div
        className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white"
        style={{ border: '1px solid #e2e8f0' }}
      >
        <h5 className="fw-bold text-dark mb-2" style={{ fontSize: '16px' }}>
          History
        </h5>
        <hr className="my-2" style={{ borderColor: '#e2e8f0' }} />

        <div className="d-flex flex-column gap-2 mt-2">
          {orderHistory.map((h, hIdx) => (
            <div key={hIdx} className="d-flex align-items-start gap-2 text-secondary" style={{ fontSize: '13px' }}>
              <span style={{ color: '#d97706', fontSize: '16px', lineHeight: '18px' }}>&bull;</span>
              <span>
                <strong>{h.dateFormatted || formatDateWithTime(h.date)}</strong> &mdash; {h.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 7 Accessory Purchase Order Generation Modals */}
      {activePOModalCategory === 'TASSEL' ? (
        <TasselPOModal
          isOpen={true}
          onClose={() => setActivePOModalCategory(null)}
          order={order}
          vendors={vendorsList}
          addedAccessories={addedAccessories}
          allocatedGarments={allocatedGarments}
          onSavePO={handleSaveAccessoryPO}
        />
      ) : activePOModalCategory === 'THREAD' ? (
        <ThreadPOModal
          isOpen={true}
          onClose={() => setActivePOModalCategory(null)}
          order={order}
          vendors={vendorsList}
          addedAccessories={addedAccessories}
          allocatedGarments={allocatedGarments}
          onSavePO={handleSaveAccessoryPO}
        />
      ) : activePOModalCategory ? (
        <GenericAccessoryPOModal
          isOpen={true}
          onClose={() => setActivePOModalCategory(null)}
          order={order}
          categoryKey={activePOModalCategory}
          vendors={vendorsList}
          addedAccessories={addedAccessories}
          allocatedGarments={allocatedGarments}
          onSavePO={handleSaveAccessoryPO}
        />
      ) : null}
    </div>
  );
}
