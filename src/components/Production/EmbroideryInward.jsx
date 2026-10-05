import React, { useState } from 'react';

/**
 * EmbroideryInward - Record Inward receipt from embroidery vendor
 * Matches Screenshot 3: Embroidery Inward
 */
export default function EmbroideryInward({ orders = [], onBack, onSaveInward }) {
  const [selectedPoId, setSelectedPoId] = useState(orders[0]?.id || 'EMB-2026-0001');
  const [vendorChallanNo, setVendorChallanNo] = useState('');
  const [receivedDate, setReceivedDate] = useState('01-10-2026');
  const [piecesReceived, setPiecesReceived] = useState('');
  const [rejected, setRejected] = useState(0);
  const [qualityNotes, setQualityNotes] = useState('');

  const currentPO = orders.find((p) => p.id === selectedPoId) || orders[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!piecesReceived || Number(piecesReceived) <= 0) {
      alert('Please enter a valid number of pieces received.');
      return;
    }

    const inwardData = {
      poId: selectedPoId,
      vendorChallanNo: vendorChallanNo.trim() || `CH-${Math.floor(1000 + Math.random() * 9000)}`,
      receivedDate,
      piecesReceived: Number(piecesReceived),
      rejected: Number(rejected) || 0,
      qualityNotes: qualityNotes.trim()
    };

    if (onSaveInward) {
      onSaveInward(inwardData);
    }
  };

  return (
    <div
      className="card border-0 shadow-sm rounded-4 p-4 mb-4 mx-auto"
      style={{ maxWidth: '820px' }}
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
        <h3 className="fw-bold text-dark mb-0 fs-20">Embroidery Inward</h3>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Embroidery PO Selector */}
        <div className="mb-4">
          <label className="form-label fw-semibold fs-13 text-secondary">Embroidery PO *</label>
          <select
            className="form-select bg-light fs-13"
            value={selectedPoId}
            onChange={(e) => setSelectedPoId(e.target.value)}
          >
            {orders.map((po) => (
              <option key={po.id} value={po.id}>
                {po.id} - {po.vendor} ({po.designName}) - Sent: {po.totalSent}
              </option>
            ))}
          </select>
          {currentPO && (
            <div className="form-text fs-12 text-muted mt-1">
              Order Ref: <strong>{currentPO.orderRef}</strong> | Previously Received:{' '}
              <strong className="text-success">{currentPO.totalReceived}</strong>
            </div>
          )}
        </div>

        {/* Row 1: Challan & Date */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold fs-13 text-secondary">
              Vendor Challan No *
            </label>
            <input
              type="text"
              required
              className="form-control bg-light fs-13"
              placeholder="e.g. CH-SUR-8841"
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

        {/* Row 2: Pieces Received & Rejected */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold fs-13 text-secondary">
              Total Pieces Received *
            </label>
            <input
              type="number"
              required
              min="1"
              className="form-control bg-light fs-13"
              placeholder="e.g. 250"
              value={piecesReceived}
              onChange={(e) => setPiecesReceived(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold fs-13 text-secondary">Rejected</label>
            <input
              type="number"
              min="0"
              className="form-control bg-light fs-13"
              value={rejected}
              onChange={(e) => setRejected(e.target.value)}
            />
          </div>
        </div>

        {/* Quality Notes */}
        <div className="mb-4">
          <label className="form-label fw-semibold fs-13 text-secondary">Quality Notes</label>
          <textarea
            rows="3"
            className="form-control bg-light fs-13"
            placeholder="Stitch density check, thread trim condition, zero burn marks..."
            value={qualityNotes}
            onChange={(e) => setQualityNotes(e.target.value)}
          ></textarea>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="btn btn-success d-flex align-items-center gap-2 px-4 py-2 fw-medium fs-14 shadow-sm"
          >
            <i className="ti ti-check fs-16"></i>
            <span>Record Inward</span>
          </button>
        </div>
      </form>
    </div>
  );
}
