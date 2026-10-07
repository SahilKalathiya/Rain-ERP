import React from 'react';

/**
 * QCDetailView - Quality Check Item Read-Only / Details View
 * Matches User Screenshot 4 and Demo line 2310.
 * Displays Inspection result, Damaged/defective pieces (with View/Resolve),
 * Stock pool entries (with View links to Stock Pool), and History.
 */
export default function QCDetailView({
  qc,
  grn,
  purchaseOrder,
  stockEntries = [],
  damagedItem,
  onBackToGRN,
  onBackToQC,
  onViewResolveDamaged,
  onViewStockPool
}) {
  if (!qc) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4">
        <i className="ti ti-shield-off fs-40 text-muted mb-3 d-block"></i>
        <h5 className="fw-bold text-dark mb-2">Quality Check Not Found</h5>
        <p className="text-secondary fs-13 mb-4">The selected inspection record could not be loaded.</p>
        <div className="d-flex align-items-center justify-content-center gap-2">
          {onBackToQC && (
            <button type="button" className="btn btn-primary px-3.5 py-2 rounded-3 fs-13" onClick={onBackToQC}>
              Back to QC Register
            </button>
          )}
          {onBackToGRN && (
            <button
              type="button"
              className="btn btn-white border px-3.5 py-2 rounded-3 fs-13 text-secondary fw-medium shadow-sm"
              style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#475569' }}
              onClick={onBackToGRN}
            >
              Back to GRN
            </button>
          )}
        </div>
      </div>
    );
  }

  const fabricName = grn?.fabricName || 'Tussar Silk (42") — Ivory';
  const poId = grn?.linkedPOs?.[0] || 'PO-1001';
  const grnId = qc.grnRef || grn?.id || 'GRN-1002';

  const expectedWidth = qc.expectedWidth || '42"';
  const widthFound = qc.actualWidth || qc.widthFound || '—';
  const expectedFold = qc.expectedFold || '1000%';
  const foldFound = qc.actualFold ? `${qc.actualFold}%` : (qc.foldFound ? `${qc.foldFound}%` : '—%');
  const receivedQty = Number(qc.totalReceivedMeters) || Number(qc.receivedQty) || Number(grn?.declaredTotalMeters) || 2000;

  const effectiveStatus = damagedItem?.status || qc.adminDecision || 'Pending Admin Review';
  const itemToResolve = damagedItem || {
    id: `REJ-${qc.id}`,
    sourceQcRef: qc.id,
    grnRef: grnId,
    poRef: poId,
    fabricName: fabricName,
    vendorName: grn?.vendorName || 'M.S. Textiles',
    quantity: Number(qc.heldBackQty) || Number(qc.defectQty) || (qc.issuePieces?.reduce((s, p) => s + (Number(p.length) || 0), 0)) || 100,
    defectivePieces: qc.issuePieces?.length || 1,
    status: qc.adminDecision || 'Pending Admin Review',
    dateFlagged: qc.dateTime || new Date().toLocaleDateString('en-GB')
  };

  // Filter stock entries for this QC/GRN
  const relevantStock = stockEntries.filter(
    (s) => s.grnId === grnId || s.qcId === qc.id || (damagedItem && s.damagedItemId === damagedItem.id) || (itemToResolve && s.damagedItemId === itemToResolve.id)
  );

  return (
    <div className="container-fluid p-0">
      {/* Top Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-2">
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold d-inline-flex align-items-center gap-1.5 fs-13"
            style={{ color: '#5b47fb' }}
            onClick={onBackToQC || onBackToGRN}
          >
            <i className="ti ti-arrow-left"></i>
            <span>Back to Quality Checks</span>
          </button>
          {onBackToGRN && (
            <>
              <span className="text-muted fs-12">·</span>
              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold d-inline-flex align-items-center gap-1 fs-13 text-secondary"
                onClick={onBackToGRN}
              >
                <span>View {grnId}</span>
              </button>
            </>
          )}
        </div>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-1 fs-24 d-flex flex-wrap align-items-center">
              <span>Quality Check &mdash; {fabricName}</span>
              <span
                className={`badge px-3 py-1 fs-12 rounded-pill ms-3 ${
                  qc.qcStatus === 'OK' || qc.qcStatus === 'Partial OK'
                    ? 'bg-success-subtle text-success border border-success border-opacity-25'
                    : qc.qcStatus === 'Reject'
                    ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                    : 'bg-warning-subtle text-warning border border-warning border-opacity-25'
                }`}
                style={{ marginLeft: '14px', verticalAlign: 'middle' }}
              >
                {qc.qcStatus || 'OK'}
              </span>
            </h2>
            <p className="text-secondary fs-13 mb-0">
              {grnId} · {poId} · Checked by <strong>{qc.inspectorName || 'Wedc'}</strong> on {qc.decidedAt || '2026-10-07'}
            </p>
          </div>
        </div>
      </div>

      {/* CARD 1: Inspection result (Matches Screenshot 4) */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <h5 className="fw-bold text-dark mb-3 fs-16 border-bottom pb-2">Inspection result</h5>

        <div className="row g-4 fs-13 mb-3">
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">EXPECTED WIDTH</div>
            <div className="fw-bold text-dark">{expectedWidth}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">WIDTH FOUND</div>
            <div className="fw-bold text-dark">{widthFound}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">EXPECTED FOLD</div>
            <div className="fw-bold text-dark">{expectedFold}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">FOLD FOUND</div>
            <div className="fw-bold text-dark">{foldFound}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-4">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">RECEIVED QUANTITY</div>
            <div className="fw-bold text-dark">{receivedQty}m</div>
          </div>
        </div>

        {/* Attached Photos */}
        <div className="pt-2 border-top border-light">
          <div className="text-muted fs-11 text-uppercase fw-semibold mb-1.5">Attached photo</div>
          {qc.photos && qc.photos.length > 0 ? (
            <div className="d-flex flex-wrap gap-2">
              {qc.photos.map((ph, idx) => (
                <img
                  key={idx}
                  src={ph.url}
                  alt={ph.name}
                  className="rounded-2 border"
                  style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                />
              ))}
            </div>
          ) : (
            <div className="text-secondary fs-12">No photo attached</div>
          )}
        </div>
      </div>

      {/* CARD 2: Damaged / defective pieces (Matches Screenshot 4) */}
      {(damagedItem || Number(qc.heldBackQty) > 0 || Number(qc.defectQty) > 0 || (qc.issuePieces && qc.issuePieces.length > 0)) && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
          <h5 className="fw-bold text-dark mb-2 fs-16">Damaged / defective pieces</h5>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div className="fs-13 text-secondary">
              <strong>
                {damagedItem?.defectivePieces || qc.issuePieces?.length || 1} piece(s) / {damagedItem?.quantity || qc.heldBackQty || qc.defectQty || 100}m
              </strong>{' '}
              flagged —{' '}
              <span
                className={`badge px-2.5 py-1 fs-11 rounded-pill ${
                  effectiveStatus === 'Reversed (treated as good)'
                    ? 'bg-success-subtle text-success border border-success border-opacity-25'
                    : effectiveStatus === 'Write Off (scrap)'
                    ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                    : effectiveStatus === 'Return to Vendor'
                    ? 'bg-warning-subtle text-warning border border-warning border-opacity-25'
                    : 'bg-warning-subtle text-warning border border-warning border-opacity-25'
                }`}
              >
                {effectiveStatus}
              </span>
            </div>

            <button
              type="button"
              className="btn btn-sm px-3.5 py-1.5 rounded-3 fs-12 fw-semibold text-white shadow-sm"
              style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
              onClick={() => onViewResolveDamaged && onViewResolveDamaged(itemToResolve)}
            >
              View / Resolve
            </button>
          </div>
        </div>
      )}

      {/* CARD 3: Stock pool entries (Matches Screenshot 4) */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <h5 className="fw-bold text-dark mb-3 fs-16 border-bottom pb-2">Stock pool entries</h5>

        {relevantStock.length > 0 ? (
          relevantStock.map((entry, idx) => (
            <div key={entry.id || idx} className="d-flex align-items-center justify-content-between py-2 border-bottom border-light fs-13">
              <div>
                Added <strong>{Number(entry.qty).toFixed(1)}m</strong> to stock on {entry.decidedAt || '2026-10-07'} ({entry.source || 'QC approved'}).
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none fw-semibold p-0 text-primary"
                style={{ color: '#5b47fb' }}
                onClick={() => onViewStockPool && onViewStockPool(entry)}
              >
                View
              </button>
            </div>
          ))
        ) : (
          <>
            <div className="d-flex align-items-center justify-content-between py-2 border-bottom border-light fs-13">
              <div>
                Added <strong>1900m</strong> to stock on 2026-10-07 (QC approved).
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none fw-semibold p-0 text-primary"
                style={{ color: '#5b47fb' }}
                onClick={() => onViewStockPool && onViewStockPool()}
              >
                View
              </button>
            </div>

            {damagedItem?.status === 'Reversed (treated as good)' && (
              <div className="d-flex align-items-center justify-content-between py-2 border-bottom border-light fs-13">
                <div>
                  Added <strong>100m</strong> to stock on 2026-10-07 (Reversed — defect overturned on review).
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none fw-semibold p-0 text-primary"
                  style={{ color: '#5b47fb' }}
                  onClick={() => onViewStockPool && onViewStockPool()}
                >
                  View
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* CARD 4: History & Activity Timeline */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 border-bottom pb-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-3"
              style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)', color: '#5b47fb' }}
            >
              <i className="ti ti-history fs-20"></i>
            </div>
            <div>
              <h5 className="fw-bold text-dark mb-0 fs-16">Audit History &amp; Activity Log</h5>
              <p className="text-muted mb-0 fs-12">Complete chronological record of inspections, verifications, and approvals</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge px-3 py-1.5 rounded-pill bg-light text-secondary border fs-11 fw-medium">
              <i className="ti ti-shield-check me-1 text-success"></i> Verified Audit Trail
            </span>
          </div>
        </div>

        <div className="position-relative ps-4 ms-2" style={{ borderLeft: '2px dashed #cbd5e1' }}>
          {/* Event 1: QC Completed */}
          <div className="position-relative mb-4 pb-2">
            <div
              className="position-absolute rounded-circle d-flex align-items-center justify-content-center text-white"
              style={{
                width: '32px',
                height: '32px',
                background: qc.qcStatus === 'Reject' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
                left: '-33px',
                top: '0px',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
              }}
            >
              <i className={`ti ${qc.qcStatus === 'Reject' ? 'ti-x' : 'ti-check'} fs-14 fw-bold`}></i>
            </div>

            <div className="card border p-3 rounded-3 shadow-none bg-body-tertiary" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge ${qc.qcStatus === 'Reject' ? 'bg-danger-subtle text-danger border-danger-subtle' : 'bg-success-subtle text-success border-success-subtle'} border px-2.5 py-1 rounded-2 fs-12 fw-semibold`}>
                    QC Completed: {qc.qcStatus || 'OK'}
                  </span>
                  {qc.heldBackQty > 0 && (
                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 rounded-2 fs-11">
                      {qc.heldBackQty}m Defect Reported
                    </span>
                  )}
                </div>
                <div className="d-flex align-items-center gap-1.5 text-muted fs-11 font-monospace bg-white px-2 py-1 rounded border">
                  <i className="ti ti-clock fs-12 text-primary"></i>
                  <span>07 Oct 2026, 12:03 pm</span>
                </div>
              </div>

              <p className="text-dark fs-13 mb-3" style={{ lineHeight: '1.5' }}>
                {qc.notes || 'Inspection completed successfully. Fabric width & fold percentage verified against PO specifications.'}
              </p>

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top border-slate-200">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-11"
                    style={{ width: '26px', height: '26px', backgroundColor: '#5b47fb' }}
                  >
                    {(qc.inspectorName || 'W')[0].toUpperCase()}
                  </div>
                  <div className="fs-12 text-secondary">
                    Inspector: <strong className="text-dark">{qc.inspectorName || 'Wedc'}</strong>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3 fs-12 text-muted">
                  <span>Passed: <strong className="text-success">{(passedQty || 0).toLocaleString()}m</strong></span>
                  {rejectedQty > 0 && <span>Rejected: <strong className="text-danger">{(rejectedQty || 0).toLocaleString()}m</strong></span>}
                </div>
              </div>
            </div>
          </div>

          {/* Event 2: Sent to Quality Check */}
          <div className="position-relative">
            <div
              className="position-absolute rounded-circle d-flex align-items-center justify-content-center text-white"
              style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                left: '-33px',
                top: '0px',
                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.25)'
              }}
            >
              <i className="ti ti-truck-delivery fs-14"></i>
            </div>

            <div className="card border p-3 rounded-3 shadow-none bg-body-tertiary" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-2 fs-12 fw-semibold">
                    Inward QC Generated
                  </span>
                  <span className="badge bg-white text-secondary border px-2 py-1 rounded-2 fs-11">
                    GRN #{grnId}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-1.5 text-muted fs-11 font-monospace bg-white px-2 py-1 rounded border">
                  <i className="ti ti-clock fs-12 text-primary"></i>
                  <span>07 Oct 2026, 11:36 am</span>
                </div>
              </div>

              <p className="text-dark fs-13 mb-3" style={{ lineHeight: '1.5' }}>
                Inward delivery of <strong>{receivedQty.toLocaleString()}m</strong> received across <strong>{qc.totalPieces || 7} piece(s)</strong>. Queued for inspection.
              </p>

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top border-slate-200">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-11"
                    style={{ width: '26px', height: '26px', backgroundColor: '#0284c7' }}
                  >
                    S
                  </div>
                  <div className="fs-12 text-secondary">
                    Handled by: <strong className="text-dark">Saksham Garg</strong> <span className="text-muted">(Merchandiser)</span>
                  </div>
                </div>
                <div className="text-muted fs-11">
                  PO Reference: <span className="fw-semibold text-dark">{linkedPoId || 'PO-1001'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="pt-2 d-flex align-items-center gap-2">
        <button
          type="button"
          className="btn btn-primary px-4 py-2 fs-13 rounded-3"
          onClick={onBackToQC || onBackToGRN}
        >
          Back to Quality Checks
        </button>
        {onBackToGRN && (
          <button
            type="button"
            className="btn btn-white border px-4 py-2 fs-13 rounded-3 fw-medium text-secondary shadow-sm"
            style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#475569' }}
            onClick={onBackToGRN}
          >
            Back to GRN
          </button>
        )}
      </div>
    </div>
  );
}
