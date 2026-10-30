import React, { useState } from 'react';

// ============================================================
// ThreadMasterView — 3 Sections:
//   1. Thread Quality Master
//   2. Thread Box Size Master (Auto-calc: reels × reel length)
//   3. Thread Brand Master (Brand + Vendors + Rates per box size)
// ============================================================

const LS_QUALITIES  = 'raindrop_thread_qualities_v1';
const LS_BOX_SIZES  = 'raindrop_thread_box_sizes_v1';
const LS_BRANDS     = 'raindrop_thread_brands_v1';

// ---- Default seed data ----
const DEFAULT_QUALITIES = [
  { id: 'TQ-001', name: '2 Ply Poly' },
  { id: 'TQ-002', name: '3 Ply Poly' },
  { id: 'TQ-003', name: '2 Ply Pure Cotton' },
  { id: 'TQ-004', name: '3 Ply Pure Cotton' },
  { id: 'TQ-005', name: 'Embroidery Viscose' },
  { id: 'TQ-006', name: 'Embroidery Poly' },
];

const DEFAULT_BOX_SIZES = [
  { id: 'TBS-001', sizeName: 'Size 1', type: 'Box',  noOfReels: 15, reelLengthMts: 400,  totalThread: 6000 },
  { id: 'TBS-002', sizeName: 'Size 2', type: 'Cone', noOfReels: 1,  reelLengthMts: 5000, totalThread: 5000 },
  { id: 'TBS-003', sizeName: 'Size 3', type: 'Cone', noOfReels: 1,  reelLengthMts: 15,   totalThread: 15   },
  { id: 'TBS-004', sizeName: 'Size 4', type: 'Box',  noOfReels: 10, reelLengthMts: 800,  totalThread: 8000 },
];

const DEFAULT_BRANDS = [
  {
    id: 'TB-001',
    brandName: 'Sapphire',
    vendors: ['Sapphire Threads Pvt Ltd'],
    rates: [
      { boxSizeId: 'TBS-001', totalMts: 6000, rate: '' },
      { boxSizeId: 'TBS-004', totalMts: 8000, rate: '' },
      { boxSizeId: 'TBS-002', totalMts: 5000, rate: '' },
    ]
  }
];

