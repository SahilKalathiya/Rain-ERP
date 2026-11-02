const fs = require('fs');

const file = 'frontend/src/components/Procurement/GRNDetailView.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update import
if (!content.includes('calculateFifoPoAllocations')) {
  content = content.replace(
    "import React, { useState, useEffect, useMemo } from 'react';",
    "import React, { useState, useEffect, useMemo } from 'react';\nimport { calculateFifoPoAllocations } from '../../utils/procurementUtils';"
  );
}

// 2. Add fifoAllocations hook inside GRNDetailView component
const targetInside = `  const linkedPoId = grn.linkedPOs?.[0] || grn.poId;
  const linkedPO = purchaseOrders.find((p) => p.id === linkedPoId || (grn.linkedPOs && grn.linkedPOs.includes(p.id)));`;

const replacementInside = `  const linkedPoId = grn.linkedPOs?.[0] || grn.poId;
  const linkedPO = purchaseOrders.find((p) => p.id === linkedPoId || (grn.linkedPOs && grn.linkedPOs.includes(p.id)));

  // Requirement 57: FIFO Allocation calculation for consolidated shipments
  const linkedPoIds = (grn?.linkedPOs && grn.linkedPOs.length > 0)
    ? grn.linkedPOs
    : (grn?.poId && grn.poId !== 'PO-DIRECT' ? [grn.poId] : []);

  const linkedPOObjects = useMemo(() => {
    return linkedPoIds
      .map((id) => purchaseOrders.find((p) => p && String(p.id).trim() === String(id).trim()))
      .filter(Boolean);
  }, [linkedPoIds, purchaseOrders]);

  const totalGrnDeliveredMeters = Number(grn?.totalMetersEntered) || Number(grn?.declaredTotalMeters) || Number(grn?.totalQty) || 0;

  const fifoAllocations = useMemo(() => {
    if (linkedPOObjects.length <= 1) return [];

    if (grn?.poAllocations && typeof grn.poAllocations === 'object' && Object.keys(grn.poAllocations).length > 0) {
      const sortedPos = [...linkedPOObjects].sort((a, b) => {
        const tA = new Date(a.date || a.createdAt || 0).getTime() || 0;
        const tB = new Date(b.date || b.createdAt || 0).getTime() || 0;
        if (tA && tB && tA !== tB) return tA - tB;
        const numA = parseInt(String(a.id || '').replace(/\\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.id || '').replace(/\\D/g, ''), 10) || 0;
        return numA - numB;
      });

      return sortedPos.map((po, index) => {
        const pId = String(po.id).trim();
        const ordered = (po.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        const allocatedInThisGrn = Number(grn.poAllocations[pId]) || 0;
        const totalRecdPo = Number(po.receivedQty) || 0;
        const prevReceived = Math.max(0, totalRecdPo - allocatedInThisGrn);
        const pendingBeforeGrn = Math.max(0, ordered - prevReceived);
        const remainingBalance = Math.max(0, pendingBeforeGrn - allocatedInThisGrn);
        const totalReceivedToDate = prevReceived + allocatedInThisGrn;
        const isComplete = ordered > 0 && totalReceivedToDate >= ordered;
        const isPartial = totalReceivedToDate > 0 && !isComplete;
        const fulfillmentPercent = ordered > 0 ? Math.min(100, Math.round((totalReceivedToDate / ordered) * 100)) : 0;

        return {
          poId: pId,
          poDate: po.date || po.poDate || '',
          index: index + 1,
          isFirstOrder: index === 0,
          ordered,
          prevReceived,
          pendingBeforeGrn,
          allocatedInThisGrn,
          remainingBalance,
          totalReceivedToDate,
          isComplete,
          isPartial,
          fulfillmentPercent
        };
      });
    }

    return calculateFifoPoAllocations(linkedPOObjects, totalGrnDeliveredMeters, []);
  }, [linkedPOObjects, grn, totalGrnDeliveredMeters]);`;

const normContent = content.replace(/\r\n/g, '\n');
const normTargetInside = targetInside.replace(/\r\n/g, '\n');

if (normContent.includes(normTargetInside)) {
  content = normContent.replace(normTargetInside, replacementInside);
  console.log('Added fifoAllocations hook to GRNDetailView');
} else {
  console.error('Target inside not found in GRNDetailView');
}

// 3. Add Multi-PO FIFO card before Card 2
const targetBeforeCard2 = `      {/* CARD 2: Bale-wise breakdown */}`;

