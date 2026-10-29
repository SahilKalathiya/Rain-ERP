import React, { useState, useEffect } from 'react';
import { initialVendors } from '../../data/procurementData';

/**
 * ProcessChallanForm - Implementation of PDF Section 4 & 12.2
 * Features:
 * - Multi-PO Bundling: One Challan can bundle 1 or multiple Process POs to the same vendor
 * - Emergency Dispatch (Challans Without a PO, Section 4.3):
 *   Triggers Admin Approval Alert and persistent bold red "Pending PO Link" flag
 * - "Do Not Mix Invoices" (Single Batch Rule, Section 4.4 & 12.2):
 *   Default single batch fulfilment; mixing invoices requires explicit user confirmation
 * - Scenario A (Full Roll) vs Scenario B (Cut Piece) with permanent stock update notation
 * - Warehouse Stock Allocation by Invoice # & Bale/Roll # with FIFO indicator
 * - Folding Notation (e.g. L100)
 * - Signatures: Company Representative & Receiver Signature
 * - Default View Mode with Section-wise Independent Edit Buttons (Section 13.3)
 * - Action buttons: Save Challan, Save & Record Inward Return (GRN), Print Challan
 */
export default function ProcessChallanForm({
  availablePOs = [],
  onSave,
  onCancel,
  initialChallan,
  onRecordReturn,
  onPrintChallan,
  readOnlyDefault = false,
  returns = []
}) {
  const isEditing = Boolean(initialChallan && initialChallan.id);

  // Workflow Locking: Challan cannot be edited once Inbound Return (GRN) has been recorded
  const isLocked = Boolean(
    initialChallan && (
      initialChallan.is_locked ||
      initialChallan.status === 'Completed' ||
      initialChallan.status === 'Inwarded' ||
      (returns && returns.some(r => r.linked_challan_id && (r.linked_challan_id === initialChallan.challan_number || r.linked_challan_id === initialChallan.id)))
    )
  );

  const [isReadOnly, setIsReadOnly] = useState(readOnlyDefault || Boolean(initialChallan) || isLocked);
  const [editingSection, setEditingSection] = useState((readOnlyDefault || initialChallan || isLocked) ? null : 'all');

  // Available Warehouse Rolls for Stock Picking (FIFO & Invoice Batch)
  const warehouseStockPool = [
    { baleNo: 'Roll 12304', invoiceNo: 'INV-MS-0091', fabric: '100x100 Voile (Grey)', color: 'Off White', meters: 1065.50, arrivalDate: '2026-08-01', ageDays: 11 },
    { baleNo: 'Roll 2376-A', invoiceNo: 'INV-MS-0091', fabric: '100x100 Voile (Grey)', color: 'Beige', meters: 119.30, arrivalDate: '2026-08-01', ageDays: 11 },
    { baleNo: 'Roll 2376-B', invoiceNo: 'INV-MS-0091', fabric: '100x100 Voile (Grey)', color: 'Beige', meters: 111.00, arrivalDate: '2026-08-01', ageDays: 11 },
    { baleNo: 'Roll 2376-C', invoiceNo: 'INV-MS-0091', fabric: '100x100 Voile (Grey)', color: 'Beige', meters: 78.40, arrivalDate: '2026-08-01', ageDays: 11 },
    { baleNo: 'Roll 2376-D', invoiceNo: 'INV-MS-0091', fabric: '100x100 Voile (Grey)', color: 'Beige', meters: 97.80, arrivalDate: '2026-08-01', ageDays: 11 },
    { baleNo: 'Roll 2376-E', invoiceNo: 'INV-MS-0091', fabric: '100x100 Voile (Grey)', color: 'Beige', meters: 113.30, arrivalDate: '2026-08-01', ageDays: 11 },
    { baleNo: 'Roll 2376-F', invoiceNo: 'INV-MS-0091', fabric: '100x100 Voile (Grey)', color: 'Beige', meters: 134.00, arrivalDate: '2026-08-01', ageDays: 11 },
    { baleNo: 'Roll 8841-A', invoiceNo: 'INV-MS-0095', fabric: '100x100 Voile (Grey)', color: 'Beige', meters: 400.00, arrivalDate: '2026-08-08', ageDays: 4 },
    { baleNo: 'Roll 5502-A', invoiceNo: 'INV-LIVA-201', fabric: 'Rayon 14kg Liva', color: 'Maroon Ruby', meters: 500.00, arrivalDate: '2026-08-03', ageDays: 9 },
    { baleNo: 'Roll 7710-A', invoiceNo: 'INV-CAM-304', fabric: 'Cotton Cambric 60*60', color: 'Dusty Rose', meters: 650.00, arrivalDate: '2026-08-05', ageDays: 7 }
  ];

  // Challan Number (Auto unique e.g. CH-4903)
  const [challanNumber, setChallanNumber] = useState(
    initialChallan?.challan_number || `CH-${Math.floor(4000 + Math.random() * 1000)}`
  );

  // Dispatch Date
  const [date, setDate] = useState(
    initialChallan?.date || new Date().toISOString().split('T')[0]
  );

  // Emergency Dispatch (Challan without PO, Section 4.3)
  const [isEmergencyDispatch, setIsEmergencyDispatch] = useState(
    initialChallan ? initialChallan.po_link_status === 'Pending PO Link' : false
  );

  // Multi-PO selection (e.g. PO #7611, #7612, #7613)
  const [selectedPOs, setSelectedPOs] = useState(initialChallan?.linked_pos || []);

  // Vendor (Auto-carried from PO or selectable in emergency)
  const [vendorId, setVendorId] = useState(initialChallan?.vendor_id || '');
  const [vendorName, setVendorName] = useState(initialChallan?.vendor_name || '');

  // Styles & Customer Brand
  const [stylesInfo, setStylesInfo] = useState(initialChallan?.styles_info || []);
  const [customerBrand, setCustomerBrand] = useState(initialChallan?.customer_brand || '');

  // Folding Notation (e.g. "L100")
  const [foldingNotation, setFoldingNotation] = useState(initialChallan?.folding_notation || 'L100');

  // Remarks
  const [remarks, setRemarks] = useState(initialChallan?.remarks || '');

  // Signatures (Section 9 & Page 15)
  const [companyRep, setCompanyRep] = useState(initialChallan?.company_representative || 'Anurag');
  const [receiverSignature, setReceiverSignature] = useState(initialChallan?.receiver_signature || 'Raju Dyeing Rep');

  // Stock Bales / Rolls
  const [items, setItems] = useState(initialChallan?.items || []);

  // Modal states for Link PO (Emergency resolution)
  const [showLinkPOModal, setShowLinkPOModal] = useState(false);
  const [showStockPickerModal, setShowStockPickerModal] = useState(false);

  // Helper: Match PO
  const isPOMatched = (po, idOrRef) => {
    if (!po || !idOrRef) return false;
    const target = String(idOrRef).trim().toLowerCase();
    const poId = String(po.id || '').trim().toLowerCase();
    const poNum = String(po.po_number || '').trim().toLowerCase();
    return poId === target || poNum === target || target === `ppo-${poNum}`;
  };

  // Auto-carry Vendor and Styles when PO selection changes
  useEffect(() => {
    if (!isEmergencyDispatch && selectedPOs.length > 0) {
      const selectedPOObjects = availablePOs.filter(p =>
        selectedPOs.some(ref => isPOMatched(p, ref))
      );
      if (selectedPOObjects.length > 0) {
        const firstPO = selectedPOObjects[0];
        if (firstPO.vendor_id) setVendorId(firstPO.vendor_id);
        if (firstPO.vendor_name) setVendorName(firstPO.vendor_name);

        const allStyles = [];
        selectedPOObjects.forEach(p => {
          if (Array.isArray(p.style_names)) {
            p.style_names.forEach(s => {
              if (s && !allStyles.includes(s)) allStyles.push(s);
            });
          }
        });
        setStylesInfo(allStyles);
        if (firstPO.customer_brand_name) {
          setCustomerBrand(firstPO.customer_brand_name);
        }

        // If items are empty, auto-populate from PO requirements
        if (items.length === 0) {
          const autoItems = [];
          selectedPOObjects.forEach((p, pIdx) => {
            if (p.items && p.items.length > 0) {
              p.items.forEach((it, idx) => {
                autoItems.push({
                  id: Date.now() + pIdx * 10 + idx,
                  bale_roll_no: `Roll 2376-${String.fromCharCode(65 + idx)}`,
                  fabric_name: it.fabric_name || p.fabric_quality || '100x100 Voile (Grey)',
                  color_name: it.color_name || 'Standard',
                  invoice_no: 'INV-MS-0091',
                  original_piece_meters: parseFloat(it.quantity_meters) || 100,
                  dispatched_meters: parseFloat(it.quantity_meters) || 100,
                  is_partial_cut: false,
                  folding: foldingNotation || 'L100'
                });
              });
            }
          });
          if (autoItems.length > 0) setItems(autoItems);
        }
      }
    }
  }, [selectedPOs, isEmergencyDispatch, availablePOs]);

  // Toggle PO in multi-select
  const togglePOSelection = (po) => {
    const poKey = po.po_number || po.id;
    const isAlreadySelected = selectedPOs.some(ref => isPOMatched(po, ref));
    if (isAlreadySelected) {
      setSelectedPOs(selectedPOs.filter(ref => !isPOMatched(po, ref)));
    } else {
      setSelectedPOs([...selectedPOs, poKey]);
    }
  };

  // Add stock roll from warehouse picker modal
  const handleSelectWarehouseRoll = (roll) => {
    // Check Single Batch Rule (Section 4.4 & 12.2: Do Not Mix Invoices)
    const existingInvoices = items.map(it => it.invoice_no).filter(Boolean);
    const hasDifferentInvoice = existingInvoices.length > 0 && !existingInvoices.includes(roll.invoiceNo);

    if (hasDifferentInvoice) {
      const confirmMix = window.confirm(
        `⚠️ Single Batch Rule (Do Not Mix Invoices):\n\nYou are adding a roll from invoice ${roll.invoiceNo}, but existing rolls are from ${existingInvoices[0]}.\n\nMixing rolls from different dye lots may lead to visible shade variation.\n\nDo you confirm this explicit override?`
      );
      if (!confirmMix) return;
    }

    const newItem = {
      id: Date.now() + Math.random(),
      bale_roll_no: roll.baleNo,
      invoice_no: roll.invoiceNo,
      fabric_name: roll.fabric,
      color_name: roll.color,
      original_piece_meters: roll.meters,
      dispatched_meters: roll.meters,
      is_partial_cut: false,
      folding: foldingNotation || 'L100'
    };

    setItems([...items, newItem]);
    setShowStockPickerModal(false);
  };

  const addManualStockRow = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        bale_roll_no: '',
        invoice_no: items[0]?.invoice_no || 'INV-MS-0091',
        fabric_name: items[0]?.fabric_name || '100x100 Voile (Grey)',
        color_name: items[0]?.color_name || 'Beige',
        original_piece_meters: '',
        dispatched_meters: '',
        is_partial_cut: false,
        folding: foldingNotation || 'L100'
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

  // Grand Total Metres
  const grandTotalMeters = items.reduce((acc, it) => acc + (parseFloat(it.dispatched_meters) || 0), 0);

  // Status
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
      alert('Please add at least one stock roll or cut piece to dispatch.');
      return;
    }

    // Check Single Batch Rule (Section 4.4 & 12.2)
    const distinctInvoices = Array.from(new Set(items.map(it => it.invoice_no).filter(Boolean)));
    if (distinctInvoices.length > 1) {
      const confirmMix = window.confirm(
        `Notice: This Challan mixes multiple fabric purchase invoices: [${distinctInvoices.join(', ')}].\nConfirm dispatch with mixed batches?`
      );
      if (!confirmMix) return;
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

  const isSectionEditable = (sectionKey) => {
    if (isLocked) return false;
    if (!isReadOnly) return true;
    return editingSection === sectionKey || editingSection === 'all';
  };

  return (
    <div className="card shadow-sm border mb-4" style={{ borderRadius: '12px', borderColor: '#e2e8f0', background: '#ffffff' }}>
      {/* Top Banner Header */}
      <div
        className="card-header bg-white py-3 px-4 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3"
        style={{ borderColor: '#e2e8f0' }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs"
            style={{ width: '42px', height: '42px', background: '#4f46e5' }}
          >
            <i className="ti ti-truck fs-20"></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="card-title mb-0 fw-bold text-dark fs-18">
                {isEditing ? (isReadOnly ? `Process Challan #${challanNumber} (View Mode)` : `Edit Challan #${challanNumber}`) : 'Create Process Dispatch Challan'}
              </h5>
              <span className={`badge rounded-pill fs-11 fw-bold px-2.5 py-1 ${
                isLocked
                  ? 'bg-secondary text-white border border-secondary shadow-xs'
                  : (poLinkStatus === 'Linked'
                    ? 'bg-success-subtle text-success border border-success-subtle'
                    : 'bg-danger text-white border border-danger shadow-xs')
              }`}>
                {isLocked ? '🔒 Locked (GRN Inwarded)' : (poLinkStatus === 'Linked' ? '● PO Linked' : '⚠ Pending PO Link (Emergency)')}
              </span>
            </div>
            <div className="text-muted fs-12 mt-0.5 d-flex align-items-center gap-2">
              <span>Fabric Dispatch to Job Work Vendor</span>
              <span>•</span>
              <span className="fw-semibold text-primary">{vendorName || 'Vendor Assignment'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="d-flex align-items-center gap-2">
          {onPrintChallan && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-3 rounded-2 d-flex align-items-center gap-1.5"
              onClick={() => onPrintChallan(initialChallan || { challan_number: challanNumber, date, vendor_name: vendorName, linked_pos: selectedPOs, items, grand_total_meters: grandTotalMeters, folding_notation: foldingNotation, company_representative: companyRep, receiver_signature: receiverSignature })}
              title="Print Job Challan Slip matching Page 15 paper format"
            >
              <i className="ti ti-printer fs-15"></i>
              <span>Print Challan Slip</span>
            </button>
          )}

          {!isLocked && (
            isReadOnly ? (
              <>
                {onRecordReturn && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm px-3 rounded-2 shadow-xs d-flex align-items-center gap-1.5"
                    style={{ background: '#059669', borderColor: '#059669' }}
                    title="Record Inbound Return when goods return from dyeing"
                    onClick={() => onRecordReturn(initialChallan)}
                  >
                    <i className="ti ti-receipt-refund fs-15"></i>
                    <span>+ Inward Return (GRN)</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm px-3 rounded-2 d-flex align-items-center gap-1.5"
                  onClick={() => {
                    setIsReadOnly(false);
                    setEditingSection('all');
                  }}
                >
                  <i className="ti ti-edit fs-15"></i>
                  <span>Edit Record</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3 rounded-2 d-flex align-items-center gap-1.5"
                onClick={() => {
                  setIsReadOnly(true);
                  setEditingSection(null);
                }}
              >
                <i className="ti ti-eye fs-15"></i>
                <span>View Mode</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Lock Banner if Inward GRN already received */}
      {isLocked && (
        <div className="alert alert-warning border-warning d-flex align-items-center justify-content-between p-3 m-4 mb-0 rounded-3 shadow-xs">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-warning text-dark p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              <i className="ti ti-lock fs-20"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-dark fs-14">Challan Workflow Locked — Read Only</h6>
              <p className="mb-0 fs-12 text-secondary">
                This Process Challan is locked because Inbound GRN has already been recorded against it. Dispatch roll quantities and fabric data cannot be altered.
              </p>
            </div>
          </div>
          <span className="badge bg-warning text-dark fs-12 px-3 py-2 fw-bold">
            <i className="ti ti-lock me-1"></i> LOCKED
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card-body p-4" style={{ background: '#f8fafc' }}>

          {/* Section 4.3: Persistent Red Banner for Emergency Dispatch without PO */}
          {poLinkStatus === 'Pending PO Link' && (
            <div className="alert alert-danger border-danger shadow-xs py-2.5 px-3 mb-4 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2">
                <i className="ti ti-alert-triangle-filled fs-18 text-danger"></i>
                <div>
                  <strong className="fs-13">Emergency Dispatch (Pending PO Link):</strong>
                  <span className="fs-12 ms-1">
                    Fabric dispatched urgently before PO creation. Admin alert active. Must link a PO retrospectively to close tracking gap.
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-danger btn-sm px-3 py-1 rounded fw-bold fs-12 shadow-xs"
                onClick={() => setShowLinkPOModal(true)}
              >
                <i className="ti ti-link me-1"></i> Link to PO Now
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 1: CHALLAN DETAILS & MULTI-PO BUNDLING (Section 4.1 & 4.2)        */}
          {/* ========================================================================= */}
          <div className="card border mb-4 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
            <div className="p-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: '#fafbfc' }}>
              <div className="d-flex align-items-center gap-2.5">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
                  <i className="ti ti-file-text fs-16"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark fs-14">Process PO Linkage &amp; Dispatch Details</h6>
                  <p className="text-muted fs-11 mb-0">Bundles one or many Process POs for the same vendor shipment</p>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3">
                {/* Emergency Dispatch Switch */}
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="emergencySwitch"
                    disabled={!isSectionEditable('header')}
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

                {isReadOnly && editingSection !== 'header' && (
                  <button
                    type="button"
                    className="btn btn-light btn-sm border text-primary px-2.5 py-1 rounded fs-12 fw-semibold"
                    onClick={() => setEditingSection('header')}
                  >
                    <i className="ti ti-edit me-1"></i> Edit Header
                  </button>
                )}
                {isReadOnly && editingSection === 'header' && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm px-2.5 py-1 rounded fs-12 fw-semibold"
                    onClick={() => setEditingSection(null)}
                  >
                    <i className="ti ti-check me-1"></i> Done
                  </button>
                )}
              </div>
            </div>

            <div className="p-4">
              {/* Multi-PO Bundling Selector (Section 4.2 & Page 15: PO=7611, 7612, 7613) */}
              {!isEmergencyDispatch && (
                <div className="mb-3 pb-3 border-bottom">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1.5 d-flex align-items-center justify-content-between">
                    <span>Bundled Process POs (Multi-Select) <span className="text-danger">*</span></span>
                    <span className="text-muted fs-11">Page 15 slip: Bundles multiple POs to same vendor in one shipment</span>
                  </label>

                  {availablePOs.length === 0 ? (
                    <div className="text-muted fs-12 p-2 bg-light border rounded">No active Process POs found.</div>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {availablePOs.map((po) => {
                        const isSelected = selectedPOs.some(ref => isPOMatched(po, ref));
                        return (
                          <button
                            type="button"
                            key={po.id || po.po_number}
                            disabled={!isSectionEditable('header')}
                            onClick={() => togglePOSelection(po)}
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
                      {stylesInfo.length > 0 && <span>• Styles: <strong className="text-dark">{stylesInfo.join(', ')}</strong></span>}
                      {customerBrand && <span>• Brand: <strong className="text-dark">{customerBrand}</strong></span>}
                    </div>
                  )}
                </div>
              )}

              <div className="row g-3">
                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Challan Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white fs-13 fw-bold text-primary"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={challanNumber}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setChallanNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Dispatch Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={date}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Vendor <span className="text-danger">*</span>
                  </label>
                  {isEmergencyDispatch ? (
                    <select
                      className="form-select form-select-sm bg-white fs-13"
                      style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                      value={vendorId}
                      disabled={!isSectionEditable('header')}
                      onChange={(e) => {
                        setVendorId(e.target.value);
                        const v = initialVendors.find(vend => vend.id === e.target.value);
                        if (v) setVendorName(v.name);
                      }}
                      required
                    >
                      <option value="">Select Vendor...</option>
                      {initialVendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control form-control-sm bg-white fs-13"
                      style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                      value={vendorName}
                      placeholder="Auto-carried from PO"
                      readOnly
                    />
                  )}
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Folding Notation (e.g. L100)
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={foldingNotation}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setFoldingNotation(e.target.value)}
                    placeholder="e.g. L100 / Fold 98"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: STOCK ALLOCATION & BALES DISPATCH (Section 4.2 & 4.4)          */}
          {/* ========================================================================= */}
          <div className="card border mb-4 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
            <div className="p-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: '#fafbfc' }}>
              <div className="d-flex align-items-center gap-2.5">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <i className="ti ti-packages fs-16"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark fs-14">Warehouse Stock Allocation (Bales / Rolls Dispatch)</h6>
                  <p className="text-muted fs-11 mb-0">FIFO older stock recommendation &amp; Single Batch Rule (Do Not Mix Invoices)</p>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                {isSectionEditable('items') && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm px-3 rounded-2 d-flex align-items-center gap-1.5"
                      onClick={() => setShowStockPickerModal(true)}
                    >
                      <i className="ti ti-building-warehouse fs-14"></i>
                      <span>Pick from Warehouse (FIFO)</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-light border btn-sm px-2.5 rounded-2 text-secondary"
                      onClick={addManualStockRow}
                    >
                      <i className="ti ti-plus fs-14"></i> Manual Row
                    </button>
                  </>
                )}

                {isReadOnly && editingSection !== 'items' && (
                  <button
                    type="button"
                    className="btn btn-light btn-sm border text-primary px-2.5 py-1 rounded fs-12 fw-semibold"
                    onClick={() => setEditingSection('items')}
                  >
                    <i className="ti ti-edit me-1"></i> Edit Stock Lines
                  </button>
                )}
                {isReadOnly && editingSection === 'items' && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm px-2.5 py-1 rounded fs-12 fw-semibold"
                    onClick={() => setEditingSection(null)}
                  >
                    <i className="ti ti-check me-1"></i> Done
                  </button>
                )}
              </div>
            </div>

            <div className="p-0">
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0" style={{ borderColor: '#dee2e6', fontSize: '13px' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr style={{ color: '#475569', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                      <th className="text-center py-2" style={{ width: '35px' }}>#</th>
                      <th style={{ minWidth: '150px' }}>Bale / Roll No *</th>
                      <th style={{ minWidth: '140px' }}>Stock Invoice Ref *</th>
                      <th style={{ minWidth: '160px' }}>Fabric Quality</th>
                      <th style={{ minWidth: '120px' }}>Color Shade</th>
                      <th style={{ width: '130px' }} className="text-center">Dispatch Mode</th>
                      <th style={{ width: '110px' }} className="text-end">Original (m)</th>
                      <th style={{ width: '130px' }} className="text-end text-primary">Dispatched (m) *</th>
                      <th style={{ width: '90px' }} className="text-center">Folding</th>
                      {isSectionEditable('items') && <th style={{ width: '40px' }} className="text-center">Act</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-4 text-muted">
                          No stock rolls allocated yet. Click <strong>"Pick from Warehouse (FIFO)"</strong> above to select rolls.
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
                              disabled={!isSectionEditable('items')}
                              onChange={(e) => handleItemFieldChange(idx, 'bale_roll_no', e.target.value)}
                              placeholder="e.g. Roll 2376-A"
                              required
                            />
                          </td>

                          {/* Stock Invoice Ref */}
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm fs-12 px-2 font-monospace"
                              style={{ borderColor: '#cbd5e1' }}
                              value={it.invoice_no}
                              disabled={!isSectionEditable('items')}
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
                              disabled={!isSectionEditable('items')}
                              onChange={(e) => handleItemFieldChange(idx, 'fabric_name', e.target.value)}
                              placeholder="100x100 Voile"
                            />
                          </td>

                          {/* Color */}
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm fs-12 px-2"
                              style={{ borderColor: '#cbd5e1' }}
                              value={it.color_name}
                              disabled={!isSectionEditable('items')}
                              onChange={(e) => handleItemFieldChange(idx, 'color_name', e.target.value)}
                              placeholder="Beige"
                            />
                          </td>

                          {/* Scenario A vs Scenario B: Full Roll vs Cut Piece */}
                          <td className="text-center">
                            <button
                              type="button"
                              disabled={!isSectionEditable('items')}
                              onClick={() => handleItemFieldChange(idx, 'is_partial_cut', !it.is_partial_cut)}
                              className={`badge border px-2 py-1 ${
                                it.is_partial_cut
                                  ? 'bg-warning-subtle text-dark border-warning'
                                  : 'bg-light text-secondary border'
                              }`}
                              style={{ cursor: isSectionEditable('items') ? 'pointer' : 'default', fontSize: '11px' }}
                              title="Toggle Full Roll (Scenario A) / Cut Piece (Scenario B)"
                            >
                              {it.is_partial_cut ? 'Scenario B: Cut Piece' : 'Scenario A: Full Roll'}
                            </button>
                            {it.is_partial_cut && (
                              <div className="text-muted fs-10 mt-0.5">Remaining stays in stock</div>
                            )}
                          </td>

                          {/* Original Meters */}
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control form-control-sm text-end fs-12 px-2"
                              style={{ borderColor: '#cbd5e1' }}
                              value={it.original_piece_meters}
                              disabled={!isSectionEditable('items')}
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
                              disabled={!isSectionEditable('items')}
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
                              value={it.folding || foldingNotation}
                              disabled={!isSectionEditable('items')}
                              onChange={(e) => handleItemFieldChange(idx, 'folding', e.target.value)}
                            />
                          </td>

                          {/* Delete */}
                          {isSectionEditable('items') && (
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
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>

                  <tfoot style={{ background: '#f8fafc' }}>
                    <tr className="fw-bold">
                      <td colSpan={7} className="text-end text-uppercase text-secondary py-2 fs-12">
                        Grand Total Dispatched:
                      </td>
                      <td className="text-end text-primary fs-13 py-2">
                        {Number(grandTotalMeters).toFixed(2)} m
                      </td>
                      <td colSpan={isSectionEditable('items') ? 2 : 1} className="text-muted fs-11 py-2 text-center">
                        ({items.length} {items.length === 1 ? 'Roll' : 'Rolls'})
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: SIGNATURES & REMARKS (Section 4.1 & 9)                          */}
          {/* ========================================================================= */}
          <div className="card border mb-2 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
            <div className="p-3 px-4 border-bottom d-flex align-items-center justify-content-between" style={{ background: '#fafbfc' }}>
              <span className="fw-bold text-dark fs-13">
                <i className="ti ti-writing-sign me-1.5 text-secondary"></i> Signatures &amp; Dispatch Remarks (Page 15)
              </span>
              {isReadOnly && editingSection !== 'terms' && (
                <button
                  type="button"
                  className="btn btn-light btn-sm border text-primary px-2.5 py-1 rounded fs-12 fw-semibold"
                  onClick={() => setEditingSection('terms')}
                >
                  <i className="ti ti-edit me-1"></i> Edit Signatures
                </button>
              )}
              {isReadOnly && editingSection === 'terms' && (
                <button
                  type="button"
                  className="btn btn-success btn-sm px-2.5 py-1 rounded fs-12 fw-semibold"
                  onClick={() => setEditingSection(null)}
                >
                  <i className="ti ti-check me-1"></i> Done
                </button>
              )}
            </div>

            <div className="p-4">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Company Representative Name (Authorized Signatory) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={companyRep}
                    disabled={!isSectionEditable('terms')}
                    onChange={(e) => setCompanyRep(e.target.value)}
                    placeholder="e.g. Anurag"
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Receiver's Signature / Driver Name
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={receiverSignature}
                    disabled={!isSectionEditable('terms')}
                    onChange={(e) => setReceiverSignature(e.target.value)}
                    placeholder="e.g. Raju Dyeing Rep / Driver"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Dispatch Remarks &amp; Gate Pass Notes
                  </label>
                  <textarea
                    className="form-control form-control-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', borderRadius: '6px' }}
                    rows="2"
                    value={remarks}
                    disabled={!isSectionEditable('terms')}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Handed over to Raju Dyeing driver with 13 thans (CH-4903)"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="card-footer bg-white border-top py-3 px-4 d-flex justify-content-between align-items-center">
          <div className="text-muted fs-12">
            Stock will be deducted from warehouse inventory and tracked as <strong>"Out for Processing"</strong> against {vendorName || 'Vendor'}.
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-light btn-sm border text-secondary px-3" onClick={onCancel}>
              Cancel
            </button>
            {!isReadOnly && (
              <>
                <button type="submit" className="btn btn-outline-primary btn-sm px-3 shadow-xs d-flex align-items-center gap-1.5">
                  <i className="ti ti-device-floppy fs-14"></i>
                  <span>Save Challan</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-3.5 shadow-sm d-flex align-items-center gap-1.5"
                  style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                  title="Save challan and proceed immediately to record vendor return when goods arrive back"
                  onClick={(e) => handleSubmit(e, true)}
                >
                  <i className="ti ti-receipt-refund fs-14"></i>
                  <span>Save &amp; Inward Return (GRN) →</span>
                </button>
              </>
            )}
            {isReadOnly && onRecordReturn && (
              <button
                type="button"
                className="btn btn-success btn-sm px-3.5 shadow-sm d-flex align-items-center gap-1.5"
                onClick={() => onRecordReturn(initialChallan)}
              >
                <i className="ti ti-receipt-refund fs-14"></i>
                <span>Record Inbound Return (GRN) →</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Modal: Warehouse Stock Picker (FIFO & Single Batch Rule) */}
      {showStockPickerModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
              <div className="modal-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="modal-title fw-bold text-dark fs-15">
                    <i className="ti ti-building-warehouse text-primary me-2"></i>
                    Warehouse Stock Allocation (FIFO &amp; Single Batch Priority)
                  </h6>
                  <p className="text-muted fs-11 mb-0">System prioritises older stock and matching single purchase invoice batch</p>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowStockPickerModal(false)}></button>
              </div>
              <div className="modal-body p-4" style={{ background: '#f8fafc' }}>
                <div className="table-responsive bg-white border rounded">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                    <thead className="table-light">
                      <tr className="text-secondary fs-11">
                        <th>Priority (FIFO)</th>
                        <th>Bale / Roll No</th>
                        <th>Purchase Invoice Ref</th>
                        <th>Fabric Quality</th>
                        <th>Color Shade</th>
                        <th className="text-end">Available (m)</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warehouseStockPool.map((roll, idx) => (
                        <tr key={idx}>
                          <td>
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-10">
                              Age: {roll.ageDays} days (FIFO #{idx + 1})
                            </span>
                          </td>
                          <td className="fw-bold font-monospace text-dark">{roll.baleNo}</td>
                          <td className="font-monospace text-secondary">{roll.invoiceNo}</td>
                          <td>{roll.fabric}</td>
                          <td>{roll.color}</td>
                          <td className="text-end fw-bold text-success">{roll.meters.toFixed(1)} m</td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-primary btn-xs px-2.5 py-1 shadow-xs rounded"
                              onClick={() => handleSelectWarehouseRoll(roll)}
                            >
                              + Allocate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer bg-white border-top py-2.5 px-4">
                <button type="button" className="btn btn-light btn-sm border" onClick={() => setShowStockPickerModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Link PO (Emergency Challan Resolution) */}
      {showLinkPOModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
              <div className="modal-header bg-white py-3 px-4 border-bottom">
                <h6 className="modal-title fw-bold text-dark fs-15">
                  <i className="ti ti-link text-primary me-2"></i>
                  Link Emergency Challan to a Process PO
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowLinkPOModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted fs-12 mb-3">
                  Select a Process PO to link to this Challan. Once linked, the red <strong>"Pending PO Link"</strong> alert will be resolved.
                </p>
                <div className="d-flex flex-column gap-2">
                  {availablePOs.map((po) => (
                    <button
                      type="button"
                      key={po.id || po.po_number}
                      className="btn btn-light border text-start p-2.5 rounded d-flex justify-content-between align-items-center"
                      onClick={() => {
                        setSelectedPOs([po.po_number || po.id]);
                        setIsEmergencyDispatch(false);
                        setShowLinkPOModal(false);
                        alert(`Challan #${challanNumber} linked successfully to Process PO #${po.po_number || po.id}! Alert cleared.`);
                      }}
                    >
                      <div>
                        <strong className="text-dark fs-13">PO #{po.po_number || po.id}</strong>
                        <div className="text-muted fs-11">{po.vendor_name} • {po.total_meters}m</div>
                      </div>
                      <span className="badge bg-primary text-white fs-11">Link Now</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
