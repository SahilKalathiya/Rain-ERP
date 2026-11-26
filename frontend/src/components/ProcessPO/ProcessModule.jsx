import React, { useState, useEffect } from 'react';
import {
  getStoredProcessPOs, saveStoredProcessPOs,
  getStoredProcessChallans, saveStoredProcessChallans,
  getStoredProcessReturns, saveStoredProcessReturns,
  getStoredOpenBales, saveStoredOpenBales,
  getStoredProcessQCRecords, saveStoredProcessQCRecords
} from '../../data/processData';

import ProcessPOList from './ProcessPOList';
import ProcessPOForm from './ProcessPOForm';
import ProcessChallanList from './ProcessChallanList';
import ProcessChallanForm from './ProcessChallanForm';
import ProcessReturnList from './ProcessReturnList';
import ProcessReturnForm from './ProcessReturnForm';
import ProcessQCView from './ProcessQCView';
import ProcessTrackingDashboard from './ProcessTrackingDashboard';
import ProcessPrintModal from './ProcessPrintModal';

/**
 * ProcessModule - Main Container for Module 3: Process PO & Job Work Procurement
 * Controlled directly by Sidebar Navigation without redundant secondary tabs
 */
export default function ProcessModule({ initialTab = 'pos', currentRoute = '/process-po', onNavigate }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'pos' | 'challans' | 'returns' | 'qc' | 'tracking'

  // Stored Data State
  const [pos, setPos] = useState(getStoredProcessPOs);
  const [challans, setChallans] = useState(getStoredProcessChallans);
  const [returns, setReturns] = useState(getStoredProcessReturns);
  const [openBales, setOpenBales] = useState(getStoredOpenBales);
  const [qcRecords, setQcRecords] = useState(getStoredProcessQCRecords);

  // Sub-view states for creation / editing
  const [showPOForm, setShowPOForm] = useState(false);
  const [editingPO, setEditingPO] = useState(null);

  const [showChallanForm, setShowChallanForm] = useState(false);
  const [editingChallan, setEditingChallan] = useState(null);

  const [showReturnForm, setShowReturnForm] = useState(false);
  const [editingReturn, setEditingReturn] = useState(null);
  const [qcTargetReturn, setQcTargetReturn] = useState(null);

  // Print Modal state
  const [printModalConfig, setPrintModalConfig] = useState(null); // { type: 'PO' | 'CHALLAN', data }

  const lastRouteRef = React.useRef(currentRoute);

  // Sync activeTab only when route changes from an external sidebar link click
  useEffect(() => {
    if (lastRouteRef.current !== currentRoute) {
      lastRouteRef.current = currentRoute;
      if (initialTab) {
        setActiveTab(initialTab);
        setShowPOForm(false);
        setEditingPO(null);
        setShowChallanForm(false);
        setEditingChallan(null);
        setShowReturnForm(false);
        setEditingReturn(null);
      }
    }
  }, [initialTab, currentRoute]);

  // 1. Process PO Handlers
  const handleSavePO = (poData, andCreateChallan = false) => {
    let updated;
    const existingIndex = pos.findIndex(p => p.id === poData.id);
    if (existingIndex >= 0) {
      updated = [...pos];
      updated[existingIndex] = poData;
    } else {
      updated = [poData, ...pos];
    }
    setPos(updated);
    saveStoredProcessPOs(updated);
    setShowPOForm(false);
    setEditingPO(null);

    // If requested, immediately open Process Challan dispatch form for this PO
    if (andCreateChallan) {
      handleCreateChallanFromPO(poData);
    }
  };

  const handleViewPO = (po) => {
    setEditingPO(po);
    setShowPOForm(true);
  };

  const handleIssuePO = (po) => {
    const updated = pos.map(p =>
      (p.id === po.id || p.po_number === po.po_number)
        ? { ...p, status: 'Issued' }
        : p
    );
    setPos(updated);
    saveStoredProcessPOs(updated);
  };

  const handlePrintPO = (po) => {
    setPrintModalConfig({ type: 'PO', data: po });
  };

  const handleCreateChallanFromPO = (po) => {
    const poNum = po.po_number || String(po.id).replace(/\D/g, '') || '';
    const poRef = po.id || (poNum ? `PPO-${poNum}` : '');

    const generatedChallan = {
      id: null,
      challan_number: '',
      date: new Date().toISOString().split('T')[0],
      vendor_id: po.vendor_id || '',
      vendor_name: po.vendor_name || '',
      linked_pos: [po.po_number || po.id].filter(Boolean),
      styles_info: po.style_names || [],
      customer_brand: po.customer_brand_name || po.customer_brand || '',
      po_link_status: 'Linked',
      admin_alert_triggered: false,
      folding_notation: '',
      total_bales: 0,
      total_pieces: 0,
      grand_total_meters: 0,
      remarks: `Dispatch Challan for PO #${poNum}`,
      receiver_signature: '',
      company_representative: 'Saksham Garg',
      status: 'Draft',
      created_by: 'Saksham Garg',
      created_at: new Date().toISOString(),
      items: [],
      is_draft: true
    };

    // Open Challan creation form pre-filled with PO data (do not save prematurely)
    setEditingChallan(generatedChallan);
    setActiveTab('challans');
    setShowChallanForm(true);
    lastRouteRef.current = '/process-challan';
    if (onNavigate) onNavigate('/process-challan');
  };

  // 2. Process Challan Handlers
  const handleSaveChallan = (challanData, andRecordReturn = false) => {
    const toSave = {
      ...challanData,
      is_draft: false,
      status: andRecordReturn ? 'Inwarded' : (challanData.status === 'Draft' ? 'Dispatched' : (challanData.status || 'Dispatched')),
      is_locked: andRecordReturn ? true : Boolean(challanData.is_locked)
    };

    let updated;
    const existingIndex = challans.findIndex(c => c.id === toSave.id);
    if (existingIndex >= 0) {
      updated = [...challans];
      updated[existingIndex] = toSave;
    } else {
      updated = [toSave, ...challans];
    }
    setChallans(updated);
    saveStoredProcessChallans(updated);

    // Update status of linked PO(s) to 'Sent to Vendor' (Section 4.2)
    if (toSave.linked_pos && toSave.linked_pos.length > 0) {
      const updatedPOs = pos.map(p => {
        if (toSave.linked_pos.includes(p.id) || toSave.linked_pos.includes(p.po_number) || toSave.linked_pos.includes(`PPO-${p.po_number}`)) {
          return { ...p, is_locked: true, status: 'Sent to Vendor' };
        }
        return p;
      });
      setPos(updatedPOs);
      saveStoredProcessPOs(updatedPOs);
    }

    setShowChallanForm(false);
    setEditingChallan(null);
    setActiveTab('challans');

    // If requested explicitly, transition to Record Inward Return
    if (andRecordReturn) {
      handleRecordReturnFromChallan(toSave);
    }
  };

  const handlePrintChallan = (challan) => {
    setPrintModalConfig({ type: 'CHALLAN', data: challan });
  };

  const handleRecordReturnFromChallan = (challan) => {
    // 1. Lock this Challan as workflow has advanced to Inbound GRN
    const updatedChallans = challans.map(c =>
      (c.id === challan.id || c.challan_number === challan.challan_number)
        ? { ...c, is_locked: true, status: 'Inwarded' }
        : c
    );
    setChallans(updatedChallans);
    saveStoredProcessChallans(updatedChallans);

    setEditingReturn({
      vendor_id: challan.vendor_id || '',
      vendor_name: challan.vendor_name || '',
      linked_challan_id: challan.challan_number || challan.id,
      linked_challan_ids: [challan.challan_number || challan.id].filter(Boolean),
      linked_po_id: challan.linked_pos?.[0] || '',
      linked_po_ids: Array.isArray(challan.linked_pos) ? challan.linked_pos : [],
      fabric_quality: challan.items?.[0]?.fabric_name || '',
      width: challan.items?.[0]?.width || '',
      folding_standard: challan.folding_notation || '',
      vendor_declared_meters: '',
      vendor_declared_pieces: '',
      pieces: []
    });
    setActiveTab('returns');
    setShowReturnForm(true);
    lastRouteRef.current = '/process-return';
    if (onNavigate) onNavigate('/process-return');
  };

  // 3. Process Return Handlers
  const handleSaveReturn = (returnData, andInspectQC = false) => {
    let updated;
    const existingIndex = returns.findIndex(r => r.id === returnData.id);
    if (existingIndex >= 0) {
      updated = [...returns];
      updated[existingIndex] = returnData;
    } else {
      updated = [returnData, ...returns];
    }
    setReturns(updated);
    saveStoredProcessReturns(updated);

    // Also lock linked Challan
    if (returnData.linked_challan_id) {
      setChallans(prevChallans => {
        const updatedChallans = prevChallans.map(c =>
          (c.challan_number === returnData.linked_challan_id || c.id === returnData.linked_challan_id)
            ? { ...c, is_locked: true, status: 'Inwarded' }
            : c
        );
        saveStoredProcessChallans(updatedChallans);
        return updatedChallans;
      });
    }

    // If grey fabric returned, create an Open Bale (Section 5.3)
    if (returnData.grey_fabric_returned_meters > 0) {
      const targetInv = returnData.target_invoice_for_grey || 'INV-MS-0091';
      const newOpenBale = {
        id: `OB-${Date.now().toString().slice(-4)}`,
        return_id: returnData.id,
        fabric_id: 'FAB-001',
        fabric_name: returnData.fabric_quality || 'Grey',
        width: returnData.width || '',
        color: 'Grey',
        original_vendor_invoice_ref: targetInv,
        returned_meters: returnData.grey_fabric_returned_meters,
        remaining_meters: returnData.grey_fabric_returned_meters,
        audit_trail: [
          { date: returnData.received_date, action: `Logged from Inward Return ${returnData.vendor_external_challan_no} (${targetInv})` }
        ],
        status: 'Available',
        created_at: new Date().toISOString()
      };
      const updatedBales = [newOpenBale, ...openBales];
      setOpenBales(updatedBales);
      saveStoredOpenBales(updatedBales);
    }

    setShowReturnForm(false);
    setEditingReturn(null);
    if (andInspectQC) {
      setQcTargetReturn(returnData);
      setActiveTab('qc');
      lastRouteRef.current = '/process-qc';
      if (onNavigate) onNavigate('/process-qc');
    } else {
      setActiveTab('returns');
    }
  };

  // 4. QC Handlers
  const handleSaveQC = (qcData) => {
    const existingIndex = qcRecords.findIndex(q => q.id === qcData.id);
    const updated = existingIndex >= 0
      ? qcRecords.map((q, idx) => (idx === existingIndex ? qcData : q))
      : [qcData, ...qcRecords];
    setQcRecords(updated);
    saveStoredProcessQCRecords(updated);

    const linkedReturn = returns.find(r => r.id === qcData.return_id);
    const linkedPO = linkedReturn
      ? pos.find(p => (linkedReturn.linked_pos || []).includes(p.id) || (linkedReturn.linked_pos || []).includes(p.po_number))
      : null;

    if (linkedReturn) {
      const pieceStatus = qcData.qc_outcome === 'Accepted'
        ? 'Accepted'
        : qcData.rejection_action === 'Reprocess'
          ? 'Rejected - Reprocess'
          : 'Rejected - Scrap';
      const updatedReturns = returns.map(r => {
        if (r.id !== linkedReturn.id) return r;
        const updatedPieces = (r.pieces || []).map(p =>
          Number(p.piece_no) === Number(qcData.piece_no)
            ? { ...p, qc_status: pieceStatus }
            : p
        );
        return { ...r, pieces: updatedPieces };
      });
      setReturns(updatedReturns);
      saveStoredProcessReturns(updatedReturns);
    }

    // Section 6.2 A: If Reprocess chosen, automatically generate a Reprocess Job Work Challan with No New Payment
    if (qcData.rejection_action === 'Reprocess') {
      const repChNo = `${Math.floor(4900 + Math.random() * 99)}-REPROC`;
      const vendorId = linkedReturn?.vendor_id || linkedPO?.vendor_id || '';
      const vendorName = linkedReturn?.vendor_name || linkedPO?.vendor_name || 'Job Worker';
      const linkedPos = linkedReturn?.linked_pos?.length
        ? linkedReturn.linked_pos
        : (linkedPO ? [linkedPO.po_number || linkedPO.id] : []);
      const styleNames = linkedPO?.style_name
        ? [linkedPO.style_name]
        : (linkedPO?.items?.map(i => i.style_name).filter(Boolean) || []);
      const matchingPiece = (linkedReturn?.pieces || []).find(p => Number(p.piece_no) === Number(qcData.piece_no));
      const fabricName = qcData.fabric_name || matchingPiece?.fabric_name || linkedReturn?.fabric_quality || linkedPO?.items?.[0]?.fabric_name || 'Fabric';
      const colorName = qcData.color_name || matchingPiece?.color_name || linkedPO?.items?.[0]?.color_name || '';
      const pieceLength = parseFloat(qcData.original_length) || parseFloat(matchingPiece?.meters) || 0;

      const reprocessChallan = {
        id: `PCH-${repChNo}`,
        challan_number: `CH-${repChNo}`,
        date: new Date().toISOString().split('T')[0],
        vendor_id: vendorId,
        vendor_name: vendorName,
        linked_pos: linkedPos,
        styles_info: styleNames,
        po_link_status: 'Reprocess In Loop',
        admin_alert_triggered: false,
        folding_notation: matchingPiece?.folding || '',
        total_bales: 1,
        total_pieces: 1,
        grand_total_meters: pieceLength,
        remarks: `Reprocessing Rectification Challan for Than #${qcData.piece_no} (${qcData.return_id || 'QC'}). No new payment obligation.`,
        receiver_signature: `${vendorName} Rep`,
        company_representative: 'Anurag',
        status: 'In Reprocess Loop',
        created_by: 'Saksham Garg',
        created_at: new Date().toISOString(),
        items: [
          {
            id: Date.now(),
            bale_roll_no: `Than #${qcData.piece_no} (Reprocess)`,
            fabric_name: fabricName,
            color_name: colorName,
            invoice_no: linkedReturn?.vendor_external_challan_no || qcData.return_id || '',
            original_piece_meters: pieceLength,
            dispatched_meters: pieceLength,
            is_partial_cut: false,
            folding: matchingPiece?.folding || ''
          }
        ]
      };
      const updatedChallans = [reprocessChallan, ...challans];
      setChallans(updatedChallans);
      saveStoredProcessChallans(updatedChallans);
      alert(`QC Rejection saved! Reprocess Challan #${reprocessChallan.challan_number} generated for ${vendorName} with zero new payment obligation. Item is flagged In Loop.`);
    } else {
      alert('QC Record saved successfully! Cutting-Room planning & Stock ledger updated.');
    }
  };

  return (
    <div className="container-fluid py-3 px-4">
      {/* Clean Page Header matching active sidebar selection */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">
            <i className="ti ti-building-factory-2 me-2 text-primary"></i>
            {activeTab === 'pos' && 'Purchase Orders (Processing)'}
            {activeTab === 'challans' && 'Challans (Fabric Dispatch to Vendor)'}
            {activeTab === 'returns' && 'Vendor Returns (Inbound Processing GRN)'}
            {activeTab === 'qc' && 'Quality Control & Lot Splitting'}
            {activeTab === 'tracking' && 'Live Tracking & Open Bales Pool'}
          </h4>
          <p className="text-muted small mb-0">
            {activeTab === 'pos' && 'Issue new dyeing & processing purchase orders or track existing ones'}
            {activeTab === 'challans' && 'Warehouse stock allocation, roll dispatch, FIFO & single batch fulfilment'}
            {activeTab === 'returns' && 'Piece-wise meterage receipt, validation against vendor summary & grey fabric returns'}
            {activeTab === 'qc' && 'Inspection branching: Accepted (Piece/Lot Division) vs Full Rejection (Reprocess/Scrap)'}
            {activeTab === 'tracking' && 'Live running calculation: Required vs Sent vs Received vs Pending per Order'}
          </p>
        </div>
      </div>

      {/* Content Rendering */}
      {activeTab === 'pos' && (
        showPOForm ? (
          <ProcessPOForm
            initialPO={editingPO}
            onSave={handleSavePO}
            onCancel={() => {
              setShowPOForm(false);
              setEditingPO(null);
            }}
            onBack={() => {
              setShowPOForm(false);
              setEditingPO(null);
            }}
            onCreateChallan={handleCreateChallanFromPO}
            onPrintPO={handlePrintPO}
            readOnlyDefault={Boolean(editingPO)}
            challans={challans}
          />
        ) : (
          <ProcessPOList
            pos={pos}
            onNewPO={() => {
              setEditingPO(null);
              setShowPOForm(true);
            }}
            onViewPO={handleViewPO}
            onPrintPO={handlePrintPO}
            onIssuePO={handleIssuePO}
            onCreateChallanFromPO={handleCreateChallanFromPO}
            challans={challans}
          />
        )
      )}

      {activeTab === 'challans' && (
        showChallanForm ? (
          <ProcessChallanForm
            availablePOs={pos.filter(p => p.status !== 'Draft')}
            initialChallan={editingChallan}
            onSave={handleSaveChallan}
            onRecordReturn={handleRecordReturnFromChallan}
            onPrintChallan={handlePrintChallan}
            onCancel={() => {
              setShowChallanForm(false);
              setEditingChallan(null);
            }}
            returns={returns}
          />
        ) : (
          <ProcessChallanList
            challans={challans}
            onNewChallan={() => {
              setEditingChallan(null);
              setShowChallanForm(true);
            }}
            onEditChallan={(challan) => {
              setEditingChallan(challan);
              setShowChallanForm(true);
            }}
            onPrintChallan={handlePrintChallan}
            onRecordReturnFromChallan={handleRecordReturnFromChallan}
            returns={returns}
          />
        )
      )}

      {activeTab === 'returns' && (
        showReturnForm ? (
          <ProcessReturnForm
            availablePOs={pos}
            availableChallans={challans}
            initialReturn={editingReturn}
            onSave={handleSaveReturn}
            onCancel={() => {
              setShowReturnForm(false);
              setEditingReturn(null);
            }}
            qcRecords={qcRecords}
          />
        ) : (
          <ProcessReturnList
            returns={returns}
            onNewReturn={() => {
              setEditingReturn(null);
              setShowReturnForm(true);
            }}
            onEditReturn={(record) => {
              setEditingReturn(record);
              setShowReturnForm(true);
            }}
            onInspectInQC={(record) => {
              setQcTargetReturn(record);
              setActiveTab('qc');
              lastRouteRef.current = '/process-qc';
              if (onNavigate) onNavigate('/process-qc');
            }}
            qcRecords={qcRecords}
          />
        )
      )}

      {activeTab === 'qc' && (
        <ProcessQCView
          qcRecords={qcRecords}
          onSaveQC={handleSaveQC}
          initialReturnToInspect={qcTargetReturn}
          onClearInitialReturn={() => setQcTargetReturn(null)}
        />
      )}

      {activeTab === 'tracking' && (
        <ProcessTrackingDashboard
          pos={pos}
          challans={challans}
          returns={returns}
          openBales={openBales}
        />
      )}

      {/* Reusable Print Slip Modal */}
      {printModalConfig && (
        <ProcessPrintModal
          type={printModalConfig.type}
          data={printModalConfig.data}
          onClose={() => setPrintModalConfig(null)}
        />
      )}
    </div>
  );
}
