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
  qualityChecks = [],
  onBack,
  onResolveDecision
}) {
  const [resolutionNote, setResolutionNote] = useState('');
  const [isModifyingDecision, setIsModifyingDecision] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleOpenPhoto = (ph) => {
    setSelectedPhotoModal(ph);
    setZoomScale(1);
    setRotation(0);
  };

  const handleClosePhoto = () => {
    setSelectedPhotoModal(null);
    setZoomScale(1);
    setRotation(0);
  };

  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoomScale(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedPhotoModal) return;
      if (e.key === 'Escape') handleClosePhoto();
      else if (e.key === '+' || e.key === '=') handleZoomIn();
      else if (e.key === '-') handleZoomOut();
      else if (e.key === '0') handleResetZoom();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoModal]);

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

  // Find linked QC to ensure any attached inspection photos are visible to Admin
  const linkedQc = (qualityChecks || []).find((q) => q && (q.id === damagedItem.sourceQcRef || q.id === damagedItem.id)) ||
    (() => {
      try {
        const stored = JSON.parse(localStorage.getItem('raindrop_qc_v1') || '[]');
        return stored.find((q) => q && (q.id === damagedItem.sourceQcRef || q.id === damagedItem.id || q.grnRef === damagedItem.grnRef));
      } catch (e) { return null; }
    })();

  const allAttachedPhotos = [
    ...(damagedItem.photos || []),
    ...(linkedQc?.photos || []),
    ...Object.values(linkedQc?.pieceInspections || {}).flatMap((p) => p?.photos || [])
  ];
  const uniquePhotos = Array.from(new Map(allAttachedPhotos.filter(Boolean).map((p) => [p.url || p.name, p])).values());

  const currentStatus = damagedItem.status || damagedItem.adminDecision || 'Pending Admin Review';
  const isCurrentlyInStock =
    currentStatus === 'Reversed (treated as good)' ||
    currentStatus === 'Approve' ||
    currentStatus === 'Approved' ||
    currentStatus === 'Approve — Add to Stock Pool' ||
    currentStatus.toLowerCase().includes('stock pool') ||
    currentStatus.toLowerCase().includes('good') ||
    currentStatus.toLowerCase().includes('approve');
  const qty = Number(damagedItem.quantity) || Number(damagedItem.defectiveQty) || 100;
  const piecesCount = damagedItem.defectivePieces || 1;
  const grnRef = damagedItem.grnRef || 'GRN-1002';
  const fabricName = damagedItem.fabricName || 'Tussar Silk (42") — Ivory';
  const dateStr = damagedItem.dateFlagged || damagedItem.reportedAt || '2026-10-07';
  const isAlreadyDecided =
    currentStatus === 'Reversed (treated as good)' ||
    currentStatus === 'Return to Vendor' ||
    currentStatus === 'Write Off (scrap)' ||
    currentStatus === 'Transferred to Stock' ||
    currentStatus === 'Approved' ||
    currentStatus === 'Sold';

  const resolutions = [
    { key: 'Reversed (treated as good)', label: 'Approve — Add to Stock Pool', btnClass: 'btn-outline-success' },
    { key: 'Return to Vendor', label: 'Return to Vendor (RTV)', btnClass: 'btn-outline-warning text-dark' },
    { key: 'Write Off (scrap)', label: 'Write Off (scrap)', btnClass: 'btn-outline-danger' }
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

      {/* Attached Photos / Defect Evidence Card (For Admin Review) */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <div className="d-flex align-items-center gap-2">
            <span className="p-1.5 rounded-circle bg-primary-subtle text-primary">
              <i className="ti ti-photo fs-16"></i>
            </span>
            <h5 className="fw-bold text-dark mb-0 fs-16">Defect Evidence &amp; Attached Photos</h5>
          </div>
          {uniquePhotos.length > 0 && (
            <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 px-2.5 py-1 fs-11 rounded-pill fw-semibold">
              {uniquePhotos.length} Photo{uniquePhotos.length !== 1 ? 's' : ''} Attached
            </span>
          )}
        </div>

        {uniquePhotos.length > 0 ? (
          <div className="row g-3">
            {uniquePhotos.map((ph, idx) => (
              <div key={idx} className="col-6 col-sm-4 col-md-3 col-lg-2">
                <div
                  className="card border rounded-3 p-1.5 h-100 bg-light position-relative shadow-2xs hover-shadow transition-all"
                  style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                  onClick={() => handleOpenPhoto(ph)}
                  title="Click to zoom / view full photo"
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div className="position-relative overflow-hidden rounded-2">
                    <img
                      src={ph.url}
                      alt={ph.name}
                      className="w-100"
                      style={{ height: '110px', objectFit: 'cover' }}
                    />
                    <div
                      className="position-absolute bottom-0 end-0 bg-dark bg-opacity-75 text-white rounded-start px-1.5 py-0.5 d-flex align-items-center"
                      style={{ fontSize: '10px' }}
                      title="Click to zoom"
                    >
                      <i className="ti ti-zoom-in"></i>
                    </div>
                  </div>
                  <div className="pt-1.5 px-1">
                    <div className="text-truncate fw-semibold text-dark fs-11" title={ph.name}>
                      {ph.name}
                    </div>
                    {ph.time && <div className="text-muted fs-10">{ph.time}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 bg-light rounded-3 border text-muted fs-13">
            <i className="ti ti-photo-off fs-24 mb-1 d-block text-secondary"></i>
            No defect photos were attached during inspection.
          </div>
        )}
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

        {isAlreadyDecided && !isModifyingDecision ? (
          <div className="p-3.5 rounded-3 bg-light border d-flex flex-wrap align-items-center justify-content-between gap-3 mb-2">
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle bg-success text-white shadow-xs"
                style={{ width: '32px', height: '32px', flexShrink: 0 }}
              >
                <i className="ti ti-check fs-18"></i>
              </div>
              <div>
                <div className="fw-bold text-dark fs-14">
                  Decision Finalized by Admin: <span className="text-success">{currentStatus}</span>
                </div>
                <div className="text-secondary fs-12">
                  {isCurrentlyInStock
                    ? `Admin approved this fabric quality. ${qty}m has been transferred to and is currently active in the Main Stock Pool.`
                    : `Admin finalized this disposition as ${currentStatus}.`}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-3 py-1.5 rounded-3 fs-12 fw-medium d-inline-flex align-items-center gap-1.5"
              onClick={() => setIsModifyingDecision(true)}
            >
              <i className="ti ti-edit"></i>
              <span>Change Resolution</span>
            </button>
          </div>
        ) : (
          <>
            <p className="text-secondary fs-13 mb-3">
              {isModifyingDecision ? 'Choose a new resolution below:' : (
                <>Current resolution: <strong>{currentStatus}</strong>. Pick a different one below to change it &mdash; the Stock Pool will always be kept in sync with whichever is selected.</>
              )}
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
                    onClick={() => {
                      handleApplyResolution(r.key);
                      setIsModifyingDecision(false);
                    }}
                    title={isCurrent ? 'This is the current resolution' : `Set resolution to ${r.label}`}
                  >
                    {r.label} {isCurrent ? '✓ current' : ''}
                  </button>
                );
              })}
              {isModifyingDecision && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-secondary text-decoration-none ms-2 fs-12"
                  onClick={() => setIsModifyingDecision(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        )}
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

      {/* FULL PHOTO ZOOM / LIGHTBOX MODAL */}
      {selectedPhotoModal && (
        <div
          className="modal show d-block"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(5px)',
            zIndex: 1075
          }}
          tabIndex="-1"
          onClick={handleClosePhoto}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-xl"
            style={{ maxWidth: '92vw', height: '92vh', margin: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content rounded-4 border-0 shadow-2xl overflow-hidden bg-dark text-white d-flex flex-column"
              style={{ height: '90vh' }}
            >
              {/* Modal Header */}
              <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-2.5 bg-dark d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2 text-truncate me-3">
                  <span className="p-1.5 rounded-circle bg-primary bg-opacity-25 text-white">
                    <i className="ti ti-photo fs-16"></i>
                  </span>
                  <div className="text-truncate">
                    <h6 className="modal-title fw-bold text-white fs-14 mb-0 text-truncate">
                      {selectedPhotoModal.name || 'Defect Evidence Photo'}
                    </h6>
                    {selectedPhotoModal.time && (
                      <span className="text-white-50 fs-11">Captured: {selectedPhotoModal.time}</span>
                    )}
                  </div>
                </div>

                {/* Zoom & Transform Controls */}
                <div className="d-flex align-items-center gap-1.5">
                  <div className="btn-group btn-group-sm bg-black bg-opacity-50 p-1 rounded-3 border border-secondary border-opacity-25">
                    <button
                      type="button"
                      className="btn btn-dark btn-sm text-white px-2.5 border-0 d-flex align-items-center gap-1"
                      onClick={handleZoomOut}
                      disabled={zoomScale <= 0.5}
                      title="Zoom Out (-)"
                    >
                      <i className="ti ti-zoom-out fs-15"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-dark btn-sm text-white px-2.5 border-0 font-monospace fs-12 fw-semibold"
                      onClick={handleResetZoom}
                      title="Reset Zoom (0)"
                    >
                      {Math.round(zoomScale * 100)}%
                    </button>
                    <button
                      type="button"
                      className="btn btn-dark btn-sm text-white px-2.5 border-0 d-flex align-items-center gap-1"
                      onClick={handleZoomIn}
                      disabled={zoomScale >= 4}
                      title="Zoom In (+)"
                    >
                      <i className="ti ti-zoom-in fs-15"></i>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm px-2.5 rounded-3 d-flex align-items-center gap-1"
                    onClick={handleRotate}
                    title="Rotate 90° Clockwise"
                  >
                    <i className="ti ti-rotate fs-15"></i>
                    <span className="d-none d-sm-inline fs-11">Rotate</span>
                  </button>

                  {selectedPhotoModal.url && (
                    <a
                      href={selectedPhotoModal.url}
                      download={selectedPhotoModal.name || 'defect-evidence.jpg'}
                      className="btn btn-outline-light btn-sm px-2.5 rounded-3 d-flex align-items-center gap-1"
                      title="Download / Save Photo"
                    >
                      <i className="ti ti-download fs-15"></i>
                      <span className="d-none d-sm-inline fs-11">Save</span>
                    </a>
                  )}

                  <button
                    type="button"
                    className="btn-close btn-close-white ms-2"
                    onClick={handleClosePhoto}
                    aria-label="Close"
                  ></button>
                </div>
              </div>

              {/* Modal Body / Image Viewer */}
              <div
                className="modal-body p-0 d-flex align-items-center justify-content-center overflow-auto position-relative"
                style={{
                  backgroundColor: '#0a0f1d',
                  cursor: zoomScale > 1 ? 'grab' : 'zoom-in',
                  userSelect: 'none'
                }}
                onWheel={(e) => {
                  if (e.deltaY < 0) handleZoomIn();
                  else handleZoomOut();
                }}
                onClick={() => {
                  if (zoomScale === 1) handleZoomIn();
                  else handleResetZoom();
                }}
                title="Click or scroll to zoom. Drag to view."
              >
                <div
                  style={{
                    transition: 'transform 0.15s ease-out',
                    transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                >
                  <img
                    src={selectedPhotoModal.url}
                    alt={selectedPhotoModal.name || 'Defect Evidence Photo'}
                    className="img-fluid rounded-2"
                    style={{
                      maxHeight: '75vh',
                      maxWidth: '85vw',
                      objectFit: 'contain',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
                    }}
                    draggable={false}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-2 bg-dark d-flex align-items-center justify-content-between text-white-50 fs-12">
                <div className="d-flex align-items-center gap-3">
                  <span><kbd className="bg-secondary text-white px-1.5 py-0.5 rounded fs-10">+</kbd> / <kbd className="bg-secondary text-white px-1.5 py-0.5 rounded fs-10">-</kbd> Zoom</span>
                  <span><kbd className="bg-secondary text-white px-1.5 py-0.5 rounded fs-10">0</kbd> Reset</span>
                  <span><kbd className="bg-secondary text-white px-1.5 py-0.5 rounded fs-10">ESC</kbd> Close</span>
                  <span className="d-none d-md-inline text-secondary">| Scroll mouse wheel to zoom</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm px-3 rounded-2 fs-12"
                  onClick={handleClosePhoto}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
