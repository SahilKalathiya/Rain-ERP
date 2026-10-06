import React, { useState } from 'react';

/**
 * StitchingInward - Record inward receipt and size-wise inspection from tailor
 */
export default function StitchingInward({ jobs = [], onBack, onSaveInward }) {
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || 'ST-2026-0001');
  const [vendorChallanNo, setVendorChallanNo] = useState('');
  const [receivedDate, setReceivedDate] = useState('01-10-2026');
  const [qualityNotes, setQualityNotes] = useState('');

  const [sizes, setSizes] = useState([
    { size: 'Size M', received: 150, aGrade: 145, bGrade: 5, rejected: 0 },
    { size: 'Size L', received: 150, aGrade: 148, bGrade: 2, rejected: 0 },
    { size: 'Size XL', received: 100, aGrade: 98, bGrade: 2, rejected: 0 }
  ]);

  const handleSizeChange = (idx, field, value) => {
    setSizes((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: Number(value) || 0 } : s))
    );
  };

  const currentJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalRec = sizes.reduce((sum, s) => sum + s.received, 0);
    const totalRej = sizes.reduce((sum, s) => sum + s.rejected, 0);

    const inwardData = {
      jobId: selectedJobId,
      vendorChallanNo: vendorChallanNo.trim() || `CH-ST-${Math.floor(1000 + Math.random() * 9000)}`,
      receivedDate,
      totalReceived: totalRec,
      totalRejected: totalRej,
      sizesBreakdown: sizes,
      notes: qualityNotes.trim()
    };

    if (onSaveInward) {
      onSaveInward(inwardData);
    }
  };

  return (
    <div
      className="card border-0 shadow-sm rounded-4 p-4 mb-4 mx-auto"
      style={{ maxWidth: '880px' }}
    >
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button
          type="button"
          className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center"
          style={{ width: '40px', height: '40px' }}
          onClick={onBack}
        >
          <i className="ti ti-arrow-left fs-18"></i>
        </button>
        <h3 className="fw-bold text-dark mb-0 fs-20">Stitching Inward</h3>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Stitching Job PO */}
        <div className="mb-4">
          <label className="form-label fw-semibold fs-13 text-secondary">
            Stitching Job PO *
          </label>
          <select
            className="form-select bg-light fs-13"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.id} - {job.vendor} - Sent: {job.totalSent}
              </option>
            ))}
          </select>
          {currentJob && (
            <div className="form-text fs-12 text-muted mt-1">
              Order Ref: <strong>{currentJob.orderRef}</strong> | Previously Received:{' '}
              <strong className="text-success">{currentJob.totalReceived}</strong>
            </div>
          )}
        </div>

        {/* Challan & Date */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold fs-13 text-secondary">
              Vendor Challan No *
            </label>
            <input
              type="text"
              required
              className="form-control bg-light fs-13"
              placeholder="e.g. CH-ST-4491"
              value={vendorChallanNo}
              onChange={(e) => setVendorChallanNo(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold fs-13 text-secondary">
              Received Date *
            </label>
            <input
              type="text"
              required
              className="form-control bg-light fs-13"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
            />
          </div>
        </div>

        {/* Size-wise Inspection Matrix */}
        <div className="card bg-white border rounded-3 p-3 mb-4 shadow-none">
          <h6 className="fw-bold text-dark mb-3 fs-14">
            Size-Wise Received &amp; Inspection Breakdown
          </h6>

          <div className="table-responsive">
            <table className="table table-borderless align-middle mb-0 fs-13">
              <thead className="table-light text-secondary">
                <tr>
                  <th style={{ width: '20%' }}>Size</th>
                  <th style={{ width: '20%' }}>Qty Received</th>
                  <th style={{ width: '20%' }}>A-Grade (Good)</th>
                  <th style={{ width: '20%' }}>B-Grade (Minor Alter)</th>
                  <th style={{ width: '20%' }}>Rejected</th>
                </tr>
              </thead>
              <tbody>
                {sizes.map((row, idx) => (
                  <tr key={row.size}>
                    <td className="fw-bold text-dark">{row.size}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm bg-light fs-13"
                        value={row.received}
                        onChange={(e) => handleSizeChange(idx, 'received', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm bg-light text-success fw-bold fs-13"
                        value={row.aGrade}
                        onChange={(e) => handleSizeChange(idx, 'aGrade', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm bg-light text-warning fw-bold fs-13"
                        value={row.bGrade}
                        onChange={(e) => handleSizeChange(idx, 'bGrade', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm bg-light text-danger fw-bold fs-13"
                        value={row.rejected}
                        onChange={(e) => handleSizeChange(idx, 'rejected', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quality Notes */}
        <div className="mb-4">
          <label className="form-label fw-semibold fs-13 text-secondary">
            Quality / Alteration Notes
          </label>
          <textarea
            rows="3"
            className="form-control bg-light fs-13"
            placeholder="Seam finish, thread ends trimming check, measurement compliance..."
            value={qualityNotes}
            onChange={(e) => setQualityNotes(e.target.value)}
          ></textarea>
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            className="btn btn-success d-flex align-items-center gap-2 px-4 py-2 fw-medium fs-14 shadow-sm"
          >
            <i className="ti ti-check fs-16"></i>
            <span>Record Stitching Inward</span>
          </button>
        </div>
      </form>
    </div>
  );
}
