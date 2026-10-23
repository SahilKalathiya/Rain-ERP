import React, { useState, useMemo, useEffect } from 'react';
import { initialColors, getStoredData, setStoredData, getStoredColorsMaster, setStoredColorsMaster } from '../../data/salesOrderData';
import AddColorModal from '../Procurement/AddColorModal';

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
  const [colors, setColors] = useState(() => getStoredColorsMaster());

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isEditing, setIsEditing] = useState(isInline);
  const [isCreatingNew, setIsCreatingNew] = useState(isInline);
  const [isModalEditMode, setIsModalEditMode] = useState(isInline);
  const [toastMessage, setToastMessage] = useState('');

  const [editingColor, setEditingColor] = useState(null);
  const [quarterFilter, setQuarterFilter] = useState('All');

  useEffect(() => {
    const handleUpdate = () => {
      setColors(getStoredColorsMaster());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('raindrop_colors_updated', handleUpdate);
    window.addEventListener('erp_colors_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('raindrop_colors_updated', handleUpdate);
      window.removeEventListener('erp_colors_updated', handleUpdate);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleAddNew = () => {
    const nextNum = colors.length + 1;
    setEditingColor({
      id: `COL-${String(nextNum).padStart(3, '0')}`,
      name: '',
      hex: '#000000',
      pantone: '',
      quarterTag: 'All Season',
      isTrending: false,
      active: true
    });
    setIsCreatingNew(true);
    setIsModalEditMode(true);
    setIsEditing(true);
  };

  const handleEdit = (color, forceEdit = false) => {
    setEditingColor({
      id: color.id,
      name: color.name || '',
      hex: color.hexCode || color.hex || '#000000',
      pantone: color.pantoneCode || color.pantone || '',
      category: color.category || '',
      quarterTag: color.quarterTag || 'Q1',
      isTrending: Boolean(color.isTrending),
      active: color.active !== false
    });
    setIsCreatingNew(false);
    setIsModalEditMode(forceEdit);
    setIsEditing(true);
  };

  const handleDelete = (colorId) => {
    if (!window.confirm('Are you sure you want to delete this color?')) return;
    const updated = colors.filter((c) => c.id !== colorId);
    setColors(updated);
    setStoredColorsMaster(updated);
    showToast('Color deleted successfully');
  };

  const handleToggleStatus = (colorId) => {
    const updated = colors.map((c) => (c.id === colorId ? { ...c, active: !c.active } : c));
    setColors(updated);
    setStoredColorsMaster(updated);
    showToast('Status updated');
  };

  const handleModalSave = (savedColor) => {
    if (!savedColor) return;
    const cleanHex = (savedColor.hex || savedColor.hexCode || '#000000').toUpperCase().trim();
    const capitalizedName = (savedColor.name || '').replace(/\b\w/g, (c) => c.toUpperCase());
    const nextNum = colors.length + 1;
    const colorObj = {
      ...savedColor,
      id: editingColor?.id || savedColor.id || `COL-${String(nextNum).padStart(3, '0')}`,
      name: capitalizedName,
      hex: cleanHex,
      hexCode: cleanHex,
      pantone: (savedColor.pantone || savedColor.pantoneCode || '').trim(),
      pantoneCode: (savedColor.pantone || savedColor.pantoneCode || '').trim(),
      quarterTag: savedColor.quarterTag || 'Q1',
      isTrending: Boolean(savedColor.isTrending),
      active: editingColor?.active !== undefined ? editingColor.active : (savedColor.active !== false),
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
    setStoredColorsMaster(updatedList);

    if (isInline && onSaveInline) {
      onSaveInline(colorObj);
      return;
    }

    setIsEditing(false);
    setEditingColor(null);
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
        (quarterFilter === 'All Season' && (c.quarterTag === 'All Season' || c.quarterTag === 'ALL')) ||
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
            style={{ borderColor: '#cbd5e1', fontSize: '13px', height: '38px', width: '160px' }}
          >
            <option value="All">All Quarters & Seasons</option>
            <option value="All Season">✨ All Season</option>
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

      {/* Add / Edit Form Modal (Matching Image 2: AddColorModal) */}
      {isEditing && (
        <AddColorModal
          initialColor={isCreatingNew ? null : editingColor}
          colors={colors}
          isModalEditMode={isModalEditMode}
          onToggleEditMode={setIsModalEditMode}
          onSave={handleModalSave}
          onClose={() => {
            setIsEditing(false);
            setEditingColor(null);
            setIsCreatingNew(false);
            if (isInline && onCloseInline) onCloseInline();
          }}
        />
      )}

      {/* Colors Grid — Attractive Card Layout (Section 3.2) */}
      <div className="row g-3">
        {filteredColors.map((col) => {
          const hex = col.hexCode || col.hex || '#333333';
          const lightText = !isLightColor(hex);

          return (
            <div key={col.id} className="col-sm-6 col-md-4 col-lg-3">
              <div
                className="card border-0 shadow-xs h-100 overflow-hidden transition-all hover-elevate"
                style={{
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  cursor: 'pointer'
                }}
                onClick={() => handleEdit(col, false)}
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
                    justifyContent: 'flex-end'
                  }}
                >
                  {/* Actions (Edit / Delete) */}
                  <div className="d-flex align-items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-sm p-1 rounded-2 shadow-xs"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        color: '#0f172a',
                        width: '28px',
                        height: '28px'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(col, true);
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(col.id);
                      }}
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
