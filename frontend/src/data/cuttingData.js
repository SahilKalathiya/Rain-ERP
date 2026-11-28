// =========================================================================
// Raindrop Garments ERP - Module 4: Cutting & Consumption Data Store
// Zero-Prefill Policy: All new POs start completely blank except auto PO #
// Integrates dynamically with Module 1 (Orders/Masters) & Module 3 (Lots)
// =========================================================================

export const CUTTING_STORAGE_KEYS = {
  RECORDS: 'erp_cutting_pos_v1',
  OLD_STOCK: 'erp_old_fabric_stock_v1'
};

export const CHECKLIST_ITEMS = [
  { id: 1, en: 'Sample has been seen (Approved Sample in hand)' },
  { id: 2, en: 'Check comments on sample, size and length' },
  { id: 3, en: 'Check the Cutting Order sheet & specs' },
  { id: 4, en: "Check pattern according to sample (if different, cut only after Sir's approval)" },
  { id: 5, en: 'Check layer marking with the pattern' },
  { id: 6, en: 'Re-verify garment length, quantity and size' },
  { id: 7, en: 'Fabric checked for colour fastness, processed width and any defect' }
];

// =========================================================================
// LocalStorage Persistence Helpers (Wrapped in try/catch for safety)
// =========================================================================
export function getStoredCuttingRecords() {
  try {
    const raw = localStorage.getItem(CUTTING_STORAGE_KEYS.RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {}
  return [];
}

export function saveStoredCuttingRecords(records) {
  try {
    localStorage.setItem(CUTTING_STORAGE_KEYS.RECORDS, JSON.stringify(records || []));
  } catch (e) {}
}

export function getStoredOldFabricStock() {
  try {
    const raw = localStorage.getItem(CUTTING_STORAGE_KEYS.OLD_STOCK);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {}
  return [];
}

export function saveStoredOldFabricStock(stock) {
  try {
    localStorage.setItem(CUTTING_STORAGE_KEYS.OLD_STOCK, JSON.stringify(stock || []));
  } catch (e) {}
}

// =========================================================================
// Auto-Generate PO Number & Blank Record (ZERO PRE-FILL)
// =========================================================================
export function generateNextCuttingPONumber(existingRecords = []) {
  const year = new Date().getFullYear();
  let maxSeq = 0;
  existingRecords.forEach((r) => {
    const match = String(r.poNumber || r.id || '').match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!Number.isNaN(num) && num > maxSeq) maxSeq = num;
    }
  });
  const next = String(maxSeq + 1).padStart(3, '0');
  return `PO-CUT-${year}-${next}`;
}

export function createEmptyCuttingPORecord(poNumber) {
  return {
    id: poNumber,
    poNumber,
    label: `${poNumber} · New Draft PO`,
    entryMode: '', // 'inside' | 'external' (user selects)
    selectedStyle: '',
    selectedColor: '',
    selectedLotId: '',
    // Custom/manual fallback metadata when user enters a style or lot manually
    customStyleSpec: null,
    thansBalesCount: '',
    tallyRolls: [
      { id: Date.now(), rollNo: '', meters: '', remark: '' }
    ],
    tallyPhotoUrl: null,
    checkingReportPhotoUrl: null,
    checkingGeneralNote: '',
    cutTogether: true,
    selectedArticles: [],
    selectedSizes: [],
    garmentsToCut: '',
    fabricToIssue: '',
    fabricWidthInput: '',
    useRatioDistribution: true,
    manualSizeQuantities: {},
    poRemarks: '',
    poStatus: 'Draft',
    checklist: {
      marking: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false },
      checking: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false },
      markingTimestamps: {},
      checkingTimestamps: {},
      patternDiffersFromSample: false,
      sirApprovalGranted: false,
      pausedAt: null,
      acceptedByCuttingMaster: false,
      acceptedAt: null
    },
    activeCuttingArticleTab: '',
    sheetNumber: 1,
    layers: [],
    signatures: {
      layerMan: '',
      cuttingMaster: '',
      checkingMaster: ''
    },
    activeConsumptionArticle: '',
    consumptionData: {},
    createdAt: new Date().toISOString()
  };
}

