import React, { useState } from 'react';

/**
 * VendorMasterView - 3.1 Vendor Master
 * Supports: View Mode by default, Section-wise edit, Column filters, 
 * GSTIN 15-char format validation, 1-5 Star rating, and Inline creation.
 */
export default function VendorMasterView({
  vendors = [],
  onSaveVendor,
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
        type: 'Fabric Supplier',
        contactPerson: '',
        phone: '',
        alternatePhone: '',
        email: '',
        address: '',
        city: '',
        state: 'Maharashtra',
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
      type: 'Fabric Supplier',
      contactPerson: '',
      phone: '',
      alternatePhone: '',
      email: '',
      address: '',
      city: '',
      state: 'Maharashtra',
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
      type: 'Fabric Supplier',
      contactPerson: '',
      phone: '',
      alternatePhone: '',
      email: '',
      address: '',
      city: '',
      state: 'Maharashtra',
      gstin: '',
      rating: 5,
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
    setIsEditing(false);
    setActiveSection('none');
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
    if (!formData.phone || formData.phone.length < 10)
      errors.phone = '10-digit Phone Number is mandatory';
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
      lastModifiedDate: new Date().toLocaleDateString('en-GB')
    };

    let updatedList;
    if (isCreatingNew) {
      updatedList = [updatedVendor, ...vendorList];
    } else {
      updatedList = vendorList.map((v) => (v.id === updatedVendor.id ? updatedVendor : v));
    }

    setVendorList(updatedList);
    setSelectedVendor(updatedVendor);
    setIsEditing(false);
    setIsCreatingNew(false);

    if (onSaveVendor) {
      onSaveVendor(updatedVendor);
    }

    if (isInline && onCloseInline) {
      onCloseInline(updatedVendor);
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
        {/* Left Side: Table listing vendors with column filters */}
        <div className={selectedVendor || isCreatingNew ? 'col-12 col-xl-7' : 'col-12'}>
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
                        <option value="Fabric Supplier">Fabric Supplier</option>
                        <option value="Job Worker">Job Worker</option>
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
                  </tr>
                  <tr>
                    <th>Vendor ID</th>
                    <th>Vendor Name</th>
                    <th>Type</th>
                    <th>Phone</th>
                    <th>GSTIN</th>
                    <th className="text-center">Rating</th>
                    <th>Status</th>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: View Mode by default with Section-wise Edit (Section 9.2) */}
        {(selectedVendor || isCreatingNew) && (
          <div className="col-12 col-xl-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '80px' }}>
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <h5 className="fw-bold text-dark mb-0 fs-18">
                    {isCreatingNew ? 'Create New Vendor' : formData.name || formData.id}
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
                      onClick={() => {
                        setIsEditing(true);
                        setActiveSection('all');
                      }}
                    >
                      <i className="ti ti-edit fs-14"></i>
                      <span>Edit All</span>
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
                        <input
                          type="text"
                          required
                          className={`form-control form-control-sm bg-white ${
                            formErrors.name ? 'is-invalid' : ''
                          }`}
                          value={formData.name}
                          onChange={(e) => handleTextChange('name', e.target.value, true)}
                        />
                      ) : (
                        <div className="fw-semibold text-dark fs-14">{formData.name || '-'}</div>
                      )}
                    </div>

                    <div className="col-6">
                      <label className="form-label fs-12 fw-semibold mb-1">Vendor Type *</label>
                      {isEditing && (activeSection === 'all' || activeSection === 'basic') ? (
                        <select
                          className="form-select form-select-sm bg-white"
                          value={formData.type}
                          onChange={(e) => handleTextChange('type', e.target.value)}
                        >
                          <option value="Fabric Supplier">Fabric Supplier</option>
                          <option value="Job Worker">Job Worker</option>
                        </select>
                      ) : (
                        <div className="text-secondary fs-13">{formData.type}</div>
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
                      <label className="form-label fs-12 fw-semibold mb-1">Phone Number *</label>
                      {isEditing && (activeSection === 'all' || activeSection === 'contact') ? (
                        <input
                          type="text"
                          required
                          maxLength="10"
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
                            value={formData.state}
                            onChange={(e) => handleTextChange('state', e.target.value)}
                          >
                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                            <option value="Assam">Assam</option>
                            <option value="Bihar">Bihar</option>
                            <option value="Chhattisgarh">Chhattisgarh</option>
                            <option value="Goa">Goa</option>
                            <option value="Gujarat">Gujarat</option>
                            <option value="Haryana">Haryana</option>
                            <option value="Himachal Pradesh">Himachal Pradesh</option>
                            <option value="Jharkhand">Jharkhand</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Kerala">Kerala</option>
                            <option value="Madhya Pradesh">Madhya Pradesh</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Manipur">Manipur</option>
                            <option value="Meghalaya">Meghalaya</option>
                            <option value="Mizoram">Mizoram</option>
                            <option value="Nagaland">Nagaland</option>
                            <option value="Odisha">Odisha</option>
                            <option value="Punjab">Punjab</option>
                            <option value="Rajasthan">Rajasthan</option>
                            <option value="Sikkim">Sikkim</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Telangana">Telangana</option>
                            <option value="Tripura">Tripura</option>
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="Uttarakhand">Uttarakhand</option>
                            <option value="West Bengal">West Bengal</option>
                            <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                            <option value="Chandigarh">Chandigarh</option>
                            <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                            <option value="Ladakh">Ladakh</option>
                            <option value="Lakshadweep">Lakshadweep</option>
                            <option value="Puducherry">Puducherry</option>
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
                          placeholder="e.g. 27AFQPA0986G1ZA"
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

                {/* Form Buttons */}
                {isEditing && (
                  <div className="d-flex align-items-center justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-light btn-sm px-3"
                      onClick={() => {
                        if (isCreatingNew) setSelectedVendor(null);
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm px-4 fw-medium shadow-sm">
                      Save Vendor
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
