import React, { useEffect, useState } from 'react';
import {
  getActiveArticlesList,
  getArticleCuttingStats,
  getLayerArticles,
  getOverOrderDiscrepancies,
  getSizeBreakdown,
  hasUnapprovedRepeatedSizes
} from '../../data/cuttingData';
import { getStoredLayerMen } from '../Masters/LayerManMasterView';

/**
 * Step 4: Layer-by-Layer Cutting Sheet
 * Separate sheet per article, continuation sheets, repeated-size governance approval, crew sign-off.
 */
export default function Step4CuttingSheet({
  rec,
  styleObj,
  colorObj,
  userRole,
  onUpdateRec,
  onProceedToStep5,
  showToast
}) {
  const [layerMenList, setLayerMenList] = useState(getStoredLayerMen);

  useEffect(() => {
    const syncLayerMen = () => setLayerMenList(getStoredLayerMen());
    window.addEventListener('erp_layer_men_updated', syncLayerMen);
    window.addEventListener('storage', syncLayerMen);
    return () => {
      window.removeEventListener('erp_layer_men_updated', syncLayerMen);
      window.removeEventListener('storage', syncLayerMen);
    };
  }, []);

  if (!styleObj) {
    return (
      <div className="card border-0 shadow-sm p-5 text-center text-secondary fs-13">
        Select a Design / Style in Step 2 first.
      </div>
    );
  }

  const articles = getActiveArticlesList(rec, styleObj);
  const art = articles.includes(rec.activeCuttingArticleTab) ? rec.activeCuttingArticleTab : articles[0];
  const artLayers = (rec.layers || []).filter((l) => getLayerArticles(l, rec, styleObj).includes(art));
  const artStats = getArticleCuttingStats(art, rec, styleObj);
  const targetBreakdown = getSizeBreakdown(rec, styleObj);
  const unapprovedRepeats = hasUnapprovedRepeatedSizes(rec);
  const overOrderIssues = getOverOrderDiscrepancies(rec, styleObj);
  const hasUnapprovedOverOrder = overOrderIssues.some((x) => !x.approved);

  // Open 1 Layer by default when Step 4 has no layers yet (selecting Together if cutTogether is enabled)
  useEffect(() => {
    if (!styleObj || !art) return;
    if ((rec.layers || []).length === 0) {
      const defaultArts = rec.cutTogether && articles.length > 1 ? [...articles] : [art];
      const mults = {};
      (styleObj.sizes || []).forEach((sz) => {
        const isActive = rec.selectedSizes?.length ? rec.selectedSizes.includes(sz) : true;
        mults[sz] = isActive ? 1 : 0;
      });
      const defaultLayer = {
        id: Date.now() + Math.random(),
        layerNo: 1,
        date: '',
        articles: defaultArts,
        article: defaultArts.join(' + '),
        layerLength: '',
        pallaQty: '',
        multipliers: mults,
        repeatedSizeApprovedBy: '',
        overOrderApprovedBy: ''
      };
      onUpdateRec({ layers: [defaultLayer] });
    }
  }, [art, styleObj?.styleName]);

  const handleAddLayer = (chosenArticles = [art]) => {
    const finalArts = Array.isArray(chosenArticles) && chosenArticles.length > 0 ? [...chosenArticles] : [art];
    const mults = {};
    (styleObj.sizes || []).forEach((sz) => {
      const isActive = rec.selectedSizes?.length ? rec.selectedSizes.includes(sz) : true;
      mults[sz] = isActive ? 1 : 0;
    });
    const newLayer = {
      id: Date.now() + Math.random(),
      layerNo: artLayers.length + 1,
      date: '',
      articles: finalArts,
      article: finalArts.join(' + '),
      layerLength: '',
      pallaQty: '',
      multipliers: mults,
      repeatedSizeApprovedBy: '',
      overOrderApprovedBy: ''
    };
    onUpdateRec({ layers: [...(rec.layers || []), newLayer] });
  };

  const handleSetLayerArticles = (layerId, chosenArticles) => {
    const nextPatch = {
      layers: (rec.layers || []).map((l) =>
        l.id === layerId
          ? {
              ...l,
              articles: [...chosenArticles],
              article: chosenArticles.join(' + '),
              overOrderApprovedBy: ''
            }
          : l
      )
    };
    if (!chosenArticles.includes(art) && chosenArticles.length > 0) {
      nextPatch.activeCuttingArticleTab = chosenArticles[0];
    }
    onUpdateRec(nextPatch);
  };

  const handleApproveOverOrder = () => {
    onUpdateRec({
      layers: (rec.layers || []).map((l) => ({ ...l, overOrderApprovedBy: 'Admin Approved' }))
    });
    if (showToast) showToast('Admin approval recorded for cutting quantity exceeding PO order!', 'success');
  };

  const handleRemoveLayer = (id) => {
    onUpdateRec({ layers: (rec.layers || []).filter((l) => l.id !== id) });
  };

  const handleUpdateLayerField = (id, field, val) => {
    onUpdateRec({
      layers: (rec.layers || []).map((l) => (l.id === id ? { ...l, [field]: val } : l))
    });
  };

  const handleAdjustMultiplier = (id, sz, delta) => {
    onUpdateRec({
      layers: (rec.layers || []).map((l) => {
        if (l.id !== id) return l;
        const curr = parseInt(l.multipliers?.[sz], 10) || 0;
        return {
          ...l,
          multipliers: { ...l.multipliers, [sz]: Math.max(0, curr + delta) },
          repeatedSizeApprovedBy: ''
        };
      })
    });
  };

  const handleToggleLayerSize = (id, sz) => {
    onUpdateRec({
      layers: (rec.layers || []).map((l) => {
        if (l.id !== id) return l;
        const curr = parseInt(l.multipliers?.[sz], 10) || 0;
        return {
          ...l,
          multipliers: { ...l.multipliers, [sz]: curr > 0 ? 0 : 1 },
          repeatedSizeApprovedBy: ''
        };
      })
    });
  };

  const handleSelectAllLayerSizes = (id) => {
    onUpdateRec({
      layers: (rec.layers || []).map((l) => {
        if (l.id !== id) return l;
        const nextMults = { ...(l.multipliers || {}) };
        (styleObj.sizes || []).forEach((sz) => {
          nextMults[sz] = Math.max(1, parseInt(nextMults[sz], 10) || 0);
        });
        return { ...l, multipliers: nextMults, repeatedSizeApprovedBy: '' };
      })
    });
  };

  const handleApproveAllRepeats = () => {
    const approver = userRole === 'All' ? 'Cutting Master' : userRole;
    onUpdateRec({
      layers: (rec.layers || []).map((l) => {
        const hasRepeat = Object.values(l.multipliers || {}).some((m) => (parseInt(m, 10) || 0) > 1);
        return hasRepeat ? { ...l, repeatedSizeApprovedBy: approver } : l;
      })
    });
    if (showToast) showToast(`Repeated size markers approved by ${approver}.`, 'success');
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="card border-0 shadow-sm p-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-10 text-uppercase">
                Step 4 · Floor Layer Execution
              </span>
              <span className="font-monospace fs-12 fw-bold text-secondary">Sheet #{rec.sheetNumber || 1}</span>
            </div>
            <h4 className="fw-bold text-dark mb-1">Cutting Sheet — Layer-by-Layer &amp; Palla (Ply) Entry</h4>
            <p className="text-secondary fs-12 mb-0">
              Separate sheet per article so quantities never mix. Extracting a size &gt;1 time triggers Admin/Cutting Master approval.
            </p>
          </div>
        </div>
      </div>

      {/* Article Tabs + Add Layer */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="d-flex flex-wrap align-items-center gap-2">
          {articles.map((articleTab) => {
            const active = art === articleTab;
            const st = getArticleCuttingStats(articleTab, rec, styleObj);
            return (
              <button
                key={articleTab}
                type="button"
                onClick={() => onUpdateRec({ activeCuttingArticleTab: articleTab })}
                className={`btn btn-sm px-3 fw-semibold d-flex align-items-center gap-2 ${
                  active ? 'btn-primary' : 'btn-light border text-secondary'
                }`}
              >
                <i className="ti ti-scissors fs-14"></i>
                <span>{rec.selectedStyle} — {articleTab} Sheet</span>
                <span className="badge bg-white text-dark border font-monospace fs-10">{st.totalGarmentsCut} pcs</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Governance Alert for Over-Order Cutting Qty (Admin Approval Required) */}
      {hasUnapprovedOverOrder ? (
        <div className="p-3 rounded-3 bg-danger-subtle border border-danger d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="text-danger fs-12">
            <div className="fw-bold d-flex align-items-center gap-1.5">
              <i className="ti ti-shield-lock fs-16"></i>
              <span>ADMIN APPROVAL REQUIRED: Cut quantity exceeds PO Target Qty!</span>
            </div>
            <div className="fs-11 mt-0.5 fw-semibold">
              {overOrderIssues
                .filter((x) => !x.approved)
                .map((x) => `${x.article} [${x.size}: Cut ${x.cutQty} vs PO ${x.orderedQty}, +${x.excess} extra]`)
                .join(' · ')}
            </div>
          </div>
          <button
            type="button"
            onClick={handleApproveOverOrder}
            className="btn btn-danger btn-sm px-3 fw-bold"
          >
            Admin Approve Excess Qty
          </button>
        </div>
      ) : overOrderIssues.length > 0 ? (
        <div className="p-2.5 rounded-3 bg-success-subtle border border-success-subtle text-success fs-12 fw-bold d-flex align-items-center gap-2">
          <i className="ti ti-circle-check fs-16"></i>
          <span>
            Admin Approved Excess Cutting Qty (
            {overOrderIssues.map((x) => `${x.article} ${x.size}: ${x.cutQty}/${x.orderedQty}`).join(', ')}).
          </span>
        </div>
      ) : null}

      {/* Layer Cards */}
      <div className="d-flex flex-column gap-3">
        {artLayers.length === 0 ? (
          <div className="card border-0 shadow-sm p-5 text-center text-secondary fs-12">
            No layers added yet for <strong>{art}</strong>. Click <strong>+ Add Layer to {art} Sheet</strong> below.
          </div>
        ) : (
          artLayers.map((layer, idx) => {
            const layerArts = getLayerArticles(layer, rec, styleObj);
            const layerMeters = (parseFloat(layer.layerLength) || 0) * (parseInt(layer.pallaQty, 10) || 0);
            const layerPieces = (styleObj.sizes || []).reduce(
              (s, sz) => s + ((parseInt(layer.multipliers?.[sz], 10) || 0) * (parseInt(layer.pallaQty, 10) || 0)),
              0
            );
            const hasRepeat = Object.values(layer.multipliers || {}).some((m) => (parseInt(m, 10) || 0) > 1);

            return (
              <div key={layer.id} className="card border-0 shadow-sm p-4 d-flex flex-column gap-3">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom pb-3">
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace fs-11">
                      Layer #{idx + 1}
                    </span>
                    <span className="fw-bold text-dark fs-13">
                      {rec.selectedStyle} — {layerArts.join(' + ')} {colorObj ? `(${colorObj.name})` : ''}
                    </span>
                    {layer.overOrderApprovedBy && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle fs-10">
                        ✓ Admin Excess Approved
                      </span>
                    )}
                  </div>

                  <div className="d-flex align-items-center gap-4">
                    <div className="text-end">
                      <div className="text-muted fs-10">Layer Fabric Used</div>
                      <div className="font-monospace fw-bold text-dark fs-14">{layerMeters.toFixed(2)} mts</div>
                    </div>
                    <div className="text-end">
                      <div className="text-muted fs-10">Pieces Cut in Layer</div>
                      <div className="font-monospace fw-bold text-success fs-14">{layerPieces} pcs</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLayer(layer.id)}
                      className="btn btn-outline-danger btn-xs py-1 px-2"
                      title="Delete Layer"
                    >
                      <i className="ti ti-trash fs-12"></i>
                    </button>
                  </div>
                </div>

                {articles.length > 1 && (() => {
                  const pairCombos = [];
                  if (articles.length >= 3) {
                    for (let i = 0; i < articles.length; i++) {
                      for (let j = i + 1; j < articles.length; j++) {
                        pairCombos.push([articles[i], articles[j]]);
                      }
                    }
                  }
                  const isExactCombo = (combo) =>
                    combo.length === layerArts.length && combo.every((a) => layerArts.includes(a));

                  return (
                    <div className="p-2.5 rounded-3 bg-light border d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <span className="fs-11 fw-bold text-secondary">
                        Layer #{idx + 1} Cutting Option:
                      </span>
                      <div className="d-flex flex-wrap gap-1.5">
                        {articles.map((aOpt) => {
                          const combo = [aOpt];
                          const active = isExactCombo(combo);
                          return (
                            <button
                              key={aOpt}
                              type="button"
                              onClick={() => handleSetLayerArticles(layer.id, combo)}
                              className={`btn btn-xs px-2.5 py-1 fw-semibold ${
                                active ? 'btn-dark text-white' : 'btn-white border text-secondary'
                              }`}
                            >
                              Only {aOpt}
                            </button>
                          );
                        })}
                        {pairCombos.map((combo) => {
                          const active = isExactCombo(combo);
                          return (
                            <button
                              key={combo.join('+')}
                              type="button"
                              onClick={() => handleSetLayerArticles(layer.id, combo)}
                              className={`btn btn-xs px-2.5 py-1 fw-semibold ${
                                active ? 'btn-info text-dark border-info' : 'btn-white border text-secondary'
                              }`}
                            >
                              {combo.join(' + ')}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => handleSetLayerArticles(layer.id, articles)}
                          className={`btn btn-xs px-2.5 py-1 fw-semibold ${
                            isExactCombo(articles) ? 'btn-primary' : 'btn-white border text-secondary'
                          }`}
                        >
                          {articles.join(' + ')} Together
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Layer Inputs */}
                <div className="row g-3">
                  <div className="col-12 col-sm-4">
                    <label className="form-label fs-11 fw-semibold text-secondary mb-1">Layer Cutting Date</label>
                    <input
                      type="date"
                      value={layer.date}
                      onChange={(e) => handleUpdateLayerField(layer.id, 'date', e.target.value)}
                      className="form-control form-control-sm fw-semibold"
                    />
                  </div>
                  <div className="col-12 col-sm-4">
                    <label className="form-label fs-11 fw-semibold text-secondary mb-1">Layer Length (mts per palla)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={layer.layerLength}
                      onChange={(e) => handleUpdateLayerField(layer.id, 'layerLength', e.target.value)}
                      className="form-control form-control-sm font-monospace fw-bold"
                    />
                  </div>
                  <div className="col-12 col-sm-4">
                    <label className="form-label fs-11 fw-semibold text-secondary mb-1">Palla (Ply) Qty</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={layer.pallaQty}
                      onChange={(e) => handleUpdateLayerField(layer.id, 'pallaQty', e.target.value)}
                      className="form-control form-control-sm font-monospace fw-bold text-primary"
                    />
                  </div>
                </div>

                {/* Garment Sizes & Qty per Palla */}
                <div>
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                    <div className="fw-bold text-dark fs-12">Garment Sizes &amp; Qty Per Palla (- / +):</div>
                    <button
                      type="button"
                      onClick={() => handleSelectAllLayerSizes(layer.id)}
                      className="btn btn-outline-primary btn-xs px-2.5 py-0.5 fw-semibold fs-11"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="row g-2">
                    {(styleObj.sizes || []).map((sz) => {
                      const mult = parseInt(layer.multipliers?.[sz], 10) || 0;
                      const isSizeSelected = mult > 0;
                      const pallaVal = parseInt(layer.pallaQty, 10) || 0;
                      const cutQty = mult * pallaVal;
                      const refArt = layerArts[0] || art;
                      const totalCutAcrossLayers = getArticleCuttingStats(refArt, rec, styleObj).sizeTotals[sz] || 0;
                      const poTargetQty = targetBreakdown[sz] || 0;
                      const exceedsOrder = poTargetQty > 0 && totalCutAcrossLayers > poTargetQty;

                      return (
                        <div key={sz} className="col-6 col-sm-4 col-md-3 col-lg-2">
                          <div
                            onClick={() => handleToggleLayerSize(layer.id, sz)}
                            className={`p-2 rounded-3 border text-center ${
                              exceedsOrder
                                ? 'bg-danger-subtle border-danger'
                                : isSizeSelected
                                  ? 'bg-primary-subtle border-primary-subtle'
                                  : 'bg-light opacity-50'
                            }`}
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                          >
                            <div className="fw-bold text-dark fs-12 d-inline-flex align-items-center gap-1">
                              <i className={`ti ${isSizeSelected ? 'ti-square-check text-primary' : 'ti-square text-muted'}`}></i>
                              <span>{sz}</span>
                            </div>
                            <div className="d-flex align-items-center justify-content-center gap-2 my-1">
                              <button
                                type="button"
                                disabled={!isSizeSelected}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAdjustMultiplier(layer.id, sz, -1);
                                }}
                                className="btn btn-light border btn-xs px-2 fw-bold"
                              >
                                -
                              </button>
                              <span className="font-monospace fw-bold text-primary fs-14" style={{ minWidth: 18 }}>
                                {mult}
                              </span>
                              <button
                                type="button"
                                disabled={!isSizeSelected}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAdjustMultiplier(layer.id, sz, 1);
                                }}
                                className="btn btn-primary btn-xs px-2 fw-bold"
                              >
                                +
                              </button>
                            </div>
                            <div className="font-monospace fw-bold text-success bg-white rounded border py-0.5 fs-11">
                              = {cutQty} pcs
                            </div>
                            <div
                              className={`font-monospace fw-bold fs-10 mt-1 px-1 py-0.5 rounded ${
                                exceedsOrder
                                  ? 'bg-danger text-white'
                                  : 'text-secondary'
                              }`}
                            >
                              Cut {totalCutAcrossLayers} / PO {poTargetQty}{exceedsOrder ? ' (OVER!)' : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div className="d-flex flex-wrap justify-content-start gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleAddLayer([art])}
            className="btn btn-primary btn-sm px-3 fw-semibold d-flex align-items-center gap-1"
          >
            <i className="ti ti-plus fs-14"></i>
            <span>Add Layer to {art} Sheet</span>
          </button>
          {articles.length > 1 && (
            <button
              type="button"
              onClick={() => handleAddLayer(articles)}
              className="btn btn-outline-primary btn-sm px-3 fw-semibold d-flex align-items-center gap-1"
            >
              <i className="ti ti-layers-intersect fs-14"></i>
              <span>Add Combined Layer ({articles.join(' + ')})</span>
            </button>
          )}
        </div>
      </div>

      {/* Sizes Cut Summary & Crew Sign-Off */}
      <div className="card border border-dark shadow-sm p-4 d-flex flex-column gap-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <h6 className="fw-bold text-dark text-uppercase mb-0 fs-12">
            Sizes Cut &amp; Quantity Cut Summary — {rec.selectedStyle} ({art})
          </h6>
          <span className="font-monospace fs-12 fw-bold text-primary">
            Total Layer Fabric: {artStats.totalLayerMeters.toFixed(2)} m · Total Cut: {artStats.totalGarmentsCut} pcs
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-sm text-center mb-0 fs-12">
            <tbody>
              <tr className="bg-light fw-bold">
                <td className="text-start" style={{ width: 150 }}>Sizes Cut :</td>
                {(styleObj.sizes || []).map((sz) => (
                  <td key={sz} className="font-monospace">{sz}</td>
                ))}
              </tr>
              <tr className="font-monospace fw-bold fs-13">
                <td className="text-start font-sans fs-12 bg-light">PO Target Qty :</td>
                {(styleObj.sizes || []).map((sz) => (
                  <td key={sz} className="text-primary">{targetBreakdown[sz] || 0}</td>
                ))}
              </tr>
              <tr className="font-monospace fw-bold fs-14">
                <td className="text-start font-sans fs-12 bg-light">Quantity Cut :</td>
                {(styleObj.sizes || []).map((sz) => (
                  <td key={sz} className="text-success">{artStats.sizeTotals[sz] || 0}</td>
                ))}
              </tr>
              <tr className="font-monospace fw-semibold fs-12">
                <td className="text-start font-sans fs-12 bg-light">Balance to Cut :</td>
                {(styleObj.sizes || []).map((sz) => {
                  const rem = Math.max(0, (targetBreakdown[sz] || 0) - (artStats.sizeTotals[sz] || 0));
                  return (
                    <td key={sz} className={rem > 0 ? 'text-warning-emphasis' : 'text-muted'}>
                      {rem}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="row g-3 pt-1">
          <div className="col-12 col-sm-4">
            <label className="form-label fs-11 fw-bold text-secondary mb-1">Layer Man :</label>
            <select
              value={rec.signatures?.layerMan || ''}
              onChange={(e) =>
                onUpdateRec({ signatures: { ...rec.signatures, layerMan: e.target.value } })
              }
              className="form-select form-select-sm fw-semibold"
            >
              <option value="">
                {layerMenList.length === 0
                  ? '-- Select Layer Man (Add in Masters > Layer Man) --'
                  : '-- Select Layer Man --'}
              </option>
              {rec.signatures?.layerMan &&
                !layerMenList.some((lm) => lm.name === rec.signatures.layerMan) && (
                  <option value={rec.signatures.layerMan}>{rec.signatures.layerMan}</option>
                )}
              {layerMenList.map((lm) => (
                <option key={lm.id} value={lm.name}>
                  {lm.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-sm-4">
            <label className="form-label fs-11 fw-bold text-secondary mb-1">Cutting Master :</label>
            <input
              type="text"
              placeholder="Enter Cutting Master name..."
              value={rec.signatures?.cuttingMaster || ''}
              onChange={(e) =>
                onUpdateRec({ signatures: { ...rec.signatures, cuttingMaster: e.target.value } })
              }
              className="form-control form-control-sm fw-semibold"
            />
          </div>
          <div className="col-12 col-sm-4">
            <label className="form-label fs-11 fw-bold text-secondary mb-1">Checking Master :</label>
            <input
              type="text"
              placeholder="Enter Checking Master name..."
              value={rec.signatures?.checkingMaster || ''}
              onChange={(e) =>
                onUpdateRec({ signatures: { ...rec.signatures, checkingMaster: e.target.value } })
              }
              className="form-control form-control-sm fw-semibold"
            />
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 pt-3 border-top">
          <button
            type="button"
            onClick={() => {
              const nextNum = (rec.sheetNumber || 1) + 1;
              onUpdateRec({ sheetNumber: nextNum });
              if (showToast) showToast(`Created continuation Cutting Sheet #${nextNum}.`, 'info');
            }}
            className="btn btn-light border btn-sm px-3 text-secondary fw-semibold d-flex align-items-center gap-1"
          >
            <i className="ti ti-copy fs-14"></i>
            <span>+ Continuation Sheet (#{(rec.sheetNumber || 1) + 1})</span>
          </button>
          <button
            type="button"
            onClick={onProceedToStep5}
            className="btn btn-primary btn-sm px-4 py-2 fw-semibold d-flex align-items-center gap-2"
          >
            <span>Proceed to Step 5 &amp; 6: Consumption</span>
            <i className="ti ti-arrow-right fs-14"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
