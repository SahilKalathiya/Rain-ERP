import React, { useState } from 'react';
import { api } from '../../services/api';

/**
 * TransporterMasterView - 3.3 Transporter Master
 * Minimal master for carriers/transporters, supports column filters,
 * view mode by default with edit, and inline creation for GRN.
 */
export default function TransporterMasterView({
  transporters = [],
  onSaveTransporter,
  onDeleteTransporter,
  isInline = false,
  onCloseInline
}) {
  const [transporterList, setTransporterList] = useState(transporters);
  const [selectedTransporter, setSelectedTransporter] = useState(null);
  const [isEditing, setIsEditing] = useState(isInline);
  const [isCreatingNew, setIsCreatingNew] = useState(isInline);

  React.useEffect(() => {
    if (transporters && transporters.length > 0) {
      setTransporterList(transporters);
    }
  }, [transporters]);

  // Column Filters
  const [colFilters, setColFilters] = useState({
    id: '',
    name: '',
    phone: '',
    status: ''
  });

  const [formData, setFormData] = useState(() => {
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    return {
      id: `TRANS-${nextNum}`,
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      gstin: '',
      vehicleTypes: [],
      active: true
    };
  });

  const handleOpenNew = () => {
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      id: `TRANS-${nextNum}`,
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      gstin: '',
      vehicleTypes: [],
      active: true
    });
    setIsCreatingNew(true);
    setIsEditing(true);
    setSelectedTransporter(null);
  };

  const handleSelect = (t) => {
    setSelectedTransporter(t);
    setFormData({ ...t });
    setIsCreatingNew(false);
    setIsEditing(false);
  };

  const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) {
      alert('Transporter Name is mandatory');
      return;
    }

    const dataToSave = {
      ...formData,
      name: capitalizeWords((formData.name || '').trim())
    };

    let updatedList;
    if (isCreatingNew) {
      updatedList = [dataToSave, ...transporterList];
    } else {
      updatedList = transporterList.map((t) => (t.id === dataToSave.id ? dataToSave : t));
    }

    setTransporterList(updatedList);
    setSelectedTransporter(dataToSave);
    setIsEditing(false);
    setIsCreatingNew(false);

    if (onSaveTransporter) {
      onSaveTransporter(dataToSave);
    }

    if (isInline && onCloseInline) {
      onCloseInline(dataToSave);
    }
  };

  const handleDeleteTransporter = (id, name, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete transporter "${name || id}"?`)) return;
    const updated = transporterList.filter((t) => t.id !== id);
    setTransporterList(updated);
    if (selectedTransporter?.id === id) {
      setSelectedTransporter(null);
      setIsEditing(false);
      setIsCreatingNew(false);
    }
    try {
      localStorage.setItem('raindrop_transporters_v1', JSON.stringify(updated));
      window.dispatchEvent(new Event('raindrop_transporters_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {}
    if (api && api.deleteTransporter) {
      try {
        api.deleteTransporter(id);
      } catch (err) {}
    }
    if (onDeleteTransporter) {
      onDeleteTransporter(id);
    }
  };

  const filtered = transporterList.filter((t) => {
    return (
      t.id.toLowerCase().includes(colFilters.id.toLowerCase()) &&
      t.name.toLowerCase().includes(colFilters.name.toLowerCase()) &&
      t.phone.includes(colFilters.phone) &&
      (colFilters.status === '' || (t.active ? 'Active' : 'Inactive') === colFilters.status)
    );
  });

  return (
    <div className="container-fluid p-0">
      {!isInline && (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-1 text-muted fs-12">
                <li className="breadcrumb-item">Masters</li>
                <li className="breadcrumb-item active text-primary fw-medium">Transporter Master</li>
              </ol>
            </nav>
            <h2 className="fw-bold text-dark mb-1 fs-24">Transporter Master</h2>
            <p className="text-secondary mb-0 fs-13">
              Logistics Carriers &amp; Transport Agencies for GRN Inward Bilty Tracking
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium shadow-sm rounded-3"
            onClick={handleOpenNew}
          >
            <i className="ti ti-plus fs-16"></i>
            <span>New Transporter</span>
          </button>
        </div>
      )}

      <div className="row g-4">
        {/* Table Column */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold text-dark mb-0 fs-16">Transporters List</h5>
              <span className="badge bg-light text-secondary border px-2 py-1 fs-12">
                {filtered.length} Carriers
              </span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light text-secondary">
                  <tr className="bg-light">
                    <th>
                      <input
                        type="text"
                        placeholder="Filter Name"
                        className="form-control form-control-sm fs-11"
                        value={colFilters.name}
                        onChange={(e) => setColFilters({ ...colFilters, name: e.target.value })}
                      />
                    </th>
                    <th>
                      <input
                        type="text"
                        placeholder="Filter Phone"
                        className="form-control form-control-sm fs-11"
                        value={colFilters.phone}
                        onChange={(e) => setColFilters({ ...colFilters, phone: e.target.value })}
                      />
                    </th>
                    <th>
                      <select
                        className="form-select form-select-sm fs-11"
                        value={colFilters.status}
                        onChange={(e) => setColFilters({ ...colFilters, status: e.target.value })}
                      >
                        <option value="">All</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </th>
                    <th style={{ width: '80px' }}></th>
                  </tr>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th className="text-end" style={{ width: '80px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const isSelected = selectedTransporter?.id === t.id;
                    return (
                      <tr
                        key={t.id}
                        className={`cursor-pointer ${isSelected ? 'table-primary' : ''}`}
                        onClick={() => handleSelect(t)}
                      >
                        <td className="fw-medium text-dark">{t.name}</td>
                        <td>{t.phone || '-'}</td>
                        <td>
                          <span
                            className={`badge px-2 py-1 ${
                              t.active
                                ? 'bg-success-subtle text-success'
                                : 'bg-secondary-subtle text-secondary'
                            }`}
                          >
                            {t.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn btn-sm btn-light text-primary p-1.5 rounded-2 me-1"
                            title="Edit Transporter"
                            onClick={() => {
                              handleSelect(t);
                              setIsEditing(true);
                            }}
                          >
                            <i className="ti ti-edit fs-5"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-light text-danger p-1.5 rounded-2"
                            title="Delete Transporter"
                            onClick={(e) => handleDeleteTransporter(t.id, t.name || t.id, e)}
                          >
                            <i className="ti ti-trash fs-5"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted">
                        No transporters found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* POPUP MODAL: View / Edit / Create Transporter Dialog */}
        {(selectedTransporter || isCreatingNew) && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg rounded-4 p-4 bg-white">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary-subtle text-primary p-2 rounded-3">
                      <i className="ti ti-truck fs-5"></i>
                    </span>
                    <div>
                      <h5 className="fw-bold text-dark mb-0 fs-18">
                        {isCreatingNew ? 'Create New Transporter' : formData.name || 'Transporter Details'}
                      </h5>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {!isEditing && (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm px-3 d-flex align-items-center gap-1 rounded-3"
                        onClick={() => setIsEditing(true)}
                      >
                        <i className="ti ti-edit fs-14"></i>
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-close ms-2"
                      onClick={() => {
                        setSelectedTransporter(null);
                        setIsCreatingNew(false);
                        setIsEditing(false);
                        if (isInline && onCloseInline) onCloseInline(null);
                      }}
                    ></button>
                  </div>
                </div>

                <form onSubmit={handleSave}>
                  <div style={{ maxHeight: 'calc(80vh - 140px)', overflowY: 'auto', paddingRight: '4px' }}>
                <div className="mb-3 p-3 bg-light rounded-3">
                  <div className="mb-2">
                    <label className="form-label fs-12 fw-semibold mb-1">Transporter Name *</label>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Keshav Freight Carriers"
                          className="form-control form-control-sm bg-white"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: capitalizeWords(e.target.value) })
                          }
                        />
                        <div className="form-text small text-muted">Auto-capitalised word by word</div>
                      </>
                    ) : (
                      <div className="fw-bold text-dark fs-15">{formData.name || '-'}</div>
                    )}
                  </div>

                  <div className="mb-2">
                    <label className="form-label fs-12 fw-semibold mb-1">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="text"
                        maxLength="10"
                        placeholder="10-digit number"
                        className="form-control form-control-sm bg-white"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })
                        }
                      />
                    ) : (
                      <div className="text-dark fs-13">{formData.phone || '-'}</div>
                    )}
                  </div>

                  <div className="mb-2">
                    <label className="form-label fs-12 fw-semibold mb-1">Address</label>
                    {isEditing ? (
                      <textarea
                        rows="2"
                        placeholder="Godown or office address"
                        className="form-control form-control-sm bg-white fs-12"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      ></textarea>
                    ) : (
                      <div className="text-secondary fs-13">{formData.address || '-'}</div>
                    )}
                  </div>

                  <div className="mt-2">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="transActive"
                        disabled={!isEditing}
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      />
                      <label className="form-check-label fs-12 fw-semibold" htmlFor="transActive">
                        Active Transporter
                      </label>
                    </div>
                  </div>
                </div>

                  </div>

                  {/* Modal Footer Controls */}
                  <div className="d-flex align-items-center justify-content-end gap-2 pt-3 border-top mt-3">
                    <button
                      type="button"
                      className="btn btn-light px-4 rounded-3"
                      onClick={() => {
                        setSelectedTransporter(null);
                        setIsCreatingNew(false);
                        setIsEditing(false);
                        if (isInline && onCloseInline) onCloseInline(null);
                      }}
                    >
                      {isEditing ? 'Cancel' : 'Close'}
                    </button>
                    {isEditing && (
                      <button type="submit" className="btn btn-primary px-4 fw-semibold rounded-3 shadow-sm">
                        <i className="ti ti-check me-1"></i> Save Transporter
                      </button>
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
