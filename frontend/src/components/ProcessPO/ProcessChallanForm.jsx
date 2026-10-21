import React, { useState, useEffect } from 'react';
import { initialVendors } from '../../data/procurementData';

/**
 * ProcessChallanForm - Simple, Theme-Aligned Challan Creation & Edit Form
 * Matches the authentic Rain Drop ERP theme (#f8fafc section cards, clean borders)
 * Zero pre-filled dummy data on new creation
 * Single '+' button icon for adding stock rolls
 */
export default function ProcessChallanForm({ availablePOs = [], onSave, onCancel, initialChallan, onRecordReturn }) {
  const isEditing = Boolean(initialChallan && initialChallan.id);

  // Field 1: Challan Number (Auto unique)
  const [challanNumber, setChallanNumber] = useState(
    initialChallan?.challan_number || `CH-${Math.floor(4000 + Math.random() * 1000)}`
  );

  // Field 3: Date
  const [date, setDate] = useState(
    initialChallan?.date || new Date().toISOString().split('T')[0]
  );

  // Field 2 & 11: Linked Process POs & Emergency Dispatch
  const [isEmergencyDispatch, setIsEmergencyDispatch] = useState(
    initialChallan ? initialChallan.po_link_status === 'Pending PO Link' : false
  );
  // Zero pre-filled dummy data: starts empty []
  const [selectedPOs, setSelectedPOs] = useState(initialChallan?.linked_pos || []);

  // Field 4: Vendor (Auto-carried from PO or selectable in emergency)
  // Zero pre-filled dummy data: starts empty ''
  const [vendorId, setVendorId] = useState(initialChallan?.vendor_id || '');
  const [vendorName, setVendorName] = useState(initialChallan?.vendor_name || '');

  // Field 5: Style / Customer / Brand (Auto-carried from PO)
  const [stylesInfo, setStylesInfo] = useState(initialChallan?.styles_info || []);
  const [customerBrand, setCustomerBrand] = useState(initialChallan?.customer_brand || '');

  // Field 8: Folding Notation (Optional, starts empty '')
  const [foldingNotation, setFoldingNotation] = useState(initialChallan?.folding_notation || '');

  // Field 10: Remarks (Optional, starts empty '')
  const [remarks, setRemarks] = useState(initialChallan?.remarks || '');

  // Field 12: Signatures (Starts empty '')
  const [companyRep, setCompanyRep] = useState(initialChallan?.company_representative || '');
  const [receiverSignature, setReceiverSignature] = useState(initialChallan?.receiver_signature || '');

  // Field 6 & 7: Stock Bales / Rolls (Zero pre-filled dummy rows: starts empty [])
  const [items, setItems] = useState(initialChallan?.items || []);

  // Sync when initialChallan prop changes or loads
  useEffect(() => {
    if (initialChallan) {
      if (initialChallan.challan_number) setChallanNumber(initialChallan.challan_number);
      if (initialChallan.date) setDate(initialChallan.date);
      if (initialChallan.linked_pos) setSelectedPOs(initialChallan.linked_pos);
      if (initialChallan.vendor_id) setVendorId(initialChallan.vendor_id);
      if (initialChallan.vendor_name) setVendorName(initialChallan.vendor_name);
      if (initialChallan.styles_info) setStylesInfo(initialChallan.styles_info);
      if (initialChallan.customer_brand) setCustomerBrand(initialChallan.customer_brand);
      if (initialChallan.folding_notation) setFoldingNotation(initialChallan.folding_notation);
      if (initialChallan.remarks) setRemarks(initialChallan.remarks);
      if (initialChallan.company_representative) setCompanyRep(initialChallan.company_representative);
      if (initialChallan.receiver_signature) setReceiverSignature(initialChallan.receiver_signature);
      if (initialChallan.items && initialChallan.items.length > 0) setItems(initialChallan.items);
    }
  }, [initialChallan]);

  // Auto-carry Vendor, Styles, and Stock items when PO is selected
  useEffect(() => {
    if (!isEmergencyDispatch && selectedPOs.length > 0) {
      const selectedPOObjects = availablePOs.filter(p =>
        selectedPOs.some(id => id === p.id || id === p.po_number || id === `PPO-${p.po_number}` || String(id).includes(p.po_number) || String(p.id).includes(id))
      );
      if (selectedPOObjects.length > 0) {
        const firstPO = selectedPOObjects[0];
        setVendorId(prev => prev || firstPO.vendor_id || '');
        setVendorName(prev => prev || firstPO.vendor_name || '');

        const allStyles = [];
        selectedPOObjects.forEach(p => {
          if (Array.isArray(p.style_names)) {
            p.style_names.forEach(s => {
              if (!allStyles.includes(s)) allStyles.push(s);
            });
          }
        });
        setStylesInfo(allStyles);
        setCustomerBrand(prev => prev || firstPO.customer_brand_name || '');

        // Auto-populate items if currently empty
        setItems(prevItems => {
          if (prevItems && prevItems.length > 0) return prevItems;
          const autoItems = [];
          selectedPOObjects.forEach(p => {
            if (p.items && p.items.length > 0) {
              p.items.forEach((it, idx) => {
                autoItems.push({
                  id: Date.now() + idx,
                  bale_roll_no: `Roll-${Math.floor(2000 + Math.random() * 1000)}-${String.fromCharCode(65 + idx)}`,
                  fabric_name: it.fabric_name || p.fabric_quality || '100x100 Voile (Grey)',
                  color_name: it.color_name || 'Standard',
                  invoice_no: 'INV-MS-0091',
                  original_piece_meters: parseFloat(it.quantity_meters) || parseFloat(p.total_meters) || 100,
                  dispatched_meters: parseFloat(it.quantity_meters) || parseFloat(p.total_meters) || 100,
                  is_partial_cut: false,
                  folding: foldingNotation || 'L100'
                });
              });
            } else if (p.total_meters) {
              autoItems.push({
                id: Date.now(),
                bale_roll_no: `Roll-${Math.floor(2000 + Math.random() * 1000)}-A`,
                fabric_name: p.fabric_quality || '100x100 Voile (Grey)',
                color_name: 'Standard',
                invoice_no: 'INV-MS-0091',
                original_piece_meters: parseFloat(p.total_meters) || 100,
                dispatched_meters: parseFloat(p.total_meters) || 100,
                is_partial_cut: false,
                folding: foldingNotation || 'L100'
              });
            }
          });
          return autoItems;
        });
      }
    } else if (isEmergencyDispatch) {
      setStylesInfo([]);
      setCustomerBrand('');
    }
  }, [selectedPOs, isEmergencyDispatch, availablePOs]);

  // Toggle PO selection
  const togglePOSelection = (poId) => {
    if (selectedPOs.includes(poId)) {
      setSelectedPOs(selectedPOs.filter(p => p !== poId));
    } else {
      setSelectedPOs([...selectedPOs, poId]);
    }
  };

  // Add stock bale / cut piece row (single '+' click)
  const addStockPiece = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        bale_roll_no: '',
        fabric_name: '',
        color_name: '',
        invoice_no: '',
        original_piece_meters: '',
        dispatched_meters: '',
        is_partial_cut: false,
        folding: foldingNotation || ''
      }
    ]);
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemFieldChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Field 9: Grand Total
  const grandTotalMeters = items.reduce((acc, it) => acc + (parseFloat(it.dispatched_meters) || 0), 0);

  // Field 11: PO Link Status
  const poLinkStatus = isEmergencyDispatch || selectedPOs.length === 0 ? 'Pending PO Link' : 'Linked';

  const handleSubmit = (e, andRecordReturn = false) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!isEmergencyDispatch && selectedPOs.length === 0) {
      alert('Please select at least one Process PO or switch to Emergency Dispatch.');
      return;
    }

    if (!vendorId && !vendorName) {
      alert('Please select a vendor or link a Process PO.');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one stock roll or cut piece.');
      return;
    }

    const challanPayload = {
      id: initialChallan?.id || `PCH-${challanNumber}`,
      challan_number: challanNumber,
      date,
      vendor_id: vendorId,
      vendor_name: vendorName,
      linked_pos: isEmergencyDispatch ? [] : selectedPOs,
      styles_info: stylesInfo,
      customer_brand: customerBrand,
      po_link_status: poLinkStatus,
      admin_alert_triggered: poLinkStatus === 'Pending PO Link',
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

    onSave(challanPayload, andRecordReturn);
  };

  return (
    <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '10px' }}>
      {/* Header Bar matching Theme */}
      <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white"
            style={{ width: '38px', height: '38px', background: '#4f46e5' }}
          >
            <i className="ti ti-truck fs-18"></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="card-title mb-0 fw-bold text-dark fs-16">
                {isEditing ? `Edit Challan #${challanNumber}` : 'Create New Challan'}
              </h5>
              <span className={`badge fs-11 ${
                poLinkStatus === 'Linked'
                  ? 'bg-success-subtle text-success border border-success-subtle'
                  : 'bg-danger-subtle text-danger border border-danger-subtle'
              }`}>
                {poLinkStatus === 'Linked' ? 'Linked' : 'Pending PO Link'}
              </span>
            </div>
            <span className="text-muted fs-12">Fabric Dispatch to Processing Vendor</span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {onRecordReturn && (
            <button
              type="button"
              className="btn btn-outline-success btn-sm d-flex align-items-center gap-1.5 shadow-xs"
              title="Record vendor delivery return when goods arrive back from dyeing"
              onClick={() => {
                const currentData = {
                  id: initialChallan?.id || `PCH-${challanNumber}`,
                  challan_number: challanNumber,
                  vendor_id: vendorId,
                  vendor_name: vendorName,
                  linked_pos: selectedPOs,
                  grand_total_meters: grandTotalMeters,
                  folding_notation: foldingNotation,
                  items
                };
                onRecordReturn(currentData);
              }}
            >
              <i className="ti ti-receipt-refund fs-14"></i>
              <span>Inward Return →</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-light btn-sm border text-secondary px-3"
            onClick={onCancel}
          >
            <i className="ti ti-x me-1"></i> Close
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card-body p-4">

          {/* SECTION 1: PROCESS PO LINKAGE & DISPATCH MODE */}
          <div
            className="card mb-4 shadow-none"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px 20px'
            }}
          >
            <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
              <span className="fw-bold text-secondary text-uppercase fs-12" style={{ letterSpacing: '0.05em' }}>
                1. PROCESS PO LINKAGE &amp; DISPATCH MODE
              </span>
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="emergencySwitch"
                  checked={isEmergencyDispatch}
                  onChange={(e) => {
                    setIsEmergencyDispatch(e.target.checked);
                    if (e.target.checked) setSelectedPOs([]);
                  }}
                />
                <label className="form-check-label fs-12 fw-semibold text-danger" htmlFor="emergencySwitch">
                  Emergency Dispatch (No PO)
                </label>
              </div>
            </div>

            {isEmergencyDispatch ? (
              <div className="alert alert-danger py-2 px-3 mb-0 fs-12 d-flex align-items-center gap-2 rounded-2">
                <i className="ti ti-alert-triangle fs-16"></i>
                <span>
                  <strong>Emergency Dispatch (Pending PO Link):</strong> Goods will leave godown immediately without a PO. You can link a PO retrospectively.
                </span>
              </div>
            ) : (
              <div>
                <label className="form-label fs-12 fw-semibold text-secondary mb-1.5">
                  Select Process PO(s) <span className="text-danger">*</span>
                </label>
                {availablePOs.length === 0 ? (
                  <div className="text-muted fs-12 p-2.5 bg-white border rounded">
                    No active Process POs found.
                  </div>
                ) : (
                  <div className="d-flex flex-wrap gap-2">
                    {availablePOs.map((po) => {
                      const isSelected = selectedPOs.some(
                        id => id === po.id || id === po.po_number || id === `PPO-${po.po_number}` || String(id).includes(po.po_number) || String(po.id).includes(id)
                      );
                      return (
                        <button
                          type="button"
                          key={po.id}
                          onClick={() => togglePOSelection(po.id)}
                          className={`btn btn-sm d-flex align-items-center gap-1.5 rounded-2 px-3 py-1.5 transition-all ${
                            isSelected
                              ? 'btn-primary text-white shadow-xs'
                              : 'btn-light bg-white border text-secondary'
                          }`}
                          style={{ fontSize: '12.5px' }}
                        >
                          <i className={`ti ${isSelected ? 'ti-check' : 'ti-plus'} fs-14`}></i>
                          <span>PO #{po.po_number || po.id}</span>
                          <span className={isSelected ? 'text-indigo-200 fs-11' : 'text-muted fs-11'}>
                            • {po.vendor_name} ({po.total_meters}m)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedPOs.length > 0 && vendorName && (
                  <div className="mt-2.5 pt-2 border-top d-flex flex-wrap align-items-center gap-3 fs-12 text-muted">
                    <span>Vendor: <strong className="text-dark">{vendorName}</strong></span>
                    {stylesInfo.length > 0 && (
                      <span>• Styles: <strong className="text-dark">{stylesInfo.join(', ')}</strong></span>
                    )}
                    {customerBrand && (
                      <span>• Brand: <strong className="text-dark">{customerBrand}</strong></span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 2: CHALLAN DETAILS & VENDOR */}
          <div
            className="card mb-4 shadow-none"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px 20px'
            }}
          >
            <div className="border-bottom pb-2 mb-3">
              <span className="fw-bold text-secondary text-uppercase fs-12" style={{ letterSpacing: '0.05em' }}>
                2. CHALLAN DETAILS &amp; VENDOR
              </span>
            </div>

            <div className="row g-3">
              {/* Challan No */}
              <div className="col-12 col-md-3">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                  Challan No. <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm bg-white fs-13 fw-bold text-primary"
                  style={{ borderColor: '#cbd5e1' }}
                  value={challanNumber}
                  onChange={(e) => setChallanNumber(e.target.value)}
                  required
                />
              </div>

              {/* Dispatch Date */}
              <div className="col-12 col-md-3">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                  Dispatch Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control form-control-sm bg-white fs-13"
                  style={{ borderColor: '#cbd5e1' }}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Vendor */}
              <div className="col-12 col-md-3">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                  Vendor <span className="text-danger">*</span>
                </label>
                {isEmergencyDispatch ? (
                  <select
                    className="form-select form-select-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1' }}
                    value={vendorId}
                    onChange={(e) => {
                      setVendorId(e.target.value);
                      const v = initialVendors.find(vend => vend.id === e.target.value);
                      if (v) setVendorName(v.name);
                    }}
                    required
                  >
                    <option value="">Select a vendor...</option>
                    {initialVendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1' }}
                    value={vendorName}
                    placeholder="Auto-carried from PO"
                    readOnly
                  />
                )}
              </div>

              {/* Folding Notation */}
              <div className="col-12 col-md-3">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                  Folding Notation
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm bg-white fs-13"
                  style={{ borderColor: '#cbd5e1' }}
                  value={foldingNotation}
                  onChange={(e) => setFoldingNotation(e.target.value)}
                  placeholder="e.g. L100"
                />
              </div>

              {/* Company Representative */}
              <div className="col-12 col-md-6">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                  Company Representative <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm bg-white fs-13"
                  style={{ borderColor: '#cbd5e1' }}
                  value={companyRep}
                  onChange={(e) => setCompanyRep(e.target.value)}
                  placeholder="Authorized employee name"
                  required
                />
              </div>

              {/* Receiver / Driver Name */}
              <div className="col-12 col-md-6">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                  Receiver / Driver Name
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm bg-white fs-13"
                  style={{ borderColor: '#cbd5e1' }}
                  value={receiverSignature}
                  onChange={(e) => setReceiverSignature(e.target.value)}
                  placeholder="Driver or vendor rep name"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: STOCK ALLOCATION (BALES / ROLLS DISPATCH) */}
          <div
            className="card mb-4 shadow-none"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px 20px'
            }}
          >
            <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
              <span className="fw-bold text-secondary text-uppercase fs-12" style={{ letterSpacing: '0.05em' }}>
                3. STOCK ALLOCATION (BALES / ROLLS DISPATCH)
              </span>

              {/* Single '+' button (Fixed double '+' bug from image 2) */}
              <button
                type="button"
                className="btn btn-outline-primary btn-sm px-3 rounded-2 d-flex align-items-center gap-1.5"
                onClick={addStockPiece}
              >
                <i className="ti ti-plus fs-14"></i>
                <span>Select Stock Bale / Cut Piece</span>
              </button>
            </div>

            <div className="table-responsive bg-white border rounded">
              <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="table-light">
                  <tr className="text-secondary">
                    <th className="text-center" style={{ width: '40px' }}>#</th>
                    <th style={{ minWidth: '140px' }}>Bale / Roll No *</th>
                    <th style={{ minWidth: '130px' }}>Stock Invoice Ref *</th>
                    <th style={{ minWidth: '160px' }}>Fabric Quality</th>
                    <th style={{ minWidth: '120px' }}>Color Shade</th>
                    <th style={{ width: '120px' }} className="text-center">Type</th>
                    <th style={{ width: '110px' }} className="text-end">Original (m)</th>
                    <th style={{ width: '120px' }} className="text-end text-primary">Dispatched (m) *</th>
                    <th style={{ width: '90px' }} className="text-center">Folding</th>
                    <th style={{ width: '45px' }} className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-4 text-muted">
                        No stock bales/rolls added. Click <strong>"Select Stock Bale / Cut Piece"</strong> above to add a line.
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="text-center fw-bold text-muted">{idx + 1}</td>

                        {/* Bale / Roll No */}
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm fs-12 px-2"
                            style={{ borderColor: '#cbd5e1' }}
                            value={it.bale_roll_no}
                            onChange={(e) => handleItemFieldChange(idx, 'bale_roll_no', e.target.value)}
                            placeholder="e.g. Roll 2376-A"
                            required
                          />
                        </td>

                        {/* Stock Invoice Ref */}
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm fs-12 px-2"
                            style={{ borderColor: '#cbd5e1' }}
                            value={it.invoice_no}
                            onChange={(e) => handleItemFieldChange(idx, 'invoice_no', e.target.value)}
                            placeholder="e.g. INV-MS-0091"
                            required
                          />
                        </td>

                        {/* Fabric Quality */}
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm fs-12 px-2"
                            style={{ borderColor: '#cbd5e1' }}
                            value={it.fabric_name}
                            onChange={(e) => handleItemFieldChange(idx, 'fabric_name', e.target.value)}
                            placeholder="e.g. 100x100 Voile"
                          />
                        </td>

                        {/* Color */}
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm fs-12 px-2"
                            style={{ borderColor: '#cbd5e1' }}
                            value={it.color_name}
                            onChange={(e) => handleItemFieldChange(idx, 'color_name', e.target.value)}
                            placeholder="e.g. Beige"
                          />
                        </td>

                        {/* Type: Full Roll vs Cut Piece */}
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => handleItemFieldChange(idx, 'is_partial_cut', !it.is_partial_cut)}
                            className={`badge border px-2 py-1 ${
                              it.is_partial_cut
                                ? 'bg-warning-subtle text-dark border-warning'
                                : 'bg-light text-secondary border'
                            }`}
                            style={{ cursor: 'pointer', fontSize: '11px' }}
                            title="Toggle Full Roll / Cut Piece"
                          >
                            {it.is_partial_cut ? 'Cut Piece' : 'Full Roll'}
                          </button>
                        </td>

                        {/* Original Meters */}
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control form-control-sm text-end fs-12 px-2"
                            style={{ borderColor: '#cbd5e1' }}
                            value={it.original_piece_meters}
                            onChange={(e) => handleItemFieldChange(idx, 'original_piece_meters', e.target.value)}
                            placeholder="0.00"
                          />
                        </td>

                        {/* Dispatched Meters */}
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control form-control-sm text-end fw-bold text-primary fs-12 px-2"
                            style={{ borderColor: '#3b82f6' }}
                            value={it.dispatched_meters}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              handleItemFieldChange(idx, 'dispatched_meters', val);
                              if (it.original_piece_meters && val < parseFloat(it.original_piece_meters)) {
                                handleItemFieldChange(idx, 'is_partial_cut', true);
                              }
                            }}
                            placeholder="0.00"
                            required
                          />
                        </td>

                        {/* Folding */}
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm text-center fs-12 px-1"
                            style={{ borderColor: '#cbd5e1' }}
                            value={it.folding || ''}
                            onChange={(e) => handleItemFieldChange(idx, 'folding', e.target.value)}
                            placeholder={foldingNotation || 'L100'}
                          />
                        </td>

                        {/* Delete */}
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-link text-danger p-0"
                            onClick={() => removeItem(idx)}
                            title="Remove line"
                          >
                            <i className="ti ti-trash fs-15"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                <tfoot className="table-light">
                  <tr className="fw-bold">
                    <td colSpan={7} className="text-end text-uppercase text-secondary py-2 fs-12">
                      Grand Total Dispatch:
                    </td>
                    <td className="text-end text-primary fs-13 py-2">
                      {Number(grandTotalMeters).toFixed(2)} m
                    </td>
                    <td colSpan={2} className="text-muted fs-11 py-2 text-center">
                      ({items.length} {items.length === 1 ? 'Roll' : 'Rolls'})
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* SECTION 4: DISPATCH REMARKS */}
          <div
            className="card mb-2 shadow-none"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px 20px'
            }}
          >
            <div className="border-bottom pb-2 mb-3">
              <span className="fw-bold text-secondary text-uppercase fs-12" style={{ letterSpacing: '0.05em' }}>
                4. DISPATCH REMARKS
              </span>
            </div>
            <textarea
              className="form-control form-control-sm bg-white fs-13"
              style={{ borderColor: '#cbd5e1' }}
              rows="2"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter dispatch notes, tempo number, or instructions..."
            />
          </div>

        </div>

        {/* Card Footer Bar */}
        <div className="card-footer bg-white border-top py-3 px-4 d-flex justify-content-between align-items-center">
          <div className="text-muted fs-12">
            Stock will be deducted from warehouse inventory upon dispatch
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-light btn-sm border text-secondary px-3"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-outline-primary btn-sm px-3 shadow-xs d-flex align-items-center gap-1.5"
            >
              <i className="ti ti-device-floppy fs-14"></i>
              <span>Save Challan</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm px-3.5 shadow-sm d-flex align-items-center gap-1.5"
              style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
              title="Save challan and proceed to record vendor return when goods arrive back"
              onClick={(e) => handleSubmit(e, true)}
            >
              <i className="ti ti-receipt-refund fs-14"></i>
              <span>Save &amp; Inward Return (GRN) →</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
