import React, { useState } from 'react';

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

  return (
    <div>
      {/* Top Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-primary text-white p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-white-50 text-uppercase fw-bold">Active Process POs</small>
                <h3 className="mb-0 fw-bold">{pos.length}</h3>
              </div>
              <i className="ti ti-file-invoice fs-1 opacity-50"></i>
            </div>
            <small className="text-white-50 mt-2 d-block">Job work dyeing & finishing</small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-dark text-white p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-white-50 text-uppercase fw-bold">Total Fabric Ordered</small>
                <h3 className="mb-0 fw-bold">{Number(totalMeters).toFixed(1)} m</h3>
              </div>
              <i className="ti ti-ruler-2 fs-1 opacity-50"></i>
            </div>
            <small className="text-white-50 mt-2 d-block">Across all active styles</small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-success text-white p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-white-50 text-uppercase fw-bold">Total Estimated Value</small>
                <h3 className="mb-0 fw-bold">₹{Number(totalCost).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
              </div>
              <i className="ti ti-cash fs-1 opacity-50"></i>
            </div>
            <small className="text-white-50 mt-2 d-block">Fabric + Dyeing total</small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-info text-white p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-white-50 text-uppercase fw-bold">Primary Job Vendor</small>
                <h4 className="mb-0 fw-bold text-truncate" style={{ maxWidth: '160px' }}>Raju Dyeing</h4>
              </div>
              <i className="ti ti-building-factory-2 fs-1 opacity-50"></i>
            </div>
            <small className="text-white-50 mt-2 d-block">Mansarovar Industrial Area</small>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '600px' }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="ti ti-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search PO number, style name, vendor, brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-select form-select-sm"
              style={{ width: '160px' }}
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

          <button className="btn btn-primary btn-sm px-3 shadow-sm" onClick={onNewPO}>
            <i className="ti ti-plus me-1"></i> + New Process PO
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr>
                <th>PO Number</th>
                <th>Date</th>
                <th>Vendor (Job Worker)</th>
                <th>Style(s) Bundled</th>
                <th>Order Link</th>
                <th className="text-end">Mtrs Ordered</th>
                <th className="text-end">Pcs</th>
                <th className="text-end">Amount (₹)</th>
                <th className="text-center">Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-4 text-muted">
                    <i className="ti ti-inbox fs-1 d-block mb-2"></i>
                    No Process POs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((po) => {
                  const isStandalone = !po.linked_sales_order_id;
                  let badgeClass = 'bg-secondary';
                  if (po.status === 'Sent to Vendor') badgeClass = 'bg-info text-dark';
                  if (po.status === 'Partially Dispatched') badgeClass = 'bg-warning text-dark';
                  if (po.status === 'Completed') badgeClass = 'bg-success';

                  return (
                    <tr key={po.id}>
                      <td className="fw-bold text-primary">
                        <span className="badge bg-light text-primary border me-1">#{po.po_number || po.id}</span>
                      </td>
                      <td>{po.date}</td>
                      <td>
                        <div className="fw-semibold text-dark">{po.vendor_name}</div>
                        <small className="text-muted">{po.customer_brand_name || 'Raindrop'}</small>
                      </td>
                      <td>
                        <div className="fw-medium">
                          {Array.isArray(po.style_names) ? po.style_names.join(', ') : (po.style_name || '-')}
                        </div>
                        {po.number_of_styles > 1 && (
                          <span className="badge bg-light text-dark border" style={{ fontSize: '10px' }}>
                            {po.number_of_styles} Styles Bundled
                          </span>
                        )}
                      </td>
                      <td>
                        {isStandalone ? (
                          <span className="badge bg-light text-muted border">Standalone Stock</span>
                        ) : (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                            {po.linked_sales_order_id}
                          </span>
                        )}
                      </td>
                      <td className="text-end fw-bold">{Number(po.total_meters || 0).toFixed(2)} m</td>
                      <td className="text-end">{po.total_pieces || '-'}</td>
                      <td className="text-end fw-bold text-dark">
                        ₹{Number(po.total_estimated_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${badgeClass}`}>{po.status}</span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="View / Edit Details"
                            onClick={() => onViewPO(po)}
                          >
                            <i className="ti ti-eye"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            title="Print PO Paper Slip"
                            onClick={() => onPrintPO(po)}
                          >
                            <i className="ti ti-printer"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Issue Process Challan"
                            onClick={() => onCreateChallanFromPO(po)}
                          >
                            <i className="ti ti-truck-delivery"></i>
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
      </div>
    </div>
  );
}
