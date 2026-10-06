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
    if (!g) return false;
    if (activeTab === 'completed' && g.status !== 'Completed') return false;
    if (activeTab === 'drafts' && g.status === 'Completed') return false;

    const gId = String(g.id || '');
    const gVendor = String(g.vendorName || '');
    const gInvoice = String(g.vendorInvoiceNo || '');
    const gChallan = String(g.vendorChallanNo || '');
    const gDate = String(g.date ? (typeof g.date === 'string' && g.date.includes('T') ? g.date.split('T')[0] : g.date) : '');

    const matchesSearch =
      searchTerm === '' ||
      gId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gVendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gInvoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gChallan.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCol =
      gId.toLowerCase().includes((colFilters.id || '').toLowerCase()) &&
      gDate.includes(colFilters.date || '') &&
      gVendor.toLowerCase().includes((colFilters.vendor || '').toLowerCase()) &&
      (!colFilters.invoice || gInvoice.toLowerCase().includes(colFilters.invoice.toLowerCase())) &&
      (!colFilters.challan || gChallan.toLowerCase().includes(colFilters.challan.toLowerCase())) &&
      (!colFilters.status || g.status === colFilters.status);

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
            <thead className="text-secondary" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GRN No.</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vendor</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Linked PO(s)</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice No.</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Challan No.</th>
                <th className="text-center" style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bales</th>
                <th className="text-end" style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Length</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '150px' }}>Status</th>
                <th className="text-center" style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
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
                      <div className="d-inline-flex flex-column align-items-start gap-1">
                        <span
                          className={`badge rounded-pill px-2.5 py-1 ${
                            g.status === 'Completed'
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : g.status === 'Bale Entry in Progress'
                              ? 'bg-primary-subtle text-primary border border-primary-subtle'
                              : 'bg-warning-subtle text-warning border border-warning-subtle'
                          }`}
                        >
                          <i className={`ti ${g.status === 'Completed' ? 'ti-check' : 'ti-clock'} me-1 fs-11`}></i>
                          {g.status}
                        </span>
                        {g.adminApprovalNeeded && (
                          <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center gap-1" title="Buffer Tolerance Exceeded">
                            <i className="ti ti-alert-triangle fs-11"></i>
                            Tolerance Hold
                          </span>
                        )}
                      </div>
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
