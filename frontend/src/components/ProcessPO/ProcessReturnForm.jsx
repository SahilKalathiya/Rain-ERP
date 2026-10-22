import React, { useState, useEffect } from 'react';
import { initialVendors } from '../../data/procurementData';
import { initialColors } from '../../data/salesOrderData';
import AddColorModal from '../Procurement/AddColorModal';

/**
 * ProcessReturnForm - Vendor Return / Inbound Processing GRN
 * Implementation of Section 5 of PDF Specification
 * Features:
 * - Unified clean card layout (removes separate disjointed cards & 1., 2., 3. numbering)
 * - Vendor labeled as "Vendor (Job Worker) *"
 * - Auto-carries Vendor and Fabric Quality from Linked Process PO
 * - COLOR dropdown populated from Color Master + Linked PO colors + Inline "+ Master Color" creation
 * - Piece-wise meterage grid with auto sum validation against vendor stated summary
 * - Grey fabric return (creates Open Bale with audit trail per Section 5.3)
 * - Collapsible transport details
 */
export default function ProcessReturnForm({ availablePOs = [], availableChallans = [], onSave, onCancel, initialReturn }) {
  const isEditing = Boolean(initialReturn);

  const [linkedPoId, setLinkedPoId] = useState(initialReturn?.linked_po_id || (availablePOs[0]?.id || ''));
  const [linkedChallanId, setLinkedChallanId] = useState(initialReturn?.linked_challan_id || (availableChallans[0]?.id || ''));

  // Vendor (Job Worker) state - initialized from initialReturn or linked PO or initialVendors
  const [vendorId, setVendorId] = useState(() => {
    if (initialReturn?.vendor_id) return initialReturn.vendor_id;
    if (availablePOs && availablePOs.length > 0) {
      return availablePOs[0].vendor_id || initialVendors[0]?.id || '';
    }
    return initialVendors[0]?.id || '';
  });

  const [vendorName, setVendorName] = useState(() => {
    if (initialReturn?.vendor_name) return initialReturn.vendor_name;
    if (availablePOs && availablePOs.length > 0) {
      return availablePOs[0].vendor_name || initialVendors[0]?.name || '';
    }
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
      return availablePOs[0].fabric_quality || availablePOs[0].items?.[0]?.fabric_name || '';
    }
    return '';
  });

  const [width, setWidth] = useState(() => {
    if (initialReturn?.width) return initialReturn.width;
    if (availablePOs && availablePOs.length > 0 && availablePOs[0].items?.[0]?.width) {
      return availablePOs[0].items[0].width;
    }
    return '48';
  });

  const [weight, setWeight] = useState(initialReturn?.weight || '');
  const [foldingStandard, setFoldingStandard] = useState(initialReturn?.folding_standard || 'Fold 100');
  
  // Stated vs Entered Validation (Section 5.2)
  const [vendorDeclaredMeters, setVendorDeclaredMeters] = useState(initialReturn?.vendor_declared_meters || '');
  const [vendorDeclaredPieces, setVendorDeclaredPieces] = useState(initialReturn?.vendor_declared_pieces || '');
  
  // Dedicated Grey Fabric Return Section (Section 5.3)
  const [greyFabricReturned, setGreyFabricReturned] = useState(initialReturn?.grey_fabric_returned_meters || '');
  const [targetInvoiceForGrey, setTargetInvoiceForGrey] = useState(initialReturn?.target_invoice_for_grey || 'INV-MS-0091 (M.S. Textiles - Largest Balance)');

  // Collapsible Transport Section (Section 5.2)
  const [showTransport, setShowTransport] = useState(Boolean(initialReturn?.transport_details?.lr_number));
  const [lrNumber, setLrNumber] = useState(initialReturn?.transport_details?.lr_number || '');
  const [lrDate, setLrDate] = useState(initialReturn?.transport_details?.lr_date || new Date().toISOString().split('T')[0]);
  const [transporterName, setTransporterName] = useState(initialReturn?.transport_details?.transporter_name || '');
  const [vehicleNo, setVehicleNo] = useState(initialReturn?.transport_details?.vehicle_no || '');

  // Color Master list initialized with initialColors and localStorage persistence
  const [colorMasterList, setColorMasterList] = useState(() => {
    let list = [...initialColors];
    try {
      const s = localStorage.getItem('raindrop_colors_v1') || localStorage.getItem('erp_colors_master_v1');
      if (s) {
        const parsed = JSON.parse(s);
        parsed.forEach(c => {
          if (!list.some(existing => (c.name && existing.name?.toLowerCase() === c.name.toLowerCase()))) {
            list.push(c);
          }
        });
      }
    } catch (e) {}
    return list;
  });

  // Modal for inline Color Master creation
  const [showInlineColorModal, setShowInlineColorModal] = useState(false);
  const [activeColorRowIndex, setActiveColorRowIndex] = useState(null);

  const selectedPO = availablePOs.find(p =>
    p.id === linkedPoId || p.po_number === linkedPoId || `PPO-${p.po_number}` === linkedPoId
  );

  const poColors = selectedPO?.items
    ? Array.from(new Set(selectedPO.items.map(it => it.color_name).filter(Boolean)))
    : (selectedPO?.color_name ? [selectedPO.color_name] : []);

  // Piece-Wise Grid Data
  const [pieces, setPieces] = useState(
    initialReturn?.pieces && initialReturn.pieces.length > 0
      ? initialReturn.pieces
      : [
          { id: 1, piece_no: 1, meters: '', color_name: poColors[0] || 'Beige', folding: 'Fold 100' }
        ]
  );

  // Auto-sync when linked PO changes
  const handleLinkedPoChange = (poId) => {
    setLinkedPoId(poId);
    const po = availablePOs.find(p => p.id === poId || p.po_number === poId || `PPO-${p.po_number}` === poId);
    if (po) {
      if (po.vendor_id) setVendorId(po.vendor_id);
      if (po.vendor_name) setVendorName(po.vendor_name);
      if (po.fabric_quality) setFabricQuality(po.fabric_quality);
      else if (po.items && po.items[0]?.fabric_name) setFabricQuality(po.items[0].fabric_name);
      
      if (po.items && po.items[0]?.width) setWidth(po.items[0].width);
      if (po.total_meters && !vendorDeclaredMeters) setVendorDeclaredMeters(po.total_meters);

      // If pieces color is blank, set from first PO color
      const primaryColor = po.items?.[0]?.color_name || '';
      if (primaryColor) {
        setPieces(prev => prev.map(pc => ({
          ...pc,
          color_name: pc.color_name || primaryColor
        })));
      }
    }
  };

  // Mount sync with first PO if creating fresh
  useEffect(() => {
    if (linkedPoId && !isEditing) {
      const po = availablePOs.find(p => p.id === linkedPoId || p.po_number === linkedPoId || `PPO-${p.po_number}` === linkedPoId);
      if (po) {
        if (!initialReturn?.vendor_id && po.vendor_id) setVendorId(po.vendor_id);
        if (!initialReturn?.vendor_name && po.vendor_name) setVendorName(po.vendor_name);
        if (!fabricQuality) {
          if (po.fabric_quality) setFabricQuality(po.fabric_quality);
          else if (po.items?.[0]?.fabric_name) setFabricQuality(po.items[0].fabric_name);
        }
        if (!width && po.items?.[0]?.width) setWidth(po.items[0].width);
      }
    }
  }, [linkedPoId, availablePOs, isEditing]);

  const handleOpenNewColorModal = (rowIndex = null) => {
    setActiveColorRowIndex(rowIndex);
    setShowInlineColorModal(true);
  };

  const handleNewColorCreated = (newColor) => {
    if (!newColor) return;
    setColorMasterList(prev => {
      if (prev.some(c => c.name.toLowerCase() === newColor.name.toLowerCase())) return prev;
      return [newColor, ...prev];
    });

    try {
      const s = localStorage.getItem('raindrop_colors_v1');
      const existing = s ? JSON.parse(s) : [];
      if (!existing.some(c => c.name?.toLowerCase() === newColor.name?.toLowerCase())) {
        localStorage.setItem('raindrop_colors_v1', JSON.stringify([newColor, ...existing]));
      }
    } catch (e) {}

    if (activeColorRowIndex !== null && pieces[activeColorRowIndex]) {
      const updated = [...pieces];
      updated[activeColorRowIndex].color_name = newColor.name;
      setPieces(updated);
    }
    setShowInlineColorModal(false);
    setActiveColorRowIndex(null);
  };

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
        color_name: pieces[pieces.length - 1]?.color_name || (poColors[0] || 'Beige'),
        folding: foldingStandard
      }
    ]);
  };

  const removePieceRow = (idx) => {
    if (pieces.length <= 1) return;
    const filtered = pieces.filter((_, i) => i !== idx).map((p, i) => ({ ...p, piece_no: i + 1 }));
    setPieces(filtered);
  };

  const calculatedTotalMeters = pieces.reduce((acc, p) => acc + (parseFloat(p.meters) || 0), 0);
  const isMeterMismatch = vendorDeclaredMeters && Math.abs(calculatedTotalMeters - parseFloat(vendorDeclaredMeters || 0)) > 0.05;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isMeterMismatch) {
      if (!window.confirm(`Warning: Calculated total (${calculatedTotalMeters.toFixed(2)}m) differs from vendor declared summary (${vendorDeclaredMeters}m). Do you want to proceed?`)) {
        return;
      }
    }

    const returnPayload = {
      id: initialReturn?.id || (externalChallanNo ? `PRN-${externalChallanNo}` : `PRN-${Date.now().toString().slice(-4)}`),
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
      vendor_declared_meters: parseFloat(vendorDeclaredMeters) || calculatedTotalMeters,
      grey_fabric_returned_meters: parseFloat(greyFabricReturned) || 0,
      transport_details: {
        lr_number: lrNumber,
        lr_date: lrDate,
        transporter_name: transporterName,
        vehicle_no: vehicleNo
      },
      status: initialReturn?.status || 'Received',
      created_by: initialReturn?.created_by || 'Saksham Garg',
      created_at: initialReturn?.created_at || new Date().toISOString(),
      pieces: pieces.map(p => ({ ...p, qc_status: p.qc_status || 'Pending' }))
    };

    onSave(returnPayload);
  };

  return (
    <div className="card shadow-sm border mb-4" style={{ borderRadius: '12px', borderColor: '#e2e8f0', background: '#ffffff' }}>
      {/* Form Top Banner Header */}
      <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center" style={{ borderRadius: '12px 12px 0 0' }}>
        <div className="d-flex align-items-center gap-2.5">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
            style={{ width: '40px', height: '40px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}
          >
            <i className="ti ti-receipt-refund fs-22"></i>
          </div>
          <div>
            <h5 className="card-title mb-0 fw-bold text-dark fs-16">
              {isEditing ? `Edit Vendor Return #${externalChallanNo || initialReturn?.id}` : 'Record Inward Return / Inbound Processing GRN'}
            </h5>
            <small className="text-muted fs-12">
              Internal Series: <strong className="text-primary">Job Work</strong> (Distinct from Raw Material GRN)
            </small>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 rounded-2"
          onClick={onCancel}
        >
          <i className="ti ti-arrow-left fs-14"></i>
          <span>Back to Returns</span>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card-body p-4">

          {/* UNIFIED CARD 1: INBOUND PROCESSING GRN & VENDOR DETAILS */}
          <div
            className="card mb-4 shadow-none"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px 20px'
            }}
          >
            <div className="border-bottom pb-2 mb-3 d-flex align-items-center justify-content-between">
              <span className="fw-bold text-secondary text-uppercase fs-12" style={{ letterSpacing: '0.05em' }}>
                Inbound Processing GRN &amp; Vendor Details
              </span>
              <span className="badge bg-indigo-subtle text-primary border border-indigo-200 fs-11">
                Internal Series: Job Work
              </span>
            </div>

            {/* Row 1: Vendor (Job Worker), External Challan No, Challan Date, Received Date, Linked PO */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-3">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                  Vendor (Job Worker) <span className="text-danger">*</span>
                </label>
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
                  <option value="">Select Vendor...</option>
                  {initialVendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.city ? `(${v.city})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                  Vendor's External Challan No <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm bg-white fs-13 fw-bold text-dark"
                  style={{ borderColor: '#cbd5e1' }}
                  value={externalChallanNo}
                  onChange={(e) => setExternalChallanNo(e.target.value)}
                  placeholder="e.g. 2196 (from physical slip)"
                  required
                />
                <small className="text-muted" style={{ fontSize: '10.5px' }}>Unique within this vendor</small>
              </div>

              <div className="col-12 col-md-2">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                  Vendor Challan Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control form-control-sm bg-white fs-13"
                  style={{ borderColor: '#cbd5e1' }}
                  value={externalChallanDate}
                  onChange={(e) => setExternalChallanDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-md-2">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                  Received in Factory <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control form-control-sm bg-white fs-13"
                  style={{ borderColor: '#cbd5e1' }}
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-md-2">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                  Linked Process PO <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-sm bg-white fs-13 fw-bold text-primary"
                  style={{ borderColor: '#cbd5e1' }}
                  value={linkedPoId}
                  onChange={(e) => handleLinkedPoChange(e.target.value)}
                  required
                >
                  <option value="">-- Select Linked PO --</option>
                  {availablePOs && availablePOs.length > 0 ? (
                    availablePOs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id || `PPO-${p.po_number}`} ({p.vendor_name || p.fabric_quality || 'Process PO'})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="PPO-7611">PO #7611 (Beige - 525m)</option>
                      <option value="PPO-7612">PO #7612 (Off White - 1006m)</option>
                      <option value="PPO-7613">PO #7613 (Cambric - 887m)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Row 2: Fabric Quality, Width, Folding Standard, Weight, Vendor Stated Mtrs */}
            <div className="row g-3 pt-2 border-top">
              <div className="col-12 col-md-3">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                  Returned Fabric Quality <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm bg-white fs-13"
                  style={{ borderColor: '#cbd5e1' }}
                  value={fabricQuality}
                  onChange={(e) => setFabricQuality(e.target.value)}
                  placeholder="e.g. 100x100 Voile (Dyed)"
                  required
                />
              </div>

              <div className="col-12 col-md-2">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">Width</label>
                <select
                  className="form-select form-select-sm bg-white fs-13"
                  style={{ borderColor: '#cbd5e1' }}
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                >
                  <option value="44">44"</option>
                  <option value="48">48"</option>
                  <option value="58">58"</option>
                </select>
              </div>

              <div className="col-12 col-md-2">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">Folding Standard</label>
                <select
                  className="form-select form-select-sm bg-white fs-13"
                  style={{ borderColor: '#cbd5e1' }}
                  value={foldingStandard}
                  onChange={(e) => setFoldingStandard(e.target.value)}
                >
                  <option value="Fold 100">Fold 100</option>
                  <option value="Fold 98">Fold 98</option>
                  <option value="Fold 97">Fold 97</option>
                </select>
              </div>

              <div className="col-12 col-md-2">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">Weight (Kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control form-control-sm bg-white fs-13"
                  style={{ borderColor: '#cbd5e1' }}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 45.2"
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                  Vendor Stated Mtrs <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm bg-white fs-13 text-end fw-bold text-primary"
                  style={{ borderColor: '#cbd5e1' }}
                  value={vendorDeclaredMeters}
                  onChange={(e) => setVendorDeclaredMeters(e.target.value)}
                  placeholder="e.g. 1477.60"
                  required
                />
              </div>
            </div>
          </div>

          {/* UNIFIED CARD 2: PIECE-WISE METERAGE BREAKDOWN */}
          <div
            className="card mb-4 shadow-none"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px 20px'
            }}
          >
            <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-2 mb-3 gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-secondary text-uppercase fs-12" style={{ letterSpacing: '0.05em' }}>
                  Piece-Wise Meterage Breakdown
                </span>
                <span className="badge bg-white text-muted border fs-11">
                  Must match vendor stated total of {vendorDeclaredMeters || '0.00'} m ({pieces.length} {pieces.length === 1 ? 'than' : 'thans'})
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-2.5 rounded-2 d-flex align-items-center gap-1 fs-12"
                  onClick={() => handleOpenNewColorModal(null)}
                  title="Add new color to Color Master"
                >
                  <i className="ti ti-palette fs-14"></i>
                  <span>+ Master Color</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-3 rounded-2 d-flex align-items-center gap-1.5 shadow-xs"
                  style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                  onClick={addPieceRow}
                >
                  <i className="ti ti-plus fs-14"></i>
                  <span>Add Than / Roll</span>
                </button>
              </div>
            </div>

            {/* Validation Alert if Mismatched */}
            {isMeterMismatch && (
              <div className="alert alert-warning py-2 px-3 small d-flex align-items-center mb-3 rounded-2">
                <i className="ti ti-alert-circle me-2 fs-5"></i>
                <div>
                  <strong>Meterage Discrepancy:</strong> Entered pieces total <strong>{calculatedTotalMeters.toFixed(2)} m</strong>,
                  which differs from Vendor Stated Summary of <strong>{vendorDeclaredMeters} m</strong> (Diff: {(calculatedTotalMeters - vendorDeclaredMeters).toFixed(2)}m).
                </div>
              </div>
            )}

            <div className="table-responsive border rounded bg-white">
              <table className="table table-sm table-bordered align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="table-light text-center">
                  <tr>
                    <th style={{ width: '60px' }}>Than #</th>
                    <th style={{ minWidth: '220px' }}>Color (from Master)</th>
                    <th style={{ width: '160px' }} className="table-primary text-primary">Length (Mtrs) *</th>
                    <th style={{ width: '130px' }}>Folding</th>
                    <th style={{ width: '120px' }}>Status</th>
                    <th style={{ width: '45px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pieces.map((p, idx) => (
                    <tr key={p.id || idx}>
                      <td className="text-center fw-bold">#{p.piece_no}</td>
                      <td>
                        <select
                          className="form-select form-select-sm bg-white fs-12 fw-semibold text-dark"
                          style={{ borderColor: '#cbd5e1' }}
                          value={p.color_name || ''}
                          onChange={(e) => {
                            if (e.target.value === '__NEW_COLOR__') {
                              handleOpenNewColorModal(idx);
                            } else {
                              const updated = [...pieces];
                              updated[idx].color_name = e.target.value;
                              setPieces(updated);
                            }
                          }}
                        >
                          <option value="">Select Color from Master...</option>
                          {poColors.length > 0 && (
                            <optgroup label="Colors from Linked PO">
                              {poColors.map(c => (
                                <option key={`po-${c}`} value={c}>
                                  ★ {c} (From PO)
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="Color Master">
                            {colorMasterList.map(c => (
                              <option key={c.id || c.name} value={c.name}>
                                {c.name} {c.hexCode ? `(${c.hexCode})` : ''}
                              </option>
                            ))}
                          </optgroup>
                          <option value="__NEW_COLOR__" className="text-primary fw-bold">
                            + Add New Color to Master...
                          </option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm text-end fw-bold border-primary"
                          value={p.meters}
                          onChange={(e) => handlePieceMeterChange(idx, e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm text-center"
                          value={p.folding || foldingStandard}
                          onChange={(e) => {
                            const updated = [...pieces];
                            updated[idx].folding = e.target.value;
                            setPieces(updated);
                          }}
                        />
                      </td>
                      <td className="text-center">
                        <span className="badge bg-light text-muted border">Feeds QC</span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-link text-danger p-0"
                          onClick={() => removePieceRow(idx)}
                          disabled={pieces.length <= 1}
                          title="Remove Than"
                        >
                          <i className="ti ti-trash fs-15"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr className="fw-bold">
                    <td colSpan={2} className="text-end text-uppercase text-secondary py-2 fs-12">
                      Sum of Individual Pieces:
                    </td>
                    <td className="text-end text-primary fs-14 py-2">
                      {calculatedTotalMeters.toFixed(2)} m
                    </td>
                    <td colSpan={3} className="text-muted fs-12 py-2">
                      Total: {pieces.length} {pieces.length === 1 ? 'Piece / Than' : 'Pieces / Thans'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* UNIFIED CARD 3: GREY FABRIC / UNPROCESSED STOCK RETURN (OPEN BALE) */}
          <div
            className="card mb-4 shadow-none"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px 20px'
            }}
          >
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
              <span className="fw-bold text-secondary text-uppercase fs-12" style={{ letterSpacing: '0.05em' }}>
                Grey Fabric / Unprocessed Stock Return (Open Bale)
              </span>
              <span className="badge bg-secondary text-white fs-11">Section 5.3 Rule</span>
            </div>
            <p className="text-muted fs-12 mb-3">
              When vendor returns uncut/unutilised grey fabric alongside dyed goods, it is logged here to generate an <strong>Open Bale</strong> in warehouse stock:
            </p>
            <div className="row g-3">
              <div className="col-12 col-md-3">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                  Grey Fabric Returned (Metres)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm bg-white fs-13 text-end fw-bold"
                  style={{ borderColor: '#cbd5e1' }}
                  value={greyFabricReturned}
                  onChange={(e) => setGreyFabricReturned(e.target.value)}
                  placeholder="e.g. 40.00"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                  Target Purchase Invoice for Return Restock
                </label>
                <select
                  className="form-select form-select-sm bg-white fs-13"
                  style={{ borderColor: '#cbd5e1' }}
                  value={targetInvoiceForGrey}
                  onChange={(e) => setTargetInvoiceForGrey(e.target.value)}
                >
                  <option value="INV-MS-0091 (M.S. Textiles - Largest Balance)">INV-MS-0091 (M.S. Textiles - Auto Assigned Largest Balance)</option>
                  <option value="INV-SR-0042 (Surat Rayon & Silk Mills)">INV-SR-0042 (Surat Rayon & Silk Mills)</option>
                </select>
                <small className="text-muted" style={{ fontSize: '10.5px' }}>Auto-assigned to invoice with largest balance; manual override supported</small>
              </div>
              <div className="col-12 col-md-3 d-flex align-items-end">
                <span className="fs-12 text-success fw-bold pb-2">
                  <i className="ti ti-check me-1"></i> Will create Open Bale #OB-0001
                </span>
              </div>
            </div>
          </div>

          {/* UNIFIED CARD 4: COLLAPSIBLE TRANSPORT DETAILS */}
          <div className="mb-3">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 rounded-2"
              onClick={() => setShowTransport(!showTransport)}
            >
              <i className={`ti ${showTransport ? 'ti-chevron-up' : 'ti-chevron-down'}`}></i>
              <span>{showTransport ? 'Hide Transport Details' : '+ Show Collapsible Transport Details (Optional for Local Trips)'}</span>
            </button>

            {showTransport && (
              <div
                className="mt-2 p-3 rounded"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              >
                <div className="row g-3">
                  <div className="col-12 col-md-3">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">LR Number</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-white fs-13"
                      style={{ borderColor: '#cbd5e1' }}
                      value={lrNumber}
                      onChange={(e) => setLrNumber(e.target.value)}
                      placeholder="e.g. LR-9081"
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">LR Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm bg-white fs-13"
                      style={{ borderColor: '#cbd5e1' }}
                      value={lrDate}
                      onChange={(e) => setLrDate(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">Transporter Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-white fs-13"
                      style={{ borderColor: '#cbd5e1' }}
                      value={transporterName}
                      onChange={(e) => setTransporterName(e.target.value)}
                      placeholder="e.g. Keshav Freight Carriers"
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">Vehicle No</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-white fs-13"
                      style={{ borderColor: '#cbd5e1' }}
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value)}
                      placeholder="e.g. RJ-14-GA-9901"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer Bar */}
        <div className="card-footer bg-white border-top py-3 px-4 d-flex justify-content-between align-items-center">
          <div className="text-muted fs-12">
            Automatically sends all <strong>{pieces.length}</strong> thans to <strong>Quality Control (QC)</strong>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary btn-sm px-3 rounded-2" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm px-4 rounded-2 shadow-xs d-flex align-items-center gap-1.5"
              style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
            >
              <i className="ti ti-check fs-14"></i>
              <span>Save Inward &amp; Proceed to QC</span>
            </button>
          </div>
        </div>
      </form>

      {/* Inline Modal: Color Master Creation */}
      {showInlineColorModal && (
        <AddColorModal
          colors={colorMasterList}
          onSave={(newColor) => {
            handleNewColorCreated(newColor);
          }}
          onClose={(newColor) => {
            setShowInlineColorModal(false);
            if (newColor) {
              handleNewColorCreated(newColor);
            } else {
              setActiveColorRowIndex(null);
            }
          }}
        />
      )}
    </div>
  );
}
