import React, { useState } from 'react';

/**
 * FabricMasterView - 3.2 Fabric Master
 * Supports: Tag-input for widths (chips), GSM, Shrinkage %, HSN Code,
 * View mode by default with section-wise edit, and inline creation.
 */
export default function FabricMasterView({
  fabrics = [],
  onSaveFabric,
  isInline = false,
  onCloseInline
}) {
  const [fabricList, setFabricList] = useState(fabrics);
  const [selectedFabric, setSelectedFabric] = useState(null);
  const [isEditing, setIsEditing] = useState(isInline);
  const [isCreatingNew, setIsCreatingNew] = useState(isInline);

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
        fabricType: 'Cotton',
        gsm: '',
        widths: ['44', '58'],
        defaultShrinkage: 3.0,
        hsnCode: '',
        description: '',
        active: true
      };
    }
    return {
      id: '',
      qualityName: '',
      fabricType: 'Cotton',
      gsm: '',
      widths: ['44', '58'],
      defaultShrinkage: 3.5,
      hsnCode: '520811',
      description: '',
      active: true
    };
  });

  const [widthInput, setWidthInput] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const handleOpenNew = () => {
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      id: `FAB-${nextNum}`,
      qualityName: '',
      fabricType: 'Cotton',
      gsm: '',
      widths: ['44', '58'],
      defaultShrinkage: 3.0,
      hsnCode: '520811',
      description: '',
      active: true
    });
    setWidthInput('');
    setFormErrors({});
    setIsCreatingNew(true);
    setIsEditing(true);
    setSelectedFabric(null);
  };

  const handleSelectFabric = (f) => {
    if (!f) return;
    setSelectedFabric(f);
    const parsedWidths = Array.isArray(f.widths)
      ? [...f.widths]
      : typeof f.widths === 'string'
      ? JSON.parse(f.widths || '["44"]')
      : ['44', '58'];

    setFormData({
      ...f,
      qualityName: f.qualityName || f.quality_name || '',
      fabricType: f.fabricType || f.fabric_type || 'Cotton',
      widths: parsedWidths,
      hsnCode: f.hsnCode || f.hsn_code || '520811'
    });
    setIsCreatingNew(false);
    setIsEditing(false);
  };

  // Add width tag
  const handleAddWidthTag = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      const trimmed = widthInput.trim().replace(/"/g, '');
      if (trimmed && !formData.widths.includes(trimmed)) {
        setFormData((prev) => ({
          ...prev,
          widths: [...prev.widths, trimmed]
        }));
        setWidthInput('');
      }
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
    if (!formData.widths || formData.widths.length === 0)
      errors.widths = 'At least one width must be added';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const updatedFabric = {
      ...formData,
      gsm: Number(formData.gsm) || null,
      defaultShrinkage: Number(formData.defaultShrinkage) || 0
    };

    let updatedList;
    if (isCreatingNew) {
      updatedList = [updatedFabric, ...fabricList];
    } else {
      updatedList = fabricList.map((f) => (f.id === updatedFabric.id ? updatedFabric : f));
    }

    setFabricList(updatedList);
    setSelectedFabric(updatedFabric);
    setIsEditing(false);
    setIsCreatingNew(false);

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
        <div className={selectedFabric || isCreatingNew ? 'col-12 col-xl-7' : 'col-12'}>
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bold text-dark mb-0 fs-16">Fabric Quality Catalog</h5>
                <span className="badge bg-light text-secondary border px-2 py-1 fs-12">
                  {filteredFabrics.length} of {fabricList.length} Qualities
                </span>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm d-flex align-items-center gap-1 px-3 py-1 fw-semibold rounded-3 shadow-sm"
                onClick={handleOpenNew}
              >
                <i className="ti ti-plus fs-14"></i>
                <span>New Fabric</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light text-secondary">
                  {/* Column Filters */}
                  <tr className="bg-light">
                    <th>
                      <input
                        type="text"
                        placeholder="Filter ID"
                        className="form-control form-control-sm fs-11"
                        value={colFilters.id}
                        onChange={(e) => setColFilters({ ...colFilters, id: e.target.value })}
                      />
                    </th>
                    <th>
                      <input
                        type="text"
                        placeholder="Filter Quality"
                        className="form-control form-control-sm fs-11"
                        value={colFilters.name}
                        onChange={(e) => setColFilters({ ...colFilters, name: e.target.value })}
                      />
                    </th>
                    <th>
                      <select
                        className="form-select form-select-sm fs-11"
                        value={colFilters.type}
                        onChange={(e) => setColFilters({ ...colFilters, type: e.target.value })}
                      >
                        <option value="">All Types</option>
                        <option value="Cotton">Cotton</option>
                        <option value="Rayon">Rayon</option>
                        <option value="Polyester">Polyester</option>
                        <option value="Silk">Silk</option>
                      </select>
                    </th>
                    <th>
                      <input
                        type="text"
                        placeholder="GSM"
                        className="form-control form-control-sm fs-11"
                        value={colFilters.gsm}
                        onChange={(e) => setColFilters({ ...colFilters, gsm: e.target.value })}
                      />
                    </th>
                    <th>Allowed Widths</th>
                    <th>HSN</th>
                    <th>Status</th>
                  </tr>
                  <tr>
                    <th>Fabric ID</th>
                    <th>Quality Name</th>
                    <th>Fabric Type</th>
                    <th>GSM</th>
                    <th>Saved Widths (Panna)</th>
                    <th>HSN</th>
                    <th>Status</th>
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
                        <td className={`fw-semibold ${isSelected ? 'text-white' : 'text-primary'}`}>{f.id}</td>
                        <td className={`fw-medium ${isSelected ? 'text-white' : 'text-dark'}`}>
                          {f.qualityName || f.quality_name || '-'}
                        </td>
                        <td>
                          <span className={`badge border ${isSelected ? 'bg-white text-primary' : 'bg-light text-secondary'}`}>
                            {f.fabricType || f.fabric_type || 'Cotton'}
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
                        <td className="font-monospace fs-12">{f.hsnCode || '-'}</td>
                        <td>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* View / Edit Mode by default (Section 9.2) */}
        {(selectedFabric || isCreatingNew) && (
          <div className="col-12 col-xl-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '80px' }}>
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <h5 className="fw-bold text-dark mb-0 fs-18">
                    {isCreatingNew ? 'Create New Fabric' : formData.qualityName || formData.id}
                  </h5>
                  {!isCreatingNew && (
                    <span className="badge bg-light text-secondary border">{formData.id}</span>
                  )}
                </div>

                <div className="d-flex align-items-center gap-2">
                  {!isEditing ? (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm px-3 d-flex align-items-center gap-1"
                      onClick={() => setIsEditing(true)}
                    >
                      <i className="ti ti-edit fs-14"></i>
                      <span>Edit Fabric</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-success btn-sm px-3 d-flex align-items-center gap-1"
                      onClick={handleSave}
                    >
                      <i className="ti ti-check fs-14"></i>
                      <span>Save Record</span>
                    </button>
                  )}
                  {isInline && (
                    <button
                      type="button"
                      className="btn-close ms-2"
                      onClick={() => onCloseInline && onCloseInline(null)}
                    ></button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSave}>
                {/* 1. Quality & Fabric Type */}
                <div className="mb-3 p-3 bg-light rounded-3">
                  <div className="mb-2">
                    <label className="form-label fs-12 fw-semibold mb-1">Quality Name *</label>
                    {isEditing ? (
                      <input
                        type="text"
                        required
                        placeholder="e.g. Suh Cotton / Rayon 14kg"
                        className={`form-control form-control-sm bg-white ${
                          formErrors.qualityName ? 'is-invalid' : ''
                        }`}
                        value={formData.qualityName}
                        onChange={(e) =>
                          setFormData({ ...formData, qualityName: capitalizeWords(e.target.value) })
                        }
                      />
                    ) : (
                      <div className="fw-bold text-dark fs-15">{formData.qualityName || '-'}</div>
                    )}
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label fs-12 fw-semibold mb-1">Fabric Type *</label>
                      {isEditing ? (
                        <select
                          className="form-select form-select-sm bg-white"
                          value={formData.fabricType}
                          onChange={(e) => setFormData({ ...formData, fabricType: e.target.value })}
                        >
                          <option value="Cotton">Cotton</option>
                          <option value="Rayon">Rayon</option>
                          <option value="Polyester">Polyester</option>
                          <option value="Silk">Silk</option>
                          <option value="Linen">Linen</option>
                        </select>
                      ) : (
                        <div className="text-secondary fs-13">{formData.fabricType}</div>
                      )}
                    </div>

                    <div className="col-6">
                      <label className="form-label fs-12 fw-semibold mb-1">GSM (Grams/Sq Meter)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          placeholder="e.g. 140"
                          className="form-control form-control-sm bg-white no-spinner"
                          value={formData.gsm || ''}
                          onChange={(e) => setFormData({ ...formData, gsm: e.target.value })}
                        />
                      ) : (
                        <div className="text-dark fs-13">{formData.gsm ? `${formData.gsm} gsm` : '-'}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Width Tag Input (Crucial Feature from 3.2.2) */}
                <div className="mb-3 p-3 bg-light rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label fs-12 fw-semibold mb-0 text-dark">
                      Allowed Widths (Tag Input, Numeric Chips) *
                    </label>
                  </div>

                  {/* Render chips */}
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-2 p-2 bg-white border rounded-2">
                    {formData.widths.map((w) => (
                      <span
                        key={w}
                        className="badge bg-primary d-flex align-items-center gap-1 px-2 py-1 fs-12 rounded-pill"
                      >
                        <span>{w}"</span>
                        {isEditing && (
                          <i
                            className="ti ti-x fs-11 cursor-pointer hover-opacity"
                            onClick={() => handleRemoveWidthTag(w)}
                          ></i>
                        )}
                      </span>
                    ))}

                    {/* Tag input box */}
                    {isEditing && (
                      <div className="input-group input-group-sm" style={{ width: '130px' }}>
                        <input
                          type="number"
                          placeholder="Add width"
                          className="form-control form-control-sm border-0 fs-12 p-1 no-spinner"
                          value={widthInput}
                          onChange={(e) => setWidthInput(e.target.value)}
                          onKeyDown={handleAddWidthTag}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm border-0 px-1"
                          onClick={handleAddWidthTag}
                          title="Add chip"
                        >
                          <i className="ti ti-plus fs-12"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="form-text fs-11 text-muted">
                    Type a number and press Enter to add chip. PO &amp; GRN entry will be strictly
                    restricted to these widths.
                  </div>
                </div>

                {/* 3. Shrinkage & HSN */}
                <div className="mb-3 p-3 bg-light rounded-3">
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label fs-12 fw-semibold mb-1">Default Shrinkage %</label>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 3.5"
                          className="form-control form-control-sm bg-white no-spinner"
                          value={formData.defaultShrinkage}
                          onChange={(e) =>
                            setFormData({ ...formData, defaultShrinkage: e.target.value })
                          }
                        />
                      ) : (
                        <div className="text-dark fs-13">{formData.defaultShrinkage}%</div>
                      )}
                    </div>

                    <div className="col-6">
                      <label className="form-label fs-12 fw-semibold mb-1">HSN Code</label>
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="e.g. 520811"
                          className="form-control form-control-sm bg-white font-monospace"
                          value={formData.hsnCode}
                          onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                        />
                      ) : (
                        <div className="font-monospace text-dark fs-13">{formData.hsnCode || '-'}</div>
                      )}
                    </div>

                    <div className="col-12 mt-2">
                      <label className="form-label fs-12 fw-semibold mb-1">Description / Notes</label>
                      {isEditing ? (
                        <textarea
                          rows="2"
                          className="form-control form-control-sm bg-white fs-12"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                      ) : (
                        <div className="text-secondary fs-13">{formData.description || '-'}</div>
                      )}
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

                {/* Edit Controls */}
                {isEditing && (
                  <div className="d-flex align-items-center justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-light btn-sm px-3"
                      onClick={() => {
                        if (isCreatingNew) {
                          setSelectedFabric(null);
                          setIsCreatingNew(false);
                        } else if (selectedFabric) {
                          setFormData({ ...selectedFabric, widths: Array.isArray(selectedFabric.widths) ? [...selectedFabric.widths] : ['44'] });
                        }
                        setWidthInput('');
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm px-4 fw-medium shadow-sm">
                      Save Fabric
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
