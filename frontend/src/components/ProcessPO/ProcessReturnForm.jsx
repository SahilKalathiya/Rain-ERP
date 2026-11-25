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

  const [linkedPoId, setLinkedPoId] = useState(initialReturn?.linked_po_id || '');
  const [selectedPoIds, setSelectedPoIds] = useState(() => {
    if (Array.isArray(initialReturn?.linked_po_ids) && initialReturn.linked_po_ids.length > 0) {
      return initialReturn.linked_po_ids;
    }
    return initialReturn?.linked_po_id ? [initialReturn.linked_po_id] : [];
  });
  const [linkedChallanId, setLinkedChallanId] = useState(initialReturn?.linked_challan_id || '');

  // Vendor Identification
  const [vendorId, setVendorId] = useState(initialReturn?.vendor_id || '');
  const [vendorName, setVendorName] = useState(initialReturn?.vendor_name || '');

  // Vendor Master & Dynamic Harvest
  const loadVendorsFromMaster = () => {
    const list = [];
    const names = new Set();

    try {
      const s = localStorage.getItem('raindrop_vendors_v1');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          parsed.forEach(v => {
            const vName = v.name || v.vendor_name;
            if (vName && !names.has(vName)) {
              names.add(vName);
              list.push({ id: v.id || vName, name: vName, city: v.city || '' });
            }
          });
        }
      }
    } catch (e) { }

    (availablePOs || []).forEach(p => {
      const vName = p.vendor_name;
      if (vName && !names.has(vName)) {
        names.add(vName);
        list.push({ id: p.vendor_id || vName, name: vName, city: '' });
      }
    });

    (availableChallans || []).forEach(c => {
      const vName = c.vendor_name;
      if (vName && !names.has(vName)) {
        names.add(vName);
        list.push({ id: c.vendor_id || vName, name: vName, city: '' });
      }
    });

    initialVendors.forEach(v => {
      if (v.name && !names.has(v.name)) {
        names.add(v.name);
        list.push(v);
      }
    });

    if (list.length === 0) {
      ['Raju Dyeing (Krishna Dyeing)', 'Surat Rayon & Silk Mills', 'Sahil Ka', 'Sahil Po', 'N'].forEach((n, idx) => {
        list.push({ id: `VEND-000${idx + 1}`, name: n, city: 'Surat' });
      });
    }

    return list;
  };

  const [vendorList, setVendorList] = useState(loadVendorsFromMaster);

  useEffect(() => {
    setVendorList(loadVendorsFromMaster());
  }, [availablePOs, availableChallans]);

  // Helper to auto-generate a new Process PO and link it here
  const handleAutoGeneratePO = () => {
    const vName = vendorName || (vendorList[0]?.name || 'Job Worker');
    const vId = vendorId || (vendorList[0]?.id || 'V-01');
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const newPoNum = `PPO-${randNum}`;
    const newPO = {
      id: newPoNum,
      po_number: String(randNum),
      process_type: 'Dyeing',
      vendor_id: vId,
      vendor_name: vName,
      date: receivedDate || new Date().toISOString().split('T')[0],
      total_meters: Number(calculatedTotalMeters || 100),
      fabric_quality: fabricQuality || 'Fabric Quality',
      status: 'Issued'
    };
    try {
      const stored = JSON.parse(localStorage.getItem('erp_process_pos_v1') || localStorage.getItem('erp_process_pos') || '[]');
      stored.unshift(newPO);
      localStorage.setItem('erp_process_pos_v1', JSON.stringify(stored));
      localStorage.setItem('erp_process_pos', JSON.stringify(stored));
    } catch (e) {}
    setLinkedPoId(String(randNum));
    setVendorName(vName);
    setVendorId(vId);
  };

  const [externalChallanNo, setExternalChallanNo] = useState(
    initialReturn?.vendor_external_challan_no || String(Math.floor(1000 + Math.random() * 9000))
  );
  const [externalChallanDate, setExternalChallanDate] = useState(initialReturn?.vendor_challan_date || new Date().toISOString().split('T')[0]);
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState(initialReturn?.vendor_invoice_no || '');
  const [vendorInvoiceValue, setVendorInvoiceValue] = useState(initialReturn?.vendor_invoice_value || '');
  const [receivedDate, setReceivedDate] = useState(initialReturn?.received_date || new Date().toISOString().split('T')[0]);

  const [fabricQuality, setFabricQuality] = useState(initialReturn?.fabric_quality || '');

  const [width, setWidth] = useState(initialReturn?.width || '');
  const [weight, setWeight] = useState(initialReturn?.weight || '');
  const [foldingStandard, setFoldingStandard] = useState(initialReturn?.folding_standard || '');

  // Stated vs Entered Validation (Section 5.2)
  const [vendorDeclaredMeters, setVendorDeclaredMeters] = useState(initialReturn?.vendor_declared_meters || '');
  const [vendorDeclaredPieces, setVendorDeclaredPieces] = useState(initialReturn?.vendor_declared_pieces || '');

  // Section 5.3: Dedicated Grey Fabric Return & Open Bale
  const [greyFabricReturned, setGreyFabricReturned] = useState(
    initialReturn?.grey_fabric_returned_meters !== undefined && initialReturn?.grey_fabric_returned_meters !== null
      ? initialReturn.grey_fabric_returned_meters
      : ''
  );
  const [targetInvoiceForGrey, setTargetInvoiceForGrey] = useState(
    initialReturn?.target_invoice_for_grey || ''
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
    } catch (e) { }
    return list;
  });

  const [showInlineColorModal, setShowInlineColorModal] = useState(false);
  const [activeColorRowIndex, setActiveColorRowIndex] = useState(null);

  // Piece-Wise Grid Data (supports multi-PO / multi-color grouping like physical slip)
  const [pieces, setPieces] = useState(() => {
    if (initialReturn?.pieces && initialReturn.pieces.length > 0) {
      return initialReturn.pieces.map(p => ({
        ...p,
        po_ref: p.po_ref || initialReturn?.linked_po_id || '',
        challan_ref: p.challan_ref || initialReturn?.linked_challan_id || '',
        folding: isExistingSavedReturn ? (p.folding || '') : (initialReturn.folding_standard || '')
      }));
    }
    return [];
  });
  const [pieceViewMode, setPieceViewMode] = useState('columns'); // 'columns' (slip view) | 'table'

  // Calculate grid sum & stated summary validation (only count filled rows > 0)
  const filledPieces = pieces.filter(p => (parseFloat(p.meters) || 0) > 0);
  const calculatedTotalMeters = filledPieces.reduce((acc, p) => acc + (parseFloat(p.meters) || 0), 0);
  const greyReturnedNum = parseFloat(greyFabricReturned) || 0;
  const totalReturnedWithGrey = calculatedTotalMeters + greyReturnedNum;

  const statedMeters = parseFloat(vendorDeclaredMeters) || 0;
  const statedPieces = parseInt(vendorDeclaredPieces, 10) || 0;
  const isMeterMismatch = statedMeters > 0 && Math.abs(calculatedTotalMeters - statedMeters) > 0.05;
  const isPieceCountMismatch = statedPieces > 0 && filledPieces.length !== statedPieces;
  const meterDifference = statedMeters > 0 ? (calculatedTotalMeters - statedMeters).toFixed(2) : 0;

  // Selected PO(s) total meters validation
  const selectedPoTotalMeters = React.useMemo(() => {
    const activePoIds = selectedPoIds.length > 0 ? selectedPoIds : (linkedPoId ? [linkedPoId] : []);
    if (activePoIds.length === 0) return 0;
    return (availablePOs || [])
      .filter(p => activePoIds.includes(String(p.po_number)) || activePoIds.includes(String(p.id)))
      .reduce((sum, p) => sum + (parseFloat(p.total_meters) || 0), 0);
  }, [availablePOs, selectedPoIds, linkedPoId]);

  const isPoMeterMismatch = selectedPoTotalMeters > 0 && Math.abs(totalReturnedWithGrey - selectedPoTotalMeters) > 0.05;
  const poMeterDifference = selectedPoTotalMeters > 0 ? (totalReturnedWithGrey - selectedPoTotalMeters).toFixed(2) : 0;

  const handlePieceMeterChange = (index, value) => {
    const updated = [...pieces];
    updated[index].meters = value;
    setPieces(updated);
  };

  const addPieceRow = (overrides = {}, count = 1) => {
    setPieces(prev => {
      const last = prev[prev.length - 1];
      const basePo = overrides.po_ref !== undefined ? overrides.po_ref : (last?.po_ref || linkedPoId || '');
      const baseCh = overrides.challan_ref !== undefined ? overrides.challan_ref : (last?.challan_ref || linkedChallanId || '');
      const baseCol = overrides.color_name !== undefined ? overrides.color_name : (last?.color_name || (colorMasterList[0]?.name || ''));
      const baseFold = overrides.folding !== undefined ? overrides.folding : (foldingStandard || '');
      const newRows = [];
      for (let i = 0; i < count; i++) {
        newRows.push({
          id: Date.now() + Math.random() + i,
          piece_no: prev.length + i + 1,
          meters: '',
          po_ref: basePo,
          challan_ref: baseCh,
          color_name: baseCol,
          folding: baseFold
        });
      }
      return [...prev, ...newRows];
    });
  };

  const removePieceRow = (idx) => {
    setPieces(prev => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, piece_no: i + 1 })));
  };

  // Pending items from selected PO(s) for quick selection (Section 5.2)
  const pendingPoItems = React.useMemo(() => {
    const activePoIds = selectedPoIds.length > 0 ? selectedPoIds : (linkedPoId ? [linkedPoId] : []);
    const matchedPOs = (availablePOs || []).filter(p =>
      activePoIds.includes(String(p.po_number)) || activePoIds.includes(String(p.id))
    );
    const list = [];
    matchedPOs.forEach(po => {
      const poRef = po.po_number || po.id;
      (po.items || []).forEach((it, idx) => {
        list.push({
          key: `${poRef}-${idx}`,
          po_ref: poRef,
          fabric_name: it.fabric_name || po.fabric_quality || '',
          color_name: it.color_name || '',
          width: it.width || '',
          ordered_meters: parseFloat(it.quantity_meters) || 0
        });
      });
    });
    return list;
  }, [availablePOs, selectedPoIds, linkedPoId]);

  const handleSubmit = (e, andRunQC = false) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!vendorName && !vendorId) {
      alert("Please select a Vendor (Job Worker) or link a Process PO.");
      return;
    }

    if (!externalChallanNo) {
      alert("Please enter the Vendor's External Challan Number (e.g. #2196).");
      return;
    }

    // Section 5.2 & 12.3: Check uniqueness of External Challan No within the SAME vendor
    try {
      const existingReturns = JSON.parse(localStorage.getItem('erp_process_returns_v1') || localStorage.getItem('erp_process_returns') || '[]');
      const currentId = initialReturn?.id || `PRN-${externalChallanNo}`;
      const dup = (Array.isArray(existingReturns) ? existingReturns : []).find(r =>
        r.id !== currentId &&
        String(r.vendor_name || '').trim().toLowerCase() === String(vendorName || '').trim().toLowerCase() &&
        String(r.vendor_external_challan_no || '').trim().toLowerCase() === String(externalChallanNo || '').trim().toLowerCase()
      );
      if (dup) {
        alert(`Duplicate Vendor Challan (Section 12.3):\n\nChallan #${externalChallanNo} is already recorded for ${vendorName}.`);
        return;
      }
    } catch (err) { }

    if (filledPieces.length === 0) {
      alert("Please enter at least one piece / than length (metres) before saving the GRN.");
      return;
    }

    if (isMeterMismatch || isPieceCountMismatch) {
      alert(
        `Cannot Complete GRN — Vendor Summary Mismatch:\n\nRecorded: ${filledPieces.length} thans / ${calculatedTotalMeters.toFixed(2)}m\nVendor Stated: ${statedPieces || filledPieces.length} thans / ${statedMeters.toFixed(2)}m\nDifference: ${meterDifference}m\n\nPlease match the recorded pieces and metres with the vendor's stated summary.`
      );
      return;
    }

    if (isPoMeterMismatch) {
      alert(
        `Cannot Complete GRN — PO Meters Mismatch:\n\nSelected PO(s) Target: ${selectedPoTotalMeters.toFixed(2)}m\nTotal Returned (Dyed + Grey): ${totalReturnedWithGrey.toFixed(2)}m\nDifference: ${poMeterDifference}m\n\nReturned metres must match the selected PO metres to complete this GRN.`
      );
      return;
    }

    const returnPayload = {
      id: initialReturn?.id || `PRN-${externalChallanNo}`,
      vendor_id: vendorId || vendorName,
      vendor_name: vendorName,
      vendor_external_challan_no: externalChallanNo,
      vendor_challan_date: externalChallanDate,
      vendor_invoice_no: vendorInvoiceNo,
      vendor_invoice_date: externalChallanDate,
      vendor_invoice_value: parseFloat(vendorInvoiceValue) || 0,
      internal_series: 'Job Work',
      linked_po_id: linkedPoId || selectedPoIds[0] || '',
      linked_po_ids: selectedPoIds.length > 0 ? selectedPoIds : (linkedPoId ? [linkedPoId] : []),
      linked_challan_id: linkedChallanId,
      received_date: receivedDate,
      fabric_quality: fabricQuality,
      width,
      weight: parseFloat(weight) || 0,
      folding_standard: foldingStandard,
      total_pieces: filledPieces.length,
      total_meters: Number(calculatedTotalMeters.toFixed(2)),
      vendor_declared_pieces: parseInt(vendorDeclaredPieces, 10) || filledPieces.length,
      vendor_declared_meters: statedMeters || calculatedTotalMeters,
      grey_fabric_returned_meters: greyReturnedNum,
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
      pieces: filledPieces.map((p, idx) => ({
        ...p,
        piece_no: idx + 1,
        folding: p.folding || foldingStandard || '',
        meters: parseFloat(p.meters) || 0,
        qc_status: p.qc_status || 'Pending'
      }))
    };

    onSave(returnPayload, andRunQC);
  };

  const isSectionEditable = (sectionKey) => {
    if (editingSection === sectionKey || editingSection === 'all') return true;
    if (isLocked || isReadOnly) return false;
    return true;
  };

  return (
    <div className="card shadow-sm border mb-4" style={{ borderRadius: '12px', borderColor: '#e2e8f0', background: '#ffffff' }}>
      {/* Banner Header */}
      <div className="card-header bg-white py-3 px-4 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div className="d-flex align-items-center gap-3">
          {onCancel && (
            <button
              type="button"
              className="btn btn-light rounded-circle border shadow-sm d-flex align-items-center justify-content-center p-0"
              onClick={onCancel}
              title="Back to Record Inward (GRN) List"
              style={{ width: '38px', height: '38px', borderColor: '#e2e8f0', backgroundColor: '#ffffff', color: '#334155', flexShrink: 0 }}
            >
              <i className="ti ti-arrow-left fs-18"></i>
            </button>
          )}
          <div
            className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
            style={{ width: '42px', height: '42px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}
          >
            <i className="ti ti-receipt-refund fs-22"></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="card-title mb-0 fw-bold text-dark fs-18">
                {isExistingSavedReturn ? `Vendor Return #${externalChallanNo}` : 'Record Inward Return (Vendor GRN)'}
              </h5>
              <span className={`badge px-2 py-0.5 fs-11 fw-bold ${isLocked
                ? 'bg-white text-dark border shadow-xs'
                : 'bg-primary-subtle text-primary border border-primary-subtle'
                }`}>
                {isLocked ? 'Locked' : 'Job Work Series'}
              </span>
            </div>
            <div className="text-muted fs-12 mt-0.5 d-flex align-items-center gap-2">
              <span>Vendor physical challan entry</span>
              <span>•</span>
              <span className="fw-semibold text-dark">{vendorName || 'Vendor Assignment'}</span>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
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
                  className="btn btn-light btn-sm border text-dark px-2.5 py-1 rounded fs-12 fw-semibold"
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
                    value={vendorName || vendorId || ''}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => {
                      const chosen = e.target.value;
                      const v = vendorList.find(vend => vend.name === chosen || vend.id === chosen);
                      const nextName = v ? v.name : chosen;
                      setVendorName(nextName);
                      setVendorId(v ? (v.id || v.name) : chosen);
                      // Clear PO/Challan selections that belong to a different vendor
                      setLinkedPoId('');
                      setSelectedPoIds([]);
                      setLinkedChallanId('');
                    }}
                    required
                  >
                    <option value="">Select Vendor...</option>
                    {vendorList.map(v => (
                      <option key={v.id || v.name} value={v.name}>{v.name} {v.city ? `(${v.city})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Vendor's External Challan No. <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white fs-13 fw-bold text-dark font-monospace"
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
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-0">Linked Process PO</label>
                    {isSectionEditable('header') && (
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-primary text-decoration-none fs-11 fw-semibold d-flex align-items-center gap-1"
                        onClick={handleAutoGeneratePO}
                        title="Auto-generate a new Process PO and link it here"
                      >
                        <i className="ti ti-plus fs-12"></i>
                        <span>+ Auto-Generate PO</span>
                      </button>
                    )}
                  </div>
                  <select
                    className="form-select form-select-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={linkedPoId}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLinkedPoId(val);
                      if (val && !selectedPoIds.includes(val)) {
                        setSelectedPoIds(prev => [...prev, val]);
                      }
                      if (val) {
                        const poObj = availablePOs.find(p => String(p.po_number) === String(val) || String(p.id) === String(val));
                        if (poObj) {
                          if (poObj.vendor_name) {
                            setVendorName(poObj.vendor_name);
                            setVendorId(poObj.vendor_id || poObj.vendor_name);
                          }
                          if (poObj.fabric_quality || poObj.items?.[0]?.fabric_name) {
                            setFabricQuality(poObj.fabric_quality || poObj.items?.[0]?.fabric_name);
                          }
                        }
                      }
                    }}
                  >
                    <option value="">-- Select Linked PO by Vendor Name --</option>
                    {availablePOs
                      .filter(po => !vendorName || String(po.vendor_name || '').trim().toLowerCase() === String(vendorName).trim().toLowerCase())
                      .map(po => (
                        <option key={po.id || po.po_number} value={po.po_number || po.id}>
                          {po.vendor_name || 'Vendor'} — PO #{po.po_number || po.id} ({po.total_meters}m)
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
                    onChange={(e) => {
                      const val = e.target.value;
                      setLinkedChallanId(val);
                      if (val) {
                        const chObj = availableChallans.find(c => String(c.challan_number) === String(val) || String(c.id) === String(val));
                        if (chObj) {
                          if (!vendorName && chObj.vendor_name) {
                            setVendorName(chObj.vendor_name);
                            setVendorId(chObj.vendor_id || chObj.vendor_name);
                          }
                          if (!fabricQuality && chObj.items?.[0]?.fabric_name) {
                            setFabricQuality(chObj.items[0].fabric_name);
                          }
                          if (!foldingStandard && chObj.folding_notation) {
                            setFoldingStandard(chObj.folding_notation);
                            setPieces(prev => prev.map(p => ({
                              ...p,
                              folding: p.folding || chObj.folding_notation
                            })));
                          }
                        }
                      }
                    }}
                  >
                    <option value="">-- Select Linked Challan by Vendor Name --</option>
                    {availableChallans
                      .filter(ch => !vendorName || String(ch.vendor_name || '').trim().toLowerCase() === String(vendorName).trim().toLowerCase())
                      .map(ch => (
                        <option key={ch.id || ch.challan_number} value={ch.challan_number || ch.id}>
                          {ch.vendor_name || 'Vendor'} — CH #{ch.challan_number || ch.id}
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
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={foldingStandard}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFoldingStandard(val);
                      setPieces(prev => prev.map(p => ({
                        ...p,
                        folding: val
                      })));
                    }}
                    placeholder="Enter folding (e.g. L100, Fold 98)"
                  />
                </div>
              </div>

              {/* Collapsible Transport & LR Details inside Section 1 (Section 5.2) */}
              <div className="mt-3 pt-3 border-top" style={{ borderColor: '#e2e8f0' }}>
                <div
                  className="d-flex align-items-center justify-content-between py-1 px-2 rounded-2"
                  style={{ cursor: 'pointer', background: '#f8fafc' }}
                  onClick={() => setShowTransport(!showTransport)}
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className="ti ti-truck-delivery text-secondary fs-15"></i>
                    <span className="fw-semibold text-dark fs-12">Transport &amp; LR Details (Collapsible)</span>
                    <span className="badge bg-white text-muted border fs-10">Hidden by default for local job work</span>
                  </div>
                  <i className={`ti ti-chevron-${showTransport ? 'up' : 'down'} text-secondary`}></i>
                </div>

                {showTransport && (
                  <div className="row g-3 mt-1">
                    <div className="col-12 col-md-3">
                      <label className="form-label fs-12 fw-semibold text-secondary mb-1">LR Number</label>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-white fs-13"
                        style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                        value={lrNumber}
                        disabled={!isSectionEditable('header') && !isSectionEditable('transport')}
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
                        disabled={!isSectionEditable('header') && !isSectionEditable('transport')}
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
                        disabled={!isSectionEditable('header') && !isSectionEditable('transport')}
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
                        disabled={!isSectionEditable('header') && !isSectionEditable('transport')}
                        onChange={(e) => setVehicleNo(e.target.value)}
                        placeholder="e.g. GJ-05-BX-4120"
                      />
                    </div>
                  </div>
                )}
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

              <div className="d-flex align-items-center gap-2 flex-wrap">
                {isSectionEditable('pieces') && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm px-3 rounded-2 d-flex align-items-center gap-1.5 shadow-xs"
                    onClick={() => addPieceRow({ po_ref: linkedPoId || '', color_name: '' }, 20)}
                  >
                    <i className="ti ti-plus fs-14"></i>
                    <span>Add 20-Row Column</span>
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
                      className="form-control form-control-sm bg-white fs-13 text-end fw-bold text-dark"
                      style={{ width: '160px', height: '36px', borderColor: '#cbd5e1' }}
                      value={vendorDeclaredMeters}
                      disabled={!isSectionEditable('pieces')}
                      onChange={(e) => setVendorDeclaredMeters(e.target.value)}
                      placeholder="e.g. 1477.60"
                    />
                  </div>
                </div>

                {/* Validation Status Badges + Edit Pieces Button */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {(isReadOnly || isLocked) && editingSection !== 'pieces' && (
                    <button
                      type="button"
                      className="btn btn-light btn-sm border text-dark px-2.5 py-1.5 rounded fs-12 fw-semibold"
                      onClick={() => setEditingSection('pieces')}
                    >
                      <i className="ti ti-edit me-1"></i> Edit Pieces
                    </button>
                  )}
                  {(isReadOnly || isLocked) && editingSection === 'pieces' && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm px-2.5 py-1.5 rounded fs-12 fw-semibold"
                      onClick={() => setEditingSection(null)}
                    >
                      <i className="ti ti-check me-1"></i> Done
                    </button>
                  )}
                  {(statedMeters > 0 || statedPieces > 0) && (
                    (isMeterMismatch || isPieceCountMismatch) ? (
                      <div className="badge bg-danger-subtle text-danger border border-danger-subtle p-2 fs-12 d-flex align-items-center gap-1.5">
                        <i className="ti ti-alert-circle fs-16"></i>
                        <span>
                          <strong>Summary Mismatch:</strong>{' '}
                          {isPieceCountMismatch ? `Stated ${statedPieces} thans vs ${filledPieces.length} filled` : ''}
                          {isPieceCountMismatch && isMeterMismatch ? ' • ' : ''}
                          {isMeterMismatch ? `Stated ${statedMeters.toFixed(2)}m vs Grid ${calculatedTotalMeters.toFixed(2)}m (Diff: ${meterDifference > 0 ? `+${meterDifference}` : meterDifference}m)` : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="badge bg-success-subtle text-success border border-success-subtle p-2 fs-12 d-flex align-items-center gap-1.5">
                        <i className="ti ti-circle-check fs-16"></i>
                        <span><strong>100% Summary Match:</strong> {filledPieces.length} Thans • {calculatedTotalMeters.toFixed(2)}m</span>
                      </div>
                    )
                  )}

                  {selectedPoTotalMeters > 0 && (
                    isPoMeterMismatch ? (
                      <div className="badge bg-danger-subtle text-danger border border-danger-subtle p-2 fs-12 d-flex align-items-center gap-1.5">
                        <i className="ti ti-alert-triangle fs-16"></i>
                        <span>
                          <strong>PO Target Mismatch:</strong> PO {selectedPoTotalMeters.toFixed(2)}m vs Returned {totalReturnedWithGrey.toFixed(2)}m (Diff: {poMeterDifference > 0 ? `+${poMeterDifference}` : poMeterDifference}m)
                        </span>
                      </div>
                    ) : (
                      <div className="badge bg-success-subtle text-success border border-success-subtle p-2 fs-12 d-flex align-items-center gap-1.5">
                        <i className="ti ti-check fs-16"></i>
                        <span><strong>PO Target Matched:</strong> {totalReturnedWithGrey.toFixed(2)}m / {selectedPoTotalMeters.toFixed(2)}m</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Multi-PO Pending Items Quick Selector (Section 5.2) */}
              {isSectionEditable('pieces') && pendingPoItems.length > 0 && (
                <div className="mb-3 p-3 rounded-3 border bg-white" style={{ borderColor: '#e2e8f0' }}>
                  <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                    <span className="fs-12 fw-bold text-dark d-flex align-items-center gap-1.5">
                      <i className="ti ti-list-check text-primary fs-15"></i>
                      <span>Pending Items from Selected PO(s) — Quick Add to Slip</span>
                    </span>
                    <div className="d-flex align-items-center gap-1.5 flex-wrap">
                      {selectedPoIds.map(pid => (
                        <span key={pid} className="badge bg-primary-subtle text-primary border border-primary-subtle fs-11 font-monospace d-inline-flex align-items-center gap-1">
                          PO #{pid}
                          {selectedPoIds.length > 1 && (
                            <button
                              type="button"
                              className="btn-close"
                              style={{ fontSize: '8px' }}
                              onClick={() => setSelectedPoIds(prev => prev.filter(id => id !== pid))}
                            />
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {pendingPoItems.map(pit => (
                      <button
                        key={pit.key}
                        type="button"
                        className="btn btn-outline-primary btn-xs px-2.5 py-1 rounded-2 fs-11 fw-semibold d-inline-flex align-items-center gap-1.5"
                        onClick={() => addPieceRow({
                          po_ref: pit.po_ref,
                          challan_ref: linkedChallanId || '',
                          color_name: pit.color_name,
                          folding: foldingStandard || ''
                        }, 20)}
                        title="Add a 20-row Than column for this PO & Color"
                      >
                        <i className="ti ti-plus fs-12"></i>
                        <span className="font-monospace">PO #{pit.po_ref}</span>
                        <span>• {pit.color_name || 'Color'}</span>
                        <span className="text-muted">({pit.ordered_meters.toFixed(0)}m)</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Piece-Wise Entry: 20-Row Slip Columns (matches physical Raju Dyeing slip) */}
              {(() => {
                  const colMap = new Map();
                  pieces.forEach((p, idx) => {
                    const poKey = String(p.po_ref || linkedPoId || 'General').trim();
                    const colKey = String(p.color_name || 'Standard').trim();
                    const groupKey = `${poKey}___${colKey}`;
                    if (!colMap.has(groupKey)) {
                      colMap.set(groupKey, {
                        groupKey,
                        po_ref: p.po_ref || linkedPoId || '',
                        challan_ref: p.challan_ref || linkedChallanId || '',
                        color_name: p.color_name || '',
                        entries: []
                      });
                    }
                    colMap.get(groupKey).entries.push({ piece: p, idx });
                  });
                  const colGroups = Array.from(colMap.values());

                  if (colGroups.length === 0) {
                    return (
                      <div className="p-4 text-center text-muted bg-white border rounded-3">
                        <i className="ti ti-receipt-off fs-24 d-block mb-1 text-secondary opacity-50"></i>
                        <p className="mb-2 fs-13">No piece / than entries recorded yet.</p>
                        {isSectionEditable('pieces') && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm px-3"
                            onClick={() => addPieceRow({ po_ref: linkedPoId || '', color_name: colorMasterList[0]?.name || '' }, 20)}
                          >
                            <i className="ti ti-plus me-1"></i> Start First 20-Row Column
                          </button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="row g-3">
                        {colGroups.map((grp, gIdx) => {
                          const filledInGroup = grp.entries.filter(e => (parseFloat(e.piece.meters) || 0) > 0).length;
                          const subTotalMeters = grp.entries.reduce((s, e) => s + (parseFloat(e.piece.meters) || 0), 0);
                          // Split entries into 20-row slip columns (1-20, 21-40, ...)
                          const chunks = [];
                          for (let c = 0; c < grp.entries.length; c += 20) {
                            chunks.push(grp.entries.slice(c, c + 20));
                          }
                          return (
                            <div key={grp.groupKey + gIdx} className={chunks.length > 1 ? 'col-12' : 'col-12 col-lg-6'}>
                              <div className="border rounded-3 bg-white shadow-2xs overflow-hidden" style={{ borderColor: '#cbd5e1' }}>
                                {/* Slip Column Header: C.No / O.No + Color */}
                                <div className="p-2.5 px-3 bg-light border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <span className="badge bg-primary text-white font-monospace fs-11">
                                      {grp.challan_ref ? `C.No: ${grp.challan_ref}` : 'Lot'}
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm font-monospace fw-bold bg-white px-2 py-0"
                                      style={{ width: '95px', height: '32px', fontSize: '12px' }}
                                      value={grp.po_ref}
                                      disabled={!isSectionEditable('pieces')}
                                      placeholder="O.No / PO #"
                                      onChange={(e) => {
                                        const newPo = e.target.value;
                                        setPieces(prev => prev.map((p, pIdx) =>
                                          grp.entries.some(en => en.idx === pIdx) ? { ...p, po_ref: newPo } : p
                                        ));
                                      }}
                                    />
                                    <select
                                      className="form-select form-select-sm fw-semibold bg-white px-2 py-0"
                                      style={{ minWidth: '140px', width: 'auto', height: '32px', fontSize: '12px', lineHeight: '30px' }}
                                      value={grp.color_name}
                                      disabled={!isSectionEditable('pieces')}
                                      onChange={(e) => {
                                        const newCol = e.target.value;
                                        setPieces(prev => prev.map((p, pIdx) =>
                                          grp.entries.some(en => en.idx === pIdx) ? { ...p, color_name: newCol } : p
                                        ));
                                      }}
                                    >
                                      <option value="">Select Color...</option>
                                      {colorMasterList.map(c => (
                                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  {isSectionEditable('pieces') && (
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary btn-xs px-2 py-0.5 fs-11 fw-semibold"
                                      onClick={() => addPieceRow({ po_ref: grp.po_ref, challan_ref: grp.challan_ref, color_name: grp.color_name }, 20)}
                                    >
                                      +20 Rows
                                    </button>
                                  )}
                                </div>

                                {/* 20-Row Slip Columns side by side */}
                                <div className="row g-0">
                                  {chunks.map((chunk, chunkIdx) => {
                                    const chunkMeters = chunk.reduce((s, e) => s + (parseFloat(e.piece.meters) || 0), 0);
                                    const chunkFilled = chunk.filter(e => (parseFloat(e.piece.meters) || 0) > 0).length;
                                    const colClass = chunks.length >= 3
                                      ? 'col-12 col-md-6 col-xl-4 border-end'
                                      : chunks.length === 2
                                        ? 'col-12 col-md-6 border-end'
                                        : 'col-12';
                                    return (
                                      <div key={chunkIdx} className={colClass}>
                                        <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '12px' }}>
                                          <thead className="table-light">
                                            <tr className="text-secondary fs-10 text-uppercase">
                                              <th className="text-center" style={{ width: '32px' }}>#</th>
                                              <th style={{ width: '96px' }}>Length (m)</th>
                                              <th style={{ width: '68px' }}>Fold</th>
                                              <th style={{ width: '66px' }} className="text-center">QC</th>
                                              {isSectionEditable('pieces') && <th style={{ width: '28px' }}></th>}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {chunk.map(({ piece: p, idx }, rowInChunk) => {
                                              const displayNo = chunkIdx * 20 + rowInChunk + 1;
                                              return (
                                                <tr key={p.id || idx}>
                                                  <td className="text-center fw-bold text-muted font-monospace">{displayNo}</td>
                                                  <td>
                                                    <input
                                                      type="number"
                                                      step="0.01"
                                                      className="form-control form-control-sm text-end fw-bold text-dark fs-12 px-1.5"
                                                      style={{ borderColor: '#cbd5e1', height: '26px', width: '90px' }}
                                                      value={p.meters}
                                                      disabled={!isSectionEditable('pieces')}
                                                      onChange={(e) => handlePieceMeterChange(idx, e.target.value)}
                                                      placeholder="—"
                                                    />
                                                  </td>
                                                  <td>
                                                    <input
                                                      type="text"
                                                      className="form-control form-control-sm fs-11 text-center px-1"
                                                      style={{ borderColor: '#cbd5e1', height: '26px', width: '62px' }}
                                                      value={p.folding || ''}
                                                      disabled={!isSectionEditable('pieces')}
                                                      onChange={(e) => {
                                                        const updated = [...pieces];
                                                        updated[idx].folding = e.target.value;
                                                        setPieces(updated);
                                                      }}
                                                      placeholder="L100"
                                                    />
                                                  </td>
                                                  <td className="text-center">
                                                    <span className={`badge fs-10 ${p.qc_status === 'Accepted' ? 'bg-success-subtle text-success' : 'bg-light text-secondary border'}`}>
                                                      {p.qc_status || 'Pending'}
                                                    </span>
                                                  </td>
                                                  {isSectionEditable('pieces') && (
                                                    <td className="text-center">
                                                      <button
                                                        type="button"
                                                        className="btn btn-link text-danger p-0"
                                                        onClick={() => removePieceRow(idx)}
                                                        title="Delete row"
                                                      >
                                                        <i className="ti ti-trash fs-13"></i>
                                                      </button>
                                                    </td>
                                                  )}
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                          <tfoot className="table-light">
                                            <tr className="fw-bold">
                                              <td colSpan={2} className="text-end text-secondary fs-11 py-1.5">
                                                Col {chunkIdx + 1} ({chunkFilled} Thans):
                                              </td>
                                              <td colSpan={isSectionEditable('pieces') ? 3 : 2} className="text-end text-primary fs-12 py-1.5 pe-2 font-monospace">
                                                {chunkMeters.toFixed(2)} m
                                              </td>
                                            </tr>
                                          </tfoot>
                                        </table>
                                      </div>
                                    );
                                  })}
                                </div>

                                {chunks.length > 1 && (
                                  <div className="p-2 px-3 bg-light border-top d-flex justify-content-between align-items-center">
                                    <span className="fw-bold text-secondary fs-11">Lot Sub-Total ({filledInGroup} Thans):</span>
                                    <span className="fw-bold text-primary fs-13 font-monospace">{subTotalMeters.toFixed(2)} m</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Grand Total Strip across all columns */}
                      <div className="mt-3 p-2.5 px-3 rounded-3 bg-light border d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ borderColor: '#cbd5e1' }}>
                        <span className="fw-bold text-secondary fs-12 text-uppercase">
                          Grand Total Recorded ({colGroups.length} Lot Column{colGroups.length > 1 ? 's' : ''}):
                        </span>
                        <div className="d-flex align-items-center gap-3">
                          <span className="badge bg-white text-dark border px-2.5 py-1 fs-12 font-monospace">
                            {filledPieces.length} Thans
                          </span>
                          <span className="fw-bold text-dark fs-15 font-monospace">
                            {Number(calculatedTotalMeters).toFixed(2)} m
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
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
                  className="btn btn-light btn-sm border text-dark px-2.5 py-1 rounded fs-12 fw-semibold"
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
                        className="btn btn-link btn-sm p-0 text-dark text-decoration-none fs-11"
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
                      {parseFloat(greyFabricReturned) > 0 ? (
                        <>
                          <i className="ti ti-sparkles text-warning"></i>
                          <span><strong>Auto-Assigned:</strong> {targetInvoiceForGrey || 'INV-MS-0091 (M.S. Textiles - Largest Remaining Stock Balance)'}</span>
                        </>
                      ) : (
                        <span className="text-muted">Not applicable (0 Metres returned)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
            {(!isReadOnly || editingSection !== null) && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm px-3 shadow-xs d-flex align-items-center gap-1.5"
                  onClick={(e) => handleSubmit(e, false)}
                >
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
