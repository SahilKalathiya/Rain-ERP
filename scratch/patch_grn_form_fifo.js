const fs = require('fs');

const file = 'frontend/src/components/Procurement/GRNForm.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update import
if (!content.includes('calculateFifoPoAllocations')) {
  content = content.replace(
    "import { calculatePoFabricFulfillment, isPieceOrBaleMatchForItem } from '../../utils/procurementUtils';",
    "import { calculatePoFabricFulfillment, isPieceOrBaleMatchForItem, calculateFifoPoAllocations } from '../../utils/procurementUtils';"
  );
}

// 2. Add effectiveGrnMeters, fifoPoAllocations, and poAllocationsMap right after declaredTotal definition
const targetAfterDeclared = `  const isMatch = declaredTotal > 0 && Math.abs(totalMetersEntered - declaredTotal) < 0.01;
  const hasBaleEntries = (formData.bales || []).some((b) => (b.pieces || []).length > 0);`;

const replacementAfterDeclared = `  const isMatch = declaredTotal > 0 && Math.abs(totalMetersEntered - declaredTotal) < 0.01;
  const hasBaleEntries = (formData.bales || []).some((b) => (b.pieces || []).length > 0);

  // Requirement 57: Effective GRN meters for real-time FIFO allocation calculation
  const effectiveGrnMeters = totalMetersEntered > 0 ? totalMetersEntered : (declaredTotal > 0 ? declaredTotal : 0);

  // Requirement 57: Live FIFO (First-In, First-Out) PO Allocation
  const fifoPoAllocations = useMemo(() => {
    if (!linkedPOObjects || linkedPOObjects.length === 0) return [];
    const priorGrns = (grns || []).filter((g) => g && g.id !== formData.id);
    return calculateFifoPoAllocations(linkedPOObjects, effectiveGrnMeters, priorGrns);
  }, [linkedPOObjects, effectiveGrnMeters, grns, formData.id]);

  const poAllocationsMap = useMemo(() => {
    const map = {};
    fifoPoAllocations.forEach((alloc) => {
      map[alloc.poId] = alloc.allocatedInThisGrn;
    });
    return map;
  }, [fifoPoAllocations]);`;

if (content.includes(targetAfterDeclared)) {
  content = content.replace(targetAfterDeclared, replacementAfterDeclared);
  console.log('Added fifoPoAllocations hooks to GRNForm.jsx');
} else {
  console.error('Could not find targetAfterDeclared');
}

// 3. Add poAllocations: poAllocationsMap in payloads
// a) in handleSaveProgress
content = content.replace(
  "totalMetersEntered: liveTotalMeters,\n      bales: normalizedBales",
  "totalMetersEntered: liveTotalMeters,\n      poAllocations: poAllocationsMap,\n      bales: normalizedBales"
);

// b) in handleSaveHeader
content = content.replace(
  "totalMetersEntered,\n      bales: nextBales",
  "totalMetersEntered,\n      poAllocations: poAllocationsMap,\n      bales: nextBales"
);

// c) in handleSaveBaleRecord
content = content.replace(
  "totalMetersEntered: liveTotalMeters,\n      bales: normalizedBales",
  "totalMetersEntered: liveTotalMeters,\n      poAllocations: poAllocationsMap,\n      bales: normalizedBales"
);

// d) in handleSubmitGRN
content = content.replace(
  "totalMetersEntered,\n      bales: finalBales",
  "totalMetersEntered,\n      poAllocations: poAllocationsMap,\n      bales: finalBales"
);

