import React from 'react';
import {
  computeLotYieldSummary,
  getTallyTotalMeters
} from '../../data/cuttingData';

/**
 * Step 1: Fabric Lot Receipt, Metering Tally & Checking Report
 * Zero pre-filled values; Checking Master records Than-by-Than meters and slips.
 */
export default function Step1LotTally({
  rec,
  styleObj,
  colorObj,
  lotObj,
  onUpdateRec,
  onProceedToStep2,
  showToast
}) {
  const totalMeasured = getTallyTotalMeters(rec);
  const yieldInfo = computeLotYieldSummary(styleObj, lotObj);
  const rolls = rec.tallyRolls || [];

  const handleAddRoll = () => {
    const nextRolls = [
      ...rolls,
      { id: Date.now() + Math.random(), rollNo: '', meters: '', remark: '' }
    ];
    onUpdateRec({ tallyRolls: nextRolls });
  };

  const handleUpdateRoll = (id, field, val) => {
    const nextRolls = rolls.map((r) => (r.id === id ? { ...r, [field]: val } : r));
    const nextTotal = nextRolls.reduce((sum, r) => sum + (parseFloat(r.meters) || 0), 0);
    const patch = { tallyRolls: nextRolls };
    if (field === 'meters' && nextTotal > 0) {
      patch.fabricToIssue = Number(nextTotal.toFixed(2));
    }
    onUpdateRec(patch);
  };

  const handleRemoveRoll = (id) => {
    if (rolls.length <= 1) return;
    const nextRolls = rolls.filter((r) => r.id !== id);
    const nextTotal = nextRolls.reduce((sum, r) => sum + (parseFloat(r.meters) || 0), 0);
    onUpdateRec({
      tallyRolls: nextRolls,
      fabricToIssue: nextTotal > 0 ? Number(nextTotal.toFixed(2)) : ''
    });
  };

  const handlePhotoUpload = (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdateRec({ [key]: ev.target.result });
      if (showToast) showToast('Slip photo attached successfully.', 'success');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Banner */}
      <div className="card border-0 shadow-sm p-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-10 text-uppercase mb-1">
              Step 1 · Dyed Lot Receipt &amp; Tally
            </span>
            <h4 className="fw-bold text-dark mb-1">Fabric Lot Metering Tally &amp; Checking Report</h4>
            <p className="text-secondary fs-12 mb-0">
              Record Than-by-Than meters and attach handwritten Checking Report photo. Sum auto-feeds into Cutting PO.
            </p>
          </div>
          <button
            type="button"
            onClick={onProceedToStep2}
            className="btn btn-primary btn-sm px-3 shadow-xs fw-semibold d-flex align-items-center gap-2"
          >
            <span>Proceed to Step 2: Cutting PO (P1)</span>
            <i className="ti ti-arrow-right fs-14"></i>
          </button>
        </div>
      </div>

      {/* 4 Context KPI Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100">
            <div className="text-uppercase text-muted fs-10 fw-bold">Design / Style</div>
            <div className="fw-bold text-dark fs-14 mt-1">{rec.selectedStyle || 'Not Selected'}</div>
            <div className="text-secondary fs-11 mt-1">
              {styleObj?.fabricName || 'Choose style in Step 2'}
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100">
            <div className="text-uppercase text-muted fs-10 fw-bold">Shade, Lot &amp; Cuttable Yield</div>
            <div className="fw-bold text-dark fs-14 mt-1 d-flex align-items-center gap-2">
              {colorObj?.hex && (
                <span
                  className="rounded-circle border"
                  style={{ width: 12, height: 12, backgroundColor: colorObj.hex, display: 'inline-block' }}
                />
              )}
              <span>{rec.selectedColor || '—'} · {lotObj ? lotObj.lotId : '—'}</span>
            </div>
            <div className="text-primary fs-11 fw-semibold mt-1">
              {lotObj ? yieldInfo.label : 'Select lot in Step 2'}
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100">
            <div className="text-uppercase text-muted fs-10 fw-bold mb-1">Thans / Bales in Lot</div>
            <div className="d-flex align-items-center gap-2">
              <input
                type="number"
                min="0"
                placeholder="0"
                value={rec.thansBalesCount}
                onChange={(e) => onUpdateRec({ thansBalesCount: e.target.value })}
                className="form-control form-control-sm font-monospace fw-bold"
                style={{ maxWidth: 95 }}
              />
              <span className="text-secondary fs-12">thans / bales</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100 bg-success-subtle border border-success-subtle">
            <div className="text-uppercase text-success fs-10 fw-bold">Total Meters Tallied</div>
            <div className="fs-20 font-monospace fw-bold text-success mt-1">{totalMeasured.toFixed(2)} mts</div>
            <div className="text-success fs-11">Ready for Cutting PO</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Tally Table, Right Checking Report Photo */}
      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm p-4 h-100 d-flex flex-column gap-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom pb-3">
              <div>
                <h6 className="fw-bold text-dark text-uppercase mb-0 fs-13">
                  Metering Tally Sheet (As Rcd by Cutting Team)
                </h6>
                <div className="text-secondary fs-11 mt-1">
                  {lotObj ? lotObj.lotName : 'New Lot'} · Width: {lotObj?.width || rec.fabricWidthInput || '—'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddRoll}
                className="btn btn-primary btn-sm px-3 fw-semibold d-flex align-items-center gap-1"
              >
                <i className="ti ti-plus fs-14"></i>
                <span>Add Than</span>
              </button>
            </div>

            {/* Tally Formula Strip */}
            <div className="p-3 rounded-3 bg-light border font-monospace fs-12 text-dark">
              <span className="text-uppercase text-muted fs-10 fw-bold d-block mb-1 font-sans">
                Tally Addition Formula:
              </span>
              {rolls.map((r) => (parseFloat(r.meters) || 0).toFixed(2)).join(' + ')} ={' '}
              <strong className="text-primary fs-14">{totalMeasured.toFixed(2)} mts</strong>
            </div>

            {/* Tally Table */}
            <div className="table-responsive border rounded-3" style={{ maxHeight: 380, overflowY: 'auto' }}>
              <table className="table table-hover align-middle mb-0 fs-12">
                <thead className="sticky-top">
                  <tr>
                    <th style={{ width: 42 }}>#</th>
                    <th style={{ width: 120 }}>Than No.</th>
                    <th style={{ width: 130 }}>Than Meters (m)</th>
                    <th>Checking Remark per Than</th>
                    <th className="text-end" style={{ width: 55 }}>Del</th>
                  </tr>
                </thead>
                <tbody>
                  {rolls.map((roll, idx) => (
                    <tr key={roll.id}>
                      <td className="font-monospace text-muted">{idx + 1}</td>
                      <td>
                        <input
                          type="text"
                          placeholder={`Than #${idx + 1}`}
                          value={roll.rollNo}
                          onChange={(e) => handleUpdateRoll(roll.id, 'rollNo', e.target.value)}
                          className="form-control form-control-sm font-monospace fw-semibold"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={roll.meters}
                          onChange={(e) => handleUpdateRoll(roll.id, 'meters', e.target.value)}
                          className="form-control form-control-sm font-monospace fw-bold text-primary text-end"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Defect / weaving / stain remark..."
                          value={roll.remark}
                          onChange={(e) => handleUpdateRoll(roll.id, 'remark', e.target.value)}
                          className="form-control form-control-sm"
                        />
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveRoll(roll.id)}
                          disabled={rolls.length <= 1}
                          className="btn btn-outline-danger btn-xs py-1 px-2"
                          title="Remove Than"
                        >
                          <i className="ti ti-trash fs-12"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tally Sheet Photo Upload */}
            <div className="p-3 rounded-3 border bg-light d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <div className="fw-bold text-dark fs-12">
                  <i className="ti ti-camera text-primary me-1"></i> Metering Tally Sheet Photo
                </div>
                <div className="text-secondary fs-11">Snap or upload handwritten Metering Tally slip.</div>
              </div>
              <label className="btn btn-outline-primary btn-sm px-3 fw-semibold mb-0 d-flex align-items-center gap-1" style={{ cursor: 'pointer' }}>
                <i className="ti ti-upload fs-14"></i>
                <span>Attach Tally Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePhotoUpload(e, 'tallyPhotoUrl')}
                  className="d-none"
                />
              </label>
            </div>

            {rec.tallyPhotoUrl && (
              <div className="position-relative d-inline-block" style={{ width: 'fit-content' }}>
                <img
                  src={rec.tallyPhotoUrl}
                  alt="Tally Slip"
                  className="rounded-3 border shadow-xs"
                  style={{ height: 110, objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => onUpdateRec({ tallyPhotoUrl: null })}
                  className="btn btn-outline-danger btn-xs position-absolute top-0 end-0 m-1 bg-white"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Checking Report Photo */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm p-4 h-100 d-flex flex-column justify-content-between gap-3">
            <div className="d-flex flex-column gap-3">
              <div className="border-bottom pb-3">
                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fs-10 text-uppercase">
                  Checking Master Slip
                </span>
                <h6 className="fw-bold text-dark mt-2 mb-1">CHECKING REPORT</h6>
                <p className="text-secondary fs-12 mb-0">
                  Upload photo of handwritten defect/weaving checking report directly.
                </p>
              </div>

              <div className="p-4 rounded-3 border border-primary-subtle bg-primary-subtle bg-opacity-25 text-center d-flex flex-column align-items-center gap-3">
                {rec.checkingReportPhotoUrl ? (
                  <div className="position-relative d-inline-block">
                    <img
                      src={rec.checkingReportPhotoUrl}
                      alt="Checking Report"
                      className="rounded-3 border shadow-sm"
                      style={{ maxHeight: 220, maxWidth: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateRec({ checkingReportPhotoUrl: null })}
                      className="btn btn-outline-danger btn-xs position-absolute top-0 end-0 m-1 bg-white"
                    >
                      <i className="ti ti-x"></i>
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className="rounded-3 bg-white border text-primary d-flex align-items-center justify-content-center"
                      style={{ width: 48, height: 48 }}
                    >
                      <i className="ti ti-camera fs-22"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-dark fs-13">Attach Handwritten Checking Report Photo</div>
                      <div className="text-secondary fs-11 mt-1">Direct mobile camera capture or image file upload</div>
                    </div>
                  </>
                )}

                <label className="btn btn-primary btn-sm px-3 fw-semibold mb-0 d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                  <i className="ti ti-camera fs-14"></i>
                  <span>{rec.checkingReportPhotoUrl ? 'Replace Checking Report Photo' : 'Capture / Upload Checking Report'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoUpload(e, 'checkingReportPhotoUrl')}
                    className="d-none"
                  />
                </label>
              </div>

              <div>
                <label className="form-label fw-semibold text-secondary fs-12 mb-1">
                  Checking Master Lot Summary Remark
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter overall checking notes, shade consistency, or defect summary..."
                  value={rec.checkingGeneralNote}
                  onChange={(e) => onUpdateRec({ checkingGeneralNote: e.target.value })}
                  className="form-control fs-12"
                />
              </div>
            </div>

            <div className="p-3 rounded-3 bg-success-subtle border border-success-subtle text-success fs-12 d-flex align-items-center gap-2">
              <i className="ti ti-circle-check fs-16"></i>
              <span>
                Tallied total <strong className="font-monospace">{totalMeasured.toFixed(2)} m</strong> synced to Cutting PO &amp; Consumption Sheet.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
