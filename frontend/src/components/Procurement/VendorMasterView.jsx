import React, { useState } from 'react';
import { api } from '../../services/api';

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

/**
 * VendorMasterView - 3.1 Vendor Master
 * Supports: View Mode by default, Section-wise edit, Column filters, 
 * GSTIN 15-char format validation, 1-5 Star rating, and Inline creation.
 */
export default function VendorMasterView({
  vendors = [],
  onSaveVendor,
  onDeleteVendor,
  isInline = false,
  onCloseInline
}) {
  const [vendorList, setVendorList] = useState(vendors);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isEditing, setIsEditing] = useState(isInline);
  const [activeSection, setActiveSection] = useState(isInline ? 'all' : 'none'); // 'all', 'basic', 'contact', 'tax', 'bank'
  const [isCreatingNew, setIsCreatingNew] = useState(isInline);

  React.useEffect(() => {
    if (vendors && vendors.length > 0) {
      setVendorList(vendors);
    }
  }, [vendors]);

  // Column Filters
  const [colFilters, setColFilters] = useState({
    id: '',
    name: '',
    type: '',
    phone: '',
    city: '',
    gstin: '',
    rating: '',
    status: ''
  });

  // Form State
  const [formData, setFormData] = useState(() => {
    if (isInline) {
      return {
        id: `VEND-${String(vendors.length + 1).padStart(4, '0')}`,
        name: '',
        type: '',
        contactPerson: '',
        phone: '',
        alternatePhone: '',
        email: '',
        address: '',
        city: '',
        state: 'Gujarat',
        gstin: '',
        rating: 5,
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        active: true
      };
    }
    return {
      id: '',
      name: '',
      type: '',
      contactPerson: '',
      phone: '',
      alternatePhone: '',
      email: '',
      address: '',
      city: '',
      state: 'Gujarat',
      gstin: '',
      rating: 5,
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      active: true
    };
  });

  const [formErrors, setFormErrors] = useState({});

  const handleOpenNew = () => {
    setFormData({
      id: `VEND-${String(vendorList.length + 1).padStart(4, '0')}`,
      name: '',
      type: '',
      contactPerson: '',
      phone: '',
      alternatePhone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      gstin: '',
      rating: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      active: true
    });
    setFormErrors({});
    setIsCreatingNew(true);
    setIsEditing(true);
    setActiveSection('all');
    setSelectedVendor(null);
  };

  const handleSelectVendor = (vendor) => {
    setSelectedVendor(vendor);
    setFormData({ ...vendor });
    setIsCreatingNew(false);
    setIsEditing(true);
    setActiveSection('all');
  };

  // Capitalize word by word
  const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleTextChange = (field, val, autoCap = false) => {
    const value = autoCap ? capitalizeWords(val) : val;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Vendor Name is mandatory';
    if (formData.phone && formData.phone.length < 10)
      errors.phone = 'Phone Number must be 10 digits';
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email))
      errors.email = 'Invalid Email address format';
    if (formData.gstin && formData.gstin.length !== 15)
      errors.gstin = 'GSTIN must be exactly 15 characters';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const updatedVendor = {
      ...formData,
      name: capitalizeWords((formData.name || '').trim()),
      lastModifiedDate: new Date().toLocaleDateString('en-GB')
    };

    let updatedList;
    if (isCreatingNew) {
      updatedList = [updatedVendor, ...vendorList];
    } else {
      updatedList = vendorList.map((v) => (v.id === updatedVendor.id ? updatedVendor : v));
    }

    setVendorList(updatedList);
    setSelectedVendor(null);
    setIsEditing(false);
    setIsCreatingNew(false);

    if (onSaveVendor) {
      onSaveVendor(updatedVendor);
    }

    if (isInline && onCloseInline) {
      onCloseInline(updatedVendor);
    }
  };

  const handleDeleteVendor = (id, name, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete vendor "${name || id}"?`)) return;
    const updated = vendorList.filter((v) => v.id !== id);
    setVendorList(updated);
    if (selectedVendor?.id === id) {
      setSelectedVendor(null);
      setIsEditing(false);
      setIsCreatingNew(false);
    }
    try {
      localStorage.setItem('raindrop_vendors_v1', JSON.stringify(updated));
      window.dispatchEvent(new Event('raindrop_vendors_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {}
    if (api && api.deleteVendor) {
      try {
        api.deleteVendor(id);
      } catch (err) {}
    }
    if (onDeleteVendor) {
      onDeleteVendor(id);
    }
  };

  // Filtered List
  const filteredVendors = vendorList.filter((v) => {
    return (
      v.id.toLowerCase().includes(colFilters.id.toLowerCase()) &&
      v.name.toLowerCase().includes(colFilters.name.toLowerCase()) &&
      (colFilters.type === '' || v.type === colFilters.type) &&
      v.phone.includes(colFilters.phone) &&
      v.city.toLowerCase().includes(colFilters.city.toLowerCase()) &&
      (v.gstin || '').toLowerCase().includes(colFilters.gstin.toLowerCase()) &&
      (colFilters.rating === '' || String(v.rating) === colFilters.rating) &&
      (colFilters.status === '' || (v.active ? 'Active' : 'Inactive') === colFilters.status)
    );
  });

  return (
    <div className="container-fluid p-0">
      {/* Top Header */}
      {!isInline && (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-1 text-muted fs-12">
                <li className="breadcrumb-item">Masters</li>
                <li className="breadcrumb-item active text-primary fw-medium">Vendor Master</li>
              </ol>
            </nav>
            <h2 className="fw-bold text-dark mb-1 fs-24">Vendor Master </h2>
            <p className="text-secondary mb-0 fs-13">
              Raw Material Fabric Suppliers, Dyeing &amp; Job Work Vendors
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium shadow-sm rounded-3"
              onClick={handleOpenNew}
            >
              <i className="ti ti-plus fs-16"></i>
              <span>New Vendor</span>
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <div className="row g-4">
        {/* Table listing vendors with column filters */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold text-dark mb-0 fs-16">Registered Vendors</h5>
              <span className="badge bg-light text-secondary border px-2 py-1 fs-12">
                {filteredVendors.length} of {vendorList.length} Records
              </span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light text-secondary">
                  {/* Column Filter Inputs */}
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
                      <select
                        className="form-select form-select-sm fs-11"
                        value={colFilters.type}
                        onChange={(e) => setColFilters({ ...colFilters, type: e.target.value })}
                      >
                        <option value="">All Types</option>
                        {Array.from(new Set(vendorList.map((v) => v.type).filter(Boolean))).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
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
                      <input
                        type="text"
                        placeholder="Filter GSTIN"
                        className="form-control form-control-sm fs-11"
                        value={colFilters.gstin}
                        onChange={(e) => setColFilters({ ...colFilters, gstin: e.target.value })}
                      />
                    </th>
                    <th className="text-center">
                      <select
                        className="form-select form-select-sm fs-11"
                        value={colFilters.rating}
                        onChange={(e) => setColFilters({ ...colFilters, rating: e.target.value })}
                      >
                        <option value="">All ★</option>
                        <option value="5">5 ★</option>
                        <option value="4">4 ★</option>
                        <option value="3">3 ★</option>
                      </select>
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
                    <th>Vendor ID</th>
                    <th>Vendor Name</th>
                    <th>Type</th>
                    <th>Phone</th>
                    <th>GSTIN</th>
                    <th className="text-center">Rating</th>
                    <th>Status</th>
                    <th className="text-end" style={{ width: '80px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((v) => {
                    const isSelected = selectedVendor?.id === v.id;
                    return (
                      <tr
                        key={v.id}
                        className={`cursor-pointer ${isSelected ? 'table-primary' : ''}`}
                        onClick={() => handleSelectVendor(v)}
                      >
                        <td className="fw-semibold text-primary">{v.id}</td>
                        <td className="fw-medium text-dark">{v.name}</td>
                        <td>
                          <span className="badge bg-light text-secondary border">{v.type}</span>
                        </td>
                        <td>{v.phone}</td>
                        <td className="font-monospace fs-12">{v.gstin || '-'}</td>
                        <td className="text-center text-warning">
                          {'★'.repeat(v.rating || 5)}
                          <span className="text-muted">{'☆'.repeat(5 - (v.rating || 5))}</span>
                        </td>
                        <td>
                          <span
                            className={`badge px-2 py-1 ${
                              v.active
                                ? 'bg-success-subtle text-success'
                                : 'bg-secondary-subtle text-secondary'
                            }`}
                          >
                            {v.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn btn-sm btn-light text-danger p-1.5 rounded-2"
                            title="Delete Vendor"
                            onClick={(e) => handleDeleteVendor(v.id, v.name || v.id, e)}
                          >
                            <i className="ti ti-trash fs-5"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredVendors.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted">
                        No vendors found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* POPUP MODAL: View / Edit / Create Vendor Dialog */}
        {(selectedVendor || isCreatingNew) && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg rounded-4 p-4 bg-white">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary-subtle text-primary p-2 rounded-3">
                      <i className="ti ti-building fs-5"></i>
                    </span>
                    <div>
                      <h5 className="fw-bold text-dark mb-0 fs-18">
                        {isCreatingNew ? 'Create New Vendor' : formData.name || formData.id}
                      </h5>
                      <span className="badge bg-light text-secondary border mt-1">{formData.id}</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {!isEditing && (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm px-3 d-flex align-items-center gap-1 rounded-3"
                        onClick={() => {
                          setIsEditing(true);
                          setActiveSection('all');
                        }}
                      >
                        <i className="ti ti-edit fs-14"></i>
                        <span>Edit All</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-close ms-2"
                      onClick={() => {
                        setSelectedVendor(null);
                        setIsCreatingNew(false);
                        setIsEditing(false);
                        if (isInline && onCloseInline) onCloseInline(null);
                      }}
                    ></button>
                  </div>
                </div>

                <form onSubmit={handleSave}>
                  <div style={{ maxHeight: 'calc(80vh - 140px)', overflowY: 'auto', paddingRight: '4px' }}>
                {/* SECTION 1: Basic Information */}
                <div className="mb-4 p-3 bg-light rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-bold text-secondary fs-12 text-uppercase tracking-wider">
                      1. Basic Information
                    </span>
                    {!isEditing && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-primary fs-12 text-decoration-none"
                        onClick={() => {
                          setIsEditing(true);
                          setActiveSection('basic');
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="row g-2">
                    <div className="col-12">
                      <label className="form-label fs-12 fw-semibold mb-1">Vendor Name *</label>
                      {isEditing && (activeSection === 'all' || activeSection === 'basic') ? (
                        <>
                          <input
                            type="text"
                            required
                            className={`form-control form-control-sm bg-white ${
                              formErrors.name ? 'is-invalid' : ''
                            }`}
                            value={formData.name}
                            onChange={(e) => handleTextChange('name', e.target.value, true)}
                          />
                          <div className="form-text small text-muted">Auto-capitalised word by word</div>
                        </>
                      ) : (
                        <div className="fw-semibold text-dark fs-14">{formData.name || '-'}</div>
                      )}
                    </div>

                    <div className="col-6">
                      <label className="form-label fs-12 fw-semibold mb-1">Vendor Type *</label>
                      {isEditing && (activeSection === 'all' || activeSection === 'basic') ? (
                        <>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-white"
                            placeholder="e.g. Fabric Supplier, Job Worker..."
                            value={formData.type || ''}
                            onChange={(e) => handleTextChange('type', e.target.value, true)}
                            list="vendor-type-options"
                          />
                          <datalist id="vendor-type-options">
                            <option value="Fabric Supplier" />
                            <option value="Job Worker" />
                            <option value="Dyeing & Printing" />
                            <option value="Embroidery" />
                            <option value="Washing" />
                            <option value="Trims & Accessories" />
                          </datalist>
                        </>
                      ) : (
                        <div className="text-secondary fs-13">{formData.type || '—'}</div>
                      )}
                    </div>

                    <div className="col-6">
                      <label className="form-label fs-12 fw-semibold mb-1">Rating (1-5 ★)</label>
                      {isEditing && (activeSection === 'all' || activeSection === 'basic') ? (
                        <div className="d-flex align-items-center gap-1 cursor-pointer text-warning fs-18">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              onClick={() => setFormData({ ...formData, rating: star })}
                            >
                              {star <= formData.rating ? '★' : '☆'}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-warning fs-14">
                          {'★'.repeat(formData.rating || 5)}
                        </div>
                      )}
                    </div>

                    <div className="col-12 mt-2">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="activeToggle"
                          disabled={!isEditing}
                          checked={formData.active}
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        />
                        <label className="form-check-label fs-12 fw-semibold" htmlFor="activeToggle">
                          Active Vendor (Available for new POs/GRNs)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Contact & Address */}
                <div className="mb-4 p-3 bg-light rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-bold text-secondary fs-12 text-uppercase tracking-wider">
                      2. Contact &amp; Address
                    </span>
                    {!isEditing && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-primary fs-12 text-decoration-none"
                        onClick={() => {
                          setIsEditing(true);
                          setActiveSection('contact');
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label fs-12 fw-semibold mb-1">Phone Number</label>
                      {isEditing && (activeSection === 'all' || activeSection === 'contact') ? (
                        <input
                          type="text"
                          maxLength="10"
                          placeholder="e.g. 9876543210"
                          className="form-control form-control-sm bg-white"
                          value={formData.phone}
                          onChange={(e) => handleTextChange('phone', e.target.value.replace(/\D/g, ''))}
                        />
                      ) : (
                        <div className="text-dark fs-13">{formData.phone || '-'}</div>
                      )}
                    </div>

                    <div className="col-6">
                      <label className="form-label fs-12 fw-semibold mb-1">Contact Person</label>
                      {isEditing && (activeSection === 'all' || activeSection === 'contact') ? (
                        <input
                          type="text"
                          placeholder="e.g. Rajesh Shah"
                          className="form-control form-control-sm bg-white"
                          value={formData.contactPerson}
                          onChange={(e) => handleTextChange('contactPerson', e.target.value, true)}
                        />
                      ) : (
                        <div className="text-dark fs-13">{formData.contactPerson || '-'}</div>
                      )}
                    </div>

                    <div className="col-12">
                      <label className="form-label fs-12 fw-semibold mb-1">Email</label>
                      {isEditing && (activeSection === 'all' || activeSection === 'contact') ? (
                        <input
                          type="email"
                          placeholder="e.g. contact@supplier.com"
                          className="form-control form-control-sm bg-white"
                          value={formData.email}
                          onChange={(e) => handleTextChange('email', e.target.value)}
                        />
                      ) : (
                        <div className="text-dark fs-13">{formData.email || '-'}</div>
                      )}
                    </div>

                    <div className="col-12">
                      <label className="form-label fs-12 fw-semibold mb-1">Address</label>
                      {isEditing && (activeSection === 'all' || activeSection === 'contact') ? (
                        <textarea
                          rows="2"
                          placeholder="e.g. Plot No. 42, GIDC Industrial Estate"
                          className="form-control form-control-sm bg-white fs-12"
                          value={formData.address}
                          onChange={(e) => handleTextChange('address', e.target.value)}
                        ></textarea>
                      ) : (
                        <div className="text-secondary fs-13">{formData.address || '-'}</div>
                      )}
                    </div>

                    <div className="col-6">
                      <label className="form-label fs-12 fw-semibold mb-1">City</label>
                      {isEditing && (activeSection === 'all' || activeSection === 'contact') ? (
                        <input
                          type="text"
                          placeholder="e.g. Surat"
                          className="form-control form-control-sm bg-white"
                          value={formData.city}
                          onChange={(e) => handleTextChange('city', e.target.value, true)}
                        />
                      ) : (
                        <div className="text-dark fs-13">{formData.city || '-'}</div>
                      )}
                    </div>

                      <div className="col-6">
                        <label className="form-label fs-12 fw-semibold mb-1">State</label>
                        {isEditing && (activeSection === 'all' || activeSection === 'contact') ? (
                          <select
                            className="form-select form-select-sm bg-white"
                            value={formData.state || ''}
                            onChange={(e) => handleTextChange('state', e.target.value)}
                          >
                            <option value="">Select State</option>
                            {INDIAN_STATES.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-dark fs-13">{formData.state || '-'}</div>
                        )}
                      </div>
                  </div>
                </div>

                {/* SECTION 3: Tax & Banking Information */}
                <div className="mb-4 p-3 bg-light rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-bold text-secondary fs-12 text-uppercase tracking-wider">
                      3. GSTIN &amp; Banking Details
                    </span>
                    {!isEditing && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-primary fs-12 text-decoration-none"
                        onClick={() => {
                          setIsEditing(true);
                          setActiveSection('tax');
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="row g-2">
                    <div className="col-12">
                      <label className="form-label fs-12 fw-semibold mb-1">GSTIN (15 Digits)</label>
                      {isEditing && (activeSection === 'all' || activeSection === 'tax') ? (
                        <input
                          type="text"
                          maxLength="15"
                          placeholder="e.g. 24AFQPA0986G1ZA"
                          className={`form-control form-control-sm bg-white font-monospace text-uppercase ${
                            formErrors.gstin ? 'is-invalid' : ''
                          }`}
                          value={formData.gstin}
                          onChange={(e) => handleTextChange('gstin', e.target.value.toUpperCase())}
                        />
                      ) : (
                        <div className="font-monospace fw-bold text-dark fs-13">
                          {formData.gstin || '-'}
                        </div>
                      )}
                    </div>

                    <div className="col-12">
                      <label className="form-label fs-12 fw-semibold mb-1">Bank Name</label>
                      {isEditing && (activeSection === 'all' || activeSection === 'tax') ? (
                        <input
                          type="text"
                          placeholder="e.g. HDFC Bank"
                          className="form-control form-control-sm bg-white"
                          value={formData.bankName}
                          onChange={(e) => handleTextChange('bankName', e.target.value, true)}
                        />
                      ) : (
                        <div className="text-dark fs-13">{formData.bankName || '-'}</div>
                      )}
                    </div>

                    <div className="col-6">
                      <label className="form-label fs-12 fw-semibold mb-1">Account Number</label>
                      {isEditing && (activeSection === 'all' || activeSection === 'tax') ? (
                        <input
                          type="text"
                          placeholder="e.g. 50200012345678"
                          className="form-control form-control-sm bg-white font-monospace"
                          value={formData.accountNumber}
                          onChange={(e) => handleTextChange('accountNumber', e.target.value)}
                        />
                      ) : (
                        <div className="font-monospace text-dark fs-13">
                          {formData.accountNumber || '-'}
                        </div>
                      )}
                    </div>

                    <div className="col-6">
                      <label className="form-label fs-12 fw-semibold mb-1">IFSC Code</label>
                      {isEditing && (activeSection === 'all' || activeSection === 'tax') ? (
                        <input
                          type="text"
                          maxLength="11"
                          placeholder="e.g. HDFC0001234"
                          className="form-control form-control-sm bg-white font-monospace text-uppercase"
                          value={formData.ifscCode}
                          onChange={(e) => handleTextChange('ifscCode', e.target.value.toUpperCase())}
                        />
                      ) : (
                        <div className="font-monospace text-dark fs-13">
                          {formData.ifscCode || '-'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                  </div>

                  {/* Modal Footer Buttons */}
                  <div className="d-flex align-items-center justify-content-end gap-2 pt-3 border-top mt-3">
                    <button
                      type="button"
                      className="btn btn-light px-4 rounded-3"
                      onClick={() => {
                        setSelectedVendor(null);
                        setIsCreatingNew(false);
                        setIsEditing(false);
                        if (isInline && onCloseInline) onCloseInline(null);
                      }}
                    >
                      {isEditing ? 'Cancel' : 'Close'}
                    </button>
                    {isEditing && (
                      <button type="submit" className="btn btn-primary px-4 fw-semibold rounded-3 shadow-sm">
                        <i className="ti ti-check me-1"></i> Save Vendor
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
