import React, { useState } from 'react';

/**
 * ProcessPOList - List view for Process Purchase Orders
 * Theme-aligned KPI cards with high-contrast text (Zero invisible white text)
 * Screen-fitted responsive table with ZERO horizontal overflow (No left-right scroll)
 * Fully clickable table rows to view/edit record directly
 */
export default function ProcessPOList({ pos = [], onNewPO, onViewPO, onPrintPO, onCreateChallanFromPO, challans = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vendorFilter, setVendorFilter] = useState('ALL');

  const isPoLocked = (po) => {
    if (po.is_locked) return true;
    if (po.status === 'Sent to Vendor' || po.status === 'Completed') return true;
    if (challans && challans.some(c => c.linked_pos && (
      c.linked_pos.includes(po.id) ||
      c.linked_pos.includes(po.po_number) ||
      c.linked_pos.includes(`PPO-${po.po_number}`)
    ))) return true;
    return false;
  };

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

  return (
    <div>

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
                <th style={{ width: '175px' }} className="text-end">Actions</th>
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
                        {isPoLocked(po) ? (
                          <span className="badge rounded-pill fs-11 fw-semibold bg-secondary-subtle text-secondary border border-secondary-subtle d-inline-flex align-items-center gap-1">
                            <i className="ti ti-lock fs-11"></i> Locked ({po.status})
                          </span>
                        ) : (
                          <span className={`badge rounded-pill fs-11 fw-semibold ${badgeClass}`}>
                            {po.status}
                          </span>
                        )}
                      </td>

                      {/* Actions with stopPropagation */}
                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="d-flex align-items-center justify-content-end gap-1.5">
                          {!isPoLocked(po) && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm px-2 py-1 rounded-2 d-flex align-items-center gap-1 shadow-xs"
                              style={{
                                background: '#4f46e5',
                                borderColor: '#4f46e5',
                                fontSize: '11.5px',
                                height: '28px',
                                whiteSpace: 'nowrap'
                              }}
                              title="Dispatch fabric to vendor via Process Challan"
                              onClick={() => onCreateChallanFromPO && onCreateChallanFromPO(po)}
                            >
                              <i className="ti ti-truck-delivery fs-13"></i>
                              <span className="fw-semibold">+ Challan</span>
                            </button>
                          )}
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
                            title={isPoLocked(po) ? "View Locked PO" : "View / Edit PO"}
                            onClick={() => onViewPO(po)}
                          >
                            <i className={`ti ${isPoLocked(po) ? 'ti-lock-access' : 'ti-eye'} fs-14`}></i>
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
