import React, { useState, useEffect, useRef } from 'react';

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
export default function ProcurementDashboard({ initialSubmodule = 'overview', onNavigate, sidebarClickCount = 0, extraData = null }) {
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

  // Sync active tab whenever initialSubmodule route changes
  useEffect(() => {
    setActiveTab(initialSubmodule);
  }, [initialSubmodule]);

  const prevSidebarCount = useRef(sidebarClickCount);

  // When user explicitly clicks in the sidebar menu, reset to that submodule's main list page
  useEffect(() => {
    if (sidebarClickCount > prevSidebarCount.current) {
      prevSidebarCount.current = sidebarClickCount;
      setActiveTab(initialSubmodule);
      if (initialSubmodule === 'pos') {
        setActivePoView('list');
        setSelectedPO(null);
      }
      if (initialSubmodule === 'grn') {
        setActiveGrnView('list');
        setSelectedGRN(null);
      }
      if (initialSubmodule === 'qc') {
        setActiveQcView('list');
        setSelectedQC(null);
      }
      if (initialSubmodule === 'stock_pool') {
        setSelectedStockGroupKey(null);
      }
    }
  }, [sidebarClickCount, initialSubmodule]);


  const [activeGrnView, setActiveGrnView] = useState('list'); // 'list', 'detail', 'form'
  const [selectedGRN, setSelectedGRN] = useState(null);

  const [activeQcView, setActiveQcView] = useState('list'); // 'list', 'form', 'detail', 'damaged'
  const [selectedQC, setSelectedQC] = useState(null);
  const [selectedDamagedItem, setSelectedDamagedItem] = useState(null);
  const [selectedStockGroupKey, setSelectedStockGroupKey] = useState(null);

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

  const createAutoPO = (data) => {
    if (!data) return null;
    const defaultFabric = (fabrics && fabrics.length > 0 ? fabrics[0] : null) || initialFabrics?.[0] || null;
    const defaultVendor = (vendors && vendors.length > 0 ? vendors[0] : null) || initialVendors?.[0] || null;
    const orderGreigeQty = Number(data.totalFabricGreige) || 0;
    const orderStyle = data.styleName || 'Sample Style';
    const orderIdStr = data.id ? `#${data.id}` : '';
    return {
      id: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      isAutoGenerated: true,
      vendorId: defaultVendor?.id || 'VEN-001',
      vendorName: defaultVendor?.name || 'Apex Textiles',
      linkedOrder: data.id ? `ORD-${data.id}` : (data.orderId || ''),
      date: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      status: 'Draft',
      bufferAllowed: true,
      bufferPercent: 5,
      items: [
        {
          id: `item-${Date.now()}`,
          fabricId: defaultFabric?.id || 'FAB-001',
          fabricName: defaultFabric?.qualityName || data.fabricName || 'Cotton Cambric 60x60',
          colorName: data.color || 'Greige / Raw',
          width: '44"',
          quantity: orderGreigeQty > 0 ? orderGreigeQty : 500,
          rate: 85,
          foldPercent: 0,
          amount: (orderGreigeQty > 0 ? orderGreigeQty : 500) * 85
        }
      ],
      notes: `Auto-populated from Sales Order ${orderIdStr} (${orderStyle}) - Total Greige Fabric Required: ${orderGreigeQty}m`
    };
  };

  // Subviews: If extraData is present, start directly in 'form' view
  const [activePoView, setActivePoView] = useState(() => (extraData ? 'form' : 'list'));
  const [selectedPO, setSelectedPO] = useState(() => (extraData ? createAutoPO(extraData) : null));

  // Auto-populate & open PO form when navigated with extraData
  useEffect(() => {
    if (extraData && (initialSubmodule === 'pos' || activeTab === 'pos')) {
      const autoPO = createAutoPO(extraData);
      setSelectedPO(autoPO);
      setActivePoView('form');
    }
  }, [extraData, initialSubmodule, activeTab]);


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

  // Requirement 38: Automatic synchronization to ensure multi-fabric GRNs have distinct QC records for each fabric quality
  useEffect(() => {
    if (!grns || grns.length === 0 || !purchaseOrders || purchaseOrders.length === 0) return;

    let hasUpdates = false;
    let updatedQCs = [...(qualityChecks || [])];

    grns.forEach((g) => {
      if (!g || !g.id) return;
      const linkedPO = (g.linkedPOs && g.linkedPOs.length > 0)
        ? purchaseOrders.find((p) => g.linkedPOs.includes(p.id))
        : purchaseOrders.find((p) => p.id === g.poId);

      const poItems = linkedPO?.items || [];
      const baleFabrics = Array.from(new Set((g.bales || []).map((b) => b.fabricItemLabel).filter(Boolean)));

      if (poItems.length > 1 || baleFabrics.length > 1) {
        const matchingQCs = updatedQCs.filter((q) => q && (q.grnRef === g.id || (g.id && q.id && q.id.startsWith(`QC-${g.id.replace('GRN-', '')}`))));
        const hasPartitions = matchingQCs.some((q) => q.id && q.id.includes('-F'));

        // If only 1 unpartitioned QC exists for a multi-fabric GRN, expand it into separate fabric records!
        if (!hasPartitions && matchingQCs.length > 0) {
          const originalQC = matchingQCs[0];
          const partitions = [];

          if (poItems.length > 1) {
            poItems.forEach((it, idx) => {
              const fName = it.fabricName || it.fabricQuality || `Fabric Quality ${idx + 1}`;
              let fMeters = 0;
              (g.bales || []).forEach((b) => {
                const bLbl = (b.fabricItemLabel || '').toLowerCase();
                const itLbl = fName.toLowerCase();
                if (b.itemIdx === idx || (bLbl && (bLbl.includes(itLbl) || itLbl.includes(bLbl)))) {
                  const bLen = (b.pieces || []).reduce((ps, p) => ps + (Number(typeof p === 'object' ? p.length : p) || 0), 0);
                  fMeters += bLen > 0 ? bLen : (Number(b.totalLength) || 0);
                }
              });
              if (fMeters <= 0) {
                fMeters = Number(it.quantity) || Math.round((Number(g.declaredTotalMeters || g.totalQty || 0)) / poItems.length);
              }
              partitions.push({
                ...originalQC,
                id: `QC-${g.id.replace('GRN-', '')}-F${idx + 1}`,
                grnRef: g.id,
                againstRef: linkedPO?.id || g.poId || '',
                fabricName: fName,
                fabricId: it.fabricId || '',
                colorName: it.color || it.colorName || it.shade || g.colorName || 'Grey / Natural',
                expectedWidth: String(it.width || '44'),
                expectedFold: String(it.fold || '100'),
                totalReceivedMeters: fMeters,
                receivedQty: fMeters,
                qcStatus: originalQC.qcStatus || 'Pending'
              });
            });
          } else if (baleFabrics.length > 1) {
            baleFabrics.forEach((fLbl, idx) => {
              let fMeters = 0;
              (g.bales || []).forEach((b) => {
                if (b.fabricItemLabel === fLbl) {
                  const bLen = (b.pieces || []).reduce((ps, p) => ps + (Number(typeof p === 'object' ? p.length : p) || 0), 0);
                  fMeters += bLen > 0 ? bLen : (Number(b.totalLength) || 0);
                }
              });
              if (fMeters <= 0) {
                fMeters = Math.round((Number(g.declaredTotalMeters || g.totalQty || 0)) / baleFabrics.length);
              }
              partitions.push({
                ...originalQC,
                id: `QC-${g.id.replace('GRN-', '')}-F${idx + 1}`,
                grnRef: g.id,
                againstRef: g.poId || '',
                fabricName: fLbl,
                expectedWidth: String(g.pannaWidth || '44'),
                expectedFold: String(g.fabricFolding || '100'),
                totalReceivedMeters: fMeters,
                receivedQty: fMeters,
                qcStatus: originalQC.qcStatus || 'Pending'
              });
            });
          }

          if (partitions.length > 1) {
            updatedQCs = updatedQCs.filter((q) => q.id !== originalQC.id && q.grnRef !== g.id);
            updatedQCs = [...partitions, ...updatedQCs];
            hasUpdates = true;
            partitions.forEach((p) => {
              api.saveQualityCheck(p).catch((err) => console.warn('Partition QC auto-sync error:', err));
            });
          }
        }
      }
    });

    if (hasUpdates) {
      setQualityChecks(updatedQCs);
    }
  }, [grns, purchaseOrders]);

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
    return [];
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
    const existingPo = purchaseOrders.find((p) => p.id === poData.id);

    // Requirement 15: Check if PO is locked against edits
    if (existingPo) {
      const curStatus = String(existingPo.status || '').trim();
      const isSentOrBeyond = ['Sent', 'Sent to Vendor', 'Partially Received', 'Completed'].includes(curStatus);
      const hasGrnStarted = Boolean(
        curStatus === 'Partially Received' ||
        curStatus === 'Completed' ||
        Number(existingPo.receivedQty) > 0 ||
        (grns || []).some(
          (g) => g && ((Array.isArray(g.linkedPOs) && g.linkedPOs.includes(existingPo.id)) || g.poId === existingPo.id || g.poNumber === existingPo.id || g.againstPo === existingPo.id)
        )
      );
      if (isSentOrBeyond && hasGrnStarted) {
        alert('This Purchase Order is locked and cannot be edited because its GRN process has already started.');
        return;
      }
    }

    const now = Date.now();
    const enrichedPO = {
      ...poData,
      createdAt: poData.createdAt || (isEdit ? purchaseOrders.find((p) => p.id === poData.id)?.createdAt : null) || now,
      updatedAt: now
    };
    if (isEdit) {
      setPurchaseOrders((prev) => prev.map((p) => (p.id === enrichedPO.id ? enrichedPO : p)));
      addAuditLog('Update', 'Purchase Order', enrichedPO.id, 'PO Details', 'Previous State', 'Updated State');
    } else {
      setPurchaseOrders((prev) => [enrichedPO, ...prev]);
      addAuditLog('Create', 'Purchase Order', enrichedPO.id, 'PO Creation', 'None', `${enrichedPO.id} (${enrichedPO.totalAmount})`);
    }
    api.savePurchaseOrder(enrichedPO).catch((e) => console.warn('PO save sync error:', e));
    setSelectedPO(enrichedPO);
    setActivePoView('list');
  };

  const handleViewGRN = (grn) => {
    if (!grn) return;
    setSelectedGRN(grn);
    setActiveGrnView('detail');
    setActiveTab('grn');
    if (onNavigate) onNavigate('/goods-inward');
  };

  const handleViewQC = (qc) => {
    if (!qc) return;
    setSelectedQC(qc);
    setActiveQcView('detail');
    setActiveTab('qc');
    if (onNavigate) onNavigate('/fabric-qc');
  };

  const handleInwardFromPO = (po) => {
    if (!po) return;

    // Check if GRN already exists for this PO
    const existingGrnsForPo = (grns || []).filter((g) =>
      g && (
        (g.linkedPOs && g.linkedPOs.includes(po.id)) ||
        g.poId === po.id ||
        g.poNumber === po.id ||
        g.againstPo === po.id
      )
    );

    if (existingGrnsForPo.length > 0) {
      const existing = existingGrnsForPo[0];
      alert(`GRN (${existing.id}) has already been created for PO ${po.id}. Only one GRN can be created per PO.`);
      setSelectedGRN(existing);
      setActiveGrnView('detail');
      setActiveTab('grn');
      if (onNavigate) onNavigate('/goods-inward');
      return;
    }

    const orderedMeters = (po.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    const fabricItem = po.items && po.items[0] ? po.items[0].fabricName || po.items[0].fabricQuality : '';
    const vMatch = vendors.find((v) => v.id === po.vendorId);
    const resolvedVendorName = po.vendorName || (vMatch ? vMatch.name : (po.vendorId || ''));
    const now = Date.now();

    const newGrn = {
      id: `GRN-${String(Math.floor(1000 + Math.random() * 9000))}`,
      date: new Date().toISOString().split('T')[0],
      createdAt: now,
      updatedAt: now,
      linkedPOs: [po.id],
      poId: po.id,
      vendorId: po.vendorId,
      vendorName: resolvedVendorName,
      fabricName: fabricItem,
      status: 'Draft',
      isNew: true,
      isHeaderSaved: false,
      totalBales: '',
      poOrderedMeters: orderedMeters,
      totalQty: '',
      declaredTotalMeters: 0,
      bales: []
    };
    setSelectedGRN(newGrn);
    setActiveGrnView('form');
    setActiveTab('grn');
    if (onNavigate) onNavigate('/goods-inward');
  };

  const handleSaveGRN = (grnData, isCompleted = true) => {
    const isEdit = grns.some((g) => g.id === grnData.id);
    const now = Date.now();
    const enrichedGRN = {
      ...grnData,
      createdAt: grnData.createdAt || (isEdit ? grns.find((g) => g.id === grnData.id)?.createdAt : null) || now,
      updatedAt: now
    };
    let updated;
    if (isEdit) {
      updated = grns.map((g) => (g.id === enrichedGRN.id ? enrichedGRN : g));
      addAuditLog('Update', 'GRN', enrichedGRN.id, 'GRN Progress', 'Draft', enrichedGRN.status);
    } else {
      updated = [enrichedGRN, ...grns];
      addAuditLog('Create', 'GRN', enrichedGRN.id, 'Inward Delivery', 'None', `${enrichedGRN.id} (${enrichedGRN.totalMetersEntered}m)`);
    }
    setGrns(updated);
    api.saveGRN(enrichedGRN).catch((e) => console.warn('GRN save sync error:', e));

    // Update Linked PO Status (Partial Delivery vs Full Delivery)
    if (enrichedGRN.linkedPOs && enrichedGRN.linkedPOs.length > 0) {
      const linkedPoId = enrichedGRN.linkedPOs[0];
      const targetPo = purchaseOrders.find((p) => p.id === linkedPoId);
      if (targetPo) {
        const poOrderedMeters = (targetPo.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        const allGrnsForPo = updated.filter((g) => g && g.linkedPOs && g.linkedPOs.includes(linkedPoId));
        const totalReceivedForPo = allGrnsForPo.reduce((s, g) => s + (Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0), 0);

        let newPoStatus = targetPo.status;
        if (totalReceivedForPo >= poOrderedMeters) {
          newPoStatus = 'Completed';
        } else if (totalReceivedForPo > 0) {
          newPoStatus = 'Partially Received';
        }

        const updatedPo = {
          ...targetPo,
          status: newPoStatus,
          receivedQty: totalReceivedForPo,
          pendingQty: Math.max(0, poOrderedMeters - totalReceivedForPo),
          isSystemSync: true
        };
        setPurchaseOrders((prev) => prev.map((p) => (p.id === linkedPoId ? updatedPo : p)));
        api.savePurchaseOrder(updatedPo).catch((e) => console.warn('PO status sync error:', e));
      }
    }

    // If completed, automatically generate QC record(s) per fabric quality
    if (isCompleted && enrichedGRN.status === 'Completed') {
      const linkedPO = (enrichedGRN.linkedPOs && enrichedGRN.linkedPOs.length > 0)
        ? purchaseOrders.find((p) => enrichedGRN.linkedPOs.includes(p.id))
        : purchaseOrders.find((p) => p.id === enrichedGRN.poId);

      const fabricBatches = [];

      if (linkedPO && linkedPO.items && linkedPO.items.length > 1) {
        // Multi-fabric PO items
        linkedPO.items.forEach((item, idx) => {
          const fName = item.fabricName || item.fabricQuality || `Fabric Quality ${idx + 1}`;
          let fMeters = 0;
          (enrichedGRN.bales || []).forEach((b) => {
            const bLbl = (b.fabricItemLabel || '').toLowerCase();
            const itLbl = fName.toLowerCase();
            if (b.itemIdx === idx || (bLbl && (bLbl.includes(itLbl) || itLbl.includes(bLbl)))) {
              const bLen = (b.pieces || []).reduce((s, p) => s + (Number(typeof p === 'object' ? p.length : p) || 0), 0);
              fMeters += bLen > 0 ? bLen : (Number(b.totalLength) || 0);
            }
          });
          if (fMeters <= 0) {
            fMeters = Number(item.quantity) || Math.round((Number(enrichedGRN.declaredTotalMeters) || 0) / linkedPO.items.length);
          }
          fabricBatches.push({
            fabricName: fName,
            fabricId: item.fabricId || '',
            colorName: item.color || item.colorName || item.shade || enrichedGRN.colorName || 'Grey / Natural',
            expectedWidth: String(item.width || '44'),
            expectedFold: String(item.fold || '100'),
            totalReceivedMeters: fMeters,
            itemIdx: idx
          });
        });
      } else {
        // Check bales for multiple distinct fabric labels
        const baleFabrics = Array.from(new Set((enrichedGRN.bales || []).map((b) => b.fabricItemLabel).filter(Boolean)));
        if (baleFabrics.length > 1) {
          baleFabrics.forEach((fLbl, idx) => {
            let fMeters = 0;
            (enrichedGRN.bales || []).forEach((b) => {
              if (b.fabricItemLabel === fLbl) {
                const bLen = (b.pieces || []).reduce((s, p) => s + (Number(typeof p === 'object' ? p.length : p) || 0), 0);
                fMeters += bLen > 0 ? bLen : (Number(b.totalLength) || 0);
              }
            });
            fabricBatches.push({
              fabricName: fLbl,
              fabricId: '',
              colorName: enrichedGRN.colorName || 'Grey / Natural',
              expectedWidth: String(enrichedGRN.pannaWidth || '44'),
              expectedFold: String(enrichedGRN.fabricFolding || '100'),
              totalReceivedMeters: fMeters || Math.round((Number(enrichedGRN.declaredTotalMeters) || 0) / baleFabrics.length),
              itemIdx: idx
            });
          });
        }
      }

      // If single fabric (fallback or standard)
      if (fabricBatches.length === 0) {
        let expFold = '100';
        let expWidth = '44';
        let singleFabricName = enrichedGRN.fabricName || '';
        let singleColorName = enrichedGRN.colorName || '';

        if (linkedPO && linkedPO.items && linkedPO.items.length > 0) {
          const item = linkedPO.items[0];
          if (item.fold) expFold = String(item.fold);
          if (item.width) expWidth = String(item.width);
          if (item.fabricName || item.fabricQuality) singleFabricName = item.fabricName || item.fabricQuality;
          if (item.color || item.colorName) singleColorName = item.color || item.colorName;
        }

        if (!expWidth && singleFabricName) {
          const matchingFabric = fabrics.find((f) => f.qualityName === singleFabricName);
          if (matchingFabric && matchingFabric.pannaWidth) {
            expWidth = String(matchingFabric.pannaWidth);
          }
        }

        fabricBatches.push({
          fabricName: singleFabricName || 'Grey Cotton Fabrics (100*100)',
          fabricId: enrichedGRN.fabricId || '',
          colorName: singleColorName || 'Grey / Natural',
          expectedWidth: expWidth,
          expectedFold: expFold,
          totalReceivedMeters: Number(enrichedGRN.declaredTotalMeters) || Number(enrichedGRN.totalQty) || 2000,
          itemIdx: 0
        });
      }

      // Create or update QC records for each fabric batch
      const newOrUpdatedQCs = [];
      fabricBatches.forEach((batch, bIdx) => {
        const qcId = fabricBatches.length > 1
          ? `QC-${enrichedGRN.id.replace('GRN-', '')}-F${bIdx + 1}`
          : `QC-${String(Math.floor(1000 + Math.random() * 9000))}`;

        const existingQC = qualityChecks.find((q) => q.id === qcId || (fabricBatches.length === 1 && q.grnRef === enrichedGRN.id));

        const qcRecord = {
          id: existingQC ? existingQC.id : qcId,
          grnRef: enrichedGRN.id,
          againstRef: linkedPO?.id || enrichedGRN.poId || '',
          fabricName: batch.fabricName,
          fabricId: batch.fabricId,
          colorName: batch.colorName,
          inspectionScope: 'Whole Shipment',
          baleRef: '',
          pieceRef: '',
          inspectorName: '',
          expectedWidth: batch.expectedWidth,
          actualWidth: '',
          expectedFold: batch.expectedFold,
          actualFold: '',
          totalReceivedMeters: batch.totalReceivedMeters,
          receivedQty: batch.totalReceivedMeters,
          photos: [],
          notes: '',
          qcStatus: existingQC?.qcStatus || 'Pending',
          adminDecision: '',
          adminRemarks: '',
          createdAt: existingQC?.createdAt || now,
          updatedAt: now,
          dateTime: new Date().toLocaleString('en-GB'),
          createdBy: 'System QC Agent'
        };

        newOrUpdatedQCs.push(qcRecord);
        api.saveQualityCheck(qcRecord).catch((e) => console.warn('Auto QC save sync error:', e));
        addAuditLog('Create', 'Quality Check', qcRecord.id, 'Auto QC Record', 'None', `Generated from ${enrichedGRN.id} (${batch.fabricName})`);
      });

      setQualityChecks((prev) => {
        const targetIds = new Set(newOrUpdatedQCs.map((q) => q.id));
        const filteredPrev = prev.filter((q) => !targetIds.has(q.id) && q.grnRef !== enrichedGRN.id);
        return [...newOrUpdatedQCs, ...filteredPrev];
      });

      // Open GRN Detail View with full QC status and inspection section
      setSelectedGRN(enrichedGRN);
      setSelectedQC(newOrUpdatedQCs[0]);
      setActiveTab('grn');
      setActiveGrnView('detail');
      return;
    }

    // If saving draft progress (e.g. Save Bale, Save All Bales, Save Header), keep user on current form!
    if (!isCompleted) {
      setSelectedGRN(enrichedGRN);
      return;
    }

    setActiveGrnView('list');
  };

  const handleSaveQC = (qcData) => {
    const isEdit = qualityChecks.some((q) => q.id === qcData.id);
    const now = Date.now();
    const enrichedQC = {
      ...qcData,
      createdAt: qcData.createdAt || (isEdit ? qualityChecks.find((q) => q.id === qcData.id)?.createdAt : null) || now,
      updatedAt: now
    };
    if (isEdit) {
      setQualityChecks((prev) => prev.map((q) => (q.id === enrichedQC.id ? enrichedQC : q)));
    } else if (qcData.originalQcId) {
      const targetGrn = grns.find((g) => g && (g.id === qcData.grnRef || (qcData.grnRef && g.id.includes(qcData.grnRef.replace('GRN-', '')))));
      const linkedPO = targetGrn ? purchaseOrders.find((p) => p && (p.id === targetGrn.poId || (targetGrn.linkedPOs && targetGrn.linkedPOs.includes(p.id)))) : null;
      const poItems = linkedPO?.items || [];
      const baleFabrics = Array.from(new Set((targetGrn?.bales || []).map((b) => b.fabricItemLabel).filter(Boolean)));

      const siblingBatches = [];
      if (poItems.length > 1) {
        poItems.forEach((it, idx) => {
          const sId = `QC-${(targetGrn?.id || qcData.grnRef || '').replace('GRN-', '')}-F${idx + 1}`;
          if (sId !== enrichedQC.id) {
            let sMeters = 0;
            (targetGrn?.bales || []).forEach((b) => {
              const bLbl = (b.fabricItemLabel || '').toLowerCase();
              const itLbl = (it.fabricName || it.fabricQuality || '').toLowerCase();
              if (b.itemIdx === idx || (bLbl && (bLbl.includes(itLbl) || itLbl.includes(bLbl)))) {
                const bLen = (b.pieces || []).reduce((ps, p) => ps + (Number(typeof p === 'object' ? p.length : p) || 0), 0);
                sMeters += bLen > 0 ? bLen : (Number(b.totalLength) || 0);
              }
            });
            if (sMeters <= 0) {
              sMeters = Number(it.quantity) || Math.round((Number(targetGrn?.declaredTotalMeters || targetGrn?.totalQty || 0)) / poItems.length);
            }
            siblingBatches.push({
              id: sId,
              grnRef: targetGrn?.id || qcData.grnRef,
              againstRef: linkedPO?.id || targetGrn?.poId || '',
              fabricName: it.fabricName || it.fabricQuality || `Fabric Quality ${idx + 1}`,
              fabricId: it.fabricId || '',
              colorName: it.color || it.colorName || it.shade || 'Grey / Natural',
              expectedWidth: String(it.width || '44'),
              expectedFold: String(it.fold || '100'),
              totalReceivedMeters: sMeters,
              receivedQty: sMeters,
              qcStatus: 'Pending',
              createdAt: now,
              updatedAt: now,
              dateTime: new Date().toLocaleString('en-GB'),
              createdBy: 'System QC Agent'
            });
          }
        });
      } else if (baleFabrics.length > 1) {
        baleFabrics.forEach((fLbl, idx) => {
          const sId = `QC-${(targetGrn?.id || qcData.grnRef || '').replace('GRN-', '')}-F${idx + 1}`;
          if (sId !== enrichedQC.id) {
            let sMeters = 0;
            (targetGrn?.bales || []).forEach((b) => {
              if (b.fabricItemLabel === fLbl) {
                const bLen = (b.pieces || []).reduce((ps, p) => ps + (Number(typeof p === 'object' ? p.length : p) || 0), 0);
                sMeters += bLen > 0 ? bLen : (Number(b.totalLength) || 0);
              }
            });
            if (sMeters <= 0) {
              sMeters = Math.round((Number(targetGrn?.declaredTotalMeters || targetGrn?.totalQty || 0)) / baleFabrics.length);
            }
            siblingBatches.push({
              id: sId,
              grnRef: targetGrn?.id || qcData.grnRef,
              againstRef: targetGrn?.poId || '',
              fabricName: fLbl,
              expectedWidth: String(targetGrn?.pannaWidth || '44'),
              expectedFold: String(targetGrn?.fabricFolding || '100'),
              totalReceivedMeters: sMeters,
              receivedQty: sMeters,
              qcStatus: 'Pending',
              createdAt: now,
              updatedAt: now,
              dateTime: new Date().toLocaleString('en-GB'),
              createdBy: 'System QC Agent'
            });
          }
        });
      }

      setQualityChecks((prev) => {
        const remaining = prev.filter((q) => q.id !== qcData.originalQcId && q.id !== enrichedQC.id);
        const missingSiblings = siblingBatches.filter((s) => !remaining.some((r) => r.id === s.id));
        missingSiblings.forEach((s) => {
          api.saveQualityCheck(s).catch((e) => console.warn('Sibling QC auto-save error:', e));
        });
        return [enrichedQC, ...missingSiblings, ...remaining];
      });
    } else {
      setQualityChecks((prev) => [enrichedQC, ...prev]);
    }

    api.saveQualityCheck(enrichedQC).catch((e) => console.warn('QC save sync error:', e));
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
      const linkedPO = purchaseOrders.find((p) => p.id === linkedGrn?.poId || (linkedGrn?.linkedPOs && linkedGrn.linkedPOs.includes(p.id)));
      const poItem = linkedPO?.items?.find((it) => it.fabricName === linkedGrn?.fabricName || it.fabricQuality === linkedGrn?.fabricName) || linkedPO?.items?.[0];

      let fabricName = linkedGrn?.fabricName || poItem?.fabricName || poItem?.fabricQuality || 'Fabric Quality';
      const widthVal = qcData.actualWidth ? `${qcData.actualWidth}"` : (qcData.expectedWidth ? `${qcData.expectedWidth}"` : (poItem?.width ? `${poItem.width}"` : '44"'));

      // Check bale label for color if present
      let baleColor = '';
      if (linkedGrn?.bales && Array.isArray(linkedGrn.bales)) {
        for (const b of linkedGrn.bales) {
          const lbl = b.fabricItemLabel || b.fabric || '';
          if (lbl.includes('—')) {
            baleColor = lbl.split('—')[1].trim();
            break;
          } else if (lbl.includes(' - ')) {
            baleColor = lbl.split(' - ')[1].trim();
            break;
          }
        }
      }

      let colorVal = qcData.colorName || linkedGrn?.colorName || baleColor || poItem?.colorName || poItem?.color || '';
      // If it was defaulted to 'White' upstream but PO/GRN had no color specified, do not force 'White'
      if (colorVal.toLowerCase() === 'white' && !poItem?.colorName && !poItem?.color && !linkedGrn?.colorName && !baleColor) {
        colorVal = '';
      }
      if (colorVal === 'Ivory' && (baleColor || poItem?.colorName)) {
        colorVal = baleColor || poItem?.colorName;
      }

      const matchedFabric = fabrics.find((f) => (f.qualityName || f.name)?.toLowerCase() === fabricName.toLowerCase());
      const resolvedFabricId = linkedGrn?.fabricId || matchedFabric?.id || poItem?.fabricId || 'FAB-0001';

      if (!colorVal) {
        const lowerFab = (fabricName || '').toLowerCase();
        if (lowerFab.includes('grey') || lowerFab.includes('greige') || lowerFab.includes('raw') || lowerFab.includes('kora') || lowerFab.includes('undyed')) {
          colorVal = 'Raw / Greige';
        } else {
          colorVal = '';
        }
      }

      // Match hex
      const lowerCol = (colorVal || '').toLowerCase();
      const matchedColor = colors.find((c) => c.name?.toLowerCase() === lowerCol || c.hex?.toLowerCase() === lowerCol);
      let colorHexVal = matchedColor?.hex || linkedGrn?.colorHex || poItem?.colorHex || null;
      if (!colorHexVal) {
        if (lowerCol === 'white') colorHexVal = '#FFFFFF';
        else if (lowerCol === 'ivory') colorHexVal = '#FFFFF0';
        else if (lowerCol.includes('grey') || lowerCol.includes('greige') || lowerCol.includes('natural')) colorHexVal = '#DCD7CE';
        else colorHexVal = colorVal ? '#C86D51' : null;
      }

      const newStockLot = {
        id: `SP-${Date.now()}`,
        fabricId: resolvedFabricId,
        fabricName: fabricName,
        width: widthVal,
        colorId: matchedColor?.id || linkedGrn?.colorId || null,
        colorName: colorVal,
        colorHex: colorHexVal,
        qty: goodMeters,
        source: 'QC approved',
        sourceType: 'GRN',
        poId: linkedGrn?.linkedPOs?.[0] || linkedPO?.id || 'PO-1001',
        grnId: qcData.grnRef,
        decidedAt: new Date().toLocaleDateString('en-GB')
      };

      setStockPool((prev) => [newStockLot, ...prev]);
      addAuditLog('Inward', 'Stock Pool', newStockLot.id, 'Approved Stock Inward', 'None', `${goodMeters}m (${fabricName} - ${colorVal})`);
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

    // 2. Check if decision is an approval / transfer to stock pool
    const isApprovalDecision =
      decision === 'Reversed (treated as good)' ||
      decision === 'Approve' ||
      decision === 'Approved' ||
      decision === 'Accept' ||
      decision === 'Accepted' ||
      decision === 'Transfer to Main Stock Pool' ||
      decision === 'Approve — Add to Stock Pool' ||
      String(decision).toLowerCase().includes('stock pool') ||
      String(decision).toLowerCase().includes('good') ||
      String(decision).toLowerCase().includes('approve');

    if (isApprovalDecision) {
      const newLot = {
        id: `SP-${Date.now()}`,
        fabricId: damagedItem.fabricId || selectedGRN?.fabricId || 'FAB-001',
        fabricName: fabricName,
        width: damagedItem.width || selectedGRN?.width || '42"',
        colorId: damagedItem.colorId || selectedGRN?.colorId || null,
        colorName: damagedItem.colorName || selectedGRN?.colorName || 'Ivory',
        colorHex: damagedItem.colorHex || selectedGRN?.colorHex || '#FFFFF0',
        qty: lotQty,
        source: 'Admin Approved — Added to Stock Pool',
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
            qcStatus: isApprovalDecision ? 'OK' : q.qcStatus
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
              status: isApprovalDecision ? 'QC Approved' : g.status,
              qcStatus: isApprovalDecision ? 'OK' : g.qcStatus,
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
          onNavigateTab={(tab, extra) => {
            if (tab === 'orders' || (typeof tab === 'string' && tab.startsWith('/orders'))) {
              if (onNavigate) {
                onNavigate(tab.startsWith('/') ? tab : '/orders', extra);
              }
              return;
            }
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
              grns={grns}
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
              onViewGRN={handleViewGRN}
            />
          )}

          {activePoView === 'form' && (
            <PurchaseOrderForm
              po={selectedPO}
              vendors={vendors}
              fabrics={fabrics}
              grns={grns}
              qualityChecks={qualityChecks}
              onBack={() => setActivePoView('list')}
              onSavePO={handleSavePO}
              onPrintPO={(po) => {
                setSelectedPO(po);
                setActivePoView('print');
              }}
              onInwardGRN={handleInwardFromPO}
              onViewGRN={handleViewGRN}
              onViewQC={handleViewQC}
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
              qualityChecks={qualityChecks}
              onNewGRN={() => {
                setSelectedGRN(null);
                setActiveGrnView('form');
              }}
              onSelectGRN={(g) => {
                setSelectedGRN(g);
                setActiveGrnView('detail');
              }}
              onEditGRN={(g) => {
                const isLocked = Boolean(
                  g.isQcActioned ||
                  g.isSubmittedToQC ||
                  g.status === 'Completed' ||
                  (g.status && (g.status.includes('QC') || g.status === 'Under QC')) ||
                  (qualityChecks || []).some((q) => q && (q.grnRef === g.id || q.grnId === g.id))
                );
                if (isLocked) {
                  alert(`GRN ${g.id} is locked because it has already been submitted to Quality Check (QC). It cannot be edited.`);
                  setSelectedGRN(g);
                  setActiveGrnView('detail');
                  return;
                }
                setSelectedGRN(g);
                setActiveGrnView('form');
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
                const isLocked = Boolean(
                  !updatedGrn ||
                  updatedGrn.isQcActioned ||
                  updatedGrn.isSubmittedToQC ||
                  updatedGrn.status === 'Completed' ||
                  (updatedGrn.status && (updatedGrn.status.includes('QC') || updatedGrn.status === 'Under QC'))
                );
                if (isLocked) {
                  alert('Receipt details cannot be edited because this GRN has already been submitted to Quality Check (QC).');
                  return;
                }
                const normalized = {
                  ...updatedGrn,
                  lrNumber: updatedGrn.lrNumber || updatedGrn.lrNo || '',
                  lrNo: updatedGrn.lrNumber || updatedGrn.lrNo || ''
                };
                setGrns((prev) => (prev || []).map((g) => (g && g.id === normalized.id ? normalized : g)));
                setSelectedGRN(normalized);
                api.saveGRN(normalized).catch((e) => console.warn('GRN header save sync error:', e));

                // Synchronize linked Quality Checks
                setQualityChecks((prev) =>
                  (prev || []).map((q) => {
                    if (q && q.grnRef === normalized.id) {
                      const updatedQC = {
                        ...q,
                        vendorChallanNo: normalized.vendorChallanNo,
                        vendorInvoiceNo: normalized.vendorInvoiceNo,
                        transporterName: normalized.transporterName,
                        lrNumber: normalized.lrNumber,
                        expectedFold: normalized.foldingCms || normalized.expectedFold || q.expectedFold
                      };
                      api.saveQualityCheck(updatedQC).catch((err) => console.warn('QC sync error:', err));
                      return updatedQC;
                    }
                    return q;
                  })
                );

                addAuditLog('Update', 'GRN', normalized.id, 'GRN Header Details', 'Previous', `Updated Receipt Details (${normalized.vendorChallanNo || normalized.vendorInvoiceNo || normalized.id})`);
              }}
              onEditBales={(g) => {
                const isLocked = Boolean(
                  g.isQcActioned ||
                  g.isSubmittedToQC ||
                  g.status === 'Completed' ||
                  (g.status && (g.status.includes('QC') || g.status === 'Under QC')) ||
                  (qualityChecks || []).some((q) => q && (q.grnRef === g.id || q.grnId === g.id))
                );
                if (isLocked) {
                  alert(`GRN ${g.id} is locked because it has already been submitted to Quality Check (QC). It cannot be edited.`);
                  setSelectedGRN(g);
                  setActiveGrnView('detail');
                  return;
                }
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
                if (onNavigate) onNavigate('/quality-batches');
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
              grns={grns}
              onBack={() => {
                const existsInGrns = selectedGRN && (grns || []).some((g) => g && g.id === selectedGRN.id);
                if (existsInGrns) {
                  setActiveGrnView('detail');
                } else {
                  setSelectedGRN(null);
                  setActiveGrnView('list');
                }
              }}
              onSaveGRN={(grnData, isCompleted) => {
                handleSaveGRN(grnData, isCompleted);
                setSelectedGRN(grnData);
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
              grns={grns}
              purchaseOrders={purchaseOrders}
              damagedItems={rejectedStock}
              onSelectQC={(qc) => {
                setSelectedQC(qc);
                if (qc.qcStatus === 'Pending') {
                  setActiveQcView('form');
                } else {
                  setActiveQcView('detail');
                }
                if (onNavigate) onNavigate('/quality-batches');
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
                if (onNavigate) onNavigate('/goods-inward');
              }}
              onBackToQC={() => {
                setActiveQcView('list');
              }}
              onViewResolveDamaged={(dItem) => {
                setSelectedDamagedItem(dItem);
                setActiveQcView('damaged');
              }}
              onViewStockPool={(stockTarget) => {
                setSelectedStockGroupKey(stockTarget || null);
                setActiveTab('stock_pool');
                if (onNavigate) onNavigate('/stock-pool');
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
              onNavigateToStockPool={(stockTarget) => {
                setSelectedStockGroupKey(stockTarget || null);
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
          grns={grns}
          purchaseOrders={purchaseOrders}
          qualityChecks={qualityChecks}
          colors={colors}
          fabrics={fabrics}
          selectedGroupKey={selectedStockGroupKey}
          onSelectGroupKey={(k) => setSelectedStockGroupKey(k)}
          onNavigateToGRN={(grnIdOrLot) => {
            const rawId = typeof grnIdOrLot === 'string' ? grnIdOrLot : (grnIdOrLot?.grnId || grnIdOrLot?.grnRef || grnIdOrLot?.id);
            const cleanId = String(rawId || '').replace('GRN-', '').trim();

            let targetGrn = grns.find((g) => g && (
              g.id === rawId ||
              g.id === `GRN-${cleanId}` ||
              (cleanId && g.id.includes(cleanId))
            ));

            if (!targetGrn && grnIdOrLot) {
              const poRef = typeof grnIdOrLot === 'object' ? (grnIdOrLot.poId || 'PO-1001') : 'PO-1001';
              const fabName = typeof grnIdOrLot === 'object' ? (grnIdOrLot.fabricName || 'Modal Satin Premium') : 'Modal Satin Premium';
              const vendor = typeof grnIdOrLot === 'object' ? (grnIdOrLot.vendorName || 'M.S. Textiles') : 'M.S. Textiles';
              targetGrn = {
                id: rawId?.startsWith('GRN-') ? rawId : `GRN-${rawId || '9237'}`,
                poId: poRef,
                linkedPOs: [poRef],
                vendorName: vendor,
                fabricName: fabName,
                date: '2026-10-07',
                status: 'QC Approved',
                totalMetersEntered: typeof grnIdOrLot === 'object' ? (Number(grnIdOrLot.qty) || 2000) : 2000,
                declaredTotalMeters: typeof grnIdOrLot === 'object' ? (Number(grnIdOrLot.qty) || 2000) : 2000,
                bales: []
              };
            }

            if (targetGrn) setSelectedGRN(targetGrn);
            setActiveGrnView('detail');
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
          onTransferToStock={(tr) => {
            const itemsToAdd = (tr.itemsIncluded || []).map((it, idx) => ({
              id: `SP-TR-${Date.now()}-${idx}`,
              fabricId: it.fabricId || 'FAB-001',
              fabricName: it.fabricName || 'Transferred Fabric',
              width: it.width || '42"',
              colorId: it.colorId || null,
              colorName: it.colorName || 'Greige',
              colorHex: it.colorHex || '#CBD5E1',
              qty: Number(it.quantity) || 0,
              source: `Transferred from Rejected (${tr.targetGrade || 'Stock'})`,
              sourceType: 'Stock Transfer',
              poId: it.poRef || 'PO-0001',
              grnId: it.grnRef || 'GRN-0001',
              decidedAt: new Date().toLocaleDateString('en-GB')
            }));

            if (itemsToAdd.length > 0) {
              setStockPool((prev) => [...itemsToAdd, ...prev]);
            }
            addAuditLog('Update', 'Stock Ledger', 'Stock Pool', 'Transfer from Rejected', 'Defective', tr.targetGrade);
          }}
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
          onDeleteVendor={(id) => {
            setVendors((prev) => prev.filter((item) => item.id !== id));
            api.deleteVendor(id).catch((e) => console.warn('Vendor delete sync error:', e));
            addAuditLog('Delete', 'Vendor Master', id, 'Vendor Details', 'Record', id);
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
          onDeleteFabric={(id) => {
            setFabrics((prev) => prev.filter((item) => item.id !== id));
            api.deleteFabric(id).catch((e) => console.warn('Fabric delete sync error:', e));
            addAuditLog('Delete', 'Fabric Master', id, 'Fabric Quality', 'Record', id);
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
          onDeleteTransporter={(id) => {
            setTransporters((prev) => prev.filter((item) => item.id !== id));
            api.deleteTransporter(id).catch((e) => console.warn('Transporter delete sync error:', e));
            addAuditLog('Delete', 'Transporter Master', id, 'Logistics Carrier', 'Record', id);
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
