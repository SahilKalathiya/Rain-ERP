import React, { useState, useEffect } from 'react';

// Submodules
import GlobalERPOverviewDashboard from './GlobalERPOverviewDashboard';
import PurchaseOrderList from './PurchaseOrderList';
import PurchaseOrderForm from './PurchaseOrderForm';
import PurchaseOrderInvoicePrint from './PurchaseOrderInvoicePrint';
import GRNList from './GRNList';
import GRNForm from './GRNForm';
import GRNDetailView from './GRNDetailView';
import QualityCheckList from './QualityCheckList';
import QualityCheckForm from './QualityCheckForm';
import QCDetailView from './QCDetailView';
import DamagedItemDetailView from './DamagedItemDetailView';
import StockPoolView from './StockPoolView';
import RejectedStockPool from './RejectedStockPool';
import VendorMasterView from './VendorMasterView';
import FabricMasterView from './FabricMasterView';
import ColorMasterView from './ColorMasterView';
import TransporterMasterView from './TransporterMasterView';
import ActivityHistoryModal from './ActivityHistoryModal';

// Seed Data
import {
  initialVendors,
  initialFabrics,
  initialColors,
  initialTransporters,
  initialPurchaseOrders,
  initialGRNs,
  initialQualityChecks,
  initialRejectedStock,
  initialAuditLogs
} from '../../data/procurementData';

