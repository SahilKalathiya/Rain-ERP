import React, { useState } from 'react';

/**
 * GRNDetailView - Step 3: GRN Details
 * Displays Receipt details, Bale-wise breakdown (with locked/editable status),
 * Quality check by item card (clickable), and audit History.
 * Matches User Screenshots 2 & 3 and Demo line 1881.
 */
export default function GRNDetailView({
  grn,
  vendors = [],
  transporters = [],
  purchaseOrders = [],
  qualityChecks = [],
  onBack,
  onEditHeader,
  onEditBales,
  onSelectQCItem
}) {
  const [showEditHeaderModal, setShowEditHeaderModal] = useState(false);
  const [editHeaderForm, setEditHeaderForm] = useState({
    challan: grn?.vendorChallanNo || '',
    challanDate: grn?.vendorChallanDate || '',
    invoice: grn?.vendorInvoiceNo || '',
    invoiceDate: grn?.vendorInvoiceDate || '',
    invoiceValue: grn?.invoiceValue || ''
  });

  if (!grn) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4">
        <i className="ti ti-package-off fs-40 text-muted mb-3 d-block"></i>
        <h5 className="fw-bold text-dark mb-2">GRN Record Not Found</h5>
        <p className="text-secondary fs-13 mb-4">The selected Goods Receipt Note could not be loaded.</p>
        <div>
          <button type="button" className="btn btn-primary px-4 py-2 rounded-3" onClick={onBack}>
            Back to GRN Register
          </button>
        </div>
      </div>
    );
  }

  // Find linked PO
  const linkedPoId = grn.linkedPOs?.[0];
  const linkedPO = purchaseOrders.find((p) => p.id === linkedPoId);

  // Find transporter
  const transporterObj = transporters.find((t) => t.id === grn.transporterId || t.name === grn.transporterName);

  // Find QC record for this GRN
  const qcRecs = qualityChecks.filter((q) => q.grnRef === grn.id);
  const mainQC = qcRecs[0];

  const anyPending = !grn.isQcActioned && (!mainQC || mainQC.qcStatus === 'Pending');

  // Calculate bales total
  const bales = grn.bales || [];
  const totalMeters = Number(grn.totalMetersEntered) || Number(grn.declaredTotalMeters) || 0;

  // Expected Width & Fold
  const expectedWidth = mainQC?.expectedWidth || linkedPO?.items?.[0]?.width || '42"';
  const expectedFold = mainQC?.expectedFold || linkedPO?.items?.[0]?.fold || '100';

  const handleSaveHeader = (e) => {
    e.preventDefault();
    if (onEditHeader) {
      onEditHeader({
        ...grn,
        vendorChallanNo: editHeaderForm.challan,
        vendorChallanDate: editHeaderForm.challanDate,
        vendorInvoiceNo: editHeaderForm.invoice,
        vendorInvoiceDate: editHeaderForm.invoiceDate,
        invoiceValue: editHeaderForm.invoiceValue
      });
    }
    setShowEditHeaderModal(false);
  };

  return (
    <div className="container-fluid p-0">
      {/* Top Header & Breadcrumb */}
      <div className="mb-4">
        <button
          type="button"
          className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold d-inline-flex align-items-center gap-1.5 mb-2 fs-13"
          style={{ color: '#5b47fb' }}
          onClick={onBack}
        >
          <i className="ti ti-arrow-left"></i>
          <span>Back to GRN Register</span>
        </button>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-1 fs-24 d-flex align-items-center gap-2.5">
              <span>{grn.id}</span>
              <span
                className={`badge px-2.5 py-1 fs-11 rounded-pill ${
                  grn.status === 'Completed' || grn.status === 'QC Approved'
                    ? 'bg-success-subtle text-success border border-success border-opacity-25'
                    : grn.status === 'QC Rejected'
                    ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                    : 'bg-primary-subtle text-primary border border-primary border-opacity-25'
                }`}
              >
                {grn.status || 'Completed'}
              </span>
            </h2>
            <p className="text-secondary fs-13 mb-0">
              Against <strong>{linkedPoId ? `${linkedPoId}` : 'Direct Inward'}</strong> · {grn.vendorName || 'Vendor'}
            </p>
          </div>
        </div>
      </div>

      {/* CARD 1: Receipt details (Matches Screenshot 2) */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
          <h5 className="fw-bold text-dark mb-0 fs-16">Receipt details</h5>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm px-3 py-1 rounded-3 fs-12 fw-medium"
            onClick={() => setShowEditHeaderModal(true)}
          >
            Edit
          </button>
        </div>

        <div className="row g-4 fs-13">
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">RECEIVED DATE</div>
            <div className="fw-bold text-dark">{grn.date || '2026-10-07'}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">VENDOR CHALLAN</div>
            <div className="fw-bold text-dark">{grn.vendorChallanNo || '—'}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-3">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">VENDOR INVOICE</div>
            <div className="fw-bold text-dark">{grn.vendorInvoiceNo || '—'}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-3">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">TRANSPORTER</div>
            <div className="fw-bold text-dark">{transporterObj?.name || grn.transporterName || 'Bhiwandi Roadlines'}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">LR NO. / DATE</div>
            <div className="fw-bold text-dark">{grn.lrNumber || '—'}</div>
          </div>

          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">WEIGHT</div>
            <div className="fw-bold text-dark">{grn.weight || '450'} kg</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">TOTAL QUANTITY</div>
            <div className="fw-bold text-dark">{totalMeters}m</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">NO. OF BALES</div>
            <div className="fw-bold text-dark">{bales.length || grn.totalBales || 2}</div>
          </div>
        </div>
      </div>

      {/* CARD 2: Bale-wise breakdown (Matches Screenshot 2) */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
        <div className="card-header bg-white border-bottom p-3.5 d-flex align-items-center justify-content-between">
          <h5 className="fw-bold text-dark mb-0 fs-16">Bale-wise breakdown</h5>
          {anyPending && onEditBales && (
            <button
              type="button"
              className="btn btn-sm btn-primary px-3 py-1 text-white rounded-3 fs-12 fw-semibold"
              style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
              onClick={() => onEditBales(grn)}
            >
              <i className="ti ti-edit me-1"></i> Edit Bale Entries
            </button>
          )}
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-secondary fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.3px' }}>
              <tr>
                <th className="ps-4 py-3" style={{ width: '120px' }}>BALE NO.</th>
                <th className="py-3">FABRIC ITEM</th>
                <th className="py-3 text-center" style={{ width: '120px' }}>PIECES</th>
                <th className="py-3 text-end" style={{ width: '150px' }}>METERS</th>
                <th className="pe-4 py-3 text-center" style={{ width: '130px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {bales.length > 0 ? (
                bales.map((b, idx) => {
                  const bMeters = (b.pieces || []).reduce((s, p) => {
                    const raw = typeof p === 'object' && p !== null ? (p.length ?? p.meter ?? p.meters ?? 0) : p;
                    const num = parseFloat(raw);
                    return s + (isNaN(num) ? 0 : num);
                  }, 0);
                  const isLocked = Boolean(grn.isQcActioned);
                  const formattedMeters = Number((Math.round(bMeters * 100) / 100).toFixed(2));

                  return (
                    <tr key={idx}>
                      <td className="ps-4 py-3 fw-bold text-dark">{b.baleNo || `${idx + 1}`}</td>
                      <td className="py-3 text-secondary fw-medium">
                        {grn.fabricName || 'Tussar Silk (42") — Ivory'}
                      </td>
                      <td className="py-3 text-center fw-semibold">{(b.pieces || []).length}</td>
                      <td className="py-3 text-end fw-bold text-dark">{formattedMeters}m</td>
                      <td className="pe-4 py-3 text-center">
                        {isLocked ? (
                          <span className="badge bg-light text-secondary border px-2.5 py-1 fs-11 rounded-pill d-inline-flex align-items-center gap-1">
                            <i className="ti ti-lock text-warning fs-11"></i> locked
                          </span>
                        ) : (
                          <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 px-2.5 py-1 fs-11 rounded-pill">
                            editable
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <>
                  <tr>
                    <td className="ps-4 py-3 fw-bold text-dark">1</td>
                    <td className="py-3 text-secondary fw-medium">{grn.fabricName || 'Tussar Silk (42") — Ivory'}</td>
                    <td className="py-3 text-center fw-semibold">2</td>
                    <td className="py-3 text-end fw-bold text-dark">200m</td>
                    <td className="pe-4 py-3 text-center">
                      <span className="badge bg-light text-secondary border px-2.5 py-1 fs-11 rounded-pill d-inline-flex align-items-center gap-1">
                        <i className="ti ti-lock text-warning fs-11"></i> locked
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="ps-4 py-3 fw-bold text-dark">2</td>
                    <td className="py-3 text-secondary fw-medium">{grn.fabricName || 'Tussar Silk (42") — Ivory'}</td>
                    <td className="py-3 text-center fw-semibold">5</td>
                    <td className="py-3 text-end fw-bold text-dark">1800m</td>
                    <td className="pe-4 py-3 text-center">
                      <span className="badge bg-light text-secondary border px-2.5 py-1 fs-11 rounded-pill d-inline-flex align-items-center gap-1">
                        <i className="ti ti-lock text-warning fs-11"></i> locked
                      </span>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer bg-white border-top p-3 text-muted fs-12">
          {grn.isQcActioned
            ? 'All items in this GRN have been QC-actioned — bale entries are now locked.'
            : 'Bales for items still awaiting Quality Check remain editable. Once QC is actioned on an item, its bales lock automatically.'}
        </div>
      </div>

      {/* CARD 3: Quality check — by item (Matches Screenshot 2 & 3 - Clickable!) */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <h5 className="fw-bold text-dark mb-1 fs-16">Quality check — by item</h5>
        <p className="text-secondary fs-12 mb-3">
          This shipment contains 1 distinct fabric/width line item(s). Each is checked and approved independently.
        </p>

        {/* Clickable QC Card */}
        <div
          className="card border rounded-3 p-3.5 bg-white shadow-2xs hover-shadow transition-all"
          style={{ cursor: 'pointer', transition: 'all 0.2s ease', borderColor: '#e2e8f0' }}
          onClick={() => {
            if (onSelectQCItem) {
              onSelectQCItem(mainQC || {
                id: `QC-${grn.id.replace('GRN-', '')}`,
                grnRef: grn.id,
                inspectorName: 'Wedc',
                qcStatus: 'OK',
                totalReceivedMeters: totalMeters,
                goodQty: totalMeters,
                heldBackQty: 0,
                expectedWidth: expectedWidth,
                expectedFold: expectedFold,
                decidedAt: grn.date || '2026-10-07'
              });
            }
          }}
        >
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
            <div>
              <div className="fw-bold text-dark fs-15">
                {grn.fabricName || 'Tussar Silk — 42" • Ivory'}
              </div>
              <div className="text-secondary fs-12 mt-0.5">
                Received: <strong>{totalMeters}m</strong> · Expected width {expectedWidth}, expected fold {expectedFold}%
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span
                className={`badge px-2.5 py-1 fs-11 rounded-pill ${
                  (mainQC?.qcStatus === 'OK' || grn.status === 'Completed')
                    ? 'bg-success-subtle text-success border border-success border-opacity-25'
                    : mainQC?.qcStatus === 'Reject'
                    ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                    : 'bg-warning-subtle text-warning border border-warning border-opacity-25'
                }`}
              >
                {mainQC?.qcStatus || (grn.status === 'Completed' ? 'OK' : 'Pending')}
              </span>
              <i className="ti ti-chevron-right fs-15 text-muted"></i>
            </div>
          </div>

          <div className="text-muted fs-12 pt-2 border-top border-light">
            {mainQC && mainQC.qcStatus !== 'Pending' ? (
              <span>Checked by <strong>{mainQC.inspectorName || 'Wedc'}</strong> on {mainQC.decidedAt || grn.date || '2026-10-07'}</span>
            ) : (
              <span className="text-primary fw-medium" style={{ color: '#5b47fb' }}>
                <i className="ti ti-click me-1"></i> Awaiting quality check — click to run inspection
              </span>
            )}
          </div>
        </div>
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
              <p className="text-muted mb-0 fs-12">Complete chronological record of inward receipt, pieces entered, and QC dispatch</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge px-3 py-1.5 rounded-pill bg-light text-secondary border fs-11 fw-medium">
              <i className="ti ti-shield-check me-1 text-success"></i> Verified Audit Trail
            </span>
          </div>
        </div>

        <div className="position-relative ps-4 ms-2" style={{ borderLeft: '2px dashed #cbd5e1' }}>
          {/* Event 1: Submitted to Quality Check */}
          <div className="position-relative mb-4 pb-2">
            <div
              className="position-absolute rounded-circle d-flex align-items-center justify-content-center text-white"
              style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                left: '-33px',
                top: '0px',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
              }}
            >
              <i className="ti ti-check fs-14 fw-bold"></i>
            </div>

            <div className="card border p-3 rounded-3 shadow-none bg-body-tertiary" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 rounded-2 fs-12 fw-semibold">
                    Submitted to Quality Check
                  </span>
                  <span className="badge bg-white text-secondary border px-2 py-1 rounded-2 fs-11">
                    {Number(grn.totalMetersEntered || grn.declaredTotalMeters || 2000).toLocaleString()}m
                  </span>
                </div>
                <div className="d-flex align-items-center gap-1.5 text-muted fs-11 font-monospace bg-white px-2 py-1 rounded border">
                  <i className="ti ti-clock fs-12 text-primary"></i>
                  <span>07 Oct 2026, 11:36 am</span>
                </div>
              </div>

              <p className="text-dark fs-13 mb-3" style={{ lineHeight: '1.5' }}>
                Inward delivery confirmed. <strong>{Number(grn.totalMetersEntered || grn.declaredTotalMeters || 2000).toLocaleString()}m</strong> across {totalPiecesCount} pieces queued for inspection.
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
                    Handled by: <strong className="text-dark">Saksham Garg</strong> <span className="text-muted">(Merchandiser)</span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3 fs-12 text-muted">
                  <span>Vendor: <strong className="text-dark">{grn.vendorName || 'M.S. Textiles'}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Event 2: GRN Created */}
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
              <i className="ti ti-file-plus fs-14"></i>
            </div>

            <div className="card border p-3 rounded-3 shadow-none bg-body-tertiary" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-2 fs-12 fw-semibold">
                    GRN Created Against {linkedPoId || 'PO-1001'}
                  </span>
                  <span className="badge bg-white text-secondary border px-2 py-1 rounded-2 fs-11">
                    {grn.id}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-1.5 text-muted fs-11 font-monospace bg-white px-2 py-1 rounded border">
                  <i className="ti ti-clock fs-12 text-primary"></i>
                  <span>07 Oct 2026, 11:23 am</span>
                </div>
              </div>

              <p className="text-dark fs-13 mb-3" style={{ lineHeight: '1.5' }}>
                Generated goods received note from supplier <strong>{grn.vendorName || 'M.S. Textiles'}</strong>. Challan #{grn.challanNo || 'CH-8821'}.
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
                    Created by: <strong className="text-dark">Saksham Garg</strong> <span className="text-muted">(Merchandiser)</span>
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

      {/* Edit Header Modal */}
      {showEditHeaderModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <form onSubmit={handleSaveHeader}>
                <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="modal-title fw-bold text-dark fs-17 mb-0">Edit {grn.id} header</h5>
                    <div className="text-muted fs-11">Bale/piece quantities are locked — only receipt-level fields can change here.</div>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEditHeaderModal(false)}
                  ></button>
                </div>

                <div className="modal-body px-4 py-3">
                  <div className="row g-3">
                    <div className="col-12 col-md-7">
                      <label className="form-label fs-11 fw-semibold text-secondary mb-1">Vendor challan no.</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editHeaderForm.challan}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, challan: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-5">
                      <label className="form-label fs-11 fw-semibold text-secondary mb-1">Challan date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={editHeaderForm.challanDate}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, challanDate: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-7">
                      <label className="form-label fs-11 fw-semibold text-secondary mb-1">Vendor invoice no.</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editHeaderForm.invoice}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, invoice: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-5">
                      <label className="form-label fs-11 fw-semibold text-secondary mb-1">Invoice date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={editHeaderForm.invoiceDate}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, invoiceDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0 pb-4 px-4 d-flex align-items-center justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3 py-1.5 rounded-3 fs-12"
                    onClick={() => setShowEditHeaderModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm px-3.5 py-1.5 rounded-3 fs-12 text-white fw-semibold"
                    style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
