import React, { useState } from 'react';

/**
 * ProcessChallanList - Clean, modern, highly intuitive list view for Process Challans
 * Matches the official Rain Drop ERP aesthetic:
 * - High-contrast KPI metric summary cards at the top
 * - Clean search & status filter toolbar
 * - Modern primary theme "+ New Challan" button
 * - Fully clickable rows (clicking anywhere on the row bar opens the Challan for editing/viewing)
 * - Independent action buttons for Print Slip and Inward Return
 */
export default function ProcessChallanList({
  challans = [],
  onNewChallan,
  onEditChallan,
  onPrintChallan,
  onRecordReturnFromChallan
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vendorFilter, setVendorFilter] = useState('ALL');

  // Filter logic
  const filtered = challans.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (c.challan_number && c.challan_number.toLowerCase().includes(term)) ||
      (c.vendor_name && c.vendor_name.toLowerCase().includes(term)) ||
      (c.company_representative && c.company_representative.toLowerCase().includes(term)) ||
      (Array.isArray(c.linked_pos) && c.linked_pos.some(p => p.toLowerCase().includes(term)));

    const isEmergency = c.po_link_status === 'Pending PO Link';
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'LINKED' && !isEmergency) ||
      (statusFilter === 'EMERGENCY' && isEmergency);

    const matchesVendor = vendorFilter === 'ALL' || (c.vendor_name && c.vendor_name.includes(vendorFilter));

    return matchesSearch && matchesStatus && matchesVendor;
  });

  // KPI Calculations
  const totalMeters = challans.reduce((acc, c) => acc + (parseFloat(c.grand_total_meters) || 0), 0);
  const totalBales = challans.reduce((acc, c) => acc + (parseInt(c.total_bales, 10) || 1), 0);
  const linkedCount = challans.filter(c => c.po_link_status !== 'Pending PO Link').length;

  // Unique vendor list for filter dropdown
  const uniqueVendors = Array.from(new Set(challans.map(c => c.vendor_name).filter(Boolean)));

  const handleRowClick = (challan) => {
    if (onEditChallan) {
      onEditChallan(challan);
    }
  };

  return (
    <div className="process-challan-container">
      {/* ========================================================================= */}
      {/* 1. TOP KPI SUMMARY CARDS (HIGH-CONTRAST ERP DESIGN)                       */}
      {/* ========================================================================= */}
      <div className="row g-3 mb-4">
        {/* Card 1: Total Challans */}
        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card border-0 shadow-sm p-3 h-100"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px'
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                  Total Challans
                </span>
                <h3 className="mb-0 fw-bold text-dark mt-1 fs-24">{challans.length}</h3>
              </div>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
                style={{
                  width: '42px',
                  height: '42px',
                  background: 'rgba(79, 70, 229, 0.1)',
                  color: '#4f46e5'
                }}
              >
                <i className="ti ti-truck-delivery fs-22"></i>
              </div>
            </div>
            <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
              <i className="ti ti-circle-check text-success fs-13"></i>
              <span>Fabric dispatch records</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Dispatched Metres */}
        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card border-0 shadow-sm p-3 h-100"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px'
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                  Dispatched Fabric
                </span>
                <h3 className="mb-0 fw-bold text-dark mt-1 fs-24">
                  {Number(totalMeters).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
                  <span className="fs-14 fw-medium text-muted">m</span>
                </h3>
              </div>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
                style={{
                  width: '42px',
                  height: '42px',
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: '#0284c7'
                }}
              >
                <i className="ti ti-ruler-2 fs-22"></i>
              </div>
            </div>
            <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
              <i className="ti ti-layers-linked text-info fs-13"></i>
              <span>Out for dyeing / processing</span>
            </div>
          </div>
        </div>

        {/* Card 3: Stock Bales / Rolls */}
        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card border-0 shadow-sm p-3 h-100"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px'
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                  Total Dispatched Bales
                </span>
                <h3 className="mb-0 fw-bold text-dark mt-1 fs-24">{totalBales}</h3>
              </div>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
                style={{
                  width: '42px',
                  height: '42px',
                  background: 'rgba(217, 119, 6, 0.1)',
                  color: '#d97706'
                }}
              >
                <i className="ti ti-package fs-22"></i>
              </div>
            </div>
            <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
              <i className="ti ti-box text-warning fs-13"></i>
              <span>Allocated from Warehouse</span>
            </div>
          </div>
        </div>

        {/* Card 4: PO Link Status */}
        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card border-0 shadow-sm p-3 h-100"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px'
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                  PO Link Compliance
                </span>
                <h3 className="mb-0 fw-bold text-dark mt-1 fs-24">
                  {challans.length > 0 ? Math.round((linkedCount / challans.length) * 100) : 100}%
                </h3>
              </div>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
                style={{
                  width: '42px',
                  height: '42px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669'
                }}
              >
                <i className="ti ti-link fs-22"></i>
              </div>
            </div>
            <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
              <span className="badge bg-success-subtle text-success fs-10 px-1.5 py-0.5 rounded">
                {linkedCount} Linked
              </span>
              {challans.length - linkedCount > 0 && (
                <span className="badge bg-danger-subtle text-danger fs-10 px-1.5 py-0.5 rounded">
                  {challans.length - linkedCount} Emergency
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH & FILTER CONTROLS BAR                                           */}
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
                placeholder="Search Challan #, vendor, PO..."
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

            {/* PO Link Status Filter */}
            <select
              className="form-select form-select-sm bg-white fs-13"
              style={{ width: '160px', height: '36px', borderColor: '#cbd5e1' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Link Status</option>
              <option value="LINKED">Linked to PO</option>
              <option value="EMERGENCY">Emergency (No PO)</option>
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

          {/* Right: + New Challan Button (Primary theme styling, replaces ugly red) */}
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
              onClick={onNewChallan}
            >
              <i className="ti ti-truck-delivery fs-15"></i>
              <span>+ New Challan</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CHALLAN LIST TABLE (CLICKABLE ROWS, HIGHLIGHT ON HOVER)                 */}
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
            <span><strong>Tip:</strong> Click on any row bar to view and edit full Challan dispatch details.</span>
          </small>
          <small className="text-secondary fs-12 fw-medium">
            Showing {filtered.length} of {challans.length} challans
          </small>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr style={{ color: '#475569', fontSize: '11.5px', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                <th className="py-2.5 ps-3" style={{ width: '120px' }}>Challan No</th>
                <th style={{ width: '110px' }}>Dispatch Date</th>
                <th style={{ minWidth: '180px' }}>Vendor</th>
                <th style={{ minWidth: '130px' }}>Linked POs</th>
                <th style={{ minWidth: '130px' }}>Stock Rolls/Bales</th>
                <th style={{ width: '80px' }}>Folding</th>
                <th className="text-end" style={{ width: '130px' }}>Dispatched Mtrs</th>
                <th className="text-center" style={{ width: '120px' }}>Link Status</th>
                <th style={{ width: '130px' }}>Authorised By</th>
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
                        <i className="ti ti-truck fs-24"></i>
                      </div>
                      <span className="fw-semibold text-dark fs-14">No Challans Found</span>
                      <small className="text-muted fs-12 mt-1">
                        Try adjusting your search or create a new Challan.
                      </small>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isEmergency = c.po_link_status === 'Pending PO Link';

                  return (
                    <tr
                      key={c.id || c.challan_number}
                      onClick={() => handleRowClick(c)}
                      style={{
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      title="Click anywhere to view / edit this Challan"
                    >
                      {/* Challan No */}
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
                          #{c.challan_number || c.id}
                        </span>
                      </td>

                      {/* Dispatch Date */}
                      <td className="text-secondary fw-medium">
                        <div className="d-flex align-items-center gap-1.5">
                          <i className="ti ti-calendar text-muted fs-13"></i>
                          <span>{c.date}</span>
                        </div>
                      </td>

                      {/* Vendor */}
                      <td>
                        <div className="fw-bold text-dark fs-13">
                          {c.vendor_name?.split('(')[0]?.trim() || c.vendor_name}
                        </div>
                        <small className="text-muted fs-11 d-block text-truncate" style={{ maxWidth: '220px' }}>
                          {c.remarks || 'Job Issue for Dyeing'}
                        </small>
                      </td>

                      {/* Linked POs */}
                      <td>
                        {Array.isArray(c.linked_pos) && c.linked_pos.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {c.linked_pos.map((p, i) => (
                              <span
                                key={i}
                                className="badge px-1.5 py-1"
                                style={{
                                  background: 'rgba(2, 132, 199, 0.1)',
                                  color: '#0369a1',
                                  border: '1px solid rgba(2, 132, 199, 0.2)',
                                  fontSize: '11px',
                                  fontWeight: '600'
                                }}
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span
                            className="badge px-2 py-1"
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#dc2626',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              fontSize: '11px'
                            }}
                          >
                            Emergency (No PO)
                          </span>
                        )}
                      </td>

                      {/* Stock Rolls / Bales */}
                      <td>
                        <div className="fw-semibold text-dark fs-13">
                          {c.total_bales || 1} Bale{' '}
                          <span className="text-muted fw-normal fs-11">
                            ({c.total_pieces || c.items?.length || 7} Pcs)
                          </span>
                        </div>
                        <small className="text-muted fs-11">
                          {c.items?.[0]?.bale_roll_no ? `Roll: ${c.items[0].bale_roll_no}` : 'Roll 12304'}
                        </small>
                      </td>

                      {/* Folding */}
                      <td>
                        <span
                          className="badge bg-light text-dark border px-2 py-1 font-monospace"
                          style={{ borderColor: '#cbd5e1', fontSize: '11px' }}
                        >
                          {c.folding_notation || 'L100'}
                        </span>
                      </td>

                      {/* Dispatched Mtrs */}
                      <td className="text-end fw-bold fs-14" style={{ color: '#4f46e5' }}>
                        {Number(c.grand_total_meters || 0).toFixed(2)} m
                      </td>

                      {/* PO Link Status */}
                      <td className="text-center">
                        {isEmergency ? (
                          <span
                            className="badge px-2.5 py-1 rounded-pill"
                            style={{
                              background: 'rgba(245, 158, 11, 0.1)',
                              color: '#b45309',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}
                          >
                            <i className="ti ti-alert-triangle me-1"></i> Pending Link
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
                            <i className="ti ti-check me-1"></i> Linked
                          </span>
                        )}
                      </td>

                      {/* Authorised By */}
                      <td>
                        <div className="fw-medium text-dark fs-13">
                          {c.company_representative || 'Anurag'}
                        </div>
                        <small className="text-muted fs-11">Signatory</small>
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
                            title="Open & Edit Challan Details"
                            style={{ borderColor: '#cbd5e1' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(c);
                            }}
                          >
                            <i className="ti ti-pencil fs-14"></i>
                          </button>

                          {/* Print Button */}
                          <button
                            type="button"
                            className="btn btn-light btn-sm p-1.5 rounded-2 text-primary border shadow-xs"
                            title="Print Physical Challan Slip"
                            style={{ borderColor: '#cbd5e1' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onPrintChallan && onPrintChallan(c);
                            }}
                          >
                            <i className="ti ti-printer fs-14"></i>
                          </button>

                          {/* Inward Return Button */}
                          <button
                            type="button"
                            className="btn btn-outline-success btn-sm px-2 py-1 rounded-2 shadow-xs d-flex align-items-center gap-1 fs-12 fw-semibold"
                            title="Record Vendor Inbound Return against this Challan"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRecordReturnFromChallan && onRecordReturnFromChallan(c);
                            }}
                          >
                            <i className="ti ti-receipt-refund fs-13"></i>
                            <span>Inward Return</span>
                          </button>
                        </div>
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
