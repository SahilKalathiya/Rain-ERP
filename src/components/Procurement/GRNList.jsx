import React, { useState } from 'react';

/**
 * GRNList - 5.0 Goods Receipt Note Management List
 * Column-wise filtering, status tracking, Draft resume support, and view/edit actions.
 */
export default function GRNList({ grns = [], onNewGRN, onSelectGRN }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'completed', 'drafts'

  const [colFilters, setColFilters] = useState({
    id: '',
    date: '',
    vendor: '',
    invoice: '',
    challan: '',
    status: ''
  });

  const filtered = grns.filter((g) => {
    if (activeTab === 'completed' && g.status !== 'Completed') return false;
    if (activeTab === 'drafts' && g.status === 'Completed') return false;

    const matchesSearch =
      searchTerm === '' ||
      g.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.vendorInvoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.vendorChallanNo || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCol =
      g.id.toLowerCase().includes(colFilters.id.toLowerCase()) &&
      g.date.includes(colFilters.date) &&
      g.vendorName.toLowerCase().includes(colFilters.vendor.toLowerCase()) &&
      (colFilters.invoice === '' ||
        (g.vendorInvoiceNo || '').toLowerCase().includes(colFilters.invoice.toLowerCase())) &&
      (colFilters.challan === '' ||
        (g.vendorChallanNo || '').toLowerCase().includes(colFilters.challan.toLowerCase())) &&
      (colFilters.status === '' || g.status === colFilters.status);

    return matchesSearch && matchesCol;
  });

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-muted fs-12">
              <li className="breadcrumb-item">Procurement</li>
              <li className="breadcrumb-item active text-primary fw-medium">Goods Receipt (GRN)</li>
            </ol>
          </nav>
          <h2 className="fw-bold text-dark mb-1 fs-24">Goods Receipt Notes (GRN)</h2>
          <p className="text-secondary mb-0 fs-13">
            Inward Shipment Gate Entries, Bale Tracking &amp; Piece-Wise Meter Verification
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium shadow-sm rounded-3"
          onClick={onNewGRN}
        >
          <i className="ti ti-plus fs-16"></i>
          <span>Create New GRN</span>
        </button>
      </div>

      {/* Filter and Tab Bar */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1 ${
                activeTab === 'all' ? 'btn-primary' : 'btn-light'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All GRNs ({grns.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1 ${
                activeTab === 'completed' ? 'btn-success' : 'btn-light'
              }`}
              onClick={() => setActiveTab('completed')}
            >
              Completed ({grns.filter((g) => g.status === 'Completed').length})
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1 ${
                activeTab === 'drafts' ? 'btn-warning text-dark' : 'btn-light'
              }`}
              onClick={() => setActiveTab('drafts')}
            >
              Drafts / In Progress ({grns.filter((g) => g.status !== 'Completed').length})
            </button>
          </div>

          <div className="input-group" style={{ maxWidth: '320px' }}>
            <span className="input-group-text bg-light border-end-0 text-muted">
              <i className="ti ti-search fs-15"></i>
            </span>
            <input
              type="text"
              className="form-control bg-light border-start-0 fs-13"
              placeholder="Search GRN, invoice, challan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-secondary">
              {/* Column Filters (9.3) */}
              <tr className="bg-light">
                <th>
                  <input
                    type="text"
                    placeholder="Filter GRN"
                    className="form-control form-control-sm fs-11"
                    value={colFilters.id}
                    onChange={(e) => setColFilters({ ...colFilters, id: e.target.value })}
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Date"
                    className="form-control form-control-sm fs-11"
                    value={colFilters.date}
                    onChange={(e) => setColFilters({ ...colFilters, date: e.target.value })}
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Filter Vendor"
                    className="form-control form-control-sm fs-11"
                    value={colFilters.vendor}
                    onChange={(e) => setColFilters({ ...colFilters, vendor: e.target.value })}
                  />
                </th>
                <th>Linked POs</th>
                <th>
                  <input
                    type="text"
                    placeholder="Invoice No"
                    className="form-control form-control-sm fs-11"
                    value={colFilters.invoice}
                    onChange={(e) => setColFilters({ ...colFilters, invoice: e.target.value })}
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Challan No"
                    className="form-control form-control-sm fs-11"
                    value={colFilters.challan}
                    onChange={(e) => setColFilters({ ...colFilters, challan: e.target.value })}
                  />
                </th>
                <th className="text-center">Bales</th>
                <th className="text-end">Total Mtrs</th>
                <th>
                  <select
                    className="form-select form-select-sm fs-11"
                    value={colFilters.status}
                    onChange={(e) => setColFilters({ ...colFilters, status: e.target.value })}
                  >
                    <option value="">All</option>
                    <option value="Completed">Completed</option>
                    <option value="Bale Entry in Progress">In Progress</option>
                    <option value="Header Saved">Header Saved</option>
                    <option value="Draft">Draft</option>
                  </select>
                </th>
                <th className="text-center">Action</th>
              </tr>
              <tr>
                <th>GRN No.</th>
                <th>Date</th>
                <th>Vendor</th>
                <th>Linked PO(s)</th>
                <th>Invoice No.</th>
                <th>Challan No.</th>
                <th className="text-center">Bales</th>
                <th className="text-end">Total Length</th>
                <th>Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-5 text-muted">
                    <i className="ti ti-package-off fs-32 d-block mb-2"></i>
                    No Goods Receipt Notes found.
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr key={g.id}>
                    <td className="fw-bold text-primary font-monospace">{g.id}</td>
                    <td>{g.date}</td>
                    <td>
                      <div className="fw-medium text-dark">{g.vendorName}</div>
                      <div className="text-muted fs-11">{g.transporterName || 'Self Transport'}</div>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {(g.linkedPOs || []).map((poId) => (
                          <span key={poId} className="badge bg-light text-primary border font-monospace fs-11">
                            {poId}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="font-monospace fs-12">{g.vendorInvoiceNo || '-'}</td>
                    <td className="font-monospace fs-12">{g.vendorChallanNo || '-'}</td>
                    <td className="text-center fw-bold">{g.totalBales || (g.bales || []).length}</td>
                    <td className="text-end fw-bold text-dark fs-13">
                      {(Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0).toFixed(2)} Mtrs
                    </td>
                    <td>
                      <span
                        className={`badge px-2 py-1 ${
                          g.status === 'Completed'
                            ? 'bg-success-subtle text-success'
                            : g.status === 'Bale Entry in Progress'
                            ? 'bg-primary-subtle text-primary'
                            : 'bg-warning-subtle text-warning'
                        }`}
                      >
                        {g.status}
                      </span>
                      {g.adminApprovalNeeded && (
                        <span className="badge bg-danger-subtle text-danger ms-1" title="Buffer Tolerance Exceeded">
                          Tolerance Hold
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm px-2 py-1"
                        onClick={() => onSelectGRN && onSelectGRN(g)}
                      >
                        <i className="ti ti-edit fs-14 me-1"></i>
                        <span>{g.status === 'Completed' ? 'View' : 'Resume'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
