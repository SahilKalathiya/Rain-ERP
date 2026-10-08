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

  const totalCount = logs.length;
  const createdCount = logs.filter((l) => l.action === 'Create').length;
  const approvedCount = logs.filter((l) => l.action === 'Approval' || l.action === 'Approved').length;
  const rejectedCount = logs.filter((l) => l.action === 'Reject').length;

  return (
    <div className="modal show d-block" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1070 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 p-4 bg-white overflow-hidden">
          {/* Header */}
          <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 border-bottom pb-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3"
                style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)', color: '#5b47fb' }}
              >
                <i className="ti ti-history fs-22"></i>
              </div>
              <div>
                <h5 className="fw-bold text-dark mb-0 fs-18">Activity History &amp; Audit Trail</h5>
                <p className="text-secondary mb-0 fs-12">
                  Field-level modification records, timestamped user actions, and approval logs
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-close rounded-circle p-2"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="row g-2 mb-3">
            <div className="col-6 col-md-3">
              <div className="p-2.5 rounded-3 border bg-light d-flex align-items-center gap-2.5">
                <div className="rounded-circle bg-primary-subtle text-primary p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                  <i className="ti ti-list-details fs-14"></i>
                </div>
                <div>
                  <div className="text-muted fs-11">Total Logs</div>
                  <div className="fw-bold text-dark fs-14">{totalCount}</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-2.5 rounded-3 border bg-light d-flex align-items-center gap-2.5">
                <div className="rounded-circle bg-success-subtle text-success p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                  <i className="ti ti-plus fs-14"></i>
                </div>
                <div>
                  <div className="text-muted fs-11">Created</div>
                  <div className="fw-bold text-success fs-14">{createdCount}</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-2.5 rounded-3 border bg-light d-flex align-items-center gap-2.5">
                <div className="rounded-circle bg-info-subtle text-info p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                  <i className="ti ti-thumb-up fs-14"></i>
                </div>
                <div>
                  <div className="text-muted fs-11">Approvals</div>
                  <div className="fw-bold text-info fs-14">{approvedCount}</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-2.5 rounded-3 border bg-light d-flex align-items-center gap-2.5">
                <div className="rounded-circle bg-danger-subtle text-danger p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                  <i className="ti ti-thumb-down fs-14"></i>
                </div>
                <div>
                  <div className="text-muted fs-11">Rejected</div>
                  <div className="fw-bold text-danger fs-14">{rejectedCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Module Filters */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 bg-light p-2.5 rounded-3 border">
            <div className="position-relative" style={{ maxWidth: '340px', width: '100%' }}>
              <i
                className="ti ti-search position-absolute text-muted fs-14"
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
                className="form-control form-control-sm bg-white fs-12"
                style={{
                  paddingLeft: '36px',
                  borderRadius: '6px',
                  borderColor: '#cbd5e1'
                }}
                placeholder="Search user, record number, field..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="fs-12 fw-medium text-secondary">Module Filter:</span>
              <div className="btn-group btn-group-sm" role="group">
                {['All', 'Purchase Order', 'GRN', 'Quality Check', 'Rejected Stock'].map((mod) => (
                  <button
                    key={mod}
                    type="button"
                    className={`btn btn-sm px-2.5 py-1 fs-12 ${
                      moduleFilter === mod ? 'btn-primary text-white fw-semibold' : 'btn-white bg-white text-secondary border'
                    }`}
                    onClick={() => setModuleFilter(mod)}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Trail Table */}
          <div className="table-responsive rounded-3 border" style={{ maxHeight: '420px' }}>
            <table className="table table-hover table-sm align-middle mb-0 fs-12">
              <thead className="table-light text-secondary sticky-top" style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ width: '16%' }} className="ps-3 py-2.5">Date &amp; Time</th>
                  <th style={{ width: '15%' }} className="py-2.5">User / Role</th>
                  <th style={{ width: '11%' }} className="py-2.5">Action</th>
                  <th style={{ width: '12%' }} className="py-2.5">Record No.</th>
                  <th style={{ width: '14%' }} className="py-2.5">Field</th>
                  <th style={{ width: '14%' }} className="py-2.5">Previous Value</th>
                  <th style={{ width: '18%' }} className="pe-3 py-2.5">Updated Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <i className="ti ti-database-off fs-24 d-block mb-1 text-secondary opacity-50"></i>
                      No audit history entries found matching current filter.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="ps-3 font-monospace text-muted fs-11">
                        <i className="ti ti-clock me-1 text-primary"></i>
                        {log.dateTime}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-10"
                            style={{ width: '24px', height: '24px', backgroundColor: '#5b47fb' }}
                          >
                            {(log.user || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark fs-12">{log.user}</div>
                            <div className="text-muted fs-10">{log.role || 'Operator'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge px-2 py-1 rounded-2 border ${
                            log.action === 'Create'
                              ? 'bg-success-subtle text-success border-success-subtle'
                              : log.action === 'Reject'
                              ? 'bg-danger-subtle text-danger border-danger-subtle'
                              : log.action === 'Approval' || log.action === 'Approved'
                              ? 'bg-primary-subtle text-primary border-primary-subtle'
                              : 'bg-info-subtle text-info border-info-subtle'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark font-monospace border fw-bold">
                          {log.recordNo}
                        </span>
                      </td>
                      <td className="fw-medium text-dark">{log.field}</td>
                      <td>
                        <span className="text-danger-emphasis text-decoration-line-through bg-danger-subtle px-1.5 py-0.5 rounded fs-11">
                          {log.previousValue || 'None'}
                        </span>
                      </td>
                      <td className="pe-3">
                        <span className="fw-semibold text-success-emphasis bg-success-subtle px-1.5 py-0.5 rounded fs-11">
                          {log.updatedValue}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top">
            <span className="text-muted fs-12">
              Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> total records
            </span>
            <button type="button" className="btn btn-secondary btn-sm px-4 rounded-3" onClick={onClose}>
              Close Audit Trail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

