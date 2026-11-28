import React, { useState } from 'react';
import {
  getActiveArticlesList,
  getArticleConsumptionMetrics
} from '../../data/cuttingData';

/**
 * Step 5 & Step 6: Fabric Consumption Sheet, Physical Count, Alerts & Old Fabric Stock Ledger
 */
export default function Step5ConsumptionStock({
  rec,
  styleObj,
  colorObj,
  lotObj,
  oldFabricStock,
  onUpdateRec,
  onTransferToOldStock,
  onOpenPrintModal
}) {
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeAmount, setCloseAmount] = useState('');
  const [closeAdminApproved, setCloseAdminApproved] = useState(false);
  const [closeError, setCloseError] = useState('');

  if (!styleObj) {
    return (
      <div className="card border-0 shadow-sm p-5 text-center text-secondary fs-13">
        Select a Design / Style in Step 2 first.
      </div>
    );
  }

  const articles = getActiveArticlesList(rec, styleObj);
  const art = articles.includes(rec.activeConsumptionArticle) ? rec.activeConsumptionArticle : articles[0];
  const cData = rec.consumptionData?.[art] || {
    date: '',
    foldingStandard: 100,
    trims: [{ id: 1, label: 'A', name: '', metersPerPc: '' }],
    physicalCountedUsable: '',
    tukdaScrapMeters: ''
  };

  const m = getArticleConsumptionMetrics(art, rec, styleObj);

  const isMissingAlert = m.hasPhysicalEntry && m.missingPercentOfRemaining > 10 && m.missingMeters > 0.05;
  const effectiveWastagePct =
    articles.length > 1 && art !== articles[0] ? m.residualShareOfLot : m.wastagePercentOfReceived;
  const isWastageAlarm30 = effectiveWastagePct > 30;
  const isWastageOver3 = effectiveWastagePct > 3;
  const stockOnHoldDisplay = articles.length > 1 && art === articles[0] ? m.systemFinalRemaining : 0;

  const isFinalArticleOfSheet = articles.length <= 1 || art === articles[articles.length - 1];
  const remainingMetersForAlert = m.hasPhysicalEntry ? m.physicalUsable : m.systemFinalRemaining;
  const remainingPctOfAvailable = m.totalFabricAvailable > 0
    ? (remainingMetersForAlert / m.totalFabricAvailable) * 100
    : 0;
  const isRemainingOver3PctAlert =
    isFinalArticleOfSheet &&
    m.grandTotalAllFabricUsed > 0 &&
    remainingMetersForAlert > 0 &&
    remainingPctOfAvailable > 3;

  const updateArtConsumption = (patch) => {
    onUpdateRec({
      consumptionData: {
        ...(rec.consumptionData || {}),
        [art]: { ...cData, ...patch }
      }
    });
  };

  const handleAddTrim = () => {
    const trims = cData.trims || [];
    const nextLetter = String.fromCharCode(65 + trims.length);
    updateArtConsumption({
      trims: [
        ...trims,
        { id: Date.now() + Math.random(), label: nextLetter, name: '', metersPerPc: '' }
      ]
    });
  };

  const handleUpdateTrim = (id, field, val) => {
    updateArtConsumption({
      trims: (cData.trims || []).map((t) => (t.id === id ? { ...t, [field]: val } : t))
    });
  };

  const handleRemoveTrim = (id) => {
    const nextTrims = (cData.trims || []).filter((t) => t.id !== id);
    updateArtConsumption({
      trims: nextTrims.length > 0 ? nextTrims : [{ id: Date.now(), label: 'A', name: '', metersPerPc: '' }]
    });
  };

  const handleOpenClosePO = () => {
    if (!window.confirm(`Are you sure you want to close Cutting PO ${rec.poNumber}?`)) {
      return;
    }
    setCloseAmount(remainingMetersForAlert > 0 ? remainingMetersForAlert.toFixed(2) : '0.00');
    setCloseAdminApproved(false);
    setCloseError('');
    setShowCloseModal(true);
  };

  const handleConfirmClosePO = (disposition) => {
    const amt = parseFloat(closeAmount);
    if (Number.isNaN(amt) || amt < 0) {
      setCloseError('Please enter a valid fabric amount (m).');
      return;
    }
    if (isRemainingOver3PctAlert && !closeAdminApproved) {
      setCloseError('Admin approval is required to close this PO because remaining fabric is over 3%.');
      return;
    }

    if (disposition === 'stock' && amt > 0) {
      onTransferToOldStock(art, amt, cData.date);
    } else if (disposition === 'reject' && amt > 0) {
      try {
        const raw = localStorage.getItem('raindrop_rejected_stock_v1');
        const existing = raw ? JSON.parse(raw) : [];
        const list = Array.isArray(existing) ? existing : [];
        const rejEntry = {
          id: `REJ-CUT-${Date.now()}`,
          sourcePoRef: rec.poNumber,
          fabricQuality: `${rec.selectedStyle} (${art})`,
          color: colorObj?.name || rec.selectedColor || '—',
          width: rec.fabricWidthInput || '—',
          rejectedMeters: amt,
          meters: amt,
          reason: `Cutting PO ${rec.poNumber} closed — remaining fabric rejected`,
          status: 'Pending Action',
          date: cData.date || new Date().toISOString().slice(0, 10)
        };
        localStorage.setItem('raindrop_rejected_stock_v1', JSON.stringify([rejEntry, ...list]));
      } catch (e) {}
    }

    onUpdateRec({
      previousStatusBeforeClose: rec.poStatus || 'Cutting Completed',
      poStatus: 'Closed',
      closedAt: new Date().toISOString(),
      closeDisposition: disposition === 'stock' ? 'Old Fabric Stock' : 'Rejected Stock',
      closedMeters: amt,
      closeAdminApproved: isRemainingOver3PctAlert ? closeAdminApproved : true
    });
    setShowCloseModal(false);
  };

  const handleReopenPO = () => {
    if (!window.confirm(`Are you sure you want to re-open Cutting PO ${rec.poNumber}?`)) {
      return;
    }
    onUpdateRec({
      poStatus: rec.previousStatusBeforeClose || 'Checklist Accepted',
      reopenedAt: new Date().toISOString()
    });
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Clean Header + Article Tabs + Date */}
      <div className="card border-0 shadow-sm p-3 px-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="fw-bold text-dark mb-0 fs-16">Fabric Consumption &amp; Wastage</h5>
              <span className="badge bg-light text-dark border fs-11">
                {rec.selectedStyle} · {colorObj?.name || '—'}
              </span>
              {lotObj?.lotId && (
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace fs-11">
                  {lotObj.lotId}
                </span>
              )}
            </div>
            <div className="text-secondary fs-11 mt-0.5">
              PO: <span className="font-monospace fw-semibold">{rec.poNumber}</span> · Width: <span className="font-monospace fw-semibold">{rec.fabricWidthInput || '—'}</span>
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="btn-group btn-group-sm" role="group">
              {articles.map((articleTab) => (
                <button
                  key={articleTab}
                  type="button"
                  onClick={() => onUpdateRec({ activeConsumptionArticle: articleTab })}
                  className={`btn fw-semibold ${
                    art === articleTab ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                >
                  {articleTab}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onOpenPrintModal}
              className="btn btn-light border btn-sm px-2.5 text-dark fw-semibold d-flex align-items-center gap-1"
            >
              <i className="ti ti-printer fs-14"></i>
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts (only when triggered) */}
      {isMissingAlert && (
        <div className="p-3 rounded-3 bg-danger-subtle border border-danger d-flex flex-wrap align-items-center justify-content-between gap-2 text-danger fs-12">
          <div className="d-flex align-items-center gap-2">
            <i className="ti ti-alert-triangle fs-18"></i>
            <span>
              <strong>&gt;10% Fabric Missing:</strong> Expected {m.systemFinalRemaining.toFixed(2)} m, counted {(m.physicalUsable + m.tukdaScrap).toFixed(2)} m ({m.missingMeters.toFixed(2)} m short).
            </span>
          </div>
          <span className="badge bg-danger text-white">ALERT</span>
        </div>
      )}

      {isWastageAlarm30 && (
        <div className="p-3 rounded-3 bg-danger-subtle border border-danger d-flex align-items-center gap-2 text-danger fs-12">
          <i className="ti ti-alert-triangle fs-18"></i>
          <span>
            <strong>Critical Wastage Alarm (&gt;30%):</strong> Current wastage is {effectiveWastagePct.toFixed(2)}% of {m.initialLotMeters.toFixed(2)} m received.
          </span>
        </div>
      )}

      {isRemainingOver3PctAlert && (
        <div className="p-3 rounded-3 bg-warning-subtle border border-warning d-flex flex-wrap align-items-center justify-content-between gap-2 text-warning-emphasis fs-12">
          <div className="d-flex align-items-center gap-2">
            <i className="ti ti-bell-ringing fs-18 text-warning-emphasis"></i>
            <span>
              <strong>Admin Notification (&gt;3% Remaining Fabric):</strong> Cutting sheet finished with{' '}
              <strong className="font-monospace">{remainingMetersForAlert.toFixed(2)} m</strong> remaining (
              <strong className="font-monospace">{remainingPctOfAvailable.toFixed(2)}%</strong> of{' '}
              <strong className="font-monospace">{m.totalFabricAvailable.toFixed(2)} m</strong>).
            </span>
          </div>
          <span className="badge bg-warning text-dark fw-bold px-2.5 py-1">
            ADMIN NOTIFIED (&gt;3%)
          </span>
        </div>
      )}

      {/* Complete Consumption & Wastage Sheet (All Paper Sheet Fields in Clean ERP Theme) */}
      <div className="card border-0 shadow-sm p-4 d-flex flex-column gap-4">
        {/* 1. Style, Colour, Date, Stock On Hold & Sizes */}
        <div className="row g-3 align-items-start">
          <div className="col-12 col-lg-8 d-flex flex-column gap-2">
            <div className="table-responsive border rounded-3 overflow-hidden">
              <table className="table table-sm mb-0 fs-12 align-middle">
                <tbody>
                  <tr>
                    <td className="table-light fw-bold text-secondary" style={{ width: 145 }}>Style Name</td>
                    <td className="fw-bold text-dark fs-13">
                      {rec.selectedStyle} {art} {lotObj ? `(${lotObj.lotId})` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="table-light fw-bold text-secondary">Colour</td>
                    <td className="fw-bold text-dark">{colorObj?.name || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="table-responsive border rounded-3 overflow-hidden">
              <table className="table table-bordered table-sm text-center mb-0 fs-12">
                <tbody>
                  <tr>
                    <td className="table-light fw-bold text-secondary text-start" style={{ width: 145 }}>Sizes</td>
                    {(styleObj.sizes || []).map((sz) => (
                      <td key={sz} className="font-monospace fw-bold table-light text-dark">{sz}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="table-light fw-bold text-secondary text-start">Order / Cut Qty</td>
                    {(styleObj.sizes || []).map((sz) => (
                      <td key={sz} className="font-monospace fw-bold text-primary">
                        {m.stats.sizeTotals[sz] || 0}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-12 col-lg-4 d-flex flex-column gap-2">
            <div className="border rounded-3 overflow-hidden">
              <table className="table table-sm mb-0 fs-12 align-middle">
                <tbody>
                  <tr>
                    <td className="table-light fw-bold text-secondary" style={{ width: 120 }}>Date</td>
                    <td>
                      <input
                        type="date"
                        value={cData.date}
                        onChange={(e) => updateArtConsumption({ date: e.target.value })}
                        className="form-control form-control-sm font-monospace fw-bold"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border rounded-3 overflow-hidden">
              <table className="table table-sm mb-0 fs-12 align-middle">
                <tbody>
                  <tr>
                    <td className="table-light fw-bold text-secondary" style={{ width: 165 }}>Fabric Stock On Hold</td>
                    <td className="font-monospace fw-bold fs-14 text-warning-emphasis bg-warning-subtle text-end pe-3">
                      {stockOnHoldDisplay.toFixed(2)} m
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 2. Fabric Available, Width, Folding (L) & Spec Notes */}
        <div className="row g-3 align-items-stretch">
          <div className="col-12 col-lg-6">
            <div className="border rounded-3 overflow-hidden h-100">
              <table className="table table-sm mb-0 fs-12 align-middle">
                <tbody>
                  <tr>
                    <td className="table-light fw-bold text-secondary" style={{ width: 240 }}>Total Fabric Available</td>
                    <td className="font-monospace fw-bold text-end pe-3">{m.totalFabricAvailable.toFixed(2)} m</td>
                  </tr>
                  <tr>
                    <td className="table-light fw-bold text-secondary">Fabric Width</td>
                    <td className="font-monospace fw-bold text-end pe-3">{rec.fabricWidthInput || '—'}</td>
                  </tr>
                  <tr>
                    <td className="table-light fw-bold text-secondary">
                      Folding (L) <span className="text-muted fw-normal fs-10">(100, 99, or 98)</span>
                    </td>
                    <td className="text-end pe-3">
                      <select
                        value={cData.foldingStandard}
                        onChange={(e) => updateArtConsumption({ foldingStandard: parseFloat(e.target.value) || 100 })}
                        className="form-select form-select-sm d-inline-block font-monospace fw-bold text-primary"
                        style={{ width: 90 }}
                      >
                        <option value={100}>100</option>
                        <option value={99}>99</option>
                        <option value={98}>98</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="bg-primary-subtle">
                    <td className="fw-bold text-primary">Total Fabric to be used after Folding</td>
                    <td className="font-monospace fw-bold text-end text-primary pe-3">{m.fabricAfterL.toFixed(2)} m</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="p-3 rounded-3 bg-light border h-100 d-flex flex-column justify-content-center gap-1.5 fs-12">
              <div className="text-uppercase text-secondary fs-10 fw-bold">Garment &amp; Fabric Spec Notes</div>
              <div className="font-monospace">• Garment Length Spec → <strong>{styleObj.kurtaLengthSpec || '—'}</strong></div>
              <div className="font-monospace">
                • Grey Fabric Width → <strong>{styleObj.greyWidth || '—'}</strong> (Processed: {rec.fabricWidthInput || '—'})
              </div>
              <div className="font-monospace text-primary">
                • PO Reference → <strong>{rec.poNumber}</strong> ({rec.poStatus})
              </div>
            </div>
          </div>
        </div>

        {/* 3. Layer Details (Left) & Full Consumption Breakdown + Trims (Right) */}
        <div className="row g-3 align-items-start">
          <div className="col-12 col-lg-6">
            <div className="border rounded-3 overflow-hidden">
              <table className="table table-bordered table-sm text-center mb-0 fs-12">
                <thead className="table-light">
                  <tr className="text-secondary fs-11 text-uppercase">
                    <th className="text-start">Layer Details</th>
                    <th>Garment Sizes</th>
                    <th>Layer Length</th>
                    <th>Palla Qty</th>
                    <th>Total Mts Used</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3].map((rowIdx) => {
                    const layer = m.stats.artLayers[rowIdx];
                    const used = layer ? (parseFloat(layer.layerLength) || 0) * (parseInt(layer.pallaQty, 10) || 0) : 0;
                    return (
                      <tr key={rowIdx}>
                        <td className="text-start fw-semibold table-light text-dark">Layer Length {rowIdx + 1}</td>
                        <td className="font-monospace text-secondary">
                          {layer && styleObj.sizes?.length
                            ? `${styleObj.sizes[0]} to ${styleObj.sizes[styleObj.sizes.length - 1]}`
                            : '—'}
                        </td>
                        <td className="font-monospace">{layer ? (parseFloat(layer.layerLength) || 0).toFixed(2) : ''}</td>
                        <td className="font-monospace">{layer ? layer.pallaQty : ''}</td>
                        <td className="font-monospace fw-bold">{layer ? used.toFixed(2) : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="border rounded-3 overflow-hidden">
              <table className="table table-bordered table-sm mb-0 fs-12 align-middle">
                <tbody>
                  <tr>
                    <td className="table-light fw-bold text-secondary">Grand Total of Fabric used in Layer</td>
                    <td className="font-monospace fw-bold text-end pe-3" style={{ width: 130 }}>{m.grandLayerMeters.toFixed(2)} m</td>
                  </tr>
                  <tr>
                    <td className="table-light fw-bold text-secondary">Total No Of Garment cut</td>
                    <td className="font-monospace fw-bold text-end pe-3">{m.totalGarments} pcs</td>
                  </tr>
                  <tr>
                    <td className="table-light fw-bold text-secondary">Average Fabric used per garment</td>
                    <td className="font-monospace fw-bold text-end pe-3">{m.baseAvgPerGarment.toFixed(2)} m</td>
                  </tr>
                  <tr>
                    <td className="table-light fw-bold text-secondary">Fabric Balance from Layer</td>
                    <td className="font-monospace fw-bold text-primary text-end pe-3">{m.fabricBalanceFromLayer.toFixed(2)} m</td>
                  </tr>

                  {(cData.trims || []).map((trim) => (
                    <tr key={trim.id}>
                      <td className="table-light">
                        <div className="d-flex align-items-center gap-1">
                          <input
                            type="text"
                            placeholder={`Embroidery / Trim per pc - ${trim.label}`}
                            value={trim.name}
                            onChange={(e) => handleUpdateTrim(trim.id, 'name', e.target.value)}
                            className="form-control form-control-sm bg-white fs-11 fw-semibold"
                          />
                          {(cData.trims || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTrim(trim.id)}
                              className="btn btn-light border btn-xs text-danger px-1.5"
                              title="Remove Trim Row"
                            >
                              <i className="ti ti-x fs-12"></i>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="text-end">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={trim.metersPerPc}
                          onChange={(e) => handleUpdateTrim(trim.id, 'metersPerPc', e.target.value)}
                          className="form-control form-control-sm font-monospace fw-bold text-end text-primary"
                        />
                      </td>
                    </tr>
                  ))}

                  <tr>
                    <td className="table-light fw-bold text-secondary d-flex align-items-center justify-content-between">
                      <span>Total trim fabric used per pc</span>
                      <button
                        type="button"
                        onClick={handleAddTrim}
                        className="btn btn-outline-primary btn-xs py-0 px-2 fw-semibold"
                      >
                        + Add Trim
                      </button>
                    </td>
                    <td className="font-monospace fw-bold text-end pe-3">{m.totalTrimPerPc.toFixed(2)} m</td>
                  </tr>
                  <tr>
                    <td className="table-light fw-bold text-secondary">Total trim fabric used (per pc * garments)</td>
                    <td className="font-monospace fw-bold text-end pe-3">{m.totalTrimMetersExact.toFixed(2)} m</td>
                  </tr>
                  <tr className="bg-light">
                    <td className="fw-bold text-dark">Grand Total Of all fabric used</td>
                    <td className="font-monospace fw-bold text-end text-dark pe-3">{m.grandTotalAllFabricUsed.toFixed(2)} m</td>
                  </tr>
                  <tr>
                    <td className="table-light fw-bold text-secondary">Final Fabric remaining from layer</td>
                    <td className="font-monospace fw-bold text-end text-success pe-3">{m.systemFinalRemaining.toFixed(2)} m</td>
                  </tr>
                  <tr className="bg-warning-subtle">
                    <td className="fw-bold text-dark">Fabric counted and available (Physical Usable)</td>
                    <td className="text-end">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={cData.physicalCountedUsable}
                        onChange={(e) => updateArtConsumption({ physicalCountedUsable: e.target.value })}
                        className="form-control form-control-sm font-monospace fw-bold text-end text-primary"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 4. Total Layer Wastage, Total Tukda Shortage & Old Fabric Stock Transfer */}
        <div className="row g-3 align-items-center">
          <div className="col-12 col-lg-7">
            <div className="border rounded-3 overflow-hidden">
              <table className="table table-bordered table-sm mb-0 fs-12 align-middle">
                <tbody>
                  <tr>
                    <td className="table-light fw-bold text-secondary" style={{ width: 220 }}>Total Layer Wastage</td>
                    <td
                      className={`font-monospace fw-bold fs-13 ${
                        isWastageAlarm30
                          ? 'bg-danger-subtle text-danger'
                          : isWastageOver3
                            ? 'bg-warning-subtle text-warning-emphasis'
                            : 'bg-success-subtle text-success'
                      }`}
                    >
                      {effectiveWastagePct.toFixed(2)}%{' '}
                      <span className="font-sans fs-11 fw-semibold ms-2">
                        ({isWastageAlarm30 ? 'ALARM: >30%' : isWastageOver3 ? 'Counted as Wastage (>3%)' : 'Normal Tolerance: ≤3% Acceptable'})
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="table-light fw-bold text-secondary">Total tukda shortage / Scrap (m)</td>
                    <td className="d-flex align-items-center justify-content-between gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={cData.tukdaScrapMeters}
                        onChange={(e) => updateArtConsumption({ tukdaScrapMeters: e.target.value })}
                        className="form-control form-control-sm font-monospace fw-bold"
                        style={{ maxWidth: 130 }}
                      />
                      <span className="text-secondary fs-11">Katran / small &amp; big scrap pieces</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-12 col-lg-5 d-flex flex-column gap-2">
            <div className="p-2 rounded-3 bg-light border text-center fs-11 fw-semibold text-secondary">
              (Total Fabric to be used after Folding − Grand Total of all fabric used) ={' '}
              <strong className="font-monospace text-dark">{m.systemFinalRemaining.toFixed(2)} m</strong>
            </div>
            <button
              type="button"
              onClick={() => onTransferToOldStock(art, m.physicalUsable, cData.date)}
              className="btn btn-success btn-sm w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2"
            >
              <i className="ti ti-building-warehouse fs-15"></i>
              <span>Transfer Verified Usable Balance ({m.physicalUsable.toFixed(2)} m) to Old Fabric Stock</span>
            </button>

            {rec.poStatus === 'Closed' ? (
              <div className="d-flex flex-column gap-2">
                <div className="p-2.5 rounded-3 bg-secondary-subtle border text-center fs-12 fw-bold text-dark d-flex align-items-center justify-content-center gap-2">
                  <i className="ti ti-lock-check fs-15 text-success"></i>
                  <span>
                    PO Closed ({Number(rec.closedMeters || 0).toFixed(2)} m → {rec.closeDisposition || 'Settled'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReopenPO}
                  className="btn btn-outline-primary btn-sm w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                >
                  <i className="ti ti-lock-open fs-15"></i>
                  <span>Re-open PO</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenClosePO}
                className="btn btn-outline-danger btn-sm w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
              >
                <i className="ti ti-circle-x fs-15"></i>
                <span>Close PO Manually</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Close PO Reconciliation Modal */}
      {showCloseModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 1060 }}
          onClick={() => setShowCloseModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold fs-16 mb-0">
                  Close Cutting PO — {rec.poNumber}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCloseModal(false)} />
              </div>

              <div className="modal-body p-4 d-flex flex-column gap-3">
                {closeError && (
                  <div className="alert alert-danger py-2 px-3 fs-12 fw-semibold mb-0">
                    {closeError}
                  </div>
                )}

                <div className="p-3 rounded-3 bg-light border d-flex justify-content-between align-items-center fs-12">
                  <span className="fw-semibold text-secondary">Remaining Fabric Balance:</span>
                  <span className="font-monospace fw-bold text-dark fs-14">
                    {remainingMetersForAlert.toFixed(2)} m ({remainingPctOfAvailable.toFixed(2)}%)
                  </span>
                </div>

                <div>
                  <label className="form-label fs-11 fw-bold text-secondary text-uppercase mb-1">
                    Enter Fabric Amount to Add to Stock / Reject (m) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={closeAmount}
                    onChange={(e) => {
                      setCloseError('');
                      setCloseAmount(e.target.value);
                    }}
                    className="form-control form-control-sm font-monospace fw-bold fs-14"
                  />
                </div>

                {isRemainingOver3PctAlert && (
                  <div className="p-3 rounded-3 bg-warning-subtle border border-warning">
                    <div className="fs-11 fw-bold text-warning-emphasis mb-2">
                      Remaining fabric exceeds 3% ({remainingPctOfAvailable.toFixed(2)}%). Admin approval is required to close this PO:
                    </div>
                    <label className="d-flex align-items-center gap-2 mb-0 fs-12 fw-bold text-dark" style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={closeAdminApproved}
                        onChange={(e) => {
                          setCloseError('');
                          setCloseAdminApproved(e.target.checked);
                        }}
                        style={{ width: 16, height: 16 }}
                      />
                      <span>Admin Approves Closing PO with Remaining Fabric</span>
                    </label>
                  </div>
                )}

                <div className="fs-12 text-secondary fw-semibold">
                  Choose where to move the remaining fabric ({Number(parseFloat(closeAmount) || 0).toFixed(2)} m):
                </div>
              </div>

              <div className="modal-footer border-top px-4 py-3 d-flex justify-content-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="btn btn-light border btn-sm px-3 fw-semibold"
                >
                  Cancel
                </button>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleConfirmClosePO('reject')}
                    className="btn btn-danger btn-sm px-3 fw-bold d-flex align-items-center gap-1"
                  >
                    <i className="ti ti-ban fs-14"></i>
                    <span>Move to Reject</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmClosePO('stock')}
                    className="btn btn-success btn-sm px-3 fw-bold d-flex align-items-center gap-1"
                  >
                    <i className="ti ti-building-warehouse fs-14"></i>
                    <span>Add to Stock</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Old Fabric Stock Ledger */}
      <div className="card border-0 shadow-sm p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h6 className="fw-bold text-dark mb-0">Old Fabric Stock Ledger</h6>
            <div className="text-secondary fs-11">Verified usable fabric balances transferred after Step 6 physical count</div>
          </div>
          <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace fs-12">
            Total: {(oldFabricStock || []).reduce((s, i) => s + (parseFloat(i.usableMeters) || 0), 0).toFixed(2)} m
          </span>
        </div>

        {(oldFabricStock || []).length === 0 ? (
          <div className="p-3 rounded-3 bg-light border text-secondary fs-12 text-center">
            No old fabric stock transferred yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 fs-12">
              <thead>
                <tr>
                  <th>Stock ID</th>
                  <th>Date</th>
                  <th>Cutting PO</th>
                  <th>Style / Article</th>
                  <th>Color</th>
                  <th>Lot ID</th>
                  <th>Width</th>
                  <th className="text-end">Usable Balance (m)</th>
                </tr>
              </thead>
              <tbody>
                {oldFabricStock.map((item) => (
                  <tr key={item.id}>
                    <td className="font-monospace fw-bold text-primary">{item.id}</td>
                    <td className="font-monospace">{item.date || '—'}</td>
                    <td className="font-monospace fw-semibold">{item.poNumber}</td>
                    <td className="fw-semibold">{item.style}</td>
                    <td>{item.color || '—'}</td>
                    <td className="font-monospace">{item.lotId}</td>
                    <td className="font-monospace">{item.width || '—'}</td>
                    <td className="text-end font-monospace fw-bold text-success">{Number(item.usableMeters || 0).toFixed(2)} m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
