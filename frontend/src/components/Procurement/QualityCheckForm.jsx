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
  currentUser = { name: 'Saksham Garg', role: 'Quality Inspector' },
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
    if (!foundGRN) return { fold: '97', width: '44' };

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

    return {
      fold: foundFold || '3',
      width: foundWidth || '42'
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
    inspectorName: qc?.inspectorName || currentUser.name,
    expectedWidth: qc?.expectedWidth || initialExpected.width,
    actualWidth: qc?.actualWidth !== undefined && qc?.actualWidth !== null ? String(qc.actualWidth) : '',
    expectedFold: qc?.expectedFold || initialExpected.fold,
    actualFold: qc?.actualFold !== undefined && qc?.actualFold !== null ? String(qc.actualFold) : '',
    photos: qc?.photos || [],
    notes: qc?.notes || '',
    defectPieces: qc?.defectPieces || '',
    defectQty: qc?.defectQty || '',
    defectReason: qc?.defectReason || '',
    qcStatus: qc?.qcStatus || 'OK', // OK / Send for Admin Approval / Reject
    adminDecision: qc?.adminDecision || '', // Approve / Reject
    adminRemarks: qc?.adminRemarks || '',
    dateTime: qc?.dateTime || new Date().toLocaleString('en-GB')
  });

  const [pieceInspections, setPieceInspections] = useState(qc?.pieceInspections || {});

  React.useEffect(() => {
    if (qc && qc.id) {
      const exp = getExpectedFromGRN(qc.grnRef);
      setFormData({
        id: qc.id,
        grnRef: qc.grnRef,
        inspectionScope: qc.inspectionScope || 'Whole Shipment',
        baleRef: qc.baleRef || 'Bale 01',
        pieceRef: qc.pieceRef || 'Piece 01',
        inspectorName: qc.inspectorName || currentUser.name,
        expectedWidth: qc.expectedWidth || exp.width,
        actualWidth: qc.actualWidth !== undefined && qc.actualWidth !== null ? String(qc.actualWidth) : '',
        expectedFold: qc.expectedFold || exp.fold,
        actualFold: qc.actualFold !== undefined && qc.actualFold !== null ? String(qc.actualFold) : '',
        photos: qc.photos || [],
        notes: qc.notes || '',
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
    alert('Piece snapshot captured and attached!');
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
    alert('Camera snapshot captured and attached to QC record!');
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

  // Pieces flagged for Admin Review or Rejection
  const issuePieces = inspectedList.filter((p) => p.status !== 'OK');
  const pieceQtyHeldBack = issuePieces.reduce((sum, p) => sum + p.meters, 0);
  const flatDefectQty = Number(formData.defectQty) || 0;
  const totalHeldBackMeters = pieceQtyHeldBack + flatDefectQty;
  const goodMeters = Math.max(0, totalReceivedMeters - totalHeldBackMeters);

  const handleSubmit = (statusOverride) => {
    const effectiveStatus = (typeof statusOverride === 'string') ? statusOverride : formData.qcStatus;

    if (effectiveStatus === 'OK' && flatDefectQty > 0 && !formData.defectReason.trim()) {
      alert('Please enter a defect reason for the defective quantity in the flat entry box.');
      return;
    }

    let finalStatus = effectiveStatus;
    let finalGoodQty = 0;
    let finalHeldBackQty = 0;

    if (effectiveStatus === 'OK') {
      finalStatus = totalHeldBackMeters > 0 ? 'Partial OK' : 'OK';
      finalGoodQty = goodMeters;
      finalHeldBackQty = totalHeldBackMeters;
    } else if (effectiveStatus === 'Send for Admin Approval') {
      finalStatus = 'Send for Admin Approval';
      finalGoodQty = 0;
      finalHeldBackQty = totalReceivedMeters;
    } else if (effectiveStatus === 'Reject') {
      finalStatus = 'Reject';
      finalGoodQty = 0;
      finalHeldBackQty = totalReceivedMeters;
    }

    const payload = {
      ...formData,
      qcStatus: finalStatus,
      actualWidth: Number(formData.actualWidth) || 0,
      actualFold: Number(formData.actualFold) || 100,
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

    if (effectiveStatus === 'OK') {
      setSuccessModalData({
        goodQty: goodMeters,
        heldBackQty: totalHeldBackMeters,
        issuePiecesCount: issuePieces.length,
        grnId: formData.grnRef
      });
    } else {
      if (onBack) onBack();
    }
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
                placeholder="Name of person on shift"
                value={formData.inspectorName}
                onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
              />
            </div>

            {/* Side-by-side: Width Found & Fold Found with PO comparison */}
            {(() => {
              const parseNum = (val) => {
                if (val === undefined || val === null || val === '') return null;
                const cleaned = String(val).replace(/[^0-9.]/g, '');
                const num = parseFloat(cleaned);
                return isNaN(num) ? null : num;
              };

              const expWidthClean = String(formData.expectedWidth || '42').replace(/"/g, '').trim();
              const expWidthNum = parseNum(expWidthClean);
              const actualWidthNum = parseNum(formData.actualWidth);
              const hasWidth = formData.actualWidth !== undefined && formData.actualWidth !== null && String(formData.actualWidth).trim() !== '';
              const isWidthMismatch = hasWidth && (actualWidthNum === null || expWidthNum === null || Math.abs(actualWidthNum - expWidthNum) > 0.01);
              const isWidthMatch = hasWidth && !isWidthMismatch;

              const expFoldClean = String(formData.expectedFold || '3').replace(/%/g, '').trim();
              const expFoldNum = parseNum(expFoldClean);
              const actualFoldNum = parseNum(formData.actualFold);
              const hasFold = formData.actualFold !== undefined && formData.actualFold !== null && String(formData.actualFold).trim() !== '';
              const isFoldMismatch = hasFold && (actualFoldNum === null || expFoldNum === null || Math.abs(actualFoldNum - expFoldNum) > 0.01);
              const isFoldMatch = hasFold && !isFoldMismatch;

              return (
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
                      className="form-control bg-white border fs-13 rounded-3"
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
                      className="form-control bg-white border fs-13 rounded-3"
                      style={{ width: '160px' }}
                      placeholder="e.g. 3"
                      value={formData.actualFold}
                      onChange={(e) => setFormData({ ...formData, actualFold: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md d-flex align-items-center pt-sm-4">
                    {isWidthMismatch ? (
                      <div className="d-flex align-items-center gap-1.5 text-danger fw-semibold fs-13">
                        <i className="ti ti-alert-triangle fs-16"></i>
                        <span>Width differs from PO (expected {expWidthClean}&quot;)</span>
                      </div>
                    ) : isFoldMismatch ? (
                      <div className="d-flex align-items-center gap-1.5 text-danger fw-semibold fs-13">
                        <i className="ti ti-alert-triangle fs-16"></i>
                        <span>Fold differs from PO (expected {expFoldClean}%)</span>
                      </div>
                    ) : hasWidth && isWidthMatch && (!hasFold || isFoldMatch) ? (
                      <div className="d-flex align-items-center gap-1.5 text-success fw-semibold fs-13">
                        <i className="ti ti-check fs-16"></i>
                        <span>Matches PO expectation</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })()}

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
              <span className="badge bg-light text-secondary border px-2.5 py-1 fs-11 rounded-pill">
                optional
              </span>
            </div>
            <p className="text-secondary fs-12 mb-3">
              Most shipments are checked as a whole (above). If only specific pieces need a closer look, tick them below &mdash; each gets its own width/fold/photo/status, independent of the overall decision.
            </p>

            {grnPieces.length === 0 ? (
              <div className="text-center py-3 text-muted fs-13 border rounded-3 bg-light">
                No bale/piece breakdown recorded for this GRN. Use overall inspection fields above.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {grnPieces.map((pc) => {
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
                })}
              </div>
            )}
          </div>





          {/* Bottom Action Buttons (Matches Screenshot 3 with ERP theme) */}
          <div className="d-flex flex-wrap align-items-center gap-3 pt-3">
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

            <button
              type="button"
              className="btn px-4 py-2.5 fw-semibold fs-13 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
              style={{ backgroundColor: '#ffffff', borderColor: '#b91c1c', color: '#b91c1c' }}
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
    </div>
  );
}
