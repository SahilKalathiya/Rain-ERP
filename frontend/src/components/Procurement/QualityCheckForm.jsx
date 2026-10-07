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
      fold: foundFold || '97',
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
    inspectorName: qc?.inspectorName || currentUser.name,
    expectedWidth: qc?.expectedWidth || initialExpected.width,
    actualWidth: qc?.actualWidth || Number(initialExpected.width) || 44.0,
    expectedFold: qc?.expectedFold || initialExpected.fold,
    actualFold: qc?.actualFold || Number(initialExpected.fold) || 97.0,
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
        actualWidth: qc.actualWidth !== undefined ? qc.actualWidth : Number(exp.width),
        expectedFold: qc.expectedFold || exp.fold,
        actualFold: qc.actualFold !== undefined ? qc.actualFold : Number(exp.fold),
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
        actualWidth: Number(exp.width) || 44.0,
        expectedFold: exp.fold,
        actualFold: Number(exp.fold) || 100.0
      }));
    }
  }, [qc, purchaseOrders, grns]);

  const handleGRNChange = (newGrnId) => {
    const expected = getExpectedFromGRN(newGrnId);
    setFormData((prev) => ({
      ...prev,
      grnRef: newGrnId,
      expectedWidth: expected.width,
      actualWidth: Number(expected.width) || 44.0,
      expectedFold: expected.fold,
      actualFold: Number(expected.fold) || 100.0
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

  return (
    <div className="container-fluid p-0">
      {/* Top Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center"
            style={{ width: '40px', height: '40px' }}
            onClick={onBack}
          >
            <i className="ti ti-arrow-left fs-18"></i>
          </button>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h3 className="fw-bold text-dark mb-0 fs-20">
                {isExisting ? `Quality Check ${formData.id}` : 'Perform Quality Inspection (QC)'}
              </h3>
              <span
                className={`badge px-2 py-1 fs-12 ${formData.qcStatus === 'OK'
                    ? 'bg-success-subtle text-success'
                    : formData.qcStatus === 'Reject'
                      ? 'bg-danger-subtle text-danger'
                      : 'bg-warning-subtle text-warning'
                  }`}
              >
                {formData.qcStatus}
              </span>
            </div>
            <p className="text-secondary mb-0 fs-13">
              Raw Material Inward Inspection (Width, Fold, Visual Grading)
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary px-4 py-2 fw-medium fs-13 shadow-sm rounded-3"
          onClick={handleSubmit}
        >
          <i className="ti ti-check fs-16 me-1"></i>
          <span>Save QC Inspection</span>
        </button>
      </div>

      {/* Main Form */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white" style={{ maxWidth: '920px' }}>
        <form onSubmit={handleSubmit}>
          {/* Reference & Scope Grid */}
          <div className="row g-3 mb-4 p-3 bg-light rounded-3">
            <div className="col-12 col-md-4">
              <label className="form-label fs-12 fw-semibold mb-1">GRN Reference *</label>
              <select
                className="form-select form-select-sm bg-white fs-13 font-monospace"
                value={formData.grnRef}
                onChange={(e) => handleGRNChange(e.target.value)}
              >
                {grns.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.id} ({g.vendorName})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fs-12 fw-semibold mb-1">Inspection Scope *</label>
              <select
                className="form-select form-select-sm bg-white fs-13"
                value={formData.inspectionScope}
                onChange={(e) => setFormData({ ...formData, inspectionScope: e.target.value })}
              >
                <option value="Whole Shipment">Whole Shipment (Bulk Inspection)</option>
                <option value="Bale-Level">Bale-Level</option>
                <option value="Piece-Level">Piece-Level (Individual Taka)</option>
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fs-12 fw-semibold mb-1">
                Inspector Name (Login user / Override)
              </label>
              <input
                type="text"
                className="form-control form-control-sm bg-white fs-13"
                value={formData.inspectorName}
                onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
              />
            </div>

            {/* Conditional Scope References (6.1) */}
            {formData.inspectionScope !== 'Whole Shipment' && (
              <>
                <div className="col-6 col-md-4">
                  <label className="form-label fs-12 fw-semibold mb-1">Bale Reference *</label>
                  <select
                    className="form-select form-select-sm bg-white fs-13"
                    value={formData.baleRef}
                    onChange={(e) => setFormData({ ...formData, baleRef: e.target.value })}
                  >
                    <option value="Bale 01">Bale 01 (Bale 2840)</option>
                    <option value="Bale 02">Bale 02 (Bale 2841)</option>
                    <option value="Bale 03">Bale 03 (Bale 2842)</option>
                    <option value="Bale 04">Bale 04 (Bale 2843)</option>
                    <option value="Bale 05">Bale 05 (Bale 2844)</option>
                  </select>
                </div>

                {formData.inspectionScope === 'Piece-Level' && (
                  <div className="col-6 col-md-4">
                    <label className="form-label fs-12 fw-semibold mb-1">Piece Reference *</label>
                    <select
                      className="form-select form-select-sm bg-white fs-13"
                      value={formData.pieceRef}
                      onChange={(e) => setFormData({ ...formData, pieceRef: e.target.value })}
                    >
                      {[...Array(17).keys()].map((i) => (
                        <option key={i} value={`Piece ${String(i + 1).padStart(2, '0')}`}>
                          Piece {String(i + 1).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Width & Fold Verification (6.1: persistent notes below inputs) */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-6">
              <label className="form-label fs-12 fw-semibold mb-1">Actual Width (Inches) *</label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 44.0"
                className="form-control bg-light fs-13 no-spinner"
                value={formData.actualWidth}
                onChange={(e) => setFormData({ ...formData, actualWidth: e.target.value })}
              />
              {/* Persistent note directly under field (6.2 rule) */}
              <div className="p-2 bg-light rounded-2 mt-1 fs-11 text-muted border">
                <i className="ti ti-info-circle text-primary me-1"></i>
                <strong>Expected Width from PO / Fabric:</strong> {formData.expectedWidth} Inch
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fs-12 fw-semibold mb-1">Actual Fold % *</label>
              <input
                type="number"
                step="1"
                placeholder="e.g. 100"
                className="form-control bg-light fs-13 no-spinner"
                value={formData.actualFold}
                onChange={(e) => setFormData({ ...formData, actualFold: e.target.value })}
              />
              {/* Persistent note directly under field (6.2 rule) */}
              <div className="p-2 bg-light rounded-2 mt-1 fs-11 text-muted border">
                <i className="ti ti-info-circle text-primary me-1"></i>
                <strong>Expected Fold from PO Standard:</strong> {formData.expectedFold}%
              </div>
            </div>
          </div>

          {/* Inspection Photographs (6.1 & 6.2: File upload & Open Camera) */}
          <div className="mb-4 p-3 bg-light rounded-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <label className="form-label fs-12 fw-semibold mb-0">Inspection Photographs</label>
              <div className="d-flex align-items-center gap-2">
                <label className="btn btn-outline-primary btn-sm px-3 mb-0 fs-12 cursor-pointer">
                  <i className="ti ti-upload me-1"></i>
                  <span>Choose File</span>
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
                  className="btn btn-outline-secondary btn-sm px-3 fs-12 d-flex align-items-center gap-1"
                  onClick={handleSimulateCamera}
                >
                  <i className="ti ti-camera fs-14"></i>
                  <span>Open Camera</span>
                </button>
              </div>
            </div>

            {formData.photos.length === 0 ? (
              <div className="text-center py-3 text-muted fs-12">
                No inspection photos attached yet. Attach photos for stains, tears or selvedge defects.
              </div>
            ) : (
              <div className="d-flex flex-wrap gap-2 pt-2">
                {formData.photos.map((ph, idx) => (
                  <div
                    key={idx}
                    className="position-relative border rounded-2 p-1 bg-white"
                    style={{ width: '90px' }}
                  >
                    <img
                      src={ph.url}
                      alt={ph.name}
                      className="rounded-1 w-100"
                      style={{ height: '70px', objectFit: 'cover' }}
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

          {/* QC Notes */}
          <div className="mb-4">
            <label className="form-label fs-12 fw-semibold text-secondary mb-1">
              Quality Inspection Notes &amp; Observations
            </label>
            <textarea
              rows="3"
              className="form-control bg-light fs-13"
              placeholder="Record weft deviation, feel, selvedge condition, shade uniformity..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            ></textarea>
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

          {/* SECTION: DAMAGED / DEFECTIVE PIECES (FLAT ENTRY) - (Matches Screenshot 3) */}
          <div className="card border rounded-4 p-4 mb-4 bg-white shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h5 className="fw-bold text-dark mb-0 fs-16">
                Damaged / defective pieces (flat entry)
              </h5>
              <span className="badge bg-light text-secondary border px-2.5 py-1 fs-11 rounded-pill">
                optional
              </span>
            </div>
            <p className="text-secondary fs-12 mb-3">
              If you already know a count/quantity is damaged but don&apos;t need to record which exact piece, use this instead of the piece picker above.
            </p>
            <div className="row g-3">
              <div className="col-12 col-md-3">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">Defective pieces</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 3"
                  className="form-control form-control-sm bg-white"
                  value={formData.defectPieces || ''}
                  onChange={(e) => setFormData({ ...formData, defectPieces: e.target.value })}
                />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">Defective quantity (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 7.5"
                  className="form-control form-control-sm bg-white"
                  value={formData.defectQty || ''}
                  onChange={(e) => setFormData({ ...formData, defectQty: e.target.value })}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">Defect reason</label>
                <input
                  type="text"
                  placeholder="e.g. torn edge, dye patch, stains, weft deviation"
                  className="form-control form-control-sm bg-white"
                  value={formData.defectReason || ''}
                  onChange={(e) => setFormData({ ...formData, defectReason: e.target.value })}
                />
              </div>
            </div>
            {(Number(formData.defectQty) > 0 || Number(formData.defectPieces) > 0) && (
              <div className="alert alert-warning py-2 px-3 mt-3 mb-0 fs-12 d-flex align-items-center gap-2 rounded-2">
                <i className="ti ti-alert-triangle fs-16 text-warning"></i>
                <span>Will hold back <strong>{formData.defectQty || 0}m</strong> for admin review or separate rejected stock pool.</span>
              </div>
            )}
          </div>

          {/* Three-Way QC Outcome (6.2) */}
          <div className="p-3 bg-light rounded-3 mb-4 border">
            <style>{`
              .qc-decision-card {
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                border: 2px solid #e2e8f0;
                background-color: #ffffff;
                user-select: none;
              }
              .qc-decision-card.ok-active {
                border-color: #10b981 !important;
                background-color: #ecfdf5 !important;
                box-shadow: 0 0 0 1px #10b981, 0 4px 14px rgba(16, 185, 129, 0.25) !important;
              }
              .qc-decision-card.ok-card:hover {
                border-color: #10b981 !important;
                box-shadow: 0 0 0 1px #10b981, 0 4px 12px rgba(16, 185, 129, 0.2) !important;
                background-color: #f0fdf4;
              }
              .qc-decision-card.admin-active {
                border-color: #f59e0b !important;
                background-color: #fffbeb !important;
                box-shadow: 0 0 0 1px #f59e0b, 0 4px 14px rgba(245, 158, 11, 0.25) !important;
              }
              .qc-decision-card.admin-card:hover {
                border-color: #f59e0b !important;
                box-shadow: 0 0 0 1px #f59e0b, 0 4px 12px rgba(245, 158, 11, 0.2) !important;
                background-color: #fffbeb;
              }
              .qc-decision-card.reject-active {
                border-color: #ef4444 !important;
                background-color: #fef2f2 !important;
                box-shadow: 0 0 0 1px #ef4444, 0 4px 14px rgba(239, 68, 68, 0.25) !important;
              }
              .qc-decision-card.reject-card:hover {
                border-color: #ef4444 !important;
                box-shadow: 0 0 0 1px #ef4444, 0 4px 12px rgba(239, 68, 68, 0.2) !important;
                background-color: #fef2f2;
              }
            `}</style>
            <label className="form-label fs-13 fw-bold text-dark mb-2">
              Inspection Decision / QC Status *
            </label>
            <div className="row g-3">
              {/* Option 1: OK (Approved) */}
              <div className="col-12 col-md-4">
                <div
                  className={`card p-3 rounded-3 qc-decision-card ok-card ${formData.qcStatus === 'OK' ? 'ok-active' : ''
                    }`}
                  onClick={() => setFormData({ ...formData, qcStatus: 'OK' })}
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className="ti ti-circle-check fs-22 text-success"></i>
                    <div>
                      <div className="fw-bold text-success fs-14">OK (Approved)</div>
                      <div className="text-muted fs-11">
                        Routes material directly into main Stock Pool.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: Send for Admin Approval */}
              <div className="col-12 col-md-4">
                <div
                  className={`card p-3 rounded-3 qc-decision-card admin-card ${formData.qcStatus === 'Send for Admin Approval' ? 'admin-active' : ''
                    }`}
                  onClick={() => setFormData({ ...formData, qcStatus: 'Send for Admin Approval' })}
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className="ti ti-clock fs-22 text-warning"></i>
                    <div>
                      <div className="fw-bold text-warning fs-14">Send for Admin Approval</div>
                      <div className="text-muted fs-11">
                        Holds in pending state until Admin decision recorded.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 3: Reject (Defective) */}
              <div className="col-12 col-md-4">
                <div
                  className={`card p-3 rounded-3 qc-decision-card reject-card ${formData.qcStatus === 'Reject' ? 'reject-active' : ''
                    }`}
                  onClick={() => setFormData({ ...formData, qcStatus: 'Reject' })}
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className="ti ti-circle-x fs-22 text-danger"></i>
                    <div>
                      <div className="fw-bold text-danger fs-14">Reject (Defective)</div>
                      <div className="text-muted fs-11">
                        Routes directly to Rejected Stock Pool.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Quality Split & Stock Routing Summary (Live Partial Holdback & Stock Pool Split) */}
          <div className="card border rounded-4 p-4 mb-4 shadow-sm" style={{ backgroundColor: '#f8fafc' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <i className="ti ti-arrows-split fs-20" style={{ color: '#5b47fb' }}></i>
                <h6 className="fw-bold text-dark mb-0 fs-15">Inspection Split &amp; Stock Routing</h6>
              </div>
              <span className="badge bg-white text-secondary border px-2.5 py-1 fs-12 fw-semibold">
                Total Inward: {totalReceivedMeters.toFixed(1)}m
              </span>
            </div>

            <div className="row g-3">
              {/* Approved Good Material */}
              <div className="col-12 col-md-6">
                <div className="p-3.5 rounded-3 bg-white border border-success border-opacity-50 h-100 shadow-2xs">
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="fs-12 text-secondary fw-semibold">Good / Approved Material</span>
                    <span className="badge bg-success-subtle text-success border border-success border-opacity-25 fs-11 fw-semibold">
                      <i className="ti ti-check me-1"></i>Routes to Stock Pool
                    </span>
                  </div>
                  <div className="fs-24 fw-bold text-success">
                    {goodMeters.toFixed(1)} <span className="fs-14 fw-normal text-muted">meters</span>
                  </div>
                  <div className="fs-11 text-muted mt-1.5">
                    {goodMeters > 0
                      ? 'Approved portion moves directly to Stock Pool balance.'
                      : 'Entire material is held back or rejected.'}
                  </div>
                </div>
              </div>

              {/* Defective Material - Held Back for Admin */}
              <div className="col-12 col-md-6">
                <div className={`p-3.5 rounded-3 bg-white border h-100 shadow-2xs ${totalHeldBackMeters > 0 ? 'border-warning border-opacity-75 bg-warning-subtle' : 'border-secondary-subtle'}`}>
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="fs-12 text-secondary fw-semibold">Held Back for Admin Review</span>
                    <span className={`badge fs-11 fw-semibold ${totalHeldBackMeters > 0 ? 'bg-warning text-dark' : 'bg-light text-muted'}`}>
                      {totalHeldBackMeters > 0 ? `${issuePieces.length} Piece(s) Flagged` : '0 Defect'}
                    </span>
                  </div>
                  <div className={`fs-24 fw-bold ${totalHeldBackMeters > 0 ? 'text-warning' : 'text-secondary'}`}>
                    {totalHeldBackMeters.toFixed(1)} <span className="fs-14 fw-normal text-muted">meters</span>
                  </div>
                  <div className="fs-11 text-muted mt-1.5">
                    {totalHeldBackMeters > 0
                      ? 'Only this defective portion goes to Admin for review. Good material passes to Stock Pool!'
                      : 'No defects flagged. Whole lot passes directly to Stock Pool.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pt-2">
            <button
              type="button"
              className="btn btn-white border px-3 py-2 fs-13 text-secondary shadow-sm rounded-3"
              style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
              onClick={onBack}
            >
              <i className="ti ti-arrow-left me-1"></i>
              <span>Back / Cancel</span>
            </button>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <button
                type="button"
                className="btn btn-danger d-inline-flex align-items-center gap-1.5 px-3 py-2 fw-semibold fs-13 shadow-sm rounded-3"
                onClick={() => {
                  setFormData({ ...formData, qcStatus: 'Reject' });
                  handleSubmit('Reject');
                }}
                title="Reject entire shipment"
              >
                <i className="ti ti-circle-x fs-15"></i>
                <span>Reject Entire ({totalReceivedMeters.toFixed(1)}m)</span>
              </button>

              <button
                type="button"
                className="btn btn-warning text-dark d-inline-flex align-items-center gap-1.5 px-3 py-2 fw-semibold fs-13 shadow-sm rounded-3"
                onClick={() => {
                  setFormData({ ...formData, qcStatus: 'Send for Admin Approval' });
                  handleSubmit('Send for Admin Approval');
                }}
                title="Send entire shipment to Admin"
              >
                <i className="ti ti-clock fs-15"></i>
                <span>Send Entire to Admin ({totalReceivedMeters.toFixed(1)}m)</span>
              </button>

              <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2 fw-semibold fs-13 text-white shadow-sm rounded-3"
                style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                onClick={() => {
                  setFormData({ ...formData, qcStatus: 'OK' });
                  handleSubmit('OK');
                }}
              >
                <i className="ti ti-circle-check fs-16"></i>
                <span>
                  Mark OK &rarr; Add Good Qty ({goodMeters.toFixed(1)}m) to Stock Pool
                  {totalHeldBackMeters > 0 ? ` (${totalHeldBackMeters.toFixed(1)}m to Admin)` : ''}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Added to Stock Pool Success Modal (Matches Demo modal) */}
      {successModalData && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2.5">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white"
                    style={{ width: '42px', height: '42px', backgroundColor: '#10b981' }}
                  >
                    <i className="ti ti-check fs-22"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark fs-18 mb-0">Added to Stock Pool</h5>
                    <span className="text-muted fs-12">Quality Inspection Complete</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setSuccessModalData(null);
                    if (onBack) onBack();
                  }}
                ></button>
              </div>

              <div className="modal-body px-4 py-3">
                <div className="p-3 rounded-3 bg-light border mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-secondary fs-12">Approved Quantity:</span>
                    <span className="fs-18 fw-bold text-success">{successModalData.goodQty.toFixed(1)}m</span>
                  </div>
                  <div className="text-muted fs-12">
                    is now available in the <strong>Stock Pool</strong> for cutting and production orders.
                  </div>
                </div>

                {successModalData.heldBackQty > 0 && (
                  <div className="p-3 rounded-3 bg-warning-subtle border border-warning border-opacity-50">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className="ti ti-alert-triangle text-warning fs-16"></i>
                      <span className="fw-bold text-dark fs-13">Portion Held Back for Admin</span>
                    </div>
                    <div className="text-secondary fs-12">
                      <strong>{successModalData.heldBackQty.toFixed(1)}m</strong> ({successModalData.issuePiecesCount} flagged piece/defect) was held back and routed to Admin Review register.
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 pt-0 pb-4 px-4 d-flex align-items-center justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3 fs-13"
                  onClick={() => {
                    setSuccessModalData(null);
                    if (onNavigateToGRN) onNavigateToGRN(successModalData.grnId);
                    else if (onBack) onBack();
                  }}
                >
                  Back to GRN
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-3.5 py-2 rounded-3 fs-13 text-white fw-semibold"
                  style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                  onClick={() => {
                    setSuccessModalData(null);
                    if (onNavigateToStockPool) onNavigateToStockPool();
                    else if (onBack) onBack();
                  }}
                >
                  <i className="ti ti-building-warehouse me-1"></i>
                  View Stock Pool &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
