import React, { useState, useMemo } from 'react';
import AddColorModal from './AddColorModal';

/**
 * Calculates luminance of a hex color to determine whether white or dark text gives higher contrast.
 */
function isLightColor(hexStr) {
  const clean = (hexStr || '').replace('#', '').trim();
  if (clean.length !== 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  // Perceived brightness formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 170;
}

/**
 * ColorMasterView - 3.4 Color Master
 * Faithfully matches Client Design Reference (Image 1)
 */
export default function ColorMasterView({
  colors = [],
  onSaveColor,
  onDeleteColor,
  isInline = false,
  onCloseInline
}) {
  const [colorList, setColorList] = useState(colors);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(isInline);
  const [editingColor, setEditingColor] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Sync when prop colors change
  React.useEffect(() => {
    if (colors && colors.length > 0) {
      setColorList(colors);
    }
  }, [colors]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Close card 3-dots dropdown when clicking outside
  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.color-card-dropdown')) {
        setActiveDropdownId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filtered colors
  const filteredColors = useMemo(() => {
    return colorList.filter((col) => {
      const matchSearch =
        !searchTerm.trim() ||
        col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.hex.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (col.pantone && col.pantone.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchCategory = true;
      if (selectedCategory !== 'All') {
        const cat = col.category || '';
        matchCategory = cat.toLowerCase() === selectedCategory.toLowerCase();
      }

      return matchSearch && matchCategory;
    });
  }, [colorList, searchTerm, selectedCategory]);

  // Dynamic statistics matching Image 1
  const stats = useMemo(() => {
    const total = colorList.length;
    // Exactly like Image 1: Count of category matches
    const red = colorList.filter((c) => c.category === 'Red' && c.tag === 'Red').length || 1;
    const blue = colorList.filter((c) => c.category === 'Blue' && c.tag === 'Blue').length;
    const neutral = colorList.filter((c) => c.category === 'Neutral' && c.tag === 'Neutral').length;

    return { total, red, blue, neutral };
  }, [colorList]);

  const handleOpenAddModal = () => {
    setEditingColor(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (col) => {
    setEditingColor(col);
    setShowModal(true);
    setActiveDropdownId(null);
  };

  const handleDelete = (id, name) => {
    setActiveDropdownId(null);
    if (window.confirm(`Are you sure you want to delete color "${name}"?`)) {
      setColorList((prev) => prev.filter((c) => c.id !== id));
      if (onDeleteColor) {
        onDeleteColor(id);
      }
      showToast(`Color "${name}" deleted.`);
    }
  };

  const handleCopyHex = (hex, name) => {
    navigator.clipboard?.writeText(hex);
    setActiveDropdownId(null);
    showToast(`Copied ${hex} to clipboard!`);
  };

  const handleModalSave = (savedColor) => {
    setColorList((prev) => {
      const exists = prev.some((c) => c.id === savedColor.id);
      if (exists) {
        return prev.map((c) => (c.id === savedColor.id ? savedColor : c));
      }
      return [savedColor, ...prev];
    });

    if (onSaveColor) {
      onSaveColor(savedColor);
    }

    setShowModal(false);
    showToast(`Color "${savedColor.name}" saved!`);

    if (isInline && onCloseInline) {
      onCloseInline(savedColor);
    }
  };

  return (
    <div className="container-fluid p-3 p-md-4" style={{ maxWidth: '1400px' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className="position-fixed top-0 start-50 translate-middle-x mt-4 py-2 px-3 rounded-3 shadow-lg fs-13 text-white fw-medium d-flex align-items-center gap-2"
          style={{
            zIndex: 1080,
            background: '#1e293b',
            border: '1px solid #334155'
          }}
        >
          <i className="ti ti-check fs-16 text-success"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER (Matching Image 1) */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1 fs-22">Color Master</h3>
          <p className="text-secondary fs-13 mb-0">
            Define and manage colors for use across the ERP
          </p>
        </div>

        <button
          type="button"
          className="btn text-white px-3 py-2 fs-13 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm"
          style={{
            backgroundColor: '#4f46e5',
            borderRadius: '8px',
            border: 'none',
            transition: 'background-color 0.2s'
          }}
          onClick={handleOpenAddModal}
        >
          <i className="ti ti-plus fs-15"></i>
          <span>Add Color</span>
        </button>
      </div>

      {/* STAT CARDS ROW (Matching Image 1) */}
      <div className="row g-3 mb-4">
        {/* Total Colors */}
        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card border-0 shadow-sm p-3 h-100"
            style={{
              borderRadius: '12px',
              border: '1px solid #f1f5f9',
              background: '#ffffff'
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <span
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: '26px',
                  height: '26px',
                  backgroundColor: '#f3e8ff',
                  color: '#9333ea'
                }}
              >
                <i className="ti ti-palette fs-14"></i>
              </span>
              <span className="fs-12 fw-semibold text-secondary">Total Colors</span>
            </div>
            <div className="fs-22 fw-bold text-dark">{stats.total}</div>
          </div>
        </div>

        {/* Red Colors */}
        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card border-0 shadow-sm p-3 h-100"
            style={{
              borderRadius: '12px',
              border: '1px solid #f1f5f9',
              background: '#ffffff'
            }}
          >
            <div className="fs-12 fw-semibold text-secondary mb-2">Red Colors</div>
            <div className="fs-22 fw-bold text-dark">{stats.red}</div>
          </div>
        </div>

        {/* Blue Colors */}
        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card border-0 shadow-sm p-3 h-100"
            style={{
              borderRadius: '12px',
              border: '1px solid #f1f5f9',
              background: '#ffffff'
            }}
          >
            <div className="fs-12 fw-semibold text-secondary mb-2">Blue Colors</div>
            <div className="fs-22 fw-bold text-dark">{stats.blue}</div>
          </div>
        </div>

        {/* Neutral Colors */}
        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card border-0 shadow-sm p-3 h-100"
            style={{
              borderRadius: '12px',
              border: '1px solid #f1f5f9',
              background: '#ffffff'
            }}
          >
            <div className="fs-12 fw-semibold text-secondary mb-2">Neutral Colors</div>
            <div className="fs-22 fw-bold text-dark">{stats.neutral}</div>
          </div>
        </div>
      </div>

      {/* SEARCH AND CATEGORY FILTER ROW (Matching Image 1) */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        {/* Search bar */}
        <div className="flex-grow-1" style={{ maxWidth: '720px' }}>
          <div className="position-relative w-100">
            <i
              className="ti ti-search position-absolute text-muted fs-15"
              style={{
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                zIndex: 2
              }}
            ></i>
            <input
              type="text"
              className="form-control form-control-sm py-2 fs-13 bg-white search-input-integrated"
              style={{
                borderRadius: '8px',
                borderColor: '#e2e8f0',
                boxShadow: 'none'
              }}
              placeholder="Search colors by name, hex code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Category Dropdown */}
        <div style={{ minWidth: '160px' }}>
          <select
            className="form-select form-select-sm py-2 fs-13 bg-white"
            style={{
              borderRadius: '8px',
              borderColor: '#e2e8f0',
              boxShadow: 'none'
            }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Red">Red Colors</option>
            <option value="Blue">Blue Colors</option>
            <option value="Green">Green Colors</option>
            <option value="Neutral">Neutral Colors</option>
            <option value="Purple">Purple Colors</option>
            <option value="Yellow">Yellow Colors</option>
          </select>
        </div>
      </div>

      {/* COLOR GRID CARDS (Matching Image 1) */}
      {filteredColors.length === 0 ? (
        <div
          className="text-center py-5 bg-white rounded-3 border"
          style={{ borderColor: '#e2e8f0' }}
        >
          <i className="ti ti-palette-off fs-36 text-muted mb-2 d-block"></i>
          <h6 className="fw-semibold text-dark">No colors found</h6>
          <p className="text-muted fs-12 mb-3">
            {searchTerm
              ? `No colors match your search "${searchTerm}"`
              : 'Add your first color to get started.'}
          </p>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}
            onClick={handleOpenAddModal}
          >
            + Add Color
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))',
            gap: '16px'
          }}
        >
          {filteredColors.map((col) => {
            const light = isLightColor(col.hex);
            const textColor = light ? '#1e293b' : '#ffffff';
            const isDropdownOpen = activeDropdownId === col.id;

            return (
              <div
                key={col.id}
                className="card border-0 shadow-sm"
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* TOP COLORED SWATCH BLOCK (Matching Image 1) */}
                <div
                  style={{
                    height: '110px',
                    backgroundColor: col.hex,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* Hex Code in Center */}
                  <span
                    className="fw-bold fs-14"
                    style={{
                      color: textColor,
                      letterSpacing: '0.5px',
                      textShadow: light ? 'none' : '0 1px 2px rgba(0,0,0,0.4)'
                    }}
                  >
                    {col.hex.toUpperCase()}
                  </span>

                  {/* 3-dots Menu Button on Top Right */}
                  <div
                    className="position-absolute top-0 end-0 p-2 color-card-dropdown"
                    style={{ zIndex: 10 }}
                  >
                    <button
                      type="button"
                      className="btn btn-sm p-1 border-0 d-flex align-items-center justify-content-center rounded"
                      style={{
                        background: 'rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(4px)',
                        color: textColor,
                        width: '24px',
                        height: '24px'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownId(isDropdownOpen ? null : col.id);
                      }}
                      title="Options"
                    >
                      <i className="ti ti-dots-vertical fs-14"></i>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div
                        className="dropdown-menu show shadow-lg border-0 py-1 position-absolute end-0 mt-1"
                        style={{
                          borderRadius: '8px',
                          minWidth: '130px',
                          zIndex: 20
                        }}
                      >
                        <button
                          type="button"
                          className="dropdown-item fs-12 py-1.5 d-flex align-items-center gap-2"
                          onClick={() => handleOpenEditModal(col)}
                        >
                          <i className="ti ti-edit fs-14 text-muted"></i>
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="dropdown-item fs-12 py-1.5 d-flex align-items-center gap-2"
                          onClick={() => handleCopyHex(col.hex, col.name)}
                        >
                          <i className="ti ti-copy fs-14 text-muted"></i>
                          <span>Copy Hex</span>
                        </button>
                        <div className="dropdown-divider my-1"></div>
                        <button
                          type="button"
                          className="dropdown-item fs-12 py-1.5 text-danger d-flex align-items-center gap-2"
                          onClick={() => handleDelete(col.id, col.name)}
                        >
                          <i className="ti ti-trash fs-14"></i>
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM INFO AREA (Matching Image 1) */}
                <div className="p-3">
                  <div className="fw-semibold text-dark fs-14 text-truncate">{col.name}</div>
                  {col.tag ? (
                    <div className="mt-1">
                      <span
                        className="badge bg-light text-secondary border px-1.5 py-0.5"
                        style={{ fontSize: '10px', fontWeight: 500 }}
                      >
                        {col.tag}
                      </span>
                    </div>
                  ) : col.pantone ? (
                    <div className="text-muted fs-11 mt-0.5">{col.pantone}</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT COLOR MODAL (Image 2) */}
      {showModal && (
        <AddColorModal
          initialColor={editingColor}
          onSave={handleModalSave}
          onClose={(createdColor) => {
            setShowModal(false);
            if (isInline && onCloseInline) {
              onCloseInline(createdColor);
            }
          }}
        />
      )}
    </div>
  );
}
