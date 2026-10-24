import React, { useState, useEffect, useRef } from 'react';
import TransporterMasterView from './TransporterMasterView';

/**
 * GRNForm - Goods Receipt Note (GRN) Module
 * Features:
 *   - Section 1: Receipt details
 *       * Source document (Purchase Order selector)
 *       * Received date
 *       * Vendor challan no. & date (optional)
 *       * Vendor invoice no. & date (optional)
 *       * Transporter selector with inline "+ New" modal
 *       * LR no. & LR date
 *       * Weight (kg), Total qty (m), No. of bales
 *       * "Generate Bales" and "Save This Section" buttons
 *       (Invoice value and Fabric folding omitted as instructed)
 *   - Section 2: Bale-wise inward entry
 *       * Empty state prompt when no bales generated
 *       * Individual Bale cards with Bale no., PO fabric item dropdown, No. of pieces
 *       * Dynamic piece meter inputs (Pc 1, Pc 2, ...) with live sum
 *       * Summary verification bar: Entered total vs Declared total (live match status)
 *   - Section 3: Bottom action buttons
 *       * Save Progress (Finish Later)
 *       * Submit GRN & Send to QC
 *       * Cancel (clears all fields and exits back to GRN list)
 */
export default function GRNForm({
  grn,
  purchaseOrders = [],
  vendors = [],
  fabrics = [],
  transporters = [],
  qualityChecks = [],
  grns = [],
  onBack,
  onSaveGRN,
  onSaveTransporter
}) {
  const isExisting = Boolean(
    grn &&
    grn.id &&
    !grn.isNew &&
    (grns || []).some((g) => g && g.id === grn.id)
  );

  const getPoVendorName = (po) => {
    if (!po) return '';
    if (po.vendorName && po.vendorName.trim()) return po.vendorName;
    const found = vendors.find((v) => v.id === po.vendorId);
    return found ? found.name : (po.vendorId || '');
  };

  // Find eligible POs (exclude POs that already have an existing GRN, unless editing the current GRN)
  const eligiblePOs = (purchaseOrders || []).filter((p) => {
    if (!p) return false;
    const isCurrentPo = Boolean(grn && (grn.poId === p.id || (grn.linkedPOs && grn.linkedPOs.includes(p.id))));
    if (isCurrentPo) return true;
    const hasExistingGrn = (grns || []).some(
      (g) => g && g.id !== grn?.id && (
        (g.linkedPOs && g.linkedPOs.includes(p.id)) ||
        g.poId === p.id ||
        g.poNumber === p.id ||
        g.againstPo === p.id
      )
    );
    const poAlreadyReceived = p.status === 'Completed' || p.status === 'Partially Received' || Number(p.receivedQty) > 0;
    return !hasExistingGrn && !poAlreadyReceived && p.status !== 'Draft' && p.status !== 'Cancelled';
  });

  // Initialize form state
  const [formData, setFormData] = useState(() => {
    const isFromPO = Boolean(grn?.poId || (grn?.linkedPOs && grn.linkedPOs.length > 0));
    const defaultPO = isFromPO
      ? eligiblePOs.find((p) => p.id === grn.poId || (grn.linkedPOs && grn.linkedPOs.includes(p.id)))
      : null;

    const resolvedPoId = defaultPO ? defaultPO.id : (grn?.poId || grn?.linkedPOs?.[0] || '');
    const resolvedVendorId = defaultPO ? defaultPO.vendorId : (grn?.vendorId || '');
    const resolvedVendorName = grn?.vendorName || (defaultPO ? getPoVendorName(defaultPO) : '');

    const defaultDeclared = (grn && grn.totalQty !== undefined && grn.totalQty !== '')
      ? grn.totalQty
      : (grn?.declaredTotalMeters ? grn.declaredTotalMeters : '');

    const cleanDate = (d) => {
      if (!d) return new Date().toISOString().split('T')[0];
      return typeof d === 'string' && d.includes('T') ? d.split('T')[0] : String(d);
    };

    // Helper to normalize and auto-fill bales up to target count
    const targetBaleCount = Math.max(0, parseInt(grn?.totalBales || grn?.numBales || 0, 10));
    let initialBales = [];
    if (grn?.bales && grn.bales.length > 0) {
      initialBales = grn.bales.map((b, idx) => {
        const rawPieces = b.pieces || [];
        const normPieces = rawPieces.map((p, pIdx) => {
          if (typeof p === 'object' && p !== null) {
            return {
              pieceNo: p.pieceNo || `Pc ${pIdx + 1}`,
              length: p.length !== undefined && p.length !== null ? p.length : ''
            };
          }
          return {
            pieceNo: `Pc ${pIdx + 1}`,
            length: p !== undefined && p !== null ? p : ''
          };
        });

        const piecesCount = b.piecesCount !== undefined && b.piecesCount !== '' && b.piecesCount !== null
          ? String(b.piecesCount)
          : (normPieces.length > 0 ? String(normPieces.length) : '');
        const totalLength = Number(b.totalLength) || normPieces.reduce((s, p) => s + (Number(p.length) || 0), 0);

        return {
          baleNo: b.baleNo !== undefined ? String(b.baleNo) : String(idx + 1),
          itemIdx: b.itemIdx !== undefined ? Number(b.itemIdx) : 0,
          fabricItemLabel: b.fabricItemLabel || b.fabric || b.fabricName || '',
          piecesCount,
          totalLength,
          pieces: normPieces
        };
      });
    }

    // Auto-fill remaining bales up to targetBaleCount
    if (targetBaleCount > initialBales.length) {
      for (let i = initialBales.length; i < targetBaleCount; i++) {
        initialBales.push({
          baleNo: String(i + 1),
          itemIdx: 0,
          fabricItemLabel: '',
          piecesCount: '',
          pieces: [],
          totalLength: 0
        });
      }
    }

    return {
      id: grn?.id || `GRN-${String(Math.floor(1000 + Math.random() * 9000))}`,
      poId: resolvedPoId,
      linkedPOs: grn?.linkedPOs || (resolvedPoId ? [resolvedPoId] : []),
      vendorId: resolvedVendorId,
      vendorName: resolvedVendorName,
      receivedDate: cleanDate(grn?.receivedDate || grn?.date),
      vendorChallanNo: grn?.vendorChallanNo || grn?.challan || '',
      vendorChallanDate: grn?.vendorChallanDate ? cleanDate(grn.vendorChallanDate) : '',
      vendorInvoiceNo: grn?.vendorInvoiceNo || grn?.invoice || '',
      vendorInvoiceDate: grn?.vendorInvoiceDate ? cleanDate(grn.vendorInvoiceDate) : '',
      transporterId: grn?.transporterId || '',
      transporterName: grn?.transporterName || '',
      lrNo: grn?.lrNo || grn?.lrNumber || '',
      lrNumber: grn?.lrNumber || grn?.lrNo || '',
      lrDate: grn?.lrDate ? cleanDate(grn.lrDate) : '',
      weight: grn?.weight !== undefined ? grn.weight : '',
      totalQty: defaultDeclared ? String(defaultDeclared) : '',
      declaredTotalMeters: defaultDeclared ? Number(defaultDeclared) : 0,
      totalBales: grn?.totalBales || grn?.numBales || (initialBales.length > 0 ? String(initialBales.length) : ''),
      status: grn?.status || 'Bale Entry in Progress',
      bales: initialBales
    };
  });

  const [showInlineTransporterModal, setShowInlineTransporterModal] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  // Receipt details edit/view state toggle (Image 1 vs Image 2)
  const [isHeaderEditing, setIsHeaderEditing] = useState(() => {
    // When creating a new GRN (e.g. from + GRN on PO), always open Section 1 in Edit mode
    if (!isExisting || grn?.isNew || grn?.isHeaderSaved === false) {
      return true;
    }
    // Only show read-only summary card if header has actually been saved
    if (grn?.isHeaderSaved === true || grn?.status === 'Header Saved' || (isExisting && (grn?.status === 'Completed' || (grn?.bales && grn.bales.length > 0)))) {
      return false;
    }
    return true;
  });

  const showToast = (message, type = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 3200);
  };

  // Track last synced GRN id to prevent overwriting user's active edits on re-render
  const lastGrnIdRef = useRef(grn?.id || null);

  // Sync if grn prop changes
  useEffect(() => {
    if (grn && grn.id) {
      if (lastGrnIdRef.current !== grn.id) {
        lastGrnIdRef.current = grn.id;
        const matchedPO = purchaseOrders.find((p) => p.id === grn.poId || (grn.linkedPOs && grn.linkedPOs.includes(p.id)));
        const vName = grn.vendorName || (matchedPO ? getPoVendorName(matchedPO) : '');

        const cleanDate = (d) => {
          if (!d) return '';
          return typeof d === 'string' && d.includes('T') ? d.split('T')[0] : String(d);
        };

        const targetBaleCount = Math.max(0, parseInt(grn.totalBales || grn.numBales || 0, 10));
        let initialBales = [];
        if (grn.bales && grn.bales.length > 0) {
          initialBales = grn.bales.map((b, idx) => {
            const rawPieces = b.pieces || [];
            const normPieces = rawPieces.map((p, pIdx) => {
              if (typeof p === 'object' && p !== null) {
                return {
                  pieceNo: p.pieceNo || `Pc ${pIdx + 1}`,
                  length: p.length !== undefined && p.length !== null ? p.length : ''
                };
              }
              return {
                pieceNo: `Pc ${pIdx + 1}`,
                length: p !== undefined && p !== null ? p : ''
              };
            });

            const piecesCount = b.piecesCount !== undefined && b.piecesCount !== '' && b.piecesCount !== null
              ? String(b.piecesCount)
              : (normPieces.length > 0 ? String(normPieces.length) : '');
            const totalLength = Number(b.totalLength) || normPieces.reduce((s, p) => s + (Number(p.length) || 0), 0);

            return {
              baleNo: b.baleNo !== undefined ? String(b.baleNo) : String(idx + 1),
              itemIdx: b.itemIdx !== undefined ? Number(b.itemIdx) : 0,
              fabricItemLabel: b.fabricItemLabel || b.fabric || b.fabricName || '',
              piecesCount,
              totalLength,
              pieces: normPieces
            };
          });
        }

        // Auto-fill remaining bales up to targetBaleCount
        if (targetBaleCount > initialBales.length) {
          for (let i = initialBales.length; i < targetBaleCount; i++) {
            initialBales.push({
              baleNo: String(i + 1),
              itemIdx: 0,
              fabricItemLabel: '',
              piecesCount: '',
              pieces: [],
              totalLength: 0
            });
          }
        }

        setFormData((prev) => ({
          ...prev,
          id: grn.id,
          poId: matchedPO ? matchedPO.id : (grn.poId || prev.poId),
          linkedPOs: grn.linkedPOs || (matchedPO ? [matchedPO.id] : prev.linkedPOs),
          vendorId: grn.vendorId || (matchedPO ? matchedPO.vendorId : prev.vendorId),
          vendorName: vName || prev.vendorName,
          receivedDate: cleanDate(grn.receivedDate || grn.date) || prev.receivedDate,
          vendorChallanNo: grn.vendorChallanNo || grn.challan || prev.vendorChallanNo,
          vendorChallanDate: cleanDate(grn.vendorChallanDate) || prev.vendorChallanDate,
          vendorInvoiceNo: grn.vendorInvoiceNo || grn.invoice || prev.vendorInvoiceNo,
          vendorInvoiceDate: cleanDate(grn.vendorInvoiceDate) || prev.vendorInvoiceDate,
          transporterId: grn.transporterId || prev.transporterId,
          transporterName: grn.transporterName || prev.transporterName,
          lrNo: grn.lrNo || grn.lrNumber || prev.lrNo || '',
          lrNumber: grn.lrNumber || grn.lrNo || prev.lrNumber || '',
          lrDate: cleanDate(grn.lrDate) || prev.lrDate,
          weight: grn.weight !== undefined ? grn.weight : prev.weight,
          totalQty: (grn && grn.totalQty !== undefined && grn.totalQty !== '')
            ? String(grn.totalQty)
            : (grn?.declaredTotalMeters ? String(grn.declaredTotalMeters) : (prev.totalQty || '')),
          declaredTotalMeters: Number(grn?.totalQty || grn?.declaredTotalMeters || prev.declaredTotalMeters || 0),
          totalBales: grn.totalBales || grn.numBales || (initialBales.length > 0 ? String(initialBales.length) : prev.totalBales),
          status: grn.status || prev.status,
          bales: initialBales.length > 0 ? initialBales : prev.bales
        }));

        const isHeaderActuallySaved = Boolean(
          isExisting &&
          !grn.isNew &&
          (grn.isHeaderSaved === true || grn.status === 'Header Saved' || (grn.status === 'Completed' || (grn.bales && grn.bales.length > 0)))
        );
        if (isHeaderActuallySaved) {
          setIsHeaderEditing(false);
        } else {
          setIsHeaderEditing(true);
        }
      }
    }
  }, [grn, purchaseOrders]);

  // Link to Quality Check and verify if QC has started or taken action (Requirement 21)
  const linkedQC = (qualityChecks || []).find((q) => q.grnRef === formData.id);
  const isQcActioned = Boolean(
    formData.isQcActioned ||
    (linkedQC && (linkedQC.qcStatus === 'Passed' || linkedQC.qcStatus === 'QC Approved' || linkedQC.qcStatus === 'Approved')) ||
    (linkedQC && linkedQC.qcStatus && linkedQC.qcStatus !== 'Pending' && linkedQC.qcStatus !== 'Awaiting QC') ||
    (linkedQC && (linkedQC.startedAt || linkedQC.isStarted || linkedQC.actualWidth || linkedQC.actualFold || (linkedQC.inspectedPieces && linkedQC.inspectedPieces.length > 0))) ||
    formData.status === 'QC Approved' ||
    formData.status === 'QC Rejected' ||
    formData.status === 'QC Passed' ||
    formData.status === 'Passed' ||
    formData.status === 'Completed' ||
    formData.status === 'Pending Admin Approval' ||
    (formData.status && formData.status.includes('QC'))
  );
  const isLinkedFromPO = Boolean(grn && ((grn.linkedPOs && grn.linkedPOs.length > 0) || grn.poId));

  // Visual save feedback per bale
  const [savedBaleMap, setSavedBaleMap] = useState({});

  // Current active PO
  const currentPO = purchaseOrders.find((p) => p.id === formData.poId) || (isLinkedFromPO ? purchaseOrders.find((p) => p.id === grn?.poId || (grn?.linkedPOs && grn.linkedPOs.includes(p.id))) : null) || null;

  // Ordered meters on PO (for display in Total qty label)
  const poOrderedMeters = currentPO && currentPO.items && currentPO.items.length > 0
    ? currentPO.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
    : Number(grn?.poOrderedMeters || 0);

  // Existing previous GRNs for this PO (excluding current GRN being edited)
  const previousGrnsForPo = (grns || []).filter(
    (g) => g && g.id !== formData.id && ((g.linkedPOs && g.linkedPOs.includes(formData.poId)) || g.poId === formData.poId)
  );
  const alreadyReceivedMeters = previousGrnsForPo.reduce(
    (sum, g) => sum + (Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0),
    0
  );
  const poPendingMeters = Math.max(0, poOrderedMeters - alreadyReceivedMeters);

  // Build PO item options for bales
  const getPoItemLabel = (item) => {
    if (!item) return 'Fabric Item';
    const name = item.fabricName || item.fabricQuality || 'Fabric';
    const width = item.width ? ` (${item.width}")` : '';
    const color = item.colorName ? ` — ${item.colorName}` : '';
    return `${name}${width}${color}`;
  };

  const poItems = currentPO && currentPO.items && currentPO.items.length > 0 ? currentPO.items : [];
  const poItemLabels = poItems.map((it) => getPoItemLabel(it));

  // Build master fabric options (Cotton, Rayon, Silk, Georgette, etc.)
  const masterFabricLabels = [];
  (fabrics || []).forEach((f) => {
    if (!f) return;
    const qName = f.qualityName || f.name || f.fabricName || '';
    if (!qName) return;
    if (Array.isArray(f.widths) && f.widths.length > 0) {
      f.widths.forEach((w) => {
        const lbl = `${qName} (${w}")`;
        if (!masterFabricLabels.includes(lbl)) {
          masterFabricLabels.push(lbl);
        }
      });
    } else {
      if (!masterFabricLabels.includes(qName)) {
        masterFabricLabels.push(qName);
      }
    }
  });

  const defaultFabricLabel = poItemLabels[0] || masterFabricLabels[0] || 'Fabric';

  // When PO is changed in Source document dropdown
  const handlePOChange = (newPoId) => {
    if (!newPoId) {
      setFormData((prev) => ({
        ...prev,
        poId: '',
        linkedPOs: [],
        vendorId: '',
        vendorName: '',
        totalQty: '',
        declaredTotalMeters: 0
      }));
      return;
    }

    const selectedPO = purchaseOrders.find((p) => p.id === newPoId);
    if (!selectedPO) return;

    const vName = getPoVendorName(selectedPO);
    const poTotalMeters = (selectedPO.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);

    setFormData((prev) => {
      // If bales exist, keep their assignments or update default
      const updatedBales = (prev.bales || []).map((b) => {
        const item = selectedPO.items && selectedPO.items[0];
        return {
          ...b,
          itemIdx: 0,
          fabricItemLabel: b.fabricItemLabel || (item ? getPoItemLabel(item) : defaultFabricLabel)
        };
      });

      return {
        ...prev,
        poId: newPoId,
        linkedPOs: [newPoId],
        vendorId: selectedPO.vendorId,
        vendorName: vName,
        totalQty: '',
        declaredTotalMeters: 0,
        bales: updatedBales
      };
    });
  };

  // Handle No. of bales input change (only updates count, does NOT auto-generate bales)
  const handleBaleCountChange = (val) => {
    setFormData((prev) => ({
      ...prev,
      totalBales: val
    }));
  };

  // Generate Bales action
  const handleGenerateBales = () => {
    const count = Math.max(0, parseInt(formData.totalBales, 10) || 0);
    if (count <= 0) {
      showToast('Please enter a valid number of bales (greater than 0).', 'warning');
      return;
    }

    const currentBales = formData.bales || [];
    const newBales = [];

    for (let i = 0; i < count; i++) {
      if (currentBales[i]) {
        newBales.push(currentBales[i]);
      } else {
        const assignedLabel = (poItemLabels.length > 0 ? (poItemLabels[i % poItemLabels.length] || poItemLabels[0]) : defaultFabricLabel);
        newBales.push({
          baleNo: String(i + 1),
          itemIdx: i % (poItemLabels.length || 1),
          fabricItemLabel: assignedLabel,
          piecesCount: '',
          pieces: [],
          totalLength: 0
        });
      }
    }

    setFormData((prev) => ({
      ...prev,
      totalBales: String(count),
      bales: newBales
    }));
  };

  // Handle Bale removal
  const handleRemoveBale = (baleIdx) => {
    setFormData((prev) => {
      const updated = prev.bales.filter((_, idx) => idx !== baleIdx);
      return {
        ...prev,
        totalBales: String(updated.length),
        bales: updated
      };
    });
  };

  // Handle Bale Number change
  const handleBaleNoChange = (baleIdx, val) => {
    setFormData((prev) => {
      const updated = [...prev.bales];
      updated[baleIdx] = {
        ...updated[baleIdx],
        baleNo: val
      };
      return { ...prev, bales: updated };
    });
  };

  // Handle Bale Fabric Selection change (Supports PO items + all master fabrics like Cotton, Rayon, Silk)
  const handleBaleFabricChange = (baleIdx, newFabricLabel) => {
    setFormData((prev) => {
      const updated = [...prev.bales];
      updated[baleIdx] = {
        ...updated[baleIdx],
        fabricItemLabel: newFabricLabel,
        fabricName: newFabricLabel
      };
      return { ...prev, bales: updated };
    });
  };

  // Set number of pieces inside a bale
  const handleSetPieceCount = (baleIdx, newCount) => {
    const count = Math.max(0, parseInt(newCount, 10) || 0);

    setFormData((prev) => {
      const updatedBales = [...prev.bales];
      const targetBale = { ...updatedBales[baleIdx] };
      const curPieces = targetBale.pieces || [];
      const nextPieces = [];

      for (let p = 0; p < count; p++) {
        if (curPieces[p]) {
          nextPieces.push(curPieces[p]);
        } else {
          nextPieces.push({
            pieceNo: `Pc ${p + 1}`,
            length: ''
          });
        }
      }

      targetBale.piecesCount = newCount;
      targetBale.pieces = nextPieces;
      targetBale.totalLength = nextPieces.reduce((sum, it) => sum + (Number(it.length) || 0), 0);
      updatedBales[baleIdx] = targetBale;

      return { ...prev, bales: updatedBales };
    });
  };

  // Piece meter input change
  const handlePieceMeterChange = (baleIdx, pieceIdx, val) => {
    setFormData((prev) => {
      const updatedBales = [...prev.bales];
      const targetBale = { ...updatedBales[baleIdx] };
      const updatedPieces = [...targetBale.pieces];

      updatedPieces[pieceIdx] = {
        ...updatedPieces[pieceIdx],
        length: val
      };

      targetBale.pieces = updatedPieces;
      targetBale.totalLength = updatedPieces.reduce((sum, it) => sum + (Number(it.length) || 0), 0);
      updatedBales[baleIdx] = targetBale;

      return { ...prev, bales: updatedBales };
    });
  };

  // Calculate live total meters entered across all pieces in all bales
  const totalMetersEntered = Math.round(
    (formData.bales || []).reduce((sum, b) => sum + (Number(b.totalLength) || 0), 0) * 100
  ) / 100;

  // Declared total meters from header
  const declaredTotal = Number(formData.totalQty || formData.declaredTotalMeters || 0);

  const isMatch = declaredTotal > 0 && Math.abs(totalMetersEntered - declaredTotal) < 0.01;
  const hasBaleEntries = (formData.bales || []).some((b) => (b.pieces || []).length > 0);

  // Live fabric breakdown across all bales (e.g. 300m Cotton, 200m Rayon, 500m Silk)
  const fabricBreakdown = {};
  (formData.bales || []).forEach((b) => {
    const fLabel = b.fabricItemLabel || defaultFabricLabel;
    const bLen = Number(b.totalLength) || 0;
    const pCount = (b.pieces || []).length || 0;
    if (!fabricBreakdown[fLabel]) {
      fabricBreakdown[fLabel] = { totalMeters: 0, baleCount: 0, pieceCount: 0 };
    }
    fabricBreakdown[fLabel].totalMeters += bLen;
    fabricBreakdown[fLabel].baleCount += 1;
    fabricBreakdown[fLabel].pieceCount += pCount;
  });

  // Cancel action: clears all fields and exits back to GRN list
  const handleCancel = () => {
    setFormData({
      id: '',
      poId: '',
      linkedPOs: [],
      vendorId: '',
      vendorName: '',
      receivedDate: '',
      vendorChallanNo: '',
      vendorChallanDate: '',
      vendorInvoiceNo: '',
      vendorInvoiceDate: '',
      transporterId: '',
      transporterName: '',
      lrNo: '',
      lrDate: '',
      weight: '',
      totalQty: '',
      declaredTotalMeters: 0,
      totalBales: '',
      status: 'Bale Entry in Progress',
      bales: []
    });
    if (onBack) {
      onBack();
    }
  };

  // Save Progress (Finish Later) / Save This Section
  const handleSaveHeaderOnly = () => {
    if (isQcActioned) {
      showToast('Receipt details are locked because Quality Check has already started or been completed.', 'warning');
      return;
    }

    const resolvedPoId = formData.poId || (formData.linkedPOs && formData.linkedPOs[0]) || grn?.poId || (grn?.linkedPOs && grn.linkedPOs[0]) || currentPO?.id || '';
    if (!resolvedPoId) {
      showToast('Please select a Source document (Purchase Order).', 'warning');
      return;
    }

    const currentBales = formData.bales || [];

    const selectedPO = purchaseOrders.find((p) => p.id === resolvedPoId) || currentPO;
    const firstPoItem = selectedPO?.items?.[0];
    const fabricItem = firstPoItem
      ? firstPoItem.fabricName || firstPoItem.fabricQuality
      : (formData.fabricName || '');
    const colorVal = firstPoItem?.colorName || firstPoItem?.color || formData.colorName || '';
    const colorHexVal = firstPoItem?.colorHex || formData.colorHex || '';
    const fabricIdVal = firstPoItem?.fabricId || formData.fabricId || '';
    const widthVal = firstPoItem?.width || formData.width || '';
    const vName = formData.vendorName || (selectedPO ? getPoVendorName(selectedPO) : (grn?.vendorName || ''));
    const vId = formData.vendorId || selectedPO?.vendorId || grn?.vendorId || '';

    const payload = {
      ...formData,
      poId: resolvedPoId,
      linkedPOs: formData.linkedPOs && formData.linkedPOs.length > 0 ? formData.linkedPOs : (resolvedPoId ? [resolvedPoId] : []),
      vendorId: vId,
      vendorName: vName,
      status: formData.status === 'Completed' ? 'Completed' : 'Header Saved',
      isHeaderSaved: true,
      isNew: false,
      date: formData.receivedDate,
      fabricName: fabricItem,
      fabricId: fabricIdVal,
      colorName: colorVal,
      colorHex: colorHexVal,
      width: widthVal,
      declaredTotalMeters: declaredTotal,
      totalQty: formData.totalQty !== undefined && formData.totalQty !== '' ? formData.totalQty : (declaredTotal ? String(declaredTotal) : ''),
      lrNumber: formData.lrNo || formData.lrNumber || '',
      lrNo: formData.lrNo || formData.lrNumber || '',
      totalMetersEntered,
      bales: currentBales
    };

    // Update local state immediately with complete saved details
    setFormData((prev) => ({
      ...prev,
      ...payload
    }));

    // Instantly toggle Section 1 to read-only Summary Card view (Image 1) with Edit button
    setIsHeaderEditing(false);

    if (onSaveGRN) {
      try {
        onSaveGRN(payload, false);
      } catch (err) {
        console.warn('Error saving GRN header:', err);
      }
    }
    showToast('Receipt details saved successfully!', 'success');
  };

  // Save all bales draft progress (including any individual bale saves)
  const handleSaveAllBales = (specificBaleIdx = null) => {
    if (!formData.poId && (!formData.linkedPOs || formData.linkedPOs.length === 0)) {
      showToast('Please select a Source document (Purchase Order) before saving.', 'warning');
      return;
    }

    const selectedPO = purchaseOrders.find((p) => p.id === formData.poId);
    const firstPoItem = selectedPO?.items?.[0];
    const fabricItem = firstPoItem
      ? firstPoItem.fabricName || firstPoItem.fabricQuality
      : (formData.fabricName || '');
    const colorVal = firstPoItem?.colorName || firstPoItem?.color || formData.colorName || '';
    const colorHexVal = firstPoItem?.colorHex || formData.colorHex || '';
    const fabricIdVal = firstPoItem?.fabricId || formData.fabricId || '';
    const widthVal = firstPoItem?.width || formData.width || '';

    const payload = {
      ...formData,
      status: 'Bale Entry in Progress',
      date: formData.receivedDate,
      fabricName: fabricItem,
      fabricId: fabricIdVal,
      colorName: colorVal,
      colorHex: colorHexVal,
      width: widthVal,
      declaredTotalMeters: declaredTotal,
      totalQty: formData.totalQty !== undefined && formData.totalQty !== '' ? formData.totalQty : (declaredTotal ? String(declaredTotal) : ''),
      lrNumber: formData.lrNo || formData.lrNumber || '',
      lrNo: formData.lrNo || formData.lrNumber || '',
      totalMetersEntered
    };

    if (onSaveGRN) {
      onSaveGRN(payload, false);
      if (specificBaleIdx !== null && specificBaleIdx !== undefined) {
        const targetBale = formData.bales[specificBaleIdx];
        const bNo = targetBale?.baleNo || (specificBaleIdx + 1);
        const pLen = (targetBale?.pieces || []).length;
        const bTot = targetBale?.totalLength || 0;
        setSavedBaleMap((prev) => ({ ...prev, [specificBaleIdx]: true }));
        showToast(`Bale ${bNo} saved successfully! (${pLen} piece${pLen === 1 ? '' : 's'}, ${bTot}m entered)`, 'success');
        setTimeout(() => {
          setSavedBaleMap((prev) => ({ ...prev, [specificBaleIdx]: false }));
        }, 3000);
      } else {
        const totalCount = (formData.bales || []).length;
        const configuredCount = (formData.bales || []).filter((b) => (b.pieces || []).length > 0 && Number(b.totalLength) > 0).length;
        showToast(`All ${totalCount} Bales saved successfully! (${configuredCount} configured, ${totalMetersEntered}m entered)`, 'success');
      }
    }
  };

  // Keep alias for backward-compatible call sites
  const handleSaveSingleBale = handleSaveAllBales;

  // Complete / Submit GRN to QC
  const handleCompleteGRN = () => {
    if (!formData.poId && (!formData.linkedPOs || formData.linkedPOs.length === 0)) {
      showToast('Please select a Source document (Purchase Order).', 'warning');
      return;
    }
    if (!formData.receivedDate) {
      showToast('Please enter Received date.', 'warning');
      return;
    }
    if (!declaredTotal || declaredTotal <= 0) {
      showToast('Please enter Total quantity (m) in Receipt Details before submitting.', 'warning');
      return;
    }
    if (!formData.bales || formData.bales.length === 0) {
      showToast('Please generate at least one bale and enter piece meters before submitting.', 'warning');
      return;
    }

    // STRICT VALIDATION: Entered piece length total MUST match declared quantity exactly!
    if (Math.abs(totalMetersEntered - declaredTotal) >= 0.01) {
      const diff = Math.round((declaredTotal - totalMetersEntered) * 100) / 100;
      if (diff > 0) {
        showToast(
          `Cannot submit to QC! Piece-wise total (${totalMetersEntered}m) is less than declared quantity (${declaredTotal}m). Remaining ${diff}m needs to be entered in bales first.`,
          'danger'
        );
      } else {
        showToast(
          `Cannot submit to QC! Piece-wise total (${totalMetersEntered}m) exceeds declared quantity (${declaredTotal}m) by ${Math.abs(diff)}m. Please correct bale measurements.`,
          'danger'
        );
      }
      return;
    }

    const selectedPO = purchaseOrders.find((p) => p.id === formData.poId);
    const firstPoItem = selectedPO?.items?.[0];
    const fabricItem = firstPoItem
      ? firstPoItem.fabricName || firstPoItem.fabricQuality
      : (formData.fabricName || '');
    const colorVal = firstPoItem?.colorName || firstPoItem?.color || formData.colorName || '';
    const colorHexVal = firstPoItem?.colorHex || formData.colorHex || '';
    const fabricIdVal = firstPoItem?.fabricId || formData.fabricId || '';
    const widthVal = firstPoItem?.width || formData.width || '';

    const payload = {
      ...formData,
      status: 'Completed',
      date: formData.receivedDate,
      fabricName: fabricItem,
      fabricId: fabricIdVal,
      colorName: colorVal,
      colorHex: colorHexVal,
      width: widthVal,
      declaredTotalMeters: declaredTotal,
      totalQty: formData.totalQty !== undefined && formData.totalQty !== '' ? formData.totalQty : (declaredTotal ? String(declaredTotal) : ''),
      lrNumber: formData.lrNo || formData.lrNumber || '',
      lrNo: formData.lrNo || formData.lrNumber || '',
      totalMetersEntered
    };

    if (onSaveGRN) {
      onSaveGRN(payload, true);
      showToast(`GRN ${formData.id} (${totalMetersEntered}m) submitted successfully and sent to Quality Check (QC)!`, 'success');
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Top Header / Breadcrumb */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-white border shadow-sm rounded-circle p-2 d-flex align-items-center justify-content-center"
            style={{ width: '40px', height: '40px' }}
            onClick={onBack}
            title="Back to GRN List"
          >
            <i className="ti ti-arrow-left fs-18 text-secondary"></i>
          </button>
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-1 text-muted fs-12">
                <li className="breadcrumb-item">Procurement</li>
                <li className="breadcrumb-item text-secondary">Goods Receipt (GRN)</li>
                <li className="breadcrumb-item active text-primary fw-medium">{formData.id}</li>
              </ol>
            </nav>
            <div className="d-flex align-items-center gap-2">
              <h3 className="fw-bold text-dark mb-0 fs-20">
                {isExisting ? `Goods Receipt Note: ${formData.id}` : 'Goods Received Note'}
              </h3>
              <span
                className={`badge px-2.5 py-1 fs-12 rounded-pill ${
                  formData.status === 'Completed'
                    ? 'bg-success-subtle text-success border border-success border-opacity-25'
                    : 'bg-primary-subtle text-primary border border-primary border-opacity-25'
                }`}
              >
                {formData.status}
              </span>
            </div>
            <p className="text-secondary mb-0 fs-13 mt-1">
              Recording receipt against{' '}
              <strong>PO-{currentPO ? currentPO.id : (formData.poId || '—')}</strong>
              {formData.vendorName ? ` (${formData.vendorName})` : ''}. Full or partial quantity is allowed.
            </p>
          </div>
        </div>
      </div>

      {/* QC ACTIONED LOCK BANNER */}
      {isQcActioned && (
        <div className="alert alert-warning border border-warning d-flex align-items-center gap-3 rounded-3 shadow-sm mb-4 py-3 bg-warning-subtle text-dark">
          <i className="ti ti-lock fs-24 text-warning"></i>
          <div className="flex-grow-1">
            <div className="fw-bold fs-14">
              GRN Locked — Quality Check Actioned ({linkedQC ? linkedQC.qcStatus : formData.status})
            </div>
            <div className="fs-12 text-secondary">
              Quality Check has already been completed or actioned for this shipment. Bale entries, piece quantities, and inward receipt details cannot be edited.
            </div>
          </div>
          <span className="badge bg-warning text-dark px-3 py-1.5 rounded-pill fs-12 fw-semibold">
            Locked (QC Processed)
          </span>
        </div>
      )}

      {/* SECTION 1: RECEIPT DETAILS */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
          <h5 className="fw-bold text-dark mb-0 fs-16 d-flex align-items-center gap-2">
            <span>Receipt details</span>
          </h5>
          {!isHeaderEditing ? (
            !isQcActioned ? (
              <button
                type="button"
                className="btn btn-sm btn-white border px-3 py-1 fs-12 fw-semibold rounded-2 text-dark shadow-xs d-inline-flex align-items-center gap-1.5"
                style={{ borderColor: '#cbd5e1' }}
                onClick={() => setIsHeaderEditing(true)}
                title="Edit Receipt Details"
              >
                <i className="ti ti-edit fs-14" style={{ color: '#f97316' }}></i>
                <span>Edit</span>
              </button>
            ) : (
              <span className="badge bg-light text-secondary border px-2.5 py-1 fs-11 rounded-pill fw-normal">
                <i className="ti ti-lock me-1 text-warning"></i> Read Only (QC Actioned)
              </span>
            )
          ) : (
            isQcActioned && (
              <span className="badge bg-light text-secondary border px-2.5 py-1 fs-11 rounded-pill fw-normal">
                <i className="ti ti-lock me-1 text-warning"></i> Read Only
              </span>
            )
          )}
        </div>

        {!isHeaderEditing ? (
          /* READ-ONLY / SUMMARY VIEW MODE (Matches Image 2 Style & Theme) */
          <div className="row g-4 fs-13 pt-1">
            {/* 1. SOURCE DOCUMENT */}
            <div className="col-12 col-sm-6 col-md-3 col-lg" style={{ minWidth: '150px' }}>
              <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>
                SOURCE DOCUMENT
              </div>
              <div className="fw-bold text-dark fs-13 text-truncate" title={formData.poId}>
                {formData.poId || '—'}
              </div>
              {currentPO && getPoVendorName(currentPO) && (
                <div className="text-muted fs-11 text-truncate" title={getPoVendorName(currentPO)}>
                  {getPoVendorName(currentPO)}
                </div>
              )}
            </div>

            {/* 2. RECEIVED DATE */}
            <div className="col-12 col-sm-6 col-md-3 col-lg" style={{ minWidth: '130px' }}>
              <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>
                RECEIVED DATE
              </div>
              <div className="fw-bold text-dark fs-13">
                {formData.receivedDate || '—'}
              </div>
            </div>

            {/* 3. VENDOR CHALLAN */}
            <div className="col-12 col-sm-6 col-md-3 col-lg" style={{ minWidth: '140px' }}>
              <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>
                VENDOR CHALLAN
              </div>
              <div className="fw-bold text-dark fs-13">
                {formData.vendorChallanNo || '—'}
              </div>
              {formData.vendorChallanDate && (
                <div className="text-muted fs-11">{formData.vendorChallanDate}</div>
              )}
            </div>

            {/* 4. VENDOR INVOICE */}
            <div className="col-12 col-sm-6 col-md-3 col-lg" style={{ minWidth: '140px' }}>
              <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>
                VENDOR INVOICE
              </div>
              <div className="fw-bold text-dark fs-13">
                {formData.vendorInvoiceNo || '—'}
              </div>
              {formData.vendorInvoiceDate && (
                <div className="text-muted fs-11">{formData.vendorInvoiceDate}</div>
              )}
            </div>

            {/* 5. TRANSPORTER */}
            <div className="col-12 col-sm-6 col-md-3 col-lg" style={{ minWidth: '150px' }}>
              <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>
                TRANSPORTER
              </div>
              <div className="fw-bold text-dark fs-13 text-truncate" title={formData.transporterName || (transporters.find((t) => t.id === formData.transporterId)?.name) || '—'}>
                {formData.transporterName || (transporters.find((t) => t.id === formData.transporterId)?.name) || '—'}
              </div>
            </div>

            {/* Row 2 */}
            {/* 6. LR NO. / DATE */}
            <div className="col-12 col-sm-6 col-md-3 col-lg" style={{ minWidth: '150px' }}>
              <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>
                LR NO. / DATE
              </div>
              <div className="fw-bold text-dark fs-13">
                {formData.lrNo || formData.lrNumber ? (
                  formData.lrDate ? `${formData.lrNo || formData.lrNumber} / ${formData.lrDate}` : (formData.lrNo || formData.lrNumber)
                ) : '—'}
              </div>
            </div>

            {/* 7. WEIGHT */}
            <div className="col-12 col-sm-6 col-md-3 col-lg" style={{ minWidth: '130px' }}>
              <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>
                WEIGHT
              </div>
              <div className="fw-bold text-dark fs-13">
                {formData.weight ? `${formData.weight} kg` : '— kg'}
              </div>
            </div>

            {/* 8. FABRIC FOLDING */}
            <div className="col-12 col-sm-6 col-md-3 col-lg" style={{ minWidth: '140px' }}>
              <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>
                FABRIC FOLDING
              </div>
              <div className="fw-bold text-dark fs-13">
                {currentPO?.items?.[0]?.fold ? `${currentPO.items[0].fold}%` : (formData.fabricFolding ? `${formData.fabricFolding} cms` : '—')}
              </div>
            </div>

            {/* 9. TOTAL QTY / BALES */}
            <div className="col-12 col-sm-6 col-md-3 col-lg" style={{ minWidth: '140px' }}>
              <div className="text-secondary fs-11 text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>
                TOTAL QTY / BALES
              </div>
              <div className="fw-bold text-dark fs-13 font-monospace">
                {Number(formData.totalQty || formData.declaredTotalMeters || 0).toLocaleString()}m / {formData.totalBales || (formData.bales ? formData.bales.length : 0)}
              </div>
            </div>

            {/* 5th column spacer for alignment on large screens */}
            <div className="col-12 col-sm-6 col-md-3 col-lg d-none d-lg-block" style={{ minWidth: '150px' }}></div>
          </div>
        ) : (
          /* EDITING FORM INPUTS (Image 1) */
          <div>
            <div className="row g-3 mb-2">
              {/* Row 1: Source document & Received date */}
              <div className="col-12 col-md-8">
                <label className="form-label fs-13 fw-semibold text-secondary mb-1">
                  Source document <span className="text-danger">*</span>
                </label>
                {isLinkedFromPO ? (
                  <div
                    className="form-control bg-light fs-13 d-flex align-items-center justify-content-between text-dark fw-medium"
                    style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px', cursor: 'default' }}
                  >
                    <div className="d-flex align-items-center gap-2 text-truncate">
                      <i className="ti ti-file-description text-primary fs-16"></i>
                      <span className="fw-semibold text-dark">
                        {currentPO
                          ? `${currentPO.id} — ${getPoVendorName(currentPO) || 'Vendor'} (fabric purchase)`
                          : (formData.poId ? `${formData.poId} — ${formData.vendorName || 'Vendor'} (fabric purchase)` : 'Purchase Order')}
                      </span>
                    </div>
                    <span className="badge bg-white text-secondary border px-2 py-0.5 fs-11 rounded-pill fw-medium">
                      <i className="ti ti-lock me-1 text-muted"></i> Linked PO
                    </span>
                  </div>
                ) : (
                  <select
                    className="form-select bg-white fs-13"
                    style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                    disabled={isQcActioned}
                    value={formData.poId || ''}
                    onChange={(e) => handlePOChange(e.target.value)}
                  >
                    <option value="">Select Source Document (PO)...</option>
                    {eligiblePOs.map((po) => {
                      const vName = getPoVendorName(po);
                      return (
                        <option key={po.id} value={po.id}>
                          {po.id} — {vName || 'Vendor'} (fabric purchase)
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fs-13 fw-semibold text-secondary mb-1">
                  Received date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control bg-white fs-13"
                  style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                  value={formData.receivedDate}
                  onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                />
              </div>
            </div>

            <div className="row g-3 mb-2">
              {/* Row 2: Vendor Challan & Invoice */}
              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label fs-13 fw-semibold text-secondary mb-1">
                  Vendor challan no. (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1360"
                  className="form-control bg-white fs-13"
                  style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                  value={formData.vendorChallanNo}
                  onChange={(e) => setFormData({ ...formData, vendorChallanNo: e.target.value })}
                />
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label fs-13 fw-semibold text-secondary mb-1">
                  Vendor challan date (optional)
                </label>
                <input
                  type="date"
                  className="form-control bg-white fs-13"
                  style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                  value={formData.vendorChallanDate}
                  onChange={(e) => setFormData({ ...formData, vendorChallanDate: e.target.value })}
                />
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label fs-13 fw-semibold text-secondary mb-1">
                  Vendor invoice no. (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MST/1360/26-27"
                  className="form-control bg-white fs-13"
                  style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                  value={formData.vendorInvoiceNo}
                  onChange={(e) => setFormData({ ...formData, vendorInvoiceNo: e.target.value })}
                />
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label fs-13 fw-semibold text-secondary mb-1">
                  Vendor invoice date (optional)
                </label>
                <input
                  type="date"
                  className="form-control bg-white fs-13"
                  style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                  value={formData.vendorInvoiceDate}
                  onChange={(e) => setFormData({ ...formData, vendorInvoiceDate: e.target.value })}
                />
              </div>
            </div>

            <div className="row g-3 mb-3">
              {/* Row 3: Transporter (with clean + New link), LR No, LR Date */}
              <div className="col-12 col-lg-6">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <label className="form-label fs-13 fw-semibold text-secondary mb-0">Transporter</label>
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-decoration-none fs-12 fw-semibold"
                    style={{ color: '#5b47fb' }}
                    onClick={() => setShowInlineTransporterModal(true)}
                  >
                    + New
                  </button>
                </div>
                <select
                  className="form-select bg-white fs-13"
                  style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                  value={formData.transporterId || ''}
                  onChange={(e) => {
                    const trn = transporters.find((t) => t.id === e.target.value);
                    setFormData({
                      ...formData,
                      transporterId: e.target.value,
                      transporterName: trn ? trn.name : ''
                    });
                  }}
                >
                  <option value="">Select Transporter...</option>
                  {transporters.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label fs-13 fw-semibold text-secondary mb-1">LR no.</label>
                <input
                  type="text"
                  placeholder="e.g. LR-98210"
                  className="form-control bg-white fs-13"
                  style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                  value={formData.lrNo}
                  onChange={(e) => setFormData({ ...formData, lrNo: e.target.value })}
                />
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label fs-13 fw-semibold text-secondary mb-1">LR date</label>
                <input
                  type="date"
                  className="form-control bg-white fs-13"
                  style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                  value={formData.lrDate}
                  onChange={(e) => setFormData({ ...formData, lrDate: e.target.value })}
                />
              </div>
            </div>

            {/* Partial Inward Notice Banner */}
            {formData.poId && alreadyReceivedMeters > 0 && (
              <div className="alert alert-info py-2 px-3 rounded-3 fs-13 d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2 border-info border-opacity-25 shadow-xs">
                <div className="d-flex align-items-center gap-2">
                  <i className="ti ti-truck-delivery fs-18 text-info"></i>
                  <span>
                    <strong>Partial Inward for PO {formData.poId}:</strong> {alreadyReceivedMeters.toLocaleString()}m already received in {previousGrnsForPo.map(g => g.id).join(', ')}. <strong>Remaining to Inward: {poPendingMeters.toLocaleString()}m</strong> of {poOrderedMeters.toLocaleString()}m ordered.
                  </span>
                </div>
                <span className="badge bg-info text-white fs-11 px-2.5 py-1 rounded-pill">
                  {poPendingMeters.toLocaleString()}m Balance
                </span>
              </div>
            )}

            {/* Row 4: Weight, Total qty, No. of bales, Generate Bales, Save Section */}
            <div className="d-flex flex-wrap align-items-end gap-3 pt-2">
              <div style={{ flex: '1 1 140px', minWidth: '130px', maxWidth: '200px' }}>
                <label className="form-label fs-13 fw-semibold text-secondary mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 450"
                  className="form-control bg-white fs-13"
                  style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>

              <div style={{ flex: '1 1 180px', minWidth: '160px', maxWidth: '240px' }}>
                <label className="form-label fs-13 fw-semibold text-secondary mb-1">
                  Total qty {poPendingMeters > 0 && alreadyReceivedMeters > 0 ? `(${poPendingMeters}m pending)` : (poOrderedMeters > 0 ? `(${poOrderedMeters}m)` : '(m)')} <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={poPendingMeters > 0 && alreadyReceivedMeters > 0 ? `e.g. ${poPendingMeters}` : (poOrderedMeters > 0 ? `e.g. ${poOrderedMeters}` : "e.g. 1000")}
                  className="form-control bg-white fs-13"
                  style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                  value={formData.totalQty}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      totalQty: val,
                      declaredTotalMeters: Number(val) || 0
                    });
                  }}
                />
              </div>

              <div style={{ flex: '1 1 130px', minWidth: '120px', maxWidth: '180px' }}>
                <label className="form-label fs-13 fw-semibold text-secondary mb-1">
                  No. of bales <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 2"
                  className="form-control bg-white fs-13"
                  style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                  value={formData.totalBales}
                  onChange={(e) => handleBaleCountChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGenerateBales();
                    }
                  }}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2 px-3 fw-semibold fs-13 text-white shadow-sm"
                style={{
                  height: '40px',
                  backgroundColor: isQcActioned ? '#94a3b8' : '#5b47fb',
                  borderColor: isQcActioned ? '#94a3b8' : '#5b47fb',
                  borderRadius: '8px',
                  cursor: isQcActioned ? 'not-allowed' : 'pointer'
                }}
                disabled={isQcActioned}
                onClick={handleGenerateBales}
                title={isQcActioned ? 'Bale entries are locked because QC has already started' : 'Generate container bales'}
              >
                <i className={`ti ${isQcActioned ? 'ti-lock' : 'ti-package'} fs-15`}></i>
                <span>Generate Bales</span>
              </button>

              <button
                type="button"
                className="btn btn-white border d-inline-flex align-items-center justify-content-center gap-2 px-3 fw-medium fs-13 shadow-sm text-dark"
                style={{
                  height: '40px',
                  borderColor: '#cbd5e1',
                  borderRadius: '8px',
                  backgroundColor: isQcActioned ? '#f1f5f9' : '#ffffff',
                  cursor: isQcActioned ? 'not-allowed' : 'pointer',
                  opacity: isQcActioned ? 0.6 : 1
                }}
                disabled={isQcActioned}
                onClick={handleSaveHeaderOnly}
                title={isQcActioned ? 'Receipt details are locked because Quality Check has started' : 'Save Receipt Details header'}
              >
                <i className="ti ti-device-floppy fs-15" style={{ color: isQcActioned ? '#94a3b8' : '#5b47fb' }}></i>
                <span>Save This Section</span>
              </button>
            </div>

            <p className="text-muted fs-12 mt-2 mb-0">
              Enter the number of bales and click &quot;Generate Bales&quot; (or press Enter) to create bale entries below.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: BALE-WISE INWARD ENTRY */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
          <div>
            <h5 className="fw-bold text-dark mb-1 fs-16 d-flex align-items-center gap-2">
              <i className="ti ti-packages text-primary fs-18"></i>
              <span>Bale-wise Inward Entry</span>
            </h5>
            <p className="text-secondary fs-12 mb-0">
              Enter individual piece lengths (in meters) for each container bale
            </p>
          </div>
          {formData.bales.length > 0 && (
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 px-3 py-1.5 fs-12 rounded-pill fw-semibold">
                {formData.bales.length} Bale{formData.bales.length > 1 ? 's' : ''} Generated
              </span>
              {!isQcActioned && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fs-12 fw-semibold rounded-3 text-white shadow-sm"
                  style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                  onClick={() => handleSaveAllBales()}
                  title="Save all generated bales and entered pieces"
                >
                  <i className="ti ti-device-floppy fs-14"></i>
                  <span>Save All Bales</span>
                </button>
              )}
            </div>
          )}
        </div>

        {isQcActioned && (
          <div className="alert alert-secondary py-2.5 px-3 rounded-3 fs-13 d-flex align-items-center gap-2 mb-3 border shadow-xs bg-light">
            <i className="ti ti-lock fs-18 text-secondary"></i>
            <div>
              <strong className="text-dark">Bale Entries Locked:</strong> Quality Check has already started for this GRN. Bale & piece entries cannot be edited.
            </div>
          </div>
        )}

        {/* Empty state when no bales generated */}
        {formData.bales.length === 0 ? (
          <div
            className="p-5 text-center rounded-3 text-muted fs-13 my-2"
            style={{
              border: '2px dashed #cbd5e1',
              backgroundColor: '#f8fafc'
            }}
          >
            <i className="ti ti-package-off fs-36 d-block mb-2 text-secondary opacity-50"></i>
            <span className="fw-medium text-secondary">
              Enter &quot;No. of bales&quot; in Receipt Details above, then click &quot;Generate Bales&quot; to begin entry.
            </span>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {/* Bale Cards */}
            {formData.bales.map((bale, bIdx) => {
              const currentFabricLabel = bale.fabricItemLabel || (
                poItemLabels[0] || masterFabricLabels[0] || (fabrics[0]?.qualityName || 'Fabric')
              );

              return (
                <div
                  key={bIdx}
                  className="card border rounded-4 bg-white overflow-hidden shadow-sm mb-3"
                  style={{
                    borderColor: '#e2e8f0',
                    borderRadius: '14px'
                  }}
                >
                  {/* Bale Header Bar */}
                  <div
                    className="d-flex align-items-center justify-content-between px-4 px-md-4 py-3 border-bottom"
                    style={{ backgroundColor: '#f8fafc' }}
                  >
                    <div className="d-flex align-items-center flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2 me-2">
                        <i className="ti ti-package text-primary fs-16"></i>
                        <span className="fw-bold text-dark fs-15 lh-1">
                          Bale {bale.baleNo || bIdx + 1}
                        </span>
                      </div>
                      <span
                        className="badge bg-white text-secondary border px-3 py-1.5 fs-11 rounded-pill fw-medium me-1"
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                      >
                        Container #{bIdx + 1}
                      </span>
                      <span
                        className={`badge px-3 py-1.5 fs-11 rounded-pill fw-medium ${
                          isQcActioned
                            ? 'bg-secondary-subtle text-secondary border'
                            : 'bg-success-subtle text-success border border-success border-opacity-25'
                        }`}
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                      >
                        {isQcActioned ? 'Locked (QC Actioned)' : 'Editable'}
                      </span>
                    </div>

                    {!isQcActioned && (
                      <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-sm text-white rounded-2 px-3.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
                          style={{
                            backgroundColor: savedBaleMap[bIdx] ? '#10b981' : '#7c3aed',
                            borderColor: savedBaleMap[bIdx] ? '#10b981' : '#7c3aed',
                            fontSize: '12.5px'
                          }}
                          onClick={() => handleSaveSingleBale(bIdx)}
                          title={`Save Bale ${bale.baleNo || bIdx + 1}`}
                        >
                          <i className={`ti ${savedBaleMap[bIdx] ? 'ti-check' : 'ti-device-floppy'}`} style={{ fontSize: '15px' }}></i>
                          <span>{savedBaleMap[bIdx] ? 'Saved' : 'Save'}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-link text-muted p-1"
                          onClick={() => handleRemoveBale(bIdx)}
                          title="Remove Bale"
                        >
                          <i className="ti ti-trash text-danger" style={{ fontSize: '16px' }}></i>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="px-4 px-md-4 py-3.5">
                    {/* Bale Fields: Bale No, Fabric Item, No. of pieces */}
                    <div className="row g-3 gx-4 align-items-start mb-3">
                      {/* Bale No */}
                      <div className="col-12 col-sm-3 col-md-2" style={{ minWidth: '110px' }}>
                        <label className="form-label fs-12 fw-semibold text-secondary mb-1.5">
                          Bale No. <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control bg-white text-center fs-13 fw-semibold"
                          style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                          value={bale.baleNo || ''}
                          disabled={isQcActioned}
                          onChange={(e) => handleBaleNoChange(bIdx, e.target.value)}
                        />
                      </div>

                      {/* Fabric Item */}
                      <div className="col-12 col-sm-6 col-md-7 flex-grow-1">
                        <label className="form-label fs-12 fw-semibold text-secondary mb-1.5">
                          Fabric Item / Quality <span className="text-danger">*</span>
                        </label>
                        {isLinkedFromPO ? (
                          poItemLabels.length <= 1 ? (
                            <div
                              className="form-control bg-light fs-13 d-flex align-items-center justify-content-between text-dark fw-medium px-3"
                              style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px', cursor: 'default' }}
                            >
                              <div className="d-flex align-items-center gap-2 text-truncate">
                                <i className="ti ti-fabric text-primary fs-15"></i>
                                <span className="fw-semibold text-dark text-truncate">
                                  {bale.fabricItemLabel || poItemLabels[0] || 'Fabric Item'}
                                </span>
                              </div>
                              <span className="badge bg-white text-secondary border px-2 py-0.5 fs-11 rounded-pill fw-medium flex-shrink-0">
                                From PO
                              </span>
                            </div>
                          ) : (
                            <select
                              className="form-select bg-white fs-13 px-3"
                              style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                              value={bale.fabricItemLabel || poItemLabels[bIdx % poItemLabels.length] || poItemLabels[0]}
                              disabled={isQcActioned}
                              onChange={(e) => handleBaleFabricChange(bIdx, e.target.value)}
                            >
                              {poItemLabels.map((lbl, oIdx) => (
                                <option key={`po-${oIdx}`} value={lbl}>
                                  {lbl}
                                </option>
                              ))}
                            </select>
                          )
                        ) : (
                          <select
                            className="form-select bg-white fs-13 px-3"
                            style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                            value={bale.fabricItemLabel || defaultFabricLabel}
                            disabled={isQcActioned}
                            onChange={(e) => handleBaleFabricChange(bIdx, e.target.value)}
                          >
                            {poItemLabels.length > 0 && (
                              <optgroup label={`From ${currentPO ? currentPO.id : 'Selected PO'} Items`}>
                                {poItemLabels.map((lbl, oIdx) => (
                                  <option key={`po-${oIdx}`} value={lbl}>
                                    {lbl}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <optgroup label="All Master Fabrics">
                              {masterFabricLabels.map((lbl, fIdx) => (
                                <option key={`mf-${fIdx}`} value={lbl}>
                                  {lbl}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        )}
                      </div>

                      {/* No. of pieces */}
                      <div className="col-12 col-sm-3 col-md-3" style={{ minWidth: '120px', maxWidth: '170px' }}>
                        <label className="form-label fs-12 fw-semibold text-secondary mb-1.5">
                          No. of Pieces <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 1"
                          className="form-control bg-white text-center fs-13 fw-semibold"
                          style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                          value={bale.piecesCount || (bale.pieces && bale.pieces.length ? bale.pieces.length : '')}
                          disabled={isQcActioned}
                          onChange={(e) => handleSetPieceCount(bIdx, e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Pieces Inward Entry Grid */}
                    <div
                      className="rounded-3 p-3.5 my-3"
                      style={{ backgroundColor: '#f8fafc', border: '1px solid #eef2f6' }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2.5">
                        <span className="fs-12 fw-semibold text-dark text-uppercase" style={{ letterSpacing: '0.04em' }}>
                          Piece-Wise Length (Meters)
                        </span>
                        <span className="fs-11 text-muted fw-medium">
                          {(bale.pieces || []).length} Piece{(bale.pieces || []).length !== 1 ? 's' : ''} configured
                        </span>
                      </div>

                      {!bale.pieces || bale.pieces.length === 0 ? (
                        <div className="py-3 px-3 text-center text-muted fs-12 bg-white rounded-2 border border-dashed">
                          <i className="ti ti-info-circle me-1.5 text-primary"></i>
                          Enter number of pieces above to generate piece length inputs.
                        </div>
                      ) : (
                        <div className="d-flex flex-wrap align-items-end gap-3 pt-1">
                          {bale.pieces.map((piece, pIdx) => {
                            const len = piece.length !== undefined ? piece.length : piece;
                            return (
                              <div
                                key={pIdx}
                                className="bg-white p-2.5 rounded-2 border shadow-none"
                                style={{ width: '115px', borderColor: '#e2e8f0' }}
                              >
                                <label className="d-block fs-11 fw-semibold text-secondary text-center mb-1">
                                  Pc {pIdx + 1} (m)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  className="form-control bg-white text-center fw-semibold fs-13 px-1"
                                  style={{ height: '36px', borderColor: '#cbd5e1', borderRadius: '6px' }}
                                  value={len === 0 ? '0' : (len || '')}
                                  disabled={isQcActioned}
                                  onChange={(e) => handlePieceMeterChange(bIdx, pIdx, e.target.value)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Bale Summary Footer */}
                    <div className="d-flex flex-wrap align-items-center justify-content-between pt-3 mt-3 border-top text-secondary fs-12 gap-2">
                      <div className="d-flex align-items-center gap-2 text-truncate">
                        <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill fw-semibold">
                          {(bale.pieces || []).length} Piece{(bale.pieces || []).length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-secondary text-truncate">
                          Assigned: <strong className="text-dark">{bale.fabricItemLabel || currentFabricLabel}</strong>
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-secondary fs-12 fw-medium">Bale Total:</span>
                        <span className="fs-14 fw-bold text-dark font-monospace px-2.5 py-0.5 rounded bg-light border">
                          {(bale.totalLength || 0).toFixed(2).replace(/\.00$/, '')} m
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Fabric-Wise Inward Breakdown Summary when entries exist */}
            {hasBaleEntries && Object.keys(fabricBreakdown).length > 0 && (
              <div
                className="card border rounded-3 p-3 mt-2 bg-white shadow-sm"
                style={{ borderColor: '#e2e8f0', borderRadius: '10px' }}
              >
                <div className="d-flex flex-wrap align-items-center justify-content-between mb-2 pb-1.5 border-bottom gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <i className="ti ti-chart-pie fs-16" style={{ color: '#5b47fb' }}></i>
                    <span className="fs-12 fw-bold text-dark text-uppercase" style={{ letterSpacing: '0.04em' }}>
                      Fabric-Wise Inward Breakdown ({Object.keys(fabricBreakdown).length} Quality{Object.keys(fabricBreakdown).length > 1 ? 's' : ''})
                    </span>
                  </div>
                  <span className="fs-11 text-muted">
                    Mixed items (Cotton, Rayon, Silk, etc.) will generate independent Quality Checks
                  </span>
                </div>
                <div className="d-flex flex-wrap gap-2 pt-1">
                  {Object.entries(fabricBreakdown).map(([fName, data], fIdx) => (
                    <div
                      key={fIdx}
                      className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-light border fs-12"
                    >
                      <span className="fw-semibold text-dark">{fName}:</span>
                      <span className="fw-bold font-monospace" style={{ color: '#5b47fb' }}>
                        {data.totalMeters.toFixed(2).replace(/\.00$/, '')} m
                      </span>
                      <span className="text-secondary fs-11">
                        ({data.baleCount} bale{data.baleCount > 1 ? 's' : ''}, {data.pieceCount} pc{data.pieceCount !== 1 ? 's' : ''})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Bar: Entered total vs Declared total */}
            {(hasBaleEntries || declaredTotal > 0) && (
              <div
                className="p-3 px-4 rounded-3 mt-2 d-flex flex-wrap align-items-center justify-content-between gap-3 border shadow-sm"
                style={{
                  backgroundColor: isMatch ? '#f0fdf4' : '#fef2f2',
                  borderColor: isMatch ? '#bbf7d0' : '#fecaca',
                  color: isMatch ? '#166534' : '#991b1b',
                  borderRadius: '10px'
                }}
              >
                <div className="d-flex align-items-center gap-2 fs-13 fw-semibold">
                  <i className={`ti ${isMatch ? 'ti-circle-check fs-18' : 'ti-alert-triangle fs-18'}`}></i>
                  <span>
                    Entered total: <strong>{totalMetersEntered}m</strong> vs. Declared total:{' '}
                    <strong>{declaredTotal}m</strong>
                    {' '}&mdash;{' '}
                    {isMatch ? 'Matches declared quantity' : 'Does not match, recheck entries'}
                  </span>
                </div>
                <div className="fs-15 fw-bold font-monospace">
                  {totalMetersEntered} m total
                </div>
              </div>
            )}

            <p className="text-muted fs-12 mt-2 mb-0">
              {isQcActioned
                ? 'All items in this GRN have been QC-actioned — bale entries are now locked.'
                : 'Bales for items still awaiting Quality Check remain editable. Once QC is actioned on an item, its bales lock automatically.'}
            </p>
          </div>
        )}
      </div>

      {/* SECTION 3: BOTTOM ACTION BUTTONS */}
      {isQcActioned ? (
        <div className="d-flex flex-wrap align-items-center gap-3 pt-1 mb-5">
          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2 fw-semibold fs-13 text-white shadow-sm"
            style={{
              backgroundColor: '#5b47fb',
              borderColor: '#5b47fb',
              borderRadius: '8px',
              height: '42px'
            }}
            onClick={onBack}
          >
            <i className="ti ti-arrow-left fs-15"></i>
            <span>Back to GRN Register</span>
          </button>
          <div className="d-flex align-items-center gap-2 text-muted fs-13">
            <i className="ti ti-lock text-warning fs-18"></i>
            <span>This shipment is locked because Quality Check has been actioned ({linkedQC?.qcStatus || formData.status}).</span>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-wrap align-items-center gap-3 pt-1 mb-5">
          <button
            type="button"
            className="btn btn-white border d-inline-flex align-items-center gap-2 px-4 py-2 fw-medium fs-13 text-dark shadow-sm"
            style={{
              borderColor: '#cbd5e1',
              borderRadius: '8px',
              height: '42px',
              backgroundColor: '#ffffff'
            }}
            onClick={handleSaveHeaderOnly}
            title="Save draft progress and finish entering bales later"
          >
            <i className="ti ti-device-floppy fs-15" style={{ color: '#5b47fb' }}></i>
            <span>Save Progress (Finish Later)</span>
          </button>


          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2 fw-semibold fs-13 text-white shadow-sm"
            style={{
              backgroundColor: '#5b47fb',
              borderColor: '#5b47fb',
              borderRadius: '8px',
              height: '42px'
            }}
            onClick={handleCompleteGRN}
          >
            <i className="ti ti-send fs-15"></i>
            <span>Submit GRN &amp; Send to QC</span>
          </button>

          <button
            type="button"
            className="btn btn-outline-danger d-inline-flex align-items-center gap-2 px-4 py-2 fw-medium fs-13 shadow-sm bg-white"
            style={{
              borderColor: '#fca5a5',
              color: '#dc2626',
              borderRadius: '8px',
              height: '42px'
            }}
            onClick={handleCancel}
          >
            <i className="ti ti-x fs-15"></i>
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* INLINE MODAL: TRANSPORTER MASTER CREATION */}
      {showInlineTransporterModal && (
        <TransporterMasterView
          transporters={transporters}
          isInline={true}
          onCloseInline={() => setShowInlineTransporterModal(false)}
          onSaveTransporter={(newTransporter) => {
            if (onSaveTransporter) {
              onSaveTransporter(newTransporter);
            }
            setFormData((prev) => ({
              ...prev,
              transporterId: newTransporter.id,
              transporterName: newTransporter.name
            }));
            setShowInlineTransporterModal(false);
          }}
        />
      )}

      {/* INLINE TOAST NOTIFICATION */}
      {toastNotification && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 9999 }}
        >
          <div
            className={`toast show border-0 rounded-3 shadow-lg px-3 py-2.5 d-flex align-items-center gap-2.5 text-white ${
              toastNotification.type === 'danger'
                ? 'bg-danger'
                : toastNotification.type === 'warning'
                ? 'bg-warning text-dark'
                : 'bg-dark'
            }`}
            style={{ minWidth: '280px', animation: 'fadeIn 0.2s ease-in-out' }}
          >
            <i
              className={`fs-16 ${
                toastNotification.type === 'danger'
                  ? 'ti ti-alert-circle text-white'
                  : toastNotification.type === 'warning'
                  ? 'ti ti-alert-triangle text-dark'
                  : 'ti ti-circle-check text-success'
              }`}
            ></i>
            <span className="fs-13 fw-medium flex-grow-1">{toastNotification.message}</span>
            <button
              type="button"
              className="btn-close btn-close-white ms-auto"
              style={{ fontSize: '10px' }}
              onClick={() => setToastNotification(null)}
            ></button>
          </div>
        </div>
      )}
    </div>
  );
}
