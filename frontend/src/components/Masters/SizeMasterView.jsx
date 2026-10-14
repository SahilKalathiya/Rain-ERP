import React, { useState } from 'react';
import { initialSizeSeries, getStoredData, setStoredData } from '../../data/salesOrderData';

export default function SizeMasterView() {
  const [seriesList, setSeriesList] = useState(() => {
    const stored = getStoredData('erp_size_series_v1', null);
    if (Array.isArray(stored) && stored.length > 0 && stored.some(s => s.name === 'Alpha')) {
      return stored;
    }
    setStoredData('erp_size_series_v1', initialSizeSeries);
    return initialSizeSeries;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    sizesInput: '',
    active: true
  });

  const handleAddNewSeries = () => {
    setFormData({
      id: `SER-${Date.now().toString().slice(-4)}`,
      name: '',
      description: 'Standard sizing series',
      sizesInput: 'XS, S, M, L, XL, 2XL',
      active: true
    });
    setIsCreatingNew(true);
    setIsEditing(true);
  };

  const handleEditSeries = (series) => {
    setFormData({
      id: series.id,
      name: series.name,
      description: series.description || '',
      sizesInput: (series.sizes || []).join(', '),
      active: series.active !== false
    });
    setIsCreatingNew(false);
    setIsEditing(true);
  };

  const handleDeleteSeries = (seriesId) => {
    if (window.confirm('Are you sure you want to delete this size series?')) {
      const updated = seriesList.filter((s) => s.id !== seriesId);
      setSeriesList(updated);
      setStoredData('erp_size_series_v1', updated);
    }
  };

  const saveSeries = (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      alert('Series Name is required');
      return;
    }

    const sizesArr = formData.sizesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newSeriesObj = {
      id: formData.id || `SER-${Date.now().toString().slice(-4)}`,
      name: formData.name.trim(),
      description: formData.description || `${sizesArr.length} sizes`,
      displayOrder: seriesList.length + 1,
      sizes: sizesArr,
      active: formData.active
    };

    let updated;
    if (seriesList.some((s) => s.id === newSeriesObj.id)) {
      updated = seriesList.map((s) => (s.id === newSeriesObj.id ? newSeriesObj : s));
    } else {
      updated = [...seriesList, newSeriesObj];
    }

    setSeriesList(updated);
    setStoredData('erp_size_series_v1', updated);
    setIsEditing(false);
    setIsCreatingNew(false);
  };

  // Filter series based on search
  const filteredSeries = seriesList.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchName = (s.name || '').toLowerCase().includes(q);
    const matchDesc = (s.description || '').toLowerCase().includes(q);
    const matchSizes = (s.sizes || []).some((sz) => String(sz).toLowerCase().includes(q));
    return matchName || matchDesc || matchSizes;
  });

  return (
    <div className="p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm flex-shrink-0"
            style={{ width: '42px', height: '42px', backgroundColor: '#6366f1' }}
          >
            <i className="ti ti-ruler-2 fs-4"></i>
          </div>
          <div>
            <h4 className="fw-bold text-dark mb-0 fs-18">Size Master</h4>
            <p className="text-muted small mb-0">
              Sizes live in series &mdash; a challan picks one series and shows only its sizes.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn text-white rounded-3 px-3 py-2 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm"
          style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
          onClick={handleAddNewSeries}
        >
          <i className="ti ti-plus fs-6"></i>
          <span>New series</span>
        </button>
      </div>

      {/* Edit / Create Modal */}
      {isEditing && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 p-4 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <h5 className="fw-bold text-dark mb-0">
                  {isCreatingNew ? 'Create New Size Series' : `Edit Series: ${formData.name}`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsEditing(false)}
                ></button>
              </div>

              <form onSubmit={saveSeries}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted mb-1">Series Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Basic, MIX SIZES, Number"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted mb-1">Subtitle / Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Standard kurta run, Waist sizes"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted mb-1">
                    Sizes (Comma separated) *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="XS, S, M, L, XL, 2XL, 3XL"
                    required
                    value={formData.sizesInput}
                    onChange={(e) => setFormData({ ...formData, sizesInput: e.target.value })}
                  />
                  <div className="form-text small text-muted">
                    Enter sizes in display order separated by commas.
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-3 px-3"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white rounded-3 px-4 fw-semibold"
                    style={{ backgroundColor: '#6366f1' }}
                  >
                    Save Series
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-4">
        <div className="position-relative" style={{ maxWidth: '480px' }}>
          <i
            className="ti ti-search position-absolute text-muted"
            style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          ></i>
          <input
            type="text"
            className="form-control rounded-3 ps-5 bg-white border"
            placeholder="Search a series or a size..."
            style={{ borderColor: '#e2e8f0', height: '42px', fontSize: '13px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Series Cards (Matching Image 2) */}
      <div className="d-flex flex-column gap-3">
        {filteredSeries.map((series) => (
          <div
            key={series.id}
            className="card border-0 shadow-xs rounded-4 p-4 bg-white"
            style={{ border: '1px solid #e2e8f0' }}
          >
            {/* Card Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
                  style={{ width: '38px', height: '38px', backgroundColor: '#eef2ff', color: '#6366f1' }}
                >
                  <i className="ti ti-layers-subtract fs-5"></i>
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-0 fs-15">{series.name}</h6>
                  <span className="text-muted small" style={{ fontSize: '12px' }}>
                    {(series.sizes || []).length} sizes &bull; {series.description || 'Standard series'}
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-link text-muted p-1 text-decoration-none"
                  title="Edit series"
                  onClick={() => handleEditSeries(series)}
                >
                  <i className="ti ti-edit fs-5"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-danger p-1 text-decoration-none"
                  title="Delete series"
                  onClick={() => handleDeleteSeries(series.id)}
                >
                  <i className="ti ti-trash fs-5"></i>
                </button>
              </div>
            </div>

            {/* Sizes Pills Grid (Image 2 exact style) */}
            <div className="d-flex flex-wrap gap-2 pt-1">
              {(series.sizes || []).map((sz, sIdx) => {
                const detail = (series.sizeDetails || []).find((d) => d.size === sz);
                return (
                  <div
                    key={sIdx}
                    className="p-1.5 px-3 rounded-3 border bg-white d-flex align-items-center gap-2 shadow-2xs"
                    style={{ borderColor: '#e2e8f0', minWidth: '85px', fontSize: '12px' }}
                  >
                    <i className="ti ti-dots-vertical text-muted opacity-50 fs-12"></i>
                    <span className="text-muted small" style={{ fontSize: '11px' }}>{sIdx + 1}</span>
                    <strong className="text-dark fw-bold">{sz}</strong>
                    {detail?.label && (
                      <span className="text-muted text-uppercase" style={{ fontSize: '10px' }}>
                        {detail.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredSeries.length === 0 && (
          <div className="p-5 text-center text-muted bg-white rounded-4 border">
            No size series found matching "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
}
