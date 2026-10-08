import React, { useState } from 'react';

/**
 * StitchingJobsList - "Stitching Jobs" View
 * Matches Screenshot 5: Tailoring Orders
 */
export default function StitchingJobsList({
  jobs = [],
  onNewJob,
  onRecordInward,
  onViewDetails
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      searchTerm === '' ||
      job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.orderRef.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All Status' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container-fluid p-0">
      {/* Header & Breadcrumb */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-muted fs-12">
              <li className="breadcrumb-item">Production</li>
              <li className="breadcrumb-item active text-primary fw-medium" aria-current="page">
                Stitching Jobs
              </li>
            </ol>
          </nav>
          <h2 className="fw-bold text-dark mb-1 fs-24">Stitching Jobs</h2>
          <p className="text-secondary mb-0 fs-13">Tailoring Orders</p>
        </div>

        {/* Top Actions */}
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
            onClick={onNewJob}
          >
            <i className="ti ti-plus fs-16"></i>
            <span>New Job Order</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-8">
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
                  placeholder="Search job number, vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-md-4">
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

      {/* Jobs List */}
      <div className="d-flex flex-column gap-3">
        {filteredJobs.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-3 p-5 text-center">
            <div className="mb-3 text-muted">
              <i className="ti ti-needle-off fs-40"></i>
            </div>
            <h5 className="fw-semibold text-secondary">No stitching jobs found</h5>
            <p className="text-muted fs-13">Create your first tailoring order to start production.</p>
            <div>
              <button className="btn btn-primary btn-sm px-3" onClick={onNewJob}>
                + Create New Job Order
              </button>
            </div>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="card border-0 shadow-sm rounded-3 p-3 transition-all hover-shadow"
            >
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-dark fs-16">{job.id}</span>
                  <span
                    className={`badge px-2 py-1 fs-12 fw-medium ${
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

                <div className="text-end">
                  <div className="fw-bold text-dark fs-17">{job.amount}</div>
                  <div className="text-muted fs-12">{job.totalSent} sent</div>
                </div>
              </div>

              <div className="mb-2">
                <h5 className="fw-semibold text-primary mb-1 fs-15">{job.vendor}</h5>
                <div className="text-muted fs-13 d-flex flex-wrap align-items-center gap-3">
                  <span>
                    <i className="ti ti-file-text me-1"></i>
                    {job.orderRef}
                  </span>
                  <span>•</span>
                  <span>
                    Rate: <strong>₹{job.ratePerPc || 45}/pc</strong>
                  </span>
                </div>
              </div>

              <hr className="my-2 text-muted opacity-25" />

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-1">
                <div className="d-flex flex-wrap align-items-center gap-4 text-muted fs-12">
                  <span>
                    <i className="ti ti-calendar me-1"></i>
                    Job Date: <strong>{job.date}</strong>
                  </span>
                  <span>
                    <i className="ti ti-calendar-time me-1"></i>
                    Expected: <strong>{job.expectedReturn}</strong>
                  </span>
                  <span>
                    <i className="ti ti-check me-1"></i>
                    Received: <strong className="text-success">{job.totalReceived}</strong>
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm px-3 py-1 d-flex align-items-center gap-1"
                    onClick={() => onRecordInward && onRecordInward(job.id)}
                  >
                    <i className="ti ti-arrow-down-left fs-14"></i>
                    <span>Inward</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm px-3 py-1 d-flex align-items-center gap-1"
                    onClick={() => onViewDetails && onViewDetails(job.id)}
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
