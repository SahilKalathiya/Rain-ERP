import React, { useState } from 'react';
import {
  sampleOrders,
  sampleArticles,
  sampleColors
} from '../../data/initialData';

/**
 * SingleCutOrder - Create single piece / shortage / defect cut orders
 * Matches Screenshot 4: Single Cut Order
 */
export default function SingleCutOrder({ singleCuts = [], onBack, onCreateSingleCut }) {
  const [order, setOrder] = useState(sampleOrders[0]);
  const [article, setArticle] = useState(sampleArticles[0]);
  const [color, setColor] = useState(sampleColors[0]);
  const [reason, setReason] = useState('Shortage');
  const [size, setSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState('01-10-2026');
  const [reasonDetails, setReasonDetails] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    const newCut = {
      id: `SC-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
      orderRef: order,
      article,
      color,
      reason,
      size,
      quantity: Number(quantity),
      date,
      details: reasonDetails.trim() || 'Urgent cutting replacement requested for production line.',
      status: 'In Progress'
    };

    if (onCreateSingleCut) {
      onCreateSingleCut(newCut);
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Form Card */}
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
          <h3 className="fw-bold text-dark mb-0 fs-20">Single Cut Order</h3>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Order */}
          <div className="mb-4">
            <label className="form-label fw-semibold fs-13 text-secondary">Order *</label>
            <select
              className="form-select bg-light fs-13"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            >
              {sampleOrders.map((ord) => (
                <option key={ord} value={ord}>
                  {ord}
                </option>
              ))}
            </select>
          </div>

          {/* Row 1: Article & Color */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold fs-13 text-secondary">Article *</label>
              <select
                className="form-select bg-light fs-13"
                value={article}
                onChange={(e) => setArticle(e.target.value)}
              >
                {sampleArticles.map((art) => (
                  <option key={art} value={art}>
                    {art}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold fs-13 text-secondary">Color *</label>
              <select
                className="form-select bg-light fs-13"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              >
                {sampleColors.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Reason & Size */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold fs-13 text-secondary">Reason *</label>
              <select
                className="form-select bg-light fs-13"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="Shortage">Shortage</option>
                <option value="Fabric Defect">Fabric Defect</option>
                <option value="Printing Defect">Printing Defect</option>
                <option value="Sampling">Sampling</option>
                <option value="Rework / Alteration">Rework / Alteration</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold fs-13 text-secondary">Size *</label>
              <select
                className="form-select bg-light fs-13"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              >
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
          </div>

          {/* Row 3: Quantity & Date */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold fs-13 text-secondary">Quantity *</label>
              <input
                type="number"
                required
                min="1"
                className="form-control bg-light fs-13"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold fs-13 text-secondary">Date</label>
              <input
                type="text"
                className="form-control bg-light fs-13"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Reason Details */}
          <div className="mb-4">
            <label className="form-label fw-semibold fs-13 text-secondary">Reason Details</label>
            <textarea
              rows="3"
              className="form-control bg-light fs-13"
              placeholder="Provide specific shortage or defect details..."
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
            ></textarea>
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 fw-medium fs-14 shadow-sm"
            >
              <i className="ti ti-scissors fs-16"></i>
              <span>Create Single Cut</span>
            </button>
          </div>
        </form>
      </div>

      {/* History Log Table */}
      <div
        className="card border-0 shadow-sm rounded-4 p-4 mx-auto"
        style={{ maxWidth: '820px' }}
      >
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-bold text-dark mb-0 fs-16">Recent Single Cut Orders</h5>
          <span className="badge bg-light text-secondary border px-2 py-1 fs-12">
            {singleCuts.length} Orders
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-secondary">
              <tr>
                <th>Cut ID</th>
                <th>Order Ref</th>
                <th>Article / Color</th>
                <th>Size</th>
                <th>Qty</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {singleCuts.map((sc) => (
                <tr key={sc.id}>
                  <td className="fw-semibold text-primary">{sc.id}</td>
                  <td>{sc.orderRef.split(' ')[0]}</td>
                  <td>
                    {sc.article} ({sc.color})
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border">{sc.size}</span>
                  </td>
                  <td className="fw-bold">{sc.quantity} pcs</td>
                  <td>{sc.reason}</td>
                  <td>
                    <span
                      className={`badge px-2 py-1 ${
                        sc.status === 'Completed'
                          ? 'bg-success-subtle text-success'
                          : 'bg-warning-subtle text-warning'
                      }`}
                    >
                      {sc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
