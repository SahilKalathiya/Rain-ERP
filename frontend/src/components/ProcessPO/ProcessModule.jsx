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

  // Print Modal state
  const [printModalConfig, setPrintModalConfig] = useState(null); // { type: 'PO' | 'CHALLAN', data }

  // Sync activeTab whenever user clicks a different link in the sidebar
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setShowPOForm(false);
      setEditingPO(null);
      setShowChallanForm(false);
      setEditingChallan(null);
      setShowReturnForm(false);
      setEditingReturn(null);
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

  const handlePrintPO = (po) => {
    setPrintModalConfig({ type: 'PO', data: po });
  };

  const handleCreateChallanFromPO = (po) => {
    setEditingChallan({
      vendor_id: po.vendor_id,
      vendor_name: po.vendor_name,
      linked_pos: [po.id || `PPO-${po.po_number}`],
      customer_brand: po.customer_brand_name || '',
      styles_info: po.style_names || [],
      items: po.items && po.items.length > 0 ? po.items.map((it, idx) => ({
        id: Date.now() + idx,
        bale_roll_no: `Roll-${Math.floor(2000 + Math.random() * 1000)}-${String.fromCharCode(65 + idx)}`,
        fabric_name: it.fabric_name,
        color_name: it.color_name,
        invoice_no: 'INV-MS-0091',
        original_piece_meters: it.quantity_meters,
        dispatched_meters: it.quantity_meters,
        is_partial_cut: false,
        folding: 'L100'
      })) : []
    });
    if (onNavigate) onNavigate('/process-challan');
    else setActiveTab('challans');
    setShowChallanForm(true);
  };

  // 2. Process Challan Handlers
  const handleSaveChallan = (challanData) => {
    let updated;
    const existingIndex = challans.findIndex(c => c.id === challanData.id);
    if (existingIndex >= 0) {
      updated = [...challans];
      updated[existingIndex] = challanData;
    } else {
      updated = [challanData, ...challans];
    }
    setChallans(updated);
    saveStoredProcessChallans(updated);

    // Update status of linked PO(s) to 'Sent to Vendor' (Section 4.2)
    if (challanData.linked_pos && challanData.linked_pos.length > 0) {
      const updatedPOs = pos.map(p => {
        if (challanData.linked_pos.includes(p.id) || challanData.linked_pos.includes(p.po_number) || challanData.linked_pos.includes(`PPO-${p.po_number}`)) {
          return { ...p, status: 'Sent to Vendor' };
        }
        return p;
      });
      setPos(updatedPOs);
      saveStoredProcessPOs(updatedPOs);
    }

    setShowChallanForm(false);
    setEditingChallan(null);
  };

  const handlePrintChallan = (challan) => {
    setPrintModalConfig({ type: 'CHALLAN', data: challan });
  };

  const handleRecordReturnFromChallan = (challan) => {
    setEditingReturn({
      vendor_id: challan.vendor_id,
      vendor_name: challan.vendor_name,
      linked_challan_id: challan.id,
      linked_po_id: challan.linked_pos?.[0] || 'PPO-7611'
    });
    if (onNavigate) onNavigate('/process-return');
    else setActiveTab('returns');
    setShowReturnForm(true);
  };

  // 3. Process Return Handlers
  const handleSaveReturn = (returnData) => {
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

    // If grey fabric returned, create an Open Bale (Section 5.3)
    if (returnData.grey_fabric_returned_meters > 0) {
      const newOpenBale = {
        id: `OB-${Date.now().toString().slice(-4)}`,
        return_id: returnData.id,
        fabric_id: 'FAB-001',
        fabric_name: returnData.fabric_quality,
        original_vendor_invoice_ref: 'INV-MS-0091 (M.S. Textiles - Auto Assigned)',
        returned_meters: returnData.grey_fabric_returned_meters,
        remaining_meters: returnData.grey_fabric_returned_meters,
        audit_trail: [
          { date: returnData.received_date, action: `Logged from Inward Return ${returnData.vendor_external_challan_no}` }
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
    if (onNavigate) onNavigate('/process-qc');
    else setActiveTab('qc'); // Proceed directly to QC
  };

  // 4. QC Handlers
  const handleSaveQC = (qcData) => {
    const updated = [qcData, ...qcRecords];
    setQcRecords(updated);
    saveStoredProcessQCRecords(updated);
    alert('QC Record saved successfully! Cutting-Room planning & Stock ledger updated.');
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
            onCreateChallan={handleCreateChallanFromPO}
            readOnlyDefault={Boolean(editingPO)}
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
            onCreateChallanFromPO={handleCreateChallanFromPO}
          />
        )
      )}

      {activeTab === 'challans' && (
        showChallanForm ? (
          <ProcessChallanForm
            availablePOs={pos}
            initialChallan={editingChallan}
            onSave={handleSaveChallan}
            onCancel={() => {
              setShowChallanForm(false);
              setEditingChallan(null);
            }}
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
              setActiveTab('qc');
            }}
          />
        )
      )}

      {activeTab === 'qc' && (
        <ProcessQCView
          qcRecords={qcRecords}
          onSaveQC={handleSaveQC}
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
