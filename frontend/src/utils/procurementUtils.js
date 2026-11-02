/**
 * procurementUtils.js
 * Utility functions for calculating fabric-wise fulfillment, receipt, and pending quantities
 * across Purchase Orders and linked Goods Receipt Notes (GRNs), including multi-PO consolidated shipments.
 */

/**
 * Extract meters delivered for a specific PO from a given GRN.
 * Properly attributes meters in consolidated shipments (where multiple POs are linked to 1 GRN).
 *
 * @param {Object} grn - Goods Receipt Note object
 * @param {string} poId - Purchase Order ID or Number to check
 * @param {Array} poItems - Items array of the target Purchase Order (optional, for fabric matching fallback)
 * @returns {number} Exact meters received for this PO in this GRN
 */

/**
 * Issue 57: Calculates FIFO (First-In, First-Out chronological) allocation of a GRN's meters
 * across multiple linked Purchase Orders for the same vendor/fabric.
 *
 * Earliest created PO is fulfilled 100% first; any remaining meters cascade to subsequent POs.
 *
 * @param {Array} linkedPos - Array of linked Purchase Order objects
 * @param {number} totalGrnMeters - Total meters entering in the GRN
 * @param {Array} previousGrns - Previous GRNs in system (excluding current)
 * @returns {Array} Array of allocation objects per PO
 */
