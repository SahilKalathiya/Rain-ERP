import React, { useState } from 'react';

/**
 * EmbroideryList - "Embroidery After Cut" View
 * Matches Screenshot 1: Post-Cutting Embroidery
 */
export default function EmbroideryList({
  orders = [],
  onNewPO,
  onRecordInward,
  onViewDetails
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const filteredOrders = orders.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.orderRef.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'All Types' || item.embType === typeFilter;
    const matchesStatus = statusFilter === 'All Status' || item.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="container-fluid p-0">
      {/* Breadcrumb & Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-muted fs-12">
              <li className="breadcrumb-item">Production</li>
              <li className="breadcrumb-item active text-primary fw-medium" aria-current="page">
                After-Cut Embroidery
              </li>
            </ol>
          </nav>
          <h2 className="fw-bold text-dark mb-1 fs-24">Embroidery After Cut</h2>
          <p className="text-secondary mb-0 fs-13">Post-Cutting Embroidery</p>
        </div>

        {/* Action Buttons */}
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-success d-flex align-items-center gap-2 px-3 py-2 fw-medium shadow-sm rounded-3"
            onClick={onRecordInward}
          >
            <i className="ti ti-arrow-down-left fs-16"></i>
            <span>Record Inward</span>
          </button>
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium shadow-sm rounded-3"
            onClick={onNewPO}
          >
            <i className="ti ti-plus fs-16"></i>
            <span>New EMB PO</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6">
              <div className="position-relative w-100">
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
                  placeholder="Search PO number, design, vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select bg-light fs-13"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="All Types">All Types</option>
                <option value="Computer Embroidery">Computer Embroidery</option>
                <option value="Aari">Aari</option>
                <option value="Hand Embroidery">Hand Embroidery</option>
                <option value="Sequins">Sequins</option>
              </select>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select bg-light fs-13"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All Status">All Status</option>
                <option value="Draft">Draft</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* PO Cards List */}
      <div className="d-flex flex-column gap-3">
        {filteredOrders.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-3 p-5 text-center">
            <div className="mb-3 text-muted">
              <i className="ti ti-shirt-off fs-40"></i>
            </div>
            <h5 className="fw-semibold text-secondary">No embroidery orders found</h5>
            <p className="text-muted fs-13">Try adjusting your search criteria or create a new PO.</p>
            <div>
              <button className="btn btn-primary btn-sm px-3" onClick={onNewPO}>
                + Create New EMB PO
              </button>
            </div>
          </div>
        ) : (
          filteredOrders.map((po) => (
            <div
              key={po.id}
              className="card border-0 shadow-sm rounded-3 p-3 transition-all hover-shadow"
            >
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-dark fs-16">{po.id}</span>
                  <span
                    className={`badge px-2 py-1 fs-12 fw-medium ${
                      po.status === 'Completed'
                        ? 'bg-success-subtle text-success'
                        : po.status === 'In Progress'
                        ? 'bg-primary-subtle text-primary'
                        : 'bg-warning-subtle text-warning'
                    }`}
                  >
                    {po.status}
                  </span>
                  <span className="badge bg-light text-secondary border px-2 py-1 fs-12">
                    {po.embType}
                  </span>
                </div>

                <div className="text-end">
                  <div className="fw-bold text-dark fs-17">{po.amount}</div>
                  <div className="text-muted fs-12">{po.totalSent} sent</div>
                </div>
              </div>

              <div className="mb-2">
                <h5 className="fw-semibold text-primary mb-1 fs-15">{po.designName}</h5>
                <div className="text-muted fs-13 d-flex flex-wrap align-items-center gap-3">
                  <span>
                    <i className="ti ti-building-store me-1"></i>
                    Vendor: <strong>{po.vendor}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    <i className="ti ti-file-text me-1"></i>
                    {po.orderRef}
                  </span>
                </div>
              </div>

              <hr className="my-2 text-muted opacity-25" />

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-1">
                <div className="d-flex flex-wrap align-items-center gap-4 text-muted fs-12">
                  <span>
                    <i className="ti ti-calendar me-1"></i>
                    PO Date: <strong>{po.date}</strong>
                  </span>
                  <span>
                    <i className="ti ti-calendar-time me-1"></i>
                    Expected: <strong>{po.expectedReturn}</strong>
                  </span>
                  <span>
                    <i className="ti ti-box me-1"></i>
                    Received: <strong className="text-success">{po.totalReceived}</strong>
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm px-3 py-1 d-flex align-items-center gap-1"
                    onClick={() => onRecordInward && onRecordInward(po.id)}
                  >
                    <i className="ti ti-arrow-down-left fs-14"></i>
                    <span>Inward</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm px-3 py-1 d-flex align-items-center gap-1"
                    onClick={() => onViewDetails && onViewDetails(po.id)}
                  >
                    <i className="ti ti-eye fs-14"></i>
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
