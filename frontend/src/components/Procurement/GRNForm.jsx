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

  // Find eligible POs: all non-cancelled purchase orders
  const eligiblePOs = (purchaseOrders || []).filter((p) => {
    if (!p) return false;
    return p.status !== 'Cancelled';
  });

  // Initialize form state
  const [formData, setFormData] = useState(() => {
    const isFromPO = Boolean(grn?.poId || (grn?.linkedPOs && grn.linkedPOs.length > 0));
    const defaultPO = isFromPO
      ? eligiblePOs.find((p) => p.id === grn.poId || (grn.linkedPOs && grn.linkedPOs.includes(p.id)))
      : (eligiblePOs.length > 0 ? eligiblePOs[0] : null);

    const resolvedPoId = defaultPO ? defaultPO.id : (grn?.poId || grn?.linkedPOs?.[0] || '');
    const resolvedVendorId = defaultPO ? defaultPO.vendorId : (grn?.vendorId || (vendors[0]?.id || ''));
    const resolvedVendorName = grn?.vendorName || (defaultPO ? getPoVendorName(defaultPO) : (vendors[0]?.name || ''));

    // Check if PO has previous GRNs and remaining pending balance
    let poPendingBalance = '';
    if (defaultPO && !isExisting) {
      const poTotalM = (defaultPO.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
      const prevM = (grns || []).filter(g => (Array.isArray(g.linkedPOs) && g.linkedPOs.includes(defaultPO.id)) || g.poId === defaultPO.id)
        .reduce((s, g) => s + (Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0), 0);
      const pend = Math.max(0, poTotalM - prevM);
      if (pend > 0) poPendingBalance = String(pend);
    }

    const defaultDeclared = (grn && grn.totalQty !== undefined && grn.totalQty !== '')
      ? grn.totalQty
      : (grn?.declaredTotalMeters
          ? grn.declaredTotalMeters
          : (grn?.pendingQtyToReceive ? String(grn.pendingQtyToReceive) : poPendingBalance));

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
            : (grn?.declaredTotalMeters
                ? String(grn.declaredTotalMeters)
                : (grn?.pendingQtyToReceive ? String(grn.pendingQtyToReceive) : (prev.totalQty || ''))),
          declaredTotalMeters: Number(grn?.totalQty || grn?.declaredTotalMeters || grn?.pendingQtyToReceive || prev.declaredTotalMeters || 0),
          totalBales: grn.totalBales || grn.numBales || (initialBales.length > 0 ? String(initialBales.length) : prev.totalBales),
          status: grn.status || prev.status,
          bales: initialBales.length > 0 ? initialBales : prev.bales
        }));

        const isHeaderActuallySaved = Boolean(
          isExisting &&
          !grn.isNew &&
          grn.status === 'Completed'
        );
        if (isHeaderActuallySaved) {
          setIsHeaderEditing(false);
        } else {
          setIsHeaderEditing(true);
        }
      }
    }
  }, [grn, purchaseOrders]);

  // Link to Quality Check and verify if QC inspection has started or if GRN is submitted to QC / completed
  const linkedQCs = (qualityChecks || []).filter((q) => q && (q.grnRef === formData.id || q.grnId === formData.id));
  const linkedQC = linkedQCs[0] || null;

  const isQcActioned = Boolean(
    formData.isQcActioned ||
    formData.isSubmittedToQC ||
    formData.status === 'Completed' ||
    (formData.status && (formData.status.includes('QC') || formData.status === 'Under QC')) ||
    (grn && (grn.status === 'Completed' || grn.isSubmittedToQC || grn.isQcActioned)) ||
    linkedQCs.length > 0 ||
    ['QC Approved', 'QC Rejected', 'QC Passed', 'QC In Progress', 'Pending Admin Approval', 'Completed'].includes(formData.status)
  );

  useEffect(() => {
    if (isQcActioned && isHeaderEditing) {
      setIsHeaderEditing(false);
    }
  }, [isQcActioned, isHeaderEditing]);

  const isLinkedFromPO = Boolean(grn && ((grn.linkedPOs && grn.linkedPOs.length > 0) || grn.poId));

  // Visual save feedback for Section 1 (Receipt details)
  const [isSectionSaved, setIsSectionSaved] = useState(false);

  // Visual save feedback per bale: tracks saved status permanently
  const [savedBaleMap, setSavedBaleMap] = useState(() => {
    const initialMap = {};
    (formData.bales || []).forEach((b, idx) => {
      if (b.isSaved) initialMap[idx] = true;
    });
    return initialMap;
  });

  // Multi-PO selection state (Point 26: Consolidate multiple POs received in same shipment)
  const [showMultiPoPicker, setShowMultiPoPicker] = useState(false);
  const [selectedPoToAdd, setSelectedPoToAdd] = useState('');

  // Collect all linked PO IDs
  const linkedPoIds = (formData.linkedPOs && formData.linkedPOs.length > 0)
    ? formData.linkedPOs
    : (formData.poId && formData.poId !== 'PO-DIRECT' ? [formData.poId] : []);

  // Collect all linked PO objects
  const linkedPOObjects = linkedPoIds
    .map((id) => purchaseOrders.find((p) => p.id === id))
    .filter(Boolean);

  // Current active PO (primary or first linked)
  const currentPO = purchaseOrders.find((p) => p.id === formData.poId) ||
    linkedPOObjects[0] ||
    (isLinkedFromPO ? purchaseOrders.find((p) => p.id === grn?.poId || (grn?.linkedPOs && grn.linkedPOs.includes(p.id))) : null) ||
    null;

  // Ordered meters across ALL linked POs
  const poOrderedMeters = linkedPOObjects.length > 0
    ? linkedPOObjects.reduce((sum, po) => sum + (po.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0), 0)
    : (currentPO && currentPO.items && currentPO.items.length > 0
        ? currentPO.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
        : Number(grn?.poOrderedMeters || 0));

  // Existing previous GRNs for these POs (excluding current GRN being edited)
  const previousGrnsForPo = (grns || []).filter(
    (g) => g && g.id !== formData.id && (
      (g.linkedPOs && g.linkedPOs.some((pId) => linkedPoIds.includes(pId))) ||
      linkedPoIds.includes(g.poId)
    )
  );
  const alreadyReceivedMeters = previousGrnsForPo.reduce(
    (sum, g) => sum + (Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0),
    0
  );
  const poPendingMeters = Math.max(0, poOrderedMeters - alreadyReceivedMeters);

  // Requirement: Once PO is 100% fulfilled (e.g. 2,000m / 2,000m received), NO further GRN can be created!
  const isPoAlreadyCompleted = Boolean(
    !isExisting &&
    currentPO &&
    (currentPO.status === 'Completed' || (poOrderedMeters > 0 && poPendingMeters <= 0))
  );

  // Available POs from same vendor to consolidate into this shipment (exclude completed POs with 0m pending)
  const currentVendorId = formData.vendorId || currentPO?.vendorId || (linkedPOObjects[0]?.vendorId);
  const availableVendorPOs = (eligiblePOs || []).filter((p) => {
    if (!p || !p.id) return false;
    if (linkedPoIds.includes(p.id)) return false;
    if (currentVendorId && p.vendorId && p.vendorId !== currentVendorId) return false;
    const poTotalMtrs = (p.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    const poPrevReceived = (grns || []).filter(g => (Array.isArray(g.linkedPOs) && g.linkedPOs.includes(p.id)) || g.poId === p.id)
      .reduce((s, g) => s + (Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0), 0);
    const poBalPending = Math.max(0, poTotalMtrs - poPrevReceived);
    if (!isExisting && (p.status === 'Completed' || (poTotalMtrs > 0 && poBalPending <= 0))) return false;
    return true;
  });

  // Link another PO to this shipment (Point 26)
  const handleAddLinkedPO = (poIdToAdd) => {
    if (!poIdToAdd) return;
    const addedPO = purchaseOrders.find((p) => p.id === poIdToAdd);
    setFormData((prev) => {
      const cur = prev.linkedPOs && prev.linkedPOs.length > 0 ? prev.linkedPOs : (prev.poId ? [prev.poId] : []);
      if (cur.includes(poIdToAdd)) return prev;
      const nextLinked = [...cur, poIdToAdd];
      return {
        ...prev,
        poId: prev.poId || poIdToAdd,
        linkedPOs: nextLinked,
        vendorId: prev.vendorId || addedPO?.vendorId || '',
        vendorName: prev.vendorName || (addedPO ? getPoVendorName(addedPO) : '')
      };
    });
    setSelectedPoToAdd('');
    showToast(`PO ${poIdToAdd} linked to this shipment!`, 'info');
  };

  // Unlink a PO from this shipment
  const handleUnlinkPO = (poIdToRemove) => {
    setFormData((prev) => {
      const cur = (prev.linkedPOs || []).filter((id) => id !== poIdToRemove);
      return {
        ...prev,
        linkedPOs: cur,
        poId: cur[0] || ''
      };
    });
    showToast(`PO ${poIdToRemove} unlinked from shipment.`, 'info');
  };

  // Build PO item options for bales
  const getPoItemLabel = (item) => {
    if (!item) return 'Fabric Item';
    const name = item.fabricName || item.fabricQuality || 'Fabric';
    const width = item.width ? ` (${item.width}")` : '';
    const color = item.colorName ? ` — ${item.colorName}` : '';
    return `${name}${width}${color}`;
  };

  // Collect line items across all linked POs
  const allLinkedPoItems = [];
  linkedPOObjects.forEach((po) => {
    (po.items || []).forEach((it) => {
      allLinkedPoItems.push({
        ...it,
        poId: po.id,
        label: linkedPOObjects.length > 1 ? `[${po.id}] ${getPoItemLabel(it)}` : getPoItemLabel(it)
      });
    });
  });

  const poItems = allLinkedPoItems.length > 0
    ? allLinkedPoItems
    : (currentPO && currentPO.items && currentPO.items.length > 0 ? currentPO.items : []);

  const poItemLabels = poItems.map((it) => it.label || getPoItemLabel(it));

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

    if (newPoId === 'PO-DIRECT') {
      const defaultV = vendors[0] || {};
      setFormData((prev) => ({
        ...prev,
        poId: 'PO-DIRECT',
        linkedPOs: [],
        vendorId: prev.vendorId || defaultV.id || 'DIRECT',
        vendorName: prev.vendorName || defaultV.name || 'Direct Vendor'
      }));
      return;
    }

    const selectedPO = purchaseOrders.find((p) => p.id === newPoId);
    if (!selectedPO) return;

    const vName = getPoVendorName(selectedPO);

    // Calculate remaining pending balance for the selected PO
    const poTotalM = (selectedPO.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    const prevM = (grns || []).filter(g => (Array.isArray(g.linkedPOs) && g.linkedPOs.includes(selectedPO.id)) || g.poId === selectedPO.id)
      .reduce((s, g) => s + (Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0), 0);
    const pend = Math.max(0, poTotalM - prevM);

    setFormData((prev) => {
      // If bales exist, keep their assignments or update default
      const updatedBales = (prev.bales || []).map((b) => {
        const item = selectedPO.items && selectedPO.items[0];
        return {
          ...b,
          itemIdx: 0,
          fabricItemLabel: b.fabricItemLabel || (item ? getPoItemLabel(item) : defaultFabricLabel),
          isSaved: false
        };
      });

      return {
        ...prev,
        poId: newPoId,
        linkedPOs: [newPoId],
        vendorId: selectedPO.vendorId,
        vendorName: vName,
        totalQty: pend > 0 ? String(pend) : '',
        declaredTotalMeters: pend > 0 ? pend : 0,
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
    if (isPoAlreadyCompleted) {
      showToast(`Purchase Order ${currentPO?.id} is already 100% fulfilled (${poOrderedMeters.toLocaleString()}m received). No further GRN can be created.`, 'warning');
      return;
    }
    if (isQcActioned) {
      showToast('Bales cannot be altered because this GRN is locked.', 'warning');
      return;
    }
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
          isMixedFabric: false,
          piecesCount: '',
          pieces: [],
          totalLength: 0,
          isSaved: false
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
    setSavedBaleMap((prev) => {
      const nextMap = { ...prev };
      delete nextMap[baleIdx];
      return nextMap;
    });
  };

  // Handle Bale Number change
  const handleBaleNoChange = (baleIdx, val) => {
    setFormData((prev) => {
      const updated = [...prev.bales];
      updated[baleIdx] = {
        ...updated[baleIdx],
        baleNo: val,
        isSaved: false
      };
      return { ...prev, bales: updated };
    });
    setSavedBaleMap((prev) => ({ ...prev, [baleIdx]: false }));
  };

  // Handle Bale Fabric Selection change (Supports PO items + all master fabrics + Mixed Bale for Point 27)
  const handleBaleFabricChange = (baleIdx, newFabricLabel) => {
    setFormData((prev) => {
      const updated = [...prev.bales];
      const isMixed = newFabricLabel === 'MIXED_FABRIC';
      const curPieces = updated[baleIdx]?.pieces || [];
      const updatedPieces = curPieces.map((p) => ({
        ...(typeof p === 'object' && p !== null ? p : { pieceNo: 'Pc 1', length: p }),
        fabricQuality: isMixed ? (p.fabricQuality || defaultFabricLabel) : newFabricLabel
      }));

      updated[baleIdx] = {
        ...updated[baleIdx],
        fabricItemLabel: newFabricLabel,
        fabricName: isMixed ? 'Mixed Fabric' : newFabricLabel,
        isMixedFabric: isMixed,
        pieces: updatedPieces,
        isSaved: false
      };
      return { ...prev, bales: updated };
    });
    setSavedBaleMap((prev) => ({ ...prev, [baleIdx]: false }));
  };

  // Handle Piece-level Fabric change (Point 27: single bale containing multiple fabric qualities)
  const handlePieceFabricChange = (baleIdx, pieceIdx, newQuality) => {
    setFormData((prev) => {
      const updated = [...prev.bales];
      const targetBale = { ...updated[baleIdx], isSaved: false };
      const updatedPieces = [...(targetBale.pieces || [])];
      updatedPieces[pieceIdx] = {
        ...(typeof updatedPieces[pieceIdx] === 'object' && updatedPieces[pieceIdx] !== null
          ? updatedPieces[pieceIdx]
          : { pieceNo: `Pc ${pieceIdx + 1}`, length: updatedPieces[pieceIdx] }),
        fabricQuality: newQuality
      };
      targetBale.pieces = updatedPieces;
      updated[baleIdx] = targetBale;
      return { ...prev, bales: updated };
    });
    setSavedBaleMap((prev) => ({ ...prev, [baleIdx]: false }));
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
            length: '',
            fabricQuality: targetBale.isMixedFabric ? defaultFabricLabel : (targetBale.fabricItemLabel || defaultFabricLabel)
          });
        }
      }

      targetBale.piecesCount = newCount;
      targetBale.pieces = nextPieces;
      targetBale.totalLength = nextPieces.reduce((sum, it) => sum + (Number(it.length) || 0), 0);
      targetBale.isSaved = false;
      updatedBales[baleIdx] = targetBale;

      return { ...prev, bales: updatedBales };
    });
    setSavedBaleMap((prev) => ({ ...prev, [baleIdx]: false }));
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
      targetBale.isSaved = false;
      updatedBales[baleIdx] = targetBale;

      return { ...prev, bales: updatedBales };
    });
    setSavedBaleMap((prev) => ({ ...prev, [baleIdx]: false }));
  };

  // Calculate live total meters entered across all pieces in all bales
  const totalMetersEntered = Math.round(
    (formData.bales || []).reduce((sum, b) => sum + (Number(b.totalLength) || 0), 0) * 100
  ) / 100;

  // Declared total meters from header
  const declaredTotal = Number(formData.totalQty || formData.declaredTotalMeters || 0);

  const isMatch = declaredTotal > 0 && Math.abs(totalMetersEntered - declaredTotal) < 0.01;
  const hasBaleEntries = (formData.bales || []).some((b) => (b.pieces || []).length > 0);

  // Live fabric breakdown across all bales (supports mixed bales and multi-PO items)
  const fabricBreakdown = {};
  (formData.bales || []).forEach((b) => {
    if (b.isMixedFabric && b.pieces && b.pieces.length > 0) {
      b.pieces.forEach((p) => {
        const fLabel = p.fabricQuality || defaultFabricLabel;
        const pLen = Number(p.length) || 0;
        if (!fabricBreakdown[fLabel]) {
          fabricBreakdown[fLabel] = { totalMeters: 0, baleCount: 1, pieceCount: 0 };
        }
        fabricBreakdown[fLabel].totalMeters += pLen;
        fabricBreakdown[fLabel].pieceCount += 1;
      });
    } else {
      const fLabel = b.fabricItemLabel || defaultFabricLabel;
      const bLen = Number(b.totalLength) || 0;
      const pCount = (b.pieces || []).length || 0;
      if (!fabricBreakdown[fLabel]) {
        fabricBreakdown[fLabel] = { totalMeters: 0, baleCount: 0, pieceCount: 0 };
      }
      fabricBreakdown[fLabel].totalMeters += bLen;
      fabricBreakdown[fLabel].baleCount += 1;
      fabricBreakdown[fLabel].pieceCount += pCount;
    }
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

  // Point 36: Save This Section (Receipt Details)
  const handleSaveHeaderOnly = () => {
    if (isPoAlreadyCompleted) {
      showToast(`Purchase Order ${currentPO?.id} is already 100% fulfilled (${poOrderedMeters.toLocaleString()}m received). No further GRN can be created.`, 'warning');
      return;
    }
    if (isQcActioned) {
      showToast('Receipt details are locked because this GRN has been submitted to QC.', 'warning');
      return;
    }

    const resolvedPoId = formData.poId || (formData.linkedPOs && formData.linkedPOs[0]) || grn?.poId || (grn?.linkedPOs && grn.linkedPOs[0]) || currentPO?.id || (eligiblePOs[0]?.id) || 'PO-DIRECT';

    const selectedPO = purchaseOrders.find((p) => p.id === resolvedPoId) || currentPO;
    const firstPoItem = selectedPO?.items?.[0];
    const fabricItem = firstPoItem
      ? firstPoItem.fabricName || firstPoItem.fabricQuality
      : (formData.fabricName || (fabrics[0]?.qualityName || 'Fabric'));
    const colorVal = firstPoItem?.colorName || firstPoItem?.color || formData.colorName || 'Natural';
    const colorHexVal = firstPoItem?.colorHex || formData.colorHex || '#ffffff';
    const fabricIdVal = firstPoItem?.fabricId || formData.fabricId || '';
    const widthVal = firstPoItem?.width || formData.width || '44';
    const vName = formData.vendorName || (selectedPO ? getPoVendorName(selectedPO) : (grn?.vendorName || vendors[0]?.name || 'Direct Vendor'));
    const vId = formData.vendorId || selectedPO?.vendorId || grn?.vendorId || vendors[0]?.id || 'V-DIRECT';

    const currentBales = formData.bales || [];

    const payload = {
      ...formData,
      poId: resolvedPoId,
      linkedPOs: formData.linkedPOs && formData.linkedPOs.length > 0 ? formData.linkedPOs : (resolvedPoId && resolvedPoId !== 'PO-DIRECT' ? [resolvedPoId] : []),
      vendorId: vId,
      vendorName: vName,
      status: formData.status === 'Completed' ? 'Completed' : 'Header Saved',
      isHeaderSaved: true,
      isNew: false,
      date: formData.receivedDate || new Date().toISOString().split('T')[0],
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

    setIsSectionSaved(true);
    // Transition Section 1 to saved summary view mode as per Section 13.3
    setIsHeaderEditing(false);

    if (onSaveGRN) {
      try {
        onSaveGRN(payload, false);
      } catch (err) {
        console.warn('Error saving GRN header:', err);
      }
    }
    showToast('Receipt details saved successfully! Click "Edit" anytime to modify.', 'success');
  };

  // Point 36: Save an individual bale record or all bales
  const handleSaveAllBales = (specificBaleIdx = null) => {
    if (isPoAlreadyCompleted) {
      showToast(`Purchase Order ${currentPO?.id} is already 100% fulfilled (${poOrderedMeters.toLocaleString()}m received). No further GRN can be created.`, 'warning');
      return;
    }
    if (isQcActioned) {
      showToast('Bale entries are locked because this GRN has been submitted to QC.', 'warning');
      return;
    }
    const resolvedPoId = formData.poId || (formData.linkedPOs && formData.linkedPOs[0]) || grn?.poId || (grn?.linkedPOs && grn.linkedPOs[0]) || currentPO?.id || (eligiblePOs[0]?.id) || 'PO-DIRECT';

    const selectedPO = purchaseOrders.find((p) => p.id === resolvedPoId) || currentPO;
    const firstPoItem = selectedPO?.items?.[0];
    const fabricItem = firstPoItem
      ? firstPoItem.fabricName || firstPoItem.fabricQuality
      : (formData.fabricName || (fabrics[0]?.qualityName || 'Fabric'));
    const colorVal = firstPoItem?.colorName || firstPoItem?.color || formData.colorName || 'Natural';
    const colorHexVal = firstPoItem?.colorHex || formData.colorHex || '#ffffff';
    const fabricIdVal = firstPoItem?.fabricId || formData.fabricId || '';
    const widthVal = firstPoItem?.width || formData.width || '44';
    const vName = formData.vendorName || (selectedPO ? getPoVendorName(selectedPO) : (grn?.vendorName || vendors[0]?.name || 'Direct Vendor'));
    const vId = formData.vendorId || selectedPO?.vendorId || grn?.vendorId || vendors[0]?.id || 'V-DIRECT';

    // Normalize bales and mark target bale(s) as saved
    const isSingle = specificBaleIdx !== null && specificBaleIdx !== undefined;

    const normalizedBales = (formData.bales || []).map((b, idx) => {
      const rawPieces = b.pieces || [];
      const normPieces = rawPieces.map((p, pIdx) => {
        if (typeof p === 'object' && p !== null) {
          return {
            pieceNo: p.pieceNo || `Pc ${pIdx + 1}`,
            length: p.length !== undefined && p.length !== null ? p.length : '',
            fabricQuality: p.fabricQuality || b.fabricItemLabel || fabricItem
          };
        }
        return {
          pieceNo: `Pc ${pIdx + 1}`,
          length: p !== undefined && p !== null ? p : '',
          fabricQuality: b.fabricItemLabel || fabricItem
        };
      });
      const bTotal = normPieces.reduce((s, p) => s + (Number(p.length) || 0), 0);
      const isTarget = isSingle ? (idx === specificBaleIdx) : true;
      return {
        ...b,
        baleNo: b.baleNo !== undefined ? String(b.baleNo) : String(idx + 1),
        pieces: normPieces,
        totalLength: bTotal,
        piecesCount: b.piecesCount !== undefined && b.piecesCount !== '' ? String(b.piecesCount) : String(normPieces.length),
        isSaved: isTarget ? true : Boolean(b.isSaved)
      };
    });

    const liveTotalMeters = Math.round(
      normalizedBales.reduce((sum, b) => sum + (Number(b.totalLength) || 0), 0) * 100
    ) / 100;

    const payload = {
      ...formData,
      poId: resolvedPoId,
      linkedPOs: formData.linkedPOs && formData.linkedPOs.length > 0 ? formData.linkedPOs : (resolvedPoId && resolvedPoId !== 'PO-DIRECT' ? [resolvedPoId] : []),
      vendorId: vId,
      vendorName: vName,
      status: formData.status === 'Completed' ? 'Completed' : 'Bale Entry in Progress',
      date: formData.receivedDate || new Date().toISOString().split('T')[0],
      fabricName: fabricItem,
      fabricId: fabricIdVal,
      colorName: colorVal,
      colorHex: colorHexVal,
      width: widthVal,
      declaredTotalMeters: declaredTotal,
      totalQty: formData.totalQty !== undefined && formData.totalQty !== '' ? formData.totalQty : (declaredTotal ? String(declaredTotal) : ''),
      lrNumber: formData.lrNo || formData.lrNumber || '',
      lrNo: formData.lrNo || formData.lrNumber || '',
      totalMetersEntered: liveTotalMeters,
      bales: normalizedBales
    };

    setFormData((prev) => ({
      ...prev,
      ...payload
    }));

    if (isSingle) {
      setSavedBaleMap((prev) => ({ ...prev, [specificBaleIdx]: true }));
    } else {
      const newMap = {};
      normalizedBales.forEach((_, idx) => {
        newMap[idx] = true;
      });
      setSavedBaleMap(newMap);
    }

    if (onSaveGRN) {
      try {
        onSaveGRN(payload, false);
      } catch (err) {
        console.warn('Error saving GRN bale record:', err);
      }
    }

    if (isSingle) {
      const targetBale = normalizedBales[specificBaleIdx];
      const bNo = targetBale?.baleNo || (specificBaleIdx + 1);
      const pLen = (targetBale?.pieces || []).length;
      const bTot = targetBale?.totalLength || 0;
      showToast(`Bale ${bNo} saved successfully! (${pLen} piece${pLen === 1 ? '' : 's'}, ${bTot}m entered)`, 'success');
    } else {
      const totalCount = normalizedBales.length;
      const configuredCount = normalizedBales.filter((b) => (b.pieces || []).length > 0 && Number(b.totalLength) > 0).length;
      showToast(`All ${totalCount} Bales saved successfully! (${configuredCount} configured, ${liveTotalMeters}m entered)`, 'success');
    }
  };

  // Point 36: Alias for saving an individual bale record
  const handleSaveSingleBale = (bIdx) => handleSaveAllBales(bIdx);

  // Complete / Submit GRN to QC
  const handleCompleteGRN = () => {
    if (isPoAlreadyCompleted) {
      showToast(`Purchase Order ${currentPO?.id} is already 100% fulfilled (${poOrderedMeters.toLocaleString()}m received). No further GRN can be created.`, 'warning');
      return;
    }
    if (isQcActioned) {
      showToast('This GRN is already completed and submitted to Quality Check (QC).', 'warning');
      return;
    }
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
      isSubmittedToQC: true,
      isQcActioned: true,
      isHeaderSaved: true,
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

    setFormData((prev) => ({
      ...prev,
      status: 'Completed',
      isSubmittedToQC: true,
      isQcActioned: true,
      isHeaderSaved: true
    }));
    setIsHeaderEditing(false);

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

      {/* QC ACTIONED / SUBMITTED LOCK BANNER */}
      {isQcActioned ? (
        <div className="alert alert-warning border border-warning d-flex align-items-center gap-3 rounded-3 shadow-sm mb-4 py-3 bg-warning-subtle text-dark">
          <i className="ti ti-lock fs-24 text-warning"></i>
          <div className="flex-grow-1">
            <div className="fw-bold fs-14">
              GRN Locked — Submitted to Quality Check ({linkedQC ? (linkedQC.qcStatus || 'Pending') : (formData.status || 'Completed')})
            </div>
            <div className="fs-12 text-secondary">
              This shipment has been submitted to Quality Check (QC). Bale entries, piece quantities, and inward receipt details are locked and cannot be edited.
            </div>
          </div>
          <span className="badge bg-warning text-dark px-3 py-1.5 rounded-pill fs-12 fw-semibold">
            Locked (Non-editable)
          </span>
        </div>
      ) : null}

      {/* PO ALREADY FULLY RECEIVED LOCK BANNER */}
      {isPoAlreadyCompleted ? (
        <div className="alert alert-danger border border-danger d-flex align-items-center gap-3 rounded-3 shadow-sm mb-4 py-3 bg-danger-subtle text-danger-emphasis">
          <i className="ti ti-ban fs-28 text-danger flex-shrink-0"></i>
          <div className="flex-grow-1">
            <div className="fw-bold fs-15 text-danger">
              ⛔ Purchase Order Fully Received (0m Pending)
            </div>
            <div className="fs-13 text-secondary mt-0.5">
              All <strong>{poOrderedMeters.toLocaleString()} meters</strong> for Purchase Order <strong>{currentPO?.id}</strong> have already arrived and been received across {previousGrnsForPo.length} previous GRN(s). No further GRN can be created for this completed Purchase Order.
            </div>
            {previousGrnsForPo.length > 0 && (
              <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                <span className="fs-12 text-muted fw-medium">Completed Inward Deliveries:</span>
                {previousGrnsForPo.map((g) => (
                  <span key={g.id} className="badge bg-white text-dark border px-2.5 py-1 fs-12 rounded-2 shadow-xs fw-semibold">
                    <i className="ti ti-check text-success me-1"></i>
                    {g.id}: {(Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0).toLocaleString()}m
                  </span>
                ))}
              </div>
            )}
          </div>
          <span className="badge bg-danger text-white px-3 py-1.5 rounded-pill fs-12 fw-semibold">
            Locked (Fulfilled)
          </span>
        </div>
      ) : null}

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
              <span className="badge bg-light text-secondary border px-2.5 py-1 fs-11 rounded-3 d-inline-flex align-items-center gap-1">
                <i className="ti ti-lock text-warning"></i>
                <span>Locked (Submitted to QC &mdash; Non-editable)</span>
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
              <div className="fw-bold text-dark fs-13 text-truncate" title={formData.linkedPOs && formData.linkedPOs.length > 1 ? formData.linkedPOs.join(', ') : formData.poId}>
                {formData.linkedPOs && formData.linkedPOs.length > 1
                  ? formData.linkedPOs.join(', ')
                  : (formData.poId || '—')}
              </div>
              {formData.linkedPOs && formData.linkedPOs.length > 1 && (
                <div className="text-primary fs-11 fw-semibold">
                  {formData.linkedPOs.length} POs Consolidated
                </div>
              )}
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
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <label className="form-label fs-13 fw-semibold text-secondary mb-0">
                    Source document (Purchase Order) <span className="text-danger">*</span>
                  </label>
                  {!isQcActioned && (formData.poId || (formData.linkedPOs && formData.linkedPOs.length > 0)) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-primary text-decoration-none fs-12 fw-semibold d-inline-flex align-items-center gap-1"
                      onClick={() => setShowMultiPoPicker(!showMultiPoPicker)}
                    >
                      <i className="ti ti-link"></i>
                      <span>{showMultiPoPicker ? 'Hide Multi-PO Controls' : '+ Link Multiple POs (Consolidated Shipment)'}</span>
                    </button>
                  )}
                </div>

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
                      <i className="ti ti-lock me-1 text-muted"></i> Primary PO
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
                    <option value="PO-DIRECT">Direct Inward (Without PO)</option>
                    {eligiblePOs.map((po) => {
                      const vName = getPoVendorName(po);
                      const poTotalMtrs = (po.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
                      const poPrevReceived = (grns || []).filter(g => (Array.isArray(g.linkedPOs) && g.linkedPOs.includes(po.id)) || g.poId === po.id)
                        .reduce((s, g) => s + (Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0), 0);
                      const poBalPending = Math.max(0, poTotalMtrs - poPrevReceived);
                      const isPoFull = po.status === 'Completed' || (poTotalMtrs > 0 && poBalPending <= 0);

                      return (
                        <option
                          key={po.id}
                          value={po.id}
                          disabled={!isExisting && isPoFull}
                          style={{ color: isPoFull ? '#94a3b8' : '#1e293b' }}
                        >
                          {po.id} — {vName || 'Vendor'} {isPoFull
                            ? `[Fully Received: Complete — 0m Pending]`
                            : `[${poBalPending.toLocaleString()}m Pending / ${poTotalMtrs.toLocaleString()}m Ordered]`}
                        </option>
                      );
                    })}
                  </select>
                )}

                {/* Point 26: Multi-PO Linking Banner and Tag List */}
                {formData.linkedPOs && formData.linkedPOs.length > 1 && (
                  <div className="p-2.5 rounded-3 bg-light border border-primary border-opacity-25 mt-2 shadow-xs">
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                      <span className="fs-12 fw-bold text-primary d-flex align-items-center gap-1.5">
                        <i className="ti ti-layers-intersect"></i>
                        Multiple POs Consolidated in Shipment ({formData.linkedPOs.length} POs):
                      </span>
                      <span className="badge bg-primary text-white fs-11 rounded-pill">
                        Total Ordered: {totalLinkedOrderedMeters.toLocaleString()}m
                      </span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {formData.linkedPOs.map((poId) => {
                        const poObj = purchaseOrders.find((p) => p.id === poId);
                        const poMtrs = (poObj?.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
                        return (
                          <span key={poId} className="badge bg-white text-dark border px-2.5 py-1.5 rounded-3 fs-12 d-inline-flex align-items-center gap-2 shadow-xs">
                            <span className="fw-bold text-primary">{poId}</span>
                            <span className="text-muted">({poMtrs}m)</span>
                            {!isQcActioned && formData.linkedPOs.length > 1 && (
                              <i
                                className="ti ti-x text-danger cursor-pointer"
                                title={`Unlink ${poId}`}
                                onClick={() => handleUnlinkPO(poId)}
                              ></i>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Point 26: Add another PO picker dropdown */}
                {showMultiPoPicker && !isQcActioned && (
                  <div className="p-3 bg-white border rounded-3 mt-2 shadow-xs">
                    <label className="form-label fs-12 fw-semibold text-dark mb-1">
                      Link another PO from {formData.vendorName || 'same vendor'} to this delivery:
                    </label>
                    <div className="d-flex align-items-center gap-2">
                      <select
                        className="form-select fs-13"
                        style={{ height: '38px', borderRadius: '8px' }}
                        value={selectedPoToAdd}
                        onChange={(e) => setSelectedPoToAdd(e.target.value)}
                      >
                        <option value="">-- Select PO to consolidate --</option>
                        {availableVendorPOs.map((p) => {
                          const mtrs = (p.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
                          return (
                            <option key={p.id} value={p.id}>
                              {p.id} — {p.date} ({mtrs}m ordered, status: {p.status})
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm px-3 fw-semibold text-white d-inline-flex align-items-center gap-1 flex-shrink-0"
                        style={{ height: '38px', borderRadius: '8px', backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                        disabled={!selectedPoToAdd}
                        onClick={() => handleAddLinkedPO(selectedPoToAdd)}
                      >
                        <i className="ti ti-plus"></i>
                        <span>Link PO</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Multi-Installment PO Delivery Progress Card */}
                {currentPO && poOrderedMeters > 0 && (
                  <div
                    className="p-3 rounded-3 border mt-2.5 shadow-xs"
                    style={{
                      backgroundColor: isPoAlreadyCompleted ? '#fef2f2' : (alreadyReceivedMeters > 0 ? '#f0fdf4' : '#f8fafc'),
                      borderColor: isPoAlreadyCompleted ? '#fca5a5' : (alreadyReceivedMeters > 0 ? '#bbf7d0' : '#e2e8f0')
                    }}
                  >
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <i className={`ti ${isPoAlreadyCompleted ? 'ti-circle-check text-success' : 'ti-truck-delivery text-primary'} fs-17`}></i>
                        <span className="fs-13 fw-bold text-dark">
                          PO Delivery Status: {currentPO.id}
                        </span>
                      </div>
                      <span className={`badge px-2.5 py-1 rounded-pill fs-11 fw-semibold ${
                        isPoAlreadyCompleted
                          ? 'bg-success text-white'
                          : alreadyReceivedMeters > 0
                            ? 'bg-primary text-white'
                            : 'bg-secondary text-white'
                      }`}>
                        {isPoAlreadyCompleted
                          ? '100% Fulfilled (Complete)'
                          : alreadyReceivedMeters > 0
                            ? `Multi-Installment (${Math.round((alreadyReceivedMeters / poOrderedMeters) * 100)}% Received)`
                            : 'Initial Delivery'}
                      </span>
                    </div>

                    <div className="row g-2 text-center fs-12 mb-2">
                      <div className="col-4">
                        <div className="p-2 rounded bg-white border">
                          <div className="text-muted fs-11">Total Ordered</div>
                          <div className="fw-bold text-dark fs-13">{poOrderedMeters.toLocaleString()} m</div>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 rounded bg-white border">
                          <div className="text-muted fs-11">Previously Received</div>
                          <div className="fw-bold text-success fs-13">{alreadyReceivedMeters.toLocaleString()} m</div>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 rounded bg-white border">
                          <div className="text-muted fs-11">Remaining Pending</div>
                          <div className={`fw-bold fs-13 ${poPendingMeters > 0 ? 'text-primary' : 'text-secondary'}`}>
                            {poPendingMeters.toLocaleString()} m
                          </div>
                        </div>
                      </div>
                    </div>

                    {previousGrnsForPo.length > 0 && (
                      <div className="d-flex flex-wrap align-items-center gap-1.5 pt-1 border-top border-light-subtle fs-12">
                        <span className="text-muted fs-11">Previous GRNs:</span>
                        {previousGrnsForPo.map((g) => (
                          <span key={g.id} className="badge bg-white text-secondary border px-2 py-0.5 fs-11 rounded-pill">
                            {g.id}: {(Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0).toLocaleString()}m
                          </span>
                        ))}
                      </div>
                    )}

                    {!isPoAlreadyCompleted && poPendingMeters > 0 && (
                      <div className="text-muted fs-11 mt-1.5 d-flex align-items-center gap-1">
                        <i className="ti ti-info-circle text-primary"></i>
                        <span>
                          Multiple GRNs are supported for partial shipments. Once all {poOrderedMeters.toLocaleString()}m have arrived, no further GRN can be created.
                        </span>
                      </div>
                    )}
                  </div>
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
                             }
                  }}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2 px-3 fw-semibold fs-13 text-white shadow-sm"
                style={{
                  height: '40px',
                  backgroundColor: (isQcActioned || isPoAlreadyCompleted) ? '#94a3b8' : '#5b47fb',
                  borderColor: (isQcActioned || isPoAlreadyCompleted) ? '#94a3b8' : '#5b47fb',
                  borderRadius: '8px',
                  cursor: (isQcActioned || isPoAlreadyCompleted) ? 'not-allowed' : 'pointer'
                }}
                disabled={isQcActioned || isPoAlreadyCompleted}
                onClick={handleGenerateBales}
                title={isPoAlreadyCompleted ? 'PO is fully received (0m pending)' : (isQcActioned ? 'Bale entries are locked because QC has already started' : 'Generate container bales')}
              >
                <i className={`ti ${(isQcActioned || isPoAlreadyCompleted) ? 'ti-lock' : 'ti-package'} fs-15`}></i>
                <span>Generate Bales</span>
              </button>

              <button
                type="button"
                className={`btn d-inline-flex align-items-center justify-content-center gap-2 px-3 fw-medium fs-13 shadow-sm ${
                  isSectionSaved ? 'btn-success text-white' : 'btn-white border text-dark'
                }`}
                style={{
                  height: '40px',
                  borderColor: isSectionSaved ? '#10b981' : '#cbd5e1',
                  borderRadius: '8px',
                  backgroundColor: (isQcActioned || isPoAlreadyCompleted) ? '#f1f5f9' : (isSectionSaved ? '#10b981' : '#ffffff'),
                  cursor: (isQcActioned || isPoAlreadyCompleted) ? 'not-allowed' : 'pointer',
                  opacity: (isQcActioned || isPoAlreadyCompleted) ? 0.6 : 1,
                  transition: 'all 0.2s ease-in-out'
                }}
                disabled={isQcActioned || isPoAlreadyCompleted}
                onClick={handleSaveHeaderOnly}
                title={isPoAlreadyCompleted ? 'PO is fully received (0m pending)' : (isQcActioned ? 'Receipt details are locked because Quality Check has started' : 'Save Receipt Details header')}
              >
                <i className={`ti ${isSectionSaved ? 'ti-check' : 'ti-device-floppy'} fs-15`} style={{ color: isSectionSaved ? '#ffffff' : ((isQcActioned || isPoAlreadyCompleted) ? '#94a3b8' : '#5b47fb') }}></i>
                <span>{isSectionSaved ? 'Section Saved' : 'Save This Section'}</span>
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
              {!isQcActioned && !isPoAlreadyCompleted && (
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
                      {/* Point 36: Persistent Saved badge for individual bale */}
                      {(savedBaleMap[bIdx] || bale.isSaved) && (
                        <span
                          className="badge bg-success-subtle text-success border border-success border-opacity-25 px-2.5 py-1 fs-11 rounded-pill fw-semibold d-inline-flex align-items-center gap-1"
                        >
                          <i className="ti ti-check fs-12"></i>
                          <span>Saved</span>
                        </span>
                      )}
                    </div>

                    {!isQcActioned && !isPoAlreadyCompleted && (
                      <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                        {/* Point 36: Individual Bale Save Button with persistent Saved state */}
                        <button
                          type="button"
                          className="btn btn-sm text-white rounded-2 px-3.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
                          style={{
                            backgroundColor: (savedBaleMap[bIdx] || bale.isSaved) ? '#10b981' : '#7c3aed',
                            borderColor: (savedBaleMap[bIdx] || bale.isSaved) ? '#10b981' : '#7c3aed',
                            fontSize: '12.5px',
                            transition: 'all 0.2s ease-in-out'
                          }}
                          onClick={() => handleSaveSingleBale(bIdx)}
                          title={`Save Bale ${bale.baleNo || bIdx + 1}`}
                        >
                          <i className={`ti ${(savedBaleMap[bIdx] || bale.isSaved) ? 'ti-check' : 'ti-device-floppy'}`} style={{ fontSize: '15px' }}></i>
                          <span>{(savedBaleMap[bIdx] || bale.isSaved) ? 'Saved' : 'Save'}</span>
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

                      {/* Fabric Item - Supports single fabric or Point 27: Mixed Fabric Bale */}
                      <div className="col-12 col-sm-6 col-md-7 flex-grow-1">
                        <label className="form-label fs-12 fw-semibold text-secondary mb-1.5">
                          Fabric Item / Quality <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select bg-white fs-13 px-3"
                          style={{ height: '40px', borderColor: '#cbd5e1', borderRadius: '8px' }}
                          value={bale.isMixedFabric ? 'MIXED_FABRIC' : (bale.fabricItemLabel || poItemLabels[0] || defaultFabricLabel)}
                          disabled={isQcActioned}
                          onChange={(e) => handleBaleFabricChange(bIdx, e.target.value)}
                        >
                          <option value="MIXED_FABRIC" className="fw-bold text-primary">
                            🔀 Mixed Bale (Multiple Fabric Qualities)
                          </option>
                          {poItemLabels.length > 0 && (
                            <optgroup label="From Linked Purchase Orders">
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
                          {(bale.pieces || []).length} Piece{(bale.pieces || []).length !== 1 ? 's' : ''} configured {bale.isMixedFabric ? '(Mixed Qualities Enabled)' : ''}
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
                            const pFabric = piece.fabricQuality || poItemLabels[0] || masterFabricLabels[0] || defaultFabricLabel;
                            return (
                              <div
                                key={pIdx}
                                className="bg-white p-2.5 rounded-2 border shadow-none"
                                style={{ width: bale.isMixedFabric ? '210px' : '115px', borderColor: '#e2e8f0' }}
                              >
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                  <label className="d-block fs-11 fw-semibold text-secondary text-center mb-0">
                                    Pc {pIdx + 1} (m)
                                  </label>
                                  {bale.isMixedFabric && (
                                    <span className="badge bg-light text-secondary border px-1.5 py-0.5 fs-10 rounded">
                                      Quality
                                    </span>
                                  )}
                                </div>
                                {bale.isMixedFabric && (
                                  <select
                                    className="form-select form-select-sm bg-white fs-11 px-2 mb-1.5"
                                    style={{ height: '30px', borderColor: '#cbd5e1', borderRadius: '6px' }}
                                    value={pFabric}
                                    disabled={isQcActioned}
                                    onChange={(e) => handlePieceFabricChange(bIdx, pIdx, e.target.value)}
                                  >
                                    {poItemLabels.map((lbl, oIdx) => (
                                      <option key={`p-po-${oIdx}`} value={lbl}>{lbl}</option>
                                    ))}
                                    {masterFabricLabels.map((lbl, fIdx) => (
                                      <option key={`p-mf-${fIdx}`} value={lbl}>{lbl}</option>
                                    ))}
                                  </select>
                                )}
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
                        {bale.isMixedFabric ? (
                          <span className="badge bg-purple-subtle text-purple border px-2.5 py-1 rounded-pill fs-11 fw-semibold">
                            Mixed Bale (Multiple Fabric Qualities)
                          </span>
                        ) : (
                          <span className="text-secondary text-truncate">
                            Assigned: <strong className="text-dark">{bale.fabricItemLabel || currentFabricLabel}</strong>
                          </span>
                        )}
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
            <span>This shipment is locked because it has been submitted to Quality Check (Non-editable).</span>
          </div>
        </div>
      ) : isPoAlreadyCompleted ? (
        <div className="d-flex flex-wrap align-items-center gap-3 pt-1 mb-5">
          <span className="badge bg-danger text-white px-3.5 py-2.5 fs-13 rounded-3 d-inline-flex align-items-center gap-2 shadow-xs fw-semibold">
            <i className="ti ti-ban fs-17"></i>
            <span>Purchase Order Fully Received (0m Pending) — GRN Creation Blocked</span>
          </span>
          <button
            type="button"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-4 py-2 fw-medium fs-13 shadow-sm bg-white"
            style={{
              borderColor: '#cbd5e1',
              borderRadius: '8px',
              height: '42px'
            }}
            onClick={handleCancel}
          >
            <i className="ti ti-arrow-left fs-15"></i>
            <span>Back to Procurement</span>
          </button>
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
