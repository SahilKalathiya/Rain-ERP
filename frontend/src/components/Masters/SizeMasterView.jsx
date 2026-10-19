import React, { useState, useMemo } from 'react';
import { initialSizeSeries, getStoredData, setStoredData } from '../../data/salesOrderData';

export default function SizeMasterView() {
  const [seriesList, setSeriesList] = useState(() => {
    const normalize = (list) => {
      return (list || []).map((s, idx) => {
        const detailsMap = {};
        (s.sizeDetails || []).forEach((d) => {
          if (d && d.size) detailsMap[d.size] = d.label || d.size;
        });
        const initMatch = initialSizeSeries.find((x) => x.id === s.id || x.name === s.name);
        if (initMatch) {
          (initMatch.sizeDetails || []).forEach((d) => {
            if (d && d.size && !detailsMap[d.size]) detailsMap[d.size] = d.label || d.size;
          });
        }

        const sizes = Array.isArray(s.sizes) && s.sizes.length > 0
          ? s.sizes
          : (s.sizeRecords || []).map((r) => r.sizeName);

        const records = (s.sizeRecords && s.sizeRecords.length > 0
          ? s.sizeRecords
          : sizes.map((sz, sIdx) => ({
              id: `SZ-${s.id}-${String(sIdx + 1).padStart(2, '0')}`,
              seriesId: s.id,
              sizeName: sz,
              displayName: detailsMap[sz] || sz,
              description: detailsMap[sz] || ''
            }))
        ).map((r, rIdx) => ({
          ...r,
          id: r.id || `SZ-${s.id}-${String(rIdx + 1).padStart(2, '0')}`,
          seriesId: s.id,
          sizeName: r.sizeName || r.size || '',
          displayName: r.displayName || detailsMap[r.sizeName] || r.sizeName || '',
          description: r.description || detailsMap[r.sizeName] || ''
        }));

        return {
          ...s,
          displayOrder: s.displayOrder || idx + 1,
          active: s.active !== false,
          sizes: records.map((r) => r.sizeName),
          sizeDetails: records.map((r) => ({ size: r.sizeName, label: r.displayName || r.sizeName })),
          sizeRecords: records
        };
      });
    };

    const stored = getStoredData('erp_size_series_v1', null);
    if (Array.isArray(stored) && stored.length > 0) {
      const normalized = normalize(stored);
      setStoredData('erp_size_series_v1', normalized);
      return normalized;
    }
    const initialNormalized = normalize(initialSizeSeries);
    setStoredData('erp_size_series_v1', initialNormalized);
    return initialNormalized;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Series Edit / Create Modal State
  const [isEditingSeries, setIsEditingSeries] = useState(false);
  const [isCreatingNewSeries, setIsCreatingNewSeries] = useState(false);

  const [seriesFormData, setSeriesFormData] = useState({
    id: '',
    name: '',
    displayOrder: '',
    active: true,
    sizeRecords: []
  });

  // Inline "Add More Size" Modal State (Section 5.2)
  const [activeSeriesForAddSize, setActiveSeriesForAddSize] = useState(null);
  const [newSizeForm, setNewSizeForm] = useState({
    sizeName: '',
    displayName: '',
    description: ''
  });

  // Size Drag-and-Drop state
  const [draggedSize, setDraggedSize] = useState(null); // { seriesId, index }
  const [dragOverTarget, setDragOverTarget] = useState(null); // { seriesId, index }

  // Modal Size Drag-and-Drop state
  const [modalDraggedIdx, setModalDraggedIdx] = useState(null);
  const [modalDragOverIdx, setModalDragOverIdx] = useState(null);

  const handleReorderSizes = (seriesId, fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const updated = seriesList.map((s) => {
      if (s.id === seriesId) {
        const records = [...(s.sizeRecords || [])];
        if (fromIdx < 0 || fromIdx >= records.length || toIdx < 0 || toIdx >= records.length) {
          return s;
        }
        const [moved] = records.splice(fromIdx, 1);
        records.splice(toIdx, 0, moved);

        const newSizes = records.map((r) => r.sizeName);
        const newDetails = records.map((r) => ({
          size: r.sizeName,
          label: r.displayName || r.sizeName
        }));

        return {
          ...s,
          sizes: newSizes,
          sizeDetails: newDetails,
          sizeRecords: records
        };
      }
      return s;
    });
    persistSeries(updated);
    showToast('Size reordered successfully.');
  };

  const handleDragStart = (e, seriesId, index) => {
    setDraggedSize({ seriesId, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ seriesId, index }));
  };

  const handleDragOver = (e, seriesId, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedSize && draggedSize.seriesId === seriesId) {
      if (!dragOverTarget || dragOverTarget.seriesId !== seriesId || dragOverTarget.index !== index) {
        setDragOverTarget({ seriesId, index });
      }
    }
  };

  const handleDragEnter = (e, seriesId, index) => {
    e.preventDefault();
    if (draggedSize && draggedSize.seriesId === seriesId) {
      setDragOverTarget({ seriesId, index });
    }
  };

  const handleDrop = (e, targetSeriesId, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();

    let fromSeriesId = draggedSize?.seriesId;
    let fromIdx = draggedSize?.index;

    try {
      const raw = e.dataTransfer.getData('text/plain');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.seriesId !== undefined) {
          fromSeriesId = parsed.seriesId;
          fromIdx = parsed.index;
        }
      }
    } catch (err) {}

    setDragOverTarget(null);
    setDraggedSize(null);

    if (fromSeriesId === targetSeriesId && fromIdx !== undefined && fromIdx !== null && fromIdx !== targetIndex) {
      handleReorderSizes(targetSeriesId, fromIdx, targetIndex);
    }
  };

  const handleDragEnd = () => {
    setDraggedSize(null);
    setDragOverTarget(null);
  };

  const handleReorderModalSizes = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const records = [...seriesFormData.sizeRecords];
    const [moved] = records.splice(fromIdx, 1);
    records.splice(toIdx, 0, moved);
    setSeriesFormData({ ...seriesFormData, sizeRecords: records });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const persistSeries = (updated) => {
    setSeriesList(updated);
    setStoredData('erp_size_series_v1', updated);
    try {
      window.dispatchEvent(new Event('erp_size_series_updated'));
    } catch (e) {}
  };

  // Reorder Series (Section 5.2 & 12.1: Drag / Move Order immediately persists)
  const handleMoveSeries = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= seriesList.length) return;

    const cloned = [...seriesList];
    const temp = cloned[index];
    cloned[index] = cloned[targetIdx];
    cloned[targetIdx] = temp;

    // Update displayOrder numbers sequentially
    const updated = cloned.map((s, idx) => ({ ...s, displayOrder: idx + 1 }));
    persistSeries(updated);
    showToast(`Reordered "${temp.name}" to position #${targetIdx + 1}`);
  };

  const handleAddNewSeries = () => {
    const nextSeq = `SER-${String(seriesList.length + 1).padStart(3, '0')}`;
    setSeriesFormData({
      id: nextSeq,
      name: '',
      displayOrder: '',
      active: true,
      sizeRecords: [
        {
          id: `SZ-${nextSeq}-01`,
          seriesId: nextSeq,
          sizeName: '',
          displayName: '',
          description: ''
        }
      ]
    });
    setIsCreatingNewSeries(true);
    setIsEditingSeries(true);
  };

  const handleEditSeries = (series) => {
    const records = (series.sizeRecords && series.sizeRecords.length > 0)
      ? series.sizeRecords.map((r) => ({ ...r }))
      : [
          {
            id: `SZ-${series.id}-01`,
            seriesId: series.id,
            sizeName: '',
            displayName: '',
            description: ''
          }
        ];
    setSeriesFormData({
      id: series.id,
      name: series.name,
      displayOrder: series.displayOrder || 1,
      active: series.active !== false,
      sizeRecords: records
    });
    setIsCreatingNewSeries(false);
    setIsEditingSeries(true);
  };

  const handleDeleteSeries = (seriesId, seriesName) => {
    if (!window.confirm(`Are you sure you want to delete size series "${seriesName}"?`)) return;
    const updated = seriesList.filter((s) => s.id !== seriesId);
    persistSeries(updated);
    showToast(`Size series "${seriesName}" deleted.`);
  };

  const handleToggleSeriesActive = (series) => {
    const updated = seriesList.map((s) =>
      s.id === series.id ? { ...s, active: !s.active } : s
    );
    persistSeries(updated);
    showToast(`Series "${series.name}" marked as ${!series.active ? 'Active' : 'Inactive'}.`);
  };

  // Save Series Form
  const handleSaveSeries = (e) => {
    e?.preventDefault();
    if (!seriesFormData.name.trim()) {
      alert('Series Name is mandatory (e.g. Alphabetic, Numeric, Roman).');
      return;
    }

    const cleanSizes = seriesFormData.sizeRecords.filter((r) => r.sizeName && r.sizeName.trim());
    if (cleanSizes.length === 0) {
      alert('Please add at least one Size record to this series.');
      return;
    }

    const finalObj = {
      ...seriesFormData,
      name: seriesFormData.name.trim(),
      sizes: cleanSizes.map((s) => s.sizeName.trim()),
      sizeDetails: cleanSizes.map((s) => ({
        size: s.sizeName.trim(),
        label: (s.displayName || s.sizeName).trim()
      })),
      sizeRecords: cleanSizes.map((s, idx) => ({
        ...s,
        id: s.id || `SZ-${seriesFormData.id}-${String(idx + 1).padStart(2, '0')}`,
        seriesId: seriesFormData.id,
        sizeName: s.sizeName.trim(),
        displayName: (s.displayName || s.sizeName).trim()
      }))
    };

    let updated;
    const exists = seriesList.some((s) => s.id === finalObj.id);
    if (exists) {
      updated = seriesList.map((s) => (s.id === finalObj.id ? finalObj : s));
      showToast(`Size series "${finalObj.name}" updated successfully.`);
    } else {
      updated = [...seriesList, finalObj];
      showToast(`Size series "${finalObj.name}" created successfully.`);
    }

    persistSeries(updated);
    setIsEditingSeries(false);
  };

  // Add More Size in Edit Series Modal
  const handleAddMoreSizeRow = () => {
    const nextIdx = seriesFormData.sizeRecords.length + 1;
    const newRecord = {
      id: `SZ-${seriesFormData.id || 'NEW'}-${String(nextIdx).padStart(2, '0')}`,
      seriesId: seriesFormData.id,
      sizeName: '',
      displayName: '',
      description: ''
    };
    setSeriesFormData({
      ...seriesFormData,
      sizeRecords: [...seriesFormData.sizeRecords, newRecord]
    });
  };

  const handleRemoveSizeRow = (index) => {
    const current = seriesFormData.sizeRecords || [];
    if (current.length <= 1) {
      setSeriesFormData({
        ...seriesFormData,
        sizeRecords: [
          {
            id: `SZ-${seriesFormData.id || 'SER'}-01`,
            seriesId: seriesFormData.id,
            sizeName: '',
            displayName: '',
            description: ''
          }
        ]
      });
      return;
    }
    const filtered = current.filter((_, i) => i !== index);
    setSeriesFormData({ ...seriesFormData, sizeRecords: filtered });
  };

  // Quick "+ Add More Size" directly from card (Section 5.2)
  const handleQuickAddSizeSubmit = (e) => {
    e?.preventDefault();
    if (!newSizeForm.sizeName.trim() || !activeSeriesForAddSize) return;

    const newRecord = {
      id: `SZ-${activeSeriesForAddSize.id}-${String((activeSeriesForAddSize.sizeRecords || []).length + 1).padStart(2, '0')}`,
      seriesId: activeSeriesForAddSize.id,
      sizeName: newSizeForm.sizeName.trim().toUpperCase(),
      displayName: (newSizeForm.displayName || newSizeForm.sizeName).trim(),
      description: newSizeForm.description.trim()
    };

    const updated = seriesList.map((s) => {
      if (s.id === activeSeriesForAddSize.id) {
        const updatedRecords = [...(s.sizeRecords || []), newRecord];
        return {
          ...s,
          sizes: updatedRecords.map((r) => r.sizeName),
          sizeDetails: updatedRecords.map((r) => ({
            size: r.sizeName,
            label: r.displayName || r.sizeName
          })),
          sizeRecords: updatedRecords
        };
      }
      return s;
    });

    persistSeries(updated);
    showToast(`Added size "${newRecord.sizeName}" to ${activeSeriesForAddSize.name}`);
    setActiveSeriesForAddSize(null);
    setNewSizeForm({ sizeName: '', displayName: '', description: '' });
  };

  const handleQuickDeleteSize = (seriesId, sizeRecordId, sizeName, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Remove size "${sizeName}" from this series?`)) return;
    const updated = seriesList.map((s) => {
      if (s.id === seriesId) {
        const updatedRecords = (s.sizeRecords || []).filter((r) => r.id !== sizeRecordId);
        return {
          ...s,
          sizes: updatedRecords.map((r) => r.sizeName),
          sizeRecords: updatedRecords
        };
      }
      return s;
    });
    persistSeries(updated);
    showToast(`Removed size "${sizeName}".`);
  };

  // Filter series based on search
  const filteredSeries = useMemo(() => {
    return seriesList.filter((s) => {
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      const matchName = (s.name || '').toLowerCase().includes(q);
      const matchId = (s.id || '').toLowerCase().includes(q);
      const matchSizes = (s.sizeRecords || []).some(
        (sz) =>
          sz.sizeName.toLowerCase().includes(q) ||
          (sz.displayName || '').toLowerCase().includes(q)
      );
      return matchName || matchId || matchSizes;
    });
  }, [seriesList, searchTerm]);

  return (
    <div className="p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 2000 }}>
          <div className="alert alert-success shadow-lg border-0 d-flex align-items-center gap-2 mb-0 py-2 px-3 rounded-3">
            <i className="ti ti-check fs-5"></i>
            <span className="fw-semibold small">{toastMessage}</span>
          </div>
        </div>
      )}

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
              Route 1 (Section 5) &bull; Size Series (Alphabetic, Numeric, Roman) & Individual Size Records
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm rounded-3 px-3 py-2 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm"
          onClick={handleAddNewSeries}
        >
          <i className="ti ti-plus"></i>
          <span>Add New Size Series</span>
        </button>
      </div>

      {/* Search Bar (Section 11.1) */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="position-relative" style={{ minWidth: '320px', maxWidth: '440px' }}>
            <i
              className="ti ti-search text-muted"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '14px',
                pointerEvents: 'none',
                zIndex: 2
              }}
            ></i>
            <input
              type="text"
              className="form-control form-control-sm rounded-3 border search-input-integrated"
              placeholder="Search series name or size (e.g. Alphabetic, Numeric, XL, 38)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '42px' }}
            />
          </div>
          <div className="text-muted small">
            <strong>{seriesList.length}</strong> size series configured &bull; Drag or use arrows to reorder display priority
          </div>
        </div>
      </div>

      {/* Series Cards (Section 5.1 & 5.2) */}
      <div className="d-flex flex-column gap-3.5">
        {filteredSeries.map((series, idx) => (
          <div
            key={series.id}
            className="card border-0 shadow-sm rounded-4 p-4 bg-white transition hover-elevate"
            style={{
              border: '1px solid #e2e8f0',
              opacity: series.active ? 1 : 0.7
            }}
          >
            {/* Card Header matching Image 2 */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-3">
                {/* Series Icon matching Image 2 */}
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center text-primary flex-shrink-0"
                  style={{ width: '40px', height: '40px', backgroundColor: '#eef2ff' }}
                >
                  <i className="ti ti-layers-subtract fs-4"></i>
                </div>

                <div>
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="fw-bold text-dark mb-0 fs-16">{series.name}</h5>
                  </div>
                  <span className="text-muted small" style={{ fontSize: '12px' }}>
                    {(series.sizeRecords || []).length} sizes &bull; {(series.sizeRecords || []).length} sizes &bull; {series.description || `${(series.sizeRecords || []).length} sizes · Standard kurta run`}
                  </span>
                </div>
              </div>

              {/* Action Buttons matching Image 2 */}
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary rounded-3 px-2.5 py-1 small fw-semibold d-flex align-items-center gap-1"
                  onClick={() => {
                    setActiveSeriesForAddSize(series);
                    setNewSizeForm({ sizeName: '', displayName: '', description: '' });
                  }}
                  title="Add more size to this series"
                >
                  <i className="ti ti-plus"></i>
                  <span>Add Size</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-light text-secondary p-1.5 rounded-2"
                  title="Edit Series"
                  onClick={() => handleEditSeries(series)}
                >
                  <i className="ti ti-edit fs-5"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-light text-danger p-1.5 rounded-2"
                  title="Delete Series"
                  onClick={() => handleDeleteSeries(series.id, series.name)}
                >
                  <i className="ti ti-trash fs-5"></i>
                </button>
              </div>
            </div>

            {/* Individual Size Records Grid matching Image 1 & 2 (Reorderable via Drag & Drop) */}
            <div className="d-flex flex-wrap gap-2.5 pt-1">
              {(series.sizeRecords || []).map((sz, sIdx) => {
                const isDragging = draggedSize?.seriesId === series.id && draggedSize?.index === sIdx;
                const isOver = dragOverTarget?.seriesId === series.id && dragOverTarget?.index === sIdx;

                return (
                  <div
                    key={sz.id || `${series.id}-${sz.sizeName}-${sIdx}`}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, series.id, sIdx)}
                    onDragOver={(e) => handleDragOver(e, series.id, sIdx)}
                    onDragEnter={(e) => handleDragEnter(e, series.id, sIdx)}
                    onDrop={(e) => handleDrop(e, series.id, sIdx)}
                    onDragEnd={handleDragEnd}
                    className="rounded-pill border bg-white d-inline-flex align-items-center shadow-xs transition"
                    style={{
                      padding: '6px 14px',
                      gap: '8px',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      borderColor: isOver ? '#4f46e5' : isDragging ? '#93c5fd' : '#e2e8f0',
                      backgroundColor: isOver ? '#eef2ff' : isDragging ? '#f8fafc' : '#ffffff',
                      opacity: isDragging ? 0.35 : 1,
                      transform: isOver ? 'scale(1.05)' : isDragging ? 'scale(0.96)' : 'none',
                      boxShadow: isOver
                        ? '0 0 0 2px rgba(79, 70, 229, 0.3), 0 4px 10px rgba(79, 70, 229, 0.15)'
                        : '0 1px 2px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease'
                    }}
                    title="Drag and drop to reorder"
                  >
                    <span
                      className="text-muted d-flex align-items-center"
                      style={{ fontSize: '13px', opacity: 0.5, pointerEvents: 'none', letterSpacing: '-1px' }}
                    >
                      ⋮⋮
                    </span>
                    <span
                      className="text-muted small font-monospace"
                      style={{ fontSize: '12.5px', fontWeight: 500, pointerEvents: 'none', minWidth: '12px' }}
                    >
                      {sIdx + 1}
                    </span>
                    <strong
                      className="text-dark fw-bold"
                      style={{ fontSize: '13.5px', pointerEvents: 'none' }}
                    >
                      {sz.sizeName}
                    </strong>
                    {sz.displayName && (
                      <span
                        className="text-secondary text-uppercase"
                        style={{ fontSize: '11px', letterSpacing: '0.4px', fontWeight: 500, pointerEvents: 'none' }}
                      >
                        {sz.displayName}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredSeries.length === 0 && (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted bg-white">
            <i className="ti ti-ruler-off fs-1 d-block mb-2 text-secondary opacity-50"></i>
            No size series found matching "{searchTerm}". Click "+ Add New Size Series" above.
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT / CREATE SIZE SERIES (SECTION 5.1 & 5.2)                    */}
      {/* ========================================================================= */}
      {isEditingSeries && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 bg-white">
              <div className="modal-header border-bottom py-3 px-4">
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">
                    {isCreatingNewSeries ? 'Create New Size Series' : `Edit Size Series: ${seriesFormData.name}`}
                  </h5>
                  <p className="text-muted small mb-0">Section 5 &bull; Size Series and nested Size records</p>
                </div>
                <button type="button" className="btn-close" onClick={() => setIsEditingSeries(false)}></button>
              </div>

              <form onSubmit={handleSaveSeries}>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-4">
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold text-muted">Series ID</label>
                      <input type="text" className="form-control form-control-sm bg-light font-monospace" value={seriesFormData.id} readOnly />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label small fw-semibold text-muted">Series Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Alphabetic, Numeric, Roman"
                        required
                        value={seriesFormData.name}
                        onChange={(e) => setSeriesFormData({ ...seriesFormData, name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small fw-semibold text-muted">Display Order</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="e.g. 1"
                        value={seriesFormData.displayOrder ?? ''}
                        onChange={(e) => setSeriesFormData({ ...seriesFormData, displayOrder: e.target.value })}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small fw-semibold text-muted">Active Status</label>
                      <div className="form-check form-switch pt-1">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="seriesActiveModalCheck"
                          checked={seriesFormData.active}
                          onChange={(e) => setSeriesFormData({ ...seriesFormData, active: e.target.checked })}
                        />
                        <label className="form-check-label small fw-semibold" htmlFor="seriesActiveModalCheck">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Unlimited Size Records in this series (Section 5.1 & 5.2) */}
                  <div className="border rounded-4 p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-2.5">
                      <span className="fw-bold text-dark fs-14">
                        Size Records in this Series ({seriesFormData.sizeRecords.length})
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary rounded-2 px-2.5 py-1 small fw-semibold d-flex align-items-center gap-1"
                        onClick={handleAddMoreSizeRow}
                      >
                        <i className="ti ti-plus"></i>
                        <span>Add More Size</span>
                      </button>
                    </div>

                    <div className="table-responsive bg-white rounded-3 border">
                      <table className="table table-sm align-middle mb-0">
                        <thead className="table-light small text-muted text-uppercase">
                          <tr>
                            <th style={{ width: '40px' }}>#</th>
                            <th style={{ minWidth: '100px' }}>Size Name *</th>
                            <th style={{ minWidth: '140px' }}>Display Name</th>
                            <th style={{ minWidth: '160px' }}>Description</th>
                            <th style={{ width: '40px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {((seriesFormData.sizeRecords && seriesFormData.sizeRecords.length > 0)
                            ? seriesFormData.sizeRecords
                            : [{ id: `SZ-${seriesFormData.id || 'SER'}-01`, sizeName: '', displayName: '', description: '' }]
                          ).map((sz, rIdx, arr) => (
                            <tr
                              key={sz.id || rIdx}
                              draggable={arr.length > 1}
                              onDragStart={() => setModalDraggedIdx(rIdx)}
                              onDragOver={(e) => {
                                e.preventDefault();
                                setModalDragOverIdx(rIdx);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (modalDraggedIdx !== null && modalDraggedIdx !== rIdx) {
                                  handleReorderModalSizes(modalDraggedIdx, rIdx);
                                }
                                setModalDraggedIdx(null);
                                setModalDragOverIdx(null);
                              }}
                              onDragEnd={() => {
                                setModalDraggedIdx(null);
                                setModalDragOverIdx(null);
                              }}
                              style={{
                                cursor: arr.length > 1 ? 'move' : 'default',
                                opacity: modalDraggedIdx === rIdx ? 0.35 : 1,
                                backgroundColor: modalDragOverIdx === rIdx ? '#f0f4ff' : undefined,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <td className="text-muted small ps-2 font-monospace">
                                {arr.length > 1 && (
                                  <i className="ti ti-grip-vertical text-muted opacity-40 me-1" style={{ fontSize: '11px' }}></i>
                                )}
                                {rIdx + 1}
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm font-monospace fw-bold"
                                  placeholder="e.g. S, 32, XL"
                                  required
                                  value={sz.sizeName || ''}
                                  onChange={(e) => {
                                    const updated = [...(seriesFormData.sizeRecords || arr)];
                                    if (!updated[rIdx]) updated[rIdx] = { ...sz };
                                    updated[rIdx].sizeName = e.target.value.toUpperCase();
                                    setSeriesFormData({ ...seriesFormData, sizeRecords: updated });
                                  }}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="e.g. Small (36)"
                                  value={sz.displayName || ''}
                                  onChange={(e) => {
                                    const updated = [...(seriesFormData.sizeRecords || arr)];
                                    if (!updated[rIdx]) updated[rIdx] = { ...sz };
                                    updated[rIdx].displayName = e.target.value;
                                    setSeriesFormData({ ...seriesFormData, sizeRecords: updated });
                                  }}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="Optional description"
                                  value={sz.description || ''}
                                  onChange={(e) => {
                                    const updated = [...(seriesFormData.sizeRecords || arr)];
                                    if (!updated[rIdx]) updated[rIdx] = { ...sz };
                                    updated[rIdx].description = e.target.value;
                                    setSeriesFormData({ ...seriesFormData, sizeRecords: updated });
                                  }}
                                />
                              </td>
                              <td className="text-end pe-2">
                                {arr.length > 1 ? (
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-link text-danger p-0 text-decoration-none"
                                    onClick={() => handleRemoveSizeRow(rIdx)}
                                    title="Remove row"
                                  >
                                    <i className="ti ti-trash"></i>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-link text-muted p-0 text-decoration-none"
                                    onClick={() => handleRemoveSizeRow(rIdx)}
                                    title="Clear fields"
                                  >
                                    <i className="ti ti-backspace"></i>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top py-3 px-4">
                  <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setIsEditingSeries(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold">
                    <i className="ti ti-check me-1"></i> Save Size Series
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: QUICK "+ ADD MORE SIZE" POPUP (SECTION 5.2)                      */}
      {/* ========================================================================= */}
      {activeSeriesForAddSize && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 bg-white">
              <div className="modal-header border-bottom py-3 px-4">
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">
                    Add Size to Series: {activeSeriesForAddSize.name}
                  </h5>
                  <p className="text-muted small mb-0">Unlimited size records per series</p>
                </div>
                <button type="button" className="btn-close" onClick={() => setActiveSeriesForAddSize(null)}></button>
              </div>

              <form onSubmit={handleQuickAddSizeSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Size Name *</label>
                    <input
                      type="text"
                      className="form-control font-monospace fw-bold"
                      placeholder="e.g. S, 32, XL, 48"
                      required
                      autoFocus
                      value={newSizeForm.sizeName}
                      onChange={(e) => setNewSizeForm({ ...newSizeForm, sizeName: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Display Name (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="What's shown to user, if different"
                      value={newSizeForm.displayName}
                      onChange={(e) => setNewSizeForm({ ...newSizeForm, displayName: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Description (Multiline)</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Chest/waist measurement specifications"
                      value={newSizeForm.description}
                      onChange={(e) => setNewSizeForm({ ...newSizeForm, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-3 px-4">
                  <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setActiveSeriesForAddSize(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold">
                    <i className="ti ti-plus me-1"></i> Add Size Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
