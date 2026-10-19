import React, { useState, useMemo, useEffect } from 'react';
import { initialColors, getStoredData, setStoredData } from '../../data/salesOrderData';

/**
 * Standard palette for quick color selection in Color Picker dialog
 */
const STANDARD_PALETTE = [
  { name: 'Charcoal', hex: '#333333' },
  { name: 'Pure Black', hex: '#000000' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Ivory', hex: '#FFFFF0' },
  { name: 'Green', hex: '#228B22' },
  { name: 'Forest Green', hex: '#2E8B57' },
  { name: 'Rama Green', hex: '#20B2AA' },
  { name: 'Navy Blue', hex: '#000080' },
  { name: 'Royal Blue', hex: '#4169E1' },
  { name: 'Sky Blue', hex: '#87CEEB' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Wine', hex: '#722F37' },
  { name: 'Pastel Red', hex: '#FF6961' },
  { name: 'Watermelon', hex: '#FC6C85' },
  { name: 'Rust Light', hex: '#B7410E' },
  { name: 'Yellow', hex: '#FFD700' },
  { name: 'Mustard', hex: '#E1AD01' },
  { name: 'Lavender', hex: '#E6E6FA' },
  { name: 'Jamun', hex: '#4B0082' },
  { name: 'Coral', hex: '#FF7F50' }
];

function isLightColor(hexStr) {
  const clean = (hexStr || '').replace('#', '').trim();
  if (clean.length !== 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 170;
}

export default function ColorMasterView({ isInline = false, onSaveInline, onCloseInline }) {
  const [colors, setColors] = useState(() => {
    return getStoredData('erp_colors_master_v1', initialColors);
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isEditing, setIsEditing] = useState(isInline);
  const [isCreatingNew, setIsCreatingNew] = useState(isInline);
  const [toastMessage, setToastMessage] = useState('');

  // Form State matching Section 3.1 & Section 6 Data Structure
  const [formData, setFormData] = useState({
    id: isInline ? `COL-${String(colors.length + 1).padStart(3, '0')}` : '',
    name: '',
    hexCode: '',
    pantoneCode: '',
    quarterTag: '',
    isTrending: false,
    active: true
  });

  const [quarterFilter, setQuarterFilter] = useState('All');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleAddNew = () => {
    const nextNum = colors.length + 1;
    setFormData({
      id: `COL-${String(nextNum).padStart(3, '0')}`,
      name: '',
      hexCode: '',
      pantoneCode: '',
      quarterTag: '',
      isTrending: false,
      active: true
    });
    setIsCreatingNew(true);
    setIsEditing(true);
  };

  const handleEdit = (color) => {
    setFormData({
      id: color.id,
      name: color.name || '',
      hexCode: color.hexCode || color.hex || '#333333',
      pantoneCode: color.pantoneCode || color.pantone || '',
      quarterTag: color.quarterTag || '',
      isTrending: Boolean(color.isTrending),
      active: color.active !== false
    });
    setIsCreatingNew(false);
    setIsEditing(true);
  };

  const handleDelete = (colorId) => {
    if (!window.confirm('Are you sure you want to delete this color?')) return;
    const updated = colors.filter((c) => c.id !== colorId);
    setColors(updated);
    setStoredData('erp_colors_master_v1', updated);
    showToast('Color deleted successfully');
  };

  const handleToggleStatus = (colorId) => {
    const updated = colors.map((c) => (c.id === colorId ? { ...c, active: !c.active } : c));
    setColors(updated);
    setStoredData('erp_colors_master_v1', updated);
    showToast('Status updated');
  };

  const saveColor = (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      alert('Color Name is required');
      return;
    }

    // Section 12.1 Validation: Hex code must be valid 6-character hex value
    let cleanHex = formData.hexCode.trim();
    if (!cleanHex.startsWith('#')) cleanHex = `#${cleanHex}`;
    const hexPattern = /^#([0-9A-Fa-f]{6})$/;
    if (!hexPattern.test(cleanHex)) {
      alert('Please enter a valid 6-character HEX code (e.g. #333333 or #2E8B57)');
      return;
    }

    // Auto-capitalise word by word
    const capitalizedName = formData.name.replace(/\b\w/g, (c) => c.toUpperCase());
    const nextNum = colors.length + 1;
    const colorObj = {
      ...formData,
      id: formData.id || `COL-${String(nextNum).padStart(3, '0')}`,
      name: capitalizedName,
      hexCode: cleanHex.toUpperCase(),
      pantoneCode: formData.pantoneCode.trim(),
      quarterTag: formData.quarterTag || '',
      isTrending: Boolean(formData.isTrending),
      active: formData.active !== false,
      lastModified: new Date().toISOString()
    };

    let updatedList;
    if (colors.some((c) => c.id === colorObj.id)) {
      updatedList = colors.map((c) => (c.id === colorObj.id ? colorObj : c));
      showToast(`Color "${colorObj.name}" updated`);
    } else {
      updatedList = [colorObj, ...colors];
      showToast(`Color "${colorObj.name}" created`);
    }

    setColors(updatedList);
    setStoredData('erp_colors_master_v1', updatedList);

    if (isInline && onSaveInline) {
      onSaveInline(colorObj);
      return;
    }

    setIsEditing(false);
    setIsCreatingNew(false);
  };

  // Filtered colors matching search, status, and quarter/season (Section 6)
  const filteredColors = useMemo(() => {
    return colors.filter((c) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.hexCode && c.hexCode.toLowerCase().includes(q)) ||
        (c.pantoneCode && c.pantoneCode.toLowerCase().includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && c.active) ||
        (statusFilter === 'Inactive' && !c.active);

      const matchQuarter =
        quarterFilter === 'All' ||
        (quarterFilter === 'Trending' && c.isTrending) ||
        (quarterFilter === 'Untagged' && !c.quarterTag) ||
        c.quarterTag === quarterFilter;

      return matchSearch && matchStatus && matchQuarter;
    });
  }, [colors, searchTerm, statusFilter, quarterFilter]);

  return (
    <div className="p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 1100, transform: 'translateY(10px)' }}
        >
          <div className="toast show align-items-center text-white bg-dark border-0 rounded-3 shadow px-3 py-2">
            <div className="d-flex align-items-center gap-2">
              <i className="ti ti-check text-success"></i>
              <span className="small fw-medium">{toastMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header & Controls (Section 3.2) */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="ti ti-color-swatch text-primary"></i> Color Master
          </h4>
          <p className="text-muted small mb-0">
            Route 1 — Sales Order Masters · Section 3: Visual Color Swatches & HEX Picker
          </p>
        </div>

        <div className="d-flex align-items-center gap-2.5">
          {/* Search Bar */}
          <div className="position-relative" style={{ width: '270px' }}>
            <i
              className="ti ti-search text-muted"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '15px',
                pointerEvents: 'none',
                zIndex: 2
              }}
            ></i>
            <input
              type="text"
              className="form-control rounded-pill bg-white search-input-integrated"
              placeholder="Search colors, HEX, Pantone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderColor: '#cbd5e1', fontSize: '13px', height: '38px', paddingLeft: '44px' }}
            />
          </div>

          {/* Quarter/Season Filter (Section 6) */}
          <select
            className="form-select rounded-pill bg-white border"
            value={quarterFilter}
            onChange={(e) => setQuarterFilter(e.target.value)}
            style={{ borderColor: '#cbd5e1', fontSize: '13px', height: '38px', width: '150px' }}
          >
            <option value="All">All Quarters</option>
            <option value="Trending">⭐ Trending Only</option>
            <option value="Q1">Q1 (Jan–Mar)</option>
            <option value="Q2">Q2 (Apr–Jun)</option>
            <option value="Q3">Q3 (Jul–Sep)</option>
            <option value="Q4">Q4 (Oct–Dec)</option>
            <option value="Untagged">Untagged</option>
          </select>

          {/* Status Filter */}
          <select
            className="form-select rounded-pill bg-white border"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ borderColor: '#cbd5e1', fontSize: '13px', height: '38px', width: '115px' }}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {!isEditing && (
            <button
              className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4 fw-semibold"
              onClick={handleAddNew}
              style={{ height: '38px', fontSize: '13px' }}
            >
              <i className="ti ti-plus"></i> Add Color
            </button>
          )}
        </div>
      </div>

      {/* Add / Edit Form Modal (Section 3.2 Color Picker Dialog Popup) */}
      {isEditing && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1055, overflowY: 'auto' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-white">
              <div className="modal-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      backgroundColor: formData.hexCode || '#e2e8f0',
                      border: '1px solid #cbd5e1'
                    }}
                  />
                  {isCreatingNew ? 'Add New Color' : `Edit Color: ${formData.name}`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setIsEditing(false);
                    if (isInline && onCloseInline) onCloseInline();
                  }}
                ></button>
              </div>

              <form onSubmit={saveColor}>
                <div className="modal-body p-4">
                  <div className="row g-4">
                    {/* Left Side: Fields */}
                    <div className="col-md-7">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold small text-muted">Color Name *</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Royal Maroon"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold small text-muted">Pantone Code</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. PANTONE 19-1528"
                            value={formData.pantoneCode}
                            onChange={(e) => setFormData({ ...formData, pantoneCode: e.target.value })}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold small text-muted">Hex Code *</label>
                          <div className="input-group">
                            <span
                              className="input-group-text p-1 border-end-0"
                              style={{ backgroundColor: '#ffffff' }}
                            >
                              <input
                                type="color"
                                value={formData.hexCode || '#ffffff'}
                                onChange={(e) => setFormData({ ...formData, hexCode: e.target.value.toUpperCase() })}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  border: formData.hexCode ? 'none' : '1px dashed #cbd5e1',
                                  cursor: 'pointer',
                                  borderRadius: '6px'
                                }}
                              />
                            </span>
                            <input
                              type="text"
                              className="form-control font-monospace border-start-0"
                              placeholder="e.g. #2E37A4"
                              required
                              value={formData.hexCode || ''}
                              onChange={(e) => setFormData({ ...formData, hexCode: e.target.value.toUpperCase() })}
                            />
                          </div>
                        </div>

                        <div className="col-md-6 d-flex align-items-center pt-4">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="activeStatusSwitch"
                              checked={formData.active}
                              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                              style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label fw-semibold small text-dark ms-2" htmlFor="activeStatusSwitch">
                              Active Status
                            </label>
                          </div>
                        </div>

                        {/* Section 6.2: Assign this colour to a specific Quarter? */}
                        <div className="col-md-6">
                          <label className="form-label fw-semibold small text-muted">
                            Assign this colour to a specific Quarter? (Section 6)
                          </label>
                          <select
                            className="form-select"
                            value={formData.quarterTag || ''}
                            onChange={(e) => setFormData({ ...formData, quarterTag: e.target.value })}
                            style={{ fontSize: '13px' }}
                          >
                            <option value="">None / Untagged</option>
                            <option value="Q1">🌸 Q1 (Jan–Mar · Spring / Trending)</option>
                            <option value="Q2">☀️ Q2 (Apr–Jun · Summer Pastels)</option>
                            <option value="Q3">🌧️ Q3 (Jul–Sep · Monsoon & Festive)</option>
                            <option value="Q4">❄️ Q4 (Oct–Dec · Winter & Wedding)</option>
                          </select>
                        </div>

                        {/* Section 6.1: Trending Flag */}
                        <div className="col-md-6 d-flex align-items-center pt-3">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="trendingFlagSwitch"
                              checked={formData.isTrending || false}
                              onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                              style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label fw-semibold small text-dark ms-2" htmlFor="trendingFlagSwitch">
                              ⭐ Trending Colour (Always show in Order Form)
                            </label>
                          </div>
                        </div>

                        {/* Standard Color Palette Picker (Section 3.2) */}
                        <div className="col-12 mt-3">
                          <label className="form-label fw-semibold small text-muted mb-2">
                            Quick Select Standard Palette
                          </label>
                          <div className="d-flex flex-wrap gap-2">
                            {STANDARD_PALETTE.map((pal) => (
                              <button
                                key={pal.name}
                                type="button"
                                className="btn btn-sm d-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill border shadow-xs"
                                style={{
                                  backgroundColor: '#ffffff',
                                  borderColor: formData.hexCode === pal.hex ? '#4f46e5' : '#e2e8f0',
                                  borderWidth: formData.hexCode === pal.hex ? '2px' : '1px'
                                }}
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    name: formData.name || pal.name,
                                    hexCode: pal.hex
                                  });
                                }}
                              >
                                <span
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    backgroundColor: pal.hex,
                                    border: '1px solid rgba(0,0,0,0.15)'
                                  }}
                                />
                                <span style={{ fontSize: '12px', color: '#334155', fontWeight: 500 }}>
                                  {pal.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Live Swatch Card Preview (Section 3.2) */}
                    <div className="col-md-5 d-flex align-items-center justify-content-center">
                      <div
                        className="card border-0 shadow-sm rounded-4 overflow-hidden text-center"
                        style={{ width: '240px', border: '1px solid #e2e8f0' }}
                      >
                        <div
                          style={{
                            height: '140px',
                            backgroundColor: formData.hexCode || '#f8fafc',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: formData.hexCode ? (isLightColor(formData.hexCode) ? '#0f172a' : '#ffffff') : '#94a3b8',
                            fontWeight: 700,
                            fontSize: formData.hexCode ? '18px' : '13px',
                            letterSpacing: '0.04em',
                            borderBottom: '1px solid #e2e8f0'
                          }}
                        >
                          {formData.hexCode ? (
                            <span>{formData.hexCode}</span>
                          ) : (
                            <div className="text-center p-2">
                              <i className="ti ti-palette fs-2 mb-1 d-block opacity-40"></i>
                              <span className="small fw-normal">Select or Enter Color</span>
                            </div>
                          )}
                        </div>
                        <div className="card-body p-3 bg-white">
                          <h6 className="fw-bold text-dark mb-1">
                            {formData.name || 'Color Preview'}
                          </h6>
                          <span className="text-muted small font-monospace d-block">
                            {formData.pantoneCode || 'PANTONE —'}
                          </span>
                          <span className="badge bg-success-subtle text-success border border-success-subtle mt-2 px-2.5 py-1 rounded-pill small">
                            {formData.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top py-2.5 px-4 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-3 px-4"
                    onClick={() => {
                      setIsEditing(false);
                      if (isInline && onCloseInline) onCloseInline();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold">
                    <i className="ti ti-check me-1"></i> {isCreatingNew ? 'Create Color' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Colors Grid — Attractive Card Layout (Section 3.2) */}
      <div className="row g-3">
        {filteredColors.map((col) => {
          const hex = col.hexCode || col.hex || '#333333';
          const lightText = !isLightColor(hex);

          return (
            <div key={col.id} className="col-sm-6 col-md-4 col-lg-3">
              <div
                className="card border-0 shadow-xs h-100 overflow-hidden transition-all"
                style={{
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                {/* Visual Swatch Area */}
                <div
                  style={{
                    height: '110px',
                    backgroundColor: hex,
                    position: 'relative',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between'
                  }}
                >
                  <span
                    className="badge rounded-pill px-2 py-0.5"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      color: '#ffffff',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    {col.id}
                  </span>

                  {/* Actions (Edit / Delete) */}
                  <div className="d-flex align-items-center gap-1">
                    <button
                      className="btn btn-sm p-1 rounded-2 shadow-xs"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        color: '#0f172a',
                        width: '28px',
                        height: '28px'
                      }}
                      onClick={() => handleEdit(col)}
                      title="Edit Color"
                    >
                      <i className="ti ti-edit" style={{ fontSize: '13px' }}></i>
                    </button>
                    <button
                      className="btn btn-sm p-1 rounded-2 shadow-xs"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        color: '#ef4444',
                        width: '28px',
                        height: '28px'
                      }}
                      onClick={() => handleDelete(col.id)}
                      title="Delete Color"
                    >
                      <i className="ti ti-trash" style={{ fontSize: '13px' }}></i>
                    </button>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-3 bg-white d-flex flex-column justify-content-between flex-grow-1">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '14.5px' }}>
                        {col.name}
                      </h6>
                      <span
                        className="font-monospace fw-semibold"
                        style={{ fontSize: '12px', color: '#64748b' }}
                      >
                        {hex}
                      </span>
                    </div>
                    <div className="d-flex flex-wrap align-items-center gap-1 mb-1">
                      {col.quarterTag && (
                        <span className="badge rounded-pill bg-light text-primary border" style={{ fontSize: '10.5px' }}>
                          {col.quarterTag}
                        </span>
                      )}
                      {col.isTrending && (
                        <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border" style={{ fontSize: '10.5px' }}>
                          ⭐ Trending
                        </span>
                      )}
                      {col.pantoneCode && (
                        <span className="text-muted small" style={{ fontSize: '11px' }}>
                          {col.pantoneCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                    <span
                      style={{
                        color: col.active ? '#16a34a' : '#94a3b8',
                        fontWeight: 600,
                        fontSize: '11.5px'
                      }}
                    >
                      {col.active ? '● Active' : '○ Inactive'}
                    </span>
                    <button
                      className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                      style={{ fontSize: '11px' }}
                      onClick={() => handleToggleStatus(col.id)}
                    >
                      {col.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredColors.length === 0 && (
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted bg-white">
              <i className="ti ti-palette fs-1 d-block mb-2 opacity-50"></i>
              No colors found matching your search. Click "+ Add Color" above.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
