import React, { useState } from 'react';

/**
 * PurchaseOrderList - 4.0 PO Management List
 * Column-wise filtering, status pill counters, search, and action triggers.
 */
export default function PurchaseOrderList({
  purchaseOrders = [],
  vendors = [],
  grns = [],
  onNewPO,
  onSelectPO,
  onPrintPO,
  onInwardGRN,
  onViewGRN
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [colFilters, setColFilters] = useState({
    id: '',
    date: '',
    vendor: '',
    expected: '',
    status: '',
    amount: ''
  });

  const isPoGrnLocked = (po) => {
    if (!po) return false;
    const status = String(po.status || '').trim();
    const isSent = /sent|partially|received|completed/i.test(status);
    const poIds = [po.id, po.poNumber, po.po_number].filter(Boolean);

    const hasLinkedGrn = (grns || []).some((g) =>
      g && poIds.some((pid) =>
        (Array.isArray(g.linkedPOs) && g.linkedPOs.includes(pid)) ||
        g.poId === pid ||
        g.poNumber === pid ||
        g.againstPo === pid ||
        g.poRef === pid ||
        g.purchaseOrderId === pid ||
        g.purchaseOrderNumber === pid
      )
    );

    const grnStarted = hasLinkedGrn ||
      status === 'Partially Received' ||
      status === 'Completed' ||
      (Number(po.receivedQty) > 0);

    return isSent && grnStarted;
  };

  const getVendorName = (po) => {
    if (po.vendorName && po.vendorName.trim()) return po.vendorName;
    const found = vendors.find((v) => v.id === po.vendorId);
    return found ? found.name : (po.vendorId || 'Unknown Vendor');
  };

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

  const filtered = purchaseOrders.filter((po) => {
    if (!po) return false;
    const vName = getVendorName(po);
    const poId = String(po.id || '');
    const vId = String(po.vendorId || '');
    const poDate = String(po.date ? (typeof po.date === 'string' && po.date.includes('T') ? po.date.split('T')[0] : po.date) : '');
    const expDate = String(po.expectedDeliveryDate ? (typeof po.expectedDeliveryDate === 'string' && po.expectedDeliveryDate.includes('T') ? po.expectedDeliveryDate.split('T')[0] : po.expectedDeliveryDate) : '');

    const matchesSearch =
      searchTerm === '' ||
      poId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.items || []).some((it) => String(it.fabricName || it.fabricQuality || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCol =
      poId.toLowerCase().includes((colFilters.id || '').toLowerCase()) &&
      poDate.includes(colFilters.date || '') &&
      (vName.toLowerCase().includes((colFilters.vendor || '').toLowerCase()) ||
        vId.toLowerCase().includes((colFilters.vendor || '').toLowerCase())) &&
      (!colFilters.expected || expDate.includes(colFilters.expected)) &&
      (!colFilters.status || po.status === colFilters.status);

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

    // 2. Second priority: PO date
    const timeA = parseDateForSort(a.date || a.createdDate);
    const timeB = parseDateForSort(b.date || b.createdDate);
    if (timeB && timeA && timeB !== timeA) return timeB - timeA;

    // 3. Third priority: maintain natural entry / list insertion order (newest on top)
    return purchaseOrders.indexOf(a) - purchaseOrders.indexOf(b);
  });

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-muted fs-12">
              <li className="breadcrumb-item">Procurement</li>
              <li className="breadcrumb-item active text-primary fw-medium">Purchase Orders</li>
            </ol>
          </nav>
          <h2 className="fw-bold text-dark mb-1 fs-24">Purchase Orders (PO)</h2>
          <p className="text-secondary mb-0 fs-13">
            Raw Material Procurement Orders &amp; Vendor Buffer Management
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium shadow-sm rounded-3"
          onClick={onNewPO}
        >
          <i className="ti ti-plus fs-16"></i>
          <span>Create Purchase Order</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div className="position-relative" style={{ maxWidth: '360px', width: '100%' }}>
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
              placeholder="Search PO number, vendor, fabric..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-secondary border px-2 py-1 fs-12">
              {filtered.length} Orders
            </span>
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'hidden' }}>
          <table className="table table-hover align-middle mb-0" style={{ width: '100%', fontSize: '11px', tableLayout: 'auto' }}>
            <thead className="text-secondary" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', width: '9%' }}>PO No.</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', width: '8%' }}>Date</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', width: '12%' }}>Vendor</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', width: '21%' }}>Fabrics / Qualities</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', width: '8%' }}>Expected Date</th>
                <th className="text-center" style={{ padding: '7px 4px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', width: '6%' }}>Buffer %</th>
                <th className="text-end" style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', width: '10%' }}>Total Amount</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', width: '13%' }}>Status</th>
                <th className="text-end" style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', width: '13%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedList.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <i className="ti ti-file-off fs-32 d-block mb-2"></i>
                    No Purchase Orders found.
                  </td>
                </tr>
              ) : (
                sortedList.map((po) => {
                  const totalOrdered = (po.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
                  const poGrns = (grns || []).filter((g) => (g.linkedPOs && g.linkedPOs.includes(po.id)) || g.poId === po.id || g.poNumber === po.id || g.againstPo === po.id);
                  const hasExistingGrn = poGrns.length > 0 || (Number(po.receivedQty) > 0) || po.status === 'Partially Received' || po.status === 'Completed';
                  const receivedMeters = poGrns.reduce((sum, g) => sum + (Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0), 0) || Number(po.receivedQty) || 0;
                  const pendingMeters = Math.max(0, totalOrdered - receivedMeters);

                  return (
                    <tr
                      key={po.id}
                      style={{ cursor: 'pointer' }}
                      className="hover-bg-light"
                      onClick={() => onSelectPO && onSelectPO(po)}
                    >
                      <td style={{ padding: '6px 6px', whiteSpace: 'nowrap', fontSize: '11px' }} className="fw-bold text-primary font-monospace">{po.id}</td>
                      <td style={{ padding: '6px 6px', whiteSpace: 'nowrap', fontSize: '11px' }}>{po.date ? (typeof po.date === 'string' && po.date.includes('T') ? po.date.split('T')[0] : String(po.date)) : '-'}</td>
                      <td style={{ padding: '6px 6px' }}>
                        <div className="fw-semibold text-dark text-truncate" style={{ fontSize: '11px', maxWidth: '140px' }} title={getVendorName(po)}>{getVendorName(po)}</div>
                        <div className="text-muted" style={{ fontSize: '10px' }}>{po.vendorId}</div>
                      </td>
                      <td style={{ padding: '6px 6px', fontSize: '10.5px' }}>
                        <div className="d-flex flex-column gap-0.5">
                          {(po.items || []).map((it, idx) => (
                            <div key={idx} className="text-dark text-truncate" style={{ maxWidth: '230px' }} title={`${it.fabricName || it.fabricQuality || 'Fabric'} ${it.colorName ? `(${it.colorName})` : ''} (${Number(it.quantity || 0).toLocaleString()}m @ ₹${it.rate || 0})`}>
                              <span className="fw-medium">{it.fabricName || it.fabricQuality || 'Fabric'}</span> {it.colorName ? `(${it.colorName})` : ''} <span className="text-secondary">({Number(it.quantity || 0).toLocaleString()}m @ ₹{it.rate || 0})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '6px 6px', whiteSpace: 'nowrap', fontSize: '11px' }}>{po.expectedDeliveryDate ? (typeof po.expectedDeliveryDate === 'string' && po.expectedDeliveryDate.includes('T') ? po.expectedDeliveryDate.split('T')[0] : String(po.expectedDeliveryDate)) : '-'}</td>
                      <td className="text-center" style={{ padding: '6px 4px', fontSize: '10px' }}>
                        {po.bufferAllowed ? (
                          <span className="badge bg-info-subtle text-info py-0.5 px-1.5 fs-10">±{po.bufferPercent}%</span>
                        ) : (
                          <span className="text-muted fs-10">None</span>
                        )}
                      </td>
                      <td className="text-end fw-bold text-dark" style={{ padding: '6px 6px', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                        ₹
                        {(Number(po.totalAmount) || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td style={{ padding: '6px 6px' }}>
                        <div className="d-flex flex-column align-items-start gap-0.5">
                          <span
                            className={`badge px-1.5 py-0.5 rounded-pill fw-semibold d-inline-flex align-items-center gap-1 fs-10 ${po.status === 'Completed'
                                ? 'bg-success-subtle text-success border border-success border-opacity-25'
                                : po.status === 'Partially Received'
                                  ? 'bg-info-subtle text-info border border-info border-opacity-25'
                                  : po.status === 'Sent'
                                    ? 'bg-primary text-white shadow-sm'
                                    : po.status === 'Draft'
                                      ? 'bg-secondary-subtle text-secondary border'
                                      : 'bg-warning-subtle text-warning border border-warning border-opacity-25'
                              }`}
                          >
                            {po.status === 'Sent' && <i className="ti ti-send fs-10"></i>}
                            {po.status === 'Completed' && <i className="ti ti-check fs-10"></i>}
                            {po.status === 'Draft' && <i className="ti ti-file fs-10"></i>}
                            <span>{po.status === 'Sent' ? 'Sent' : po.status}</span>
                          </span>

                          {isPoGrnLocked(po) && po.status !== 'Completed' && (
                            <span
                              className="badge bg-light text-secondary border px-1 py-0.5 rounded-pill fs-9 d-inline-flex align-items-center gap-0.5 shadow-2xs"
                              style={{ fontSize: '9px' }}
                              title="Non-editable (GRN process started)"
                            >
                              <i className="ti ti-lock text-warning" style={{ fontSize: '8.5px' }}></i>
                              <span>Locked</span>
                            </span>
                          )}

                          {po.status === 'Partially Received' && (
                            <div className="mt-0.5 p-1 rounded-2 bg-light border border-info border-opacity-25 w-100" style={{ fontSize: '9.5px', lineHeight: 1.2 }}>
                              <div className="d-flex align-items-center justify-content-between text-muted">
                                <span>Rec:</span>
                                <strong className="text-dark">{receivedMeters.toLocaleString()}m</strong>
                              </div>
                              <div className="d-flex align-items-center justify-content-between text-danger fw-semibold">
                                <span>Pend:</span>
                                <span>{pendingMeters.toLocaleString()}m</span>
                              </div>
                            </div>
                          )}
                          {po.status === 'Completed' && totalOrdered > 0 && (
                            <div className="mt-0.5 text-success fw-medium d-flex align-items-center gap-0.5" style={{ fontSize: '9.5px' }}>
                              <i className="ti ti-check fs-10"></i>
                              <span>All {totalOrdered.toLocaleString()}m recd</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-end" style={{ verticalAlign: 'middle', padding: '6px 6px' }}>
                        <div className="d-flex align-items-center justify-content-end gap-1 flex-wrap">
                          {/* GRN Inward Buttons / Badges */}
                          <div className="d-flex align-items-center justify-content-end gap-1 flex-wrap">
                            {/* 1. Show existing GRNs created for this PO */}
                            {poGrns.map((g, gIdx) => (
                              <button
                                key={g.id || gIdx}
                                type="button"
                                className="btn btn-sm px-1.5 py-0.5 rounded-2 fw-semibold d-inline-flex align-items-center gap-0.5 text-nowrap"
                                style={{
                                  background: '#f0fdf4',
                                  color: '#16a34a',
                                  border: '1px solid #bbf7d0',
                                  height: '22px',
                                  fontSize: '10px',
                                  lineHeight: 1,
                                  whiteSpace: 'nowrap'
                                }}
                                title={`GRN ${g.id} (${(Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0).toLocaleString()}m). Click to view.`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onViewGRN) {
                                    onViewGRN(g);
                                  } else if (onInwardGRN) {
                                    onInwardGRN(po);
                                  }
                                }}
                              >
                                <i className="ti ti-check fs-10"></i>
                                <span className="fw-bold">{g.id}</span>
                              </button>
                            ))}

                            {/* 2. As long as PO is not fully fulfilled, allow creating multiple installment GRNs */}
                            {pendingMeters > 0 && po.status !== 'Draft' && po.status !== 'Cancelled' && po.status !== 'Completed' ? (
                              <button
                                type="button"
                                className="btn btn-sm px-1.5 py-0.5 rounded-2 fw-semibold d-inline-flex align-items-center gap-0.5 text-nowrap shadow-xs"
                                style={{
                                  background: poGrns.length > 0 ? '#eff6ff' : '#ecfdf5',
                                  color: poGrns.length > 0 ? '#1d4ed8' : '#059669',
                                  border: poGrns.length > 0 ? '1px solid #bfdbfe' : '1px solid #a7f3d0',
                                  height: '22px',
                                  fontSize: '10px',
                                  lineHeight: 1,
                                  whiteSpace: 'nowrap'
                                }}
                                title={poGrns.length > 0
                                  ? `Inward Remaining ${pendingMeters.toLocaleString()}m for this PO (${poGrns.length} GRN(s) already created)`
                                  : "Create Inward Delivery GRN for this PO"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onInwardGRN) onInwardGRN({ ...po, pendingQtyToReceive: pendingMeters });
                                }}
                              >
                                <i className={poGrns.length > 0 ? "ti ti-truck-delivery fs-11" : "ti ti-package fs-11"}></i>
                                <span className="fw-bold">
                                  {poGrns.length > 0 ? `+ GRN (${pendingMeters.toLocaleString()}m)` : '+ GRN'}
                                </span>
                              </button>
                            ) : ((pendingMeters <= 0 && totalOrdered > 0) || po.status === 'Completed') ? (
                              <span
                                className="badge bg-success-subtle text-success border border-success border-opacity-25 px-1.5 py-0.5 fs-10 fw-semibold d-inline-flex align-items-center gap-0.5 text-nowrap"
                                style={{ height: '22px' }}
                                title={`PO 100% Fulfilled: All ${totalOrdered.toLocaleString()}m received across ${poGrns.length} GRN(s). No further GRN allowed.`}
                              >
                                <i className="ti ti-circle-check fs-10"></i>
                                <span>Fulfilled</span>
                              </span>
                            ) : null}
                          </div>

                          {/* Standard View and Print Action Icons Group */}
                          <div className="btn-group btn-group-sm shadow-2xs" role="group" style={{ flexShrink: 0 }}>
                            <button
                              type="button"
                              className="btn btn-white border px-1 d-inline-flex align-items-center justify-content-center text-primary"
                              style={{ width: '22px', height: '22px', borderColor: '#cbd5e1' }}
                              title={isPoGrnLocked(po) ? "View PO Details (Locked - Non-editable: GRN process started)" : "View / Edit PO Details"}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectPO) onSelectPO(po);
                              }}
                            >
                              <i className="ti ti-eye fs-11"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-white border px-1 d-inline-flex align-items-center justify-content-center text-secondary"
                              style={{ width: '22px', height: '22px', borderColor: '#cbd5e1' }}
                              title="Print PO Invoice"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onPrintPO) onPrintPO(po);
                              }}
                            >
                              <i className="ti ti-printer fs-11"></i>
                            </button>
                          </div>
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
