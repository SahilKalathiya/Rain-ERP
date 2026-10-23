import React, { useState } from 'react';

/**
 * QualityCheckForm - 6.0 Quality Check (QC) Module
 * Handles: Auto-generated from GRN, Scope (Whole Shipment / Bale / Piece),
 * Persistent expected width & fold notes, Photo attachment (File / Camera simulation),
 * 3-way status outcome: OK, Send for Admin Approval, Reject.
 */
export default function QualityCheckForm({
  qc,
  grns = [],
  purchaseOrders = [],
  fabrics = [],
  currentUser = { name: '', role: 'Quality Inspector' },
  onBack,
  onSaveQC,
  onNavigateToStockPool,
  onNavigateToGRN
}) {
  const isExisting = Boolean(qc && qc.id);
  const [successModalData, setSuccessModalData] = useState(null);

  // Helper to resolve expected Fold & Width from GRN's linked POs
  const getExpectedFromGRN = (grnId) => {
    const foundGRN = grns.find((g) => g.id === grnId);
    if (!foundGRN) return { fold: '100', width: '44' };

    let foundFold = null;
    let foundWidth = null;

    if (foundGRN.linkedPOs && foundGRN.linkedPOs.length > 0) {
      const linkedPO = purchaseOrders.find((p) => foundGRN.linkedPOs.includes(p.id));
      if (linkedPO && linkedPO.items && linkedPO.items.length > 0) {
        const item = linkedPO.items[0];
        if (item.fold) foundFold = String(item.fold);
        if (item.width) foundWidth = String(item.width);
      }
    }

    if (!foundWidth && foundGRN.fabricName) {
      const matchingFabric = fabrics.find((f) => f.qualityName === foundGRN.fabricName);
      if (matchingFabric && matchingFabric.pannaWidth) {
        foundWidth = String(matchingFabric.pannaWidth);
      }
    }

    if (!foundWidth && foundGRN.pannaWidth) {
      foundWidth = String(foundGRN.pannaWidth);
    }

    if (!foundFold && foundGRN.fabricFolding) {
      foundFold = String(foundGRN.fabricFolding);
    }

    return {
      fold: foundFold || '100',
      width: foundWidth || '44'
    };
  };

  const initialGrnId = qc?.grnRef || grns[0]?.id || 'GRN-0001';
  const initialExpected = getExpectedFromGRN(initialGrnId);

  const [formData, setFormData] = useState({
    id: qc?.id || `QC-${String(Math.floor(1000 + Math.random() * 9000))}`,
    grnRef: initialGrnId,
    inspectionScope: qc?.inspectionScope || 'Whole Shipment', // Whole Shipment / Bale-Level / Piece-Level
    baleRef: qc?.baleRef || 'Bale 01',
    pieceRef: qc?.pieceRef || 'Piece 01',
    inspectorName: (qc?.inspectorName && qc.inspectorName !== 'Saksham Garg') ? qc.inspectorName : (currentUser.name && currentUser.name !== 'Saksham Garg' ? currentUser.name : ''),
    expectedWidth: qc?.expectedWidth || initialExpected.width,
    actualWidth: qc?.actualWidth !== undefined && qc?.actualWidth !== null ? String(qc.actualWidth) : '',
    expectedFold: qc?.expectedFold || initialExpected.fold,
    actualFold: qc?.actualFold !== undefined && qc?.actualFold !== null ? String(qc.actualFold) : '',
    photos: qc?.photos || [],
    notes: (qc?.notes && !qc.notes.startsWith('Quality inspection generated')) ? qc.notes : '',
    defectPieces: qc?.defectPieces || '',
    defectQty: qc?.defectQty || '',
    defectReason: qc?.defectReason || '',
    qcStatus: qc?.qcStatus || 'OK', // OK / Send for Admin Approval / Reject
    adminDecision: qc?.adminDecision || '', // Approve / Reject
    adminRemarks: qc?.adminRemarks || '',
    dateTime: qc?.dateTime || new Date().toLocaleString('en-GB')
  });

  const [pieceInspections, setPieceInspections] = useState(qc?.pieceInspections || {});
  const [toastNotification, setToastNotification] = useState(null);

  // Dropdown states for Bale / Piece-level inspection (Requirement 24)
  const [selectedBaleFilter, setSelectedBaleFilter] = useState('all');
  const [selectedPieceKey, setSelectedPieceKey] = useState('');
  const [inspectionScope, setInspectionScope] = useState('all');

  const showToast = (message, type = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 3200);
  };

  React.useEffect(() => {
    if (qc && qc.id) {
      const exp = getExpectedFromGRN(qc.grnRef);
      setFormData({
        id: qc.id,
        grnRef: qc.grnRef,
        inspectionScope: qc.inspectionScope || 'Whole Shipment',
        baleRef: qc.baleRef || 'Bale 01',
        pieceRef: qc.pieceRef || 'Piece 01',
        inspectorName: (qc.inspectorName && qc.inspectorName !== 'Saksham Garg') ? qc.inspectorName : '',
        expectedWidth: qc.expectedWidth || exp.width,
        actualWidth: qc.actualWidth !== undefined && qc.actualWidth !== null ? String(qc.actualWidth) : '',
        expectedFold: qc.expectedFold || exp.fold,
        actualFold: qc.actualFold !== undefined && qc.actualFold !== null ? String(qc.actualFold) : '',
        photos: qc.photos || [],
        notes: (qc.notes && !qc.notes.startsWith('Quality inspection generated')) ? qc.notes : '',
        defectPieces: qc.defectPieces || '',
        defectQty: qc.defectQty || '',
        defectReason: qc.defectReason || '',
        qcStatus: qc.qcStatus || 'OK',
        adminDecision: qc.adminDecision || '',
        adminRemarks: qc.adminRemarks || '',
        dateTime: qc.dateTime || new Date().toLocaleString('en-GB')
      });
      if (qc.pieceInspections) {
        setPieceInspections(qc.pieceInspections);
      }
    } else {
      const exp = getExpectedFromGRN(initialGrnId);
      setFormData((prev) => ({
        ...prev,
        grnRef: initialGrnId,
        expectedWidth: exp.width,
        actualWidth: '',
        expectedFold: exp.fold,
        actualFold: ''
      }));
    }
  }, [qc, purchaseOrders, grns]);

  const handleGRNChange = (newGrnId) => {
    const expected = getExpectedFromGRN(newGrnId);
    setFormData((prev) => ({
      ...prev,
      grnRef: newGrnId,
      expectedWidth: expected.width,
      actualWidth: '',
      expectedFold: expected.fold,
      actualFold: ''
    }));
  };

  const selectedGRN = grns.find((g) => g.id === formData.grnRef) || grns[0];

  // Extract all physical pieces from selected GRN bales
  const grnPieces = [];
  (selectedGRN?.bales || []).forEach((b, bIdx) => {
    (b.pieces || []).forEach((p, pIdx) => {
      const m = typeof p === 'object' && p !== null ? (p.length || 0) : Number(p) || 0;
      grnPieces.push({
        key: `${bIdx}_${pIdx}`,
        baleIdx: bIdx,
        pieceIdx: pIdx,
        baleNo: b.baleNo || `${bIdx + 1}`,
        pieceNo: (typeof p === 'object' && p?.pieceNo) ? p.pieceNo : `Piece ${pIdx + 1}`,
        meters: m
      });
    });
  });

  // Unique bale numbers for dropdown selection (Requirement 24)
  const uniqueBaleNumbers = Array.from(new Set(grnPieces.map((p) => String(p.baleNo)))).sort((a, b) => Number(a) - Number(b));

  // Filtered pieces based on dropdown option (Requirement 24)
  const displayedPieces = grnPieces.filter((pc) => {
    if (selectedBaleFilter !== 'all' && String(pc.baleNo) !== String(selectedBaleFilter)) {
      return false;
    }
    if (selectedPieceKey && pc.key !== selectedPieceKey) {
      return false;
    }
    return true;
  });

  const updatePieceField = (key, field, val) => {
    setPieceInspections((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {
          checked: true,
          actualWidth: formData.actualWidth || formData.expectedWidth,
          actualFold: formData.actualFold || formData.expectedFold,
          status: 'OK',
          notes: '',
          photos: []
        }),
        [field]: val
      }
    }));
  };

  const handlePiecePhotoUpload = (key, e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      time: new Date().toLocaleTimeString()
    }));
    setPieceInspections((prev) => {
      const cur = prev[key] || { photos: [] };
      return {
        ...prev,
        [key]: {
          ...cur,
          photos: [...(cur.photos || []), ...newPhotos]
        }
      };
    });
  };

  const handlePieceSimulateCamera = (key) => {
    const mockCameraPhoto = {
      name: `Piece_Capture_${Date.now()}.jpg`,
      url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',
      time: new Date().toLocaleTimeString()
    };
    setPieceInspections((prev) => {
      const cur = prev[key] || { photos: [] };
      return {
        ...prev,
        [key]: {
          ...cur,
          photos: [...(cur.photos || []), mockCameraPhoto]
        }
      };
    });
    showToast('Piece snapshot captured and attached!', 'success');
  };

  // Handle Photo upload simulation
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      time: new Date().toLocaleTimeString()
    }));
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
  };

  // Open Camera simulation
  const handleSimulateCamera = () => {
    const mockCameraPhoto = {
      name: `Camera_Capture_${Date.now()}.jpg`,
      url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',
      time: new Date().toLocaleTimeString()
    };
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, mockCameraPhoto]
    }));
    showToast('Camera snapshot captured and attached to QC record!', 'success');
  };

  // Calculation of Piece Split & Quality Quantities
  const inspectedList = Object.entries(pieceInspections)
    .filter(([_, d]) => d.checked)
    .map(([k, d]) => {
      const pcObj = grnPieces.find((p) => p.key === k);
      return {
        key: k,
        baleNo: pcObj?.baleNo,
        pieceNo: pcObj?.pieceNo,
        meters: Number(pcObj?.meters) || 0,
        actualWidth: d.actualWidth,
        actualFold: d.actualFold,
        status: d.status,
        notes: d.notes,
        photos: d.photos
      };
    });

  const totalReceivedMeters = Number(selectedGRN?.declaredTotalMeters) ||
    Number(selectedGRN?.totalMetersEntered) ||
    grnPieces.reduce((sum, p) => sum + (Number(p.meters) || 0), 0) || 0;

  const declaredTotalMeters = Number(selectedGRN?.totalQty) || Number(selectedGRN?.declaredTotalMeters) || 0;

  // Requirement 21: QC should not proceed until total quantity entered in GRN has complete bale entries
  const isBaleCompletenessOk = declaredTotalMeters <= 0 || (
    totalReceivedMeters > 0 && Math.abs(totalReceivedMeters - declaredTotalMeters) < 0.01
  );

  // Pieces flagged for Admin Review or Rejection
  const issuePieces = inspectedList.filter((p) => p.status !== 'OK');
  const pieceQtyHeldBack = issuePieces.reduce((sum, p) => sum + p.meters, 0);
  const flatDefectQty = Number(formData.defectQty) || 0;
  const totalHeldBackMeters = pieceQtyHeldBack + flatDefectQty;
  const goodMeters = Math.max(0, totalReceivedMeters - totalHeldBackMeters);
  // Helper for numeric parsing & comparison
  const parseNum = (val) => {
    if (val === undefined || val === null || val === '') return null;
    const cleaned = String(val).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const expWidthClean = String(formData.expectedWidth || '44').replace(/"/g, '').trim();
  const expWidthNum = parseNum(expWidthClean);
  const actualWidthNum = parseNum(formData.actualWidth);
  const hasWidth = formData.actualWidth !== undefined && formData.actualWidth !== null && String(formData.actualWidth).trim() !== '';
  const isWidthMismatch = hasWidth && (actualWidthNum === null || expWidthNum === null || Math.abs(actualWidthNum - expWidthNum) > 0.01);
  const isWidthMatch = hasWidth && !isWidthMismatch;

  const expFoldClean = String(formData.expectedFold || '100').replace(/%/g, '').trim();
  const expFoldNum = parseNum(expFoldClean);
  const actualFoldNum = parseNum(formData.actualFold);
  const hasFold = formData.actualFold !== undefined && formData.actualFold !== null && String(formData.actualFold).trim() !== '';
  const isFoldMismatch = hasFold && (actualFoldNum === null || expFoldNum === null || Math.abs(actualFoldNum - expFoldNum) > 0.01);
  const isFoldMatch = hasFold && !isFoldMismatch;

  // Requirement 23: Exception mismatch detection
  const hasAnyMismatch = isWidthMismatch || isFoldMismatch;

  const handleSubmit = (statusOverride) => {
    const effectiveStatus = (typeof statusOverride === 'string') ? statusOverride : formData.qcStatus;

    if (effectiveStatus === 'OK' && flatDefectQty > 0 && !formData.defectReason.trim()) {
      showToast('Please enter a defect reason for the defective quantity in the flat entry box.', 'warning');
      return;
    }

    // Requirement 23: During QC, if exceptions do not match, the option to add stock should be hidden or disabled.
    if (effectiveStatus === 'OK' && hasAnyMismatch) {
      showToast('Cannot add stock: Width or Fold exception does not match PO specification. Please submit for Admin Approval or Reject.', 'warning');
      return;
    }

    // Requirement 21: QC should not proceed until total quantity entered in GRN has complete bale entries.
    if (effectiveStatus === 'OK' && !isBaleCompletenessOk) {
      showToast(`Cannot add stock: Total quantity declared in GRN (${declaredTotalMeters}m) has incomplete bale entries (${totalReceivedMeters}m). Please complete all bale entries in GRN first.`, 'warning');
      return;
    }

    let finalStatus = effectiveStatus;
    let finalGoodQty = 0;
    let finalHeldBackQty = 0;

    if (effectiveStatus === 'OK') {
      finalStatus = totalHeldBackMeters > 0 ? 'Partial OK' : 'OK';
      finalGoodQty = goodMeters;
      finalHeldBackQty = totalHeldBackMeters;
    } else if (effectiveStatus === 'Send for Admin Approval' || (hasAnyMismatch && effectiveStatus !== 'Reject' && effectiveStatus !== 'Approved')) {
      finalStatus = 'Pending Admin Approval';
      finalGoodQty = 0;
      finalHeldBackQty = totalReceivedMeters;
    } else if (effectiveStatus === 'Approved') {
      finalStatus = 'Approved';
      finalGoodQty = goodMeters;
      finalHeldBackQty = totalHeldBackMeters;
    } else if (effectiveStatus === 'Reject') {
      finalStatus = 'Reject';
      finalGoodQty = 0;
      finalHeldBackQty = totalReceivedMeters;
    }

    const payload = {
      ...formData,
      inspectorName: (formData.inspectorName || '').replace(/(?:^|\s)\S/g, (c) => c.toUpperCase()).trim(),
      qcStatus: finalStatus,
      hasDiscrepancy: hasAnyMismatch,
      discrepancyType: isWidthMismatch && isFoldMismatch ? 'Width & Fold Mismatch' : (isWidthMismatch ? 'Width Mismatch' : (isFoldMismatch ? 'Fold Mismatch' : 'None')),
      actualWidth: actualWidthNum !== null ? actualWidthNum : (Number(formData.actualWidth) || 0),
      actualFold: actualFoldNum !== null ? actualFoldNum : (Number(formData.actualFold) || 100),
      expectedWidth: expWidthClean,
      expectedFold: expFoldClean,
      pieceInspections,
      inspectedPieces: inspectedList,
      totalReceivedMeters,
      goodQty: finalGoodQty,
      heldBackQty: finalHeldBackQty,
      issuePieces,
      flatDefectQty,
      defectReason: formData.defectReason,
      decidedAt: new Date().toLocaleDateString('en-GB')
    };

    if (onSaveQC) {
      onSaveQC(payload);
    }

    if (finalStatus === 'OK' || finalStatus === 'Partial OK' || finalStatus === 'Approved') {
      setSuccessModalData({
        goodQty: goodMeters,
        heldBackQty: totalHeldBackMeters,
        issuePiecesCount: issuePieces.length,
        grnId: formData.grnRef
      });
    } else if (finalStatus === 'Pending Admin Approval') {
      showToast('Discrepancy flagged! Submitted to Admin for review & approval.', 'warning');
      setTimeout(() => {
        if (onBack) onBack();
      }, 900);
    } else {
      if (onBack) onBack();
    }
  };

  const handleMarkAllPiecesReject = () => {
    const updated = {};
    grnPieces.forEach((p, idx) => {
      const key = p.key || `pc_${idx}`;
      updated[key] = {
        ...(pieceInspections[key] || {}),
        checked: true,
        actualWidth: pieceInspections[key]?.actualWidth || formData.actualWidth || formData.expectedWidth,
        actualFold: pieceInspections[key]?.actualFold || formData.actualFold || formData.expectedFold,
        status: 'Reject',
        notes: pieceInspections[key]?.notes || 'Defective piece rejected'
      };
    });
    setPieceInspections(updated);
    setFormData((prev) => ({ ...prev, qcStatus: 'Reject' }));
    showToast('All pieces marked as Reject.', 'error');
  };

  const handleMarkAllPiecesOK = () => {
    const updated = {};
    grnPieces.forEach((p, idx) => {
      const key = p.key || `pc_${idx}`;
      updated[key] = {
        ...(pieceInspections[key] || {}),
        checked: true,
        actualWidth: pieceInspections[key]?.actualWidth || formData.actualWidth || formData.expectedWidth,
        actualFold: pieceInspections[key]?.actualFold || formData.actualFold || formData.expectedFold,
        status: 'OK',
        notes: ''
      };
    });
    setPieceInspections(updated);
    setFormData((prev) => ({ ...prev, qcStatus: 'OK' }));
    showToast('All pieces marked as OK.', 'success');
  };

  const handleRejectAll = () => {
    const updated = {};
    grnPieces.forEach((p, idx) => {
      const key = p.key || `pc_${idx}`;
      updated[key] = {
        ...(pieceInspections[key] || {}),
        checked: true,
        actualWidth: pieceInspections[key]?.actualWidth || formData.actualWidth || formData.expectedWidth,
        actualFold: pieceInspections[key]?.actualFold || formData.actualFold || formData.expectedFold,
        status: 'Reject',
        notes: pieceInspections[key]?.notes || 'Entire lot rejected'
      };
    });
    setPieceInspections(updated);

    const allRejectedList = grnPieces.map((p, idx) => {
      const key = p.key || `pc_${idx}`;
      return {
        ...p,
        ...updated[key],
        status: 'Reject'
      };
    });

    const payload = {
      ...formData,
      qcStatus: 'Reject',
      actualWidth: Number(formData.actualWidth) || 0,
      actualFold: Number(formData.actualFold) || 100,
      pieceInspections: updated,
      inspectedPieces: allRejectedList,
      totalReceivedMeters,
      goodQty: 0,
      heldBackQty: totalReceivedMeters,
      rejectedQty: totalReceivedMeters,
      issuePieces: allRejectedList,
      flatDefectQty: 0,
      defectReason: formData.defectReason || 'Entire shipment rejected during quality inspection',
      decidedAt: new Date().toLocaleDateString('en-GB')
    };

    if (onSaveQC) {
      onSaveQC(payload);
    }

    showToast('Entire item and all pieces rejected. Sent to Rejected Stock Pool.', 'error');
    setTimeout(() => {
      if (onBack) onBack();
    }, 600);
  };

  const matchedPO = purchaseOrders.find((p) => selectedGRN?.linkedPOs && selectedGRN.linkedPOs.includes(p.id));
  const againstPO = matchedPO?.id || selectedGRN?.linkedPOs?.[0] || selectedGRN?.poId || 'PO-1001';

  return (
    <div className="container-fluid p-0">
      {/* Top Header (Matches Screenshot 2) */}
      <div className="mb-4">
        <button
          type="button"
          className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold d-inline-flex align-items-center gap-1.5 fs-13 mb-2"
          style={{ color: '#5b47fb' }}
          onClick={onBack}
        >
          <i className="ti ti-arrow-left"></i>
          <span>Back to Quality Checks</span>
        </button>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-1 fs-24">
              Quality Check &mdash; {selectedGRN?.fabricName || 'Tussar Silk (42")'} &middot; {selectedGRN?.colorName || 'Charcoal'}
            </h2>
            <p className="text-secondary fs-13 mb-0">
              {formData.grnRef} &middot; {againstPO} &middot; Received quantity <strong>{totalReceivedMeters.toLocaleString()}m</strong> across {grnPieces.length || 1} piece(s)
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span
              className={`badge px-3 py-1.5 fs-12 rounded-pill ${
                formData.qcStatus === 'OK'
                  ? 'bg-success-subtle text-success border border-success border-opacity-25'
                  : formData.qcStatus === 'Reject'
                  ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                  : 'bg-warning-subtle text-warning border border-warning border-opacity-25'
              }`}
            >
              {formData.qcStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Requirement 21 Alert: Incomplete Bale Entries in GRN */}
      {!isBaleCompletenessOk && (
        <div className="alert alert-warning py-3 px-3.5 rounded-4 fs-13 d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 border border-warning shadow-xs">
          <div className="d-flex align-items-center gap-2.5">
            <i className="ti ti-alert-triangle fs-22 text-warning flex-shrink-0"></i>
            <div>
              <strong className="text-dark d-block">QC Locked &mdash; Incomplete Bale Entries in GRN</strong>
              <span className="text-secondary">
                Total quantity declared in GRN is <strong>{declaredTotalMeters}m</strong>, but entered bales/pieces total <strong>{totalReceivedMeters}m</strong> ({Math.abs(declaredTotalMeters - totalReceivedMeters).toFixed(1)}m difference). QC should not proceed until total quantity in GRN has complete bale entries.
              </span>
            </div>
          </div>
          <span className="badge bg-warning text-dark px-3 py-1.5 fs-11 rounded-pill fw-semibold text-nowrap">
            Incomplete Bales
          </span>
        </div>
      )}

      {/* Main Form */}
      <div style={{ maxWidth: '960px' }}>
        <form onSubmit={handleSubmit}>
          {/* CARD 1: Inspection (Matches Screenshot 2) */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <h5 className="fw-bold text-dark mb-3 fs-16 border-bottom pb-2">Inspection</h5>

            {/* Checker Name */}
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                Checker name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control form-control-sm bg-light fs-13"
                style={{ textTransform: 'capitalize' }}
                placeholder="Name of person on shift"
                value={formData.inspectorName}
                onChange={(e) => {
                  const val = e.target.value.replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
                  setFormData({ ...formData, inspectorName: val });
                }}
              />
            </div>

            {/* Side-by-side: Width Found & Fold Found with PO comparison */}
            <div className="row g-3 align-items-center mb-3">
              <div className="col-12 col-sm-auto">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1 d-block">
                  Width found
                </label>
                <div className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 rounded-pill px-2.5 py-0.5 fs-11 mb-1.5 d-inline-block">
                  Expected: {expWidthClean}&quot;
                </div>
                <input
                  type="text"
                  className={`form-control fs-13 rounded-3 ${isWidthMismatch ? 'border-danger bg-danger-subtle bg-opacity-10' : 'bg-white border'}`}
                  style={{ width: '160px' }}
                  placeholder="e.g. 42"
                  value={formData.actualWidth}
                  onChange={(e) => setFormData({ ...formData, actualWidth: e.target.value })}
                />
              </div>

              <div className="col-12 col-sm-auto">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1 d-block">
                  Fold found (%)
                </label>
                <div className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 rounded-pill px-2.5 py-0.5 fs-11 mb-1.5 d-inline-block">
                  Expected: {expFoldClean}%
                </div>
                <input
                  type="text"
                  className={`form-control fs-13 rounded-3 ${isFoldMismatch ? 'border-danger bg-danger-subtle bg-opacity-10' : 'bg-white border'}`}
                  style={{ width: '160px' }}
                  placeholder="e.g. 100"
                  value={formData.actualFold}
                  onChange={(e) => setFormData({ ...formData, actualFold: e.target.value })}
                />
              </div>

              <div className="col-12 col-md d-flex align-items-center pt-sm-4">
                {hasAnyMismatch ? (
                  <div className="p-2.5 rounded-3 bg-warning-subtle border border-warning border-opacity-50 text-dark fw-medium fs-12 w-100">
                    <div className="d-flex align-items-center gap-1.5 mb-0.5">
                      <i className="ti ti-alert-triangle fs-16 text-warning"></i>
                      <span className="fs-12 fw-bold">Note: Width or Fold differs from PO</span>
                    </div>
                    <div className="small text-secondary">
                      {isWidthMismatch && (
                        <span>• Width: {actualWidthNum}&quot; (expected {expWidthClean}&quot;). </span>
                      )}
                      {isFoldMismatch && (
                        <span>• Fold: {actualFoldNum}% (expected {expFoldClean}%). </span>
                      )}
                    </div>
                  </div>
                ) : hasWidth && isWidthMatch && (!hasFold || isFoldMatch) ? (
                  <div className="d-flex align-items-center gap-1.5 text-success fw-semibold fs-13">
                    <i className="ti ti-check fs-16"></i>
                    <span>Matches PO expectation (Width: {expWidthClean}&quot;, Fold: {expFoldClean}%)</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-secondary mb-1">Notes</label>
              <textarea
                rows="2"
                className="form-control form-control-sm bg-light fs-13"
                placeholder="Any observations..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              ></textarea>
            </div>

            {/* Attach Photos */}
            <div>
              <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                Attach photos (more than one allowed)
              </label>
              <div className="d-flex align-items-center gap-2 p-3 border rounded-3 bg-light">
                <label className="btn btn-outline-secondary btn-sm px-3 mb-0 fs-12 cursor-pointer bg-white">
                  <i className="ti ti-upload me-1"></i> Choose File(s)
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="d-none"
                    onChange={handlePhotoUpload}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-sm text-white fs-12 d-flex align-items-center gap-1 shadow-2xs"
                  style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                  onClick={handleSimulateCamera}
                >
                  <i className="ti ti-camera"></i> Open Camera
                </button>
              </div>

              {formData.photos.length > 0 && (
                <div className="d-flex flex-wrap gap-2 pt-2">
                  {formData.photos.map((ph, idx) => (
                    <div
                      key={idx}
                      className="position-relative border rounded-2 p-1 bg-white"
                      style={{ width: '80px' }}
                    >
                      <img
                        src={ph.url}
                        alt={ph.name}
                        className="rounded-1 w-100"
                        style={{ height: '60px', objectFit: 'cover' }}
                      />
                      <div
                        className="text-truncate fs-10 text-muted mt-1 text-center"
                        title={ph.name}
                      >
                        {ph.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION: BALE / PIECE-LEVEL INSPECTION (OPTIONAL) - (Matches Screenshots 3, 4, 5) */}
          <div className="card border rounded-4 p-4 mb-4 bg-white shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h5 className="fw-bold text-dark mb-0 fs-16">
                Bale / piece-level inspection
              </h5>
            </div>
            <p className="text-secondary fs-12 mb-3">
              Most shipments are checked as a whole (above). If only specific pieces need a closer look, use the dropdown below or tick pieces &mdash; each gets its own width/fold/photo/status.
            </p>

            {/* Requirement 24: Dropdown Options for Bale / Piece-level inspection */}
            {grnPieces.length > 0 && (
              <div className="bg-light p-3 rounded-3 border mb-3">
                <div className="row g-3 align-items-center">
                  {/* Dropdown 1: Select Bale */}
                  <div className="col-12 col-sm-4">
                    <label className="form-label fs-11 fw-bold text-dark text-uppercase mb-1 d-flex align-items-center gap-1">
                      <i className="ti ti-box fs-13 text-primary"></i>
                      <span>Select Bale Dropdown:</span>
                    </label>
                    <select
                      className="form-select form-select-sm bg-white fs-12 border rounded-2"
                      value={selectedBaleFilter}
                      onChange={(e) => {
                        setSelectedBaleFilter(e.target.value);
                        setSelectedPieceKey('');
                      }}
                    >
                      <option value="all">All Bales ({uniqueBaleNumbers.length} Bales &middot; {grnPieces.length} Pieces)</option>
                      {uniqueBaleNumbers.map((bNo) => {
                        const count = grnPieces.filter((p) => String(p.baleNo) === String(bNo)).length;
                        const meters = grnPieces.filter((p) => String(p.baleNo) === String(bNo)).reduce((s, p) => s + (Number(p.meters) || 0), 0);
                        return (
                          <option key={bNo} value={bNo}>
                            Bale #{bNo} &mdash; {count} pieces ({meters}m)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Dropdown 2: Select Specific Piece */}
                  <div className="col-12 col-sm-5">
                    <label className="form-label fs-11 fw-bold text-dark text-uppercase mb-1 d-flex align-items-center gap-1">
                      <i className="ti ti-eye fs-13 text-primary"></i>
                      <span>Inspect Specific Piece Dropdown:</span>
                    </label>
                    <select
                      className="form-select form-select-sm bg-white fs-12 border rounded-2"
                      value={selectedPieceKey}
                      onChange={(e) => {
                        const key = e.target.value;
                        setSelectedPieceKey(key);
                        if (key) {
                          const targetPiece = grnPieces.find((p) => p.key === key);
                          if (targetPiece) {
                            setSelectedBaleFilter(String(targetPiece.baleNo));
                            setPieceInspections((prev) => ({
                              ...prev,
                              [key]: {
                                ...(prev[key] || {
                                  actualWidth: formData.expectedWidth,
                                  actualFold: formData.expectedFold,
                                  status: 'OK',
                                  notes: '',
                                  photos: []
                                }),
                                checked: true
                              }
                            }));
                          }
                        }
                      }}
                    >
                      <option value="">-- All Pieces in Selected Bale --</option>
                      {(selectedBaleFilter === 'all' ? grnPieces : grnPieces.filter((p) => String(p.baleNo) === String(selectedBaleFilter))).map((pc) => {
                        const st = pieceInspections[pc.key]?.status || 'OK';
                        const isInspected = Boolean(pieceInspections[pc.key]?.checked);
                        return (
                          <option key={pc.key} value={pc.key}>
                            Bale {pc.baleNo} &middot; Piece {pc.pieceIdx + 1} ({pc.meters}m) &mdash; [{isInspected ? st : 'Unchecked'}]
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Dropdown 3: Inspection Level / Scope */}
                  <div className="col-12 col-sm-3">
                    <label className="form-label fs-11 fw-bold text-dark text-uppercase mb-1 d-flex align-items-center gap-1">
                      <i className="ti ti-layers-subtract fs-13 text-primary"></i>
                      <span>Inspection Level:</span>
                    </label>
                    <select
                      className="form-select form-select-sm bg-white fs-12 border rounded-2"
                      value={inspectionScope}
                      onChange={(e) => setInspectionScope(e.target.value)}
                    >
                      <option value="all">Full Shipment Inspection</option>
                      <option value="bale">Bale-Level Focus</option>
                      <option value="piece">Piece-Level Detailed</option>
                    </select>
                  </div>
                </div>

                {selectedPieceKey && (
                  <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
                    <span className="fs-12 text-secondary">
                      Showing selected piece: <strong>{selectedPieceKey}</strong>
                    </span>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-decoration-none fs-12 fw-semibold"
                      style={{ color: '#5b47fb' }}
                      onClick={() => {
                        setSelectedPieceKey('');
                        setSelectedBaleFilter('all');
                      }}
                    >
                      Clear Filter (Show All)
                    </button>
                  </div>
                )}
              </div>
            )}

            {grnPieces.length === 0 ? (
              <div className="text-center py-3 text-muted fs-13 border rounded-3 bg-light">
                No bale/piece breakdown recorded for this GRN. Use overall inspection fields above.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {displayedPieces.length === 0 ? (
                  <div className="text-center py-3 text-muted fs-13 border rounded-3 bg-light">
                    No pieces match the selected dropdown filter.
                  </div>
                ) : (
                  displayedPieces.map((pc) => {
                  const pieceData = pieceInspections[pc.key] || {
                    checked: false,
                    actualWidth: formData.expectedWidth,
                    actualFold: formData.expectedFold,
                    status: 'OK',
                    notes: '',
                    photos: []
                  };
                  const isChecked = Boolean(pieceData.checked);

                  return (
                    <div
                      key={pc.key}
                      className="border rounded-3 p-3 bg-white shadow-xs"
                      style={{
                        borderColor: isChecked ? '#c4b5fd' : '#e5e7eb',
                        backgroundColor: isChecked ? '#faf5ff' : '#ffffff'
                      }}
                    >
                      <div className="form-check d-flex align-items-center gap-2 mb-0">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          id={`chk-${pc.key}`}
                          checked={isChecked}
                          onChange={(e) => {
                            setPieceInspections({
                              ...pieceInspections,
                              [pc.key]: {
                                ...pieceData,
                                checked: e.target.checked
                              }
                            });
                          }}
                        />
                        <label
                          className="form-check-label fw-bold text-dark fs-13 cursor-pointer user-select-none"
                          htmlFor={`chk-${pc.key}`}
                        >
                          Bale {pc.baleNo} &mdash; Piece {pc.pieceIdx + 1} ({pc.meters}m)
                        </label>
                      </div>

                      {/* Expanded piece inspection inputs when checked */}
                      {isChecked && (
                        <div className="mt-3 pt-3 border-top bg-white p-3 rounded-2 border">
                          <div className="row g-3 mb-2">
                            <div className="col-12 col-sm-6 col-md-3">
                              <label className="form-label fs-11 fw-semibold text-secondary mb-1 d-block">
                                Actual width
                                <span className="badge bg-light text-primary border ms-1 fs-10">
                                  Expected: {formData.expectedWidth}&quot;
                                </span>
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                className="form-control form-control-sm bg-white"
                                value={pieceData.actualWidth}
                                onChange={(e) => updatePieceField(pc.key, 'actualWidth', e.target.value)}
                              />
                            </div>

                            <div className="col-12 col-sm-6 col-md-3">
                              <label className="form-label fs-11 fw-semibold text-secondary mb-1 d-block">
                                Actual fold (%)
                                <span className="badge bg-light text-primary border ms-1 fs-10">
                                  Expected: {formData.expectedFold}%
                                </span>
                              </label>
                              <input
                                type="number"
                                className="form-control form-control-sm bg-white"
                                value={pieceData.actualFold}
                                onChange={(e) => updatePieceField(pc.key, 'actualFold', e.target.value)}
                              />
                            </div>

                            <div className="col-12 col-sm-6 col-md-3">
                              <label className="form-label fs-11 fw-semibold text-secondary mb-1">
                                Status
                              </label>
                              <select
                                className="form-select form-select-sm bg-white fw-semibold"
                                value={pieceData.status}
                                onChange={(e) => updatePieceField(pc.key, 'status', e.target.value)}
                              >
                                <option value="OK">OK</option>
                                <option value="Send for Admin Approval">Send for Admin Approval</option>
                                <option value="Reject">Reject</option>
                              </select>
                            </div>

                            <div className="col-12 col-sm-6 col-md-3">
                              <label className="form-label fs-11 fw-semibold text-secondary mb-1">
                                Photos (more than one allowed)
                              </label>
                              <div className="d-flex align-items-center gap-1">
                                <label className="btn btn-outline-secondary btn-sm px-2 fs-11 mb-0 flex-grow-1 text-nowrap">
                                  <i className="ti ti-upload me-1"></i> Choose File(s)
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="d-none"
                                    onChange={(e) => handlePiecePhotoUpload(pc.key, e)}
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm px-2 fs-11 d-flex align-items-center gap-1 text-white shadow-sm"
                                  style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                                  onClick={() => handlePieceSimulateCamera(pc.key)}
                                  title="Capture Camera Photo"
                                >
                                  <i className="ti ti-camera"></i>
                                  <span>Camera</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mb-2">
                            <label className="form-label fs-11 fw-semibold text-secondary mb-1">
                              Notes
                            </label>
                            <input
                              type="text"
                              placeholder="Record defect, selvedge condition, shade uniformity, or tears..."
                              className="form-control form-control-sm bg-white"
                              value={pieceData.notes || ''}
                              onChange={(e) => updatePieceField(pc.key, 'notes', e.target.value)}
                            />
                          </div>

                          {pieceData.photos && pieceData.photos.length > 0 && (
                            <div className="d-flex flex-wrap gap-2 pt-1">
                              {pieceData.photos.map((ph, phIdx) => (
                                <div key={phIdx} className="border rounded-2 p-1 bg-white" style={{ width: '70px' }}>
                                  <img
                                    src={ph.url}
                                    alt={ph.name}
                                    className="rounded-1 w-100"
                                    style={{ height: '50px', objectFit: 'cover' }}
                                  />
                                  <div className="text-truncate fs-10 text-muted mt-1 text-center" title={ph.name}>
                                    {ph.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              </div>
            )}
          </div>





          {/* Bottom Action Buttons */}
          <div className="d-flex flex-wrap align-items-center gap-3 pt-3">
            {/* Requirement 23: During QC, if exceptions do not match, the option to add stock should be hidden or disabled */}
            {hasAnyMismatch || !isBaleCompletenessOk ? (
              <div className="d-inline-flex flex-column align-items-start gap-1">
                <button
                  type="button"
                  className="btn btn-secondary px-4 py-2.5 fw-semibold fs-13 rounded-3 shadow-sm d-inline-flex align-items-center gap-2 opacity-50 cursor-not-allowed"
                  disabled
                  title={
                    hasAnyMismatch
                      ? "Option to add stock is disabled because Width or Fold exception does not match PO specification"
                      : "Option to add stock is disabled because total quantity declared in GRN has incomplete bale entries"
                  }
                >
                  <i className="ti ti-lock fs-16"></i>
                  <span>Mark OK &mdash; Add Good Qty to Stock Pool (Disabled &mdash; Exception Mismatch)</span>
                </button>
                <span className="small text-danger fw-semibold d-flex align-items-center gap-1">
                  <i className="ti ti-alert-triangle fs-12"></i>
                  {hasAnyMismatch
                    ? "Add stock disabled: Exceptions (Width/Fold) do not match PO specification. Must send for Admin Approval or Reject."
                    : "Add stock disabled: Complete all bale entries in GRN before completing QC."}
                </span>
              </div>
            ) : (
              <button
                type="button"
                className="btn text-white px-4 py-2.5 fw-semibold fs-13 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
                style={{ backgroundColor: '#15803d', borderColor: '#15803d' }}
                onClick={() => {
                  setFormData({ ...formData, qcStatus: 'OK' });
                  handleSubmit('OK');
                }}
              >
                <i className="ti ti-check fs-16"></i>
                <span>Mark OK &mdash; Add Good Qty to Stock Pool</span>
              </button>
            )}

            <button
              type="button"
              className={`btn px-4 py-2.5 fw-semibold fs-13 rounded-3 shadow-sm d-inline-flex align-items-center gap-2 ${hasAnyMismatch ? 'border-2 border-danger text-danger bg-danger-subtle' : ''}`}
              style={!hasAnyMismatch ? { backgroundColor: '#ffffff', borderColor: '#b91c1c', color: '#b91c1c' } : {}}
              onClick={() => {
                setFormData({ ...formData, qcStatus: 'Send for Admin Approval' });
                handleSubmit('Send for Admin Approval');
              }}
            >
              <i className="ti ti-shield-alert fs-16"></i>
              <span>Send Whole Item for Admin Approval</span>
            </button>

            <button
              type="button"
              className="btn text-white px-4 py-2.5 fw-semibold fs-13 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
              onClick={handleRejectAll}
            >
              <i className="ti ti-x fs-16"></i>
              <span>Reject Item (Reject All)</span>
            </button>

            <button
              type="button"
              className="btn btn-white border px-4 py-2.5 fs-13 text-secondary shadow-sm rounded-3"
              style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
              onClick={onBack}
            >
              Back
            </button>
          </div>
        </form>
      </div>

      {/* Added to Stock Pool Success Modal (Matches User Screenshot 3) */}
      {successModalData && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden p-4 bg-white position-relative">
              <button
                type="button"
                className="btn-close position-absolute"
                style={{ top: '18px', right: '18px' }}
                onClick={() => {
                  setSuccessModalData(null);
                  if (onBack) onBack();
                }}
              ></button>

              <div className="mb-4 pe-4">
                <h5 className="fw-bold text-dark fs-17 mb-1">
                  Added to Stock Pool
                </h5>
                <p className="text-secondary fs-13 mb-0">
                  {Number(successModalData.goodQty.toFixed(2)).toLocaleString()}m is now available in stock.
                </p>
              </div>

              {successModalData.heldBackQty > 0 && (
                <div className="p-3 rounded-3 bg-warning-subtle border border-warning border-opacity-50 mb-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <i className="ti ti-alert-triangle text-warning fs-15"></i>
                    <span className="fw-bold text-dark fs-12">Portion Held Back for Admin</span>
                  </div>
                  <div className="text-secondary fs-11">
                    <strong>{Number(successModalData.heldBackQty.toFixed(2)).toLocaleString()}m</strong> was held back and routed to Admin Review.
                  </div>
                </div>
              )}

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-primary px-3.5 py-2 rounded-3 fs-13 text-white fw-semibold shadow-sm"
                  style={{ backgroundColor: '#2e3748', borderColor: '#2e3748' }}
                  onClick={() => {
                    setSuccessModalData(null);
                    if (onNavigateToStockPool) onNavigateToStockPool();
                    else if (onBack) onBack();
                  }}
                >
                  View Stock Pool
                </button>
                <button
                  type="button"
                  className="btn btn-white border px-3.5 py-2 rounded-3 fs-13 text-secondary fw-medium shadow-sm"
                  style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#475569' }}
                  onClick={() => {
                    setSuccessModalData(null);
                    if (onNavigateToGRN) onNavigateToGRN(successModalData.grnId);
                    else if (onBack) onBack();
                  }}
                >
                  Back to GRN
                </button>
              </div>
            </div>
          </div>
        </div>
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
