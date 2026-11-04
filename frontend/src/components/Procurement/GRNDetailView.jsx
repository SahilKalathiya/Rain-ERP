import React, { useState, useEffect, useMemo } from 'react';
import { calculateFifoPoAllocations } from '../../utils/procurementUtils';

/**
 * GRNDetailView - Step 3: GRN Details
 * Displays Receipt details, Bale-wise breakdown (with locked/editable status),
 * Quality check by item card (clickable), and audit History.
 * Supports Edit Header modal matching the exact specifications with all 10 receipt-level fields.
 */
export default function GRNDetailView({
  grn,
  vendors = [],
  transporters = [],
  purchaseOrders = [],
  qualityChecks = [],
  allGRNs = [],
  onBack,
  onEditHeader,
  onEditBales,
  onEditGRN,
  onSelectQCItem
}) {
  const [showEditHeaderModal, setShowEditHeaderModal] = useState(false);
  const [editHeaderForm, setEditHeaderForm] = useState({
    challan: '',
    challanDate: '',
    invoice: '',
    invoiceDate: '',
    invoiceValue: '',
    transporter: '',
    lrNumber: '',
    lrDate: '',
    weightKg: '',
    foldingCms: '',
    totalQty: ''
  });

  useEffect(() => {
    if (grn) {
      setEditHeaderForm({
        challan: grn.vendorChallanNo || grn.challan || '',
        challanDate: grn.vendorChallanDate ? (typeof grn.vendorChallanDate === 'string' && grn.vendorChallanDate.includes('T') ? grn.vendorChallanDate.split('T')[0] : grn.vendorChallanDate) : (grn.challanDate ? (typeof grn.challanDate === 'string' && grn.challanDate.includes('T') ? grn.challanDate.split('T')[0] : grn.challanDate) : ''),
        invoice: grn.vendorInvoiceNo || grn.invoice || '',
        invoiceDate: grn.vendorInvoiceDate ? (typeof grn.vendorInvoiceDate === 'string' && grn.vendorInvoiceDate.includes('T') ? grn.vendorInvoiceDate.split('T')[0] : grn.vendorInvoiceDate) : (grn.invoiceDate ? (typeof grn.invoiceDate === 'string' && grn.invoiceDate.includes('T') ? grn.invoiceDate.split('T')[0] : grn.invoiceDate) : ''),
        invoiceValue: grn.invoiceValue !== undefined && grn.invoiceValue !== null ? String(grn.invoiceValue) : (grn.totalAmount ? String(grn.totalAmount) : ''),
        transporter: grn.transporterName || grn.transporterId || '',
        lrNumber: grn.lrNumber || grn.lrNo || '',
        lrDate: grn.lrDate ? (typeof grn.lrDate === 'string' && grn.lrDate.includes('T') ? grn.lrDate.split('T')[0] : grn.lrDate) : '',
        weightKg: grn.weightKg !== undefined && grn.weightKg !== null ? String(grn.weightKg) : (grn.weight ? String(grn.weight) : ''),
        foldingCms: grn.foldingCms !== undefined && grn.foldingCms !== null ? String(grn.foldingCms) : (grn.fabricFolding ? String(grn.fabricFolding) : ''),
        totalQty: grn.declaredTotalMeters !== undefined && grn.declaredTotalMeters !== null && grn.declaredTotalMeters !== '' && Number(grn.declaredTotalMeters) > 0
          ? String(grn.declaredTotalMeters)
          : (grn.totalQty ? String(grn.totalQty).replace(/[^0-9.]/g, '') : '')
      });
    }
  }, [grn, showEditHeaderModal]);

  if (!grn) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4">
        <i className="ti ti-package-off fs-40 text-muted mb-3 d-block"></i>
        <h5 className="fw-bold text-dark mb-2">GRN Record Not Found</h5>
        <p className="text-secondary fs-13 mb-4">The selected Goods Receipt Note could not be loaded.</p>
        <div>
          <button type="button" className="btn btn-primary px-4 py-2 rounded-3" onClick={onBack}>
            Back to GRN Register
          </button>
        </div>
      </div>
    );
  }

  // Safe fallback to localStorage for allGRNs & qualityChecks if props are empty
  const resolvedAllGrns = useMemo(() => {
    if (allGRNs && allGRNs.length > 0) return allGRNs;
    try {
      const stored = localStorage.getItem('raindrop_grns_v1');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }, [allGRNs]);

  const resolvedQualityChecks = useMemo(() => {
    if (qualityChecks && qualityChecks.length > 0) return qualityChecks;
    try {
      const stored = localStorage.getItem('raindrop_qc_v1');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }, [qualityChecks]);

  // Requirement 57: Extract clean linked PO IDs from all possible GRN fields
  const linkedPoIds = useMemo(() => {
    const ids = [];
    if (grn?.linkedPOs && Array.isArray(grn.linkedPOs) && grn.linkedPOs.length > 0) {
      grn.linkedPOs.forEach((p) => {
        if (p && p !== 'PO-DIRECT' && !ids.includes(String(p).trim())) ids.push(String(p).trim());
      });
    }
    if (grn?.poId && grn.poId !== 'PO-DIRECT' && !ids.includes(String(grn.poId).trim())) {
      ids.push(String(grn.poId).trim());
    }
    if (grn?.againstPo && grn.againstPo !== 'PO-DIRECT' && !ids.includes(String(grn.againstPo).trim())) {
      ids.push(String(grn.againstPo).trim());
    }
    if (grn?.poNumber && grn.poNumber !== 'PO-DIRECT' && !ids.includes(String(grn.poNumber).trim())) {
      ids.push(String(grn.poNumber).trim());
    }
    if (grn?.purchaseOrderId && !ids.includes(String(grn.purchaseOrderId).trim())) {
      ids.push(String(grn.purchaseOrderId).trim());
    }
    return ids;
  }, [grn]);

  const linkedPoId = linkedPoIds[0] || grn.poId || grn.againstPo || grn.poNumber || '';

  const linkedPO = useMemo(() => {
    return purchaseOrders.find((p) => {
      if (!p) return false;
      const pId = String(p.id || '').trim();
      const pNum = String(p.poNumber || '').trim();
      return (
        linkedPoIds.includes(pId) ||
        (pNum && linkedPoIds.includes(pNum)) ||
        pId === String(linkedPoId).trim() ||
        (pNum && pNum === String(linkedPoId).trim())
      );
    });
  }, [purchaseOrders, linkedPoIds, linkedPoId]);

  const linkedPOObjects = useMemo(() => {
    return linkedPoIds
      .map((id) => purchaseOrders.find((p) => p && (String(p.id).trim() === String(id).trim() || String(p.poNumber || '').trim() === String(id).trim())))
      .filter(Boolean);
  }, [linkedPoIds, purchaseOrders]);

  const totalGrnDeliveredMeters = Number(grn?.totalMetersEntered) || Number(grn?.declaredTotalMeters) || Number(grn?.totalQty) || 0;

  const fifoAllocations = useMemo(() => {
    if (linkedPOObjects.length <= 1) return [];

    if (grn?.poAllocations && typeof grn.poAllocations === 'object' && Object.keys(grn.poAllocations).length > 0) {
      const sortedPos = [...linkedPOObjects].sort((a, b) => {
        const tA = new Date(a.date || a.createdAt || 0).getTime() || 0;
        const tB = new Date(b.date || b.createdAt || 0).getTime() || 0;
        if (tA && tB && tA !== tB) return tA - tB;
        const numA = parseInt(String(a.id || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.id || '').replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });

      return sortedPos.map((po, index) => {
        const pId = String(po.id).trim();
        const ordered = (po.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        const allocatedInThisGrn = Number(grn.poAllocations[pId]) || 0;
        const totalRecdPo = Number(po.receivedQty) || 0;
        const prevReceived = Math.max(0, totalRecdPo - allocatedInThisGrn);
        const pendingBeforeGrn = Math.max(0, ordered - prevReceived);
        const remainingBalance = Math.max(0, pendingBeforeGrn - allocatedInThisGrn);
        const totalReceivedToDate = prevReceived + allocatedInThisGrn;
        const isComplete = ordered > 0 && totalReceivedToDate >= ordered;
        const isPartial = totalReceivedToDate > 0 && !isComplete;
        const fulfillmentPercent = ordered > 0 ? Math.min(100, Math.round((totalReceivedToDate / ordered) * 100)) : 0;

        return {
          poId: pId,
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
          fulfillmentPercent
        };
      });
    }

    return calculateFifoPoAllocations(linkedPOObjects, totalGrnDeliveredMeters, []);
  }, [linkedPOObjects, grn, totalGrnDeliveredMeters]);

  // Find vendor
  const vendorObj = vendors.find((v) =>
    (grn.vendorId && v.id === grn.vendorId) ||
    (grn.vendor && (v.id === grn.vendor || v.name === grn.vendor)) ||
    (grn.vendorName && v.name === grn.vendorName)
  );

  const vendorDisplayName =
    grn.vendorName ||
    grn.vendor ||
    vendorObj?.name ||
    linkedPO?.vendorName ||
    vendors.find((v) => v.id === linkedPO?.vendorId)?.name ||
    '—';

  // Find transporter
  const transporterObj = transporters.find((t) => t.id === grn.transporterId || t.name === grn.transporterName);

  // Build full transporter options
  const defaultTransporterOptions = [
    'Bhiwandi Roadlines',
    'Keshav Freight Carriers',
    'Masood Transport Broker',
    'Surat Gujarat Transport',
    'Jaipur Golden Transport',
    'V-Trans India Ltd.'
  ];
  const allTransporterNames = Array.from(
    new Set([
      ...transporters.map((t) => t.name).filter(Boolean),
      ...defaultTransporterOptions,
      grn.transporterName
    ].filter(Boolean))
  );

  // Extract clean numerical/alphanumeric suffix from GRN ID for matching QC records
  const cleanGrnNum = String(grn.id || '').replace(/^GRN-/, '');

  // Find all QC records matching this GRN (both main and partitioned QC IDs)
  const qcRecs = (qualityChecks || []).filter((q) => {
    if (!q) return false;
    const qGrnRef = String(q.grnRef || '');
    const grnIdStr = String(grn.id || '');
    if (qGrnRef === grnIdStr) return true;
    const qIdStr = String(q.id || '');
    if (cleanGrnNum && (qIdStr === `QC-${cleanGrnNum}` || qIdStr.startsWith(`QC-${cleanGrnNum}-`))) return true;
    return false;
  });
  const mainQC = qcRecs[0];

  const declaredBaleCount = Math.max(0, parseInt(grn.totalBales || grn.numBales || 0, 10));
  const rawBales = Array.isArray(grn.bales) ? grn.bales : [];
  let bales = [...rawBales];
  if (declaredBaleCount > bales.length) {
    for (let i = bales.length; i < declaredBaleCount; i++) {
      bales.push({
        baleNo: String(i + 1),
        fabricItemLabel: grn.fabricName || 'Fabric Item',
        piecesCount: 0,
        totalLength: 0,
        pieces: []
      });
    }
  }

  // Calculate declared total quantity entered
  const declaredTotalQty = Number(grn.totalQty ? String(grn.totalQty).replace(/[^0-9.]/g, '') : 0) || Number(grn.declaredTotalMeters) || 0;

  // Calculate actual total meters entered across bales and pieces
  const baleMetersEntered = bales.reduce((s, b) => {
    const piecesArr = Array.isArray(b?.pieces) ? b.pieces : [];
    const pLen = piecesArr.reduce((ps, p) => ps + (Number(typeof p === 'object' ? p?.length : p) || 0), 0);
    return s + (pLen > 0 ? pLen : (Number(b?.totalLength) || 0));
  }, 0);

  // Requirement 21: QC should not proceed until the total quantity entered in GRN has complete bale entries.
  const isBaleEntriesComplete = declaredTotalQty > 0 &&
    (bales.length > 0) &&
    baleMetersEntered > 0 &&
    Math.abs(baleMetersEntered - declaredTotalQty) < 0.01;

  const baleIncompleteReason = declaredTotalQty <= 0
    ? 'Total quantity is not specified in GRN'
    : (grn.bales || []).length === 0
    ? 'No bales entered in GRN'
    : Math.abs(baleMetersEntered - declaredTotalQty) >= 0.01
    ? `Bale entries total (${baleMetersEntered}m) does not match total quantity (${declaredTotalQty}m)`
    : '';

  // Requirement: Once a GRN is submitted to QC (or Completed / Actioned), it is non-editable.
  const isQcPassedOrApproved = Boolean(
    grn.status === 'QC Approved' ||
    grn.status === 'QC Passed' ||
    (qcRecs.length > 0 && qcRecs.every((q) => q.qcStatus === 'Passed' || q.qcStatus === 'QC Approved' || q.qcStatus === 'Approved'))
  );

  const hasActiveQc = qcRecs && qcRecs.some(
    (q) => (q.qcStatus && q.qcStatus !== 'Pending') || ['In Progress', 'Completed', 'Approved', 'Rejected', 'Passed'].includes(q.status)
  );

  const isDraftGRN = ['Draft', 'Bale Entry in Progress', 'Header Saved'].includes(grn.status) || !grn.status;

  const isQcSubmitted = !isDraftGRN && Boolean(
    grn.isSubmittedToQC === true ||
    ['Submitted to QC', 'QC In Progress', 'QC Approved', 'QC Passed', 'QC Rejected', 'Pending Admin Approval'].includes(grn.status)
  );

  const isQcStarted = !isDraftGRN && Boolean(
    isQcPassedOrApproved ||
    (grn.isQcActioned && grn.status !== 'Completed' && grn.status !== 'Submitted to QC') ||
    (grn.qcStatus && grn.qcStatus !== 'Pending') ||
    ['QC Approved', 'QC Rejected', 'QC Passed', 'QC In Progress', 'Pending Admin Approval'].includes(grn.status) ||
    hasActiveQc
  );

  const canEditHeader = !isQcStarted;
  const canEditBales = !isQcStarted;

  const anyPending = !isQcStarted;

  const totalMeters = Number(grn.totalMetersEntered) || baleMetersEntered || Number(grn.declaredTotalMeters) || declaredTotalQty || 0;
  const totalPiecesCount = bales.reduce((sum, b) => {
    const piecesArr = Array.isArray(b?.pieces) ? b.pieces : [];
    return sum + (piecesArr.length || Number(b?.piecesCount) || 0);
  }, 0) || Number(grn.totalPieces) || 0;

  const poOrderedTotal = useMemo(() => {
    if (linkedPO?.items && linkedPO.items.length > 0) {
      return linkedPO.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    }
    return Number(linkedPO?.totalQuantity || linkedPO?.quantity || 0);
  }, [linkedPO]);

  // Find all other GRNs linked to this PO (excluding this current GRN)
  const otherGrnsForPo = useMemo(() => {
    if (!linkedPoIds || linkedPoIds.length === 0) return [];
    return (resolvedAllGrns || []).filter((g) => {
      if (!g || String(g.id) === String(grn.id)) return false;
      const gPoIds = (g.linkedPOs && g.linkedPOs.length > 0)
        ? g.linkedPOs.map(String)
        : [String(g.poId || g.againstPo || g.poNumber || '')].filter(Boolean);
      return gPoIds.some((pid) => linkedPoIds.includes(pid));
    });
  }, [resolvedAllGrns, grn.id, linkedPoIds]);

  // Meters received in prior shipments for this PO
  const priorReceivedMeters = useMemo(() => {
    let sum = 0;
    if (otherGrnsForPo.length > 0) {
      otherGrnsForPo.forEach((g) => {
        let gM = 0;
        if (g.poAllocations && typeof g.poAllocations === 'object') {
          linkedPoIds.forEach((pId) => {
            if (g.poAllocations[pId] !== undefined) {
              gM += Number(g.poAllocations[pId]) || 0;
            }
          });
        }
        if (gM <= 0) {
          gM = Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || Number(String(g.totalQty || '').replace(/[^0-9.]/g, '')) || 0;
        }
        sum += gM;
      });
    }

    // Fallback: Check if linkedPO has receivedQty
    const poRec = Number(linkedPO?.receivedQty || 0);
    if (sum === 0 && poRec > 0) {
      if (isDraftGRN) {
        sum = poRec;
      } else if (poRec > totalMeters) {
        sum = poRec - totalMeters;
      } else {
        sum = poRec;
      }
    }
    return sum;
  }, [otherGrnsForPo, linkedPoIds, linkedPO, totalMeters, isDraftGRN]);

  // Total cumulative meters received across all GRNs for this PO to date
  const cumulativeReceivedMeters = priorReceivedMeters + totalMeters;

  const targetTrackingMeters = poOrderedTotal > 0 ? poOrderedTotal : (declaredTotalQty > 0 ? declaredTotalQty : cumulativeReceivedMeters);
  const pendingTrackingMeters = Math.max(0, targetTrackingMeters - cumulativeReceivedMeters);
  const trackingPct = targetTrackingMeters > 0
    ? Math.min(100, Math.round((cumulativeReceivedMeters / targetTrackingMeters) * 100))
    : (cumulativeReceivedMeters > 0 ? 100 : 0);

  // Calculate QC totals for THIS GRN (Approved, Rejected, Pending)
  const qcAwaitingInspectionMeters = useMemo(() => {
    let approved = 0;
    let rejected = 0;
    qcRecs.forEach((q) => {
      const qM = Number(q.totalReceivedMeters || q.receivedQty || 0);
      if (q.qcStatus === 'Approved' || q.qcStatus === 'QC Approved' || q.qcStatus === 'OK' || q.qcStatus === 'Passed') {
        approved += qM;
      } else if (q.qcStatus === 'Reject' || q.qcStatus === 'Rejected') {
        rejected += qM;
      }
    });
    const pending = Math.max(0, totalMeters - approved - rejected);
    return {
      approvedMeters: approved,
      rejectedMeters: rejected,
      pendingMeters: pending > 0 ? pending : (totalMeters > 0 && approved === 0 ? totalMeters : 0),
      isAllApproved: totalMeters > 0 && approved >= totalMeters,
      isPartiallyDone: approved > 0 || rejected > 0
    };
  }, [qcRecs, totalMeters]);

  // QC Approved meters from prior completed GRNs for this PO
  const priorQcApprovedMeters = useMemo(() => {
    let approved = 0;
    const otherGrnIds = otherGrnsForPo.map((g) => String(g.id));

    (resolvedQualityChecks || qualityChecks || []).forEach((q) => {
      if (!q) return;
      const qGrnRef = String(q.grnRef || q.grnId || '');
      const isOtherGrn = otherGrnIds.includes(qGrnRef);
      const isSamePo = (q.againstRef && linkedPoIds.includes(String(q.againstRef))) ||
        (q.againstPo && linkedPoIds.includes(String(q.againstPo))) ||
        (q.poId && linkedPoIds.includes(String(q.poId)));

      if (isOtherGrn || (isSamePo && qGrnRef !== String(grn.id))) {
        if (['Approved', 'QC Approved', 'Passed', 'OK'].includes(q.qcStatus)) {
          approved += Number(q.passedQty || q.totalReceivedMeters || q.receivedQty || 0);
        }
      }
    });

    if (approved === 0 && otherGrnsForPo.length > 0) {
      otherGrnsForPo.forEach((g) => {
        if (['QC Approved', 'QC Passed', 'Completed'].includes(g.status) || g.isQcActioned) {
          approved += Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0;
        }
      });
    }

    if (approved === 0 && priorReceivedMeters > 0) {
      if (['Partially Received', 'Completed'].includes(linkedPO?.status) || linkedPO?.receivedQty) {
        approved = priorReceivedMeters;
      }
    }

    return approved;
  }, [otherGrnsForPo, resolvedQualityChecks, qualityChecks, linkedPoIds, grn.id, priorReceivedMeters, linkedPO]);

  const totalPoQcApproved = priorQcApprovedMeters + qcAwaitingInspectionMeters.approvedMeters;

  // Current GRN QC Approved meters
  const currentGrnApprovedMeters = qcAwaitingInspectionMeters.approvedMeters;

  // Total PO Received: Only counts material that has actually been QC Approved / accepted into PO inventory
  const totalPoReceivedApprovedMeters = priorQcApprovedMeters + currentGrnApprovedMeters;

  // Percentage of PO that is officially QC approved and accepted
  const approvedPct = targetTrackingMeters > 0
    ? Math.min(100, Math.round((totalPoReceivedApprovedMeters / targetTrackingMeters) * 100))
    : (totalPoReceivedApprovedMeters > 0 ? 100 : 0);

  // Expected Width & Fold
  const expectedWidth = mainQC?.expectedWidth || linkedPO?.items?.[0]?.width || '42"';
  const expectedFold = mainQC?.expectedFold || grn.foldingCms || linkedPO?.items?.[0]?.fold || '100';

  const poItems = linkedPO?.items || [];
  const baleFabrics = Array.from(new Set(bales.map((b) => b.fabricItemLabel).filter(Boolean)));

  // Requirement 38: Generate distinct QC inspection batches for each fabric quality
  const qcInspectionBatches = useMemo(() => {
    // If we have explicit multi-QC records in qualityChecks
    if (qcRecs.length > 1) {
      return qcRecs.map((q, idx) => {
        let fName = q.fabricName || '';
        if (!fName && poItems[idx]) {
          fName = poItems[idx].fabricName || poItems[idx].fabricQuality || '';
        }
        if (!fName && baleFabrics[idx]) {
          fName = baleFabrics[idx];
        }
        if (!fName) {
          fName = grn.fabricName || `Fabric Quality ${idx + 1}`;
        }
        const bMeters = bales.reduce((sum, b) => {
          const bLbl = String(b.fabricItemLabel || '').toLowerCase();
          const qLbl = fName.toLowerCase();
          if (b.itemIdx === idx || (bLbl && (bLbl.includes(qLbl) || qLbl.includes(bLbl)))) {
            const piecesArr = Array.isArray(b?.pieces) ? b.pieces : [];
            const bLen = piecesArr.reduce((ps, p) => ps + (Number(typeof p === 'object' ? p?.length : p) || 0), 0);
            return sum + (bLen > 0 ? bLen : (Number(b.totalLength) || 0));
          }
          return sum;
        }, 0);

        return {
          id: q.id,
          fabricName: fName,
          totalReceivedMeters: q.totalReceivedMeters || q.receivedQty || bMeters || 0,
          expectedWidth: q.expectedWidth || linkedPO?.items?.[idx]?.width || grn.pannaWidth || '44',
          expectedFold: q.expectedFold || linkedPO?.items?.[idx]?.fold || grn.fabricFolding || '100',
          qcStatus: q.qcStatus || (grn.status === 'QC Approved' ? 'Approved' : 'Pending'),
          qcRecord: q
        };
      });
    }

    // If multiple PO items exist
    if (poItems.length > 1) {
      return poItems.map((it, idx) => {
        const fName = it.fabricName || it.fabricQuality || `Fabric Quality ${idx + 1}`;
        const partitionId = `QC-${cleanGrnNum || '0001'}-F${idx + 1}`;
        const existingQc = qcRecs.find((q) => q.id === partitionId || q.fabricName === fName) || (idx === 0 ? qcRecs[0] : null);

        let fMeters = 0;
        bales.forEach((b) => {
          const bLbl = String(b.fabricItemLabel || '').toLowerCase();
          const itLbl = fName.toLowerCase();
          if (b.itemIdx === idx || (bLbl && (bLbl.includes(itLbl) || itLbl.includes(bLbl)))) {
            const piecesArr = Array.isArray(b?.pieces) ? b.pieces : [];
            const bLen = piecesArr.reduce((s, p) => s + (Number(typeof p === 'object' ? p?.length : p) || 0), 0);
            fMeters += bLen > 0 ? bLen : (Number(b.totalLength) || 0);
          }
        });
        if (fMeters <= 0) {
          fMeters = Number(it.quantity) || Math.round((Number(grn.declaredTotalMeters || grn.totalQty || 0)) / poItems.length);
        }

        const qcObj = existingQc ? {
          ...existingQc,
          id: existingQc.id || partitionId,
          fabricName: existingQc.fabricName || fName,
          totalReceivedMeters: existingQc.totalReceivedMeters || fMeters,
          expectedWidth: existingQc.expectedWidth || String(it.width || '44'),
          expectedFold: existingQc.expectedFold || String(it.fold || '100')
        } : {
          id: partitionId,
          grnRef: grn.id,
          againstRef: linkedPO?.id || grn.poId || '',
          fabricName: fName,
          fabricId: it.fabricId || '',
          colorName: it.color || it.colorName || it.shade || grn.colorName || 'Grey / Natural',
          expectedWidth: String(it.width || '44'),
          expectedFold: String(it.fold || '100'),
          totalReceivedMeters: fMeters,
          receivedQty: fMeters,
          qcStatus: grn.status === 'QC Approved' ? 'Approved' : 'Pending',
          originalQcId: qcRecs[0]?.id
        };

        return {
          id: qcObj.id,
          fabricName: fName,
          totalReceivedMeters: fMeters,
          expectedWidth: it.width ? String(it.width) : (qcObj.expectedWidth || '44'),
          expectedFold: it.fold ? String(it.fold) : (qcObj.expectedFold || '100'),
          qcStatus: qcObj.qcStatus || (grn.status === 'QC Approved' ? 'Approved' : 'Pending'),
          qcRecord: qcObj
        };
      });
    }

    // If multiple bale fabric labels exist
    if (baleFabrics.length > 1) {
      return baleFabrics.map((fLbl, idx) => {
        const partitionId = `QC-${cleanGrnNum || '0001'}-F${idx + 1}`;
        const existingQc = qcRecs.find((q) => q.id === partitionId || q.fabricName === fLbl) || (idx === 0 ? qcRecs[0] : null);

        let fMeters = 0;
        bales.forEach((b) => {
          if (b.fabricItemLabel === fLbl) {
            const piecesArr = Array.isArray(b?.pieces) ? b.pieces : [];
            const bLen = piecesArr.reduce((s, p) => s + (Number(typeof p === 'object' ? p?.length : p) || 0), 0);
            fMeters += bLen > 0 ? bLen : (Number(b.totalLength) || 0);
          }
        });
        if (fMeters <= 0) {
          fMeters = Math.round((Number(grn.declaredTotalMeters || grn.totalQty || 0)) / baleFabrics.length);
        }

        const qcObj = existingQc ? {
          ...existingQc,
          id: existingQc.id || partitionId,
          fabricName: existingQc.fabricName || fLbl,
          totalReceivedMeters: existingQc.totalReceivedMeters || fMeters
        } : {
          id: partitionId,
          grnRef: grn.id,
          againstRef: linkedPO?.id || grn.poId || '',
          fabricName: fLbl,
          expectedWidth: String(grn.pannaWidth || '44'),
          expectedFold: String(grn.fabricFolding || '100'),
          totalReceivedMeters: fMeters,
          receivedQty: fMeters,
          qcStatus: grn.status === 'QC Approved' ? 'Approved' : 'Pending',
          originalQcId: qcRecs[0]?.id
        };

        return {
          id: qcObj.id,
          fabricName: fLbl,
          totalReceivedMeters: fMeters,
          expectedWidth: qcObj.expectedWidth || grn.pannaWidth || '44',
          expectedFold: qcObj.expectedFold || grn.fabricFolding || '100',
          qcStatus: qcObj.qcStatus || (grn.status === 'QC Approved' ? 'Approved' : 'Pending'),
          qcRecord: qcObj
        };
      });
    }

    // Fallback: Single fabric item
    const singleQc = qcRecs[0] || {
      id: `QC-${cleanGrnNum || '0001'}`,
      grnRef: grn.id,
      againstRef: linkedPO?.id || grn.poId || '',
      fabricName: grn.fabricName || 'Modal Satin Premium',
      totalReceivedMeters: totalMeters,
      receivedQty: totalMeters,
      expectedWidth: String(expectedWidth || '44').replace(/"/g, ''),
      expectedFold: String(expectedFold || '100').replace(/%/g, ''),
      qcStatus: grn.status === 'QC Approved' ? 'Approved' : 'Pending'
    };

    return [
      {
        id: singleQc.id,
        fabricName: grn.fabricName || singleQc.fabricName || 'Modal Satin Premium',
        totalReceivedMeters: totalMeters,
        expectedWidth: singleQc.expectedWidth || expectedWidth || '44',
        expectedFold: singleQc.expectedFold || expectedFold || '100',
        qcStatus: singleQc.qcStatus || (grn.status === 'QC Approved' ? 'Approved' : 'Pending'),
        qcRecord: singleQc
      }
    ];
  }, [qcRecs, poItems, baleFabrics, grn, linkedPO, totalMeters, expectedWidth, expectedFold, cleanGrnNum, bales]);

  const handleSaveHeader = (e) => {
    e.preventDefault();
    if (!canEditHeader) {
      alert('Receipt details cannot be edited because Quality Check has already started or been approved for this GRN.');
      setShowEditHeaderModal(false);
      return;
    }
    if (onEditHeader) {
      onEditHeader({
        ...grn,
        vendorChallanNo: editHeaderForm.challan,
        vendorChallanDate: editHeaderForm.challanDate,
        vendorInvoiceNo: editHeaderForm.invoice,
        vendorInvoiceDate: editHeaderForm.invoiceDate,
        invoiceValue: editHeaderForm.invoiceValue,
        transporterName: editHeaderForm.transporter,
        lrNumber: editHeaderForm.lrNumber,
        lrNo: editHeaderForm.lrNumber,
        lrDate: editHeaderForm.lrDate,
        weightKg: editHeaderForm.weightKg,
        weight: editHeaderForm.weightKg,
        foldingCms: editHeaderForm.foldingCms,
        fabricFolding: editHeaderForm.foldingCms,
        totalQty: editHeaderForm.totalQty,
        declaredTotalMeters: Number(editHeaderForm.totalQty) || 0
      });
    }
    setShowEditHeaderModal(false);
  };

  return (
    <div className="container-fluid p-0">
      {/* Top Header & Breadcrumb */}
      <div className="mb-4">
        <button
          type="button"
          className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold d-inline-flex align-items-center gap-1.5 mb-2 fs-13"
          style={{ color: '#5b47fb' }}
          onClick={onBack}
        >
          <i className="ti ti-arrow-left"></i>
          <span>Back to GRN Register</span>
        </button>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h3 className="fw-bold text-dark mb-0 fs-20">
                Goods Receipt Note: {grn.id}
              </h3>
              <span
                className={`badge px-2.5 py-1 fs-11 rounded-pill ${
                  grn.status === 'QC Approved'
                    ? 'bg-success-subtle text-success border border-success border-opacity-25'
                    : grn.status === 'QC Rejected'
                    ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                    : grn.status === 'Completed'
                    ? 'bg-primary-subtle text-primary border border-primary border-opacity-25'
                    : 'bg-secondary-subtle text-secondary border border-secondary border-opacity-25'
                }`}
              >
                {grn.status || 'Draft'}
              </span>
              {isQcStarted ? (
                <span className="badge bg-light text-secondary border px-2.5 py-1 fs-11 rounded-pill fw-medium d-inline-flex align-items-center gap-1">
                  <i className="ti ti-lock text-warning"></i> Locked (Submitted to QC &mdash; Non-editable)
                </span>
              ) : null}
            </div>
            <p className="text-secondary mb-0 fs-13 mt-1">
              Raw Material Fabric Procurement &mdash; Recording receipt against{' '}
              <strong>{grn.linkedPOs && grn.linkedPOs.length > 1 ? grn.linkedPOs.join(', ') : (linkedPoId ? `${linkedPoId}` : 'Direct Inward')}</strong>
              {vendorDisplayName && vendorDisplayName !== '—' && (
                <> · <span className="fw-semibold text-dark">{vendorDisplayName}</span></>
              )}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            {!isQcStarted ? (
              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3 fs-13 text-white shadow-sm"
                style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                onClick={() => {
                  if (onEditGRN) {
                    onEditGRN(grn);
                  } else if (onEditBales) {
                    onEditBales(grn);
                  }
                }}
                title="Edit entire GRN record and container bales"
              >
                <i className="ti ti-edit fs-15"></i>
                <span>Edit Record</span>
              </button>
            ) : (
              <span className="badge bg-light text-secondary border px-3 py-2 fs-12 rounded-2 d-inline-flex align-items-center gap-1.5">
                <i className="ti ti-lock text-warning fs-14"></i>
                <span>Locked (Non-editable)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: HEADER & RECEIPT INFORMATION (Image 2 Style) */}
      <div
        className="card mb-4 shadow-none"
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px 20px'
        }}
      >
        <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
          <span
            className="fw-bold text-secondary text-uppercase"
            style={{ fontSize: '12px', letterSpacing: '0.05em' }}
          >
            1. HEADER &amp; RECEIPT INFORMATION
          </span>
          {!isQcStarted && (
            <button
              type="button"
              className="btn btn-link text-primary p-0 text-decoration-none fs-12 fw-semibold d-inline-flex align-items-center gap-1"
              onClick={() => {
                if (onEditGRN) onEditGRN(grn);
                else if (onEditBales) onEditBales(grn);
              }}
            >
              <i className="ti ti-edit fs-13"></i>
              <span>Edit Section</span>
            </button>
          )}
        </div>

        <div className="row g-3 fs-13">
          <div className="col-6 col-sm-4 col-md-3">
            <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>GRN NO.</div>
            <div className="fw-bold text-primary font-monospace fs-13">{grn.id}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-3">
            <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>RECEIVED DATE *</div>
            <div className="fw-bold text-dark fs-13">{grn.date || grn.receivedDate || '2026-11-03'}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-3">
            <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>VENDOR *</div>
            <div className="fw-bold text-dark fs-13 text-truncate" title={vendorDisplayName}>{vendorDisplayName}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-3">
            <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>AGAINST PO</div>
            <div className="fw-bold text-dark fs-13 font-monospace">{grn.linkedPOs && grn.linkedPOs.length > 1 ? grn.linkedPOs.join(', ') : (linkedPoId ? `${linkedPoId}` : 'Direct Inward')}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-3">
            <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>VENDOR CHALLAN</div>
            <div className="fw-bold text-dark fs-13">{grn.vendorChallanNo || grn.challan || '—'}</div>
            {(grn.vendorChallanDate || grn.challanDate) && (
              <div className="text-muted fs-11">{grn.vendorChallanDate || grn.challanDate}</div>
            )}
          </div>
          <div className="col-6 col-sm-4 col-md-3">
            <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>VENDOR INVOICE</div>
            <div className="fw-bold text-dark fs-13">{grn.vendorInvoiceNo || grn.invoice || '—'}</div>
            {(grn.vendorInvoiceDate || grn.invoiceDate) && (
              <div className="text-muted fs-11">{grn.vendorInvoiceDate || grn.invoiceDate}</div>
            )}
          </div>
          <div className="col-6 col-sm-4 col-md-3">
            <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>TRANSPORTER</div>
            <div className="fw-bold text-dark fs-13 text-truncate">{grn.transporterName || transporterObj?.name || '—'}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-3">
            <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>LR NO. / DATE</div>
            <div className="fw-bold text-dark fs-13">{grn.lrNumber || grn.lrNo || '—'}</div>
            {grn.lrDate && <div className="text-muted fs-11">{grn.lrDate}</div>}
          </div>
        </div>
      </div>

      {/* SECTION 2: DELIVERY & SHIPMENT TRACKING (Image 2 Style with QC Status) */}
      <div
        className="card mb-4 shadow-none"
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px 20px'
        }}
      >
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            <span
              className="p-1 rounded d-inline-flex align-items-center justify-content-center"
              style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', width: '28px', height: '28px' }}
            >
              <i className="ti ti-truck-delivery fs-16"></i>
            </span>
            <div>
              <span
                className="fw-bold text-secondary text-uppercase"
                style={{ fontSize: '12px', letterSpacing: '0.05em' }}
              >
                DELIVERY &amp; SHIPMENT TRACKING
              </span>
              <div className="text-muted" style={{ fontSize: '11px' }}>
                Goods Receipt Notes (GRN), Linked Consolidations &amp; Meter Fulfillment
              </div>
            </div>
          </div>
          {isDraftGRN ? (
            <span className="badge bg-white text-secondary border px-3 py-1.5 fs-11 rounded-pill shadow-2xs">
              Awaiting GRN Submission
            </span>
          ) : (
            <span
              className={`badge px-2.5 py-1 fs-11 rounded-pill ${
                qcAwaitingInspectionMeters.isAllApproved
                  ? 'bg-success-subtle text-success border border-success border-opacity-25'
                  : qcAwaitingInspectionMeters.isPartiallyDone
                  ? 'bg-info-subtle text-info border border-info border-opacity-25'
                  : 'bg-warning-subtle text-warning-emphasis border border-warning border-opacity-50'
              }`}
            >
              <i className={`ti ${qcAwaitingInspectionMeters.isAllApproved ? 'ti-check' : 'ti-clock'} me-1`}></i>
              {qcAwaitingInspectionMeters.isAllApproved
                ? 'QC Approved (100%)'
                : qcAwaitingInspectionMeters.isPartiallyDone
                ? 'QC In Progress'
                : 'QC Pending'}
            </span>
          )}
        </div>

        {/* Summary Stat Cards Grid */}
        <div className="row g-2 text-center mb-3">
          <div className="col-6 col-sm-4 col-md">
            <div className="p-2.5 rounded bg-white border h-100 d-flex flex-column justify-content-center" style={{ borderColor: '#e2e8f0' }}>
              <div className="text-secondary fs-11 fw-semibold mb-1">Total Ordered</div>
              <div className="fw-bold text-dark fs-14">
                {(targetTrackingMeters > 0 ? targetTrackingMeters : cumulativeReceivedMeters).toLocaleString()} m
              </div>
              <div className="text-muted" style={{ fontSize: '10px' }}>PO Total</div>
            </div>
          </div>
          <div className="col-6 col-sm-4 col-md">
            <div
              className="p-2.5 rounded bg-white border h-100 d-flex flex-column justify-content-center"
              style={{
                borderColor: isDraftGRN ? '#c7d2fe' : '#bbf7d0',
                backgroundColor: isDraftGRN ? '#f5f3ff' : '#f0fdf4'
              }}
            >
              <div
                className="fs-11 fw-semibold mb-1 d-flex align-items-center justify-content-center gap-1"
                style={{ color: isDraftGRN ? '#4f46e5' : '#15803d' }}
              >
                {isDraftGRN && <i className="ti ti-pencil fs-12"></i>}
                <span>{isDraftGRN ? 'Draft Inward Qty' : (priorReceivedMeters > 0 ? 'This GRN Inward' : 'Received (Inward)')}</span>
              </div>
              <div
                className="fw-bold fs-14"
                style={{ color: isDraftGRN ? '#4f46e5' : '#15803d' }}
              >
                {totalMeters.toLocaleString()} m
              </div>
              <div className="text-muted" style={{ fontSize: '10px' }}>
                {isDraftGRN ? 'Unsubmitted Draft' : (priorReceivedMeters > 0 ? 'Current Delivery' : 'Total Inward')}
              </div>
            </div>
          </div>
          {priorReceivedMeters > 0 && (
            <div className="col-6 col-sm-4 col-md">
              <div
                className="p-2.5 rounded bg-white border h-100 d-flex flex-column justify-content-center"
                style={{
                  borderColor: currentGrnApprovedMeters > 0 ? '#93c5fd' : '#e2e8f0',
                  backgroundColor: currentGrnApprovedMeters > 0 ? '#eff6ff' : '#f8fafc'
                }}
              >
                <div className="text-primary fs-11 fw-semibold mb-1 d-flex align-items-center justify-content-center gap-1">
                  <i className="ti ti-stack-2 fs-12"></i>
                  <span>Total PO Received</span>
                </div>
                <div className="fw-bold text-primary fs-14">
                  {totalPoReceivedApprovedMeters.toLocaleString()} m
                </div>
                <div className="text-muted" style={{ fontSize: '10px' }}>
                  {currentGrnApprovedMeters > 0
                    ? `${priorQcApprovedMeters.toLocaleString()}m prior + ${currentGrnApprovedMeters.toLocaleString()}m this`
                    : `${priorQcApprovedMeters.toLocaleString()}m prior approved (This GRN pending QC)`}
                </div>
              </div>
            </div>
          )}
          <div className="col-6 col-sm-4 col-md">
            <div className="p-2.5 rounded bg-white border h-100 d-flex flex-column justify-content-center" style={{ borderColor: '#e2e8f0' }}>
              <div className="text-secondary fs-11 fw-semibold mb-1">Pending to Inward</div>
              <div className={`fw-bold fs-14 ${pendingTrackingMeters === 0 ? 'text-success' : 'text-danger'}`}>
                {(pendingTrackingMeters > 0 ? pendingTrackingMeters : 0).toLocaleString()} m
              </div>
              <div className="text-muted" style={{ fontSize: '10px' }}>
                {pendingTrackingMeters === 0 ? 'PO Fully Received' : (isDraftGRN ? 'After Submission' : 'Remaining PO Balance')}
              </div>
            </div>
          </div>
          {!isDraftGRN && (
            <>
              <div className="col-6 col-sm-4 col-md">
                <div className="p-2.5 rounded bg-white border h-100 d-flex flex-column justify-content-center" style={{ borderColor: '#fde68a', backgroundColor: '#fffdf0' }}>
                  <div className="text-warning-emphasis fs-11 fw-semibold mb-1 d-flex align-items-center justify-content-center gap-1">
                    <i className="ti ti-clock text-warning"></i>
                    <span>QC Pending</span>
                  </div>
                  <div className="fw-bold text-warning-emphasis fs-14">
                    {qcAwaitingInspectionMeters.pendingMeters.toLocaleString()} m
                  </div>
                  <div className="text-muted" style={{ fontSize: '10px' }}>This GRN to Inspect</div>
                </div>
              </div>
              <div className="col-6 col-sm-4 col-md">
                <div
                  className="p-2.5 rounded bg-white border h-100 d-flex flex-column justify-content-center"
                  style={{
                    borderColor: currentGrnApprovedMeters > 0 ? '#bbf7d0' : '#e2e8f0',
                    backgroundColor: currentGrnApprovedMeters > 0 ? '#f0fdf4' : '#ffffff'
                  }}
                >
                  <div
                    className="fs-11 fw-semibold mb-1"
                    style={{ color: currentGrnApprovedMeters > 0 ? '#15803d' : '#64748b' }}
                  >
                    This GRN Approved
                  </div>
                  <div
                    className="fw-bold fs-14"
                    style={{ color: currentGrnApprovedMeters > 0 ? '#15803d' : '#64748b' }}
                  >
                    {currentGrnApprovedMeters.toLocaleString()} m
                  </div>
                  <div className="text-muted" style={{ fontSize: '10px' }}>
                    {currentGrnApprovedMeters > 0
                      ? 'QC Passed'
                      : (qcAwaitingInspectionMeters.isPartiallyDone ? 'Partial Approved' : 'Awaiting QC')}
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="col-6 col-sm-4 col-md">
            <div className="p-2.5 rounded bg-white border h-100 d-flex flex-column justify-content-center" style={{ borderColor: '#e2e8f0' }}>
              <div className="text-secondary fs-11 fw-semibold mb-1">
                {isDraftGRN ? 'Total GRN Inwards' : 'Containers'}
              </div>
              <div className="fw-bold text-dark fs-14">
                {bales.length || grn.totalBales || 1} Container(s)
              </div>
              <div className="text-muted" style={{ fontSize: '10px' }}>
                {isDraftGRN ? 'Bales Entered' : `${totalPiecesCount || bales.length} Pieces`}
              </div>
            </div>
          </div>
        </div>

        {/* Inward vs QC Progress Summary */}
        {isDraftGRN ? (
          <div>
            <div className="d-flex align-items-center justify-content-between fs-12 mb-1.5">
              <span className="text-secondary fw-semibold">Draft Inward Allocation Progress:</span>
              <span className="fw-bold text-dark">
                {trackingPct}% ({cumulativeReceivedMeters.toLocaleString()}m in draft &amp; prior / {(targetTrackingMeters > 0 ? targetTrackingMeters : cumulativeReceivedMeters).toLocaleString()}m ordered)
              </span>
            </div>
            <div className="progress rounded-pill overflow-hidden" style={{ height: '7px', backgroundColor: '#e2e8f0' }}>
              {priorReceivedMeters > 0 && (
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{
                    width: `${Math.min(100, Math.round((priorReceivedMeters / targetTrackingMeters) * 100))}%`,
                    backgroundColor: '#3b82f6'
                  }}
                  title={`Prior received: ${priorReceivedMeters.toLocaleString()}m`}
                ></div>
              )}
              <div
                className="progress-bar"
                role="progressbar"
                style={{
                  width: `${Math.min(100 - (priorReceivedMeters > 0 ? Math.round((priorReceivedMeters / targetTrackingMeters) * 100) : 0), Math.round((totalMeters / targetTrackingMeters) * 100))}%`,
                  backgroundColor: '#5b47fb'
                }}
                title={`This draft GRN: ${totalMeters.toLocaleString()}m`}
              ></div>
            </div>
            {priorReceivedMeters > 0 && (
              <div className="d-flex align-items-center justify-content-between text-muted fs-11 mt-1">
                <span>Prior Received: {priorReceivedMeters.toLocaleString()}m</span>
                <span>This Draft: +{totalMeters.toLocaleString()}m</span>
                <span>Pending Balance: {pendingTrackingMeters.toLocaleString()}m</span>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="d-flex flex-wrap align-items-center justify-content-between fs-12 mb-1.5 gap-2">
              <div className="d-flex align-items-center gap-1.5">
                <span className="text-secondary fw-semibold">Inward Delivery:</span>
                <span className="fw-bold text-success">
                  {approvedPct}% Received ({totalPoReceivedApprovedMeters.toLocaleString()}m / {(targetTrackingMeters > 0 ? targetTrackingMeters : totalPoReceivedApprovedMeters).toLocaleString()}m)
                </span>
                {priorReceivedMeters > 0 && (
                  <span className="badge bg-light text-secondary border fs-10 px-1.5 py-0.5 rounded">
                    {currentGrnApprovedMeters > 0
                      ? `+${currentGrnApprovedMeters.toLocaleString()}m this GRN &bull; ${priorQcApprovedMeters.toLocaleString()}m prior`
                      : `${priorQcApprovedMeters.toLocaleString()}m prior approved (+${totalMeters.toLocaleString()}m in QC)`}
                  </span>
                )}
              </div>
              <div className="d-flex align-items-center gap-1.5">
                <span className="text-secondary fw-semibold">Quality Inspection:</span>
                <span className={`fw-bold ${qcAwaitingInspectionMeters.isAllApproved ? 'text-success' : 'text-warning-emphasis'}`}>
                  <i className={`ti ${qcAwaitingInspectionMeters.isAllApproved ? 'ti-circle-check text-success' : 'ti-clock text-warning'} me-1`}></i>
                  {qcAwaitingInspectionMeters.isAllApproved
                    ? '100% QC Approved (This GRN)'
                    : `QC Pending (${qcAwaitingInspectionMeters.pendingMeters.toLocaleString()}m this GRN)`}
                </span>
                {priorQcApprovedMeters > 0 && (
                  <span className="text-muted fs-11">
                    ({priorQcApprovedMeters.toLocaleString()}m approved previously)
                  </span>
                )}
              </div>
            </div>
            <div className="progress rounded-pill overflow-hidden" style={{ height: '7px', backgroundColor: '#e2e8f0' }}>
              {priorQcApprovedMeters > 0 && (
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${Math.round((priorQcApprovedMeters / targetTrackingMeters) * 100)}%` }}
                  title={`Prior QC Approved: ${priorQcApprovedMeters.toLocaleString()}m`}
                ></div>
              )}
              {currentGrnApprovedMeters > 0 && (
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{
                    width: `${Math.round((currentGrnApprovedMeters / targetTrackingMeters) * 100)}%`,
                    backgroundColor: '#16a34a'
                  }}
                  title={`This GRN QC Approved: ${currentGrnApprovedMeters.toLocaleString()}m`}
                ></div>
              )}
              {qcAwaitingInspectionMeters.pendingMeters > 0 && (
                <div
                  className="progress-bar bg-warning"
                  role="progressbar"
                  style={{ width: `${Math.round((qcAwaitingInspectionMeters.pendingMeters / targetTrackingMeters) * 100)}%` }}
                  title={`QC Pending: ${qcAwaitingInspectionMeters.pendingMeters.toLocaleString()}m`}
                ></div>
              )}
            </div>
            {priorReceivedMeters > 0 && (
              <div className="d-flex align-items-center justify-content-between text-muted fs-11 mt-1">
                <span className="d-flex align-items-center gap-1">
                  <span className="d-inline-block rounded-circle" style={{ width: '7px', height: '7px', backgroundColor: '#10b981' }}></span>
                  Prior Shipments: {priorQcApprovedMeters.toLocaleString()}m (QC Approved)
                </span>
                <span className="d-flex align-items-center gap-1">
                  <span
                    className="d-inline-block rounded-circle"
                    style={{ width: '7px', height: '7px', backgroundColor: currentGrnApprovedMeters > 0 ? '#10b981' : '#f59e0b' }}
                  ></span>
                  This GRN: {totalMeters.toLocaleString()}m ({currentGrnApprovedMeters > 0 ? 'QC Approved' : 'QC Pending'})
                </span>
                <span className="d-flex align-items-center gap-1">
                  <span className="d-inline-block rounded-circle" style={{ width: '7px', height: '7px', backgroundColor: '#cbd5e1' }}></span>
                  Remaining PO Balance: {pendingTrackingMeters.toLocaleString()}m
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Requirement 57: Multi-PO FIFO Delivery Breakdown Card */}
      {fifoAllocations && fifoAllocations.length > 1 && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
          <div className="card-header bg-white border-bottom p-3.5 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bold text-dark mb-0 fs-16">
                  <i className="ti ti-layers-intersect text-primary me-1.5"></i>
                  Consolidated Multi-PO Delivery &amp; FIFO Allocation
                </h5>
                <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill fs-11 fw-semibold">
                  {fifoAllocations.length} POs Linked
                </span>
                <span className="badge bg-info-subtle text-info border border-info border-opacity-25 px-2.5 py-1 rounded-pill fs-11 fw-semibold">
                  <i className="ti ti-clock-check me-1"></i> FIFO Rule Active
                </span>
              </div>
              <div className="text-muted fs-12 mt-1">
                Material is deducted first from the oldest PO. Remaining material is allocated to subsequent POs only after the earlier PO is 100% fulfilled.
              </div>
            </div>
            <div className="text-end">
              <span className="fs-11 text-muted d-block text-uppercase fw-semibold">Delivered in this GRN</span>
              <span className="fs-16 fw-bold text-success">
                +{totalGrnDeliveredMeters.toLocaleString()} m
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 fs-13 text-nowrap">
              <thead className="table-light text-secondary fs-12 text-uppercase fw-bold">
                <tr>
                  <th className="ps-4 py-3">Priority &amp; PO ID</th>
                  <th className="py-3">Order Date</th>
                  <th className="py-3 text-end">Ordered Qty</th>
                  <th className="py-3 text-end">Previously Received</th>
                  <th className="py-3 text-end">Pending Before GRN</th>
                  <th className="py-3 text-end bg-success-subtle text-success fw-bold">
                    Allocated in this GRN
                  </th>
                  <th className="py-3 text-end">Remaining Balance</th>
                  <th className="pe-4 py-3 text-center">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody>
                {fifoAllocations.map((alloc) => (
                  <tr key={alloc.poId} className={alloc.isComplete ? 'bg-light bg-opacity-50' : ''}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className={`badge ${alloc.isFirstOrder ? 'bg-primary text-white' : 'bg-secondary-subtle text-dark border'} rounded-pill fs-11 px-2.5 py-1`}
                        >
                          #{alloc.index} {alloc.isFirstOrder ? '1st Priority (Earliest)' : `${alloc.index}nd Priority`}
                        </span>
                        <strong className="text-primary font-monospace">{alloc.poId}</strong>
                      </div>
                    </td>
                    <td className="py-3 text-muted">{alloc.poDate || '—'}</td>
                    <td className="py-3 text-end fw-semibold text-dark">
                      {alloc.ordered.toLocaleString()} m
                    </td>
                    <td className="py-3 text-end text-muted">
                      {alloc.prevReceived > 0 ? `${alloc.prevReceived.toLocaleString()} m` : '0 m'}
                    </td>
                    <td className="py-3 text-end text-dark">
                      {alloc.pendingBeforeGrn.toLocaleString()} m
                    </td>
                    <td className="py-3 text-end bg-success-subtle text-success fw-bold fs-14">
                      +{alloc.allocatedInThisGrn.toLocaleString()} m
                    </td>
                    <td className="py-3 text-end fw-bold">
                      {alloc.remainingBalance === 0 ? (
                        <span className="badge bg-success-subtle text-success border border-success border-opacity-25 px-2 py-1 rounded-pill">
                          0 m (Nil)
                        </span>
                      ) : (
                        <span className="text-danger fw-bold">{alloc.remainingBalance.toLocaleString()} m</span>
                      )}
                    </td>
                    <td className="pe-4 py-3 text-center">
                      {alloc.isComplete ? (
                        <span className="badge bg-success-subtle text-success border border-success border-opacity-25 px-3 py-1.5 rounded-pill fs-12 fw-semibold d-inline-flex align-items-center gap-1">
                          <i className="ti ti-check fs-13"></i> 100% Completed
                        </span>
                      ) : alloc.isPartial ? (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning border-opacity-25 px-3 py-1.5 rounded-pill fs-12 fw-semibold d-inline-flex align-items-center gap-1">
                          <i className="ti ti-progress fs-13"></i> Partially Received ({alloc.fulfillmentPercent}%)
                        </span>
                      ) : (
                        <span className="badge bg-light text-secondary border px-3 py-1.5 rounded-pill fs-12 fw-medium">
                          Pending (0%)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light fw-bold fs-13">
                <tr>
                  <td colSpan={2} className="ps-4 py-3 text-dark">Total Consolidated Summary:</td>
                  <td className="py-3 text-end text-dark">
                    {fifoAllocations.reduce((s, a) => s + a.ordered, 0).toLocaleString()} m
                  </td>
                  <td className="py-3 text-end text-muted">
                    {fifoAllocations.reduce((s, a) => s + a.prevReceived, 0).toLocaleString()} m
                  </td>
                  <td className="py-3 text-end text-dark">
                    {fifoAllocations.reduce((s, a) => s + a.pendingBeforeGrn, 0).toLocaleString()} m
                  </td>
                  <td className="py-3 text-end bg-success-subtle text-success fs-14">
                    +{fifoAllocations.reduce((s, a) => s + a.allocatedInThisGrn, 0).toLocaleString()} m
                  </td>
                  <td className="py-3 text-end text-dark">
                    {fifoAllocations.reduce((s, a) => s + a.remainingBalance, 0).toLocaleString()} m
                  </td>
                  <td className="pe-4 py-3 text-center text-muted fs-12">
                    {fifoAllocations.filter(a => a.isComplete).length} of {fifoAllocations.length} POs 100% Completed
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* CARD 2: Bale-wise breakdown */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
        <div className="card-header bg-white border-bottom p-3.5 d-flex align-items-center justify-content-between">
          <h5 className="fw-bold text-dark mb-0 fs-16">Bale-wise breakdown</h5>
          {canEditBales ? (
            <button
              type="button"
              className="btn btn-sm btn-link text-primary p-0 text-decoration-none fs-12 fw-semibold d-inline-flex align-items-center gap-1"
              onClick={() => {
                if (onEditGRN) onEditGRN(grn);
                else if (onEditBales) onEditBales(grn);
              }}
            >
              <i className="ti ti-edit fs-13"></i>
              <span>Edit Bale Entries</span>
            </button>
          ) : (
            <span className="badge bg-light text-secondary border px-3 py-1.5 fs-12 rounded-3 d-inline-flex align-items-center gap-1.5">
              <i className="ti ti-lock fs-13 text-muted"></i>
              <span>Locked (Submitted to QC &mdash; Non-editable)</span>
            </span>
          )}
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-secondary fs-12 text-uppercase fw-bold">
              <tr>
                <th className="ps-4 py-3" style={{ minWidth: '100px' }}>BALE NO.</th>
                <th className="py-3" style={{ minWidth: '220px' }}>FABRIC ITEM</th>
                <th className="py-3 text-center" style={{ minWidth: '90px' }}>PIECES</th>
                <th className="py-3 text-end" style={{ minWidth: '120px' }}>METERS</th>
                <th className="py-3 text-center" style={{ minWidth: '120px' }}>QC STATUS</th>
                <th className="pe-4 py-3 text-end" style={{ minWidth: '110px' }}>LOCK STATUS</th>
              </tr>
            </thead>
            <tbody>
              {bales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No bales entered yet.
                  </td>
                </tr>
              ) : (
                bales.map((bale, idx) => {
                  const bNo = bale.baleNo || `Bale ${idx + 1}`;
                  const fabricLabel = bale.fabricItemLabel || bale.fabric || grn.fabricName || 'Grey Cotton Rayon';
                  const piecesArr = Array.isArray(bale.pieces) ? bale.pieces : [];
                  const pcsCount = piecesArr.length > 0
                    ? piecesArr.length
                    : (Number(bale.piecesCount) || 0);
                  const bMeters = piecesArr.length > 0
                    ? piecesArr.reduce((s, p) => s + (Number(typeof p === 'object' ? p?.length : p) || 0), 0)
                    : (Number(bale.totalLength) || 0);
                  const isQcLocked = isQcStarted || bale.qcStatus === 'Approved' || bale.qcStatus === 'OK';

                  return (
                    <tr key={idx}>
                      <td className="ps-4 py-3 fw-bold text-dark">{bNo}</td>
                      <td className="py-3 text-secondary">{fabricLabel}</td>
                      <td className="py-3 text-center">{pcsCount}</td>
                      <td className="py-3 text-end fw-semibold text-dark">{Number(bMeters).toFixed(1)}m</td>
                      <td className="py-3 text-center">
                        <span
                          className={`badge rounded-pill px-2.5 py-1 fs-11 ${
                            isQcLocked
                              ? 'bg-success-subtle text-success border border-success border-opacity-25'
                              : isDraftGRN
                              ? 'bg-light text-secondary border'
                              : 'bg-primary-subtle text-primary border border-primary border-opacity-25'
                          }`}
                        >
                          {bale.qcStatus || (isQcLocked ? 'QC Approved' : isDraftGRN ? 'Draft Entry' : 'Pending QC')}
                        </span>
                      </td>
                      <td className="pe-4 py-3 text-end">
                        <span
                          className={`badge rounded-pill px-2.5 py-1 fs-11 ${
                            isQcLocked
                              ? 'bg-secondary-subtle text-secondary border border-secondary border-opacity-25'
                              : 'bg-info-subtle text-info border border-info border-opacity-25'
                          }`}
                        >
                          <i className={`ti ${isQcLocked ? 'ti-lock' : 'ti-pencil'} me-1 fs-10`}></i>
                          {isQcLocked ? 'Locked (Submitted to QC)' : 'Editable'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: QUALITY CHECK BY ITEM (Only for Active / Received GRNs, NOT Drafts) */}
      {!isDraftGRN && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
          <div className="d-flex align-items-center gap-2">
            <h5 className="fw-bold text-dark mb-0 fs-16">Quality check by item</h5>
            {qcInspectionBatches.length > 1 && (
              <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 px-2.5 py-1 fs-11 rounded-pill fw-semibold">
                {qcInspectionBatches.length} Fabric Qualities
              </span>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            <span
              className={`badge px-2.5 py-1 fs-11 rounded-pill ${
                qcAwaitingInspectionMeters.isAllApproved
                  ? 'bg-success-subtle text-success border border-success border-opacity-25'
                  : qcAwaitingInspectionMeters.isPartiallyDone
                  ? 'bg-info-subtle text-info border border-info border-opacity-25'
                  : 'bg-warning-subtle text-warning-emphasis border border-warning border-opacity-50'
              }`}
            >
              <i className={`ti ${qcAwaitingInspectionMeters.isAllApproved ? 'ti-check' : 'ti-clock'} me-1`}></i>
              {qcAwaitingInspectionMeters.isAllApproved
                ? 'QC Approved (100%)'
                : qcAwaitingInspectionMeters.isPartiallyDone
                ? 'QC In Progress'
                : `QC Pending (${qcAwaitingInspectionMeters.pendingMeters.toLocaleString()}m)`}
            </span>
          </div>
        </div>

        <div className="d-flex flex-column gap-3">
          {qcInspectionBatches.map((item, idx) => {
            const isItemQcDone = item.qcStatus === 'OK' || item.qcStatus === 'Approved' || item.qcStatus === 'Partial OK';
            const isItemReject = item.qcStatus === 'Reject' || item.qcStatus === 'Rejected';
            const isItemAdmin = item.qcStatus === 'Send for Admin Approval' || item.qcStatus === 'Pending Admin Approval' || item.qcStatus === 'Admin Approval';

            return (
              <div
                key={item.id || idx}
                className="border rounded-4 p-3.5 d-flex flex-wrap align-items-center justify-content-between gap-3 bg-white"
                style={{
                  borderColor: !isBaleEntriesComplete && !isQcStarted ? '#fde68a' : '#e2e8f0',
                  cursor: !isBaleEntriesComplete && !isQcStarted ? 'not-allowed' : 'pointer',
                  backgroundColor: !isBaleEntriesComplete && !isQcStarted ? '#fffdf0' : '#ffffff',
                  transition: 'all 0.15s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  if (isBaleEntriesComplete || isQcStarted) {
                    e.currentTarget.style.borderColor = '#5b47fb';
                    e.currentTarget.style.backgroundColor = '#faf9ff';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(91, 71, 251, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = !isBaleEntriesComplete && !isQcStarted ? '#fde68a' : '#e2e8f0';
                  e.currentTarget.style.backgroundColor = !isBaleEntriesComplete && !isQcStarted ? '#fffdf0' : '#ffffff';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => {
                  if (!isQcSubmitted && !isQcStarted) {
                    alert(`QC inspection is locked: GRN ${grn.id} has not yet been submitted for QC. Please click "Submit GRN & Send to QC" in the GRN form first.`);
                    return;
                  }
                  if (!isBaleEntriesComplete && !isQcStarted) {
                    alert(`QC cannot proceed: Total quantity entered in GRN (${declaredTotalQty}m) has incomplete bale entries (${baleMetersEntered}m). Please complete all bale entries in GRN first.`);
                    return;
                  }
                  if (onSelectQCItem) {
                    onSelectQCItem(item.qcRecord);
                  }
                }}
                title={!isBaleEntriesComplete && !isQcStarted ? baleIncompleteReason : `Click anywhere on this card to run quality check for ${item.fabricName}`}
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 p-2.5 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      backgroundColor: isItemQcDone ? '#dcfce7' : isItemReject ? '#fee2e2' : '#e0e7ff',
                      color: isItemQcDone ? '#15803d' : isItemReject ? '#b91c1c' : '#4338ca'
                    }}
                  >
                    <i className={`ti ${isItemQcDone ? 'ti-check' : isItemReject ? 'ti-x' : 'ti-checklist'} fs-22`}></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark fs-15 mb-0.5 d-flex align-items-center gap-2 flex-wrap">
                      <span>{item.fabricName} · {String(item.expectedWidth).replace(/"/g, '')}&quot;</span>
                      {qcInspectionBatches.length > 1 && (
                        <span className="badge bg-light text-secondary border px-2 py-0.5 fs-11 rounded-pill">
                          Item {idx + 1}
                        </span>
                      )}
                    </div>
                    <div className="text-secondary fs-13 mb-1">
                      Received: <strong>{Number(item.totalReceivedMeters || item.receivedQty || 0).toLocaleString()}m</strong> · Expected width {String(item.expectedWidth).replace(/"/g, '')}&quot;, expected fold {String(item.expectedFold).replace(/%/g, '')}%
                    </div>
                    <div className="d-inline-flex align-items-center gap-1.5 fs-13 text-secondary">
                      <i className="ti ti-sparkles fs-15" style={{ color: '#5b47fb' }}></i>
                      <span>
                        {isItemQcDone
                          ? 'QC Inspection Completed'
                          : isItemReject
                          ? 'QC Inspection Rejected'
                          : isItemAdmin
                          ? 'Submitted for Admin Approval'
                          : (!isBaleEntriesComplete && !isQcStarted ? `Awaiting complete bale entries (${baleMetersEntered}m of ${declaredTotalQty}m)` : 'Awaiting quality check')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <span
                    className={`badge rounded-pill px-3 py-1.5 fs-12 fw-semibold ${
                      isItemQcDone
                        ? 'bg-success-subtle text-success border border-success border-opacity-25'
                        : (!isBaleEntriesComplete && !isQcStarted)
                        ? 'bg-warning-subtle text-dark border border-warning border-opacity-50'
                        : isItemReject
                        ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                        : isItemAdmin
                        ? 'bg-warning-subtle text-warning-emphasis border border-warning'
                        : 'bg-warning-subtle text-warning-emphasis border border-warning border-opacity-50'
                    }`}
                  >
                    {!isBaleEntriesComplete && !isQcStarted ? 'Incomplete Bales' : (item.qcStatus || (grn.status === 'QC Approved' ? 'Approved' : 'QC Pending'))}
                  </span>
                  <button
                    type="button"
                    className={`btn btn-sm rounded-3 px-3 py-1.5 fs-12 fw-semibold shadow-2xs d-inline-flex align-items-center gap-1.5 text-white ${!isBaleEntriesComplete && !isQcStarted ? 'btn-secondary opacity-75' : 'btn-primary'}`}
                    style={{
                      backgroundColor: !isBaleEntriesComplete && !isQcStarted ? '#6b7280' : '#5b47fb',
                      borderColor: !isBaleEntriesComplete && !isQcStarted ? '#6b7280' : '#5b47fb'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isBaleEntriesComplete && !isQcStarted) {
                        alert(`QC cannot proceed: Total quantity entered in GRN (${declaredTotalQty}m) has incomplete bale entries (${baleMetersEntered}m). Please complete all bale entries in GRN first.`);
                        return;
                      }
                      if (onSelectQCItem) {
                        onSelectQCItem(item.qcRecord);
                      }
                    }}
                    title={!isBaleEntriesComplete && !isQcStarted ? baleIncompleteReason : `Inspect ${item.fabricName}`}
                  >
                    <span>{isItemQcDone ? 'View QC' : (!isBaleEntriesComplete && !isQcStarted ? 'Run Inspection (Bales Incomplete)' : 'Run Inspection')}</span>
                    <i className="ti ti-arrow-right fs-13"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* BOTTOM ACTION BUTTONS (Matches PO Detail Image 2) */}
      <div className="d-flex flex-wrap align-items-center gap-3 pt-2 mb-5">
        <button
          type="button"
          className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2 fw-semibold fs-13 text-white shadow-sm"
          style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb', borderRadius: '8px', height: '42px' }}
          onClick={() => {
            if (onEditGRN) onEditGRN(grn);
            else if (onEditBales) onEditBales(grn);
          }}
        >
          <i className="ti ti-edit fs-15"></i>
          <span>{isDraftGRN ? 'Resume / Edit Draft GRN' : 'Edit Record'}</span>
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-4 py-2 fw-medium fs-13 shadow-sm bg-white"
          style={{ borderColor: '#cbd5e1', borderRadius: '8px', height: '42px' }}
          onClick={onBack}
        >
          <i className="ti ti-arrow-left fs-15"></i>
          <span>Back to GRN Register</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* EDIT HEADER MODAL (Matches User Image 2 with all 10 Receipt-level fields) */}
      {/* ========================================================================= */}
      {canEditHeader && showEditHeaderModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden bg-white" style={{ border: '1px solid #e2e8f0' }}>
              <form onSubmit={handleSaveHeader}>
                {/* Modal Header */}
                <div className="modal-header border-0 pb-1 pt-3.5 px-4 d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="modal-title fw-bold text-dark fs-17 mb-0" style={{ letterSpacing: '-0.2px' }}>
                      Edit {grn.id} header
                    </h5>
                    <div className="text-secondary fs-11 mt-0.5" style={{ lineHeight: '1.4' }}>
                      Bale/piece quantities are locked — only receipt-level fields can change here.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close fs-12 text-muted"
                    onClick={() => setShowEditHeaderModal(false)}
                    aria-label="Close"
                  ></button>
                </div>

                {/* Modal Body with 10 fields */}
                <div className="modal-body px-4 py-2.5">
                  <div className="p-2 mb-2 rounded-2 bg-light border d-flex align-items-center justify-content-between">
                    <span className="text-secondary fs-12 fw-medium">Vendor:</span>
                    <span className="text-dark fs-12 fw-bold">{vendorDisplayName}</span>
                  </div>
                  <div className="row g-2.5">
                    {/* 1. Vendor challan no. */}
                    <div className="col-12 col-sm-7">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Vendor challan no.</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.challan}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, challan: e.target.value })}
                        placeholder=""
                      />
                    </div>

                    {/* 2. Challan date */}
                    <div className="col-12 col-sm-5">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Challan date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.challanDate}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, challanDate: e.target.value })}
                      />
                    </div>

                    {/* 3. Vendor invoice no. */}
                    <div className="col-12 col-sm-7">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Vendor invoice no.</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.invoice}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, invoice: e.target.value })}
                        placeholder=""
                      />
                    </div>

                    {/* 4. Invoice date */}
                    <div className="col-12 col-sm-5">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Invoice date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.invoiceDate}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, invoiceDate: e.target.value })}
                      />
                    </div>


                    {/* 6. Transporter */}
                    <div className="col-12 col-sm-7">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Transporter</label>
                      <select
                        className="form-select form-select-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.transporter}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, transporter: e.target.value })}
                      >
                        <option value="">Select Transporter...</option>
                        {allTransporterNames.map((name, idx) => (
                          <option key={idx} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 7. LR no. */}
                    <div className="col-12 col-sm-5">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">LR no.</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.lrNumber}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, lrNumber: e.target.value })}
                        placeholder=""
                      />
                    </div>

                    {/* 8. LR date */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">LR date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.lrDate}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, lrDate: e.target.value })}
                      />
                    </div>

                    {/* 9. Weight (kg) */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Weight (kg)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.weightKg}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, weightKg: e.target.value })}
                        placeholder=""
                      />
                    </div>

                    {/* 10. Total quantity (m) */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Total quantity (m)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.totalQty}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, totalQty: e.target.value.replace(/[^0-9.]/g, '') })}
                        placeholder="e.g. 500"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer with Theme Buttons */}
                <div className="modal-footer border-0 pt-2 pb-3.5 px-4 d-flex align-items-center justify-content-start gap-2">
                  <button
                    type="submit"
                    className="btn btn-sm px-4 py-1.5 rounded-3 fs-13 text-white fw-semibold shadow-sm d-inline-flex align-items-center gap-1.5"
                    style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                  >
                    <i className="ti ti-check fs-14"></i>
                    <span>Save Changes</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3.5 py-1.5 rounded-3 fs-13 fw-medium bg-white"
                    style={{ borderColor: '#cbd5e1', color: '#475569' }}
                    onClick={() => setShowEditHeaderModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
