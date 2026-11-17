import React, { useState, useMemo, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    setConfirmed(order?.stage === 'Confirmed' || order?.status === 'Confirmed');
  }, [order?.id, order?.status, order?.stage]);
  const [photoType, setPhotoType] = useState('Reference');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [photos, setPhotos] = useState(order?.photos || []);
  const [expandedArticles, setExpandedArticles] = useState({ 0: true, 1: true });
  const [editingLengthIdx, setEditingLengthIdx] = useState(null);
  const [tempLengthVal, setTempLengthVal] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Helper to calculate total pieces ordered by customers for a specific (Article, Color)
  const getCustomerPcs = useCallback((artName, colName) => {
    let sum = 0;
    if (Array.isArray(order?.customerOrders)) {
      const matchingArt = (order?.articles || []).find(a => 
        (a.name || '').trim().toLowerCase() === (artName || '').trim().toLowerCase() ||
        (a.id || '').trim().toLowerCase() === (artName || '').trim().toLowerCase()
      );
      const artId = matchingArt?.id || '';

      order.customerOrders.forEach(cust => {
        Object.entries(cust.sizeConfigs || {}).forEach(([key, cfg]) => {
          const kLow = key.toLowerCase();
          const aLow = (artName || '').toLowerCase();
          const cLow = (colName || '').toLowerCase();
          const matchesArt = (artId && key.startsWith(`${artId}_`)) || (aLow && kLow.includes(aLow));
          const matchesCol = (cLow === '' || kLow.endsWith(`_${cLow}`) || kLow.includes(cLow));

          if (matchesArt && matchesCol) {
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
  }, [order]);

  // All colors present in this order
  const availableColorsList = useMemo(() => {
    const set = new Set();
    if (Array.isArray(order?.customerOrders)) {
      order.customerOrders.forEach(c => {
        (c.selectedColors || []).forEach(col => set.add(col));
      });
    }
    if (Array.isArray(order?.colors)) {
      order.colors.forEach(col => set.add(col));
    }
    if (set.size === 0) {
      set.add('Standard');
    }
    return Array.from(set);
  }, [order]);

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
    } catch (e) { }
    return procurementFabrics || [];
  });

  // Width Dropdown active article state
  const [activeWidthDropdown, setActiveWidthDropdown] = useState(null);

  useEffect(() => {
    const handleFabricsUpdate = () => {
      try {
        const s = getStoredData('raindrop_fabrics_v1', null);
        if (Array.isArray(s)) setMasterFabricsList(s);
      } catch (e) { }
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
    } catch (e) { }
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
    } catch (e) { }
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
    } catch (e) { }
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
        const raw = match.maxBuffer ?? match.bufferPercent ?? match.bufferPct;
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
        if (Array.isArray(match.fabrics) && match.fabrics.length > 0) {
          for (const f of match.fabrics) {
            const fBuf = f.maxBuffer ?? f.bufferPercent ?? f.bufferPct;
            if (fBuf !== undefined && fBuf !== null && fBuf !== '') {
              const val = parseFloat(fBuf);
              if (!isNaN(val) && val >= 0) return val;
            }
          }
        }
        const raw = match.maxBuffer ?? match.bufferPercent ?? match.bufferPct;
        if (raw !== undefined && raw !== null && raw !== '') {
          const val = parseFloat(raw);
          if (!isNaN(val) && val >= 0) return val;
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
    } catch (e) { }
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

    return 2;
  };

  const matchesCategory = (itemCat, tabCat) => {
    if (!tabCat || tabCat === 'All') return true;
    if (!itemCat) return false;
    if (itemCat === tabCat) return true;
    const normItem = String(itemCat).toLowerCase().replace(/s$/, '');
    const normTab = String(tabCat).toLowerCase().replace(/s$/, '');
    return normItem === normTab;
  };

  // Sourced directly from Accessories Master (Maximum Buffer % configured per accessory)
  const getAccessoryMasterBuffer = (item, currentArticle) => {
    if (item?.maxBuffer !== undefined && item?.maxBuffer !== null && item?.maxBuffer !== '') {
      const val = parseFloat(item.maxBuffer);
      if (!isNaN(val) && val >= 0) return val;
    }

    const catName = String(item?.category || '').toLowerCase().trim();
    const varName = String(item?.varietyName || item?.name || '').toLowerCase().trim();

    if (Array.isArray(masterAccessories) && masterAccessories.length > 0) {
      let matched = masterAccessories.find(m => {
        const mCat = String(m.category || '').toLowerCase().trim();
        const mName = String(m.name || '').toLowerCase().trim();
        const catMatch = !catName || mCat === catName || matchesCategory(mCat, catName);
        const nameMatch = mName && (mName === varName || varName.includes(mName) || mName.includes(varName));
        return catMatch && nameMatch;
      });

      if (!matched) {
        for (const m of masterAccessories) {
          if (Array.isArray(m.varieties)) {
            const vMatch = m.varieties.find(v => {
              const vName = String(v?.name || '').toLowerCase().trim();
              return vName && (vName === varName || varName.includes(vName) || vName.includes(varName));
            });
            if (vMatch) {
              const vBuf = vMatch.maxBuffer ?? vMatch.bufferPct ?? vMatch.buffer;
              if (vBuf !== undefined && vBuf !== null && vBuf !== '') {
                const val = parseFloat(vBuf);
                if (!isNaN(val) && val >= 0) return val;
              }
              matched = m;
              break;
            }
          }
        }
      }

      if (!matched && varName) {
        matched = masterAccessories.find(m => {
          const mName = String(m.name || '').toLowerCase().trim();
          return mName && (mName === varName || varName.includes(mName));
        });
      }

      if (!matched && catName) {
        matched = masterAccessories.find(m => {
          const mCat = String(m.category || '').toLowerCase().trim();
          return mCat && (mCat === catName || matchesCategory(mCat, catName));
        });
      }

      if (matched) {
        const raw = matched.maxBuffer ?? matched.bufferPercent ?? matched.bufferPct ?? matched.buffer;
        if (raw !== undefined && raw !== null && raw !== '') {
          const val = parseFloat(raw);
          if (!isNaN(val) && val >= 0) return val;
        }
      }
    }

    const fabBuf = getArticleFabricBuffer(currentArticle);
    return (fabBuf !== undefined && fabBuf !== null && !isNaN(fabBuf)) ? fabBuf : 10;
  };

  // Helper to dynamically resolve available colors from item and Accessories Master
  const getItemAvailableColors = (accItem) => {
    if (Array.isArray(accItem?.colors) && accItem.colors.length > 0) {
      return accItem.colors;
    }
    const targetName = (accItem?.varietyName || accItem?.name || '').toLowerCase().trim();
    const match = (masterAccessories || []).find(m => {
      const mName = (m.name || '').toLowerCase().trim();
      if (!mName) return false;
      return mName === targetName || targetName.startsWith(mName) || targetName.includes(mName);
    });
    if (match) {
      const cols = (match.buttonColorsList && match.buttonColorsList.length > 0)
        ? match.buttonColorsList
        : (match.buttonColors ? match.buttonColors.split(',').map(s => s.trim()).filter(Boolean) : (match.colors?.length ? match.colors : (match.color ? [match.color] : [])));
      if (cols.length > 0) return cols;
    }
    // Also check all items under matching category in masterAccessories
    const itemCat = (accItem?.category || '').toLowerCase();
    const isButton = itemCat.includes('button');
    if (isButton) {
      const allBtnCols = new Set();
      (masterAccessories || [])
        .filter(m => (m.category || '').toLowerCase().includes('button'))
        .forEach(m => {
          const cols = (m.buttonColorsList && m.buttonColorsList.length > 0)
            ? m.buttonColorsList
            : (m.buttonColors ? m.buttonColors.split(',').map(s => s.trim()).filter(Boolean) : (m.colors?.length ? m.colors : (m.color ? [m.color] : [])));
          cols.forEach(c => allBtnCols.add(c));
        });
      if (allBtnCols.size > 0) return Array.from(allBtnCols);
    }
    return [];
  };

  // Helper to dynamically resolve available sizes from item and Accessories Master
  const getItemAvailableSizes = (accItem) => {
    if (Array.isArray(accItem?.sizes) && accItem.sizes.length > 0) {
      return accItem.sizes;
    }
    const targetName = (accItem?.varietyName || accItem?.name || '').toLowerCase().trim();
    const match = (masterAccessories || []).find(m => {
      const mName = (m.name || '').toLowerCase().trim();
      if (!mName) return false;
      return mName === targetName || targetName.startsWith(mName) || targetName.includes(mName);
    });
    if (match) {
      const szs = (match.buttonSizesList && match.buttonSizesList.length > 0)
        ? match.buttonSizesList
        : (match.buttonSizes ? match.buttonSizes.split(',').map(s => s.trim()).filter(Boolean) : (match.variants?.length ? match.variants : (match.sizes?.length ? match.sizes : (match.size ? [match.size] : []))));
      if (szs.length > 0) return szs;
    }
    const itemCat = (accItem?.category || '').toLowerCase();
    const isButton = itemCat.includes('button');
    if (isButton) {
      const allBtnSizes = new Set();
      (masterAccessories || [])
        .filter(m => (m.category || '').toLowerCase().includes('button'))
        .forEach(m => {
          const szs = (m.buttonSizesList && m.buttonSizesList.length > 0)
            ? m.buttonSizesList
            : (m.buttonSizes ? m.buttonSizes.split(',').map(s => s.trim()).filter(Boolean) : (m.variants?.length ? m.variants : (m.sizes?.length ? m.sizes : (m.size ? [m.size] : []))));
          szs.forEach(s => allBtnSizes.add(s));
        });
      if (allBtnSizes.size > 0) return Array.from(allBtnSizes);
    }
    return [];
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
      if (m.category && !allCatNames.some(existing => matchesCategory(m.category, existing))) {
        allCatNames.push(m.category);
      }
    });

    return allCatNames.map(catName => {
      const meta = CATEGORY_METADATA[catName] || Object.entries(CATEGORY_METADATA).find(([k]) => matchesCategory(k, catName))?.[1] || {
        name: catName,
        icon: 'ti ti-tag',
        iconColor: '#2e37a4',
        bgColor: '#eef2ff',
        poBtnText: `${catName} PO`,
        poBtnColor: '#2e37a4',
        defaultUnit: 'PCS'
      };

      const inCat = masterAccessories.filter(m => matchesCategory(m.category, catName));
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
                defaultSize: '',
                defaultColor: '',
                defaultPlacement: '',
                defaultReqPerPc: '',
                type: v.type || m.source || '',
                unit: m.unit || meta.defaultUnit,
                maxBuffer: v.maxBuffer !== undefined ? v.maxBuffer : m.maxBuffer
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
              defaultSize: '',
              defaultColor: '',
              defaultPlacement: '',
              defaultReqPerPc: '',
              type: m.subType || m.source || '',
              unit: m.unit || meta.defaultUnit,
              maxBuffer: m.maxBuffer
            });
          }
        }

        // 3. Base accessory name (Matching Image 3: "+ Coconut", "+ Coconut Button", "+ MOP", "+ Metal 2 hole", "+ Mould", "+ Pignose", "+ Plastic")
        if (m.name && m.name.toLowerCase() !== catName.toLowerCase()) {
          if (!varieties.some(x => x.name.toLowerCase() === m.name.toLowerCase())) {
            const parsedSizes = (m.buttonSizesList && m.buttonSizesList.length > 0)
              ? m.buttonSizesList
              : (m.buttonSizes ? m.buttonSizes.split(',').map(s => s.trim()).filter(Boolean) : (m.variants?.length ? m.variants : (m.sizes || (m.laceSizesList?.length ? m.laceSizesList : (m.laceSize ? [m.laceSize] : (m.size ? [m.size] : []))))));
            const parsedColors = (m.buttonColorsList && m.buttonColorsList.length > 0)
              ? m.buttonColorsList
              : (m.buttonColors ? m.buttonColors.split(',').map(s => s.trim()).filter(Boolean) : (m.colors?.length ? m.colors : (m.color ? [m.color] : [])));
            varieties.push({
              name: m.name,
              baseName: m.name,
              hasSizes: parsedSizes.length > 0,
              sizes: parsedSizes,
              colors: parsedColors,
              defaultSize: '',
              defaultColor: '',
              defaultPlacement: '',
              defaultReqPerPc: '',
              type: m.subType || m.source || '',
              unit: m.unit || meta.defaultUnit,
              maxBuffer: m.maxBuffer
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
            const defaultBuf = getAccessoryMasterBuffer({ ...acc, ...r }, r.article || acc.article || 'Kurta');
            const hasUserEdited = r._userEditedBuffer === true;
            const resBuf = (r.bufferPct !== undefined && r.bufferPct !== null && r.bufferPct !== '' && hasUserEdited)
              ? r.bufferPct
              : '';
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
          const defaultBuf = getAccessoryMasterBuffer(acc, acc.article || 'Kurta');
          const hasUserEdited = acc._userEditedBuffer === true;
          const resBuf = (acc.bufferPct !== undefined && acc.bufferPct !== null && acc.bufferPct !== '' && hasUserEdited)
            ? acc.bufferPct
            : '';
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
                const bufVal = (r.bufferPct !== undefined && r.bufferPct !== null && r.bufferPct !== '')
                  ? (parseFloat(r.bufferPct) || 0)
                  : 0;
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
  const [activeCategory, setActiveCategory] = useState('');
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
    if (!activeCategory) return null;
    return ACCESSORY_CATEGORIES.find(c => matchesCategory(c.id, activeCategory)) || null;
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
    let raw = [];
    if (cardSelectedArticles[item?.id] && Array.isArray(cardSelectedArticles[item?.id])) {
      raw = cardSelectedArticles[item?.id];
    } else if (Array.isArray(item?.selectedArticles) && item.selectedArticles.length > 0) {
      raw = item.selectedArticles;
    } else if (item?.activeArticle) {
      raw = [item.activeArticle];
    } else {
      raw = [orderArticles[0]?.name || 'Kurta'];
    }
    const seen = new Set();
    const result = [];
    for (const art of raw) {
      const lower = (art || '').trim().toLowerCase();
      if (lower && !seen.has(lower)) {
        seen.add(lower);
        result.push(art);
      }
    }
    return result.length > 0 ? result : [orderArticles[0]?.name || 'Kurta'];
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
    const totalArtQty = (artObj?.totalPieces !== undefined && artObj?.totalPieces !== null) ? Number(artObj.totalPieces) : (Number(order?.totalGarments) || 0);
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
    const totalArtQty = (artObj?.totalPieces !== undefined && artObj?.totalPieces !== null) ? Number(artObj.totalPieces) : (Number(order?.totalGarments) || 0);
    const totalAllQty = colorOpts.reduce((sum, co) => sum + (parseFloat(co.qty) || 0), 0) || totalArtQty;

    const defaultBuffer = getAccessoryMasterBuffer(item, articleName);

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
          const resolvedBuffer = (r.bufferPct !== undefined && r.bufferPct !== null && r.bufferPct !== '' && hasUserEdited)
            ? r.bufferPct
            : '';
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
      bufferPct: (item.bufferPct !== undefined && item.bufferPct !== '' && item._userEditedBuffer) ? item.bufferPct : '',
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
        bufferPct: ''
      }
    ];
  };

  const handleUpdateCardRowField = (itemId, articleName, rowIndex, field, value) => {
    let finalValue = value;
    if (field === 'bufferPct') {
      if (value !== '' && value !== null && value !== undefined) {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          const targetItem = addedAccessories.find(a => a.id === itemId);
          const maxAllowed = getAccessoryMasterBuffer(targetItem, articleName);
          if (num > maxAllowed) {
            finalValue = String(maxAllowed);
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
      const totalArtQty = (artObj?.totalPieces !== undefined && artObj?.totalPieces !== null) ? Number(artObj.totalPieces) : (Number(order?.totalGarments) || 0);
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
    const catObj = ACCESSORY_CATEGORIES.find(c => matchesCategory(c.id, catId));
    const varObj = catObj?.varieties?.find(v => v.name.toLowerCase() === (varName || '').toLowerCase()) || catObj?.varieties?.[0];
    const resolvedVarName = varName || varObj?.name || 'Coconut';
    const existingForVar = addedAccessories.filter(a => matchesCategory(a.category, catId) && a.varietyName === resolvedVarName);
    const startNum = existingForVar.length + 1;

    const targetArticle = selectedBomArticle || orderArticles[0]?.name || 'Kurta';
    const resolvedSizes = (varObj?.sizes && varObj.sizes.length > 0) ? varObj.sizes : [];
    const resolvedColors = (varObj?.colors && varObj.colors.length > 0) ? varObj.colors : [];
    const initialSize = '';
    const initialColor = '';

    const newItems = [];
    const newEditingIds = {};

    for (let i = 0; i < count; i++) {
      const instNum = startNum + i;
      const itemId = `acc_${catId}_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`;

      const initialArticleRows = {};
      orderArticles.forEach(art => {
        const colorOpts = getArticleColorOptions(art.name);
        const defaultBuffer = getAccessoryMasterBuffer({ category: catId, varietyName: resolvedVarName, ...varObj }, art.name);
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
          bufferPct: '',
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
        bufferPct: '',
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
    const isAdvanced = ['In Production', 'Completed'].includes(order?.status);
    const newStatus = isDraft ? 'Draft' : (isAdvanced ? order.status : 'Confirmed');
    const newStage = isDraft ? 'Draft' : (isAdvanced ? (order.stage || order.status) : 'Confirmed');
    setConfirmed(newStatus === 'Confirmed' || isAdvanced);

    let userName = 'Saksham Garg';
    let userRole = 'Merchandiser';
    try {
      const currentUserStr = typeof localStorage !== 'undefined' ? localStorage.getItem('erp_user') : null;
      if (currentUserStr) {
        const u = JSON.parse(currentUserStr);
        if (u.name) userName = u.name;
        if (u.role) userRole = u.role.split(' ')[0] || 'Merchandiser';
      }
    } catch (e) { }

    const nowIso = new Date().toISOString();
    const historyText = isDraft
      ? `Order saved as draft (${userName} (${userRole}))`
      : `Order saved & confirmed (${userName} (${userRole}))`;

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
      hasProceededToNextStep: true,
      draftStep: isDraft ? 'detail' : null,
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
      setToastMessage(`Order #${updatedOrder.id || ''} saved & confirmed successfully!`);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        if (onBack) onBack();
      }, 600);
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

    const rawArticlesToRender = Array.isArray(selectedArticles)
      ? (selectedArticles.length > 0 ? selectedArticles : [orderArticles[0]?.name || 'Kurta'])
      : [selectedArticles || orderArticles[0]?.name || 'Kurta'];
    const seenArticles = new Set();
    const articlesToRender = [];
    for (const art of rawArticlesToRender) {
      const lower = (art || '').trim().toLowerCase();
      if (lower && !seenArticles.has(lower)) {
        seenArticles.add(lower);
        articlesToRender.push(art);
      }
    }

    const unitLabel = item.unit || (['Lace', 'Thread', 'Dori', 'Elastic'].some(k => matchesCategory(k, item.category)) ? 'MTR' : 'PCS');

    return (
      <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="table table-borderless align-middle mb-0" style={{ fontSize: '13px' }}>
          <thead>
            <tr className="text-muted text-uppercase" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', borderBottom: '1.5px solid #e2e8f0', whiteSpace: 'nowrap' }}>
              <th style={{ padding: '8px 10px' }}>Article</th>
              <th style={{ padding: '8px 10px' }}>Article Colour</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Garment Pcs</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Req / Pc</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Total Req Qty</th>
              <th style={{ padding: '8px 10px' }}>Placement</th>
              <th style={{ padding: '8px 10px' }}>Accessory Colour</th>
              <th style={{ padding: '8px 10px' }}>Size</th>
              <th style={{ padding: '8px 10px' }}>Source</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Buffer %</th>
            </tr>
          </thead>
          <tbody>
            {articlesToRender.map((currentArticle) => {
              const rows = getCardArticleRows(item, currentArticle);
              const colorOptions = getArticleColorOptions(currentArticle);
              const isBottom = /pant|plazo|palazzo|pajama|salwar|bottom|trouser/i.test(currentArticle || '');
              const artObj = (orderArticles || []).find(a => (a.name || '').toLowerCase() === (currentArticle || '').toLowerCase()) ||
                (order?.articles || []).find(a => (a.name || '').toLowerCase() === (currentArticle || '').toLowerCase());
              const totalArtQty = (artObj?.totalPieces !== undefined && artObj?.totalPieces !== null) ? Number(artObj.totalPieces) : (Number(order?.totalGarments) || 0);
              const totalAllQty = colorOptions.reduce((sum, co) => sum + (parseFloat(co.qty) || 0), 0) || totalArtQty;

              return rows.map((row, rIdx) => {
                const isAllColours = row.articleColor === 'All colours';
                const reqVal = parseFloat(row.reqPerPc) || 0;
                const packInput = row.extraPerPack !== undefined && row.extraPerPack !== null ? String(row.extraPerPack).trim() : '';
                const packNum = parseFloat(packInput);
                const packVal = (!isNaN(packNum) && packNum >= 0) ? packNum : 0;
                const defaultBuf = getAccessoryMasterBuffer(item, currentArticle);
                const bufVal = (row.bufferPct !== undefined && row.bufferPct !== null && row.bufferPct !== '')
                  ? (parseFloat(row.bufferPct) || 0)
                  : 0;
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
                    {/* 1. Article */}
                    <td style={{ minWidth: '110px', verticalAlign: 'middle', padding: '6px 8px' }}>
                      <div className="d-flex align-items-center gap-1.5 fw-semibold text-dark" style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                        <span>{isBottom ? '👖' : '👘'}</span>
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
                            FILLS ALL
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Article Colour */}
                    <td style={{ minWidth: '150px', padding: '6px 8px' }}>
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

                    {/* 3. Garment Pcs */}
                    <td style={{ textAlign: 'center', minWidth: '95px', padding: '6px 8px' }}>
                      <span className="badge fw-semibold" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontSize: '12px', padding: '6px 12px', borderRadius: '6px' }}>
                        {isAllColours ? (row.totalQty && row.totalQty !== '—' ? row.totalQty : totalAllQty) : (row.totalQty || 0)} pcs
                      </span>
                    </td>

                    {/* 4. Req / Pc */}
                    <td style={{ minWidth: '90px', padding: '6px 8px' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step={['Lace', 'Thread', 'Dori', 'Elastic'].some(k => matchesCategory(k, item.category)) ? '0.1' : '1'}
                          className="form-control form-control-sm text-center fw-bold"
                          value={row.reqPerPc ?? ''}
                          placeholder="0"
                          onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'reqPerPc', e.target.value)}
                          style={{ ...inputStyle, borderColor: '#818cf8', backgroundColor: '#ffffff' }}
                        />
                      ) : (
                        <span className="d-block text-center text-dark fw-bold" style={{ fontSize: '13px' }}>
                          {row.reqPerPc || '0'}
                        </span>
                      )}
                    </td>

                    {/* 5. Total Req Qty */}
                    <td style={{ textAlign: 'center', minWidth: '105px', padding: '6px 8px' }}>
                      <span className="badge fw-bold shadow-xs" style={{ backgroundColor: '#eef2ff', color: '#2e37a4', border: '1px solid #c7d2fe', fontSize: '12.5px', padding: '6px 12px', borderRadius: '6px' }}>
                        {liveTotal} {unitLabel}
                      </span>
                    </td>

                    {/* 6. Placement */}
                    <td style={{ minWidth: '130px', padding: '6px 8px' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Front Placket"
                          value={row.placement ?? ''}
                          onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'placement', e.target.value)}
                          style={inputStyle}
                        />
                      ) : (
                        <span className="text-dark" style={{ fontSize: '13px' }}>{row.placement || '—'}</span>
                      )}
                    </td>

                    {/* 7. Accessory Colour */}
                    <td style={{ minWidth: '135px', padding: '6px 8px' }}>
                      {isEditing ? (
                        getItemAvailableColors(item).length > 0 ? (
                          <select
                            className="form-select form-select-sm"
                            value={row.accessoryColor ?? ''}
                            onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'accessoryColor', e.target.value)}
                            style={selectStyle}
                          >
                            <option value="">Select Color</option>
                            {getItemAvailableColors(item).map((c, cIdx) => (
                              <option key={cIdx} value={c}>{c}</option>
                            ))}
                            {row.accessoryColor && !getItemAvailableColors(item).includes(row.accessoryColor) && (
                              <option value={row.accessoryColor}>{row.accessoryColor}</option>
                            )}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="e.g. Matching / White"
                            value={row.accessoryColor ?? ''}
                            onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'accessoryColor', e.target.value)}
                            style={inputStyle}
                          />
                        )
                      ) : (
                        <span className="text-dark" style={{ fontSize: '13px' }}>{row.accessoryColor || '—'}</span>
                      )}
                    </td>

                    {/* 8. Size */}
                    <td style={{ minWidth: '110px', padding: '6px 8px' }}>
                      {isEditing ? (
                        getItemAvailableSizes(item).length > 0 ? (
                          <select
                            className="form-select form-select-sm"
                            value={row.size ?? ''}
                            onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'size', e.target.value)}
                            style={selectStyle}
                          >
                            <option value="">Select Size</option>
                            {getItemAvailableSizes(item).map((s, sIdx) => <option key={sIdx} value={s}>{s}</option>)}
                            {row.size && !getItemAvailableSizes(item).includes(row.size) && (
                              <option value={row.size}>{row.size}</option>
                            )}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="e.g. 18L"
                            value={row.size ?? ''}
                            onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'size', e.target.value)}
                            style={inputStyle}
                          />
                        )
                      ) : (
                        <span className="text-dark" style={{ fontSize: '13px' }}>{row.size || '—'}</span>
                      )}
                    </td>

                    {/* 9. Source */}
                    <td style={{ minWidth: '125px', padding: '6px 8px' }}>
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
                      {isJobWork && (
                        <div className="mt-1">
                          {isEditing ? (
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Fabric Colour..."
                              value={row.fabricColor && row.fabricColor !== '—' ? row.fabricColor : ''}
                              onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'fabricColor', e.target.value)}
                              style={{ ...inputStyle, height: '28px', fontSize: '11px' }}
                            />
                          ) : (
                            <small className="text-muted" style={{ fontSize: '11px' }}>
                              Fab Col: {row.fabricColor || '—'}
                            </small>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 10. Buffer % */}
                    <td style={{ minWidth: '80px', padding: '6px 8px' }}>
                      {isEditing ? (
                        <div className="d-flex flex-column align-items-center">
                          <input
                            type="number"
                            min="0"
                            max={defaultBuf ?? 100}
                            step="0.5"
                            className="form-control form-control-sm text-center"
                            value={row.bufferPct !== undefined && row.bufferPct !== null ? row.bufferPct : ''}
                            placeholder=""
                            onKeyDown={(e) => {
                              if (['-', '+', 'e', 'E'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => handleUpdateCardRowField(item.id, currentArticle, rIdx, 'bufferPct', e.target.value)}
                            style={inputStyle}
                          />
                          <div className="text-muted text-center mt-1" style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            max {defaultBuf}%
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex flex-column align-items-center">
                          <span className="d-block text-center text-dark" style={{ fontSize: '13px' }}>
                            {bufVal > 0 ? `${bufVal}%` : '0%'}
                          </span>
                          <div className="text-muted text-center mt-0.5" style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            max {defaultBuf}%
                          </div>
                        </div>
                      )}
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
  const [isConsumptionEditing, setIsConsumptionEditing] = useState(() => {
    if (Array.isArray(order?.fabricConsumptions) && order.fabricConsumptions.length > 0) {
      const hasAnyFilled = order.fabricConsumptions.some(r => r.dyedRate && parseFloat(r.dyedRate) > 0);
      return !hasAnyFilled;
    }
    return true;
  });

  // Sourced directly from Fabric Master (Shrinkage % allowance per fabric quality)
  const getFabricMasterShrinkage = (fabricQuality) => {
    let allFabrics = Array.isArray(masterFabricsList) && masterFabricsList.length > 0 ? [...masterFabricsList] : [];
    try {
      const stored = getStoredData('raindrop_fabrics_v1', null);
      if (Array.isArray(stored) && stored.length > 0) {
        allFabrics = [...allFabrics, ...stored];
      }
    } catch (e) { }
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

    const isMockSample = !order || (!order.id && !order.styleName && (!order.articles || order.articles.length === 0));

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
        const matchingArt = (order?.articles || []).find(a => 
          (a.name || '').trim().toLowerCase() === (artName || '').trim().toLowerCase() ||
          (a.id || '').trim().toLowerCase() === (artName || '').trim().toLowerCase()
        );
        const artId = matchingArt?.id || '';

        order.customerOrders.forEach(cust => {
          Object.entries(cust.sizeConfigs || {}).forEach(([key, cfg]) => {
            const kLow = key.toLowerCase();
            const aLow = (artName || '').toLowerCase();
            const cLow = (colName || '').toLowerCase();
            const matchesArt = (artId && key.startsWith(`${artId}_`)) || (aLow && kLow.includes(aLow));
            const matchesCol = (cLow === '' || kLow.endsWith(`_${cLow}`) || kLow.includes(cLow));

            if (matchesArt && matchesCol) {
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

    // If order already has saved fabricConsumptions, initialize from them AND ensure all article fabrics are included
    if (Array.isArray(order?.fabricConsumptions) && order.fabricConsumptions.length > 0) {
      const existingRows = order.fabricConsumptions
        .filter(fc => {
          const p = parseInt(fc.pcs !== undefined ? fc.pcs : fc.pieces, 10);
          return !isNaN(p) && p > 0;
        })
        .map((fc, idx) => {
          const artName = fc.articleName || fc.article || (order?.articles?.[idx]?.name) || (idx === 0 ? 'Kurta' : idx === 1 ? 'Pant' : 'Dupatta');
          const artIdx = fc.articleIndex !== undefined
            ? fc.articleIndex
            : (order?.articles ? order.articles.findIndex(a => a.name === artName) : idx);
          const art = (order?.articles && order.articles[artIdx]) || {};
          const artFab = (art.fabrics || []).find(f => (f.fabricQuality || f.fabricName || '').toLowerCase() === (fc.fabricQuality || '').toLowerCase()) || art.fabrics?.[0] || {};
          const fabQuality = fc.fabricQuality || fc.fabricName || artFab.fabricQuality || artFab.fabricName || artFab.quality || art.fabricQuality || '';

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
          const buf = parseFloat(fc.maxBuffer || fc.bufferPercent || fc.bufferPct || artFab.maxBuffer || artFab.bufferPercent || artFab.bufferPct || 2);

          const roleStr = (fc.role || artFab.pieceLabel || artFab.role || '').toLowerCase();
          const isMain = roleStr === 'main' || fc.isMainFabric || (Array.isArray(art.fabrics) && art.fabrics[0] === artFab);

          const rawPcs = fc.pcs !== undefined ? fc.pcs : fc.pieces;
          const parsedPcs = rawPcs !== undefined && rawPcs !== null && rawPcs !== '' ? parseInt(rawPcs, 10) : NaN;
          
          let finalPcs = 0;
          if (fc._userEditedPcs && !isNaN(parsedPcs)) {
            finalPcs = parsedPcs;
          } else if (!isNaN(parsedPcs) && parsedPcs > 0) {
            finalPcs = parsedPcs;
          } else {
            const custPcs = getCustomerPcs(artName, fc.colorName);
            finalPcs = custPcs > 0 ? custPcs : (art.totalPieces || 0);
          }

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
            isMainFabric: isMain,
            locked: fc.locked !== undefined ? !!fc.locked : false,
            _userSelectedWidth: Boolean(initialWidth),
            _userEditedDyed: Boolean(rawDyed !== ''),
            _userEditedPcs: Boolean(fc._userEditedPcs)
          };
        });

      // Synchronize: check if any fabric requirement in order.articles is missing from existingRows
      articles.forEach((art, aIdx) => {
        const artName = art.name || (aIdx === 0 ? 'Kurta' : aIdx === 1 ? 'Pant' : 'Dupatta');
        const artFabrics = Array.isArray(art.fabrics) ? art.fabrics : [];
        if (artFabrics.length > 0) {
          artFabrics.forEach((artFab, fIdx) => {
            const fabName = artFab.fabricQuality || artFab.fabricName || artFab.quality || '';
            const role = autoCapitalizeWords(artFab.pieceLabel || artFab.role || (fIdx === 0 ? 'Main' : 'Outer'));

            const hasFabricRow = existingRows.some(r =>
              (r.articleName || '').toLowerCase() === artName.toLowerCase() &&
              (
                ((r.fabricQuality || '').toLowerCase() === fabName.toLowerCase() && fabName !== '') ||
                ((r.role || '').toLowerCase() === role.toLowerCase() && fIdx === 0)
              )
            );

            if (!hasFabricRow && fabName) {
              const existingArtRows = existingRows.filter(r => (r.articleName || '').toLowerCase() === artName.toLowerCase());
              const colsToUse = existingArtRows.length > 0
                ? Array.from(new Set(existingArtRows.map(r => r.colorName))).map(cName => {
                    const found = existingArtRows.find(r => r.colorName === cName);
                    return { colorName: cName, colorHex: found?.colorHex || colorHexMap[cName] || '#94a3b8' };
                  })
                : [{ colorName: 'Standard', colorHex: '#94a3b8' }];

              colsToUse.forEach((cObj, cIdx) => {
                const custPcs = getCustomerPcs(artName, cObj.colorName);
                const pcsVal = (artFab.pcs !== undefined && artFab.pcs !== null && artFab.pcs !== '')
                  ? (parseInt(artFab.pcs, 10) || 0)
                  : (custPcs > 0 ? custPcs : (art.totalPieces || 0));

                if (pcsVal > 0) {
                  const masterShrink = getFabricMasterShrinkage(fabName);
                  const buf = parseFloat(artFab.maxBuffer || artFab.bufferPercent || artFab.bufferPct || 2);
                  const defaultDyed = (artFab.consumption !== undefined && artFab.consumption !== null && artFab.consumption !== '' && artFab.consumption !== 1.5 && artFab.consumption !== '1.5')
                    ? artFab.consumption
                    : (art.consumption !== undefined && art.consumption !== null && art.consumption !== '' && art.consumption !== 1.5 && art.consumption !== '1.5' ? art.consumption : '');

                  existingRows.push({
                    key: `${artName}_${fabName}_${role}_${cObj.colorName}_${fIdx}_${cIdx}_synth`,
                    articleIndex: aIdx,
                    articleName: artName,
                    articleCode: artName.toUpperCase(),
                    articleIcon: art.icon || art.emoji || (artName.toLowerCase().includes('kurta') ? '👘' : artName.toLowerCase().includes('pant') ? '👖' : artName.toLowerCase().includes('dupatta') ? '🎀' : '👕'),
                    role: role,
                    fabricQuality: fabName,
                    source: artFab.source || art.sourcing || (artName.toLowerCase().includes('pant') ? 'Dyed Fabric' : 'Greige Fabric'),
                    width: resolveWidth(artFab.width) || '',
                    colorName: cObj.colorName,
                    colorHex: cObj.colorHex,
                    dyedRate: defaultDyed,
                    shrinkPct: masterShrink,
                    bufferPct: buf,
                    pcs: pcsVal,
                    isMainFabric: fIdx === 0 || role.toLowerCase() === 'main',
                    locked: false,
                    _userSelectedWidth: Boolean(resolveWidth(artFab.width)),
                    _userEditedDyed: Boolean(defaultDyed !== ''),
                    _userEditedPcs: false
                  });
                }
              });
            }
          });
        }
      });

      // Sort rows so fabrics belonging to the same article stay together in order of order.articles
      const artOrderMap = new Map();
      articles.forEach((a, i) => artOrderMap.set((a.name || '').toLowerCase(), i));

      existingRows.sort((a, b) => {
        const aIdx = artOrderMap.has((a.articleName || '').toLowerCase()) ? artOrderMap.get((a.articleName || '').toLowerCase()) : 999;
        const bIdx = artOrderMap.has((b.articleName || '').toLowerCase()) ? artOrderMap.get((b.articleName || '').toLowerCase()) : 999;
        if (aIdx !== bIdx) return aIdx - bIdx;
        const aIsMain = a.isMainFabric ? 0 : 1;
        const bIsMain = b.isMainFabric ? 0 : 1;
        if (aIsMain !== bIsMain) return aIsMain - bIsMain;
        return (a.articleIndex || 0) - (b.articleIndex || 0);
      });

      return existingRows;
    }

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
        const bufferVal = parseFloat(artFab.maxBuffer || artFab.bufferPercent || artFab.bufferPct || 2);
        const defaultDyed = (artFab.consumption !== undefined && artFab.consumption !== null && artFab.consumption !== '' && artFab.consumption !== 1.5 && artFab.consumption !== '1.5')
          ? artFab.consumption
          : (art.consumption !== undefined && art.consumption !== null && art.consumption !== '' && art.consumption !== 1.5 && art.consumption !== '1.5' ? art.consumption : '');

        // Dupatta might only have 1 color in sample
        const artColors = artName.toLowerCase().includes('dupatta') ? [colors[0] || 'Standard'] : colors;
        const fabricColor = artFab.color || artFab.colorName;
        const colorsForThisFab = (fabricColor && fabricColor !== 'All Colours' && fabricColor !== 'All')
          ? [fabricColor]
          : artColors;

        colorsForThisFab.forEach((col, cIdx) => {
          const custPcs = getCustomerPcs(artName, col);
          if (custPcs <= 0 && colorsForThisFab.length > 0) return;
          const isMainFabric = fIdx === 0 || (role || '').toLowerCase() === 'main';
          const pcsVal = (artFab.pcs !== undefined && artFab.pcs !== null && artFab.pcs !== '')
            ? (parseInt(artFab.pcs, 10) || 0)
            : (custPcs > 0 ? custPcs : (art.totalPieces || 0));

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
            isMainFabric: isMainFabric,
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

        let finalPieces = 0;
        let piecesDetermined = false;

        // 1. Authoritative: Compute directly from customerOrders sizeConfigs if available
        if (Array.isArray(order?.customerOrders) && order.customerOrders.some(c => c.sizeConfigs && Object.keys(c.sizeConfigs).length > 0)) {
          let sumCfg = 0;
          let hasMatchingCfg = false;
          order.customerOrders.forEach(cust => {
            Object.entries(cust.sizeConfigs || {}).forEach(([key, cfg]) => {
              const matchesArt = (item.id && key.startsWith(`${item.id}_`)) ||
                (name && key.toLowerCase().includes(name.toLowerCase()));
              if (matchesArt && cfg) {
                hasMatchingCfg = true;
                if (Array.isArray(cfg?.seriesConfigs)) {
                  cfg.seriesConfigs.forEach(sc => {
                    Object.values(sc.sizeQtys || {}).forEach(q => {
                      sumCfg += parseInt(q, 10) || 0;
                    });
                  });
                } else if (cfg?.sizeQtys) {
                  Object.values(cfg.sizeQtys || {}).forEach(q => {
                    sumCfg += parseInt(q, 10) || 0;
                  });
                }
              }
            });
          });
          if (hasMatchingCfg) {
            finalPieces = sumCfg;
            piecesDetermined = true;
          }
        }

        // 2. Authoritative: check item.totalPieces from order.articles if defined
        if (!piecesDetermined && item.totalPieces !== undefined && item.totalPieces !== null) {
          const rawPieces = parseInt(item.totalPieces, 10);
          if (!isNaN(rawPieces)) {
            finalPieces = rawPieces;
            piecesDetermined = true;
          }
        }

        // 3. Compute from fabricConsumptions GROUPED BY COLOR
        if (!piecesDetermined && Array.isArray(order?.fabricConsumptions) && order.fabricConsumptions.length > 0) {
          const matchingFc = order.fabricConsumptions.filter(
            fc => (fc.articleName || fc.article || '').toLowerCase().trim() === name.toLowerCase()
          );
          if (matchingFc.length > 0) {
            const colorMap = new Map();
            matchingFc.forEach(fc => {
              const cKey = (fc.colorName || 'standard').toLowerCase().trim();
              if (!colorMap.has(cKey)) {
                colorMap.set(cKey, parseInt(fc.pcs || fc.pieces, 10) || 0);
              }
            });
            finalPieces = Array.from(colorMap.values()).reduce((sum, p) => sum + p, 0);
            piecesDetermined = true;
          }
        }

        // 4. Fallback: ONLY for single-article legacy orders
        if (!piecesDetermined && rawArticles.length === 1 && totalOrderGarments > 0) {
          finalPieces = totalOrderGarments;
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
    // Only display articles with actual quantities (> 0 pcs)
    const withPieces = list.filter(art => (parseInt(art.totalPieces, 10) || 0) > 0);
    return withPieces.length > 0 ? withPieces : list;
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
      widthDyedRates,
      groupSelectedWidths,
      accessories: addedAccessories,
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
    if (order?.widthDyedRates && typeof order.widthDyedRates === 'object') {
      setWidthDyedRates({ ...order.widthDyedRates });
    }
    if (order?.groupSelectedWidths && typeof order.groupSelectedWidths === 'object') {
      setGroupSelectedWidths({ ...order.groupSelectedWidths });
    }
    setIsConsumptionEditing(false);
    setShowRateCalculation(false);
    setToastMessage('Changes cancelled.');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleToggleArticleSourcing = (artName, mode, fabricQuality, role) => {
    setArticleSourcing(prev => {
      const next = { ...prev };
      if (fabricQuality) {
        const groupKey = `${artName}___${fabricQuality}___${role || ''}`;
        const fabricKey = `${artName}_${fabricQuality}`;
        next[groupKey] = mode;
        next[fabricKey] = mode;
      } else {
        next[artName] = mode;
        Object.keys(next).forEach(k => {
          if (k === artName || k.startsWith(`${artName}___`) || k.startsWith(`${artName}_`)) {
            next[k] = mode;
          }
        });
      }
      return next;
    });

    setConsumptionRows(prev => prev.map(r => {
      const matchArt = (r.articleName || '').toLowerCase() === (artName || '').toLowerCase();
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

  // Multi-width and width-specific dyed rate storage
  const [widthDyedRates, setWidthDyedRates] = useState(() => {
    const initial = {};
    if (order?.widthDyedRates && typeof order.widthDyedRates === 'object') {
      Object.assign(initial, order.widthDyedRates);
    }
    const rows = Array.isArray(order?.fabricConsumptions) ? order.fabricConsumptions : [];
    rows.forEach(r => {
      if (r.articleName && r.width && r.dyedRate !== undefined && r.dyedRate !== null) {
        const k = `${r.articleName}___${r.fabricQuality || ''}___${r.role || ''}___${r.width}`;
        if (initial[k] === undefined) {
          initial[k] = r.dyedRate;
        }
      }
    });
    return initial;
  });

  // Multi-select width storage per article fabric group
  const [groupSelectedWidths, setGroupSelectedWidths] = useState(() => {
    const initial = {};
    if (order?.groupSelectedWidths && typeof order.groupSelectedWidths === 'object') {
      Object.assign(initial, order.groupSelectedWidths);
    }
    const rows = Array.isArray(order?.fabricConsumptions) ? order.fabricConsumptions : [];
    rows.forEach(r => {
      if (r.articleName && r.width && (r._userSelectedWidth || order?.groupSelectedWidths)) {
        const k = `${r.articleName}___${r.fabricQuality || ''}___${r.role || ''}`;
        if (!initial[k]) {
          initial[k] = [r.width];
        } else if (!initial[k].includes(r.width)) {
          initial[k].push(r.width);
        }
      }
    });
    return initial;
  });

  // State to manage which fabric group has its width multi-select popover open
  const [activeWidthDropdownKey, setActiveWidthDropdownKey] = useState(null);
  const [customWidthMap, setCustomWidthMap] = useState({});

  const getSelectedWidthsForGroup = (grp, options) => {
    const k = `${grp.articleName}___${grp.fabricQuality || ''}___${grp.role || ''}`;
    const stored = groupSelectedWidths[k];
    if (Array.isArray(stored)) {
      return stored;
    }
    if (grp.width && options.includes(grp.width) && grp._userSelectedWidth) {
      return [grp.width];
    }
    return []; // No default pre-fill!
  };

  const handleToggleGroupWidth = (artName, fabricQuality, role, targetWidth, options) => {
    const cleanWidth = targetWidth === '—' ? '' : targetWidth;
    const k = `${artName}___${fabricQuality || ''}___${role || ''}`;
    setGroupSelectedWidths(prev => {
      const currentList = (prev[k] && Array.isArray(prev[k]))
        ? [...prev[k]]
        : [];

      let nextList;
      if (currentList.includes(cleanWidth)) {
        nextList = currentList.filter(x => x !== cleanWidth);
      } else {
        nextList = [...currentList, cleanWidth];
      }

      setConsumptionRows(prevRows => prevRows.map(r => {
        const matchArt = r.articleName === artName;
        const matchFab = !fabricQuality || r.fabricQuality === fabricQuality;
        const matchRole = !role || !r.role || r.role.toLowerCase() === role.toLowerCase();
        if (matchArt && matchFab && matchRole) {
          const nextDyed = (storedRate !== undefined && storedRate !== null && storedRate !== '')
            ? (parseFloat(storedRate) || 0)
            : (parseFloat(r.dyedRate) || 0);
          return {
            ...r,
            width: primaryW,
            dyedRate: nextDyed,
            _userSelectedWidth: Boolean(primaryW)
          };
        }
        return r;
      }));

      return { ...prev, [k]: nextList };
    });
  };

  const handleSelectWidthForGroup = (artName, newWidth, fabricQuality, role) => {
    const cleanWidth = newWidth === '—' ? '' : newWidth;
    const k = `${artName}___${fabricQuality || ''}___${role || ''}`;
    const rateKey = `${artName}___${fabricQuality || ''}___${role || ''}___${cleanWidth}`;
    const storedRate = widthDyedRates[rateKey];

    setGroupSelectedWidths(prev => ({
      ...prev,
      [k]: cleanWidth ? [cleanWidth] : []
    }));

    setConsumptionRows(prev => prev.map(r => {
      const matchArt = r.articleName === artName;
      const matchFab = !fabricQuality || r.fabricQuality === fabricQuality;
      const matchRole = !role || !r.role || r.role.toLowerCase() === role.toLowerCase();
      if (matchArt && matchFab && matchRole) {
        const nextDyed = (storedRate !== undefined && storedRate !== null && storedRate !== '')
          ? (parseFloat(storedRate) || 0)
          : (parseFloat(r.dyedRate) || 0);
        return {
          ...r,
          width: cleanWidth,
          dyedRate: nextDyed,
          _userSelectedWidth: Boolean(cleanWidth)
        };
      }
      return r;
    }));
  };

  const handleUpdateWidthDyedRate = (artName, fabricQuality, role, width, val) => {
    const rateKey = `${artName}___${fabricQuality || ''}___${role || ''}___${width}`;
    // Store val directly in widthDyedRates so user can type decimals without reset
    setWidthDyedRates(prev => ({ ...prev, [rateKey]: val }));

    const num = val === '' ? 0 : (parseFloat(val) || 0);
    setConsumptionRows(prev => prev.map(r => {
      const matchArt = r.articleName === artName;
      const matchFab = !fabricQuality || r.fabricQuality === fabricQuality;
      const matchRole = !role || !r.role || r.role.toLowerCase() === role.toLowerCase();
      if (matchArt && matchFab && matchRole) {
        const currentActiveWidth = r.width || width;
        if (currentActiveWidth === width) {
          return { ...r, width: width, dyedRate: num, _userEditedDyed: true };
        }
      }
      return r;
    }));
  };

  const handleUpdateArticleWidth = (artName, newWidth, fabricQuality, role) => {
    handleSelectWidthForGroup(artName, newWidth, fabricQuality, role);
  };

  // Sourced directly from Fabric Master (Section 3.2 & Order Consumption)
  const getFabricMasterWidths = (fabricQuality, currentWidth) => {
    let allFabrics = masterFabricsList;
    if (!allFabrics || allFabrics.length === 0) {
      try {
        const stored = getStoredData('raindrop_fabrics_v1', null);
        if (Array.isArray(stored)) allFabrics = stored;
      } catch (e) { }
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
        const k = `${artName}___${fabricQuality || ''}___${role || ''}___${r.width || ''}`;
        setWidthDyedRates(p => ({ ...p, [k]: num }));
        return { ...r, dyedRate: num, _userEditedDyed: true };
      }
      return r;
    }));
  };

  const handleUpdateRowPcs = (rowKey, val) => {
    const num = val === '' ? '' : (parseInt(val, 10) || 0);
    setConsumptionRows(prev => prev.map(r => {
      if (r.key === rowKey) {
        return { ...r, pcs: num, _userEditedPcs: true };
      }
      return r;
    }));
  };

  const handleUpdateSummaryDyedRate = (fabricName, width, val) => {
    const num = val === '' ? '' : (parseFloat(val) || 0);
    setConsumptionRows(prev => prev.map(r => {
      const matchFab = (r.fabricQuality || '').toLowerCase() === (fabricName || '').toLowerCase();
      const matchWidth = (r.width || '') === (width || '') || (!r.width && !width);
      if (matchFab && matchWidth) {
        return { ...r, dyedRate: num, _userEditedDyed: true };
      }
      return r;
    }));
  };

  const [showRateCalculation, setShowRateCalculation] = useState(false);
  const [customMarketRates, setCustomMarketRates] = useState({});

  // Group consumption rows hierarchically by Article -> Fabric Quality/Role -> Color rows
  const articleSections = useMemo(() => {
    const articleMap = new Map();

    // Preserve order of articles from order.articles
    const orderArticles = Array.isArray(order?.articles) ? order.articles : [];
    orderArticles.forEach((art, aIdx) => {
      const aName = art.name || (aIdx === 0 ? 'Kurta' : aIdx === 1 ? 'Pant' : 'Dupatta');
      if (!articleMap.has(aName)) {
        articleMap.set(aName, {
          articleName: aName,
          articleCode: (art.code || aName).toUpperCase(),
          articleIndex: aIdx,
          icon: art.icon || art.emoji || (aName.toLowerCase().includes('kurta') ? '👘' : aName.toLowerCase().includes('pant') ? '👖' : aName.toLowerCase().includes('dupatta') ? '🎀' : '👕'),
          fabricMap: new Map()
        });
      }
    });

    consumptionRows.forEach((row, rIdx) => {
      const artName = row.articleName || 'Article';
      if (!articleMap.has(artName)) {
        articleMap.set(artName, {
          articleName: artName,
          articleCode: (row.articleCode || artName).toUpperCase(),
          articleIndex: row.articleIndex !== undefined ? row.articleIndex : articleMap.size,
          icon: row.articleIcon || (artName.toLowerCase().includes('kurta') ? '👘' : artName.toLowerCase().includes('pant') ? '👖' : artName.toLowerCase().includes('dupatta') ? '🎀' : '👕'),
          fabricMap: new Map()
        });
      }

      const artEntry = articleMap.get(artName);
      const fabQuality = row.fabricQuality || '';
      const role = row.role || '';
      const fabKey = `${fabQuality}___${role}`;

      if (!artEntry.fabricMap.has(fabKey)) {
        const groupKey = `${artName}___${fabQuality}___${role}`;
        const sourcingKey = `${artName}_${fabQuality}`;
        const sourcingMode = (
          articleSourcing[artName] ||
          articleSourcing[groupKey] ||
          articleSourcing[sourcingKey] ||
          row.source ||
          'Greige'
        ).toLowerCase().includes('dyed') ? 'Dyed' : 'Greige';

        const masterShrink = getFabricMasterShrinkage(fabQuality);

        artEntry.fabricMap.set(fabKey, {
          key: groupKey,
          articleName: artName,
          fabricQuality: fabQuality,
          role: role,
          width: row.width || '',
          sourcing: sourcingMode,
          shrinkPct: masterShrink,
          dyedRate: row.dyedRate,
          rows: []
        });
      }

      artEntry.fabricMap.get(fabKey).rows.push({ ...row, originalIndex: rIdx });
    });

    const sections = [];
    articleMap.forEach(artEntry => {
      const fabricGroups = Array.from(artEntry.fabricMap.values()).filter(fg => fg.rows.length > 0);
      const totalArticlePcs = fabricGroups.reduce((sum, fg) => {
        return sum + fg.rows.reduce((rSum, r) => rSum + (parseInt(r.pcs, 10) || 0), 0);
      }, 0);

      const totalRows = fabricGroups.reduce((sum, fg) => sum + fg.rows.length, 0);

      if (totalRows > 0 && totalArticlePcs > 0) {
        const artSourcing = (
          articleSourcing[artEntry.articleName] ||
          (fabricGroups[0] && fabricGroups[0].sourcing) ||
          'Greige'
        );

        sections.push({
          ...artEntry,
          sourcing: artSourcing,
          totalRows: totalRows,
          fabricGroups: fabricGroups
        });
      }
    });

    return sections;
  }, [consumptionRows, articleSourcing, masterFabricsList, order]);

  // Determines if Shrink % column should be visible (hidden when all articles/fabrics are Dyed, visible when any article/fabric is Greige)
  const showShrinkColumn = useMemo(() => {
    if (articleSections && articleSections.length > 0) {
      return articleSections.some(sec => {
        if (sec.sourcing !== 'Dyed') return true;
        return (sec.fabricGroups || []).some(fg => fg.sourcing !== 'Dyed');
      });
    }
    return consumptionRows.some(r => !(r.source || '').toLowerCase().includes('dyed'));
  }, [articleSections, consumptionRows]);

  // Group subtotals for bottom summary rows matching Image 4
  const fabricSummaryRows = useMemo(() => {
    const map = new Map();
    consumptionRows.forEach(r => {
      const pcs = parseInt(r.pcs, 10) || 0;
      if (pcs <= 0) return; // Exclude 0 pcs rows from summary totals
      const fabName = r.fabricQuality || 'Fabric';
      const width = r.width && r.width !== '—' ? r.width : '';
      const key = `${fabName}_${width}`;
      const groupKey = `${r.articleName}___${r.fabricQuality}___${r.role}`;
      const sourcingKey = `${r.articleName}_${r.fabricQuality}`;
      const artSourcing = (articleSourcing[groupKey] || articleSourcing[sourcingKey] || r.source || 'Greige').toLowerCase();
      const isDyed = artSourcing.includes('dyed');
      const masterShrink = getFabricMasterShrinkage(fabName);
      const shrink = isDyed ? 0 : masterShrink;
      const rateKey = `${r.articleName}___${r.fabricQuality || ''}___${r.role || ''}___${width}`;
      const storedRate = widthDyedRates[rateKey];
      const dyed = (storedRate !== undefined && storedRate !== null && storedRate !== '')
        ? (parseFloat(storedRate) || 0)
        : (parseFloat(r.dyedRate) || 0);
      const greigePerPc = dyed > 0 ? (isDyed ? dyed : dyed * (1 + shrink / 100)) : 0;
      const totalDyed = dyed > 0 ? dyed * pcs : 0;
      const totalGreige = greigePerPc > 0 ? greigePerPc * pcs : 0;

      if (!map.has(key)) {
        map.set(key, {
          fabricName: fabName,
          width: width,
          shrinkPct: shrink,
          pcs: 0,
          totalDyed: 0,
          totalGreige: 0,
          dyedRates: [],
          hasValues: false
        });
      }
      const cur = map.get(key);
      cur.pcs += pcs;
      cur.totalDyed += totalDyed;
      cur.totalGreige += totalGreige;
      if (dyed > 0) {
        cur.dyedRates.push(dyed);
        cur.hasValues = true;
      }
    });
    return Array.from(map.values()).map(cur => {
      const avgDyed = cur.dyedRates.length > 0 ? cur.dyedRates[0] : '';
      const numDyed = parseFloat(avgDyed) || 0;
      const avgGreige = numDyed > 0 ? (cur.shrinkPct ? numDyed * (1 + cur.shrinkPct / 100) : numDyed) : 0;
      return {
        ...cur,
        avgDyed,
        avgGreige
      };
    });
  }, [consumptionRows, articleSourcing, masterFabricsList, widthDyedRates]);

  // Section 8 Rate Calculations & Intelligent Recommendation Engine (Calculates across ALL available widths, separated by Article and Fabric)
  const rateCalculations = useMemo(() => {
    // Group consumption rows by Article AND Fabric Quality (e.g. Kurta - Grey, Pant - Cotton 100*100, Dupatta - Grey)
    const groups = new Map();

    consumptionRows.forEach((r, rIdx) => {
      const pcs = parseInt(r.pcs, 10) || 0;
      if (pcs <= 0) return; // Exclude 0 pcs rows
      const artName = r.articleName || 'Article';
      const fabName = r.fabricQuality || 'Fabric';
      const role = r.role || '';
      const groupKey = `${artName}___${fabName}___${role}`;

      if (!groups.has(groupKey)) {
        const sourcingKey = `${artName}_${fabName}`;
        const artSourcing = (
          articleSourcing[artName] ||
          articleSourcing[groupKey] ||
          articleSourcing[sourcingKey] ||
          r.source ||
          'Greige'
        ).toLowerCase().includes('dyed') ? 'Dyed' : 'Greige';

        const isBottom = /pant|plazo|palazzo|pajama|salwar|bottom|trouser/i.test(artName);
        const isDupatta = /dupatta|chunri|scarf|stole/i.test(artName);
        const artIcon = r.articleIcon || (isBottom ? '👖' : isDupatta ? '🎀' : '👘');

        groups.set(groupKey, {
          groupKey,
          articleName: artName,
          articleIcon: artIcon,
          articleIndex: r.articleIndex !== undefined ? r.articleIndex : rIdx,
          fabricName: fabName,
          role: role,
          sourcing: artSourcing,
          isDyed: artSourcing === 'Dyed',
          selectedWidth: r.width && r.width !== '—' ? r.width : '44"',
          rows: []
        });
      }

      groups.get(groupKey).rows.push(r);
    });

    const results = [];

    // Sort groups to match order of articles
    const sortedGroups = Array.from(groups.values()).sort((a, b) => a.articleIndex - b.articleIndex);

    sortedGroups.forEach((grp) => {
      const pcs = grp.rows.reduce((sum, r) => sum + (parseInt(r.pcs, 10) || 0), 0);
      const currentSelectedWidth = grp.selectedWidth || '44"';
      const currentWidthInches = parseFloat(String(currentSelectedWidth).replace(/"/g, '')) || 44;

      // Calculate base metres for this article and fabric for the selected width
      let currentBaseMetres = 0;
      grp.rows.forEach(r => {
        const rPcs = parseInt(r.pcs, 10) || 0;
        const rateKey = `${r.articleName}___${r.fabricQuality || ''}___${r.role || ''}___${currentSelectedWidth}`;
        const storedRate = widthDyedRates[rateKey];
        const dyed = (storedRate !== undefined && storedRate !== null && storedRate !== '')
          ? (parseFloat(storedRate) || 0)
          : (parseFloat(r.dyedRate) || 0);
        const shrink = grp.isDyed ? 0 : getFabricMasterShrinkage(grp.fabricName);
        const greigePerPc = grp.isDyed ? dyed : (dyed > 0 ? dyed * (1 + shrink / 100) : 0);
        currentBaseMetres += ((grp.isDyed ? dyed : greigePerPc) * rPcs);
      });

      // Fetch ALL available widths for this fabric quality from Fabric Master
      const allWidths = getFabricMasterWidths(grp.fabricName, currentSelectedWidth);

      // Ensure widths configured by user in groupSelectedWidths are included
      const userSelected = groupSelectedWidths[grp.groupKey];
      if (Array.isArray(userSelected)) {
        userSelected.forEach(uw => {
          if (uw && !allWidths.includes(uw)) {
            allWidths.push(uw);
          }
        });
      }

      allWidths.forEach(w => {
        const isSelected = w === currentSelectedWidth;
        const targetWidthInches = parseFloat(String(w).replace(/"/g, '')) || 44;

        // Check if user has entered specific consumption rate for this width 'w' across matching rows:
        let hasCustomWidthRate = false;
        let calculatedMetresForWidth = 0;
        const isUserConfiguredWidth = Array.isArray(userSelected) && userSelected.includes(w);

        if (isUserConfiguredWidth) {
          grp.rows.forEach(r => {
            const rateKey = `${r.articleName}___${r.fabricQuality || ''}___${r.role || ''}___${w}`;
            const storedRate = widthDyedRates[rateKey];
            const wVal = (storedRate !== undefined && storedRate !== null && storedRate !== '')
              ? parseFloat(storedRate)
              : ((r.width === w && r.dyedRate) ? parseFloat(r.dyedRate) : 0);

            if (!isNaN(wVal) && wVal > 0) {
              hasCustomWidthRate = true;
              const rPcs = parseInt(r.pcs, 10) || 0;
              const shrink = grp.isDyed ? 0 : getFabricMasterShrinkage(grp.fabricName);
              const greigePerPc = grp.isDyed ? wVal : (wVal * (1 + shrink / 100));
              calculatedMetresForWidth += ((grp.isDyed ? wVal : greigePerPc) * rPcs);
            }
          });
        }

        let totalMetres = 0;
        if (currentBaseMetres > 0) {
          if (hasCustomWidthRate && calculatedMetresForWidth > 0) {
            totalMetres = calculatedMetresForWidth;
          } else if (isSelected) {
            totalMetres = currentBaseMetres;
          } else if (targetWidthInches > 0 && currentWidthInches > 0) {
            totalMetres = currentBaseMetres * (currentWidthInches / targetWidthInches);
          }
        }

        const rateKey = `${grp.articleName}_${grp.fabricName}_${w}`;
        const fallbackFabricRateKey = `${grp.fabricName}_${w}`;
        const userTypedRate = customMarketRates[rateKey] ?? customMarketRates[fallbackFabricRateKey];
        const hasCustomRate = userTypedRate !== undefined && userTypedRate !== '' && !isNaN(parseFloat(userTypedRate));
        const effectiveRate = hasCustomRate ? (parseFloat(userTypedRate) || 0) : 0;

        const totalCost = effectiveRate > 0 ? (totalMetres * effectiveRate) : 0;
        const costPerGarment = (pcs > 0 && totalCost > 0) ? (totalCost / pcs) : 0;

        results.push({
          articleName: grp.articleName,
          articleIcon: grp.articleIcon,
          fabricName: grp.fabricName,
          role: grp.role,
          width: w,
          isSelected,
          isDyed: grp.isDyed,
          rateKey,
          ratePerMetre: effectiveRate,
          totalMetres,
          totalCost,
          costPerGarment,
          pcs
        });
      });
    });

    return results;
  }, [consumptionRows, articleSourcing, masterFabricsList, customMarketRates, widthDyedRates, groupSelectedWidths]);

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
      stage: 'Confirmed',
      hasProceededToNextStep: true
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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name);

    const onFileReady = (url) => {
      const newP = {
        id: Date.now(),
        type: photoType || 'Reference',
        caption: photoCaption.trim() || file.name,
        fileName: file.name,
        url: url || '',
        isImage: isImg,
        date: new Date().toLocaleDateString('en-GB')
      };
      setPhotos(prev => {
        const updated = [newP, ...prev];
        if (onUpdateOrder && order) {
          onUpdateOrder({ ...order, photos: updated });
        }
        return updated;
      });
      setPhotoCaption('');
      setPhotoFileName('');
      e.target.value = '';
      setToastMessage('Photo / File added successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    };

    if (isImg) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        onFileReady(loadEvt.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      onFileReady('');
    }
  };

  const handleRemovePhoto = (photoId) => {
    setPhotos(prev => {
      const updated = prev.filter(p => p.id !== photoId);
      if (onUpdateOrder && order) {
        onUpdateOrder({ ...order, photos: updated });
      }
      return updated;
    });
    setToastMessage('Photo removed successfully');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleUploadPhoto = (e) => {
    if (e && e.preventDefault) e.preventDefault();
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

  const handleDeleteConsumptionRow = (rowKey, origIndex) => {
    setConsumptionRows(prev => {
      const updated = prev.filter((r, idx) => r.key !== rowKey && idx !== origIndex);
      try {
        const saved = getStoredData('erp_sales_orders_v1', []);
        const updatedOrder = { ...order, fabricConsumptions: updated };
        const newOrders = [updatedOrder, ...saved.filter(o => o.id !== updatedOrder.id)];
        setStoredData('erp_sales_orders_v1', newOrders);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('erp_sales_order_updated', { detail: updatedOrder }));
        }
      } catch (e) { }
      return updated;
    });
  };

  const handleUpdateRowColor = (rowKey, origIndex, newColorName) => {
    setConsumptionRows(prev => {
      const updated = prev.map((r, idx) => {
        if (r.key !== rowKey && idx !== origIndex) return r;
        const newPcs = getCustomerPcs(r.articleName, newColorName);
        return {
          ...r,
          colorName: newColorName,
          pcs: newPcs
        };
      });
      try {
        const saved = getStoredData('erp_sales_orders_v1', []);
        const updatedOrder = { ...order, fabricConsumptions: updated };
        const newOrders = [updatedOrder, ...saved.filter(o => o.id !== updatedOrder.id)];
        setStoredData('erp_sales_orders_v1', newOrders);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('erp_sales_order_updated', { detail: updatedOrder }));
        }
      } catch (e) { }
      return updated;
    });
  };

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
                className={`badge border rounded-2 px-2.5 py-1 fw-medium d-inline-flex align-items-center gap-1.5 ${confirmed
                    ? 'bg-success-subtle text-success border-success-subtle'
                    : (order.status === 'Draft' && !order.hasProceededToNextStep)
                      ? 'bg-light text-secondary border-secondary-subtle'
                      : 'bg-warning-subtle text-warning border-warning-subtle'
                  }`}
                style={{ fontSize: '12px' }}
              >
                <i className={confirmed ? 'ti ti-check text-success' : (order.status === 'Draft' && !order.hasProceededToNextStep) ? 'ti ti-file-text text-muted' : 'ti ti-clock text-warning'} style={{ fontSize: '13px', lineHeight: 1 }}></i>
                {confirmed ? 'Confirmed' : (order.status || 'Pending Confirmation')}
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
          {onEditSection && !confirmed && (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3 fw-semibold shadow-xs"
              onClick={() => onEditSection('all')}
              title="Edit order details, styles, and customer quantities"
            >
              <i className="ti ti-edit fs-14"></i>
              <span>{order?.status === 'Draft' && !order?.hasProceededToNextStep ? 'Edit Draft Order' : 'Edit Order'}</span>
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
              {onEditSection && !confirmed && (
                <li>
                  <button
                    type="button"
                    className="dropdown-item py-2 d-flex align-items-center gap-2"
                    onClick={() => onEditSection('all')}
                  >
                    <i className="ti ti-edit text-primary" style={{ fontSize: '16px', lineHeight: 1 }}></i> {order?.status === 'Draft' && !order?.hasProceededToNextStep ? 'Edit Draft Order' : 'Edit Order'}
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
      {order?.status === 'Draft' && !order?.hasProceededToNextStep && (
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
          const isDupatta = /dupatta|stole|chunri|scarf/i.test(art.name || '');
          const artIcon = art.icon || (isBottom ? '👖' : isDupatta ? '🧣' : '👕');
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
                      {art.totalPieces !== undefined && art.totalPieces !== null ? art.totalPieces : (order?.totalGarments || 0)} pcs
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
                          # Avg. Length {isDupatta ? '(mts)' : '(in)'}:
                        </span>
                        {editingLengthIdx === aIdx ? (
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              className="form-control form-control-sm"
                              style={{ width: '90px' }}
                              placeholder={isDupatta ? "e.g. 2.25" : "e.g. 45"}
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
                            {parseFloat(art.avgGarmentLength).toFixed(2)} {isDupatta ? 'mts' : 'inches'}
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

        {/* File Select Row (Uploads automatically on selection, no Upload button needed) */}
        <div className="row g-2 align-items-end mb-4">
          <div className="col-12 col-sm-4 col-md-3">
            <label className="form-label small text-muted mb-1">Type</label>
            <select
              className="form-select form-select-sm rounded-3 bg-white"
              value={photoType}
              onChange={(e) => setPhotoType(e.target.value)}
            >
              <option value="Reference">Reference</option>
              <option value="Fabric Swatch">Fabric Swatch</option>
              <option value="Sample">Sample</option>
              <option value="QC Defect">QC Defect</option>
            </select>
          </div>
          <div className="col-12 col-sm-4 col-md-4">
            <label className="form-label small text-muted mb-1">Caption / Description</label>
            <input
              type="text"
              className="form-control form-control-sm rounded-3 bg-white"
              placeholder="Optional description"
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
            />
          </div>
          <div className="col-12 col-sm-4 col-md-5">
            <label className="form-label small text-muted mb-1">File (Select to add directly)</label>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="form-control form-control-sm rounded-3 bg-white"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {/* Photos Empty State */}
        {photos.length === 0 ? (
          <div className="p-4 text-center rounded-3 bg-light border" style={{ borderColor: '#f1f5f9' }}>
            <div className="text-muted mb-2">
              <i className="ti ti-photo text-secondary opacity-50" style={{ fontSize: '38px', lineHeight: 1 }}></i>
            </div>
            <p className="text-muted small mb-0">
              No photos or files yet. Choose a file above to add reference images, fabric swatches, or samples.
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {photos.map((p) => {
              const hasImg = Boolean(p.url || p.dataUrl || (p.isImage && p.url));
              return (
                <div key={p.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <div
                    className="card border rounded-3 overflow-hidden shadow-2xs position-relative h-100 bg-white"
                    style={{ borderColor: '#e2e8f0', transition: 'box-shadow 0.2s ease' }}
                  >
                    {/* Close / Delete button on top-right corner */}
                    <button
                      type="button"
                      className="btn btn-sm btn-light rounded-circle shadow-sm position-absolute d-flex align-items-center justify-content-center"
                      style={{
                        top: '8px',
                        right: '8px',
                        width: '28px',
                        height: '28px',
                        padding: 0,
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #ef4444',
                        color: '#ef4444',
                        zIndex: 10,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}
                      title="Remove file"
                      onClick={() => handleRemovePhoto(p.id)}
                    >
                      <i className="ti ti-x" style={{ fontSize: '14px', fontWeight: 'bold' }}></i>
                    </button>

                    {/* Image Thumbnail / File Preview */}
                    {hasImg ? (
                      <div
                        style={{
                          width: '100%',
                          height: '160px',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        <img
                          src={p.url || p.dataUrl}
                          alt={p.caption || p.fileName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div
                          style={{
                            display: 'none',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            color: '#6366f1'
                          }}
                        >
                          <i className="ti ti-photo" style={{ fontSize: '36px' }}></i>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '130px',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#64748b',
                          borderBottom: '1px solid #e2e8f0'
                        }}
                      >
                        <i className="ti ti-file-text" style={{ fontSize: '36px', color: '#6366f1' }}></i>
                        <span className="small text-muted text-truncate px-3 mt-1" style={{ maxWidth: '100%' }}>
                          {p.fileName}
                        </span>
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="p-3 d-flex flex-column gap-1">
                      <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                        <span
                          className="badge fw-semibold rounded-pill px-2.5 py-1"
                          style={{
                            backgroundColor: '#eef2ff',
                            color: '#4361ee',
                            fontSize: '11px',
                            border: '1px solid #c7d2fe'
                          }}
                        >
                          {p.type || 'Reference'}
                        </span>
                        <span className="text-muted" style={{ fontSize: '11px' }}>{p.date}</span>
                      </div>
                      {p.caption && (
                        <strong className="text-dark small text-truncate" title={p.caption}>
                          {p.caption}
                        </strong>
                      )}
                      <span className="text-muted small text-truncate" style={{ fontSize: '11.5px' }} title={p.fileName}>
                        <i className="ti ti-paperclip me-1"></i>{p.fileName}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
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
            paddingBottom: '40px'
          }}
        >
          <style>{`
            .excel-bom-table {
              border-collapse: collapse !important;
              border: 1px solid #cbd5e1 !important;
            }
            .excel-bom-table th,
            .excel-bom-table td {
              border: 1px solid #cbd5e1 !important;
              transition: none !important;
            }
            .excel-bom-table thead th {
              background-color: #f1f5f9 !important;
              color: #334155 !important;
              font-weight: 600 !important;
              border: 1px solid #cbd5e1 !important;
              padding: 8px 10px !important;
              user-select: none;
            }
            .excel-bom-table tbody tr {
              background-color: #ffffff !important;
              transition: none !important;
            }
            .excel-bom-table tbody tr:hover {
              background-color: #ffffff !important;
            }
            .excel-bom-table tbody tr:hover td {
              background-color: inherit !important;
            }
            .excel-bom-table * {
              transition: none !important;
              animation: none !important;
            }
            .excel-bom-table button:hover,
            .excel-bom-table input:hover,
            .excel-bom-table div:hover {
              box-shadow: none !important;
              transform: none !important;
            }
            .excel-bom-table input:focus {
              outline: 2px solid #2563eb !important;
              outline-offset: -1px !important;
              border-color: #2563eb !important;
              box-shadow: none !important;
            }
          `}</style>
          <table
            className="table align-middle mb-0 excel-bom-table"
            style={{
              fontSize: '12.5px',
              borderCollapse: 'collapse',
              width: '100%',
              minWidth: '940px',
              border: '1px solid #cbd5e1'
            }}
          >
            <thead>
              <tr>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '8px 10px', textAlign: 'left' }}>Article</th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '8px 10px', textAlign: 'left' }}>Fabric</th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '8px 10px', textAlign: 'left' }}>Colour</th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '8px 8px', textAlign: 'center' }}>
                  Width<br /><span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b' }}>(in)</span>
                </th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '8px 8px', textAlign: 'center' }}>
                  Dyed<br /><span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b' }}>(m/pc)</span>
                </th>
                {showShrinkColumn && (
                  <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '8px 8px', textAlign: 'center' }}>Shrink %</th>
                )}
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '8px 8px', textAlign: 'center' }}>
                  Greige<br /><span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b' }}>(m/pc)</span>
                </th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '8px 8px', textAlign: 'center' }}>Pcs</th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '8px 8px', textAlign: 'center' }}>Total Dyed</th>
                <th style={{ fontWeight: 600, fontSize: '11.5px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '8px 8px', textAlign: 'center' }}>Total Greige</th>
              </tr>
            </thead>
            <tbody>
              {articleSections.map((section) => {
                let isFirstRowOfArticle = true;

                return section.fabricGroups.map((group, gIdx) => {
                  const isDyedSourced = group.sourcing === 'Dyed';
                  const dyedVal = parseFloat(group.dyedRate) || 0;
                  const hasDyedVal = dyedVal > 0;
                  const shrinkPct = isDyedSourced ? 0 : (group.shrinkPct || 0);

                  const widthOptions = getFabricMasterWidths(group.fabricQuality, group.width);
                  const selectedWidths = getSelectedWidthsForGroup(group, widthOptions);
                  const widthsToRender = selectedWidths.length > 0 ? selectedWidths : [''];

                  return group.rows.map((row, rIdx) => {
                    const isFirstRow = rIdx === 0;
                    const pcs = parseInt(row.pcs, 10) || 0;
                    const greigePerPc = hasDyedVal ? (isDyedSourced ? dyedVal : dyedVal * (1 + shrinkPct / 100)) : null;
                    const totalDyed = (hasDyedVal && pcs > 0) ? dyedVal * pcs : null;
                    const totalGreige = (greigePerPc !== null && pcs > 0) ? greigePerPc * pcs : null;

                    const renderArticleCell = isFirstRowOfArticle;
                    if (isFirstRowOfArticle) {
                      isFirstRowOfArticle = false;
                    }

                    return (
                      <tr
                        key={row.key || `${section.articleName}_${gIdx}_${rIdx}`}
                        style={{
                          verticalAlign: 'middle',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        {/* 1. ARTICLE (Rowspan per entire article across all its fabrics) */}
                        {renderArticleCell && (
                          <td
                            rowSpan={section.totalRows}
                            style={{
                              verticalAlign: 'middle',
                              padding: '8px 10px',
                              backgroundColor: '#ffffff'
                            }}
                          >
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className="fs-5">{section.icon}</span>
                              <div>
                                <div className="fw-bold text-dark" style={{ fontSize: '13px', lineHeight: 1.2 }}>
                                  {section.articleName}
                                </div>
                                {section.articleCode && section.articleCode.toLowerCase() !== section.articleName.toLowerCase() && (
                                  <div className="text-muted text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.03em' }}>
                                    {section.articleCode}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Toggle Buttons: [ Greige ] [ Dyed ] (Excel Style Segmented Control) */}
                            {isConsumptionEditing ? (
                              <div
                                className="d-inline-flex border"
                                style={{
                                  borderColor: '#cbd5e1',
                                  borderRadius: '2px',
                                  overflow: 'hidden',
                                  backgroundColor: '#f8fafc'
                                }}
                              >
                                <button
                                  type="button"
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: section.sourcing !== 'Dyed' ? 700 : 500,
                                    padding: '2px 8px',
                                    border: 'none',
                                    backgroundColor: section.sourcing !== 'Dyed' ? '#2563eb' : '#ffffff',
                                    color: section.sourcing !== 'Dyed' ? '#ffffff' : '#64748b',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleToggleArticleSourcing(section.articleName, 'Greige')}
                                  title="Greige Fabric"
                                >
                                  Greige
                                </button>
                                <button
                                  type="button"
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: section.sourcing === 'Dyed' ? 700 : 500,
                                    padding: '2px 8px',
                                    border: 'none',
                                    borderLeft: '1px solid #cbd5e1',
                                    backgroundColor: section.sourcing === 'Dyed' ? '#2563eb' : '#ffffff',
                                    color: section.sourcing === 'Dyed' ? '#ffffff' : '#64748b',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleToggleArticleSourcing(section.articleName, 'Dyed')}
                                  title="Dyed Fabric"
                                >
                                  Dyed
                                </button>
                              </div>
                            ) : (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  padding: '2px 6px',
                                  borderRadius: '2px',
                                  backgroundColor: section.sourcing === 'Dyed' ? '#e0f2fe' : '#eef2ff',
                                  color: section.sourcing === 'Dyed' ? '#0369a1' : '#2563eb',
                                  border: section.sourcing === 'Dyed' ? '1px solid #bae6fd' : '1px solid #c7d2fe'
                                }}
                              >
                                {section.sourcing === 'Dyed' ? 'Dyed' : 'Greige'}
                              </span>
                            )}
                          </td>
                        )}

                        {/* 2. FABRIC (Rowspan per article-fabric requirement) */}
                        {isFirstRow && (
                          <td
                            rowSpan={group.rows.length}
                            style={{
                              verticalAlign: 'middle',
                              padding: '8px 10px',
                              backgroundColor: '#ffffff'
                            }}
                          >
                            <div className="fw-semibold text-dark" style={{ fontSize: '12.5px' }}>
                              {group.fabricQuality || 'Grey Cotton Reyon'}
                              {group.role && (
                                <span
                                  className="ms-2"
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    padding: '1px 5px',
                                    borderRadius: '2px',
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569',
                                    border: '1px solid #cbd5e1'
                                  }}
                                >
                                  {autoCapitalizeWords(group.role)}
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* 3. COLOUR (Per row - placed before Width) */}
                        <td style={{ padding: '6px 10px', backgroundColor: '#ffffff' }}>
                          <div className="d-flex align-items-center gap-2" style={{ whiteSpace: 'nowrap' }}>
                            <span
                              className="d-inline-block rounded-circle flex-shrink-0"
                              style={{
                                width: '10px',
                                height: '10px',
                                backgroundColor: row.colorHex || '#333333',
                                border: '1px solid rgba(0,0,0,0.2)'
                              }}
                            />
                            <span className="text-dark fw-medium" style={{ fontSize: '12.5px' }}>
                              {row.colorName}
                            </span>
                          </div>
                        </td>

                        {/* 4. WIDTH (IN) - Multi-Select & Selection */}
                        {isFirstRow && (() => {
                          const groupKey = `${group.articleName}___${group.fabricQuality || ''}___${group.role || ''}`;
                          return (
                            <td
                              rowSpan={group.rows.length}
                              style={{
                                verticalAlign: 'middle',
                                textAlign: 'center',
                                padding: '4px 6px',
                                backgroundColor: '#ffffff',
                                position: 'relative'
                              }}
                            >
                              <div className="d-flex flex-column align-items-center justify-content-center" style={{ gap: '4px' }}>
                                {isConsumptionEditing ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm d-inline-flex align-items-center justify-content-between font-monospace"
                                    style={{
                                      minWidth: '68px',
                                      height: '28px',
                                      padding: '2px 8px',
                                      fontSize: selectedWidths.length > 0 ? '12px' : '11px',
                                      fontWeight: selectedWidths.length > 0 ? 700 : 600,
                                      borderColor: activeWidthDropdownKey === groupKey ? '#1d4ed8' : (selectedWidths.length > 0 ? '#2563eb' : '#cbd5e1'),
                                      backgroundColor: selectedWidths.length > 0 ? '#eff6ff' : '#f8fafc',
                                      color: selectedWidths.length > 0 ? '#1d4ed8' : '#64748b',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      boxShadow: activeWidthDropdownKey === groupKey ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none',
                                      borderWidth: '1.5px',
                                      borderStyle: selectedWidths.length > 0 ? 'solid' : 'dashed',
                                      gap: '6px'
                                    }}
                                    onClick={() => setActiveWidthDropdownKey(activeWidthDropdownKey === groupKey ? null : groupKey)}
                                    title="Click to select or change fabric width"
                                  >
                                    <span>{selectedWidths.length > 0 ? selectedWidths[0] : 'Select'}</span>
                                    <i
                                      className={`ti ti-chevron-${activeWidthDropdownKey === groupKey ? 'up' : 'down'}`}
                                      style={{
                                        fontSize: '11px',
                                        color: selectedWidths.length > 0 ? '#2563eb' : '#94a3b8'
                                      }}
                                    />
                                  </button>
                                ) : (
                                  <div
                                    className="d-inline-flex align-items-center justify-content-center font-monospace"
                                    style={{
                                      minWidth: '58px',
                                      height: '26px',
                                      padding: '1px 6px',
                                      fontSize: '12px',
                                      fontWeight: selectedWidths.length > 0 ? 700 : 600,
                                      color: selectedWidths.length > 0 ? '#1d4ed8' : '#94a3b8',
                                      backgroundColor: selectedWidths.length > 0 ? '#eff6ff' : 'transparent',
                                      border: selectedWidths.length > 0 ? '1.5px solid #2563eb' : 'none',
                                      borderRadius: '2px'
                                    }}
                                  >
                                    <span>{selectedWidths.length > 0 ? selectedWidths[0] : '—'}</span>
                                  </div>
                                )}
                              </div>

                              {/* Clean Dropdown Menu - Drops down directly beneath the button */}
                              {isConsumptionEditing && activeWidthDropdownKey === groupKey && (
                                <>
                                  {/* Full-screen invisible backdrop to dismiss on click outside */}
                                  <div
                                    style={{
                                      position: 'fixed',
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      zIndex: 1050
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveWidthDropdownKey(null);
                                    }}
                                  />

                                  {/* Dropdown Menu Container */}
                                  <div
                                    className="card shadow-lg"
                                    style={{
                                      position: 'absolute',
                                      top: 'calc(100% + 4px)',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      minWidth: '150px',
                                      maxWidth: '185px',
                                      zIndex: 1060,
                                      borderRadius: '6px',
                                      border: '1.5px solid #2563eb',
                                      backgroundColor: '#ffffff',
                                      padding: '0',
                                      overflow: 'hidden',
                                      textAlign: 'left',
                                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Dropdown Header */}
                                    <div
                                      className="d-flex align-items-center justify-content-between px-2.5 py-1.5 border-bottom"
                                      style={{ backgroundColor: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}
                                    >
                                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', letterSpacing: '0.02em' }}>
                                        Select Width
                                      </span>
                                      <button
                                        type="button"
                                        className="btn-close"
                                        style={{ fontSize: '8px', padding: 0 }}
                                        onClick={() => setActiveWidthDropdownKey(null)}
                                        aria-label="Close"
                                      />
                                    </div>

                                    {/* Width Options List */}
                                    <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
                                      {widthOptions.map(opt => {
                                        const isSelected = selectedWidths.includes(opt) || (!selectedWidths.length && opt === group.width);
                                        return (
                                          <div
                                            key={opt}
                                            className="d-flex align-items-center justify-content-between px-2.5 py-1.5 rounded transition"
                                            style={{
                                              cursor: 'pointer',
                                              userSelect: 'none',
                                              backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                                              margin: '2px 0',
                                              color: isSelected ? '#1d4ed8' : '#334155',
                                              fontWeight: isSelected ? 700 : 500,
                                              fontSize: '12px'
                                            }}
                                            onClick={() => {
                                              handleSelectWidthForGroup(group.articleName, opt, group.fabricQuality, group.role);
                                              setActiveWidthDropdownKey(null);
                                            }}
                                            onMouseEnter={(e) => {
                                              if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9';
                                            }}
                                            onMouseLeave={(e) => {
                                              if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                          >
                                            <span className="font-monospace fw-bold">{opt}</span>
                                            {isSelected ? (
                                              <span className="badge bg-primary-subtle text-primary" style={{ fontSize: '9px', padding: '1px 4px' }}>
                                                <i className="ti ti-check me-0.5"></i> Active
                                              </span>
                                            ) : (
                                              <span className="text-muted" style={{ fontSize: '10px' }}>
                                                Select
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}

                                      {/* Clear / Reset Option */}
                                      {selectedWidths.length > 0 && (
                                        <div
                                          className="d-flex align-items-center justify-content-between px-2.5 py-1.5 rounded border-top mt-1 pt-1 text-secondary"
                                          style={{
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            fontSize: '11px',
                                            fontWeight: 500
                                          }}
                                          onClick={() => {
                                            handleSelectWidthForGroup(group.articleName, '', group.fabricQuality, group.role);
                                            setActiveWidthDropdownKey(null);
                                          }}
                                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                                        >
                                          <span>Clear width (—)</span>
                                          <i className="ti ti-x" style={{ fontSize: '10px' }} />
                                        </div>
                                      )}
                                    </div>

                                    {/* Custom Width Input */}
                                    <div className="border-top p-1.5" style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                                      <form
                                        onSubmit={(e) => {
                                          e.preventDefault();
                                          const val = (customWidthMap[groupKey] || '').trim();
                                          if (val) {
                                            const clean = val.replace(/"/g, '') + '"';
                                            handleSelectWidthForGroup(group.articleName, clean, group.fabricQuality, group.role);
                                            setCustomWidthMap(prev => ({ ...prev, [groupKey]: '' }));
                                            setActiveWidthDropdownKey(null);
                                          }
                                        }}
                                        className="d-flex gap-1"
                                      >
                                        <input
                                          type="text"
                                          className="form-control form-control-sm font-monospace py-0 px-2"
                                          placeholder="Custom (e.g. 48)"
                                          style={{ fontSize: '11px', height: '24px' }}
                                          value={customWidthMap[groupKey] || ''}
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            setCustomWidthMap(prev => ({ ...prev, [groupKey]: v }));
                                          }}
                                        />
                                        <button
                                          type="submit"
                                          className="btn btn-sm btn-primary py-0 px-2"
                                          style={{ fontSize: '10px', height: '24px', fontWeight: 600, whiteSpace: 'nowrap' }}
                                        >
                                          + Add
                                        </button>
                                      </form>
                                    </div>
                                  </div>
                                </>
                              )}
                            </td>
                          );
                        })()}

                        {/* 5. DYED (M/PC) */}
                        {isFirstRow && (
                          <td
                            rowSpan={group.rows.length}
                            style={{
                              verticalAlign: 'middle',
                              textAlign: 'center',
                              padding: '4px 6px',
                              backgroundColor: '#ffffff'
                            }}
                          >
                            <div className="d-flex flex-column align-items-center justify-content-center" style={{ gap: '4px' }}>
                              {widthsToRender.map((w, wIdx) => {
                                const rateKey = `${group.articleName}___${group.fabricQuality || ''}___${group.role || ''}___${w}`;
                                const storedRate = widthDyedRates[rateKey];
                                const displayVal = (storedRate !== undefined && storedRate !== null)
                                  ? storedRate
                                  : ((group.width === w && group.dyedRate !== undefined && group.dyedRate !== null && group.dyedRate !== 0 && group.dyedRate !== '')
                                      ? group.dyedRate
                                      : (w === '' && group.dyedRate !== undefined && group.dyedRate !== null && group.dyedRate !== 0 && group.dyedRate !== '' ? group.dyedRate : ''));

                                return isConsumptionEditing ? (
                                  <input
                                    key={w || `dyed_${wIdx}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-control form-control-sm text-center font-monospace"
                                    style={{
                                      width: '74px',
                                      height: '26px',
                                      border: '1.5px solid #2563eb',
                                      backgroundColor: '#ffffff',
                                      borderRadius: '2px',
                                      fontSize: '12.5px',
                                      fontWeight: 700,
                                      color: '#0f172a',
                                      padding: '2px 4px'
                                    }}
                                    placeholder="0.00"
                                    value={displayVal !== undefined && displayVal !== null ? displayVal : ''}
                                    onChange={(e) => handleUpdateWidthDyedRate(group.articleName, group.fabricQuality, group.role, w, e.target.value)}
                                    title={w ? `Dyed consumption for ${w} width` : 'Dyed consumption'}
                                  />
                                ) : (
                                  <div
                                    key={w || `dyed_${wIdx}`}
                                    className="d-inline-flex align-items-center justify-content-center font-monospace"
                                    style={{
                                      minWidth: '68px',
                                      height: '26px',
                                      padding: '1px 6px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      color: '#0f172a',
                                      backgroundColor: '#ffffff',
                                      border: '1.5px solid #bfdbfe',
                                      borderRadius: '2px'
                                    }}
                                  >
                                    {displayVal !== undefined && displayVal !== null && displayVal !== '' && parseFloat(displayVal) > 0
                                      ? parseFloat(displayVal).toFixed(2)
                                      : '—'}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        )}

                        {/* 6. SHRINK % (Rendered per selected width) */}
                        {showShrinkColumn && isFirstRow && (
                          <td
                            rowSpan={group.rows.length}
                            style={{
                              verticalAlign: 'middle',
                              textAlign: 'center',
                              padding: '4px 6px',
                              backgroundColor: '#ffffff'
                            }}
                          >
                            <div className="d-flex flex-column align-items-center justify-content-center" style={{ gap: '4px' }}>
                              {widthsToRender.map((w, wIdx) => (
                                <div key={w || `shrink_${wIdx}`} className="d-flex justify-content-center">
                                  {isDyedSourced ? (
                                    <div style={{ height: '26px', display: 'flex', alignItems: 'center' }}>
                                      <span className="text-muted font-monospace" style={{ fontSize: '13px' }}>—</span>
                                    </div>
                                  ) : (
                                    <div
                                      className="d-inline-flex align-items-center justify-content-center font-monospace fw-semibold"
                                      style={{
                                        minWidth: '54px',
                                        height: '26px',
                                        padding: '0 6px',
                                        borderRadius: '2px',
                                        backgroundColor: '#f8fafc',
                                        color: '#334155',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '12px'
                                      }}
                                    >
                                      {group.shrinkPct ? `${group.shrinkPct}%` : '0%'}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        )}

                        {/* 7. GREIGE (M/PC) */}
                        <td
                          style={{
                            padding: '4px 6px',
                            textAlign: 'center',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <div className="d-flex flex-column align-items-center justify-content-center" style={{ gap: '4px' }}>
                            {widthsToRender.map((w, wIdx) => {
                              const rateKey = `${group.articleName}___${group.fabricQuality || ''}___${group.role || ''}___${w}`;
                              const storedRate = widthDyedRates[rateKey];
                              const wVal = (storedRate !== undefined && storedRate !== null && storedRate !== '')
                                ? parseFloat(storedRate)
                                : ((group.width === w && group.dyedRate) ? parseFloat(group.dyedRate) : (w === '' && group.dyedRate ? parseFloat(group.dyedRate) : 0));
                              const wDyedVal = isNaN(wVal) ? 0 : wVal;
                              const wGreigePerPc = wDyedVal > 0 ? (isDyedSourced ? wDyedVal : wDyedVal * (1 + shrinkPct / 100)) : 0;

                              return (
                                <div
                                  key={w || `greige_${wIdx}`}
                                  className="d-inline-flex align-items-center justify-content-center font-monospace"
                                  style={{
                                    minWidth: '66px',
                                    height: '26px',
                                    padding: '0 6px',
                                    borderRadius: '2px',
                                    backgroundColor: '#ffffff',
                                    color: '#0f172a',
                                    border: '1.5px solid #2563eb',
                                    fontSize: '12px',
                                    fontWeight: 700
                                  }}
                                  title={w ? `Greige per piece for ${w} width` : 'Greige per piece'}
                                >
                                  {wGreigePerPc > 0 ? wGreigePerPc.toFixed(2) : '0.00'}
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* 8. PCS (Rendered per selected width) */}
                        <td
                          style={{
                            padding: '4px 6px',
                            textAlign: 'center',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <div className="d-flex flex-column align-items-center justify-content-center" style={{ gap: '4px' }}>
                            {widthsToRender.map((w, wIdx) => (
                              <div key={w || `pcs_${wIdx}`} className="d-flex justify-content-center align-items-center">
                                <div
                                  className="d-inline-flex align-items-center justify-content-center font-monospace fw-bold"
                                  style={{
                                    minWidth: '58px',
                                    height: '26px',
                                    padding: '0 6px',
                                    borderRadius: '2px',
                                    backgroundColor: '#ffffff',
                                    color: pcs > 0 ? '#0f172a' : '#94a3b8',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '12.5px',
                                    userSelect: 'none'
                                  }}
                                  title="Ordered pieces"
                                >
                                  {pcs > 0 ? pcs : '0'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* 9. TOTAL DYED */}
                        <td
                          style={{
                            padding: '4px 6px',
                            textAlign: 'center',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <div className="d-flex flex-column align-items-center justify-content-center" style={{ gap: '4px' }}>
                            {widthsToRender.map((w, wIdx) => {
                              const rateKey = `${group.articleName}___${group.fabricQuality || ''}___${group.role || ''}___${w}`;
                              const storedRate = widthDyedRates[rateKey];
                              const wVal = (storedRate !== undefined && storedRate !== null && storedRate !== '')
                                ? parseFloat(storedRate)
                                : ((group.width === w && group.dyedRate) ? parseFloat(group.dyedRate) : (w === '' && group.dyedRate ? parseFloat(group.dyedRate) : 0));
                              const wDyedVal = isNaN(wVal) ? 0 : wVal;
                              const wTotalDyed = (wDyedVal > 0 && pcs > 0) ? (wDyedVal * pcs) : 0;

                              return (
                                <div
                                  key={w || `totdyed_${wIdx}`}
                                  className="d-inline-flex align-items-center justify-content-center font-monospace"
                                  style={{
                                    minWidth: '72px',
                                    height: '26px',
                                    padding: '0 6px',
                                    borderRadius: '2px',
                                    backgroundColor: '#ffffff',
                                    color: '#0f172a',
                                    border: '1.5px solid #2563eb',
                                    fontSize: '12px',
                                    fontWeight: 700
                                  }}
                                  title={w ? `Total dyed for ${w} width` : 'Total dyed'}
                                >
                                  {wTotalDyed > 0 ? `${wTotalDyed.toFixed(2)}m` : '0.00m'}
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* 10. TOTAL GREIGE */}
                        <td
                          style={{
                            padding: '4px 6px',
                            textAlign: 'center',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <div className="d-flex flex-column align-items-center justify-content-center" style={{ gap: '4px' }}>
                            {widthsToRender.map((w, wIdx) => {
                              const rateKey = `${group.articleName}___${group.fabricQuality || ''}___${group.role || ''}___${w}`;
                              const storedRate = widthDyedRates[rateKey];
                              const wVal = (storedRate !== undefined && storedRate !== null && storedRate !== '')
                                ? parseFloat(storedRate)
                                : ((group.width === w && group.dyedRate) ? parseFloat(group.dyedRate) : (w === '' && group.dyedRate ? parseFloat(group.dyedRate) : 0));
                              const wDyedVal = isNaN(wVal) ? 0 : wVal;
                              const wGreigePerPc = wDyedVal > 0 ? (isDyedSourced ? wDyedVal : wDyedVal * (1 + shrinkPct / 100)) : 0;
                              const wTotalGreige = (wGreigePerPc > 0 && pcs > 0) ? (wGreigePerPc * pcs) : 0;

                              return (
                                <div
                                  key={w || `totgreige_${wIdx}`}
                                  className="d-inline-flex align-items-center justify-content-center font-monospace"
                                  style={{
                                    minWidth: '72px',
                                    height: '26px',
                                    padding: '0 6px',
                                    borderRadius: '2px',
                                    backgroundColor: '#ffffff',
                                    color: '#0f172a',
                                    border: '1.5px solid #2563eb',
                                    fontSize: '12px',
                                    fontWeight: 700
                                  }}
                                  title={w ? `Total greige for ${w} width` : 'Total greige'}
                                >
                                  {wTotalGreige > 0 ? `${wTotalGreige.toFixed(2)}m` : '0.00m'}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  });
                });
              })}

              {/* GRAND TOTAL ROW (Excel Style Summary) */}
              {consumptionRows.length > 0 && (
                <tr
                  style={{
                    borderTop: '2px solid #64748b',
                    borderBottom: '2px solid #64748b',
                    backgroundColor: '#f8fafc',
                    fontWeight: 700
                  }}
                >
                  <td
                    colSpan={2}
                    className="text-uppercase text-dark ps-3 py-2 fw-bold"
                    style={{ fontSize: '12px', letterSpacing: '0.04em' }}
                  >
                    <span>Total Garment Pieces</span>
                  </td>
                  <td className="text-center text-muted small py-2">—</td>
                  <td className="text-center text-muted small py-2">—</td>
                  <td className="text-center text-muted small py-2">—</td>
                  {showShrinkColumn && (
                    <td className="text-center text-muted small py-2">—</td>
                  )}
                  <td className="text-center text-muted small py-2">—</td>
                  <td className="text-center py-2">
                    <div className="d-flex justify-content-center">
                      <div
                        className="d-inline-flex align-items-center justify-content-center font-monospace fw-bold"
                        style={{
                          minWidth: '65px',
                          height: '26px',
                          padding: '0 6px',
                          borderRadius: '2px',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          border: '1px solid #cbd5e1',
                          fontSize: '12.5px'
                        }}
                      >
                        {(() => {
                          if (order?.totalGarments && order.totalGarments > 0) return order.totalGarments;
                          if (order?.totalPcs && order.totalPcs > 0) return order.totalPcs;
                          if (order?.orderQuantity && order.orderQuantity > 0) return order.orderQuantity;
                          const artColorMap = new Map();
                          consumptionRows.forEach(r => {
                            const key = `${r.articleName}___${r.colorName}`;
                            const pcs = parseInt(r.pcs, 10) || 0;
                            if (!artColorMap.has(key) || r.isMainFabric) {
                              artColorMap.set(key, pcs);
                            }
                          });
                          let sum = 0;
                          artColorMap.forEach(p => { sum += p; });
                          return sum;
                        })()} pcs
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-2">
                    <div className="d-flex justify-content-center">
                      <div
                        className="d-inline-flex align-items-center justify-content-center font-monospace fw-bold"
                        style={{
                          minWidth: '75px',
                          height: '26px',
                          padding: '0 6px',
                          borderRadius: '2px',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px'
                        }}
                      >
                        {fabricSummaryRows.reduce((sum, fs) => sum + (fs.hasValues ? (fs.totalDyed || 0) : 0), 0) > 0
                          ? `${fabricSummaryRows.reduce((sum, fs) => sum + (fs.hasValues ? (fs.totalDyed || 0) : 0), 0).toFixed(2)}m`
                          : '0.00m'}
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-2">
                    <div className="d-flex justify-content-center">
                      <div
                        className="d-inline-flex align-items-center justify-content-center font-monospace fw-bold"
                        style={{
                          minWidth: '75px',
                          height: '26px',
                          padding: '0 6px',
                          borderRadius: '2px',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px'
                        }}
                      >
                        {fabricSummaryRows.reduce((sum, fs) => sum + (fs.hasValues ? (fs.totalGreige || 0) : 0), 0) > 0
                          ? `${fabricSummaryRows.reduce((sum, fs) => sum + (fs.hasValues ? (fs.totalGreige || 0) : 0), 0).toFixed(2)}m`
                          : '0.00m'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Actions Bar */}
        <div
          className="d-flex align-items-center justify-content-end gap-2.5 p-3 px-4 bg-white"
          style={{ borderTop: '1px solid #cbd5e1' }}
        >
          {isConsumptionEditing ? (
            <>
              <button
                type="button"
                className="btn btn-outline-secondary px-3.5 py-1.5 fw-semibold bg-white"
                style={{ borderColor: '#cbd5e1', color: '#475569', fontSize: '13px', borderRadius: '4px' }}
                onClick={() => {
                  handleCancelConsumption();
                  setIsConsumptionEditing(false);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn px-3.5 py-1.5 fw-semibold text-primary d-flex align-items-center gap-2"
                style={{
                  backgroundColor: '#eff6ff',
                  borderColor: '#bfdbfe',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: '4px',
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
                className="btn px-4 py-1.5 fw-semibold text-white d-flex align-items-center gap-2"
                style={{
                  backgroundColor: '#2563eb',
                  borderColor: '#2563eb',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
                onClick={handleSaveConsumption}
              >
                <i className="ti ti-device-floppy fs-5"></i>
                <span>Save</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn px-3.5 py-1.5 fw-semibold text-primary d-flex align-items-center gap-2"
                style={{
                  backgroundColor: '#eff6ff',
                  borderColor: '#bfdbfe',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: '4px',
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
                className="btn btn-sm px-3.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5"
                style={{
                  color: '#2563eb',
                  borderColor: '#bfdbfe',
                  backgroundColor: '#ffffff',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
                onClick={() => setIsConsumptionEditing(true)}
                title="Edit Fabric Colour & Consumption"
              >
                <i className="ti ti-edit fs-5"></i>
                <span>Edit</span>
              </button>
            </>
          )}
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
                    <th className="py-2.5 px-3">Article</th>
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
                  {rateCalculations.map((rc, idx) => {
                    const isNewArticle = idx > 0 && rateCalculations[idx - 1].articleName !== rc.articleName;
                    const isFirstInArticle = idx === 0 || isNewArticle;

                    return (
                      <tr
                        key={idx}
                        style={{
                          backgroundColor: rc.isSelected ? '#ffffff' : '#fcfcfd',
                          borderTop: isNewArticle ? '2px solid #cbd5e1' : undefined
                        }}
                      >
                        <td className="py-2.5 px-3 fw-bold text-dark" style={{ width: '130px' }}>
                          <span className="me-1.5">{rc.articleIcon}</span>
                          <span>{rc.articleName}</span>
                        </td>
                        <td className="py-2.5 px-3 fw-semibold text-dark">
                          <span>{rc.fabricName}</span>
                          {rc.role && (
                            <span className="badge bg-light text-muted border ms-1.5" style={{ fontSize: '10px' }}>
                              {rc.role}
                            </span>
                          )}
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
                              placeholder="0.00"
                              value={customMarketRates[rc.rateKey] ?? customMarketRates[`${rc.fabricName}_${rc.width}`] ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomMarketRates(prev => ({
                                  ...prev,
                                  [rc.rateKey]: val,
                                  [`${rc.fabricName}_${rc.width}`]: val
                                }));
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-end font-monospace fw-semibold">
                          {rc.totalMetres.toFixed(1)}m
                        </td>
                        <td className={`py-2.5 px-3 text-end font-monospace fw-bold ${rc.isSelected ? 'text-dark' : 'text-secondary'}`}>
                          {rc.totalCost > 0
                            ? `₹${rc.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : '₹0.00'}
                        </td>
                        <td
                          className="py-2.5 px-3 text-end font-monospace fw-semibold"
                          style={{ color: rc.isSelected ? '#2e37a4' : '#64748b' }}
                        >
                          {rc.costPerGarment > 0 ? `₹${rc.costPerGarment.toFixed(2)}` : '₹0.00'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-light fw-bold">
                  <tr>
                    <td colSpan={5} className="py-2.5 px-3 text-dark">
                      Total Order Procurement Cost (Active Selected Widths)
                    </td>
                    <td className="py-2.5 px-3 text-end font-monospace">{rateTotals.totalMetres.toFixed(1)}m</td>
                    <td className="py-2.5 px-3 text-end font-monospace text-success fs-14">
                      ₹{rateTotals.totalCost > 0 ? rateTotals.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                    </td>
                    <td className="py-2.5 px-3 text-end font-monospace text-primary">
                      Avg ₹{rateTotals.totalCost > 0 && rateTotals.totalPcs > 0 ? (rateTotals.totalCost / rateTotals.totalPcs).toFixed(2) : '0.00'}/pc
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>



      {/* =========================================================================
       * 11. ACCESSORIES BOM CARD
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
                Accessories BOM &mdash; {bomCustomerName}
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

        {/* ========================================================================= */}
        {/* TOP ARTICLE TABS (Kurta, Pant, Dupatta) - Section 11                      */}
        {/* ========================================================================= */}
        {orderArticles.length > 0 && (
          <div
            className="d-flex align-items-center justify-content-between flex-wrap gap-2 p-2.5 rounded-3 mb-3"
            style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
          >
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="text-secondary fw-bold px-1" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select Article:
              </span>
              <div className="d-flex align-items-center flex-wrap gap-1.5">
                {orderArticles.map(art => {
                  const isBottom = /pant|plazo|palazzo|pajama|salwar|bottom|trouser/i.test(art.name || '');
                  const isDupatta = /dupatta|stole|scarf/i.test(art.name || '');
                  const defaultIcon = isBottom ? '👖' : (isDupatta ? '🧣' : '👘');
                  const isSelected = Boolean(selectedBomArticle && selectedBomArticle.toLowerCase() === (art.name || '').toLowerCase());

                  // Count configured accessories for this article
                  const countForArt = addedAccessories.filter(item =>
                    getCardSelectedArticles(item).some(a => a.toLowerCase() === (art.name || '').toLowerCase())
                  ).length;

                  return (
                    <button
                      key={art.name}
                      type="button"
                      className={`btn btn-sm rounded-pill d-inline-flex align-items-center gap-1.5 px-3.5 py-1.5 transition-all fw-semibold ${isSelected ? 'shadow-xs' : ''}`}
                      style={{
                        fontSize: '13px',
                        backgroundColor: isSelected ? '#2e37a4' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#475569',
                        border: isSelected ? '1.5px solid #2e37a4' : '1px solid #cbd5e1',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedBomArticle(prev => prev === art.name ? '' : art.name)}
                    >
                      <span>{art.icon || defaultIcon}</span>
                      <span>{art.name}</span>
                      <span
                        className="badge rounded-pill ms-1"
                        style={{
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                          color: isSelected ? '#ffffff' : '#475569',
                          fontSize: '11px',
                          padding: '2px 7px'
                        }}
                      >
                        {countForArt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-muted small pe-1 d-flex align-items-center gap-1.5" style={{ fontSize: '12px' }}>
              {selectedBomArticle ? (
                <>
                  <span>Configuring for:</span>
                  <span className="badge rounded-2 px-2.5 py-1 fw-bold" style={{ backgroundColor: '#eef2ff', color: '#2e37a4', border: '1px solid #c7d2fe', fontSize: '12px' }}>
                    {selectedBomArticle}
                  </span>
                </>
              ) : (
                <span className="text-muted fst-italic">
                  Click an article to configure (e.g. Kurta, Pant, Dupatta)
                </span>
              )}
            </div>
          </div>
        )}

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

        {/* 1. Category Buttons Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}
        >
          {ACCESSORY_CATEGORIES.map((cat) => {
            const isActive = Boolean(activeCategory && matchesCategory(activeCategory, cat.id));
            const categoryItems = addedAccessories.filter(item => matchesCategory(item.category, cat.id));

            return (
              <button
                key={cat.id}
                type="button"
                className={`btn rounded-3 d-flex flex-column align-items-center justify-content-center p-2 transition-all shadow-xs ${isActive ? 'fw-bold' : ''}`}
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
                onClick={() => setActiveCategory(prev => prev === cat.id ? '' : cat.id)}
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
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. Active Category Action Bar & Quick Varieties */}
        {activeCategoryObj ? (
          <>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 mt-2">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '26px', height: '26px', minWidth: '26px', backgroundColor: '#eef2ff', color: '#2563eb' }}
                >
                  <i className={activeCategoryObj.icon} style={{ fontSize: '14px' }}></i>
                </div>
                <span className="fw-bold text-dark" style={{ fontSize: '14.5px' }}>
                  {activeCategoryObj.name}
                </span>
                <span className="text-muted" style={{ fontSize: '12.5px' }}>
                  {(activeCategoryObj?.varieties?.length > 0) ? '— click a variety to add:' : ''}
                </span>
              </div>
            </div>

            {/* 3. Quick Variety Pills */}
            <div className="position-relative d-flex flex-wrap align-items-center mb-4" style={{ gap: '8px' }}>
              {(activeCategoryObj?.varieties || []).length === 0 ? (
                <div className="text-muted small py-2 px-3 rounded-3 d-flex align-items-center gap-2" style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13px' }}>
                  <i className="ti ti-info-circle text-primary" style={{ fontSize: '16px' }}></i>
                  <span>No accessories added in <strong>{activeCategoryObj?.name || activeCategory} Master</strong> yet. Add items in Accessories Master to select them here.</span>
                </div>
              ) : (
                (activeCategoryObj?.varieties || []).map((v, vIdx) => (
                  <button
                    key={vIdx}
                    type="button"
                    className="btn btn-sm d-inline-flex align-items-center gap-1.5 rounded-pill shadow-xs transition-all"
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 600,
                      padding: '5px 14px',
                      backgroundColor: '#ffffff',
                      borderColor: '#bfdbfe',
                      borderWidth: '1.5px',
                      borderStyle: 'solid',
                      color: '#2563eb',
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
                    <i className="ti ti-plus" style={{ fontSize: '12px', fontWeight: 'bold' }}></i>
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
          </>
        ) : (
          <div className="text-muted small py-2.5 px-3 rounded-3 d-flex align-items-center gap-2 mb-4" style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '12.5px' }}>
            <i className="ti ti-hand-click text-primary" style={{ fontSize: '15px' }}></i>
            <span>Click any category above (e.g. <strong>Buttons, Lace, Tassels, Thread</strong>) to select and configure its varieties.</span>
          </div>
        )}

        {/* 4. Configured Accessories List or Empty State */}
        {(() => {
          if (!selectedBomArticle) {
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
                  Please select an article above (<strong>{orderArticles.map(a => a.name).join(', ') || 'Kurta, Pant, Dupatta'}</strong>) to configure its accessories.
                </div>
              </div>
            );
          }

          let categoryItems = addedAccessories.filter(item =>
            getCardSelectedArticles(item).some(a => a.toLowerCase() === selectedBomArticle.toLowerCase())
          );

          if (activeCategory) {
            categoryItems = categoryItems.filter(item => matchesCategory(item.category, activeCategory));
          }

          if (accessorySearchQuery && accessorySearchQuery.trim()) {
            const q = accessorySearchQuery.toLowerCase().trim();
            categoryItems = categoryItems.filter(item =>
              (item.varietyName && item.varietyName.toLowerCase().includes(q)) ||
              (item.category && item.category.toLowerCase().includes(q)) ||
              (item.placement && item.placement.toLowerCase().includes(q))
            );
          }

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
                  {activeCategoryObj
                    ? `No ${activeCategoryObj.name} configured for ${selectedBomArticle} yet. Click a variety above to add for ${selectedBomArticle}.`
                    : `No accessories configured for ${selectedBomArticle} yet. Click a category above (e.g. Buttons, Lace, Tassels) to add.`}
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
                    {/* Header with Title */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: '12px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold text-dark" style={{ fontSize: '15px' }}>
                          {item.varietyName || item.category || 'Accessory'}
                        </span>
                        <span
                          className="badge rounded-pill px-2.5 py-0.5 fw-bold"
                          style={{ fontSize: '11px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
                        >
                          #{item.configIndex || item.instanceNum || 1}
                        </span>
                        <span className="badge rounded-2 px-2 py-0.5 fw-semibold" style={{ fontSize: '11.5px', backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                          {item.unit || (['Lace', 'Thread', 'Dori', 'Elastic'].some(k => matchesCategory(k, item.category)) ? 'Meter' : 'Piece')}
                        </span>
                        {item.category && item.varietyName && item.category.toLowerCase() !== item.varietyName.toLowerCase() && (
                          <span className="text-muted" style={{ fontSize: '12px' }}>
                            ({item.category})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Article Selector Toggle Pills inside card */}
                    <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
                      <span className="text-muted fw-semibold me-1" style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Apply to:
                      </span>
                      {orderArticles.map((art) => {
                        const isSelected = selectedArticles.some(a => a.toLowerCase() === (art.name || '').toLowerCase());
                        const isBottom = /pant|plazo|palazzo|pajama|salwar|bottom|trouser/i.test(art.name || '');
                        return (
                          <button
                            key={art.name}
                            type="button"
                            className="btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill fw-semibold transition-all"
                            style={{
                              fontSize: '12px',
                              backgroundColor: isSelected ? '#2563eb' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#475569',
                              border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                              boxShadow: isSelected ? '0 1px 3px rgba(37, 99, 235, 0.2)' : 'none',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              handleToggleCardArticle(item.id, art.name);
                            }}
                            title={isSelected ? `Click to remove ${art.name}` : `Click to include ${art.name}`}
                          >
                            <span>{art.icon || (isBottom ? '👖' : '👘')}</span>
                            <span>{art.name}</span>
                            <i className={isSelected ? "ti ti-check" : "ti ti-plus"} style={{ fontSize: '11px', fontWeight: 'bold' }}></i>
                          </button>
                        );
                      })}
                    </div>

                    {/* Category-Specific Table Layout */}
                    <div>
                      {(() => {
                        const itemCatObj = ACCESSORY_CATEGORIES.find(c => matchesCategory(c.id, item.category)) || activeCategoryObj || ACCESSORY_CATEGORIES[0];
                        return renderCategoryCardTable(itemCatObj, item, selectedArticles, isEditing);
                      })()}
                    </div>

                    {/* Card Bottom Actions: Edit/Save & Delete (Neatly at bottom right) */}
                    <div className="d-flex align-items-center justify-content-end gap-2 mt-3 pt-2.5" style={{ borderTop: '1px solid #f1f5f9' }}>
                      {isEditing ? (
                        <button
                          type="button"
                          className="btn btn-sm text-white rounded-2 px-3.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
                          style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', fontSize: '12.5px' }}
                          onClick={() => handleSaveItem(item)}
                        >
                          <i className="ti ti-device-floppy" style={{ fontSize: '15px' }}></i>
                          <span>Save</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm rounded-2 px-3.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs transition-all"
                          style={{ color: '#2563eb', borderColor: '#bfdbfe', backgroundColor: '#eff6ff', fontSize: '12.5px' }}
                          onClick={() => setEditingAccessoryIds(prev => ({ ...prev, [item.id]: true }))}
                          title="Edit Accessory"
                        >
                          <i className="ti ti-edit" style={{ fontSize: '14px' }}></i>
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-link text-danger p-1 text-decoration-none"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Delete accessory"
                      >
                        <i className="ti ti-trash" style={{ fontSize: '16px' }}></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
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
