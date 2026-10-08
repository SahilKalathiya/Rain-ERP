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

function parseDateForSort(d, id) {
  if (!d) {
    if (id) {
      const match = String(id).match(/\d+/g);
      if (match) return Number(match.join(''));
    }
    return 0;
  }
  if (typeof d === 'number') return d;
  const str = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const time = new Date(str).getTime();
    if (!isNaN(time)) return time;
  }
  const parts = str.split(/[\/\- :]/);
  if (parts.length >= 3) {
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else if (year < 100) {
      year += 2000;
    }
    const hour = parts[3] ? parseInt(parts[3], 10) : 0;
    const min = parts[4] ? parseInt(parts[4], 10) : 0;
    const dt = new Date(year, month, day, hour, min);
    if (!isNaN(dt.getTime())) return dt.getTime();
  }
  const timestamp = Date.parse(str);
  return isNaN(timestamp) ? 0 : timestamp;
}

  const filtered = (grns || []).filter((g) => {
    if (!g) return false;
    if (activeTab === 'completed' && g.status !== 'Completed' && g.status !== 'QC Approved') return false;
    if (activeTab === 'drafts' && (g.status === 'Completed' || g.status === 'QC Approved')) return false;

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

  const sortedList = [...filtered].sort((a, b) => {
    // 1. First priority: exact entry/update timestamp (newest entry / updated entry on top)
    const stampA = a.updatedAt || a.createdAt || a.timestamp || 0;
    const stampB = b.updatedAt || b.createdAt || b.timestamp || 0;
    if (stampA && stampB && stampA !== stampB) {
      return stampB - stampA;
    }
    if (stampB && !stampA) return 1;
    if (stampA && !stampB) return -1;

    // 2. Second priority: received / entry date
    const timeA = parseDateForSort(a.date || a.receivedDate || a.createdDate);
    const timeB = parseDateForSort(b.date || b.receivedDate || b.createdDate);
    if (timeB && timeA && timeB !== timeA) return timeB - timeA;

    // 3. Third priority: maintain natural entry / list insertion order (newest on top)
    return grns.indexOf(a) - grns.indexOf(b);
  });

  return (
    <div className="container-fluid p-0">
      {/* Header matching Screenshot 1 */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span
            className="badge px-2.5 py-1 fs-11 fw-bold text-uppercase rounded-pill"
            style={{ backgroundColor: '#e0e7ff', color: '#4338ca', letterSpacing: '0.5px' }}
          >
            STEP 3
          </span>
          <span className="text-muted fs-12 fw-medium">Goods Receipt</span>
        </div>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-1 fs-24">GRN Register</h2>
            <p className="text-secondary fs-13 mb-0" style={{ maxWidth: '850px' }}>
              Every shipment received — whether a fabric purchase order or fabric coming back from processing/dyeing — goes through this same register. Drafts and partly-entered bale counts are saved here too — click one to pick up right where you left off.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 px-3.5 py-2 fw-medium shadow-sm rounded-3 text-white"
            style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
            onClick={onNewGRN}
          >
            <i className="ti ti-plus fs-16"></i>
            <span>Create New GRN</span>
          </button>
        </div>
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
              All GRNs ({(grns || []).filter(Boolean).length})
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1 ${
                activeTab === 'completed' ? 'btn-success' : 'btn-light'
              }`}
              onClick={() => setActiveTab('completed')}
            >
              Completed ({(grns || []).filter((g) => g && (g.status === 'Completed' || g.status === 'QC Approved')).length})
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1 ${
                activeTab === 'drafts' ? 'btn-warning text-dark' : 'btn-light'
              }`}
              onClick={() => setActiveTab('drafts')}
            >
              Drafts / In Progress ({(grns || []).filter((g) => g && g.status !== 'Completed' && g.status !== 'QC Approved').length})
            </button>
          </div>

          <div className="position-relative" style={{ maxWidth: '340px', width: '100%' }}>
            <i
              className="ti ti-search position-absolute text-muted fs-15"
              style={{
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                zIndex: 2
              }}
            ></i>
            <input
              type="text"
              className="form-control bg-light fs-13 search-input-integrated"
              style={{
                borderRadius: '8px',
                borderColor: '#e2e8f0'
              }}
              placeholder="Search GRN, vendor, fabric..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table matching Screenshot 1: GRN | AGAINST | VENDOR | FABRIC(S) | RECEIVED | TOTAL QTY | STATUS */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-secondary fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.3px' }}>
              <tr>
                <th className="ps-4 py-3" style={{ minWidth: '130px' }}>GRN</th>
                <th className="py-3" style={{ minWidth: '110px' }}>AGAINST</th>
                <th className="py-3" style={{ minWidth: '160px' }}>VENDOR</th>
                <th className="py-3" style={{ minWidth: '200px' }}>FABRIC(S)</th>
                <th className="py-3" style={{ minWidth: '120px' }}>RECEIVED</th>
                <th className="py-3 text-end" style={{ minWidth: '120px' }}>TOTAL QTY</th>
                <th className="py-3 text-center" style={{ minWidth: '130px' }}>STATUS</th>
                <th className="pe-4 py-3 text-end" style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {sortedList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <i className="ti ti-package-off fs-32 d-block mb-2"></i>
                    No Goods Receipt Notes found.
                  </td>
                </tr>
              ) : (
                sortedList.map((g) => {
                  const againstPo = g.linkedPOs?.[0] || 'PO-1001';
                  const fabricLabel = g.fabricName || 'Tussar Silk (42") — Ivory';
                  const meters = (Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 2000).toFixed(0);

                  return (
                    <tr
                      key={g.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onSelectGRN && onSelectGRN(g)}
                      className="hover-bg-light"
                    >
                      {/* GRN */}
                      <td className="ps-4 py-3 fw-bold text-dark font-monospace fs-14">
                        {g.id}
                      </td>

                      {/* AGAINST */}
                      <td className="py-3 text-secondary fw-semibold">
                        {againstPo}
                      </td>

                      {/* VENDOR */}
                      <td className="py-3 text-dark fw-medium">
                        {g.vendorName || 'Vendor'}
                      </td>

                      {/* FABRIC(S) */}
                      <td className="py-3 text-secondary">
                        {fabricLabel}
                      </td>

                      {/* RECEIVED */}
                      <td className="py-3 text-muted">
                        {g.date ? (typeof g.date === 'string' && g.date.includes('T') ? g.date.split('T')[0] : g.date) : '2026-10-07'}
                      </td>

                      {/* TOTAL QTY */}
                      <td className="py-3 text-end fw-bold text-dark fs-14">
                        {meters}m
                      </td>

                      {/* STATUS */}
                      <td className="py-3 text-center">
                        <span
                          className={`badge rounded-pill px-2.5 py-1 fs-11 ${
                            g.status === 'QC Approved' || g.status === 'Completed'
                              ? 'bg-success-subtle text-success border border-success border-opacity-25'
                              : g.status === 'QC Rejected'
                              ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                              : g.status === 'Pending Admin Approval'
                              ? 'bg-warning-subtle text-warning border border-warning border-opacity-25'
                              : 'bg-primary-subtle text-primary border border-primary border-opacity-25'
                          }`}
                        >
                          {g.status || 'Completed'}
                        </span>
                      </td>

                      {/* Chevron */}
                      <td className="pe-4 py-3 text-end text-muted">
                        <i className="ti ti-chevron-right fs-15 text-secondary"></i>
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
