const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'Orders', 'OrderCreationWizard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '                                                      {/* Quantity Method Switcher (Section 7.2: Ratio vs Uniform vs Manual) */}';
const altEndMarker = '                                                      </div>\r\n                                                    </div>\r\n                                                  ) : (';
const endMarker = '                                                      </div>\n                                                    </div>\n                                                  ) : (';

let actualEndMarker = content.includes(altEndMarker) ? altEndMarker : endMarker;

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(actualEndMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not locate markers!', { startIndex, endIndex });
  process.exit(1);
}

const replacement = `                                                      {/* Quantity Method Switcher (Ratio vs Uniform vs Manual) */}
                                                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2.5 p-2 rounded-3 bg-white border" style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                                          <span className="small fw-semibold text-muted" style={{ fontSize: '12px' }}>
                                                            Quantity Method:
                                                          </span>
                                                          <div className="btn-group btn-group-sm" role="group">
                                                            <button
                                                              type="button"
                                                              className="btn btn-sm d-inline-flex align-items-center gap-1.5 transition-all"
                                                              style={{
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                backgroundColor: (!sc.ratioUsed && sc.uniform !== true) ? '#2e37a4' : '#ffffff',
                                                                color: (!sc.ratioUsed && sc.uniform !== true) ? '#ffffff' : '#475569',
                                                                borderColor: (!sc.ratioUsed && sc.uniform !== true) ? '#2e37a4' : '#cbd5e1',
                                                                boxShadow: (!sc.ratioUsed && sc.uniform !== true) ? '0 2px 4px rgba(46,55,164,0.2)' : 'none'
                                                              }}
                                                              onClick={() => {
                                                                setRatioModeForPairSeries(ci, artId, colName, sc.seriesId, false);
                                                                setUniformModeForPairSeries(ci, artId, colName, sc.seriesId, false);
                                                              }}
                                                            >
                                                              <span>✍️</span>
                                                              <span>Manual Entry</span>
                                                            </button>

                                                            <button
                                                              type="button"
                                                              className="btn btn-sm d-inline-flex align-items-center gap-1.5 transition-all"
                                                              style={{
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                backgroundColor: sc.ratioUsed ? '#2e37a4' : '#ffffff',
                                                                color: sc.ratioUsed ? '#ffffff' : '#475569',
                                                                borderColor: sc.ratioUsed ? '#2e37a4' : '#cbd5e1',
                                                                boxShadow: sc.ratioUsed ? '0 2px 4px rgba(46,55,164,0.2)' : 'none'
                                                              }}
                                                              onClick={() => {
                                                                setRatioModeForPairSeries(ci, artId, colName, sc.seriesId, true);
                                                              }}
                                                            >
                                                              <span>⚡</span>
                                                              <span>Set Ratio (e.g. 1:2:2:1)</span>
                                                            </button>

                                                            {(sc.selectedSizes || []).length >= 2 && (
                                                              <button
                                                                type="button"
                                                                className="btn btn-sm d-inline-flex align-items-center gap-1.5 transition-all"
                                                                style={{
                                                                  fontSize: '12px',
                                                                  fontWeight: 600,
                                                                  backgroundColor: (sc.uniform === true && !sc.ratioUsed) ? '#2e37a4' : '#ffffff',
                                                                  color: (sc.uniform === true && !sc.ratioUsed) ? '#ffffff' : '#475569',
                                                                  borderColor: (sc.uniform === true && !sc.ratioUsed) ? '#2e37a4' : '#cbd5e1',
                                                                  boxShadow: (sc.uniform === true && !sc.ratioUsed) ? '0 2px 4px rgba(46,55,164,0.2)' : 'none'
                                                                }}
                                                                onClick={() => {
                                                                  setRatioModeForPairSeries(ci, artId, colName, sc.seriesId, false);
                                                                  setUniformModeForPairSeries(ci, artId, colName, sc.seriesId, true);
                                                                }}
                                                              >
                                                                <span>🟰</span>
                                                                <span>Uniform (Same for All)</span>
                                                              </button>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>

                                                      {/* Set Ratio Calculator Card */}
                                                      {sc.ratioUsed && (
                                                        <div
                                                          className="p-3.5 rounded-3 mb-3 shadow-xs"
                                                          style={{
                                                            backgroundColor: '#f8faff',
                                                            border: '1.5px solid #c7d2fe',
                                                            borderRadius: '10px'
                                                          }}
                                                        >
                                                          <div className="d-flex align-items-center justify-content-between mb-2.5 flex-wrap gap-2">
                                                            <div className="d-flex align-items-center gap-2">
                                                              <div
                                                                className="rounded-2 d-flex align-items-center justify-content-center"
                                                                style={{ width: '28px', height: '28px', backgroundColor: '#eef2ff', color: '#2e37a4' }}
                                                              >
                                                                <i className="ti ti-calculator" style={{ fontSize: '16px' }}></i>
                                                              </div>
                                                              <div>
                                                                <span className="fw-bold d-block" style={{ fontSize: '13.5px', color: '#1e293b' }}>
                                                                  Set Ratio Calculator
                                                                </span>
                                                                <span className="text-muted" style={{ fontSize: '11px' }}>
                                                                  Distribute set quantities across selected sizes using ratio
                                                                </span>
                                                              </div>
                                                            </div>
                                                            <span
                                                              className="badge rounded-pill fw-semibold px-2.5 py-1"
                                                              style={{ fontSize: '11.5px', backgroundColor: '#eef2ff', color: '#2e37a4', border: '1px solid #c7d2fe' }}
                                                            >
                                                              {(sc.selectedSizes || []).length} Sizes Selected
                                                            </span>
                                                          </div>

                                                          <div className="row g-2.5 align-items-end">
                                                            {/* Ratio String Input */}
                                                            <div className="col-md-5">
                                                              <label className="form-label small fw-semibold text-dark mb-1" style={{ fontSize: '12px' }}>
                                                                Ratio (e.g. {(sc.selectedSizes || []).map(() => '1').join(':')})
                                                              </label>
                                                              <input
                                                                type="text"
                                                                className="form-control form-control-sm font-monospace fw-bold"
                                                                placeholder={(sc.selectedSizes || []).map(() => '1').join(':')}
                                                                value={sc.ratioString ?? ''}
                                                                onChange={(e) => updateRatioCalculationForPairSeries(ci, artId, colName, sc.seriesId, e.target.value, sc.baseSetQty)}
                                                                style={{ fontSize: '13px', borderColor: '#cbd5e1', borderRadius: '7px', height: '36px' }}
                                                              />
                                                            </div>

                                                            {/* Base Set Quantity */}
                                                            <div className="col-md-4">
                                                              <label className="form-label small fw-semibold text-dark mb-1" style={{ fontSize: '12px' }}>
                                                                Base Set Quantity (Multiplier)
                                                              </label>
                                                              <input
                                                                type="number"
                                                                min="1"
                                                                className="form-control form-control-sm fw-bold"
                                                                placeholder="e.g. 100"
                                                                value={sc.baseSetQty ?? ''}
                                                                onChange={(e) => updateRatioCalculationForPairSeries(ci, artId, colName, sc.seriesId, sc.ratioString, e.target.value)}
                                                                style={{ fontSize: '13px', borderColor: '#cbd5e1', borderRadius: '7px', height: '36px' }}
                                                              />
                                                            </div>

                                                            {/* Recalculate Button */}
                                                            <div className="col-md-3">
                                                              <button
                                                                type="button"
                                                                className="btn btn-sm text-white w-100 fw-semibold d-inline-flex align-items-center justify-content-center gap-1.5 shadow-xs"
                                                                style={{ height: '36px', fontSize: '12.5px', backgroundColor: '#2e37a4', borderColor: '#2e37a4', borderRadius: '7px' }}
                                                                onClick={() => {
                                                                  const parts = (sc.ratioString || '').split(':').map(p => p.trim());
                                                                  const base = parseInt(sc.baseSetQty, 10) || 100;
                                                                  updateRatioCalculationForPairSeries(ci, artId, colName, sc.seriesId, sc.ratioString, String(base));
                                                                }}
                                                              >
                                                                <i className="ti ti-refresh" style={{ fontSize: '14px' }}></i>
                                                                <span>Apply Ratio</span>
                                                              </button>
                                                            </div>
                                                          </div>

                                                          {/* Validation & Ratio Preview */}
                                                          {(() => {
                                                            const parts = (sc.ratioString || '').split(':').map(p => p.trim());
                                                            const selectedSizes = sc.selectedSizes || [];
                                                            const isCountMatch = parts.length === selectedSizes.length;
                                                            const isValidNums = parts.every(p => p !== '' && !isNaN(parseInt(p, 10)) && parseInt(p, 10) >= 0);

                                                            if (!isCountMatch || !isValidNums) {
                                                              return (
                                                                <div className="mt-2.5 text-danger small fw-medium d-flex align-items-center gap-1.5" style={{ fontSize: '12px' }}>
                                                                  <i className="ti ti-alert-triangle"></i>
                                                                  <span>
                                                                    Ratio requires exactly {selectedSizes.length} numbers separated by colons (e.g. {selectedSizes.map((_, i) => i === 1 || i === 2 ? '2' : '1').join(':')}) for sizes [{selectedSizes.join(', ')}].
                                                                  </span>
                                                                </div>
                                                              );
                                                            }

                                                            const base = parseInt(sc.baseSetQty, 10) || 0;
                                                            return (
                                                              <div className="d-flex flex-wrap align-items-center gap-2 mt-3 pt-2.5 border-top" style={{ borderColor: '#e2e8f0', fontSize: '12px' }}>
                                                                <span className="text-muted fw-semibold me-1">Size Breakdown:</span>
                                                                {selectedSizes.map((sz, idx) => {
                                                                  const mult = parseInt(parts[idx], 10) || 0;
                                                                  const res = base * mult;
                                                                  return (
                                                                    <span
                                                                      key={sz}
                                                                      className="badge bg-white text-dark border px-2.5 py-1.5 shadow-2xs d-inline-flex align-items-center gap-1"
                                                                      style={{ borderColor: '#cbd5e1', borderRadius: '6px', fontSize: '12px' }}
                                                                    >
                                                                      <span className="fw-bold text-dark">{sz}:</span>
                                                                      <span className="text-muted">{mult} &times; {base} =</span>
                                                                      <span className="fw-bold" style={{ color: '#2e37a4' }}>{res} pcs</span>
                                                                    </span>
                                                                  );
                                                                })}
                                                              </div>
                                                            );
                                                          })()}
                                                        </div>
                                                      )}

                                                      {/* Uniform Quantity Input */}
                                                      {sc.uniform === true && !sc.ratioUsed && (
                                                        <div className="d-flex align-items-center gap-3 mb-2.5 p-3 rounded-3 bg-light border" style={{ borderColor: '#e2e8f0' }}>
                                                          <div style={{ maxWidth: '240px' }}>
                                                            <label className="form-label small text-muted mb-1 fw-semibold">Quantity for all selected sizes</label>
                                                            <input
                                                              type="number"
                                                              className="form-control form-control-sm"
                                                              placeholder="e.g. 100"
                                                              value={sc.uniformQty || ''}
                                                              onChange={(e) => updateUniformQtyForPairSeries(ci, artId, colName, sc.seriesId, e.target.value)}
                                                            />
                                                          </div>
                                                          <div className="small text-muted pt-3">
                                                            Auto-fills {sc.uniformQty || 0} pieces across all {(sc.selectedSizes || []).length} sizes.
                                                          </div>
                                                        </div>
                                                      )}

                                                      {/* Pieces Grid: Size Quantity Inputs */}
                                                      <div className="d-flex flex-wrap gap-2 pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
                                                        {(sc.selectedSizes || []).map((sz, sIdx) => {
                                                          const parts = (sc.ratioString || '').split(':').map(p => p.trim());
                                                          const ratioPart = sc.ratioUsed && parts[sIdx] !== undefined ? parts[sIdx] : null;

                                                          return (
                                                            <div
                                                              key={sz}
                                                              className="d-flex flex-column align-items-center p-2 rounded-3 border bg-white shadow-2xs"
                                                              style={{ borderColor: '#e2e8f0', minWidth: '78px' }}
                                                            >
                                                              <span className="small fw-bold text-dark" style={{ fontSize: '13px' }}>{sz}</span>
                                                              {ratioPart !== null && (
                                                                <span
                                                                  className="badge rounded-pill fw-semibold border px-1.5 py-0.5"
                                                                  style={{ fontSize: '10px', marginTop: '2px', backgroundColor: '#eef2ff', color: '#2e37a4', borderColor: '#c7d2fe' }}
                                                                >
                                                                  &times;{ratioPart}
                                                                </span>
                                                              )}
                                                              <input
                                                                type="number"
                                                                className="form-control form-control-sm text-center bg-white mt-1.5 fw-bold"
                                                                style={{ width: '68px', height: '32px', borderColor: '#cbd5e1', borderRadius: '6px' }}
                                                                placeholder="0"
                                                                value={sc.sizeQtys?.[sz] ?? ''}
                                                                onChange={(e) => updateIndividualSizeQtyForPairSeries(ci, artId, colName, sc.seriesId, sz, e.target.value)}
                                                              />
                                                            </div>
                                                          );
                                                        })}
                                                      </div>`;

const endTarget = content.indexOf(actualEndMarker);
const newContent = content.substring(0, startIndex) + replacement + content.substring(endTarget);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully updated OrderCreationWizard.jsx!');
