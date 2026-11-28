import React, { useState } from 'react';
import {
  computeLotYieldSummary,
  getActiveArticlesList,
  getCombinedAvgLength,
  getSizeBreakdown,
  getTallyTotalMeters,
  getTotalGarmentsFromBreakdown
} from '../../data/cuttingData';

/**
 * Step 2: Creating the Cutting PO (P1)
 * Zero pre-filled fields except auto-generated PO Number.
 * Supports cascading ERP Styles/Lots AND manual custom style/lot entry.
 */
export default function Step2CuttingPO({
  rec,
  erpCatalog,
  styleObj,
  colorObj,
  lotObj,
  onUpdateRec,
  onCreateBlankPO,
  onSavePO,
  showToast
}) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showAllLots, setShowAllLots] = useState(false);
  const [customForm, setCustomForm] = useState({
    styleName: '',
    fabricName: '',
    articlesText: '',
    avgLength: '',
    sizesText: '',
    colorName: '',
    lotId: '',
    lotName: '',
    availableMeters: '',
    width: ''
  });

  const activeArticles = getActiveArticlesList(rec, styleObj);
  const combinedAvg = getCombinedAvgLength(rec, styleObj);
  const talliedAvailable = getTallyTotalMeters(rec) > 0 ? getTallyTotalMeters(rec) : (lotObj ? lotObj.availableMeters : 0);
  const maxYieldFromLot = (styleObj && lotObj && combinedAvg > 0) ? Math.floor(talliedAvailable / combinedAvg) : 0;
  const breakdown = getSizeBreakdown(rec, styleObj);
  const totalPieces = getTotalGarmentsFromBreakdown(rec, styleObj);

  const styleNamesList = Object.keys(erpCatalog || {});
  if (rec.customStyleSpec?.styleName && !styleNamesList.includes(rec.customStyleSpec.styleName)) {
    styleNamesList.unshift(rec.customStyleSpec.styleName);
  }

  const handleStyleChange = (styleName) => {
    const selectedSpec = (rec.customStyleSpec && rec.customStyleSpec.styleName === styleName)
      ? rec.customStyleSpec
      : erpCatalog[styleName];

    if (styleName && selectedSpec) {
      const arts = Object.keys(selectedSpec.articles || {});
      const initialConsumption = {};
      arts.forEach((a) => {
        initialConsumption[a] = {
          date: '',
          foldingStandard: 100,
          trims: [{ id: Date.now() + Math.random(), label: 'A', name: '', metersPerPc: '' }],
          physicalCountedUsable: '',
          tukdaScrapMeters: ''
        };
      });
      onUpdateRec({
        selectedStyle: styleName,
        selectedColor: '',
        selectedLotId: '',
        garmentsToCut: '',
        fabricToIssue: '',
        fabricWidthInput: '',
        manualSizeQuantities: {},
        selectedSizes: [...(selectedSpec.sizes || [])],
        selectedArticles: arts,
        activeCuttingArticleTab: arts[0] || '',
        activeConsumptionArticle: arts[0] || '',
        layers: [],
        consumptionData: initialConsumption
      });
    } else {
      onUpdateRec({
        selectedStyle: '',
        selectedColor: '',
        selectedLotId: '',
        selectedSizes: [],
        selectedArticles: [],
        garmentsToCut: '',
        fabricToIssue: '',
        fabricWidthInput: ''
      });
    }
  };

  const handleColorSelect = (colorName) => {
    onUpdateRec({
      selectedColor: colorName,
      selectedLotId: '',
      garmentsToCut: '',
      fabricToIssue: ''
    });
  };

  const handleLotSelect = (lotId) => {
    const lot = colorObj?.lots?.find((l) => l.lotId === lotId) || null;
    if (!lot || !styleObj) {
      onUpdateRec({ selectedLotId: lotId, garmentsToCut: '', fabricToIssue: '' });
      return;
    }
    const arts = lot.articlesInLot?.length ? [...lot.articlesInLot] : Object.keys(styleObj.articles || {});
    const lotAvg = arts.reduce((sum, a) => sum + (styleObj.articles?.[a]?.avgLength || 1.5), 0);
    const availMeters = getTallyTotalMeters(rec) > 0 ? getTallyTotalMeters(rec) : (parseFloat(lot.availableMeters) || 0);
    const rawUnits = lotAvg > 0 ? Math.floor(availMeters / lotAvg) : 0;
    const activeSizes = rec.selectedSizes?.length ? rec.selectedSizes : (styleObj.sizes || []);
    const totalW = activeSizes.reduce((s, sz) => s + (styleObj.ratio?.[sz] || 1), 0);
    const calcGarments = (rec.useRatioDistribution && totalW > 0)
      ? Math.floor(rawUnits / totalW) * totalW
      : rawUnits;
    const calcMeters = calcGarments > 0 ? Number((calcGarments * lotAvg).toFixed(2)) : (availMeters > 0 ? Number(availMeters.toFixed(2)) : '');

    onUpdateRec({
      selectedLotId: lotId,
      cutTogether: Boolean(lot.dyedTogether),
      selectedArticles: arts,
      activeCuttingArticleTab: arts[0] || '',
      activeConsumptionArticle: arts[0] || '',
      fabricWidthInput: lot.width || styleObj.greyWidth || '',
      selectedSizes: activeSizes,
      garmentsToCut: calcGarments || '',
      fabricToIssue: calcMeters
    });
  };

  const handleAcceptSuggestion = () => {
    if (!styleObj || !lotObj) return;
    const tallied = getTallyTotalMeters(rec) > 0 ? getTallyTotalMeters(rec) : lotObj.availableMeters;
    const rawGarments = combinedAvg > 0 ? Math.floor(tallied / combinedAvg) : 0;
    const sizesList = [...(styleObj.sizes || [])];
    const totalW = sizesList.reduce((s, sz) => s + (styleObj.ratio?.[sz] || 1), 0);
    const calcGarments = totalW > 0 ? Math.floor(rawGarments / totalW) * totalW : rawGarments;
    const calcMeters = Number((calcGarments * combinedAvg).toFixed(2));
    onUpdateRec({
      selectedSizes: sizesList,
      useRatioDistribution: true,
      fabricToIssue: calcMeters,
      garmentsToCut: calcGarments
    });
    if (showToast) showToast('System suggestion applied to Cutting PO.', 'success');
  };

  const handleGarmentsInput = (rawVal) => {
    if (rawVal === '') {
      onUpdateRec({ garmentsToCut: '', fabricToIssue: '' });
      return;
    }
    const garments = Math.max(0, parseInt(rawVal, 10) || 0);
    const calcMeters = Number((garments * combinedAvg).toFixed(2));
    onUpdateRec({ garmentsToCut: garments, fabricToIssue: calcMeters });
  };

  const handleFabricInput = (rawVal) => {
    if (rawVal === '') {
      onUpdateRec({ fabricToIssue: '', garmentsToCut: '' });
      return;
    }
    const meters = Math.max(0, parseFloat(rawVal) || 0);
    const calcGarments = combinedAvg > 0 ? Math.floor(meters / combinedAvg) : 0;
    onUpdateRec({ fabricToIssue: meters, garmentsToCut: calcGarments });
  };

  const handleToggleArticle = (artKey) => {
    const current = rec.selectedArticles || [];
    let next;
    if (current.includes(artKey)) {
      if (current.length <= 1) {
        if (showToast) showToast('At least one article must remain selected.', 'warning');
        return;
      }
      next = current.filter((a) => a !== artKey);
    } else {
      next = [...current, artKey];
    }
    onUpdateRec({ selectedArticles: next });
  };

  const handleToggleSize = (sz) => {
    const current = rec.selectedSizes || [];
    const next = current.includes(sz)
      ? current.filter((s) => s !== sz)
      : [...current, sz];
    onUpdateRec({ selectedSizes: next });
  };

  const handleManualSizeQty = (sz, rawVal) => {
    const baseManual = rec.useRatioDistribution ? { ...breakdown } : (rec.manualSizeQuantities || {});
    const nextManual = {
      ...baseManual,
      [sz]: rawVal === '' ? '' : Math.max(0, parseInt(rawVal, 10) || 0)
    };
    const total = (rec.selectedSizes || []).reduce((sum, s) => sum + (parseInt(nextManual[s], 10) || 0), 0);
    onUpdateRec({
      useRatioDistribution: false,
      manualSizeQuantities: nextManual,
      garmentsToCut: total,
      fabricToIssue: total > 0 ? Number((total * combinedAvg).toFixed(2)) : ''
    });
  };

  const handleSaveCustomStyleAndLot = (e) => {
    e.preventDefault();
    const sName = customForm.styleName.trim();
    const cName = customForm.colorName.trim();
    const lId = customForm.lotId.trim();
    const avail = parseFloat(customForm.availableMeters) || 0;
    if (!sName || !cName || !lId || avail <= 0) {
      if (showToast) showToast('Enter Style Name, Color, Lot ID, and Available Meters.', 'error');
      return;
    }
    const artNames = customForm.articlesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const finalArts = artNames.length > 0 ? artNames : ['Kurta'];
    const avgPerArt = parseFloat(customForm.avgLength) || 0;
    const articlesMap = {};
    finalArts.forEach((a) => {
      articlesMap[a] = { name: a, avgLength: avgPerArt, orderedPerSize: 0 };
    });

    const szList = customForm.sizesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const finalSizes = szList.length > 0 ? szList : ['M', 'L', 'XL', '2XL'];
    const ratio = {};
    finalSizes.forEach((sz) => { ratio[sz] = 1; });

    const newCustomSpec = {
      styleName: sName,
      fabricName: customForm.fabricName.trim(),
      greyWidth: '',
      kurtaLengthSpec: '',
      ratioLabel: finalSizes.map(() => '1').join(':'),
      ratio,
      sizes: finalSizes,
      articles: articlesMap,
      colors: [
        {
          name: cName,
          hex: '#64748b',
          orderedSets: 0,
          lots: [
            {
              lotId: lId,
              lotName: customForm.lotName.trim() || lId,
              thansCount: 0,
              availableMeters: avail,
              width: customForm.width.trim(),
              dyedTogether: finalArts.length > 1,
              articlesInLot: finalArts,
              shadeNote: 'Manual Lot Entry'
            }
          ]
        }
      ]
    };

    const initialConsumption = {};
    finalArts.forEach((a) => {
      initialConsumption[a] = {
        date: '',
        foldingStandard: 100,
        trims: [{ id: Date.now() + Math.random(), label: 'A', name: '', metersPerPc: '' }],
        physicalCountedUsable: '',
        tukdaScrapMeters: ''
      };
    });

    onUpdateRec({
      customStyleSpec: newCustomSpec,
      selectedStyle: sName,
      selectedColor: cName,
      selectedLotId: lId,
      selectedArticles: finalArts,
      selectedSizes: finalSizes,
      cutTogether: finalArts.length > 1,
      fabricWidthInput: customForm.width.trim(),
      activeCuttingArticleTab: finalArts[0],
      activeConsumptionArticle: finalArts[0],
      consumptionData: initialConsumption,
      garmentsToCut: '',
      fabricToIssue: ''
    });
    setShowCustomModal(false);
    if (showToast) showToast(`Configured style "${sName}" & lot "${lId}".`, 'success');
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Top Action & Mode Strip */}
      <div className="card border-0 shadow-sm p-3 px-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{ width: '40px', height: '40px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}
            >
              <i className="ti ti-scissors fs-20"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bold text-dark mb-0 fs-16">Create Cutting PO</h5>
                <span className="badge bg-light text-dark border font-monospace fs-11">{rec.poNumber}</span>
              </div>
              <p className="text-secondary fs-11 mb-0">
                1. Pick Style, Color &amp; Dyed Lot → 2. Set Size-Wise Cutting Quantities → 3. Save PO
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Style, Color & Dyed Fabric Lot */}
      <div className="card border-0 shadow-sm p-4 d-flex flex-column gap-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom pb-2">
          <h6 className="fw-bold text-dark mb-0 fs-14">
            <span className="badge bg-primary me-2">1</span>
            Select Style, Color &amp; Dyed Fabric Lot
          </h6>
          {styleObj && (
            <span className="badge bg-light text-dark border fs-11 font-monospace">
              Avg Consumption: {combinedAvg.toFixed(2)} m / {activeArticles.length > 1 ? 'set' : 'pc'}
            </span>
          )}
        </div>

        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label fs-11 fw-bold text-secondary text-uppercase mb-1">
              Design / Style Name <span className="text-danger">*</span>
            </label>
            <select
              value={rec.selectedStyle}
              onChange={(e) => handleStyleChange(e.target.value)}
              className="form-select form-select-sm fw-semibold"
              style={{ height: '38px' }}
            >
              <option value="">-- Select Design / Style --</option>
              {styleNamesList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label fs-11 fw-bold text-secondary text-uppercase mb-1">
              Color <span className="text-danger">*</span>
            </label>
            <select
              value={rec.selectedColor}
              onChange={(e) => handleColorSelect(e.target.value)}
              disabled={!styleObj || !styleObj.colors?.length}
              className="form-select form-select-sm fw-semibold"
              style={{ height: '38px' }}
            >
              <option value="">
                {!styleObj
                  ? '-- Select Style first --'
                  : styleObj.colors?.length > 0
                    ? '-- Select Color --'
                    : 'No colors found'}
              </option>
              {(styleObj?.colors || []).map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Direct Lot Cards (Shows 3 by default, with Show All button when > 3) */}
        <div>
          <label className="form-label fs-11 fw-bold text-secondary text-uppercase mb-1.5">
            Available Dyed Fabric Lots {colorObj ? `(${colorObj.name})` : ''}
          </label>
          {colorObj && colorObj.lots?.length > 0 ? (() => {
            const allLots = colorObj.lots;
            const visibleLots = showAllLots ? allLots : allLots.slice(0, 3);
            return (
              <div className="d-flex flex-column gap-2">
                {visibleLots.map((l) => {
                  const yInfo = computeLotYieldSummary(styleObj, l);
                  const isSelected = rec.selectedLotId === l.lotId;
                  return (
                    <div
                      key={l.lotId}
                      onClick={() => handleLotSelect(l.lotId)}
                      className={`p-3 rounded-3 border d-flex flex-wrap align-items-center justify-content-between gap-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary-subtle bg-opacity-25 shadow-xs'
                          : 'border-secondary-subtle bg-white hover-bg-light'
                      }`}
                      style={{ cursor: 'pointer', borderWidth: isSelected ? '2px' : '1px' }}
                    >
                      <div className="d-flex align-items-center gap-2.5">
                        <i className={`ti ${isSelected ? 'ti-circle-check-filled text-primary' : 'ti-circle text-muted'} fs-18`}></i>
                        <div>
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="fw-bold text-dark fs-13">{l.lotName}</span>
                            {l.width && (
                              <span className="badge bg-light text-dark border font-monospace fs-10">{l.width}</span>
                            )}
                          </div>
                          <div className="text-secondary fs-11 mt-0.5">
                            {l.shadeNote || 'Accepted'} · {l.thansCount} thans
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="font-monospace fw-bold text-dark fs-14">
                          {Number(l.availableMeters || 0).toFixed(2)} m available
                        </div>
                        <div className="d-inline-flex align-items-center gap-1 px-2 py-0.5 rounded bg-success-subtle text-success font-monospace fs-11 fw-bold mt-1">
                          <i className="ti ti-scissors fs-12"></i>
                          <span>{yInfo.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {allLots.length > 3 && (
                  <div className="d-flex justify-content-center pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAllLots((prev) => !prev)}
                      className="btn btn-light border btn-sm px-3 fw-semibold text-primary d-flex align-items-center gap-1"
                    >
                      <i className={`ti ${showAllLots ? 'ti-chevron-up' : 'ti-chevron-down'} fs-14`}></i>
                      <span>
                        {showAllLots
                          ? 'Show Fewer Lots (Top 3)'
                          : `Show All Lots (${allLots.length - 3} more · ${allLots.length} total)`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="p-3 rounded-3 bg-light border text-secondary fs-12">
              {colorObj
                ? 'No QC-Accepted dyed lots found for this style & color. Complete QC (Accepted) in Module 3 first.'
                : 'Select a Color above to view available dyed fabric lots.'}
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Articles, Quantity & Size-Wise Cutting Plan */}
      <div className="card border-0 shadow-sm p-4 d-flex flex-column gap-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom pb-2">
          <h6 className="fw-bold text-dark mb-0 fs-14">
            <span className="badge bg-primary me-2">2</span>
            Articles, Fabric Issue &amp; Size-Wise Cutting Quantities
          </h6>
          {lotObj && (
            <button
              type="button"
              onClick={handleAcceptSuggestion}
              className="btn btn-outline-primary btn-sm fw-semibold"
            >
              <i className="ti ti-sparkles me-1"></i>
              Auto-Fill Max ({maxYieldFromLot} {lotObj.dyedTogether ? 'Sets' : 'pcs'} from {Number(talliedAvailable).toFixed(1)}m)
            </button>
          )}
        </div>

        {!styleObj ? (
          <div className="p-4 text-center rounded-3 bg-light border text-secondary fs-12">
            Select a <strong>Style</strong>, <strong>Color</strong>, and <strong>Fabric Lot</strong> in Step 1 first.
          </div>
        ) : (
          <>
            {/* Decision 1: Dyed Lot Pairing (only shown when 2 or more articles were dyed together) */}
            {lotObj?.dyedTogether && (lotObj.articlesInLot || []).length >= 2 && (
              <div className="p-3 rounded-3 bg-primary-subtle border border-primary-subtle d-flex flex-column gap-2.5">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div>
                    <div className="text-uppercase fw-bold text-primary fs-10">
                      Decision 1 · Dyed Lot Pairing
                    </div>
                    <div className="fw-bold text-dark fs-13 mt-0.5">
                      &ldquo;Because {(lotObj.articlesInLot || []).join(' and ')} were dyed together, do you want to continue cutting them together?&rdquo;
                    </div>
                  </div>
                  <div className="d-flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateRec({ cutTogether: true, selectedArticles: [...(lotObj.articlesInLot || [])] })}
                      className={`btn btn-sm px-3 fw-bold ${rec.cutTogether ? 'btn-primary' : 'btn-white border text-dark'}`}
                    >
                      Yes — Cut Together
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateRec({ cutTogether: false, selectedArticles: [lotObj.articlesInLot?.[0] || activeArticles[0]] })}
                      className={`btn btn-sm px-3 fw-bold ${!rec.cutTogether ? 'btn-warning text-dark' : 'btn-white border text-dark'}`}
                    >
                      No — Cut Separately
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Articles Selection */}
            {(!lotObj?.dyedTogether || (lotObj.articlesInLot || []).length < 2 || !rec.cutTogether) && (
              <div className="p-3 rounded-3 bg-light border d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <span className="fw-bold text-dark fs-12 me-1">Articles to Cut:</span>
                  {((lotObj?.articlesInLot?.length ? lotObj.articlesInLot : Object.keys(styleObj.articles || {}))).map((artKey) => {
                    const isChecked = (rec.selectedArticles || []).includes(artKey);
                    const artLen = Number(styleObj.articles?.[artKey]?.avgLength || 0);
                    return (
                      <label
                        key={artKey}
                        className={`d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-2 border fs-12 fw-semibold mb-0 ${
                          isChecked ? 'bg-white border-primary text-primary' : 'bg-white text-secondary'
                        }`}
                        style={{ cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleArticle(artKey)}
                        />
                        <span>
                          {artKey}
                          {artLen > 0 && (
                            <span className="text-muted fw-normal"> ({artLen.toFixed(2)} m/pc)</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Select Qty — Clean 2-Card Layout */}
            <div className="d-flex flex-column gap-3">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                  <h6 className="fw-bold text-dark mb-0 fs-13">Select Cutting Quantity</h6>
                  <div className="text-secondary fs-11">
                    Enter either Fabric Meters or Garment Pieces — the other calculates automatically.
                  </div>
                </div>
                <div className="input-group input-group-sm" style={{ width: 155 }}>
                  <span className="input-group-text bg-light fw-bold text-secondary fs-11">Width</span>
                  <input
                    type="text"
                    placeholder='e.g. 48"'
                    value={rec.fabricWidthInput}
                    onChange={(e) => onUpdateRec({ fabricWidthInput: e.target.value })}
                    className="form-control font-monospace fw-bold fs-13"
                  />
                </div>
              </div>

              <div className="row g-3">
                {/* Option 1: By Fabric Meters */}
                <div className="col-12 col-md-6">
                  <div
                    onClick={() => onUpdateRec({ qtySelectionMethod: 'fabric' })}
                    className={`p-3 rounded-3 border bg-white h-100 d-flex flex-column justify-content-between gap-2.5 ${
                      rec.qtySelectionMethod === 'fabric'
                        ? 'border-success shadow-sm'
                        : 'border-secondary-subtle'
                    }`}
                    style={{ cursor: 'pointer', borderWidth: rec.qtySelectionMethod === 'fabric' ? '2px' : '1px' }}
                  >
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="rounded-2 bg-success-subtle text-success d-inline-flex align-items-center justify-content-center fw-bold fs-12"
                          style={{ width: 26, height: 26 }}
                        >
                          1
                        </span>
                        <div>
                          <div className="fw-bold text-dark fs-13">By Fabric Meters</div>
                          <div className="text-secondary fs-11">Auto-calculates cuttable garments</div>
                        </div>
                      </div>
                      <span className="badge bg-light text-secondary border font-monospace fs-10">
                        Max {Number(talliedAvailable || 0).toFixed(2)} m
                      </span>
                    </div>

                    <div className="input-group input-group-sm">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={rec.fabricToIssue}
                        onFocus={() => onUpdateRec({ qtySelectionMethod: 'fabric' })}
                        onChange={(e) => handleFabricInput(e.target.value)}
                        className="form-control font-monospace fw-bold text-dark fs-15"
                        style={{ height: '40px' }}
                      />
                      <span className="input-group-text bg-light fw-bold text-secondary font-monospace fs-12">
                        meters
                      </span>
                    </div>
                  </div>
                </div>

                {/* Option 2: By Garment Pieces */}
                <div className="col-12 col-md-6">
                  <div
                    onClick={() => onUpdateRec({ qtySelectionMethod: 'garments' })}
                    className={`p-3 rounded-3 border bg-white h-100 d-flex flex-column justify-content-between gap-2.5 ${
                      rec.qtySelectionMethod === 'garments'
                        ? 'border-primary shadow-sm'
                        : 'border-secondary-subtle'
                    }`}
                    style={{ cursor: 'pointer', borderWidth: rec.qtySelectionMethod === 'garments' ? '2px' : '1px' }}
                  >
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="rounded-2 bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center fw-bold fs-12"
                          style={{ width: 26, height: 26 }}
                        >
                          2
                        </span>
                        <div>
                          <div className="fw-bold text-dark fs-13">
                            {activeArticles.length > 1 ? 'By Sets (Per Article)' : 'By Garment Pieces'}
                          </div>
                          <div className="text-secondary fs-11">Auto-calculates required fabric</div>
                        </div>
                      </div>
                      {activeArticles.length > 1 && (
                        <span className="badge bg-light text-secondary border fs-10">
                          {activeArticles.join(' + ')}
                        </span>
                      )}
                    </div>

                    <div className="input-group input-group-sm">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={rec.garmentsToCut}
                        onFocus={() => onUpdateRec({ qtySelectionMethod: 'garments' })}
                        onChange={(e) => handleGarmentsInput(e.target.value)}
                        className="form-control font-monospace fw-bold text-dark fs-15"
                        style={{ height: '40px' }}
                      />
                      <span className="input-group-text bg-light fw-bold text-secondary font-monospace fs-12">
                        pcs
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-3 py-2 rounded-3 bg-light border d-flex flex-wrap align-items-center justify-content-between gap-2 fs-11 text-secondary">
                <span>
                  <i className="ti ti-info-circle text-primary me-1"></i>
                  Selected:{' '}
                  <strong className="text-dark">
                    {activeArticles.length > 1
                      ? activeArticles.map((a) => `${rec.garmentsToCut || 0} ${a}`).join(' + ')
                      : `${rec.garmentsToCut || 0} pcs`}
                  </strong>
                </span>
                <span className="text-muted">Distribute size-wise quantities below</span>
              </div>
            </div>

            {/* Order Ratio Suggestion + Per-Article Size-Wise Quantities */}
            <div className="d-flex flex-column gap-3">
              {/* Order Ratio Suggestion Prompt */}
              <div className="p-3 rounded-3 bg-info-subtle bg-opacity-50 border border-info-subtle d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <div className="text-uppercase fw-bold text-info-emphasis fs-10">
                    Order Ratio Suggestion
                  </div>
                  <div className="fw-bold text-dark fs-13 mt-0.5">
                    &ldquo;The order rcd is in size ratio {styleObj.ratioLabel || '1:1'}, do you want to keep the same ratio for cutting?&rdquo;
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateRec({ useRatioDistribution: true })}
                    className={`btn btn-sm px-3 fw-bold ${rec.useRatioDistribution ? 'btn-primary' : 'btn-white border text-dark'}`}
                  >
                    Yes — Same Ratio ({styleObj.ratioLabel || '1:1'})
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateRec({ useRatioDistribution: false, manualSizeQuantities: { ...breakdown } })}
                    className={`btn btn-sm px-3 fw-bold ${!rec.useRatioDistribution ? 'btn-dark text-white' : 'btn-white border text-dark'}`}
                  >
                    No — Fill Manually
                  </button>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between">
                <span className="fw-bold text-dark fs-12">
                  Select Sizes ({(rec.selectedSizes || []).length} of {(styleObj.sizes || []).length} selected):
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateRec({ selectedSizes: [...(styleObj.sizes || [])] })}
                  className="btn btn-link btn-sm p-0 fs-11 fw-semibold text-primary text-decoration-none"
                >
                  Select All Sizes
                </button>
              </div>

              {/* Separate Size-Wise Quantity Card per Article */}
              {activeArticles.map((art) => {
                const artSubtotal = (styleObj.sizes || []).reduce((sum, sz) => {
                  const active = (rec.selectedSizes || []).includes(sz);
                  if (!active) return sum;
                  const q = rec.useRatioDistribution
                    ? (breakdown[sz] || 0)
                    : (parseInt(rec.manualSizeQuantities?.[sz], 10) || 0);
                  return sum + q;
                }, 0);

                return (
                  <div key={art} className="border rounded-3 overflow-hidden bg-white">
                    <div className="px-3 py-2 bg-light border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <span className="fw-bold text-dark fs-12 d-flex align-items-center gap-1.5">
                        <i className="ti ti-shirt text-primary fs-14"></i>
                        <span>
                          {art} — Size-Wise Quantity ({rec.useRatioDistribution ? 'Auto-Distributed by Ratio' : 'Manual Entry'})
                        </span>
                      </span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace fs-11 px-2.5 py-1">
                        {art} Total: {artSubtotal} pcs
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="row g-2">
                        {(styleObj.sizes || []).map((sz) => {
                          const active = (rec.selectedSizes || []).includes(sz);
                          const qty = active
                            ? (rec.useRatioDistribution ? (breakdown[sz] || 0) : (rec.manualSizeQuantities?.[sz] ?? ''))
                            : 0;
                          return (
                            <div key={sz} className="col-4 col-sm-2">
                              <div className={`p-2 rounded-3 border ${active ? 'bg-white border-secondary-subtle' : 'bg-light opacity-50'}`}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSize(sz)}
                                  className="btn btn-link p-0 text-decoration-none fw-bold text-dark fs-12 d-flex align-items-center gap-1 mb-1"
                                >
                                  <i className={`ti ${active ? 'ti-square-check text-primary' : 'ti-square text-muted'}`}></i>
                                  <span>{sz}</span>
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={qty}
                                  readOnly={!active}
                                  onChange={(e) => handleManualSizeQty(sz, e.target.value)}
                                  className="form-control form-control-sm font-monospace fw-bold text-center"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Combined Cutting PO Count Summary Bar */}
              <div className="p-3 rounded-3 bg-success-subtle border border-success-subtle d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="fw-bold text-success-emphasis fs-12 d-flex align-items-center gap-2">
                  <i className="ti ti-calculator fs-15"></i>
                  <span>
                    {activeArticles.length > 1
                      ? `Combined Cutting PO Count (${activeArticles.join(' + ')}):`
                      : `Total Cutting PO Count (${activeArticles[0] || 'Garment'}):`}
                  </span>
                </div>
                <div className="font-monospace fw-bold text-success-emphasis fs-13">
                  {activeArticles.length > 1
                    ? `${activeArticles.map((a) => `${a}: ${totalPieces} pcs`).join(' + ')} = ${totalPieces * activeArticles.length} Total Pieces`
                    : `${activeArticles[0] || 'Garment'}: ${totalPieces} Total Pieces`}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Step 3: Remarks & Save */}
      <div className="card border-0 shadow-sm p-4 d-flex flex-column gap-3">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-lg-7">
            <label className="form-label fs-11 fw-bold text-secondary text-uppercase mb-1">
              Cutting Master Instructions / Remarks
            </label>
            <input
              type="text"
              placeholder="Optional notes on trims, couching, or garment length..."
              value={rec.poRemarks}
              onChange={(e) => onUpdateRec({ poRemarks: e.target.value })}
              className="form-control form-control-sm"
              style={{ height: '38px' }}
            />
          </div>
          <div className="col-12 col-lg-5 d-flex flex-wrap gap-2 justify-content-lg-end">
            <button
              type="button"
              onClick={() => onSavePO(false)}
              className="btn btn-success btn-sm px-4 py-2 fw-bold d-flex align-items-center gap-2"
            >
              <i className="ti ti-device-floppy fs-15"></i>
              <span>Save Cutting PO</span>
            </button>
            <button
              type="button"
              onClick={() => onSavePO(true)}
              className="btn btn-primary btn-sm px-4 py-2 fw-bold d-flex align-items-center gap-2"
            >
              <span>Save &amp; Go to Gate</span>
              <i className="ti ti-arrow-right fs-15"></i>
            </button>
          </div>
        </div>

        {rec.cutTogether && activeArticles.length > 1 && (
          <div className="p-2.5 px-3 rounded-3 bg-primary-subtle border border-primary-subtle fs-11 text-primary">
            <strong>Auto-Split Enabled:</strong> Saving generates{' '}
            <strong>{rec.poNumber}-A ({activeArticles[0]}: {totalPieces} pcs)</strong> and{' '}
            <strong>{rec.poNumber}-B ({activeArticles[1]}: {totalPieces} pcs)</strong>.
          </div>
        )}
      </div>

      {/* Inline Manual Style & Lot Modal (Zero pre-fill) */}
      {showCustomModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-white border-bottom">
                <h5 className="modal-title fw-bold fs-16">Enter Design / Style &amp; Fabric Lot</h5>
                <button type="button" className="btn-close" onClick={() => setShowCustomModal(false)} />
              </div>
              <form onSubmit={handleSaveCustomStyleAndLot}>
                <div className="modal-body bg-light p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fs-12 fw-semibold">Design / Style Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Graphic Boota"
                        value={customForm.styleName}
                        onChange={(e) => setCustomForm({ ...customForm, styleName: e.target.value })}
                        className="form-control form-control-sm"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fs-12 fw-semibold">Fabric Quality</label>
                      <input
                        type="text"
                        placeholder="e.g. 100% Cotton Slub Cambric"
                        value={customForm.fabricName}
                        onChange={(e) => setCustomForm({ ...customForm, fabricName: e.target.value })}
                        className="form-control form-control-sm"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fs-12 fw-semibold">Articles (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Kurta, Pant"
                        value={customForm.articlesText}
                        onChange={(e) => setCustomForm({ ...customForm, articlesText: e.target.value })}
                        className="form-control form-control-sm"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fs-12 fw-semibold">Avg Length / Pc (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 1.50"
                        value={customForm.avgLength}
                        onChange={(e) => setCustomForm({ ...customForm, avgLength: e.target.value })}
                        className="form-control form-control-sm font-monospace"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fs-12 fw-semibold">Sizes (comma-sep)</label>
                      <input
                        type="text"
                        placeholder="M, L, XL, 2XL"
                        value={customForm.sizesText}
                        onChange={(e) => setCustomForm({ ...customForm, sizesText: e.target.value })}
                        className="form-control form-control-sm"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fs-12 fw-semibold">Color <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chiku"
                        value={customForm.colorName}
                        onChange={(e) => setCustomForm({ ...customForm, colorName: e.target.value })}
                        className="form-control form-control-sm"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fs-12 fw-semibold">Lot ID <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. LOT-01"
                        value={customForm.lotId}
                        onChange={(e) => setCustomForm({ ...customForm, lotId: e.target.value })}
                        className="form-control form-control-sm font-monospace"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fs-12 fw-semibold">Meters <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={customForm.availableMeters}
                        onChange={(e) => setCustomForm({ ...customForm, availableMeters: e.target.value })}
                        className="form-control form-control-sm font-monospace"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fs-12 fw-semibold">Width</label>
                      <input
                        type="text"
                        placeholder='59"'
                        value={customForm.width}
                        onChange={(e) => setCustomForm({ ...customForm, width: e.target.value })}
                        className="form-control form-control-sm font-monospace"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-white border-top d-flex justify-content-between">
                  <button type="button" className="btn btn-light border btn-sm px-3 text-secondary" onClick={() => setShowCustomModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 fw-semibold">
                    Apply Style &amp; Lot
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
