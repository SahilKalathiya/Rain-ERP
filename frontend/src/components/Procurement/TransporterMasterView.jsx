import React, { useState } from 'react';

/**
 * TransporterMasterView - 3.3 Transporter Master
 * Minimal master for carriers/transporters, supports column filters,
 * view mode by default with edit, and inline creation for GRN.
 */
export default function TransporterMasterView({
  transporters = [],
  onSaveTransporter,
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
      city: 'Surat',
      state: 'Gujarat',
      gstin: '',
      vehicleTypes: ['Tempo', 'Truck'],
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
      city: 'Surat',
      state: 'Gujarat',
      gstin: '',
      vehicleTypes: ['Tempo', 'Truck'],
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

    let updatedList;
    if (isCreatingNew) {
      updatedList = [formData, ...transporterList];
    } else {
      updatedList = transporterList.map((t) => (t.id === formData.id ? formData : t));
    }

    setTransporterList(updatedList);
    setSelectedTransporter(formData);
    setIsEditing(false);
    setIsCreatingNew(false);

    if (onSaveTransporter) {
      onSaveTransporter(formData);
    }

    if (isInline && onCloseInline) {
      onCloseInline(formData);
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
        <div className={selectedTransporter || isCreatingNew ? 'col-12 col-xl-7' : 'col-12'}>
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
                        placeholder="Filter ID"
                        className="form-control form-control-sm fs-11"
                        value={colFilters.id}
                        onChange={(e) => setColFilters({ ...colFilters, id: e.target.value })}
                      />
                    </th>
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
                  </tr>
                  <tr>
                    <th>Transporter ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Status</th>
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
                        <td className="fw-semibold text-primary">{t.id}</td>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* View / Edit Mode */}
        {(selectedTransporter || isCreatingNew) && (
          <div className="col-12 col-xl-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '80px' }}>
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <h5 className="fw-bold text-dark mb-0 fs-18">
                    {isCreatingNew ? 'Create New Transporter' : formData.name || formData.id}
                  </h5>
                  {!isCreatingNew && (
                    <span className="badge bg-light text-secondary border">{formData.id}</span>
                  )}
                </div>

                <div className="d-flex align-items-center gap-2">
                  {!isEditing && (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm px-3 d-flex align-items-center gap-1"
                      onClick={() => setIsEditing(true)}
                    >
                      <i className="ti ti-edit fs-14"></i>
                      <span>Edit</span>
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
                <div className="mb-3 p-3 bg-light rounded-3">
                  <div className="mb-2">
                    <label className="form-label fs-12 fw-semibold mb-1">Transporter Name *</label>
                    {isEditing ? (
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

                {isEditing && (
                  <div className="d-flex align-items-center justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-light btn-sm px-3"
                      onClick={() => {
                        if (isCreatingNew) setSelectedTransporter(null);
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm px-4 fw-medium shadow-sm">
                      Save Transporter
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