// ---- Helpers ----
function loadLS(key, def) {
  try {
    const s = localStorage.getItem(key);
    if (s) return JSON.parse(s);
  } catch (e) {}
  return def;
}
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}
function genId(prefix, list) {
  const max = list.reduce((m, item) => {
    const n = parseInt((item.id || '').replace(prefix + '-', '')) || 0;
    return n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}
function calcTotal(noOfReels, reelLength) {
  const n = Number(noOfReels) || 0;
  const l = Number(reelLength) || 0;
  return n * l;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ThreadMasterView() {

  // --- State: Thread Quality ---
  const [qualities, setQualities] = useState(() => loadLS(LS_QUALITIES, DEFAULT_QUALITIES));
  const [qualityInput, setQualityInput] = useState('');
  const [editingQualityId, setEditingQualityId] = useState(null);
  const [editingQualityName, setEditingQualityName] = useState('');

  // --- State: Thread Box Sizes ---
  const [boxSizes, setBoxSizes] = useState(() => loadLS(LS_BOX_SIZES, DEFAULT_BOX_SIZES));
  const [bsForm, setBsForm] = useState({ sizeName: '', type: 'Box', noOfReels: '', reelLengthMts: '' });
  const [editingBsId, setEditingBsId] = useState(null);

  // --- State: Thread Brands ---
  const [brands, setBrands] = useState(() => loadLS(LS_BRANDS, DEFAULT_BRANDS));
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandForm, setBrandForm] = useState({
    brandName: '',
    vendors: [''],
    rates: []
  });
  const [brandFormErr, setBrandFormErr] = useState({});

  // ===================== QUALITY HANDLERS =====================
  const handleAddQuality = () => {
    const name = qualityInput.trim();
    if (!name) return;
    const newQ = { id: genId('TQ', qualities), name };
    const updated = [...qualities, newQ];
    setQualities(updated);
    saveLS(LS_QUALITIES, updated);
    setQualityInput('');
  };

  const handleDeleteQuality = (id) => {
    if (!window.confirm('Delete this thread quality?')) return;
    const updated = qualities.filter(q => q.id !== id);
    setQualities(updated);
    saveLS(LS_QUALITIES, updated);
  };

  const handleSaveQualityEdit = (id) => {
    const name = editingQualityName.trim();
    if (!name) return;
    const updated = qualities.map(q => q.id === id ? { ...q, name } : q);
    setQualities(updated);
    saveLS(LS_QUALITIES, updated);
    setEditingQualityId(null);
    setEditingQualityName('');
  };

  // ===================== BOX SIZE HANDLERS =====================
  const handleBsChange = (field, value) => {
    setBsForm(prev => {
      const next = { ...prev, [field]: value };
      next.totalThread = calcTotal(
        field === 'noOfReels' ? value : next.noOfReels,
        field === 'reelLengthMts' ? value : next.reelLengthMts
      );
      return next;
    });
  };

  const handleAddBoxSize = () => {
    const { sizeName, type, noOfReels, reelLengthMts } = bsForm;
    if (!sizeName.trim() || !type || !noOfReels || !reelLengthMts) {
      alert('Please fill all fields for Box Size.');
      return;
    }
    const totalThread = calcTotal(noOfReels, reelLengthMts);
    const newBs = { id: genId('TBS', boxSizes), sizeName: sizeName.trim(), type, noOfReels: Number(noOfReels), reelLengthMts: Number(reelLengthMts), totalThread };
    const updated = [...boxSizes, newBs];
    setBoxSizes(updated);
    saveLS(LS_BOX_SIZES, updated);
    setBsForm({ sizeName: '', type: 'Box', noOfReels: '', reelLengthMts: '' });
    setEditingBsId(null);
  };

  const handleEditBs = (bs) => {
    setEditingBsId(bs.id);
    setBsForm({ sizeName: bs.sizeName, type: bs.type, noOfReels: bs.noOfReels, reelLengthMts: bs.reelLengthMts, totalThread: bs.totalThread });
  };

  const handleSaveBsEdit = () => {
    const { sizeName, type, noOfReels, reelLengthMts } = bsForm;
    if (!sizeName.trim() || !type || !noOfReels || !reelLengthMts) {
      alert('Please fill all fields for Box Size.');
      return;
    }
    const totalThread = calcTotal(noOfReels, reelLengthMts);
    const updated = boxSizes.map(bs => bs.id === editingBsId
      ? { ...bs, sizeName: sizeName.trim(), type, noOfReels: Number(noOfReels), reelLengthMts: Number(reelLengthMts), totalThread }
      : bs
    );
    setBoxSizes(updated);
    saveLS(LS_BOX_SIZES, updated);
    setEditingBsId(null);
    setBsForm({ sizeName: '', type: 'Box', noOfReels: '', reelLengthMts: '' });
  };

  const handleDeleteBs = (id) => {
    if (!window.confirm('Delete this box size?')) return;
    const updated = boxSizes.filter(bs => bs.id !== id);
    setBoxSizes(updated);
    saveLS(LS_BOX_SIZES, updated);
  };

  // ===================== BRAND MODAL HELPERS =====================
  const openNewBrand = () => {
    setEditingBrand(null);
    setBrandForm({
      brandName: '',
      vendors: [''],
      rates: boxSizes.map(bs => ({ boxSizeId: bs.id, totalMts: bs.totalThread, rate: '' }))
    });
    setBrandFormErr({});
    setShowBrandModal(true);
  };

  const openEditBrand = (brand) => {
    setEditingBrand(brand);
    // Merge existing rates with current box sizes
    const rates = boxSizes.map(bs => {
      const existing = (brand.rates || []).find(r => r.boxSizeId === bs.id);
      return { boxSizeId: bs.id, totalMts: bs.totalThread, rate: existing ? existing.rate : '' };
    });
    setBrandForm({
      brandName: brand.brandName,
      vendors: brand.vendors && brand.vendors.length > 0 ? [...brand.vendors] : [''],
      rates
    });
    setBrandFormErr({});
    setShowBrandModal(true);
  };

  const handleBrandVendorChange = (idx, val) => {
    setBrandForm(prev => {
      const vendors = [...prev.vendors];
      vendors[idx] = val;
      return { ...prev, vendors };
    });
  };

  const handleAddVendorField = () => {
    setBrandForm(prev => ({ ...prev, vendors: [...prev.vendors, ''] }));
  };

  const handleRemoveVendorField = (idx) => {
    setBrandForm(prev => {
      const vendors = prev.vendors.filter((_, i) => i !== idx);
      return { ...prev, vendors: vendors.length > 0 ? vendors : [''] };
    });
  };

  const handleBrandRateChange = (boxSizeId, val) => {
    setBrandForm(prev => ({
      ...prev,
      rates: prev.rates.map(r => r.boxSizeId === boxSizeId ? { ...r, rate: val } : r)
    }));
  };

  const handleSaveBrand = () => {
    const errs = {};
    if (!brandForm.brandName.trim()) errs.brandName = 'Brand name is required';
    if (Object.keys(errs).length > 0) { setBrandFormErr(errs); return; }

    const cleanVendors = brandForm.vendors.map(v => v.trim()).filter(Boolean);
    const saved = {
      id: editingBrand ? editingBrand.id : genId('TB', brands),
      brandName: brandForm.brandName.trim(),
      vendors: cleanVendors,
      rates: brandForm.rates
    };

    let updated;
    if (editingBrand) {
      updated = brands.map(b => b.id === editingBrand.id ? saved : b);
    } else {
      updated = [saved, ...brands];
    }
    setBrands(updated);
    saveLS(LS_BRANDS, updated);
    setShowBrandModal(false);
  };

  const handleDeleteBrand = (id) => {
    if (!window.confirm('Delete this thread brand?')) return;
    const updated = brands.filter(b => b.id !== id);
    setBrands(updated);
    saveLS(LS_BRANDS, updated);
  };

  // ===================== RENDER =====================
  return (
    <div className="container-fluid p-0">

      {/* PAGE HEADER */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-muted fs-12">
              <li className="breadcrumb-item">Masters</li>
              <li className="breadcrumb-item active text-primary fw-medium">Thread Master</li>
            </ol>
          </nav>
          <h2 className="fw-bold text-dark mb-1 fs-24">Thread Master</h2>
          <p className="text-secondary mb-0 fs-13">Manage Thread Qualities, Box Sizes, and Brand Rates</p>
        </div>
      </div>

      <div className="row g-4">

        {/* ===================================================
            SECTION 1: THREAD QUALITY MASTER
        =================================================== */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100">
            <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-3 px-4">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary-subtle text-primary p-2 rounded-3">
                  <i className="ti ti-list fs-15"></i>
                </span>
                <div>
                  <h6 className="fw-bold text-dark mb-0 fs-15">Thread Quality Master</h6>
                  <div className="text-muted fs-11">Manually add list of qualities</div>
                </div>
              </div>
              <span className="badge bg-light text-secondary border px-2 py-1 fs-12">
                {qualities.length} entries
              </span>
            </div>

            <div className="card-body px-4 py-3">
              {/* Add new quality */}
              <div className="d-flex gap-2 mb-3">
                <input
                  type="text"
                  className="form-control form-control-sm fs-13"
                  placeholder="e.g. 2 Ply Poly, Embroidery Viscose..."
                  value={qualityInput}
                  onChange={e => setQualityInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddQuality(); }}
                  style={{ borderColor: '#cbd5e1' }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-3 fw-semibold fs-13 rounded-3 flex-shrink-0"
                  style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                  onClick={handleAddQuality}
                  title="Add Quality"
                >
                  <i className="ti ti-plus fs-14"></i>
                </button>
              </div>

              {/* List */}
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {qualities.length === 0 ? (
                  <div className="text-center text-muted py-4 fs-13">
                    <i className="ti ti-list-check fs-24 d-block mb-2 text-muted opacity-50"></i>
                    No thread qualities added yet.
                  </div>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {qualities.map((q, idx) => (
                      <li
                        key={q.id}
                        className="d-flex align-items-center justify-content-between py-2 border-bottom"
                        style={{ borderColor: '#f1f5f9' }}
                      >
                        {editingQualityId === q.id ? (
                          <div className="d-flex gap-2 flex-grow-1 me-2">
                            <input
                              type="text"
                              className="form-control form-control-sm fs-13"
                              value={editingQualityName}
                              onChange={e => setEditingQualityName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveQualityEdit(q.id); if (e.key === 'Escape') { setEditingQualityId(null); } }}
                              autoFocus
                              style={{ borderColor: '#6366f1' }}
                            />
                            <button className="btn btn-sm btn-success rounded-2 px-2" onClick={() => handleSaveQualityEdit(q.id)} title="Save">
                              <i className="ti ti-check fs-13"></i>
                            </button>
                            <button className="btn btn-sm btn-light rounded-2 px-2" onClick={() => setEditingQualityId(null)} title="Cancel">
                              <i className="ti ti-x fs-13"></i>
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-secondary-subtle text-secondary border fs-11 fw-normal px-1.5">{idx + 1}</span>
                              <span className="text-dark fs-13 fw-medium">{q.name}</span>
                            </div>
                            <div className="d-flex gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-light text-primary p-1 rounded-2"
                                title="Edit"
                                onClick={() => { setEditingQualityId(q.id); setEditingQualityName(q.name); }}
                              >
                                <i className="ti ti-edit fs-13"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-light text-danger p-1 rounded-2"
                                title="Delete"
                                onClick={() => handleDeleteQuality(q.id)}
                              >
                                <i className="ti ti-trash fs-13"></i>
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            SECTION 2: THREAD BOX SIZE MASTER
        =================================================== */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100">
            <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-3 px-4">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-success-subtle text-success p-2 rounded-3">
                  <i className="ti ti-box fs-15"></i>
                </span>
                <div>
                  <h6 className="fw-bold text-dark mb-0 fs-15">Thread Box Size Master</h6>
                  <div className="text-muted fs-11">Total = No. of Reels × Reel Length (auto-calculated)</div>
                </div>
              </div>
              <span className="badge bg-light text-secondary border px-2 py-1 fs-12">
                {boxSizes.length} sizes
              </span>
            </div>

            <div className="card-body px-4 py-3">
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0 fs-13" style={{ border: '1px solid #dee2e6', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '2px solid #dee2e6' }}>
                    <tr style={{ color: '#475569', fontSize: '11.5px', fontWeight: 600 }}>
                      <th style={{ padding: '8px 10px', border: '1px solid #dee2e6' }}>SIZE NAME</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #dee2e6' }}>BOX / CONE</th>
                      <th className="text-center" style={{ padding: '8px 10px', border: '1px solid #dee2e6' }}>NO. OF REELS</th>
                      <th className="text-center" style={{ padding: '8px 10px', border: '1px solid #dee2e6' }}>REEL LENGTH (MTS)</th>
                      <th className="text-center" style={{ padding: '8px 10px', border: '1px solid #dee2e6', background: '#f0fdf4' }}>TOTAL THREAD (MTS) ⚡</th>
                      <th style={{ width: '70px', padding: '8px 6px', border: '1px solid #dee2e6' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {boxSizes.map(bs => (
                      <tr key={bs.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        {editingBsId === bs.id ? (
                          <>
                            <td style={{ padding: '6px 8px', border: '1px solid #dee2e6' }}>
                              <input
                                type="text"
                                className="form-control form-control-sm fs-12"
                                value={bsForm.sizeName}
                                onChange={e => handleBsChange('sizeName', e.target.value)}
                                style={{ borderColor: '#6366f1', height: '30px' }}
                              />
                            </td>
                            <td style={{ padding: '6px 8px', border: '1px solid #dee2e6' }}>
                              <select
                                className="form-select form-select-sm fs-12"
                                value={bsForm.type}
                                onChange={e => handleBsChange('type', e.target.value)}
                                style={{ borderColor: '#6366f1', height: '30px' }}
                              >
                                <option value="Box">Box</option>
                                <option value="Cone">Cone</option>
                              </select>
                            </td>
                            <td style={{ padding: '6px 8px', border: '1px solid #dee2e6' }}>
                              <input
                                type="number"
                                className="form-control form-control-sm fs-12 text-center no-spinner"
                                value={bsForm.noOfReels}
                                onChange={e => handleBsChange('noOfReels', e.target.value)}
                                style={{ borderColor: '#6366f1', height: '30px' }}
                              />
                            </td>
                            <td style={{ padding: '6px 8px', border: '1px solid #dee2e6' }}>
                              <input
                                type="number"
                                className="form-control form-control-sm fs-12 text-center no-spinner"
                                value={bsForm.reelLengthMts}
                                onChange={e => handleBsChange('reelLengthMts', e.target.value)}
                                style={{ borderColor: '#6366f1', height: '30px' }}
                              />
                            </td>
                            <td className="text-center" style={{ padding: '6px 8px', border: '1px solid #dee2e6', background: '#f0fdf4' }}>
                              <span className="fw-bold text-success fs-13">
                                {(Number(bsForm.noOfReels) || 0) * (Number(bsForm.reelLengthMts) || 0)} mts
                              </span>
                            </td>
                            <td style={{ padding: '6px 4px', border: '1px solid #dee2e6' }}>
                              <div className="d-flex gap-1 justify-content-center">
                                <button className="btn btn-sm btn-success p-1 rounded-2" onClick={handleSaveBsEdit} title="Save">
                                  <i className="ti ti-check fs-12"></i>
                                </button>
                                <button className="btn btn-sm btn-light p-1 rounded-2" onClick={() => { setEditingBsId(null); setBsForm({ sizeName: '', type: 'Box', noOfReels: '', reelLengthMts: '' }); }} title="Cancel">
                                  <i className="ti ti-x fs-12"></i>
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: '8px 10px', border: '1px solid #dee2e6' }}>
                              <span className="fw-semibold text-dark fs-13">{bs.sizeName}</span>
                            </td>
                            <td style={{ padding: '8px 10px', border: '1px solid #dee2e6' }}>
                              <span className={`badge fs-11 fw-medium px-2 py-1 ${bs.type === 'Box' ? 'bg-primary-subtle text-primary border border-primary border-opacity-25' : 'bg-warning-subtle text-warning border border-warning border-opacity-25'}`}>
                                {bs.type}
                              </span>
                            </td>
                            <td className="text-center fw-medium text-dark fs-13" style={{ padding: '8px 10px', border: '1px solid #dee2e6' }}>
                              {bs.noOfReels}
                            </td>
                            <td className="text-center text-dark fs-13" style={{ padding: '8px 10px', border: '1px solid #dee2e6' }}>
                              {Number(bs.reelLengthMts).toLocaleString()} mts
                            </td>
                            <td className="text-center" style={{ padding: '8px 10px', border: '1px solid #dee2e6', background: '#f0fdf4' }}>
                              <span className="fw-bold text-success fs-13">{Number(bs.totalThread).toLocaleString()} mts</span>
                            </td>
                            <td style={{ padding: '6px 4px', border: '1px solid #dee2e6' }}>
                              <div className="d-flex gap-1 justify-content-center">
                                <button className="btn btn-sm btn-light text-primary p-1 rounded-2" onClick={() => handleEditBs(bs)} title="Edit">
                                  <i className="ti ti-edit fs-13"></i>
                                </button>
                                <button className="btn btn-sm btn-light text-danger p-1 rounded-2" onClick={() => handleDeleteBs(bs.id)} title="Delete">
                                  <i className="ti ti-trash fs-13"></i>
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}

                    {/* Add New Row (inline) */}
                    {editingBsId === null && (
                      <tr style={{ background: '#fafbfc' }}>
                        <td style={{ padding: '6px 8px', border: '1px solid #dee2e6' }}>
                          <input
                            type="text"
                            className="form-control form-control-sm fs-12"
                            placeholder="e.g. Size 5"
                            value={bsForm.sizeName}
                            onChange={e => handleBsChange('sizeName', e.target.value)}
                            style={{ borderColor: '#cbd5e1', height: '30px' }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #dee2e6' }}>
                          <select
                            className="form-select form-select-sm fs-12"
                            value={bsForm.type}
                            onChange={e => handleBsChange('type', e.target.value)}
                            style={{ borderColor: '#cbd5e1', height: '30px' }}
                          >
                            <option value="Box">Box</option>
                            <option value="Cone">Cone</option>
                          </select>
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #dee2e6' }}>
                          <input
                            type="number"
                            className="form-control form-control-sm fs-12 text-center no-spinner"
                            placeholder="15"
                            value={bsForm.noOfReels}
                            onChange={e => handleBsChange('noOfReels', e.target.value)}
                            style={{ borderColor: '#cbd5e1', height: '30px' }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #dee2e6' }}>
                          <input
                            type="number"
                            className="form-control form-control-sm fs-12 text-center no-spinner"
                            placeholder="400"
                            value={bsForm.reelLengthMts}
                            onChange={e => handleBsChange('reelLengthMts', e.target.value)}
                            style={{ borderColor: '#cbd5e1', height: '30px' }}
                          />
                        </td>
                        <td className="text-center" style={{ padding: '6px 8px', border: '1px solid #dee2e6', background: '#f0fdf4' }}>
                          {bsForm.noOfReels && bsForm.reelLengthMts ? (
                            <span className="fw-bold text-success fs-13">
                              {calcTotal(bsForm.noOfReels, bsForm.reelLengthMts).toLocaleString()} mts
                            </span>
                          ) : (
                            <span className="text-muted fs-12">—</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 4px', border: '1px solid #dee2e6' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary rounded-2 px-2"
                            style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb', height: '28px' }}
                            onClick={handleAddBoxSize}
                            title="Add Box Size"
                          >
                            <i className="ti ti-plus fs-12"></i>
                          </button>
                        </td>
                      </tr>
                    )}

                    {boxSizes.length === 0 && editingBsId !== null && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-3 fs-13">
                          No box sizes added yet. Use the row above to add.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            SECTION 3: THREAD BRAND MASTER
        =================================================== */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 bg-white">
            <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-3 px-4">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-warning-subtle text-warning p-2 rounded-3">
                  <i className="ti ti-tag fs-15"></i>
                </span>
                <div>
                  <h6 className="fw-bold text-dark mb-0 fs-15">Thread Brand Master</h6>
                  <div className="text-muted fs-11">Brand Name (Mandatory), Vendor (optional, multiple), Thread Rates per box size (optional)</div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm px-3 fw-semibold fs-13 rounded-3 d-flex align-items-center gap-1"
                style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                onClick={openNewBrand}
              >
                <i className="ti ti-plus fs-14"></i>
                <span>New Brand</span>
              </button>
            </div>

            <div className="card-body px-4 py-3">
              {brands.length === 0 ? (
                <div className="text-center text-muted py-5 fs-13">
                  <i className="ti ti-tag fs-30 d-block mb-2 opacity-40"></i>
                  No brands added yet. Click "+ New Brand" to add.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered align-middle mb-0 fs-13" style={{ border: '1px solid #dee2e6' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #dee2e6' }}>
                      <tr style={{ color: '#475569', fontSize: '11.5px', fontWeight: 600 }}>
                        <th style={{ padding: '8px 10px', border: '1px solid #dee2e6', minWidth: '120px' }}>BRAND NAME</th>
                        <th style={{ padding: '8px 10px', border: '1px solid #dee2e6' }}>VENDOR(S)</th>
                        {boxSizes.map(bs => (
                          <th key={bs.id} className="text-center" style={{ padding: '8px 8px', border: '1px solid #dee2e6', minWidth: '110px', background: '#fffbeb' }}>
                            <div>{bs.type === 'Box' ? '📦' : '🧵'} {bs.sizeName}</div>
                            <div className="fw-normal text-muted fs-10">{Number(bs.totalThread).toLocaleString()} mts</div>
                          </th>
                        ))}
                        <th style={{ width: '80px', padding: '8px 6px', border: '1px solid #dee2e6' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {brands.map(brand => (
                        <tr key={brand.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                          <td style={{ padding: '10px 12px', border: '1px solid #dee2e6' }}>
                            <div className="fw-bold text-dark fs-14">{brand.brandName}</div>
                            <div className="text-muted fs-11 font-monospace">{brand.id}</div>
                          </td>
                          <td style={{ padding: '10px 12px', border: '1px solid #dee2e6' }}>
                            {brand.vendors && brand.vendors.length > 0 ? (
                              <div className="d-flex flex-wrap gap-1">
                                {brand.vendors.filter(Boolean).map((v, i) => (
                                  <span key={i} className="badge bg-light text-secondary border fs-11 fw-normal px-2 py-1">{v}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted fs-12">— None —</span>
                            )}
                          </td>
                          {boxSizes.map(bs => {
                            const rateEntry = (brand.rates || []).find(r => r.boxSizeId === bs.id);
                            return (
                              <td key={bs.id} className="text-center" style={{ padding: '10px 8px', border: '1px solid #dee2e6', background: '#fffbeb' }}>
                                {rateEntry && rateEntry.rate ? (
                                  <span className="fw-semibold text-dark fs-13">₹{rateEntry.rate}</span>
                                ) : (
                                  <span className="badge bg-secondary-subtle text-secondary border fs-11 fw-normal px-2 py-1">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td style={{ padding: '8px 6px', border: '1px solid #dee2e6' }}>
                            <div className="d-flex gap-1 justify-content-center">
                              <button className="btn btn-sm btn-light text-primary p-1 rounded-2" onClick={() => openEditBrand(brand)} title="Edit Brand">
                                <i className="ti ti-edit fs-13"></i>
                              </button>
                              <button className="btn btn-sm btn-light text-danger p-1 rounded-2" onClick={() => handleDeleteBrand(brand.id)} title="Delete Brand">
                                <i className="ti ti-trash fs-13"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          BRAND MODAL: Create / Edit Brand
      ===================================================== */}
      {showBrandModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 p-4 bg-white">

              {/* Modal Header */}
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-warning-subtle text-warning p-2 rounded-3">
                    <i className="ti ti-tag fs-16"></i>
                  </span>
                  <h5 className="fw-bold text-dark mb-0 fs-18">
                    {editingBrand ? `Edit Brand — ${editingBrand.brandName}` : 'Create New Thread Brand'}
                  </h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowBrandModal(false)}></button>
              </div>

              <div style={{ maxHeight: 'calc(80vh - 150px)', overflowY: 'auto', paddingRight: '4px' }}>

                {/* Brand Name */}
                <div className="mb-3 p-3 bg-light rounded-3">
                  <label className="form-label fs-12 fw-bold text-uppercase text-secondary mb-1">Brand Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control bg-white fs-13 ${brandFormErr.brandName ? 'is-invalid' : ''}`}
                    placeholder="e.g. Sapphire, Coats, Madura..."
                    value={brandForm.brandName}
                    onChange={e => setBrandForm(prev => ({ ...prev, brandName: e.target.value }))}
                    style={{ borderColor: brandFormErr.brandName ? '#dc3545' : '#cbd5e1' }}
                  />
                  {brandFormErr.brandName && <div className="invalid-feedback">{brandFormErr.brandName}</div>}
                  <div className="form-text fs-11 mt-1">Manual Entry — e.g. "Sapphire"</div>
                </div>

                {/* Vendor Names */}
                <div className="mb-3 p-3 bg-light rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label fs-12 fw-bold text-uppercase text-secondary mb-0">Vendor Name(s) <span className="text-muted fw-normal">(optional, can be multiple)</span></label>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-primary fs-12 text-decoration-none fw-medium"
                      onClick={handleAddVendorField}
                    >
                      + Add Another Vendor
                    </button>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {brandForm.vendors.map((v, i) => (
                      <div key={i} className="d-flex gap-2 align-items-center">
                        <input
                          type="text"
                          className="form-control form-control-sm bg-white fs-13"
                          placeholder={`Vendor ${i + 1} name...`}
                          value={v}
                          onChange={e => handleBrandVendorChange(i, e.target.value)}
                          style={{ borderColor: '#cbd5e1' }}
                        />
                        {brandForm.vendors.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-light text-danger p-1 rounded-2 flex-shrink-0"
                            onClick={() => handleRemoveVendorField(i)}
                            title="Remove vendor"
                          >
                            <i className="ti ti-x fs-13"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thread Rates */}
                <div className="mb-3 p-3 bg-light rounded-3">
                  <label className="form-label fs-12 fw-bold text-uppercase text-secondary mb-2">
                    Thread Rates <span className="text-muted fw-normal">(optional — per box size)</span>
                  </label>
                  {boxSizes.length === 0 ? (
                    <div className="text-muted fs-12 py-2">
                      <i className="ti ti-info-circle me-1"></i>
                      No box sizes defined yet. Add box sizes in Section 2 first.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {brandForm.rates.map(rateRow => {
                        const bs = boxSizes.find(b => b.id === rateRow.boxSizeId);
                        if (!bs) return null;
                        const label = `${bs.type === 'Box' ? '📦' : '🧵'} ${bs.sizeName} — ${Number(bs.totalThread).toLocaleString()} mts`;
                        return (
                          <div key={rateRow.boxSizeId} className="row align-items-center g-2">
                            <div className="col-6 col-md-7">
                              <div className="text-dark fs-13 fw-medium">{label}</div>
                            </div>
                            <div className="col-6 col-md-5">
                              <div className="input-group input-group-sm">
                                <span className="input-group-text bg-white fs-13">₹</span>
                                <input
                                  type="number"
                                  className="form-control form-control-sm bg-white fs-13 text-end no-spinner"
                                  placeholder="Enter rate..."
                                  value={rateRow.rate}
                                  onChange={e => handleBrandRateChange(rateRow.boxSizeId, e.target.value)}
                                  style={{ borderColor: '#cbd5e1' }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-light border px-4 py-2 fs-13 rounded-3 text-secondary"
                  onClick={() => setShowBrandModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary px-4 py-2 fw-semibold fs-13 rounded-3"
                  style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                  onClick={handleSaveBrand}
                >
                  <i className="ti ti-device-floppy me-1 fs-15"></i>
                  {editingBrand ? 'Save Changes' : 'Create Brand'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
