import React, { useState, useEffect } from 'react';

/**
 * GRNDetailView - Step 3: GRN Details
 * Displays Receipt details, Bale-wise breakdown (with locked/editable status),
 * Quality check by item card (clickable), and audit History.
 * Supports Edit Header modal matching the exact specifications with all 10 receipt-level fields.
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
    challan: '',
    challanDate: '',
    invoice: '',
    invoiceDate: '',
    invoiceValue: '',
    transporter: '',
    lrNumber: '',
    lrDate: '',
    weightKg: '',
    foldingCms: ''
  });

  useEffect(() => {
    if (grn) {
      setEditHeaderForm({
        challan: grn.vendorChallanNo || '',
        challanDate: grn.vendorChallanDate ? (typeof grn.vendorChallanDate === 'string' && grn.vendorChallanDate.includes('T') ? grn.vendorChallanDate.split('T')[0] : grn.vendorChallanDate) : '',
        invoice: grn.vendorInvoiceNo || '',
        invoiceDate: grn.vendorInvoiceDate ? (typeof grn.vendorInvoiceDate === 'string' && grn.vendorInvoiceDate.includes('T') ? grn.vendorInvoiceDate.split('T')[0] : grn.vendorInvoiceDate) : '',
        invoiceValue: grn.invoiceValue !== undefined && grn.invoiceValue !== null ? String(grn.invoiceValue) : (grn.totalAmount ? String(grn.totalAmount) : ''),
        transporter: grn.transporterName || grn.transporterId || '',
        lrNumber: grn.lrNumber || grn.lrNo || '',
        lrDate: grn.lrDate ? (typeof grn.lrDate === 'string' && grn.lrDate.includes('T') ? grn.lrDate.split('T')[0] : grn.lrDate) : '',
        weightKg: grn.weightKg !== undefined && grn.weightKg !== null ? String(grn.weightKg) : (grn.weight ? String(grn.weight) : ''),
        foldingCms: grn.foldingCms !== undefined && grn.foldingCms !== null ? String(grn.foldingCms) : (grn.fabricFolding ? String(grn.fabricFolding) : '')
      });
    }
  }, [grn, showEditHeaderModal]);

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

  // Build full transporter options
  const defaultTransporterOptions = [
    'Bhiwandi Roadlines',
    'Keshav Freight Carriers',
    'Masood Transport Broker',
    'Surat Gujarat Transport',
    'Jaipur Golden Transport',
    'V-Trans India Ltd.'
  ];
  const allTransporterNames = Array.from(
    new Set([
      ...transporters.map((t) => t.name).filter(Boolean),
      ...defaultTransporterOptions,
      grn.transporterName
    ].filter(Boolean))
  );

  // Find QC record for this GRN
  const qcRecs = qualityChecks.filter((q) => q.grnRef === grn.id);
  const mainQC = qcRecs[0];

  const anyPending = !grn.isQcActioned && (!mainQC || mainQC.qcStatus === 'Pending');

  const declaredBaleCount = Math.max(0, parseInt(grn.totalBales || grn.numBales || 0, 10));
  const rawBales = grn.bales || [];
  let bales = [...rawBales];
  if (declaredBaleCount > bales.length) {
    for (let i = bales.length; i < declaredBaleCount; i++) {
      bales.push({
        baleNo: String(i + 1),
        fabricItemLabel: grn.fabricName || 'Fabric Item',
        piecesCount: 0,
        totalLength: 0,
        pieces: []
      });
    }
  }
  const totalMeters = Number(grn.totalMetersEntered) || (bales.reduce((s, b) => s + (Number(b.totalLength) || 0), 0)) || Number(grn.declaredTotalMeters) || 0;
  const totalPiecesCount = bales.reduce((sum, b) => sum + (b.pieces?.length || Number(b.piecesCount) || 0), 0) || grn.totalPieces || 0;

  // Expected Width & Fold
  const expectedWidth = mainQC?.expectedWidth || linkedPO?.items?.[0]?.width || '42"';
  const expectedFold = mainQC?.expectedFold || grn.foldingCms || linkedPO?.items?.[0]?.fold || '100';

  const handleSaveHeader = (e) => {
    e.preventDefault();
    if (onEditHeader) {
      onEditHeader({
        ...grn,
        vendorChallanNo: editHeaderForm.challan,
        vendorChallanDate: editHeaderForm.challanDate,
        vendorInvoiceNo: editHeaderForm.invoice,
        vendorInvoiceDate: editHeaderForm.invoiceDate,
        invoiceValue: editHeaderForm.invoiceValue,
        transporterName: editHeaderForm.transporter,
        lrNumber: editHeaderForm.lrNumber,
        lrDate: editHeaderForm.lrDate,
        weightKg: editHeaderForm.weightKg,
        weight: editHeaderForm.weightKg,
        foldingCms: editHeaderForm.foldingCms,
        fabricFolding: editHeaderForm.foldingCms
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

      {/* CARD 1: Receipt details */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
          <h5 className="fw-bold text-dark mb-0 fs-16">Receipt details</h5>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm px-3 py-1 rounded-3 fs-12 fw-medium"
            onClick={() => setShowEditHeaderModal(true)}
          >
            <i className="ti ti-edit me-1"></i>
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
            <div className="fw-bold text-dark">
              {grn.vendorChallanNo || '—'}
              {grn.vendorChallanDate && (
                <div className="text-muted fs-11 fw-normal">{grn.vendorChallanDate}</div>
              )}
            </div>
          </div>
          <div className="col-6 col-sm-4 col-md-3">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">VENDOR INVOICE</div>
            <div className="fw-bold text-dark">
              {grn.vendorInvoiceNo || '—'}
              {grn.vendorInvoiceDate && (
                <div className="text-muted fs-11 fw-normal">{grn.vendorInvoiceDate}</div>
              )}
              {grn.invoiceValue && (
                <div className="text-success fs-11 fw-semibold">₹{Number(grn.invoiceValue).toLocaleString()}</div>
              )}
            </div>
          </div>
          <div className="col-6 col-sm-4 col-md-3">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">TRANSPORTER</div>
            <div className="fw-bold text-dark">{grn.transporterName || transporterObj?.name || 'Bhiwandi Roadlines'}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">LR NO. / DATE</div>
            <div className="fw-bold text-dark">
              {grn.lrNumber || '—'}
              {grn.lrDate && (
                <div className="text-muted fs-11 fw-normal">{grn.lrDate}</div>
              )}
            </div>
          </div>

          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">WEIGHT</div>
            <div className="fw-bold text-dark">{grn.weightKg || grn.weight || '—'} kg</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">FABRIC FOLDING</div>
            <div className="fw-bold text-dark">{grn.foldingCms || grn.fabricFolding || expectedFold || '—'} cms</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">TOTAL QUANTITY</div>
            <div className="fw-bold text-dark">{totalMeters}m</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">NO. OF BALES</div>
            <div className="fw-bold text-dark">{bales.length || grn.totalBales || 0}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">TOTAL PIECES</div>
            <div className="fw-bold text-dark">{totalPiecesCount}</div>
          </div>
        </div>
      </div>

      {/* CARD 2: Bale-wise breakdown */}
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
            <thead className="table-light text-secondary fs-12 text-uppercase fw-bold">
              <tr>
                <th className="ps-4 py-3" style={{ minWidth: '100px' }}>BALE NO.</th>
                <th className="py-3" style={{ minWidth: '220px' }}>FABRIC ITEM</th>
                <th className="py-3 text-center" style={{ minWidth: '90px' }}>PIECES</th>
                <th className="py-3 text-end" style={{ minWidth: '120px' }}>METERS</th>
                <th className="py-3 text-center" style={{ minWidth: '120px' }}>QC STATUS</th>
                <th className="pe-4 py-3 text-end" style={{ minWidth: '110px' }}>LOCK STATUS</th>
              </tr>
            </thead>
            <tbody>
              {bales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No bales entered yet.
                  </td>
                </tr>
              ) : (
                bales.map((bale, idx) => {
                  const bNo = bale.baleNo || `Bale ${idx + 1}`;
                  const fabricLabel = bale.fabricItemLabel || bale.fabric || grn.fabricName || 'Grey Cotton Rayon';
                  const pcsCount = (bale.pieces && bale.pieces.length > 0)
                    ? bale.pieces.length
                    : (Number(bale.piecesCount) || 0);
                  const bMeters = (bale.pieces && bale.pieces.length > 0)
                    ? bale.pieces.reduce((s, p) => s + (Number(p.length) || 0), 0)
                    : (Number(bale.totalLength) || 0);
                  const isQcLocked = !anyPending || bale.qcStatus === 'Approved' || bale.qcStatus === 'OK';

                  return (
                    <tr key={idx}>
                      <td className="ps-4 py-3 fw-bold text-dark">{bNo}</td>
                      <td className="py-3 text-secondary">{fabricLabel}</td>
                      <td className="py-3 text-center">{pcsCount}</td>
                      <td className="py-3 text-end fw-semibold text-dark">{Number(bMeters).toFixed(1)}m</td>
                      <td className="py-3 text-center">
                        <span
                          className={`badge rounded-pill px-2.5 py-1 fs-11 ${
                            isQcLocked
                              ? 'bg-success-subtle text-success border border-success border-opacity-25'
                              : 'bg-primary-subtle text-primary border border-primary border-opacity-25'
                          }`}
                        >
                          {bale.qcStatus || (isQcLocked ? 'QC Approved' : 'Pending QC')}
                        </span>
                      </td>
                      <td className="pe-4 py-3 text-end">
                        <span
                          className={`badge rounded-pill px-2.5 py-1 fs-11 ${
                            isQcLocked
                              ? 'bg-secondary-subtle text-secondary border border-secondary border-opacity-25'
                              : 'bg-info-subtle text-info border border-info border-opacity-25'
                          }`}
                        >
                          <i className={`ti ${isQcLocked ? 'ti-lock' : 'ti-pencil'} me-1 fs-10`}></i>
                          {isQcLocked ? 'Locked (QC done)' : 'Editable'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CARD 3: Quality Check by Item (Clickable - Redirects to QC inspection) */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <h5 className="fw-bold text-dark mb-3 fs-16">Quality check by item</h5>
        <div
          className="border rounded-4 p-3.5 d-flex flex-wrap align-items-center justify-content-between gap-3 bg-white"
          style={{
            borderColor: '#e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.15s ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#5b47fb';
            e.currentTarget.style.backgroundColor = '#faf9ff';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(91, 71, 251, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onClick={() => {
            if (onSelectQCItem) {
              onSelectQCItem(mainQC || { id: `QC-${grn.id}`, grnRef: grn.id, qcStatus: grn.status === 'QC Approved' ? 'Approved' : 'Pending' });
            }
          }}
          title="Click anywhere on this card to run quality check inspection"
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 p-2.5 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}
            >
              <i className="ti ti-checklist fs-22"></i>
            </div>
            <div>
              <div className="fw-bold text-dark fs-15 mb-0.5">
                {grn.fabricName || 'Modal Satin Premium'} · {String(expectedWidth).replace(/"/g, '')}&quot;
              </div>
              <div className="text-secondary fs-13 mb-1">
                Received: <strong>{totalMeters}m</strong> · Expected width {String(expectedWidth).replace(/"/g, '')}, expected fold {String(expectedFold).replace(/%/g, '')}%
              </div>
              <div className="d-inline-flex align-items-center gap-1.5 fs-13 text-secondary">
                <i className="ti ti-sparkles fs-15" style={{ color: '#5b47fb' }}></i>
                <span>
                  {mainQC?.qcStatus === 'OK' || mainQC?.qcStatus === 'Approved' || grn.status === 'QC Approved'
                    ? 'QC Inspection Completed'
                    : 'Awaiting quality check'}
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <span
              className={`badge rounded-pill px-3 py-1.5 fs-12 fw-semibold ${
                mainQC?.qcStatus === 'OK' || mainQC?.qcStatus === 'Approved' || grn.status === 'QC Approved'
                  ? 'bg-success-subtle text-success border border-success border-opacity-25'
                  : mainQC?.qcStatus === 'Reject' || mainQC?.qcStatus === 'Rejected'
                  ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                  : 'bg-primary-subtle text-primary border border-primary border-opacity-25'
              }`}
            >
              {mainQC?.qcStatus || (grn.status === 'QC Approved' ? 'Approved' : 'Awaiting QC')}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-primary rounded-3 px-3 py-1.5 fs-12 fw-semibold shadow-2xs d-inline-flex align-items-center gap-1.5 text-white"
              style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectQCItem) {
                  onSelectQCItem(mainQC || { id: `QC-${grn.id}`, grnRef: grn.id, qcStatus: grn.status === 'QC Approved' ? 'Approved' : 'Pending' });
                }
              }}
            >
              <span>{mainQC?.qcStatus === 'OK' || mainQC?.qcStatus === 'Approved' || grn.status === 'QC Approved' ? 'View QC' : 'Run Inspection'}</span>
              <i className="ti ti-arrow-right fs-13"></i>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EDIT HEADER MODAL (Matches User Image 2 with all 10 Receipt-level fields) */}
      {/* ========================================================================= */}
      {showEditHeaderModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden bg-white" style={{ border: '1px solid #e2e8f0' }}>
              <form onSubmit={handleSaveHeader}>
                {/* Modal Header */}
                <div className="modal-header border-0 pb-1 pt-3.5 px-4 d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="modal-title fw-bold text-dark fs-17 mb-0" style={{ letterSpacing: '-0.2px' }}>
                      Edit {grn.id} header
                    </h5>
                    <div className="text-secondary fs-11 mt-0.5" style={{ lineHeight: '1.4' }}>
                      Bale/piece quantities are locked — only receipt-level fields can change here.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close fs-12 text-muted"
                    onClick={() => setShowEditHeaderModal(false)}
                    aria-label="Close"
                  ></button>
                </div>

                {/* Modal Body with 10 fields */}
                <div className="modal-body px-4 py-2.5">
                  <div className="row g-2.5">
                    {/* 1. Vendor challan no. */}
                    <div className="col-12 col-sm-7">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Vendor challan no.</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.challan}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, challan: e.target.value })}
                        placeholder=""
                      />
                    </div>

                    {/* 2. Challan date */}
                    <div className="col-12 col-sm-5">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Challan date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.challanDate}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, challanDate: e.target.value })}
                      />
                    </div>

                    {/* 3. Vendor invoice no. */}
                    <div className="col-12 col-sm-7">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Vendor invoice no.</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.invoice}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, invoice: e.target.value })}
                        placeholder=""
                      />
                    </div>

                    {/* 4. Invoice date */}
                    <div className="col-12 col-sm-5">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Invoice date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.invoiceDate}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, invoiceDate: e.target.value })}
                      />
                    </div>

                    {/* 5. Invoice value (₹) */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Invoice value (₹)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.invoiceValue}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, invoiceValue: e.target.value })}
                        placeholder=""
                      />
                    </div>

                    {/* Empty column spacer */}
                    <div className="col-12 col-sm-6"></div>

                    {/* 6. Transporter */}
                    <div className="col-12 col-sm-7">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Transporter</label>
                      <select
                        className="form-select form-select-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.transporter}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, transporter: e.target.value })}
                      >
                        <option value="">Select Transporter...</option>
                        {allTransporterNames.map((name, idx) => (
                          <option key={idx} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 7. LR no. */}
                    <div className="col-12 col-sm-5">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">LR no.</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.lrNumber}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, lrNumber: e.target.value })}
                        placeholder=""
                      />
                    </div>

                    {/* 8. LR date */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">LR date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.lrDate}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, lrDate: e.target.value })}
                      />
                    </div>

                    {/* Empty spacer */}
                    <div className="col-12 col-sm-6"></div>

                    {/* 9. Weight (kg) */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Weight (kg)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.weightKg}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, weightKg: e.target.value })}
                        placeholder=""
                      />
                    </div>

                    {/* 10. Fabric folding (cms) */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Fabric folding (cms)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.foldingCms}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, foldingCms: e.target.value })}
                        placeholder=""
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer with Theme Buttons */}
                <div className="modal-footer border-0 pt-2 pb-3.5 px-4 d-flex align-items-center justify-content-start gap-2">
                  <button
                    type="submit"
                    className="btn btn-sm px-4 py-1.5 rounded-3 fs-13 text-white fw-semibold shadow-sm d-inline-flex align-items-center gap-1.5"
                    style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                  >
                    <i className="ti ti-check fs-14"></i>
                    <span>Save Changes</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3.5 py-1.5 rounded-3 fs-13 fw-medium bg-white"
                    style={{ borderColor: '#cbd5e1', color: '#475569' }}
                    onClick={() => setShowEditHeaderModal(false)}
                  >
                    Cancel
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
