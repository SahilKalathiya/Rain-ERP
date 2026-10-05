import React, { useState, useEffect } from 'react';

// Submodules
import GlobalERPOverviewDashboard from './GlobalERPOverviewDashboard';
import PurchaseOrderList from './PurchaseOrderList';
import PurchaseOrderForm from './PurchaseOrderForm';
import PurchaseOrderInvoicePrint from './PurchaseOrderInvoicePrint';
import GRNList from './GRNList';
import GRNForm from './GRNForm';
import QualityCheckList from './QualityCheckList';
import QualityCheckForm from './QualityCheckForm';
import RejectedStockPool from './RejectedStockPool';
import VendorMasterView from './VendorMasterView';
import FabricMasterView from './FabricMasterView';
import TransporterMasterView from './TransporterMasterView';
import ActivityHistoryModal from './ActivityHistoryModal';

// Seed Data
import {
  initialVendors,
  initialFabrics,
  initialTransporters,
  initialPurchaseOrders,
  initialGRNs,
  initialQualityChecks,
  initialRejectedStock,
  initialAuditLogs
} from '../../data/procurementData';

/**
 * ProcurementDashboard - Master Module 1 (Raw Material Procurement)
 * Unites:
 *   - Global Search across all records (9.1)
 *   - POs with buffer calculation & invoice-style print
 *   - GRN with 3-level hierarchical entry & mismatch checks
 *   - QC with 3-way outcomes & inspection photos
 *   - Rejected Stock Pool with RTV / Scrap / Stock transfer
 *   - Master catalogs (Vendors, Fabrics, Transporters)
 *   - Runtime Activity History audit logging (9.4)
 */
