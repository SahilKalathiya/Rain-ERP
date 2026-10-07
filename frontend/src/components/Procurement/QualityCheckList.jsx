import React, { useState } from 'react';

/**
 * QualityCheckList - Step 4: Quality Check Module Register
 * Matches User Prototype with modern ERP Purple Theme.
 * Includes status tabs: All, Pending, Admin Approval, Completed, Damaged / Rejected Pieces.
 * Columns: GRN, AGAINST, FABRIC, WIDTH / COLOUR, QTY, STATUS, ACTION.
 */
export default function QualityCheckList({
  qcRecords = [],
  grns = [],
  purchaseOrders = [],
  damagedItems = [],
  onSelectQC
}) {
  const [activeTabFilter, setActiveTabFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to resolve GRN & PO details for each QC
  const getRecordDetails = (qc) => {
    const matchedGrn = grns.find(
      (g) => g && (g.id === qc.grnRef || (qc.grnRef && g.id.includes(qc.grnRef.replace('GRN-', ''))))
    );
    const againstRef =
      qc.againstRef ||
      (matchedGrn?.linkedPOs && matchedGrn.linkedPOs.length > 0
        ? matchedGrn.linkedPOs[0]
        : matchedGrn?.poId || 'PO-1001');
    const fabricName = qc.fabricName || matchedGrn?.fabricName || 'Grey Cotton Fabrics (100*100)';
    const color = qc.colorName || matchedGrn?.colorName || 'Ivory';
    const width = qc.actualWidth || qc.expectedWidth || matchedGrn?.pannaWidth || '44';
    const qty =
      Number(qc.totalReceivedMeters) ||
      Number(qc.receivedQty) ||
      Number(matchedGrn?.declaredTotalMeters) ||
      Number(matchedGrn?.totalMetersEntered) ||
      2000;
    const status = qc.qcStatus || 'Pending';

    return {
      matchedGrn,
      againstRef,
      fabricName,
      color,
      width,
      qty,
      status
    };
  };

  // Counts for each tab
  const allCount = qcRecords.length;
  const pendingCount = qcRecords.filter(
    (qc) => qc.qcStatus === 'Pending' || !qc.qcStatus
  ).length;
  const adminCount = qcRecords.filter(
    (qc) =>
      qc.qcStatus === 'Send for Admin Approval' ||
      qc.qcStatus === 'Admin Approval' ||
      qc.adminDecision === 'Pending Admin Review'
  ).length;
  const completedCount = qcRecords.filter(
    (qc) =>
      qc.qcStatus === 'OK' ||
      qc.qcStatus === 'Approved' ||
      qc.qcStatus === 'Reject' ||
      qc.qcStatus === 'Rejected' ||
      qc.qcStatus === 'Partial OK'
  ).length;
  const damagedCount =
    damagedItems.length ||
    qcRecords.filter(
      (qc) =>
        Number(qc.defectQty) > 0 ||
        qc.qcStatus === 'Reject' ||
        (qc.issuePieces && qc.issuePieces.length > 0)
    ).length;

  // Filter records by tab and search term
  const filtered = qcRecords.filter((qc) => {
    const details = getRecordDetails(qc);

    // Tab filter
    let matchesTab = true;
    if (activeTabFilter === 'pending') {
      matchesTab = qc.qcStatus === 'Pending' || !qc.qcStatus;
    } else if (activeTabFilter === 'admin') {
      matchesTab =
        qc.qcStatus === 'Send for Admin Approval' ||
        qc.qcStatus === 'Admin Approval' ||
        qc.adminDecision === 'Pending Admin Review';
    } else if (activeTabFilter === 'completed') {
      matchesTab =
        qc.qcStatus === 'OK' ||
        qc.qcStatus === 'Approved' ||
        qc.qcStatus === 'Reject' ||
        qc.qcStatus === 'Rejected' ||
        qc.qcStatus === 'Partial OK';
    } else if (activeTabFilter === 'damaged') {
      matchesTab =
        Number(qc.defectQty) > 0 ||
        qc.qcStatus === 'Reject' ||
        (qc.issuePieces && qc.issuePieces.length > 0) ||
        damagedItems.some((d) => d.sourceQcRef === qc.id || d.grnRef === qc.grnRef);
    }

    if (!matchesTab) return false;

    // Search term filter
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (qc.id && qc.id.toLowerCase().includes(term)) ||
      (qc.grnRef && qc.grnRef.toLowerCase().includes(term)) ||
      (details.againstRef && details.againstRef.toLowerCase().includes(term)) ||
      (details.fabricName && details.fabricName.toLowerCase().includes(term)) ||
      (qc.inspectorName && qc.inspectorName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="container-fluid p-0">
      {/* STEP 4 Header matching Screenshot 1 */}
      <div className="mb-4">
        <div
          className="text-uppercase fw-bold fs-11 tracking-wider mb-1"
          style={{ color: '#5b47fb', letterSpacing: '0.08em' }}
        >
          STEP 4
        </div>
        <h2 className="fw-bold text-dark mb-1 fs-24">Quality Check</h2>
        <p className="text-secondary fs-13 mb-0" style={{ maxWidth: '950px', lineHeight: '1.6' }}>
          Each fabric/width line item received gets its own quality check &mdash; comparing width (and fold, where relevant) against what was expected &mdash; whether it came in against a fabric Purchase Order or a Job Challan. Records stay here with their status even after a decision is made.
        </p>
      </div>

      {/* Tabs Filter Bar (Matches Screenshot 2) */}
      <div className="d-flex align-items-center gap-3 border-bottom mb-4 overflow-x-auto pb-1">
        {[
          { key: 'all', label: `All (${allCount})` },
          { key: 'pending', label: `Pending (${pendingCount})` },
          { key: 'admin', label: `Admin Approval (${adminCount})` },
          { key: 'completed', label: `Completed (${completedCount})` },
          { key: 'damaged', label: `Damaged / Rejected Pieces (${damagedCount})` }
        ].map((tab) => {
          const isActive = activeTabFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              className={`btn btn-link text-decoration-none px-2 py-2 fs-13 position-relative text-nowrap ${
                isActive ? 'fw-bold text-dark' : 'fw-medium text-secondary'
              }`}
              style={{
                color: isActive ? '#1e293b' : '#64748b',
                borderBottom: isActive ? '2px solid #5b47fb' : '2px solid transparent',
                marginBottom: '-2px',
                borderRadius: 0,
                transition: 'all 0.15s ease'
              }}
              onClick={() => setActiveTabFilter(tab.key)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Table Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        {/* Search & Meta */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div className="input-group" style={{ maxWidth: '320px' }}>
            <span className="input-group-text bg-light border-end-0 text-muted">
              <i className="ti ti-search fs-15"></i>
            </span>
            <input
              type="text"
              className="form-control bg-light border-start-0 fs-13"
              placeholder="Search GRN, PO, fabric..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <span className="badge bg-light text-secondary border px-2.5 py-1.5 fs-12">
            {filtered.length} Record{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Table matching Screenshot 2: GRN | AGAINST | FABRIC | WIDTH / COLOUR | QTY | STATUS | ACTION */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead
              className="text-secondary"
              style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
            >
              <tr>
                <th style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                  GRN
                </th>
                <th style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                  AGAINST
                </th>
                <th style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                  FABRIC
                </th>
                <th style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                  WIDTH / COLOUR
                </th>
                <th style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                  QTY
                </th>
                <th style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                  STATUS
                </th>
                <th
                  className="text-center"
                  style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}
                >
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <i className="ti ti-package-off fs-32 d-block mb-2 text-muted opacity-50"></i>
                    Nothing here yet &mdash; submit a GRN first.
                  </td>
                </tr>
              ) : (
                filtered.map((qc) => {
                  const d = getRecordDetails(qc);
                  const isPending = d.status === 'Pending' || !qc.qcStatus;

                  return (
                    <tr
                      key={qc.id}
                      style={{ cursor: 'pointer' }}
                      className="hover-row align-middle"
                      onClick={() => onSelectQC && onSelectQC(qc)}
                    >
                      {/* GRN */}
                      <td className="fw-bold text-dark font-monospace fs-13">
                        {qc.grnRef || d.matchedGrn?.id || 'GRN-1002'}
                      </td>

                      {/* AGAINST */}
                      <td>
                        <span className="text-secondary font-monospace fs-13">
                          {d.againstRef}
                        </span>
                      </td>

                      {/* FABRIC */}
                      <td>
                        <span className="fw-medium text-dark">{d.fabricName}</span>
                      </td>

                      {/* WIDTH / COLOUR */}
                      <td>
                        <span className="text-secondary">
                          {d.width ? `${String(d.width).replace(/"/g, '')}"` : '42"'} &middot; {d.color}
                        </span>
                      </td>

                      {/* QTY */}
                      <td>
                        <span className="fw-medium text-dark">
                          {Number(d.qty).toLocaleString()}m
                        </span>
                      </td>

                      {/* STATUS */}
                      <td>
                        {d.status === 'OK' || d.status === 'Approved' ? (
                          <span className="badge bg-success-subtle text-success border border-success border-opacity-25 px-2.5 py-1 fs-11 rounded-pill">
                            OK
                          </span>
                        ) : d.status === 'Partial OK' ? (
                          <span className="badge bg-success-subtle text-success border border-success border-opacity-25 px-2.5 py-1 fs-11 rounded-pill">
                            Partial OK
                          </span>
                        ) : d.status === 'Send for Admin Approval' || d.status === 'Admin Approval' || qc.adminDecision === 'Pending Admin Review' ? (
                          <span className="badge bg-warning-subtle text-warning border border-warning border-opacity-25 px-2.5 py-1 fs-11 rounded-pill">
                            Admin Approval
                          </span>
                        ) : d.status === 'Reject' || d.status === 'Rejected' ? (
                          <span className="badge bg-danger-subtle text-danger border border-danger border-opacity-25 px-2.5 py-1 fs-11 rounded-pill">
                            Rejected
                          </span>
                        ) : (
                          <span className="badge px-3 py-1 fs-11 rounded-pill" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                            Pending
                          </span>
                        )}
                      </td>

                      {/* ACTION */}
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        {isPending ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary px-3 py-1.5 rounded-2 fs-12 fw-semibold text-white shadow-sm d-inline-flex align-items-center gap-1"
                            style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                            onClick={() => onSelectQC && onSelectQC(qc)}
                          >
                            <span>Run QC</span>
                            <i className="ti ti-chevron-right fs-11"></i>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-white border px-3 py-1.5 rounded-2 fs-12 fw-medium text-secondary shadow-sm"
                            style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#475569' }}
                            onClick={() => onSelectQC && onSelectQC(qc)}
                          >
                            View
                          </button>
                        )}
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
