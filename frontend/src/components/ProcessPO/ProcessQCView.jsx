import React, { useState } from 'react';

/**
 * ProcessQCView - Quality Control, Defect Management & Lot Splitting
 * Strict implementation of Section 6 of PDF Specification
 * Features:
 * - Branching logic: Accepted vs Full Rejection
 * - Rejection: Reprocess (no payment Job Work Challan) vs Scrap
 * - Accepted: Piece Division (Stitch Cuts e.g. 63.1m -> 30m + 33.1m) vs Lot Division (Shade Sorting Batch 1 vs Batch 2)
 * - Handwritten defect log photo & Adjusted Yield (Page 25 pink slip)
 * - Color Fastness Pass/Fail with swatch proof image
 */
export default function ProcessQCView({ qcRecords = [], onSaveQC, onIssueReprocessChallan }) {
  const [selectedPiece, setSelectedPiece] = useState({
    piece_no: 10,
    original_length: 63.10,
    color_name: 'Beige',
    vendor_challan_ref: 'Challan #2196 (Raju Dyeing)'
  });

  // Decision Tree States
  const [qcOutcome, setQcOutcome] = useState('Accepted'); // 'Accepted' | 'Full Rejection'
  const [rejectionAction, setRejectionAction] = useState('Reprocess'); // 'Reprocess' | 'Scrap'
  const [divisionType, setDivisionType] = useState('Piece Division'); // 'None' | 'Piece Division' | 'Lot Division'
  
  // Piece Division (Stitch Cuts)
  const [pieceSplits, setPieceSplits] = useState([
    { piece_suffix: 'A', meters: 30.00, notes: 'Continuous machine join cut 1' },
    { piece_suffix: 'B', meters: 33.10, notes: 'Continuous machine join cut 2' }
  ]);

  // Lot Division (Shade Sorting)
  const [lotBatchId, setLotBatchId] = useState('Batch 1 - Standard Shade');
  
  // Defect Log & Yield Adjustments (Section 6.2 D & Page 25 pink slip)
  const [paperDefectPhoto, setPaperDefectPhoto] = useState(
    'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=400&h=300&fit=crop'
  );
  const [adjustedYield, setAdjustedYield] = useState(24);
  const [notes, setNotes] = useState('Middle machine stitch join discovered at 30.00m. Split into two clean cuts.');
  
  // Color Fastness Test
  const [colorFastness, setColorFastness] = useState('Pass'); // 'Pass' | 'Fail'
  const [colorFastnessProof, setColorFastnessProof] = useState(null);

  const handleSplitMeterChange = (index, value) => {
    const updated = [...pieceSplits];
    updated[index].meters = parseFloat(value) || 0;
    setPieceSplits(updated);
  };

  const addSplitPiece = () => {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    setPieceSplits([
      ...pieceSplits,
      {
        piece_suffix: letters[pieceSplits.length % letters.length],
        meters: 20.00,
        notes: ''
      }
    ]);
  };

  const splitSum = pieceSplits.reduce((acc, p) => acc + (parseFloat(p.meters) || 0), 0);
  const isSplitMismatch = Math.abs(splitSum - selectedPiece.original_length) > 0.05;

  const handleSaveCurrentQC = (e) => {
    e.preventDefault();
    if (divisionType === 'Piece Division' && isSplitMismatch) {
      if (!window.confirm(`Warning: Split sum (${splitSum.toFixed(2)}m) does not match original length (${selectedPiece.original_length}m). Continue?`)) {
        return;
      }
    }

    const payload = {
      id: `PQC-${Date.now().toString().slice(-4)}`,
      return_id: 'PRN-2196',
      piece_no: selectedPiece.piece_no,
      original_length: selectedPiece.original_length,
      qc_outcome: qcOutcome,
      rejection_action: qcOutcome === 'Full Rejection' ? rejectionAction : null,
      reprocessing_challan_id: rejectionAction === 'Reprocess' ? `PCH-${Math.floor(4900 + Math.random() * 100)}-REPROC` : null,
      reprocessing_loop_status: rejectionAction === 'Reprocess' ? 'In Loop' : 'Cleared',
      division_type: qcOutcome === 'Accepted' ? divisionType : 'None',
      piece_splits: divisionType === 'Piece Division' ? pieceSplits : [],
      lot_batch_id: divisionType === 'Lot Division' ? lotBatchId : 'Batch 1',
      paper_qc_report_photo: paperDefectPhoto,
      adjusted_yield: parseInt(adjustedYield, 10) || 0,
      color_fastness: colorFastness,
      color_fastness_proof_photo: colorFastnessProof,
      inspector_name: 'Priya Sharma',
      notes,
      created_at: new Date().toISOString()
    };

    onSaveQC(payload);
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      {/* Header */}
      <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
        <div>
          <h5 className="card-title mb-0 fw-bold text-dark">
            <i className="ti ti-checklist me-2 text-primary"></i>
            Quality Control, Defect Management & Lot Splitting
          </h5>
          <small className="text-muted">
            Section 6 & 12.4 Rules: Branching logic for Accepted (Piece/Lot Division) vs Full Rejection (Reprocess/Scrap)
          </small>
        </div>
        <span className="badge bg-primary px-3 py-2 fs-6">
          Inspector: Priya Sharma
        </span>
      </div>

      <div className="card-body p-4">
        {/* Selected Piece Info Bar */}
        <div className="p-3 mb-4 rounded border bg-light d-flex justify-content-between align-items-center">
          <div>
            <span className="text-muted small">Inspecting Item:</span>
            <div className="fw-bold fs-6 text-dark">
              Than #{selectedPiece.piece_no} — {selectedPiece.original_length} metres ({selectedPiece.color_name})
            </div>
            <div className="text-muted small">{selectedPiece.vendor_challan_ref}</div>
          </div>
          <div className="d-flex gap-2">
            <span className="badge bg-white text-dark border px-3 py-2">
              Original Roll Length: <strong>{selectedPiece.original_length} m</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveCurrentQC}>
          {/* Level 1 Decision Branch: Outcome (Accepted vs Full Rejection) */}
          <div className="mb-4">
            <label className="form-label small fw-bold text-uppercase text-muted d-block">
              Step 1: First-Level QC Outcome *
            </label>
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn py-2 fw-bold ${qcOutcome === 'Accepted' ? 'btn-success text-white shadow-sm' : 'btn-outline-success'}`}
                onClick={() => {
                  setQcOutcome('Accepted');
                  if (colorFastness === 'Fail') setColorFastness('Pass');
                }}
              >
                <i className="ti ti-circle-check me-2 fs-5"></i> ACCEPTED GOODS (Proceed to Stock / Cutting)
              </button>
              <button
                type="button"
                className={`btn py-2 fw-bold ${qcOutcome === 'Full Rejection' ? 'btn-danger text-white shadow-sm' : 'btn-outline-danger'}`}
                onClick={() => setQcOutcome('Full Rejection')}
              >
                <i className="ti ti-circle-x me-2 fs-5"></i> FULL REJECTION (Reprocess / Scrap)
              </button>
            </div>
          </div>

          {/* If Full Rejection: Reprocess vs Scrap */}
          {qcOutcome === 'Full Rejection' && (
            <div className="p-3 mb-4 rounded border border-danger-subtle bg-danger-subtle">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold text-danger text-uppercase small">
                  <i className="ti ti-refresh-alert me-1"></i> Rejection Action Pathway (Section 6.2 A)
                </span>
                <span className="badge bg-danger text-white">No New Payment Obligation</span>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="form-check p-3 bg-white rounded border border-danger">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="rejectionRadio"
                      id="rejReprocess"
                      checked={rejectionAction === 'Reprocess'}
                      onChange={() => setRejectionAction('Reprocess')}
                    />
                    <label className="form-check-label ms-2" htmlFor="rejReprocess">
                      <strong className="text-danger d-block">Send for Reprocessing (Job Work Challan)</strong>
                      <small className="text-muted">
                        Issues a rectification Job Work Challan directly to vendor. Stays in the reprocessing loop until final QC clears it.
                      </small>
                    </label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-check p-3 bg-white rounded border">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="rejectionRadio"
                      id="rejScrap"
                      checked={rejectionAction === 'Scrap'}
                      onChange={() => setRejectionAction('Scrap')}
                    />
                    <label className="form-check-label ms-2" htmlFor="rejScrap">
                      <strong className="text-dark d-block">Scrap / Direct Reject to Stock</strong>
                      <small className="text-muted">
                        Moves piece directly to Rejected Stock Pool for debit note or vendor return.
                      </small>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* If Accepted: Piece Division (Stitch Cutting) OR Lot/Batch Division (Shade Sorting) */}
          {qcOutcome === 'Accepted' && (
            <div className="p-3 mb-4 rounded border bg-light">
              <label className="form-label small fw-bold text-uppercase text-muted d-block">
                Step 2: Piece Division vs Lot/Batch Division (Section 6.2 B & C)
              </label>

              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <div className="form-check p-2 bg-white rounded border">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="divRadio"
                      id="divNone"
                      checked={divisionType === 'None'}
                      onChange={() => setDivisionType('None')}
                    />
                    <label className="form-check-label ms-2" htmlFor="divNone">
                      <strong className="d-block">Standard Single Than</strong>
                      <small className="text-muted">No cuts or shade variances needed</small>
                    </label>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="form-check p-2 bg-white rounded border border-primary">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="divRadio"
                      id="divPiece"
                      checked={divisionType === 'Piece Division'}
                      onChange={() => setDivisionType('Piece Division')}
                    />
                    <label className="form-check-label ms-2" htmlFor="divPiece">
                      <strong className="text-primary d-block">Piece Division (Stitch Cuts)</strong>
                      <small className="text-muted">Split join e.g. 63.1m → 30m + 33.1m</small>
                    </label>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="form-check p-2 bg-white rounded border border-warning">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="divRadio"
                      id="divLot"
                      checked={divisionType === 'Lot Division'}
                      onChange={() => setDivisionType('Lot Division')}
                    />
                    <label className="form-check-label ms-2" htmlFor="divLot">
                      <strong className="text-warning-emphasis d-block">Lot/Batch Division (Shade Sorting)</strong>
                      <small className="text-muted">Isolate shade variances (Batch 1 vs 2)</small>
                    </label>
                  </div>
                </div>
              </div>

              {/* Piece Division Form */}
              {divisionType === 'Piece Division' && (
                <div className="p-3 bg-white rounded border border-primary-subtle">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-primary small">
                      <i className="ti ti-scissors me-1"></i> Continuous Machine Stitch Joins — Split Pieces for Cutting Room
                    </span>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={addSplitPiece}>
                      <i className="ti ti-plus me-1"></i> + Add Split Sub-Piece
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle mb-2">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '80px' }}>Piece ID</th>
                          <th style={{ width: '150px' }}>Length (Mtrs) *</th>
                          <th>Cutting Master Notes / Join Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pieceSplits.map((sp, idx) => (
                          <tr key={idx}>
                            <td className="text-center fw-bold">#{selectedPiece.piece_no}-{sp.piece_suffix}</td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                className="form-control form-control-sm text-end fw-bold"
                                value={sp.meters}
                                onChange={(e) => handleSplitMeterChange(idx, e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={sp.notes}
                                onChange={(e) => {
                                  const updated = [...pieceSplits];
                                  updated[idx].notes = e.target.value;
                                  setPieceSplits(updated);
                                }}
                                placeholder="e.g. Join cut at 30m mark"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="fw-bold table-light">
                          <td className="text-end">Sum:</td>
                          <td className={`text-end ${isSplitMismatch ? 'text-danger' : 'text-success'}`}>
                            {splitSum.toFixed(2)} m
                          </td>
                          <td className="text-muted small">
                            Original: {selectedPiece.original_length} m {isSplitMismatch && '(Mismatch!)'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Lot / Batch Division Form */}
              {divisionType === 'Lot Division' && (
                <div className="p-3 bg-white rounded border border-warning-subtle">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Assign Shade Batch ID *</label>
                      <select
                        className="form-select form-select-sm"
                        value={lotBatchId}
                        onChange={(e) => setLotBatchId(e.target.value)}
                      >
                        <option value="Batch 1 - Standard Shade">Batch 1 — Standard Sample Shade</option>
                        <option value="Batch 2 - Lighter Shade (Isolate)">Batch 2 — 1/2 Tone Lighter Shade (Isolate in Cutting)</option>
                        <option value="Batch 3 - Darker Tint">Batch 3 — Darker Tone Tint (Isolate)</option>
                      </select>
                    </div>
                    <div className="col-md-6 d-flex align-items-center">
                      <div className="alert alert-warning py-1 px-3 mb-0 small border-warning">
                        <i className="ti ti-shield-alert me-1"></i>
                        <strong>Cutting Room Rule:</strong> Mixing Batch 1 and Batch 2 in the same garment run is strictly prevented by the system!
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Paper QC Defect Slip & Yield Adjustment (Section 6.2 D & Page 25 pink slip) */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label small fw-bold">
                <i className="ti ti-camera me-1 text-primary"></i> Paper QC Report Photo (Pink Slip Log)
              </label>
              <div className="d-flex align-items-center gap-3">
                {paperDefectPhoto ? (
                  <img
                    src={paperDefectPhoto}
                    alt="Defect log"
                    className="rounded border shadow-sm"
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="rounded border bg-light d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                    <i className="ti ti-photo-off text-muted fs-4"></i>
                  </div>
                )}
                <div>
                  <label className="btn btn-outline-secondary btn-sm mb-1">
                    <i className="ti ti-upload me-1"></i> Upload Slip
                    <input
                      type="file"
                      accept="image/*"
                      className="d-none"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setPaperDefectPhoto(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <small className="text-muted d-block" style={{ fontSize: '10px' }}>Handwritten inspector defect sheet</small>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-bold">Adjusted Garment Yield</label>
              <input
                type="number"
                className="form-control form-control-sm fw-bold text-primary"
                value={adjustedYield}
                onChange={(e) => setAdjustedYield(e.target.value)}
              />
              <small className="text-muted" style={{ fontSize: '10px' }}>Lowered from 25 to {adjustedYield} pcs due to defects/cuts</small>
            </div>

            {/* Color Fastness Test (Section 6.2 D) */}
            <div className="col-md-5">
              <label className="form-label small fw-bold">Color Fastness Rub/Wash Test *</label>
              <div className="d-flex gap-2">
                <select
                  className={`form-select form-select-sm fw-bold ${colorFastness === 'Pass' ? 'text-success border-success' : 'text-danger border-danger'}`}
                  value={colorFastness}
                  onChange={(e) => {
                    const val = e.target.value;
                    setColorFastness(val);
                    if (val === 'Fail') {
                      setQcOutcome('Full Rejection');
                      setRejectionAction('Reprocess');
                    }
                  }}
                >
                  <option value="Pass">PASS (Clean Swatch)</option>
                  <option value="Fail">FAIL (Staining / Crocking)</option>
                </select>

                <label className="btn btn-outline-secondary btn-sm mb-0 text-nowrap">
                  <i className="ti ti-camera me-1"></i> Proof Swatch
                  <input
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setColorFastnessProof(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <small className="text-muted" style={{ fontSize: '10px' }}>
                {colorFastness === 'Fail' ? '⚠️ Auto-routes to Rejection Reprocess branch' : 'Rub test passed within tolerance'}
              </small>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold">Inspector Notes & Defect Details</label>
            <textarea
              className="form-control form-control-sm"
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 3 weaving defects noted, rub test clean, continuous join split at 30m..."
            ></textarea>
          </div>

          <div className="d-flex justify-content-between align-items-center pt-3 border-top">
            <span className="text-muted small">
              Feeds directly into <strong>Cutting-Room Planning & Stock Ledger</strong>
            </span>
            <button type="submit" className="btn btn-primary btn-sm px-4">
              <i className="ti ti-device-floppy me-1"></i> Complete QC & Save Outcome
            </button>
          </div>
        </form>

        {/* Existing QC History Log Table */}
        <div className="mt-4 pt-3 border-top">
          <h6 className="fw-bold text-dark mb-2">Recent Quality Control Actions on Return #PRN-2196</h6>
          <div className="table-responsive border rounded">
            <table className="table table-sm table-striped align-middle mb-0" style={{ fontSize: '12px' }}>
              <thead className="table-light">
                <tr>
                  <th>QC ID</th>
                  <th>Piece</th>
                  <th>Length</th>
                  <th>Outcome</th>
                  <th>Division / Batch</th>
                  <th>Yield</th>
                  <th>Fastness</th>
                  <th>Inspector</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {qcRecords.map((q) => (
                  <tr key={q.id}>
                    <td className="fw-bold">{q.id}</td>
                    <td>Than #{q.piece_no}</td>
                    <td>{q.original_length} m</td>
                    <td>
                      {q.qc_outcome === 'Accepted' ? (
                        <span className="badge bg-success">Accepted</span>
                      ) : (
                        <span className="badge bg-danger">Full Rejection ({q.rejection_action})</span>
                      )}
                    </td>
                    <td>
                      {q.division_type === 'Piece Division' && (
                        <span className="badge bg-primary">Split (2 Cuts)</span>
                      )}
                      {q.division_type === 'Lot Division' && (
                        <span className="badge bg-warning text-dark">{q.lot_batch_id}</span>
                      )}
                      {q.division_type === 'None' && <span className="text-muted">-</span>}
                    </td>
                    <td>{q.adjusted_yield > 0 ? `${q.adjusted_yield} pcs` : '-'}</td>
                    <td>
                      <span className={`badge ${q.color_fastness === 'Pass' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                        {q.color_fastness}
                      </span>
                    </td>
                    <td>{q.inspector_name}</td>
                    <td className="text-truncate" style={{ maxWidth: '200px' }}>{q.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
