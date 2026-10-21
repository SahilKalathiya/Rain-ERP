import React, { useState } from 'react';

/**
 * ProcessTrackingDashboard - Section 7: Required / Sent / Received / Pending Tracking
 * Live running calculation per order + fabric + colour
 * Dynamically computed from real POs, Challans, and Returns in the system.
 */
export default function ProcessTrackingDashboard({ pos = [], challans = [], returns = [], openBales = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // =========================================================================
  // 1. LIVE DYNAMIC AGGREGATION ENGINE (Section 7 Specification)
  // =========================================================================
  const trackingMap = {};

  // Step A: Aggregate from all Process POs (Fabric Requirements)
  pos.forEach((po) => {
    const orderId = po.linked_sales_order_id || 'Stock PO';
    const styleName = po.style_names?.[0] || 'General Style';

    if (po.items && po.items.length > 0) {
      po.items.forEach((it) => {
        const fab = it.fabric_name || '100x100 Voile (Grey)';
        const col = it.color_name || 'Standard';
        const key = `${orderId}__${fab}__${col}`;

        if (!trackingMap[key]) {
          trackingMap[key] = {
            order_id: orderId,
            style_name: styleName,
            fabric_name: fab,
            color_name: col,
            vendor_name: po.vendor_name || 'Vendor',
            required_meters: 0,
            sent_meters: 0,
            received_meters: 0,
            linked_po_ids: [],
            linked_challan_ids: [],
            linked_return_ids: []
          };
        }
        const reqMtrs = parseFloat(it.raw_fabric_meters) || parseFloat(it.quantity_meters) || 0;
        trackingMap[key].required_meters += reqMtrs;
        const poRef = po.po_number || po.id;
        if (poRef && !trackingMap[key].linked_po_ids.includes(poRef)) {
          trackingMap[key].linked_po_ids.push(poRef);
        }
      });
    } else {
      const fab = po.fabric_quality || '100x100 Voile (Grey)';
      const key = `${orderId}__${fab}__Standard`;
      if (!trackingMap[key]) {
        trackingMap[key] = {
          order_id: orderId,
          style_name: styleName,
          fabric_name: fab,
          color_name: 'Standard',
          vendor_name: po.vendor_name || 'Vendor',
          required_meters: 0,
          sent_meters: 0,
          received_meters: 0,
          linked_po_ids: [],
          linked_challan_ids: [],
          linked_return_ids: []
        };
      }
      trackingMap[key].required_meters += (parseFloat(po.total_meters) || 0);
      const poRef = po.po_number || po.id;
      if (poRef && !trackingMap[key].linked_po_ids.includes(poRef)) {
        trackingMap[key].linked_po_ids.push(poRef);
      }
    }
  });

  // Step B: Aggregate from all Process Challans (Dispatched Metres)
  challans.forEach((ch) => {
    const chNo = ch.challan_number || ch.id;

    if (ch.items && ch.items.length > 0) {
      ch.items.forEach((it) => {
        let matchedKey = Object.keys(trackingMap).find(k => {
          const item = trackingMap[k];
          return (
            (ch.linked_pos && ch.linked_pos.some(pId => item.linked_po_ids.some(lp => String(pId).includes(String(lp)) || String(lp).includes(String(pId))))) ||
            (item.fabric_name.toLowerCase().includes((it.fabric_name || '').toLowerCase()) &&
             item.color_name.toLowerCase().includes((it.color_name || '').toLowerCase()))
          );
        });

        if (!matchedKey) {
          matchedKey = `Direct__${it.fabric_name || 'Fabric'}__${it.color_name || 'Color'}`;
          trackingMap[matchedKey] = {
            order_id: ch.linked_pos?.[0] || 'Direct Dispatch',
            style_name: ch.styles_info?.[0] || 'Standard Style',
            fabric_name: it.fabric_name || 'Fabric',
            color_name: it.color_name || 'Standard',
            vendor_name: ch.vendor_name || 'Vendor',
            required_meters: parseFloat(it.dispatched_meters) || 0,
            sent_meters: 0,
            received_meters: 0,
            linked_po_ids: ch.linked_pos || [],
            linked_challan_ids: [],
            linked_return_ids: []
          };
        }

        trackingMap[matchedKey].sent_meters += (parseFloat(it.dispatched_meters) || 0);
        if (chNo && !trackingMap[matchedKey].linked_challan_ids.includes(chNo)) {
          trackingMap[matchedKey].linked_challan_ids.push(chNo);
        }
      });
    } else {
      const matchedKey = Object.keys(trackingMap).find(k => {
        const item = trackingMap[k];
        return ch.linked_pos && ch.linked_pos.some(pId => item.linked_po_ids.some(lp => String(pId).includes(String(lp)) || String(lp).includes(String(pId))));
      });
      if (matchedKey) {
        trackingMap[matchedKey].sent_meters += (parseFloat(ch.grand_total_meters) || 0);
        if (chNo && !trackingMap[matchedKey].linked_challan_ids.includes(chNo)) {
          trackingMap[matchedKey].linked_challan_ids.push(chNo);
        }
      }
    }
  });

  // Step C: Aggregate from all Inward Returns (Received Back)
  returns.forEach((ret) => {
    const retNo = ret.vendor_external_challan_no ? `Ret #${ret.vendor_external_challan_no}` : ret.id;

    const matchedKey = Object.keys(trackingMap).find(k => {
      const item = trackingMap[k];
      return (
        (ret.linked_po_id && item.linked_po_ids.some(lp => String(ret.linked_po_id).includes(String(lp)) || String(lp).includes(String(ret.linked_po_id)))) ||
        (ret.linked_challan_id && item.linked_challan_ids.some(lc => String(ret.linked_challan_id).includes(String(lc)) || String(lc).includes(String(ret.linked_challan_id)))) ||
        (item.fabric_name.toLowerCase().includes((ret.fabric_quality || '').toLowerCase()))
      );
    });

    if (matchedKey) {
      trackingMap[matchedKey].received_meters += (parseFloat(ret.total_meters) || 0);
      if (!trackingMap[matchedKey].linked_return_ids.includes(retNo)) {
        trackingMap[matchedKey].linked_return_ids.push(retNo);
      }
    }
  });

  // Step D: Calculate final status and pending meters for each line
  const computedRows = Object.values(trackingMap).map(row => {
    const pendingAtVendor = Math.max(0, row.sent_meters - row.received_meters);
    let status = 'Planned';
    let statusClass = 'bg-secondary-subtle text-secondary border';

    if (row.received_meters >= row.sent_meters && row.sent_meters > 0) {
      status = 'Fully Received (In QC)';
      statusClass = 'bg-success-subtle text-success border border-success-subtle';
    } else if (row.received_meters > 0) {
      status = 'Partial Return';
      statusClass = 'bg-primary-subtle text-primary border border-primary-subtle';
    } else if (row.sent_meters > 0) {
      status = 'Out for Processing';
      statusClass = 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
    } else if (row.required_meters > 0) {
      status = 'PO Issued / Pending Dispatch';
      statusClass = 'bg-info-subtle text-info-emphasis border border-info-subtle';
    }

    return {
      ...row,
      pending_at_vendor: pendingAtVendor,
      status,
      statusClass
    };
  });

  // Filter logic
  const filteredRows = computedRows.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      r.order_id.toLowerCase().includes(term) ||
      r.style_name.toLowerCase().includes(term) ||
      r.fabric_name.toLowerCase().includes(term) ||
      r.color_name.toLowerCase().includes(term) ||
      r.vendor_name.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'ALL' || r.status.includes(statusFilter);
    return matchesSearch && matchesStatus;
  });

  // Top Summary Calculations
  const totalRequired = computedRows.reduce((acc, r) => acc + r.required_meters, 0);
  const totalSent = computedRows.reduce((acc, r) => acc + r.sent_meters, 0);
  const totalReceived = computedRows.reduce((acc, r) => acc + r.received_meters, 0);
  const totalPendingAtVendor = computedRows.reduce((acc, r) => acc + r.pending_at_vendor, 0);

  return (
    <div className="process-tracking-container">
      {/* ========================================================================= */}
      {/* 1. TOP KPI SUMMARY CARDS (HIGH-CONTRAST ERP CARDS)                        */}
      {/* ========================================================================= */}
      <div className="row g-3 mb-4">
        {/* Card 1: Total Fabric Required */}
        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card border-0 shadow-sm p-3 h-100"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                  Total Fabric Required
                </span>
                <h3 className="mb-0 fw-bold text-dark mt-1 fs-24">
                  {totalRequired.toLocaleString('en-IN', { maximumFractionDigits: 1 })} m
                </h3>
              </div>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
                style={{ width: '42px', height: '42px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}
              >
                <i className="ti ti-ruler-2 fs-22"></i>
              </div>
            </div>
            <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
              <i className="ti ti-file-text text-primary fs-13"></i>
              <span>Total from {pos.length} Process POs</span>
            </div>
          </div>
        </div>

        {/* Card 2: Sent to Vendors (Dispatched) */}
        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card border-0 shadow-sm p-3 h-100"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                  Sent to Vendors (Dispatched)
                </span>
                <h3 className="mb-0 fw-bold text-danger mt-1 fs-24">
                  {totalSent.toLocaleString('en-IN', { maximumFractionDigits: 1 })} m
                </h3>
              </div>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
                style={{ width: '42px', height: '42px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}
              >
                <i className="ti ti-truck-delivery fs-22"></i>
              </div>
            </div>
            <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
              <i className="ti ti-check text-danger fs-13"></i>
              <span>Dispatched via {challans.length} Challans</span>
            </div>
          </div>
        </div>

        {/* Card 3: Received Back (Inward GRN) */}
        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card border-0 shadow-sm p-3 h-100"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                  Received from Process (GRN)
                </span>
                <h3 className="mb-0 fw-bold text-success mt-1 fs-24">
                  {totalReceived.toLocaleString('en-IN', { maximumFractionDigits: 1 })} m
                </h3>
              </div>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
                style={{ width: '42px', height: '42px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}
              >
                <i className="ti ti-receipt-refund fs-22"></i>
              </div>
            </div>
            <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
              <span className="badge bg-success-subtle text-success fs-10 px-1.5 py-0.5 rounded">
                {totalSent > 0 ? Math.round((totalReceived / totalSent) * 100) : 0}% Process Yield
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Pending At Vendors */}
        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card border-0 shadow-sm p-3 h-100"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-secondary text-uppercase fw-bold fs-11" style={{ letterSpacing: '0.05em' }}>
                  Pending At Vendors
                </span>
                <h3 className="mb-0 fw-bold text-warning-emphasis mt-1 fs-24">
                  {totalPendingAtVendor.toLocaleString('en-IN', { maximumFractionDigits: 1 })} m
                </h3>
              </div>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
                style={{ width: '42px', height: '42px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}
              >
                <i className="ti ti-clock-pause fs-22"></i>
              </div>
            </div>
            <div className="text-muted fs-11 mt-2 d-flex align-items-center gap-1">
              <i className="ti ti-building-factory text-warning fs-13"></i>
              <span>Currently at processing dye houses</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTROLS BAR: SEARCH & STATUS FILTER                                   */}
      {/* ========================================================================= */}
      <div
        className="card border mb-3 shadow-sm"
        style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}
      >
        <div className="p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex flex-wrap align-items-center gap-2" style={{ flex: '1 1 500px' }}>
            <div className="input-group input-group-sm" style={{ width: '280px' }}>
              <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderColor: '#cbd5e1' }}>
                <i className="ti ti-search fs-14"></i>
              </span>
              <input
                type="text"
                className="form-control bg-white border-start-0 fs-13"
                placeholder="Search order, style, fabric, color..."
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

            <select
              className="form-select form-select-sm bg-white fs-13"
              style={{ width: '180px', height: '36px', borderColor: '#cbd5e1' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="Out for Processing">Out for Processing</option>
              <option value="Partial Return">Partial Return</option>
              <option value="Fully Received">Fully Received</option>
            </select>
          </div>

          <div className="text-muted fs-12 d-flex align-items-center gap-1.5">
            <span className="badge bg-success-subtle text-success fs-11 px-2 py-1 rounded">
              <i className="ti ti-refresh me-1"></i> Live Auto-Recalculating
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ORDER-WISE LIVE TRACKING GRID (Section 7)                              */}
      {/* ========================================================================= */}
      <div
        className="card border shadow-sm mb-4"
        style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff', overflow: 'hidden' }}
      >
        <div className="px-3 py-2.5 bg-light border-bottom d-flex align-items-center justify-content-between">
          <div>
            <h6 className="card-title mb-0 fw-bold text-dark fs-14">
              <i className="ti ti-chart-arrows-vertical me-2 text-primary"></i>
              Order-Wise Fabric Processing Tracking Grid (Section 7)
            </h6>
            <small className="text-muted fs-11">
              Recalculates automatically as POs, Challans, and Returns are added across the system.
            </small>
          </div>
          <span className="badge bg-white text-secondary border fs-11">
            {filteredRows.length} Active Tracking Batches
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr style={{ color: '#475569', fontSize: '11.5px', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                <th className="py-2.5 ps-3" style={{ width: '130px' }}>Order Ref</th>
                <th style={{ minWidth: '160px' }}>Style Name</th>
                <th style={{ minWidth: '170px' }}>Fabric Quality</th>
                <th style={{ width: '120px' }}>Color Shade</th>
                <th className="text-end" style={{ width: '120px' }}>Required (m)</th>
                <th className="text-end" style={{ width: '130px', color: '#dc2626' }}>Sent / Challan (m)</th>
                <th className="text-end" style={{ width: '130px', color: '#059669' }}>Received (m)</th>
                <th className="text-end" style={{ width: '140px', color: '#b45309' }}>Pending at Vendor</th>
                <th className="text-center" style={{ width: '160px' }}>Pipeline Progress</th>
                <th className="text-center pe-3" style={{ width: '140px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-5 text-muted">
                    <div className="d-flex flex-column align-items-center">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                        style={{ width: '48px', height: '48px', background: '#f1f5f9', color: '#94a3b8' }}
                      >
                        <i className="ti ti-chart-bar fs-24"></i>
                      </div>
                      <span className="fw-semibold text-dark fs-14">No Active Fabric Batches</span>
                      <small className="text-muted fs-12 mt-1">
                        Create a Process PO or Process Challan to start live tracking.
                      </small>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const percentComplete = row.sent_meters > 0
                    ? Math.min(100, Math.round((row.received_meters / row.sent_meters) * 100))
                    : 0;

                  return (
                    <tr key={idx}>
                      {/* Order Ref */}
                      <td className="ps-3 py-3">
                        <span
                          className="badge font-monospace fw-bold px-2 py-1"
                          style={{
                            background: 'rgba(79, 70, 229, 0.08)',
                            color: '#4338ca',
                            border: '1px solid rgba(79, 70, 229, 0.2)',
                            fontSize: '11.5px'
                          }}
                        >
                          {row.order_id}
                        </span>
                        {row.linked_po_ids.length > 0 && (
                          <small className="text-muted fs-10 d-block mt-0.5">
                            PO #{row.linked_po_ids.join(', #')}
                          </small>
                        )}
                      </td>

                      {/* Style Name */}
                      <td>
                        <div className="fw-bold text-dark fs-13">{row.style_name}</div>
                        <small className="text-muted fs-11">{row.vendor_name}</small>
                      </td>

                      {/* Fabric Quality */}
                      <td>
                        <div className="fw-semibold text-dark fs-13">{row.fabric_name}</div>
                      </td>

                      {/* Color Shade */}
                      <td>
                        <div className="d-flex align-items-center gap-1.5">
                          <span
                            className="rounded-circle"
                            style={{
                              width: '10px',
                              height: '10px',
                              background: row.color_name.toLowerCase().includes('beige') ? '#f5f5dc' :
                                          row.color_name.toLowerCase().includes('white') ? '#fafafa' :
                                          row.color_name.toLowerCase().includes('rose') ? '#ffe4e1' : '#cbd5e1',
                              border: '1px solid rgba(0,0,0,0.2)'
                            }}
                          ></span>
                          <span className="fw-medium text-dark fs-13">{row.color_name}</span>
                        </div>
                      </td>

                      {/* Required */}
                      <td className="text-end fw-bold text-dark fs-13">
                        {Number(row.required_meters).toFixed(2)} m
                      </td>

                      {/* Sent / Dispatched */}
                      <td className="text-end fw-bold fs-13" style={{ color: '#dc2626' }}>
                        {Number(row.sent_meters).toFixed(2)} m
                        {row.linked_challan_ids.length > 0 && (
                          <small className="text-muted fs-10 d-block">
                            Challan #{row.linked_challan_ids.join(', #')}
                          </small>
                        )}
                      </td>

                      {/* Received */}
                      <td className="text-end fw-bold fs-13" style={{ color: '#059669' }}>
                        {Number(row.received_meters).toFixed(2)} m
                        {row.linked_return_ids.length > 0 && (
                          <small className="text-muted fs-10 d-block">
                            {row.linked_return_ids.join(', ')}
                          </small>
                        )}
                      </td>

                      {/* Pending At Vendor */}
                      <td className="text-end fw-bold fs-13" style={{ color: '#b45309' }}>
                        {Number(row.pending_at_vendor).toFixed(2)} m
                      </td>

                      {/* Pipeline Progress */}
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <div className="d-flex justify-content-between align-items-center fs-11 text-muted">
                            <span>{percentComplete}% Recv</span>
                            <span>{Number(row.received_meters).toFixed(0)} / {Number(row.sent_meters).toFixed(0)}m</span>
                          </div>
                          <div className="progress" style={{ height: '6px', background: '#f1f5f9' }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{
                                width: `${percentComplete}%`,
                                background: percentComplete === 100 ? '#10b981' : '#4f46e5'
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Tracking Status */}
                      <td className="text-center pe-3">
                        <span className={`badge rounded-pill px-2.5 py-1 fs-11 fw-semibold ${row.statusClass}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. OPEN BALES POOL (Grey Fabric Returned - Section 5.3)                   */}
      {/* ========================================================================= */}
      <div
        className="card border shadow-sm"
        style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff', overflow: 'hidden' }}
      >
        <div className="px-3 py-2.5 bg-light border-bottom d-flex align-items-center justify-content-between">
          <div>
            <h6 className="card-title mb-0 fw-bold text-dark fs-14">
              <i className="ti ti-archive me-2 text-secondary"></i>
              Open Bales Pool (Grey / Unprocessed Fabric Returned by Vendors - Section 5.3)
            </h6>
            <small className="text-muted fs-11">
              Unutilised uncut grey fabric returned alongside dyed goods, stored as Open Bales linked to purchase invoices.
            </small>
          </div>
          <span className="badge bg-secondary text-white fs-11">{openBales.length} Open Bales Available</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr style={{ color: '#475569', fontSize: '11.5px', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                <th className="py-2.5 ps-3" style={{ width: '130px' }}>Bale ID</th>
                <th style={{ width: '140px' }}>Source Return</th>
                <th style={{ minWidth: '180px' }}>Fabric Quality</th>
                <th style={{ minWidth: '220px' }}>Target Purchase Invoice</th>
                <th className="text-end" style={{ width: '130px' }}>Returned Metres</th>
                <th className="text-end" style={{ width: '140px' }}>Available Balance</th>
                <th className="text-center pe-3" style={{ width: '120px' }}>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {openBales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    <span className="fs-13">No Open Bales recorded yet. Open Bales are logged when grey fabric is returned in Inward GRN.</span>
                  </td>
                </tr>
              ) : (
                openBales.map((b) => (
                  <tr key={b.id}>
                    <td className="ps-3 py-2.5 fw-bold font-monospace text-secondary">{b.id}</td>
                    <td>
                      <span className="badge bg-light text-dark border px-2 py-1 fs-11 font-monospace">
                        {b.return_id}
                      </span>
                    </td>
                    <td className="fw-semibold text-dark">{b.fabric_name}</td>
                    <td className="text-muted fs-12">{b.original_vendor_invoice_ref}</td>
                    <td className="text-end fw-bold text-dark fs-13">
                      {Number(b.returned_meters).toFixed(2)} m
                    </td>
                    <td className="text-end fw-bold text-success fs-13">
                      {Number(b.remaining_meters).toFixed(2)} m
                    </td>
                    <td className="text-center pe-3">
                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 fs-11">
                        {b.status || 'Available in Godown'}
                      </span>
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
