import React, { useState } from 'react';
import { initialCustomers, getStoredData, setStoredData } from '../../data/salesOrderData';

export default function CustomerMasterView({ isInline = false, onSaveInline, onCloseInline }) {
  const [customers, setCustomers] = useState(() => getStoredData('erp_customers_v1', initialCustomers));
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditing, setIsEditing] = useState(isInline);
  const [isCreatingNew, setIsCreatingNew] = useState(isInline);

  // Column Filters
  const [colFilters, setColFilters] = useState({
    id: '',
    name: '',
    type: '',
    phone: '',
    city: '',
    gstin: '',
    status: ''
  });

  // Form State
  const [formData, setFormData] = useState(() => ({
    id: isInline ? `CUST-${String(customers.length + 1).padStart(3, '0')}` : '',
    name: '',
    type: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    gstin: '',
    notes: '',
    active: true
  }));

  const saveCustomer = (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      alert('Customer Name is required');
      return;
    }

    // Auto capitalize words
    const capitalizedName = formData.name.replace(/\b\w/g, (c) => c.toUpperCase());
    const customerObj = {
      ...formData,
      type: formData.type || 'B2B Retailer',
      name: capitalizedName,
      id: formData.id || `CUST-${String(customers.length + 1).padStart(3, '0')}`
    };

    let updatedList;
    if (customers.some((c) => c.id === customerObj.id)) {
      updatedList = customers.map((c) => (c.id === customerObj.id ? customerObj : c));
    } else {
      updatedList = [customerObj, ...customers];
    }

    setCustomers(updatedList);
    setStoredData('erp_customers_v1', updatedList);

    if (isInline && onSaveInline) {
      onSaveInline(customerObj);
      return;
    }

    setSelectedCustomer(customerObj);
    setIsEditing(false);
    setIsCreatingNew(false);
  };

  const handleAddNew = () => {
    const newId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    setFormData({
      id: newId,
      name: '',
      type: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      gstin: '',
      notes: '',
      active: true
    });
    setSelectedCustomer(null);
    setIsCreatingNew(true);
    setIsEditing(true);
  };

  const filteredCustomers = customers.filter((c) => {
    return (
      (c.id || '').toLowerCase().includes(colFilters.id.toLowerCase()) &&
      (c.name || '').toLowerCase().includes(colFilters.name.toLowerCase()) &&
      (c.type || '').toLowerCase().includes(colFilters.type.toLowerCase()) &&
      (c.phone || '').toLowerCase().includes(colFilters.phone.toLowerCase()) &&
      (c.city || '').toLowerCase().includes(colFilters.city.toLowerCase()) &&
      (c.gstin || '').toLowerCase().includes(colFilters.gstin.toLowerCase()) &&
      (colFilters.status === '' || (colFilters.status === 'Active' ? c.active : !c.active))
    );
  });

  // Modal / Inline Container
  if (isInline) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content shadow-lg border-0 rounded-4">
            <div className="modal-header border-0 pb-0 px-4 pt-4">
              <div>
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <span className="badge bg-primary-subtle text-primary p-2 rounded-3">
                    <i className="ti ti-user-plus fs-5"></i>
                  </span>
                  Add New Customer
                </h5>
                <p className="text-muted small mb-0">Create a new customer master record inline</p>
              </div>
              <button type="button" className="btn-close" onClick={onCloseInline}></button>
            </div>
            <form onSubmit={saveCustomer}>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Customer Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Manyavar Trends Retail"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Customer Type *</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="">Select Customer Type...</option>
                      <option value="B2B Retailer">B2B Retailer</option>
                      <option value="Distributor">Distributor</option>
                      <option value="Direct Customer">Direct Customer</option>
                      <option value="Online Platform">Online Platform</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="10-digit number"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">GSTIN</label>
                    <input
                      type="text"
                      className="form-control text-uppercase"
                      placeholder="e.g. 24AAACM1234F1Z1"
                      maxLength={15}
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">City</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Surat"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">State</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Gujarat"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 px-4 pb-4">
                <button type="button" className="btn btn-light rounded-3 px-4" onClick={onCloseInline}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold">
                  <i className="ti ti-check me-1"></i> Save Customer
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
      {/* Header Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="ti ti-users text-primary"></i> Customer Master
          </h4>
          <p className="text-muted small mb-0">Route 1: Manage B2B retailers, distributors and direct retail buyers</p>
        </div>
        {!isEditing && (
          <button className="btn btn-primary d-flex align-items-center gap-2 rounded-3 px-4 fw-semibold" onClick={handleAddNew}>
            <i className="ti ti-plus"></i> Add New Customer
          </button>
        )}
      </div>

      {isEditing ? (
        /* Create / Edit Form */
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
            <h5 className="fw-bold text-dark mb-0">
              {isCreatingNew ? 'Create New Customer Master' : `Edit Customer: ${formData.name}`}
            </h5>
            <button className="btn btn-sm btn-outline-secondary rounded-3" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
          <form onSubmit={saveCustomer}>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label fw-semibold small text-muted">Customer ID</label>
                  <input type="text" className="form-control bg-light" value={formData.id} readOnly />
                </div>
                <div className="col-md-5">
                  <label className="form-label fw-semibold small text-muted">Customer Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Manyavar Trends Retail"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-muted">Customer Type *</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="">Select Customer Type...</option>
                    <option value="B2B Retailer">B2B Retailer</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Direct Customer">Direct Customer</option>
                    <option value="Online Platform">Online Platform</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-muted">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="10-digit number"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-muted">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="orders@customer.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-muted">GSTIN (15 characters)</label>
                  <input
                    type="text"
                    className="form-control text-uppercase"
                    placeholder="e.g. 24AAACM1234F1Z1"
                    maxLength={15}
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Address</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Street, Industrial Area"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold small text-muted">City</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Surat"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold small text-muted">State</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Gujarat"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <div className="form-check form-switch mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="activeCust"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="activeCust">
                      Active Customer Status
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-footer bg-light border-top py-3 px-4 d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary rounded-3 px-4" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold">
                <i className="ti ti-check me-1"></i> Save Customer
              </button>
            </div>
          </form>
        </div>
      ) : selectedCustomer ? (
        /* Read-Only View Mode (Universal Pattern) */
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
            <div>
              <span className="badge bg-primary-subtle text-primary px-3 py-1 rounded-pill me-2">
                {selectedCustomer.id}
              </span>
              <strong className="fs-5 text-dark">{selectedCustomer.name}</strong>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-primary btn-sm rounded-3 px-3"
                onClick={() => {
                  setFormData(selectedCustomer);
                  setIsCreatingNew(false);
                  setIsEditing(true);
                }}
              >
                <i className="ti ti-edit me-1"></i> Edit Section
              </button>
              <button className="btn btn-outline-secondary btn-sm rounded-3 px-3" onClick={() => setSelectedCustomer(null)}>
                Back to List
              </button>
            </div>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              <div className="col-md-4">
                <div className="text-muted small">Customer Type</div>
                <div className="fw-semibold text-dark fs-6">{selectedCustomer.type}</div>
              </div>
              <div className="col-md-4">
                <div className="text-muted small">Phone Number</div>
                <div className="fw-semibold text-dark fs-6">{selectedCustomer.phone || '—'}</div>
              </div>
              <div className="col-md-4">
                <div className="text-muted small">GSTIN</div>
                <div className="fw-semibold text-dark fs-6 font-monospace">{selectedCustomer.gstin || '—'}</div>
              </div>
              <div className="col-md-6">
                <div className="text-muted small">Email Address</div>
                <div className="fw-semibold text-dark">{selectedCustomer.email || '—'}</div>
              </div>
              <div className="col-md-6">
                <div className="text-muted small">Location</div>
                <div className="fw-semibold text-dark">
                  {selectedCustomer.address ? `${selectedCustomer.address}, ` : ''}
                  {selectedCustomer.city}, {selectedCustomer.state}
                </div>
              </div>
              <div className="col-12">
                <div className="text-muted small">Status</div>
                <span className={`badge ${selectedCustomer.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-3 py-1 rounded-pill mt-1`}>
                  {selectedCustomer.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List View with Column Header Search */
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="py-3 px-3 text-muted small fw-bold">CUSTOMER ID</th>
                  <th className="py-3 px-3 text-muted small fw-bold">NAME</th>
                  <th className="py-3 px-3 text-muted small fw-bold">TYPE</th>
                  <th className="py-3 px-3 text-muted small fw-bold">PHONE</th>
                  <th className="py-3 px-3 text-muted small fw-bold">CITY</th>
                  <th className="py-3 px-3 text-muted small fw-bold">GSTIN</th>
                  <th className="py-3 px-3 text-muted small fw-bold text-center">STATUS</th>
                  <th className="py-3 px-3 text-muted small fw-bold text-end">ACTIONS</th>
                </tr>
                {/* Column Search Filter Row */}
                <tr className="bg-white border-bottom">
                  <td className="p-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Filter ID..."
                      value={colFilters.id}
                      onChange={(e) => setColFilters({ ...colFilters, id: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Filter name..."
                      value={colFilters.name}
                      onChange={(e) => setColFilters({ ...colFilters, name: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Filter type..."
                      value={colFilters.type}
                      onChange={(e) => setColFilters({ ...colFilters, type: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Filter phone..."
                      value={colFilters.phone}
                      onChange={(e) => setColFilters({ ...colFilters, phone: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Filter city..."
                      value={colFilters.city}
                      onChange={(e) => setColFilters({ ...colFilters, city: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Filter GSTIN..."
                      value={colFilters.gstin}
                      onChange={(e) => setColFilters({ ...colFilters, gstin: e.target.value })}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <select
                      className="form-select form-select-sm"
                      value={colFilters.status}
                      onChange={(e) => setColFilters({ ...colFilters, status: e.target.value })}
                    >
                      <option value="">All</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedCustomer(cust)}>
                    <td className="px-3 fw-bold text-primary font-monospace">{cust.id}</td>
                    <td className="px-3 fw-semibold text-dark">{cust.name}</td>
                    <td className="px-3">
                      <span className="badge bg-light text-dark border px-2 py-1">{cust.type}</span>
                    </td>
                    <td className="px-3 text-muted">{cust.phone || '—'}</td>
                    <td className="px-3">{cust.city}</td>
                    <td className="px-3 font-monospace text-muted small">{cust.gstin || '—'}</td>
                    <td className="px-3 text-center">
                      <span className={`badge ${cust.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2 py-1 rounded-pill`}>
                        {cust.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 text-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-sm btn-light text-primary me-1"
                        title="View / Edit"
                        onClick={() => {
                          setSelectedCustomer(cust);
                        }}
                      >
                        <i className="ti ti-eye"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-light text-secondary"
                        title="Edit Customer"
                        onClick={() => {
                          setFormData(cust);
                          setIsCreatingNew(false);
                          setIsEditing(true);
                        }}
                      >
                        <i className="ti ti-edit"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted">
                      <i className="ti ti-users-minus fs-1 d-block mb-2 text-secondary opacity-50"></i>
                      No customers found matching filter criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
