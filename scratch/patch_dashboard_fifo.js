const fs = require('fs');

const file = 'frontend/src/components/Procurement/ProcurementDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update import
content = content.replace(
  "import { getMetersForPoFromGrn } from '../../utils/procurementUtils';",
  "import { getMetersForPoFromGrn, calculateFifoPoAllocations } from '../../utils/procurementUtils';"
);

// 2. In handleSaveGRN, calculate FIFO allocations and update POs
const targetSection = `    const enrichedGRN = {
      ...grnData,
      declaredTotalMeters: resolvedDecMeters,
      totalQty: resolvedDecMeters > 0 ? String(resolvedDecMeters) : (grnData.totalQty || ''),
      totalMetersEntered: liveEntered > 0 ? liveEntered : (grnData.totalMetersEntered || resolvedDecMeters),
      createdAt: grnData.createdAt || (isEdit ? grns.find((g) => g.id === grnData.id)?.createdAt : null) || now,
      updatedAt: now
    };
    let updated;
    if (isEdit) {
      updated = grns.map((g) => (g.id === enrichedGRN.id ? enrichedGRN : g));
      addAuditLog('Update', 'GRN', enrichedGRN.id, 'GRN Progress', 'Draft', enrichedGRN.status);
    } else {
      updated = [enrichedGRN, ...grns];
      addAuditLog('Create', 'GRN', enrichedGRN.id, 'Inward Delivery', 'None', \`\${enrichedGRN.id} (\${enrichedGRN.totalMetersEntered}m)\`);
    }
    setGrns(updated);
    api.saveGRN(enrichedGRN).catch((e) => console.warn('GRN save sync error:', e));

    // Requirement 51: A GRN is appearing in the QC Inspection queue even though it has not yet been submitted for QC.
    // QC records must ONLY exist if the GRN has been explicitly submitted to QC!
    const isExplicitlySubmitted = Boolean(
      isCompleted &&
      enrichedGRN.isSubmittedToQC === true &&
      !['Draft', 'Bale Entry in Progress', 'Header Saved'].includes(enrichedGRN.status)
    );

    if (!isExplicitlySubmitted) {
      // Purge any QC records for this unsubmitted GRN
      setQualityChecks((prev) => (prev || []).filter((q) => {
        if (!q) return false;
        return normGrnId(q.grnRef) !== normGrnId(enrichedGRN.id);
      }));
      setSelectedGRN(enrichedGRN);
      if (shouldExitToList) {
        setActiveGrnView('list');
        setActiveTab('grn');
      }
      return;
    }

    // Point 26: Update Linked PO Status (Partial Delivery vs Full Delivery across ALL linked POs)
    const targetLinkedPoIds = (enrichedGRN.linkedPOs && enrichedGRN.linkedPOs.length > 0)
      ? enrichedGRN.linkedPOs
      : (enrichedGRN.poId ? [enrichedGRN.poId] : []);

    if (targetLinkedPoIds.length > 0) {
      targetLinkedPoIds.forEach((linkedPoId) => {
        const targetPo = purchaseOrders.find((p) => p.id === linkedPoId);
        if (targetPo) {
          const poOrderedMeters = (targetPo.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
          const allGrnsForPo = updated.filter((g) => g && (
            (g.linkedPOs && g.linkedPOs.includes(linkedPoId)) ||
            g.poId === linkedPoId
          ));

          let totalReceivedForPo = 0;
          allGrnsForPo.forEach((g) => {
            totalReceivedForPo += getMetersForPoFromGrn(g, linkedPoId, targetPo.items);
          });

          let newPoStatus = targetPo.status;
          if (totalReceivedForPo >= poOrderedMeters && poOrderedMeters > 0) {
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
      });
    }`;

