const fs = require('fs');
const path = require('path');

const accFile = path.resolve('frontend/src/components/Masters/AccessoriesMasterView.jsx');
let accContent = fs.readFileSync(accFile, 'utf8');

// 1. Update getEmptyAccessoryForm for Thread / Stitching defaults
accContent = accContent.replace(
  /threadPerPiece:\s*'',/g,
  `threadPerPiece: 60,\n    stitchingArticle: 'Kurta',\n    stitchingArticles: ['Kurta'],\n    articleThreadQty: { Kurta: 60 },`
);

// 2. Update Stitching block in Modal (lines ~1888-2150)
const oldModalStitchingStart = `{/* 7.4 Stitching Pattern */}`;
// We can find the Stitching section between `isStitching && (` and `formData.threadPattern === 'Embroidery'`
const stitchingRegex = /\{\/\* 7\.4 Stitching Pattern \*\/\}\s*\{isStitching && \([\s\S]*?\)\s*\}\s*\{\/\* 7\.5 Embroidery/m;

const newModalStitching = `{/* 7.4 Stitching Pattern (Updated per user specification: Select Article -> Qty in mts of thread required to stitch 1 article) */}
                        {isStitching && (
                          <div className="card p-3 rounded-3 mb-3 border bg-white shadow-2xs" style={{ borderColor: '#e2e8f0' }}>
                            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge rounded-pill px-2.5 py-1 text-white" style={{ backgroundColor: '#2e37a4' }}>
                                  Stitching
                                </span>
                                <span className="fw-bold text-dark fs-14">Pattern Configuration</span>
                              </div>
                              <span className="small text-muted" style={{ fontSize: '11.5px' }}>Garment Assembly</span>
                            </div>

                            {/* select Article - for ex Kurta */}
                            <div className="mb-3">
                              <label className="form-label fw-semibold text-dark small mb-1.5">
                                Select Article <span className="text-muted fw-normal">(for ex Kurta)</span> <span className="text-danger">*</span>
                              </label>

                              {/* Multi-select chips for articles */}
                              <div className="d-flex flex-wrap gap-1.5 mb-2.5">
                                {availableTargetArticles.map((art) => {
                                  const currentArticles = Array.isArray(formData.stitchingArticles) && formData.stitchingArticles.length > 0
                                    ? formData.stitchingArticles
                                    : [formData.stitchingArticle || 'Kurta'];
                                  const isSelected = currentArticles.some(a => String(a).toLowerCase().trim() === String(art.name).toLowerCase().trim());
                                  return (
                                    <button
                                      key={art.id || art.name}
                                      type="button"
                                      className={\`btn btn-sm d-inline-flex align-items-center gap-1.5 py-1 px-3 rounded-pill border transition-all \${
                                        isSelected ? 'btn-primary text-white shadow-xs fw-semibold' : 'bg-light text-secondary'
                                      }\`}
                                      style={{ fontSize: '12.5px' }}
                                      onClick={() => {
                                        const current = Array.isArray(formData.stitchingArticles) && formData.stitchingArticles.length > 0
                                          ? formData.stitchingArticles
                                          : [formData.stitchingArticle || 'Kurta'];
                                        let next;
                                        if (isSelected) {
                                          if (current.length > 1) {
                                            next = current.filter(a => String(a).toLowerCase().trim() !== String(art.name).toLowerCase().trim());
                                          } else {
                                            next = current;
                                          }
                                        } else {
                                          next = [...current, art.name];
                                        }
                                        const nextQty = { ...(formData.articleThreadQty || {}) };
                                        if (!nextQty[art.name]) {
                                          nextQty[art.name] = formData.threadPerPiece || 60;
                                        }
                                        const primaryArt = next[0] || 'Kurta';
                                        setFormData(prev => ({
                                          ...prev,
                                          stitchingArticle: primaryArt,
                                          stitchingArticles: next,
                                          threadPerPiece: nextQty[primaryArt] || prev.threadPerPiece || 60,
                                          articleThreadQty: nextQty
                                        }));
                                      }}
                                    >
                                      <span>{art.icon || '👕'}</span>
                                      <span>{art.name}</span>
                                      {isSelected && <i className="ti ti-check small ms-1"></i>}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Quick add custom article */}
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <div className="input-group input-group-sm" style={{ maxWidth: '280px' }}>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Add custom article (e.g. Gown)"
                                    value={customArticleInput}
                                    onChange={(e) => setCustomArticleInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCustomArticle();
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={handleAddCustomArticle}
                                  >
                                    <i className="ti ti-plus"></i> Add
                                  </button>
                                </div>
                                <span className="text-muted" style={{ fontSize: '11px' }}>
                                  (Select or add garment article type)
                                </span>
                              </div>
                            </div>

                            {/* qty (in mts) of thread required to stitch 1 Kurta article - <Enter 60> mts */}
                            <div className="p-3 bg-white rounded-3 border mb-2" style={{ borderColor: '#e2e8f0' }}>
                              {(Array.isArray(formData.stitchingArticles) && formData.stitchingArticles.length > 0
                                ? formData.stitchingArticles
                                : [formData.stitchingArticle || 'Kurta']
                              ).map((artName) => {
                                const currentQty = formData.articleThreadQty?.[artName] ?? (artName === (formData.stitchingArticle || 'Kurta') ? (formData.threadPerPiece || 60) : 60);
                                return (
                                  <div key={artName} className="mb-3 last:mb-0">
                                    <label className="form-label fw-semibold text-dark small mb-1">
                                      qty (in mts) of thread required to stitch 1 {artName} article <span className="text-muted fw-normal">(for ex Kurta - &lt;Enter 60&gt; mts)</span> <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group input-group-sm" style={{ maxWidth: '280px' }}>
                                      <input
                                        type="number"
                                        step="any"
                                        className="form-control fw-bold"
                                        placeholder="Enter 60"
                                        value={currentQty}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const nextQty = { ...(formData.articleThreadQty || {}), [artName]: val };
                                          const nextCons = { ...(formData.consumptionPer100Pcs || {}), [artName]: Number((parseFloat(val || 0) * 100).toFixed(2)) };
                                          setFormData(prev => ({
                                            ...prev,
                                            threadPerPiece: artName === (prev.stitchingArticle || 'Kurta') ? val : prev.threadPerPiece,
                                            articleThreadQty: nextQty,
                                            consumptionPer100Pcs: nextCons
                                          }));
                                        }}
                                        style={{ height: '38px', borderRadius: '8px 0 0 8px' }}
                                      />
                                      <span className="input-group-text bg-light text-dark fw-semibold" style={{ borderRadius: '0 8px 8px 0' }}>
                                        mts
                                      </span>
                                    </div>
                                    <div className="form-text text-muted" style={{ fontSize: '11.5px' }}>
                                      Thread quantity in meters required to stitch 1 {artName} article. Auto-fills BOM quantity per piece.
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 7.5 Embroidery`;

if (stitchingRegex.test(accContent)) {
  accContent = accContent.replace(stitchingRegex, newModalStitching);
  console.log('Replaced Modal Stitching section successfully');
} else {
  console.log('Regex for Modal Stitching did not match');
}

// 3. Update Section 2 Inline Edit for Stitching (around line 3727)
const oldSection2EditRegex = /\{sectionFormData\.threadPattern === 'Stitching' && \([\s\S]*?\)\s*\}\s*\{sectionFormData\.threadPattern === 'Embroidery'/m;
const newSection2Edit = `{sectionFormData.threadPattern === 'Stitching' && (
                          <div className="p-3 bg-light rounded-3 border mb-3">
                            {/* select Article - for ex Kurta */}
                            <div className="mb-3">
                              <label className="form-label small fw-semibold text-dark mb-1">
                                Select Article <span className="text-muted fw-normal">(for ex Kurta)</span> <span className="text-danger">*</span>
                              </label>
                              <div className="d-flex flex-wrap gap-1.5 mb-2">
                                {availableTargetArticles.map((art) => {
                                  const selList = Array.isArray(sectionFormData.stitchingArticles) && sectionFormData.stitchingArticles.length > 0
                                    ? sectionFormData.stitchingArticles
                                    : [sectionFormData.stitchingArticle || 'Kurta'];
                                  const isSel = selList.some(a => String(a).toLowerCase().trim() === String(art.name).toLowerCase().trim());
                                  return (
                                    <button
                                      key={art.name}
                                      type="button"
                                      className={\`btn btn-xs rounded-pill border \${isSel ? 'btn-primary text-white fw-semibold' : 'btn-light text-dark'}\`}
                                      onClick={() => {
                                        const nextList = isSel
                                          ? (selList.length > 1 ? selList.filter(a => String(a).toLowerCase().trim() !== String(art.name).toLowerCase().trim()) : selList)
                                          : [...selList, art.name];
                                        const nextQty = { ...(sectionFormData.articleThreadQty || {}) };
                                        if (!nextQty[art.name]) nextQty[art.name] = sectionFormData.threadPerPiece || 60;
                                        const primaryArt = nextList[0] || 'Kurta';
                                        setSectionFormData({
                                          ...sectionFormData,
                                          stitchingArticle: primaryArt,
                                          stitchingArticles: nextList,
                                          threadPerPiece: nextQty[primaryArt] || sectionFormData.threadPerPiece || 60,
                                          articleThreadQty: nextQty
                                        });
                                      }}
                                    >
                                      {art.name} {isSel ? '✓' : '+'}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* qty (in mts) of thread required to stitch 1 article */}
                            {(Array.isArray(sectionFormData.stitchingArticles) && sectionFormData.stitchingArticles.length > 0
                              ? sectionFormData.stitchingArticles
                              : [sectionFormData.stitchingArticle || 'Kurta']
                            ).map((artName) => {
                              const curVal = sectionFormData.articleThreadQty?.[artName] ?? (artName === (sectionFormData.stitchingArticle || 'Kurta') ? (sectionFormData.threadPerPiece || 60) : 60);
                              return (
                                <div key={artName} className="mb-2.5 last:mb-0">
                                  <label className="form-label small fw-semibold text-dark mb-1">
                                    qty (in mts) of thread required to stitch 1 {artName} article <span className="text-muted fw-normal">(&lt;Enter 60&gt; mts)</span> <span className="text-danger">*</span>
                                  </label>
                                  <div className="input-group input-group-sm" style={{ maxWidth: '260px' }}>
                                    <input
                                      type="number"
                                      step="any"
                                      className="form-control fw-bold"
                                      placeholder="Enter 60"
                                      value={curVal}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const nextQty = { ...(sectionFormData.articleThreadQty || {}), [artName]: val };
                                        setSectionFormData({
                                          ...sectionFormData,
                                          threadPerPiece: artName === (sectionFormData.stitchingArticle || 'Kurta') ? val : sectionFormData.threadPerPiece,
                                          articleThreadQty: nextQty
                                        });
                                      }}
                                    />
                                    <span className="input-group-text bg-white text-muted">mts</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {sectionFormData.threadPattern === 'Embroidery'`;

if (oldSection2EditRegex.test(accContent)) {
  accContent = accContent.replace(oldSection2EditRegex, newSection2Edit);
  console.log('Replaced Section 2 Edit Stitching successfully');
} else {
  console.log('Regex for Section 2 Edit Stitching did not match');
}

// 4. Update Section 2 View Mode for Stitching (around line 3862)
const oldSection2ViewRegex = /\{selectedAccessory\.threadPattern === 'Stitching' && \([\s\S]*?\)\s*\}\s*\{selectedAccessory\.threadPattern === 'Embroidery'/m;
const newSection2View = `{selectedAccessory.threadPattern === 'Stitching' && (
                          <div className="d-flex flex-column gap-2.5 pt-2 border-top">
                            <div>
                              <div className="text-muted small mb-1 fw-semibold">Article &amp; Thread Requirement (Stitching):</div>
                              <div className="d-flex flex-wrap gap-2">
                                {(Array.isArray(selectedAccessory.stitchingArticles) && selectedAccessory.stitchingArticles.length > 0
                                  ? selectedAccessory.stitchingArticles
                                  : [selectedAccessory.stitchingArticle || 'Kurta']
                                ).map((art) => {
                                  const q = selectedAccessory.articleThreadQty?.[art] ?? selectedAccessory.threadPerPiece ?? 60;
                                  return (
                                    <span key={art} className="badge bg-white text-dark border px-2.5 py-1.5 shadow-2xs d-inline-flex align-items-center gap-1.5" style={{ fontSize: '12px' }}>
                                      <span className="fw-bold">{art}:</span>
                                      <span className="text-primary font-monospace fw-bold">{q} mts</span>
                                      <span className="text-muted" style={{ fontSize: '10.5px' }}>/ article</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedAccessory.threadPattern === 'Embroidery'`;

if (oldSection2ViewRegex.test(accContent)) {
  accContent = accContent.replace(oldSection2ViewRegex, newSection2View);
  console.log('Replaced Section 2 View Stitching successfully');
} else {
  console.log('Regex for Section 2 View Stitching did not match');
}

fs.writeFileSync(accFile, accContent, 'utf8');
console.log('Successfully written AccessoriesMasterView.jsx');

// 5. Update demo.html
const demoFile = path.resolve('Rain ERP/preclinic.dreamstechnologies.com/react/demo.html');
let demoContent = fs.readFileSync(demoFile, 'utf8');

const oldDemoStitchingRegex = /\$\{d\.threadPattern==='Stitching'\s*\?\s*`[\s\S]*?`\s*:\s*''\}/m;
const newDemoStitching = `\${d.threadPattern==='Stitching' ? \`
        <div class="row">
          <div class="field"><label>Select Article (for ex Kurta)</label>
            <select onchange="accField('stitchingArticle', this.value); if(!window._accDraft.threadPerPiece) accField('threadPerPiece', 60);">
              \${['Kurta', 'Pant', 'Shirt', 'Top', 'Tunic', 'Jacket', 'Dupatta'].map(a => \`<option \${(d.stitchingArticle||'Kurta')===a?'selected':''}>\${a}</option>\`).join('')}
            </select>
          </div>
        </div>
        <div class="row">
          <div class="field"><label>qty (in mts) of thread required to stitch 1 \${d.stitchingArticle || 'Kurta'} article - &lt;Enter 60&gt; mts</label>
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="number" value="\${d.threadPerPiece !== undefined && d.threadPerPiece !== '' ? d.threadPerPiece : 60}" placeholder="Enter 60" onchange="accField('threadPerPiece', Number(this.value)||60)">
              <span class="expected-tag">mts</span>
            </div>
          </div>
        </div>
        <div class="hint">Auto-fills the BOM quantity per piece (\${d.threadPerPiece || 60} mts); remains editable there.</div>
      \` : ''}`;

if (oldDemoStitchingRegex.test(demoContent)) {
  demoContent = demoContent.replace(oldDemoStitchingRegex, newDemoStitching);
  fs.writeFileSync(demoFile, demoContent, 'utf8');
  console.log('Successfully updated demo.html Stitching section');
} else {
  console.log('demo.html Stitching regex did not match');
}

