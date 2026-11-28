import React from 'react';
import {
  computeLotYieldSummary,
  getActiveArticlesList,
  getArticleConsumptionMetrics,
  getChecklistCount,
  getSizeBreakdown,
  getTallyTotalMeters,
  getTotalGarmentsFromBreakdown,
  isChecklistComplete
} from '../../data/cuttingData';

/**
 * Structured Read-Only Saved PO View
 */
export function SavedPOView({
  rec,
  styleObj,
  colorObj,
  lotObj,
  onEditRecord,
  onOpenStep,
  onOpenPrintModal
}) {
  const activeArticles = getActiveArticlesList(rec, styleObj);
  const breakdown = getSizeBreakdown(rec, styleObj);
  const totalPieces = getTotalGarmentsFromBreakdown(rec, styleObj);
  const yieldInfo = computeLotYieldSummary(styleObj, lotObj);
  const gateOk = isChecklistComplete(rec);

  return (
    <div className="d-flex flex-column gap-4">
      <div className="card border-0 shadow-sm p-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace fs-11">
                {rec.poNumber}
              </span>
              <span
                className={`badge fs-11 ${
                  String(rec.poStatus || '').includes('Saved')
                    ? 'bg-success-subtle text-success border border-success-subtle'
                    : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                }`}
              >
                {rec.poStatus}
              </span>
              {rec.entryMode && (
                <span className="text-secondary fs-11">
                  {rec.entryMode === 'inside' ? 'Inside Style Order' : 'External New Cutting PO'}
                </span>
              )}
            </div>
            <h4 className="fw-bold text-dark mb-1">
              {rec.selectedStyle || 'Draft Cutting PO'} {activeArticles.length > 0 ? `— ${activeArticles.join(' + ')}` : ''}
            </h4>
            <p className="text-secondary fs-12 mb-0">
              {styleObj?.fabricName || 'Click Edit Record to configure parameters.'}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              onClick={onEditRecord}
              className="btn btn-primary btn-sm px-3 fw-semibold d-flex align-items-center gap-1"
            >
              <i className="ti ti-edit fs-14"></i>
              <span>Edit Record</span>
            </button>
            <button
              type="button"
              onClick={onOpenPrintModal}
              className="btn btn-light border btn-sm px-3 text-dark fw-semibold d-flex align-items-center gap-1"
            >
              <i className="ti ti-printer fs-14"></i>
              <span>Print Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100">
            <div className="text-uppercase text-muted fs-10 fw-bold">Shade &amp; Issued Lot</div>
            <div className="fw-bold text-dark fs-14 mt-1">
              {rec.selectedColor || '—'} · {lotObj ? lotObj.lotId : '—'}
            </div>
            <div className="text-primary fs-11 fw-semibold mt-1">
              {lotObj ? yieldInfo.label : 'No lot selected'}
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100">
            <div className="text-uppercase text-muted fs-10 fw-bold">Fabric Issued &amp; Width</div>
            <div className="fs-18 font-monospace fw-bold text-success mt-1">
              {Number(rec.fabricToIssue || 0).toFixed(2)} mts
            </div>
            <div className="text-secondary fs-11">Processed Width: <strong>{rec.fabricWidthInput || '—'}</strong></div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100">
            <div className="text-uppercase text-muted fs-10 fw-bold">Cutting PO Quantity</div>
            <div className="fs-18 font-monospace fw-bold text-dark mt-1">
              {totalPieces} {activeArticles.length > 1 ? `Sets (${totalPieces * activeArticles.length} pcs)` : 'pcs'}
            </div>
            <div className="text-secondary fs-11">
              {rec.useRatioDistribution ? `Ratio (${styleObj?.ratioLabel || '1:1'})` : 'Manual Size Entry'}
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100">
            <div className="text-uppercase text-muted fs-10 fw-bold">Floor Checklist &amp; Layers</div>
            <div className={`fw-bold fs-14 mt-1 ${gateOk ? 'text-success' : 'text-warning-emphasis'}`}>
              {gateOk ? '✓ Both Masters Verified' : `Pending (${getChecklistCount(rec)}/14 ticks)`}
            </div>
            <div className="text-secondary fs-11">{(rec.layers || []).length} Cutting Layer(s) Recorded</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm p-4 h-100 d-flex flex-column gap-3">
            <div className="d-flex align-items-center justify-content-between border-bottom pb-2">
              <h6 className="fw-bold text-dark mb-0">Size-Wise Cutting PO Allocation</h6>
              <button
                type="button"
                onClick={() => onOpenStep(2)}
                className="btn btn-link btn-sm p-0 text-primary fw-semibold text-decoration-none"
              >
                Edit PO →
              </button>
            </div>
            {styleObj && (rec.selectedSizes || []).length > 0 ? (
              <div className="table-responsive">
                <table className="table table-bordered table-sm text-center mb-0 fs-12">
                  <tbody>
                    <tr className="bg-dark text-white fw-bold">
                      <td className="text-start">Size</td>
                      {rec.selectedSizes.map((sz) => <td key={sz} className="font-monospace">{sz}</td>)}
                      <td>Total</td>
                    </tr>
                    {activeArticles.map((art) => (
                      <tr key={art}>
                        <td className="text-start fw-bold bg-light">{art} (pcs)</td>
                        {rec.selectedSizes.map((sz) => (
                          <td key={sz} className="font-monospace fw-bold text-primary">{breakdown[sz] || 0}</td>
                        ))}
                        <td className="font-monospace fw-bold bg-light">{totalPieces}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-secondary fs-12 fst-italic">No sizes configured yet.</div>
            )}
            <div className="p-2 rounded-3 bg-light border fs-12 text-secondary">
              <strong>Merchandiser Remarks:</strong> {rec.poRemarks || 'None'}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm p-4 h-100 d-flex flex-column gap-3">
            <div className="d-flex align-items-center justify-content-between border-bottom pb-2">
              <h6 className="fw-bold text-dark mb-0">Recorded Cutting Layers &amp; Crew Sign-Off</h6>
              <button
                type="button"
                onClick={() => onOpenStep(4)}
                className="btn btn-link btn-sm p-0 text-primary fw-semibold text-decoration-none"
              >
                Open Cutting Sheet →
              </button>
            </div>
            {(rec.layers || []).length > 0 ? (
              <div className="table-responsive">
                <table className="table table-bordered table-sm mb-0 fs-12">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Layer</th>
                      <th>Date</th>
                      <th>Length</th>
                      <th>Pallas</th>
                      <th className="text-end">Meters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rec.layers.map((l) => (
                      <tr key={l.id}>
                        <td className="fw-bold">{l.article}</td>
                        <td className="font-monospace">#{l.layerNo}</td>
                        <td className="font-monospace">{l.date || '—'}</td>
                        <td className="font-monospace">{Number(l.layerLength || 0).toFixed(2)} m</td>
                        <td className="font-monospace">{l.pallaQty || 0}</td>
                        <td className="font-monospace fw-bold text-primary text-end">
                          {((parseFloat(l.layerLength) || 0) * (parseInt(l.pallaQty, 10) || 0)).toFixed(2)} m
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-secondary fs-12 fst-italic">No cutting layers laid yet.</div>
            )}

            <div className="row g-2 fs-11">
              <div className="col-4">
                <div className="p-2 rounded-3 bg-light border">
                  <div className="text-muted">Layer Man</div>
                  <div className="fw-bold text-dark">{rec.signatures?.layerMan || 'Pending'}</div>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded-3 bg-light border">
                  <div className="text-muted">Cutting Master</div>
                  <div className="fw-bold text-dark">{rec.signatures?.cuttingMaster || 'Pending'}</div>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded-3 bg-light border">
                  <div className="text-muted">Checking Master</div>
                  <div className="fw-bold text-dark">{rec.signatures?.checkingMaster || 'Pending'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive 6-Step Process Flowchart Modal
 */
export function ProcessFlowchartModal({ rec, onClose }) {
  const gateOk = isChecklistComplete(rec);
  const tallied = getTallyTotalMeters(rec);

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-3">
          <div className="modal-header bg-white border-bottom">
            <div>
              <h5 className="modal-title fw-bold fs-16 mb-0">
                Raindrop Module 4 (Cutting) — Live Process Flowchart &amp; Gates
              </h5>
              <div className="text-secondary fs-11">
                End-to-End 6-Step Validation, Hard Gates &amp; Wastage Alert Thresholds
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body bg-light p-4">
            <div className="row g-3 fs-12">
              <div className="col-md-6">
                <div className="p-3 rounded-3 border border-success bg-success-subtle h-100">
                  <div className="fw-bold text-success mb-1">Step 1: Fabric Lot &amp; Metering Tally</div>
                  <p className="mb-0 text-dark">
                    Dyeing repeats until shade is approved → split into Lots → Thans measured ({tallied.toFixed(2)} m) &amp; Checking Report attached.
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 rounded-3 border border-primary bg-primary-subtle h-100">
                  <div className="fw-bold text-primary mb-1">Step 2: Cutting PO (P1) &amp; Set Split</div>
                  <p className="mb-0 text-dark">
                    System suggests sizes &amp; piece yield per lot → &ldquo;Go Ahead&rdquo; auto-fills or manual entry → Combined PO splits into separate POs per article.
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className={`p-3 rounded-3 border h-100 ${gateOk ? 'border-success bg-success-subtle' : 'border-warning bg-warning-subtle'}`}>
                  <div className={`fw-bold mb-1 ${gateOk ? 'text-success' : 'text-warning-emphasis'}`}>
                    Step 3: Hard Gate — Both Masters OK?
                  </div>
                  <p className="mb-0 text-dark">
                    {gateOk
                      ? 'PASSED: Marking Master & Checking Master signed all items; Cutting Master accepted PO.'
                      : 'BLOCKED: Process stays locked until both Marking & Checking Masters tick all checklist points.'}
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 rounded-3 border border-primary bg-primary-subtle h-100">
                  <div className="fw-bold text-primary mb-1">Step 4: Layer-by-Layer Cutting Sheet</div>
                  <p className="mb-0 text-dark">
                    Records layers, dates, lengths &amp; pallas. Any size cut &gt;1 time requires Admin/Cutting Master approval.
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 rounded-3 border border-primary bg-primary-subtle h-100">
                  <div className="fw-bold text-primary mb-1">Step 5: Consumption Sheet (Per Article)</div>
                  <p className="mb-0 text-dark">
                    Layer meters + Trims (A, B, C per pc) = Grand Total Used. Kurta remainder passes forward to Pant.
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 rounded-3 border border-danger bg-danger-subtle h-100">
                  <div className="fw-bold text-danger mb-1">Step 6: Physical Count &amp; Alert Thresholds</div>
                  <div className="text-dark">
                    • Missing Fabric &gt; 10% → <strong>Red Alert</strong><br />
                    • Wastage &gt; 3% → <strong>Counted as Wastage</strong> (≤3% Normal)<br />
                    • Wastage &gt; 30% → <strong>Red Alarm</strong><br />
                    • Usable remainder → <strong>Old Fabric Stock</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer bg-white border-top">
            <button type="button" className="btn btn-light border btn-sm px-3 text-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Printable A4 Consumption Sheet Modal
 */
export function CuttingPrintModal({ rec, styleObj, colorObj, lotObj, onClose }) {
  if (!styleObj) return null;
  const articles = getActiveArticlesList(rec, styleObj);
  const art = articles.includes(rec.activeConsumptionArticle) ? rec.activeConsumptionArticle : articles[0];
  const m = getArticleConsumptionMetrics(art, rec, styleObj);
  const stockOnHold = articles.length > 1 && art === articles[0] ? m.systemFinalRemaining : 0;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-3">
          <div className="modal-header bg-white border-bottom no-print">
            <h5 className="modal-title fw-bold fs-16 mb-0">
              <i className="ti ti-printer text-primary me-2"></i>
              Raindrop Physical Sheet Preview (A4 Print Format)
            </h5>
            <div className="d-flex gap-2">
              <button type="button" onClick={() => window.print()} className="btn btn-primary btn-sm px-3 fw-semibold">
                <i className="ti ti-printer me-1"></i> Print Sheet
              </button>
              <button type="button" onClick={onClose} className="btn btn-light border btn-sm px-3 text-secondary">
                Close
              </button>
            </div>
          </div>
          <div className="modal-body bg-white p-4" id="cuttingPrintArea">
            <div className="border border-dark p-4 d-flex flex-column gap-3 fs-12">
              <div className="d-flex justify-content-between align-items-center border-bottom border-dark pb-2">
                <div>
                  <div className="fw-bold fs-16 text-uppercase">RAINDROP GARMENTS — FABRIC CONSUMPTION SHEET</div>
                  <div>Cutting PO #: <strong>{rec.poNumber}</strong></div>
                </div>
                <div className="text-end">
                  <div className="fw-bold">Date: {rec.consumptionData?.[art]?.date || '—'}</div>
                  <div>Fabric Stock On Hold: <strong>{stockOnHold.toFixed(2)} m</strong></div>
                </div>
              </div>

              <table className="table table-bordered table-sm mb-0 fs-12">
                <tbody>
                  <tr>
                    <td className="bg-dark text-white fw-bold" style={{ width: 130 }}>Style Name</td>
                    <td className="fw-bold">{rec.selectedStyle} {art} {lotObj ? `(${lotObj.lotId})` : ''}</td>
                    <td className="bg-dark text-white fw-bold" style={{ width: 100 }}>Colour</td>
                    <td className="fw-bold">{colorObj?.name || '—'}</td>
                  </tr>
                </tbody>
              </table>

              <table className="table table-bordered table-sm text-center mb-0 fs-12">
                <tbody>
                  <tr>
                    <td className="bg-dark text-white fw-bold text-start" style={{ width: 130 }}>Sizes</td>
                    {(styleObj.sizes || []).map((sz) => <td key={sz} className="fw-bold bg-light">{sz}</td>)}
                  </tr>
                  <tr>
                    <td className="bg-dark text-white fw-bold text-start">Order / Cut Qty</td>
                    {(styleObj.sizes || []).map((sz) => (
                      <td key={sz} className="font-monospace fw-bold">{m.stats.sizeTotals[sz] || 0}</td>
                    ))}
                  </tr>
                </tbody>
              </table>

              <div className="row g-3">
                <div className="col-6">
                  <table className="table table-bordered table-sm mb-0 fs-12">
                    <tbody>
                      <tr><td className="fw-bold">Total Fabric Available</td><td className="text-end font-monospace">{m.totalFabricAvailable.toFixed(2)} m</td></tr>
                      <tr><td className="fw-bold">Fabric Width</td><td className="text-end font-monospace">{rec.fabricWidthInput || '—'}</td></tr>
                      <tr><td className="fw-bold">Total Fabric To Be used</td><td className="text-end font-monospace">{m.totalFabricAvailable.toFixed(2)} m</td></tr>
                      <tr><td className="fw-bold">Folding (L)</td><td className="text-end font-monospace">{m.foldingL}</td></tr>
                      <tr className="bg-light fw-bold"><td>Total Fabric after &apos;L&apos;</td><td className="text-end font-monospace">{m.fabricAfterL.toFixed(2)} m</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-6">
                  <table className="table table-bordered table-sm mb-0 fs-12">
                    <tbody>
                      <tr><td className="bg-dark text-white fw-bold">Grand Total Fabric in Layer</td><td className="text-end font-monospace fw-bold">{m.grandLayerMeters.toFixed(2)} m</td></tr>
                      <tr><td className="bg-dark text-white fw-bold">Total No Of Garment cut</td><td className="text-end font-monospace fw-bold">{m.totalGarments}</td></tr>
                      <tr><td className="bg-dark text-white fw-bold">Average Fabric / garment</td><td className="text-end font-monospace">{m.baseAvgPerGarment.toFixed(2)} m</td></tr>
                      <tr><td className="bg-dark text-white fw-bold">Total trim fabric used</td><td className="text-end font-monospace">{m.totalTrimMetersExact.toFixed(2)} m</td></tr>
                      <tr><td className="bg-dark text-white fw-bold">Grand Total Of all fabric used</td><td className="text-end font-monospace fw-bold">{m.grandTotalAllFabricUsed.toFixed(2)} m</td></tr>
                      <tr><td className="bg-dark text-white fw-bold">Final Fabric remaining</td><td className="text-end font-monospace fw-bold">{m.systemFinalRemaining.toFixed(2)} m</td></tr>
                      <tr><td className="bg-dark text-white fw-bold">Fabric counted &amp; available</td><td className="text-end font-monospace">{m.physicalUsable.toFixed(2)} m</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 d-flex justify-content-between fw-bold border-top border-dark">
                <span>Layer Man: {rec.signatures?.layerMan || '—'}</span>
                <span>Cutting Master: {rec.signatures?.cuttingMaster || '—'}</span>
                <span>Checking Master: {rec.signatures?.checkingMaster || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
