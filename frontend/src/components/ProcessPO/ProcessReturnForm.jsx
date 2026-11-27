import React, { useState, useEffect, useRef } from 'react';
import { initialVendors, initialTransporters } from '../../data/procurementData';
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
  const [selectedChallanIds, setSelectedChallanIds] = useState(() => {
    if (Array.isArray(initialReturn?.linked_challan_ids) && initialReturn.linked_challan_ids.length > 0) {
      return initialReturn.linked_challan_ids;
    }
    return initialReturn?.linked_challan_id ? [initialReturn.linked_challan_id] : [];
  });
  const [showPoMultiDropdown, setShowPoMultiDropdown] = useState(false);
  const [showChallanMultiDropdown, setShowChallanMultiDropdown] = useState(false);
  const [showColorMultiDropdown, setShowColorMultiDropdown] = useState(false);
  const poDropdownRef = useRef(null);
  const challanDropdownRef = useRef(null);
  const colorDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (poDropdownRef.current && !poDropdownRef.current.contains(e.target)) {
        setShowPoMultiDropdown(false);
      }
      if (challanDropdownRef.current && !challanDropdownRef.current.contains(e.target)) {
        setShowChallanMultiDropdown(false);
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(e.target)) {
        setShowColorMultiDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

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

  // Transporter Master Dynamic State (raindrop_transporters_v1)
  const loadTransportersFromMaster = () => {
    try {
      const s = localStorage.getItem('raindrop_transporters_v1');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return initialTransporters || [];
  };
  const [transporterList, setTransporterList] = useState(loadTransportersFromMaster);

  useEffect(() => {
    const syncTransporters = () => setTransporterList(loadTransportersFromMaster());
    window.addEventListener('raindrop_transporters_updated', syncTransporters);
    window.addEventListener('storage', syncTransporters);
    return () => {
      window.removeEventListener('raindrop_transporters_updated', syncTransporters);
      window.removeEventListener('storage', syncTransporters);
    };
  }, []);

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

  const openLotCount = Math.max(1, new Set(pieces.map(p => `${String(p.po_ref || linkedPoId || 'General').trim()}___${String(p.color_name || 'Standard').trim()}`)).size);
  const statedMeters = parseFloat(vendorDeclaredMeters) || 0;
  const statedPieces = parseInt(vendorDeclaredPieces, 10) || 0;
  const isMeterMismatch = statedMeters > 0 && Math.abs(calculatedTotalMeters - statedMeters) > 0.05;
  const isPieceCountMismatch = statedPieces > 0 && filledPieces.length !== statedPieces && filledPieces.length !== statedPieces * openLotCount;
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
      const baseCol = overrides.color_name !== undefined ? overrides.color_name : (last?.color_name || '');
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

  const handleStatedPiecesChange = (val) => {
    setVendorDeclaredPieces(val);
    const targetCount = parseInt(val, 10);
    if (isNaN(targetCount) || targetCount <= 0) {
      setPieces(prev => prev.filter(p => (parseFloat(p.meters) || 0) > 0).map((p, i) => ({ ...p, piece_no: i + 1 })));
      return;
    }
    const capped = Math.min(targetCount, 500);
    setPieces(prev => {
      if (prev.length === 0) {
        const extra = [];
        for (let i = 0; i < capped; i++) {
          extra.push({
            id: Date.now() + Math.random() + i,
            piece_no: i + 1,
            meters: '',
            po_ref: linkedPoId || '',
            challan_ref: linkedChallanId || '',
            color_name: '',
            folding: foldingStandard || ''
          });
        }
        return extra;
      }

      // Apply target row count to EVERY open Lot so Lot 1, Lot 2, etc. all get the same number of piece boxes
      const lotOrder = [];
      const lotBuckets = new Map();
      prev.forEach(p => {
        const k = `${String(p.po_ref || linkedPoId || 'General').trim()}___${String(p.color_name || 'Standard').trim()}`;
        if (!lotBuckets.has(k)) {
          lotBuckets.set(k, []);
          lotOrder.push(k);
        }
        lotBuckets.get(k).push(p);
      });

      const rebuilt = [];
      lotOrder.forEach((k, lotIdx) => {
        const bucket = lotBuckets.get(k);
        if (bucket.length < capped) {
          const sample = bucket[bucket.length - 1];
          for (let i = bucket.length; i < capped; i++) {
            bucket.push({
              id: Date.now() + Math.random() + lotIdx * 1000 + i,
              piece_no: 0,
              meters: '',
              po_ref: sample.po_ref || linkedPoId || '',
              challan_ref: sample.challan_ref || linkedChallanId || '',
              color_name: sample.color_name || '',
              folding: sample.folding || foldingStandard || ''
            });
          }
        } else if (bucket.length > capped) {
          for (let i = bucket.length - 1; i >= 0 && bucket.length > capped; i--) {
            if (!(parseFloat(bucket[i].meters) > 0)) {
              bucket.splice(i, 1);
            }
          }
        }
        rebuilt.push(...bucket);
      });

      return rebuilt.map((p, i) => ({ ...p, piece_no: i + 1 }));
    });
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
      if (Array.isArray(po.items) && po.items.length > 0) {
        po.items.forEach((it, idx) => {
          list.push({
            key: `${poRef}-${idx}`,
            po_ref: poRef,
            fabric_name: it.fabric_name || po.fabric_quality || '',
            color_name: it.color_name || '',
            width: it.width || '',
            ordered_meters: parseFloat(it.quantity_meters) || 0
          });
        });
      } else {
        list.push({
          key: `${poRef}-0`,
          po_ref: poRef,
          fabric_name: po.fabric_quality || po.fabric_name || '',
          color_name: po.color_name || '',
          width: po.width || '',
          ordered_meters: parseFloat(po.total_meters) || 0
        });
      }
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
      linked_challan_id: linkedChallanId || selectedChallanIds[0] || '',
      linked_challan_ids: selectedChallanIds.length > 0 ? selectedChallanIds : (linkedChallanId ? [linkedChallanId] : []),
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
                {/* 1. Vendor's External Challan No. First */}
                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Vendor's External Challan No. <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-light fs-13 fw-bold text-dark font-monospace"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px', cursor: 'not-allowed' }}
                    value={externalChallanNo}
                    readOnly
                    placeholder="e.g. 2196 (Page 20 slip)"
                    required
                  />
                </div>

                {/* 2. Vendor (Job Worker) */}
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
                      setSelectedChallanIds([]);
                    }}
                    required
                  >
                    <option value="">Select Vendor...</option>
                    {vendorList.map(v => (
                      <option key={v.id || v.name} value={v.name}>{v.name} {v.city ? `(${v.city})` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Vendor's Challan Date */}
                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Vendor's Challan Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={externalChallanDate}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setExternalChallanDate(e.target.value)}
                    required
                  />
                </div>

                {/* 4. Received Date at Factory */}
                <div className="col-12 col-md-3">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Received Date at Factory <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={receivedDate}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    required
                  />
                </div>

                {/* Linked PO & Internal Challan (Multi-Select) */}
                <div className="col-12 col-md-3" ref={poDropdownRef}>
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Linked Process PO(s)
                  </label>
                  <div className="position-relative">
                    <button
                      type="button"
                      className="form-select form-select-sm bg-white fs-13 text-start text-truncate"
                      style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                      disabled={!isSectionEditable('header')}
                      onClick={() => setShowPoMultiDropdown(prev => !prev)}
                    >
                      {selectedPoIds.length === 0 ? (
                        <span className="text-muted">-- Select Linked PO(s) --</span>
                      ) : selectedPoIds.length === 1 ? (
                        (() => {
                          const poObj = availablePOs.find(p => String(p.po_number || p.id) === String(selectedPoIds[0]));
                          return `${poObj?.vendor_name || 'Vendor'} — PO #${selectedPoIds[0]}${poObj?.total_meters ? ` (${poObj.total_meters}m)` : ''}`;
                        })()
                      ) : (
                        <span className="fw-semibold text-primary">
                          {selectedPoIds.length} POs Selected ({selectedPoIds.map(id => `#${id}`).join(', ')})
                        </span>
                      )}
                    </button>

                    {showPoMultiDropdown && isSectionEditable('header') && (
                      <div
                        className="position-absolute bg-white border rounded-3 shadow-lg p-2"
                        style={{ top: '100%', left: 0, right: 0, zIndex: 1050, marginTop: '4px', maxHeight: '240px', overflowY: 'auto' }}
                      >
                        {(() => {
                          const filteredPOs = availablePOs.filter(po =>
                            !vendorName || String(po.vendor_name || '').trim().toLowerCase() === String(vendorName).trim().toLowerCase()
                          );
                          if (filteredPOs.length === 0) {
                            return <div className="text-muted fs-12 p-2 text-center">No Process POs found.</div>;
                          }
                          return (
                            <>
                              <div className="d-flex align-items-center justify-content-between px-1 pb-1 mb-1 border-bottom">
                                <span className="fs-11 text-secondary fw-semibold">{selectedPoIds.length} selected</span>
                                <div className="d-flex gap-2">
                                  {selectedPoIds.length > 0 && (
                                    <button
                                      type="button"
                                      className="btn btn-link btn-sm p-0 fs-11 text-danger text-decoration-none"
                                      onClick={() => {
                                        setSelectedPoIds([]);
                                        setLinkedPoId('');
                                      }}
                                    >
                                      Clear
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-xs px-2 py-0 fs-11"
                                    onClick={() => setShowPoMultiDropdown(false)}
                                  >
                                    Done
                                  </button>
                                </div>
                              </div>
                              {filteredPOs.map(po => {
                                const poRef = String(po.po_number || po.id);
                                const isChecked = selectedPoIds.some(id => String(id) === poRef);
                                return (
                                  <div
                                    key={po.id || po.po_number}
                                    className={`d-flex align-items-center gap-2 p-1.5 rounded-2 fs-12 ${isChecked ? 'bg-primary-subtle text-primary fw-semibold' : 'hover-bg-light text-dark'}`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                      const next = isChecked
                                        ? selectedPoIds.filter(id => String(id) !== poRef)
                                        : [...selectedPoIds, poRef];
                                      setSelectedPoIds(next);
                                      setLinkedPoId(next[0] || '');
                                      if (!isChecked) {
                                        if (po.vendor_name && !vendorName) {
                                          setVendorName(po.vendor_name);
                                          setVendorId(po.vendor_id || po.vendor_name);
                                        }
                                        if ((po.fabric_quality || po.items?.[0]?.fabric_name) && !fabricQuality) {
                                          setFabricQuality(po.fabric_quality || po.items?.[0]?.fabric_name);
                                        }
                                        if (!foldingStandard) {
                                          let resolvedFold = po.folding_standard || po.folding || po.foldingNotation || '';
                                          const orderRefId = po.linked_order_id || po.order_id || po.sales_order_id;
                                          if (!resolvedFold && orderRefId) {
                                            try {
                                              const orders = JSON.parse(localStorage.getItem('erp_sales_orders_v1') || '[]');
                                              const ord = (Array.isArray(orders) ? orders : []).find(o => o.id === orderRefId);
                                              if (ord) resolvedFold = ord.foldingStandard || ord.folding_standard || ord.folding || ord.foldingNotation || '';
                                            } catch (e) {}
                                          }
                                          if (resolvedFold) {
                                            setFoldingStandard(resolvedFold);
                                            setPieces(prev => prev.map(p => ({ ...p, folding: p.folding || resolvedFold })));
                                          }
                                        }
                                      }
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      className="form-check-input mt-0"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      style={{ cursor: 'pointer' }}
                                    />
                                    <div className="text-truncate">
                                      <span>{po.vendor_name || 'Vendor'} — PO #{poRef}</span>
                                      {po.total_meters ? <span className="text-muted ms-1">({po.total_meters}m)</span> : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  {selectedPoIds.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mt-1.5">
                      {selectedPoIds.map(pid => (
                        <span key={pid} className="badge bg-primary-subtle text-primary border border-primary-subtle fs-11 d-inline-flex align-items-center gap-1">
                          PO #{pid}
                          {isSectionEditable('header') && (
                            <button
                              type="button"
                              className="btn-close"
                              style={{ fontSize: '7px' }}
                              onClick={() => {
                                const next = selectedPoIds.filter(id => String(id) !== String(pid));
                                setSelectedPoIds(next);
                                setLinkedPoId(next[0] || '');
                              }}
                            />
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="col-12 col-md-3" ref={challanDropdownRef}>
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">Linked Internal Challan(s)</label>
                  <div className="position-relative">
                    <button
                      type="button"
                      className="form-select form-select-sm bg-white fs-13 text-start text-truncate"
                      style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                      disabled={!isSectionEditable('header')}
                      onClick={() => setShowChallanMultiDropdown(prev => !prev)}
                    >
                      {selectedChallanIds.length === 0 ? (
                        <span className="text-muted">-- Select Linked Challan(s) --</span>
                      ) : selectedChallanIds.length === 1 ? (
                        (() => {
                          const chObj = availableChallans.find(c => String(c.challan_number || c.id) === String(selectedChallanIds[0]));
                          return `${chObj?.vendor_name || 'Vendor'} — CH #${selectedChallanIds[0]}`;
                        })()
                      ) : (
                        <span className="fw-semibold text-primary">
                          {selectedChallanIds.length} Challans Selected ({selectedChallanIds.map(id => `#${id}`).join(', ')})
                        </span>
                      )}
                    </button>

                    {showChallanMultiDropdown && isSectionEditable('header') && (
                      <div
                        className="position-absolute bg-white border rounded-3 shadow-lg p-2"
                        style={{ top: '100%', left: 0, right: 0, zIndex: 1050, marginTop: '4px', maxHeight: '240px', overflowY: 'auto' }}
                      >
                        {(() => {
                          const filteredChallans = availableChallans.filter(ch =>
                            !vendorName || String(ch.vendor_name || '').trim().toLowerCase() === String(vendorName).trim().toLowerCase()
                          );
                          if (filteredChallans.length === 0) {
                            return <div className="text-muted fs-12 p-2 text-center">No Internal Challans found.</div>;
                          }
                          return (
                            <>
                              <div className="d-flex align-items-center justify-content-between px-1 pb-1 mb-1 border-bottom">
                                <span className="fs-11 text-secondary fw-semibold">{selectedChallanIds.length} selected</span>
                                <div className="d-flex gap-2">
                                  {selectedChallanIds.length > 0 && (
                                    <button
                                      type="button"
                                      className="btn btn-link btn-sm p-0 fs-11 text-danger text-decoration-none"
                                      onClick={() => {
                                        setSelectedChallanIds([]);
                                        setLinkedChallanId('');
                                      }}
                                    >
                                      Clear
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-xs px-2 py-0 fs-11"
                                    onClick={() => setShowChallanMultiDropdown(false)}
                                  >
                                    Done
                                  </button>
                                </div>
                              </div>
                              {filteredChallans.map(ch => {
                                const chRef = String(ch.challan_number || ch.id);
                                const isChecked = selectedChallanIds.some(id => String(id) === chRef);
                                return (
                                  <div
                                    key={ch.id || ch.challan_number}
                                    className={`d-flex align-items-center gap-2 p-1.5 rounded-2 fs-12 ${isChecked ? 'bg-primary-subtle text-primary fw-semibold' : 'hover-bg-light text-dark'}`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                      const next = isChecked
                                        ? selectedChallanIds.filter(id => String(id) !== chRef)
                                        : [...selectedChallanIds, chRef];
                                      setSelectedChallanIds(next);
                                      setLinkedChallanId(next[0] || '');
                                      if (!isChecked) {
                                        if (!vendorName && ch.vendor_name) {
                                          setVendorName(ch.vendor_name);
                                          setVendorId(ch.vendor_id || ch.vendor_name);
                                        }
                                        if (!fabricQuality && ch.items?.[0]?.fabric_name) {
                                          setFabricQuality(ch.items[0].fabric_name);
                                        }
                                        if (!foldingStandard && ch.folding_notation) {
                                          setFoldingStandard(ch.folding_notation);
                                          setPieces(prev => prev.map(p => ({
                                            ...p,
                                            folding: p.folding || ch.folding_notation
                                          })));
                                        }
                                      }
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      className="form-check-input mt-0"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      style={{ cursor: 'pointer' }}
                                    />
                                    <div className="text-truncate">
                                      <span>{ch.vendor_name || 'Vendor'} — CH #{chRef}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  {selectedChallanIds.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mt-1.5">
                      {selectedChallanIds.map(cid => (
                        <span key={cid} className="badge bg-info-subtle text-info-emphasis border border-info-subtle fs-11 d-inline-flex align-items-center gap-1">
                          CH #{cid}
                          {isSectionEditable('header') && (
                            <button
                              type="button"
                              className="btn-close"
                              style={{ fontSize: '7px' }}
                              onClick={() => {
                                const next = selectedChallanIds.filter(id => String(id) !== String(cid));
                                setSelectedChallanIds(next);
                                setLinkedChallanId(next[0] || '');
                              }}
                            />
                          )}
                        </span>
                      ))}
                    </div>
                  )}
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

                {/* Transport & LR Fields merged directly into Section 1 */}
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
                  <select
                    className="form-select form-select-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={transporterName}
                    disabled={!isSectionEditable('header') && !isSectionEditable('transport')}
                    onChange={(e) => setTransporterName(e.target.value)}
                  >
                    <option value="">-- Select Transporter --</option>
                    {transporterName && !transporterList.some(t => (t.name || t.transporterName || '') === transporterName) && (
                      <option value={transporterName}>{transporterName}</option>
                    )}
                    {transporterList.map((t, idx) => {
                      const tName = t.name || t.transporterName || '';
                      if (!tName) return null;
                      return (
                        <option key={t.id || tName || idx} value={tName}>
                          {tName}{t.city ? ` (${t.city})` : ''}
                        </option>
                      );
                    })}
                  </select>
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
                    onClick={() => addPieceRow({ po_ref: linkedPoId || '', color_name: '' }, 1)}
                  >
                    <i className="ti ti-plus fs-14"></i>
                    <span>Add Row</span>
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
                      onChange={(e) => handleStatedPiecesChange(e.target.value)}
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

              {/* Multi-Color Selector + Multi-PO Pending Items Quick Selector (Section 5.2) */}
              {isSectionEditable('pieces') && (
                <div className="mb-3 p-3 rounded-3 border bg-white" style={{ borderColor: '#e2e8f0' }}>
                  <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                    <span className="fs-12 fw-bold text-dark d-flex align-items-center gap-1.5">
                      <i className="ti ti-palette text-primary fs-15"></i>
                      <span>Colors in this Return (Multi-Select)</span>
                      <span className="text-muted fw-normal fs-11">
                        — Same color = 1 Lot • Different colors = separate Lots
                      </span>
                    </span>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <div className="position-relative" ref={colorDropdownRef}>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-xs px-2.5 py-1 fs-11 fw-semibold d-inline-flex align-items-center gap-1.5"
                          onClick={() => setShowColorMultiDropdown(prev => !prev)}
                        >
                          <i className="ti ti-color-swatch fs-13"></i>
                          <span>Select Multiple Colors</span>
                          <i className="ti ti-chevron-down fs-12"></i>
                        </button>
                        {showColorMultiDropdown && (
                          <div
                            className="position-absolute end-0 mt-1 bg-white border rounded-3 shadow-lg p-2"
                            style={{ width: '250px', maxHeight: '260px', overflowY: 'auto', zIndex: 1050, borderColor: '#cbd5e1' }}
                          >
                            {(() => {
                              const poColors = Array.from(new Set(pendingPoItems.map(p => p.color_name).filter(Boolean)));
                              const allColorNames = poColors.length > 0
                                ? poColors
                                : colorMasterList.map(c => c.name).filter(Boolean);
                              return allColorNames.map(cName => {
                                const isChecked = pieces.some(p => String(p.color_name || '').trim().toLowerCase() === cName.toLowerCase());
                                return (
                                  <label
                                    key={cName}
                                    className="d-flex align-items-center gap-2 px-2 py-1.5 rounded hover-bg-light cursor-pointer fs-12 mb-0"
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <input
                                      type="checkbox"
                                      className="form-check-input mt-0"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          const matching = pieces.filter(p => String(p.color_name || '').trim().toLowerCase() === cName.toLowerCase());
                                          const hasMeters = matching.some(p => (parseFloat(p.meters) || 0) > 0);
                                          if (hasMeters && !window.confirm(`Remove "${cName}" lot and its entered meters?`)) return;
                                          setPieces(prev => prev.filter(p => String(p.color_name || '').trim().toLowerCase() !== cName.toLowerCase()).map((p, i) => ({ ...p, piece_no: i + 1 })));
                                        } else {
                                          const emptyUncolored = pieces.some(p => !String(p.color_name || '').trim() && !(parseFloat(p.meters) > 0));
                                          if (emptyUncolored) {
                                            setPieces(prev => prev.map(p => (!String(p.color_name || '').trim() && !(parseFloat(p.meters) > 0)) ? { ...p, color_name: cName } : p));
                                          } else {
                                            addPieceRow({
                                              po_ref: linkedPoId || selectedPoIds[0] || '',
                                              challan_ref: linkedChallanId || '',
                                              color_name: cName,
                                              folding: foldingStandard || ''
                                            }, statedPieces > 0 ? statedPieces : 1);
                                          }
                                        }
                                      }}
                                    />
                                    <span className="fw-semibold text-dark">{cName}</span>
                                  </label>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>

                      {pendingPoItems.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-primary btn-xs px-2.5 py-1 fs-11 fw-semibold"
                          onClick={() => {
                            pendingPoItems.forEach(pit => {
                              const already = pieces.some(p =>
                                String(p.po_ref || '').trim() === String(pit.po_ref || '').trim() &&
                                (!pit.color_name || String(p.color_name || '').trim().toLowerCase() === String(pit.color_name || '').trim().toLowerCase())
                              );
                              if (!already) {
                                addPieceRow({
                                  po_ref: pit.po_ref,
                                  challan_ref: linkedChallanId || '',
                                  color_name: pit.color_name,
                                  folding: foldingStandard || ''
                                }, statedPieces > 0 ? statedPieces : 1);
                              }
                            });
                          }}
                        >
                          + Add All PO Colors ({pendingPoItems.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {pendingPoItems.length > 0 && (
                    <>
                      <div className="d-flex align-items-center justify-content-between mb-2 pt-2 border-top flex-wrap gap-2">
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
                        {pendingPoItems.map(pit => {
                          const isLotAlreadyOpen = pieces.some(p =>
                            String(p.po_ref || '').trim() === String(pit.po_ref || '').trim() &&
                            (!pit.color_name || String(p.color_name || '').trim().toLowerCase() === String(pit.color_name || '').trim().toLowerCase())
                          );
                          return (
                            <button
                              key={pit.key}
                              type="button"
                              disabled={isLotAlreadyOpen}
                              className={`btn btn-xs px-2.5 py-1 rounded-2 fs-11 fw-semibold d-inline-flex align-items-center gap-1.5 ${
                                isLotAlreadyOpen ? 'btn-success-subtle text-success border border-success-subtle' : 'btn-outline-primary'
                              }`}
                              onClick={() => {
                                if (isLotAlreadyOpen) return;
                                const hasEmptyUncoloredSamePo = pieces.some(p =>
                                  String(p.po_ref || '').trim() === String(pit.po_ref || '').trim() &&
                                  !String(p.color_name || '').trim() &&
                                  !(parseFloat(p.meters) > 0)
                                );
                                if (hasEmptyUncoloredSamePo && pit.color_name) {
                                  setPieces(prev => prev.map(p =>
                                    (String(p.po_ref || '').trim() === String(pit.po_ref || '').trim() && !String(p.color_name || '').trim())
                                      ? { ...p, color_name: pit.color_name }
                                      : p
                                  ));
                                  return;
                                }
                                addPieceRow({
                                  po_ref: pit.po_ref,
                                  challan_ref: linkedChallanId || '',
                                  color_name: pit.color_name,
                                  folding: foldingStandard || ''
                                }, statedPieces > 0 ? statedPieces : 1);
                              }}
                              title={isLotAlreadyOpen ? 'Already added to slip below' : 'Add piece rows for this PO & Color'}
                            >
                              <i className={`ti ${isLotAlreadyOpen ? 'ti-check' : 'ti-plus'} fs-12`}></i>
                              <span className="font-monospace">PO #{pit.po_ref}</span>
                              <span>• {pit.color_name || 'Color'}</span>
                              <span className="text-muted">({pit.ordered_meters.toFixed(0)}m)</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
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
                        <p className="mb-0 fs-13">Enter <strong>Vendor Stated Thans / Pieces</strong> above to open piece boxes.</p>
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
                            <div key={grp.groupKey + gIdx} className={chunks.length > 1 ? 'col-12' : 'col-12 col-md-auto'}>
                              <div className="border rounded-3 bg-white shadow-2xs overflow-hidden" style={{ borderColor: '#cbd5e1' }}>
                                {/* Slip Column Header: C.No / O.No + Color */}
                                <div className="p-2.5 px-3 bg-light border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <span className="badge bg-primary text-white font-monospace fs-11">
                                      Lot {gIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      list={`challan-list-${gIdx}`}
                                      className="form-control form-control-sm font-monospace fw-bold bg-white px-2 py-0"
                                      style={{ width: '95px', height: '32px', fontSize: '12px' }}
                                      value={grp.challan_ref}
                                      disabled={!isSectionEditable('pieces')}
                                      placeholder="C.No #"
                                      title="Internal Challan No. (C.No)"
                                      onChange={(e) => {
                                        const newCh = e.target.value;
                                        setPieces(prev => prev.map((p, pIdx) =>
                                          grp.entries.some(en => en.idx === pIdx) ? { ...p, challan_ref: newCh } : p
                                        ));
                                      }}
                                    />
                                    <datalist id={`challan-list-${gIdx}`}>
                                      {(selectedChallanIds.length > 0 ? selectedChallanIds : availableChallans.map(c => c.challan_number || c.id)).map(cid => (
                                        <option key={cid} value={cid} />
                                      ))}
                                    </datalist>
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
                                      {(() => {
                                        const poColors = Array.from(new Set(pendingPoItems.map(p => p.color_name).filter(Boolean)));
                                        const optionsList = poColors.length > 0
                                          ? poColors
                                          : colorMasterList.map(c => c.name).filter(Boolean);
                                        const hasCurrent = grp.color_name && optionsList.some(c => String(c).toLowerCase() === String(grp.color_name).toLowerCase());
                                        return (
                                          <>
                                            {grp.color_name && !hasCurrent && (
                                              <option value={grp.color_name}>{grp.color_name}</option>
                                            )}
                                            {optionsList.map(cName => (
                                              <option key={cName} value={cName}>{cName}</option>
                                            ))}
                                          </>
                                        );
                                      })()}
                                    </select>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-center fw-semibold bg-white px-2 py-0"
                                      style={{ width: '88px', height: '32px', fontSize: '12px' }}
                                      value={grp.entries[0]?.piece?.folding || foldingStandard || ''}
                                      disabled={!isSectionEditable('pieces')}
                                      placeholder="Folding"
                                      title="Folding Standard (applied to all pieces in this lot)"
                                      onChange={(e) => {
                                        const newFold = e.target.value;
                                        setFoldingStandard(newFold);
                                        setPieces(prev => prev.map((p, pIdx) =>
                                          grp.entries.some(en => en.idx === pIdx) ? { ...p, folding: newFold } : p
                                        ));
                                      }}
                                    />
                                  </div>
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
                                        <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '12px', width: 'auto', minWidth: '290px' }}>
                                          <thead className="table-light">
                                            <tr className="text-secondary fs-10 text-uppercase">
                                              <th className="text-center px-2" style={{ width: '34px' }}>#</th>
                                              <th className="px-2" style={{ width: '104px' }}>Length (m)</th>
                                              <th className="text-center px-2" style={{ width: '76px' }}>QC</th>
                                              {isSectionEditable('pieces') && <th style={{ width: '32px' }}></th>}
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
                                              <td colSpan={2} className="text-secondary fs-11 py-1.5 px-2">
                                                <div className="d-flex align-items-center justify-content-between gap-2">
                                                  {isSectionEditable('pieces') && (
                                                    <button
                                                      type="button"
                                                      className="btn btn-outline-primary btn-xs px-2 py-0.5 fs-11 fw-semibold"
                                                      onClick={() => addPieceRow({
                                                        po_ref: grp.po_ref,
                                                        challan_ref: grp.challan_ref,
                                                        color_name: grp.color_name,
                                                        folding: grp.entries[0]?.piece?.folding || foldingStandard || ''
                                                      }, 1)}
                                                    >
                                                      + Add Row
                                                    </button>
                                                  )}
                                                  <span className="ms-auto">Col {chunkIdx + 1} ({chunkFilled} Thans):</span>
                                                </div>
                                              </td>
                                              <td colSpan={isSectionEditable('pieces') ? 2 : 1} className="text-end text-primary fs-12 py-1.5 pe-2 font-monospace">
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

                      {/* Grand Total Strip across all PO / Color Lots */}
                      <div className="mt-3 p-2.5 px-3 rounded-3 bg-light border d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ borderColor: '#cbd5e1' }}>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <span className="fw-bold text-secondary fs-12 text-uppercase">
                            Grand Total ({colGroups.length} Lot{colGroups.length > 1 ? 's' : ''}):
                          </span>
                          {colGroups.length > 1 && (
                            <span className="fs-12 text-secondary font-monospace">
                              {colGroups.map((grp) => {
                                const lotM = grp.entries.reduce((s, e) => s + (parseFloat(e.piece.meters) || 0), 0);
                                return `${grp.po_ref ? `PO #${grp.po_ref}` : 'Lot'} (${grp.color_name || 'Std'}): ${lotM.toFixed(2)}m`;
                              }).join(' + ')}
                            </span>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <span className="badge bg-white text-dark border px-2.5 py-1 fs-12 font-monospace">
                            {filledPieces.length}{statedPieces > 0 ? ` / ${statedPieces}` : ''} Thans
                          </span>
                          <span className="fw-bold text-dark fs-15 font-monospace">
                            {Number(calculatedTotalMeters).toFixed(2)} m
                            {statedMeters > 0 ? <span className="text-muted fs-12 fw-normal"> / {statedMeters.toFixed(2)} m</span> : null}
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
