import React, { useState } from 'react';
import { api } from '../../services/api';

/**
 * FabricMasterView - 3.2 Fabric Master
 * Supports: Tag-input for widths (chips), GSM, Shrinkage %, HSN Code,
 * View mode by default with section-wise edit, and inline creation.
 */
function WidthTagInput({ tags = [], onChange, isEditing = true, error }) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = React.useRef(null);

  const addTag = (val) => {
    const items = (val || '')
      .split(/[,\s]+/)
      .map((s) => s.trim().replace(/"/g, ''))
      .filter(Boolean);
    if (!items.length) return;
    const newTags = [...tags];
    items.forEach((item) => {
      if (!newTags.includes(item)) {
        newTags.push(item);
      }
    });
    onChange(newTags);
    setInputValue('');
  };

  const removeTag = (idx, e) => {
    e?.stopPropagation();
    onChange(tags.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      e.stopPropagation();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  return (
    <div>
      <div
        className="form-control d-flex flex-wrap align-items-center gap-2"
        style={{
          minHeight: '44px',
          cursor: isEditing ? 'text' : 'default',
          borderRadius: '8px',
          borderColor: isFocused ? '#6366f1' : (error ? '#ef4444' : '#cbd5e1'),
          backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
          boxShadow: isFocused ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none',
          padding: '6px 12px',
          transition: 'all 0.15s ease'
        }}
        onClick={() => {
          if (isEditing) inputRef.current?.focus();
        }}
      >
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="d-inline-flex align-items-center px-2.5 py-1 rounded-pill"
            style={{
              backgroundColor: '#eef2ff',
              border: '1px solid #c7d2fe',
              color: '#4338ca',
              fontSize: '12px',
              fontWeight: 600,
              lineHeight: 1.2
            }}
          >
            <span>{tag}"</span>
            {isEditing && (
              <span
                role="button"
                tabIndex={0}
                className="d-inline-flex align-items-center justify-content-center rounded-circle ms-1.5"
                style={{
                  width: '16px',
                  height: '16px',
                  fontSize: '12px',
                  lineHeight: 1,
                  cursor: 'pointer',
                  backgroundColor: 'rgba(79, 70, 229, 0.12)',
                  color: '#4338ca',
                  transition: 'all 0.15s ease'
                }}
                onClick={(e) => removeTag(idx, e)}
                title={`Remove ${tag}"`}
              >
                &times;
              </span>
            )}
          </span>
        ))}

        {isEditing && (
          <input
            ref={inputRef}
            type="text"
            className="border-0 bg-transparent flex-grow-1 shadow-none text-dark"
            style={{
              minWidth: '160px',
              outline: 'none',
              fontSize: '13.5px',
              padding: '2px 4px'
            }}
            placeholder={tags.length === 0 ? 'Type a value, press Enter' : ''}
            value={inputValue}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        )}
        {!isEditing && tags.length === 0 && (
          <span className="text-muted fs-12 fst-italic">No widths configured</span>
        )}
      </div>
      {error && <div className="text-danger fs-11 mt-1">{error}</div>}
    </div>
  );
}

