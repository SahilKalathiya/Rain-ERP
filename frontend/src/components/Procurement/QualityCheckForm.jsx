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
  onSaveQC
}) {
  const isExisting = Boolean(qc && qc.id);

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
    qcStatus: qc?.qcStatus || 'OK', // OK / Send for Admin Approval / Reject
    adminDecision: qc?.adminDecision || '', // Approve / Reject
    adminRemarks: qc?.adminRemarks || '',
    dateTime: qc?.dateTime || new Date().toLocaleString('en-GB')
  });

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
        qcStatus: qc.qcStatus || 'OK',
        adminDecision: qc.adminDecision || '',
        adminRemarks: qc.adminRemarks || '',
        dateTime: qc.dateTime || new Date().toLocaleString('en-GB')
      });
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.qcStatus === 'Send for Admin Approval' && formData.adminDecision && !formData.adminRemarks.trim()) {
      alert('Admin Remarks / Justification is mandatory when an Admin decision is recorded.');
      return;
    }

    const payload = {
      ...formData,
      actualWidth: Number(formData.actualWidth) || 0,
      actualFold: Number(formData.actualFold) || 100
    };

    if (onSaveQC) {
      onSaveQC(payload);
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

          {/* Admin Decision Block (Present only when Send for Admin Approval, 6.1) */}
          {formData.qcStatus === 'Send for Admin Approval' && (
            <div className="p-3 bg-warning-subtle border border-warning rounded-3 mb-4">
              <h6 className="fw-bold text-dark mb-2 fs-14">
                <i className="ti ti-shield-check text-warning me-1"></i>
                Admin Decision &amp; Justification Sign-off
              </h6>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fs-12 fw-semibold mb-1">Admin Decision *</label>
                  <select
                    className="form-select form-select-sm bg-white fs-13"
                    value={formData.adminDecision}
                    onChange={(e) => setFormData({ ...formData, adminDecision: e.target.value })}
                  >
                    <option value="">Pending Decision...</option>
                    <option value="Approve">Approve (Override &amp; Move to Stock Pool)</option>
                    <option value="Reject">Reject (Move to Rejected Stock Pool)</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label fs-12 fw-semibold mb-1">
                    Admin Remarks / Justification * (Mandatory for audit trail)
                  </label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Enter explicit business reason or concession agreement with vendor..."
                    className="form-control form-control-sm bg-white fs-13"
                    value={formData.adminRemarks}
                    onChange={(e) => setFormData({ ...formData, adminRemarks: e.target.value })}
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="d-flex align-items-center justify-content-end gap-2">
            <button type="button" className="btn btn-light px-3 py-2 fs-13" onClick={onBack}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary px-4 py-2 fw-medium fs-13 shadow-sm rounded-3"
            >
              Submit Quality Inspection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
