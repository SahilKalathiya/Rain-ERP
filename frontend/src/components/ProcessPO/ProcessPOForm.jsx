import React, { useState, useEffect } from 'react';
import { initialVendors } from '../../data/procurementData';
import { initialArticles, getStoredColorsMaster, getStoredData } from '../../data/salesOrderData';
import { vendorMatchesType, getVendorTypes } from '../../utils/vendorUtils';
import VendorMasterView from '../Procurement/VendorMasterView';
import FabricMasterView from '../Procurement/FabricMasterView';
import AddColorModal from '../Procurement/AddColorModal';

/**
 * ProcessPOForm - Production-ready implementation of PDF Section 3 & 12.1
 * Features:
 * - Master-driven: Fabric, Color, Article, Width directly rendered from system masters
 * - Zero pre-filled defaults on new creation: clean, empty inputs by default
 * - Section titles without 1, 2, 3 numerical prefixes
 * - Modern, executive Style Scope redesign (Single Garment vs Multi-Style Set Combo)
 * - Fixed generous column widths (min-width 1440px): eliminates all squishing/truncation
 * - Strict Workflow Locking: locked read-only when Challan is generated or PO is dispatched
 */
export default function ProcessPOForm({
  initialPO,
  onSave,
  onCancel,
  onBack,
  readOnlyDefault = false,
  onCreateChallan,
  onPrintPO,
  challans = []
}) {
  const handleExit = () => {
    if (onCancel) onCancel();
    else if (onBack) onBack();
  };
  const isEditingExisting = Boolean(initialPO && initialPO.id);

  // Workflow Locking: PO cannot be edited once a Challan has been created or if status is not Draft
  const isLocked = Boolean(
    initialPO && (
      initialPO.is_locked ||
      initialPO.status === 'Sent to Vendor' ||
      initialPO.status === 'Partially Dispatched' ||
      initialPO.status === 'Completed' ||
      (challans && challans.some(c => c.linked_pos && (
        c.linked_pos.includes(initialPO.id) ||
        c.linked_pos.includes(initialPO.po_number) ||
        c.linked_pos.includes(`PPO-${initialPO.po_number}`)
      )))
    )
  );

  const [isReadOnly, setIsReadOnly] = useState(readOnlyDefault || isLocked);
  const [editingSection, setEditingSection] = useState((readOnlyDefault || initialPO || isLocked) ? null : 'all');

  // Starting Direction Choice
  const [startDirection, setStartDirection] = useState('style');

  // Dynamic Sales Orders (Loaded strictly from system's real Sales Orders)
  const buildOrderItems = (o, storedPOs, shouldCombine) => {
    const items = [];
    if (!Array.isArray(o.fabricConsumptions)) return items;
    // Group by fabric + color + width (when shouldCombine is true), or keep articles separate
    const groupsMap = new Map();

            o.fabricConsumptions.forEach((fc, idx) => {
              let req = parseFloat(
                fc.totalFabricMeters ||
                fc.requiredMeters ||
                fc.totalGreige ||
                fc.orderQty ||
                fc.totalDyed ||
                fc.meters ||
                0
              );

              // Fallback calculation if req is 0 but pieces are present
              if (req <= 0 && fc.pcs && parseInt(fc.pcs, 10) > 0) {
                const isDup = /dupatta|stole|chunri|scarf/i.test((fc.articleName || fc.article || '').trim());
                const isBot = /pant|bottom|salwar|trouser|plazo|palazzo/i.test((fc.articleName || fc.article || '').trim());
                const defDyed = isDup ? 2.25 : (isBot ? (38 * 0.0254) : (45 * 0.0254));
                const shrink = parseFloat(fc.shrinkPct || fc.shrinkage || 3.5);
                req = Number((parseInt(fc.pcs, 10) * defDyed * (1 + shrink / 100)).toFixed(2));
              }

              const rec = parseFloat(fc.receivedMeters || 0);

              let resolvedWidth = '';
              const artName = String(fc.article || fc.articleName || '').trim();
              const fabName = String(fc.fabricQuality || fc.fabricName || '').trim();
              const roleName = String(fc.role || '').trim();

              // 1. Check user's designated PO Width in groupPoWidths
              if (o.groupPoWidths && typeof o.groupPoWidths === 'object') {
                const kExact = `${artName}___${fabName}___${roleName}`;
                const kNoRole = `${artName}___${fabName}___`;
                const kAnyRole = Object.keys(o.groupPoWidths).find(k =>
                  k.toLowerCase().startsWith(`${artName.toLowerCase()}___${fabName.toLowerCase()}`) ||
                  k.toLowerCase().startsWith(`${artName.toLowerCase()}___`)
                );
                const pow = o.groupPoWidths[kExact] || o.groupPoWidths[kNoRole] || (kAnyRole ? o.groupPoWidths[kAnyRole] : null);
                if (pow && pow !== '—' && pow !== '-') {
                  resolvedWidth = String(pow);
                }
              }

              // 2. Check fc.poWidth or fc.width or fc.selectedWidth
              if (!resolvedWidth) {
                if (fc.poWidth && fc.poWidth !== '—' && fc.poWidth !== '-') {
                  resolvedWidth = String(fc.poWidth);
                } else if (fc.width && fc.width !== '—' && fc.width !== '-') {
                  resolvedWidth = String(fc.width);
                } else if (fc.selectedWidth && fc.selectedWidth !== '—' && fc.selectedWidth !== '-') {
                  resolvedWidth = String(fc.selectedWidth);
                } else if (Array.isArray(fc.selectedWidths) && fc.selectedWidths[0] && fc.selectedWidths[0] !== '—') {
                  resolvedWidth = String(fc.selectedWidths[0]);
                }
              }

              // 3. Check user's selected width in groupSelectedWidths
              if (!resolvedWidth && o.groupSelectedWidths && typeof o.groupSelectedWidths === 'object') {
                const kExact = `${artName}___${fabName}___${roleName}`;
                const kNoRole = `${artName}___${fabName}___`;
                const kAnyRole = Object.keys(o.groupSelectedWidths).find(k =>
                  k.toLowerCase().startsWith(`${artName.toLowerCase()}___${fabName.toLowerCase()}`) ||
                  k.toLowerCase().startsWith(`${artName.toLowerCase()}___`)
                );
                const gw = o.groupSelectedWidths[kExact] || o.groupSelectedWidths[kNoRole] || (kAnyRole ? o.groupSelectedWidths[kAnyRole] : null);
                if (Array.isArray(gw) && gw[0] && gw[0] !== '—') {
                  resolvedWidth = String(gw[0]);
                } else if (typeof gw === 'string' && gw && gw !== '—') {
                  resolvedWidth = gw;
                }
              }

              if (!resolvedWidth && Array.isArray(o.articles)) {
                const artMatch = o.articles.find(a =>
                  String(a.name || '').toLowerCase() === artName.toLowerCase()
                );
                if (artMatch) {
                  const fabMatch = (artMatch.fabrics || []).find(f =>
                    String(f.fabricQuality || f.fabricName || '').toLowerCase() === fabName.toLowerCase()
                  ) || artMatch.fabrics?.[0];
                  if (fabMatch && fabMatch.width) {
                    resolvedWidth = String(fabMatch.width);
                  }
                }
              }

              if (!resolvedWidth && o.widthDyedRates && typeof o.widthDyedRates === 'object') {
                const matchingKey = Object.keys(o.widthDyedRates).find(k =>
                  k.toLowerCase().startsWith(`${artName.toLowerCase()}___`)
                );
                if (matchingKey) {
                  const parts = matchingKey.split('___');
                  if (parts.length >= 4 && parts[3]) {
                    resolvedWidth = parts[3];
                  }
                }
              }

              const cleanWidthStr = resolvedWidth ? resolvedWidth.replace(/"/g, '').trim() : '44';
              const colName = String(fc.color || fc.colorName || '').trim();
              const itemStyle = fc.styleName || o.styleName || (styles[0] || '');

              // Composite grouping key: combine by fabric + color + width, or keep articles separate
              const groupKey = shouldCombine
                ? `${(fabName || '').toLowerCase().trim()}___${(colName || '').toLowerCase().trim()}___${cleanWidthStr}`
                : `${(artName || '').toLowerCase().trim()}___${(fabName || '').toLowerCase().trim()}___${(colName || '').toLowerCase().trim()}___${cleanWidthStr}___${idx}`;

              let currentPcs = parseInt(fc.pcs || fc.quantity_pieces || fc.totalPieces || fc.orderQty || 0, 10) || 0;
              if (currentPcs === 0 && Array.isArray(o.articles)) {
                const artMatch = o.articles.find(a => String(a.name || '').toLowerCase() === artName.toLowerCase());
                if (artMatch && (artMatch.totalPieces || artMatch.pieces || artMatch.quantity)) {
                  currentPcs = parseInt(artMatch.totalPieces || artMatch.pieces || artMatch.quantity, 10) || 0;
                }
              }
              const currentCons = parseFloat(fc.dyedPerPiece || fc.greigeLengthPerPiece || fc.consumption || 0);
              const currentShrink = parseFloat(fc.shrinkPct || fc.shrinkage || 4.0);

              // Rate extraction from Order / Consumption / widthDyedRates / customMarketRates
              let itemRate = 0;
              if (fc.dyedRate && parseFloat(fc.dyedRate) > 0) {
                itemRate = parseFloat(fc.dyedRate);
              } else if (fc.rate && parseFloat(fc.rate) > 0) {
                itemRate = parseFloat(fc.rate);
              } else if (fc.fabricRate && parseFloat(fc.fabricRate) > 0) {
                itemRate = parseFloat(fc.fabricRate);
              } else if (fc.marketRate && parseFloat(fc.marketRate) > 0) {
                itemRate = parseFloat(fc.marketRate);
              } else if (fc.price && parseFloat(fc.price) > 0) {
                itemRate = parseFloat(fc.price);
              } else if (fc.cost && parseFloat(fc.cost) > 0) {
                itemRate = parseFloat(fc.cost);
              }

              if (!itemRate && o.widthDyedRates && typeof o.widthDyedRates === 'object') {
                const kExact = `${artName}___${fabName}___${roleName}___${cleanWidthStr}`;
                const kNoRole = `${artName}___${fabName}______${cleanWidthStr}`;
                const kFuzzy = Object.keys(o.widthDyedRates).find(k => {
                  const lk = k.toLowerCase();
                  return lk.includes(artName.toLowerCase()) && lk.includes(cleanWidthStr.toLowerCase());
                });
                const rVal = o.widthDyedRates[kExact] ?? o.widthDyedRates[kNoRole] ?? (kFuzzy ? o.widthDyedRates[kFuzzy] : null);
                if (rVal && parseFloat(rVal) > 0) {
                  itemRate = parseFloat(rVal);
                }
              }

              if (!itemRate && o.customMarketRates && typeof o.customMarketRates === 'object') {
                const cmVal = o.customMarketRates[`${artName}___${fabName}___${cleanWidthStr}`] ||
                  o.customMarketRates[`${fabName}_${cleanWidthStr}`] ||
                  o.customMarketRates[fabName];
                if (cmVal && parseFloat(cmVal) > 0) {
                  itemRate = parseFloat(cmVal);
                }
              }

              if (!itemRate && Array.isArray(o.articles)) {
                const artMatch = o.articles.find(a =>
                  String(a.name || '').toLowerCase() === artName.toLowerCase()
                );
                if (artMatch) {
                  const fabMatch = (artMatch.fabrics || []).find(f =>
                    String(f.fabricQuality || f.fabricName || '').toLowerCase() === fabName.toLowerCase()
                  ) || artMatch.fabrics?.[0];
                  if (fabMatch && (fabMatch.rate || fabMatch.price || fabMatch.cost || fabMatch.defaultRate)) {
                    itemRate = parseFloat(fabMatch.rate || fabMatch.price || fabMatch.cost || fabMatch.defaultRate) || 0;
                  }
                }
              }

              if (!groupsMap.has(groupKey)) {
                groupsMap.set(groupKey, {
                  id: `${o.id}-IT${idx + 1}`,
                  style: itemStyle,
                  fabric: fabName || 'Fabric',
                  fabricId: fc.fabricId || 'FAB-001',
                  color: colName,
                  colorHex: fc.colorHex || '#cbd5e1',
                  articles: artName ? [artName] : [],
                  width: cleanWidthStr,
                  rate: itemRate,
                  requiredMeters: req,
                  alreadyReceivedMeters: rec,
                  pcs: currentPcs,
                  totalCons: currentCons,
                  maxShrinkage: currentShrink,
                  count: 1,
                  subItems: [fc]
                });
              } else {
                const grp = groupsMap.get(groupKey);
                grp.requiredMeters += req;
                grp.alreadyReceivedMeters += rec;
                if ((!grp.rate || grp.rate === 0) && itemRate) {
                  grp.rate = itemRate;
                }
                if (artName && !grp.articles.includes(artName)) {
                  grp.articles.push(artName);
                }
                // Sum pieces across combined articles
                grp.pcs += currentPcs;
                grp.totalCons += currentCons;
                grp.maxShrinkage = Math.max(grp.maxShrinkage, currentShrink);
                grp.count += 1;
                grp.subItems.push(fc);
              }
            });

            groupsMap.forEach((entry) => {
              const req = Number(entry.requiredMeters.toFixed(2));
              const rec = Number(entry.alreadyReceivedMeters.toFixed(2));
              const joinedArticles = entry.articles.join(' + ') || 'General';

              // Use the exact color-wise piece sum (entry.pcs) from fabricConsumptions;
              // only fall back to article-level totals if entry.pcs is 0
              let totalPcs = entry.pcs || 0;
              if (totalPcs === 0 && Array.isArray(o.articles) && entry.articles.length > 0) {
                const sumFromArticles = entry.articles.reduce((sum, aName) => {
                  const art = o.articles.find(a => String(a.name || '').toLowerCase() === String(aName || '').toLowerCase());
                  return sum + (parseInt(art?.totalPieces || art?.pieces || art?.quantity || 0, 10) || 0);
                }, 0);
                if (sumFromArticles > 0) {
                  totalPcs = sumFromArticles;
                }
              }

              // Calculate ordered meters from storedPOs for this combined requirement
              let ord = 0;
              if (Array.isArray(storedPOs) && storedPOs.length > 0) {
                storedPOs.forEach(p => {
                  if (p.linked_sales_order_id === o.id && p.status !== 'Cancelled') {
                    (p.items || []).forEach(it => {
                      const itFab = String(it.fabric_name || it.fabric || '').toLowerCase().trim();
                      const grpFab = String(entry.fabric || '').toLowerCase().trim();
                      const itCol = String(it.color_name || it.color || '').toLowerCase().trim();
                      const grpCol = String(entry.color || '').toLowerCase().trim();
                      const itWidth = String(it.width || '').replace(/"/g, '').trim();
                      const grpWidth = String(entry.width || '').replace(/"/g, '').trim();
                      const itArt = String(it.article_name || it.article || '').toLowerCase().trim();

                      const fabMatch = !itFab || !grpFab || itFab === grpFab;
                      const colMatch = !itCol || !grpCol || itCol === grpCol;
                      const widthMatch = !itWidth || !grpWidth || itWidth === grpWidth;

                      const artMatch = !itArt ||
                        itArt === joinedArticles.toLowerCase() ||
                        entry.articles.some(a => a.toLowerCase().trim() === itArt) ||
                        joinedArticles.toLowerCase().includes(itArt);

                      if (fabMatch && colMatch && widthMatch && artMatch) {
                        ord += (parseFloat(it.quantity_meters) || 0);
                      }
                    });
                  }
                });
              }

              ord = Number(ord.toFixed(2));
              const isOrdered = req > 0 ? (ord >= req - 0.01) : (ord > 0);
              const isPartiallyOrdered = req > 0 && ord > 0.01 && ord < (req - 0.01);
              const pending = req > 0 ? Math.max(0, Number((req - ord).toFixed(2))) : 0;

              // Average consumption per garment piece = required meters / total garment pieces
              let finalCons = totalPcs > 0
                ? Number((req / totalPcs).toFixed(3))
                : (entry.totalCons > 0 ? Number(entry.totalCons.toFixed(3)) : 2.50);

              items.push({
                id: entry.id,
                style: entry.style,
                fabric: entry.fabric,
                fabricId: entry.fabricId,
                color: entry.color,
                colorHex: entry.colorHex,
                article: joinedArticles,
                articlesList: entry.articles,
                width: entry.width,
                rate: entry.rate || 0,
                requiredMeters: req,
                alreadyReceivedMeters: rec,
                orderedMeters: ord,
                pendingMeters: pending,
                status: isOrdered ? 'Already Ordered' : (isPartiallyOrdered ? 'Partially Ordered' : 'Not Ordered'),
                consumption: finalCons,
                shrinkage: entry.maxShrinkage || 4.0,
                pcs: totalPcs || (finalCons > 0 ? Math.floor(req / finalCons) : 0)
              });
    });
    return items;
  };

  const loadDynamicSalesOrders = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('erp_sales_orders_v1') || '[]');
      let storedPOs = [];
      try {
        const rawPOs = localStorage.getItem('erp_process_pos_v1') || localStorage.getItem('erp_process_pos');
        if (rawPOs) storedPOs = JSON.parse(rawPOs);
      } catch (e) { }

      if (Array.isArray(stored) && stored.length > 0) {
        return stored.map(o => {
          const styles = Array.isArray(o.styles) && o.styles.length > 0
            ? o.styles
            : (o.styleName ? [o.styleName] : []);

          const custName = (Array.isArray(o.customerOrders) && o.customerOrders.length > 0)
            ? o.customerOrders.map(c => c.customerName).filter(Boolean).join(', ')
            : (o.customerName || o.customer || o.buyerName || '');

          return {
            id: o.id,
            customer: custName,
            brand: o.brandName || o.brand || '',
            styleName: o.styleName || (styles[0] || ''),
            deliveryDate: o.expectedDelivery || o.deliveryDate || '',
            status: o.status || '',
            styles: styles,
            items: buildOrderItems(o, storedPOs, true),
            separateItems: buildOrderItems(o, storedPOs, false)
          };
        });
      }
    } catch (e) { }
    return [];
  };

  // Per-style toggle: true = combine same Fabric/Color/Width, false = keep articles separate
  const [combineStyleMap, setCombineStyleMap] = useState({});
  const isStyleCombined = (sIdx) => combineStyleMap[sIdx] !== false;
  const setStyleCombined = (sIdx, val) => setCombineStyleMap(prev => ({ ...prev, [sIdx]: val }));
  const [availableSalesOrders, setAvailableSalesOrders] = useState(() => loadDynamicSalesOrders());

  useEffect(() => {
    const handleOrdersSync = () => setAvailableSalesOrders(loadDynamicSalesOrders());
    window.addEventListener('storage', handleOrdersSync);
    window.addEventListener('erp_orders_updated', handleOrdersSync);
    return () => {
      window.removeEventListener('storage', handleOrdersSync);
      window.removeEventListener('erp_orders_updated', handleOrdersSync);
    };
  }, []);

  // Helper function to read Fabric Master from localStorage
  const loadFabricsFromMaster = () => {
    try {
      const s = localStorage.getItem('raindrop_fabrics_v1');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(f => ({
            id: f.id,
            name: f.qualityName || f.name,
            widths: Array.isArray(f.widths) && f.widths.length > 0 ? f.widths : ['44', '48', '58'],
            shrinkage: parseFloat(f.defaultShrinkage) || 4.0,
            defaultRate: f.defaultRate || ''
          }));
        }
      }
    } catch (e) { }
    return [
      { id: 'FAB-001', name: '100x100 Voile (Grey)', widths: ['44', '48', '58'], defaultRate: '', shrinkage: 4.0 },
      { id: 'FAB-002', name: 'Rayon 14kg Liva', widths: ['44', '48', '58'], defaultRate: '', shrinkage: 5.0 },
      { id: 'FAB-003', name: 'Cotton Cambric 60*60', widths: ['44', '58'], defaultRate: '', shrinkage: 3.5 }
    ];
  };

  // Helper function to read Color Master from localStorage
  const loadColorsFromMaster = () => {
    const list = getStoredColorsMaster();
    if (list && list.length > 0) return list;
    return [
      { id: 'COL-001', name: 'White', hex: '#FFFFFF' },
      { id: 'COL-002', name: 'Black', hex: '#000000' },
      { id: 'COL-003', name: 'Navy Blue', hex: '#000080' },
      { id: 'COL-004', name: 'Beige', hex: '#F5F5DC' },
      { id: 'COL-005', name: 'Dusty Rose', hex: '#DCAE96' }
    ];
  };

  // Helper function to read Article Master from localStorage
  const loadArticlesFromMaster = () => {
    try {
      const s = localStorage.getItem('erp_articles_v1') || localStorage.getItem('erp_articles_master');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(a => ({
            id: a.id || a.articleNo,
            name: a.name || a.articleName || a.title
          })).filter(a => Boolean(a.name));
        }
      }
    } catch (e) { }
    return [
      { id: 'ART-001', name: 'Kurta' },
      { id: 'ART-002', name: 'Pant' },
      { id: 'ART-003', name: 'Dupatta' },
      { id: 'ART-004', name: 'Top' },
      { id: 'ART-005', name: 'Anarkali' },
      { id: 'ART-006', name: 'Pyjama' },
      { id: 'ART-007', name: 'Kurta Set' }
    ];
  };

  // Helper function to read Vendors from localStorage
  const loadVendorsFromMaster = () => {
    try {
      const s = localStorage.getItem('raindrop_vendors_v1');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { }
    return initialVendors;
  };

  // Master State Hooks
  const [vendorList, setVendorList] = useState(loadVendorsFromMaster);
  const [fabricList, setFabricList] = useState(loadFabricsFromMaster);
  const [colorList, setColorList] = useState(loadColorsFromMaster);
  const [articleList, setArticleList] = useState(loadArticlesFromMaster);

  // Sync event listeners for dynamic masters
  useEffect(() => {
    const handleFabricsUpdate = () => setFabricList(loadFabricsFromMaster());
    const handleColorsUpdate = () => setColorList(loadColorsFromMaster());
    const handleArticlesUpdate = () => setArticleList(loadArticlesFromMaster());
    const handleVendorsUpdate = () => setVendorList(loadVendorsFromMaster());

    window.addEventListener('raindrop_fabrics_updated', handleFabricsUpdate);
    window.addEventListener('raindrop_colors_updated', handleColorsUpdate);
    window.addEventListener('erp_colors_updated', handleColorsUpdate);
    window.addEventListener('erp_articles_updated', handleArticlesUpdate);
    window.addEventListener('raindrop_vendors_updated', handleVendorsUpdate);

    return () => {
      window.removeEventListener('raindrop_fabrics_updated', handleFabricsUpdate);
      window.removeEventListener('raindrop_colors_updated', handleColorsUpdate);
      window.removeEventListener('erp_colors_updated', handleColorsUpdate);
      window.removeEventListener('erp_articles_updated', handleArticlesUpdate);
      window.removeEventListener('raindrop_vendors_updated', handleVendorsUpdate);
    };
  }, []);

  // Modal states for inline creation
  const [showInlineVendorModal, setShowInlineVendorModal] = useState(false);
  const [showInlineFabricModal, setShowInlineFabricModal] = useState(false);
  const [showInlineColorModal, setShowInlineColorModal] = useState(false);
  const [activeColorRowIndex, setActiveColorRowIndex] = useState(null);

  const handleVendorSaved = (newVendor) => {
    if (!newVendor) {
      setShowInlineVendorModal(false);
      return;
    }
    const vName = (newVendor.name || newVendor.vendorName || '').trim();
    const vId = newVendor.id || '';
    if (!vName) {
      setShowInlineVendorModal(false);
      return;
    }

    const updated = [newVendor, ...vendorList.filter(v => v.id !== vId && (v.name || v.vendorName) !== vName)];
    setVendorList(updated);
    try {
      localStorage.setItem('raindrop_vendors_v1', JSON.stringify(updated));
      window.dispatchEvent(new Event('raindrop_vendors_updated'));
    } catch (e) { }

    if (api && api.saveVendor) {
      api.saveVendor(newVendor).catch(() => { });
    }

    setVendorId(vId);
    setVendorName(vName);
    setShowAllVendors(true);
    setShowInlineVendorModal(false);
  };

  // Helper to auto-generate PO Number based on process type (Printing, Dyeing, etc.)
  const generateProcessPONumber = (type = 'Dyeing') => {
    let prefix = 'PPO';
    const lower = (type || '').toLowerCase();
    if (lower.includes('dye')) prefix = 'DYE';
    else if (lower.includes('print')) prefix = 'PRN';
    else if (lower.includes('process')) prefix = 'PRC';
    else if (lower.includes('embroid')) prefix = 'EMB';
    else if (lower.includes('wash')) prefix = 'WSH';
    else if (lower.includes('stitch')) prefix = 'STC';

    try {
      const rawStored = localStorage.getItem('erp_process_pos_v1') || localStorage.getItem('erp_process_pos') || '[]';
      const stored = JSON.parse(rawStored);
      const existingNums = (Array.isArray(stored) ? stored : []).map(p =>
        String(p.po_number || p.id || '').toUpperCase().trim()
      );
      for (let i = 0; i < 30; i++) {
        const rand4 = Math.floor(1000 + Math.random() * 9000);
        const candidate = `${prefix}-${rand4}`;
        if (!existingNums.includes(candidate) && !existingNums.includes(`PPO-${candidate}`) && !existingNums.includes(String(rand4))) {
          return candidate;
        }
      }
      return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    } catch (e) {
      return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  };

  // Process Type State
  const [processType, setProcessType] = useState(initialPO?.process_type || '');

  // Header State - Auto-generate unique PO number when creating new
  const [poNumber, setPoNumber] = useState(
    initialPO?.po_number
      ? String(initialPO.po_number).replace(/^PPO-/, '')
      : generateProcessPONumber(initialPO?.process_type || '')
  );
  const [date, setDate] = useState(
    initialPO?.date || new Date().toISOString().split('T')[0]
  );
  const [issueDate, setIssueDate] = useState(
    initialPO?.issue_date || ''
  );
  const [vendorId, setVendorId] = useState(initialPO?.vendor_id || '');
  const [vendorName, setVendorName] = useState(initialPO?.vendor_name || '');
  const [showAllVendors, setShowAllVendors] = useState(false);

  const handleProcessTypeChange = (newType) => {
    setProcessType(newType);
    if (!initialPO || !initialPO.po_number) {
      if (newType) {
        setPoNumber(generateProcessPONumber(newType));
      }
    }
  };

  // Requirement 2: Dynamically filter vendors strictly based on the selected Process PO Type
  const displayedVendors = React.useMemo(() => {
    if (!processType || showAllVendors || processType === 'All Processes') {
      return vendorList.filter((v) => v.active !== false || (v.name || v.vendorName) === vendorName);
    }
    const filtered = vendorList.filter((v) =>
      (v.active !== false || (v.name || v.vendorName) === vendorName) &&
      (vendorMatchesType(v, processType) || (v.name || v.vendorName) === vendorName)
    );
    return filtered;
  }, [vendorList, processType, showAllVendors, vendorName]);

  // Order Linkage
  const [isOrderLinked, setIsOrderLinked] = useState(
    initialPO ? Boolean(initialPO.linked_sales_order_id) : false
  );
  const [linkedOrderId, setLinkedOrderId] = useState(
    initialPO?.linked_sales_order_id || ''
  );

  // Style State
  const [styleCountOption, setStyleCountOption] = useState(() => {
    if (initialPO?.style_names && initialPO.style_names.length > 1) return '2+';
    return '1';
  });

  const [selectedStyles, setSelectedStyles] = useState(() => {
    if (initialPO?.style_names && initialPO.style_names.length > 0) {
      return initialPO.style_names;
    }
    return [];
  });

  const [customerBrandName, setCustomerBrandName] = useState(
    initialPO?.customer_brand_name || ''
  );
  const [deliveryDate, setDeliveryDate] = useState(
    initialPO?.delivery_date || ''
  );

  // Terms State - Zero Pre-filled text by default
  const [terms, setTerms] = useState(initialPO?.terms || '');

  // Line Items Template (PDF Section 3.1 & 3.2 - Clean empty defaults)
  const createBlankRow = (customStyle = '') => ({
    id: Date.now() + Math.random(),
    style_name: customStyle || (selectedStyles[0] || ''),
    fabric_id: '',
    fabric_name: '',
    color_id: '',
    color_name: '',
    color_hex: '#cbd5e1',
    article_name: '',
    width: '',
    quantity_meters: '',
    quantity_pieces: '',
    consumption_per_piece: '',
    shrinkage_percent: '',
    raw_fabric_meters: '',
    fabric_rate: '',
    dyeing_rate: '',
    total_actual_cost: '',
    total_amount: '',
    remarks: '',
    sample_photo: null,
    status: 'Not Ordered'
  });

  // Line Items - 1 blank row open by default for new PO
  const [items, setItems] = useState(() => {
    if (initialPO?.items && initialPO.items.length > 0) {
      return initialPO.items;
    }
    return [createBlankRow()];
  });

  const currentSelectedOrder = availableSalesOrders.find(o => o.id === linkedOrderId) || null;

  // Custom rates entered in Fabric Requirements table
  const [orderItemRates, setOrderItemRates] = useState({});

  // Requirement item IDs that have been selected / added to PO items
  const [selectedRequirementIds, setSelectedRequirementIds] = useState(
    () => (initialPO?.items || []).map(it => it.order_item_id).filter(Boolean)
  );

  // Toggle to hide selected requirement items from the active list
  const [hideSelectedRequirements, setHideSelectedRequirements] = useState(true);

  // Custom Styles Added by User
  const [customStyleInput, setCustomStyleInput] = useState('');
  const [addedCustomStyles, setAddedCustomStyles] = useState([]);
  const [draggedStyleIdx, setDraggedStyleIdx] = useState(null);
  const [dragOverStyleIdx, setDragOverStyleIdx] = useState(null);

  // Master Style Options (strictly dynamic from linked sales order, masters & user added styles)
  const masterStyleOptions = Array.from(new Set([
    ...(currentSelectedOrder?.styles || []),
    ...availableSalesOrders.flatMap(o => o.styles || []),
    ...(currentSelectedOrder?.items || []).map(it => it.article),
    ...(currentSelectedOrder?.items || []).map(it => it.style),
    ...availableSalesOrders.flatMap(o => (o.items || []).map(it => it.article)),
    ...articleList.map(a => a.name),
    ...addedCustomStyles
  ])).filter(Boolean);

  // Helper to resolve requirement items for each style in turn (PDF Section 3.2: Multi-Style display)
  const getRequirementsForStyle = (styleName, sIdx, shouldCombine = true) => {
    if (!styleName || !styleName.trim()) return [];
    const cleanStyle = styleName.trim().toLowerCase();

    // 1. If an order in availableSalesOrders directly matches this style
    const matchingOrder = availableSalesOrders.find(o =>
      (o.styles && o.styles.some(s => s.toLowerCase().trim() === cleanStyle)) ||
      (o.styleName && o.styleName.toLowerCase().trim() === cleanStyle) ||
      cleanStyle.includes(o.id.toLowerCase()) ||
      (o.items && o.items.some(it => String(it.style || '').toLowerCase().trim() === cleanStyle))
    );

    if (matchingOrder) {
      const mItems = shouldCombine ? matchingOrder.items : (matchingOrder.separateItems || matchingOrder.items);
      if (Array.isArray(mItems) && mItems.length > 0) {
        const exactStyleItems = mItems.filter(it =>
          String(it.style || '').toLowerCase().trim() === cleanStyle
        );
        if (exactStyleItems.length > 0) return exactStyleItems;
        return mItems;
      }
    }

    // 2. Check currentSelectedOrder items
    const curItems = currentSelectedOrder
      ? (shouldCombine ? currentSelectedOrder.items : (currentSelectedOrder.separateItems || currentSelectedOrder.items))
      : null;
    if (curItems && Array.isArray(curItems)) {
      // Check if any item matches the style name or article name
      const byArticleOrStyle = curItems.filter(it => {
        const itStyle = String(it.style || '').toLowerCase().trim();
        const itArt = String(it.article || '').toLowerCase().trim();
        return itStyle === cleanStyle ||
          itArt === cleanStyle ||
          itArt.includes(cleanStyle) ||
          cleanStyle.includes(itArt) ||
          (sIdx === 0 && (/top|kurta|shirt/i.test(cleanStyle) && /kurta|top|shirt/i.test(itArt))) ||
          (sIdx === 1 && (/bottom|pant|pyjama|salwar|penat/i.test(cleanStyle) && /pant|pyjama|salwar|penat|bottom/i.test(itArt)));
      });

      if (byArticleOrStyle.length > 0) return byArticleOrStyle;

      // If multi-style PO and current order has top and bottom articles, partition them
      if (styleCountOption === '2+' || styleCountOption === 'more') {
        const bottomItems = curItems.filter(it =>
          /pant|penat|pyjama|salwar|trouser|bottom/i.test(String(it.article || ''))
        );
        const topItems = curItems.filter(it =>
          !/pant|penat|pyjama|salwar|trouser|bottom/i.test(String(it.article || ''))
        );

        if (bottomItems.length > 0 && topItems.length > 0) {
          if (sIdx === 0) return topItems;
          if (sIdx === 1) return bottomItems;
        }
      }
    }

    // 3. Fallback for custom or master style:
    const defFab = fabricList[sIdx % Math.max(1, fabricList.length)] || { id: 'FAB-001', name: 'Cotton 100*100' };
    const defCol = colorList[0] || { name: 'Black', hex: '#000000' };
    const artName = sIdx === 1 ? 'Pant / Bottom' : 'Kurta / Top';

    return [
      {
        id: `REQ-${cleanStyle.replace(/\W+/g, '_')}-${sIdx + 1}`,
        style: styleName,
        fabric: defFab.name || 'Cotton 100*100',
        fabricId: defFab.id || 'FAB-001',
        color: defCol.name || 'Black',
        colorHex: defCol.hex || '#000000',
        article: artName,
        width: '44"',
        rate: 0,
        requiredMeters: 300,
        alreadyReceivedMeters: 0,
        orderedMeters: 0,
        pendingMeters: 300,
        status: 'Not Ordered',
        consumption: sIdx === 1 ? 2.0 : 2.5,
        shrinkage: 4.0,
        pcs: 100,
        isCustomStyleRequirement: true
      }
    ];
  };

  const handleAddCustomStyle = () => {
    if (isLocked) return;
    const trimmed = customStyleInput.trim();
    if (!trimmed) return;
    if (!addedCustomStyles.includes(trimmed)) {
      setAddedCustomStyles(prev => [...prev, trimmed]);
    }
    if (styleCountOption === '1') {
      setSelectedStyles([trimmed]);
      setItems(prev => prev.map(it => ({ ...it, style_name: trimmed })));
    } else {
      setSelectedStyles(prev => [...prev.filter(Boolean), trimmed]);
      if (items.length > 0 && !items[0].style_name) {
        updateItem(0, { style_name: trimmed });
      }
    }
    setCustomStyleInput('');
  };

  // Style handlers
  const handleStyleCountChange = (opt) => {
    if (isLocked) return;
    setStyleCountOption(opt);
    if (opt === '1') {
      const single = selectedStyles.length > 0 ? selectedStyles[0] : '';
      setSelectedStyles(single ? [single] : ['']);
      if (single) {
        setItems(prev => prev.map(it => ({ ...it, style_name: single })));
      }
    } else if (selectedStyles.length < 2) {
      setSelectedStyles([selectedStyles[0] || '', '']);
    }
  };

  const handleUpdateStyleAt = (idx, value) => {
    if (isLocked) return;
    const updated = [...selectedStyles];
    updated[idx] = value;
    setSelectedStyles(updated);
    if (styleCountOption === '1') {
      setItems(prev => prev.map(it => ({ ...it, style_name: value })));
    }
    // PDF Section 3.2: Starting from Style auto-fetches & links matching Sales Order data
    if (value && value.trim() && !linkedOrderId) {
      const cleanVal = value.trim().toLowerCase();
      const matchingOrder = availableSalesOrders.find(o =>
        (o.styles && o.styles.some(s => s.toLowerCase().trim() === cleanVal)) ||
        (o.styleName && o.styleName.toLowerCase().trim() === cleanVal) ||
        cleanVal.includes(o.id.toLowerCase()) ||
        (o.items && o.items.some(it =>
          String(it.style || '').toLowerCase().trim() === cleanVal ||
          String(it.article || '').toLowerCase().trim() === cleanVal
        ))
      );
      if (matchingOrder) {
        setIsOrderLinked(true);
        setLinkedOrderId(matchingOrder.id);
        if (matchingOrder.customer) setCustomerBrand(matchingOrder.customer);
        if (matchingOrder.deliveryDate) setDeliveryDate(matchingOrder.deliveryDate);
      }
    }
  };

  const handleAddStyleSlot = () => {
    if (isLocked) return;
    setSelectedStyles([...selectedStyles, '']);
  };

  const handleRemoveStyleSlot = (idx) => {
    if (isLocked) return;
    if (selectedStyles.length <= 1) {
      setSelectedStyles([]);
    } else {
      setSelectedStyles(selectedStyles.filter((_, i) => i !== idx));
    }
  };

  const handleReorderStyle = (fromIdx, toIdx) => {
    if (isLocked || fromIdx === toIdx) return;
    if (fromIdx < 0 || fromIdx >= selectedStyles.length || toIdx < 0 || toIdx >= selectedStyles.length) return;
    const updated = [...selectedStyles];
    const [movedItem] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, movedItem);
    setSelectedStyles(updated);
  };

  // Order selection handler
  const handleSelectOrder = (orderId) => {
    if (isLocked) return;
    setLinkedOrderId(orderId);
    setOrderItemRates({});
    setSelectedRequirementIds([]);
    const ord = availableSalesOrders.find(o => o.id === orderId);
    if (ord) {
      if (ord.brand) setCustomerBrandName(ord.brand);
      if (ord.deliveryDate) setDeliveryDate(ord.deliveryDate);
      if (ord.styles && ord.styles.length > 0) {
        setSelectedStyles(ord.styles);
        setStyleCountOption(ord.styles.length > 1 ? '2+' : '1');
      }
    }
  };

  // Section editable helper
  const isSectionEditable = (section) => {
    if (isLocked) return false;
    if (!isReadOnly) return true;
    return editingSection === section || editingSection === 'all';
  };

  // Get available widths for a specific item row from Fabric Master
  const getAvailableWidthsForItem = (item) => {
    if (item.fabric_id) {
      const matched = fabricList.find(f => f.id === item.fabric_id);
      if (matched && Array.isArray(matched.widths) && matched.widths.length > 0) {
        return matched.widths;
      }
    }
    return ['44', '48', '50', '54', '58', '60'];
  };

  // =========================================================================
  // PDF SECTION 3.2: SEARCH NARROWING LOGIC
  // - "Selecting styles narrows every subsequent selection automatically: only fabric
  //    qualities actually used by the selected style(s) are offered"
  // - "Selecting fabric then narrows the colour list to colours actually ordered in that fabric"
  // - "Selecting colour narrows the article list the same way"
  // - "When not linked to an order, full master data is available"
  // =========================================================================
  const getFilteredFabrics = (item) => {
    if (isOrderLinked && currentSelectedOrder && Array.isArray(currentSelectedOrder.items) && currentSelectedOrder.items.length > 0) {
      const activeStyles = selectedStyles.filter(Boolean);
      let relevantItems = currentSelectedOrder.items;
      if (item.style_name) {
        relevantItems = relevantItems.filter(it => it.style === item.style_name);
      } else if (activeStyles.length > 0) {
        relevantItems = relevantItems.filter(it => activeStyles.includes(it.style));
      }
      const orderFabricNames = Array.from(new Set(relevantItems.map(it => it.fabric).filter(Boolean)));
      if (orderFabricNames.length > 0) {
        const matched = fabricList.filter(f => orderFabricNames.includes(f.name));
        if (matched.length > 0) return matched;
      }
    }
    return fabricList;
  };

  const getFilteredColors = (item) => {
    if (isOrderLinked && currentSelectedOrder && Array.isArray(currentSelectedOrder.items) && currentSelectedOrder.items.length > 0) {
      let relevantItems = currentSelectedOrder.items;
      if (item.style_name) {
        relevantItems = relevantItems.filter(it => it.style === item.style_name);
      }
      if (item.fabric_name) {
        relevantItems = relevantItems.filter(it => it.fabric === item.fabric_name);
      }
      const orderColorNames = Array.from(new Set(relevantItems.map(it => it.color).filter(Boolean)));
      if (orderColorNames.length > 0) {
        const matched = colorList.filter(c => orderColorNames.includes(c.name));
        if (matched.length > 0) return matched;
      }
    }
    return colorList;
  };

  const getFilteredArticles = (item) => {
    if (isOrderLinked && currentSelectedOrder && Array.isArray(currentSelectedOrder.items) && currentSelectedOrder.items.length > 0) {
      let relevantItems = currentSelectedOrder.items;
      if (item.style_name) {
        relevantItems = relevantItems.filter(it => it.style === item.style_name);
      }
      if (item.fabric_name) {
        relevantItems = relevantItems.filter(it => it.fabric === item.fabric_name);
      }
      if (item.color_name) {
        relevantItems = relevantItems.filter(it => it.color === item.color_name);
      }
      const orderArticleNames = [];
      relevantItems.forEach(it => {
        if (it.article) orderArticleNames.push(it.article);
        if (Array.isArray(it.articlesList)) {
          it.articlesList.forEach(a => { if (a) orderArticleNames.push(a); });
        }
      });
      const uniqueOrderArticles = Array.from(new Set(orderArticleNames.filter(Boolean)));
      if (uniqueOrderArticles.length > 0) {
        const matched = [];
        uniqueOrderArticles.forEach(art => {
          const m = articleList.find(a => (a.name || '').toLowerCase() === art.toLowerCase());
          if (m) {
            matched.push(m);
          } else {
            matched.push({ id: art, name: art });
          }
        });
        if (matched.length > 0) return matched;
      }
    }
    return articleList;
  };

  // Recommended Dyeing/Job Work Rate by Width & Process Type (PDF Section 3.1 & 3.2)
  const getRecommendedDyeingRate = (item) => {
    const w = parseFloat(String(item.width || '').replace(/[^\d.]/g, '')) || 44;
    let base = w <= 44 ? 10 : (w <= 54 ? 12 : 15);
    const pType = String(processType || '').toLowerCase();
    if (pType.includes('print')) base += 5;
    else if (pType.includes('embroider')) base += 10;
    return base;
  };

  // Row update calculation using exact PDF Section 3.2 formulas
  const updateItem = (index, updates) => {
    if (isLocked) return;
    const updated = [...items];
    const item = { ...updated[index], ...updates };

    // PDF Section 12.1: Live re-validation of search narrowing when prior selection changes
    if (isOrderLinked && currentSelectedOrder) {
      if ('style_name' in updates && item.fabric_name) {
        const validFabrics = getFilteredFabrics(item);
        if (!validFabrics.some(f => f.name === item.fabric_name || f.id === item.fabric_id)) {
          item.fabric_id = '';
          item.fabric_name = '';
          item.color_id = '';
          item.color_name = '';
          item.color_hex = '';
          item.article_name = '';
        }
      }
      if (('style_name' in updates || 'fabric_id' in updates || 'fabric_name' in updates) && item.color_name) {
        const validColors = getFilteredColors(item);
        if (!validColors.some(c => c.name === item.color_name)) {
          item.color_id = '';
          item.color_name = '';
          item.color_hex = '';
          item.article_name = '';
        }
      }
      if (('style_name' in updates || 'fabric_id' in updates || 'fabric_name' in updates || 'color_name' in updates) && item.article_name) {
        const validArticles = getFilteredArticles(item);
        if (!validArticles.some(a => (a.name || a) === item.article_name)) {
          item.article_name = '';
        }
      }
    }

    // If fabric changed, lookup master shrinkage and default width
    if (updates.fabric_id && updates.fabric_id !== updated[index].fabric_id) {
      const matchedFab = fabricList.find(f => f.id === updates.fabric_id);
      if (matchedFab) {
        item.shrinkage_percent = matchedFab.shrinkage || 4.0;
        if (!item.width && matchedFab.widths && matchedFab.widths.length > 0) {
          item.width = String(matchedFab.widths[0]).replace(/"/g, '');
        }
      }
    }

    const shrinkage = parseFloat(item.shrinkage_percent) || 0;
    const consumption = parseFloat(item.consumption_per_piece) || 0;

    // Bi-directional calculation (PDF Section 3.2 Quantity Calculations):
    // If consumption is specified:
    // 1) Metres entered -> Pieces = Math.floor(meters / consumption) (rounded down to whole garments)
    // 2) Pieces entered -> Metres = pieces * consumption
    // 3) Raw fabric metres = Metres * (1 + shrinkage / 100)
    if ('quantity_meters' in updates) {
      const meters = parseFloat(updates.quantity_meters);
      if (!isNaN(meters) && meters > 0) {
        if (consumption > 0) {
          item.quantity_pieces = Math.floor(meters / consumption);
        }
        item.raw_fabric_meters = Number((meters * (1 + shrinkage / 100)).toFixed(2));
      } else {
        if (!('quantity_pieces' in updates)) item.quantity_pieces = '';
        item.raw_fabric_meters = '';
      }
    } else if ('quantity_pieces' in updates) {
      const pcs = parseFloat(updates.quantity_pieces);
      if (!isNaN(pcs) && pcs > 0) {
        if (consumption > 0) {
          const calculatedMeters = Number((pcs * consumption).toFixed(2));
          item.quantity_meters = calculatedMeters;
          item.raw_fabric_meters = Number((calculatedMeters * (1 + shrinkage / 100)).toFixed(2));
        }
      } else {
        if (!('quantity_meters' in updates)) item.quantity_meters = '';
        item.raw_fabric_meters = '';
      }
    } else if ('consumption_per_piece' in updates || 'shrinkage_percent' in updates) {
      const meters = parseFloat(item.quantity_meters);
      const pcs = parseFloat(item.quantity_pieces);
      if (consumption > 0) {
        if (!isNaN(meters) && meters > 0) {
          item.quantity_pieces = Math.floor(meters / consumption);
          item.raw_fabric_meters = Number((meters * (1 + shrinkage / 100)).toFixed(2));
        } else if (!isNaN(pcs) && pcs > 0) {
          const calculatedMeters = Number((pcs * consumption).toFixed(2));
          item.quantity_meters = calculatedMeters;
          item.raw_fabric_meters = Number((calculatedMeters * (1 + shrinkage / 100)).toFixed(2));
        }
      }
    }

    // Cost calculations: Total Actual Cost = Fabric Purchase Rate + Dyeing/Job Work Rate per Metre
    const fabRate = parseFloat(item.fabric_rate) || 0;
    const dyeRate = parseFloat(item.dyeing_rate) || 0;
    const totalCostPerMeter = fabRate + dyeRate;
    item.total_actual_cost = Number(totalCostPerMeter.toFixed(2));

    const qMeters = parseFloat(item.quantity_meters) || 0;
    item.total_amount = Number((qMeters * totalCostPerMeter).toFixed(2));

    updated[index] = item;
    setItems(updated);
  };

  const addItemRow = () => {
    if (isLocked) return;
    setItems([...items, createBlankRow()]);
  };

  const removeItemRow = (index) => {
    if (isLocked) return;
    const itemToRemove = items[index];
    if (itemToRemove && itemToRemove.order_item_id) {
      setSelectedRequirementIds(prev => prev.filter(id => id !== itemToRemove.order_item_id));
    }
    const remaining = items.filter((_, i) => i !== index);
    setItems(remaining.length > 0 ? remaining : [createBlankRow()]);
  };

  // Add Item from Order Requirement (PDF Section 3.2: auto-populate from Order)
  const handleSelectOrderItem = (orderItem) => {
    if (isLocked) return;
    const reqMeters = parseFloat(orderItem.pendingMeters || orderItem.requiredMeters || 0);
    const totalPcs = parseInt(orderItem.pcs, 10) || 0;
    const cons = totalPcs > 0 && reqMeters > 0
      ? Number((reqMeters / totalPcs).toFixed(3))
      : (parseFloat(orderItem.consumption) || 2.50);
    const shrink = parseFloat(orderItem.shrinkage) || 4.0;
    const calculatedPcs = totalPcs > 0 ? totalPcs : (reqMeters > 0 && cons > 0 ? Math.floor(reqMeters / cons) : '');
    const rawMtrs = reqMeters > 0 ? Number((reqMeters * (1 + shrink / 100)).toFixed(2)) : '';

    // Check if custom rate was entered in rate box (do not auto-fill order rate)
    const customRate = orderItemRates[orderItem.id];
    const itemRate = (customRate !== undefined && customRate !== '')
      ? (parseFloat(customRate) || 0)
      : '';

    // Match real fabric from fabricList so dropdown does not show "Select Fabric Quality"
    const matchedFab = fabricList.find(f =>
      (orderItem.fabricId && f.id === orderItem.fabricId) ||
      (orderItem.fabric && f.name && f.name.toLowerCase().trim() === orderItem.fabric.toLowerCase().trim())
    ) || fabricList.find(f =>
      orderItem.fabric && f.name && (f.name.toLowerCase().includes(orderItem.fabric.toLowerCase()) || orderItem.fabric.toLowerCase().includes(f.name.toLowerCase()))
    );

    const newRow = {
      id: Date.now() + Math.random(),
      order_item_id: orderItem.id,
      style_name: orderItem.style || selectedStyles[0] || '',
      fabric_id: matchedFab ? matchedFab.id : (orderItem.fabricId || 'FAB-001'),
      fabric_name: matchedFab ? matchedFab.name : (orderItem.fabric || '100x100 Voile (Grey)'),
      color_id: 'COL-001',
      color_name: orderItem.color || 'Beige',
      color_hex: orderItem.colorHex || '#F5F5DC',
      article_name: orderItem.article || 'Kurta',
      width: String(orderItem.width || '48').replace(/"/g, ''),
      quantity_meters: reqMeters || '',
      quantity_pieces: calculatedPcs,
      consumption_per_piece: cons,
      shrinkage_percent: shrink,
      raw_fabric_meters: rawMtrs,
      fabric_rate: itemRate !== '' ? itemRate : '',
      dyeing_rate: '',
      total_actual_cost: itemRate !== '' ? itemRate : 0,
      total_amount: (reqMeters > 0 && itemRate !== '') ? Number((reqMeters * itemRate).toFixed(2)) : 0,
      remarks: `Linked to Order requirement: ${orderItem.id} (${orderItem.article})`,
      sample_photo: null,
      status: 'Partially Ordered'
    };

    if (items.length === 1 && !items[0].fabric_name && !items[0].quantity_meters) {
      setItems([newRow]);
    } else {
      setItems([...items, newRow]);
    }

    // Mark as selected to hide/remove from pending list
    setSelectedRequirementIds(prev => prev.includes(orderItem.id) ? prev : [...prev, orderItem.id]);
  };

  // Standard terms insertion
  const handleInsertStandardTerms = () => {
    if (isLocked) return;
    setTerms('Goods delivered must be strictly as per sample and specification, within stipulated date. Any shade variance or defect exceeding standard tolerance will be subject to reprocessing or debit.');
  };

  // Grand Totals
  const grandTotalMeters = items.reduce((acc, it) => acc + (parseFloat(it.quantity_meters) || 0), 0);
  const grandTotalPieces = items.reduce((acc, it) => acc + (parseInt(it.quantity_pieces, 10) || 0), 0);
  const grandTotalCost = items.reduce((acc, it) => acc + (parseFloat(it.total_amount) || 0), 0);

  // Submit Handler (PDF Section 3.1 & 3.2)
  const handleSubmit = (andCreateChallan = false) => {
    if (isLocked) return;

    const cleanPoNum = poNumber ? String(poNumber).trim() : '';
    if (!cleanPoNum) {
      alert('Please enter a Process PO Number.');
      return;
    }
    if (!vendorName) {
      alert('Please select or specify a Job Work Vendor.');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one fabric line item.');
      return;
    }

    const fullPoId = cleanPoNum.startsWith('PPO-') ? cleanPoNum : `PPO-${cleanPoNum}`;

    let finalStatus = 'Issued';
    if (andCreateChallan === 'draft') {
      finalStatus = 'Draft';
    } else if (andCreateChallan === 'challan' || andCreateChallan === true) {
      finalStatus = 'Issued';
    } else {
      finalStatus = (initialPO?.status && initialPO.status !== 'Draft') ? initialPO.status : 'Issued';
    }

    const payload = {
      id: initialPO?.id || fullPoId,
      po_number: cleanPoNum.replace(/^PPO-/, ''),
      process_type: processType || 'Dyeing',
      process_name: processType || 'Dyeing',
      date: date,
      issue_date: issueDate,
      vendor_id: vendorId,
      vendor_name: vendorName,
      linked_sales_order_id: isOrderLinked ? linkedOrderId : null,
      customer_brand_name: customerBrandName,
      delivery_date: deliveryDate,
      style_names: selectedStyles.filter(Boolean),
      fabric_quality: items[0]?.fabric_name || 'Fabric',
      total_meters: Number(grandTotalMeters.toFixed(2)),
      total_pieces: grandTotalPieces,
      total_estimated_cost: Number(grandTotalCost.toFixed(2)),
      status: finalStatus,
      terms: terms,
      items: items,
      created_by: 'Saksham Garg',
      created_at: initialPO?.created_at || new Date().toISOString()
    };

    onSave(payload, andCreateChallan === true || andCreateChallan === 'challan');
  };

  return (
    <div className="process-po-form-container">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & WORKFLOW STATUS BAR                                       */}
      {/* ========================================================================= */}
      <div className="card border mb-3 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
        <div className="p-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-light rounded-circle border shadow-sm d-flex align-items-center justify-content-center p-0"
              onClick={handleExit}
              title="Back to Process PO List"
              style={{ width: '38px', height: '38px', borderColor: '#e2e8f0', backgroundColor: '#ffffff', color: '#334155', flexShrink: 0 }}
            >
              <i className="ti ti-arrow-left fs-18"></i>
            </button>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0 fw-bold text-dark fs-16">
                  {initialPO ? `Process PO #${poNumber}` : 'New Process PO'}
                </h5>
                {initialPO && (
                  isLocked ? (
                    <span
                      className="badge bg-white text-dark border px-2.5 py-1 fs-11 fw-semibold shadow-xs"
                      style={{ borderColor: '#cbd5e1' }}
                    >
                      <i className="ti ti-lock me-1 text-secondary"></i>Locked
                    </span>
                  ) : (
                    <span className={`badge px-2.5 py-1 fs-11 ${initialPO?.status === 'Sent to Vendor'
                      ? 'bg-primary-subtle text-primary border border-primary-subtle'
                      : initialPO?.status === 'Draft'
                        ? 'bg-light text-secondary border'
                        : 'bg-success-subtle text-success border border-success-subtle'
                      }`}>
                      {initialPO?.status || 'Draft'}
                    </span>
                  )
                )}
              </div>
              <p className="text-muted fs-11 mb-0">Job Work Procurement &amp; Fabric Dyeing Order</p>
            </div>
          </div>

          {initialPO && (
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3 d-flex align-items-center gap-1.5 rounded-2 shadow-xs"
                onClick={() => onPrintPO && onPrintPO(initialPO)}
              >
                <i className="ti ti-printer fs-14"></i>
                <span>Print Slip</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: PO PARAMETERS & ORDER DETAILS (PDF SECTION 3.1 & 3.2)             */}
      {/* ========================================================================= */}
      <div className="card border mb-4 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
        <div className="p-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: '#fafbfc' }}>
          <div className="d-flex align-items-center gap-2.5">
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
              <i className="ti ti-file-description fs-16"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-dark fs-14">PO Parameters &amp; Order Association</h6>
              <p className="text-muted fs-11 mb-0">PO Number, Date, Issue Date, Job Work Vendor &amp; optional Sales Order Link</p>
            </div>
          </div>

          {!isLocked && isReadOnly && editingSection !== 'header' && (
            <button
              type="button"
              className="btn btn-light btn-sm border text-dark px-2.5 py-1 rounded fs-12 fw-semibold"
              onClick={() => setEditingSection('header')}
            >
              <i className="ti ti-edit me-1"></i> Edit Header
            </button>
          )}
          {!isLocked && isReadOnly && editingSection === 'header' && (
            <button
              type="button"
              className="btn btn-success btn-sm px-2.5 py-1 rounded fs-12 fw-semibold"
              onClick={() => setEditingSection(null)}
            >
              <i className="ti ti-check me-1"></i> Done
            </button>
          )}
        </div>

        <div className="p-4">
          {/* Row 1 (FIRST): Vendor Type Selection, Vendor & Sales Order Association */}
          <div className="row g-3 mb-3 pb-3 border-bottom" style={{ borderColor: '#f1f5f9' }}>
            {/* Vendor Panel */}
            <div className="col-12 col-lg-6">
              <div
                className="p-3 border rounded-3 h-100 d-flex flex-column justify-content-between shadow-xs"
                style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
              >
                <div>
                  {/* Vendor Type Selection (Filter vendors based on Vendor / Process Order Type) */}
                  <div className="mb-2.5">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <label className="form-label fs-12 fw-semibold text-secondary mb-0 d-flex align-items-center gap-1.5">
                        <i className="ti ti-settings-cog text-primary fs-14"></i>
                        <span>Vendor Type</span>
                        <span className="text-danger">*</span>
                      </label>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-11 fw-semibold">
                        {displayedVendors.length} {processType ? (processType === 'All Processes' ? '' : `${processType} `) : ''}Vendor{displayedVendors.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <select
                      className="form-select form-select-sm bg-white fs-13 fw-semibold text-dark"
                      style={{ borderColor: '#cbd5e1', height: '36px', borderRadius: '8px' }}
                      value={processType}
                      disabled={!isSectionEditable('header')}
                      onChange={(e) => handleProcessTypeChange(e.target.value)}
                    >
                      <option value="">-- Select Vendor Type --</option>
                      <option value="Dyeing">Dyeing</option>
                      <option value="Printing">Printing</option>
                      <option value="Processing">Processing</option>
                      <option value="Embroidery">Embroidery</option>
                      <option value="Washing">Washing</option>
                      <option value="Stitching / Job Worker">Stitching / Job Worker</option>
                      <option value="All Processes">All Processes</option>
                    </select>
                  </div>

                  {/* Vendor Selection */}
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <label className="form-label fs-12 fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
                      <i className="ti ti-building-store fs-15 text-primary"></i>
                      <span>{processType ? (processType === 'All Processes' ? 'Job Work Vendor' : `${processType} Vendor`) : 'Vendor'}</span>
                      <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-muted text-decoration-none fs-11 d-flex align-items-center gap-1"
                        onClick={() => setShowAllVendors(!showAllVendors)}
                        title={showAllVendors ? (processType ? `Filter to ${processType} vendors only` : 'Filter vendors') : `Show all ${vendorList.length} vendors`}
                      >
                        <i className={`ti ti-${showAllVendors ? 'filter' : 'list'} fs-12`}></i>
                        <span>{showAllVendors ? (processType ? `Show only ${processType}` : 'Filter by Type') : `Show All (${vendorList.length})`}</span>
                      </button>
                      {isSectionEditable('header') && (
                        <button
                          type="button"
                          className="btn btn-sm btn-link p-0 text-primary text-decoration-none fs-12 fw-semibold d-flex align-items-center gap-1"
                          onClick={() => setShowInlineVendorModal(true)}
                        >
                          <i className="ti ti-plus fs-13"></i>
                          <span>New Vendor</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <select
                    className="form-select form-select-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '8px', color: '#0f172a' }}
                    value={vendorName}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => {
                      setVendorName(e.target.value);
                      const matched = vendorList.find((v) => (v.name || v.vendorName) === e.target.value);
                      if (matched) setVendorId(matched.id || '');
                    }}
                  >
                    <option value="" style={{ color: '#0f172a' }}>
                      -- Select {processType ? (processType === 'All Processes' ? 'Vendor' : `${processType} Vendor`) : 'Vendor'} --
                    </option>
                    {vendorName && !displayedVendors.some(v => (v.name || v.vendorName) === vendorName) && (
                      <option value={vendorName} style={{ color: '#0f172a' }}>
                        {vendorName} (Currently Selected)
                      </option>
                    )}
                    {displayedVendors.length === 0 ? (
                      <option value="" disabled>
                        {processType ? `No ${processType} vendors found in Vendor Master (${vendorList.length} total vendors)` : `No vendors found in Vendor Master (${vendorList.length} total vendors)`}
                      </option>
                    ) : (
                      displayedVendors.map((v) => {
                        const vTypes = getVendorTypes(v);
                        const typeBadge = vTypes.length > 0 ? ` [${vTypes.join(', ')}]` : '';
                        const cityText = v.city ? ` (${v.city})` : '';
                        return (
                          <option key={v.id || v.name} value={v.name || v.vendorName} style={{ color: '#0f172a' }}>
                            {v.name || v.vendorName}{typeBadge}{cityText}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
                <div className="mt-2 text-muted fs-11 d-flex align-items-center justify-content-between">
                  <span className="d-flex align-items-center gap-1">
                    <i className="ti ti-info-circle fs-13 text-secondary"></i>
                    <span>
                      {!processType || processType === 'All Processes' || showAllVendors
                        ? `Listing all ${vendorList.length} vendors from Vendor Master`
                        : `Filtered to ${processType} vendors (${displayedVendors.length} of ${vendorList.length})`}
                    </span>
                  </span>
                  {!showAllVendors && processType && processType !== 'All Processes' && (
                    <button
                      type="button"
                      className="btn btn-link p-0 fs-11 text-primary text-decoration-none"
                      onClick={() => setShowAllVendors(true)}
                    >
                      Bypass filter
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sales Order / Customer Panel */}
            <div className="col-12 col-lg-6">
              <div
                className="p-3 border rounded-3 h-100 d-flex flex-column justify-content-between shadow-xs"
                style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label fs-12 fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
                      <i className="ti ti-link fs-15 text-primary"></i>
                      <span>Sales Order Association</span>
                    </label>

                    <div className="form-check form-switch mb-0 d-flex align-items-center gap-1.5">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="linkOrderSwitch"
                        style={{ width: '34px', height: '18px', cursor: 'pointer' }}
                        checked={isOrderLinked}
                        disabled={!isSectionEditable('header')}
                        onChange={(e) => {
                          setIsOrderLinked(e.target.checked);
                          if (!e.target.checked) setLinkedOrderId('');
                        }}
                      />
                      <label
                        className="form-check-label fs-11 fw-semibold text-secondary cursor-pointer"
                        htmlFor="linkOrderSwitch"
                      >
                        {isOrderLinked ? 'Linked to Order' : 'Direct (No Order)'}
                      </label>
                    </div>
                  </div>

                  {isOrderLinked ? (
                    <div>
                      <select
                        className="form-select form-select-sm bg-white fs-13"
                        style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '8px' }}
                        value={linkedOrderId}
                        disabled={!isSectionEditable('header')}
                        onChange={(e) => handleSelectOrder(e.target.value)}
                      >
                        <option value="">-- Select Sales Order to Link --</option>
                        {availableSalesOrders.length === 0 ? (
                          <option value="" disabled>No active sales orders found</option>
                        ) : (
                          availableSalesOrders.map(ord => (
                            <option key={ord.id} value={ord.id}>
                              {ord.id}{ord.customer ? ` — ${ord.customer}` : ''}{ord.styleName ? ` • ${ord.styleName}` : ''}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-white fs-13"
                        placeholder="Enter brand or customer reference (e.g. Zara, FabIndia)..."
                        style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '8px' }}
                        value={customerBrandName}
                        disabled={!isSectionEditable('header')}
                        onChange={(e) => setCustomerBrandName(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-2 text-muted fs-11 d-flex align-items-center gap-1">
                  <i className="ti ti-info-circle fs-13 text-secondary"></i>
                  <span>
                    {isOrderLinked
                      ? 'Automatically synchronizes required vs received meterage'
                      : 'Optional manual customer / brand tag for independent tracking'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: 4 Primary PO Parameters from PDF Section 3.1 with Auto-Generate */}
          <div className="row g-3">
            {/* Process PO Number */}
            <div className="col-12 col-sm-6 col-lg-3">
              <label className="form-label fs-12 fw-semibold text-secondary mb-1.5 d-flex align-items-center gap-1">
                <span>Process PO Number</span>
                <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control form-control-sm bg-white font-monospace fw-bold text-dark fs-13"
                style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '8px' }}
                placeholder="e.g. DYE-7613"
                value={poNumber}
                disabled={!isSectionEditable('header')}
                onChange={(e) => setPoNumber(e.target.value)}
              />
            </div>

            {/* PO Date */}
            <div className="col-12 col-sm-6 col-lg-3">
              <label className="form-label fs-12 fw-semibold text-secondary mb-1.5 d-flex align-items-center gap-1">
                <span>PO Date</span>
                <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className="form-control form-control-sm bg-white fs-13"
                style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '8px' }}
                value={date}
                disabled={!isSectionEditable('header')}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Issue Date */}
            <div className="col-12 col-sm-6 col-lg-3">
              <label className="form-label fs-12 fw-semibold text-secondary mb-1.5">
                Issue Date
              </label>
              <input
                type="date"
                className="form-control form-control-sm bg-white fs-13"
                style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '8px' }}
                value={issueDate}
                disabled={!isSectionEditable('header')}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>

            {/* Target Delivery Date (PDF Section 3.1) */}
            <div className="col-12 col-sm-6 col-lg-3">
              <label className="form-label fs-12 fw-semibold text-secondary mb-1.5">
                Target Delivery Date
              </label>
              <input
                type="date"
                className="form-control form-control-sm bg-white fs-13"
                style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '8px' }}
                value={deliveryDate}
                disabled={!isSectionEditable('header')}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: STYLE PARAMETERS & SELECTION NARROWING (PDF SECTION 3.2)         */}
      {/* ========================================================================= */}
      <div className="card border mb-4 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
        <div className="p-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: '#fafbfc' }}>
          <div className="d-flex align-items-center gap-2.5">
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <i className="ti ti-hanger fs-16"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-dark fs-14">Style Parameters &amp; Selection Narrowing</h6>
              <p className="text-muted fs-11 mb-0">PDF Section 3.2: User is asked how many styles this PO covers, opening corresponding style boxes</p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {!isLocked && isReadOnly && editingSection !== 'styles' && (
              <button
                type="button"
                className="btn btn-light btn-sm border text-dark px-2.5 py-1 rounded fs-12 fw-semibold"
                onClick={() => setEditingSection('styles')}
              >
                <i className="ti ti-edit me-1"></i> Edit Styles
              </button>
            )}
            {!isLocked && isReadOnly && editingSection === 'styles' && (
              <button
                type="button"
                className="btn btn-success btn-sm px-2.5 py-1 rounded fs-12 fw-semibold"
                onClick={() => setEditingSection(null)}
              >
                <i className="ti ti-check me-1"></i> Done
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          {/* Question directly from PDF Section 3.2:
              "The user is asked how many styles this PO covers (one, or more); that count determines how many Style input boxes open" */}
          <div className="p-3 mb-3 border rounded-3 bg-light d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ borderColor: '#e2e8f0' }}>
            <div className="d-flex align-items-center gap-2.5">
              <span className="badge rounded-circle bg-primary text-white p-1 d-flex align-items-center justify-content-center fs-12 fw-bold" style={{ width: '24px', height: '24px' }}>
                ?
              </span>
              <div>
                <span className="fw-bold text-dark fs-13 d-block">
                  How many styles does this PO cover?
                </span>
                <span className="text-muted fs-11">
                  (PDF Section 3.2: Determines how many Style input boxes open)
                </span>
              </div>
            </div>

            <div className="btn-group btn-group-sm p-1 bg-white border rounded-2" style={{ borderColor: '#cbd5e1' }}>
              <button
                type="button"
                disabled={!isSectionEditable('styles')}
                className={`btn btn-sm px-3 rounded-1 d-flex align-items-center gap-1.5 ${styleCountOption === '1' ? 'btn-primary text-white shadow-xs fw-semibold' : 'btn-light text-secondary border-0'}`}
                onClick={() => handleStyleCountChange('1')}
              >
                <i className="ti ti-shirt fs-13"></i>
                <span>One Style</span>
              </button>
              <button
                type="button"
                disabled={!isSectionEditable('styles')}
                className={`btn btn-sm px-3 rounded-1 d-flex align-items-center gap-1.5 ${styleCountOption === '2+' ? 'btn-primary text-white shadow-xs fw-semibold' : 'btn-light text-secondary border-0'}`}
                onClick={() => handleStyleCountChange('2+')}
              >
                <i className="ti ti-layers-subtract fs-13"></i>
                <span>More than One (2+ Styles)</span>
              </button>
            </div>
          </div>

          {/* Dynamic Style Inputs */}
          {styleCountOption === '1' ? (
            /* Single Style Layout */
            <div className="p-3 border rounded-3 bg-white" style={{ borderColor: '#e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <label className="form-label fs-12 fw-semibold text-secondary mb-0 d-flex align-items-center gap-1.5">
                  <i className="ti ti-shirt text-primary fs-15"></i>
                  <span>Style Name</span>
                  <span className="text-danger">*</span>
                </label>
                <span className="badge bg-indigo-subtle text-primary border border-indigo-200 fs-11">
                  Single Style Mode
                </span>
              </div>
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-6">
                  <select
                    className="form-select form-select-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '8px' }}
                    value={selectedStyles[0] || ''}
                    disabled={!isSectionEditable('styles')}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateStyleAt(0, val);
                    }}
                  >
                    <option value="">-- Choose Style from Order / Masters --</option>
                    {masterStyleOptions.length === 0 ? (
                      <option value="" disabled>No styles found — Type custom name and click Add</option>
                    ) : (
                      masterStyleOptions.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))
                    )}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <div className="input-group input-group-sm">
                    <input
                      type="text"
                      className="form-control form-control-sm bg-white fs-13"
                      placeholder="Type custom style name (e.g. Kurta)..."
                      style={{ borderColor: '#cbd5e1', height: '38px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}
                      value={customStyleInput}
                      disabled={!isSectionEditable('styles')}
                      onChange={(e) => setCustomStyleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomStyle();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm px-3 d-flex align-items-center gap-1"
                      style={{ height: '38px', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}
                      disabled={!isSectionEditable('styles') || !customStyleInput.trim()}
                      onClick={handleAddCustomStyle}
                    >
                      <i className="ti ti-plus fs-13"></i>
                      <span>Add Style</span>
                    </button>
                  </div>
                </div>
              </div>
              {selectedStyles[0] && (
                <div className="mt-2.5 pt-2 border-top d-flex align-items-center justify-content-between fs-12">
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted">Active Style:</span>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 fs-12 fw-semibold">
                      {selectedStyles[0]}
                    </span>
                  </div>
                  {isSectionEditable('styles') && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-danger p-0 text-decoration-none fs-11"
                      onClick={() => handleUpdateStyleAt(0, '')}
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Multi-Style Layout (PDF: "user sets which style displays on top or bottom") */
            <div>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fs-12 fw-semibold text-secondary">
                  Style Components (PDF: User sets which style displays on top or bottom)
                </span>
                {isSectionEditable('styles') && (
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded fs-12 d-flex align-items-center gap-1"
                    onClick={handleAddStyleSlot}
                  >
                    <i className="ti ti-plus fs-13"></i>
                    <span>Add Another Style</span>
                  </button>
                )}
              </div>

              <div className="d-flex flex-column gap-2.5">
                {selectedStyles.map((styleVal, sIdx) => {
                  const positionLabel = sIdx === 0 ? 'Top Style' : (sIdx === 1 ? 'Bottom Style' : `Style #${sIdx + 1}`);
                  const isDragging = draggedStyleIdx === sIdx;
                  const isOver = dragOverStyleIdx === sIdx && !isDragging;

                  return (
                    <div
                      key={sIdx}
                      draggable={isSectionEditable('styles')}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', String(sIdx));
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedStyleIdx(sIdx);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverStyleIdx !== sIdx) {
                          setDragOverStyleIdx(sIdx);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverStyleIdx === sIdx) {
                          setDragOverStyleIdx(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        if (!isNaN(fromIndex) && fromIndex !== sIdx) {
                          handleReorderStyle(fromIndex, sIdx);
                        }
                        setDraggedStyleIdx(null);
                        setDragOverStyleIdx(null);
                      }}
                      onDragEnd={() => {
                        setDraggedStyleIdx(null);
                        setDragOverStyleIdx(null);
                      }}
                      className={`p-3 border rounded-3 bg-white d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-2xs ${isDragging ? 'opacity-50' : ''
                        } ${isOver ? 'border-primary border-2 bg-primary-subtle' : ''
                        }`}
                      style={{
                        borderColor: isOver ? '#3b82f6' : '#e2e8f0',
                        cursor: isSectionEditable('styles') ? 'grab' : 'default',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div className="d-flex align-items-center gap-2.5" style={{ minWidth: '180px' }}>
                        {isSectionEditable('styles') && (
                          <div
                            className="text-secondary d-flex align-items-center"
                            style={{ cursor: 'grab', userSelect: 'none' }}
                            title="Drag & Drop to reorder style position"
                          >
                            <i className="ti ti-grip-vertical fs-18"></i>
                          </div>
                        )}
                        <span className="badge bg-primary text-white px-2.5 py-1.5 fs-11 font-monospace rounded-pill">
                          #{sIdx + 1}
                        </span>
                        <div>
                          <span className="fw-semibold text-dark fs-13 d-block">{positionLabel}</span>
                          <small className="text-muted fs-11">Display Priority {sIdx + 1}</small>
                        </div>
                      </div>

                      <div
                        className="d-flex align-items-center gap-2 flex-grow-1"
                        style={{ minWidth: '300px' }}
                        draggable={false}
                        onMouseDown={(e) => e.stopPropagation()}
                        onDragStart={(e) => e.stopPropagation()}
                      >
                        <select
                          className="form-select form-select-sm bg-white fs-13 flex-grow-1"
                          style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                          value={styleVal}
                          disabled={!isSectionEditable('styles')}
                          onChange={(e) => handleUpdateStyleAt(sIdx, e.target.value)}
                        >
                          <option value="">-- Choose from Master / Order --</option>
                          {masterStyleOptions.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>

                        <input
                          type="text"
                          className="form-control form-control-sm bg-white fs-13 flex-grow-1"
                          placeholder="Or type custom style..."
                          style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                          value={styleVal}
                          disabled={!isSectionEditable('styles')}
                          onChange={(e) => handleUpdateStyleAt(sIdx, e.target.value)}
                        />
                      </div>

                      {/* Right Action: Delete Button only (Top/Bottom buttons removed, drag & drop enabled) */}
                      {isSectionEditable('styles') && selectedStyles.length > 1 && (
                        <div className="d-flex align-items-center">
                          <button
                            type="button"
                            className="btn btn-light btn-sm border text-danger px-2.5 py-1.5 rounded"
                            title="Remove this style slot"
                            onClick={() => handleRemoveStyleSlot(sIdx)}
                          >
                            <i className="ti ti-trash fs-14"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Linked Sales Order Item Selection Matrix (PDF Section 3.2: Multi-Style display in turn) */}
          {isOrderLinked && currentSelectedOrder && (
            <>
              {(styleCountOption === '2+' || selectedStyles.length > 1) ? (
                    selectedStyles.map((styleVal, sIdx) => {
                      const positionLabel = sIdx === 0
                        ? 'Top Style'
                        : sIdx === 1
                          ? 'Bottom Style'
                          : `Style Component #${sIdx + 1}`;

                      const styleItems = getRequirementsForStyle(styleVal, sIdx, isStyleCombined(sIdx));
                      const isStyleSet = Boolean(styleVal && styleVal.trim());

                      if (!isStyleSet) {
                        return (
                          <div key={`pending-style-${sIdx}`} className="mt-4 p-3 border rounded-3 bg-white shadow-xs" style={{ borderColor: '#cbd5e1', borderStyle: 'dashed' }}>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-secondary text-white px-2.5 py-1 fs-11 font-monospace rounded-pill">
                                  #{sIdx + 1}
                                </span>
                                <span className="fs-13 fw-bold text-dark">{positionLabel} (Pending Selection)</span>
                              </div>
                              <span className="badge bg-light text-muted border fs-11">Display Priority {sIdx + 1}</span>
                            </div>

                            <div className="p-3 bg-light-subtle rounded-2 text-center">
                              <i className="ti ti-hand-click fs-22 text-primary mb-1 d-block opacity-75"></i>
                              <span className="fw-semibold text-dark fs-13 d-block">
                                Choose or Type Style #{sIdx + 1} ({positionLabel}) in the slot above
                              </span>
                              <span className="text-muted fs-12 mb-2 d-block">
                                Its fabric qualities, colors, articles and required meters will automatically open in this box (PDF Section 3.2).
                              </span>

                              {/* Quick-Pick suggestions from available styles/articles */}
                              <div className="d-flex align-items-center justify-content-center gap-1.5 flex-wrap mt-2">
                                <span className="text-muted fs-11 me-1">Quick Select:</span>
                                {masterStyleOptions.slice(0, 6).map(st => (
                                  <button
                                    key={st}
                                    type="button"
                                    className="btn btn-xs btn-outline-primary py-0.5 px-2 rounded fs-11 shadow-xs"
                                    onClick={() => handleUpdateStyleAt(sIdx, st)}
                                  >
                                    + {st}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      const totalReqCount = styleItems.length;
                      const selectedCount = styleItems.filter(ordIt =>
                        selectedRequirementIds.includes(ordIt.id) || items.some(it => it.order_item_id === ordIt.id)
                      ).length;

                      const visibleItems = styleItems.filter(ordIt => {
                        const isSelected = selectedRequirementIds.includes(ordIt.id) ||
                          items.some(it => it.order_item_id === ordIt.id);
                        if (hideSelectedRequirements && isSelected) {
                          return false;
                        }
                        return true;
                      });

                      return (
                        <div key={`style-box-${sIdx}-${styleVal}`} className="mt-4 p-3 border rounded-3 bg-light shadow-xs" style={{ borderColor: '#e2e8f0' }}>
                          <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-primary text-white px-2.5 py-1 fs-11 font-monospace rounded-pill">
                                #{sIdx + 1}
                              </span>
                                      <span className="fs-13 fw-bold text-dark d-flex align-items-center gap-1.5">
                                        <i className="ti ti-clipboard-list text-primary"></i>
                                        Fabric Requirements for #{sIdx + 1} {positionLabel}: <span className="text-primary ms-1">{styleVal}</span>
                                      </span>
                                      {selectedCount > 0 && (
                                        <span className="badge bg-success-subtle text-success border border-success-subtle fs-11">
                                          ✓ {selectedCount} Selected &amp; Added
                                        </span>
                                      )}
                                    </div>

                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                      <div className="btn-group btn-group-xs p-0.5 bg-white border rounded-2" style={{ borderColor: '#cbd5e1' }} title="Combine articles with same Fabric, Color & Width for this style">
                                        <button
                                          type="button"
                                          className={`btn btn-xs px-2 py-0.5 fs-11 rounded-1 ${isStyleCombined(sIdx) ? 'btn-primary text-white fw-semibold' : 'btn-light text-secondary border-0'}`}
                                          onClick={() => setStyleCombined(sIdx, true)}
                                        >
                                          Combine Same
                                        </button>
                                        <button
                                          type="button"
                                          className={`btn btn-xs px-2 py-0.5 fs-11 rounded-1 ${!isStyleCombined(sIdx) ? 'btn-primary text-white fw-semibold' : 'btn-light text-secondary border-0'}`}
                                          onClick={() => setStyleCombined(sIdx, false)}
                                        >
                                          Keep Separate
                                        </button>
                                      </div>
                                      {selectedCount > 0 && (
                                        <button
                                          type="button"
                                          className="btn btn-xs btn-outline-secondary py-0.5 px-2 fs-11 rounded d-flex align-items-center gap-1 shadow-xs"
                                          onClick={() => setHideSelectedRequirements(prev => !prev)}
                                        >
                                          <i className={`ti ${hideSelectedRequirements ? 'ti-eye' : 'ti-eye-off'} fs-12`}></i>
                                          <span>{hideSelectedRequirements ? `Show Hidden (${selectedCount})` : 'Hide Selected'}</span>
                                        </button>
                                      )}
                                      <span className="badge bg-white text-secondary border fs-11">
                                        {positionLabel} (Priority {sIdx + 1})
                                      </span>
                                    </div>
                                  </div>

                                  <div className="table-responsive">
                                      <table className="table table-sm table-bordered bg-white align-middle mb-0" style={{ fontSize: '12px' }}>
                                        <thead className="table-light">
                                          <tr>
                                            <th>Style</th>
                                            <th>Fabric Quality</th>
                                            <th>Color</th>
                                            <th>Article</th>
                                            <th>Width</th>
                                            <th className="text-end" style={{ width: '115px' }}>Rate (₹)</th>
                                            <th className="text-end">Required (m)</th>
                                            <th className="text-end">Already Received (m)</th>
                                            <th className="text-end">Pending (m)</th>
                                            <th className="text-center">Status</th>
                                            <th className="text-center" style={{ width: '90px' }}>Action</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {visibleItems.length === 0 ? (
                                            <tr>
                                              <td colSpan={11} className="text-center py-4 text-muted bg-white">
                                                <div className="d-flex flex-column align-items-center gap-1.5 py-2">
                                                  <i className="ti ti-circle-check text-success fs-28 mb-1"></i>
                                                  <span className="fw-semibold text-dark fs-13">All fabric requirements for {styleVal} have been selected!</span>
                                                  <span className="text-muted fs-11">Selected items have been added to the Fabric &amp; Processing Line Items table below.</span>
                                                  {selectedRequirementIds.length > 0 && (
                                                    <button
                                                      type="button"
                                                      className="btn btn-outline-primary btn-xs mt-1 py-1 px-2.5 rounded fs-11 shadow-xs"
                                                      onClick={() => setHideSelectedRequirements(false)}
                                                    >
                                                      <i className="ti ti-eye me-1"></i> View / Edit Selected Items
                                                    </button>
                                                  )}
                                                </div>
                                              </td>
                                            </tr>
                                          ) : (
                                            visibleItems.map((ordIt) => {
                                              const isAlreadySelected = selectedRequirementIds.includes(ordIt.id) ||
                                                items.some(it => it.order_item_id === ordIt.id);
                                              const isFullyOrdered = ordIt.requiredMeters > 0
                                                ? (ordIt.orderedMeters >= ordIt.requiredMeters || ordIt.status === 'Already Ordered')
                                                : (ordIt.status === 'Already Ordered' && ordIt.orderedMeters > 0);

                                              return (
                                                <tr key={ordIt.id} className={isAlreadySelected ? 'table-success-subtle' : isFullyOrdered ? 'table-light text-muted' : ''}>
                                                  <td className="fw-medium">{ordIt.style || styleVal}</td>
                                                  <td>{ordIt.fabric}</td>
                                                  <td>
                                                    <span className="d-inline-flex align-items-center gap-1">
                                                      <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: ordIt.colorHex, border: '1px solid #999' }} />
                                                      {ordIt.color}
                                                    </span>
                                                  </td>
                                                  <td>
                                                    {ordIt.articlesList && ordIt.articlesList.length > 1 ? (
                                                      <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                                        <span className="fw-semibold text-primary" title={ordIt.article}>
                                                          {ordIt.article}
                                                        </span>
                                                        <span className="badge bg-light text-dark border fs-11" title="Sum of pieces across all combined articles">
                                                          {ordIt.pcs} pcs
                                                        </span>
                                                      </div>
                                                    ) : (
                                                      <div className="d-flex align-items-center gap-1.5">
                                                        <span>{ordIt.article}</span>
                                                        {ordIt.pcs > 0 && (
                                                          <span className="badge bg-light text-muted border fs-11">
                                                            {ordIt.pcs} pcs
                                                          </span>
                                                        )}
                                                      </div>
                                                    )}
                                                  </td>
                                                  <td>{ordIt.width}"</td>

                                                  {/* Editable Rate Box */}
                                                  <td className="text-end" style={{ width: '115px' }}>
                                                    <div className="input-group input-group-sm" style={{ width: '105px', marginLeft: 'auto' }}>
                                                      <span className="input-group-text px-1 text-muted bg-light" style={{ fontSize: '11px' }}>₹</span>
                                                      <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        className="form-control form-control-sm text-end px-1.5 py-0.5 fw-semibold bg-white"
                                                        style={{ fontSize: '12px', borderColor: '#cbd5e1', height: '28px' }}
                                                        value={orderItemRates[ordIt.id] !== undefined ? orderItemRates[ordIt.id] : ''}
                                                        placeholder="0.00"
                                                        disabled={isLocked || isFullyOrdered || isAlreadySelected}
                                                        onChange={(e) => {
                                                          const val = e.target.value;
                                                          setOrderItemRates(prev => ({
                                                            ...prev,
                                                            [ordIt.id]: val
                                                          }));
                                                        }}
                                                        title="Enter or modify fabric purchase rate per metre"
                                                      />
                                                    </div>
                                                  </td>

                                                  <td className="text-end fw-semibold">{ordIt.requiredMeters.toFixed(2)}</td>
                                                  <td className="text-end text-success">{ordIt.alreadyReceivedMeters.toFixed(2)}</td>
                                                  <td className="text-end fw-bold text-dark">{ordIt.pendingMeters.toFixed(2)}</td>
                                                  <td className="text-center">
                                                    {isAlreadySelected ? (
                                                      <span className="badge bg-success-subtle text-success border border-success-subtle fs-10">
                                                        ✓ Added to PO
                                                      </span>
                                                    ) : isFullyOrdered ? (
                                                      <span className="badge bg-secondary-subtle text-secondary border fs-10">
                                                        🔒 Already Ordered
                                                      </span>
                                                    ) : ordIt.orderedMeters > 0 ? (
                                                      <span className="badge bg-warning-subtle text-warning border fs-10">
                                                        Partially Ordered
                                                      </span>
                                                    ) : (
                                                      <span className="badge bg-light text-secondary border fs-10">
                                                        Not Ordered
                                                      </span>
                                                    )}
                                                  </td>

                                                  {/* Action Column */}
                                                  <td className="text-center">
                                                    {isAlreadySelected ? (
                                                      <span className="text-success fs-11 fw-bold d-inline-flex align-items-center gap-1">
                                                        <i className="ti ti-check fs-13"></i> Selected
                                                      </span>
                                                    ) : isFullyOrdered ? (
                                                      <button type="button" className="btn btn-sm btn-light border py-0 px-2 fs-11 text-muted" disabled>
                                                        Locked
                                                      </button>
                                                    ) : (
                                                      <button
                                                        type="button"
                                                        disabled={isLocked}
                                                        className="btn btn-sm btn-outline-primary py-0 px-2 fs-11 fw-semibold shadow-xs"
                                                        onClick={() => handleSelectOrderItem({ ...ordIt, style: ordIt.style || styleVal })}
                                                        title="Select this requirement and add to PO items below"
                                                      >
                                                        <i className="ti ti-plus me-1"></i> Select
                                                      </button>
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            })
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                  );
              })
            ) : (
              /* Single Style Display */
              <div className="mt-4 p-3 border rounded-3 bg-light" style={{ borderColor: '#e2e8f0' }}>
                {(() => {
                  const singleItems = isStyleCombined(0)
                    ? (currentSelectedOrder.items || [])
                    : (currentSelectedOrder.separateItems || currentSelectedOrder.items || []);
                  const selectedCount = singleItems.filter(ordIt =>
                    selectedRequirementIds.includes(ordIt.id) || items.some(it => it.order_item_id === ordIt.id)
                  ).length;
                  return (
                    <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fs-12 fw-bold text-dark d-flex align-items-center gap-1.5">
                          <i className="ti ti-clipboard-list text-primary"></i>
                          Fabric Requirements for {currentSelectedOrder.id} ({currentSelectedOrder.customer})
                        </span>
                        {selectedCount > 0 && (
                          <span className="badge bg-success-subtle text-success border border-success-subtle fs-11">
                            ✓ {selectedCount} Selected &amp; Added
                          </span>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <div className="btn-group btn-group-xs p-0.5 bg-white border rounded-2" style={{ borderColor: '#cbd5e1' }} title="Combine articles with same Fabric, Color & Width">
                          <button
                            type="button"
                            className={`btn btn-xs px-2 py-0.5 fs-11 rounded-1 ${isStyleCombined(0) ? 'btn-primary text-white fw-semibold' : 'btn-light text-secondary border-0'}`}
                            onClick={() => setStyleCombined(0, true)}
                          >
                            Combine Same
                          </button>
                          <button
                            type="button"
                            className={`btn btn-xs px-2 py-0.5 fs-11 rounded-1 ${!isStyleCombined(0) ? 'btn-primary text-white fw-semibold' : 'btn-light text-secondary border-0'}`}
                            onClick={() => setStyleCombined(0, false)}
                          >
                            Keep Separate
                          </button>
                        </div>
                        {selectedCount > 0 && (
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-secondary py-0.5 px-2 fs-11 rounded d-flex align-items-center gap-1 shadow-xs"
                            onClick={() => setHideSelectedRequirements(prev => !prev)}
                          >
                            <i className={`ti ${hideSelectedRequirements ? 'ti-eye' : 'ti-eye-off'} fs-12`}></i>
                            <span>{hideSelectedRequirements ? `Show Hidden (${selectedCount})` : 'Hide Selected'}</span>
                          </button>
                        )}
                        <span className="badge bg-white text-secondary border fs-11">
                          Required vs Received Balance
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="table-responsive">
                  <table className="table table-sm table-bordered bg-white align-middle mb-0" style={{ fontSize: '12px' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Style</th>
                        <th>Fabric Quality</th>
                        <th>Color</th>
                        <th>Article</th>
                        <th>Width</th>
                        <th className="text-end" style={{ width: '115px' }}>Rate (₹)</th>
                        <th className="text-end">Required (m)</th>
                        <th className="text-end">Already Received (m)</th>
                        <th className="text-end">Pending (m)</th>
                        <th className="text-center">Status</th>
                        <th className="text-center" style={{ width: '90px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const baseItems = isStyleCombined(0)
                          ? (currentSelectedOrder.items || [])
                          : (currentSelectedOrder.separateItems || currentSelectedOrder.items || []);
                        const visibleItems = baseItems.filter(ordIt => {
                          const isSelected = selectedRequirementIds.includes(ordIt.id) ||
                            items.some(it => it.order_item_id === ordIt.id);
                          if (hideSelectedRequirements && isSelected) {
                            return false;
                          }
                          return true;
                        });

                        if (visibleItems.length === 0) {
                          return (
                            <tr>
                              <td colSpan={11} className="text-center py-4 text-muted bg-white">
                                <div className="d-flex flex-column align-items-center gap-1.5 py-2">
                                  <i className="ti ti-circle-check text-success fs-28 mb-1"></i>
                                  <span className="fw-semibold text-dark fs-13">All fabric requirements have been selected!</span>
                                  <span className="text-muted fs-11">Selected items have been added to the Fabric &amp; Processing Line Items table below.</span>
                                  {selectedRequirementIds.length > 0 && (
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary btn-xs mt-1 py-1 px-2.5 rounded fs-11 shadow-xs"
                                      onClick={() => setHideSelectedRequirements(false)}
                                    >
                                      <i className="ti ti-eye me-1"></i> View / Edit Selected Items ({selectedRequirementIds.length})
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return visibleItems.map((ordIt) => {
                          const isAlreadySelected = selectedRequirementIds.includes(ordIt.id) ||
                            items.some(it => it.order_item_id === ordIt.id);
                          const isFullyOrdered = ordIt.requiredMeters > 0
                            ? (ordIt.orderedMeters >= ordIt.requiredMeters || ordIt.status === 'Already Ordered')
                            : (ordIt.status === 'Already Ordered' && ordIt.orderedMeters > 0);

                          return (
                            <tr key={ordIt.id} className={isAlreadySelected ? 'table-success-subtle' : isFullyOrdered ? 'table-light text-muted' : ''}>
                              <td className="fw-medium">{ordIt.style}</td>
                              <td>{ordIt.fabric}</td>
                              <td>
                                <span className="d-inline-flex align-items-center gap-1">
                                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: ordIt.colorHex, border: '1px solid #999' }} />
                                  {ordIt.color}
                                </span>
                              </td>
                              <td>
                                {ordIt.articlesList && ordIt.articlesList.length > 1 ? (
                                  <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                    <span className="fw-semibold text-primary" title={ordIt.article}>
                                      {ordIt.article}
                                    </span>
                                    <span className="badge bg-light text-dark border fs-11" title="Sum of pieces across all combined articles">
                                      {ordIt.pcs} pcs
                                    </span>
                                  </div>
                                ) : (
                                  <div className="d-flex align-items-center gap-1.5">
                                    <span>{ordIt.article}</span>
                                    {ordIt.pcs > 0 && (
                                      <span className="badge bg-light text-muted border fs-11">
                                        {ordIt.pcs} pcs
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td>{ordIt.width}"</td>

                              {/* Editable Rate Box */}
                              <td className="text-end" style={{ width: '115px' }}>
                                <div className="input-group input-group-sm" style={{ width: '105px', marginLeft: 'auto' }}>
                                  <span className="input-group-text px-1 text-muted bg-light" style={{ fontSize: '11px' }}>₹</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    className="form-control form-control-sm text-end px-1.5 py-0.5 fw-semibold bg-white"
                                    style={{ fontSize: '12px', borderColor: '#cbd5e1', height: '28px' }}
                                    value={orderItemRates[ordIt.id] !== undefined ? orderItemRates[ordIt.id] : ''}
                                    placeholder="0.00"
                                    disabled={isLocked || isFullyOrdered || isAlreadySelected}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setOrderItemRates(prev => ({
                                        ...prev,
                                        [ordIt.id]: val
                                      }));
                                    }}
                                    title="Enter or modify fabric purchase rate per metre"
                                  />
                                </div>
                              </td>

                              <td className="text-end fw-semibold">{ordIt.requiredMeters.toFixed(2)}</td>
                              <td className="text-end text-success">{ordIt.alreadyReceivedMeters.toFixed(2)}</td>
                              <td className="text-end fw-bold text-dark">{ordIt.pendingMeters.toFixed(2)}</td>
                              <td className="text-center">
                                {isAlreadySelected ? (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle fs-10">
                                    ✓ Added to PO
                                  </span>
                                ) : isFullyOrdered ? (
                                  <span className="badge bg-secondary-subtle text-secondary border fs-10">
                                    🔒 Already Ordered
                                  </span>
                                ) : ordIt.orderedMeters > 0 ? (
                                  <span className="badge bg-warning-subtle text-warning border fs-10">
                                    Partially Ordered
                                  </span>
                                ) : (
                                  <span className="badge bg-light text-secondary border fs-10">
                                    Not Ordered
                                  </span>
                                )}
                              </td>

                              {/* Action Column: When selected, button goes away / hides */}
                              <td className="text-center">
                                {isAlreadySelected ? (
                                  <span className="text-success fs-11 fw-bold d-inline-flex align-items-center gap-1">
                                    <i className="ti ti-check fs-13"></i> Selected
                                  </span>
                                ) : isFullyOrdered ? (
                                  <button type="button" className="btn btn-sm btn-light border py-0 px-2 fs-11 text-muted" disabled>
                                    Locked
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isLocked}
                                    className="btn btn-sm btn-outline-primary py-0 px-2 fs-11 fw-semibold shadow-xs"
                                    onClick={() => handleSelectOrderItem(ordIt)}
                                    title="Select this requirement and add to PO items below"
                                  >
                                    <i className="ti ti-plus me-1"></i> Select
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )
            }
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: FABRIC & PROCESSING LINE ITEMS (SQUISH-PROOF MIN-WIDTH 1440PX)   */}
                                {/* ========================================================================= */}
                                <div className="card border mb-4 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
                                  <div className="p-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: '#fafbfc' }}>
                                    <div className="d-flex align-items-center gap-2.5">
                                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                                        <i className="ti ti-layers-linked fs-16"></i>
                                      </div>
                                      <div>
                                        <h6 className="mb-0 fw-bold text-dark fs-14">Fabric &amp; Processing Line Items</h6>
                                        <p className="text-muted fs-11 mb-0">Bi-directional calculation, shrinkage %, dyeing rate recommendation &amp; swatch</p>
                                      </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-2">
                                      {!isLocked && isSectionEditable('items') && (
                                        <button
                                          type="button"
                                          className="btn btn-primary btn-sm px-3 rounded-2 d-flex align-items-center gap-1.5 shadow-xs"
                                          onClick={addItemRow}
                                        >
                                          <i className="ti ti-plus fs-14"></i>
                                          <span>Add Manual Line Item</span>
                                        </button>
                                      )}

                                      {!isLocked && isReadOnly && editingSection !== 'items' && (
                                        <button
                                          type="button"
                                          className="btn btn-light btn-sm border text-dark px-2.5 py-1 rounded fs-12 fw-semibold"
                                          onClick={() => setEditingSection('items')}
                                        >
                                          <i className="ti ti-edit me-1"></i> Edit Items
                                        </button>
                                      )}
                                      {!isLocked && isReadOnly && editingSection === 'items' && (
                                        <button
                                          type="button"
                                          className="btn btn-success btn-sm px-2.5 py-1 rounded fs-12 fw-semibold"
                                          onClick={() => setEditingSection(null)}
                                        >
                                          <i className="ti ti-check me-1"></i> Done
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="p-0">
                                    {/* Table Responsive Wrapper with Min-Width Guarantee */}
                                    <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                      <style>{`
              .line-items-po-table th,
              .line-items-po-table td {
                padding: 6px 6px !important;
                vertical-align: middle;
              }
              .line-items-po-table input::-webkit-outer-spin-button,
              .line-items-po-table input::-webkit-inner-spin-button {
                -webkit-appearance: none !important;
                margin: 0 !important;
              }
              .line-items-po-table input[type=number] {
                -moz-appearance: textfield !important;
              }
              .line-items-po-table .form-select-clean {
                background-position: right 6px center !important;
                background-size: 10px 8px !important;
                padding-right: 20px !important;
                padding-left: 8px !important;
              }
            `}</style>
                                      <table
                                        className="table table-bordered align-middle mb-0 line-items-po-table"
                                        style={{ minWidth: '1540px', tableLayout: 'fixed', fontSize: '13px' }}
                                      >
                                        <thead style={{ background: '#f8fafc' }}>
                                          <tr style={{ color: '#475569', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            <th className="text-center py-2" style={{ width: '38px' }}>#</th>
                                            <th style={{ width: '220px' }}>
                                              <div className="d-flex align-items-center justify-content-between text-nowrap">
                                                <span>FABRIC QUALITY *</span>
                                                {!isLocked && isSectionEditable('items') && (
                                                  <button
                                                    type="button"
                                                    className="btn btn-link btn-sm p-0 text-primary text-decoration-none fs-11"
                                                    onClick={() => setShowInlineFabricModal(true)}
                                                  >
                                                    + New
                                                  </button>
                                                )}
                                              </div>
                                            </th>
                                            <th style={{ width: '195px' }}>
                                              <div className="d-flex align-items-center justify-content-between text-nowrap">
                                                <span>COLOR SHADE *</span>
                                                {!isLocked && isSectionEditable('items') && (
                                                  <button
                                                    type="button"
                                                    className="btn btn-link btn-sm p-0 text-primary text-decoration-none fs-11"
                                                    onClick={() => {
                                                      setActiveColorRowIndex(0);
                                                      setShowInlineColorModal(true);
                                                    }}
                                                  >
                                                    + New
                                                  </button>
                                                )}
                                              </div>
                                            </th>
                                            <th style={{ width: '170px' }}>ARTICLE</th>
                                            <th style={{ width: '110px' }}>WIDTH</th>
                                            <th style={{ width: '100px' }} className="text-center" title="Consumption per garment piece in metres">CONS (M)</th>
                                            <th style={{ width: '115px' }} className="text-end text-dark">METRES *</th>
                                            <th style={{ width: '100px' }} className="text-end text-dark">PIECES *</th>
                                            <th style={{ width: '100px' }} className="text-end">FAB RATE (₹)</th>
                                            <th style={{ width: '105px' }} className="text-end">DYE RATE (₹)</th>
                                            <th style={{ width: '105px' }} className="text-end text-nowrap">TOTAL/M (₹)</th>
                                            <th style={{ width: '120px' }} className="text-end text-success text-nowrap">TOTAL AMOUNT (₹)</th>
                                            <th style={{ width: '80px' }} className="text-center text-nowrap">SWATCH</th>
                                            {!isLocked && isSectionEditable('items') && (
                                              <th style={{ width: '75px' }} className="text-center text-nowrap">ACTION</th>
                                            )}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {items.length === 0 ? (
                                            <tr>
                                              <td colSpan={!isLocked && isSectionEditable('items') ? 14 : 13} className="text-center py-5 bg-white">
                                                <div className="py-4">
                                                  <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center p-3 mb-2 text-muted" style={{ width: '54px', height: '54px' }}>
                                                    <i className="ti ti-layers-linked fs-24"></i>
                                                  </div>
                                                  <h6 className="fw-semibold text-dark fs-14 mb-1">No Line Items Added Yet</h6>
                                                  <p className="text-muted fs-12 mb-3">Click "+ Add Manual Line Item" or select requirements from a linked Sales Order above.</p>
                                                  {!isLocked && (
                                                    <button
                                                      type="button"
                                                      className="btn btn-primary btn-sm px-3 shadow-xs"
                                                      onClick={addItemRow}
                                                    >
                                                      <i className="ti ti-plus me-1"></i> Add First Line Item
                                                    </button>
                                                  )}
                                                </div>
                                              </td>
                                            </tr>
                                          ) : (
                                            items.map((item, idx) => {
                                              const rowWidthOptions = getAvailableWidthsForItem(item);
                                              const filteredFabrics = getFilteredFabrics(item);
                                              const filteredColors = getFilteredColors(item);
                                              const filteredArticles = getFilteredArticles(item);

                                              return (
                                                <tr key={item.id || idx}>
                                                  <td className="text-center fw-bold text-muted">{idx + 1}</td>

                                                  {/* Fabric Quality from Master (Search Narrowing via PDF Section 3.2) */}
                                                  <td>
                                                    <select
                                                      className="form-select form-select-sm fs-13 bg-white w-100 form-select-clean"
                                                      value={item.fabric_id || ''}
                                                      disabled={!isSectionEditable('items')}
                                                      style={{ borderColor: '#cbd5e1', height: '36px' }}
                                                      onChange={(e) => {
                                                        const f = fabricList.find(fab => fab.id === e.target.value);
                                                        if (f) {
                                                          updateItem(idx, {
                                                            fabric_id: f.id,
                                                            fabric_name: f.name,
                                                            shrinkage_percent: f.shrinkage || 4.0
                                                          });
                                                        } else {
                                                          updateItem(idx, { fabric_id: '', fabric_name: '' });
                                                        }
                                                      }}
                                                    >
                                                      <option value="">Select Fabric Quality</option>
                                                      {item.fabric_id && !filteredFabrics.some(fab => fab.id === item.fabric_id) && (
                                                        <option value={item.fabric_id}>{item.fabric_name || item.fabric_id}</option>
                                                      )}
                                                      {filteredFabrics.map(fab => (
                                                        <option key={fab.id} value={fab.id}>{fab.name}</option>
                                                      ))}
                                                    </select>
                                                    {selectedStyles.filter(Boolean).length > 1 ? (
                                                      <div className="d-flex align-items-center gap-1 mt-1 text-nowrap">
                                                        <span className="text-muted fs-11">Style:</span>
                                                        <select
                                                          className="form-select form-select-xs border-0 p-0 fs-11 fw-semibold text-dark bg-transparent"
                                                          style={{ outline: 'none', cursor: 'pointer', maxWidth: '140px' }}
                                                          value={item.style_name || selectedStyles[0] || ''}
                                                          disabled={!isSectionEditable('items')}
                                                          onChange={(e) => updateItem(idx, { style_name: e.target.value })}
                                                        >
                                                          {selectedStyles.filter(Boolean).map(st => (
                                                            <option key={st} value={st}>{st}</option>
                                                          ))}
                                                        </select>
                                                      </div>
                                                    ) : (
                                                      Boolean((item.style_name || selectedStyles[0]) && (item.style_name || selectedStyles[0]) !== 'Standard') && (
                                                        <div className="text-muted fs-11 mt-1 text-truncate" title={item.style_name || selectedStyles[0]}>
                                                          Style: <strong className="text-dark">{item.style_name || selectedStyles[0]}</strong>
                                                        </div>
                                                      )
                                                    )}
                                                  </td>

                                                  {/* Color Shade from Master (Search Narrowing via PDF Section 3.2) */}
                                                  <td>
                                                    <div className="d-flex align-items-center bg-white border rounded px-2 w-100" style={{ borderColor: '#cbd5e1', height: '36px' }}>
                                                      <span style={{ width: '16px', height: '16px', borderRadius: '3px', background: item.color_hex || '#cbd5e1', marginRight: '8px', border: '1px solid #999', flexShrink: 0 }} />
                                                      <select
                                                        className="border-0 p-0 fs-13 bg-transparent text-dark fw-medium w-100"
                                                        style={{ outline: 'none' }}
                                                        value={item.color_name || ''}
                                                        disabled={!isSectionEditable('items')}
                                                        onChange={(e) => {
                                                          const c = colorList.find(col => col.name === e.target.value);
                                                          if (c) {
                                                            updateItem(idx, { color_id: c.id, color_name: c.name, color_hex: c.hex || '#cbd5e1' });
                                                          } else {
                                                            updateItem(idx, { color_name: e.target.value });
                                                          }
                                                        }}
                                                      >
                                                        <option value="">Select Color</option>
                                                        {filteredColors.map(c => (
                                                          <option key={c.id || c.name} value={c.name}>{c.name}</option>
                                                        ))}
                                                      </select>
                                                    </div>
                                                  </td>

                                                  {/* Article from Master (Search Narrowing via PDF Section 3.2) */}
                                                  <td>
                                                    <select
                                                      className="form-select form-select-sm bg-white fs-13 w-100 form-select-clean"
                                                      style={{ borderColor: '#cbd5e1', height: '36px' }}
                                                      value={item.article_name || ''}
                                                      disabled={!isSectionEditable('items')}
                                                      onChange={(e) => updateItem(idx, { article_name: e.target.value })}
                                                    >
                                                      <option value="">Select Article</option>
                                                      {item.article_name && !filteredArticles.some(a => (a.name || a) === item.article_name) && (
                                                        <option value={item.article_name}>{item.article_name}</option>
                                                      )}
                                                      {filteredArticles.map(a => (
                                                        <option key={a.id || a.name} value={a.name}>{a.name}</option>
                                                      ))}
                                                    </select>
                                                  </td>

                                                  {/* Width from Fabric Master */}
                                                  <td>
                                                    <select
                                                      className="form-select form-select-sm bg-white fs-13 w-100 form-select-clean"
                                                      style={{ borderColor: '#cbd5e1', height: '36px' }}
                                                      value={item.width || ''}
                                                      disabled={!isSectionEditable('items')}
                                                      onChange={(e) => updateItem(idx, { width: e.target.value })}
                                                    >
                                                      <option value="">Width</option>
                                                      {item.width && !rowWidthOptions.some(w => String(w).replace(/"/g, '') === String(item.width).replace(/"/g, '')) && (
                                                        <option value={String(item.width).replace(/"/g, '')}>{String(item.width).replace(/"/g, '')}"</option>
                                                      )}
                                                      {rowWidthOptions.map(w => {
                                                        const cleanW = String(w).replace(/"/g, '');
                                                        return <option key={cleanW} value={cleanW}>{cleanW}"</option>;
                                                      })}
                                                    </select>
                                                  </td>

                                                  {/* Dynamic Consumption Formula Input (PDF Section 3.2) */}
                                                  <td>
                                                    <input
                                                      type="number"
                                                      step="0.01"
                                                      placeholder="m/pc"
                                                      className="form-control form-control-sm text-center bg-white fs-13 w-100"
                                                      style={{ borderColor: '#cbd5e1', height: '36px' }}
                                                      value={item.consumption_per_piece}
                                                      disabled={!isSectionEditable('items')}
                                                      title="Fabric consumption per piece in metres (e.g. 2.60)"
                                                      onChange={(e) => updateItem(idx, { consumption_per_piece: e.target.value })}
                                                    />
                                                  </td>

                                                  {/* Metres (PDF Section 3.2: entering metres auto-computes pieces) */}
                                                  <td>
                                                    <input
                                                      type="number"
                                                      step="any"
                                                      placeholder="0.00"
                                                      className="form-control form-control-sm text-end fw-semibold text-dark bg-white fs-13 w-100"
                                                      style={{ borderColor: '#cbd5e1', height: '36px' }}
                                                      value={item.quantity_meters}
                                                      disabled={!isSectionEditable('items')}
                                                      onChange={(e) => updateItem(idx, { quantity_meters: e.target.value })}
                                                    />
                                                    {parseFloat(item.quantity_meters) > 0 && (
                                                      <div className="text-muted text-end fs-10 mt-0.5 text-nowrap" title="Raw fabric required factoring shrinkage">
                                                        Raw: {item.raw_fabric_meters}m ({item.shrinkage_percent || 0}%)
                                                      </div>
                                                    )}
                                                  </td>

                                                  {/* Pieces (PDF Section 3.2: entering pieces auto-computes metres) */}
                                                  <td>
                                                    <input
                                                      type="number"
                                                      placeholder="0"
                                                      className="form-control form-control-sm text-end fw-semibold text-dark bg-white fs-13 w-100"
                                                      style={{ borderColor: '#cbd5e1', height: '36px' }}
                                                      value={item.quantity_pieces}
                                                      disabled={!isSectionEditable('items')}
                                                      onChange={(e) => updateItem(idx, { quantity_pieces: e.target.value })}
                                                    />
                                                  </td>

                                                  {/* Fabric Rate */}
                                                  <td>
                                                    <input
                                                      type="number"
                                                      step="any"
                                                      placeholder="0.00"
                                                      className="form-control form-control-sm text-end bg-white fs-13 w-100"
                                                      style={{ borderColor: '#cbd5e1', height: '36px' }}
                                                      value={item.fabric_rate}
                                                      disabled={!isSectionEditable('items')}
                                                      onChange={(e) => updateItem(idx, { fabric_rate: e.target.value })}
                                                    />
                                                  </td>

                        {/* Dyeing Rate */}
                        <td>
                          <input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            className="form-control form-control-sm text-end bg-white fs-13 w-100"
                            style={{ borderColor: '#cbd5e1', height: '36px' }}
                            value={item.dyeing_rate}
                            disabled={!isSectionEditable('items')}
                            onChange={(e) => updateItem(idx, { dyeing_rate: e.target.value })}
                          />
                        </td>

                                                  {/* Total Actual Cost per Metre (PDF: Fabric Rate + Dyeing Rate) in clean box */}
                                                  <td>
                                                    <div
                                                      className="form-control form-control-sm text-end fw-semibold text-dark bg-light d-flex align-items-center justify-content-end fs-13 w-100"
                                                      style={{ borderColor: '#cbd5e1', height: '36px', minWidth: '90px' }}
                                                      title="Total Actual Cost per Metre (Fabric Rate + Dyeing Rate)"
                                                    >
                                                      ₹{Number(item.total_actual_cost || 0).toFixed(2)}
                                                    </div>
                                                  </td>

                                                  {/* Total Line Amount in clean box */}
                                                  <td>
                                                    <div
                                                      className="form-control form-control-sm text-end fw-bold text-success bg-success-subtle d-flex align-items-center justify-content-end fs-13 w-100"
                                                      style={{ borderColor: '#a7f3d0', height: '36px', minWidth: '100px' }}
                                                      title="Total Line Item Amount (Metres × Total Cost/m)"
                                                    >
                                                      ₹{Number(item.total_amount || 0).toFixed(2)}
                                                    </div>
                                                  </td>

                        {/* Swatch Photo: Camera Capture or File Chooser (PDF Section 3.2) */}
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            <label
                              className={`btn btn-sm btn-light border p-1 rounded-2 mb-0 ${isLocked ? 'disabled' : ''}`}
                              style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                              title="Capture Swatch via Camera"
                            >
                              <i className={`ti ${item.sample_photo ? 'ti-photo-check text-success' : 'ti-camera text-muted'} fs-14`}></i>
                              {!isLocked && (
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="d-none"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (re) => updateItem(idx, { sample_photo: re.target.result });
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              )}
                            </label>
                            {!isLocked && (
                              <label
                                className="btn btn-sm btn-light border p-1 rounded-2 mb-0"
                                style={{ cursor: 'pointer' }}
                                title="Choose Swatch Image File"
                              >
                                <i className="ti ti-upload text-muted fs-14"></i>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="d-none"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (re) => updateItem(idx, { sample_photo: re.target.result });
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            )}
                            {item.sample_photo && !isLocked && (
                              <button
                                type="button"
                                className="btn btn-link btn-sm text-danger p-0 text-decoration-none"
                                title="Remove swatch photo"
                                onClick={() => updateItem(idx, { sample_photo: null })}
                              >
                                <i className="ti ti-x fs-12"></i>
                              </button>
                            )}
                          </div>
                        </td>

                                                  {/* Action: Delete Row */}
                                                  {!isLocked && isSectionEditable('items') && (
                                                    <td className="text-center">
                                                      <button
                                                        type="button"
                                                        className="btn btn-link btn-sm text-danger p-0 text-decoration-none"
                                                        title="Delete row"
                                                        onClick={() => removeItemRow(idx)}
                                                      >
                                                        <i className="ti ti-trash fs-14"></i>
                                                      </button>
                                                    </td>
                                                  )}
                                                </tr>
                                              );
                                            })
                                          )}
                                        </tbody>
                                        {items.length > 0 && (
                                          <tfoot style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                                            <tr>
                                              <td colSpan={6} className="text-end text-secondary fs-12 py-2">
                                                GRAND TOTALS:
                                              </td>
                                              <td className="text-end text-dark fs-13 py-2">
                                                {grandTotalMeters.toFixed(2)} m
                                              </td>
                                              <td className="text-end text-dark fs-13 py-2">
                                                {grandTotalPieces} pcs
                                              </td>
                                              <td colSpan={2} className="text-end text-secondary fs-12 py-2">
                                                Total Actual Job Cost:
                                              </td>
                                              <td colSpan={2} className="text-end py-2">
                                                <div
                                                  className="form-control form-control-sm text-end fw-bold text-success bg-success-subtle d-inline-flex align-items-center justify-content-end fs-13 px-3"
                                                  style={{ borderColor: '#a7f3d0', height: '36px', minWidth: '110px' }}
                                                  title="Grand Total Actual Job Cost"
                                                >
                                                  ₹{grandTotalCost.toFixed(2)}
                                                </div>
                                              </td>
                                              <td colSpan={!isLocked && isSectionEditable('items') ? 2 : 1}></td>
                                            </tr>
                                          </tfoot>
                                        )}
                                      </table>
                                    </div>
                                  </div>

        {/* Running PO Summary Table below items */}
        {items.length > 0 && (
          <div className="p-3 border-top bg-light" style={{ borderColor: '#e2e8f0' }}>
            <span className="fs-11 fw-bold text-secondary text-uppercase d-block mb-1.5">
              <i className="ti ti-table me-1"></i> Running PO Summary:
            </span>
            <div className="d-flex flex-wrap gap-2">
              {items.map((it, i) => (
                <div key={i} className="badge bg-white text-dark border p-2 d-flex align-items-center gap-2 shadow-2xs" style={{ borderColor: '#cbd5e1' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: it.color_hex || '#cbd5e1', border: '1px solid #999' }} />
                  <span><strong>{it.color_name || 'Item'}</strong>:</span>
                  <span>{it.fabric_name ? `${it.fabric_name}${it.width ? ` (${it.width}")` : ''}` : '(No Fabric)'}</span>
                  {it.article_name && <span className="text-primary">• {it.article_name}</span>}
                  {(it.style_name || selectedStyles[0]) && (
                    <span className="text-muted">({it.style_name || selectedStyles[0]})</span>
                  )}
                  <span className="text-dark fw-bold">[{it.quantity_meters || 0}m / {it.quantity_pieces || 0}pcs]</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

                                {/* ========================================================================= */}
                                {/* SECTION: TERMS, SPECIAL INSTRUCTIONS & REMARKS                            */}
                                {/* ========================================================================= */}
                                <div className="card border mb-4 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
                                  <div className="p-3 px-4 border-bottom d-flex align-items-center justify-content-between" style={{ background: '#fafbfc' }}>
                                    <div className="d-flex align-items-center gap-2.5">
                                      <i className="ti ti-notes text-secondary fs-16"></i>
                                      <h6 className="mb-0 fw-bold text-dark fs-14">Terms, Special Instructions &amp; Remarks</h6>
                                    </div>
                                  </div>
                                  <div className="p-4">
                                    <textarea
                                      className="form-control form-control-sm bg-white fs-13"
                                      rows={3}
                                      placeholder="Enter terms, tolerance limits, dyeing instructions, or remarks..."
                                      style={{ borderColor: '#cbd5e1', borderRadius: '6px' }}
                                      value={terms}
                                      disabled={isLocked || (!isSectionEditable('terms') && !isSectionEditable('all'))}
                                      onChange={(e) => setTerms(e.target.value)}
                                    />
                                  </div>
                                </div>

                                {/* ========================================================================= */}
                                {/* BOTTOM ACTION BAR                                                         */}
                                {/* ========================================================================= */}
                                <div className="d-flex align-items-center justify-content-between pb-5">
                                  <button
                                    type="button"
                                    className="btn btn-light border px-4 py-2 text-secondary fs-13 fw-semibold rounded-2"
                                    onClick={handleExit}
                                    style={{ borderColor: '#cbd5e1' }}
                                  >
                                    {isLocked ? 'Close' : 'Cancel'}
                                  </button>

                                  <div className="d-flex align-items-center gap-2">
                                    {initialPO && (
                                      <button
                                        type="button"
                                        className="btn btn-outline-secondary px-3.5 py-2 fs-13 rounded-2 shadow-xs d-flex align-items-center gap-1.5"
                                        onClick={() => onPrintPO && onPrintPO(initialPO)}
                                      >
                                        <i className="ti ti-printer fs-15"></i>
                                        <span>Print PO Slip</span>
                                      </button>
                                    )}

                                    {!isLocked && (
                                      <>
                                        <button
                                          type="button"
                                          className="btn btn-light border px-3.5 py-2 fs-13 fw-semibold rounded-2 shadow-xs d-flex align-items-center gap-1.5"
                                          style={{ borderColor: '#cbd5e1' }}
                                          onClick={() => handleSubmit('draft')}
                                          title="Save as Draft (keep in draft state, not ready for Challan)"
                                        >
                                          <i className="ti ti-file-text fs-15 text-muted"></i>
                                          <span>Save as Draft</span>
                                        </button>

                                        <button
                                          type="button"
                                          className="btn btn-primary px-4 py-2 fs-13 fw-semibold rounded-2 shadow-xs d-flex align-items-center gap-1.5"
                                          onClick={() => handleSubmit('issue')}
                                          title="Save & Issue PO (official PO ready for Challan dispatch)"
                                        >
                                          <i className="ti ti-check fs-15"></i>
                                          <span>Save &amp; Issue PO</span>
                                        </button>

                                        <button
                                          type="button"
                                          className="btn btn-dark px-4 py-2 fs-13 fw-semibold rounded-2 shadow-xs d-flex align-items-center gap-1.5"
                                          onClick={() => handleSubmit('challan')}
                                          title="Save PO and immediately create Dispatch Challan"
                                        >
                                          <i className="ti ti-truck-delivery fs-15"></i>
                                          <span>Save &amp; Create Dispatch Challan</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* ========================================================================= */}
                                {/* INLINE MASTER MODALS                                                      */}
                                {/* ========================================================================= */}
                                {showInlineVendorModal && (
                                  <VendorMasterView
                                    isInline={true}
                                    vendors={vendorList}
                                    defaultTypes={processType && processType !== 'All Processes' ? [processType] : ['Dyeing']}
                                    onCloseInline={(saved) => {
                                      if (saved && (saved.name || saved.vendorName)) {
                                        handleVendorSaved(saved);
                                      } else {
                                        setShowInlineVendorModal(false);
                                      }
                                    }}
                                    onSaveVendor={(newVendor) => {
                                      handleVendorSaved(newVendor);
                                    }}
                                  />
                                )}

                                {showInlineFabricModal && (
                                  <FabricMasterView
                                    isInline={true}
                                    onCloseInline={() => setShowInlineFabricModal(false)}
                                    onSaveFabric={(newFabric) => {
                                      const formatted = {
                                        id: newFabric.id,
                                        name: newFabric.qualityName || newFabric.name,
                                        widths: newFabric.widths || ['44', '48', '58'],
                                        shrinkage: parseFloat(newFabric.defaultShrinkage) || 4.0,
                                        defaultRate: ''
                                      };
                                      setFabricList([formatted, ...fabricList]);
                                      setShowInlineFabricModal(false);
                                    }}
                                  />
                                )}

                                {showInlineColorModal && (
                                  <AddColorModal
                                    isOpen={showInlineColorModal}
                                    onClose={() => setShowInlineColorModal(false)}
                                    onAddColor={(newColor) => {
                                      const formatted = {
                                        id: newColor.id,
                                        name: newColor.name,
                                        hex: newColor.hex || '#333333'
                                      };
                                      setColorList([formatted, ...colorList]);
                                      if (activeColorRowIndex !== null && items[activeColorRowIndex]) {
                                        updateItem(activeColorRowIndex, {
                                          color_id: formatted.id,
                                          color_name: formatted.name,
                                          color_hex: formatted.hex
                                        });
                                      }
                                      setShowInlineColorModal(false);
                                    }}
                                  />
                                )}
                              </div>
                            );
}
                    