import { api } from '../../services/api';

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
export default function ProcurementDashboard({ initialSubmodule = 'overview', onNavigate }) {
  // Tabs: 'overview', 'pos', 'grn', 'qc', 'rejected_stock', 'vendors', 'fabrics', 'transporters'
  const [activeTab, setActiveTab] = useState(initialSubmodule);

  const tabToRouteMap = {
    overview: '/dashboard',
    pos: '/procurement-pos',
    grn: '/goods-inward',
    qc: '/quality-batches',
    stock_pool: '/stock-pool',
    rejected_stock: '/rejected-stock',
    vendors: '/vendors',
    fabrics: '/fabrics',
    colors: '/colors',
    transporters: '/transporters'
  };

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

  const [activeGrnView, setActiveGrnView] = useState('list'); // 'list', 'detail', 'form'
  const [selectedGRN, setSelectedGRN] = useState(null);

  const [activeQcView, setActiveQcView] = useState('list'); // 'list', 'form', 'detail', 'damaged'
  const [selectedQC, setSelectedQC] = useState(null);
  const [selectedDamagedItem, setSelectedDamagedItem] = useState(null);

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // 1. Vendors State
  const [vendors, setVendors] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_vendors_v1');
      if (s) return JSON.parse(s);
    } catch (e) { }
    return initialVendors;
  });

  // Initial Fetch from MySQL Backend Server
  useEffect(() => {
    async function loadDataFromMySQL() {
      try {
        const [vRes, fRes, cRes, tRes, poRes, grnRes, qcRes, rejRes, logRes] = await Promise.allSettled([
          api.getVendors(),
          api.getFabrics(),
          api.getColors(),
          api.getTransporters(),
          api.getPurchaseOrders(),
          api.getGRNs(),
          api.getQualityChecks(),
          api.getRejectedStock(),
          api.getAuditLogs()
        ]);

        if (vRes.status === 'fulfilled' && vRes.value?.success) {
          setVendors(vRes.value.data || []);
        }
        if (fRes.status === 'fulfilled' && fRes.value?.success) {
          setFabrics(fRes.value.data || []);
        }
        if (cRes.status === 'fulfilled' && cRes.value?.success && cRes.value.data?.length > 0) {
          setColors(cRes.value.data);
        }
        if (tRes.status === 'fulfilled' && tRes.value?.success) {
          setTransporters(tRes.value.data || []);
        }
        if (poRes.status === 'fulfilled' && poRes.value?.success && poRes.value.data?.length > 0) {
          setPurchaseOrders(poRes.value.data);
        }
        if (grnRes.status === 'fulfilled' && grnRes.value?.success && grnRes.value.data?.length > 0) {
          setGrns((prevLocal) => {
            const backendData = (grnRes.value.data || []).filter(Boolean);
            const merged = [...backendData];
            (prevLocal || []).filter(Boolean).forEach((locItem) => {
              if (!locItem || !locItem.id) return;
              const idx = merged.findIndex((b) => b && b.id === locItem.id);
              if (idx >= 0) {
                if (locItem.isQcActioned && !merged[idx].isQcActioned) {
                  merged[idx] = { ...merged[idx], ...locItem };
                }
              } else {
                merged.push(locItem);
              }
            });
            return merged.filter(Boolean);
          });
        }
        if (qcRes.status === 'fulfilled' && qcRes.value?.success && qcRes.value.data?.length > 0) {
          setQualityChecks((prevLocal) => {
            const backendData = (qcRes.value.data || []).filter(Boolean);
            const merged = [...backendData];
            (prevLocal || []).filter(Boolean).forEach((locItem) => {
              if (!locItem || !locItem.id) return;
              const idx = merged.findIndex((b) => b && b.id === locItem.id);
              if (idx >= 0) {
                if (locItem.adminDecision && !merged[idx].adminDecision) {
                  merged[idx] = { ...merged[idx], ...locItem };
                }
              } else {
                merged.push(locItem);
              }
            });
            return merged.filter(Boolean);
          });
        }
        if (rejRes.status === 'fulfilled' && rejRes.value?.success && rejRes.value.data?.length > 0) {
          setRejectedStock((prevLocal) => {
            const backendData = (rejRes.value.data || []).filter(Boolean);
            const merged = [...backendData];
            (prevLocal || []).filter(Boolean).forEach((locItem) => {
              if (!locItem || !locItem.id) return;
              const idx = merged.findIndex((b) => b && (b.id === locItem.id || (locItem.sourceQcRef && b.sourceQcRef === locItem.sourceQcRef)));
              if (idx >= 0) {
                if (locItem.status && locItem.status !== 'Pending Admin Review' && merged[idx].status === 'Pending Admin Review') {
                  merged[idx] = { ...merged[idx], ...locItem };
                }
              } else {
                merged.push(locItem);
              }
            });
            return merged.filter(Boolean);
          });
        }
        if (logRes.status === 'fulfilled' && logRes.value?.success && logRes.value.data?.length > 0) {
          setAuditLogs(logRes.value.data);
        }
      } catch (err) {
        console.warn('Backend server offline, running in fallback mode:', err);
      }
    }
    loadDataFromMySQL();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_vendors_v1', JSON.stringify(vendors));
    } catch (e) { }
  }, [vendors]);

  // 2. Fabrics State
  const [fabrics, setFabrics] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_fabrics_v1');
      if (s) return JSON.parse(s);
    } catch (e) { }
    return initialFabrics;
  });

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_fabrics_v1', JSON.stringify(fabrics));
    } catch (e) { }
  }, [fabrics]);

  // Colors State (Color Master)
  const [colors, setColors] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_colors_v1');
      if (s) return JSON.parse(s);
    } catch (e) { }
    return initialColors;
  });

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_colors_v1', JSON.stringify(colors));
    } catch (e) { }
  }, [colors]);

  // 3. Transporters State
  const [transporters, setTransporters] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_transporters_v1');
      if (s) return JSON.parse(s);
    } catch (e) { }
    return initialTransporters;
  });

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_transporters_v1', JSON.stringify(transporters));
    } catch (e) { }
  }, [transporters]);

  // 4. Purchase Orders State
  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_pos_v1');
      if (s) return JSON.parse(s);
    } catch (e) { }
    return initialPurchaseOrders;
  });

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_pos_v1', JSON.stringify(purchaseOrders));
    } catch (e) { }
  }, [purchaseOrders]);

  // 5. GRNs State
  const [grns, setGrns] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_grns_v1');
      if (s) return JSON.parse(s);
    } catch (e) { }
    return initialGRNs;
  });

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_grns_v1', JSON.stringify(grns));
    } catch (e) { }
  }, [grns]);

  // 6. Quality Checks State
  const [qualityChecks, setQualityChecks] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_qcs_v1');
      if (s) return JSON.parse(s);
    } catch (e) { }
    return initialQualityChecks;
  });

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_qcs_v1', JSON.stringify(qualityChecks));
    } catch (e) { }
  }, [qualityChecks]);

  // 7. Rejected Stock State
  const [rejectedStock, setRejectedStock] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_rejected_stock_v1');
      if (s) return JSON.parse(s);
    } catch (e) { }
    return initialRejectedStock;
  });

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_rejected_stock_v1', JSON.stringify(rejectedStock));
    } catch (e) { }
  }, [rejectedStock]);

  // 7.1 Stock Pool State (Step 5: Approved fabric available for production allocation)
  const [stockPool, setStockPool] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_stock_pool_v1');
      if (s) return JSON.parse(s);
    } catch (e) { }
    return [
      {
        id: 'SP-1001',
        fabricId: 'FAB-001',
        fabricName: 'Tussar Silk',
        width: '42"',
        colorId: 'COL-001',
        colorName: 'Ivory',
        colorHex: '#FFFFF0',
        qty: 1900.0,
        source: 'QC approved',
        sourceType: 'GRN',
        poId: 'PO-1001',
        grnId: 'GRN-1001',
        decidedAt: '07/10/2026'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('raindrop_stock_pool_v1', JSON.stringify(stockPool));
    } catch (e) { }
  }, [stockPool]);

  // 8. Audit Logs State
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const s = localStorage.getItem('raindrop_audit_logs_v1');
      if (s) return JSON.parse(s);
    } catch (e) { }
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
    api.savePurchaseOrder(poData).catch((e) => console.warn('PO save sync error:', e));
    setSelectedPO(poData);
    setActivePoView('list');
  };

  const handleInwardFromPO = (po) => {
    const declaredMeters = (po.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    const fabricItem = po.items && po.items[0] ? po.items[0].fabricName || po.items[0].fabricQuality : '';
    const vMatch = vendors.find((v) => v.id === po.vendorId);
    const resolvedVendorName = po.vendorName || (vMatch ? vMatch.name : (po.vendorId || ''));

    const newGrn = {
      id: `GRN-${String(Math.floor(1000 + Math.random() * 9000))}`,
      date: new Date().toISOString().split('T')[0],
      linkedPOs: [po.id],
      vendorId: po.vendorId,
      vendorName: resolvedVendorName,
      fabricName: fabricItem,
      status: 'Bale Entry in Progress',
      totalBales: 5,
      declaredTotalMeters: declaredMeters || 1000,
      bales: []
    };
    setSelectedGRN(newGrn);
    setActiveGrnView('form');
    setActiveTab('grn');
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
    api.saveGRN(grnData).catch((e) => console.warn('GRN save sync error:', e));

    // If completed, automatically generate QC record (6.2 rule: "A QC record is generated automatically the moment a GRN is processed")
    if (isCompleted && grnData.status === 'Completed') {
      let expFold = '100';
      let expWidth = '44';

      if (grnData.linkedPOs && grnData.linkedPOs.length > 0) {
        const linkedPO = purchaseOrders.find((p) => grnData.linkedPOs.includes(p.id));
        if (linkedPO && linkedPO.items && linkedPO.items.length > 0) {
          const item = linkedPO.items[0];
          if (item.fold) expFold = String(item.fold);
          if (item.width) expWidth = String(item.width);
        }
      }

      if (!expWidth && grnData.fabricName) {
        const matchingFabric = fabrics.find((f) => f.qualityName === grnData.fabricName);
        if (matchingFabric && matchingFabric.pannaWidth) {
          expWidth = String(matchingFabric.pannaWidth);
        }
      }

      const newQC = {
        id: `QC-${String(Math.floor(1000 + Math.random() * 9000))}`,
        grnRef: grnData.id,
        inspectionScope: 'Whole Shipment',
        baleRef: '',
        pieceRef: '',
        inspectorName: 'Saksham Garg',
        expectedWidth: expWidth,
        actualWidth: Number(expWidth) || 44.0,
        expectedFold: expFold,
        actualFold: Number(expFold) || 100.0,
        photos: [],
        notes: `Quality inspection generated for inward shipment ${grnData.id}. Awaiting physical check.`,
        qcStatus: 'Pending', // Pending until QC is actioned, allowing GRN editing
        adminDecision: '',
        adminRemarks: '',
        dateTime: new Date().toLocaleString('en-GB'),
        createdBy: 'System QC Agent'
      };
      setQualityChecks((prev) => [newQC, ...prev]);
      api.saveQualityCheck(newQC).catch((e) => console.warn('Auto QC save sync error:', e));
      addAuditLog('Create', 'Quality Check', newQC.id, 'Auto QC Record', 'None', `Generated from ${grnData.id} (Awaiting QC)`);
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

    api.saveQualityCheck(qcData).catch((e) => console.warn('QC save sync error:', e));
    addAuditLog('Update', 'Quality Check', qcData.id, 'QC Status', 'Pending', qcData.qcStatus);

    // Lock the linked GRN once QC is actioned (OK, Partial OK, Reject, Send for Admin Approval)
    const linkedGrn = grns.find((g) => g.id === qcData.grnRef);
    if (linkedGrn) {
      let finalGrnStatus = 'QC In Progress';
      if (qcData.qcStatus === 'OK' || qcData.qcStatus === 'Partial OK') {
        finalGrnStatus = qcData.heldBackQty > 0 ? 'QC Approved (Partial Holdback)' : 'QC Approved';
      } else if (qcData.qcStatus === 'Reject') {
        finalGrnStatus = 'QC Rejected';
      } else if (qcData.qcStatus === 'Send for Admin Approval' || qcData.qcStatus === 'Pending Admin Approval') {
        finalGrnStatus = 'Pending Admin Approval';
      }

      const updatedGrn = {
        ...linkedGrn,
        status: finalGrnStatus,
        qcStatus: qcData.qcStatus,
        isQcActioned: true, // LOCK the GRN: Bales and inward quantities can no longer be edited!
        qcDecidedAt: new Date().toLocaleString('en-GB')
      };

      setGrns((prev) => prev.map((g) => (g.id === updatedGrn.id ? updatedGrn : g)));
      api.saveGRN(updatedGrn).catch((e) => console.warn('GRN lock status sync error:', e));
      addAuditLog('Lock', 'GRN', linkedGrn.id, 'QC Processing Lock', 'Editable', `Locked (${finalGrnStatus})`);
    }

    // 1. ADD APPROVED PORTION DIRECTLY TO STOCK POOL
    const goodMeters = Number(qcData.goodQty) || 0;
    if (goodMeters > 0) {
      const fabricName = linkedGrn?.fabricName || 'Fabric Quality';
      const widthVal = qcData.actualWidth ? `${qcData.actualWidth}"` : (qcData.expectedWidth ? `${qcData.expectedWidth}"` : '44"');
      const colorVal = linkedGrn?.colorName || 'Ivory';

      const newStockLot = {
        id: `SP-${Date.now()}`,
        fabricId: linkedGrn?.fabricId || 'FAB-001',
        fabricName: fabricName,
        width: widthVal,
        colorId: linkedGrn?.colorId || null,
        colorName: colorVal,
        colorHex: linkedGrn?.colorHex || '#FFFFF0',
        qty: goodMeters,
        source: 'QC approved',
        sourceType: 'GRN',
        poId: linkedGrn?.linkedPOs?.[0] || 'PO-1001',
        grnId: qcData.grnRef,
        decidedAt: new Date().toLocaleDateString('en-GB')
      };

      setStockPool((prev) => [newStockLot, ...prev]);
      addAuditLog('Inward', 'Stock Pool', newStockLot.id, 'Approved Stock Inward', 'None', `${goodMeters}m (${fabricName})`);
    }

    // 2. DEFECT / FLAGGED PIECES HELD BACK FOR ADMIN REVIEW OR REJECTION
    const heldBackMeters = Number(qcData.heldBackQty) || 0;
    const isWholeRejected = qcData.qcStatus === 'Reject';
    const isSentToAdmin = qcData.qcStatus === 'Send for Admin Approval' || qcData.qcStatus === 'Pending Admin Approval';
    const hasDefectivePieces = Array.isArray(qcData.issuePieces) && qcData.issuePieces.length > 0;

    if (heldBackMeters > 0 || isWholeRejected || isSentToAdmin) {
      const rejQty = heldBackMeters > 0 ? heldBackMeters : (Number(linkedGrn?.declaredTotalMeters) || 100);
      const pieceLabel = hasDefectivePieces
        ? qcData.issuePieces.map((p) => `Bale ${p.baleNo} - Piece ${p.pieceNo} (${p.status})`).join(', ')
        : (isWholeRejected ? 'Whole Shipment Rejected' : (isSentToAdmin ? 'Whole Shipment to Admin' : 'Defect Qty Held Back'));

      const newRej = {
        id: `REJ-${String(Math.floor(1000 + Math.random() * 9000))}`,
        sourceQcRef: qcData.id,
        grnRef: qcData.grnRef,
        poRef: linkedGrn?.linkedPOs?.[0] || 'PO-0001',
        vendorName: linkedGrn?.vendorName || 'M.S. Textiles',
        baleRef: qcData.baleRef || 'Multiple Bales',
        pieceRef: pieceLabel,
        fabricName: linkedGrn?.fabricName || 'Fabric Quality',
        quantity: rejQty,
        reason: qcData.defectReason || qcData.notes || 'Defective fabric identified during QC inspection.',
        dateFlagged: new Date().toLocaleDateString('en-GB'),
        status: isWholeRejected ? 'In Pool' : 'Pending Admin Review',
        heldBackPieces: qcData.issuePieces || [],
        actionDetails: null
      };

      setRejectedStock((prev) => [newRej, ...prev]);
      api.saveRejectedStock(newRej).catch((e) => console.warn('Rejected stock sync error:', e));
      addAuditLog('Holdback', 'Rejected Stock', newRej.id, 'Held Back for Admin', 'QC Inspection', `${rejQty}m (${newRej.status})`);
    }
  };

  // Admin Resolution of Damaged / Held-back Items (Matches Screenshot 5)
  const handleDamagedResolve = (damagedItem, decision, note = '') => {
    const targetId = (damagedItem.id && String(damagedItem.id).startsWith('REJ-'))
      ? damagedItem.id
      : (damagedItem.sourceQcRef ? `REJ-${damagedItem.sourceQcRef}` : (damagedItem.id ? `REJ-${damagedItem.id}` : `REJ-${Date.now()}`));

    const sourceQc = damagedItem.sourceQcRef || (damagedItem.id && String(damagedItem.id).startsWith('QC-') ? damagedItem.id : selectedQC?.id);
    const grnRef = damagedItem.grnRef || selectedQC?.grnRef;
    const poRef = damagedItem.poRef || selectedGRN?.linkedPOs?.[0] || 'PO-1001';
    const fabricName = damagedItem.fabricName || selectedGRN?.fabricName || 'Tussar Silk';
    const vendorName = damagedItem.vendorName || selectedGRN?.vendorName || 'M.S. Textiles';
    const lotQty = Number(damagedItem.quantity) || Number(damagedItem.defectiveQty) || Number(damagedItem.heldBackQty) || 100;

    // 1. Remove previous entry tied to this damaged item from stockPool if any to prevent double-counting
    let updatedStockPool = stockPool.filter((s) => s.damagedItemId !== targetId && s.damagedItemId !== damagedItem.id);

    // 2. If decision is 'Reversed (treated as good)', add to stockPool
    if (decision === 'Reversed (treated as good)') {
      const newLot = {
        id: `SP-${Date.now()}`,
        fabricId: damagedItem.fabricId || 'FAB-001',
        fabricName: fabricName,
        width: damagedItem.width || '42"',
        colorId: damagedItem.colorId || null,
        colorName: damagedItem.colorName || 'Ivory',
        colorHex: '#FFFFF0',
        qty: lotQty,
        source: 'Reversed — defect overturned on review',
        sourceType: 'Damaged Reversal',
        poId: poRef,
        grnId: grnRef,
        qcId: sourceQc,
        damagedItemId: targetId,
        decidedAt: new Date().toLocaleDateString('en-GB')
      };
      updatedStockPool = [newLot, ...updatedStockPool];
      addAuditLog('Resolution', 'Damaged Item', targetId, 'Resolution Decision', damagedItem.status || 'Pending Admin Review', `${decision} (${lotQty}m added to Stock Pool)`, note);
    } else {
      addAuditLog('Resolution', 'Damaged Item', targetId, 'Resolution Decision', damagedItem.status || 'Pending Admin Review', decision, note);
    }

    setStockPool(updatedStockPool);
    try {
      localStorage.setItem('raindrop_stock_pool_v1', JSON.stringify(updatedStockPool));
    } catch (e) { }

    // 3. Update or Add damagedItem in rejectedStock
    const updatedDamaged = {
      ...damagedItem,
      id: targetId,
      sourceQcRef: sourceQc,
      grnRef: grnRef,
      poRef: poRef,
      fabricName: fabricName,
      vendorName: vendorName,
      quantity: lotQty,
      status: decision,
      resolutionNote: note,
      resolvedAt: new Date().toLocaleDateString('en-GB'),
      actionDetails: {
        decision,
        note,
        resolvedAt: new Date().toLocaleDateString('en-GB')
      }
    };

    setRejectedStock((prev) => {
      const exists = prev.some(
        (item) => item.id === targetId || item.id === damagedItem.id || (sourceQc && item.sourceQcRef === sourceQc)
      );
      let nextList;
      if (exists) {
        nextList = prev.map((item) =>
          (item.id === targetId || item.id === damagedItem.id || (sourceQc && item.sourceQcRef === sourceQc))
            ? updatedDamaged
            : item
        );
      } else {
        nextList = [updatedDamaged, ...prev];
      }
      try {
        localStorage.setItem('raindrop_rejected_stock_v1', JSON.stringify(nextList));
      } catch (e) { }
      return nextList;
    });

    setSelectedDamagedItem(updatedDamaged);

    // 4. Sync to MySQL Backend API
    api.saveRejectedStock(updatedDamaged).catch((e) => console.warn('Rejected stock sync error:', e));

    // 5. Update linked Quality Check state & MySQL API
    setQualityChecks((prev) => {
      const nextQcs = prev.map((q) => {
        if (q.id === sourceQc || (grnRef && q.grnRef === grnRef)) {
          const nextQc = {
            ...q,
            adminDecision: decision,
            adminRemarks: note || `Admin resolution: ${decision}`,
            qcStatus: decision === 'Reversed (treated as good)' ? 'OK' : q.qcStatus
          };
          api.saveQualityCheck(nextQc).catch((e) => console.warn('QC save sync error:', e));
          if (selectedQC && (selectedQC.id === q.id || selectedQC.grnRef === grnRef)) {
            setSelectedQC(nextQc);
          }
          return nextQc;
        }
        return q;
      });
      try {
        localStorage.setItem('raindrop_qcs_v1', JSON.stringify(nextQcs));
      } catch (e) { }
      return nextQcs;
    });

    // 6. Update linked GRN state & MySQL API if applicable
    if (grnRef) {
      setGrns((prev) => {
        const nextGrns = prev.map((g) => {
          if (g.id === grnRef) {
            const nextG = {
              ...g,
              status: decision === 'Reversed (treated as good)' ? 'QC Approved' : g.status,
              qcStatus: decision === 'Reversed (treated as good)' ? 'OK' : g.qcStatus,
              isQcActioned: true
            };
            api.saveGRN(nextG).catch((e) => console.warn('GRN sync error:', e));
            if (selectedGRN && selectedGRN.id === g.id) {
              setSelectedGRN(nextG);
            }
            return nextG;
          }
          return g;
        });
        try {
          localStorage.setItem('raindrop_grns_v1', JSON.stringify(nextGrns));
        } catch (e) { }
        return nextGrns;
      });
    }
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
            if (onNavigate && tabToRouteMap[tab]) {
              onNavigate(tabToRouteMap[tab]);
            }
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
              vendors={vendors}
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
              onInwardGRN={handleInwardFromPO}
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
              onInwardGRN={handleInwardFromPO}
              onSaveVendor={(v) => {
                setVendors((prev) => {
                  const exists = prev.some((item) => item.id === v.id);
                  return exists ? prev.map((item) => (item.id === v.id ? v : item)) : [v, ...prev];
                });
                api.saveVendor(v).catch((e) => console.warn('Vendor save sync error:', e));
                addAuditLog('Save', 'Vendor Master', v.id, 'Vendor Details', 'Record', v.name);
              }}
              onSaveFabric={(f) => {
                setFabrics((prev) => {
                  const exists = prev.some((item) => item.id === f.id);
                  return exists ? prev.map((item) => (item.id === f.id ? f : item)) : [f, ...prev];
                });
                api.saveFabric(f).catch((e) => console.warn('Fabric save sync error:', e));
                addAuditLog('Save', 'Fabric Master', f.id, 'Fabric Quality', 'Record', f.qualityName);
              }}
              colors={colors}
              onSaveColor={(c) => {
                setColors((prev) => {
                  const exists = prev.some((item) => item.id === c.id);
                  return exists ? prev.map((item) => (item.id === c.id ? c : item)) : [c, ...prev];
                });
                api.saveColor(c).catch((e) => console.warn('Color save sync error:', e));
                addAuditLog('Save', 'Color Master', c.id, 'Color Definition', 'Record', c.name);
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
                setActiveGrnView('detail');
              }}
            />
          )}

          {activeGrnView === 'detail' && (
            <GRNDetailView
              grn={selectedGRN || grns.find((g) => g && (g.id === selectedQC?.grnRef || (selectedQC?.grnRef && g.id.includes(selectedQC.grnRef.replace('GRN-', ''))))) || grns[0]}
              vendors={vendors}
              transporters={transporters}
              purchaseOrders={purchaseOrders}
              qualityChecks={qualityChecks}
              onBack={() => {
                setSelectedGRN(null);
                setActiveGrnView('list');
              }}
              onEditHeader={(updatedGrn) => {
                setGrns((prev) => (prev || []).map((g) => (g && g.id === updatedGrn.id ? updatedGrn : g)));
                setSelectedGRN(updatedGrn);
                api.saveGRN(updatedGrn).catch((e) => console.warn('GRN header save sync error:', e));
                addAuditLog('Update', 'GRN', updatedGrn.id, 'GRN Header Details', 'Previous', 'Updated Receipt Details');
              }}
              onEditBales={(g) => {
                setSelectedGRN(g);
                setActiveGrnView('form');
              }}
              onSelectQCItem={(qcItem) => {
                setSelectedQC(qcItem);
                if (qcItem.qcStatus === 'Pending') {
                  setActiveTab('qc');
                  setActiveQcView('form');
                } else {
                  setActiveTab('qc');
                  setActiveQcView('detail');
                }
              }}
            />
          )}

          {activeGrnView === 'form' && (
            <GRNForm
              grn={selectedGRN}
              purchaseOrders={purchaseOrders}
              vendors={vendors}
              fabrics={fabrics}
              transporters={transporters}
              qualityChecks={qualityChecks}
              onBack={() => setActiveGrnView(selectedGRN ? 'detail' : 'list')}
              onSaveGRN={(grnData, isCompleted) => {
                handleSaveGRN(grnData, isCompleted);
                setSelectedGRN(grnData);
                setActiveGrnView('detail');
              }}
              onSaveTransporter={(t) => {
                setTransporters((prev) => {
                  const exists = prev.some((item) => item.id === t.id);
                  return exists ? prev.map((item) => (item.id === t.id ? t : item)) : [t, ...prev];
                });
                api.saveTransporter(t).catch((e) => console.warn('Transporter save sync error:', e));
                addAuditLog('Save', 'Transporter Master', t.id, 'Logistics Carrier', 'Record', t.name);
              }}
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
              onSelectQC={(qc) => {
                setSelectedQC(qc);
                if (qc.qcStatus === 'Pending') {
                  setActiveQcView('form');
                } else {
                  setActiveQcView('detail');
                }
              }}
            />
          )}

          {activeQcView === 'detail' && (
            <QCDetailView
              qc={selectedQC || qualityChecks[0]}
              grn={grns.find((g) => g && (g.id === selectedQC?.grnRef || (selectedQC?.grnRef && g.id.includes(selectedQC.grnRef.replace('GRN-', ''))))) || selectedGRN || grns[0]}
              purchaseOrder={purchaseOrders.find((p) => p.id === (grns.find((g) => g && g.id === selectedQC?.grnRef)?.linkedPOs?.[0]))}
              stockEntries={stockPool}
              damagedItem={rejectedStock.find((r) => r && (r.sourceQcRef === selectedQC?.id || r.grnRef === selectedQC?.grnRef))}
              onBackToGRN={() => {
                let targetGrn = grns.find((g) => g && (g.id === selectedQC?.grnRef || (selectedQC?.grnRef && g.id.includes(selectedQC.grnRef.replace('GRN-', '')))))
                  || selectedGRN;
                if (!targetGrn) {
                  targetGrn = {
                    id: selectedQC?.grnRef || 'GRN-0001',
                    poId: 'PO-1001',
                    linkedPOs: ['PO-1001'],
                    vendorName: 'M.S. Textiles',
                    fabricName: 'Tussar Silk (42") — Ivory',
                    date: '2026-10-07',
                    status: 'QC Approved',
                    totalMetersEntered: 2000,
                    declaredTotalMeters: 2000,
                    bales: []
                  };
                }
                setSelectedGRN(targetGrn);
                setActiveTab('grn');
                setActiveGrnView('detail');
              }}
              onBackToQC={() => {
                setActiveQcView('list');
              }}
              onViewResolveDamaged={(dItem) => {
                setSelectedDamagedItem(dItem);
                setActiveQcView('damaged');
              }}
              onViewStockPool={() => {
                setActiveTab('stock_pool');
              }}
            />
          )}

          {activeQcView === 'damaged' && (
            <DamagedItemDetailView
              damagedItem={selectedDamagedItem}
              onBack={() => setActiveQcView('detail')}
              onResolveDecision={handleDamagedResolve}
            />
          )}

          {activeQcView === 'form' && (
            <QualityCheckForm
              qc={selectedQC}
              grns={grns}
              purchaseOrders={purchaseOrders}
              fabrics={fabrics}
              onBack={() => setActiveQcView('list')}
              onSaveQC={(savedQC) => {
                handleSaveQC(savedQC);
                setSelectedQC(savedQC);
              }}
              onNavigateToStockPool={() => {
                setActiveTab('stock_pool');
                if (onNavigate) onNavigate('/stock-pool');
              }}
              onNavigateToGRN={(grnId) => {
                const targetGrn = grns.find((g) => g.id === grnId);
                if (targetGrn) setSelectedGRN(targetGrn);
                setActiveGrnView('detail');
                setActiveTab('grn');
                if (onNavigate) onNavigate('/goods-inward');
              }}
            />
          )}
        </>
      )}

      {/* TAB: STOCK POOL (Step 5) */}
      {activeTab === 'stock_pool' && (
        <StockPoolView
          stockPool={stockPool}
          onNavigateToGRN={(grnId) => {
            const targetGrn = grns.find((g) => g.id === grnId);
            if (targetGrn) setSelectedGRN(targetGrn);
            setActiveGrnView('list');
            setActiveTab('grn');
            if (onNavigate) onNavigate('/goods-inward');
          }}
          onNavigateToPO={(poId) => {
            const targetPo = purchaseOrders.find((p) => p.id === poId);
            if (targetPo) setSelectedPO(targetPo);
            setActivePoView('list');
            setActiveTab('pos');
            if (onNavigate) onNavigate('/procurement-pos');
          }}
        />
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
            api.saveVendor(v).catch((e) => console.warn('Vendor save sync error:', e));
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
            api.saveFabric(f).catch((e) => console.warn('Fabric save sync error:', e));
            addAuditLog('Save', 'Fabric Master', f.id, 'Fabric Quality', 'Record', f.qualityName);
          }}
        />
      )}

      {/* TAB: COLORS */}
      {activeTab === 'colors' && (
        <ColorMasterView
          colors={colors}
          onSaveColor={(c) => {
            setColors((prev) => {
              const exists = prev.some((item) => item.id === c.id);
              return exists ? prev.map((item) => (item.id === c.id ? c : item)) : [c, ...prev];
            });
            api.saveColor(c).catch((e) => console.warn('Color save sync error:', e));
            addAuditLog('Save', 'Color Master', c.id, 'Color Definition', 'Record', c.name);
          }}
          onDeleteColor={(id) => {
            setColors((prev) => prev.filter((item) => item.id !== id));
            api.deleteColor(id).catch((e) => console.warn('Color delete sync error:', e));
            addAuditLog('Delete', 'Color Master', id, 'Color Definition', 'Record', id);
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
            api.saveTransporter(t).catch((e) => console.warn('Transporter save sync error:', e));
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
