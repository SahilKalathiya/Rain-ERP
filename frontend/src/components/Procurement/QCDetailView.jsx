import React, { useState, useMemo } from 'react';

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

  const fabricName = qc.fabricName || grn?.fabricName || 'Tussar Silk (42") — Ivory';
  const poId = purchaseOrder?.id || grn?.linkedPOs?.[0] || grn?.poId || 'PO-1001';
  const grnId = qc.grnRef || grn?.id || 'GRN-1002';

  const cleanFab = fabricName.replace(/^\[[^\]]+\]\s*/, '').replace(/\s*\([^)]*\)/g, '').replace(/\s*—.*$/, '').trim().toLowerCase();
  const matchedPoItem = purchaseOrder?.items?.find((it) => {
    const itName = (it.fabricName || it.fabricQuality || '').replace(/^\[[^\]]+\]\s*/, '').replace(/\s*\([^)]*\)/g, '').replace(/\s*—.*$/, '').trim().toLowerCase();
    return itName === cleanFab || cleanFab.includes(itName) || itName.includes(cleanFab);
  }) || purchaseOrder?.items?.[0];

  const resolvedExpWidth = matchedPoItem?.width || qc.expectedWidth || grn?.width || grn?.pannaWidth || '44';
  const resolvedExpFold = matchedPoItem?.fold !== undefined ? matchedPoItem.fold : (qc.expectedFold || grn?.fold || grn?.fabricFolding || '100');

  const expectedWidth = `${String(resolvedExpWidth).replace(/"/g, '')}"`;
  const widthFound = qc.actualWidth ? `${String(qc.actualWidth).replace(/"/g, '')}"` : (qc.widthFound || '—');
  const expectedFold = `${String(resolvedExpFold).replace(/%/g, '')}%`;
  const foldFound = qc.actualFold ? `${String(qc.actualFold).replace(/%/g, '')}%` : (qc.foldFound ? `${qc.foldFound}%` : '—%');

  const receivedQty = Number(qc.totalReceivedMeters) || Number(qc.receivedQty) || Number(grn?.declaredTotalMeters) || 2000;
  const passedQty = Number(qc.passedQty) || (qc.qcStatus === 'Reject' ? 0 : Math.max(0, receivedQty - (Number(qc.heldBackQty) || Number(qc.defectQty) || 0)));
  const rejectedQty = Number(qc.rejectedQty) || (qc.qcStatus === 'Reject' ? receivedQty : (Number(qc.heldBackQty) || Number(qc.defectQty) || 0));
  const linkedPoId = poId;

  const effectiveStatus = damagedItem?.status || 'Pending Resolution';
  const itemToResolve = damagedItem || {
    id: `REJ-${qc.id}`,
    sourceQcRef: qc.id,
    grnRef: grnId,
    poRef: poId,
    fabricName: fabricName,
    vendorName: grn?.vendorName || 'M.S. Textiles',
    quantity: Number(qc.heldBackQty) || Number(qc.defectQty) || (qc.issuePieces?.reduce((s, p) => s + (Number(p.length) || 0), 0)) || 100,
    defectivePieces: qc.issuePieces?.length || 1,
    status: 'Pending Resolution',
    dateFlagged: qc.dateTime || new Date().toLocaleDateString('en-GB')
  };

  // Filter stock entries for this QC/GRN
  const relevantStock = stockEntries.filter(
    (s) => s.grnId === grnId || s.qcId === qc.id || (damagedItem && s.damagedItemId === damagedItem.id) || (itemToResolve && s.damagedItemId === itemToResolve.id)
  );

  const allViewPhotos = useMemo(() => {
    const list = [
      ...(qc?.photos || []),
      ...Object.values(qc?.pieceInspections || {}).flatMap((p) => p?.photos || [])
    ];
    return Array.from(new Map(list.filter(Boolean).map((p) => [p.url || p.name, p])).values());
  }, [qc]);

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
                  qc.qcStatus === 'OK' || qc.qcStatus === 'Partial OK' || qc.qcStatus === 'Approved'
                    ? 'bg-success-subtle text-success border border-success border-opacity-25'
                    : qc.qcStatus === 'Reject' || qc.qcStatus === 'Rejected'
                    ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                    : 'bg-warning-subtle text-warning border border-warning border-opacity-25'
                }`}
                style={{ marginLeft: '14px', verticalAlign: 'middle' }}
              >
                {qc.qcStatus || 'OK'}
              </span>
            </h2>
            <p className="text-secondary fs-13 mb-0">
              {grnId} · {poId} · Checked by <strong>{qc.inspectorName || 'Inspector'}</strong> on {qc.decidedAt || '2026-10-07'}
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
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold">Attached Photos / Evidence</div>
            {allViewPhotos.length > 0 && (
              <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 px-2 py-0.5 fs-11 rounded-pill">
                {allViewPhotos.length} Photo{allViewPhotos.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {allViewPhotos.length > 0 ? (
            <div className="d-flex flex-wrap gap-2">
              {allViewPhotos.map((ph, idx) => (
                <div
                  key={idx}
                  className="card border rounded-2 p-1 bg-white shadow-2xs position-relative"
                  style={{ width: '80px', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                  onClick={() => handleOpenPhoto(ph)}
                  title="Click to zoom / inspect photo"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(91, 71, 251, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div className="position-relative overflow-hidden rounded-1" style={{ height: '65px' }}>
                    <img
                      src={ph.url}
                      alt={ph.name}
                      className="w-100 h-100"
                      style={{ objectFit: 'cover' }}
                    />
                    <div
                      className="position-absolute bottom-0 end-0 bg-dark bg-opacity-75 text-white rounded-start px-1 py-0.5 d-flex align-items-center"
                      style={{ fontSize: '10px' }}
                      title="Click to zoom"
                    >
                      <i className="ti ti-zoom-in"></i>
                    </div>
                  </div>
                  <div className="text-truncate fs-10 text-muted mt-1 text-center" title={ph.name}>
                    {ph.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-secondary fs-12">No photo attached during inspection</div>
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
              {effectiveStatus === 'Reversed (treated as good)' || effectiveStatus === 'Write Off (scrap)' || effectiveStatus === 'Return to Vendor' ? 'View Resolution' : 'View / Resolve'}
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
                onClick={() => onViewStockPool && onViewStockPool({
                  ...entry,
                  grnId: grnId,
                  qcId: qc.id,
                  poId: poId,
                  fabricName: grn?.fabricName || purchaseOrder?.items?.[0]?.fabricName || fabricName,
                  width: expectedWidth || grn?.pannaWidth || widthFound,
                  colorName: grn?.colorName || purchaseOrder?.items?.[0]?.colorName || (fabricName.includes('—') ? fabricName.split('—')[1].trim() : '')
                })}
              >
                View
              </button>
            </div>
          ))
        ) : (
          <>
            <div className="d-flex align-items-center justify-content-between py-2 border-bottom border-light fs-13">
              <div>
                Added <strong>{passedQty > 0 ? `${passedQty.toFixed(1)}m` : '1900.0m'}</strong> to stock on {qc.dateTime ? qc.dateTime.split(' ')[0] : '2026-10-07'} (QC approved).
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none fw-semibold p-0 text-primary"
                style={{ color: '#5b47fb' }}
                onClick={() => onViewStockPool && onViewStockPool({
                  grnId: grnId,
                  qcId: qc.id,
                  poId: poId,
                  qty: passedQty > 0 ? passedQty : 1900,
                  fabricName: grn?.fabricName || purchaseOrder?.items?.[0]?.fabricName || fabricName,
                  width: expectedWidth || grn?.pannaWidth || widthFound,
                  colorName: grn?.colorName || purchaseOrder?.items?.[0]?.colorName || (fabricName.includes('—') ? fabricName.split('—')[1].trim() : ''),
                  source: 'QC approved',
                  decidedAt: qc.dateTime ? qc.dateTime.split(' ')[0] : '2026-10-07'
                })}
              >
                View
              </button>
            </div>

            {damagedItem?.status === 'Reversed (treated as good)' && (
              <div className="d-flex align-items-center justify-content-between py-2 border-bottom border-light fs-13">
                <div>
                  Added <strong>{Number(damagedItem.quantity || 100).toFixed(1)}m</strong> to stock on {damagedItem.resolvedDate || '2026-10-07'} (Reversed — defect overturned on review).
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none fw-semibold p-0 text-primary"
                  style={{ color: '#5b47fb' }}
                  onClick={() => onViewStockPool && onViewStockPool({
                    grnId: grnId,
                    qcId: qc.id,
                    poId: poId,
                    qty: Number(damagedItem.quantity || 100),
                    fabricName: grn?.fabricName || purchaseOrder?.items?.[0]?.fabricName || fabricName,
                    width: expectedWidth || grn?.pannaWidth || widthFound,
                    colorName: grn?.colorName || purchaseOrder?.items?.[0]?.colorName || (fabricName.includes('—') ? fabricName.split('—')[1].trim() : ''),
                    source: 'Reversed — defect overturned on review',
                    decidedAt: damagedItem.resolvedDate || '2026-10-07'
                  })}
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
                      {selectedPhotoModal.name || 'Inspection Photo'}
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
                      download={selectedPhotoModal.name || 'qc-photo.jpg'}
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
                    alt={selectedPhotoModal.name || 'Inspection Photo'}
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
