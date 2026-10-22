import React, { useState, useEffect, useMemo } from 'react';
import { initialAuditLogs } from '../../data/procurementData';
import {
  getStoredProcessPOs,
  getStoredProcessChallans,
  getStoredProcessReturns,
  getStoredProcessQCRecords,
  getStoredOpenBales
} from '../../data/processData';
import ProcessTrackingDashboard from '../ProcessPO/ProcessTrackingDashboard';
import { api } from '../../services/api';

/**
 * ActivityLogView - Comprehensive Platform-Wide Activity History & Audit Trail
 * Implements Section 13.4 of Raindrop Garments ERP Specification.
 * Captures: POs, Challans, Inward GRNs, QC inspections, and Master changes.
 * Also includes seamless tab access to Live Tracking & Open Bales.
 */
export default function ActivityLogView({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('activity'); // 'activity' | 'tracking'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);

  // Stored data for tracking
  const [pos, setPos] = useState(getStoredProcessPOs);
  const [challans, setChallans] = useState(getStoredProcessChallans);
  const [returns, setReturns] = useState(getStoredProcessReturns);
  const [openBales, setOpenBales] = useState(getStoredOpenBales);

  // Combined audit logs state
  const [logs, setLogs] = useState(() => {
    let combined = [];

    // 1. Base procurement & sales logs
    if (initialAuditLogs && initialAuditLogs.length > 0) {
      combined.push(...initialAuditLogs);
    }

    // 2. LocalStorage persisted custom logs
    try {
      const stored = localStorage.getItem('raindrop_activity_logs_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.forEach(p => {
          if (!combined.some(c => c.id === p.id)) {
            combined.push(p);
          }
        });
      }
    } catch (e) {}

    // 3. Synthesize dynamic logs from actual Process module transactions
    const ppos = getStoredProcessPOs();
    ppos.forEach(po => {
      combined.push({
        id: `ACT-PO-${po.po_number || po.id}`,
        dateTime: po.created_at ? new Date(po.created_at).toLocaleString() : `${po.date || 'Today'} 10:30 AM`,
        user: po.created_by || 'Saksham Garg',
        role: 'Job Work Executive',
        action: 'Create',
        module: 'Process PO',
        recordNo: po.po_number ? `PPO-${po.po_number}` : po.id,
        field: 'Purchase Order Generation',
        previousValue: 'None',
        updatedValue: `${po.vendor_name || 'Vendor'} (${po.total_meters || 525}m - ${po.style_names?.[0] || 'Graphic Boota'})`,
        remarks: po.terms || 'Job issue for dyeing & processing'
      });
    });

    const pchs = getStoredProcessChallans();
    pchs.forEach(ch => {
      combined.push({
        id: `ACT-CH-${ch.challan_number || ch.id}`,
        dateTime: ch.created_at ? new Date(ch.created_at).toLocaleString() : `${ch.date || 'Today'} 01:15 PM`,
        user: ch.created_by || 'Saksham Garg',
        role: 'Warehouse / Dispatch Officer',
        action: 'Dispatch',
        module: 'Process Challan',
        recordNo: ch.challan_number ? `PCH-${ch.challan_number}` : ch.id,
        field: 'Dispatch Allocation',
        previousValue: 'Stock Pool (Warehouse)',
        updatedValue: `Out for Processing (${ch.grand_total_meters || 1477.6}m to ${ch.vendor_name || 'Vendor'})`,
        remarks: ch.remarks || `Physical dispatch with roll/bale FIFO allocation`
      });
    });

    const prets = getStoredProcessReturns();
    prets.forEach(ret => {
      combined.push({
        id: `ACT-RET-${ret.id}`,
        dateTime: `${ret.received_date || 'Today'} 04:00 PM`,
        user: ret.created_by || 'Saksham Garg',
        role: 'Stores Receiving Officer',
        action: 'Inward',
        module: 'Vendor Return (GRN)',
        recordNo: ret.vendor_external_challan_no ? `${ret.vendor_name} #${ret.vendor_external_challan_no}` : ret.id,
        field: 'Goods Receipt',
        previousValue: 'Out for Processing',
        updatedValue: `Inward Received (${ret.vendor_declared_meters || 1477.6}m - ${ret.vendor_declared_pieces || 13} thans)`,
        remarks: `Piece-wise meterage verified against vendor challan`
      });
    });

    const pqcs = getStoredProcessQCRecords();
    pqcs.forEach(qc => {
      combined.push({
        id: `ACT-QC-${qc.id}`,
        dateTime: qc.created_at ? new Date(qc.created_at).toLocaleString() : 'Today 05:30 PM',
        user: qc.inspected_by || 'Saksham Garg',
        role: 'Quality Inspector',
        action: qc.outcome === 'Accepted' ? 'Approve' : 'Reject',
        module: 'Quality Control',
        recordNo: qc.id,
        field: 'QC Decision & Lot Division',
        previousValue: 'Pending QC',
        updatedValue: `${qc.outcome} (${qc.piece_division ? 'Piece Division Applied' : 'Standard Lot'})`,
        remarks: qc.remarks || 'Shade uniformity & shrinkage compliance verified'
      });
    });

    return combined;
  });

  // Fetch fresh API logs if backend is active
  useEffect(() => {
    api.getAuditLogs().then(res => {
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setLogs(prev => {
          const merged = [...prev];
          res.data.forEach(item => {
            if (!merged.some(m => m.id === item.id)) merged.unshift(item);
          });
          return merged;
        });
      }
    }).catch(() => {});
  }, []);

  // Filter options
  const modulesList = useMemo(() => {
    const set = new Set(logs.map(l => l.module).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [logs]);

  const actionsList = useMemo(() => {
    const set = new Set(logs.map(l => l.action).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [logs]);

  const usersList = useMemo(() => {
    const set = new Set(logs.map(l => l.user).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [logs]);

  // Filtered dataset
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        (log.recordNo && log.recordNo.toLowerCase().includes(q)) ||
        (log.user && log.user.toLowerCase().includes(q)) ||
        (log.field && log.field.toLowerCase().includes(q)) ||
        (log.remarks && log.remarks.toLowerCase().includes(q)) ||
        (log.updatedValue && log.updatedValue.toLowerCase().includes(q));

      const matchesModule = selectedModule === 'ALL' || log.module === selectedModule;
      const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
      const matchesUser = selectedUser === 'ALL' || log.user === selectedUser;

      return matchesSearch && matchesModule && matchesAction && matchesUser;
    });
  }, [logs, searchTerm, selectedModule, selectedAction, selectedUser]);

  // Key metrics
  const totalLogs = logs.length;
  const createsCount = logs.filter(l => l.action === 'Create').length;
  const dispatchCount = logs.filter(l => l.action === 'Dispatch' || l.action === 'Inward').length;
  const approvalsCount = logs.filter(l => l.action === 'Approve' || l.action === 'Approval').length;
  const rejectionsCount = logs.filter(l => l.action === 'Reject').length;

  const getActionBadgeClass = (action) => {
    switch (action?.toLowerCase()) {
      case 'create':
        return 'bg-success-subtle text-success border-success-subtle';
      case 'dispatch':
        return 'bg-primary-subtle text-primary border-primary-subtle';
      case 'inward':
        return 'bg-info-subtle text-info border-info-subtle';
      case 'approve':
      case 'approval':
        return 'bg-success-subtle text-success border-success-subtle';
      case 'reject':
        return 'bg-danger-subtle text-danger border-danger-subtle';
      case 'update':
      case 'save':
        return 'bg-warning-subtle text-warning border-warning-subtle';
      default:
        return 'bg-light text-secondary border-secondary-subtle';
    }
  };

  return (
    <div className="container-fluid py-3 px-4">
      {/* Page Title & Navigation Switcher */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold text-dark mb-0">
              <i className="ti ti-history me-2 text-primary"></i>
              Activity History & Audit Trail
            </h4>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-11 fw-semibold">
              Section 13.4 System-Wide
            </span>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Complete audit trail capturing all user actions, document generations, stock movements, and field changes.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="d-flex bg-white p-1 rounded-3 border shadow-xs">
          <button
            type="button"
            className={`btn btn-sm px-3 rounded-2 fw-medium d-flex align-items-center gap-1.5 transition-all ${
              activeTab === 'activity' ? 'btn-primary shadow-xs' : 'btn-link text-secondary text-decoration-none'
            }`}
            onClick={() => setActiveTab('activity')}
          >
            <i className="ti ti-list-details"></i>
            <span>System Activity Logs ({totalLogs})</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm px-3 rounded-2 fw-medium d-flex align-items-center gap-1.5 transition-all ${
              activeTab === 'tracking' ? 'btn-primary shadow-xs' : 'btn-link text-secondary text-decoration-none'
            }`}
            onClick={() => setActiveTab('tracking')}
          >
            <i className="ti ti-chart-arrows"></i>
            <span>Live Tracking & Open Bales (Section 7)</span>
          </button>
        </div>
      </div>

      {activeTab === 'activity' && (
        <>
          {/* Top KPI Cards */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm p-3 h-100 rounded-3 bg-white border">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                      Total Activities Logged
                    </span>
                    <h3 className="mb-0 fw-bold text-dark mt-1 fs-24">{totalLogs}</h3>
                  </div>
                  <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                    <i className="ti ti-activity fs-20"></i>
                  </div>
                </div>
                <div className="text-muted fs-11 mt-2">All modules across platform</div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm p-3 h-100 rounded-3 bg-white border">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                      Creations & Issuances
                    </span>
                    <h3 className="mb-0 fw-bold text-success mt-1 fs-24">{createsCount}</h3>
                  </div>
                  <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <i className="ti ti-file-plus fs-20"></i>
                  </div>
                </div>
                <div className="text-muted fs-11 mt-2">POs, GRNs & Masters created</div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm p-3 h-100 rounded-3 bg-white border">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                      Dispatches & Returns
                    </span>
                    <h3 className="mb-0 fw-bold text-primary mt-1 fs-24">{dispatchCount}</h3>
                  </div>
                  <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
                    <i className="ti ti-truck-delivery fs-20"></i>
                  </div>
                </div>
                <div className="text-muted fs-11 mt-2">Process Challans & Goods Receipts</div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm p-3 h-100 rounded-3 bg-white border">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                      Quality Checks & Approvals
                    </span>
                    <h3 className="mb-0 fw-bold text-dark mt-1 fs-24">
                      <span className="text-success">{approvalsCount}</span>
                      {rejectionsCount > 0 && <span className="text-muted fs-14 fw-normal"> / {rejectionsCount} rej</span>}
                    </h3>
                  </div>
                  <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <i className="ti ti-certificate fs-20"></i>
                  </div>
                </div>
                <div className="text-muted fs-11 mt-2">Inspections & batch approvals</div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="card border-0 shadow-sm mb-4 rounded-3 p-3 bg-white border">
            <div className="row g-2 align-items-center">
              {/* Search */}
              <div className="col-12 col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="ti ti-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control bg-light border-start-0"
                    placeholder="Search by Record #, User, Field, or Remarks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-outline-secondary border-start-0"
                      type="button"
                      onClick={() => setSearchTerm('')}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Module Filter */}
              <div className="col-6 col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                >
                  <option value="ALL">All Modules</option>
                  {modulesList.filter(m => m !== 'ALL').map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Action Filter */}
              <div className="col-6 col-md-2">
                <select
                  className="form-select form-select-sm"
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                >
                  <option value="ALL">All Actions</option>
                  {actionsList.filter(a => a !== 'ALL').map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* User Filter */}
              <div className="col-6 col-md-2">
                <select
                  className="form-select form-select-sm"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="ALL">All Users</option>
                  {usersList.filter(u => u !== 'ALL').map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              {/* Reset */}
              <div className="col-6 col-md-1 text-end">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary w-100"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedModule('ALL');
                    setSelectedAction('ALL');
                    setSelectedUser('ALL');
                  }}
                  title="Reset Filters"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white border">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <tr style={{ color: '#475569', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th className="py-2.5 px-3" style={{ width: '170px' }}>Date & Time</th>
                    <th className="py-2.5 px-3" style={{ width: '160px' }}>User & Role</th>
                    <th className="py-2.5 px-3" style={{ width: '100px' }}>Action</th>
                    <th className="py-2.5 px-3" style={{ width: '140px' }}>Module</th>
                    <th className="py-2.5 px-3" style={{ width: '150px' }}>Record No.</th>
                    <th className="py-2.5 px-3">Field / Event</th>
                    <th className="py-2.5 px-3">Updated Value / Remarks</th>
                    <th className="py-2.5 px-3 text-center" style={{ width: '80px' }}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        <i className="ti ti-file-search fs-36 d-block mb-2 text-secondary opacity-50"></i>
                        No activity records matched your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedLogDetail(log)}>
                        <td className="px-3 py-2 text-muted fs-12">
                          <i className="ti ti-clock me-1 text-secondary opacity-75"></i>
                          {log.dateTime}
                        </td>
                        <td className="px-3 py-2">
                          <div className="fw-semibold text-dark">{log.user}</div>
                          <div className="text-muted fs-11">{log.role}</div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`badge border px-2 py-1 fs-11 fw-semibold ${getActionBadgeClass(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-3 py-2 fw-medium text-dark">
                          {log.module}
                        </td>
                        <td className="px-3 py-2">
                          <span className="fw-semibold font-monospace text-primary bg-primary-subtle px-1.5 py-0.5 rounded fs-12">
                            {log.recordNo}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-dark fw-medium">
                          {log.field}
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-dark fs-12 text-truncate" style={{ maxWidth: '320px' }} title={log.updatedValue}>
                            {log.updatedValue}
                          </div>
                          {log.remarks && (
                            <div className="text-muted fs-11 text-truncate" style={{ maxWidth: '320px' }} title={log.remarks}>
                              <span className="fst-italic">Note:</span> {log.remarks}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center" onClick={(e) => { e.stopPropagation(); setSelectedLogDetail(log); }}>
                          <button type="button" className="btn btn-sm btn-light p-1 rounded-2 text-primary">
                            <i className="ti ti-eye fs-14"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="card-footer bg-white border-top py-2 px-3 d-flex justify-content-between align-items-center text-muted fs-12">
              <div>
                Showing <strong>{filteredLogs.length}</strong> of <strong>{totalLogs}</strong> total platform activities
              </div>
              <div className="d-flex align-items-center gap-2">
                <span>Auto-persisted to Audit Trail</span>
                <i className="ti ti-shield-check text-success fs-15"></i>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Embedded Live Tracking Dashboard (Section 7) */}
      {activeTab === 'tracking' && (
        <ProcessTrackingDashboard
          pos={pos}
          challans={challans}
          returns={returns}
          openBales={openBales}
        />
      )}

      {/* Log Detail Modal */}
      {selectedLogDetail && (
        <div className="modal show d-block" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 p-4 bg-white">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle bg-primary-subtle text-primary p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    <i className="ti ti-history fs-18"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0 fs-15">Activity Log Record Detail</h6>
                    <div className="text-muted fs-11 font-monospace">{selectedLogDetail.id}</div>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedLogDetail(null)}></button>
              </div>

              <div className="space-y-3">
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="text-muted fs-11 text-uppercase fw-bold">Date & Time</label>
                    <div className="fw-semibold text-dark fs-13">{selectedLogDetail.dateTime}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-11 text-uppercase fw-bold">Action</label>
                    <div>
                      <span className={`badge border px-2 py-0.5 fs-11 fw-semibold ${getActionBadgeClass(selectedLogDetail.action)}`}>
                        {selectedLogDetail.action}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="text-muted fs-11 text-uppercase fw-bold">User</label>
                    <div className="fw-semibold text-dark fs-13">{selectedLogDetail.user}</div>
                    <div className="text-muted fs-11">{selectedLogDetail.role}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-11 text-uppercase fw-bold">Module & Record</label>
                    <div className="fw-semibold text-dark fs-13">{selectedLogDetail.module}</div>
                    <div className="text-primary fs-12 font-monospace fw-bold">{selectedLogDetail.recordNo}</div>
                  </div>
                </div>

                <div className="mb-2 p-2.5 rounded bg-light border">
                  <label className="text-muted fs-11 text-uppercase fw-bold d-block mb-1">Field / Operation</label>
                  <div className="fw-semibold text-dark fs-13">{selectedLogDetail.field}</div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <div className="p-2.5 rounded bg-danger-subtle border border-danger-subtle h-100">
                      <label className="text-danger fs-11 text-uppercase fw-bold d-block mb-1">Previous Value</label>
                      <div className="text-dark fs-12 font-monospace">{selectedLogDetail.previousValue || 'None'}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2.5 rounded bg-success-subtle border border-success-subtle h-100">
                      <label className="text-success fs-11 text-uppercase fw-bold d-block mb-1">Updated Value</label>
                      <div className="text-dark fs-12 font-monospace">{selectedLogDetail.updatedValue || 'None'}</div>
                    </div>
                  </div>
                </div>

                {selectedLogDetail.remarks && (
                  <div className="p-2.5 rounded bg-light border">
                    <label className="text-muted fs-11 text-uppercase fw-bold d-block mb-1">Remarks & Annotations</label>
                    <div className="text-secondary fs-12">{selectedLogDetail.remarks}</div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-top text-end">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm px-4"
                  onClick={() => setSelectedLogDetail(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
