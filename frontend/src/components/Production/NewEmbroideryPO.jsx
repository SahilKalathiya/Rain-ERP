import React, { useState } from 'react';
import {
  sampleOrders,
  sampleEmbroideryVendors,
  sampleArticles,
  sampleColors,
  sampleCutStock
} from '../../data/initialData';

/**
 * NewEmbroideryPO - Form to create a new Embroidery PO
 * Matches Screenshot 2: New Embroidery-After-Cut PO
 */
export default function NewEmbroideryPO({ onBack, onSave }) {
  const [order, setOrder] = useState(sampleOrders[0]);
  const [vendor, setVendor] = useState(sampleEmbroideryVendors[0]);
  const [embType, setEmbType] = useState('Computer Embroidery');
  const [designName, setDesignName] = useState('');
  const [poDate, setPoDate] = useState('01-10-2026');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState([
    {
      id: 1,
      article: sampleArticles[0],
      color: sampleColors[0],
      cutStock: sampleCutStock[0],
      pcsSent: 200,
      rate: 45
    }
  ]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        article: sampleArticles[0],
        color: sampleColors[0],
        cutStock: sampleCutStock[0],
        pcsSent: 100,
        rate: 40
      }
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const handleSubmit = (status = 'In Progress') => {
    const totalPcs = items.reduce((sum, it) => sum + (Number(it.pcsSent) || 0), 0);
    const totalAmt = items.reduce(
      (sum, it) => sum + (Number(it.pcsSent) || 0) * (Number(it.rate) || 0),
      0
    );

    const newPO = {
      id: `EMB-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      status,
      orderRef: order,
      vendor,
      embType,
      designName: designName.trim() || 'Custom Embroidery Motif',
      date: poDate,
      expectedReturn: expectedReturn || '10-10-2026',
      amount: `₹${totalAmt.toLocaleString('en-IN')}.00`,
      amountNum: totalAmt,
      totalSent: `${totalPcs} pcs`,
      totalSentNum: totalPcs,
      totalReceived: '0 pcs',
      totalReceivedNum: 0,
      items: items.map((it, idx) => ({
        id: `item-${idx + 1}`,
        article: it.article,
        color: it.color,
        cutStock: it.cutStock,
        pcsSent: Number(it.pcsSent) || 0,
        rate: Number(it.rate) || 0,
        total: (Number(it.pcsSent) || 0) * (Number(it.rate) || 0),
        received: 0
      })),
      notes
    };

    if (onSave) {
      onSave(newPO);
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 mx-auto" style={{ maxWidth: '980px' }}>
      {/* Header with Back button */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button
          type="button"
          className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center"
          style={{ width: '40px', height: '40px' }}
          onClick={onBack}
        >
          <i className="ti ti-arrow-left fs-18"></i>
        </button>
        <h3 className="fw-bold text-dark mb-0 fs-20">New Embroidery-After-Cut PO</h3>
      </div>

      {/* Main Form Fields */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-6">
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

        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold fs-13 text-secondary">Embroidery Vendor *</label>
          <select
            className="form-select bg-light fs-13"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
          >
            {sampleEmbroideryVendors.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold fs-13 text-secondary">Emb Type</label>
          <select
            className="form-select bg-light fs-13"
            value={embType}
            onChange={(e) => setEmbType(e.target.value)}
          >
            <option value="Computer Embroidery">Computer Embroidery</option>
            <option value="Aari">Aari</option>
            <option value="Hand Embroidery">Hand Embroidery</option>
            <option value="Sequins">Sequins</option>
          </select>
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold fs-13 text-secondary">Design Name *</label>
          <input
            type="text"
            className="form-control bg-light fs-13"
            placeholder="e.g. Floral Neck Pattern #42"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
          />
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold fs-13 text-secondary">PO Date</label>
          <input
            type="text"
            className="form-control bg-light fs-13"
            value={poDate}
            onChange={(e) => setPoDate(e.target.value)}
          />
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold fs-13 text-secondary">Expected Return</label>
          <div className="input-group">
            <input
              type="date"
              className="form-control bg-light fs-13"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Dynamic Items Table */}
      <div className="card bg-white border rounded-3 p-3 mb-4 shadow-none">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="fw-bold text-dark mb-0 fs-14">Items</h6>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm px-3 d-flex align-items-center gap-1"
            onClick={handleAddItem}
          >
            <i className="ti ti-plus fs-14"></i>
            <span>Add</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-borderless align-middle mb-0">
            <thead className="table-light fs-12 text-secondary">
              <tr>
                <th style={{ width: '25%' }}>Article</th>
                <th style={{ width: '20%' }}>Color</th>
                <th style={{ width: '25%' }}>Cut Pieces Stock</th>
                <th style={{ width: '15%' }}>Pcs Sent</th>
                <th style={{ width: '15%' }}>Rate/Pc</th>
                <th style={{ width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <select
                      className="form-select form-select-sm bg-light fs-13"
                      value={row.article}
                      onChange={(e) => handleItemChange(row.id, 'article', e.target.value)}
                    >
                      {sampleArticles.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm bg-light fs-13"
                      value={row.color}
                      onChange={(e) => handleItemChange(row.id, 'color', e.target.value)}
                    >
                      {sampleColors.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm bg-light fs-13"
                      value={row.cutStock}
                      onChange={(e) => handleItemChange(row.id, 'cutStock', e.target.value)}
                    >
                      {sampleCutStock.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm bg-light fs-13"
                      value={row.pcsSent}
                      onChange={(e) => handleItemChange(row.id, 'pcsSent', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm bg-light fs-13"
                      value={row.rate}
                      onChange={(e) => handleItemChange(row.id, 'rate', e.target.value)}
                    />
                  </td>
                  <td className="text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm text-danger p-0"
                        onClick={() => handleRemoveItem(row.id)}
                      >
                        <i className="ti ti-trash fs-16"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="form-label fw-semibold fs-13 text-secondary">Notes</label>
        <textarea
          rows="3"
          className="form-control bg-light fs-13"
          placeholder="Special embroidery notes, needle tension, color thread code..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        ></textarea>
      </div>

      {/* Action Buttons */}
      <div className="d-flex align-items-center justify-content-end gap-3">
        <button
          type="button"
          className="btn btn-light px-4 py-2 fw-medium fs-13"
          onClick={() => handleSubmit('Draft')}
        >
          Save Draft
        </button>
        <button
          type="button"
          className="btn btn-primary px-4 py-2 fw-medium fs-13 d-flex align-items-center gap-2"
          onClick={() => handleSubmit('In Progress')}
        >
          <i className="ti ti-send fs-14"></i>
          <span>Send to Vendor</span>
        </button>
      </div>
    </div>
  );
}