const fifoDetailCard = `      {/* Requirement 57: Multi-PO FIFO Delivery Breakdown Card */}
      {fifoAllocations && fifoAllocations.length > 1 && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
          <div className="card-header bg-white border-bottom p-3.5 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bold text-dark mb-0 fs-16">
                  <i className="ti ti-layers-intersect text-primary me-1.5"></i>
                  Consolidated Multi-PO Delivery &amp; FIFO Allocation
                </h5>
                <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill fs-11 fw-semibold">
                  {fifoAllocations.length} POs Linked
                </span>
                <span className="badge bg-info-subtle text-info border border-info border-opacity-25 px-2.5 py-1 rounded-pill fs-11 fw-semibold">
                  <i className="ti ti-clock-check me-1"></i> FIFO Rule Active
                </span>
              </div>
              <div className="text-muted fs-12 mt-1">
                સૌથી પહેલા બનેલા (Oldest) PO માંથી માલ પહેલા કટ થશે. પ્રથમ PO 100% પૂર્ણ થયા પછી જ બાકીનો માલ પછીના PO માં ફાળવવામાં આવ્યો છે.
              </div>
            </div>
            <div className="text-end">
              <span className="fs-11 text-muted d-block text-uppercase fw-semibold">Delivered in this GRN</span>
              <span className="fs-16 fw-bold text-success">
                +{totalGrnDeliveredMeters.toLocaleString()} m
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 fs-13 text-nowrap">
              <thead className="table-light text-secondary fs-12 text-uppercase fw-bold">
                <tr>
                  <th className="ps-4 py-3">Priority &amp; PO ID</th>
                  <th className="py-3">Order Date</th>
                  <th className="py-3 text-end">Ordered Qty</th>
                  <th className="py-3 text-end">Previously Received</th>
                  <th className="py-3 text-end">Pending Before GRN</th>
                  <th className="py-3 text-end bg-success-subtle text-success fw-bold">
                    Allocated in this GRN
                  </th>
                  <th className="py-3 text-end">Remaining Balance</th>
                  <th className="pe-4 py-3 text-center">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody>
                {fifoAllocations.map((alloc) => (
                  <tr key={alloc.poId} className={alloc.isComplete ? 'bg-light bg-opacity-50' : ''}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className={\`badge \${alloc.isFirstOrder ? 'bg-primary text-white' : 'bg-secondary-subtle text-dark border'} rounded-pill fs-11 px-2.5 py-1\`}
                        >
                          #{alloc.index} {alloc.isFirstOrder ? '1st Priority (Earliest)' : \`\${alloc.index}nd Priority\`}
                        </span>
                        <strong className="text-primary font-monospace">{alloc.poId}</strong>
                      </div>
                    </td>
                    <td className="py-3 text-muted">{alloc.poDate || '—'}</td>
                    <td className="py-3 text-end fw-semibold text-dark">
                      {alloc.ordered.toLocaleString()} m
                    </td>
                    <td className="py-3 text-end text-muted">
                      {alloc.prevReceived > 0 ? \`\${alloc.prevReceived.toLocaleString()} m\` : '0 m'}
                    </td>
                    <td className="py-3 text-end text-dark">
                      {alloc.pendingBeforeGrn.toLocaleString()} m
                    </td>
                    <td className="py-3 text-end bg-success-subtle text-success fw-bold fs-14">
                      +{alloc.allocatedInThisGrn.toLocaleString()} m
                    </td>
                    <td className="py-3 text-end fw-bold">
                      {alloc.remainingBalance === 0 ? (
                        <span className="badge bg-success-subtle text-success border border-success border-opacity-25 px-2 py-1 rounded-pill">
                          0 m (Nil)
                        </span>
                      ) : (
                        <span className="text-danger fw-bold">{alloc.remainingBalance.toLocaleString()} m</span>
                      )}
                    </td>
                    <td className="pe-4 py-3 text-center">
                      {alloc.isComplete ? (
                        <span className="badge bg-success-subtle text-success border border-success border-opacity-25 px-3 py-1.5 rounded-pill fs-12 fw-semibold d-inline-flex align-items-center gap-1">
                          <i className="ti ti-check fs-13"></i> 100% Completed
                        </span>
                      ) : alloc.isPartial ? (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning border-opacity-25 px-3 py-1.5 rounded-pill fs-12 fw-semibold d-inline-flex align-items-center gap-1">
                          <i className="ti ti-progress fs-13"></i> Partially Received ({alloc.fulfillmentPercent}%)
                        </span>
                      ) : (
                        <span className="badge bg-light text-secondary border px-3 py-1.5 rounded-pill fs-12 fw-medium">
                          Pending (0%)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light fw-bold fs-13">
                <tr>
                  <td colSpan={2} className="ps-4 py-3 text-dark">Total Consolidated Summary:</td>
                  <td className="py-3 text-end text-dark">
                    {fifoAllocations.reduce((s, a) => s + a.ordered, 0).toLocaleString()} m
                  </td>
                  <td className="py-3 text-end text-muted">
                    {fifoAllocations.reduce((s, a) => s + a.prevReceived, 0).toLocaleString()} m
                  </td>
                  <td className="py-3 text-end text-dark">
                    {fifoAllocations.reduce((s, a) => s + a.pendingBeforeGrn, 0).toLocaleString()} m
                  </td>
                  <td className="py-3 text-end bg-success-subtle text-success fs-14">
                    +{fifoAllocations.reduce((s, a) => s + a.allocatedInThisGrn, 0).toLocaleString()} m
                  </td>
                  <td className="py-3 text-end text-dark">
                    {fifoAllocations.reduce((s, a) => s + a.remainingBalance, 0).toLocaleString()} m
                  </td>
                  <td className="pe-4 py-3 text-center text-muted fs-12">
                    {fifoAllocations.filter(a => a.isComplete).length} of {fifoAllocations.length} POs 100% Completed
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* CARD 2: Bale-wise breakdown */}`;

if (content.includes(targetBeforeCard2)) {
  content = content.replace(targetBeforeCard2, fifoDetailCard);
  console.log('Added FIFO breakdown card before Card 2 in GRNDetailView');
} else {
  console.error('Target before Card 2 not found in GRNDetailView');
}

fs.writeFileSync(file, content, 'utf8');
console.log('GRNDetailView.jsx patched successfully');

