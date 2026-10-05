import React, { useState } from 'react';

/**
 * QualityCheckList - 6.0 Quality Inspection List
 * Filterable view of all fabric quality inspections with column filters.
 */
export default function QualityCheckList({
  qcRecords = [],
  onNewQC,
  onSelectQC
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [colFilters, setColFilters] = useState({
    id: '',
    grn: '',
    scope: '',
    inspector: '',
    status: ''
  });

  const filtered = qcRecords.filter((qc) => {
    const matchesSearch =
      searchTerm === '' ||
      qc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qc.grnRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qc.inspectorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCol =
      qc.id.toLowerCase().includes(colFilters.id.toLowerCase()) &&
      qc.grnRef.toLowerCase().includes(colFilters.grn.toLowerCase()) &&
      (colFilters.scope === '' || qc.inspectionScope === colFilters.scope) &&
      qc.inspectorName.toLowerCase().includes(colFilters.inspector.toLowerCase()) &&
      (colFilters.status === '' || qc.qcStatus === colFilters.status);

    return matchesSearch && matchesCol;
  });

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-muted fs-12">
              <li className="breadcrumb-item">Quality Check</li>
              <li className="breadcrumb-item active text-primary fw-medium">Inspections</li>
            </ol>
          </nav>
          <h2 className="fw-bold text-dark mb-1 fs-24">Quality Inspections (QC)</h2>
          <p className="text-secondary mb-0 fs-13">
            Width Verification, Fold Checks, Fabric Visual Grading &amp; Defect Routing
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium shadow-sm rounded-3"
          onClick={onNewQC}
        >
          <i className="ti ti-plus fs-16"></i>
          <span>Perform QC Inspection</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div className="input-group" style={{ maxWidth: '320px' }}>
            <span className="input-group-text bg-light border-end-0 text-muted">
              <i className="ti ti-search fs-15"></i>
            </span>
            <input
              type="text"
              className="form-control bg-light border-start-0 fs-13"
              placeholder="Search QC ID, GRN, Inspector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <span className="badge bg-light text-secondary border px-2 py-1 fs-12">
            {filtered.length} Inspection Records
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-secondary">
              <tr className="bg-light">
                <th>
                  <input
                    type="text"
                    placeholder="Filter QC"
                    className="form-control form-control-sm fs-11"
                    value={colFilters.id}
                    onChange={(e) => setColFilters({ ...colFilters, id: e.target.value })}
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Filter GRN"
                    className="form-control form-control-sm fs-11"
                    value={colFilters.grn}
                    onChange={(e) => setColFilters({ ...colFilters, grn: e.target.value })}
                  />
                </th>
                <th>
                  <select
                    className="form-select form-select-sm fs-11"
                    value={colFilters.scope}
                    onChange={(e) => setColFilters({ ...colFilters, scope: e.target.value })}
                  >
                    <option value="">All Scopes</option>
                    <option value="Whole Shipment">Whole Shipment</option>
                    <option value="Bale-Level">Bale-Level</option>
                    <option value="Piece-Level">Piece-Level</option>
                  </select>
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Inspector"
                    className="form-control form-control-sm fs-11"
                    value={colFilters.inspector}
                    onChange={(e) => setColFilters({ ...colFilters, inspector: e.target.value })}
                  />
                </th>
                <th>Width (Exp vs Act)</th>
                <th>Fold (Exp vs Act)</th>
                <th>
                  <select
                    className="form-select form-select-sm fs-11"
                    value={colFilters.status}
                    onChange={(e) => setColFilters({ ...colFilters, status: e.target.value })}
                  >
                    <option value="">All Status</option>
                    <option value="OK">OK</option>
                    <option value="Send for Admin Approval">Admin Approval</option>
                    <option value="Reject">Reject</option>
                  </select>
                </th>
                <th className="text-center">Action</th>
              </tr>
              <tr>
                <th>QC ID</th>
                <th>GRN Ref</th>
                <th>Scope</th>
                <th>Inspector</th>
                <th>Width (Inches)</th>
                <th>Fold (%)</th>
                <th>Decision / Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <i className="ti ti-shield-off fs-32 d-block mb-2"></i>
                    No Quality Inspection records found.
                  </td>
                </tr>
              ) : (
                filtered.map((qc) => (
                  <tr key={qc.id}>
                    <td className="fw-bold text-primary font-monospace">{qc.id}</td>
                    <td className="font-monospace fw-semibold">{qc.grnRef}</td>
                    <td>
                      <span className="badge bg-light text-dark border">{qc.inspectionScope}</span>
                      {qc.baleRef && (
                        <span className="badge bg-light text-secondary ms-1">
                          {qc.baleRef} {qc.pieceRef ? `→ ${qc.pieceRef}` : ''}
                        </span>
                      )}
                    </td>
                    <td>{qc.inspectorName}</td>
                    <td>
                      <span className="text-muted fs-11">{qc.expectedWidth}" exp</span> →{' '}
                      <strong>{qc.actualWidth}"</strong>
                    </td>
                    <td>
                      <span className="text-muted fs-11">{qc.expectedFold}% exp</span> →{' '}
                      <strong>{qc.actualFold}%</strong>
                    </td>
                    <td>
                      <span
                        className={`badge px-2 py-1 ${
                          qc.qcStatus === 'OK'
                            ? 'bg-success-subtle text-success'
                            : qc.qcStatus === 'Reject'
                            ? 'bg-danger-subtle text-danger'
                            : 'bg-warning-subtle text-warning'
                        }`}
                      >
                        {qc.qcStatus}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm px-2 py-1"
                        onClick={() => onSelectQC && onSelectQC(qc)}
                      >
                        <i className="ti ti-eye fs-14"></i>
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
