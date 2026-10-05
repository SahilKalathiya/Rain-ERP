import React, { useState, useEffect } from 'react';
import VendorMasterView from './VendorMasterView';
import FabricMasterView from './FabricMasterView';

/**
 * PurchaseOrderForm - 4.0 Purchase Order (PO) Module
 * Handles: Multi-line fabric items, Fabric-restricted widths, Buffer % toggle,
 * live auto-calculated line amounts and total, no spinner arrows,
 * View mode by default with section-wise edit, and inline Master creation.
 */
export default function PurchaseOrderForm({
  po,
  vendors = [],
  fabrics = [],
  onBack,
  onSavePO,
  onPrintPO
}) {
  const isExisting = Boolean(po && po.id);

  // View Mode by default (9.2): If viewing existing PO, start in read-only mode
  const [isEditing, setIsEditing] = useState(!isExisting);
  const [activeSection, setActiveSection] = useState(isExisting ? 'none' : 'all'); // 'all', 'header', 'items', 'terms'

  // Form State
  const [formData, setFormData] = useState({
    id: po?.id || `PO-${String(Math.floor(1000 + Math.random() * 9000))}`,
    date: po?.date || new Date().toISOString().split('T')[0],
    vendorId: po?.vendorId || vendors[0]?.id || '',
    vendorName: po?.vendorName || vendors[0]?.name || '',
    expectedDeliveryDate: po?.expectedDeliveryDate || '',
    bufferAllowed: po?.bufferAllowed || false,
    bufferPercent: po?.bufferPercent || 0,
    status: po?.status || 'Draft',
    terms:
      po?.terms ||
      'Payment within 20 days. Claims for shortage/quality to be notified within 24 hours of receipt.',
    items: po?.items || [
      {
        id: 'item-1',
        fabricId: fabrics[0]?.id || '',
        fabricName: fabrics[0]?.qualityName || '',
        width: fabrics[0]?.widths?.[0] || '44',
        quantity: '',
        rate: '',
        fold: 97,
        amount: 0
      }
    ]
  });

  // Modals for Inline Master Creation (8.1)
  const [showInlineVendorModal, setShowInlineVendorModal] = useState(false);
  const [showInlineFabricModal, setShowInlineFabricModal] = useState(false);

  // Sync vendor name when vendorId changes
  const handleVendorChange = (vId) => {
    const v = vendors.find((vend) => vend.id === vId);
    setFormData((prev) => ({
      ...prev,
      vendorId: vId,
      vendorName: v ? v.name : ''
    }));
  };

  // Add line item
  const handleAddItem = () => {
    const firstFabric = fabrics[0];
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}`,
          fabricId: firstFabric?.id || '',
          fabricName: firstFabric?.qualityName || '',
          width: firstFabric?.widths?.[0] || '44',
          quantity: '',
          rate: '',
          fold: 97,
          amount: 0
        }
      ]
    }));
  };

  // Remove line item
  const handleRemoveItem = (id) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id)
    }));
  };

  // Line item change
  const handleItemChange = (id, field, value) => {
    setFormData((prev) => {
      const updatedItems = prev.items.map((it) => {
        if (it.id !== id) return it;

        const updated = { ...it, [field]: value };

        // 8.2: When fabric changes, reset width to that fabric's saved widths list!
        if (field === 'fabricId') {
          const matchedFabric = fabrics.find((f) => f.id === value);
          updated.fabricName = matchedFabric ? matchedFabric.qualityName : '';
          updated.width = matchedFabric?.widths?.[0] || '44';
        }

        // Live calculation of amount = quantity * rate
        const q = Number(field === 'quantity' ? value : it.quantity) || 0;
        const r = Number(field === 'rate' ? value : it.rate) || 0;
        updated.amount = Math.round(q * r * 100) / 100;

        return updated;
      });

      return { ...prev, items: updatedItems };
    });
  };

  // Live PO Total
  const poTotalAmount = formData.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  // Submit PO
  const handleSubmit = (finalStatus) => {
    if (!formData.vendorId) {
      alert('Please select a Vendor.');
      return;
    }

    const payload = {
      ...formData,
      status: finalStatus || formData.status,
      totalAmount: poTotalAmount,
      items: formData.items.map((it) => ({
        ...it,
        quantity: Number(it.quantity) || 0,
        rate: Number(it.rate) || 0,
        fold: Number(it.fold) || 100,
        amount: Number(it.amount) || 0
      }))
    };

    if (onSavePO) {
      onSavePO(payload);
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Top Action Bar */}
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
              <h3 className="fw-bold text-dark mb-0 fs-20">
                {isExisting ? `Purchase Order ${formData.id}` : 'Create Purchase Order (PO)'}
              </h3>
              <span
                className={`badge px-2 py-1 fs-12 ${
                  formData.status === 'Completed'
                    ? 'bg-success-subtle text-success'
                    : formData.status === 'Partially Received'
                    ? 'bg-info-subtle text-info'
                    : formData.status === 'Sent'
                    ? 'bg-primary-subtle text-primary'
                    : 'bg-warning-subtle text-warning'
                }`}
              >
                {formData.status}
              </span>
            </div>
            <p className="text-secondary mb-0 fs-13">Raw Material Fabric Procurement</p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {isExisting && (
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 fw-medium fs-13 rounded-3"
              onClick={() => onPrintPO && onPrintPO(formData)}
            >
              <i className="ti ti-printer fs-16"></i>
              <span>Print PO</span>
            </button>
          )}

          {isExisting && !isEditing ? (
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium fs-13 rounded-3"
              onClick={() => {
                setIsEditing(true);
                setActiveSection('all');
              }}
            >
              <i className="ti ti-edit fs-16"></i>
              <span>Edit Record</span>
            </button>
          ) : (
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-light px-3 py-2 fw-medium fs-13"
                onClick={() => handleSubmit('Draft')}
              >
                Save as Draft
              </button>
              <button
                type="button"
                className="btn btn-outline-primary px-3 py-2 fw-medium fs-13"
                onClick={() => handleSubmit('Save')}
              >
                Save
              </button>
              <button
                type="button"
                className="btn btn-primary px-3 py-2 fw-medium fs-13 d-flex align-items-center gap-1 shadow-sm"
                onClick={() => handleSubmit('Sent')}
              >
                <i className="ti ti-send fs-14"></i>
                <span>Send to Vendor</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main PO Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        {/* SECTION 1: PO Header Details */}
        <div className="mb-4 p-3 bg-light rounded-3">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <span className="fw-bold text-secondary fs-12 text-uppercase tracking-wider">
              1. Header &amp; Vendor Information
            </span>
            {isExisting && !isEditing && (
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-primary fs-12 text-decoration-none"
                onClick={() => {
                  setIsEditing(true);
                  setActiveSection('header');
                }}
              >
                Edit Section
              </button>
            )}
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-3">
              <label className="form-label fs-12 fw-semibold mb-1">PO No.</label>
              <div className="fw-bold text-primary font-monospace fs-14">{formData.id}</div>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label fs-12 fw-semibold mb-1">PO Date *</label>
              {isEditing ? (
                <input
                  type="date"
                  className="form-control form-control-sm bg-white fs-13"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              ) : (
                <div className="text-dark fs-13">{formData.date}</div>
              )}
            </div>

            <div className="col-12 col-md-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label fs-12 fw-semibold mb-0">Vendor *</label>
                {isEditing && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-primary fs-11 text-decoration-none"
                    onClick={() => setShowInlineVendorModal(true)}
                  >
                    + New
                  </button>
                )}
              </div>
              {isEditing ? (
                <select
                  className="form-select form-select-sm bg-white fs-13"
                  value={formData.vendorId}
                  onChange={(e) => handleVendorChange(e.target.value)}
                >
                  {vendors
                    .filter((v) => v.active || v.id === formData.vendorId)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.city})
                      </option>
                    ))}
                </select>
              ) : (
                <div className="fw-semibold text-dark fs-14">{formData.vendorName}</div>
              )}
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label fs-12 fw-semibold mb-1">Expected Delivery Date</label>
              {isEditing ? (
                <input
                  type="date"
                  className="form-control form-control-sm bg-white fs-13"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedDeliveryDate: e.target.value })
                  }
                />
              ) : (
                <div className="text-dark fs-13">{formData.expectedDeliveryDate || 'Not specified'}</div>
              )}
            </div>

            {/* Buffer Configuration (Section 4.1 & 8.2) */}
            <div className="col-12 border-top pt-2 mt-2">
              <div className="d-flex flex-wrap align-items-center gap-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="bufferToggle"
                    disabled={!isEditing}
                    checked={formData.bufferAllowed}
                    onChange={(e) =>
                      setFormData({ ...formData, bufferAllowed: e.target.checked })
                    }
                  />
                  <label className="form-check-label fs-13 fw-medium text-dark" htmlFor="bufferToggle">
                    Buffer Quantity (+/−) Allowed
                  </label>
                </div>

                {formData.bufferAllowed && (
                  <div className="d-flex align-items-center gap-2">
                    <label className="fs-12 fw-semibold text-secondary mb-0">Buffer Tolerance:</label>
                    {isEditing ? (
                      <div className="input-group input-group-sm" style={{ width: '120px' }}>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="e.g. 5.0"
                          className="form-control form-control-sm bg-white no-spinner text-end"
                          value={formData.bufferPercent || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, bufferPercent: Number(e.target.value) })
                          }
                        />
                        <span className="input-group-text bg-white">%</span>
                      </div>
                    ) : (
                      <span className="badge bg-info-subtle text-info fw-bold fs-12">
                        ±{formData.bufferPercent}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="form-text fs-11 text-muted">
                When enabled, GRN delivery within ±{formData.bufferPercent || 0}% will be accepted
                automatically without requiring Admin variance sign-off.
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Fabric Line Items (4.1 & 8.2) */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="fw-bold text-dark mb-0 fs-15">Fabric Line Items</h6>
            {isEditing && (
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-2 py-1 fs-12"
                  onClick={() => setShowInlineFabricModal(true)}
                >
                  + New Fabric
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm px-3 py-1 d-flex align-items-center gap-1 fs-12"
                  onClick={handleAddItem}
                >
                  <i className="ti ti-plus fs-14"></i>
                  <span>Add Line</span>
                </button>
              </div>
            )}
          </div>

          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0 fs-13">
              <thead className="table-light text-secondary">
                <tr>
                  <th style={{ width: '30%' }}>Fabric Quality *</th>
                  <th style={{ width: '15%' }}>Width (Panna) *</th>
                  <th style={{ width: '15%' }} className="text-end">
                    Quantity (Mtrs) *
                  </th>
                  <th style={{ width: '15%' }} className="text-end">
                    Rate / Mtr (₹) *
                  </th>
                  <th style={{ width: '10%' }} className="text-center">
                    Fold %
                  </th>
                  <th style={{ width: '15%' }} className="text-end">
                    Amount (₹)
                  </th>
                  {isEditing && <th style={{ width: '5%' }}></th>}
                </tr>
              </thead>
              <tbody>
                {formData.items.map((row) => {
                  const currentFabric = fabrics.find((f) => f.id === row.fabricId);
                  const allowedWidths = currentFabric?.widths || ['44'];

                  return (
                    <tr key={row.id}>
                      {/* Fabric Dropdown */}
                      <td>
                        {isEditing ? (
                          <select
                            className="form-select form-select-sm bg-light fs-13"
                            value={row.fabricId}
                            onChange={(e) => handleItemChange(row.id, 'fabricId', e.target.value)}
                          >
                            {fabrics
                              .filter((f) => f.active || f.id === row.fabricId)
                              .map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.qualityName} ({f.fabricType})
                                </option>
                              ))}
                          </select>
                        ) : (
                          <div className="fw-medium text-dark">{row.fabricName}</div>
                        )}
                      </td>

                      {/* Width Dropdown (Restricted to Fabric's Saved Widths only) */}
                      <td>
                        {isEditing ? (
                          <select
                            className="form-select form-select-sm bg-light fs-13"
                            value={row.width}
                            onChange={(e) => handleItemChange(row.id, 'width', e.target.value)}
                          >
                            {allowedWidths.map((w) => (
                              <option key={w} value={w}>
                                {w} Inch
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div>{row.width}"</div>
                        )}
                      </td>

                      {/* Quantity (no spinner, placeholder example) */}
                      <td className="text-end">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 10415.25"
                            className="form-control form-control-sm bg-light text-end fs-13 no-spinner"
                            value={row.quantity}
                            onChange={(e) => handleItemChange(row.id, 'quantity', e.target.value)}
                          />
                        ) : (
                          <div className="fw-semibold">
                            {Number(row.quantity).toLocaleString()} Mtrs
                          </div>
                        )}
                      </td>

                      {/* Rate (no spinner, placeholder example) */}
                      <td className="text-end">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 25.47"
                            className="form-control form-control-sm bg-light text-end fs-13 no-spinner"
                            value={row.rate}
                            onChange={(e) => handleItemChange(row.id, 'rate', e.target.value)}
                          />
                        ) : (
                          <div>₹{Number(row.rate).toFixed(2)}</div>
                        )}
                      </td>

                      {/* Fold % */}
                      <td className="text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            step="1"
                            placeholder="97"
                            className="form-control form-control-sm bg-light text-center fs-13 no-spinner"
                            value={row.fold}
                            onChange={(e) => handleItemChange(row.id, 'fold', e.target.value)}
                          />
                        ) : (
                          <div>{row.fold || 100}%</div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="text-end fw-bold text-dark fs-14">
                        ₹{(Number(row.amount) || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>

                      {/* Delete */}
                      {isEditing && (
                        <td className="text-center">
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-sm text-danger p-0"
                              onClick={() => handleRemoveItem(row.id)}
                            >
                              <i className="ti ti-trash fs-16"></i>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td colSpan="5" className="text-end fw-bold fs-14">
                    PO Total Amount:
                  </td>
                  <td className="text-end fw-bold text-primary fs-16">
                    ₹{poTotalAmount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  {isEditing && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* SECTION 3: Terms & Conditions */}
        <div className="p-3 bg-light rounded-3">
          <label className="form-label fs-12 fw-semibold text-secondary mb-1">
            Terms &amp; Conditions (Auto-capitalised)
          </label>
          {isEditing ? (
            <textarea
              rows="3"
              className="form-control bg-white fs-13"
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            ></textarea>
          ) : (
            <div className="text-secondary fs-13">{formData.terms || 'Standard vendor terms.'}</div>
          )}
        </div>
      </div>

      {/* Inline Modal: Vendor Master Creation */}
      {showInlineVendorModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 p-3">
              <VendorMasterView
                vendors={vendors}
                isInline={true}
                onCloseInline={(newCreatedVendor) => {
                  if (newCreatedVendor) {
                    handleVendorChange(newCreatedVendor.id);
                  }
                  setShowInlineVendorModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Inline Modal: Fabric Master Creation */}
      {showInlineFabricModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 p-3">
              <FabricMasterView
                fabrics={fabrics}
                isInline={true}
                onCloseInline={(newCreatedFabric) => {
                  setShowInlineFabricModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
