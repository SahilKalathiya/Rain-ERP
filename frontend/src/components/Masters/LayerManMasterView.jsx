import React, { useState, useEffect } from 'react';

export const LAYER_MAN_STORAGE_KEY = 'erp_layer_men_v1';

const autoCapitalizeWords = (text) => {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/(^|\s)\S/g, (ch) => ch.toUpperCase());
};

export function getStoredLayerMen() {
  try {
    const raw = localStorage.getItem(LAYER_MAN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {}
  return [];
}

export function saveStoredLayerMen(list) {
  try {
    localStorage.setItem(LAYER_MAN_STORAGE_KEY, JSON.stringify(list || []));
    window.dispatchEvent(new Event('erp_layer_men_updated'));
  } catch (e) {}
}

export default function LayerManMasterView() {
  const [layerMen, setLayerMen] = useState(getStoredLayerMen);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const handleSync = () => setLayerMen(getStoredLayerMen());
    window.addEventListener('erp_layer_men_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('erp_layer_men_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', address: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      phone: item.phone || '',
      address: item.address || ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.replace(/\D/g, '').slice(0, 10);
    if (!trimmedName) {
      setFormError('Layer Man Name is required.');
      return;
    }
    if (trimmedPhone && trimmedPhone.length !== 10) {
      setFormError('Phone Number must be exactly 10 digits.');
      return;
    }

    const payload = {
      id: editingId || `LM-${Date.now()}`,
      name: autoCapitalizeWords(trimmedName),
      phone: trimmedPhone,
      address: formData.address.trim()
    };

    const nextList = editingId
      ? layerMen.map((x) => (x.id === editingId ? payload : x))
      : [payload, ...layerMen];

    setLayerMen(nextList);
    saveStoredLayerMen(nextList);
    setShowModal(false);
    showToastMsg(editingId ? `Updated "${trimmedName}".` : `Added Layer Man "${trimmedName}".`);
  };

  const handleDelete = (item) => {
    if (!window.confirm(`Delete Layer Man "${item.name}"?`)) return;
    const nextList = layerMen.filter((x) => x.id !== item.id);
    setLayerMen(nextList);
    saveStoredLayerMen(nextList);
    showToastMsg(`Deleted "${item.name}".`);
  };

  const filtered = layerMen.filter((item) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      (item.name || '').toLowerCase().includes(term) ||
      (item.phone || '').toLowerCase().includes(term) ||
      (item.address || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-4" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {toast && (
        <div
          className="alert alert-success shadow position-fixed bottom-0 end-0 m-4 d-flex align-items-center gap-2 fs-12 fw-semibold"
          style={{ zIndex: 1080 }}
        >
          <i className="ti ti-check fs-16"></i>
          <span>{toast}</span>
        </div>
      )}

      <div className="card border-0 shadow-sm p-3 px-4 mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h4 className="fw-bold text-dark mb-0 fs-18">Layer Man Master</h4>
            <div className="text-secondary fs-12 mt-0.5">
              Manage cutting floor Layer Men for Step 4 Cutting Sheet selection
            </div>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="btn btn-primary btn-sm px-3 fw-semibold d-flex align-items-center gap-1.5"
            style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
          >
            <i className="ti ti-plus fs-14"></i>
            <span>Add Layer Man</span>
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center gap-3">
          <div className="input-group input-group-sm" style={{ maxWidth: 400 }}>
            <span className="input-group-text bg-light border-end-0 text-muted">
              <i className="ti ti-search fs-14"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 fs-13"
              placeholder="Search name, phone, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="badge bg-light text-secondary border font-monospace fs-11">
            {filtered.length} Layer Men
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr className="text-secondary fs-11 fw-bold text-uppercase">
                <th className="ps-4">Name</th>
                <th>Phone Number</th>
                <th>Address</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-5 text-muted">
                    No Layer Men added yet. Click <strong>+ Add Layer Man</strong> to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="ps-4 fw-bold text-dark">{item.name}</td>
                    <td className="font-monospace fs-12 text-secondary">{item.phone || '—'}</td>
                    <td className="fs-12 text-secondary">{item.address || '—'}</td>
                    <td className="text-end pe-4">
                      <div className="d-inline-flex align-items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="btn btn-light border btn-xs px-2 py-1 text-primary"
                          title="Edit"
                        >
                          <i className="ti ti-edit fs-13"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="btn btn-light border btn-xs px-2 py-1 text-danger"
                          title="Delete"
                        >
                          <i className="ti ti-trash fs-13"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1060 }}
          onClick={() => setShowModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <form className="modal-content border-0 shadow-lg rounded-4" onSubmit={handleSave}>
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold fs-16 mb-0">
                  {editingId ? 'Edit Layer Man' : 'Add Layer Man'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>

              <div className="modal-body p-4 d-flex flex-column gap-3">
                {formError && (
                  <div className="alert alert-danger py-2 px-3 fs-12 fw-semibold mb-0">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="form-label fs-11 fw-bold text-secondary text-uppercase mb-1">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Layer Man name..."
                    value={formData.name}
                    onChange={(e) => {
                      setFormError('');
                      setFormData({ ...formData, name: autoCapitalizeWords(e.target.value) });
                    }}
                    className="form-control form-control-sm fw-semibold"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="form-label fs-11 fw-bold text-secondary text-uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter 10-digit phone number..."
                    value={formData.phone}
                    onChange={(e) => {
                      setFormError('');
                      setFormData({
                        ...formData,
                        phone: e.target.value.replace(/\D/g, '').slice(0, 10)
                      });
                    }}
                    className="form-control form-control-sm font-monospace"
                  />
                </div>

                <div>
                  <label className="form-label fs-11 fw-bold text-secondary text-uppercase mb-1">
                    Address
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter address..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <div className="modal-footer border-top px-4 py-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-light border btn-sm px-3 fw-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm px-4 fw-semibold"
                  style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                >
                  {editingId ? 'Save Changes' : 'Save Layer Man'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
