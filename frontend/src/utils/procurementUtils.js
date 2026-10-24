/**
 * procurementUtils.js
 * Utility functions for calculating fabric-wise fulfillment, receipt, and pending quantities
 * across Purchase Orders and linked Goods Receipt Notes (GRNs).
 */

/**
 * calculatePoFabricFulfillment
 * Calculates the received and pending quantities for each fabric quality in a Purchase Order
 * by inspecting pieces and bales across all linked GRNs.
 *
 * @param {Object} po - The Purchase Order object
 * @param {Array} grns - Array of all GRNs in the system
 * @returns {Array} Array of fulfillment objects per fabric item:
 *   [{ index, fabricName, colorName, width, ordered, received, pending, isComplete, isPartial }]
 */
export function calculatePoFabricFulfillment(po, grns = []) {
  if (!po || !po.items || !Array.isArray(po.items) || po.items.length === 0) {
    return [];
  }

  // Find all GRNs linked to this PO
  const poGrns = (grns || []).filter(
    (g) => g && (
      (Array.isArray(g.linkedPOs) && g.linkedPOs.includes(po.id)) ||
      g.poId === po.id ||
      g.poNumber === po.id ||
      g.againstPo === po.id
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
      let matchedAnyBale = false;

      if (gBales.length > 0) {
        gBales.forEach((b) => {
          const bLbl = (b.fabricItemLabel || b.fabric || b.fabricName || '').toLowerCase();
          const itLbl = fName.toLowerCase();
          const colorLbl = colorName ? colorName.toLowerCase() : '';

          const isIndexMatch = b.itemIdx !== undefined && b.itemIdx !== null && Number(b.itemIdx) === idx;
          let isLabelMatch = false;

          if (bLbl && itLbl && (bLbl.includes(itLbl) || itLbl.includes(bLbl))) {
            if (colorLbl && bLbl.includes(colorLbl)) {
              isLabelMatch = true;
            } else if (!colorLbl) {
              isLabelMatch = true;
            }
          }

          if (isIndexMatch || isLabelMatch) {
            matchedAnyBale = true;
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
          }
        });
      }

      if (matchedAnyBale) {
        received += grnItemMeters;
      } else {
        // Fallback for single-fabric GRNs or GRNs without piece-level bales
        const gTotal = Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0;
        if (po.items.length === 1) {
          received += gTotal;
        } else if (gTotal > 0 && totalOrdered > 0) {
          const gFabric = (g.fabricName || '').toLowerCase();
          const itLbl = fName.toLowerCase();
          if (gFabric && (gFabric.includes(itLbl) || itLbl.includes(gFabric))) {
            received += gTotal;
          }
        }
      }
    });

    // Fallback if PO has recorded receivedQty on itself but no GRN bales matched
    if (received === 0 && Number(po.receivedQty) > 0 && totalOrdered > 0) {
      if (po.items.length === 1) {
        received = Number(po.receivedQty);
      } else {
        received = Math.round((Number(po.receivedQty) * ordered) / totalOrdered);
      }
    }

    const pending = Math.max(0, ordered - received);
    const isComplete = ordered > 0 && received >= ordered;
    const isPartial = received > 0 && received < ordered;

    return {
      index: idx,
      fabricName: fName,
      colorName,
      width,
      ordered,
      received,
      pending,
      isComplete,
      isPartial
    };
  });
}