const replacementSection = `    // Requirement 57: Calculate FIFO poAllocations across linked POs
    const targetLinkedPoIds = (grnData.linkedPOs && grnData.linkedPOs.length > 0)
      ? grnData.linkedPOs
      : (grnData.poId ? [grnData.poId] : []);

    let poAllocations = grnData.poAllocations || {};
    if (targetLinkedPoIds.length > 1) {
      const linkedPoObjs = targetLinkedPoIds
        .map((id) => purchaseOrders.find((p) => p && String(p.id).trim() === String(id).trim()))
        .filter(Boolean);
      const priorGrns = grns.filter((g) => g && g.id !== grnData.id);
      const fifoAllocs = calculateFifoPoAllocations(linkedPoObjs, liveEntered > 0 ? liveEntered : resolvedDecMeters, priorGrns);
      poAllocations = {};
      fifoAllocs.forEach((a) => {
        poAllocations[a.poId] = a.allocatedInThisGrn;
      });
    }

    const enrichedGRN = {
      ...grnData,
      poAllocations: Object.keys(poAllocations).length > 0 ? poAllocations : grnData.poAllocations,
      declaredTotalMeters: resolvedDecMeters,
      totalQty: resolvedDecMeters > 0 ? String(resolvedDecMeters) : (grnData.totalQty || ''),
      totalMetersEntered: liveEntered > 0 ? liveEntered : (grnData.totalMetersEntered || resolvedDecMeters),
      createdAt: grnData.createdAt || (isEdit ? grns.find((g) => g.id === grnData.id)?.createdAt : null) || now,
      updatedAt: now
    };
    let updated;
    if (isEdit) {
      updated = grns.map((g) => (g.id === enrichedGRN.id ? enrichedGRN : g));
      addAuditLog('Update', 'GRN', enrichedGRN.id, 'GRN Progress', 'Draft', enrichedGRN.status);
    } else {
      updated = [enrichedGRN, ...grns];
      addAuditLog('Create', 'GRN', enrichedGRN.id, 'Inward Delivery', 'None', \`\${enrichedGRN.id} (\${enrichedGRN.totalMetersEntered}m)\`);
    }
    setGrns(updated);
    api.saveGRN(enrichedGRN).catch((e) => console.warn('GRN save sync error:', e));

    // Requirement 57: Update Linked PO Status & Quantities according to FIFO Allocation
    if (targetLinkedPoIds.length > 0) {
      const updatedPoMap = {};
      targetLinkedPoIds.forEach((linkedPoId) => {
        const targetPo = purchaseOrders.find((p) => p.id === linkedPoId);
        if (targetPo) {
          const poOrderedMeters = (targetPo.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
          const allGrnsForPo = updated.filter((g) => g && (
            (g.linkedPOs && g.linkedPOs.includes(linkedPoId)) ||
            g.poId === linkedPoId
          ));

          let totalReceivedForPo = 0;
          allGrnsForPo.forEach((g) => {
            totalReceivedForPo += getMetersForPoFromGrn(g, linkedPoId, targetPo.items, purchaseOrders);
          });

          let newPoStatus = targetPo.status;
          if (totalReceivedForPo >= poOrderedMeters && poOrderedMeters > 0) {
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
          updatedPoMap[linkedPoId] = updatedPo;
          api.savePurchaseOrder(updatedPo).catch((e) => console.warn('PO status sync error:', e));
        }
      });
      if (Object.keys(updatedPoMap).length > 0) {
        setPurchaseOrders((prev) => prev.map((p) => updatedPoMap[p.id] || p));
      }
    }

    // Requirement 51: A GRN is appearing in the QC Inspection queue even though it has not yet been submitted for QC.
    // QC records must ONLY exist if the GRN has been explicitly submitted to QC!
    const isExplicitlySubmitted = Boolean(
      isCompleted &&
      enrichedGRN.isSubmittedToQC === true &&
      !['Draft', 'Bale Entry in Progress', 'Header Saved'].includes(enrichedGRN.status)
    );

    if (!isExplicitlySubmitted) {
      // Purge any QC records for this unsubmitted GRN
      setQualityChecks((prev) => (prev || []).filter((q) => {
        if (!q) return false;
        return normGrnId(q.grnRef) !== normGrnId(enrichedGRN.id);
      }));
      setSelectedGRN(enrichedGRN);
      if (shouldExitToList) {
        setActiveGrnView('list');
        setActiveTab('grn');
      }
      return;
    }`;

const normContent = content.replace(/\r\n/g, '\n');
const normTarget = targetSection.replace(/\r\n/g, '\n');

if (normContent.includes(normTarget)) {
  content = normContent.replace(normTarget, replacementSection);
  console.log('ProcurementDashboard.jsx handleSaveGRN updated with FIFO');
} else {
  console.error('Could not find targetSection in ProcurementDashboard.jsx');
}

fs.writeFileSync(file, content, 'utf8');
console.log('ProcurementDashboard.jsx patched successfully');

