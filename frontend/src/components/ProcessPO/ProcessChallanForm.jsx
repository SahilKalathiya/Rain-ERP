import React, { useState } from 'react';
import { initialVendors } from '../../data/procurementData';

/**
 * ProcessChallanForm - Dispatch to Job Work Vendor
 * Implementation of Section 4 of PDF Specification (Bale/Roll stock allocation,
 * FIFO, Single Batch rule, Cut Pieces vs Full Roll, Emergency Dispatch without PO)
 */
export default function ProcessChallanForm({ availablePOs = [], onSave, onCancel, initialChallan }) {
  const isEditing = Boolean(initialChallan);

  const [challanNumber, setChallanNumber] = useState(initialChallan?.challan_number || `${Math.floor(4000 + Math.random() * 1000)}`);
  const [date, setDate] = useState(initialChallan?.date || new Date().toISOString().split('T')[0]);
  const [vendorId, setVendorId] = useState(initialChallan?.vendor_id || 'VEND-0003');
  const [vendorName, setVendorName] = useState(initialChallan?.vendor_name || 'Raju Dyeing (Krishna Dyeing)');
  
  // Linked POs (Multi-select) or Emergency Dispatch
  const [isEmergencyDispatch, setIsEmergencyDispatch] = useState(
    initialChallan ? initialChallan.po_link_status === 'Pending PO Link' : false
  );
  const [selectedPOs, setSelectedPOs] = useState(initialChallan?.linked_pos || ['PPO-7611', 'PPO-7612', 'PPO-7613']);
  
  const [foldingNotation, setFoldingNotation] = useState(initialChallan?.folding_notation || 'L100');
  const [remarks, setRemarks] = useState(initialChallan?.remarks || 'Fab. issue for dyeing. Handed over to vendor tempo driver.');
  const [companyRep, setCompanyRep] = useState(initialChallan?.company_representative || 'Anurag');
  const [receiverSignature, setReceiverSignature] = useState(initialChallan?.receiver_signature || 'Raju Dyeing Driver');

  // Warehouse Bales / Stock Allocation Table
  const [items, setItems] = useState(initialChallan?.items || [
    { id: 1, bale_roll_no: 'Roll 12304', fabric_name: '100x100 Voile (Grey)', color_name: 'Off White', invoice_no: 'INV-MS-0091', original_piece_meters: 1065.50, dispatched_meters: 1065.50, is_partial_cut: false, folding: 'L100' },
    { id: 2, bale_roll_no: 'Roll 2376-A', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', original_piece_meters: 119.30, dispatched_meters: 119.30, is_partial_cut: false, folding: 'L100' },
    { id: 3, bale_roll_no: 'Roll 2376-B', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', original_piece_meters: 111.00, dispatched_meters: 111.00, is_partial_cut: false, folding: 'L100' },
    { id: 4, bale_roll_no: 'Roll 2376-C', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', original_piece_meters: 78.40, dispatched_meters: 78.40, is_partial_cut: false, folding: 'L100' },
    { id: 5, bale_roll_no: 'Roll 2376-D', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', original_piece_meters: 97.80, dispatched_meters: 97.80, is_partial_cut: false, folding: 'L100' },
    { id: 6, bale_roll_no: 'Roll 2376-E', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', original_piece_meters: 113.30, dispatched_meters: 113.30, is_partial_cut: false, folding: 'L100' },
    { id: 7, bale_roll_no: 'Roll 2376-F (Cut)', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', original_piece_meters: 134.00, dispatched_meters: 20.00, is_partial_cut: true, folding: 'L100' }
  ]);

  const togglePOSelection = (poId) => {
    if (selectedPOs.includes(poId)) {
      setSelectedPOs(selectedPOs.filter(p => p !== poId));
    } else {
      setSelectedPOs([...selectedPOs, poId]);
    }
  };

  const handleItemFieldChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addStockPiece = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        bale_roll_no: `Roll ${Math.floor(2000 + Math.random() * 8000)}`,
        fabric_name: '100x100 Voile (Grey)',
        color_name: 'Beige',
        invoice_no: 'INV-MS-0091',
        original_piece_meters: 100.00,
        dispatched_meters: 100.00,
        is_partial_cut: false,
        folding: foldingNotation
      }
    ]);
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const grandTotalMeters = items.reduce((acc, it) => acc + (parseFloat(it.dispatched_meters) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const challanPayload = {
      id: initialChallan?.id || `PCH-${challanNumber}`,
      challan_number: challanNumber,
      date,
      vendor_id: vendorId,
      vendor_name: vendorName,
      linked_pos: isEmergencyDispatch ? [] : selectedPOs,
      styles_info: ['Graphic Boota Kurta', 'Stock Cambric Plain'],
      po_link_status: isEmergencyDispatch ? 'Pending PO Link' : 'Linked',
      admin_alert_triggered: isEmergencyDispatch,
      folding_notation: foldingNotation,
      total_bales: 1,
      total_pieces: items.length,
      grand_total_meters: Number(grandTotalMeters.toFixed(2)),
      remarks,
      receiver_signature: receiverSignature,
      company_representative: companyRep,
      status: initialChallan?.status || 'Dispatched',
      created_by: initialChallan?.created_by || 'Saksham Garg',
      created_at: initialChallan?.created_at || new Date().toISOString(),
      items
    };
    onSave(challanPayload);
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
        <div>
          <h5 className="card-title mb-0 fw-bold text-dark">
            <i className="ti ti-truck-delivery me-2 text-primary"></i>
            {isEditing ? `Edit Job Challan #${challanNumber}` : 'Create Job Challan (Fabric Dispatch to Vendor)'}
          </h5>
          <small className="text-muted">
            Physically travels with the fabric rolls/bales to the job work vendor
          </small>
        </div>
        <button type="button" className="btn btn-light btn-sm border" onClick={onCancel}>
          <i className="ti ti-x me-1"></i> Close
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card-body p-4">
          {/* Emergency Dispatch Alert (Section 4.3) */}
          {isEmergencyDispatch && (
            <div className="alert alert-danger border-danger d-flex align-items-center py-2 mb-3" role="alert">
              <i className="ti ti-alert-triangle-filled fs-4 me-2 text-danger"></i>
              <div>
                <strong>EMERGENCY DISPATCH WARNING (Pending PO Link):</strong> This challan is being issued without a Process PO.
                An Admin Approval Alert is triggered and will remain visible until a valid PO is linked!
              </div>
            </div>
          )}

          {/* Section 1: Linked Process POs Multi-Select */}
          <div className="p-3 mb-4 rounded border bg-light">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-dark text-uppercase small">
                <i className="ti ti-checkbox me-1 text-primary"></i> 1. Bundle Process PO(s) on this Challan
              </span>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="emergencySwitch"
                  checked={isEmergencyDispatch}
                  onChange={(e) => setIsEmergencyDispatch(e.target.checked)}
                />
                <label className="form-check-label small fw-semibold text-danger" htmlFor="emergencySwitch">
                  Emergency Dispatch (No PO)
                </label>
              </div>
            </div>

            {!isEmergencyDispatch ? (
              <div>
                <p className="small text-muted mb-2">
                  One Challan can bundle multiple Process POs across different colours/styles for the same vendor shipment:
                </p>
                <div className="d-flex flex-wrap gap-2">
                  {availablePOs.map((po) => {
                    const isSelected = selectedPOs.includes(po.id);
                    return (
                      <div
                        key={po.id}
                        className={`badge p-2 border cursor-pointer ${isSelected ? 'bg-primary text-white border-primary' : 'bg-white text-dark'}`}
                        style={{ cursor: 'pointer', fontSize: '12px' }}
                        onClick={() => togglePOSelection(po.id)}
                      >
                        <i className={`ti ${isSelected ? 'ti-check' : 'ti-plus'} me-1`}></i>
                        <strong>PO #{po.po_number || po.id}</strong> — {po.vendor_name} ({po.total_meters}m)
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="small text-danger mb-0">
                ⚠️ No PO linked. Goods will leave godown immediately. You must link a PO retrospectively.
              </p>
            )}
          </div>

          {/* Section 2: Header Metadata */}
          <div className="row g-3 mb-4">
            <div className="col-md-2">
              <label className="form-label small fw-bold">Challan Number *</label>
              <input
                type="text"
                className="form-control form-control-sm fw-bold text-danger"
                value={challanNumber}
                onChange={(e) => setChallanNumber(e.target.value)}
                required
              />
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-bold">Dispatch Date *</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-bold">Job Work Vendor *</label>
              <select
                className="form-select form-select-sm"
                value={vendorId}
                onChange={(e) => {
                  setVendorId(e.target.value);
                  const v = initialVendors.find(vend => vend.id === e.target.value);
                  if (v) setVendorName(v.name);
                }}
              >
                {initialVendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-bold">Folding Notation</label>
              <input
                type="text"
                className="form-control form-control-sm text-center"
                value={foldingNotation}
                onChange={(e) => setFoldingNotation(e.target.value)}
                placeholder="e.g. L100 / Fold 98"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-bold">Company Representative *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={companyRep}
                onChange={(e) => setCompanyRep(e.target.value)}
                placeholder="e.g. Anurag"
                required
              />
            </div>
          </div>

          {/* Section 3: Stock Allocation from Warehouse Bales/Rolls (Section 4.2 & 4.4) */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <span className="fw-bold text-dark text-uppercase small">
                  <i className="ti ti-layers-subtract me-1 text-primary"></i> 2. Stock Allocation (Bales / Rolls Dispatch)
                </span>
                <span className="badge bg-success-subtle text-success border border-success ms-2">
                  <i className="ti ti-check me-1"></i> FIFO Prioritised
                </span>
                <span className="badge bg-info-subtle text-info border border-info ms-1">
                  Single Batch Rule Active
                </span>
              </div>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={addStockPiece}>
                <i className="ti ti-plus me-1"></i> + Select Stock Bale / Cut Piece
              </button>
            </div>

            <div className="table-responsive border rounded">
              <table className="table table-sm table-bordered align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="table-light text-center">
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Bale / Roll No *</th>
                    <th>Fabric Quality</th>
                    <th>Color</th>
                    <th>Stock Invoice Ref</th>
                    <th style={{ width: '110px' }}>Type</th>
                    <th style={{ width: '120px' }}>Original (m)</th>
                    <th style={{ width: '120px' }} className="table-primary text-primary">Dispatched (m) *</th>
                    <th style={{ width: '90px' }}>Folding</th>
                    <th style={{ width: '40px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="text-center fw-bold">{idx + 1}</td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm fw-bold"
                          value={it.bale_roll_no}
                          onChange={(e) => handleItemFieldChange(idx, 'bale_roll_no', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={it.fabric_name}
                          onChange={(e) => handleItemFieldChange(idx, 'fabric_name', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={it.color_name}
                          onChange={(e) => handleItemFieldChange(idx, 'color_name', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm text-center"
                          value={it.invoice_no}
                          onChange={(e) => handleItemFieldChange(idx, 'invoice_no', e.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        {it.is_partial_cut ? (
                          <span className="badge bg-warning text-dark border">
                            <i className="ti ti-scissors me-1"></i> Cut Piece
                          </span>
                        ) : (
                          <span className="badge bg-light text-dark border">Full Roll</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm text-end"
                          value={it.original_piece_meters}
                          onChange={(e) => handleItemFieldChange(idx, 'original_piece_meters', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm text-end fw-bold border-primary"
                          value={it.dispatched_meters}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleItemFieldChange(idx, 'dispatched_meters', val);
                            if (val < it.original_piece_meters) {
                              handleItemFieldChange(idx, 'is_partial_cut', true);
                            } else {
                              handleItemFieldChange(idx, 'is_partial_cut', false);
                            }
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm text-center"
                          value={it.folding || 'L100'}
                          onChange={(e) => handleItemFieldChange(idx, 'folding', e.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-link text-danger p-0"
                          onClick={() => removeItem(idx)}
                          disabled={items.length <= 1}
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr className="fw-bold">
                    <td colSpan={7} className="text-end text-uppercase">Grand Total Dispatch Quantity:</td>
                    <td className="text-end text-danger fs-6">{Number(grandTotalMeters).toFixed(2)} m</td>
                    <td colSpan={2}>({items.length} Pcs)</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 4: Remarks & Handover Signatures */}
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-bold">Dispatch Remarks</label>
              <textarea
                className="form-control form-control-sm"
                rows="2"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              ></textarea>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold">Receiver's Name / Signature Line</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={receiverSignature}
                onChange={(e) => setReceiverSignature(e.target.value)}
                placeholder="Name of vendor representative taking physical custody"
              />
              <small className="text-muted">Printed on physical copy for security gate check</small>
            </div>
          </div>
        </div>

        <div className="card-footer bg-white border-top py-3 d-flex justify-content-between align-items-center">
          <div className="text-muted small">
            Deducts from warehouse stock & marks as <strong>"Out for Processing"</strong>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger btn-sm px-4">
              <i className="ti ti-printer me-1"></i> Save & Issue Challan
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
