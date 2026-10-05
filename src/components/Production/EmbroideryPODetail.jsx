import React from 'react';

/**
 * EmbroideryPODetail - Detailed view of an Embroidery PO
 */
export default function EmbroideryPODetail({ po, onBack, onRecordInward }) {
  if (!po) {
    return (
      <div className="card p-4 text-center">
        <p>PO details not found.</p>
        <button className="btn btn-light" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
      {/* Top Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center"
            style={{ width: '40px', height: '40px' }}
            onClick={onBack}
          >
            <i className="ti ti-arrow-left fs-18"></i>
          </button>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h3 className="fw-bold text-dark mb-0 fs-20">{po.id}</h3>
              <span
                className={`badge px-2 py-1 fs-12 ${
                  po.status === 'Completed'
                    ? 'bg-success-subtle text-success'
                    : po.status === 'In Progress'
                    ? 'bg-primary-subtle text-primary'
                    : 'bg-warning-subtle text-warning'
                }`}
              >
                {po.status}
              </span>
            </div>
            <p className="text-secondary mb-0 fs-13">
              {po.designName} • {po.embType}
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-success d-flex align-items-center gap-2 px-3 py-2 fw-medium fs-13"
            onClick={() => onRecordInward && onRecordInward(po.id)}
          >
            <i className="ti ti-arrow-down-left fs-16"></i>
            <span>Record Inward</span>
          </button>
          <button
            type="button"
            className="btn btn-outline-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium fs-13"
            onClick={handlePrint}
          >
            <i className="ti ti-printer fs-16"></i>
            <span>Print PO</span>
          </button>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="row g-3 p-3 bg-light rounded-3 mb-4 fs-13">
        <div className="col-6 col-md-3">
          <span className="text-secondary d-block fs-12">Vendor</span>
          <strong className="text-dark">{po.vendor}</strong>
        </div>
        <div className="col-6 col-md-3">
          <span className="text-secondary d-block fs-12">Order Reference</span>
          <strong className="text-dark">{po.orderRef}</strong>
        </div>
        <div className="col-6 col-md-3">
          <span className="text-secondary d-block fs-12">PO Date</span>
          <strong className="text-dark">{po.date}</strong>
        </div>
        <div className="col-6 col-md-3">
          <span className="text-secondary d-block fs-12">Expected Return</span>
          <strong className="text-dark">{po.expectedReturn}</strong>
        </div>
      </div>

      {/* Items Breakdown Table */}
      <div className="table-responsive mb-4">
        <table className="table table-hover align-middle mb-0 fs-13">
          <thead className="table-light text-secondary">
            <tr>
              <th>Article / Component</th>
              <th>Color</th>
              <th className="text-center">Pcs Sent</th>
              <th className="text-end">Rate/Pc</th>
              <th className="text-end">Total (₹)</th>
              <th className="text-center">Received</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((it) => (
              <tr key={it.id}>
                <td className="fw-medium">{it.article}</td>
                <td>{it.color}</td>
                <td className="text-center">{it.pcsSent}</td>
                <td className="text-end">₹{it.rate}</td>
                <td className="text-end fw-semibold">₹{it.total.toLocaleString()}</td>
                <td className="text-center text-success fw-bold">{it.received || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      <div className="p-3 bg-light rounded-3">
        <div className="fw-semibold text-secondary fs-13 mb-1">Special Instructions &amp; Notes</div>
        <div className="text-muted fs-13">{po.notes || 'None specified'}</div>
      </div>
    </div>
  );
}
