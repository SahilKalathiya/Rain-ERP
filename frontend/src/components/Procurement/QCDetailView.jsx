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
            <button type="button" className="btn btn-outline-secondary px-3.5 py-2 rounded-3 fs-13" onClick={onBackToGRN}>
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
            <h2 className="fw-bold text-dark mb-1 fs-24 d-flex align-items-center gap-2.5">
              <span>Quality Check — {fabricName}</span>
              <span
                className={`badge px-2.5 py-1 fs-11 rounded-pill ${
                  qc.qcStatus === 'OK' || qc.qcStatus === 'Partial OK'
                    ? 'bg-success-subtle text-success border border-success border-opacity-25'
                    : qc.qcStatus === 'Reject'
                    ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                    : 'bg-warning-subtle text-warning border border-warning border-opacity-25'
                }`}
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
              className="btn btn-outline-secondary btn-sm px-3 py-1 rounded-3 fs-12 fw-medium"
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

      {/* CARD 4: History (Matches Screenshot 4) */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <h5 className="fw-bold text-dark mb-3 fs-16">History</h5>

        <div className="position-relative ps-4 border-start border-2 ms-2">
          <div className="position-relative mb-3">
            <span
              className="position-absolute rounded-circle"
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: '#94a3b8',
                left: '-22px',
                top: '5px'
              }}
            />
            <div className="fs-12 text-secondary">
              <span className="text-dark fw-medium">07 Oct 2026, 12:03 pm</span> — Marked OK by QC — Wedc (with defect reported) (Saksham Garg (Merchandiser))
            </div>
          </div>

          <div className="position-relative mb-1">
            <span
              className="position-absolute rounded-circle"
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: '#94a3b8',
                left: '-22px',
                top: '5px'
              }}
            />
            <div className="fs-12 text-secondary">
              <span className="text-dark fw-medium">07 Oct 2026, 11:36 am</span> — Sent to Quality Check — Received 2000m across 7 piece(s) (Saksham Garg (Merchandiser))
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
            className="btn btn-outline-secondary px-4 py-2 fs-13 rounded-3"
            onClick={onBackToGRN}
          >
            Back to GRN
          </button>
        )}
      </div>
    </div>
  );
}
