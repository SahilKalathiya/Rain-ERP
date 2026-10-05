import React from 'react';

/**
 * StitchingJobDetail - Detailed view of a Stitching / Tailoring Job
 */
export default function StitchingJobDetail({ job, onBack, onRecordInward }) {
  if (!job) {
    return (
      <div className="card p-4 text-center">
        <p>Job details not found.</p>
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
      {/* Header */}
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
              <h3 className="fw-bold text-dark mb-0 fs-20">{job.id}</h3>
              <span
                className={`badge px-2 py-1 fs-12 ${
                  job.status === 'Completed'
                    ? 'bg-success-subtle text-success'
                    : job.status === 'In Progress'
                    ? 'bg-primary-subtle text-primary'
                    : 'bg-warning-subtle text-warning'
                }`}
              >
                {job.status}
              </span>
            </div>
            <p className="text-secondary mb-0 fs-13">
              {job.vendor} • Rate: ₹{job.ratePerPc || 45}/pc
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-success d-flex align-items-center gap-2 px-3 py-2 fw-medium fs-13"
            onClick={() => onRecordInward && onRecordInward(job.id)}
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
            <span>Print Job Order</span>
          </button>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="row g-3 p-3 bg-light rounded-3 mb-4 fs-13">
        <div className="col-6 col-md-3">
          <span className="text-secondary d-block fs-12">Tailoring Vendor</span>
          <strong className="text-dark">{job.vendor}</strong>
        </div>
        <div className="col-6 col-md-3">
          <span className="text-secondary d-block fs-12">Order Reference</span>
          <strong className="text-dark">{job.orderRef}</strong>
        </div>
        <div className="col-6 col-md-3">
          <span className="text-secondary d-block fs-12">Job Date</span>
          <strong className="text-dark">{job.date}</strong>
        </div>
        <div className="col-6 col-md-3">
          <span className="text-secondary d-block fs-12">Expected Return</span>
          <strong className="text-dark">{job.expectedReturn}</strong>
        </div>
      </div>

      {/* Items Breakdown Table */}
      <div className="table-responsive mb-4">
        <table className="table table-hover align-middle mb-0 fs-13">
          <thead className="table-light text-secondary">
            <tr>
              <th>Article</th>
              <th>Color</th>
              <th className="text-center">Cut Pieces Sent</th>
              <th className="text-end">Stitching Rate</th>
              <th className="text-end">Total Cost</th>
              <th className="text-center">Received</th>
            </tr>
          </thead>
          <tbody>
            {job.items.map((it) => (
              <tr key={it.id}>
                <td className="fw-medium">{it.article}</td>
                <td>{it.color}</td>
                <td className="text-center">{it.pcsSent} pcs</td>
                <td className="text-end">₹{it.rate}</td>
                <td className="text-end fw-semibold">₹{it.total.toLocaleString()}</td>
                <td className="text-center text-success fw-bold">{it.received || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <div className="p-3 bg-light rounded-3">
        <div className="fw-semibold text-secondary fs-13 mb-1">
          Tailoring Specifications &amp; Instructions
        </div>
        <div className="text-muted fs-13">{job.notes || 'None specified'}</div>
      </div>
    </div>
  );
}
