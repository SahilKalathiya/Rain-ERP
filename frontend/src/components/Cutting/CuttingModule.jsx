import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  createEmptyCuttingPORecord,
  generateNextCuttingPONumber,
  getActiveArticlesList,
  getArticleConsumptionMetrics,
  getArticleCuttingStats,
  getChecklistCount,
  getERPDesignCatalog,
  getResolvedColorObj,
  getResolvedLotObj,
  getResolvedStyleObj,
  getStoredCuttingRecords,
  getStoredOldFabricStock,
  isChecklistComplete,
  saveStoredCuttingRecords,
  saveStoredOldFabricStock
} from '../../data/cuttingData';

import Step1LotTally from './Step1LotTally';
import Step2CuttingPO from './Step2CuttingPO';
import Step3ChecklistGate from './Step3ChecklistGate';
import Step4CuttingSheet from './Step4CuttingSheet';
import Step5ConsumptionStock from './Step5ConsumptionStock';
import {
  CuttingPrintModal,
  ProcessFlowchartModal,
  SavedPOView
} from './CuttingModals';

const WORKFLOW_STEPS = [
  { id: 1, short: '1. Lot & Tally', icon: 'ti ti-ruler-measure', role: 'Checking Master' },
  { id: 2, short: '2. Cutting PO (P1)', icon: 'ti ti-file-text', role: 'Merchandiser' },
  { id: 3, short: '3. Checklist Gate', icon: 'ti ti-list-check', role: 'Hard Gate' },
  { id: 4, short: '4. Cutting Sheet', icon: 'ti ti-layers-intersect', role: 'Cutting Master' },
  { id: 5, short: '5 & 6. Consumption & Stock', icon: 'ti ti-chart-pie', role: 'Admin & Store' }
];

const TAB_TO_ROUTE = {
  1: '/cutting-tally',
  2: '/cutting-orders',
  3: '/cutting-checklist',
  4: '/cutting-sheet',
  5: '/cutting-consumption'
};

/**
 * CuttingModule - Module 4: Cutting & Consumption Portal (Steps 1–6)
 * Strictly adheres to Raindrop ERP theme & Zero Pre-Fill policy.
 */
