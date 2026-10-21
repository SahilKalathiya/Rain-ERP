import React, { useState } from 'react';

/**
 * ProcessQCView - Quality Control, Defect Management & Lot Splitting
 * Strict implementation of Section 6 of PDF Specification
 * Features:
 * - List / Queue Overview with 4 high-contrast KPI cards
 * - Fully clickable rows: clicking any piece row bar opens the full QC inspection form ("under javu")
 * - Proper padding, margins, enterprise layout
 * - Branching logic: Accepted vs Full Rejection
 * - Rejection: Reprocess (no payment Job Work Challan) vs Scrap
 * - Accepted: Piece Division (Stitch Cuts e.g. 63.1m -> 30m + 33.1m) vs Lot Division (Shade Sorting Batch 1 vs Batch 2)
 * - Handwritten defect log photo & Adjusted Yield (Page 25 pink slip)
 * - Color Fastness Pass/Fail with swatch proof image
 */
export default function ProcessQCView({ qcRecords = [], onSaveQC }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'inspect'
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');

  // Currently inspected piece state
  const [selectedPiece, setSelectedPiece] = useState({
    id: 'PQC-0001',
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

  // Open a specific piece for inspection
  const handleOpenPieceQC = (record) => {
    setSelectedPiece({
      id: record.id || `PQC-${Date.now().toString().slice(-4)}`,
      piece_no: record.piece_no || 1,
      original_length: parseFloat(record.original_length) || 100.00,
      color_name: record.color_name || 'Beige',
      vendor_challan_ref: record.vendor_challan_ref || `Return ${record.return_id || '#PRN-2196'}`
    });

    setQcOutcome(record.qc_outcome || 'Accepted');
    setRejectionAction(record.rejection_action || 'Reprocess');
    setDivisionType(record.division_type || (record.qc_outcome === 'Accepted' ? 'None' : 'None'));
    setPieceSplits(record.piece_splits && record.piece_splits.length > 0 ? record.piece_splits : [
      { piece_suffix: 'A', meters: Number((record.original_length / 2).toFixed(2)) || 50, notes: 'Split cut 1' },
      { piece_suffix: 'B', meters: Number((record.original_length / 2).toFixed(2)) || 50, notes: 'Split cut 2' }
    ]);
    setLotBatchId(record.lot_batch_id || 'Batch 1 - Standard Shade');
    setPaperDefectPhoto(record.paper_qc_report_photo || null);
    setAdjustedYield(record.adjusted_yield || Math.floor((record.original_length || 100) / 2.6));
    setColorFastness(record.color_fastness || 'Pass');
    setColorFastnessProof(record.color_fastness_proof_photo || null);
    setNotes(record.notes || '');

    setViewMode('inspect');
  };

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
      id: selectedPiece.id || `PQC-${Date.now().toString().slice(-4)}`,
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

    if (onSaveQC) {
      onSaveQC(payload);
    }
    setViewMode('list');
  };

  // Filtered QC records
  const filteredRecords = qcRecords.filter((q) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (q.id && q.id.toLowerCase().includes(term)) ||
      (q.return_id && q.return_id.toLowerCase().includes(term)) ||
      (q.notes && q.notes.toLowerCase().includes(term)) ||
      (q.inspector_name && q.inspector_name.toLowerCase().includes(term)) ||
      `than #${q.piece_no}`.includes(term);

    const matchesOutcome =
      outcomeFilter === 'ALL' ||
      (outcomeFilter === 'Accepted' && q.qc_outcome === 'Accepted') ||
      (outcomeFilter === 'Full Rejection' && q.qc_outcome === 'Full Rejection');

    return matchesSearch && matchesOutcome;
  });

  // KPI Calculations
  const totalInspected = qcRecords.length;
  const acceptedCount = qcRecords.filter(q => q.qc_outcome === 'Accepted').length;
  const rejectedCount = qcRecords.filter(q => q.qc_outcome === 'Full Rejection').length;
  const totalInspectedMeters = qcRecords.reduce((acc, q) => acc + (parseFloat(q.original_length) || 0), 0);

  return (
    <div className="process-qc-container">
      {/* ========================================================================= */}
      {/* MODE 1: QC QUEUE / LIST VIEW (TOP KPI CARDS + CLICKABLE ROWS)             */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div>
          {/* Top KPI Summary Cards */}
          <div className="row g-3 mb-4">
            {/* Card 1: Total Inspected */}
            <div className="col-12 col-sm-6 col-md-3">
              <div
                className="card border-0 shadow-sm p-3 h-100"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px'
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                      Inspected Thans
                    </span>
                    <h3 className="mb-0 fw-bold text-dark mt-1 fs-24">{totalInspected}</h3>
                  </div>
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
                    style={{
                      width: '42px',
                      height: '42px',
                      background: 'rgba(79, 70, 229, 0.1)',
                      color: '#4f46e5'
                    }}
                  >
                    <i className="ti ti-checklist fs-22"></i>
                  </div>
                </div>
                <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
                  <i className="ti ti-ruler-2 text-primary fs-13"></i>
                  <span>{totalInspectedMeters.toFixed(1)} metres verified</span>
                </div>
              </div>
            </div>

            {/* Card 2: Accepted Goods */}
            <div className="col-12 col-sm-6 col-md-3">
              <div
                className="card border-0 shadow-sm p-3 h-100"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px'
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                      Accepted & Cleared
                    </span>
                    <h3 className="mb-0 fw-bold text-success mt-1 fs-24">{acceptedCount}</h3>
                  </div>
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
                    style={{
                      width: '42px',
                      height: '42px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#059669'
                    }}
                  >
                    <i className="ti ti-circle-check fs-22"></i>
                  </div>
                </div>
                <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
                  <span className="badge bg-success-subtle text-success fs-10 px-1.5 py-0.5 rounded">
                    {totalInspected > 0 ? Math.round((acceptedCount / totalInspected) * 100) : 100}% Pass Rate
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Rejections / Reprocess */}
            <div className="col-12 col-sm-6 col-md-3">
              <div
                className="card border-0 shadow-sm p-3 h-100"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px'
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                      Rejections / Reprocess
                    </span>
                    <h3 className="mb-0 fw-bold text-danger mt-1 fs-24">{rejectedCount}</h3>
                  </div>
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
                    style={{
                      width: '42px',
                      height: '42px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#dc2626'
                    }}
                  >
                    <i className="ti ti-refresh-alert fs-22"></i>
                  </div>
                </div>
                <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
                  <span className="badge bg-danger-subtle text-danger fs-10 px-1.5 py-0.5 rounded">
                    Zero payment obligation
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Inspector & Shift */}
            <div className="col-12 col-sm-6 col-md-3">
              <div
                className="card border-0 shadow-sm p-3 h-100"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px'
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                      Active QC Inspector
                    </span>
                    <h5 className="mb-0 fw-bold text-dark mt-1 fs-18">Priya Sharma</h5>
                  </div>
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
                    style={{
                      width: '42px',
                      height: '42px',
                      background: 'rgba(2, 132, 199, 0.1)',
                      color: '#0284c7'
                    }}
                  >
                    <i className="ti ti-user-check fs-22"></i>
                  </div>
                </div>
                <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
                  <i className="ti ti-clock text-info fs-13"></i>
                  <span>Floor Shift 1 • Quality Lab</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div
            className="card border mb-3 shadow-sm"
            style={{
              borderRadius: '10px',
              borderColor: '#e2e8f0',
              background: '#ffffff'
            }}
          >
            <div className="p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex flex-wrap align-items-center gap-2" style={{ flex: '1 1 500px' }}>
                <div className="input-group input-group-sm" style={{ width: '280px' }}>
                  <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderColor: '#cbd5e1' }}>
                    <i className="ti ti-search fs-14"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control bg-white border-start-0 fs-13"
                    placeholder="Search QC ID, Than #, return ref..."
                    style={{ borderColor: '#cbd5e1', height: '36px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-white border border-start-0 text-muted"
                      type="button"
                      style={{ borderColor: '#cbd5e1' }}
                      onClick={() => setSearchTerm('')}
                    >
                      <i className="ti ti-x fs-12"></i>
                    </button>
                  )}
                </div>

                <select
                  className="form-select form-select-sm bg-white fs-13"
                  style={{ width: '170px', height: '36px', borderColor: '#cbd5e1' }}
                  value={outcomeFilter}
                  onChange={(e) => setOutcomeFilter(e.target.value)}
                >
                  <option value="ALL">All Outcomes</option>
                  <option value="Accepted">Accepted Goods</option>
                  <option value="Full Rejection">Full Rejection</option>
                </select>
              </div>

              <div>
                <button
                  className="btn btn-primary btn-sm px-3.5 shadow-sm d-flex align-items-center gap-1.5"
                  style={{
                    background: '#4f46e5',
                    borderColor: '#4f46e5',
                    height: '36px',
                    borderRadius: '8px',
                    fontWeight: '600'
                  }}
                  onClick={() => {
                    handleOpenPieceQC({
                      id: `PQC-${Date.now().toString().slice(-4)}`,
                      piece_no: qcRecords.length + 1,
                      original_length: 100.00,
                      color_name: 'Beige',
                      vendor_challan_ref: 'Challan #2196 (Raju Dyeing)',
                      qc_outcome: 'Accepted',
                      division_type: 'None'
                    });
                  }}
                >
                  <i className="ti ti-plus fs-15"></i>
                  <span>+ Inspect New Than</span>
                </button>
              </div>
            </div>
          </div>

          {/* QC Inspection Queue Table */}
          <div
            className="card border shadow-sm"
            style={{
              borderRadius: '10px',
              borderColor: '#e2e8f0',
              background: '#ffffff',
              overflow: 'hidden'
            }}
          >
            <div className="px-3 py-2 bg-light border-bottom d-flex align-items-center justify-content-between">
              <small className="text-muted fs-12 d-flex align-items-center gap-1.5">
                <i className="ti ti-info-circle text-primary fs-14"></i>
                <span><strong>Tip:</strong> Click on any Than row bar to open and edit full Quality Control inspection details.</span>
              </small>
              <small className="text-secondary fs-12 fw-medium">
                Showing {filteredRecords.length} of {qcRecords.length} inspected pieces
              </small>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr style={{ color: '#475569', fontSize: '11.5px', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    <th className="py-2.5 ps-3" style={{ width: '120px' }}>QC ID</th>
                    <th style={{ width: '120px' }}>Than (Piece)</th>
                    <th style={{ width: '110px' }}>Length (m)</th>
                    <th style={{ width: '130px' }}>QC Outcome</th>
                    <th style={{ minWidth: '170px' }}>Division / Batch</th>
                    <th style={{ width: '110px' }}>Garment Yield</th>
                    <th style={{ width: '120px' }}>Fastness Rub</th>
                    <th style={{ width: '130px' }}>Inspector</th>
                    <th style={{ minWidth: '180px' }}>Notes</th>
                    <th className="text-end pe-3" style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-5 text-muted">
                        <div className="d-flex flex-column align-items-center">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                            style={{ width: '48px', height: '48px', background: '#f1f5f9', color: '#94a3b8' }}
                          >
                            <i className="ti ti-checklist fs-24"></i>
                          </div>
                          <span className="fw-semibold text-dark fs-14">No QC Records Found</span>
                          <small className="text-muted fs-12 mt-1">Try adjusting search filters.</small>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((q) => (
                      <tr
                        key={q.id}
                        onClick={() => handleOpenPieceQC(q)}
                        style={{
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                        title="Click anywhere to inspect or edit this piece"
                      >
                        {/* QC ID */}
                        <td className="ps-3 py-3">
                          <span
                            className="badge font-monospace fw-bold px-2 py-1.5"
                            style={{
                              background: 'rgba(79, 70, 229, 0.08)',
                              color: '#4338ca',
                              border: '1px solid rgba(79, 70, 229, 0.2)',
                              fontSize: '12px'
                            }}
                          >
                            {q.id}
                          </span>
                        </td>

                        {/* Than / Piece */}
                        <td className="fw-bold text-dark fs-13">
                          Than #{q.piece_no}
                          <small className="text-muted fs-11 d-block">{q.return_id}</small>
                        </td>

                        {/* Length */}
                        <td className="fw-semibold text-primary fs-13">
                          {Number(q.original_length).toFixed(2)} m
                        </td>

                        {/* Outcome */}
                        <td>
                          {q.qc_outcome === 'Accepted' ? (
                            <span
                              className="badge px-2.5 py-1 rounded-pill"
                              style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#047857',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                            >
                              <i className="ti ti-circle-check me-1"></i> Accepted
                            </span>
                          ) : (
                            <span
                              className="badge px-2.5 py-1 rounded-pill"
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#b91c1c',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                            >
                              <i className="ti ti-circle-x me-1"></i> Full Rejection
                            </span>
                          )}
                        </td>

                        {/* Division / Batch */}
                        <td>
                          {q.division_type === 'Piece Division' && (
                            <span
                              className="badge px-2 py-1"
                              style={{
                                background: 'rgba(2, 132, 199, 0.1)',
                                color: '#0369a1',
                                border: '1px solid rgba(2, 132, 199, 0.2)',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                            >
                              Split (2 Cuts)
                            </span>
                          )}
                          {q.division_type === 'Lot Division' && (
                            <span
                              className="badge px-2 py-1"
                              style={{
                                background: 'rgba(217, 119, 6, 0.1)',
                                color: '#b45309',
                                border: '1px solid rgba(217, 119, 6, 0.3)',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                            >
                              {q.lot_batch_id || 'Lot Split'}
                            </span>
                          )}
                          {q.division_type === 'None' && q.qc_outcome === 'Accepted' && (
                            <span className="text-secondary fs-12">Single Than</span>
                          )}
                          {q.qc_outcome === 'Full Rejection' && (
                            <span className="badge bg-danger-subtle text-danger fs-11">
                              Action: {q.rejection_action}
                            </span>
                          )}
                        </td>

                        {/* Yield */}
                        <td className="text-dark fw-semibold fs-13">
                          {q.adjusted_yield > 0 ? `${q.adjusted_yield} pcs` : '-'}
                        </td>

                        {/* Fastness */}
                        <td>
                          <span
                            className={`badge px-2 py-1 ${q.color_fastness === 'Pass' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'}`}
                            style={{ fontSize: '11px', fontWeight: '600' }}
                          >
                            {q.color_fastness === 'Pass' ? 'PASS' : 'FAIL'}
                          </span>
                        </td>

                        {/* Inspector */}
                        <td className="text-secondary fs-13 fw-medium">
                          {q.inspector_name || 'Priya Sharma'}
                        </td>

                        {/* Notes */}
                        <td className="text-muted fs-12 text-truncate" style={{ maxWidth: '220px' }}>
                          {q.notes || '-'}
                        </td>

                        {/* Actions */}
                        <td className="text-end pe-3">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm px-2.5 py-1 rounded-2 shadow-xs d-flex align-items-center gap-1 fs-12 fw-semibold ms-auto"
                            style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPieceQC(q);
                            }}
                          >
                            <i className="ti ti-pencil fs-13"></i>
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: QC INSPECTION FORM (PROPER PADDING, MARGINS, CLEAN TREE)          */}
      {/* ========================================================================= */}
      {viewMode === 'inspect' && (
        <div
          className="card border shadow-sm"
          style={{
            borderRadius: '12px',
            borderColor: '#e2e8f0',
            background: '#ffffff'
          }}
        >
          {/* Header */}
          <div
            className="p-3 px-4 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2"
            style={{ borderColor: '#e2e8f0', background: '#fafbfc' }}
          >
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-white btn-sm border shadow-xs d-flex align-items-center gap-1.5"
                style={{ borderColor: '#cbd5e1' }}
                onClick={() => setViewMode('list')}
              >
                <i className="ti ti-arrow-left fs-14"></i>
                <span className="fw-semibold">Back to QC Queue</span>
              </button>
              <div>
                <h5 className="mb-0 fw-bold text-dark fs-15">
                  Inspecting Than #{selectedPiece.piece_no} — {selectedPiece.original_length}m ({selectedPiece.color_name})
                </h5>
                <small className="text-muted fs-11">
                  Reference: {selectedPiece.vendor_challan_ref} • Section 6 PDF Compliance
                </small>
              </div>
            </div>

            <span
              className="badge px-3 py-1.5 rounded-pill fw-semibold fs-12"
              style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4338ca', border: '1px solid rgba(79, 70, 229, 0.2)' }}
            >
              <i className="ti ti-user-check me-1"></i> Inspector: Priya Sharma
            </span>
          </div>

          <form onSubmit={handleSaveCurrentQC}>
            <div className="p-4">
              {/* Level 1 Decision Branch: Outcome (Accepted vs Full Rejection) */}
              <div className="mb-4">
                <label className="form-label fs-12 fw-bold text-uppercase text-secondary mb-2 d-block">
                  Step 1: First-Level Quality Control Outcome *
                </label>
                <div className="row g-3">
                  <div className="col-md-6">
                    <button
                      type="button"
                      className={`btn w-100 p-3 text-start border rounded-3 d-flex align-items-center justify-content-between ${qcOutcome === 'Accepted' ? 'border-success bg-success-subtle shadow-xs' : 'border-light-subtle bg-white'}`}
                      style={{ transition: 'all 0.15s ease' }}
                      onClick={() => {
                        setQcOutcome('Accepted');
                        if (colorFastness === 'Fail') setColorFastness('Pass');
                      }}
                    >
                      <div>
                        <strong className="text-success fs-14 d-block mb-1">
                          <i className="ti ti-circle-check fs-16 me-1.5"></i>
                          ACCEPTED GOODS
                        </strong>
                        <small className="text-muted fs-11">
                          Passes inspection and proceeds to Fabric Stock / Cutting Room.
                        </small>
                      </div>
                      {qcOutcome === 'Accepted' && <i className="ti ti-check fs-18 text-success"></i>}
                    </button>
                  </div>

                  <div className="col-md-6">
                    <button
                      type="button"
                      className={`btn w-100 p-3 text-start border rounded-3 d-flex align-items-center justify-content-between ${qcOutcome === 'Full Rejection' ? 'border-danger bg-danger-subtle shadow-xs' : 'border-light-subtle bg-white'}`}
                      style={{ transition: 'all 0.15s ease' }}
                      onClick={() => setQcOutcome('Full Rejection')}
                    >
                      <div>
                        <strong className="text-danger fs-14 d-block mb-1">
                          <i className="ti ti-circle-x fs-16 me-1.5"></i>
                          FULL REJECTION
                        </strong>
                        <small className="text-muted fs-11">
                          Piece fails standards. Send for rectification reprocess or scrap.
                        </small>
                      </div>
                      {qcOutcome === 'Full Rejection' && <i className="ti ti-check fs-18 text-danger"></i>}
                    </button>
                  </div>
                </div>
              </div>

              {/* If Full Rejection: Reprocess vs Scrap */}
              {qcOutcome === 'Full Rejection' && (
                <div
                  className="p-3.5 mb-4 rounded-3 border"
                  style={{
                    background: 'rgba(239, 68, 68, 0.04)',
                    borderColor: 'rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2.5">
                    <span className="fw-bold text-danger text-uppercase fs-12">
                      <i className="ti ti-refresh-alert me-1"></i> Rejection Action Pathway (Section 6.2 A)
                    </span>
                    <span className="badge bg-danger text-white fs-11">No New Payment Obligation</span>
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
                          <strong className="text-danger d-block fs-13">Send for Reprocessing (Job Work Challan)</strong>
                          <small className="text-muted fs-11">
                            Issues a rectification Job Work Challan directly to vendor. Stays in the reprocessing loop until cleared.
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
                          <strong className="text-dark d-block fs-13">Scrap / Direct Reject to Stock</strong>
                          <small className="text-muted fs-11">
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
                <div
                  className="p-3.5 mb-4 rounded-3 border"
                  style={{
                    background: '#f8fafc',
                    borderColor: '#e2e8f0'
                  }}
                >
                  <label className="form-label fs-12 fw-bold text-uppercase text-secondary mb-2.5 d-block">
                    Step 2: Piece Division vs Lot/Batch Division (Section 6.2 B & C)
                  </label>

                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <div className={`form-check p-3 bg-white rounded-3 border ${divisionType === 'None' ? 'border-primary shadow-xs' : 'border-light-subtle'}`}>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="divRadio"
                          id="divNone"
                          checked={divisionType === 'None'}
                          onChange={() => setDivisionType('None')}
                        />
                        <label className="form-check-label ms-2" htmlFor="divNone">
                          <strong className="d-block fs-13">Standard Single Than</strong>
                          <small className="text-muted fs-11">No cuts or shade variances needed</small>
                        </label>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className={`form-check p-3 bg-white rounded-3 border ${divisionType === 'Piece Division' ? 'border-primary shadow-xs' : 'border-light-subtle'}`}>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="divRadio"
                          id="divPiece"
                          checked={divisionType === 'Piece Division'}
                          onChange={() => setDivisionType('Piece Division')}
                        />
                        <label className="form-check-label ms-2" htmlFor="divPiece">
                          <strong className="text-primary d-block fs-13">Piece Division (Stitch Cuts)</strong>
                          <small className="text-muted fs-11">Split join e.g. 63.1m → 30m + 33.1m</small>
                        </label>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className={`form-check p-3 bg-white rounded-3 border ${divisionType === 'Lot Division' ? 'border-warning shadow-xs' : 'border-light-subtle'}`}>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="divRadio"
                          id="divLot"
                          checked={divisionType === 'Lot Division'}
                          onChange={() => setDivisionType('Lot Division')}
                        />
                        <label className="form-check-label ms-2" htmlFor="divLot">
                          <strong className="text-warning-emphasis d-block fs-13">Lot Division (Shade Sorting)</strong>
                          <small className="text-muted fs-11">Group shade variances into distinct batches</small>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Piece Division Form */}
                  {divisionType === 'Piece Division' && (
                    <div className="p-3 bg-white rounded border border-primary-subtle mt-2">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold text-dark fs-12">Split Cuts for Machine Join / Defect Bypass:</span>
                        <button type="button" className="btn btn-outline-primary btn-xs" onClick={addSplitPiece}>
                          + Add Sub-Piece
                        </button>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-sm table-bordered align-middle mb-2" style={{ fontSize: '12px' }}>
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: '80px' }}>Suffix</th>
                              <th style={{ width: '120px' }}>Metres *</th>
                              <th>Defect / Cut Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pieceSplits.map((p, idx) => (
                              <tr key={idx}>
                                <td className="text-center fw-bold">{selectedPiece.piece_no}{p.piece_suffix}</td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm text-end"
                                    value={p.meters}
                                    onChange={(e) => handleSplitMeterChange(idx, e.target.value)}
                                    required
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="e.g. Join cut 1"
                                    value={p.notes}
                                    onChange={(e) => {
                                      const updated = [...pieceSplits];
                                      updated[idx].notes = e.target.value;
                                      setPieceSplits(updated);
                                    }}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="d-flex justify-content-between align-items-center fs-11">
                        <span className="text-muted">Original Length: <strong>{selectedPiece.original_length} m</strong></span>
                        <span className={isSplitMismatch ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                          Split Total: {splitSum.toFixed(2)} m {isSplitMismatch ? `(Mismatch: ${(splitSum - selectedPiece.original_length).toFixed(2)}m)` : '✓ Match'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Lot Division Form */}
                  {divisionType === 'Lot Division' && (
                    <div className="p-3 bg-white rounded border border-warning-subtle mt-2">
                      <label className="form-label small fw-bold">Assign to Shade Lot / Batch ID *</label>
                      <select
                        className="form-select form-select-sm"
                        value={lotBatchId}
                        onChange={(e) => setLotBatchId(e.target.value)}
                      >
                        <option value="Batch 1 - Standard Shade">Batch 1 - Standard Approved Shade</option>
                        <option value="Batch 2 - Lighter Shade (Isolate in Cutting)">Batch 2 - Lighter Shade (Isolate in Cutting)</option>
                        <option value="Batch 3 - Darker Shade (Isolate in Cutting)">Batch 3 - Darker Shade (Isolate in Cutting)</option>
                      </select>
                      <small className="text-muted mt-1 d-block fs-11">
                        Cutting-room planning keeps these lots strictly segregated to prevent tone mismatch in garments.
                      </small>
                    </div>
                  )}
                </div>
              )}

              {/* Defect Documentation, Yield & Fastness */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label fs-12 fw-bold text-secondary mb-1">
                    Handwritten QC Slip Photo (Page 25 Pink Slip)
                  </label>
                  <div className="d-flex align-items-center gap-2">
                    {paperDefectPhoto ? (
                      <img
                        src={paperDefectPhoto}
                        alt="QC Slip"
                        className="rounded border shadow-xs"
                        style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="rounded border bg-light d-flex align-items-center justify-content-center text-muted"
                        style={{ width: '64px', height: '64px' }}
                      >
                        <i className="ti ti-photo-off fs-20"></i>
                      </div>
                    )}
                    <div>
                      <label className="btn btn-outline-secondary btn-sm mb-1 fs-12">
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
                      <small className="text-muted d-block fs-10">Handwritten defect sheet</small>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <label className="form-label fs-12 fw-bold text-secondary mb-1">
                    Adjusted Garment Yield
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm fw-bold text-primary fs-13"
                    style={{ borderColor: '#cbd5e1', height: '36px', borderRadius: '6px' }}
                    value={adjustedYield}
                    onChange={(e) => setAdjustedYield(e.target.value)}
                  />
                  <small className="text-muted fs-10 mt-1 d-block">Estimated pcs after defect bypass</small>
                </div>

                <div className="col-md-5">
                  <label className="form-label fs-12 fw-bold text-secondary mb-1">
                    Color Fastness Rub/Wash Test *
                  </label>
                  <div className="d-flex gap-2">
                    <select
                      className={`form-select form-select-sm fw-bold fs-13 ${colorFastness === 'Pass' ? 'text-success border-success' : 'text-danger border-danger'}`}
                      style={{ height: '36px', borderRadius: '6px' }}
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

                    <label className="btn btn-outline-secondary btn-sm mb-0 text-nowrap fs-12 d-flex align-items-center">
                      <i className="ti ti-camera me-1"></i> Proof
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
                  <small className="text-muted fs-10 mt-1 d-block">
                    {colorFastness === 'Fail' ? '⚠️ Auto-routes to Rejection Reprocess branch' : 'Rub test passed within tolerance'}
                  </small>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fs-12 fw-bold text-secondary mb-1">
                  Inspector Notes & Defect Details
                </label>
                <textarea
                  className="form-control form-control-sm fs-13"
                  rows="2"
                  style={{ borderColor: '#cbd5e1', borderRadius: '6px' }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 3 weaving defects noted, rub test clean, continuous join split at 30m..."
                ></textarea>
              </div>

              {/* Submit / Cancel Footer */}
              <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-white btn-sm border"
                  style={{ borderColor: '#cbd5e1' }}
                  onClick={() => setViewMode('list')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-4 rounded-2 shadow-sm d-flex align-items-center gap-2"
                  style={{ background: '#4f46e5', border: 'none' }}
                >
                  <i className="ti ti-device-floppy fs-15"></i>
                  <span className="fw-semibold">Complete QC & Save Outcome</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
