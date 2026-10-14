import React, { useState } from 'react';
import { initialArticles, getStoredData, setStoredData } from '../../data/salesOrderData';

const EMOJI_OPTIONS = ['👕', '👖', '🧣', '🧥', '👚', '🩳', '👗', '👘', '👔', '🎽', '🥻', '🧵'];

export default function ArticleMasterView({ isInline = false, onSaveInline, onCloseInline }) {
  const [articles, setArticles] = useState(() => getStoredData('erp_articles_v1', initialArticles));
  const [showOthers, setShowOthers] = useState(false);
  const [isEditing, setIsEditing] = useState(isInline);
  const [isCreatingNew, setIsCreatingNew] = useState(isInline);

  const [formData, setFormData] = useState(() => ({
    id: isInline ? `ART-${String(articles.length + 1).padStart(3, '0')}` : '',
    name: '',
    icon: '',
    sortOrder: '',
    description: '',
    active: ''
  }));

  const saveArticle = (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      alert('Article Name is required');
      return;
    }

    const capitalizedName = formData.name.replace(/\b\w/g, (c) => c.toUpperCase());
    const articleObj = {
      ...formData,
      name: capitalizedName,
      icon: formData.icon || '👕',
      sortOrder: formData.sortOrder ? (parseInt(formData.sortOrder, 10) || 1) : (articles.length + 1),
      active: formData.active === '' ? true : (formData.active === 'true' || formData.active === true),
      id: formData.id || `ART-${String(articles.length + 1).padStart(3, '0')}`
    };

    let updated;
    if (articles.some((a) => a.id === articleObj.id)) {
      updated = articles.map((a) => (a.id === articleObj.id ? articleObj : a));
    } else {
      updated = [...articles, articleObj];
    }

    // Sort by sortOrder
    updated.sort((a, b) => (Number(a.sortOrder) || 99) - (Number(b.sortOrder) || 99));

    setArticles(updated);
    setStoredData('erp_articles_v1', updated);
    try {
      window.dispatchEvent(new Event('erp_articles_updated'));
    } catch (e) {}

    if (isInline && onSaveInline) {
      onSaveInline(articleObj);
      return;
    }

    setIsEditing(false);
    setIsCreatingNew(false);
  };

  const handleAddNew = () => {
    setFormData({
      id: `ART-${String(articles.length + 1).padStart(3, '0')}`,
      name: '',
      icon: '',
      sortOrder: '',
      description: '',
      active: ''
    });
    setIsCreatingNew(true);
    setIsEditing(true);
  };

  const primaryArticles = articles.slice(0, 6);
  const otherArticles = articles.slice(6);

  if (isInline) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow-lg border-0 rounded-4">
            <div className="modal-header border-0 pb-0 px-4 pt-4">
              <div>
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <span className="badge bg-primary-subtle text-primary p-2 rounded-3">
                    <i className="ti ti-shirt fs-5"></i>
                  </span>
                  Add New Article Type
                </h5>
                <p className="text-muted small mb-0">Create new garment style / article inline</p>
              </div>
              <button type="button" className="btn-close" onClick={onCloseInline}></button>
            </div>
            <form onSubmit={saveArticle}>
              <div className="modal-body p-4">
                <div className="mb-4">
                  <label className="form-label fw-semibold small text-muted mb-2">Select Icon / Emoji</label>
                  <div
                    className="p-2 rounded-3 bg-light border"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      gap: '10px',
                      borderColor: '#e2e8f0'
                    }}
                  >
                    {EMOJI_OPTIONS.map((emoji) => {
                      const isSelected = formData.icon === emoji;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          className="btn d-inline-flex align-items-center justify-content-center rounded-3 transition p-0"
                          style={{
                            width: '100%',
                            height: '48px',
                            fontSize: '26px',
                            backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                            border: isSelected ? '2px solid #2e37a4' : '1px solid #cbd5e1',
                            boxShadow: isSelected ? '0 4px 12px rgba(46, 55, 164, 0.25)' : '0 1px 2px rgba(0,0,0,0.05)',
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                            cursor: 'pointer'
                          }}
                          onClick={() => setFormData({ ...formData, icon: emoji })}
                        >
                          <span style={{ lineHeight: 1 }}>{emoji}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-muted">Article Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Kurta, Pajama, Jacket"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label fw-semibold small text-muted">Sort Order</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 1"
                      value={formData.sortOrder || ''}
                      onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold small text-muted">Status</label>
                    <select
                      className="form-select"
                      value={formData.active !== undefined && formData.active !== '' ? String(formData.active) : ''}
                      onChange={(e) => setFormData({ ...formData, active: e.target.value })}
                    >
                      <option value="">Select Status...</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 px-4 pb-4">
                <button type="button" className="btn btn-light rounded-3 px-4" onClick={onCloseInline}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold">
                  Save Article
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="ti ti-shirt text-primary"></i> Article Master
          </h4>
          <p className="text-muted small mb-0">Route 1: Manage garment article types (Kurta, Pajama, Dupatta, Jacket etc.)</p>
        </div>
        {!isEditing && (
          <button className="btn btn-primary d-flex align-items-center gap-2 rounded-3 px-4 fw-semibold" onClick={handleAddNew}>
            <i className="ti ti-plus"></i> Add New Article
          </button>
        )}
      </div>

      {isEditing ? (
        /* Edit Form */
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
            <h5 className="fw-bold text-dark mb-0">
              {isCreatingNew ? 'Create New Article Master' : `Edit Article: ${formData.name}`}
            </h5>
            <button className="btn btn-sm btn-outline-secondary rounded-3" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
          <form onSubmit={saveArticle}>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label fw-semibold small text-muted">Article ID</label>
                  <input type="text" className="form-control bg-light" value={formData.id} readOnly />
                </div>
                <div className="col-md-5">
                  <label className="form-label fw-semibold small text-muted">Article Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Kurta, Pajama, Dupatta"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-muted">Sort Order</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 1"
                    value={formData.sortOrder || ''}
                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small text-muted mb-2">Select Emoji / Icon</label>
                  <div
                    className="p-2 rounded-3 bg-light border"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      gap: '10px',
                      borderColor: '#e2e8f0'
                    }}
                  >
                    {EMOJI_OPTIONS.map((emoji) => {
                      const isSelected = formData.icon === emoji;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          className="btn d-inline-flex align-items-center justify-content-center rounded-3 transition p-0"
                          style={{
                            width: '100%',
                            height: '48px',
                            fontSize: '26px',
                            backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                            border: isSelected ? '2px solid #2e37a4' : '1px solid #cbd5e1',
                            boxShadow: isSelected ? '0 4px 12px rgba(46, 55, 164, 0.25)' : '0 1px 2px rgba(0,0,0,0.05)',
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                            cursor: 'pointer'
                          }}
                          onClick={() => setFormData({ ...formData, icon: emoji })}
                        >
                          <span style={{ lineHeight: 1 }}>{emoji}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small text-muted">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Garment specifications or manufacturing notes"
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
                <i className="ti ti-check me-1"></i> Save Article
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Visual Tiles & Grid Mode */
        <div>
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <h6 className="fw-bold text-muted text-uppercase small mb-3">Active Article Types (Grid Preview)</h6>
            <div className="row g-3">
              {primaryArticles.map((art) => (
                <div key={art.id} className="col-6 col-md-4 col-lg-2">
                  <div
                    className="card h-100 border text-center p-3 rounded-4 shadow-sm hover-elevate transition"
                    style={{ cursor: 'pointer', borderColor: '#e2e8f0' }}
                    onClick={() => {
                      setFormData(art);
                      setIsCreatingNew(false);
                      setIsEditing(true);
                    }}
                  >
                    <div className="fs-1 mb-2">{art.icon}</div>
                    <div className="fw-bold text-dark">{art.name}</div>
                    <div className="text-muted small font-monospace mt-1">{art.id}</div>
                  </div>
                </div>
              ))}

              {otherArticles.length > 0 && !showOthers && (
                <div className="col-6 col-md-4 col-lg-2">
                  <div
                    className="card h-100 border border-dashed text-center p-3 rounded-4 bg-light d-flex flex-column justify-content-center align-items-center"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowOthers(true)}
                  >
                    <div className="fs-3 text-secondary mb-1">+{otherArticles.length}</div>
                    <div className="fw-semibold text-secondary small">Others</div>
                  </div>
                </div>
              )}

              {showOthers &&
                otherArticles.map((art) => (
                  <div key={art.id} className="col-6 col-md-4 col-lg-2">
                    <div
                      className="card h-100 border text-center p-3 rounded-4 shadow-sm"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setFormData(art);
                        setIsCreatingNew(false);
                        setIsEditing(true);
                      }}
                    >
                      <div className="fs-1 mb-2">{art.icon}</div>
                      <div className="fw-bold text-dark">{art.name}</div>
                      <div className="text-muted small font-monospace mt-1">{art.id}</div>
                    </div>
                  </div>
                ))}

              {/* Add New Tile */}
              <div className="col-6 col-md-4 col-lg-2">
                <div
                  className="card h-100 border border-primary border-dashed text-center p-3 rounded-4 bg-primary-subtle d-flex flex-column justify-content-center align-items-center"
                  style={{ cursor: 'pointer' }}
                  onClick={handleAddNew}
                >
                  <i className="ti ti-plus fs-2 text-primary mb-1"></i>
                  <div className="fw-semibold text-primary small">+ New Article</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
