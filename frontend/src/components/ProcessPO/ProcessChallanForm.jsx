import React, { useState, useEffect } from 'react';
import { initialVendors } from '../../data/procurementData';

/**
 * ProcessChallanForm - Dispatch Challan to Processing Vendor
 * Strict adherence to Section 4.1 Data Structure & Section 4.2 / 4.3 of Client PDF Specification
 * 
 * Rules:
 * 1. Naming: "Challan" everywhere (No "Job Work")
 * 2. Pre-fill: Absolutely NO pre-filled dummy data on new creation! All inputs start clean and empty.
 * 3. Auto-fields: Vendor, Style, Customer/Brand are auto-carried when PO(s) are selected.
 * 4. Emergency Dispatch: Flagged red with "Pending PO Link" if issued without a PO.
 */
export default function ProcessChallanForm({ availablePOs = [], onSave, onCancel, initialChallan }) {
  const isEditing = Boolean(initialChallan && initialChallan.id);

  // Field 1: Challan Number - Auto (system generated), Unique
  const [challanNumber, setChallanNumber] = useState(
    initialChallan?.challan_number || `CH-${Math.floor(4000 + Math.random() * 1000)}`
  );

  // Field 3: Date - Date of dispatch (Defaults to current date)
  const [date, setDate] = useState(
    initialChallan?.date || new Date().toISOString().split('T')[0]
  );

  // Field 2 & 11: Linked PO Number(s) (Reference — Process PO, multi-select) & PO Link Status
  const [isEmergencyDispatch, setIsEmergencyDispatch] = useState(
    initialChallan ? initialChallan.po_link_status === 'Pending PO Link' : false
  );
  // NO PRE-FILLED DUMMY DATA: starts as empty array [] when new!
  const [selectedPOs, setSelectedPOs] = useState(initialChallan?.linked_pos || []);

  // Field 4: Vendor - Auto-carried from linked PO(s), or selectable in Emergency mode
  // NO PRE-FILLED DUMMY DATA: starts empty '' when new!
  const [vendorId, setVendorId] = useState(initialChallan?.vendor_id || '');
  const [vendorName, setVendorName] = useState(initialChallan?.vendor_name || '');

  // Field 5: Style / Customer / Brand - Auto-carried from linked PO(s)
  // NO PRE-FILLED DUMMY DATA: starts empty when new!
  const [stylesInfo, setStylesInfo] = useState(initialChallan?.styles_info || []);
  const [customerBrand, setCustomerBrand] = useState(initialChallan?.customer_brand || '');

  // Field 8: Folding Notation - Text, e.g. "L100" (Optional)
  // NO PRE-FILLED DUMMY DATA: starts blank ''
  const [foldingNotation, setFoldingNotation] = useState(initialChallan?.folding_notation || '');

  // Field 10: Remarks / Notes - Text multiline (Optional)
  // NO PRE-FILLED DUMMY DATA: starts blank ''
  const [remarks, setRemarks] = useState(initialChallan?.remarks || '');

  // Field 12: Receiver Signature / Company Representative (Print fields)
  // NO PRE-FILLED DUMMY DATA: starts blank ''
  const [companyRep, setCompanyRep] = useState(initialChallan?.company_representative || '');
  const [receiverSignature, setReceiverSignature] = useState(initialChallan?.receiver_signature || '');

  // Field 6 & 7: Bale/Roll Reference & Selected Pieces (Warehouse stock allocation)
  // NO PRE-FILLED DUMMY DATA: starts as empty array [] when new!
  const [items, setItems] = useState(initialChallan?.items || []);

  // Available Warehouse Stock Rolls (Reference per Section 4.2)
  const warehouseStockPool = [
    { bale_roll_no: 'Roll 12304', fabric_name: '100x100 Voile (Grey)', color_name: 'Off White', invoice_no: 'INV-MS-0091', meters: 1065.50 },
    { bale_roll_no: 'Roll 2376-A', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', meters: 119.30 },
    { bale_roll_no: 'Roll 2376-B', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', meters: 111.00 },
    { bale_roll_no: 'Roll 2376-C', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', meters: 78.40 },
    { bale_roll_no: 'Roll 2376-D', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', meters: 97.80 },
    { bale_roll_no: 'Roll 2376-E', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', meters: 113.30 },
    { bale_roll_no: 'Roll 2376-F', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', meters: 134.00 },
    { bale_roll_no: 'Roll 4410-A', fabric_name: 'Rayon 14kg Liva', color_name: 'Dusty Rose', invoice_no: 'INV-SR-1042', meters: 450.00 },
    { bale_roll_no: 'Roll 5520-A', fabric_name: 'Cotton Cambric 60*60', color_name: 'Sky Blue', invoice_no: 'INV-MS-0098', meters: 620.00 }
  ];

  // Auto-carry Vendor and Style/Customer/Brand when PO selection changes (Section 4.1 Rows 4 & 5)
  useEffect(() => {
    if (!isEmergencyDispatch && selectedPOs.length > 0) {
      const selectedPOObjects = availablePOs.filter(p => selectedPOs.includes(p.id));
      if (selectedPOObjects.length > 0) {
        // Auto-carry vendor
        const firstPO = selectedPOObjects[0];
        setVendorId(firstPO.vendor_id || '');
        setVendorName(firstPO.vendor_name || '');

        // Auto-carry styles & customer/brand
        const allStyles = [];
        selectedPOObjects.forEach(p => {
          if (Array.isArray(p.style_names)) {
            p.style_names.forEach(s => {
              if (!allStyles.includes(s)) allStyles.push(s);
            });
          }
        });
        setStylesInfo(allStyles);
        setCustomerBrand(firstPO.customer_brand_name || '');
      }
    } else if (isEmergencyDispatch) {
      // In emergency dispatch without PO
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

  // Add a blank Bale / Roll row (No pre-filled dummy data)
  const addBlankItemRow = () => {
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

  // Pick roll from warehouse stock pool
  const addStockRoll = (stock) => {
    setItems([
      ...items,
      {
        id: Date.now(),
        bale_roll_no: stock.bale_roll_no,
        fabric_name: stock.fabric_name,
        color_name: stock.color_name,
        invoice_no: stock.invoice_no,
        original_piece_meters: stock.meters,
        dispatched_meters: stock.meters,
        is_partial_cut: false,
        folding: foldingNotation || ''
      }
    ]);
  };

  const removeItemRow = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemFieldChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Field 9: Grand Total - Decimal, auto (Sum of all dispatched meters)
  const grandTotalMeters = items.reduce((acc, it) => acc + (parseFloat(it.dispatched_meters) || 0), 0);

  // Field 11: PO Link Status - Auto (Linked / Pending PO Link, flagged red when created without PO)
  const poLinkStatus = isEmergencyDispatch || selectedPOs.length === 0 ? 'Pending PO Link' : 'Linked';

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate mandatory linked PO unless emergency
    if (!isEmergencyDispatch && selectedPOs.length === 0) {
      alert('Validation Error: Please link at least one Process PO, or switch to Emergency Dispatch (No PO).');
      return;
    }

    // Validate Vendor
    if (!vendorId && !vendorName) {
      alert('Validation Error: Vendor is required. Please select a Process PO or choose a vendor manually.');
      return;
    }

    // Validate stock items
    if (items.length === 0) {
      alert('Validation Error: Please add at least one Bale / Roll line under Stock Allocation (Section 4.1).');
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

    onSave(challanPayload);
  };

  return (
    <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px', overflow: 'hidden' }}>
      {/* Top Banner Header */}
      <div
        className="card-header bg-white py-3 px-4 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3"
        style={{ borderBottom: '1px solid #e2e8f0' }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center shadow-sm"
            style={{
              width: '46px',
              height: '46px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff'
            }}
          >
            <i className="ti ti-truck-delivery fs-22"></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="card-title mb-0 fw-bold text-dark fs-18">
                {isEditing ? `Edit Challan #${challanNumber}` : 'Create New Challan'}
              </h5>
              <span className={`badge rounded-pill px-2.5 py-1 fs-11 fw-bold ${
                poLinkStatus === 'Linked'
                  ? 'bg-success-subtle text-success border border-success-subtle'
                  : 'bg-danger text-white border border-danger shadow-xs'
              }`}>
                {poLinkStatus === 'Linked' ? 'Linked to PO' : '🚨 Pending PO Link (Emergency)'}
              </span>
            </div>
            <div className="text-muted fs-12 mt-0.5">
              Section 4.1 Specification • Fabric Dispatch to Processing Partner
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-light btn-sm border px-3 rounded-3 d-flex align-items-center gap-1.5 text-secondary"
          onClick={onCancel}
        >
          <i className="ti ti-x fs-15"></i>
          <span>Close</span>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card-body p-4 bg-slate-50" style={{ background: '#f8fafc' }}>

          {/* ========================================================================= */}
          {/* SECTION 1: LINKED PO NUMBER(S) & PO LINK STATUS (ROWS 2 & 11 OF 4.1)      */}
          {/* ========================================================================= */}
          <div
            className="card border-0 mb-4 shadow-xs"
            style={{
              borderRadius: '14px',
              border: poLinkStatus === 'Pending PO Link' ? '1px solid #fca5a5' : '1px solid #e2e8f0',
              background: '#ffffff'
            }}
          >
            <div
              className="p-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3"
              style={{
                borderBottom: '1px solid #edf2f7',
                background: poLinkStatus === 'Pending PO Link' ? '#fff5f5' : '#ffffff'
              }}
            >
              <div className="d-flex align-items-center gap-2.5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    background: poLinkStatus === 'Pending PO Link' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                    color: poLinkStatus === 'Pending PO Link' ? '#dc2626' : '#4f46e5'
                  }}
                >
                  <i className="ti ti-file-certificate fs-16"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark fs-14">
                    1. Linked Process PO(s) & Dispatch Mode
                  </h6>
                  <p className="text-muted fs-11 mb-0">
                    Row 2 & 11 of Spec: Multi-select Process POs or issue Emergency Dispatch without PO
                  </p>
                </div>
              </div>

              {/* Emergency Switch Pill Button */}
              <div className="btn-group p-1 rounded-pill border shadow-xs" style={{ background: '#f1f5f9' }}>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 transition-all d-flex align-items-center gap-1.5 ${
                    !isEmergencyDispatch ? 'btn-primary text-white shadow-sm' : 'text-secondary border-0 bg-transparent'
                  }`}
                  style={{ fontWeight: 600, fontSize: '12px' }}
                  onClick={() => setIsEmergencyDispatch(false)}
                >
                  <i className="ti ti-checkbox fs-14"></i>
                  <span>Standard Dispatch (Linked PO)</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 transition-all d-flex align-items-center gap-1.5 ${
                    isEmergencyDispatch ? 'btn-danger text-white shadow-sm' : 'text-secondary border-0 bg-transparent'
                  }`}
                  style={{ fontWeight: 600, fontSize: '12px' }}
                  onClick={() => {
                    setIsEmergencyDispatch(true);
                    setSelectedPOs([]);
                  }}
                >
                  <i className="ti ti-alert-triangle fs-14"></i>
                  <span>Emergency Dispatch (No PO)</span>
                </button>
              </div>
            </div>

            <div className="p-4">
              {isEmergencyDispatch ? (
                /* Emergency Warning (Section 4.3) */
                <div className="p-3 rounded-3 border border-danger d-flex align-items-start gap-3" style={{ background: '#fef2f2' }}>
                  <i className="ti ti-alert-triangle-filled text-danger fs-22 mt-0.5"></i>
                  <div>
                    <div className="fw-bold text-danger fs-13">
                      EMERGENCY DISPATCH WARNING (PO Link Status: Pending PO Link)
                    </div>
                    <div className="text-secondary fs-12 mt-0.5">
                      This Challan is being dispatched without an existing Process PO.
                      An Admin Approval Alert is triggered and flagged <strong className="text-danger">RED</strong> until linked retrospectively.
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Multi-Select of Process POs */
                <div>
                  <label className="form-label fs-12 fw-bold text-dark mb-2 d-flex align-items-center justify-content-between">
                    <span>
                      Select Process PO(s) to Bundle on this Challan <span className="text-danger">*</span>
                    </span>
                    <span className="text-muted fs-11">
                      {selectedPOs.length === 0 ? 'No PO selected' : `${selectedPOs.length} PO(s) selected`}
                    </span>
                  </label>

                  {availablePOs.length === 0 ? (
                    <div className="text-muted fs-12 p-3 border rounded-3 bg-light">
                      No active Process POs found in system.
                    </div>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {availablePOs.map((po) => {
                        const isSelected = selectedPOs.includes(po.id);
                        return (
                          <div
                            key={po.id}
                            onClick={() => togglePOSelection(po.id)}
                            className={`p-2.5 px-3 rounded-3 border transition-all d-flex align-items-center gap-2 cursor-pointer shadow-xs ${
                              isSelected
                                ? 'bg-primary text-white border-primary fw-bold'
                                : 'bg-white text-dark border-slate-200 hover-bg-light'
                            }`}
                            style={{ cursor: 'pointer', fontSize: '12.5px' }}
                          >
                            <i className={`ti ${isSelected ? 'ti-check' : 'ti-plus'} fs-15`}></i>
                            <span>PO #{po.po_number || po.id}</span>
                            <span className={isSelected ? 'text-indigo-200 fs-11' : 'text-muted fs-11'}>
                              • {po.vendor_name} ({po.total_meters}m)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Auto-Carried Details Summary (Rows 4 & 5 of 4.1) */}
                  {selectedPOs.length > 0 && vendorName && (
                    <div
                      className="mt-3 p-3 rounded-3 border d-flex flex-wrap align-items-center justify-content-between gap-3"
                      style={{ background: '#f0f4ff', borderColor: '#c7d2fe' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary text-white fs-11">Auto-Carried</span>
                        <div>
                          <span className="text-muted fs-11">Vendor: </span>
                          <strong className="text-dark fs-12.5">{vendorName}</strong>
                        </div>
                      </div>

                      {stylesInfo.length > 0 && (
                        <div>
                          <span className="text-muted fs-11">Styles: </span>
                          <span className="badge bg-white text-primary border border-indigo-200 fs-11 fw-semibold">
                            {stylesInfo.join(', ')}
                          </span>
                        </div>
                      )}

                      {customerBrand && (
                        <div>
                          <span className="text-muted fs-11">Brand: </span>
                          <strong className="text-dark fs-12">{customerBrand}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: CHALLAN METADATA & AUTHORIZATION (ROWS 1, 3, 4, 8, 12, 13)     */}
          {/* ========================================================================= */}
          <div
            className="card border-0 mb-4 shadow-xs"
            style={{ borderRadius: '14px', border: '1px solid #e2e8f0', background: '#ffffff' }}
          >
            <div
              className="p-3 px-4 border-bottom d-flex align-items-center gap-2.5"
              style={{ borderBottom: '1px solid #edf2f7' }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669'
                }}
              >
                <i className="ti ti-clipboard-text fs-16"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-dark fs-14">
                  2. Challan Identification & Authorization
                </h6>
                <p className="text-muted fs-11 mb-0">
                  Rows 1, 3, 4, 8 & 12 of Spec: Challan #, Dispatch Date, Vendor, Folding & Signatures
                </p>
              </div>
            </div>

            <div className="p-4">
              <div className="row g-3">
                {/* Row 1: Challan Number (Auto unique) */}
                <div className="col-lg-2 col-md-4 col-sm-6">
                  <label className="form-label fs-12 fw-bold text-dark mb-1">
                    Challan Number <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderColor: '#cbd5e1' }}>
                      <i className="ti ti-hash fs-14"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control form-control-sm fw-bold text-danger border-start-0 fs-13"
                      style={{ borderColor: '#cbd5e1', height: '38px' }}
                      value={challanNumber}
                      onChange={(e) => setChallanNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Row 3: Dispatch Date */}
                <div className="col-lg-2 col-md-4 col-sm-6">
                  <label className="form-label fs-12 fw-bold text-dark mb-1">
                    Dispatch Date <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderColor: '#cbd5e1' }}>
                      <i className="ti ti-calendar fs-14"></i>
                    </span>
                    <input
                      type="date"
                      className="form-control form-control-sm border-start-0 fs-13"
                      style={{ borderColor: '#cbd5e1', height: '38px' }}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Row 4: Vendor (Auto-carried or manual if emergency) */}
                <div className="col-lg-4 col-md-6 col-sm-12">
                  <label className="form-label fs-12 fw-bold text-dark mb-1 d-flex align-items-center justify-content-between">
                    <span>
                      Vendor <span className="text-danger">*</span>
                    </span>
                    {!isEmergencyDispatch && (
                      <span className="text-muted fs-11">Auto-carried from PO</span>
                    )}
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderColor: '#cbd5e1' }}>
                      <i className="ti ti-building-factory-2 fs-14"></i>
                    </span>
                    {isEmergencyDispatch ? (
                      <select
                        className="form-select form-select-sm border-start-0 fw-semibold text-dark fs-13"
                        style={{ borderColor: '#cbd5e1', height: '38px' }}
                        value={vendorId}
                        onChange={(e) => {
                          setVendorId(e.target.value);
                          const v = initialVendors.find(vend => vend.id === e.target.value);
                          if (v) setVendorName(`${v.name} (${v.city})`);
                        }}
                      >
                        <option value="">-- Select Vendor --</option>
                        {initialVendors.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name} • {v.city}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="form-control form-control-sm border-start-0 fw-semibold text-dark fs-13"
                        style={{ borderColor: '#cbd5e1', height: '38px', background: '#f8fafc' }}
                        value={vendorName}
                        placeholder="Auto-carried when PO is selected"
                        readOnly
                      />
                    )}
                  </div>
                </div>

                {/* Row 8: Folding Notation */}
                <div className="col-lg-4 col-md-6 col-sm-12">
                  <label className="form-label fs-12 fw-bold text-dark mb-1">
                    Folding Notation <span className="text-muted font-normal fs-11">(e.g. L100)</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderColor: '#cbd5e1' }}>
                      <i className="ti ti-fold fs-14"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control form-control-sm border-start-0 fs-13"
                      style={{ borderColor: '#cbd5e1', height: '38px' }}
                      value={foldingNotation}
                      onChange={(e) => setFoldingNotation(e.target.value)}
                      placeholder="e.g. L100 / Fold 98"
                    />
                  </div>
                </div>

                {/* Row 12: Company Representative */}
                <div className="col-lg-6 col-md-6 col-sm-12">
                  <label className="form-label fs-12 fw-bold text-dark mb-1">
                    Company Representative <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderColor: '#cbd5e1' }}>
                      <i className="ti ti-user fs-14"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control form-control-sm border-start-0 fs-13"
                      style={{ borderColor: '#cbd5e1', height: '38px' }}
                      value={companyRep}
                      onChange={(e) => setCompanyRep(e.target.value)}
                      placeholder="Name of authorized employee issuing challan"
                      required
                    />
                  </div>
                </div>

                {/* Row 12: Receiver Signature / Contact */}
                <div className="col-lg-6 col-md-6 col-sm-12">
                  <label className="form-label fs-12 fw-bold text-dark mb-1">
                    Receiver Signature / Driver Name
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderColor: '#cbd5e1' }}>
                      <i className="ti ti-signature fs-14"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control form-control-sm border-start-0 fs-13"
                      style={{ borderColor: '#cbd5e1', height: '38px' }}
                      value={receiverSignature}
                      onChange={(e) => setReceiverSignature(e.target.value)}
                      placeholder="Name / Signature of tempo driver or vendor recipient"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: BALE/ROLL REFERENCE & STOCK ALLOCATION (ROWS 6 & 7 OF 4.1)      */}
          {/* ========================================================================= */}
          <div
            className="card border-0 mb-4 shadow-xs"
            style={{ borderRadius: '14px', border: '1px solid #e2e8f0', background: '#ffffff' }}
          >
            <div
              className="p-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3"
              style={{ borderBottom: '1px solid #edf2f7' }}
            >
              <div className="d-flex align-items-center gap-2.5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#dc2626'
                  }}
                >
                  <i className="ti ti-layers-subtract fs-16"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark fs-14">
                    3. Bale / Roll Stock Allocation
                  </h6>
                  <p className="text-muted fs-11 mb-0">
                    Row 6 & 7: Warehouse stock reference per PO/color (Invoice # + Bale/Roll #). Support for full roll or selected cut pieces
                  </p>
                </div>
              </div>

              {/* Action Buttons: Add Blank or Pick from Warehouse */}
              <div className="d-flex align-items-center gap-2">
                <div className="dropdown">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3 rounded-3 dropdown-toggle d-flex align-items-center gap-1.5"
                    data-bs-toggle="dropdown"
                    id="warehouseStockDropdown"
                  >
                    <i className="ti ti-building-warehouse fs-14"></i>
                    <span>Select from Warehouse Stock</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow-sm" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <li className="dropdown-header fs-11 text-uppercase fw-bold text-muted">
                      Available Rolls in Stock Pool
                    </li>
                    {warehouseStockPool.map((stock, sIdx) => (
                      <li key={sIdx}>
                        <button
                          type="button"
                          className="dropdown-item fs-12 py-1.5"
                          onClick={() => addStockRoll(stock)}
                        >
                          <strong>{stock.bale_roll_no}</strong> ({stock.meters}m) • {stock.color_name} • {stock.invoice_no}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm px-3 rounded-3 d-flex align-items-center gap-1.5 shadow-xs"
                  onClick={addBlankItemRow}
                >
                  <i className="ti ti-plus fs-14"></i>
                  <span>+ Add Bale / Roll</span>
                </button>
              </div>
            </div>

            <div className="p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <tr className="text-secondary fw-semibold">
                      <th className="text-center py-2.5" style={{ width: '40px' }}>#</th>
                      <th style={{ minWidth: '150px' }}>Bale / Roll No *</th>
                      <th style={{ minWidth: '140px' }}>Stock Invoice Ref *</th>
                      <th style={{ minWidth: '160px' }}>Fabric Quality</th>
                      <th style={{ minWidth: '130px' }}>Color Shade</th>
                      <th style={{ width: '130px' }} className="text-center">Dispatch Mode</th>
                      <th style={{ width: '120px' }} className="text-end">Original (m)</th>
                      <th style={{ width: '130px' }} className="text-end text-danger">Dispatched (m) *</th>
                      <th style={{ width: '100px' }} className="text-center">Folding</th>
                      <th style={{ width: '45px' }} className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-4 text-muted">
                          <i className="ti ti-package-off fs-24 d-block mb-1 text-muted"></i>
                          No bales/rolls allocated yet. Click <strong>"+ Add Bale / Roll"</strong> or select from warehouse stock above.
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
                              className="form-control form-control-sm fw-bold fs-12 px-2"
                              style={{ borderColor: '#cbd5e1', borderRadius: '6px', height: '34px' }}
                              value={it.bale_roll_no}
                              onChange={(e) => handleItemFieldChange(idx, 'bale_roll_no', e.target.value)}
                              placeholder="e.g. Roll 2376-A"
                              required
                            />
                          </td>

                          {/* Invoice Ref */}
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm fs-12 px-2"
                              style={{ borderColor: '#cbd5e1', borderRadius: '6px', height: '34px' }}
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
                              style={{ borderColor: '#cbd5e1', borderRadius: '6px', height: '34px' }}
                              value={it.fabric_name}
                              onChange={(e) => handleItemFieldChange(idx, 'fabric_name', e.target.value)}
                              placeholder="e.g. 100x100 Voile (Grey)"
                            />
                          </td>

                          {/* Color */}
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm fs-12 px-2"
                              style={{ borderColor: '#cbd5e1', borderRadius: '6px', height: '34px' }}
                              value={it.color_name}
                              onChange={(e) => handleItemFieldChange(idx, 'color_name', e.target.value)}
                              placeholder="e.g. Beige"
                            />
                          </td>

                          {/* Dispatch Mode: Full Roll vs Selected Pieces / Cut Piece (Row 7) */}
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={() => handleItemFieldChange(idx, 'is_partial_cut', !it.is_partial_cut)}
                              className={`badge border px-2 py-1 transition-all ${
                                it.is_partial_cut
                                  ? 'bg-warning text-dark border-warning'
                                  : 'bg-light text-secondary border'
                              }`}
                              style={{ cursor: 'pointer', fontSize: '11px' }}
                              title="Click to toggle Full Roll vs Cut Piece"
                            >
                              {it.is_partial_cut ? (
                                <span><i className="ti ti-scissors me-1"></i> Partial Cut</span>
                              ) : (
                                <span>Full Roll</span>
                              )}
                            </button>
                          </td>

                          {/* Original Meters */}
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control form-control-sm text-end fs-12 px-2"
                              style={{ borderColor: '#cbd5e1', borderRadius: '6px', height: '34px' }}
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
                              className="form-control form-control-sm text-end fw-bold fs-13 px-2 text-danger"
                              style={{ borderColor: '#ef4444', borderRadius: '6px', height: '34px' }}
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
                              style={{ borderColor: '#cbd5e1', borderRadius: '6px', height: '34px' }}
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
                              onClick={() => removeItemRow(idx)}
                              title="Remove item"
                            >
                              <i className="ti ti-trash fs-16"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  {/* Row 9: Grand Total - Decimal, auto */}
                  <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                    <tr className="fw-bold">
                      <td colSpan={7} className="text-end text-uppercase text-secondary py-3 fs-12">
                        Row 9 Grand Total Dispatch Quantity:
                      </td>
                      <td className="text-end text-danger fs-15 py-3">
                        {Number(grandTotalMeters).toFixed(2)} m
                      </td>
                      <td colSpan={2} className="text-muted fs-11 py-3 text-center">
                        ({items.length} {items.length === 1 ? 'Roll / Piece' : 'Rolls / Pieces'})
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: REMARKS & NOTES (ROW 10 OF 4.1)                                */}
          {/* ========================================================================= */}
          <div
            className="card border-0 mb-2 shadow-xs"
            style={{ borderRadius: '14px', border: '1px solid #e2e8f0', background: '#ffffff' }}
          >
            <div
              className="p-3 px-4 border-bottom d-flex align-items-center gap-2.5"
              style={{ borderBottom: '1px solid #edf2f7' }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#d97706'
                }}
              >
                <i className="ti ti-notes fs-16"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-dark fs-14">
                  4. Remarks & Instructions (Row 10 of Spec)
                </h6>
                <p className="text-muted fs-11 mb-0">
                  Multiline notes for transport, security gate pass and vendor processing
                </p>
              </div>
            </div>

            <div className="p-4">
              <textarea
                className="form-control fs-13"
                rows="2"
                style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter any dispatch notes, tempo details, or special handling instructions..."
              ></textarea>
            </div>
          </div>

        </div>

        {/* Footer Bar */}
        <div
          className="card-footer bg-white border-top py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-3"
          style={{ borderTop: '1px solid #e2e8f0' }}
        >
          {/* Row 13: Created By / Created Date - Auto */}
          <div className="text-muted fs-12 d-flex align-items-center gap-2">
            <i className="ti ti-shield-check text-success fs-16"></i>
            <span>Authorized by: <strong>{companyRep || 'Pending Entry'}</strong></span>
            <span>•</span>
            <span>Created: <strong>{new Date().toLocaleDateString('en-GB')}</strong></span>
            <span>•</span>
            <span>Spec: <strong>Section 4.1 Compliant</strong></span>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-light border px-4 rounded-3 text-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger px-4 rounded-3 shadow-sm d-flex align-items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', border: 'none' }}
            >
              <i className="ti ti-printer fs-16"></i>
              <span className="fw-bold">Save & Issue Challan</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
