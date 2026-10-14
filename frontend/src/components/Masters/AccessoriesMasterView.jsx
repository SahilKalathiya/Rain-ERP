import React, { useState } from 'react';
import { initialAccessoryMasters, getStoredData, setStoredData } from '../../data/salesOrderData';

const CATEGORIES = [
  'Buttons',
  'Lace',
  'Tassels',
  'Thread',
  'Dori',
  'Elastic',
  'Beads & Sequins',
  'Hook',
  'Zipper',
  'Label',
  'Packaging',
  'Other'
];
const CATEGORY_TABS = ['All', ...CATEGORIES];
const THREAD_PATTERNS = ['Kantha', 'Couching', 'Stitching', 'Embroidery', 'Button Tacking', 'Handwork'];

export default function AccessoriesMasterView({ isInline = false, onSaveInline, onCloseInline }) {
  const [accessories, setAccessories] = useState(() => {
    const stored = getStoredData('erp_accessories_master_v1', initialAccessoryMasters);
    const merged = Array.isArray(stored) ? [...stored] : [...initialAccessoryMasters];
    initialAccessoryMasters.forEach(initItem => {
      if (!merged.some(m => m.id === initItem.id || (m.category === initItem.category && m.name === initItem.name))) {
        merged.push(initItem);
      }
    });
    return merged;
  });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAccessory, setSelectedAccessory] = useState(null);
  const [isEditing, setIsEditing] = useState(isInline);
  const [isCreatingNew, setIsCreatingNew] = useState(isInline);

  // Form State
  const [formData, setFormData] = useState({
    id: isInline ? `ACC-${Date.now().toString().slice(-4)}` : '',
    name: '',
    category: 'Buttons',
    unit: 'Piece',
    size: '',
    piecesPerUnit: 1,
    maxBuffer: 10,
    hsnCode: '',
    description: '',
    varietiesInput: '',
    // Category specifics:
    buttonSizes: '14L, 18L, 20L',
    buttonColors: 'Natural, Gold, Black',
    laceSize: '18mm',
    defaultShrinkage: 3.0,
    tasselType: 'Ready Made',
    doriWidths: '44", 58"',
    threadPattern: 'Kantha',
    threadPerStitch: 15,
    threadPerPiece: 60,
    active: true
  });

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setSelectedAccessory(null);
  };

  const handleAddNew = () => {
    const targetCat = selectedCategory === 'All' ? 'Buttons' : selectedCategory;
    setFormData({
      id: `ACC-${Date.now().toString().slice(-4)}`,
      name: '',
      category: targetCat,
      unit: ['Buttons', 'Tassels', 'Hook', 'Zipper', 'Label', 'Packaging'].includes(targetCat) ? 'Piece' : 'Meter',
      size: '',
      piecesPerUnit: 1,
      maxBuffer: 10,
      hsnCode: '',
      description: '',
      varietiesInput: '',
      buttonSizes: '14L, 18L, 20L',
      buttonColors: 'Natural, Gold, Black',
      laceSize: '18mm',
      defaultShrinkage: 3.0,
      tasselType: 'Ready Made',
      doriWidths: '44", 58"',
      threadPattern: 'Kantha',
      threadPerStitch: 15,
      threadPerPiece: 60,
      active: true
    });
    setIsCreatingNew(true);
    setIsEditing(true);
  };

  const handleDeleteAccessory = (accId) => {
    if (!window.confirm('Are you sure you want to delete this accessory?')) return;
    const updated = accessories.filter((a) => a.id !== accId);
    setAccessories(updated);
    setStoredData('erp_accessories_master_v1', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('erp_accessories_master_updated', { detail: updated }));
    }
  };

  const saveAccessory = (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      alert('Accessory Name is required');
      return;
    }

    let parsedVarieties = Array.isArray(formData.varieties) ? [...formData.varieties] : [];
    if (formData.varietiesInput && formData.varietiesInput.trim()) {
      const splitNames = formData.varietiesInput.split(',').map((s) => s.trim()).filter(Boolean);
      parsedVarieties = splitNames.map((vName, idx) => ({
        id: `VAR-${Date.now().toString().slice(-4)}-${idx + 1}`,
        name: vName
      }));
    } else if (!parsedVarieties.some((v) => v.name.toLowerCase() === formData.name.trim().toLowerCase())) {
      parsedVarieties.unshift({
        id: `VAR-${Date.now().toString().slice(-4)}`,
        name: formData.name.trim()
      });
    }

    const accObj = {
      ...formData,
      id: formData.id || `ACC-${Date.now().toString().slice(-4)}`,
      varieties: parsedVarieties
    };

    let updated;
    if (accessories.some((a) => a.id === accObj.id)) {
      updated = accessories.map((a) => (a.id === accObj.id ? accObj : a));
    } else {
      updated = [accObj, ...accessories];
    }

    setAccessories(updated);
    setStoredData('erp_accessories_master_v1', updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('erp_accessories_master_updated', { detail: updated }));
    }

    if (isInline && onSaveInline) {
      onSaveInline(accObj);
      return;
    }

    setIsEditing(false);
    setIsCreatingNew(false);
    setSelectedAccessory(accObj);
  };

  const filteredAccessories = selectedCategory === 'All'
    ? accessories
    : accessories.filter((a) => a.category === selectedCategory);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="ti ti-diamond text-primary"></i> Accessories Master
          </h4>
          <p className="text-muted small mb-0">Route 1: Manage Buttons, Lace, Tassels, Dori, Elastic & 6 Thread Patterns</p>
        </div>
        {!isEditing && (
          <button className="btn btn-primary d-flex align-items-center gap-2 rounded-3 px-4 fw-semibold" onClick={handleAddNew}>
            <i className="ti ti-plus"></i> Add New Accessory
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="d-flex gap-2 mb-4 overflow-auto pb-2">
        {CATEGORY_TABS.map((cat) => (
          <button
            key={cat}
            className={`btn rounded-4 px-4 py-2 fw-semibold transition ${
              selectedCategory === cat ? 'btn-primary shadow-sm' : 'btn-white border text-secondary bg-white'
            }`}
            onClick={() => handleCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {isEditing ? (
        /* Edit / Add Form */
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
            <h5 className="fw-bold text-dark mb-0">
              {isCreatingNew ? `Add New ${formData.category}` : `Edit Accessory: ${formData.name}`}
            </h5>
            <button className="btn btn-sm btn-outline-secondary rounded-3" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
          <form onSubmit={saveAccessory}>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label fw-semibold small text-muted">Category *</label>
                  <select
                    className="form-select bg-light"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Accessory Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Coconut Natural Buttons (18L)"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold small text-muted">Default Unit</label>
                  <select
                    className="form-select"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="Piece">Piece</option>
                    <option value="Meter">Meter</option>
                    <option value="Packet">Packet</option>
                    <option value="Box">Box</option>
                    <option value="Cone">Cone</option>
                  </select>
                </div>

                <div className="col-md-12">
                  <label className="form-label fw-semibold small text-muted">Varieties / Quick Pills (comma-separated, e.g. Coconut, MOP, Snap)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Coconut, MOP, Snap Button, Metal 2 Hole"
                    value={formData.varietiesInput || ''}
                    onChange={(e) => setFormData({ ...formData, varietiesInput: e.target.value })}
                  />
                  <div className="form-text" style={{ fontSize: '11.5px' }}>
                    Each variety entered here automatically becomes a quick "+ Button" in Order Detail BOM.
                  </div>
                </div>

                {/* Specifics for Buttons */}
                {formData.category === 'Buttons' && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Button Sizes / Lignes</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="14L, 18L, 20L, 24L"
                        value={formData.buttonSizes}
                        onChange={(e) => setFormData({ ...formData, buttonSizes: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Button Colors</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Natural, Dark Brown, Gold, Black"
                        value={formData.buttonColors}
                        onChange={(e) => setFormData({ ...formData, buttonColors: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* Specifics for Lace */}
                {formData.category === 'Lace' && (
                  <>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">Lace Width / Size</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 18mm, 2 inch"
                        value={formData.laceSize}
                        onChange={(e) => setFormData({ ...formData, laceSize: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">Default Shrinkage %</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 3.0"
                        value={formData.defaultShrinkage}
                        onChange={(e) => setFormData({ ...formData, defaultShrinkage: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </>
                )}

                {/* Specifics for Thread */}
                {formData.category === 'Thread' && (
                  <>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">Thread Pattern *</label>
                      <select
                        className="form-select"
                        value={formData.threadPattern}
                        onChange={(e) => setFormData({ ...formData, threadPattern: e.target.value })}
                      >
                        {THREAD_PATTERNS.map((tp) => (
                          <option key={tp} value={tp}>
                            {tp} Pattern
                          </option>
                        ))}
                      </select>
                    </div>
                    {formData.threadPattern === 'Kantha' || formData.threadPattern === 'Couching' ? (
                      <div className="col-md-4">
                        <label className="form-label fw-semibold small text-muted">Thread Per Stitch (metres)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.threadPerStitch}
                          onChange={(e) => setFormData({ ...formData, threadPerStitch: parseFloat(e.target.value) || 15 })}
                        />
                      </div>
                    ) : formData.threadPattern === 'Stitching' ? (
                      <div className="col-md-4">
                        <label className="form-label fw-semibold small text-muted">Thread Per Piece (metres)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.threadPerPiece}
                          onChange={(e) => setFormData({ ...formData, threadPerPiece: parseFloat(e.target.value) || 60 })}
                        />
                      </div>
                    ) : null}
                  </>
                )}

                {/* Size and Pieces per Unit for other categories */}
                {!['Buttons', 'Thread'].includes(formData.category) && (
                  <>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold small text-muted">Size</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 18mm, 2cm, 8 inch, Large"
                        value={formData.size || ''}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold small text-muted">Pieces per Unit</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        placeholder="1"
                        value={formData.piecesPerUnit || 1}
                        onChange={(e) => setFormData({ ...formData, piecesPerUnit: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </>
                )}

                {/* Common fields */}
                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-muted">Max Allowed Buffer %</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 10"
                    value={formData.maxBuffer}
                    onChange={(e) => setFormData({ ...formData, maxBuffer: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-muted">HSN Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 96062100"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-muted">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Brief notes"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="card-footer bg-light border-top py-3 px-4 d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary rounded-3 px-4" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold">
                <i className="ti ti-check me-1"></i> Save Accessory
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* List of Accessories */
        <div className="row g-3">
          {filteredAccessories.map((acc) => (
            <div key={acc.id} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span className="badge bg-purple-subtle text-purple border px-2 py-1 rounded-pill small mb-2 d-inline-block">
                      {acc.category}
                    </span>
                    <h6 className="fw-bold text-dark mb-1">{acc.name}</h6>
                    <span className="text-muted small font-monospace">{acc.id}</span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => {
                        setFormData({
                          ...acc,
                          varietiesInput: Array.isArray(acc.varieties) ? acc.varieties.map((v) => v.name).join(', ') : ''
                        });
                        setIsCreatingNew(false);
                        setIsEditing(true);
                      }}
                      title="Edit Accessory"
                    >
                      <i className="ti ti-edit"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-light text-danger"
                      onClick={() => handleDeleteAccessory(acc.id)}
                      title="Delete Accessory"
                    >
                      <i className="ti ti-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center small text-muted">
                  <span>Unit: <strong className="text-dark">{acc.unit}</strong></span>
                  <span>Buffer: <strong className="text-dark">{acc.maxBuffer}%</strong></span>
                  {acc.hsnCode && <span>HSN: <strong className="text-dark">{acc.hsnCode}</strong></span>}
                </div>
              </div>
            </div>
          ))}

          {filteredAccessories.length === 0 && (
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted">
                <i className="ti ti-box fs-1 d-block mb-2 opacity-50"></i>
                No accessories found under category "{selectedCategory}". Click "+ Add New Accessory" above.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
