const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'Masters', 'AccessoriesMasterView.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = "                  {/* ============================================================== */}\r\n                  {/* CATEGORY 4: THREAD (SIZE AND EXTRA PROCESSES REMOVED)       */}\r\n                  {/* ============================================================== */}\r\n                  {formData.category === 'Thread' && (() => {";

const altStartMarker = "                  {/* ============================================================== */}\n                  {/* CATEGORY 4: THREAD (SIZE AND EXTRA PROCESSES REMOVED)       */}\n                  {/* ============================================================== */}\n                  {formData.category === 'Thread' && (() => {";

const actualStartMarker = content.includes(startMarker) ? startMarker : altStartMarker;

const endMarker = "                  {/* ============================================================== */}\r\n                  {/* CATEGORY 5: DORI / ELASTIC / BEADS & SEQUINS (SCREENSHOT 3)     */}";
const altEndMarker = "                  {/* ============================================================== */}\n                  {/* CATEGORY 5: DORI / ELASTIC / BEADS & SEQUINS (SCREENSHOT 3)     */}";

const actualEndMarker = content.includes(endMarker) ? endMarker : altEndMarker;

const startIndex = content.indexOf(actualStartMarker);
const endIndex = content.indexOf(actualEndMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found!', { startIndex, endIndex });
  process.exit(1);
}

