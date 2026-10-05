import React, { useState, useEffect } from 'react';

/**
 * GlobalERPOverviewDashboard
 * Connects directly to the live state of all modules:
 * - Vendors, Fabrics, Transporters (Masters)
 * - Purchase Orders (Total, Value, Buffer, Statuses)
 * - Goods Receipt Notes (GRN - Bales, Meters, Recheck/Completed)
 * - Quality Check (OK, Pending Admin Approval, Rejected)
 * - Rejected Stock Pool (In Pool, RTV Initiated, To Be Sold / Sold, Transferred)
 * - Real-time Global Activity Audit Trail Feed
 */
export default function GlobalERPOverviewDashboard({
  vendors = [],
  fabrics = [],
  transporters = [],
  purchaseOrders = [],
  grns = [],
  qualityChecks = [],
  rejectedStock = [],
  auditLogs = [],
  onNavigateTab,
  onOpenAuditModal
}) {
  // Real-time calculations
  const totalPOValue = purchaseOrders.reduce((acc, po) => acc + (Number(po.totalAmount) || 0), 0);
  const totalPOMeters = purchaseOrders.reduce((acc, po) => {
    const itemMeters = (po.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    return acc + itemMeters;
  }, 0);

  const totalDeliveredMeters = grns.reduce((acc, g) => acc + (Number(g.totalMetersEntered || g.declaredTotalMeters) || 0), 0);
  const totalBalesReceived = grns.reduce((acc, g) => acc + (Number(g.totalBales) || 0), 0);

  const qcOkCount = qualityChecks.filter((q) => q.qcStatus === 'OK' || q.adminDecision === 'Approve').length;
  const qcPendingAdminCount = qualityChecks.filter((q) => q.qcStatus === 'Send for Admin Approval' && !q.adminDecision).length;
  const qcRejectedCount = qualityChecks.filter((q) => q.qcStatus === 'Reject' || q.adminDecision === 'Reject').length;

  const rejectedInPool = rejectedStock.filter((r) => r.status === 'In Pool');
  const rejectedRTV = rejectedStock.filter((r) => r.status === 'RTV Initiated');
  const rejectedScrap = rejectedStock.filter((r) => r.status === 'Sold' || r.status === 'To Be Sold');
  const rejectedTransferred = rejectedStock.filter((r) => r.status === 'Transferred to Stock');
  const totalRejectedMeters = rejectedStock.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);

  return (
    <div className="container-fluid p-0">
      {/* Top Banner (Preclinic Royal Gradient Theme) */}
      <div
        className="card border-0 rounded-4 shadow-sm mb-4 text-white overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e255e 0%, #2e37a4 60%, #4361ee 100%)',
          position: 'relative',
          boxShadow: '0 8px 24px rgba(46, 55, 164, 0.18)'
        }}
      >
        <div className="card-body p-4 position-relative" style={{ zIndex: 1 }}>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <div 
                className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-2 shadow-sm fs-12 fw-semibold"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <i className="ti ti-activity-heartbeat text-warning"></i> 
                <span>Real-time Live Operations Feed</span>
              </div>
              <h2 className="fw-bold mb-1 fs-24 text-white">Rain Drop ERP — Procurement &amp; Inventory Dashboard</h2>
              <p className="text-white text-opacity-75 mb-0 fs-13">
                Module 1 (Raw Material Procurement) Live Operational Metrics, Master Catalogs &amp; Audit Trail.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-bold shadow-sm fs-13"
                style={{ background: '#ffffff', color: '#2e37a4' }}
                onClick={() => onNavigateTab('pos')}
              >
                <i className="ti ti-plus fs-15"></i>
                <span>Create New PO</span>
              </button>
              <button
                type="button"
                className="btn btn-outline-light d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-medium fs-13"
                onClick={onOpenAuditModal}
              >
                <i className="ti ti-history fs-15"></i>
                <span>Activity Audit Trail ({auditLogs.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Summary KPI Cards */}
      <div className="row g-3 mb-4">
        {/* KPI 1: Purchase Orders */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white hover-shadow transition-all cursor-pointer"
            onClick={() => onNavigateTab('pos')}
            style={{ cursor: 'pointer' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-secondary fs-13 fw-semibold text-uppercase tracking-wider">Purchase Orders</span>
              <div
                className="rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                style={{ width: '42px', height: '42px' }}
              >
                <i className="ti ti-shopping-cart fs-20"></i>
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-1 fs-22">
              ₹{totalPOValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </h3>
            <div className="d-flex align-items-center justify-content-between text-muted fs-12 mt-2 pt-2 border-top">
              <span>{purchaseOrders.length} Total POs</span>
              <span className="text-primary fw-medium">{totalPOMeters.toLocaleString()} Mtrs</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Goods Receipt (GRN) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white hover-shadow transition-all cursor-pointer"
            onClick={() => onNavigateTab('grn')}
            style={{ cursor: 'pointer' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-secondary fs-13 fw-semibold text-uppercase tracking-wider">Inward Deliveries (GRN)</span>
              <div
                className="rounded-3 bg-success-subtle text-success d-flex align-items-center justify-content-center"
                style={{ width: '42px', height: '42px' }}
              >
                <i className="ti ti-package fs-20"></i>
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-1 fs-22">
              {totalDeliveredMeters.toLocaleString('en-IN', { maximumFractionDigits: 2 })} <span className="fs-14 text-muted fw-normal">Mtrs</span>
            </h3>
            <div className="d-flex align-items-center justify-content-between text-muted fs-12 mt-2 pt-2 border-top">
              <span>{grns.length} Active GRNs</span>
              <span className="text-success fw-medium">{totalBalesReceived} Bales Inward</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Quality Check (QC) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white hover-shadow transition-all cursor-pointer"
            onClick={() => onNavigateTab('qc')}
            style={{ cursor: 'pointer' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-secondary fs-13 fw-semibold text-uppercase tracking-wider">Quality Checks (QC)</span>
              <div
                className="rounded-3 bg-info-subtle text-info d-flex align-items-center justify-content-center"
                style={{ width: '42px', height: '42px' }}
              >
                <i className="ti ti-shield-check fs-20"></i>
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-1 fs-22">
              {qcOkCount} <span className="fs-14 text-success fw-normal">Approved</span>
            </h3>
            <div className="d-flex align-items-center justify-content-between text-muted fs-12 mt-2 pt-2 border-top">
              <span className="text-warning fw-semibold">{qcPendingAdminCount} Pending Approval</span>
              <span className="text-danger fw-semibold">{qcRejectedCount} Rejected</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Rejected Stock Pool */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white hover-shadow transition-all cursor-pointer"
            onClick={() => onNavigateTab('rejected_stock')}
            style={{ cursor: 'pointer' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-secondary fs-13 fw-semibold text-uppercase tracking-wider">Rejected Stock Pool</span>
              <div
                className="rounded-3 bg-danger-subtle text-danger d-flex align-items-center justify-content-center"
                style={{ width: '42px', height: '42px' }}
              >
                <i className="ti ti-alert-triangle fs-20"></i>
              </div>
            </div>
            <h3 className="fw-bold text-danger mb-1 fs-22">
              {rejectedInPool.length} <span className="fs-14 text-muted fw-normal">In Pool</span>
            </h3>
            <div className="d-flex align-items-center justify-content-between text-muted fs-12 mt-2 pt-2 border-top">
              <span>Total Defective: {totalRejectedMeters}m</span>
              <span className="text-dark fw-medium">{rejectedRTV.length} RTV / {rejectedScrap.length} Scrap</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Master Data Metrics + Quick Action Status + Live Activity Logs */}
      <div className="row g-4 mb-4">
        {/* Left Column: Module 1 Master & Status Breakdown */}
        <div className="col-12 col-lg-8">
          {/* Section 1: Master Catalogs Overview */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <i className="ti ti-database fs-18 text-primary"></i>
                <h5 className="fw-bold text-dark mb-0 fs-16">Active Master Records</h5>
              </div>
              <span className="badge bg-light text-secondary border px-2 py-1 fs-11">Module 1 Masters</span>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div
                  className="p-3 rounded-3 border bg-light bg-opacity-50 hover-bg-light transition-all cursor-pointer"
                  onClick={() => onNavigateTab('vendors')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-12 fw-medium">Vendors Master</span>
                    <span className="badge bg-primary text-white rounded-pill">{vendors.length}</span>
                  </div>
                  <div className="fw-bold text-dark fs-14">
                    {vendors.filter((v) => v.active).length} Active Suppliers
                  </div>
                  <div className="text-secondary fs-11 mt-1">GSTIN verified &amp; Star ratings</div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div
                  className="p-3 rounded-3 border bg-light bg-opacity-50 hover-bg-light transition-all cursor-pointer"
                  onClick={() => onNavigateTab('fabrics')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-12 fw-medium">Fabric Master</span>
                    <span className="badge bg-primary text-white rounded-pill">{fabrics.length}</span>
                  </div>
                  <div className="fw-bold text-dark fs-14">
                    {fabrics.length} Fabric Qualities
                  </div>
                  <div className="text-secondary fs-11 mt-1">Width tags &amp; Shrinkage %</div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div
                  className="p-3 rounded-3 border bg-light bg-opacity-50 hover-bg-light transition-all cursor-pointer"
                  onClick={() => onNavigateTab('transporters')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-12 fw-medium">Transporter Master</span>
                    <span className="badge bg-primary text-white rounded-pill">{transporters.length}</span>
                  </div>
                  <div className="fw-bold text-dark fs-14">
                    {transporters.length} Logistics Carriers
                  </div>
                  <div className="text-secondary fs-11 mt-1">Referenced on GRN Inward</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Recent Purchase Orders & GRNs status */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <i className="ti ti-file-text fs-18 text-primary"></i>
                <h5 className="fw-bold text-dark mb-0 fs-16">Recent Purchase Orders &amp; Inward Progress</h5>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-primary text-decoration-none p-0 fs-12 fw-semibold"
                onClick={() => onNavigateTab('pos')}
              >
                View All POs &rarr;
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light text-secondary">
                  <tr>
                    <th>PO No</th>
                    <th>Vendor</th>
                    <th>Date</th>
                    <th>Total Mtrs</th>
                    <th>Total Value</th>
                    <th>Buffer %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.slice(0, 5).map((po) => {
                    const totalQty = (po.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
                    return (
                      <tr key={po.id}>
                        <td className="fw-bold text-primary font-monospace">{po.id}</td>
                        <td className="fw-medium text-dark">{po.vendorName}</td>
                        <td className="text-muted">{po.date}</td>
                        <td>{totalQty.toLocaleString()} m</td>
                        <td className="fw-semibold text-dark">₹{Number(po.totalAmount || 0).toLocaleString('en-IN')}</td>
                        <td>
                          {po.bufferAllowed ? (
                            <span className="badge bg-info-subtle text-info border border-info border-opacity-25">
                              ±{po.bufferPercent}%
                            </span>
                          ) : (
                            <span className="text-muted fs-11">None</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge px-2 py-1 rounded-pill ${
                              po.status === 'Completed'
                                ? 'bg-success-subtle text-success'
                                : po.status === 'Partially Received'
                                ? 'bg-warning-subtle text-warning'
                                : po.status === 'Sent'
                                ? 'bg-primary-subtle text-primary'
                                : 'bg-secondary-subtle text-secondary'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Live Global Activity History (Section 9.4) & Quick Access */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <i className="ti ti-history fs-18 text-primary"></i>
                <h5 className="fw-bold text-dark mb-0 fs-16">Global Activity Log</h5>
              </div>
              <span className="badge bg-primary-subtle text-primary fs-11">Real-time</span>
            </div>

            <div className="flex-grow-1 overflow-auto custom-scrollbar pe-1" style={{ maxHeight: '420px' }}>
              {auditLogs.length === 0 ? (
                <div className="text-center py-4 text-muted fs-13">No activity recorded yet.</div>
              ) : (
                <div className="timeline-container position-relative ps-3">
                  {auditLogs.slice(0, 10).map((log, idx) => (
                    <div key={log.id || idx} className="mb-3 position-relative">
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <div>
                          <span
                            className={`badge me-1 fs-10 ${
                              log.action === 'Create'
                                ? 'bg-success text-white'
                                : log.action === 'Update'
                                ? 'bg-info text-dark'
                                : log.action === 'Reject'
                                ? 'bg-danger text-white'
                                : 'bg-primary text-white'
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="fw-semibold text-dark fs-12">{log.module}</span>
                          <span className="text-muted fs-11 ms-1">({log.recordNo})</span>
                        </div>
                        <span className="text-muted fs-10 text-nowrap">{log.dateTime?.split(',')[0]}</span>
                      </div>
                      <div className="text-secondary fs-12 mt-1">
                        <span className="fw-medium text-dark">{log.field}:</span>{' '}
                        {log.updatedValue || log.remarks}
                      </div>
                      <div className="text-muted fs-11 mt-0">
                        by <span className="text-dark fw-medium">{log.user}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn btn-outline-primary btn-sm w-100 rounded-3 mt-3 py-2 fw-medium fs-12"
              onClick={onOpenAuditModal}
            >
              <i className="ti ti-list-details me-1"></i> Open Full Audit Log Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
