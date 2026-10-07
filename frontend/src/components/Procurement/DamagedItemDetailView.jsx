import React, { useState } from 'react';

/**
 * DamagedItemDetailView - Admin Resolution of Damaged / Flagged Pieces
 * Matches User Screenshot 5 and Demo line 2132.
 * Allows Admin to:
 * - Write Off (scrap)
 * - Return to Vendor
 * - Reverse — Add to Stock After All
 * Automatically keeps Stock Pool in sync with the selected decision!
 */
export default function DamagedItemDetailView({
  damagedItem,
  onBack,
  onResolveDecision
}) {
  const [resolutionNote, setResolutionNote] = useState('');

  if (!damagedItem) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4">
        <i className="ti ti-alert-circle fs-40 text-muted mb-3 d-block"></i>
        <h5 className="fw-bold text-dark mb-2">Damaged Item Details Not Found</h5>
        <p className="text-secondary fs-13 mb-4">The flagged item record could not be loaded.</p>
        <div>
          <button type="button" className="btn btn-primary px-4 py-2 rounded-3" onClick={onBack}>
            Back to Quality Check
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = damagedItem.status || damagedItem.adminDecision || 'Pending Admin Review';
  const isCurrentlyInStock = currentStatus === 'Reversed (treated as good)';
  const qty = Number(damagedItem.quantity) || Number(damagedItem.defectiveQty) || 100;
  const piecesCount = damagedItem.defectivePieces || 1;
  const grnRef = damagedItem.grnRef || 'GRN-1002';
  const fabricName = damagedItem.fabricName || 'Tussar Silk (42") — Ivory';
  const dateStr = damagedItem.dateFlagged || damagedItem.reportedAt || '2026-10-07';

  const resolutions = [
    { key: 'Write Off (scrap)', label: 'Write Off (scrap)', btnClass: 'btn-outline-danger' },
    { key: 'Return to Vendor', label: 'Return to Vendor', btnClass: 'btn-outline-warning text-dark' },
    { key: 'Reversed (treated as good)', label: 'Reverse — Add to Stock After All', btnClass: 'btn-outline-success' }
  ];

  const handleApplyResolution = (decisionKey) => {
    if (onResolveDecision) {
      onResolveDecision(damagedItem, decisionKey, resolutionNote);
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Top Header */}
      <div className="mb-4">
        <button
          type="button"
          className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold d-inline-flex align-items-center gap-1.5 mb-2 fs-13"
          style={{ color: '#5b47fb' }}
          onClick={onBack}
        >
          <i className="ti ti-arrow-left"></i>
          <span>Back to Quality Check</span>
        </button>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-1 fs-24">Damaged item details</h2>
            <p className="text-secondary fs-13 mb-0">
              {grnRef} · {fabricName}
            </p>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="row g-4 fs-13">
          <div className="col-6 col-sm-3">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">DEFECTIVE PIECES</div>
            <div className="fw-bold text-dark">{piecesCount} piece(s)</div>
          </div>
          <div className="col-6 col-sm-3">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">DEFECTIVE QUANTITY</div>
            <div className="fw-bold text-dark">{qty}m</div>
          </div>
          <div className="col-12 col-sm-6">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">REASON</div>
            <div className="fw-bold text-dark">
              {damagedItem.reason || 'Flagged during piece-level QC — Bale 1, Piece 1 — Send for Admin Approval'}
            </div>
          </div>
          <div className="col-12">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">REPORTED</div>
            <div className="text-secondary">
              {dateStr} by {damagedItem.reportedBy || 'Saksham Garg'}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Resolution Card (Matches Screenshot 5) */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <h5 className="fw-bold text-dark mb-3 fs-16 border-bottom pb-2">Admin resolution</h5>

        {/* Stock Status Banner */}
        <div
          className={`p-3 rounded-3 mb-3 d-flex align-items-center gap-2 fs-13 fw-semibold ${
            isCurrentlyInStock
              ? 'bg-success-subtle text-success border border-success border-opacity-50'
              : 'bg-light text-secondary border'
          }`}
        >
          {isCurrentlyInStock ? (
            <>
              <i className="ti ti-check fs-18"></i>
              <span>Currently counted in the Stock Pool — {qty}m, added {dateStr}</span>
            </>
          ) : (
            <>
              <i className="ti ti-x fs-18"></i>
              <span>Not currently in the Stock Pool</span>
            </>
          )}
        </div>

        <p className="text-secondary fs-13 mb-3">
          Current resolution: <strong>{currentStatus}</strong>. Pick a different one below to change it — the Stock Pool will always be kept in sync with whichever is selected.
        </p>

        {/* Resolution Note */}
        <div className="mb-4" style={{ maxWidth: '650px' }}>
          <label className="form-label fs-12 fw-semibold text-secondary mb-1">
            Resolution note (optional)
          </label>
          <input
            type="text"
            className="form-control form-control-sm bg-white fs-13"
            placeholder="e.g. vendor agreed to credit note"
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
          />
        </div>

        {/* Action Buttons (Matches Screenshot 5) */}
        <div className="d-flex flex-wrap align-items-center gap-2 pt-2 border-top border-light">
          {resolutions.map((r) => {
            const isCurrent = currentStatus === r.key;
            return (
              <button
                key={r.key}
                type="button"
                className={`btn btn-sm px-3.5 py-2 rounded-3 fs-13 fw-semibold shadow-2xs ${
                  isCurrent
                    ? 'btn-success text-white'
                    : r.btnClass
                }`}
                style={isCurrent ? { backgroundColor: '#10b981', borderColor: '#10b981' } : {}}
                disabled={isCurrent}
                onClick={() => handleApplyResolution(r.key)}
                title={isCurrent ? 'This is the current resolution' : `Set resolution to ${r.label}`}
              >
                {r.label} {isCurrent ? '✓ current' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* History Card (Modern Audit Timeline) */}
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
              <h5 className="fw-bold text-dark mb-0 fs-16">Audit History &amp; Resolution Trail</h5>
              <p className="text-muted mb-0 fs-12">Log of flagging, inspection findings, and admin resolution decisions</p>
            </div>
          </div>
          <span className="badge px-3 py-1.5 rounded-pill bg-light text-secondary border fs-11 fw-medium">
            <i className="ti ti-shield-check me-1 text-success"></i> Audit Logged
          </span>
        </div>

        <div className="position-relative ps-4 ms-2" style={{ borderLeft: '2px dashed #cbd5e1' }}>
          {currentStatus && currentStatus !== 'Pending Admin Review' && (
            <div className="position-relative mb-4 pb-2">
              <div
                className="position-absolute rounded-circle d-flex align-items-center justify-content-center text-white"
                style={{
                  width: '32px',
                  height: '32px',
                  background: isCurrentlyInStock ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  left: '-33px',
                  top: '0px',
                  boxShadow: isCurrentlyInStock ? '0 4px 10px rgba(16, 185, 129, 0.3)' : '0 4px 10px rgba(245, 158, 11, 0.3)'
                }}
              >
                <i className={`ti ${isCurrentlyInStock ? 'ti-check' : 'ti-arrow-back-up'} fs-14 fw-bold`}></i>
              </div>

              <div className="card border p-3 rounded-3 shadow-none bg-body-tertiary" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${isCurrentlyInStock ? 'bg-success-subtle text-success border-success-subtle' : 'bg-warning-subtle text-warning border-warning-subtle'} border px-2.5 py-1 rounded-2 fs-12 fw-semibold`}>
                      Resolution: {currentStatus}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-1.5 text-muted fs-11 font-monospace bg-white px-2 py-1 rounded border">
                    <i className="ti ti-clock fs-12 text-primary"></i>
                    <span>{damagedItem.resolvedAt || '07 Oct 2026, 12:10 pm'}</span>
                  </div>
                </div>

                <p className="text-dark fs-13 mb-3" style={{ lineHeight: '1.5' }}>
                  Admin decision applied. {damagedItem.resolutionNote ? `Note: "${damagedItem.resolutionNote}"` : `Item resolved and routed accordingly.`}
                </p>

                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top border-slate-200">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-11"
                      style={{ width: '26px', height: '26px', backgroundColor: '#5b47fb' }}
                    >
                      S
                    </div>
                    <div className="fs-12 text-secondary">
                      Resolved by: <strong className="text-dark">Saksham Garg</strong> <span className="text-muted">(Merchandiser / Admin)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Initial Flagged Event */}
          <div className="position-relative">
            <div
              className="position-absolute rounded-circle d-flex align-items-center justify-content-center text-white"
              style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                left: '-33px',
                top: '0px',
                boxShadow: '0 4px 10px rgba(239, 68, 68, 0.25)'
              }}
            >
              <i className="ti ti-alert-triangle fs-14"></i>
            </div>

            <div className="card border p-3 rounded-3 shadow-none bg-body-tertiary" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1 rounded-2 fs-12 fw-semibold">
                    Flagged During QC Inspection
                  </span>
                </div>
                <div className="d-flex align-items-center gap-1.5 text-muted fs-11 font-monospace bg-white px-2 py-1 rounded border">
                  <i className="ti ti-clock fs-12 text-primary"></i>
                  <span>{dateStr}</span>
                </div>
              </div>

              <p className="text-dark fs-13 mb-3" style={{ lineHeight: '1.5' }}>
                {damagedItem.reason || 'Flagged during piece-level QC — Send for Admin Approval'}
              </p>

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top border-slate-200">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-11"
                    style={{ width: '26px', height: '26px', backgroundColor: '#e11d48' }}
                  >
                    {(damagedItem.reportedBy || 'S')[0].toUpperCase()}
                  </div>
                  <div className="fs-12 text-secondary">
                    Reported by: <strong className="text-dark">{damagedItem.reportedBy || 'Saksham Garg (Merchandiser)'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