export function calculateFifoPoAllocations(linkedPos = [], totalGrnMeters = 0, previousGrns = []) {
  if (!Array.isArray(linkedPos) || linkedPos.length === 0) return [];

  // Sort POs strictly in chronological order (earliest created PO first)
  const sortedPos = [...linkedPos].sort((a, b) => {
    const parseTime = (po) => {
      if (!po) return 0;
      if (po.createdAt && typeof po.createdAt === 'number') return po.createdAt;
      const dStr = po.date || po.poDate || po.createdAt || '';
      if (dStr) {
        const t = new Date(dStr).getTime();
        if (!isNaN(t)) return t;
      }
      return 0;
    };
    const tA = parseTime(a);
    const tB = parseTime(b);
    if (tA && tB && tA !== tB) return tA - tB;
    // Numeric ID comparison fallback (e.g. PO-1001 < PO-1002)
    const numA = parseInt(String(a.id || a.poNumber || '').replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(String(b.id || b.poNumber || '').replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

  let remainingGrnMeters = Math.max(0, Number(totalGrnMeters) || 0);

  const allocations = sortedPos.map((po, index) => {
    const pId = String(po.id || '').trim();
    const ordered = (po.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);

    // Calculate how much this PO previously received from prior GRNs
    let prevReceived = 0;
    (previousGrns || []).forEach((g) => {
      if (!g) return;
      const isLinked = (Array.isArray(g.linkedPOs) && g.linkedPOs.map(String).includes(pId)) ||
        String(g.poId || '').trim() === pId;
      if (isLinked) {
        if (g.poAllocations && g.poAllocations[pId] !== undefined) {
          prevReceived += Number(g.poAllocations[pId]) || 0;
        } else {
          // Attribute meters from prior GRN
          const gTot = Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0;
          if (Array.isArray(g.linkedPOs) && g.linkedPOs.length > 1) {
            // If prior GRN had multiple POs without poAllocations, proportionate or single
            prevReceived += Number(g.poAllocations?.[pId]) || 0;
          } else {
            prevReceived += gTot;
          }
        }
      }
    });

    if (prevReceived === 0 && Number(po.receivedQty) > 0 && (previousGrns || []).length === 0) {
      prevReceived = Number(po.receivedQty);
    }

    const pendingBeforeGrn = Math.max(0, ordered - prevReceived);

    // FIFO: Fulfill earliest PO first!
    let allocatedInThisGrn = 0;
    if (remainingGrnMeters > 0) {
      allocatedInThisGrn = Math.min(remainingGrnMeters, pendingBeforeGrn);
      remainingGrnMeters = Math.round((remainingGrnMeters - allocatedInThisGrn) * 100) / 100;
    }

    // If all pending balances are satisfied and leftover meters remain, allocate excess to the last PO
    if (index === sortedPos.length - 1 && remainingGrnMeters > 0) {
      allocatedInThisGrn += remainingGrnMeters;
      remainingGrnMeters = 0;
    }

    allocatedInThisGrn = Math.round(allocatedInThisGrn * 100) / 100;
    const remainingBalance = Math.max(0, Math.round((pendingBeforeGrn - allocatedInThisGrn) * 100) / 100);
    const totalReceivedToDate = Math.round((prevReceived + allocatedInThisGrn) * 100) / 100;

    const isComplete = ordered > 0 && totalReceivedToDate >= ordered;
    const isPartial = totalReceivedToDate > 0 && !isComplete;
    const fulfillmentPercent = ordered > 0 ? Math.min(100, Math.round((totalReceivedToDate / ordered) * 100)) : 0;

    let statusText = 'Pending';
    if (isComplete) statusText = 'Completed';
    else if (isPartial) statusText = 'Partially Received';

    return {
      po,
      poId: pId,
      poNumber: po.poNumber || pId,
      poDate: po.date || po.poDate || '',
      index: index + 1,
      isFirstOrder: index === 0,
      ordered,
      prevReceived,
      pendingBeforeGrn,
      allocatedInThisGrn,
      remainingBalance,
      totalReceivedToDate,
      isComplete,
      isPartial,
      fulfillmentPercent,
      statusText
    };
  });

  return allocations;
}

export function getMetersForPoFromGrn(grn, poId, poItems = [], allPurchaseOrders = []) {
  if (!grn || !poId) return 0;

  const targetPoId = String(poId).trim();
  const linkedPoIds = Array.isArray(grn.linkedPOs) && grn.linkedPOs.length > 0
    ? grn.linkedPOs.map(String)
    : (grn.poId ? [String(grn.poId)] : (grn.purchaseOrderId ? [String(grn.purchaseOrderId)] : []));

  const isLinked = linkedPoIds.some(
    (pid) => pid === targetPoId || targetPoId.includes(pid) || pid.includes(targetPoId)
  ) || String(grn.poNumber || '').trim() === targetPoId || String(grn.againstPo || '').trim() === targetPoId;

  if (!isLinked) return 0;

  const grnTotalMeters = Number(grn.totalMetersEntered) || Number(grn.declaredTotalMeters) || 0;
  const isMultiPo = Array.isArray(grn.linkedPOs) && grn.linkedPOs.length > 1;

  // Single-PO GRN: 100% of the GRN meters belong to this PO
  if (!isMultiPo) {
    return grnTotalMeters;
  }

  // Multi-PO consolidated shipment: check bale and piece-level assignments
  let attributedMeters = 0;
  let hasExplicitAssignment = false;
  const bales = grn.bales || [];

  bales.forEach((b) => {
    const isMixed = Boolean(
      b.isMixedFabric ||
      b.fabricItemLabel === 'MIXED_FABRIC' ||
      b.fabricName === 'Mixed Fabric' ||
      String(b.fabricItemLabel || '').toLowerCase().includes('mixed') ||
      String(b.fabricName || '').toLowerCase().includes('mixed')
    );
    const bPo = String(b.poId || '').trim();
    const bLabel = String(b.fabricItemLabel || b.fabric || b.fabricName || '').trim();
    const bPoMatch = bLabel.match(/\[(.*?)\]/);
    const bExtractedPo = bPoMatch ? bPoMatch[1].trim() : '';

    const isBaleDirectForPo = bPo === targetPoId || bExtractedPo === targetPoId || (bLabel.includes(targetPoId));

    if (Array.isArray(b.pieces) && b.pieces.length > 0) {
      let baleHadPieceAttribution = false;
      b.pieces.forEach((p) => {
        const pLen = typeof p === 'object' && p !== null ? (Number(p.length !== undefined ? p.length : p.meters) || 0) : (Number(p) || 0);
        const pPo = typeof p === 'object' && p !== null ? String(p.poId || '').trim() : '';
        const pQuality = typeof p === 'object' && p !== null ? String(p.fabricQuality || '').trim() : '';
        const pMatch = pQuality.match(/\[(.*?)\]/);
        const pExtractedPo = pMatch ? pMatch[1].trim() : '';

        const isPieceForThisPo = pPo === targetPoId || pExtractedPo === targetPoId || pQuality.includes(targetPoId);
        const isPieceForOtherPo = (pPo && pPo !== targetPoId) || (pExtractedPo && pExtractedPo !== targetPoId);

        if (isPieceForThisPo) {
          attributedMeters += pLen;
          hasExplicitAssignment = true;
          baleHadPieceAttribution = true;
        } else if (!isMixed && isBaleDirectForPo && !isPieceForOtherPo) {
          attributedMeters += pLen;
          hasExplicitAssignment = true;
          baleHadPieceAttribution = true;
        } else if (isMixed && !isPieceForOtherPo && Array.isArray(poItems) && poItems.length > 0) {
          // If mixed bale piece doesn't have [PO] prefix, check if fabric quality matches this PO's items
          const cleanQ = pQuality.toLowerCase();
          const matchesPo = poItems.some((it) => {
            const itFab = String(it.fabricName || it.fabricQuality || '').toLowerCase().trim();
            return itFab && (cleanQ.includes(itFab) || itFab.includes(cleanQ));
          });
          if (matchesPo) {
            attributedMeters += pLen;
            hasExplicitAssignment = true;
            baleHadPieceAttribution = true;
          }
        }
      });

      if (!baleHadPieceAttribution && isBaleDirectForPo && !isMixed) {
        attributedMeters += Number(b.totalLength) || 0;
        hasExplicitAssignment = true;
      }
    } else if (isBaleDirectForPo && !isMixed) {
      attributedMeters += Number(b.totalLength) || 0;
      hasExplicitAssignment = true;
    }
  });

  if (hasExplicitAssignment && attributedMeters > 0) {
    return attributedMeters;
  }

  // Fallback 1: check explicit poAllocations if stored on GRN
  if (grn.poAllocations && grn.poAllocations[targetPoId] !== undefined) {
    return Number(grn.poAllocations[targetPoId]) || 0;
  }

  // Fallback 2: Match by fabric items of the PO
  if (Array.isArray(poItems) && poItems.length > 0) {
    const poFabricNames = poItems
      .map((it) => String(it.fabricName || it.fabricQuality || '').toLowerCase().trim())
      .filter(Boolean);

    let fabricMatchedMeters = 0;
    let hasFabricMatch = false;

    bales.forEach((b) => {
      const bLabel = String(b.fabricItemLabel || b.fabricName || '').toLowerCase();
      const matches = poFabricNames.some((fn) => bLabel.includes(fn));
      if (matches) {
        fabricMatchedMeters += Number(b.totalLength) || 0;
        hasFabricMatch = true;
      }
    });

    if (hasFabricMatch && fabricMatchedMeters > 0) {
      return fabricMatchedMeters;
    }
  }

  // Fallback 3 (Issue 57): FIFO Chronological Allocation across linked POs
  if (Array.isArray(allPurchaseOrders) && allPurchaseOrders.length > 0 && linkedPoIds.length > 1) {
    const linkedPoObjs = linkedPoIds
      .map((id) => allPurchaseOrders.find((p) => p && String(p.id).trim() === String(id).trim()))
      .filter(Boolean);

    if (linkedPoObjs.length > 1) {
      const fifoAllocs = calculateFifoPoAllocations(linkedPoObjs, grnTotalMeters, []);
      const match = fifoAllocs.find((a) => a.poId === targetPoId);
      if (match) {
        return match.allocatedInThisGrn;
      }
    }
  }

  // Fallback 4: Equal distribution across linked POs if PO details unavailable
  const count = linkedPoIds.length > 0 ? linkedPoIds.length : 1;
  return Math.round(grnTotalMeters / count);
}

/**
 * Calculates complete fulfillment, shipment history, and consolidated PO breakdowns for a Purchase Order.
 *
 * @param {Object} po - Target Purchase Order object
 * @param {Array} grns - All GRNs in the system
 * @param {Array} allPurchaseOrders - All POs in the system (used to display details of other POs in consolidated shipments)
 * @returns {Object} Comprehensive fulfillment statistics and GRN delivery breakdowns
 */
export function getPoFulfillmentData(po, grns = [], allPurchaseOrders = []) {
  if (!po) {
    return {
      totalOrdered: 0,
      totalReceived: 0,
      totalPending: 0,
      fulfillmentPercent: 0,
      allPoGrns: [],
      grnBreakdowns: [],
      itemFulfillments: []
    };
  }

  const poNumbersToCheck = [
    po.id,
    po.poNumber,
    po.po_number
  ].filter(Boolean).map(String);

  const isGrnLinkedToPo = (g) => {
    if (!g) return false;
    return poNumbersToCheck.some((pid) =>
      (Array.isArray(g.linkedPOs) && g.linkedPOs.map(String).includes(pid)) ||
      String(g.poId || '').trim() === pid ||
      String(g.poNumber || '').trim() === pid ||
      String(g.againstPo || '').trim() === pid ||
      String(g.poRef || '').trim() === pid ||
      String(g.purchaseOrderId || '').trim() === pid ||
      String(g.purchaseOrderNumber || '').trim() === pid
    );
  };

  const allPoGrns = (grns || []).filter(isGrnLinkedToPo);
  const totalOrdered = (po.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  // Calculate received meters for THIS specific PO across all GRNs
  let totalReceived = 0;
  allPoGrns.forEach((g) => {
    totalReceived += getMetersForPoFromGrn(g, po.id, po.items);
  });

  // Fallback to recorded receivedQty if no GRN meters were attributed
  if (totalReceived === 0 && Number(po.receivedQty) > 0) {
    totalReceived = Number(po.receivedQty);
  }

  const totalPending = Math.max(0, totalOrdered - totalReceived);
  const fulfillmentPercent = totalOrdered > 0 ? Math.min(100, Math.round((totalReceived / totalOrdered) * 100)) : 0;

  // Build detailed breakdown per linked GRN
  const grnBreakdowns = allPoGrns.map((g) => {
    const totalShipmentMeters = Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0;
    const metersForThisPo = getMetersForPoFromGrn(g, po.id, po.items);
    const isConsolidated = Array.isArray(g.linkedPOs) && g.linkedPOs.length > 1;
    const linkedPoIds = isConsolidated ? g.linkedPOs : [g.poId || po.id].filter(Boolean);

    // If consolidated, break down how many meters arrived for EACH linked PO
    const consolidatedBreakdown = linkedPoIds.map((lPoId) => {
      const matchedPo = (allPurchaseOrders || []).find((p) => String(p.id).trim() === String(lPoId).trim()) || null;
      const poItemsList = matchedPo?.items || (String(lPoId).trim() === String(po.id).trim() ? po.items : []);
      const lPoOrdered = poItemsList.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
      const mtrsInThisGrn = getMetersForPoFromGrn(g, lPoId, poItemsList);

      // Total received to date across all GRNs for that linked PO
      let lPoTotalReceivedToDate = 0;
      (grns || []).forEach((otherGrn) => {
        lPoTotalReceivedToDate += getMetersForPoFromGrn(otherGrn, lPoId, poItemsList);
      });
      if (lPoTotalReceivedToDate === 0 && matchedPo && Number(matchedPo.receivedQty) > 0) {
        lPoTotalReceivedToDate = Number(matchedPo.receivedQty);
      }
      const lPoPending = Math.max(0, lPoOrdered - lPoTotalReceivedToDate);

      return {
        poId: lPoId,
        poNumber: matchedPo?.poNumber || lPoId,
        vendorName: matchedPo?.vendorName || po.vendorName || '',
        orderedMtrs: lPoOrdered,
        receivedInThisGrn: mtrsInThisGrn,
        totalReceivedToDate: lPoTotalReceivedToDate,
        pendingMtrs: lPoPending,
        isCurrentPo: String(lPoId).trim() === String(po.id).trim()
      };
    });

    return {
      grn: g,
      grnId: g.id,
      receivedDate: g.receivedDate || g.date || '',
      status: g.status || 'Received',
      qcStatus: g.qcStatus || 'Pending',
      transporterName: g.transporterName || '',
      biltyNo: g.biltyNo || '',
      vehicleNo: g.vehicleNo || '',
      totalShipmentMeters,
      metersForThisPo,
      isConsolidated,
      linkedPoCount: linkedPoIds.length,
      consolidatedBreakdown
    };
  });

  // Calculate per-item fulfillment breakdown
  const itemFulfillments = calculatePoFabricFulfillment(po, grns);

  return {
    totalOrdered,
    totalReceived,
    totalPending,
    fulfillmentPercent,
    allPoGrns,
    grnBreakdowns,
    itemFulfillments
  };
}

/**
 * Helper to match a piece or bale label against a specific PO item
 */
export function isPieceOrBaleMatchForItem(label, poId, item, poItems, itemIdx, targetPoId, isMultiPoGrn) {
  if (!label && label !== 0) return false;
  const strLabel = String(label).trim();

  // 1. Multi-PO check: verify the label/bale belongs to targetPoId
  if (isMultiPoGrn) {
    const lblPoMatch = strLabel.match(/\[(.*?)\]/);
    const extractedPo = lblPoMatch ? lblPoMatch[1].trim() : '';
    const assignedPo = String(poId || extractedPo || '').trim();
    if (assignedPo && assignedPo !== targetPoId && !targetPoId.includes(assignedPo) && !assignedPo.includes(targetPoId)) {
      return false; // Belongs to a different PO!
    }
  }

  // If this PO only has 1 item, any piece/bale belonging to targetPoId belongs to this single item
  if (poItems.length === 1) {
    return true;
  }

  // Clean the label by stripping [PO-xxxx]
  const cleanLabel = strLabel.replace(/\[.*?\]\s*/g, '').toLowerCase().trim();
  const itFabric = String(item.fabricName || item.fabricQuality || '').toLowerCase().trim();
  const itColor = String(item.colorName || item.color || '').toLowerCase().trim();
  const itWidth = String(item.width || '').replace(/"/g, '').trim().toLowerCase();

  if (!itFabric) return false;

  // Check if fabric quality name matches
  const fabricMatches = cleanLabel.includes(itFabric) || itFabric.includes(cleanLabel);
  if (!fabricMatches) return false;

  // Color matching:
  const isGreigeItem = !itColor || itColor.includes('greige') || itColor.includes('no color') || itColor.includes('natural');

  if (!isGreigeItem) {
    // This item has a specific color (e.g. "Blue")
    if (cleanLabel.includes(itColor)) {
      return true;
    }
    // If cleanLabel explicitly matches another item's color, don't match this item
    const otherItemsWithColors = poItems.filter((other, oIdx) => oIdx !== itemIdx && other.colorName);
    const matchesAnotherColor = otherItemsWithColors.some(
      (other) => cleanLabel.includes(String(other.colorName).toLowerCase())
    );
    if (matchesAnotherColor) {
      return false;
    }
  } else {
    // This item is Greige / No color
    // If cleanLabel matches a dyed color belonging to another item in the PO, it's NOT this item!
    const otherDyedItems = poItems.filter(
      (other, oIdx) => oIdx !== itemIdx && other.colorName && !String(other.colorName).toLowerCase().includes('greige')
    );
    const matchesOtherDyed = otherDyedItems.some(
      (other) => cleanLabel.includes(String(other.colorName).toLowerCase())
    );
    if (matchesOtherDyed) {
      return false;
    }
  }

  // Width matching (if specified)
  if (itWidth && cleanLabel.includes('"')) {
    const labelWidthMatch = cleanLabel.match(/(\d+)\s*"/);
    if (labelWidthMatch && labelWidthMatch[1] !== itWidth) {
      const hasOtherWidthMatch = poItems.some(
        (other, oIdx) => oIdx !== itemIdx && String(other.width).replace(/"/g, '').trim() === labelWidthMatch[1]
      );
      if (hasOtherWidthMatch) {
        return false;
      }
    }
  }

  return true;
}

/**
 * calculatePoFabricFulfillment
 * Calculates the received and pending quantities for each fabric quality in a Purchase Order
 * by inspecting pieces and bales across all linked GRNs (with full multi-PO support).
 *
 * @param {Object} po - The Purchase Order object
 * @param {Array} grns - Array of all GRNs in the system
 * @returns {Array} Array of fulfillment objects per fabric item
 */
export function calculatePoFabricFulfillment(po, grns = []) {
  if (!po || !po.items || !Array.isArray(po.items) || po.items.length === 0) {
    return [];
  }

  const targetPoId = String(po.id || '').trim();
  const poGrns = (grns || []).filter(
    (g) => g && (
      (Array.isArray(g.linkedPOs) && g.linkedPOs.map(String).includes(targetPoId)) ||
      String(g.poId || '').trim() === targetPoId ||
      String(g.poNumber || '').trim() === targetPoId ||
      String(g.againstPo || '').trim() === targetPoId
    )
  );

  const totalOrdered = po.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  return po.items.map((item, idx) => {
    const fName = item.fabricName || item.fabricQuality || `Fabric Quality ${idx + 1}`;
    const colorName = item.colorName || item.color || '';
    const width = item.width || '';
    const ordered = Number(item.quantity) || 0;
    let received = 0;

    poGrns.forEach((g) => {
      const gBales = g.bales || [];
      let grnItemMeters = 0;
      let matchedAnyPieceOrBale = false;
      const isMultiPo = Array.isArray(g.linkedPOs) && g.linkedPOs.length > 1;
      const hasConfiguredBales = gBales.some(
        (b) => (Array.isArray(b.pieces) && b.pieces.length > 0) || Number(b.totalLength) > 0
      );

      if (hasConfiguredBales) {
        gBales.forEach((b) => {
          const isMixed = Boolean(
            b.isMixedFabric ||
            b.fabricItemLabel === 'MIXED_FABRIC' ||
            b.fabricName === 'Mixed Fabric' ||
            String(b.fabricItemLabel || '').toLowerCase().includes('mixed') ||
            String(b.fabricName || '').toLowerCase().includes('mixed')
          );

          if (isMixed && Array.isArray(b.pieces) && b.pieces.length > 0) {
            // Mixed bale: check each piece individually
            b.pieces.forEach((p) => {
              const pLen = typeof p === 'object' && p !== null
                ? (Number(p.length !== undefined ? p.length : p.meters) || 0)
                : (Number(p) || 0);
              const pQuality = typeof p === 'object' && p !== null ? String(p.fabricQuality || '') : '';
              const pPo = typeof p === 'object' && p !== null ? String(p.poId || '') : (b.poId || '');

              if (isPieceOrBaleMatchForItem(pQuality, pPo, item, po.items, idx, targetPoId, isMultiPo)) {
                grnItemMeters += pLen;
                matchedAnyPieceOrBale = true;
              }
            });
          } else {
            // Single fabric bale
            const bLbl = String(b.fabricItemLabel || b.fabric || b.fabricName || '');
            const bPo = String(b.poId || '').trim();

            if (isPieceOrBaleMatchForItem(bLbl, bPo, item, po.items, idx, targetPoId, isMultiPo)) {
              let bLen = 0;
              if (Array.isArray(b.pieces) && b.pieces.length > 0) {
                bLen = b.pieces.reduce((s, p) => {
                  const val = typeof p === 'object' && p !== null ? (p.length !== undefined ? p.length : p.meters) : p;
                  return s + (Number(val) || 0);
                }, 0);
              }
              if (bLen === 0 && Number(b.totalLength) > 0) {
                bLen = Number(b.totalLength);
              }
              grnItemMeters += bLen;
              matchedAnyPieceOrBale = true;
            }
          }
        });

        if (matchedAnyPieceOrBale) {
          received += grnItemMeters;
        }
      } else {
        // Fallback ONLY when GRN has no configured bales/pieces yet (e.g. Header Saved without bale entries)
        const gMetersForPo = getMetersForPoFromGrn(g, targetPoId, po.items);
        if (po.items.length === 1) {
          received += gMetersForPo;
        } else if (gMetersForPo > 0 && totalOrdered > 0) {
          const gFabric = String(g.fabricName || '').toLowerCase();
          const itLbl = fName.toLowerCase();
          if (gFabric && (gFabric.includes(itLbl) || itLbl.includes(gFabric))) {
            received += gMetersForPo;
          } else {
            // Allocate proportionately based on item share of PO
            received += Math.round((gMetersForPo * ordered) / totalOrdered);
          }
        }
      }
    });

    // Fallback if PO has recorded receivedQty on itself but NO linked GRNs exist at all
    if (poGrns.length === 0 && received === 0 && Number(po.receivedQty) > 0 && totalOrdered > 0) {
      if (po.items.length === 1) {
        received = Number(po.receivedQty);
      } else {
        received = Math.round((Number(po.receivedQty) * ordered) / totalOrdered);
      }
    }

    const pending = Math.max(0, ordered - received);
    const excess = Math.max(0, received - ordered);
    const isComplete = ordered > 0 && received >= ordered;
    const isPartial = received > 0 && received < ordered;
    const fulfillmentPercent = ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0;

    return {
      index: idx,
      fabricName: fName,
      colorName,
      width,
      ordered,
      received,
      pending,
      excess,
      isComplete,
      isPartial,
      fulfillmentPercent
    };
  });
}
