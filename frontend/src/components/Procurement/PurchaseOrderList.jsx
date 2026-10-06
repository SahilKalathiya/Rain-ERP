import React, { useState } from 'react';

/**
 * PurchaseOrderList - 4.0 PO Management List
 * Column-wise filtering, status pill counters, search, and action triggers.
 */
export default function PurchaseOrderList({
  purchaseOrders = [],
  vendors = [],
  onNewPO,
  onSelectPO,
  onPrintPO,
  onInwardGRN
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

  const getVendorName = (po) => {
    if (po.vendorName && po.vendorName.trim()) return po.vendorName;
    const found = vendors.find((v) => v.id === po.vendorId);
    return found ? found.name : (po.vendorId || 'Unknown Vendor');
  };

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
          <div className="input-group" style={{ maxWidth: '360px' }}>
            <span className="input-group-text bg-light border-end-0 text-muted">
              <i className="ti ti-search fs-15"></i>
            </span>
            <input
              type="text"
              className="form-control bg-light border-start-0 fs-13"
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

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="text-secondary" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PO No.</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vendor</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fabrics / Qualities</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expected Date</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Buffer %</th>
                <th className="text-end" style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Amount</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th className="text-center" style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <i className="ti ti-file-off fs-32 d-block mb-2"></i>
                    No Purchase Orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((po) => (
                  <tr key={po.id}>
                    <td className="fw-bold text-primary font-monospace">{po.id}</td>
                    <td>{po.date ? (typeof po.date === 'string' && po.date.includes('T') ? po.date.split('T')[0] : String(po.date)) : '-'}</td>
                    <td>
                      <div className="fw-medium text-dark">{getVendorName(po)}</div>
                      <div className="text-muted fs-11">{po.vendorId}</div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        {(po.items || []).map((it, idx) => (
                          <span key={idx} className="text-dark">
                            {it.fabricName || it.fabricQuality || 'Fabric'} {it.colorName ? `(${it.colorName})` : ''} ({Number(it.quantity || 0).toLocaleString()}m @ ₹{it.rate || 0})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{po.expectedDeliveryDate ? (typeof po.expectedDeliveryDate === 'string' && po.expectedDeliveryDate.includes('T') ? po.expectedDeliveryDate.split('T')[0] : String(po.expectedDeliveryDate)) : '-'}</td>
                    <td>
                      {po.bufferAllowed ? (
                        <span className="badge bg-info-subtle text-info">±{po.bufferPercent}%</span>
                      ) : (
                        <span className="text-muted fs-11">None</span>
                      )}
                    </td>
                    <td className="text-end fw-bold text-dark fs-14">
                      ₹
                      {(Number(po.totalAmount) || 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td>
                      <span
                        className={`badge px-2 py-1 rounded-pill fw-semibold d-inline-flex align-items-center gap-1 fs-12 ${
                          po.status === 'Completed'
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
                        {po.status === 'Sent' && <i className="ti ti-send fs-11"></i>}
                        {po.status === 'Completed' && <i className="ti ti-check fs-11"></i>}
                        {po.status === 'Draft' && <i className="ti ti-file fs-11"></i>}
                        <span>{po.status === 'Sent' ? 'Sent to Vendor' : po.status}</span>
                      </span>
                    </td>
                    <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                      <div className="d-inline-flex align-items-center justify-content-center gap-1">
                        {po.status !== 'Completed' && po.status !== 'Draft' && (
                          <button
                            type="button"
                            className="btn btn-sm px-2 py-1 rounded-2 fw-semibold d-inline-flex align-items-center gap-1 text-nowrap"
                            style={{
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                              height: '32px',
                              lineHeight: 1,
                              whiteSpace: 'nowrap'
                            }}
                            title="Create Inward Delivery GRN for this PO"
                            onClick={() => onInwardGRN && onInwardGRN(po)}
                          >
                            <i className="ti ti-package fs-13"></i>
                            <span className="fs-12 fw-bold" style={{ letterSpacing: '0.02em' }}>+ GRN</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm px-2 rounded-2 d-inline-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px' }}
                          title="View / Edit PO Details"
                          onClick={() => onSelectPO && onSelectPO(po)}
                        >
                          <i className="ti ti-eye fs-15"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm px-2 rounded-2 d-inline-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px' }}
                          title="Print PO Invoice"
                          onClick={() => onPrintPO && onPrintPO(po)}
                        >
                          <i className="ti ti-printer fs-15"></i>
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
