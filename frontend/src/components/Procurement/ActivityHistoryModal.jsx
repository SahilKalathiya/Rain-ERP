import React, { useState } from 'react';

/**
 * ActivityHistoryModal - 9.4 Field-Level Activity History & Audit Trail
 * Records whenever a record is created, edited, updated, approved, rejected, deleted, or restored.
 */
export default function ActivityHistoryModal({ logs = [], onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      searchTerm === '' ||
      l.recordNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.field.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = moduleFilter === 'All' || l.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1070 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 p-4 bg-white">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <div>
              <h5 className="fw-bold text-dark mb-0 fs-18">
                <i className="ti ti-history me-1 text-primary"></i>
                Activity History &amp; Audit Trail (Section 9.4)
              </h5>
              <p className="text-secondary mb-0 fs-12">
                Field-level modification records, timestamped user actions and approval logs
              </p>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {/* Search & Module Filters */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div className="input-group" style={{ maxWidth: '320px' }}>
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="ti ti-search fs-14"></i>
              </span>
              <input
                type="text"
                className="form-control form-control-sm bg-light border-start-0 fs-12"
                placeholder="Search user, record, or field..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="fs-12 text-secondary">Module:</span>
              <select
                className="form-select form-select-sm bg-light fs-12"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
              >
                <option value="All">All Modules</option>
                <option value="Purchase Order">Purchase Order</option>
                <option value="GRN">GRN</option>
                <option value="Quality Check">Quality Check</option>
                <option value="Rejected Stock">Rejected Stock</option>
                <option value="Vendor Master">Vendor Master</option>
              </select>
            </div>
          </div>

          {/* Audit Trail Table */}
          <div className="table-responsive" style={{ maxHeight: '450px' }}>
            <table className="table table-hover table-sm align-middle mb-0 fs-12">
              <thead className="table-light text-secondary sticky-top">
                <tr>
                  <th style={{ width: '16%' }}>Date &amp; Time</th>
                  <th style={{ width: '14%' }}>User / Role</th>
                  <th style={{ width: '10%' }}>Action</th>
                  <th style={{ width: '12%' }}>Record No.</th>
                  <th style={{ width: '14%' }}>Field Modified</th>
                  <th style={{ width: '14%' }}>Previous Value</th>
                  <th style={{ width: '20%' }}>Updated Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      No audit logs match criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="font-monospace text-muted">{log.dateTime}</td>
                      <td>
                        <div className="fw-semibold text-dark">{log.user}</div>
                        <div className="text-muted fs-11">{log.role || 'Operator'}</div>
                      </td>
                      <td>
                        <span
                          className={`badge px-2 py-1 ${
                            log.action === 'Create'
                              ? 'bg-success-subtle text-success'
                              : log.action === 'Reject'
                              ? 'bg-danger-subtle text-danger'
                              : log.action === 'Approval' || log.action === 'Approved'
                              ? 'bg-primary-subtle text-primary'
                              : 'bg-info-subtle text-info'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="fw-bold font-monospace text-primary">{log.recordNo}</td>
                      <td className="fw-medium text-dark">{log.field}</td>
                      <td className="text-muted text-decoration-line-through">
                        {log.previousValue || 'None'}
                      </td>
                      <td className="fw-semibold text-dark">{log.updatedValue}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-end mt-3 pt-2 border-top">
            <button type="button" className="btn btn-light btn-sm px-4" onClick={onClose}>
              Close Audit Trail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
