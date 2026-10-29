import React, { useState, useEffect } from 'react';
import { initialVendors } from '../../data/procurementData';
import { initialColors } from '../../data/salesOrderData';
import AddColorModal from '../Procurement/AddColorModal';

/**
 * ProcessReturnForm - Inbound Processing GRN / Vendor Return
 * Strict Implementation of PDF Section 5, 5.2, 5.3 & 12.3
 * Features:
 * - Vendor Name + External Challan No unique composite key
 * - Stated Summary vs Piece-Wise Meterage Validation (Section 5.2 & 12.3: Flags mismatch)
 * - Dedicated Grey Fabric Return & Open Bale Generation (Section 5.3 & 12.3)
 *   Multi-Invoice Auto-Resolution to largest stock balance, with Manual Override option
 * - Collapsible Transport Panel (hidden by default, expands on click)
 * - Default View Mode with Section-wise Independent Edit Buttons (Section 13.3)
 * - Action buttons: Save Return, Save & Run QC (direct redirect to QC inspection), Close
 */
export default function ProcessReturnForm({
  availablePOs = [],
  availableChallans = [],
  onSave,
  onCancel,
  initialReturn,
  readOnlyDefault = false,
  qcRecords = []
}) {
  const isExistingSavedReturn = Boolean(initialReturn && initialReturn.id);

  // Workflow Locking: An Inbound Return can ONLY be locked if it is an existing saved return
  // AND QC inspection has already been completed/finalized for it
  const isLocked = Boolean(
    isExistingSavedReturn && (
      initialReturn.is_locked ||
      initialReturn.status === 'Inspected' ||
      initialReturn.status === 'QC Completed' ||
      (qcRecords && qcRecords.length > 0 && qcRecords.some(q =>
        (q.return_id && initialReturn.id && q.return_id === initialReturn.id) ||
        (q.challan_no && initialReturn.vendor_external_challan_no && q.challan_no === initialReturn.vendor_external_challan_no)
      ))
    )
  );

  const [isReadOnly, setIsReadOnly] = useState(isLocked ? true : Boolean(readOnlyDefault));
  const [editingSection, setEditingSection] = useState(isLocked ? null : 'all');

  const [linkedPoId, setLinkedPoId] = useState(initialReturn?.linked_po_id || (availablePOs[0]?.id || ''));
  const [linkedChallanId, setLinkedChallanId] = useState(initialReturn?.linked_challan_id || (availableChallans[0]?.id || ''));

  // Vendor Identification
  const [vendorId, setVendorId] = useState(() => {
    if (initialReturn?.vendor_id) return initialReturn.vendor_id;
    if (availablePOs && availablePOs.length > 0) return availablePOs[0].vendor_id || initialVendors[0]?.id || '';
    return initialVendors[0]?.id || '';
  });

  const [vendorName, setVendorName] = useState(() => {
    if (initialReturn?.vendor_name) return initialReturn.vendor_name;
    if (availablePOs && availablePOs.length > 0) return availablePOs[0].vendor_name || initialVendors[0]?.name || '';
    return initialVendors[0]?.name || '';
  });

  const [externalChallanNo, setExternalChallanNo] = useState(initialReturn?.vendor_external_challan_no || '');
  const [externalChallanDate, setExternalChallanDate] = useState(initialReturn?.vendor_challan_date || new Date().toISOString().split('T')[0]);
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState(initialReturn?.vendor_invoice_no || '');
  const [vendorInvoiceValue, setVendorInvoiceValue] = useState(initialReturn?.vendor_invoice_value || '');
  const [receivedDate, setReceivedDate] = useState(initialReturn?.received_date || new Date().toISOString().split('T')[0]);

  const [fabricQuality, setFabricQuality] = useState(() => {
    if (initialReturn?.fabric_quality) return initialReturn.fabric_quality;
    if (availablePOs && availablePOs.length > 0) {
      return availablePOs[0].fabric_quality || availablePOs[0].items?.[0]?.fabric_name || '100x100 Voile Solid Dye';
    }
    return '100x100 Voile Solid Dye';
  });

  const [width, setWidth] = useState(initialReturn?.width || '48');
  const [weight, setWeight] = useState(initialReturn?.weight || '122.5');
  const [foldingStandard, setFoldingStandard] = useState(initialReturn?.folding_standard || 'Fold 100');

  // Stated vs Entered Validation (Section 5.2)
  const [vendorDeclaredMeters, setVendorDeclaredMeters] = useState(initialReturn?.vendor_declared_meters || '');
  const [vendorDeclaredPieces, setVendorDeclaredPieces] = useState(initialReturn?.vendor_declared_pieces || '');

  // Section 5.3: Dedicated Grey Fabric Return & Open Bale
  const [greyFabricReturned, setGreyFabricReturned] = useState(initialReturn?.grey_fabric_returned_meters || 0);
  const [targetInvoiceForGrey, setTargetInvoiceForGrey] = useState(
    initialReturn?.target_invoice_for_grey || 'INV-MS-0091 (M.S. Textiles - Auto Assigned Largest Balance)'
  );
  const [isManualInvoiceOverride, setIsManualInvoiceOverride] = useState(false);

  // Available Purchase Invoices for Grey Fabric Resolution
  const availablePurchaseInvoices = [
    { invoiceNo: 'INV-MS-0091', supplier: 'M.S. Textiles', remainingStock: 4850.00, isLargest: true },
    { invoiceNo: 'INV-MS-0095', supplier: 'M.S. Textiles', remainingStock: 1200.00, isLargest: false },
    { invoiceNo: 'INV-LIVA-201', supplier: 'Liva Rayon Mills', remainingStock: 800.00, isLargest: false }
  ];

  // Collapsible Transport Section (Section 5.2)
  const [showTransport, setShowTransport] = useState(Boolean(initialReturn?.transport_details?.lr_number));
  const [lrNumber, setLrNumber] = useState(initialReturn?.transport_details?.lr_number || '');
  const [lrDate, setLrDate] = useState(initialReturn?.transport_details?.lr_date || new Date().toISOString().split('T')[0]);
  const [transporterName, setTransporterName] = useState(initialReturn?.transport_details?.transporter_name || '');
  const [vehicleNo, setVehicleNo] = useState(initialReturn?.transport_details?.vehicle_no || '');

  // Color Master
  const [colorMasterList, setColorMasterList] = useState(() => {
    let list = [...initialColors];
    try {
      const s = localStorage.getItem('raindrop_colors_v1');
      if (s) {
        const parsed = JSON.parse(s);
        parsed.forEach(c => {
          if (!list.some(existing => existing.name?.toLowerCase() === c.name?.toLowerCase())) list.push(c);
        });
      }
    } catch (e) {}
    return list;
  });

  const [showInlineColorModal, setShowInlineColorModal] = useState(false);
  const [activeColorRowIndex, setActiveColorRowIndex] = useState(null);

  // Piece-Wise Grid Data
  const [pieces, setPieces] = useState(() => {
    if (initialReturn?.pieces && initialReturn.pieces.length > 0) {
      return initialReturn.pieces;
    }
    return [
      { id: 1, piece_no: 1, meters: 63.10, color_name: 'Beige', folding: 'Fold 100' },
      { id: 2, piece_no: 2, meters: 104.10, color_name: 'Beige', folding: 'Fold 100' },
      { id: 3, piece_no: 3, meters: 184.60, color_name: 'Beige', folding: 'Fold 100' },
      { id: 4, piece_no: 4, meters: 119.60, color_name: 'Beige', folding: 'Fold 100' }
    ];
  });

  // Calculate grid sum
  const calculatedTotalMeters = pieces.reduce((acc, p) => acc + (parseFloat(p.meters) || 0), 0);
  const statedMeters = parseFloat(vendorDeclaredMeters) || 0;
  const isMeterMismatch = statedMeters > 0 && Math.abs(calculatedTotalMeters - statedMeters) > 0.05;
  const meterDifference = statedMeters > 0 ? (calculatedTotalMeters - statedMeters).toFixed(2) : 0;

  const handlePieceMeterChange = (index, value) => {
    const updated = [...pieces];
    updated[index].meters = value;
    setPieces(updated);
  };

  const addPieceRow = () => {
    setPieces([
      ...pieces,
      {
        id: Date.now(),
        piece_no: pieces.length + 1,
        meters: '',
        color_name: pieces[pieces.length - 1]?.color_name || 'Beige',
        folding: foldingStandard
      }
    ]);
  };

  const removePieceRow = (idx) => {
    if (pieces.length <= 1) return;
    const filtered = pieces.filter((_, i) => i !== idx).map((p, i) => ({ ...p, piece_no: i + 1 }));
    setPieces(filtered);
  };

  const handleSubmit = (e, andRunQC = false) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!externalChallanNo) {
      alert("Please enter the Vendor's External Challan Number (e.g. #2196).");
      return;
    }

    if (isMeterMismatch) {
      const confirmSave = window.confirm(
        `⚠️ Validation Warning (Section 5.2 & 12.3):\n\nPiece-wise sum (${calculatedTotalMeters.toFixed(2)}m) does NOT match vendor declared total (${statedMeters.toFixed(2)}m).\nDifference: ${meterDifference}m.\n\nDo you want to override and save?`
      );
      if (!confirmSave) return;
    }

    const returnPayload = {
      id: initialReturn?.id || `PRN-${externalChallanNo}`,
      vendor_id: vendorId,
      vendor_name: vendorName,
      vendor_external_challan_no: externalChallanNo,
      vendor_challan_date: externalChallanDate,
      vendor_invoice_no: vendorInvoiceNo,
      vendor_invoice_date: externalChallanDate,
      vendor_invoice_value: parseFloat(vendorInvoiceValue) || 0,
      internal_series: 'Job Work',
      linked_po_id: linkedPoId,
      linked_challan_id: linkedChallanId,
      received_date: receivedDate,
      fabric_quality: fabricQuality,
      width,
      weight: parseFloat(weight) || 0,
      folding_standard: foldingStandard,
      total_pieces: pieces.length,
      total_meters: Number(calculatedTotalMeters.toFixed(2)),
      vendor_declared_pieces: parseInt(vendorDeclaredPieces, 10) || pieces.length,
      vendor_declared_meters: statedMeters || calculatedTotalMeters,
      grey_fabric_returned_meters: parseFloat(greyFabricReturned) || 0,
      target_invoice_for_grey: targetInvoiceForGrey,
      transport_details: {
        lr_number: lrNumber,
        lr_date: lrDate,
        transporter_name: transporterName,
        vehicle_no: vehicleNo
      },
      status: initialReturn?.status || 'Received',
      created_by: initialReturn?.created_by || 'Saksham Garg',
      created_at: initialReturn?.created_at || new Date().toISOString(),
      pieces: pieces.map(p => ({
        ...p,
        meters: parseFloat(p.meters) || 0,
        qc_status: p.qc_status || 'Pending'
      }))
    };

    onSave(returnPayload);
  };

  const isSectionEditable = (sectionKey) => {
    if (isLocked) return false;
    if (!isReadOnly) return true;
    return editingSection === sectionKey || editingSection === 'all';
  };

  return (
    <div className="card shadow-sm border mb-4" style={{ borderRadius: '12px', borderColor: '#e2e8f0', background: '#ffffff' }}>
      {/* Banner Header */}
      <div className="card-header bg-white py-3 px-4 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
            style={{ width: '42px', height: '42px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}
          >
            <i className="ti ti-receipt-refund fs-22"></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="card-title mb-0 fw-bold text-dark fs-18">
                {isExistingSavedReturn ? (isReadOnly ? `Vendor Return #${externalChallanNo} (View Mode)` : `Edit Return #${externalChallanNo}`) : 'Record Inward Return (Vendor GRN)'}
              </h5>
              <span className={`badge px-2 py-0.5 fs-11 fw-bold ${
                isLocked
                  ? 'bg-secondary text-white border border-secondary shadow-xs'
                  : 'bg-primary-subtle text-primary border border-primary-subtle'
              }`}>
                {isLocked ? '🔒 Locked (QC Inspected)' : 'Job Work Series'}
              </span>
            </div>
            <div className="text-muted fs-12 mt-0.5 d-flex align-items-center gap-2">
              <span>Vendor physical challan entry</span>
              <span>•</span>
              <span className="fw-semibold text-primary">{vendorName || 'Vendor Assignment'}</span>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {!isLocked && (
            isReadOnly ? (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm px-3 rounded-2 d-flex align-items-center gap-1.5"
                onClick={() => {
                  setIsReadOnly(false);
                  setEditingSection('all');
                }}
              >
                <i className="ti ti-edit fs-15"></i>
                <span>Edit Return</span>
              </button>
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

          <button
            type="button"
            className="btn btn-light btn-sm border px-3 rounded-2 d-flex align-items-center gap-1.5 text-secondary"
            onClick={onCancel}
          >
            <i className="ti ti-x fs-15"></i>
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Lock Banner if QC Completed */}
      {isLocked && (
        <div className="alert alert-warning border-warning d-flex align-items-center justify-content-between p-3 m-4 mb-0 rounded-3 shadow-xs">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-warning text-dark p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              <i className="ti ti-lock fs-20"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-dark fs-14">Return / GRN Workflow Locked — Read Only</h6>
              <p className="mb-0 fs-12 text-secondary">
                This Inbound Return (GRN) is locked because Quality Control Inspection has already been completed. Piece-wise breakdown and grey return quantities cannot be modified.
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

          {/* ========================================================================= */}
          {/* SECTION 1: VENDOR IDENTIFICATION & INBOUND DETAILS (Section 5.1 & 5.2)    */}
          {/* ========================================================================= */}
          <div className="card border mb-4 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
            <div className="p-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: '#fafbfc' }}>
              <div className="d-flex align-items-center gap-2.5">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
                  <i className="ti ti-id fs-16"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark fs-14">Vendor Identification &amp; Physical Challan Numbers</h6>
                  <p className="text-muted fs-11 mb-0">Vendor Name + External Challan No prevents duplicate number clashes</p>
                </div>
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

            <div className="p-4">
              <div className="row g-3">
                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Vendor (Job Worker) <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-select-sm bg-white fs-13 fw-semibold text-dark"
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
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Vendor's External Challan No. <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white fs-13 fw-bold text-primary font-monospace"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={externalChallanNo}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setExternalChallanNo(e.target.value)}
                    placeholder="e.g. 2196 (Page 20 slip)"
                    required
                  />
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">Vendor's Challan Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={externalChallanDate}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setExternalChallanDate(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">Received Date at Factory</label>
                  <input
                    type="date"
                    className="form-control form-control-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={receivedDate}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setReceivedDate(e.target.value)}
                  />
                </div>

                {/* Linked PO & Internal Challan */}
                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">Linked Process PO</label>
                  <select
                    className="form-select form-select-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={linkedPoId}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setLinkedPoId(e.target.value)}
                  >
                    <option value="">-- Select Linked PO --</option>
                    {availablePOs.map(po => (
                      <option key={po.id || po.po_number} value={po.po_number || po.id}>
                        PO #{po.po_number || po.id} ({po.vendor_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">Linked Internal Challan</label>
                  <select
                    className="form-select form-select-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={linkedChallanId}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setLinkedChallanId(e.target.value)}
                  >
                    <option value="">-- Select Challan --</option>
                    {availableChallans.map(ch => (
                      <option key={ch.id || ch.challan_number} value={ch.challan_number || ch.id}>
                        CH #{ch.challan_number || ch.id} ({ch.vendor_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">Fabric Quality</label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={fabricQuality}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setFabricQuality(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">Folding Standard</label>
                  <select
                    className="form-select form-select-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={foldingStandard}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setFoldingStandard(e.target.value)}
                  >
                    <option value="Fold 100">Fold 100 (Standard)</option>
                    <option value="Fold 98">Fold 98</option>
                    <option value="Fold 97">Fold 97</option>
                    <option value="L100">L100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: PIECE-WISE METERAGE GRID & STATED VALIDATION (Section 5.2)     */}
          {/* ========================================================================= */}
          <div className="card border mb-4 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
            <div className="p-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: '#fafbfc' }}>
              <div className="d-flex align-items-center gap-2.5">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                  <i className="ti ti-ruler-measure fs-16"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark fs-14">Piece-Wise Meterage Breakdown &amp; Summary Validation</h6>
                  <p className="text-muted fs-11 mb-0">Validates vendor stated summary against piece-wise total</p>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                {isSectionEditable('pieces') && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm px-3 rounded-2 d-flex align-items-center gap-1.5 shadow-xs"
                    onClick={addPieceRow}
                  >
                    <i className="ti ti-plus fs-14"></i>
                    <span>+ Add Piece / Than</span>
                  </button>
                )}

                {isReadOnly && editingSection !== 'pieces' && (
                  <button
                    type="button"
                    className="btn btn-light btn-sm border text-primary px-2.5 py-1 rounded fs-12 fw-semibold"
                    onClick={() => setEditingSection('pieces')}
                  >
                    <i className="ti ti-edit me-1"></i> Edit Pieces
                  </button>
                )}
                {isReadOnly && editingSection === 'pieces' && (
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
              {/* Vendor Stated Summary Inputs */}
              <div className="p-3 rounded-3 mb-3 border d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: '#f8faff', borderColor: '#c7d2fe' }}>
                <div className="d-flex align-items-center gap-3">
                  <div>
                    <label className="form-label fs-11 fw-bold text-secondary text-uppercase mb-1">
                      Vendor Stated Thans / Pieces
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-sm bg-white fs-13 text-center fw-bold"
                      style={{ width: '130px', height: '36px', borderColor: '#cbd5e1' }}
                      value={vendorDeclaredPieces}
                      disabled={!isSectionEditable('pieces')}
                      onChange={(e) => setVendorDeclaredPieces(e.target.value)}
                      placeholder="e.g. 13"
                    />
                  </div>

                  <div>
                    <label className="form-label fs-11 fw-bold text-secondary text-uppercase mb-1">
                      Vendor Stated Total Metres
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control form-control-sm bg-white fs-13 text-end fw-bold text-primary"
                      style={{ width: '160px', height: '36px', borderColor: '#cbd5e1' }}
                      value={vendorDeclaredMeters}
                      disabled={!isSectionEditable('pieces')}
                      onChange={(e) => setVendorDeclaredMeters(e.target.value)}
                      placeholder="e.g. 1477.60"
                    />
                  </div>
                </div>

                {/* Validation Status Badge */}
                <div className="d-flex align-items-center gap-2">
                  {statedMeters > 0 && (
                    isMeterMismatch ? (
                      <div className="badge bg-danger-subtle text-danger border border-danger-subtle p-2 fs-12 d-flex align-items-center gap-1.5">
                        <i className="ti ti-alert-circle fs-16"></i>
                        <span>
                          <strong>Mismatch Flagged:</strong> Stated {statedMeters.toFixed(2)}m vs Grid {calculatedTotalMeters.toFixed(2)}m (Diff: {meterDifference > 0 ? `+${meterDifference}` : meterDifference}m)
                        </span>
                      </div>
                    ) : (
                      <div className="badge bg-success-subtle text-success border border-success-subtle p-2 fs-12 d-flex align-items-center gap-1.5">
                        <i className="ti ti-circle-check fs-16"></i>
                        <span><strong>100% Match:</strong> Stated Summary matches Piece-wise Grid exactly!</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Piece-Wise Table */}
              <div className="table-responsive bg-white border rounded">
                <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                  <thead className="table-light">
                    <tr className="text-secondary fs-11 text-uppercase">
                      <th className="text-center" style={{ width: '40px' }}>Than #</th>
                      <th style={{ minWidth: '150px' }}>Color Shade</th>
                      <th style={{ width: '140px' }}>Folding</th>
                      <th style={{ width: '160px' }} className="text-end text-primary">Length (Metres) *</th>
                      <th style={{ width: '130px' }} className="text-center">QC Status</th>
                      {isSectionEditable('pieces') && <th style={{ width: '45px' }} className="text-center">Act</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pieces.map((p, idx) => (
                      <tr key={p.id || idx}>
                        <td className="text-center fw-bold text-muted font-monospace">{idx + 1}</td>
                        <td>
                          <select
                            className="form-select form-select-sm bg-white fs-12"
                            style={{ borderColor: '#cbd5e1' }}
                            value={p.color_name}
                            disabled={!isSectionEditable('pieces')}
                            onChange={(e) => {
                              const updated = [...pieces];
                              updated[idx].color_name = e.target.value;
                              setPieces(updated);
                            }}
                          >
                            {colorMasterList.map(c => (
                              <option key={c.id || c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm fs-12"
                            style={{ borderColor: '#cbd5e1' }}
                            value={p.folding || foldingStandard}
                            disabled={!isSectionEditable('pieces')}
                            onChange={(e) => {
                              const updated = [...pieces];
                              updated[idx].folding = e.target.value;
                              setPieces(updated);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control form-control-sm text-end fw-bold text-dark fs-12"
                            style={{ borderColor: '#cbd5e1' }}
                            value={p.meters}
                            disabled={!isSectionEditable('pieces')}
                            onChange={(e) => handlePieceMeterChange(idx, e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </td>
                        <td className="text-center">
                          <span className={`badge fs-10 ${
                            p.qc_status === 'Accepted' ? 'bg-success-subtle text-success border border-success-subtle' :
                            p.qc_status === 'Rejected - Reprocess' ? 'bg-danger-subtle text-danger border border-danger-subtle' :
                            'bg-light text-secondary border'
                          }`}>
                            {p.qc_status || 'Pending QC'}
                          </span>
                        </td>
                        {isSectionEditable('pieces') && (
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-link text-danger p-0"
                              onClick={() => removePieceRow(idx)}
                              disabled={pieces.length <= 1}
                              title="Delete than"
                            >
                              <i className="ti ti-trash fs-15"></i>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>

                  <tfoot className="table-light">
                    <tr className="fw-bold">
                      <td colSpan={3} className="text-end text-uppercase text-secondary py-2 fs-12">
                        Total Recorded Pieces &amp; Metres:
                      </td>
                      <td className="text-end text-primary fs-13 py-2">
                        {Number(calculatedTotalMeters).toFixed(2)} m
                      </td>
                      <td colSpan={isSectionEditable('pieces') ? 2 : 1} className="text-muted fs-11 py-2 text-center">
                        ({pieces.length} Thans)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: GREY FABRIC RETURN & OPEN BALE (Section 5.3 & 12.3)            */}
          {/* ========================================================================= */}
          <div className="card border mb-4 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
            <div className="p-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: '#fafbfc' }}>
              <div className="d-flex align-items-center gap-2.5">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04' }}>
                  <i className="ti ti-archive fs-16"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark fs-14">Grey Fabric Return &amp; Open Bale Resolution</h6>
                  <p className="text-muted fs-11 mb-0">Unutilised raw fabric returns as an Open Bale linked to original vendor purchase invoice</p>
                </div>
              </div>

              {isReadOnly && editingSection !== 'grey' && (
                <button
                  type="button"
                  className="btn btn-light btn-sm border text-primary px-2.5 py-1 rounded fs-12 fw-semibold"
                  onClick={() => setEditingSection('grey')}
                >
                  <i className="ti ti-edit me-1"></i> Edit Grey Return
                </button>
              )}
              {isReadOnly && editingSection === 'grey' && (
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
                <div className="col-12 col-md-4">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Grey Fabric Returned (Metres)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-sm bg-white fs-13 text-end fw-bold text-amber-700"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={greyFabricReturned}
                    disabled={!isSectionEditable('grey')}
                    onChange={(e) => setGreyFabricReturned(e.target.value)}
                    placeholder="e.g. 40.00"
                  />
                  <div className="text-muted fs-11 mt-1">If vendor returns unutilised raw grey roll/cuts</div>
                </div>

                <div className="col-12 col-md-8">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-0">
                      Open Bale Target Purchase Invoice (Auto-Resolution vs Manual Override)
                    </label>
                    {isSectionEditable('grey') && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-primary text-decoration-none fs-11"
                        onClick={() => setIsManualInvoiceOverride(!isManualInvoiceOverride)}
                      >
                        {isManualInvoiceOverride ? 'Switch to Auto-Assign' : 'Manual Override'}
                      </button>
                    )}
                  </div>

                  {isManualInvoiceOverride ? (
                    <select
                      className="form-select form-select-sm bg-white fs-13"
                      style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                      value={targetInvoiceForGrey}
                      disabled={!isSectionEditable('grey')}
                      onChange={(e) => setTargetInvoiceForGrey(e.target.value)}
                    >
                      {availablePurchaseInvoices.map(inv => (
                        <option key={inv.invoiceNo} value={`${inv.invoiceNo} (${inv.supplier})`}>
                          {inv.invoiceNo} — {inv.supplier} (Remaining Stock: {inv.remainingStock.toFixed(1)}m)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="form-control form-control-sm bg-light text-dark fs-13 d-flex align-items-center gap-2" style={{ height: '38px', borderRadius: '6px' }}>
                      <i className="ti ti-sparkles text-warning"></i>
                      <span><strong>Auto-Assigned:</strong> INV-MS-0091 (M.S. Textiles - Largest Remaining Stock Balance)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: COLLAPSIBLE TRANSPORT PANEL (Section 5.2)                      */}
          {/* ========================================================================= */}
          <div className="card border mb-2 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
            <div
              className="p-3 px-4 border-bottom d-flex align-items-center justify-content-between"
              style={{ background: '#fafbfc', cursor: 'pointer' }}
              onClick={() => setShowTransport(!showTransport)}
            >
              <div className="d-flex align-items-center gap-2">
                <i className="ti ti-truck-delivery text-secondary fs-16"></i>
                <span className="fw-bold text-dark fs-13">Transport &amp; LR Details (Collapsible)</span>
                <span className="badge bg-light text-muted border fs-10">Hidden by default for local job work</span>
              </div>
              <i className={`ti ti-chevron-${showTransport ? 'up' : 'down'} text-secondary`}></i>
            </div>

            {showTransport && (
              <div className="p-4">
                <div className="row g-3">
                  <div className="col-12 col-md-3">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">LR Number</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-white fs-13"
                      style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                      value={lrNumber}
                      disabled={!isSectionEditable('transport')}
                      onChange={(e) => setLrNumber(e.target.value)}
                      placeholder="e.g. LR-9981"
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">LR Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm bg-white fs-13"
                      style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                      value={lrDate}
                      disabled={!isSectionEditable('transport')}
                      onChange={(e) => setLrDate(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">Transporter Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-white fs-13"
                      style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                      value={transporterName}
                      disabled={!isSectionEditable('transport')}
                      onChange={(e) => setTransporterName(e.target.value)}
                      placeholder="e.g. Local Auto Tempo"
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">Vehicle No.</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-white fs-13"
                      style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                      value={vehicleNo}
                      disabled={!isSectionEditable('transport')}
                      onChange={(e) => setVehicleNo(e.target.value)}
                      placeholder="e.g. GJ-05-BX-4120"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="card-footer bg-white border-top py-3 px-4 d-flex justify-content-between align-items-center">
          <div className="text-muted fs-12">
            Inward goods will be logged into incoming queue for Quality Control &amp; Lot Splitting
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-light btn-sm border text-secondary px-3" onClick={onCancel}>
              Cancel
            </button>
            {!isReadOnly && (
              <>
                <button type="submit" className="btn btn-outline-primary btn-sm px-3 shadow-xs d-flex align-items-center gap-1.5">
                  <i className="ti ti-device-floppy fs-14"></i>
                  <span>Save Inbound Return</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-3.5 shadow-sm d-flex align-items-center gap-1.5"
                  style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                  title="Save return and proceed directly to Quality Control & Lot Splitting"
                  onClick={(e) => handleSubmit(e, true)}
                >
                  <i className="ti ti-checkup-list fs-14"></i>
                  <span>Save &amp; Inspect in QC (Next Step) →</span>
                </button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