export default function ProcurementDashboard({ initialSubmodule = 'overview' }) {
  // Tabs: 'overview', 'pos', 'grn', 'qc', 'rejected_stock', 'vendors', 'fabrics', 'transporters'
  const [activeTab, setActiveTab] = useState(initialSubmodule);

  // Sync active tab whenever sidebar navigation route changes
  useEffect(() => {
    setActiveTab(initialSubmodule);
    if (initialSubmodule === 'pos') setActivePoView('list');
    if (initialSubmodule === 'grn') setActiveGrnView('list');
    if (initialSubmodule === 'qc') setActiveQcView('list');
  }, [initialSubmodule]);

  // Subviews
  const [activePoView, setActivePoView] = useState('list'); // 'list', 'form', 'print'
  const [selectedPO, setSelectedPO] = useState(null);

  const [activeGrnView, setActiveGrnView] = useState('list'); // 'list', 'form'
  const [selectedGRN, setSelectedGRN] = useState(null);

  const [activeQcView, setActiveQcView] = useState('list'); // 'list', 'form'
  const [selectedQC, setSelectedQC] = useState(null);

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // 1. Vendors State
  const [vendors, setVendors] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_vendors_v1');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return initialVendors;
  });

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_vendors_v1', JSON.stringify(vendors));
    } catch (e) {}
  }, [vendors]);

  // 2. Fabrics State
  const [fabrics, setFabrics] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_fabrics_v1');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return initialFabrics;
  });

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_fabrics_v1', JSON.stringify(fabrics));
    } catch (e) {}
  }, [fabrics]);

  // 3. Transporters State
  const [transporters, setTransporters] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_transporters_v1');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return initialTransporters;
  });

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_transporters_v1', JSON.stringify(transporters));
    } catch (e) {}
  }, [transporters]);

  // 4. Purchase Orders State
  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_pos_v1');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return initialPurchaseOrders;
  });

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_pos_v1', JSON.stringify(purchaseOrders));
    } catch (e) {}
  }, [purchaseOrders]);

  // 5. GRNs State
  const [grns, setGrns] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_grns_v1');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return initialGRNs;
  });

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_grns_v1', JSON.stringify(grns));
    } catch (e) {}
  }, [grns]);

  // 6. Quality Checks State
  const [qualityChecks, setQualityChecks] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_qcs_v1');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return initialQualityChecks;
  });

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_qcs_v1', JSON.stringify(qualityChecks));
    } catch (e) {}
  }, [qualityChecks]);

  // 7. Rejected Stock State
  const [rejectedStock, setRejectedStock] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_rejected_stock_v1');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return initialRejectedStock;
  });

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_rejected_stock_v1', JSON.stringify(rejectedStock));
    } catch (e) {}
  }, [rejectedStock]);

  // 8. Audit Logs State
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_audit_logs_v1');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return initialAuditLogs;
  });

  const addAuditLog = (action, module, recordNo, field, prevVal, nextVal, remarks = '') => {
    const newLog = {
      id: `LOG-${Date.now()}`,
      dateTime: new Date().toLocaleString('en-GB'),
      user: 'Saksham Garg',
      role: 'Procurement Admin',
      action,
      module,
      recordNo,
      field,
      previousValue: String(prevVal),
      updatedValue: String(nextVal),
      remarks
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Handlers
  const handleSavePO = (poData) => {
    const isEdit = purchaseOrders.some((p) => p.id === poData.id);
    if (isEdit) {
      setPurchaseOrders((prev) => prev.map((p) => (p.id === poData.id ? poData : p)));
      addAuditLog('Update', 'Purchase Order', poData.id, 'PO Details', 'Previous State', 'Updated State');
    } else {
      setPurchaseOrders((prev) => [poData, ...prev]);
      addAuditLog('Create', 'Purchase Order', poData.id, 'PO Creation', 'None', `${poData.id} (${poData.totalAmount})`);
    }
    setSelectedPO(poData);
    setActivePoView('list');
  };

  const handleSaveGRN = (grnData, isCompleted = true) => {
    const isEdit = grns.some((g) => g.id === grnData.id);
    let updated;
    if (isEdit) {
      updated = grns.map((g) => (g.id === grnData.id ? grnData : g));
      addAuditLog('Update', 'GRN', grnData.id, 'GRN Progress', 'Draft', grnData.status);
    } else {
      updated = [grnData, ...grns];
      addAuditLog('Create', 'GRN', grnData.id, 'Inward Delivery', 'None', `${grnData.id} (${grnData.totalMetersEntered}m)`);
    }
    setGrns(updated);

    // If completed, automatically generate QC record (6.2 rule: "A QC record is generated automatically the moment a GRN is processed")
    if (isCompleted && grnData.status === 'Completed') {
      const newQC = {
        id: `QC-${String(Math.floor(1000 + Math.random() * 9000))}`,
        grnRef: grnData.id,
        inspectionScope: 'Whole Shipment',
        baleRef: '',
        pieceRef: '',
        inspectorName: 'Saksham Garg',
        expectedWidth: '44',
        actualWidth: 44.0,
        expectedFold: '97',
        actualFold: 97.0,
        photos: [],
        notes: `Automatic QC generated on completion of GRN ${grnData.id}`,
        qcStatus: 'OK',
        adminDecision: '',
        adminRemarks: '',
        dateTime: new Date().toLocaleString('en-GB'),
        createdBy: 'System QC Agent'
      };
      setQualityChecks((prev) => [newQC, ...prev]);
      addAuditLog('Create', 'Quality Check', newQC.id, 'Auto QC Record', 'None', `Generated from ${grnData.id}`);
    }

    setActiveGrnView('list');
  };

  const handleSaveQC = (qcData) => {
    const isEdit = qualityChecks.some((q) => q.id === qcData.id);
    if (isEdit) {
      setQualityChecks((prev) => prev.map((q) => (q.id === qcData.id ? qcData : q)));
    } else {
      setQualityChecks((prev) => [qcData, ...prev]);
    }

    addAuditLog('Update', 'Quality Check', qcData.id, 'QC Status', 'Pending', qcData.qcStatus);

    // If Rejected, auto-move to Rejected Stock Pool (7.2 rule!)
    if (qcData.qcStatus === 'Reject') {
      const newRej = {
        id: `REJ-${String(Math.floor(1000 + Math.random() * 9000))}`,
        sourceQcRef: qcData.id,
        grnRef: qcData.grnRef,
        poRef: 'PO-0001',
        vendorName: 'M.S. Textiles',
        baleRef: qcData.baleRef || 'Bale 01',
        pieceRef: qcData.pieceRef || 'Piece 01',
        fabricName: 'Grey Cotton Fabrics (100*100)',
        quantity: 104.0,
        reason: qcData.notes || 'Failed quality threshold during inspection.',
        dateFlagged: new Date().toLocaleDateString('en-GB'),
        status: 'In Pool',
        actionDetails: null
      };
      setRejectedStock((prev) => [newRej, ...prev]);
      addAuditLog('Reject', 'Rejected Stock', newRej.id, 'Auto Route to Pool', 'QC Inspection', 'In Pool');
    }

    setActiveQcView('list');
  };

  return (
    <div className="p-4" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <style>{`
        input.no-spinner::-webkit-outer-spin-button,
        input.no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input.no-spinner {
          -moz-appearance: textfield;
        }
      `}</style>
      {/* GLOBAL SEARCH & PORTAL HEADER (9.1) */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2">
            <div
              className="text-white rounded-3 d-flex align-items-center justify-content-center shadow-sm"
              style={{
                width: '42px',
                height: '42px',
                background: 'linear-gradient(135deg, #2e37a4 0%, #4361ee 100%)'
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v12.42a1.78 1.78 0 0 0 2.5 1.55L16.5 14.6a1.78 1.78 0 0 0 0-3.2z"></path>
                <path d="M21 12h-3"></path>
                <path d="m18 16 3 3"></path>
                <path d="m18 8 3-3"></path>
              </svg>
            </div>
            <div>
              <h4 className="fw-bold mb-0 fs-18" style={{ color: '#1b2559' }}>
                Raw Material Procurement &amp; Inward Management
              </h4>
              <p className="mb-0 fs-12" style={{ color: '#4361ee', fontWeight: 500 }}>
                Masters, PO Buffer Tolerance, 3-Level GRN, Quality Check &amp; Rejected Stock Pool
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Global Search Bar (Section 9.1: Top-Right Corner Static) */}
            <div className="input-group" style={{ width: '300px' }}>
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="ti ti-search fs-14"></i>
              </span>
              <input
                type="text"
                className="form-control form-control-sm bg-light border-start-0 fs-12"
                placeholder="Global Search across ERP..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>

            {/* Audit Trail Launcher (9.4) */}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 rounded-3 px-3 py-1 fs-12"
              onClick={() => setShowAuditModal(true)}
            >
              <i className="ti ti-history fs-15 text-primary"></i>
              <span>Audit Trail ({auditLogs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* RENDER ACTIVE MODULE / SUBMODULE */}
      {/* TAB 0: OVERVIEW DASHBOARD (Synchronized in Real-Time) */}
      {activeTab === 'overview' && (
        <GlobalERPOverviewDashboard
          vendors={vendors}
          fabrics={fabrics}
          transporters={transporters}
          purchaseOrders={purchaseOrders}
          grns={grns}
          qualityChecks={qualityChecks}
          rejectedStock={rejectedStock}
          auditLogs={auditLogs}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'pos') setActivePoView('list');
            if (tab === 'grn') setActiveGrnView('list');
            if (tab === 'qc') setActiveQcView('list');
          }}
          onOpenAuditModal={() => setShowAuditModal(true)}
        />
      )}

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'pos' && (
        <>
          {activePoView === 'list' && (
            <PurchaseOrderList
              purchaseOrders={purchaseOrders}
              onNewPO={() => {
                setSelectedPO(null);
                setActivePoView('form');
              }}
              onSelectPO={(po) => {
                setSelectedPO(po);
                setActivePoView('form');
              }}
              onPrintPO={(po) => {
                setSelectedPO(po);
                setActivePoView('print');
              }}
            />
          )}

          {activePoView === 'form' && (
            <PurchaseOrderForm
              po={selectedPO}
              vendors={vendors}
              fabrics={fabrics}
              onBack={() => setActivePoView('list')}
              onSavePO={handleSavePO}
              onPrintPO={(po) => {
                setSelectedPO(po);
                setActivePoView('print');
              }}
            />
          )}

          {activePoView === 'print' && (
            <PurchaseOrderInvoicePrint po={selectedPO} onBack={() => setActivePoView('form')} />
          )}
        </>
      )}

      {/* TAB 2: GOODS RECEIPT (GRN) */}
      {activeTab === 'grn' && (
        <>
          {activeGrnView === 'list' && (
            <GRNList
              grns={grns}
              onNewGRN={() => {
                setSelectedGRN(null);
                setActiveGrnView('form');
              }}
              onSelectGRN={(g) => {
                setSelectedGRN(g);
                setActiveGrnView('form');
              }}
            />
          )}

          {activeGrnView === 'form' && (
            <GRNForm
              grn={selectedGRN}
              purchaseOrders={purchaseOrders}
              fabrics={fabrics}
              transporters={transporters}
              onBack={() => setActiveGrnView('list')}
              onSaveGRN={handleSaveGRN}
            />
          )}
        </>
      )}

      {/* TAB 3: QUALITY CHECK (QC) */}
      {activeTab === 'qc' && (
        <>
          {activeQcView === 'list' && (
            <QualityCheckList
              qcRecords={qualityChecks}
              onNewQC={() => {
                setSelectedQC(null);
                setActiveQcView('form');
              }}
              onSelectQC={(qc) => {
                setSelectedQC(qc);
                setActiveQcView('form');
              }}
            />
          )}

          {activeQcView === 'form' && (
            <QualityCheckForm
              qc={selectedQC}
              grns={grns}
              onBack={() => setActiveQcView('list')}
              onSaveQC={handleSaveQC}
            />
          )}
        </>
      )}

      {/* TAB 4: REJECTED STOCK POOL */}
      {activeTab === 'rejected_stock' && (
        <RejectedStockPool
          rejectedItems={rejectedStock}
          onUpdateItemStatus={(updatedItems) => setRejectedStock(updatedItems)}
          onRTVChallanGenerated={(ch) =>
            addAuditLog('Create', 'RTV Challan', ch.challanNo, 'Return to Vendor', 'In Pool', 'Dispatched')
          }
          onScrapSaleCompleted={(sale) =>
            addAuditLog('Create', 'Scrap Sale', sale.saleId, 'Scrap Liquidation', 'To Be Sold', `Sold (₹${sale.settlementAmount})`)
          }
          onTransferToStock={(tr) =>
            addAuditLog('Update', 'Stock Ledger', 'Stock Pool', 'Transfer from Rejected', 'Defective', tr.targetGrade)
          }
        />
      )}

      {/* TAB 5: VENDORS */}
      {activeTab === 'vendors' && (
        <VendorMasterView
          vendors={vendors}
          onSaveVendor={(v) => {
            setVendors((prev) => {
              const exists = prev.some((item) => item.id === v.id);
              return exists ? prev.map((item) => (item.id === v.id ? v : item)) : [v, ...prev];
            });
            addAuditLog('Save', 'Vendor Master', v.id, 'Vendor Details', 'Record', v.name);
          }}
        />
      )}

      {/* TAB 6: FABRICS */}
      {activeTab === 'fabrics' && (
        <FabricMasterView
          fabrics={fabrics}
          onSaveFabric={(f) => {
            setFabrics((prev) => {
              const exists = prev.some((item) => item.id === f.id);
              return exists ? prev.map((item) => (item.id === f.id ? f : item)) : [f, ...prev];
            });
            addAuditLog('Save', 'Fabric Master', f.id, 'Fabric Quality', 'Record', f.qualityName);
          }}
        />
      )}

      {/* TAB 7: TRANSPORTERS */}
      {activeTab === 'transporters' && (
        <TransporterMasterView
          transporters={transporters}
          onSaveTransporter={(t) => {
            setTransporters((prev) => {
              const exists = prev.some((item) => item.id === t.id);
              return exists ? prev.map((item) => (item.id === t.id ? t : item)) : [t, ...prev];
            });
            addAuditLog('Save', 'Transporter Master', t.id, 'Logistics Carrier', 'Record', t.name);
          }}
        />
      )}

      {/* MODAL: Global Activity History & Audit Trail (9.4) */}
      {showAuditModal && (
        <ActivityHistoryModal logs={auditLogs} onClose={() => setShowAuditModal(false)} />
      )}
    </div>
  );
}
