import React, { useState } from 'react';

/**
 * ProcessPOList - List view for Process Purchase Orders
 * Theme-aligned KPI cards with high-contrast text (Zero invisible white text)
 * Screen-fitted responsive table with ZERO horizontal overflow (No left-right scroll)
 * Fully clickable table rows to view/edit record directly
 */
export default function ProcessPOList({ pos = [], onNewPO, onViewPO, onPrintPO, onCreateChallanFromPO }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vendorFilter, setVendorFilter] = useState('ALL');

  const filtered = pos.filter((po) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (po.po_number && po.po_number.toLowerCase().includes(term)) ||
      (po.vendor_name && po.vendor_name.toLowerCase().includes(term)) ||
      (po.customer_brand_name && po.customer_brand_name.toLowerCase().includes(term)) ||
      (Array.isArray(po.style_names) && po.style_names.some(s => s.toLowerCase().includes(term)));

    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
    const matchesVendor = vendorFilter === 'ALL' || po.vendor_name.includes(vendorFilter);

    return matchesSearch && matchesStatus && matchesVendor;
  });

  const totalMeters = pos.reduce((acc, po) => acc + (parseFloat(po.total_meters) || 0), 0);
  const totalCost = pos.reduce((acc, po) => acc + (parseFloat(po.total_estimated_cost) || 0), 0);
  const primaryVendor = pos.length > 0 ? pos[0].vendor_name?.split('(')[0]?.trim() || 'Raju Dyeing' : 'None';

  return (
    <div>
      {/* ========================================================================= */}
      {/* 1. TOP KPI SUMMARY CARDS (HIGH-CONTRAST THEME - ZERO INVISIBLE WHITE TEXT) */}
      {/* ========================================================================= */}
      <div className="row g-3 mb-4">
        {/* Card 1: Active POs */}
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
                  Active Process POs
                </span>
                <h3 className="mb-0 fw-bold text-dark mt-1 fs-24">{pos.length}</h3>
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
                <i className="ti ti-file-invoice fs-22"></i>
              </div>
            </div>
            <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
              <i className="ti ti-circle-check text-success fs-13"></i>
              <span>Dyeing & processing orders</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Fabric Ordered */}
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
                  Total Fabric Ordered
                </span>
                <h3 className="mb-0 fw-bold text-dark mt-1 fs-24">
                  {Number(totalMeters).toFixed(1)} <span className="fs-14 fw-medium text-muted">m</span>
                </h3>
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
                <i className="ti ti-ruler-2 fs-22"></i>
              </div>
            </div>
            <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
              <i className="ti ti-layers-intersect text-primary fs-13"></i>
              <span>Across all active styles</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Estimated Value */}
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
                  Total Estimated Value
                </span>
                <h3 className="mb-0 fw-bold text-dark mt-1 fs-24">
                  ₹{Number(totalCost).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </h3>
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
                <i className="ti ti-cash fs-22"></i>
              </div>
            </div>
            <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
              <i className="ti ti-trending-up text-success fs-13"></i>
              <span>Fabric + Dyeing total cost</span>
            </div>
          </div>
        </div>

        {/* Card 4: Primary Vendor */}
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
                  Primary Vendor
                </span>
                <h4 className="mb-0 fw-bold text-dark mt-1 fs-20 text-truncate" style={{ maxWidth: '170px' }}>
                  {primaryVendor}
                </h4>
              </div>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
                style={{
                  width: '42px',
                  height: '42px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  color: '#8b5cf6'
                }}
              >
                <i className="ti ti-building-factory-2 fs-22"></i>
              </div>
            </div>
            <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
              <i className="ti ti-map-pin text-secondary fs-13"></i>
              <span>Surat Industrial Hub</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN TABLE CARD (FITTED TO SCREEN - ZERO HORIZONTAL SCROLL - CLICKABLE) */}
      {/* ========================================================================= */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        {/* Controls Bar */}
        <div className="card-header bg-white py-3 px-4 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '600px' }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="ti ti-search fs-14"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 fs-13"
                placeholder="Search PO number, style name, vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-select form-select-sm fs-13"
              style={{ width: '160px', borderColor: '#cbd5e1' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent to Vendor">Sent to Vendor</option>
              <option value="Partially Dispatched">Partially Dispatched</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm px-3 shadow-xs d-flex align-items-center gap-1.5 rounded-2"
            style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
            onClick={onNewPO}
          >
            <i className="ti ti-plus fs-14"></i>
            <span className="fw-semibold">New Process PO</span>
          </button>
        </div>

        {/* Table fitting 100% width with ZERO horizontal scrollbar */}
        <div className="p-0">
          <table className="table table-hover align-middle mb-0 w-100" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr className="text-secondary fw-semibold">
                <th style={{ width: '130px' }}>PO & Date</th>
                <th style={{ minWidth: '170px' }}>Vendor</th>
                <th style={{ minWidth: '160px' }}>Style(s)</th>
                <th style={{ width: '120px' }} className="text-center">Order Link</th>
                <th style={{ width: '110px' }} className="text-end">Quantity</th>
                <th style={{ width: '120px' }} className="text-end">Amount (₹)</th>
                <th style={{ width: '130px' }} className="text-center">Status</th>
                <th style={{ width: '90px' }} className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <i className="ti ti-inbox fs-32 d-block mb-2 text-muted opacity-50"></i>
                    <span>No Process Purchase Orders found matching criteria.</span>
                  </td>
                </tr>
              ) : (
                filtered.map((po) => {
                  let badgeClass = 'bg-secondary text-white';
                  if (po.status === 'Sent to Vendor') badgeClass = 'bg-primary-subtle text-primary border border-primary-subtle';
                  if (po.status === 'Partially Dispatched') badgeClass = 'bg-warning-subtle text-warning border border-warning-subtle';
                  if (po.status === 'Completed') badgeClass = 'bg-success-subtle text-success border border-success-subtle';
                  if (po.status === 'Draft') badgeClass = 'bg-light text-secondary border';

                  return (
                    <tr
                      key={po.id}
                      onClick={() => onViewPO(po)}
                      style={{ cursor: 'pointer' }}
                      className="transition-all"
                      title="Click row to open and view/edit details"
                    >
                      {/* PO Number & Date Combined (Saves width, prevents horizontal scroll) */}
                      <td>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace fw-bold fs-12">
                          #{po.po_number || po.id}
                        </span>
                        <div className="text-muted fs-11 mt-1 d-flex align-items-center gap-1">
                          <i className="ti ti-calendar fs-12"></i>
                          <span>{po.date}</span>
                        </div>
                      </td>

                      {/* Vendor */}
                      <td>
                        <div className="fw-semibold text-dark fs-13">{po.vendor_name}</div>
                        <small className="text-muted fs-11">{po.customer_brand_name || 'Raindrop Signature'}</small>
                      </td>

                      {/* Styles Bundled */}
                      <td>
                        <div className="fw-medium text-dark fs-12.5 text-truncate" style={{ maxWidth: '180px' }}>
                          {po.style_names?.[0] || '—'}
                        </div>
                        {po.style_names && po.style_names.length > 1 && (
                          <span className="badge bg-light text-secondary border fs-10 mt-0.5">
                            +{po.style_names.length - 1} more bundled
                          </span>
                        )}
                      </td>

                      {/* Order Link */}
                      <td className="text-center">
                        {po.linked_sales_order_id ? (
                          <span className="badge bg-indigo-subtle text-primary border border-indigo-200 fs-11 font-monospace">
                            {po.linked_sales_order_id}
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border fs-11">
                            Stock PO
                          </span>
                        )}
                      </td>

                      {/* Quantity: Metres & Pieces */}
                      <td className="text-end">
                        <span className="fw-bold text-dark fs-13">
                          {Number(po.total_meters || 0).toFixed(1)} m
                        </span>
                        <div className="text-muted fs-11">{po.total_pieces || 0} pcs</div>
                      </td>

                      {/* Total Amount */}
                      <td className="text-end fw-bold text-dark fs-13">
                        ₹{Number(po.total_estimated_cost || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>

                      {/* Status */}
                      <td className="text-center">
                        <span className={`badge rounded-pill fs-11 fw-semibold ${badgeClass}`}>
                          {po.status}
                        </span>
                      </td>

                      {/* Actions with stopPropagation */}
                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm p-1 rounded-2"
                            style={{ width: '28px', height: '28px' }}
                            title="Print Paper Format"
                            onClick={() => onPrintPO(po)}
                          >
                            <i className="ti ti-printer fs-14"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm p-1 rounded-2"
                            style={{ width: '28px', height: '28px' }}
                            title="View / Edit PO"
                            onClick={() => onViewPO(po)}
                          >
                            <i className="ti ti-eye fs-14"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="card-footer bg-white border-top py-2.5 px-4 d-flex justify-content-between align-items-center text-muted fs-12">
          <span>
            Showing <strong>{filtered.length}</strong> of <strong>{pos.length}</strong> records
          </span>
          <span className="d-flex align-items-center gap-1">
            <i className="ti ti-pointer text-primary"></i> Click any row to view &amp; edit full PO details
          </span>
        </div>
      </div>
    </div>
  );
}