// 4. Replace Multi-PO Linking Banner with comprehensive FIFO Breakdown Table
const targetBanner = `{/* Point 26: Multi-PO Linking Banner and Tag List */}
                {formData.linkedPOs && formData.linkedPOs.length > 1 && (
                  <div className="p-2.5 rounded-3 bg-light border border-primary border-opacity-25 mt-2 shadow-xs">
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                      <span className="fs-12 fw-bold text-primary d-flex align-items-center gap-1.5">
                        <i className="ti ti-layers-intersect"></i>
                        Multiple POs Consolidated in Shipment ({formData.linkedPOs.length} POs):
                      </span>
                      <span className="badge bg-primary text-white fs-11 rounded-pill">
                        Total Ordered: {(totalLinkedOrderedMeters || poOrderedMeters || 0).toLocaleString()}m
                      </span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {formData.linkedPOs.map((poId) => {
                        const poObj = purchaseOrders.find((p) => p.id === poId);
                        const poMtrs = (poObj?.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
                        return (
                          <span key={poId} className="badge bg-white text-dark border px-2.5 py-1.5 rounded-3 fs-12 d-inline-flex align-items-center gap-2 shadow-xs">
                            <span className="fw-bold text-primary">{poId}</span>
                            <span className="text-muted">({poMtrs}m)</span>
                            {!isQcActioned && formData.linkedPOs.length > 1 && (
                              <i
                                className="ti ti-x text-danger cursor-pointer"
                                title={\`Unlink \${poId}\`}
                                onClick={() => handleUnlinkPO(poId)}
                              ></i>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}`;

