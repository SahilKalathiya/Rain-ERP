import React, { useState } from 'react';

/**
 * PurchaseOrderList - 4.0 PO Management List
 * Column-wise filtering, status pill counters, search, and action triggers.
 */
export default function PurchaseOrderList({
  purchaseOrders = [],
  onNewPO,
  onSelectPO,
  onPrintPO
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

  const filtered = purchaseOrders.filter((po) => {
    const matchesSearch =
      searchTerm === '' ||
      po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.items.some((it) => it.fabricName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCol =
      po.id.toLowerCase().includes(colFilters.id.toLowerCase()) &&
      po.date.includes(colFilters.date) &&
      po.vendorName.toLowerCase().includes(colFilters.vendor.toLowerCase()) &&
      (colFilters.expected === '' || (po.expectedDeliveryDate || '').includes(colFilters.expected)) &&
      (colFilters.status === '' || po.status === colFilters.status);

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
            <thead className="table-light text-secondary">
              {/* Column Filters (9.3) */}
              <tr className="bg-light">
                <th>
                  <input
                    type="text"
                    placeholder="Filter PO"
                    className="form-control form-control-sm fs-11"
                    value={colFilters.id}
                    onChange={(e) => setColFilters({ ...colFilters, id: e.target.value })}
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Date"
                    className="form-control form-control-sm fs-11"
                    value={colFilters.date}
                    onChange={(e) => setColFilters({ ...colFilters, date: e.target.value })}
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Filter Vendor"
                    className="form-control form-control-sm fs-11"
                    value={colFilters.vendor}
                    onChange={(e) => setColFilters({ ...colFilters, vendor: e.target.value })}
                  />
                </th>
                <th>Fabric Items</th>
                <th>
                  <input
                    type="text"
                    placeholder="Expected"
                    className="form-control form-control-sm fs-11"
                    value={colFilters.expected}
                    onChange={(e) => setColFilters({ ...colFilters, expected: e.target.value })}
                  />
                </th>
                <th>Buffer %</th>
                <th className="text-end">Total Amount</th>
                <th>
                  <select
                    className="form-select form-select-sm fs-11"
                    value={colFilters.status}
                    onChange={(e) => setColFilters({ ...colFilters, status: e.target.value })}
                  >
                    <option value="">All Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Partially Received">Partially Received</option>
                    <option value="Completed">Completed</option>
                  </select>
                </th>
                <th className="text-center">Actions</th>
              </tr>
              <tr>
                <th>PO No.</th>
                <th>Date</th>
                <th>Vendor</th>
                <th>Fabrics / Qualities</th>
                <th>Expected Date</th>
                <th>Buffer %</th>
                <th className="text-end">Total Amount</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
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
                    <td>{po.date}</td>
                    <td>
                      <div className="fw-medium text-dark">{po.vendorName}</div>
                      <div className="text-muted fs-11">{po.vendorId}</div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        {(po.items || []).map((it, idx) => (
                          <span key={idx} className="text-dark">
                            {it.fabricName} ({Number(it.quantity).toLocaleString()}m @ ₹{it.rate})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{po.expectedDeliveryDate || '-'}</td>
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
                    <td className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-1">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm px-2 py-1 rounded-2"
                          title="View / Edit PO Details"
                          onClick={() => onSelectPO && onSelectPO(po)}
                        >
                          <i className="ti ti-eye fs-14"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm px-2 py-1 rounded-2"
                          title="Print PO Invoice (Page 28 Format)"
                          onClick={() => onPrintPO && onPrintPO(po)}
                        >
                          <i className="ti ti-printer fs-14"></i>
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