const replacement = `                  {/* ============================================================== */}
                  {/* CATEGORY 4: THREAD CONFIGURATION (PDF SECTION 7.1 - 7.5)       */}
                  {/* ============================================================== */}
                  {formData.category === 'Thread' && (() => {
                    const isKanthaCouching = formData.threadPattern === 'Kantha' || formData.threadPattern === 'Couching';
                    const isStitching = formData.threadPattern === 'Stitching';
                    const isProcessOnly = formData.threadPattern === 'Button Tacking' || formData.threadPattern === 'Handwork';

                    return (
                      <>
                        {/* 7.1 Base Thread Configuration (Data Structure) */}
                        <div className="card p-3 rounded-3 mb-3 border bg-white shadow-2xs" style={{ borderColor: '#e2e8f0' }}>
                          <div className="fw-bold text-dark fs-14 mb-2.5 d-flex align-items-center gap-2">
                            <i className="ti ti-needle-thread text-primary"></i>
                            <span>Base Thread Configuration (Section 7.1)</span>
                          </div>

                          <div className="row g-3 mb-2.5">
                            {/* Size / Count (Text / Dropdown with Other - Mandatory: Yes) */}
                            <div className="col-md-4">
                              <label className="form-label fw-semibold text-dark small mb-1">
                                Size / Count <span className="text-danger">*</span>
                              </label>
                              <select
                                className="form-select form-select-sm"
                                value={THREAD_SIZE_OPTIONS.includes(formData.threadSize) ? formData.threadSize : 'Other'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'Other') {
                                    setFormData({ ...formData, threadSize: 'Other' });
                                  } else {
                                    setFormData({ ...formData, threadSize: val, threadSizeCustom: '' });
                                  }
                                }}
                                style={{ height: '38px', borderRadius: '7px' }}
                              >
                                {THREAD_SIZE_OPTIONS.map((sz) => (
                                  <option key={sz} value={sz}>{sz}</option>
                                ))}
                                <option value="Other">Other (Custom Size)...</option>
                              </select>
                              {(formData.threadSize === 'Other' || (!THREAD_SIZE_OPTIONS.includes(formData.threadSize) && formData.threadSize)) && (
                                <input
                                  type="text"
                                  className="form-control form-control-sm mt-1.5"
                                  placeholder="Enter custom size (e.g. 50/2)"
                                  value={formData.threadSizeCustom ?? (formData.threadSize === 'Other' ? '' : formData.threadSize)}
                                  onChange={(e) => setFormData({ ...formData, threadSizeCustom: e.target.value, threadSize: e.target.value })}
                                  style={{ height: '34px', borderRadius: '6px' }}
                                />
                              )}
                            </div>

                            {/* Unit (Dropdown with Other - Mandatory: Yes) */}
                            <div className="col-md-4">
                              <label className="form-label fw-semibold text-dark small mb-1">
                                Unit <span className="text-danger">*</span>
                              </label>
                              <select
                                className="form-select form-select-sm"
                                value={THREAD_UNIT_OPTIONS.includes(formData.unit) ? formData.unit : 'Other'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'Other') {
                                    setFormData({ ...formData, unit: 'Other' });
                                  } else {
                                    setFormData({ ...formData, unit: val, unitCustom: '' });
                                  }
                                }}
                                style={{ height: '38px', borderRadius: '7px' }}
                              >
                                {THREAD_UNIT_OPTIONS.map((u) => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                                <option value="Other">Other (Custom Unit)...</option>
                              </select>
                              {(formData.unit === 'Other' || (!THREAD_UNIT_OPTIONS.includes(formData.unit) && formData.unit)) && (
                                <input
                                  type="text"
                                  className="form-control form-control-sm mt-1.5"
                                  placeholder="Enter custom unit"
                                  value={formData.unitCustom ?? (formData.unit === 'Other' ? '' : formData.unit)}
                                  onChange={(e) => setFormData({ ...formData, unitCustom: e.target.value, unit: e.target.value })}
                                  style={{ height: '34px', borderRadius: '6px' }}
                                />
                              )}
                            </div>

                            {/* Pieces Per Unit (Number - Mandatory: Yes) */}
                            <div className="col-md-4">
                              <label className="form-label fw-semibold text-dark small mb-1">
                                Pieces Per Unit <span className="text-danger">*</span>
                              </label>
                              <input
                                type="number"
                                min="1"
                                className="form-control form-control-sm fw-bold"
                                value={formData.piecesPerUnit ?? 1}
                                placeholder="1"
                                onChange={(e) => setFormData({ ...formData, piecesPerUnit: parseInt(e.target.value, 10) || 1 })}
                                style={{ height: '38px', borderRadius: '7px' }}
                              />
                            </div>
                          </div>

                          {/* Thread Pattern (Dropdown - Mandatory: Yes, drives pattern-specific fields below) */}
                          <div className="mt-2 pt-2 border-top">
                            <label className="form-label fw-semibold text-dark small mb-1">
                              Thread Pattern <span className="text-danger">*</span> (Kantha / Couching / Stitching / Embroidery / Button Tacking / Handwork)
                            </label>
                            <select
                              className="form-select form-select-sm fw-bold"
                              value={formData.threadPattern || 'Stitching'}
                              onChange={(e) => {
                                const pat = e.target.value;
                                // Section 12.4: Changing thread pattern must not carry incompatible data across
                                setFormData(prev => ({
                                  ...prev,
                                  threadPattern: pat
                                }));
                              }}
                              style={{ height: '40px', borderRadius: '7px', borderColor: '#2e37a4', color: '#1e293b' }}
                            >
                              {THREAD_PATTERNS.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 7.2 Kantha & 7.3 Couching Pattern (Shared Configuration Definition - Section 12.4) */}
                        {isKanthaCouching && (
                          <div className="card p-3.5 rounded-3 mb-3 border shadow-2xs" style={{ backgroundColor: '#f8faff', borderColor: '#c7d2fe' }}>
                            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge rounded-pill px-2.5 py-1 text-white" style={{ backgroundColor: '#2e37a4' }}>
                                  {formData.threadPattern}
                                </span>
                                <span className="fw-bold text-dark fs-14">Pattern Configuration</span>
                              </div>
                              <span className="small text-muted" style={{ fontSize: '11.5px' }}>
                                {formData.threadPattern === 'Kantha' ? 'Section 7.2' : 'Section 7.3 (Identical to 7.2)'}
                              </span>
                            </div>

                            {/* Thread Per Stitch (metres) - Default 15m, editable */}
                            <div className="mb-3">
                              <label className="form-label fw-semibold text-dark small mb-1">
                                Thread Per Stitch (metres required for 1m of stitching) <span className="text-danger">*</span>
                              </label>
                              <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="form-control fw-bold"
                                  value={formData.threadPerStitch ?? 15}
                                  onChange={(e) => setFormData({ ...formData, threadPerStitch: parseFloat(e.target.value) || 0 })}
                                  style={{ height: '36px' }}
                                />
                                <span className="input-group-text bg-white text-muted">m / stitch</span>
                              </div>
                              <div className="form-text text-muted" style={{ fontSize: '11.5px' }}>
                                Default: 15 m per metre of stitching, remains editable.
                              </div>
                            </div>

                            {/* Available Boxes (Reels Per Box x Metres Per Reel = 6000 m) */}
                            <div className="mb-3 p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <label className="form-label fw-bold text-dark small mb-0">
                                  Available Boxes (Each box = 6000 m)
                                </label>
                                <span className="badge bg-light text-muted border" style={{ fontSize: '11px' }}>
                                  Reels Per Box &times; Metres Per Reel
                                </span>
                              </div>
                              {((formData.boxes && formData.boxes.length > 0) ? formData.boxes : [{ reelsPerBox: '15', metersPerReel: '400' }]).map((b, i, arr) => {
                                const totalBoxMetres = (parseFloat(b.reelsPerBox) || 0) * (parseFloat(b.metersPerReel) || 0);
                                return (
                                  <div key={i} className="row g-2 align-items-center mb-2 p-2 bg-light rounded-2 border">
                                    <div className="col-4">
                                      <label className="form-label small text-muted mb-0" style={{ fontSize: '11px' }}>Reels Per Box</label>
                                      <input
                                        type="number"
                                        className="form-control form-control-sm fw-bold"
                                        placeholder="e.g. 15"
                                        value={b.reelsPerBox ?? ''}
                                        onChange={(e) => {
                                          const updated = [...arr];
                                          updated[i] = { ...updated[i], reelsPerBox: e.target.value };
                                          setFormData({ ...formData, boxes: updated });
                                        }}
                                      />
                                    </div>
                                    <div className="col-4">
                                      <label className="form-label small text-muted mb-0" style={{ fontSize: '11px' }}>Metres Per Reel</label>
                                      <input
                                        type="number"
                                        className="form-control form-control-sm fw-bold"
                                        placeholder="e.g. 400"
                                        value={b.metersPerReel ?? ''}
                                        onChange={(e) => {
                                          const updated = [...arr];
                                          updated[i] = { ...updated[i], metersPerReel: e.target.value };
                                          setFormData({ ...formData, boxes: updated });
                                        }}
                                      />
                                    </div>
                                    <div className="col-3 text-center">
                                      <span className={\`badge \${totalBoxMetres === 6000 ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-dark'}\`} style={{ fontSize: '11px' }}>
                                        = {totalBoxMetres || 0} m
                                      </span>
                                    </div>
                                    <div className="col-1 text-end">
                                      {arr.length > 1 && (
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                          onClick={() => {
                                            const updated = arr.filter((_, idx) => idx !== i);
                                            setFormData({ ...formData, boxes: updated });
                                          }}
                                        >
                                          <i className="ti ti-trash"></i>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-primary d-inline-flex align-items-center gap-1 mt-1"
                                style={{ fontSize: '12px' }}
                                onClick={() => {
                                  const current = (formData.boxes && formData.boxes.length > 0) ? formData.boxes : [{ reelsPerBox: '', metersPerReel: '' }];
                                  setFormData({ ...formData, boxes: [...current, { reelsPerBox: '15', metersPerReel: '400' }] });
                                }}
                              >
                                <i className="ti ti-plus"></i> Add Box Configuration
                              </button>
                            </div>

                            {/* Available Cone Sizes (Repeatable) */}
                            <div className="mb-3 p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <TagInput
                                label="Available Cone Sizes (e.g. 5000 m, 10000 m)"
                                tags={formData.coneSizes || []}
                                onChange={(newTags) => setFormData({ ...formData, coneSizes: newTags })}
                                placeholder="Type cone size (e.g. 5000 m) and press Enter"
                                suggestions={['5000 m', '10000 m', '20000 m']}
                              />
                            </div>

                            {/* Available Placements (Repeatable chips/buttons) */}
                            <div className="mb-3 p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <label className="form-label fw-bold text-dark small mb-1">
                                Available Placements (Predefined & Manufacturing Defaults)
                              </label>
                              <TagInput
                                label=""
                                tags={formData.placements || []}
                                onChange={(newTags) => setFormData({ ...formData, placements: newTags })}
                                placeholder="Add placement (e.g. Sleeves, Collar) and press Enter"
                                suggestions={['Sleeves', 'Front', 'Back', 'Collar', 'Hemline', 'Pocket', 'Placket']}
                              />
                            </div>

                            {/* Article -> Placement -> Thread Line Chain (Section 7.2 table, Page 12 functional points, Section 10.2 wireframe) */}
                            <div className="mb-3 p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <div>
                                  <span className="fw-bold text-dark fs-13 d-block">
                                    Article &rarr; Placement &rarr; Thread Line Chain
                                  </span>
                                  <span className="text-muted small" style={{ fontSize: '11px' }}>
                                    Section 10.2: Configure thread required per placement line for each article
                                  </span>
                                </div>
                              </div>

                              {/* Repeatable Article Blocks */}
                              {((formData.articlePlacements && formData.articlePlacements.length > 0)
                                ? formData.articlePlacements
                                : [{ article: 'Kurta', placements: [{ placement: 'Sleeves', threadRequired: '4.5' }] }]
                              ).map((artBlock, abIdx, allBlocks) => (
                                <div key={abIdx} className="p-3 mb-2.5 rounded-3 border bg-light position-relative" style={{ borderColor: '#cbd5e1' }}>
                                  <div className="d-flex align-items-center justify-content-between mb-2.5 flex-wrap gap-2">
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="badge rounded-circle p-1.5" style={{ backgroundColor: '#2e37a4', color: '#fff', fontSize: '11px', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {abIdx + 1}
                                      </span>
                                      <label className="form-label fw-bold text-dark small mb-0">Article:</label>
                                      <select
                                        className="form-select form-select-sm fw-semibold"
                                        value={artBlock.article || ''}
                                        onChange={(e) => {
                                          const updated = [...allBlocks];
                                          updated[abIdx] = { ...updated[abIdx], article: e.target.value };
                                          setFormData({ ...formData, articlePlacements: updated });
                                        }}
                                        style={{ width: '160px', height: '34px' }}
                                      >
                                        {articlesList.map(a => (
                                          <option key={a.id || a.name} value={a.name}>{a.icon || '👕'} {a.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    {allBlocks.length > 1 && (
                                      <button
                                        type="button"
                                        className="btn btn-xs btn-outline-danger d-inline-flex align-items-center gap-1"
                                        style={{ fontSize: '11px' }}
                                        onClick={() => {
                                          const updated = allBlocks.filter((_, idx) => idx !== abIdx);
                                          setFormData({ ...formData, articlePlacements: updated });
                                        }}
                                      >
                                        <i className="ti ti-trash"></i> Remove Article Block
                                      </button>
                                    )}
                                  </div>

                                  {/* Placements for this article */}
                                  <div className="table-responsive bg-white rounded-2 border mb-2">
                                    <table className="table table-sm align-middle mb-0" style={{ fontSize: '12px' }}>
                                      <thead className="bg-light">
                                        <tr>
                                          <th style={{ width: '50%' }}>Placement (e.g. Sleeves, Front)</th>
                                          <th style={{ width: '35%' }}>Thread Required (metres)</th>
                                          <th style={{ width: '15%' }} className="text-center">Action</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(artBlock.placements || []).map((pLine, plIdx, plArr) => (
                                          <tr key={plIdx}>
                                            <td>
                                              <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="e.g. Sleeves"
                                                value={pLine.placement || ''}
                                                onChange={(e) => {
                                                  const updatedBlocks = [...allBlocks];
                                                  const updatedPlacements = [...artBlock.placements];
                                                  updatedPlacements[plIdx] = { ...updatedPlacements[plIdx], placement: e.target.value };
                                                  updatedBlocks[abIdx] = { ...updatedBlocks[abIdx], placements: updatedPlacements };
                                                  setFormData({ ...formData, articlePlacements: updatedBlocks });
                                                }}
                                              />
                                            </td>
                                            <td>
                                              <div className="input-group input-group-sm">
                                                <input
                                                  type="number"
                                                  step="0.1"
                                                  className="form-control fw-bold"
                                                  placeholder="e.g. 4.5"
                                                  value={pLine.threadRequired || ''}
                                                  onChange={(e) => {
                                                    const updatedBlocks = [...allBlocks];
                                                    const updatedPlacements = [...artBlock.placements];
                                                    updatedPlacements[plIdx] = { ...updatedPlacements[plIdx], threadRequired: e.target.value };
                                                    updatedBlocks[abIdx] = { ...updatedBlocks[abIdx], placements: updatedPlacements };
                                                    setFormData({ ...formData, articlePlacements: updatedBlocks });
                                                  }}
                                                />
                                                <span className="input-group-text bg-white text-muted">m</span>
                                              </div>
                                            </td>
                                            <td className="text-center">
                                              {plArr.length > 1 && (
                                                <button
                                                  type="button"
                                                  className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                                  onClick={() => {
                                                    const updatedBlocks = [...allBlocks];
                                                    const updatedPlacements = artBlock.placements.filter((_, idx) => idx !== plIdx);
                                                    updatedBlocks[abIdx] = { ...updatedBlocks[abIdx], placements: updatedPlacements };
                                                    setFormData({ ...formData, articlePlacements: updatedBlocks });
                                                  }}
                                                >
                                                  <i className="ti ti-x"></i>
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  <button
                                    type="button"
                                    className="btn btn-xs btn-link text-primary p-0 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                                    style={{ fontSize: '11.5px' }}
                                    onClick={() => {
                                      const updatedBlocks = [...allBlocks];
                                      const updatedPlacements = [...(artBlock.placements || []), { placement: '', threadRequired: '' }];
                                      updatedBlocks[abIdx] = { ...updatedBlocks[abIdx], placements: updatedPlacements };
                                      setFormData({ ...formData, articlePlacements: updatedBlocks });
                                    }}
                                  >
                                    <i className="ti ti-plus"></i> Add Placement Line
                                  </button>
                                </div>
                              ))}

                              {/* Add More Article Button */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 fw-semibold"
                                style={{ fontSize: '12px' }}
                                onClick={() => {
                                  const current = (formData.articlePlacements && formData.articlePlacements.length > 0)
                                    ? formData.articlePlacements
                                    : [{ article: 'Kurta', placements: [{ placement: 'Sleeves', threadRequired: '4.5' }] }];
                                  setFormData({
                                    ...formData,
                                    articlePlacements: [
                                      ...current,
                                      { article: articlesList[current.length % articlesList.length]?.name || 'Pant', placements: [{ placement: 'Bottom Hem', threadRequired: '2.5' }] }
                                    ]
                                  });
                                }}
                              >
                                <i className="ti ti-plus"></i> Add More Article Block
                              </button>
                            </div>

                            {/* One-Time Global Thread Stitching Metric (Page 12, Page 18) */}
                            <div className="p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <label className="form-label fw-bold text-dark small mb-1">
                                One-Time Global Thread Stitching Metric <span className="text-danger">*</span>
                              </label>
                              <div className="input-group input-group-sm" style={{ maxWidth: '280px' }}>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="form-control fw-bold"
                                  value={formData.globalThreadMetric ?? 15}
                                  onChange={(e) => setFormData({ ...formData, globalThreadMetric: parseFloat(e.target.value) || 0 })}
                                  style={{ height: '36px' }}
                                />
                                <span className="input-group-text bg-white text-muted">m / stitch metre</span>
                              </div>
                              <div className="form-text text-muted" style={{ fontSize: '11px' }}>
                                Entered once and applies to both Kantha and Couching — separate from and in addition to per-placement Thread Required values.
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 7.4 Stitching Pattern */}
                        {isStitching && (
                          <div className="card p-3.5 rounded-3 mb-3 border shadow-2xs" style={{ backgroundColor: '#f8faff', borderColor: '#c7d2fe' }}>
                            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge rounded-pill px-2.5 py-1 text-white" style={{ backgroundColor: '#2e37a4' }}>
                                  Stitching
                                </span>
                                <span className="fw-bold text-dark fs-14">Pattern Configuration</span>
                              </div>
                              <span className="small text-muted" style={{ fontSize: '11.5px' }}>Section 7.4</span>
                            </div>

                            {/* Thread Per Piece - Default 60m, editable */}
                            <div className="mb-3">
                              <label className="form-label fw-semibold text-dark small mb-1">
                                Thread Per Piece (metres) <span className="text-danger">*</span>
                              </label>
                              <div className="input-group input-group-sm" style={{ maxWidth: '220px' }}>
                                <input
                                  type="number"
                                  step="1"
                                  className="form-control fw-bold"
                                  value={formData.threadPerPiece ?? 60}
                                  onChange={(e) => setFormData({ ...formData, threadPerPiece: parseFloat(e.target.value) || 0 })}
                                  style={{ height: '36px' }}
                                />
                                <span className="input-group-text bg-white text-muted">m / piece</span>
                              </div>
                              <div className="form-text text-muted" style={{ fontSize: '11.5px' }}>
                                Default: 60 m, auto-populates BOM Quantity per Piece (editable).
                              </div>
                            </div>

                            {/* Available Boxes (Same structure as Kantha) */}
                            <div className="mb-3 p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <label className="form-label fw-bold text-dark small mb-0">
                                  Available Boxes (Each box = 6000 m)
                                </label>
                                <span className="badge bg-light text-muted border" style={{ fontSize: '11px' }}>
                                  Reels Per Box &times; Metres Per Reel
                                </span>
                              </div>
                              {((formData.boxes && formData.boxes.length > 0) ? formData.boxes : [{ reelsPerBox: '15', metersPerReel: '400' }]).map((b, i, arr) => {
                                const totalBoxMetres = (parseFloat(b.reelsPerBox) || 0) * (parseFloat(b.metersPerReel) || 0);
                                return (
                                  <div key={i} className="row g-2 align-items-center mb-2 p-2 bg-light rounded-2 border">
                                    <div className="col-4">
                                      <label className="form-label small text-muted mb-0" style={{ fontSize: '11px' }}>Reels Per Box</label>
                                      <input
                                        type="number"
                                        className="form-control form-control-sm fw-bold"
                                        placeholder="e.g. 15"
                                        value={b.reelsPerBox ?? ''}
                                        onChange={(e) => {
                                          const updated = [...arr];
                                          updated[i] = { ...updated[i], reelsPerBox: e.target.value };
                                          setFormData({ ...formData, boxes: updated });
                                        }}
                                      />
                                    </div>
                                    <div className="col-4">
                                      <label className="form-label small text-muted mb-0" style={{ fontSize: '11px' }}>Metres Per Reel</label>
                                      <input
                                        type="number"
                                        className="form-control form-control-sm fw-bold"
                                        placeholder="e.g. 400"
                                        value={b.metersPerReel ?? ''}
                                        onChange={(e) => {
                                          const updated = [...arr];
                                          updated[i] = { ...updated[i], metersPerReel: e.target.value };
                                          setFormData({ ...formData, boxes: updated });
                                        }}
                                      />
                                    </div>
                                    <div className="col-3 text-center">
                                      <span className={\`badge \${totalBoxMetres === 6000 ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-dark'}\`} style={{ fontSize: '11px' }}>
                                        = {totalBoxMetres || 0} m
                                      </span>
                                    </div>
                                    <div className="col-1 text-end">
                                      {arr.length > 1 && (
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                          onClick={() => {
                                            const updated = arr.filter((_, idx) => idx !== i);
                                            setFormData({ ...formData, boxes: updated });
                                          }}
                                        >
                                          <i className="ti ti-trash"></i>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-primary d-inline-flex align-items-center gap-1 mt-1"
                                style={{ fontSize: '12px' }}
                                onClick={() => {
                                  const current = (formData.boxes && formData.boxes.length > 0) ? formData.boxes : [{ reelsPerBox: '', metersPerReel: '' }];
                                  setFormData({ ...formData, boxes: [...current, { reelsPerBox: '15', metersPerReel: '400' }] });
                                }}
                              >
                                <i className="ti ti-plus"></i> Add Box Configuration
                              </button>
                            </div>

                            {/* Available Cone Sizes (Repeatable) */}
                            <div className="mb-3 p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <TagInput
                                label="Available Cone Sizes (e.g. 5000 m, 10000 m)"
                                tags={formData.coneSizes || []}
                                onChange={(newTags) => setFormData({ ...formData, coneSizes: newTags })}
                                placeholder="Type cone size (e.g. 5000 m) and press Enter"
                                suggestions={['5000 m', '10000 m', '20000 m']}
                              />
                            </div>

                            {/* Targeted Articles (Multi-Select) & Dynamic Thread Consumption per 100 Pieces (per Article) */}
                            <div className="p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <label className="form-label fw-bold text-dark small mb-1">
                                Targeted Articles &amp; Consumption per 100 Pieces <span className="text-danger">*</span>
                              </label>
                              <div className="form-text text-muted mb-2.5" style={{ fontSize: '11.5px' }}>
                                Section 7.4: Select targeted articles via multi-select; for each article, a manual input dynamically opens to record Thread Consumption per 100 Pieces, strictly in metres.
                              </div>

                              {/* Multi-select chips for articles */}
                              <div className="d-flex flex-wrap gap-1.5 mb-3">
                                {articlesList.map((art) => {
                                  const isSelected = (formData.stitchingArticles || []).includes(art.name);
                                  return (
                                    <button
                                      key={art.id || art.name}
                                      type="button"
                                      className={\`btn btn-sm d-inline-flex align-items-center gap-1.5 py-1 px-2.5 rounded-pill border transition-all \${
                                        isSelected ? 'btn-primary text-white shadow-xs fw-semibold' : 'bg-light text-secondary'
                                      }\`}
                                      style={{ fontSize: '12px' }}
                                      onClick={() => {
                                        const current = formData.stitchingArticles || [];
                                        const next = isSelected
                                          ? current.filter(a => a !== art.name)
                                          : [...current, art.name];
                                        
                                        const nextConsumption = { ...(formData.consumptionPer100Pcs || {}) };
                                        if (!isSelected && !nextConsumption[art.name]) {
                                          nextConsumption[art.name] = '6000';
                                        }
                                        setFormData({
                                          ...formData,
                                          stitchingArticles: next,
                                          consumptionPer100Pcs: nextConsumption
                                        });
                                      }}
                                    >
                                      <span>{art.icon || '👕'}</span>
                                      <span>{art.name}</span>
                                      <i className={\`ti ti-\${isSelected ? 'check' : 'plus'} small\`}></i>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Dynamic input boxes per selected article */}
                              {(formData.stitchingArticles || []).length > 0 && (
                                <div className="p-2.5 bg-light rounded-3 border">
                                  <div className="small fw-semibold text-muted mb-2">
                                    Thread Consumption per 100 Pieces (strictly in metres):
                                  </div>
                                  <div className="row g-2">
                                    {(formData.stitchingArticles || []).map((artName) => (
                                      <div key={artName} className="col-md-6">
                                        <div className="p-2 bg-white rounded-2 border d-flex align-items-center justify-content-between gap-2 shadow-2xs">
                                          <span className="fw-semibold text-dark small" style={{ fontSize: '12.5px' }}>
                                            {artName}:
                                          </span>
                                          <div className="input-group input-group-sm" style={{ width: '150px' }}>
                                            <input
                                              type="number"
                                              className="form-control fw-bold"
                                              placeholder="e.g. 6000"
                                              value={formData.consumptionPer100Pcs?.[artName] ?? ''}
                                              onChange={(e) => {
                                                setFormData({
                                                  ...formData,
                                                  consumptionPer100Pcs: {
                                                    ...(formData.consumptionPer100Pcs || {}),
                                                    [artName]: e.target.value
                                                  }
                                                });
                                              }}
                                            />
                                            <span className="input-group-text bg-light text-muted" style={{ fontSize: '11px' }}>m / 100pcs</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 7.5 Embroidery, Button Tacking & Handwork */}
                        {formData.threadPattern === 'Embroidery' && (
                          <div className="alert alert-info py-2.5 px-3 rounded-3 small mb-3 d-flex align-items-center gap-2">
                            <i className="ti ti-info-circle fs-5"></i>
                            <span>Section 7.5: No additional measurements are required for <strong>Embroidery</strong>.</span>
                          </div>
                        )}

                        {isProcessOnly && (
                          <div className="card p-3 rounded-3 mb-3 border bg-light shadow-2xs" style={{ borderColor: '#e2e8f0' }}>
                            <div className="fw-bold text-dark small mb-1">
                              {formData.threadPattern} (Section 7.5)
                            </div>
                            <p className="form-text text-muted mb-2" style={{ fontSize: '12px' }}>
                              No special measurements required — the BOM only records that this process is required.
                            </p>
                            <label className="form-label fw-semibold text-dark small mb-1">Remarks (optional)</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder={\`Optional remarks for \${formData.threadPattern}\`}
                              value={formData.processRemarks || ''}
                              onChange={(e) => setFormData({ ...formData, processRemarks: e.target.value })}
                              style={{ height: '38px', borderRadius: '7px' }}
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}

`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully replaced Thread form section in AccessoriesMasterView.jsx!');