// =========================================================================
// Real ERP Data Bridge (Reads Module 1 Orders/Masters & Module 3 Lots)
// =========================================================================
function safeParseStorage(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    }
  } catch (e) {}
  return fallback;
}

export function getERPDesignCatalog() {
  const salesOrders = safeParseStorage('erp_sales_orders_v1', []);
  const colorsMaster = safeParseStorage('erp_colors_v1', []);
  const processReturns = safeParseStorage('erp_process_returns', []);
  const processQCs = safeParseStorage('erp_process_qc_records', []);
  const processPOs = safeParseStorage('erp_process_pos', []);

  const colorHexMap = {};
  if (Array.isArray(colorsMaster)) {
    colorsMaster.forEach((c) => {
      if (c?.name) colorHexMap[c.name.toLowerCase()] = c.hex || c.hex_code || '#64748b';
    });
  }

  const catalog = {};

  // Build styles from real Sales Orders (Module 1)
  if (Array.isArray(salesOrders)) {
    salesOrders.forEach((order) => {
      const styleName = order.styleName || order.style_name;
      if (!styleName) return;

      const articlesMap = {};
      const orderArticles = order.articles || order.order_articles || [];
      const consumptions = order.fabricConsumptions || order.order_fabric_consumptions || [];

      const orderWidthRates = (order.widthDyedRates && typeof order.widthDyedRates === 'object') ? order.widthDyedRates : {};
      const orderPoWidths = (order.groupPoWidths && typeof order.groupPoWidths === 'object') ? order.groupPoWidths : {};

      orderArticles.forEach((a) => {
        const aName = a.articleName || a.article_name || a.name;
        if (!aName) return;
        const aLower = String(aName).trim().toLowerCase();

        // 1. Check OrderDetailView widthDyedRates (preferring the active PO width in groupPoWidths)
        let widthRateVal = 0;
        const matchingPoWidthEntry = Object.entries(orderPoWidths).find(
          ([gk]) => String(gk).split('___')[0].trim().toLowerCase() === aLower
        );
        const preferredPoWidth = matchingPoWidthEntry ? String(matchingPoWidthEntry[1] || '').trim() : '';
        if (preferredPoWidth) {
          const exactKey = Object.keys(orderWidthRates).find((rk) => {
            const parts = String(rk).split('___');
            return parts[0]?.trim().toLowerCase() === aLower && String(parts[3] || '').trim() === preferredPoWidth;
          });
          if (exactKey && parseFloat(orderWidthRates[exactKey]) > 0) {
            widthRateVal = parseFloat(orderWidthRates[exactKey]);
          }
        }
        if (widthRateVal <= 0) {
          const anyWidthKey = Object.keys(orderWidthRates).find(
            (rk) => String(rk).split('___')[0]?.trim().toLowerCase() === aLower && parseFloat(orderWidthRates[rk]) > 0
          );
          if (anyWidthKey) {
            widthRateVal = parseFloat(orderWidthRates[anyWidthKey]);
          }
        }

        const matchingFc =
          consumptions.find(
            (fc) =>
              String(fc.articleName || fc.article_name || fc.article || '').trim().toLowerCase() === aLower &&
              (parseFloat(fc.dyedRate || fc.dyed_rate || fc.dyedPerPiece || fc.dyed_per_piece || fc.consumption || 0) > 0 ||
                (parseInt(fc.pcs || fc.pieces || 0, 10) > 0 && parseFloat(fc.totalDyed || fc.total_dyed || fc.totalFabricMeters || fc.total_fabric_meters || fc.meters || 0) > 0))
          ) ||
          consumptions.find(
            (fc) => String(fc.articleName || fc.article_name || fc.article || '').trim().toLowerCase() === aLower
          );
        const fcPcs = parseInt(matchingFc?.pcs || matchingFc?.pieces || 0, 10) || 0;
        const fcTotal = parseFloat(matchingFc?.totalDyed || matchingFc?.total_dyed || matchingFc?.totalFabricMeters || matchingFc?.total_fabric_meters || matchingFc?.meters || 0) || 0;
        let perPc = widthRateVal > 0
          ? widthRateVal
          : (parseFloat(
              matchingFc?.dyedRate ||
              matchingFc?.dyed_rate ||
              matchingFc?.dyedPerPiece ||
              matchingFc?.dyed_per_piece ||
              matchingFc?.consumption ||
              0
            ) || 0);
        if (perPc <= 0 && fcPcs > 0 && fcTotal > 0) {
          perPc = Number((fcTotal / fcPcs).toFixed(3));
        }
        if (perPc <= 0) {
          const rawAvgLen = parseFloat(
            a.avgLength ||
            a.avg_length ||
            a.avgGarmentLength ||
            a.avg_garment_length ||
            a.fabrics?.[0]?.avgLength ||
            a.fabrics?.[0]?.avg_length ||
            0
          ) || 0;
          const isDupatta = /dupatta|stole|chunri|scarf/i.test(String(aName).trim());
          if (rawAvgLen > 0) {
            perPc = isDupatta
              ? Number(rawAvgLen.toFixed(3))
              : (rawAvgLen > 10 ? Number((rawAvgLen * 0.0254).toFixed(3)) : Number(rawAvgLen.toFixed(3)));
          } else {
            perPc = parseFloat(a.consumption || a.consumptionPerGarment || a.fabrics?.[0]?.consumption || 0) || 0;
          }
        }
        if (perPc <= 0) {
          perPc = /dupatta|stole|chunri|scarf/i.test(aName) ? 2.25 : (/pant|bottom|salwar|trouser/i.test(aName) ? 1.05 : 1.5);
        }
        articlesMap[aName] = {
          name: aName,
          avgLength: Number(perPc.toFixed(2)),
          orderedPerSize: 0
        };
      });

      // Extract sizes, colors & ratio from customerOrders, quantity matrix, or fabric consumptions
      const sizesSet = new Set();
      const colorsSet = new Set();
      const ratio = {};
      const colorOrderedSets = {};
      let resolvedRatioFromOrder = null;

      const custOrders = Array.isArray(order.customerOrders) ? order.customerOrders : [];
      custOrders.forEach((c) => {
        (c.selectedColors || []).forEach((col) => { if (col) colorsSet.add(col); });
        Object.values(c.sizeConfigs || {}).forEach((cfg) => {
          if (!cfg) return;
          const scList = Array.isArray(cfg.seriesConfigs) ? cfg.seriesConfigs : [cfg];
          scList.forEach((sc) => {
            const scSizes = Array.isArray(sc.selectedSizes) && sc.selectedSizes.length > 0
              ? sc.selectedSizes
              : Object.keys(sc.sizeQtys || {});
            scSizes.forEach((sz) => { if (sz) sizesSet.add(sz); });
            if (!resolvedRatioFromOrder && sc.ratioUsed && sc.ratioString) {
              const parts = String(sc.ratioString).split(':').map((p) => parseInt(p.trim(), 10));
              if (parts.some((n) => !Number.isNaN(n) && n > 0)) {
                resolvedRatioFromOrder = { sizes: scSizes, parts };
              }
            }
          });
        });
      });

      const matrices = order.quantityMatrices || order.order_quantity_matrices || [];
      matrices.forEach((m) => {
        const combos = m.quantities_by_combination || m.quantities || [];
        if (Array.isArray(combos)) {
          combos.forEach((row) => {
            if (row.size) sizesSet.add(row.size);
            if (row.color) {
              colorsSet.add(row.color);
              colorOrderedSets[row.color] = (colorOrderedSets[row.color] || 0) + (parseInt(row.quantity, 10) || 0);
            }
          });
        }
      });

      consumptions.forEach((fc) => {
        const cName = fc.color_name || fc.colorName || fc.color || '';
        if (cName) {
          colorsSet.add(cName);
          const fcPcs = parseInt(fc.pcs || fc.pieces || 0, 10) || 0;
          if (fcPcs > 0 && (!colorOrderedSets[cName] || colorOrderedSets[cName] < fcPcs)) {
            colorOrderedSets[cName] = Math.max(colorOrderedSets[cName] || 0, fcPcs);
          }
        }
      });

      const sizes = sizesSet.size > 0 ? Array.from(sizesSet) : ['S', 'M', 'L', 'XL', '2XL'];
      sizes.forEach((sz) => { ratio[sz] = 1; });
      if (resolvedRatioFromOrder) {
        const targetSizes = resolvedRatioFromOrder.sizes.length > 0 ? resolvedRatioFromOrder.sizes : sizes;
        targetSizes.forEach((sz, idx) => {
          const val = resolvedRatioFromOrder.parts[idx];
          if (!Number.isNaN(val) && val > 0) {
            ratio[sz] = val;
          }
        });
      }

      // Find matching dyed lots from Module 3 Process Returns & Accepted QC Records (PDF Section 4 & 5)
      const colorsList = Array.from(colorsSet).map((colName) => {
        const matchingLots = [];

        if (Array.isArray(processReturns)) {
          processReturns.forEach((ret) => {
            const retPoIds = Array.isArray(ret.linked_po_ids) && ret.linked_po_ids.length > 0
              ? ret.linked_po_ids
              : (ret.linked_po_id ? [ret.linked_po_id] : []);
            const linkedPO = Array.isArray(processPOs)
              ? processPOs.find((p) => retPoIds.includes(p.id) || retPoIds.includes(p.po_number))
              : null;

            // Match Style / Sales Order strictly when PO link is present
            const poStyles = linkedPO
              ? [
                  ...(Array.isArray(linkedPO.style_names) ? linkedPO.style_names : []),
                  ...(linkedPO.style_name ? [linkedPO.style_name] : [])
                ].filter(Boolean)
              : [];
            const orderMatches = linkedPO?.linked_order_id && order.id
              ? String(linkedPO.linked_order_id) === String(order.id)
              : true;
            const styleMatches = poStyles.length === 0
              ? orderMatches
              : poStyles.some((s) => String(s).trim().toLowerCase() === String(styleName).trim().toLowerCase());
            if (!styleMatches) return;

            const retPieces = Array.isArray(ret.pieces) ? ret.pieces : [];
            const matchingPieces = retPieces.filter((p) => {
              const pCol = String(p.color_name || '').trim().toLowerCase();
              return pCol && pCol === colName.trim().toLowerCase() && (parseFloat(p.meters) || 0) > 0;
            });
            if (matchingPieces.length === 0) return;

            const retQCs = Array.isArray(processQCs)
              ? processQCs.filter((q) => q.return_id === ret.id)
              : [];

            // Strict PDF Rule: Only fabric Accepted in Module 3 QC is available for Cutting
            if (retQCs.length === 0) return;

            // Group accepted pieces by QC lot_batch_id (PDF Section 4: split into Lot 1, Lot 2, etc.)
            const batchMap = new Map();
            matchingPieces.forEach((piece) => {
              const pieceQc = retQCs.find((q) => Number(q.piece_no) === Number(piece.piece_no));
              if (!pieceQc || pieceQc.qc_outcome !== 'Accepted') return;
              const rawBatch = pieceQc.lot_batch_id || 'Lot 1 (Standard)';
              const batchName = rawBatch.replace(/\bBatch\b/gi, 'Lot');
              const key = `${ret.id}___${batchName}`;
              if (!batchMap.has(key)) {
                batchMap.set(key, {
                  lotId: `${ret.id}-${batchName.split(' ')[0]}`,
                  lotName: `${batchName} · ${ret.id}`,
                  thansCount: 0,
                  availableMeters: 0,
                  shadeNote: pieceQc.notes || `Accepted from ${ret.id}`
                });
              }
              const b = batchMap.get(key);
              b.thansCount += 1;
              b.availableMeters += parseFloat(piece.meters) || 0;
            });

            const fabMatchW = String(ret.fabric_quality || '').match(/\[(\d+(?:\.\d+)?)\s*"?\]|\((\d+(?:\.\d+)?)\s*"\)/);
            const poItemMatch = Array.isArray(linkedPO?.items)
              ? (linkedPO.items.find((it) => String(it.color_name || '').trim().toLowerCase() === colName.trim().toLowerCase()) || linkedPO.items[0])
              : null;
            const fcMatch = consumptions.find((fc) => String(fc.color_name || fc.colorName || fc.color || '').trim().toLowerCase() === colName.trim().toLowerCase()) || consumptions[0];
            const rawWidth = ret.width || (fabMatchW ? (fabMatchW[1] || fabMatchW[2]) : '') || poItemMatch?.width || linkedPO?.width || fcMatch?.poWidth || fcMatch?.width || '';
            const resolvedLotWidth = rawWidth ? `${String(rawWidth).replace(/["\s]/g, '')}"` : '';

            const rawArtStr = String(
              matchingPieces.find((p) => p.article_name || p.article)?.article_name ||
              matchingPieces.find((p) => p.article)?.article ||
              ret.article_name ||
              poItemMatch?.article_name ||
              ''
            ).trim();
            const allOrderArts = Object.keys(articlesMap);
            let lotArticles = allOrderArts;
            if (rawArtStr) {
              const parsedArts = rawArtStr
                .split(/\+|,/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((part) => allOrderArts.find((oa) => oa.toLowerCase() === part.toLowerCase()) || part)
                .filter((a) => allOrderArts.includes(a));
              if (parsedArts.length > 0) {
                lotArticles = [...new Set(parsedArts)];
              }
            }

            batchMap.forEach((b) => {
              if (b.availableMeters > 0) {
                matchingLots.push({
                  lotId: b.lotId,
                  lotName: b.lotName,
                  thansCount: b.thansCount,
                  availableMeters: Number(b.availableMeters.toFixed(2)),
                  width: resolvedLotWidth,
                  dyedTogether: lotArticles.length > 1,
                  articlesInLot: lotArticles,
                  shadeNote: b.shadeNote
                });
              }
            });
          });
        }

        return {
          name: colName,
          hex: colorHexMap[colName.toLowerCase()] || '#64748b',
          orderedSets: colorOrderedSets[colName] || 0,
          lots: matchingLots
        };
      });

      catalog[styleName] = {
        _backendSalesOrderId: order.id,
        styleName,
        fabricName: consumptions[0]?.fabric_name || consumptions[0]?.fabricName || '',
        greyWidth: '',
        kurtaLengthSpec: '',
        ratioLabel: sizes.map((sz) => String(ratio[sz] || 1)).join(':'),
        ratio,
        sizes,
        articles: Object.keys(articlesMap).length > 0 ? articlesMap : { Garment: { name: 'Garment', avgLength: 0, orderedPerSize: 0 } },
        colors: colorsList
      };
    });
  }

  return catalog;
}

// =========================================================================
// Core Calculation Helpers
// =========================================================================
export function getResolvedStyleObj(rec, catalog = {}) {
  if (!rec) return null;
  if (rec.customStyleSpec && rec.selectedStyle === rec.customStyleSpec.styleName) {
    return rec.customStyleSpec;
  }
  return rec.selectedStyle ? (catalog[rec.selectedStyle] || null) : null;
}

export function getResolvedColorObj(rec, styleObj) {
  if (!styleObj || !rec?.selectedColor) return null;
  return (styleObj.colors || []).find((c) => c.name === rec.selectedColor) || null;
}

export function getResolvedLotObj(rec, colorObj) {
  if (!colorObj || !rec?.selectedLotId) return null;
  return (colorObj.lots || []).find((l) => l.lotId === rec.selectedLotId) || null;
}

export function computeLotYieldSummary(styleObj, lot) {
  if (!styleObj || !lot) return { sets: 0, totalPieces: 0, avgPerUnit: 0, label: '' };
  const arts = (lot.articlesInLot && lot.articlesInLot.length > 0)
    ? lot.articlesInLot
    : Object.keys(styleObj.articles || {});
  const combinedAvg = arts.reduce((s, a) => s + (styleObj.articles?.[a]?.avgLength || 1.5), 0);
  const cuttableUnits = combinedAvg > 0 ? Math.floor((parseFloat(lot.availableMeters) || 0) / combinedAvg) : 0;
  if (arts.length > 1) {
    const totalPcs = cuttableUnits * arts.length;
    return {
      sets: cuttableUnits,
      totalPieces: totalPcs,
      avgPerUnit: combinedAvg,
      label: `Can cut: ${arts.map((a) => `${cuttableUnits} ${a}`).join(' + ')}`
    };
  }
  return {
    sets: cuttableUnits,
    totalPieces: cuttableUnits,
    avgPerUnit: combinedAvg,
    label: `Can cut: ${cuttableUnits} ${arts[0] || 'Garment'}`
  };
}

export function getActiveArticlesList(rec, styleObj) {
  if (!rec || !styleObj) return [];
  const colorObj = getResolvedColorObj(rec, styleObj);
  const lot = getResolvedLotObj(rec, colorObj);
  if (lot && lot.dyedTogether && rec.cutTogether && lot.articlesInLot?.length > 0) {
    return [...lot.articlesInLot];
  }
  if (rec.selectedArticles && rec.selectedArticles.length > 0) {
    return rec.selectedArticles;
  }
  return Object.keys(styleObj.articles || {});
}

export function getCombinedAvgLength(rec, styleObj) {
  if (!styleObj) return 1.5;
  const articles = getActiveArticlesList(rec, styleObj);
  if (articles.length === 0) return 1.5;
  return articles.reduce((sum, art) => sum + (styleObj.articles?.[art]?.avgLength || 1.5), 0);
}

export function getSizeBreakdown(rec, styleObj) {
  const breakdown = {};
  if (!styleObj || !rec?.selectedSizes || rec.selectedSizes.length === 0) return breakdown;
  const sizes = rec.selectedSizes;
  const qtyTotal = Math.max(0, Math.round(Number(rec.garmentsToCut) || 0));

  if (rec.useRatioDistribution) {
    const totalWeight = sizes.reduce((sum, sz) => sum + (styleObj.ratio?.[sz] || 1), 0);
    // Strict ratio multiple: every size stays in exact ratio; leftover fabric remains in balance/old stock
    const multiplier = totalWeight > 0 ? Math.floor(qtyTotal / totalWeight) : 0;
    sizes.forEach((sz) => {
      const w = styleObj.ratio?.[sz] || 1;
      breakdown[sz] = multiplier * w;
    });
  } else {
    sizes.forEach((sz) => {
      breakdown[sz] = Math.max(0, Math.round(Number(rec.manualSizeQuantities?.[sz]) || 0));
    });
  }
  return breakdown;
}

export function getTotalGarmentsFromBreakdown(rec, styleObj) {
  const bd = getSizeBreakdown(rec, styleObj);
  return Object.values(bd).reduce((a, b) => a + b, 0);
}

export function getTallyTotalMeters(rec) {
  return (rec?.tallyRolls || []).reduce((sum, r) => sum + (parseFloat(r.meters) || 0), 0);
}

export function isChecklistComplete(rec) {
  if (!rec?.checklist) return false;
  const mDone = CHECKLIST_ITEMS.every((item) => Boolean(rec.checklist.marking?.[item.id]));
  const cDone = CHECKLIST_ITEMS.every((item) => Boolean(rec.checklist.checking?.[item.id]));
  const patternOk = !rec.checklist.patternDiffersFromSample || Boolean(rec.checklist.sirApprovalGranted);
  return mDone && cDone && patternOk && Boolean(rec.checklist.acceptedByCuttingMaster);
}

export function getChecklistCount(rec) {
  if (!rec?.checklist) return 0;
  let count = 0;
  CHECKLIST_ITEMS.forEach((item) => {
    if (rec.checklist.marking?.[item.id]) count++;
    if (rec.checklist.checking?.[item.id]) count++;
  });
  return count;
}

export function hasUnapprovedRepeatedSizes(rec) {
  return (rec?.layers || []).some((layer) => {
    const hasRepeat = Object.values(layer.multipliers || {}).some((m) => (parseInt(m, 10) || 0) > 1);
    return hasRepeat && !layer.repeatedSizeApprovedBy;
  });
}

export function getLayerArticles(layer, rec, styleObj) {
  if (Array.isArray(layer?.articles) && layer.articles.length > 0) return layer.articles;
  if (layer?.article) return [layer.article];
  const active = getActiveArticlesList(rec, styleObj);
  return active.length > 0 ? [active[0]] : ['Kurta'];
}

export function getArticleCuttingStats(articleName, rec, styleObj) {
  const sizeTotals = {};
  if (styleObj?.sizes) {
    styleObj.sizes.forEach((sz) => { sizeTotals[sz] = 0; });
  }
  const artLayers = (rec?.layers || []).filter((l) => getLayerArticles(l, rec, styleObj).includes(articleName));
  let totalLayerMeters = 0;
  let totalGarmentsCut = 0;

  artLayers.forEach((layer) => {
    const layerArts = getLayerArticles(layer, rec, styleObj);
    const fullLayerMeters = (parseFloat(layer.layerLength) || 0) * (parseInt(layer.pallaQty, 10) || 0);
    let shareRatio = 1;
    if (layerArts.length > 1 && styleObj) {
      const totalAvg = layerArts.reduce((s, a) => s + (styleObj.articles?.[a]?.avgLength || 1.5), 0);
      const myAvg = styleObj.articles?.[articleName]?.avgLength || 1.5;
      shareRatio = totalAvg > 0 ? (myAvg / totalAvg) : (1 / layerArts.length);
    }
    totalLayerMeters += fullLayerMeters * shareRatio;
    if (styleObj?.sizes) {
      styleObj.sizes.forEach((sz) => {
        const mult = parseInt(layer.multipliers?.[sz], 10) || 0;
        const cutQty = mult * (parseInt(layer.pallaQty, 10) || 0);
        sizeTotals[sz] = (sizeTotals[sz] || 0) + cutQty;
        totalGarmentsCut += cutQty;
      });
    }
  });

  return { artLayers, sizeTotals, totalLayerMeters, totalGarmentsCut };
}

export function getOverOrderDiscrepancies(rec, styleObj) {
  if (!styleObj) return [];
  const activeArticles = getActiveArticlesList(rec, styleObj);
  const poBreakdown = getSizeBreakdown(rec, styleObj);
  const issues = [];

  activeArticles.forEach((art) => {
    const cutStats = getArticleCuttingStats(art, rec, styleObj);
    (styleObj.sizes || []).forEach((sz) => {
      const orderedQty = poBreakdown[sz] || 0;
      const cutQty = cutStats.sizeTotals[sz] || 0;
      if (orderedQty > 0 && cutQty > orderedQty) {
        const unapprovedLayers = cutStats.artLayers.filter(
          (l) => (parseInt(l.multipliers?.[sz], 10) || 0) > 0 && !l.overOrderApprovedBy
        );
        issues.push({
          article: art,
          size: sz,
          orderedQty,
          cutQty,
          excess: cutQty - orderedQty,
          approved: unapprovedLayers.length === 0
        });
      }
    });
  });
  return issues;
}

export function getArticleConsumptionMetrics(articleName, rec, styleObj) {
  const tallied = getTallyTotalMeters(rec);
  const initialLotMeters = tallied > 0 ? tallied : (Number(rec?.fabricToIssue) || 0);
  const activeArts = getActiveArticlesList(rec, styleObj);
  const firstArt = activeArts[0];
  const firstArtStats = firstArt ? getArticleCuttingStats(firstArt, rec, styleObj) : { totalLayerMeters: 0 };

  const cData = rec?.consumptionData?.[articleName] || {
    date: '',
    foldingStandard: 100,
    trims: [],
    physicalCountedUsable: '',
    tukdaScrapMeters: ''
  };

  let totalFabricAvailable = initialLotMeters;
  // If this is a secondary article in a combined set (e.g. Pant after Kurta), carry forward remainder
  if (activeArts.length > 1 && articleName !== firstArt) {
    const firstPhysical = Number(rec?.consumptionData?.[firstArt]?.physicalCountedUsable || 0);
    const firstRemaining = Math.max(0, initialLotMeters - firstArtStats.totalLayerMeters -
      ((rec?.consumptionData?.[firstArt]?.trims || []).reduce((s, t) => s + (parseFloat(t.metersPerPc) || 0), 0) *
        (getArticleCuttingStats(firstArt, rec, styleObj).totalGarmentsCut || 0)));
    totalFabricAvailable = firstPhysical > 0 ? firstPhysical : firstRemaining;
  }

  const foldingL = parseFloat(cData.foldingStandard) || 100;
  const fabricAfterL = totalFabricAvailable * (foldingL / 100);

  const stats = getArticleCuttingStats(articleName, rec, styleObj);
  const grandLayerMeters = stats.totalLayerMeters;
  const totalGarments = stats.totalGarmentsCut;
  const baseAvgPerGarment = totalGarments > 0 ? (grandLayerMeters / totalGarments) : 0;
  const fabricBalanceFromLayer = fabricAfterL - grandLayerMeters;

  const totalTrimPerPc = (cData.trims || []).reduce((sum, t) => sum + (parseFloat(t.metersPerPc) || 0), 0);
  const totalTrimMetersExact = totalTrimPerPc * totalGarments;
  const grandTotalAllFabricUsed = grandLayerMeters + totalTrimMetersExact;
  const systemFinalRemaining = fabricAfterL - grandTotalAllFabricUsed;

  const physicalUsable = parseFloat(cData.physicalCountedUsable) || 0;
  const tukdaScrap = parseFloat(cData.tukdaScrapMeters) || 0;
  const hasPhysicalEntry = cData.physicalCountedUsable !== '' && cData.physicalCountedUsable !== null && cData.physicalCountedUsable !== undefined;

  const missingMeters = hasPhysicalEntry ? Math.max(0, systemFinalRemaining - (physicalUsable + tukdaScrap)) : 0;
  const missingPercentOfRemaining = (hasPhysicalEntry && systemFinalRemaining > 0) ? (missingMeters / systemFinalRemaining) * 100 : 0;
  const wastagePercentOfReceived = initialLotMeters > 0 ? ((tukdaScrap + missingMeters) / initialLotMeters) * 100 : 0;
  const residualShareOfLot = initialLotMeters > 0 ? (systemFinalRemaining / initialLotMeters) * 100 : 0;

  return {
    initialLotMeters,
    totalFabricAvailable,
    foldingL,
    fabricAfterL,
    stats,
    grandLayerMeters,
    totalGarments,
    baseAvgPerGarment,
    fabricBalanceFromLayer,
    totalTrimPerPc,
    totalTrimMetersExact,
    grandTotalAllFabricUsed,
    systemFinalRemaining,
    physicalUsable,
    tukdaScrap,
    hasPhysicalEntry,
    missingMeters,
    missingPercentOfRemaining,
    wastagePercentOfReceived,
    residualShareOfLot
  };
}
