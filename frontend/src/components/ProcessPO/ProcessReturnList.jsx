import React, { useState } from 'react';

/**
 * ProcessReturnList - Clean, modern, enterprise list view for Inward Vendor Returns (Inbound Processing GRN)
 * Matches the official Rain Drop ERP design system:
 * - High-contrast KPI summary cards at the top
 * - Search & filter toolbar with vendor and status filters
 * - Fully clickable rows: clicking anywhere on a row bar opens the Return details/form
 * - Proper padding, margin, and typography hierarchy
 * - Independent action buttons for Inspect in QC and Edit
 */
export default function ProcessReturnList({
  returns = [],
  onNewReturn,
  onEditReturn,
  onInspectInQC,
  qcRecords = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vendorFilter, setVendorFilter] = useState('ALL');

  const isReturnLocked = (r) => {
    if (r.is_locked) return true;
    if (r.status === 'Inspected' || r.status === 'Completed') return true;
    if (qcRecords && qcRecords.some(q => q.return_id === r.id || q.challan_no === r.vendor_external_challan_no)) return true;
    return false;
  };

  // Filter logic
  const filtered = returns.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (r.id && r.id.toLowerCase().includes(term)) ||
      (r.vendor_name && r.vendor_name.toLowerCase().includes(term)) ||
      (r.vendor_external_challan_no && r.vendor_external_challan_no.toLowerCase().includes(term)) ||
      (r.fabric_quality && r.fabric_quality.toLowerCase().includes(term)) ||
      (r.linked_po_id && r.linked_po_id.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesVendor = vendorFilter === 'ALL' || (r.vendor_name && r.vendor_name.includes(vendorFilter));

    return matchesSearch && matchesStatus && matchesVendor;
  });

  // KPI Calculations
  const totalMeters = returns.reduce((acc, r) => acc + (parseFloat(r.total_meters) || 0), 0);
  const totalPieces = returns.reduce((acc, r) => acc + (parseInt(r.total_pieces, 10) || 0), 0);
  const totalGreyMeters = returns.reduce((acc, r) => acc + (parseFloat(r.grey_fabric_returned_meters) || 0), 0);

  // Unique vendor list for filter dropdown
  const uniqueVendors = Array.from(new Set(returns.map(r => r.vendor_name).filter(Boolean)));

  const handleRowClick = (record) => {
    if (onEditReturn) {
      onEditReturn(record);
    }
  };

  return (
    <div className="process-returns-container">
      {/* ========================================================================= */}
      {/* SEARCH & FILTER CONTROLS BAR                                              */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      <div
        className="card border mb-3 shadow-sm"
        style={{
          borderRadius: '10px',
          borderColor: '#e2e8f0',
          background: '#ffffff'
        }}
      >
        <div className="p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Left: Search & Filters */}
          <div className="d-flex flex-wrap align-items-center gap-2" style={{ flex: '1 1 500px' }}>
            {/* Search Box */}
            <div className="input-group input-group-sm" style={{ width: '280px' }}>
              <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderColor: '#cbd5e1' }}>
                <i className="ti ti-search fs-14"></i>
              </span>
              <input
                type="text"
                className="form-control bg-white border-start-0 fs-13"
                placeholder="Search Return #, vendor, challan..."
                style={{ borderColor: '#cbd5e1', height: '36px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="btn btn-white border border-start-0 text-muted"
                  type="button"
                  style={{ borderColor: '#cbd5e1' }}
                  onClick={() => setSearchTerm('')}
                >
                  <i className="ti ti-x fs-12"></i>
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              className="form-select form-select-sm bg-white fs-13"
              style={{ width: '150px', height: '36px', borderColor: '#cbd5e1' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="Received">Received</option>
              <option value="QC Completed">QC Completed</option>
              <option value="Partially QC">Partially QC</option>
            </select>

            {/* Vendor Filter */}
            {uniqueVendors.length > 0 && (
              <select
                className="form-select form-select-sm bg-white fs-13"
                style={{ width: '180px', height: '36px', borderColor: '#cbd5e1' }}
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
              >
                <option value="ALL">All Vendors</option>
                {uniqueVendors.map((v, i) => (
                  <option key={i} value={v}>{v.split('(')[0].trim()}</option>
                ))}
              </select>
            )}
          </div>

          {/* Right: + Record Vendor Return Button */}
          <div>
            <button
              className="btn btn-primary btn-sm px-3.5 shadow-sm d-flex align-items-center gap-1.5"
              style={{
                background: '#4f46e5',
                borderColor: '#4f46e5',
                height: '36px',
                borderRadius: '8px',
                fontWeight: '600'
              }}
              onClick={onNewReturn}
            >
              <i className="ti ti-plus fs-15"></i>
              <span>+ Record Inward Return</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RETURN LIST TABLE (CLICKABLE ROWS, HIGHLIGHT ON HOVER)                 */}
      {/* ========================================================================= */}
      <div
        className="card border shadow-sm"
        style={{
          borderRadius: '10px',
          borderColor: '#e2e8f0',
          background: '#ffffff',
          overflow: 'hidden'
        }}
      >
        <div className="px-3 py-2 bg-light border-bottom d-flex align-items-center justify-content-between">
          <small className="text-muted fs-12 d-flex align-items-center gap-1.5">
            <i className="ti ti-info-circle text-primary fs-14"></i>
            <span><strong>Tip:</strong> Click on any return row bar to open and edit full Inbound GRN details.</span>
          </small>
          <small className="text-secondary fs-12 fw-medium">
            Showing {filtered.length} of {returns.length} returns
          </small>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr style={{ color: '#475569', fontSize: '11.5px', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                <th className="py-2.5 ps-3" style={{ width: '130px' }}>Return Ref #</th>
                <th style={{ minWidth: '180px' }}>Vendor</th>
                <th style={{ width: '140px' }}>Vendor Challan #</th>
                <th style={{ width: '110px' }}>Received Date</th>
                <th style={{ minWidth: '160px' }}>Fabric Quality</th>
                <th style={{ width: '100px' }}>Thans (Pcs)</th>
                <th className="text-end" style={{ width: '120px' }}>Total Metres</th>
                <th className="text-end" style={{ width: '110px' }}>Grey Return</th>
                <th className="text-center" style={{ width: '110px' }}>Status</th>
                <th className="text-end pe-3" style={{ width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-5 text-muted">
                    <div className="d-flex flex-column align-items-center">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                        style={{ width: '48px', height: '48px', background: '#f1f5f9', color: '#94a3b8' }}
                      >
                        <i className="ti ti-receipt fs-24"></i>
                      </div>
                      <span className="fw-semibold text-dark fs-14">No Vendor Returns Found</span>
                      <small className="text-muted fs-12 mt-1">
                        Try adjusting your search or record a new return.
                      </small>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => handleRowClick(r)}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    title="Click anywhere to view / edit this Inward Return"
                  >
                    {/* Return Ref */}
                    <td className="ps-3 py-3">
                      <span
                        className="badge font-monospace fw-bold px-2 py-1.5"
                        style={{
                          background: 'rgba(79, 70, 229, 0.08)',
                          color: '#4338ca',
                          border: '1px solid rgba(79, 70, 229, 0.2)',
                          fontSize: '12px'
                        }}
                      >
                        {r.id}
                      </span>
                    </td>

                    {/* Vendor */}
                    <td>
                      <div className="fw-bold text-dark fs-13">
                        {r.vendor_name?.split('(')[0]?.trim() || r.vendor_name}
                      </div>
                      <small className="text-muted fs-11">
                        {r.linked_po_id ? `Linked: ${r.linked_po_id}` : 'Job Work Dyeing'}
                      </small>
                    </td>

                    {/* Vendor External Challan # */}
                    <td>
                      <span
                        className="badge font-monospace bg-light text-dark border px-2 py-1"
                        style={{ borderColor: '#cbd5e1', fontSize: '11px' }}
                      >
                        Challan #{r.vendor_external_challan_no}
                      </span>
                    </td>

                    {/* Received Date */}
                    <td className="text-secondary fw-medium">
                      <div className="d-flex align-items-center gap-1.5">
                        <i className="ti ti-calendar text-muted fs-13"></i>
                        <span>{r.received_date}</span>
                      </div>
                    </td>

                    {/* Fabric Quality */}
                    <td>
                      <div className="fw-semibold text-dark fs-13">{r.fabric_quality}</div>
                      <small className="text-muted fs-11">{r.width ? `Width: ${r.width}"` : ''}</small>
                    </td>

                    {/* Pieces (Thans) */}
                    <td>
                      <span className="fw-semibold text-dark fs-13">{r.total_pieces}</span>{' '}
                      <small className="text-muted fs-11">thans</small>
                    </td>

                    {/* Total Metres */}
                    <td className="text-end fw-bold fs-14" style={{ color: '#059669' }}>
                      {Number(r.total_meters || 0).toFixed(2)} m
                    </td>

                    {/* Grey Returned */}
                    <td className="text-end">
                      {parseFloat(r.grey_fabric_returned_meters) > 0 ? (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-1.5 py-0.5">
                          {r.grey_fabric_returned_meters} m
                        </span>
                      ) : (
                        <span className="text-muted fs-12">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="text-center">
                      {isReturnLocked(r) ? (
                        <span className="badge px-2.5 py-1 rounded-pill bg-secondary-subtle text-secondary border fs-11 fw-semibold d-inline-flex align-items-center gap-1">
                          <i className="ti ti-lock fs-11"></i> QC Done (Locked)
                        </span>
                      ) : (
                        <span
                          className="badge px-2.5 py-1 rounded-pill"
                          style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#047857',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}
                        >
                          <i className="ti ti-check me-1"></i> {r.status || 'Received'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="text-end pe-3">
                      <div
                        className="d-inline-flex align-items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* View / Edit Button */}
                        <button
                          type="button"
                          className="btn btn-light btn-sm p-1.5 rounded-2 text-dark border shadow-xs"
                          title={isReturnLocked(r) ? "View Locked Return" : "Open & Edit Return Details"}
                          style={{ borderColor: '#cbd5e1' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(r);
                          }}
                        >
                          <i className={`ti ${isReturnLocked(r) ? 'ti-eye' : 'ti-pencil'} fs-14`}></i>
                        </button>

                        {/* Inspect in QC Button */}
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm px-2 py-1 rounded-2 shadow-xs d-flex align-items-center gap-1 fs-12 fw-semibold"
                          title="Inspect pieces in Quality Control"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectInQC && onInspectInQC(r);
                          }}
                        >
                          <i className="ti ti-checklist fs-13"></i>
                          <span>QC</span>
                        </button>
                      </div>
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