export default function FabricMasterView({
  fabrics = [],
  onSaveFabric,
  onDeleteFabric,
  isInline = false,
  onCloseInline
}) {
  const [fabricList, setFabricList] = useState(fabrics);
  const [selectedFabric, setSelectedFabric] = useState(null);
  const [isEditing, setIsEditing] = useState(isInline);
  const [isCreatingNew, setIsCreatingNew] = useState(isInline);

  const STANDARD_FABRIC_TYPES = [
    'Greige / Undyed',
    'Cotton',
    'Rayon',
    'Modal',
    'Silk',
    'Georgette',
    'Linen',
    'Polyester',
    'Viscose',
    'Blended'
  ];

  const [isCustomFabricType, setIsCustomFabricType] = useState(false);

  React.useEffect(() => {
    if (fabrics && fabrics.length > 0) {
      setFabricList(fabrics);
    }
  }, [fabrics]);

  // Column Filters
  const [colFilters, setColFilters] = useState({
    id: '',
    name: '',
    type: '',
    gsm: '',
    hsn: '',
    status: ''
  });

  // Form State
  const [formData, setFormData] = useState(() => {
    if (isInline) {
      return {
        id: `FAB-${String(fabrics.length + 1).padStart(4, '0')}`,
        qualityName: '',
        fabricType: '',
        isCustomType: false,
        gsm: '',
        widths: [],
        defaultShrinkage: '',
        hsnCode: '',
        description: '',
        active: true
      };
    }
    return {
      id: '',
      qualityName: '',
      fabricType: '',
      isCustomType: false,
      gsm: '',
      widths: [],
      defaultShrinkage: '',
      hsnCode: '',
      description: '',
      active: true
    };
  });

  const [widthInput, setWidthInput] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const isGreige = Boolean(
    formData.fabricType &&
    (formData.fabricType.toLowerCase().includes('greige') ||
     formData.fabricType.toLowerCase().includes('grey') ||
     formData.fabricType.toLowerCase().includes('undyed'))
  );

  const handleOpenNew = () => {
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      id: `FAB-${nextNum}`,
      qualityName: '',
      fabricType: '',
      isCustomType: false,
      gsm: '',
      widths: [],
      defaultShrinkage: '',
      hsnCode: '',
      description: '',
      active: true
    });
    setWidthInput('');
    setFormErrors({});
    setIsCustomFabricType(false);
    setIsCreatingNew(true);
    setIsEditing(true);
    setSelectedFabric(null);
  };

  const handleCloseModal = () => {
    setSelectedFabric(null);
    setIsCreatingNew(false);
    setIsEditing(false);
    setIsCustomFabricType(false);
    setWidthInput('');
    setFormErrors({});
    if (isInline && onCloseInline) onCloseInline(null);
  };

  const handleDeleteFabric = (id, name, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete fabric "${name || id}"?`)) return;
    const updated = fabricList.filter((f) => f.id !== id);
    setFabricList(updated);
    if (selectedFabric?.id === id) {
      handleCloseModal();
    }
    try {
      localStorage.setItem('raindrop_fabrics_v1', JSON.stringify(updated));
      window.dispatchEvent(new Event('raindrop_fabrics_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {}
    if (api && api.deleteFabric) {
      try {
        api.deleteFabric(id);
      } catch (err) {}
    }
    if (onDeleteFabric) {
      onDeleteFabric(id);
    }
  };

  const handleSelectFabric = (f) => {
    if (!f) return;
    setSelectedFabric(f);
    const parsedWidths = Array.isArray(f.widths)
      ? [...f.widths]
      : typeof f.widths === 'string'
      ? JSON.parse(f.widths || '["44"]')
      : ['44', '58'];

    const fType = f.fabricType || f.fabric_type || '';
    const isCustom = f.isCustomType !== undefined
      ? Boolean(f.isCustomType)
      : Boolean(fType && !STANDARD_FABRIC_TYPES.includes(fType));
    setIsCustomFabricType(isCustom);

    setFormData({
      ...f,
      qualityName: f.qualityName || f.quality_name || '',
      fabricType: fType,
      isCustomType: isCustom,
      widths: parsedWidths,
      hsnCode: f.hsnCode || f.hsn_code || '520811'
    });
    setFormErrors({});
    setIsCreatingNew(false);
    setIsEditing(false);
  };

  const addCurrentWidth = (valToUse) => {
    const raw = (valToUse !== undefined ? valToUse : widthInput);
    if (!raw && raw !== 0) return;
    const items = String(raw)
      .split(/[,\s]+/)
      .map((s) => s.trim().replace(/"/g, ''))
      .filter(Boolean);
    if (!items.length) return;
    setFormData((prev) => {
      const existing = prev.widths || [];
      const toAdd = items.filter((it) => !existing.includes(it));
      if (!toAdd.length) return prev;
      return {
        ...prev,
        widths: [...existing, ...toAdd]
      };
    });
    setWidthInput('');
    if (formErrors.widths) setFormErrors((prev) => ({ ...prev, widths: null }));
  };

  // Add width tag
  const handleAddWidthTag = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.type === 'click') {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      addCurrentWidth();
    }
  };

  // Remove width tag
  const handleRemoveWidthTag = (widthToRemove) => {
    if (formData.widths.length <= 1) {
      alert('A Fabric must contain at least one width tag.');
      return;
    }
    setFormData({
      ...formData,
      widths: formData.widths.filter((w) => w !== widthToRemove)
    });
  };

  const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const validate = () => {
    const errors = {};
    if (!formData.qualityName.trim()) errors.qualityName = 'Fabric Quality Name is mandatory';
    if (!formData.fabricType || !formData.fabricType.trim()) errors.fabricType = 'Fabric Type is mandatory';
    if (!formData.widths || formData.widths.length === 0)
      errors.widths = 'At least one width must be added';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();

    let currentWidths = [...(formData.widths || [])];
    if (widthInput && widthInput.trim()) {
      const trimmed = widthInput.trim().replace(/"/g, '');
      if (trimmed && !currentWidths.includes(trimmed)) {
        currentWidths.push(trimmed);
        setFormData(prev => ({ ...prev, widths: currentWidths }));
        setWidthInput('');
      }
    }

    if (!formData.qualityName || !formData.qualityName.trim()) {
      setFormErrors(prev => ({ ...prev, qualityName: 'Fabric Quality Name is mandatory' }));
      return;
    }
    if (!formData.fabricType || !formData.fabricType.trim()) {
      setFormErrors(prev => ({ ...prev, fabricType: 'Fabric Type is mandatory' }));
      return;
    }
    if (currentWidths.length === 0) {
      setFormErrors(prev => ({ ...prev, widths: 'At least one width must be added' }));
      return;
    }

    const capitalizedQName = capitalizeWords((formData.qualityName || '').trim());
    const finalFabricType = (formData.fabricType || '').trim();
    const updatedFabric = {
      ...formData,
      id: formData.id || `FAB-${Date.now()}`,
      quality: capitalizedQName,
      qualityName: capitalizedQName,
      name: capitalizedQName,
      fabricType: finalFabricType,
      isCustomType: Boolean(isCustomFabricType),
      widths: currentWidths,
      gsm: Number(formData.gsm) || null,
      defaultShrinkage: (formData.defaultShrinkage !== '' && formData.defaultShrinkage !== null && formData.defaultShrinkage !== undefined) ? Number(formData.defaultShrinkage) : 0,
      shrinkage: (formData.defaultShrinkage !== '' && formData.defaultShrinkage !== null && formData.defaultShrinkage !== undefined) ? Number(formData.defaultShrinkage) : 0,
      active: formData.active !== false
    };

    let updatedList;
    if (isCreatingNew) {
      updatedList = [updatedFabric, ...fabricList];
    } else {
      updatedList = fabricList.map((f) => (f.id === updatedFabric.id ? updatedFabric : f));
    }

    setFabricList(updatedList);
    setSelectedFabric(null);
    setIsEditing(false);
    setIsCreatingNew(false);

    try {
      localStorage.setItem('raindrop_fabrics_v1', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('raindrop_fabrics_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {}

    if (api && api.saveFabric) {
      try {
        api.saveFabric(updatedFabric);
      } catch (err) {}
    }

    if (onSaveFabric) {
      onSaveFabric(updatedFabric);
    }

    if (isInline && onCloseInline) {
      onCloseInline(updatedFabric);
    }
  };

  // Filtered
  const filteredFabrics = (fabricList || []).filter((f) => {
    if (!f) return false;
    const fId = String(f.id || '').toLowerCase();
    const fName = String(f.qualityName || f.quality_name || '').toLowerCase();
    const fType = String(f.fabricType || f.fabric_type || '');
    const fGsm = String(f.gsm || '');
    const fHsn = String(f.hsnCode || f.hsn_code || '');
    const fStatus = f.active ? 'Active' : 'Inactive';

    return (
      fId.includes((colFilters.id || '').toLowerCase()) &&
      fName.includes((colFilters.name || '').toLowerCase()) &&
      (colFilters.type === '' || fType === colFilters.type) &&
      (colFilters.gsm === '' || fGsm.includes(colFilters.gsm)) &&
      (colFilters.hsn === '' || fHsn.includes(colFilters.hsn)) &&
      (colFilters.status === '' || fStatus === colFilters.status)
    );
  });

  // Modal / Inline Container (Matches Create New Fabric layout)
  if (isInline) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1060 }}>
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '580px' }}>
          <div className="modal-content shadow-lg border-0 rounded-4 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <h5 className="fw-bold text-dark mb-0 fs-18">
                {isCreatingNew ? 'Create New Fabric' : formData.qualityName || 'Fabric Details'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => onCloseInline && onCloseInline(null)}
              ></button>
            </div>

            <form onSubmit={handleSave}>
              {/* 1. Quality & Fabric Type */}
              <div className="mb-3 p-3 bg-light rounded-3">
                <div className="mb-2">
                  <label className="form-label fs-12 fw-semibold mb-1">Quality Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suh Cotton / Rayon 14kg"
                    className={`form-control form-control-sm bg-white ${formErrors.qualityName ? 'is-invalid' : ''}`}
                    value={formData.qualityName}
                    onChange={(e) => {
                      setFormData({ ...formData, qualityName: capitalizeWords(e.target.value) });
                      if (formErrors.qualityName) setFormErrors((prev) => ({ ...prev, qualityName: null }));
                    }}
                  />
                  <div className="form-text small text-muted">Auto-capitalised word by word</div>
                  {formErrors.qualityName && <div className="invalid-feedback fs-11">{formErrors.qualityName}</div>}
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label fs-12 fw-semibold mb-1">Fabric Type *</label>
                    {isCustomFabricType ? (
                      <div className="input-group input-group-sm">
                        <input
                          type="text"
                          className={`form-control form-control-sm bg-white ${formErrors.fabricType ? 'is-invalid' : ''}`}
                          placeholder="Type custom fabric type..."
                          autoFocus
                          value={formData.fabricType || ''}
                          onChange={(e) => {
                            const newType = e.target.value;
                            setFormData({
                              ...formData,
                              fabricType: newType,
                              isCustomType: true
                            });
                            if (formErrors.fabricType) setFormErrors((prev) => ({ ...prev, fabricType: null }));
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setIsCustomFabricType(false);
                            setFormData({ ...formData, fabricType: '', isCustomType: false });
                          }}
                          title="Switch back to dropdown list"
                        >
                          <i className="ti ti-chevron-down"></i>
                        </button>
                      </div>
                    ) : (
                      <select
                        className={`form-select form-select-sm bg-white ${formErrors.fabricType ? 'is-invalid' : ''}`}
                        value={formData.fabricType}
                        onChange={(e) => {
                          const newType = e.target.value;
                          if (newType === 'Other') {
                            setIsCustomFabricType(true);
                            setFormData({
                              ...formData,
                              fabricType: '',
                              isCustomType: true
                            });
                            return;
                          }
                          setIsCustomFabricType(false);
                          setFormData({
                            ...formData,
                            fabricType: newType,
                            isCustomType: false
                          });
                          if (formErrors.fabricType) setFormErrors((prev) => ({ ...prev, fabricType: null }));
                        }}
                      >
                        <option value="">Select fabric type...</option>
                        <option value="Greige / Undyed">Greige / Undyed (Grey Fabric)</option>
                        <option value="Cotton">Cotton</option>
                        {formData.fabricType === 'Cotton (Processed)' && (
                          <option value="Cotton (Processed)">Cotton (Processed)</option>
                        )}
                        <option value="Rayon">Rayon</option>
                        <option value="Modal">Modal</option>
                        <option value="Silk">Silk</option>
                        <option value="Georgette">Georgette</option>
                        <option value="Linen">Linen</option>
                        <option value="Polyester">Polyester</option>
                        <option value="Viscose">Viscose</option>
                        <option value="Blended">Blended</option>
                        <option value="Other">Other (Custom type...)</option>
                      </select>
                    )}
                    {formErrors.fabricType && <div className="invalid-feedback fs-11">{formErrors.fabricType}</div>}
                  </div>

                  <div className="col-6">
                    <label className="form-label fs-12 fw-semibold mb-1">GSM (Grams/Sq Meter)</label>
                    <input
                      type="number"
                      placeholder="e.g. 140"
                      className="form-control form-control-sm bg-white no-spinner"
                      value={formData.gsm || ''}
                      onChange={(e) => setFormData({ ...formData, gsm: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Width Tag Input */}
              <div className="mb-3 p-3 bg-light rounded-3">
                <label className="form-label fs-12 fw-semibold mb-1 text-dark">
                  Available Widths (inches, e.g. 42", 44", 48") <span className="text-danger">*</span>
                </label>
                <WidthTagInput
                  tags={formData.widths || []}
                  onChange={(newWidths) => {
                    setFormData({ ...formData, widths: newWidths });
                    if (formErrors.widths) setFormErrors((prev) => ({ ...prev, widths: null }));
                  }}
                  isEditing={true}
                  error={formErrors.widths}
                />
              </div>

              {/* 3. Shrinkage & HSN */}
              <div className="mb-3 p-3 bg-light rounded-3">
                <div className="row g-2">
                  <div className="col-6">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <label className="form-label fs-12 fw-semibold mb-0">Default Shrinkage %</label>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-10 px-1.5 py-0.5">Allowance</span>
                    </div>
                    <div className="input-group input-group-sm">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="30"
                        placeholder="e.g. 3.5"
                        className="form-control form-control-sm bg-white no-spinner"
                        value={formData.defaultShrinkage || ''}
                        onChange={(e) => setFormData({ ...formData, defaultShrinkage: e.target.value })}
                      />
                      <span className="input-group-text bg-light text-muted fs-12">%</span>
                    </div>
                    <div className="form-text fs-11 mt-1 text-muted">
                      <i className="ti ti-info-circle me-1"></i>Shrinkage percentage allowance for fabric processing.
                    </div>
                  </div>

                  <div className="col-6">
                    <label className="form-label fs-12 fw-semibold mb-1">HSN Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 520811"
                      className="form-control form-control-sm bg-white font-monospace"
                      value={formData.hsnCode}
                      onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    />
                  </div>

                  <div className="col-12 mt-2">
                    <label className="form-label fs-12 fw-semibold mb-1">Description / Notes</label>
                    <textarea
                      rows="2"
                      className="form-control form-control-sm bg-white fs-12"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="col-12 mt-2">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="fabricActiveInline"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      />
                      <label className="form-check-label fs-12 fw-semibold" htmlFor="fabricActiveInline">
                        Active Quality (Selectable on new POs)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex align-items-center justify-content-end gap-2 pt-1">
                <button
                  type="button"
                  className="btn btn-light btn-sm px-3"
                  onClick={() => onCloseInline && onCloseInline(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn text-white btn-sm px-4 fw-medium shadow-sm"
                  style={{ backgroundColor: '#2e37a4', borderColor: '#2e37a4' }}
                >
                  Save Fabric
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      {!isInline && (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-1 text-muted fs-12">
                <li className="breadcrumb-item">Masters</li>
                <li className="breadcrumb-item active text-primary fw-medium">Fabric Master</li>
              </ol>
            </nav>
            <h2 className="fw-bold text-dark mb-1 fs-24">Fabric Master (3.2)</h2>
            <p className="text-secondary mb-0 fs-13">
              Quality Definitions, Width Tags &amp; Processing Shrinkage Standards
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium shadow-sm rounded-3"
            onClick={handleOpenNew}
          >
            <i className="ti ti-plus fs-16"></i>
            <span>New Fabric Quality</span>
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="row g-4">
        {/* Table Column */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bold text-dark mb-0 fs-16">Fabric Quality Catalog</h5>
                <span className="badge bg-light text-secondary border px-2 py-1 fs-12">
                  {filteredFabrics.length} of {fabricList.length} Qualities
                </span>
              </div>
            </div>

            {/* Clean Top Search & Filter Bar */}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3 pb-2 border-bottom">
              <div className="position-relative flex-grow-1" style={{ minWidth: '180px' }}>
                <i
                  className="ti ti-search position-absolute text-muted fs-14"
                  style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                ></i>
                <input
                  type="text"
                  placeholder="Search by ID, Quality Name, or GSM..."
                  className="form-control form-control-sm bg-light fs-12 search-input-integrated"
                  style={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', paddingLeft: '40px' }}
                  value={colFilters.name}
                  onChange={(e) => setColFilters({ ...colFilters, name: e.target.value })}
                />
              </div>

              <select
                className="form-select form-select-sm bg-light fs-12"
                style={{ width: '160px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                value={colFilters.type}
                onChange={(e) => setColFilters({ ...colFilters, type: e.target.value })}
              >
                <option value="">All Fabric Types</option>
                <option value="Greige / Undyed">Greige / Undyed</option>
                <option value="Cotton">Cotton</option>
                <option value="Rayon">Rayon</option>
                <option value="Modal">Modal</option>
                <option value="Silk">Silk</option>
                <option value="Georgette">Georgette</option>
                <option value="Linen">Linen</option>
                <option value="Polyester">Polyester</option>
                <option value="Viscose">Viscose</option>
                <option value="Blended">Blended</option>
              </select>

              <select
                className="form-select form-select-sm bg-light fs-12"
                style={{ width: '120px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                value={colFilters.status}
                onChange={(e) => setColFilters({ ...colFilters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              {(colFilters.name || colFilters.type || colFilters.status) && (
                <button
                  type="button"
                  className="btn btn-light btn-sm text-secondary px-2.5 py-1 fs-12 d-flex align-items-center gap-1 border"
                  style={{ borderRadius: '8px' }}
                  onClick={() => setColFilters({ id: '', name: '', type: '', gsm: '', hsn: '', status: '' })}
                  title="Clear all filters"
                >
                  <i className="ti ti-x fs-13"></i>
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="table table-hover align-middle mb-0 fs-13" style={{ width: '100%' }}>
                <thead className="table-light text-secondary">
                  <tr style={{ fontSize: '11.5px', fontWeight: '600', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                    <th style={{ width: '32%' }}>QUALITY NAME</th>
                    <th style={{ width: '20%' }}>FABRIC TYPE</th>
                    <th style={{ width: '13%' }}>GSM</th>
                    <th style={{ width: '15%' }}>WIDTHS</th>
                    <th style={{ width: '10%' }} className="text-center">STATUS</th>
                    <th style={{ width: '10%' }} className="text-end">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFabrics.map((f) => {
                    const isSelected = selectedFabric?.id === f.id;
                    return (
                      <tr
                        key={f.id}
                        className={`cursor-pointer ${isSelected ? 'table-primary fw-semibold' : ''}`}
                        onClick={() => handleSelectFabric(f)}
                      >
                        <td className={`fw-medium ${isSelected ? 'text-white' : 'text-dark'}`}>
                          {f.qualityName || f.quality_name || '-'}
                        </td>
                        <td>
                          <span className={`badge border ${isSelected ? 'bg-white text-primary' : 'bg-light text-secondary'}`}>
                            {f.fabricType || f.fabric_type || '-'}
                          </span>
                        </td>
                        <td className={isSelected ? 'text-white' : ''}>{f.gsm ? `${f.gsm} gsm` : '-'}</td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {(f.widths || []).map((w) => (
                              <span key={w} className="badge bg-primary-subtle text-primary border fs-11">
                                {w}"
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge px-2 py-1 ${
                              f.active
                                ? 'bg-success-subtle text-success'
                                : 'bg-secondary-subtle text-secondary'
                            }`}
                          >
                            {f.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn btn-sm btn-light text-primary p-1.5 rounded-2 me-1"
                            title="Edit Fabric"
                            onClick={() => {
                              handleSelectFabric(f);
                              setIsEditing(true);
                            }}
                          >
                            <i className="ti ti-edit fs-5"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-light text-danger p-1.5 rounded-2"
                            title="Delete Fabric"
                            onClick={(e) => handleDeleteFabric(f.id, f.qualityName || f.name || f.id, e)}
                          >
                            <i className="ti ti-trash fs-5"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredFabrics.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No fabric qualities found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* POPUP MODAL: View / Edit / Create Fabric Dialog */}
        {(selectedFabric || isCreatingNew) && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg rounded-4 p-4 bg-white">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary-subtle text-primary p-2 rounded-3">
                      <i className="ti ti-palette fs-5"></i>
                    </span>
                    <div>
                      <h5 className="fw-bold text-dark mb-0 fs-18">
                        {isCreatingNew ? 'Create New Fabric' : formData.qualityName || 'Fabric Details'}
                      </h5>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {!isCreatingNew && (
                      !isEditing ? (
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm px-3 d-flex align-items-center gap-1.5 rounded-3 fw-semibold shadow-sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <i className="ti ti-edit fs-14"></i>
                          <span>Edit Fabric</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-light border text-secondary btn-sm px-3 d-flex align-items-center gap-1.5 rounded-3 fw-semibold"
                          onClick={() => setIsEditing(false)}
                        >
                          <i className="ti ti-eye fs-14"></i>
                          <span>View Mode</span>
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      className="btn-close ms-2"
                      onClick={handleCloseModal}
                    ></button>
                  </div>
                </div>

                <form onSubmit={handleSave}>
                  <div style={{ maxHeight: 'calc(80vh - 140px)', overflowY: 'auto', paddingRight: '4px' }}>
                    {/* 1. Quality & Fabric Type */}
                    <div className="mb-3 p-3 bg-light rounded-3">
                      <div className="mb-2">
                        <label className="form-label fs-12 fw-semibold mb-1">Quality Name *</label>
                        <input
                          type="text"
                          required
                          disabled={!isEditing}
                          placeholder="e.g. Suh Cotton / Rayon 14kg"
                          className={`form-control form-control-sm ${
                            formErrors.qualityName ? 'is-invalid' : ''
                          }`}
                          style={{ backgroundColor: isEditing ? '#ffffff' : '#f8fafc' }}
                          value={formData.qualityName}
                          onChange={(e) =>
                            setFormData({ ...formData, qualityName: capitalizeWords(e.target.value) })
                          }
                        />
                        <div className="form-text small text-muted">Auto-capitalised word by word</div>
                        {formErrors.qualityName && (
                          <div className="invalid-feedback fs-11">{formErrors.qualityName}</div>
                        )}
                      </div>

                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label fs-12 fw-semibold mb-1">Fabric Type *</label>
                          {isCustomFabricType ? (
                            <div className="input-group input-group-sm">
                              <input
                                type="text"
                                disabled={!isEditing}
                                className={`form-control form-control-sm ${formErrors.fabricType ? 'is-invalid' : ''}`}
                                style={{ backgroundColor: isEditing ? '#ffffff' : '#f8fafc' }}
                                placeholder="Type custom fabric type..."
                                autoFocus={isEditing}
                                value={formData.fabricType || ''}
                                onChange={(e) => {
                                  const newType = e.target.value;
                                  setFormData({
                                    ...formData,
                                    fabricType: newType,
                                    isCustomType: true
                                  });
                                  if (formErrors.fabricType) setFormErrors((prev) => ({ ...prev, fabricType: null }));
                                }}
                              />
                              {isEditing && (
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary"
                                  onClick={() => {
                                    setIsCustomFabricType(false);
                                    setFormData({ ...formData, fabricType: '', isCustomType: false });
                                  }}
                                  title="Switch back to dropdown list"
                                >
                                  <i className="ti ti-chevron-down"></i>
                                </button>
                              )}
                            </div>
                          ) : (
                            <select
                              className={`form-select form-select-sm ${
                                formErrors.fabricType ? 'is-invalid' : ''
                              }`}
                              disabled={!isEditing}
                              style={{ backgroundColor: isEditing ? '#ffffff' : '#f8fafc' }}
                              value={formData.fabricType}
                              onChange={(e) => {
                                const newType = e.target.value;
                                if (newType === 'Other') {
                                  setIsCustomFabricType(true);
                                  setFormData({
                                    ...formData,
                                    fabricType: '',
                                    isCustomType: true
                                  });
                                  return;
                                }
                                setIsCustomFabricType(false);
                                setFormData({
                                  ...formData,
                                  fabricType: newType,
                                  isCustomType: false
                                });
                                if (formErrors.fabricType) {
                                  setFormErrors((prev) => ({ ...prev, fabricType: null }));
                                }
                              }}
                            >
                              <option value="">Select fabric type...</option>
                              <option value="Greige / Undyed">Greige / Undyed (Grey Fabric)</option>
                              <option value="Cotton">Cotton</option>
                              {formData.fabricType === 'Cotton (Processed)' && (
                                <option value="Cotton (Processed)">Cotton (Processed)</option>
                              )}
                              <option value="Rayon">Rayon</option>
                              <option value="Modal">Modal</option>
                              <option value="Silk">Silk</option>
                              <option value="Georgette">Georgette</option>
                              <option value="Linen">Linen</option>
                              <option value="Polyester">Polyester</option>
                              <option value="Viscose">Viscose</option>
                              <option value="Blended">Blended</option>
                              <option value="Other">Other (Custom type...)</option>
                            </select>
                          )}
                          {formErrors.fabricType && (
                            <div className="invalid-feedback fs-11">{formErrors.fabricType}</div>
                          )}
                        </div>

                        <div className="col-6">
                          <label className="form-label fs-12 fw-semibold mb-1">GSM (Grams/Sq Meter)</label>
                          <input
                            type="number"
                            disabled={!isEditing}
                            placeholder="e.g. 140"
                            className="form-control form-control-sm no-spinner"
                            style={{ backgroundColor: isEditing ? '#ffffff' : '#f8fafc' }}
                            value={formData.gsm || ''}
                            onChange={(e) => setFormData({ ...formData, gsm: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Width Tag Input */}
                    <div className="mb-3 p-3 bg-light rounded-3">
                      <label className="form-label fs-12 fw-semibold mb-1 text-dark">
                        Available Widths (inches, e.g. 42", 44", 48") <span className="text-danger">*</span>
                      </label>
                      <WidthTagInput
                        tags={formData.widths || []}
                        onChange={(newWidths) => {
                          setFormData({ ...formData, widths: newWidths });
                          if (formErrors.widths) setFormErrors((prev) => ({ ...prev, widths: null }));
                        }}
                        isEditing={isEditing}
                        error={formErrors.widths}
                      />
                    </div>

                    {/* 3. Shrinkage & HSN */}
                    <div className="mb-3 p-3 bg-light rounded-3">
                      <div className="row g-2">
                        <div className="col-6">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <label className="form-label fs-12 fw-semibold mb-0">Default Shrinkage %</label>
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-10 px-1.5 py-0.5">Allowance</span>
                          </div>
                          <div className="input-group input-group-sm">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="30"
                              disabled={!isEditing}
                              placeholder="e.g. 3.5"
                              className="form-control form-control-sm no-spinner"
                              style={{ backgroundColor: isEditing ? '#ffffff' : '#f8fafc' }}
                              value={formData.defaultShrinkage || ''}
                              onChange={(e) =>
                                setFormData({ ...formData, defaultShrinkage: e.target.value })
                              }
                            />
                            <span className="input-group-text bg-light text-muted fs-12">%</span>
                          </div>
                          <div className="form-text fs-11 mt-1 text-muted">
                            <i className="ti ti-info-circle me-1"></i>Shrinkage percentage allowance for fabric processing.
                          </div>
                        </div>

                        <div className="col-6">
                          <label className="form-label fs-12 fw-semibold mb-1">HSN Code</label>
                          <input
                            type="text"
                            disabled={!isEditing}
                            placeholder="e.g. 520811"
                            className="form-control form-control-sm font-monospace"
                            style={{ backgroundColor: isEditing ? '#ffffff' : '#f8fafc' }}
                            value={formData.hsnCode}
                            onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                          />
                        </div>

                        <div className="col-12 mt-2">
                          <label className="form-label fs-12 fw-semibold mb-1">Description / Notes</label>
                          <textarea
                            rows="2"
                            disabled={!isEditing}
                            placeholder="Add any additional notes or specifications..."
                            className="form-control form-control-sm fs-12"
                            style={{ backgroundColor: isEditing ? '#ffffff' : '#f8fafc' }}
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          ></textarea>
                        </div>

                        <div className="col-12 mt-2">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="fabricActive"
                              disabled={!isEditing}
                              checked={formData.active}
                              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            />
                            <label className="form-check-label fs-12 fw-semibold" htmlFor="fabricActive">
                              Active Quality (Selectable on new POs)
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer Controls */}
                  <div className="d-flex align-items-center justify-content-end gap-2 pt-3 border-top mt-3">
                    {!isEditing ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-light px-4 rounded-3"
                          onClick={handleCloseModal}
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary px-4 fw-semibold rounded-3 shadow-sm d-flex align-items-center gap-1.5"
                          onClick={() => setIsEditing(true)}
                        >
                          <i className="ti ti-edit"></i>
                          <span>Edit Fabric</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-light px-4 rounded-3"
                          onClick={handleCloseModal}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary px-4 fw-semibold rounded-3 shadow-sm">
                          <i className="ti ti-check me-1"></i> Save Fabric
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