const replacementFifoTable = `{/* Requirement 57: Multi-PO FIFO Delivery Breakdown Table */}
                {fifoPoAllocations && fifoPoAllocations.length > 1 && (
                  <div className="mt-3 p-3 rounded-3 bg-white border border-primary border-opacity-25 shadow-xs">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pb-2 mb-2.5 border-bottom">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-primary text-white px-2 py-1 rounded-2 fs-11 fw-bold">
                            <i className="ti ti-layers-intersect me-1"></i>
                            CONSOLIDATED SHIPMENT ({fifoPoAllocations.length} POs)
                          </span>
                          <span className="badge bg-info-subtle text-info border border-info border-opacity-25 px-2 py-1 rounded-2 fs-11 fw-semibold">
                            <i className="ti ti-clock-check me-1"></i>
                            FIFO Auto-Allocation Rule
                          </span>
                        </div>
                        <div className="text-muted fs-11 mt-1">
                          સૌથી પહેલા બનેલા (Oldest) PO માંથી માલ પહેલા કટ થશે. એક PO 100% પુરો થયા પછી જ બાકી વધેલો માલ બીજા PO માં ફાળવાશે.
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="fs-11 text-muted d-block">Entering in this GRN:</span>
                        <span className="fs-15 fw-bold text-success">
                          {effectiveGrnMeters.toLocaleString()} m
                        </span>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-sm table-bordered align-middle mb-0 fs-12 text-nowrap">
                        <thead className="table-light text-secondary">
                          <tr>
                            <th className="py-2 px-2.5">Priority & PO ID</th>
                            <th className="py-2 px-2.5">Order Date</th>
                            <th className="py-2 px-2.5 text-end">Ordered Qty</th>
                            <th className="py-2 px-2.5 text-end">Previously Recd</th>
                            <th className="py-2 px-2.5 text-end">Pending Before GRN</th>
                            <th className="py-2 px-2.5 text-end bg-success-subtle text-success fw-bold">
                              Receiving in this GRN
                            </th>
                            <th className="py-2 px-2.5 text-end">Remaining Balance</th>
                            <th className="py-2 px-2.5 text-center">Fulfillment Status</th>
                            {!isQcActioned && (
                              <th className="py-2 px-2 text-center" style={{ width: '40px' }}>Action</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {fifoPoAllocations.map((alloc) => {
                            return (
                              <tr key={alloc.poId} className={alloc.isComplete ? 'table-light' : ''}>
                                <td className="py-2 px-2.5">
                                  <div className="d-flex align-items-center gap-2">
                                    <span
                                      className={\`badge \${alloc.isFirstOrder ? 'bg-primary text-white' : 'bg-secondary-subtle text-dark border'} rounded-pill fs-10 px-2 py-0.5\`}
                                    >
                                      #{alloc.index} {alloc.isFirstOrder ? '1st Priority (Earliest)' : \`\${alloc.index}nd Priority\`}
                                    </span>
                                    <span className="fw-bold text-dark">{alloc.poId}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-2.5 text-muted">{alloc.poDate || '—'}</td>
                                <td className="py-2 px-2.5 text-end fw-semibold text-dark">
                                  {alloc.ordered.toLocaleString()} m
                                </td>
                                <td className="py-2 px-2.5 text-end text-muted">
                                  {alloc.prevReceived > 0 ? \`\${alloc.prevReceived.toLocaleString()} m\` : '0 m'}
                                </td>
                                <td className="py-2 px-2.5 text-end text-dark">
                                  {alloc.pendingBeforeGrn.toLocaleString()} m
                                </td>
                                <td className="py-2 px-2.5 text-end bg-success-subtle text-success fw-bold fs-13">
                                  +{alloc.allocatedInThisGrn.toLocaleString()} m
                                </td>
                                <td className="py-2 px-2.5 text-end fw-bold">
                                  {alloc.remainingBalance === 0 ? (
                                    <span className="text-success">0 m (Nil)</span>
                                  ) : (
                                    <span className="text-danger">{alloc.remainingBalance.toLocaleString()} m</span>
                                  )}
                                </td>
                                <td className="py-2 px-2.5 text-center">
                                  {alloc.isComplete ? (
                                    <span className="badge bg-success-subtle text-success border border-success border-opacity-25 px-2 py-1 rounded-pill fs-11 fw-semibold d-inline-flex align-items-center gap-1">
                                      <i className="ti ti-check"></i> 100% Completed
                                    </span>
                                  ) : alloc.isPartial ? (
                                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning border-opacity-25 px-2 py-1 rounded-pill fs-11 fw-semibold d-inline-flex align-items-center gap-1">
                                      <i className="ti ti-progress"></i> Partial ({alloc.fulfillmentPercent}%)
                                    </span>
                                  ) : (
                                    <span className="badge bg-light text-secondary border px-2 py-1 rounded-pill fs-11 fw-medium">
                                      Pending (0%)
                                    </span>
                                  )}
                                </td>
                                {!isQcActioned && (
                                  <td className="py-2 px-2 text-center">
                                    {formData.linkedPOs && formData.linkedPOs.length > 1 && (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger p-1 rounded-2"
                                        style={{ lineHeight: 1 }}
                                        title={\`Unlink PO \${alloc.poId}\`}
                                        onClick={() => handleUnlinkPO(alloc.poId)}
                                      >
                                        <i className="ti ti-x fs-13"></i>
                                      </button>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="table-light fw-bold">
                          <tr>
                            <td colSpan={2} className="py-2 px-2.5 text-dark">Total Consolidated Summary:</td>
                            <td className="py-2 px-2.5 text-end text-dark">
                              {fifoPoAllocations.reduce((s, a) => s + a.ordered, 0).toLocaleString()} m
                            </td>
                            <td className="py-2 px-2.5 text-end text-muted">
                              {fifoPoAllocations.reduce((s, a) => s + a.prevReceived, 0).toLocaleString()} m
                            </td>
                            <td className="py-2 px-2.5 text-end text-dark">
                              {fifoPoAllocations.reduce((s, a) => s + a.pendingBeforeGrn, 0).toLocaleString()} m
                            </td>
                            <td className="py-2 px-2.5 text-end bg-success-subtle text-success fs-13">
                              +{fifoPoAllocations.reduce((s, a) => s + a.allocatedInThisGrn, 0).toLocaleString()} m
                            </td>
                            <td className="py-2 px-2.5 text-end text-dark">
                              {fifoPoAllocations.reduce((s, a) => s + a.remainingBalance, 0).toLocaleString()} m
                            </td>
                            <td colSpan={!isQcActioned ? 2 : 1} className="py-2 px-2.5 text-center text-muted fs-11">
                              {fifoPoAllocations.filter(a => a.isComplete).length} of {fifoPoAllocations.length} POs Completed
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}`;

// Handle line endings normalized
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = targetBanner.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  content = normalizedContent.replace(normalizedTarget, replacementFifoTable);
  console.log('Replaced banner with Multi-PO FIFO Breakdown Table');
} else {
  console.error('Target banner not found for replacement');
}

fs.writeFileSync(file, content, 'utf8');
console.log('GRNForm.jsx patched successfully');

