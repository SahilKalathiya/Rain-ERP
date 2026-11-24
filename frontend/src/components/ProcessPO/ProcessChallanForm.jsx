import React, { useState, useEffect, useRef } from 'react';
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
  const isExistingSaved = Boolean(initialChallan && initialChallan.id && !initialChallan.is_draft);
  const isEditing = isExistingSaved;

  // Workflow Locking: Challan cannot be edited once saved & dispatched, or once Inbound Return (GRN) has been recorded
  const isLocked = Boolean(
    isExistingSaved && (
      initialChallan.is_locked ||
      initialChallan.status === 'Completed' ||
      initialChallan.status === 'Inwarded' ||
      (returns && returns.some(r => r.linked_challan_id && (r.linked_challan_id === initialChallan.challan_number || r.linked_challan_id === initialChallan.id)))
    )
  );

  // Once saved and sent for challan, it is permanent/dispatched and cannot be edited
  const isReadOnly = isExistingSaved || isLocked;

  // Available Warehouse Bales & Rolls for Stock Picking (FIFO & Invoice Batch)
  // Reflects authentic procurement inward stock as per client specifications:
  // - Vendor A: Jan (INV-VA-001: 4,000 mt) & Feb (INV-VA-002: 5,000 mt)
  // - Vendor B: June (INV-VB-001: 5,000 mt)
  // - Bales 1-9 with full / cut piece options, sub-rolls (100, 50, 90m), and folding (L100 / L98)
  const defaultWarehouseBales = [
    { id: 'WB-101', baleNo: 'Bale 1', vendorName: 'Vendor A', invoiceNo: 'INV-VA-001 (Jan)', date: '2026-01-15', fabric: 'Grey [48"]', fabricQuality: 'Grey', width: '48"', color: 'Black', meters: 500, availableMeters: 500, folding: 'L98', actualDispatchedMeters: 490, subRolls: '5 Rolls (100m x 5)', ageDays: 45 },
    { id: 'WB-102', baleNo: 'Bale 2', vendorName: 'Vendor A', invoiceNo: 'INV-VA-001 (Jan)', date: '2026-01-15', fabric: 'Grey [48"]', fabricQuality: 'Grey', width: '48"', color: 'Black', meters: 900, availableMeters: 900, folding: 'L100', actualDispatchedMeters: 900, subRolls: '9 Rolls (100m x 9)', ageDays: 45 },
    { id: 'WB-103', baleNo: 'Bale 3', vendorName: 'Vendor A', invoiceNo: 'INV-VA-001 (Jan)', date: '2026-01-15', fabric: 'Grey [48"]', fabricQuality: 'Grey', width: '48"', color: 'Black', meters: 600, availableMeters: 600, folding: 'L100', actualDispatchedMeters: 600, subRolls: '6 Rolls (100m x 6)', ageDays: 45 },
    { id: 'WB-104', baleNo: 'Bale 4', vendorName: 'Vendor A', invoiceNo: 'INV-VA-001 (Jan)', date: '2026-01-15', fabric: 'Grey [48"]', fabricQuality: 'Grey', width: '48"', color: 'Black', meters: 1000, availableMeters: 1000, folding: 'L100', actualDispatchedMeters: 1000, subRolls: '10 Rolls (100m x 10)', ageDays: 45 },
    { id: 'WB-105', baleNo: 'Bale 5', vendorName: 'Vendor A', invoiceNo: 'INV-VA-001 (Jan)', date: '2026-01-15', fabric: 'Grey [48"]', fabricQuality: 'Grey', width: '48"', color: 'Black', meters: 1000, availableMeters: 1000, folding: 'L100', actualDispatchedMeters: 1000, subRolls: 'Rolls: 100m, 100m, 100m, 50m, 90m...', ageDays: 45 },
    { id: 'WB-106', baleNo: 'Bale 6 (Mega Bale)', vendorName: 'Vendor A', invoiceNo: 'INV-VA-002 (Feb)', date: '2026-02-10', fabric: 'Grey [48"]', fabricQuality: 'Grey', width: '48"', color: 'Black', meters: 5000, availableMeters: 5000, folding: 'L100', actualDispatchedMeters: 5000, subRolls: '50 Rolls (100m each)', ageDays: 20 },
    { id: 'WB-107', baleNo: 'Bale 7', vendorName: 'Vendor B', invoiceNo: 'INV-VB-001 (June)', date: '2026-06-05', fabric: 'Grey [48"]', fabricQuality: 'Grey', width: '48"', color: 'Black', meters: 2000, availableMeters: 2000, folding: 'L100', actualDispatchedMeters: 2000, subRolls: '20 Rolls (100m each)', ageDays: 10 },
    { id: 'WB-108', baleNo: 'Bale 8', vendorName: 'Vendor B', invoiceNo: 'INV-VB-001 (June)', date: '2026-06-05', fabric: 'Grey [48"]', fabricQuality: 'Grey', width: '48"', color: 'Black', meters: 1500, availableMeters: 1500, folding: 'L100', actualDispatchedMeters: 1500, subRolls: '15 Rolls (100m each)', ageDays: 10 },
    { id: 'WB-109', baleNo: 'Bale 9', vendorName: 'Vendor B', invoiceNo: 'INV-VB-001 (June)', date: '2026-06-05', fabric: 'Grey [48"]', fabricQuality: 'Grey', width: '48"', color: 'Black', meters: 1500, availableMeters: 1500, folding: 'L98', actualDispatchedMeters: 1470, subRolls: 'Rolls: 100m, 100m, 50m...', ageDays: 10 },
    { id: 'WB-110', baleNo: 'Bale 12384', vendorName: 'Krishna / Raju Dyeing', invoiceNo: 'INV-MS-0091', date: '2026-08-01', fabric: '100x100 Voil [48"] (Grey)', fabricQuality: '100x100 Voil', width: '48"', color: 'Grey', meters: 1865.50, availableMeters: 1865.50, folding: 'L100', actualDispatchedMeters: 1865.50, subRolls: 'Bale Package', ageDays: 11 },
    { id: 'WB-111', baleNo: 'Roll 2376-A', vendorName: 'Krishna / Raju Dyeing', invoiceNo: 'INV-MS-0091', date: '2026-08-01', fabric: '100x100 Voil [48"] (Grey)', fabricQuality: '100x100 Voil', width: '48"', color: 'Grey', meters: 119.30, availableMeters: 119.30, folding: 'L100', actualDispatchedMeters: 119.30, subRolls: 'Individual Roll', ageDays: 11 },
    { id: 'WB-112', baleNo: 'Roll 2376-B', vendorName: 'Krishna / Raju Dyeing', invoiceNo: 'INV-MS-0091', date: '2026-08-01', fabric: '100x100 Voil [48"] (Grey)', fabricQuality: '100x100 Voil', width: '48"', color: 'Grey', meters: 111.00, availableMeters: 111.00, folding: 'L100', actualDispatchedMeters: 111.00, subRolls: 'Individual Roll', ageDays: 11 },
    { id: 'WB-113', baleNo: 'Roll 2376-C', vendorName: 'Krishna / Raju Dyeing', invoiceNo: 'INV-MS-0091', date: '2026-08-01', fabric: '100x100 Voil [48"] (Grey)', fabricQuality: '100x100 Voil', width: '48"', color: 'Grey', meters: 78.40, availableMeters: 78.40, folding: 'L100', actualDispatchedMeters: 78.40, subRolls: 'Individual Roll', ageDays: 11 },
    { id: 'WB-114', baleNo: 'Roll 2376-D', vendorName: 'Krishna / Raju Dyeing', invoiceNo: 'INV-MS-0091', date: '2026-08-01', fabric: '100x100 Voil [48"] (Grey)', fabricQuality: '100x100 Voil', width: '48"', color: 'Grey', meters: 97.80, availableMeters: 97.80, folding: 'L100', actualDispatchedMeters: 97.80, subRolls: 'Individual Roll', ageDays: 11 },
    { id: 'WB-115', baleNo: 'Roll 2376-E', vendorName: 'Krishna / Raju Dyeing', invoiceNo: 'INV-MS-0091', date: '2026-08-01', fabric: '100x100 Voil [48"] (Grey)', fabricQuality: '100x100 Voil', width: '48"', color: 'Grey', meters: 113.30, availableMeters: 113.30, folding: 'L100', actualDispatchedMeters: 113.30, subRolls: 'Individual Roll', ageDays: 11 },
    { id: 'WB-116', baleNo: 'Roll 2376-F (Cut)', vendorName: 'Krishna / Raju Dyeing', invoiceNo: 'INV-MS-0091', date: '2026-08-01', fabric: '100x100 Voil [48"] (Grey)', fabricQuality: '100x100 Voil', width: '48"', color: 'Grey', meters: 20.00, availableMeters: 20.00, folding: 'L100', actualDispatchedMeters: 20.00, subRolls: 'Cut Piece', ageDays: 11 },
    { id: 'WB-117', baleNo: 'Roll 2376-G', vendorName: 'Krishna / Raju Dyeing', invoiceNo: 'INV-MS-0091', date: '2026-08-01', fabric: '100x100 Voil [48"] (Grey)', fabricQuality: '100x100 Voil', width: '48"', color: 'Grey', meters: 13.50, availableMeters: 13.50, folding: 'L100', actualDispatchedMeters: 13.50, subRolls: 'Cut Piece', ageDays: 11 }
  ];

  const [warehouseStockPool, setWarehouseStockPool] = useState(() => {
    try {
      const stored = localStorage.getItem('erp_warehouse_fabric_bales');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return defaultWarehouseBales;
  });

  // Helper to generate a unique system-generated Challan Number (e.g. CH-6557)
  const generateSystemChallanNumber = () => {
    try {
      const rawStored = localStorage.getItem('erp_process_challans_v1') || localStorage.getItem('erp_process_challans') || '[]';
      const stored = JSON.parse(rawStored);
      const existingNums = (Array.isArray(stored) ? stored : []).map(c =>
        String(c.challan_number || c.id || '').toUpperCase().trim()
      );
      for (let i = 0; i < 30; i++) {
        const rand4 = Math.floor(1000 + Math.random() * 9000);
        const candidate = `CH-${rand4}`;
        if (!existingNums.includes(candidate) && !existingNums.includes(String(rand4))) {
          return candidate;
        }
      }
      return `CH-${Math.floor(1000 + Math.random() * 9000)}`;
    } catch (e) {
      return `CH-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  };

  // Challan Number (System generated on new challan)
  const [challanNumber, setChallanNumber] = useState(
    initialChallan?.challan_number || generateSystemChallanNumber()
  );

  // Dispatch Date
  const [date, setDate] = useState(
    initialChallan?.date || new Date().toISOString().split('T')[0]
  );

  // Emergency Dispatch (Challan without PO, Section 4.3)
  const [isEmergencyDispatch, setIsEmergencyDispatch] = useState(
    initialChallan ? (initialChallan.po_link_status === 'Pending PO Link' || Boolean(initialChallan.admin_alert_triggered)) : false
  );

  // Multi-PO selection (e.g. PO #7611, #7612, #7613) - deduplicate
  const [selectedPOs, setSelectedPOs] = useState(() => {
    const raw = initialChallan?.linked_pos || [];
    const unique = [];
    raw.forEach(ref => {
      const clean = String(ref).replace(/^PPO-/, '');
      if (!unique.some(u => String(u).replace(/^PPO-/, '') === clean)) {
        unique.push(clean);
      }
    });
    return unique;
  });

  // Vendor (Auto-carried from PO or selectable in emergency)
  const [vendorId, setVendorId] = useState(initialChallan?.vendor_id || '');
  const [vendorName, setVendorName] = useState(initialChallan?.vendor_name || '');

  // Styles & Customer Brand
  const [stylesInfo, setStylesInfo] = useState(initialChallan?.styles_info || []);
  const [customerBrand, setCustomerBrand] = useState(initialChallan?.customer_brand || '');

  // Folding Notation (e.g. "L100" or "L98")
  const [foldingNotation, setFoldingNotation] = useState(initialChallan?.folding_notation || 'L100');

  // Particulars / Fabric Issue Description (Page 15 physical slip)
  const [particulars, setParticulars] = useState(
    initialChallan?.particulars || '100x100 Voil [48"] gray - fab issue for dying'
  );

  // Remarks
  const [remarks, setRemarks] = useState(initialChallan?.remarks || '');

  // Signatures (Section 9 & Page 15)
  const [companyRep, setCompanyRep] = useState(initialChallan?.company_representative || 'Anurag');
  const [receiverSignature, setReceiverSignature] = useState(initialChallan?.receiver_signature || 'Anurag');

  // Stock Bales / Rolls allocated for dispatch
  const [items, setItems] = useState(initialChallan?.items || []);

  // Modal states for Link PO & Warehouse Stock Allocation
  const [showLinkPOModal, setShowLinkPOModal] = useState(false);
  const [showStockPickerModal, setShowStockPickerModal] = useState(false);

  // Multi-select state inside the Stock Picker modal
  const [modalSelectedBaleIds, setModalSelectedBaleIds] = useState([]);
  const [modalVendorFilter, setModalVendorFilter] = useState('All');
  const [modalInvoiceFilter, setModalInvoiceFilter] = useState('All');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [customCutInputs, setCustomCutInputs] = useState({});

  // Multi-PO Bundling Dropdown states
  const [showPODropdown, setShowPODropdown] = useState(false);
  const [poSearchTerm, setPoSearchTerm] = useState('');
  const poDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (poDropdownRef.current && !poDropdownRef.current.contains(event.target)) {
        setShowPODropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper: Match PO
  const isPOMatched = (po, idOrRef) => {
    if (!po || !idOrRef) return false;
    const target = String(idOrRef).trim().toLowerCase();
    const poId = String(po.id || '').trim().toLowerCase();
    const poNum = String(po.po_number || '').trim().toLowerCase();
    return poId === target || poNum === target || target === `ppo-${poNum}`;
  };

  // PO Objects & Real-time target calculations
  const selectedPOObjects = availablePOs.filter(p =>
    selectedPOs.some(ref => isPOMatched(p, ref))
  );

  // Total Required Metres from linked Process PO(s)
  const totalRequiredMeters = selectedPOObjects.reduce((acc, p) => {
    const pMtrs = parseFloat(p.total_meters);
    if (!isNaN(pMtrs) && pMtrs > 0) return acc + pMtrs;
    const itemsSum = (p.items || []).reduce((s, it) => s + (parseFloat(it.quantity_meters) || 0), 0);
    return acc + itemsSum;
  }, 0);

  // Total Dispatched Metres
  const grandTotalMeters = items.reduce((acc, it) => acc + (parseFloat(it.dispatched_meters) || 0), 0);

  // Balance Remaining to Allocate
  const balancePendingMeters = Number(Math.max(0, totalRequiredMeters - grandTotalMeters).toFixed(2));

  // Auto-carry Vendor and Styles when PO selection changes
  useEffect(() => {
    if (!isEmergencyDispatch && selectedPOs.length > 0) {
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
      }
    }
  }, [selectedPOs, isEmergencyDispatch, availablePOs]);

  // Helper to compile current challan data for print slip preview
  const getCurrentChallanData = () => {
    const baleCount = items.filter(it => String(it.bale_roll_no || '').toLowerCase().includes('bale')).length;
    const looseCount = items.filter(it => !String(it.bale_roll_no || '').toLowerCase().includes('bale')).length;
    const totalPiecesText = (baleCount > 0 && looseCount > 0)
      ? `${baleCount} Bale + ${looseCount} th`
      : baleCount > 0
        ? `${baleCount} Bale`
        : `${looseCount || items.length} th`;

    return {
      ...(initialChallan || {}),
      id: initialChallan?.id || `PCH-${String(challanNumber).replace(/\D/g, '') || '4903'}`,
      challan_number: challanNumber,
      date,
      vendor_name: vendorName || 'Raju dyeing',
      vendor_id: vendorId || 'VEND-0003',
      linked_pos: selectedPOs.length > 0 ? selectedPOs : ['7611', '7612', '7613'],
      particulars: particulars || '100x100 Voil [48"] gray - fab issue for dying',
      folding_notation: foldingNotation || 'L100',
      total_bales: baleCount || 1,
      total_pieces: totalPiecesText || '1 Bale + 7 th',
      grand_total_meters: grandTotalMeters || 2418.80,
      items: items.length > 0 ? items : (initialChallan?.items || []),
      remarks: remarks || 'Fab issue for dyeing',
      receiver_signature: receiverSignature || 'Anurag',
      company_representative: companyRep || 'Anurag'
    };
  };

  // Toggle PO in multi-select
  const togglePOSelection = (po) => {
    const poKey = po.po_number || po.id;
    const isAlreadySelected = selectedPOs.some(ref => isPOMatched(po, ref));
    if (isAlreadySelected) {
      setSelectedPOs(selectedPOs.filter(ref => !isPOMatched(po, ref)));
    } else {
      // Enforce PDF Sec 4.2: Same vendor rule
      if (vendorName && po.vendor_name && vendorName !== po.vendor_name && selectedPOs.length > 0) {
        if (!window.confirm(`Warning: This shipment is bound to Vendor "${vendorName}". PO #${po.po_number || po.id} belongs to "${po.vendor_name}". A single Process Challan cannot bundle different vendors (PDF Section 4.2).\n\nDo you want to switch the shipment to "${po.vendor_name}"?`)) {
          return;
        }
        setVendorName(po.vendor_name);
        if (po.vendor_id) setVendorId(po.vendor_id);
        setSelectedPOs([poKey]);
        return;
      }
      if (po.vendor_name) setVendorName(po.vendor_name);
      if (po.vendor_id) setVendorId(po.vendor_id);
      setSelectedPOs([...selectedPOs, poKey]);
    }
  };

  // Auto-generate a new Process PO and link it to this Challan
  const handleAutoGenerateAndLinkPO = () => {
    const vName = vendorName || 'Job Worker';
    const vId = vendorId || 'V-01';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const newPoNum = `PPO-${randNum}`;
    const newPO = {
      id: newPoNum,
      po_number: String(randNum),
      process_type: 'Dyeing',
      vendor_id: vId,
      vendor_name: vName,
      date: date || new Date().toISOString().split('T')[0],
      total_meters: 100,
      fabric_quality: 'Fabric (Auto Generated)',
      status: 'Issued'
    };

    try {
      const rawStored = localStorage.getItem('erp_process_pos_v1') || localStorage.getItem('erp_process_pos') || '[]';
      const stored = JSON.parse(rawStored);
      stored.unshift(newPO);
      localStorage.setItem('erp_process_pos_v1', JSON.stringify(stored));
      localStorage.setItem('erp_process_pos', JSON.stringify(stored));
    } catch (e) { }

    setVendorName(vName);
    setVendorId(vId);
    setSelectedPOs(prev => [...prev, String(randNum)]);
    setIsEmergencyDispatch(false);
  };

  // Calculate actual dispatched meters accounting for folding notation (e.g. L98 -> 98%)
  const computeFoldedMeters = (nominalMtrs, fold) => {
    const mtr = parseFloat(nominalMtrs) || 0;
    const foldStr = String(fold || foldingNotation || '').toUpperCase().trim();
    if (foldStr.includes('98')) {
      return Number((mtr * 0.98).toFixed(2));
    }
    return mtr;
  };

  // Add stock bale from warehouse picker modal (Full or Cut Piece)
  const handleSelectWarehouseRoll = (roll, customMeters = null) => {
    // Check Single Batch Rule (Section 4.4 & 12.2: Do Not Mix Invoices)
    const existingInvoices = items.map(it => it.invoice_no).filter(Boolean);
    const hasDifferentInvoice = existingInvoices.length > 0 && !existingInvoices.includes(roll.invoiceNo);

    if (hasDifferentInvoice) {
      const confirmMix = window.confirm(
        `⚠️ Single Batch Rule (Do Not Mix Invoices):\n\nYou are adding a roll/bale from invoice [${roll.invoiceNo}], but existing items are from [${existingInvoices[0]}].\n\nMixing fabric from different dye lots may lead to visible shade variation.\n\nDo you want to confirm this mixed batch dispatch?`
      );
      if (!confirmMix) return;
    }

    const nominalOriginal = parseFloat(roll.availableMeters || roll.meters);
    const isCustomCut = customMeters !== null && !isNaN(customMeters) && customMeters > 0 && customMeters < nominalOriginal;
    const nominalDispatched = isCustomCut ? parseFloat(customMeters) : nominalOriginal;
    const foldCode = roll.folding || foldingNotation || 'L100';
    const actualDispatched = computeFoldedMeters(nominalDispatched, foldCode);

    const newItem = {
      id: Date.now() + Math.random(),
      bale_roll_no: roll.baleNo,
      invoice_no: roll.invoiceNo,
      vendor_name: roll.vendorName || '',
      fabric_name: roll.fabric || 'Grey [48"]',
      color_name: roll.color || 'Black',
      original_piece_meters: nominalOriginal,
      dispatched_meters: actualDispatched,
      is_partial_cut: isCustomCut,
      folding: foldCode,
      remaining_stock_meters: Number(Math.max(0, nominalOriginal - nominalDispatched).toFixed(2))
    };

    setItems(prev => [...prev, newItem]);

    // Update warehouse stock available balance
    setWarehouseStockPool(prev => prev.map(wb => {
      if (wb.id === roll.id) {
        const updatedAvail = Math.max(0, (wb.availableMeters || wb.meters) - nominalDispatched);
        return { ...wb, availableMeters: Number(updatedAvail.toFixed(2)) };
      }
      return wb;
    }));

    setShowStockPickerModal(false);
  };

  // Auto-Fulfill Pending Balance (FIFO sequence: takes full bales or cuts from next bale to reach 100%)
  const handleAutoFulfillBalance = () => {
    let remainingNeeded = balancePendingMeters;
    if (remainingNeeded <= 0) {
      alert('Order requirement is already 100% fulfilled!');
      return;
    }

    const newItems = [...items];
    const updatedStock = [...warehouseStockPool];

    for (let i = 0; i < updatedStock.length; i++) {
      const roll = updatedStock[i];
      const avail = parseFloat(roll.availableMeters !== undefined ? roll.availableMeters : roll.meters);

      if (avail > 0) {
        const foldCode = roll.folding || foldingNotation || 'L100';

        if (avail <= remainingNeeded) {
          // Take whole bale (Scenario A)
          const actualMtrs = computeFoldedMeters(avail, foldCode);
          newItems.push({
            id: Date.now() + Math.random() + i,
            bale_roll_no: roll.baleNo,
            invoice_no: roll.invoiceNo,
            vendor_name: roll.vendorName || '',
            fabric_name: roll.fabric,
            color_name: roll.color,
            original_piece_meters: avail,
            dispatched_meters: actualMtrs,
            is_partial_cut: false,
            folding: foldCode,
            remaining_stock_meters: 0
          });
          remainingNeeded = Number(Math.max(0, remainingNeeded - actualMtrs).toFixed(2));
          updatedStock[i] = { ...roll, availableMeters: 0 };
        } else {
          // Cut piece from bale (Scenario B)
          const actualCut = computeFoldedMeters(remainingNeeded, foldCode);
          newItems.push({
            id: Date.now() + Math.random() + i,
            bale_roll_no: roll.baleNo,
            invoice_no: roll.invoiceNo,
            vendor_name: roll.vendorName || '',
            fabric_name: roll.fabric,
            color_name: roll.color,
            original_piece_meters: avail,
            dispatched_meters: actualCut,
            is_partial_cut: true,
            folding: foldCode,
            remaining_stock_meters: Number((avail - remainingNeeded).toFixed(2))
          });
          updatedStock[i] = { ...roll, availableMeters: Number((avail - remainingNeeded).toFixed(2)) };
          remainingNeeded = 0;
          break;
        }
      }
      if (remainingNeeded <= 0) break;
    }

    setItems(newItems);
    setWarehouseStockPool(updatedStock);
  };

  // Allocate multiple selected bales in one click
  const handleAllocateMultiBales = () => {
    if (modalSelectedBaleIds.length === 0) return;
    const selectedBales = warehouseStockPool.filter(wb => modalSelectedBaleIds.includes(wb.id));

    // Check Single Batch Rule
    const distinctInvoices = [...new Set(selectedBales.map(b => b.invoiceNo))];
    const existingInvoices = items.map(it => it.invoice_no).filter(Boolean);
    const allInvoices = [...new Set([...existingInvoices, ...distinctInvoices])];

    if (allInvoices.length > 1) {
      const confirmMix = window.confirm(
        `⚠️ Single Batch Rule (Do Not Mix Invoices):\n\nYou are selecting bales from multiple invoices: [${allInvoices.join(', ')}].\n\nConfirm dispatch with mixed batch lots?`
      );
      if (!confirmMix) return;
    }

    const newAllocated = [];
    selectedBales.forEach((roll, i) => {
      const avail = parseFloat(roll.availableMeters !== undefined ? roll.availableMeters : roll.meters);
      const foldCode = roll.folding || foldingNotation || 'L100';
      const actual = computeFoldedMeters(avail, foldCode);
      newAllocated.push({
        id: Date.now() + Math.random() + i,
        bale_roll_no: roll.baleNo,
        invoice_no: roll.invoiceNo,
        vendor_name: roll.vendorName || '',
        fabric_name: roll.fabric,
        color_name: roll.color,
        original_piece_meters: avail,
        dispatched_meters: actual,
        is_partial_cut: false,
        folding: foldCode,
        remaining_stock_meters: 0
      });
    });

    setItems(prev => [...prev, ...newAllocated]);
    setWarehouseStockPool(prev => prev.map(wb =>
      modalSelectedBaleIds.includes(wb.id) ? { ...wb, availableMeters: 0 } : wb
    ));
    setModalSelectedBaleIds([]);
    setShowStockPickerModal(false);
  };

  const addManualStockRow = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        bale_roll_no: `Bale ${items.length + 1}`,
        invoice_no: items[0]?.invoice_no || 'INV-VA-001 (Jan)',
        fabric_name: items[0]?.fabric_name || 'Grey [48"]',
        color_name: items[0]?.color_name || 'Black',
        original_piece_meters: '',
        dispatched_meters: '',
        is_partial_cut: false,
        folding: foldingNotation || 'L100',
        remaining_stock_meters: 0
      }
    ]);
  };

  const removeItem = (idx) => {
    const itemToRemove = items[idx];
    if (itemToRemove && itemToRemove.bale_roll_no) {
      // Return meters back to warehouse stock pool
      setWarehouseStockPool(prev => prev.map(wb => {
        if (wb.baleNo === itemToRemove.bale_roll_no && wb.invoiceNo === itemToRemove.invoice_no) {
          const restored = (parseFloat(wb.availableMeters) || 0) + (parseFloat(itemToRemove.dispatched_meters) || 0);
          return { ...wb, availableMeters: Number(restored.toFixed(2)) };
        }
        return wb;
      }));
    }
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemFieldChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-recalculate folding if folding changes
    if (field === 'folding') {
      const orig = parseFloat(updated[index].original_piece_meters) || parseFloat(updated[index].dispatched_meters) || 0;
      if (orig > 0) {
        updated[index].dispatched_meters = computeFoldedMeters(orig, value);
      }
    }

    // Auto-update partial cut flag and remaining meters
    if (field === 'dispatched_meters') {
      const orig = parseFloat(updated[index].original_piece_meters) || 0;
      const disp = parseFloat(value) || 0;
      if (orig > 0) {
        updated[index].is_partial_cut = disp < orig;
        updated[index].remaining_stock_meters = Number(Math.max(0, orig - disp).toFixed(2));
      }
    }

    setItems(updated);
  };

  // Status
  const poLinkStatus = isEmergencyDispatch
    ? 'Pending PO Link'
    : (selectedPOs.length > 0 ? 'Linked' : 'Draft');

  const handleSubmit = (e, andRecordReturn = false) => {
    if (e && e.preventDefault) e.preventDefault();

    const trimmedChallanNo = (challanNumber || '').trim();
    if (!trimmedChallanNo) {
      alert('Please enter a Challan Number.');
      return;
    }

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

    // Calculate Bales vs Loose Thans count for authentic physical slip
    const baleCount = items.filter(it => String(it.bale_roll_no || '').toLowerCase().includes('bale')).length;
    const looseCount = items.filter(it => !String(it.bale_roll_no || '').toLowerCase().includes('bale')).length;
    const totalPiecesText = (baleCount > 0 && looseCount > 0)
      ? `${baleCount} Bale + ${looseCount} th`
      : baleCount > 0
        ? `${baleCount} Bale`
        : `${looseCount || items.length} th`;

    const challanPayload = {
      id: initialChallan?.id || `PCH-${trimmedChallanNo}`,
      challan_number: trimmedChallanNo,
      date,
      vendor_id: vendorId,
      vendor_name: vendorName,
      linked_pos: isEmergencyDispatch ? [] : selectedPOs,
      styles_info: stylesInfo,
      customer_brand: customerBrand,
      po_link_status: poLinkStatus,
      admin_alert_triggered: isEmergencyDispatch,
      particulars: particulars || '100x100 Voil [48"] gray - fab issue for dying',
      folding_notation: foldingNotation || 'L100',
      total_bales: baleCount || 1,
      total_pieces: totalPiecesText,
      grand_total_meters: Number(grandTotalMeters.toFixed(2)),
      remarks,
      receiver_signature: receiverSignature,
      company_representative: companyRep,
      status: (initialChallan?.status && initialChallan.status !== 'Draft') ? initialChallan.status : 'Dispatched',
      is_draft: false,
      created_by: initialChallan?.created_by || 'Saksham Garg',
      created_at: initialChallan?.created_at || new Date().toISOString(),
      items
    };

    onSave(challanPayload, andRecordReturn);
  };

  const isSectionEditable = (sectionKey) => {
    // If it's already a saved/dispatched challan or locked by GRN, editing is not permitted
    if (isExistingSaved || isLocked) return false;
    return true;
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
                {isExistingSaved ? `Process Challan #${challanNumber}` : 'Create Process Dispatch Challan'}
              </h5>
              <span className={`badge rounded-pill fs-11 fw-bold px-2.5 py-1 ${isLocked
                ? 'bg-white text-dark border shadow-xs'
                : isEmergencyDispatch
                  ? 'bg-danger text-white border border-danger shadow-xs'
                  : isExistingSaved
                    ? 'bg-success-subtle text-success border border-success-subtle'
                    : selectedPOs.length > 0
                      ? 'bg-primary-subtle text-primary border border-primary-subtle'
                      : 'bg-light text-secondary border'
                }`}>
                {isLocked
                  ? 'Locked'
                  : isEmergencyDispatch
                    ? '⚠ Pending PO Link (Emergency)'
                    : isExistingSaved
                      ? '● Dispatched to Vendor'
                      : selectedPOs.length > 0
                        ? '● PO Linked'
                        : 'Draft (Select PO)'}
              </span>
            </div>
            <div className="text-muted fs-12 mt-0.5 d-flex align-items-center gap-2">
              <span>Fabric Dispatch to Job Work Vendor</span>
              {vendorName && (
                <>
                  <span>•</span>
                  <span className="fw-semibold text-dark">{vendorName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="d-flex align-items-center gap-2">
          {isExistingSaved && (
            <button
              type="button"
              className="btn btn-light btn-sm px-3 rounded-2 border shadow-xs d-flex align-items-center gap-1.5 text-secondary"
              onClick={onCancel}
              title="Back to Challans list"
            >
              <i className="ti ti-arrow-left fs-15"></i>
              <span>Back to Challans</span>
            </button>
          )}

          {onPrintChallan && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-3 rounded-2 d-flex align-items-center gap-1.5"
              onClick={() => onPrintChallan(getCurrentChallanData())}
              title="Print Job Challan Slip matching Page 15 paper format"
            >
              <i className="ti ti-printer fs-15"></i>
              <span>Print Challan Slip</span>
            </button>
          )}

          {!isLocked && isExistingSaved && onRecordReturn && (
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
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card-body p-4" style={{ background: '#f8fafc' }}>

          {/* Section 4.3: Persistent Red Banner ONLY for Emergency Dispatch without PO */}
          {isEmergencyDispatch && (
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
              </div>
            </div>

            <div className="p-4">
              {/* Multi-PO Bundling Selector (Section 4.2 & Page 15: PO=7611, 7612, 7613) */}
              {!isEmergencyDispatch && (
                <div className="mb-3 pb-3 border-bottom" ref={poDropdownRef}>
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1.5 d-flex align-items-center justify-content-between">
                    <span>Link by Vendor / Party Name &amp; Process POs (Multi-Select) <span className="text-danger">*</span></span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted fs-11">Page 15 slip: Bundles multiple POs to same vendor</span>
                      {isSectionEditable('header') && (
                        <button
                          type="button"
                          className="btn btn-sm btn-link p-0 text-primary text-decoration-none fs-11 fw-semibold d-flex align-items-center gap-1"
                          onClick={handleAutoGenerateAndLinkPO}
                          title="Auto-generate a new Process PO and link to this Challan"
                        >
                          <i className="ti ti-plus fs-12"></i>
                          <span>+ Auto-Generate PO</span>
                        </button>
                      )}
                    </div>
                  </label>

                  {/* Dropdown Trigger Box */}
                  <div className="position-relative">
                    <button
                      type="button"
                      className="form-select form-select-sm bg-white fs-13 d-flex align-items-center justify-content-between text-start shadow-xs"
                      style={{
                        borderColor: '#cbd5e1',
                        height: '40px',
                        borderRadius: '6px',
                        cursor: isSectionEditable('header') ? 'pointer' : 'not-allowed',
                        color: selectedPOs.length > 0 ? '#0f172a' : '#94a3b8'
                      }}
                      disabled={!isSectionEditable('header')}
                      onClick={() => setShowPODropdown(!showPODropdown)}
                    >
                      <span className="text-truncate pe-3">
                        {selectedPOs.length === 0 ? (
                          <span className="text-muted">-- Select Vendor Name / Process PO(s) to bundle --</span>
                        ) : selectedPOs.length === 1 ? (
                          (() => {
                            const po = availablePOs.find(p => isPOMatched(p, selectedPOs[0]));
                            const vName = po?.vendor_name || vendorName || 'Vendor';
                            const pNum = po ? (po.po_number || po.id) : selectedPOs[0];
                            const meters = po?.total_meters ? ` (${po.total_meters}m)` : '';
                            return (
                              <span>
                                <strong className="text-dark">{vName}</strong>
                                <span className="text-secondary ms-1.5 fs-12">• PO #{pNum}{meters}</span>
                              </span>
                            );
                          })()
                        ) : (
                          (() => {
                            const selectedObjs = availablePOs.filter(p => selectedPOs.some(ref => isPOMatched(p, ref)));
                            const vNames = [...new Set(selectedObjs.map(p => p.vendor_name).filter(Boolean))];
                            const pNums = selectedPOs.map(r => `#${r}`).join(', ');
                            return (
                              <span className="fw-semibold text-dark">
                                {vNames.length > 0 ? vNames.join(', ') : 'Bundled'}: <span className="text-primary">{pNums}</span> ({selectedPOs.length} POs)
                              </span>
                            );
                          })()
                        )}
                      </span>
                    </button>

                    {/* Dropdown Menu */}
                    {showPODropdown && isSectionEditable('header') && (
                      <div
                        className="position-absolute bg-white border rounded-3 shadow-lg p-2"
                        style={{
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: 1050,
                          marginTop: '4px',
                          maxHeight: '320px',
                          overflowY: 'auto'
                        }}
                      >
                        {/* Search Input inside Dropdown */}
                        <div className="mb-2 px-1">
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light border-end-0">
                              <i className="ti ti-search fs-12 text-muted"></i>
                            </span>
                            <input
                              type="text"
                              className="form-control form-control-sm border-start-0 fs-12"
                              placeholder="Search by Vendor / Party Name, PO #, or fabric..."
                              value={poSearchTerm}
                              onChange={(e) => setPoSearchTerm(e.target.value)}
                              autoFocus
                            />
                            {poSearchTerm && (
                              <button
                                className="btn btn-sm btn-light border"
                                type="button"
                                onClick={() => setPoSearchTerm('')}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>

                        {/* List of Available POs with checkboxes */}
                        {(() => {
                          const eligiblePOs = availablePOs.filter(p => p.status !== 'Draft');
                          const filtered = eligiblePOs.filter(po => {
                            if (!poSearchTerm.trim()) return true;
                            const term = poSearchTerm.toLowerCase();
                            const poNum = String(po.po_number || po.id || '').toLowerCase();
                            const vendor = String(po.vendor_name || '').toLowerCase();
                            const fabric = String(po.fabric_quality || '').toLowerCase();
                            return poNum.includes(term) || vendor.includes(term) || fabric.includes(term);
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="text-muted fs-12 p-3 text-center">
                                No eligible Process POs found.
                              </div>
                            );
                          }

                          return (
                            <div className="d-flex flex-column gap-1">
                              {filtered.map((po) => {
                                const isSelected = selectedPOs.some(ref => isPOMatched(po, ref));
                                return (
                                  <div
                                    key={po.id || po.po_number}
                                    className={`d-flex align-items-center justify-content-between p-2 rounded-2 fs-12 transition-all ${isSelected
                                      ? 'bg-primary-subtle text-primary fw-semibold border border-primary-subtle'
                                      : 'hover-bg-light text-dark'
                                      }`}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                    onClick={() => togglePOSelection(po)}
                                  >
                                    <div className="d-flex align-items-center gap-2.5">
                                      <input
                                        type="checkbox"
                                        className="form-check-input mt-0"
                                        checked={isSelected}
                                        onChange={() => { }}
                                        style={{ cursor: 'pointer' }}
                                      />
                                      <div>
                                        <div className="d-flex align-items-center gap-1.5">
                                          <span className="fw-bold text-dark fs-13">{po.vendor_name || 'Vendor'}</span>
                                          <span className="badge bg-light text-secondary border font-monospace fs-11 px-1.5 py-0.5">
                                            PO #{po.po_number || po.id}
                                          </span>
                                        </div>
                                        <div className="text-muted fs-11 mt-0.5">
                                          {po.fabric_quality ? `${po.fabric_quality} • ` : ''}
                                          {po.total_meters ? `${po.total_meters}m` : ''}
                                          {Array.isArray(po.style_names) && po.style_names.length > 0 ? ` • Style: ${po.style_names.join(', ')}` : ''}
                                        </div>
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <span className="badge bg-primary text-white fs-10 px-1.5 py-0.5 rounded">
                                        Selected
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Selected PO Badges/Chips */}
                  {selectedPOs.length > 0 && (
                    <div className="d-flex flex-wrap gap-1.5 align-items-center mt-2.5">
                      <span className="text-muted fs-11 me-1">Selected Party / PO(s):</span>
                      {selectedPOs.map((poRef) => {
                        const po = availablePOs.find(p => isPOMatched(p, poRef));
                        const poNum = po ? (po.po_number || po.id) : poRef;
                        const vendor = po?.vendor_name || vendorName || '';
                        const meters = po?.total_meters ? `${po.total_meters}m` : '';
                        return (
                          <span
                            key={poRef}
                            className="badge bg-primary text-white d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill fs-12 shadow-xs"
                          >
                            <i className="ti ti-check fs-12"></i>
                            <span className="fw-bold">{vendor || 'Vendor'}</span>
                            <span className="opacity-90 fs-11">• PO #{poNum}</span>
                            {meters && <span className="opacity-80 fs-11">({meters})</span>}
                            {isSectionEditable('header') && (
                              <button
                                type="button"
                                className="btn-close btn-close-white p-0 ms-1"
                                style={{ fontSize: '8px', cursor: 'pointer' }}
                                onClick={() => {
                                  if (po) togglePOSelection(po);
                                  else setSelectedPOs(selectedPOs.filter(r => r !== poRef));
                                }}
                                title="Remove from shipment"
                              />
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Data Fields strictly matching Section 4.1 Data Structure */}
              <div className="row g-3">
                {/* 1. Challan Number */}
                <div className="col-12 col-md-4">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Challan Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white fs-13 fw-bold text-dark font-monospace"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={challanNumber}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setChallanNumber(e.target.value)}
                    placeholder="e.g. CH-4903"
                    required
                  />
                </div>

                {/* 2. Date */}
                <div className="col-12 col-md-4">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Date of Dispatch <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm bg-white fs-13 text-dark"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={date}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                {/* 3. Vendor */}
                <div className="col-12 col-md-4">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Vendor (Job Worker) <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-select-sm bg-white fs-13 text-dark fw-semibold"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={vendorName || ''}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => {
                      const chosenName = e.target.value;
                      setVendorName(chosenName);
                      const v = initialVendors.find(vend => vend.name === chosenName);
                      if (v) setVendorId(v.id);
                      if (selectedPOs.length > 0) {
                        const mismatch = availablePOs.filter(p => selectedPOs.some(ref => isPOMatched(p, ref)) && p.vendor_name !== chosenName);
                        if (mismatch.length > 0) {
                          setSelectedPOs(selectedPOs.filter(ref => {
                            const po = availablePOs.find(p => isPOMatched(p, ref));
                            return po && po.vendor_name === chosenName;
                          }));
                        }
                      }
                    }}
                    required
                  >
                    <option value="">-- Select Vendor Name --</option>
                    {Array.from(new Set([
                      ...initialVendors.map(v => v.name),
                      ...availablePOs.map(p => p.vendor_name).filter(Boolean)
                    ])).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Style / Customer / Brand */}
                <div className="col-12 col-md-4">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Style / Customer / Brand
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-light fs-13 text-dark"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={[
                      stylesInfo && stylesInfo.length > 0 ? stylesInfo.join(', ') : '',
                      customerBrand ? `(${customerBrand})` : ''
                    ].filter(Boolean).join(' ') || 'Auto-carried from PO'}
                    placeholder="Auto-carried from PO"
                    readOnly
                  />
                </div>

                {/* 5. Folding Notation */}
                <div className="col-12 col-md-4">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Folding Notation (e.g. L100)
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white fs-13 text-dark"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={foldingNotation}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFoldingNotation(val);
                      setItems(prev => prev.map(it => ({
                        ...it,
                        folding: (!it.folding || it.folding === foldingNotation) ? val : it.folding
                      })));
                    }}
                    placeholder="e.g. L100 / Fold 98"
                  />
                </div>

                {/* 6. Particulars / Fabric Description (Job Challan Slip Field) */}
                <div className="col-12 col-md-8">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Particulars / Fabric Issue Description <span className="text-muted fw-normal">(Matches physical Job Challan paper slip)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white fs-13 text-dark fw-medium"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={particulars}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setParticulars(e.target.value)}
                    placeholder="e.g. 100x100 Voil [48&quot;] gray - fab issue for dying"
                  />
                </div>

                {/* 7. PO Link Status */}
                <div className="col-12 col-md-4">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    PO Link Status
                  </label>
                  <div className="d-flex align-items-center" style={{ height: '38px' }}>
                    <span className={`badge px-3 py-2 fs-12 fw-bold rounded-2 ${isEmergencyDispatch
                      ? 'bg-danger text-white border border-danger shadow-xs'
                      : selectedPOs.length > 0
                        ? 'bg-success-subtle text-success border border-success-subtle'
                        : 'bg-light text-secondary border'
                      }`}>
                      {isEmergencyDispatch
                        ? '⚠ Pending PO Link (Emergency)'
                        : selectedPOs.length > 0
                          ? '✓ Linked to PO'
                          : 'Draft (No PO)'}
                    </span>
                  </div>
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
                  <p className="text-muted fs-11 mb-0">Warehouse inward stock pool • Single Batch Rule (Do Not Mix Invoices) • Folding L100 vs L98</p>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                {isSectionEditable('items') && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm px-3 rounded-2 d-flex align-items-center gap-1.5 shadow-xs"
                      onClick={() => setShowStockPickerModal(true)}
                    >
                      <i className="ti ti-building-warehouse fs-14"></i>
                      <span>Pick Bales from Warehouse (FIFO)</span>
                    </button>
                    {totalRequiredMeters > 0 && balancePendingMeters > 0 && (
                      <button
                        type="button"
                        className="btn btn-warning btn-sm px-3 rounded-2 fw-semibold d-flex align-items-center gap-1.5 shadow-xs"
                        onClick={handleAutoFulfillBalance}
                        title="Auto-allocate sequence of bales to hit 100% of order requirement"
                      >
                        <i className="ti ti-bolt fs-14"></i>
                        <span>Auto-Fulfill ({balancePendingMeters.toFixed(1)}m)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-light border btn-sm px-2.5 rounded-2 text-secondary"
                      onClick={addManualStockRow}
                    >
                      <i className="ti ti-plus fs-14"></i> Manual Row
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Real-Time Requirement vs Dispatched Tracker Bar */}
            <div className="p-3 px-4 border-bottom bg-light-subtle">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-3">
                  <div className="p-2.5 rounded border bg-white shadow-xs">
                    <span className="text-muted fs-11 fw-medium text-uppercase d-block">PO Required Meters</span>
                    <div className="d-flex align-items-baseline gap-1.5">
                      <span className="fs-16 fw-bold text-primary">
                        {totalRequiredMeters > 0 ? `${totalRequiredMeters.toFixed(2)} m` : 'Open Allocation'}
                      </span>
                      {selectedPOs.length > 0 && (
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-10">
                          {selectedPOs.length} PO(s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-3">
                  <div className="p-2.5 rounded border bg-white shadow-xs">
                    <span className="text-muted fs-11 fw-medium text-uppercase d-block">Total Dispatched</span>
                    <div className="d-flex align-items-baseline gap-1.5">
                      <span className="fs-16 fw-bold text-dark">
                        {grandTotalMeters.toFixed(2)} m
                      </span>
                      <span className="text-muted fs-11">({items.length} rolls/bales)</span>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-3">
                  <div className={`p-2.5 rounded border shadow-xs bg-white ${
                    totalRequiredMeters > 0 && grandTotalMeters >= totalRequiredMeters - 0.05
                      ? 'border-success'
                      : balancePendingMeters > 0
                        ? 'border-warning'
                        : 'border-light'
                  }`}>
                    <span className="text-muted fs-11 fw-medium text-uppercase d-block">Fulfillment Status</span>
                    {totalRequiredMeters > 0 ? (
                      grandTotalMeters >= totalRequiredMeters - 0.05 ? (
                        <span className="fs-13 fw-bold text-success d-flex align-items-center gap-1">
                          <i className="ti ti-circle-check fs-15"></i> 100% Fulfilled ✓
                        </span>
                      ) : (
                        <span className="fs-13 fw-bold text-warning d-flex align-items-center gap-1">
                          <i className="ti ti-clock-pause fs-15"></i> Pending: {balancePendingMeters.toFixed(2)} m
                        </span>
                      )
                    ) : (
                      <span className="fs-13 fw-bold text-secondary">Ready for Dispatch</span>
                    )}
                  </div>
                </div>

                <div className="col-12 col-md-3 d-flex flex-column gap-1.5 justify-content-center">
                  {totalRequiredMeters > 0 && balancePendingMeters > 0 && isSectionEditable('items') ? (
                    <button
                      type="button"
                      className="btn btn-outline-warning btn-sm py-1.5 px-3 fw-bold d-flex align-items-center justify-content-center gap-1.5 shadow-xs"
                      onClick={handleAutoFulfillBalance}
                    >
                      <i className="ti ti-bolt fs-14"></i>
                      <span>⚡ Auto-Fulfill Balance</span>
                    </button>
                  ) : null}
                  {isSectionEditable('items') && (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm py-1.5 px-3 fw-semibold d-flex align-items-center justify-content-center gap-1.5 shadow-xs"
                      onClick={() => setShowStockPickerModal(true)}
                    >
                      <i className="ti ti-building-warehouse fs-14"></i>
                      <span>Browse Warehouse Stock</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-0">
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0" style={{ borderColor: '#dee2e6', fontSize: '13px' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr style={{ color: '#475569', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                      <th className="text-center py-2" style={{ width: '35px' }}>#</th>
                      <th style={{ minWidth: '140px' }}>Bale / Roll No *</th>
                      <th style={{ minWidth: '140px' }}>Stock Invoice Ref *</th>
                      <th style={{ minWidth: '150px' }}>Fabric Quality</th>
                      <th style={{ minWidth: '110px' }}>Color Shade</th>
                      <th style={{ width: '150px' }} className="text-center">Dispatch Mode</th>
                      <th style={{ width: '100px' }} className="text-end">Original (m)</th>
                      <th style={{ width: '85px' }} className="text-center">Folding</th>
                      <th style={{ width: '120px' }} className="text-end text-dark">Dispatched (m) *</th>
                      <th style={{ width: '140px' }} className="text-end">Remaining in Stock (m)</th>
                      {isSectionEditable('items') && <th style={{ width: '40px' }} className="text-center">Act</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-5 text-muted">
                          <div className="py-3">
                            <i className="ti ti-packages fs-32 text-secondary mb-2 d-block opacity-50"></i>
                            <h6 className="fs-14 fw-semibold text-dark mb-1">No Warehouse Stock Allocated Yet</h6>
                            <p className="fs-12 text-muted mb-3">
                              {totalRequiredMeters > 0
                                ? `Order requires ${totalRequiredMeters.toFixed(2)} meters. Select bales/rolls from warehouse inventory or auto-fulfill.`
                                : 'Select bales/rolls from warehouse inventory to dispatch on this Process Challan.'}
                            </p>
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                type="button"
                                className="btn btn-primary btn-sm px-3 shadow-sm d-flex align-items-center gap-1.5"
                                onClick={() => setShowStockPickerModal(true)}
                              >
                                <i className="ti ti-building-warehouse fs-14"></i>
                                <span>Pick Bales from Warehouse Stock</span>
                              </button>
                              {totalRequiredMeters > 0 && (
                                <button
                                  type="button"
                                  className="btn btn-warning btn-sm px-3 shadow-xs d-flex align-items-center gap-1.5"
                                  onClick={handleAutoFulfillBalance}
                                >
                                  <i className="ti ti-bolt fs-14"></i>
                                  <span>Auto-Fulfill (FIFO)</span>
                                </button>
                              )}
                            </div>
                          </div>
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
                              placeholder="e.g. Bale 6 or Roll 2376-A"
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
                              placeholder="e.g. INV-VA-001 (Jan)"
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
                              placeholder="100x100 Voil [48&quot;] gray"
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
                              placeholder="Black"
                            />
                          </td>

                          {/* Dispatch Mode Dropdown: Scenario A vs Scenario B */}
                          <td className="text-center" style={{ minWidth: '150px' }}>
                            <select
                              className={`form-select form-select-sm fs-11 fw-semibold ${it.is_partial_cut ? 'border-warning bg-warning-subtle text-dark' : 'bg-white text-dark'}`}
                              style={{ borderColor: '#cbd5e1', height: '32px', borderRadius: '5px' }}
                              value={it.is_partial_cut ? 'cut' : 'full'}
                              disabled={!isSectionEditable('items')}
                              onChange={(e) => {
                                const isCut = e.target.value === 'cut';
                                handleItemFieldChange(idx, 'is_partial_cut', isCut);
                              }}
                            >
                              <option value="full">Scenario A: Full Bale</option>
                              <option value="cut">Scenario B: Cut Piece</option>
                            </select>
                            {it.is_partial_cut && (
                              <div className="text-muted mt-0.5" style={{ fontSize: '10px' }}>Partial cut deduction</div>
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

                          {/* Folding */}
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm text-center fs-12 px-1"
                              style={{ borderColor: '#cbd5e1' }}
                              value={it.folding || foldingNotation || ''}
                              disabled={!isSectionEditable('items')}
                              onChange={(e) => handleItemFieldChange(idx, 'folding', e.target.value)}
                              placeholder="L100"
                            />
                          </td>

                          {/* Dispatched Meters */}
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control form-control-sm text-end fw-bold text-dark fs-12 px-2"
                              style={{ borderColor: '#cbd5e1' }}
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

                          {/* Remaining in Stock */}
                          <td className="text-end">
                            {it.is_partial_cut ? (
                              <span className="badge bg-warning-subtle text-dark border border-warning-subtle font-monospace fs-11 py-1">
                                {it.remaining_stock_meters !== undefined
                                  ? `${Number(it.remaining_stock_meters).toFixed(2)} m`
                                  : (it.original_piece_meters ? `${(parseFloat(it.original_piece_meters) - parseFloat(it.dispatched_meters || 0)).toFixed(2)} m` : '0.00 m')}
                              </span>
                            ) : (
                              <span className="text-muted fs-11 font-monospace">0.00 m (Depleted)</span>
                            )}
                          </td>

                          {/* Delete */}
                          {isSectionEditable('items') && (
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn btn-link text-danger p-0"
                                onClick={() => removeItem(idx)}
                                title="Remove line and return meters to warehouse stock"
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
                      <td colSpan={8} className="text-end text-uppercase text-secondary py-2 fs-12">
                        Grand Total Dispatched:
                      </td>
                      <td className="text-end text-dark fs-13 py-2">
                        {Number(grandTotalMeters).toFixed(2)} m
                      </td>
                      <td colSpan={isSectionEditable('items') ? 2 : 1} className="text-muted fs-11 py-2 text-center">
                        ({items.length} {items.length === 1 ? 'Roll / Bale' : 'Rolls / Bales'})
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
            {isExistingSaved ? (
              <span>This Process Challan is finalized and dispatched to <strong>{vendorName || 'Vendor'}</strong>. Fabric is tracked as <strong>"Out for Processing"</strong>.</span>
            ) : (
              <span>Stock will be deducted from warehouse inventory and tracked as <strong>"Out for Processing"</strong> against {vendorName || 'Vendor'}.</span>
            )}
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-light btn-sm border text-secondary px-3" onClick={onCancel}>
              {isExistingSaved ? 'Back to Challans' : 'Cancel'}
            </button>
            {onPrintChallan && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3 shadow-xs d-flex align-items-center gap-1.5"
                onClick={() => onPrintChallan(getCurrentChallanData())}
              >
                <i className="ti ti-printer fs-14"></i>
                <span>Print Challan Slip</span>
              </button>
            )}
            {!isExistingSaved && (
              <button
                type="submit"
                className="btn btn-primary btn-sm px-4 py-1.5 shadow-sm d-flex align-items-center gap-1.5"
                style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
              >
                <i className="ti ti-truck-delivery fs-15"></i>
                <span>Save &amp; Dispatch Challan</span>
              </button>
            )}
            {isExistingSaved && onRecordReturn && !isLocked && (
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

      {/* Modal: Warehouse Stock Picker (FIFO, Multi-Bale, Full vs Cut Piece) */}
      {showStockPickerModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
              <div className="modal-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="modal-title fw-bold text-dark fs-16 mb-0">
                    <i className="ti ti-building-warehouse text-primary me-2"></i>
                    Warehouse Stock Allocation (Bales / Rolls Inventory)
                  </h6>
                  <p className="text-muted fs-11 mb-0">
                    Inward purchase stock • FIFO priority • Scenario A (Full Bale) vs Scenario B (Cut Piece) • Single Batch Check
                  </p>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowStockPickerModal(false)}></button>
              </div>

              {/* Requirement Summary & Quick Action Strip */}
              <div className="py-2.5 px-4 bg-light border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center gap-1.5">
                    <span className="text-muted fs-12">PO Target:</span>
                    <strong className="text-primary fs-13">
                      {totalRequiredMeters > 0 ? `${totalRequiredMeters.toFixed(2)} m` : 'Open'}
                    </strong>
                  </div>
                  <div className="vr" style={{ height: '16px' }}></div>
                  <div className="d-flex align-items-center gap-1.5">
                    <span className="text-muted fs-12">Dispatched:</span>
                    <strong className="text-dark fs-13">{grandTotalMeters.toFixed(2)} m</strong>
                  </div>
                  <div className="vr" style={{ height: '16px' }}></div>
                  <div className="d-flex align-items-center gap-1.5">
                    <span className="text-muted fs-12">Balance Needed:</span>
                    <strong className={`fs-13 ${balancePendingMeters > 0 ? 'text-warning' : 'text-success'}`}>
                      {balancePendingMeters > 0 ? `${balancePendingMeters.toFixed(2)} m` : '0.00 m (Fulfilled ✓)'}
                    </strong>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  {modalSelectedBaleIds.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm px-3 shadow-xs fw-semibold d-flex align-items-center gap-1.5"
                      onClick={handleAllocateMultiBales}
                    >
                      <i className="ti ti-check fs-14"></i>
                      <span>Allocate Selected ({modalSelectedBaleIds.length} Bales)</span>
                    </button>
                  )}

                  {totalRequiredMeters > 0 && balancePendingMeters > 0 && (
                    <button
                      type="button"
                      className="btn btn-warning btn-sm px-3 shadow-xs fw-bold d-flex align-items-center gap-1.5"
                      onClick={() => {
                        handleAutoFulfillBalance();
                        setShowStockPickerModal(false);
                      }}
                    >
                      <i className="ti ti-bolt fs-14"></i>
                      <span>⚡ Auto-Fulfill Balance ({balancePendingMeters.toFixed(1)}m)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Controls Bar */}
              <div className="p-3 px-4 bg-white border-bottom">
                <div className="row g-2 align-items-center">
                  <div className="col-12 col-md-3">
                    <label className="form-label fs-11 text-secondary mb-1 fw-semibold">Filter by Vendor</label>
                    <select
                      className="form-select form-select-sm fs-12"
                      value={modalVendorFilter}
                      onChange={(e) => setModalVendorFilter(e.target.value)}
                    >
                      {['All', ...new Set(warehouseStockPool.map(w => w.vendorName).filter(Boolean))].map(v => (
                        <option key={v} value={v}>{v === 'All' ? 'All Inward Vendors' : v}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fs-11 text-secondary mb-1 fw-semibold">Filter by Purchase Invoice</label>
                    <select
                      className="form-select form-select-sm fs-12 font-monospace"
                      value={modalInvoiceFilter}
                      onChange={(e) => setModalInvoiceFilter(e.target.value)}
                    >
                      {['All', ...new Set(warehouseStockPool.map(w => w.invoiceNo).filter(Boolean))].map(inv => (
                        <option key={inv} value={inv}>{inv === 'All' ? 'All Invoices' : inv}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fs-11 text-secondary mb-1 fw-semibold">Search Bales / Fabric Quality</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light text-muted border-end-0">
                        <i className="ti ti-search fs-13"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control form-control-sm border-start-0 fs-12"
                        placeholder="Search Bale 1-9, Mega Bale, Invoice, Fabric..."
                        value={modalSearchTerm}
                        onChange={(e) => setModalSearchTerm(e.target.value)}
                      />
                      {modalSearchTerm && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setModalSearchTerm('')}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body p-4" style={{ background: '#f8fafc' }}>
                <div className="table-responsive bg-white border rounded shadow-xs">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '12.5px' }}>
                    <thead className="table-light">
                      <tr className="text-secondary fs-11 fw-bold text-uppercase">
                        <th style={{ width: '40px' }} className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={
                              modalSelectedBaleIds.length > 0 &&
                              warehouseStockPool.filter(w => (w.availableMeters !== undefined ? w.availableMeters : w.meters) > 0)
                                .every(w => modalSelectedBaleIds.includes(w.id))
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                const activeIds = warehouseStockPool
                                  .filter(w => (w.availableMeters !== undefined ? w.availableMeters : w.meters) > 0)
                                  .map(w => w.id);
                                setModalSelectedBaleIds(activeIds);
                              } else {
                                setModalSelectedBaleIds([]);
                              }
                            }}
                          />
                        </th>
                        <th style={{ width: '130px' }}>Priority (FIFO)</th>
                        <th style={{ minWidth: '180px' }}>Bale / Roll No &amp; Structure</th>
                        <th style={{ minWidth: '160px' }}>Vendor &amp; Invoice Ref</th>
                        <th style={{ minWidth: '140px' }}>Fabric &amp; Shade</th>
                        <th style={{ width: '85px' }} className="text-center">Folding</th>
                        <th style={{ width: '120px' }} className="text-end">Available (M)</th>
                        <th style={{ minWidth: '240px' }} className="text-center">Dispatch Allocation Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warehouseStockPool
                        .filter(roll => {
                          const avail = roll.availableMeters !== undefined ? roll.availableMeters : roll.meters;
                          if (avail <= 0) return false;
                          if (modalVendorFilter !== 'All' && roll.vendorName !== modalVendorFilter) return false;
                          if (modalInvoiceFilter !== 'All' && roll.invoiceNo !== modalInvoiceFilter) return false;
                          if (modalSearchTerm.trim()) {
                            const q = modalSearchTerm.toLowerCase();
                            const match = String(roll.baleNo || '').toLowerCase().includes(q) ||
                                          String(roll.invoiceNo || '').toLowerCase().includes(q) ||
                                          String(roll.fabric || '').toLowerCase().includes(q) ||
                                          String(roll.vendorName || '').toLowerCase().includes(q);
                            if (!match) return false;
                          }
                          return true;
                        })
                        .map((roll, idx) => {
                          const avail = roll.availableMeters !== undefined ? roll.availableMeters : roll.meters;
                          const isSelected = modalSelectedBaleIds.includes(roll.id);
                          const foldCode = roll.folding || foldingNotation || 'L100';
                          const actualMetersAtFold = computeFoldedMeters(avail, foldCode);
                          const customVal = customCutInputs[roll.id] || '';

                          return (
                            <tr key={roll.id || idx} className={isSelected ? 'table-primary-subtle' : ''}>
                              {/* Checkbox for Multi-Select */}
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setModalSelectedBaleIds(prev => [...prev, roll.id]);
                                    } else {
                                      setModalSelectedBaleIds(prev => prev.filter(id => id !== roll.id));
                                    }
                                  }}
                                />
                              </td>

                              {/* FIFO Priority */}
                              <td>
                                <span className={`badge ${roll.ageDays > 60 ? 'bg-danger-subtle text-danger border-danger-subtle' : 'bg-primary-subtle text-primary border-primary-subtle'} border fs-10`}>
                                  FIFO #{idx + 1} • {roll.ageDays}d old
                                </span>
                              </td>

                              {/* Bale No & Details */}
                              <td>
                                <div className="fw-bold font-monospace text-dark fs-13">{roll.baleNo}</div>
                                {roll.subRolls && (
                                  <div className="text-muted fs-11 mt-0.5">
                                    <i className="ti ti-layers-intersect fs-11 me-1 text-secondary"></i>
                                    {roll.subRolls}
                                  </div>
                                )}
                              </td>

                              {/* Vendor & Invoice */}
                              <td>
                                <div className="fw-semibold text-dark fs-12">{roll.vendorName || 'Warehouse Stock'}</div>
                                <div className="font-monospace text-muted fs-11">{roll.invoiceNo}</div>
                              </td>

                              {/* Fabric & Color */}
                              <td>
                                <div className="text-dark fw-medium fs-12">{roll.fabric}</div>
                                <div className="text-muted fs-11">{roll.color}</div>
                              </td>

                              {/* Folding Notation */}
                              <td className="text-center">
                                <span className={`badge ${foldCode.includes('98') ? 'bg-info-subtle text-info-emphasis border border-info-subtle' : 'bg-light text-secondary border'} fs-11 font-monospace`}>
                                  {foldCode}
                                </span>
                              </td>

                              {/* Available Meters */}
                              <td className="text-end">
                                <div className="fw-bold text-success fs-13 font-monospace">{avail.toFixed(2)} m</div>
                                {foldCode.includes('98') && (
                                  <div className="text-muted fs-10">(= {actualMetersAtFold.toFixed(2)}m @ 98%)</div>
                                )}
                              </td>

                              {/* Allocation Actions */}
                              <td>
                                <div className="d-flex flex-column gap-1.5">
                                  <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                    {/* Action 1: Scenario A - Full Bale */}
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary btn-xs py-1 px-2 rounded shadow-xs fw-semibold"
                                      onClick={() => handleSelectWarehouseRoll(roll)}
                                      title="Allocate entire bale (Scenario A)"
                                    >
                                      + Full Bale ({avail}m)
                                    </button>

                                    {/* Action 2: Scenario B - Cut Needed to hit 100% */}
                                    {balancePendingMeters > 0 && avail >= balancePendingMeters && (
                                      <button
                                        type="button"
                                        className="btn btn-outline-warning btn-xs py-1 px-2 rounded shadow-xs fw-bold"
                                        onClick={() => handleSelectWarehouseRoll(roll, balancePendingMeters)}
                                        title={`Cut exactly remaining ${balancePendingMeters}m from this bale (Scenario B)`}
                                      >
                                        ✂ Cut Needed ({balancePendingMeters}m)
                                      </button>
                                    )}
                                  </div>

                                  {/* Action 3: Custom Partial Cut Input */}
                                  <div className="d-flex align-items-center gap-1">
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="form-control form-control-xs py-0.5 px-1.5 fs-11 font-monospace"
                                      style={{ width: '85px', height: '26px' }}
                                      placeholder="Cut mtrs..."
                                      value={customVal}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCustomCutInputs(prev => ({ ...prev, [roll.id]: val }));
                                      }}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-light border btn-xs py-0.5 px-2 text-dark fs-11 rounded"
                                      style={{ height: '26px' }}
                                      disabled={!customVal || parseFloat(customVal) <= 0 || parseFloat(customVal) > avail}
                                      onClick={() => {
                                        handleSelectWarehouseRoll(roll, parseFloat(customVal));
                                        setCustomCutInputs(prev => ({ ...prev, [roll.id]: '' }));
                                      }}
                                    >
                                      Cut &amp; Add
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer bg-white border-top py-2.5 px-4 d-flex justify-content-between align-items-center">
                <div className="text-muted fs-12">
                  <span>Selected for Dispatch: <strong>{modalSelectedBaleIds.length} Bales</strong></span>
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-light btn-sm border" onClick={() => setShowStockPickerModal(false)}>
                    Close
                  </button>
                  {modalSelectedBaleIds.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm px-3 shadow-xs"
                      onClick={handleAllocateMultiBales}
                    >
                      Allocate Selected Bales →
                    </button>
                  )}
                </div>
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
                  Select an existing Process PO or auto-generate a new one to link to this Challan. Once linked, the red <strong>"Pending PO Link"</strong> alert will be resolved.
                </p>
                <div className="mb-3">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                    onClick={() => {
                      handleAutoGenerateAndLinkPO();
                      setShowLinkPOModal(false);
                      alert(`New Process PO auto-generated and linked to Challan #${challanNumber}!`);
                    }}
                  >
                    <i className="ti ti-plus fs-13"></i>
                    <span>Auto-Generate New Process PO &amp; Link</span>
                  </button>
                </div>
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