export default function CuttingModule({ initialTab = 2, currentRoute = '/cutting-orders', onNavigate }) {
  const keepFormOpenRef = useRef(false);
  const [records, setRecords] = useState(getStoredCuttingRecords);
  const [draftNewRec, setDraftNewRec] = useState(null);
  const [oldFabricStock, setOldFabricStock] = useState(getStoredOldFabricStock);
  const [activeRecordId, setActiveRecordId] = useState(() => {
    const initial = getStoredCuttingRecords();
    return initial.length > 0 ? initial[0].id : null;
  });

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showFormView, setShowFormView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isSavedViewMode, setIsSavedViewMode] = useState(false);
  const [userRole, setUserRole] = useState('All');
  const [showFlowchartModal, setShowFlowchartModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Sync tab when sidebar route changes
  useEffect(() => {
    const keepOpen = keepFormOpenRef.current;
    keepFormOpenRef.current = false;

    if (currentRoute.includes('tally')) {
      setActiveTab(1);
      if (records.length > 0 || keepOpen) setShowFormView(true);
    } else if (currentRoute.includes('checklist')) {
      setActiveTab(3);
      setShowFormView(keepOpen);
    } else if (currentRoute.includes('sheet')) {
      setActiveTab(4);
      setShowFormView(keepOpen);
    } else if (currentRoute.includes('consumption') || currentRoute.includes('old-stock')) {
      setActiveTab(5);
      setShowFormView(keepOpen);
    } else {
      setActiveTab(2);
      setShowFormView(keepOpen);
    }
    if (!keepOpen) setDraftNewRec(null);
    setIsSavedViewMode(false);
  }, [currentRoute]);

  const syncSidebarForTab = (tabId, keepFormOpen = true) => {
    const targetRoute = TAB_TO_ROUTE[tabId];
    if (targetRoute && onNavigate && targetRoute !== currentRoute) {
      keepFormOpenRef.current = keepFormOpen;
      onNavigate(targetRoute);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const erpCatalog = useMemo(() => getERPDesignCatalog(), [records.length]);
  const activeRec = useMemo(
    () => draftNewRec || records.find((r) => r.id === activeRecordId) || null,
    [draftNewRec, records, activeRecordId]
  );

  const styleObj = useMemo(() => getResolvedStyleObj(activeRec, erpCatalog), [activeRec, erpCatalog]);
  const colorObj = useMemo(() => getResolvedColorObj(activeRec, styleObj), [activeRec, styleObj]);
  const lotObj = useMemo(() => getResolvedLotObj(activeRec, colorObj), [activeRec, colorObj]);

  const updateRecordsState = (nextRecords) => {
    setRecords(nextRecords);
    saveStoredCuttingRecords(nextRecords);
  };

  const handleUpdateActiveRec = (patch) => {
    if (!activeRec) return;
    if (draftNewRec && activeRec.id === draftNewRec.id) {
      setDraftNewRec((prev) => (prev ? { ...prev, ...patch } : prev));
      return;
    }
    const nextRecords = records.map((r) => (r.id === activeRec.id ? { ...r, ...patch } : r));
    updateRecordsState(nextRecords);
  };

  const handleCreateBlankPO = () => {
    const newPoNumber = generateNextCuttingPONumber(records);
    const blankRec = createEmptyCuttingPORecord(newPoNumber);
    setDraftNewRec(blankRec);
    setIsSavedViewMode(false);
    setActiveTab(2);
    setShowFormView(true);
    showToast(`Started new Cutting PO ${newPoNumber}. Select a Design / Style and Save to add to list.`, 'info');
  };

  const handleOpenRecord = (recordId, tabId = 2) => {
    setDraftNewRec(null);
    const targetRec = records.find((r) => r.id === recordId);
    if (tabId > 3 && targetRec && !isChecklistComplete(targetRec)) {
      showToast(
        'HARD GATE BLOCKED (Step 3): Both Marking Master & Checking Master must mark all checklist items OK and accept PO first.',
        'warning'
      );
      setActiveRecordId(recordId);
      setIsSavedViewMode(false);
      setActiveTab(3);
      setShowFormView(true);
      syncSidebarForTab(3, true);
      return;
    }
    setActiveRecordId(recordId);
    setIsSavedViewMode(false);
    setActiveTab(tabId);
    setShowFormView(true);
  };

  const handleDeleteRecord = (e, recordId, poNum) => {
    e.stopPropagation();
    if (!window.confirm(`Delete Cutting PO ${poNum || ''}?`)) return;
    const nextRecords = records.filter((r) => r.id !== recordId);
    updateRecordsState(nextRecords);
    if (activeRecordId === recordId) {
      setActiveRecordId(nextRecords.length > 0 ? nextRecords[0].id : null);
    }
    showToast(`Deleted Cutting PO ${poNum || ''}.`, 'info');
  };

  const handleSwitchTab = (tabId) => {
    if (!activeRec) return;
    if (tabId > 3 && !isChecklistComplete(activeRec)) {
      showToast(
        'HARD GATE BLOCKED (Step 3): Both Marking Master & Checking Master must mark all checklist items OK and accept PO first.',
        'warning'
      );
      setActiveTab(3);
      setIsSavedViewMode(false);
      syncSidebarForTab(3, true);
      return;
    }
    setIsSavedViewMode(false);
    setActiveTab(tabId);
    syncSidebarForTab(tabId, true);
  };

  const handleSavePO = (advanceToGate) => {
    if (!activeRec) return;
    if (!activeRec.selectedStyle || !activeRec.selectedColor || !activeRec.selectedLotId) {
      showToast('Please select Design / Style, Color, and Fabric Lot before saving the PO.', 'error');
      return;
    }
    if (!activeRec.selectedSizes?.length || (Number(activeRec.garmentsToCut) || 0) <= 0) {
      showToast('Please select at least one size and enter a garment quantity greater than 0.', 'error');
      return;
    }
    const arts = getActiveArticlesList(activeRec, styleObj);
    const nextLabel = `${activeRec.poNumber} · ${activeRec.selectedStyle} (${arts.join(' + ')})`;
    if (draftNewRec && activeRec.id === draftNewRec.id) {
      const savedRec = {
        ...activeRec,
        poStatus: 'Saved & Issued',
        label: nextLabel
      };
      const nextRecords = [savedRec, ...records];
      updateRecordsState(nextRecords);
      setActiveRecordId(savedRec.id);
      setDraftNewRec(null);
    } else {
      handleUpdateActiveRec({
        poStatus: 'Saved & Issued',
        label: nextLabel
      });
    }

    if (advanceToGate) {
      setIsSavedViewMode(false);
      setActiveTab(3);
      setShowFormView(true);
      syncSidebarForTab(3, true);
      showToast(`Saved ${activeRec.poNumber}! Proceeding to Step 3: Dual-Master Checklist Gate.`, 'success');
    } else {
      setIsSavedViewMode(false);
      setShowFormView(false);
      showToast(`Cutting PO ${activeRec.poNumber} saved!`, 'success');
    }
  };

  const handleProceedFromChecklist = () => {
    if (!activeRec || !isChecklistComplete(activeRec)) return;
    handleUpdateActiveRec({ poStatus: 'Checklist Accepted' });
    setActiveTab(4);
    syncSidebarForTab(4, true);
    showToast('Gate Passed! Opening Step 4: Layer-by-Layer Cutting Sheet.', 'success');
  };

  const handleProceedFromCuttingSheet = () => {
    if (!activeRec) return;
    const hasCutData = (activeRec.layers || []).some((l) => (parseInt(l.pallaQty, 10) || 0) > 0 && (parseFloat(l.layerLength) || 0) > 0);
    if (hasCutData) {
      handleUpdateActiveRec({ poStatus: 'Cutting Completed' });
    }
    handleSwitchTab(5);
  };

  const handleTransferToOldStock = (art, physicalUsable, dateStr) => {
    if (!activeRec) return;
    const lotId = lotObj ? lotObj.lotId : 'LOT';
    const existingIdx = oldFabricStock.findIndex(
      (x) => x.poNumber === activeRec.poNumber && x.lotId === lotId && x.article === art
    );
    const entry = {
      id: existingIdx >= 0
        ? oldFabricStock[existingIdx].id
        : `OLD-STK-${String(oldFabricStock.length + 1).padStart(2, '0')}`,
      date: dateStr || new Date().toISOString().slice(0, 10),
      poNumber: activeRec.poNumber,
      article: art,
      style: `${activeRec.selectedStyle} (${art})`,
      color: activeRec.selectedColor,
      lotId,
      usableMeters: Number(physicalUsable || 0),
      width: activeRec.fabricWidthInput
    };
    const nextStock =
      existingIdx >= 0
        ? oldFabricStock.map((x, idx) => (idx === existingIdx ? entry : x))
        : [entry, ...oldFabricStock];
    setOldFabricStock(nextStock);
    saveStoredOldFabricStock(nextStock);
    showToast(`Transferred ${Number(physicalUsable || 0).toFixed(2)} m usable balance into Old Fabric Stock Ledger.`, 'success');
  };

  const oldStockSum = oldFabricStock.reduce((s, i) => s + (parseFloat(i.usableMeters) || 0), 0);

  return (
    <div className="p-4" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`alert ${toast.type === 'success'
            ? 'alert-success'
            : toast.type === 'warning'
              ? 'alert-warning'
              : toast.type === 'error'
                ? 'alert-danger'
                : 'alert-primary'
            } shadow position-fixed bottom-0 end-0 m-4 d-flex align-items-center gap-2 fs-12 fw-semibold`}
          style={{ zIndex: 1080, maxWidth: 440 }}
        >
          <i className="ti ti-info-circle fs-16"></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Context & Action Bar */}
      <div className="card border-0 shadow-sm p-3 mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            {showFormView && (
              <button
                type="button"
                className="btn btn-light btn-sm border d-flex align-items-center gap-1 fw-semibold"
                onClick={() => {
                  setDraftNewRec(null);
                  setShowFormView(false);
                  setIsSavedViewMode(false);
                }}
              >
                <i className="ti ti-arrow-left fs-14"></i>
                <span>Back to List</span>
              </button>
            )}
            <h4 className="fw-bold text-dark mb-0 fs-18">
              {activeTab === 3
                ? 'Checklist Gate — Pre-Layer Verification'
                : activeTab === 4
                  ? 'Cutting Sheet — Layer & Garment Cut'
                  : activeTab === 5
                    ? 'Consumption & Stock Reconciliation'
                    : 'Cutting & Consumption Portal'}
            </h4>
          </div>
        </div>
      </div>

      {/* Main Content: List View (Module 3 Style) vs Inside Form View */}
      {!showFormView ? (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          {/* Controls Bar */}
          <div className="card-header bg-white py-3 px-4 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '600px' }}>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <i className="ti ti-search fs-14"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 fs-13"
                  placeholder={
                    activeTab === 3
                      ? 'Search Checklist by Cutting PO #, style, color, lot...'
                      : activeTab === 4
                        ? 'Search Cutting Sheet by Cutting PO #, style, color, lot...'
                        : activeTab === 5
                          ? 'Search Consumption & Stock by Cutting PO #, style, color...'
                          : 'Search Cutting PO #, style, color, lot...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="form-select form-select-sm fs-13"
                style={{ width: '175px', borderColor: '#cbd5e1' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Saved & Issued">Saved &amp; Issued</option>
                <option value="Checklist Accepted">Checklist Accepted</option>
                <option value="Cutting Completed">Cutting Completed</option>
                <option value="Closed">Closed</option>
                <option value="Saved & Accepted">Saved &amp; Accepted</option>
              </select>
            </div>

            {activeTab === 2 && (
              <button
                type="button"
                className="btn btn-primary btn-sm px-3 shadow-xs d-flex align-items-center gap-1.5 rounded-2"
                style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                onClick={handleCreateBlankPO}
              >
                <i className="ti ti-plus fs-14"></i>
                <span className="fw-semibold">New Cutting PO</span>
              </button>
            )}
            {activeTab === 5 && (
              <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 font-monospace fs-12">
                Old Fabric Stock Ledger: {oldStockSum.toFixed(2)} m
              </span>
            )}
          </div>

          <div className="p-0">
            <table className="table table-hover align-middle mb-0 w-100" style={{ fontSize: '13px' }}>
              <thead className="table-light">
                {activeTab === 3 ? (
                  <tr className="text-secondary fs-11 fw-bold text-uppercase">
                    <th className="ps-4">Cutting PO #</th>
                    <th>Design / Style</th>
                    <th>Color</th>
                    <th>Fabric Lot</th>
                    <th className="text-center">Checklist Ticks</th>
                    <th className="text-center">Master Accept</th>
                    <th>Gate Status</th>
                    <th className="text-end pe-4">Action</th>
                  </tr>
                ) : activeTab === 4 ? (
                  <tr className="text-secondary fs-11 fw-bold text-uppercase">
                    <th className="ps-4">Cutting PO #</th>
                    <th>Design / Style</th>
                    <th>Color</th>
                    <th>Articles</th>
                    <th className="text-end">Layers</th>
                    <th className="text-end">Cut / Target (Pcs)</th>
                    <th className="text-end">Layer Fabric (m)</th>
                    <th>Sheet Status</th>
                    <th className="text-end pe-4">Action</th>
                  </tr>
                ) : activeTab === 5 ? (
                  <tr className="text-secondary fs-11 fw-bold text-uppercase">
                    <th className="ps-4">Cutting PO #</th>
                    <th>Design / Style</th>
                    <th>Color</th>
                    <th className="text-end">Available (m)</th>
                    <th className="text-end">Total Used (m)</th>
                    <th className="text-end">Remaining (m)</th>
                    <th className="text-end">Wastage %</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Action</th>
                  </tr>
                ) : (
                  <tr className="text-secondary fs-11 fw-bold text-uppercase">
                    <th className="ps-4">Cutting PO #</th>
                    <th>Design / Style</th>
                    <th>Color</th>
                    <th>Fabric Lot</th>
                    <th>Articles</th>
                    <th className="text-end">Qty (Pcs)</th>
                    <th className="text-end">Fabric (m)</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {(() => {
                  const filteredList = records.filter((r) => {
                    const term = searchTerm.trim().toLowerCase();
                    const matchesSearch = !term ||
                      (r.poNumber && r.poNumber.toLowerCase().includes(term)) ||
                      (r.selectedStyle && r.selectedStyle.toLowerCase().includes(term)) ||
                      (r.selectedColor && r.selectedColor.toLowerCase().includes(term)) ||
                      (r.selectedLotId && r.selectedLotId.toLowerCase().includes(term));
                    const st = r.poStatus || 'Draft';
                    const matchesStatus = statusFilter === 'ALL' || st === statusFilter;
                    return matchesSearch && matchesStatus;
                  });
                  if (filteredList.length === 0) {
                    return (
                      <tr>
                        <td colSpan={9} className="text-center py-5 text-muted">
                          No Cutting POs found. Click <strong>+ New Cutting PO</strong> to create one.
                        </td>
                      </tr>
                    );
                  }
                  return filteredList.map((r) => {
                    const st = r.poStatus || 'Draft';
                    const recStyleObj = getResolvedStyleObj(r, erpCatalog);
                    const recArts = getActiveArticlesList(r, recStyleObj);
                    const primaryArt = recArts[0];
                    const gateDone = isChecklistComplete(r);
                    const ticksCount = getChecklistCount(r);

                    if (activeTab === 3) {
                      return (
                        <tr
                          key={r.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleOpenRecord(r.id, 3)}
                        >
                          <td className="ps-4">
                            <span className="badge bg-light text-dark border font-monospace fs-12 px-2 py-1">
                              {r.poNumber}
                            </span>
                          </td>
                          <td className="fw-bold text-dark">{r.selectedStyle || '—'}</td>
                          <td>{r.selectedColor || '—'}</td>
                          <td className="font-monospace fs-12 text-secondary">{r.selectedLotId || '—'}</td>
                          <td className="text-center font-monospace fw-bold">
                            <span className={ticksCount === 14 ? 'text-success' : 'text-secondary'}>
                              {ticksCount} / 14 Ticks
                            </span>
                          </td>
                          <td className="text-center">
                            {r.checklist?.acceptedByCuttingMaster ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle fs-11">
                                Signed OK
                              </span>
                            ) : (
                              <span className="badge bg-light text-secondary border fs-11">Pending</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge fs-11 ${gateDone
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                              }`}>
                              {gateDone ? 'Gate Unlocked' : 'Locked'}
                            </span>
                          </td>
                          <td className="text-end pe-4">
                            <button
                              type="button"
                              className="btn btn-light border btn-xs px-2.5 py-1 text-primary fw-semibold"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRecord(r.id, 3);
                              }}
                            >
                              Open Checklist →
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    if (activeTab === 4) {
                      const layerCount = (r.layers || []).length;
                      const cutSummary = recArts.reduce(
                        (acc, art) => {
                          const s = getArticleCuttingStats(art, r, recStyleObj);
                          acc.meters += s.totalLayerMeters;
                          acc.pcs += s.totalGarmentsCut;
                          return acc;
                        },
                        { meters: 0, pcs: 0 }
                      );
                      const targetPcs = Number(r.garmentsToCut || 0) * Math.max(1, recArts.length);
                      return (
                        <tr
                          key={r.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleOpenRecord(r.id, 4)}
                        >
                          <td className="ps-4">
                            <span className="badge bg-light text-dark border font-monospace fs-12 px-2 py-1">
                              {r.poNumber}
                            </span>
                          </td>
                          <td className="fw-bold text-dark">{r.selectedStyle || '—'}</td>
                          <td>{r.selectedColor || '—'}</td>
                          <td className="fs-12 text-secondary">
                            {recArts.length > 0 ? recArts.join(' + ') : '—'}
                          </td>
                          <td className="text-end font-monospace fw-bold">{layerCount}</td>
                          <td className="text-end font-monospace fw-bold">
                            <span className={cutSummary.pcs > 0 ? 'text-primary' : 'text-secondary'}>
                              {cutSummary.pcs}
                            </span>
                            <span className="text-muted fw-normal"> / {targetPcs}</span>
                          </td>
                          <td className="text-end font-monospace fw-bold text-success">
                            {cutSummary.meters.toFixed(2)} m
                          </td>
                          <td>
                            <span className={`badge fs-11 ${gateDone
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                              }`}>
                              {gateDone ? 'Ready / Open' : 'Checklist Pending'}
                            </span>
                          </td>
                          <td className="text-end pe-4">
                            <button
                              type="button"
                              className="btn btn-light border btn-xs px-2.5 py-1 text-primary fw-semibold"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRecord(r.id, 4);
                              }}
                            >
                              Open Sheet →
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    if (activeTab === 5) {
                      const cm = primaryArt && recStyleObj
                        ? getArticleConsumptionMetrics(primaryArt, r, recStyleObj)
                        : { totalFabricAvailable: 0, grandTotalAllFabricUsed: 0, systemFinalRemaining: 0, wastagePercentOfReceived: 0 };
                      return (
                        <tr
                          key={r.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleOpenRecord(r.id, 5)}
                        >
                          <td className="ps-4">
                            <span className="badge bg-light text-dark border font-monospace fs-12 px-2 py-1">
                              {r.poNumber}
                            </span>
                          </td>
                          <td className="fw-bold text-dark">{r.selectedStyle || '—'}</td>
                          <td>{r.selectedColor || '—'}</td>
                          <td className="text-end font-monospace fw-bold">{cm.totalFabricAvailable.toFixed(2)} m</td>
                          <td className="text-end font-monospace fw-bold text-primary">{cm.grandTotalAllFabricUsed.toFixed(2)} m</td>
                          <td className="text-end font-monospace fw-bold text-success">{cm.systemFinalRemaining.toFixed(2)} m</td>
                          <td className="text-end font-monospace fw-bold">
                            <span className={cm.wastagePercentOfReceived > 3 ? 'text-danger' : 'text-success'}>
                              {cm.wastagePercentOfReceived.toFixed(2)}%
                            </span>
                          </td>
                          <td>
                            <span className={`badge fs-11 ${gateDone
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                              }`}>
                              {gateDone ? st : 'Checklist Pending'}
                            </span>
                          </td>
                          <td className="text-end pe-4">
                            <button
                              type="button"
                              className="btn btn-light border btn-xs px-2.5 py-1 text-primary fw-semibold"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRecord(r.id, 5);
                              }}
                            >
                              Open Stock →
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={r.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenRecord(r.id, activeTab)}
                      >
                        <td className="ps-4">
                          <span className="badge bg-light text-dark border font-monospace fs-12 px-2 py-1">
                            {r.poNumber}
                          </span>
                        </td>
                        <td className="fw-bold text-dark">{r.selectedStyle || '—'}</td>
                        <td>{r.selectedColor || '—'}</td>
                        <td className="font-monospace fs-12 text-secondary">{r.selectedLotId || '—'}</td>
                        <td className="fs-12 text-secondary">
                          {Array.isArray(r.selectedArticles) && r.selectedArticles.length > 0 ? r.selectedArticles.join(' + ') : '—'}
                        </td>
                        <td className="text-end font-monospace fw-bold">
                          {Number(r.garmentsToCut || 0)}
                        </td>
                        <td className="text-end font-monospace fw-bold text-success">
                          {Number(r.fabricToIssue || 0).toFixed(2)} m
                        </td>
                        <td>
                          <span className={`badge fs-11 ${st === 'Closed'
                            ? 'bg-secondary-subtle text-dark border border-secondary-subtle'
                            : st === 'Cutting Completed' || st === 'Saved & Accepted'
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : st === 'Checklist Accepted'
                                ? 'bg-info-subtle text-info-emphasis border border-info-subtle'
                                : st === 'Saved & Issued'
                                  ? 'bg-primary-subtle text-primary border border-primary-subtle'
                                  : 'bg-light text-secondary border'
                            }`}>
                            {st}
                          </span>
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-inline-flex align-items-center gap-1">
                            {st === 'Closed' && (
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-xs px-2 py-1 fw-semibold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!window.confirm(`Re-open Cutting PO ${r.poNumber}?`)) return;
                                  const nextRecords = records.map((item) =>
                                    item.id === r.id
                                      ? {
                                          ...item,
                                          poStatus: item.previousStatusBeforeClose || 'Checklist Accepted',
                                          reopenedAt: new Date().toISOString()
                                        }
                                      : item
                                  );
                                  updateRecordsState(nextRecords);
                                  showToast(`Re-opened Cutting PO ${r.poNumber}.`, 'success');
                                }}
                                title="Re-open Closed PO"
                              >
                                Re-open
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-light border btn-xs px-2 py-1 text-primary fw-semibold"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRecord(r.id, activeTab);
                              }}
                              title="Open / Edit Cutting PO"
                            >
                              <i className="ti ti-edit fs-13"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-light border btn-xs px-2 py-1 text-danger"
                              onClick={(e) => handleDeleteRecord(e, r.id, r.poNumber)}
                              title="Delete Cutting PO"
                            >
                              <i className="ti ti-trash fs-13"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      ) : !activeRec ? (
        <div className="card border-0 shadow-sm p-5 text-center mx-auto" style={{ maxWidth: 560 }}>
          <div
            className="rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center mx-auto mb-3"
            style={{ width: 56, height: 56 }}
          >
            <i className="ti ti-scissors fs-24"></i>
          </div>
          <h5 className="fw-bold text-dark mb-1">No Cutting POs Created Yet</h5>
          <p className="text-secondary fs-13 mb-4">
            Start a blank Cutting PO (P1) to tally dyed fabric lots, verify the Dual-Master Checklist, record cutting layers, and reconcile fabric consumption.
          </p>
          <div className="d-flex justify-content-center">
            <button
              type="button"
              onClick={handleCreateBlankPO}
              className="btn btn-primary btn-sm px-4 py-2 fw-semibold d-flex align-items-center gap-2"
            >
              <i className="ti ti-plus fs-15"></i>
              <span>Create First Cutting PO</span>
            </button>
          </div>
        </div>
      ) : isSavedViewMode ? (
        <SavedPOView
          rec={activeRec}
          styleObj={styleObj}
          colorObj={colorObj}
          lotObj={lotObj}
          onEditRecord={() => setIsSavedViewMode(false)}
          onOpenStep={(stepId) => handleSwitchTab(stepId)}
          onOpenPrintModal={() => setShowPrintModal(true)}
        />
      ) : (
        <>
          {activeTab === 1 && (
            <Step1LotTally
              rec={activeRec}
              styleObj={styleObj}
              colorObj={colorObj}
              lotObj={lotObj}
              onUpdateRec={handleUpdateActiveRec}
              onProceedToStep2={() => handleSwitchTab(2)}
              showToast={showToast}
            />
          )}
          {activeTab === 2 && (
            <Step2CuttingPO
              rec={activeRec}
              erpCatalog={erpCatalog}
              styleObj={styleObj}
              colorObj={colorObj}
              lotObj={lotObj}
              onUpdateRec={handleUpdateActiveRec}
              onCreateBlankPO={handleCreateBlankPO}
              onSavePO={handleSavePO}
              showToast={showToast}
            />
          )}
          {activeTab === 3 && (
            <Step3ChecklistGate
              rec={activeRec}
              onUpdateRec={handleUpdateActiveRec}
              onProceedToStep4={handleProceedFromChecklist}
              showToast={showToast}
            />
          )}
          {activeTab === 4 && (
            <Step4CuttingSheet
              rec={activeRec}
              styleObj={styleObj}
              colorObj={colorObj}
              userRole={userRole}
              onUpdateRec={handleUpdateActiveRec}
              onProceedToStep5={handleProceedFromCuttingSheet}
              showToast={showToast}
            />
          )}
          {activeTab === 5 && (
            <Step5ConsumptionStock
              rec={activeRec}
              styleObj={styleObj}
              colorObj={colorObj}
              lotObj={lotObj}
              oldFabricStock={oldFabricStock}
              onUpdateRec={handleUpdateActiveRec}
              onTransferToOldStock={handleTransferToOldStock}
              onOpenPrintModal={() => setShowPrintModal(true)}
            />
          )}
        </>
      )}

      {/* Modals */}
      {showFlowchartModal && activeRec && (
        <ProcessFlowchartModal
          rec={activeRec}
          onClose={() => setShowFlowchartModal(false)}
        />
      )}
      {showPrintModal && activeRec && (
        <CuttingPrintModal
          rec={activeRec}
          styleObj={styleObj}
          colorObj={colorObj}
          lotObj={lotObj}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
