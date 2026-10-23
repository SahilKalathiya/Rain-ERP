import React, { useState, useMemo, useEffect } from 'react';
import { initialCustomers, getStoredData, setStoredData } from '../../data/salesOrderData';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const CUSTOMER_TYPES = [
  'B2B Retailer',
  'Distributor',
  'Direct Customer',
  'Online Platform',
  'Other'
];

const STANDARD_CUSTOMER_TYPES = [
  'B2B Retailer',
  'Distributor',
  'Direct Customer',
  'Online Platform'
];

// GSTIN Regex: 2 digits, 5 chars, 4 digits, 1 char, 1 char/digit, 'Z', 1 checksum
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const autoCapitalizeWords = (text) => {
  if (!text) return '';
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function CustomerMasterView({ isInline = false, onSaveInline, onCloseInline }) {
  const [customers, setCustomers] = useState(() => getStoredData('erp_customers_v1', initialCustomers));
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditingFull, setIsEditingFull] = useState(isInline);
  const [isCreatingNew, setIsCreatingNew] = useState(isInline);
  const [isModalEditMode, setIsModalEditMode] = useState(isInline);

  useEffect(() => {
    const handleUpdate = () => {
      const stored = getStoredData('erp_customers_v1', null);
      if (Array.isArray(stored)) {
        setCustomers(stored);
      }
    };
    window.addEventListener('erp_customers_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('erp_customers_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Global search inside master (Section 11.1)
  const [searchQuery, setSearchQuery] = useState('');

  // Column Filters for Table View
  const [colFilters, setColFilters] = useState({
    name: '',
    type: '',
    phone: '',
    city: '',
    state: '',
    gstin: '',
    notes: '',
    status: ''
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Full Form State (Section 2.1)
  const [formData, setFormData] = useState(() => ({
    id: isInline ? `CUST-${String(customers.length + 1).padStart(3, '0')}` : '',
    name: '',
    type: '',
    customType: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    gstin: '',
    notes: '',
    active: true,
    createdBy: 'Saksham Garg (Procurement Manager)',
    createdDate: new Date().toISOString(),
    lastModifiedBy: 'Saksham Garg',
    lastModifiedDate: new Date().toISOString(),
    activityLog: []
  }));

  // GSTIN Validation helper (Allow up to 15 characters, no strict format restriction)
  const validateGSTIN = (val) => {
    if (!val || !val.trim()) return { valid: true, message: '' };
    const upper = val.trim().toUpperCase();
    if (upper.length > 15) {
      return { valid: false, message: 'GSTIN cannot exceed 15 characters' };
    }
    return { valid: true, message: '' };
  };

  const populateFormDataFromCustomer = (cust) => {
    if (!cust) return {};
    const isStandard = STANDARD_CUSTOMER_TYPES.includes(cust.type);
    return {
      ...cust,
      type: isStandard ? cust.type : (cust.type ? 'Other' : ''),
      customType: isStandard ? '' : (cust.type || '')
    };
  };

  const handleAddNew = () => {
    const maxNum = (customers || []).reduce((max, c) => {
      const num = parseInt(String(c?.id || '').replace(/\D/g, ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const nextSeq = `CUST-${String(maxNum + 1).padStart(3, '0')}`;
    setFormData({
      id: nextSeq,
      name: '',
      type: 'Direct Customer',
      customType: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      gstin: '',
      notes: '',
      active: true,
      createdBy: 'Saksham Garg (Procurement Manager)',
      createdDate: new Date().toISOString(),
      lastModifiedBy: 'Saksham Garg',
      lastModifiedDate: new Date().toISOString(),
      activityLog: [
        {
          timestamp: new Date().toLocaleString('en-IN'),
          user: 'Saksham Garg (Procurement & Quality Manager)',
          action: 'Initial draft initialized',
          details: 'Record created'
        }
      ]
    });
    setSelectedCustomer(null);
    setIsCreatingNew(true);
    setIsEditingFull(true);
    setIsModalEditMode(true);
  };

  const logActivity = (customer, action, details) => {
    const newEntry = {
      timestamp: new Date().toLocaleString('en-IN'),
      user: 'Saksham Garg (Procurement & Quality Manager)',
      action,
      details
    };
    return [newEntry, ...(customer.activityLog || [])];
  };

  // Save Full Record (Create or Full Edit)
  const saveFullCustomer = (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      alert('Customer Name is mandatory.');
      return;
    }

    const isOtherType = formData.type === 'Other';
    const finalCustomerType = isOtherType
      ? (formData.customType?.trim() || 'Other')
      : (formData.type || 'Direct Customer');

    if (!finalCustomerType) {
      alert('Customer Type is mandatory.');
      return;
    }

    if (formData.gstin && formData.gstin.trim()) {
      const gCheck = validateGSTIN(formData.gstin);
      if (!gCheck.valid) {
        alert(`GSTIN Error: ${gCheck.message}`);
        return;
      }
    }

    const nextSeq = formData.id || (() => {
      const maxNum = (customers || []).reduce((max, c) => {
        const num = parseInt(String(c?.id || '').replace(/\D/g, ''), 10);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      return `CUST-${String(maxNum + 1).padStart(3, '0')}`;
    })();

    const cleanCustomer = {
      ...formData,
      id: nextSeq,
      name: autoCapitalizeWords(formData.name.trim()),
      type: finalCustomerType,
      city: autoCapitalizeWords((formData.city || '').trim()),
      gstin: (formData.gstin || '').trim().toUpperCase(),
      lastModifiedBy: 'Saksham Garg (Procurement & Quality Manager)',
      lastModifiedDate: new Date().toISOString()
    };
    delete cleanCustomer.customType;

    let updatedList;
    const exists = customers.some((c) => c.id === cleanCustomer.id);
    if (exists && !isCreatingNew) {
      cleanCustomer.activityLog = logActivity(
        cleanCustomer,
        'Full Record Updated',
        `Updated customer details for ${cleanCustomer.name}`
      );
      updatedList = customers.map((c) => (c.id === cleanCustomer.id ? cleanCustomer : c));
      showToast(`Customer "${cleanCustomer.name}" updated successfully.`);
    } else {
      if (customers.some((c) => c.id === cleanCustomer.id)) {
        const maxNum = (customers || []).reduce((max, c) => {
          const num = parseInt(String(c?.id || '').replace(/\D/g, ''), 10);
          return !isNaN(num) && num > max ? num : max;
        }, 0);
        cleanCustomer.id = `CUST-${String(maxNum + 1).padStart(3, '0')}`;
      }
      cleanCustomer.activityLog = logActivity(
        cleanCustomer,
        'Customer Created',
        `New customer added with ID ${cleanCustomer.id}`
      );
      updatedList = [cleanCustomer, ...customers];
      showToast(`Customer "${cleanCustomer.name}" created successfully.`);
    }

    setCustomers(updatedList);
    setStoredData('erp_customers_v1', updatedList);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('erp_customers_updated', { detail: updatedList }));
    }

    if (isInline && onSaveInline) {
      onSaveInline(cleanCustomer);
      return;
    }

    // Close edit modal and return straight to table list (do NOT show read-only view)
    setSelectedCustomer(null);
    setIsEditingFull(false);
    setIsCreatingNew(false);
    setIsModalEditMode(false);
  };

  const toggleCustomerActive = (cust, e) => {
    e?.stopPropagation();
    const updatedCust = {
      ...cust,
      active: !cust.active,
      lastModifiedBy: 'Saksham Garg (Procurement & Quality Manager)',
      lastModifiedDate: new Date().toISOString()
    };
    updatedCust.activityLog = logActivity(
      updatedCust,
      updatedCust.active ? 'Activated Customer' : 'Deactivated Customer',
      `Status changed from ${cust.active ? 'Active' : 'Inactive'} to ${updatedCust.active ? 'Active' : 'Inactive'}`
    );
    const updatedList = customers.map((c) => (c.id === updatedCust.id ? updatedCust : c));
    setCustomers(updatedList);
    setStoredData('erp_customers_v1', updatedList);
    if (selectedCustomer?.id === cust.id) {
      setSelectedCustomer(updatedCust);
    }
    showToast(`Customer status marked as ${updatedCust.active ? 'Active' : 'Inactive'}.`);
  };

  const deleteCustomer = (custId, custName, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete customer "${custName}"?`)) return;
    const updatedList = customers.filter((c) => c.id !== custId);
    setCustomers(updatedList);
    setStoredData('erp_customers_v1', updatedList);
    if (selectedCustomer?.id === custId) {
      setSelectedCustomer(null);
    }
    showToast(`Customer "${custName}" deleted.`);
  };

  // Filtered List calculation
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (c.id || '').toLowerCase().includes(q) ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.type || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.state || '').toLowerCase().includes(q) ||
        (c.gstin || '').toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      const matchesCol =
        (!colFilters.name || (c.name || '').toLowerCase().includes(colFilters.name.toLowerCase().trim())) &&
        (!colFilters.type || (c.type || '').toLowerCase().includes(colFilters.type.toLowerCase().trim())) &&
        (!colFilters.phone || (c.phone || '').toLowerCase().includes(colFilters.phone.toLowerCase().trim())) &&
        (!colFilters.city || (c.city || '').toLowerCase().includes(colFilters.city.toLowerCase().trim())) &&
        (!colFilters.state || (c.state || '').toLowerCase().includes(colFilters.state.toLowerCase().trim())) &&
        (!colFilters.gstin || (c.gstin || '').toLowerCase().includes(colFilters.gstin.toLowerCase().trim())) &&
        (!colFilters.notes || (c.notes || '').toLowerCase().includes(colFilters.notes.toLowerCase().trim())) &&
        (!colFilters.status || (colFilters.status === 'Active' ? c.active : !c.active));

      return matchesCol;
    });
  }, [customers, searchQuery, colFilters]);

  // Modal / Inline Container (Section 2.2)
  if (isInline) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1060 }}>
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
                <p className="text-muted small mb-0">Create customer master record inline</p>
              </div>
              <button type="button" className="btn-close" onClick={onCloseInline}></button>
            </div>
            <form onSubmit={saveFullCustomer}>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-7">
                    <label className="form-label fw-semibold small text-muted">Customer Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Manyavar Trends Retail"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: autoCapitalizeWords(e.target.value) })}
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label fw-semibold small text-muted">Customer Type *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.type || ''}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="">Select Customer Type</option>
                      {CUSTOMER_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {formData.type === 'Other' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Specify Customer Type (e.g. Wholesaler, Boutique)"
                          required
                          value={formData.customType || ''}
                          onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Phone Number (10 digits)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 9898012345"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. orders@customer.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">City</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Surat"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: autoCapitalizeWords(e.target.value) })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">State</label>
                    <select
                      className="form-select"
                      value={formData.state || ''}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold small text-muted">GSTIN (15 characters)</label>
                    <input
                      type="text"
                      className="form-control text-uppercase font-monospace"
                      placeholder="e.g. 24AAACM1234F1Z1"
                      maxLength={15}
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold small text-muted">Notes / Remarks</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Payment terms, fabric preferences or client-specific remarks"
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
    <div className="p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 2000 }}
        >
          <div className="alert alert-success shadow-lg border-0 d-flex align-items-center gap-2 mb-0 py-2 px-3 rounded-3">
            <i className="ti ti-check fs-5"></i>
            <span className="fw-semibold small">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm flex-shrink-0"
            style={{ width: '42px', height: '42px', backgroundColor: '#4f46e5' }}
          >
            <i className="ti ti-users fs-4"></i>
          </div>
          <div>
            <h4 className="fw-bold text-dark mb-0 fs-18">Customer Master</h4>
            <p className="text-muted small mb-0">
              B2B Retailers, Distributors, Direct Buyers &amp; Online Platforms
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {!isEditingFull && (
            <button
              className="btn btn-primary btn-sm rounded-3 px-3 py-2 fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
              onClick={handleAddNew}
            >
              <i className="ti ti-plus"></i>
              <span>Add New Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL: FULL EDIT / CREATE CUSTOMER DIALOG                            */}
      {/* ========================================================================= */}
      {isEditingFull && !isInline && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-4 bg-white overflow-hidden">
              <div className="modal-header border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2 mb-0">
                    <span className="badge bg-primary-subtle text-primary p-2 rounded-3">
                      <i className="ti ti-user-plus fs-5"></i>
                    </span>
                    {isCreatingNew
                      ? 'Create New Customer Master'
                      : (isModalEditMode ? `Edit Full Customer: ${formData.name || ''}` : `Customer Details: ${formData.name || ''}`)}
                  </h5>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {!isCreatingNew && (
                    !isModalEditMode ? (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm rounded-3 px-3 fw-semibold d-flex align-items-center gap-1.5"
                        onClick={() => setIsModalEditMode(true)}
                      >
                        <i className="ti ti-edit"></i>
                        <span>Edit</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-light border text-secondary btn-sm rounded-3 px-3 fw-semibold d-flex align-items-center gap-1.5"
                        onClick={() => setIsModalEditMode(false)}
                      >
                        <i className="ti ti-eye"></i>
                        <span>View Mode</span>
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setIsEditingFull(false);
                      setIsCreatingNew(false);
                      setIsModalEditMode(false);
                    }}
                  ></button>
                </div>
              </div>
              <form onSubmit={saveFullCustomer}>
                <div className="modal-body p-4" style={{ maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Customer Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Manyavar Trends Retail"
                        required
                        disabled={!isModalEditMode}
                        style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: autoCapitalizeWords(e.target.value) })}
                      />
                      <div className="form-text small text-muted">Auto-capitalised word by word</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Customer Type *</label>
                      <select
                        className="form-select"
                        required
                        disabled={!isModalEditMode}
                        style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                        value={formData.type || ''}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="">Select Customer Type</option>
                        {CUSTOMER_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {formData.type === 'Other' && (
                        <div className="mt-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Specify Customer Type (e.g. Wholesaler, Boutique)"
                            required
                            disabled={!isModalEditMode}
                            style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                            value={formData.customType || ''}
                            onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                            autoFocus={isModalEditMode}
                          />
                        </div>
                      )}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">Phone Number (10 digits)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 9898012345"
                        maxLength={10}
                        disabled={!isModalEditMode}
                        style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. orders@customer.com"
                        disabled={!isModalEditMode}
                        style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">GSTIN (15 characters)</label>
                      <input
                        type="text"
                        className="form-control text-uppercase font-monospace"
                        placeholder="e.g. 24AAACM1234F1Z1"
                        maxLength={15}
                        disabled={!isModalEditMode}
                        style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Address (Multiline)</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Street, Industrial Area / Building / Floor"
                        disabled={!isModalEditMode}
                        style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
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
                        disabled={!isModalEditMode}
                        style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: autoCapitalizeWords(e.target.value) })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold small text-muted">State (Dropdown)</label>
                      <select
                        className="form-select"
                        disabled={!isModalEditMode}
                        style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                        value={formData.state || ''}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold small text-muted">Notes / Special Instructions</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Payment terms, fabric preferences or client-specific remarks"
                        disabled={!isModalEditMode}
                        style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>

                    {/* Active Status */}
                    <div className="col-12 mt-3">
                      <div className="form-check form-switch p-0 d-flex align-items-center gap-2">
                        <input
                          className="form-check-input ms-0"
                          type="checkbox"
                          id="activeCustomerSwitch"
                          disabled={!isModalEditMode}
                          style={{ width: '40px', height: '22px', cursor: isModalEditMode ? 'pointer' : 'default' }}
                          checked={formData.active}
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        />
                        <label className="form-check-label fw-semibold text-dark small" htmlFor="activeCustomerSwitch">
                          Active Customer Status (Default: checked)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light border-top py-3 px-4 d-flex justify-content-end gap-2">
                  {!isModalEditMode ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-theme-close rounded-3 px-4 fw-medium"
                        onClick={() => {
                          setIsEditingFull(false);
                          setIsCreatingNew(false);
                          setIsModalEditMode(false);
                        }}
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary rounded-3 px-4 fw-semibold"
                        onClick={() => setIsModalEditMode(true)}
                      >
                        <i className="ti ti-edit me-1"></i> Edit Customer
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-theme-close rounded-3 px-4 fw-medium"
                        onClick={() => {
                          if (isCreatingNew) {
                            setIsEditingFull(false);
                            setIsCreatingNew(false);
                            setIsModalEditMode(false);
                          } else {
                            setIsModalEditMode(false);
                          }
                        }}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold">
                        <i className="ti ti-check me-1"></i> Save Full Customer
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Table List View */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          {/* Top Filter and Search Bar */}
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="position-relative" style={{ minWidth: '320px', maxWidth: '420px' }}>
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
                placeholder="Global search across all customer fields (11.1)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '42px' }}
              />
            </div>
            <div className="text-muted small">
              Showing <strong>{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customers
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                {/* Column Titles */}
                <tr>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '180px' }}>CUSTOMER NAME</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '140px' }}>TYPE</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '120px' }}>PHONE</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '120px' }}>CITY</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '120px' }}>STATE</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '150px' }}>GSTIN</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '150px' }}>NOTES</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold text-center" style={{ minWidth: '110px' }}>STATUS</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold text-end" style={{ minWidth: '100px' }}>ACTIONS</th>
                </tr>

                {/* Column-wise Filter Row */}
                <tr className="bg-white border-bottom">
                  <td className="p-1.5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Filter name..."
                      value={colFilters.name}
                      onChange={(e) => setColFilters({ ...colFilters, name: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Filter type..."
                      value={colFilters.type}
                      onChange={(e) => setColFilters({ ...colFilters, type: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Phone..."
                      value={colFilters.phone}
                      onChange={(e) => setColFilters({ ...colFilters, phone: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="City..."
                      value={colFilters.city}
                      onChange={(e) => setColFilters({ ...colFilters, city: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="State..."
                      value={colFilters.state}
                      onChange={(e) => setColFilters({ ...colFilters, state: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="GSTIN..."
                      value={colFilters.gstin}
                      onChange={(e) => setColFilters({ ...colFilters, gstin: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Filter notes..."
                      value={colFilters.notes}
                      onChange={(e) => setColFilters({ ...colFilters, notes: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5 text-center">
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
                  <td className="p-1.5 text-end">
                    {Object.values(colFilters).some(Boolean) && (
                      <button
                        type="button"
                        className="btn btn-xs btn-link text-danger p-0 text-decoration-none fw-semibold"
                        style={{ fontSize: '11px' }}
                        onClick={() =>
                          setColFilters({
                            name: '',
                            type: '',
                            phone: '',
                            city: '',
                            state: '',
                            gstin: '',
                            notes: '',
                            status: ''
                          })
                        }
                      >
                        Clear
                      </button>
                    )}
                  </td>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setFormData(populateFormDataFromCustomer(cust));
                      setIsCreatingNew(false);
                      setIsEditingFull(true);
                      setIsModalEditMode(false);
                      setSelectedCustomer(null);
                    }}
                  >
                    <td className="px-3 fw-bold text-dark">{cust.name}</td>
                    <td className="px-3">
                      <span className="badge bg-light text-dark border px-2 py-1">{cust.type}</span>
                    </td>
                    <td className="px-3 text-muted small">{cust.phone || '—'}</td>
                    <td className="px-3 text-dark small">{cust.city || '—'}</td>
                    <td className="px-3 text-dark small">{cust.state || '—'}</td>
                    <td className="px-3 font-monospace text-muted small">{cust.gstin || '—'}</td>
                    <td className="px-3 text-muted small text-truncate" style={{ maxWidth: '180px' }} title={cust.notes || ''}>
                      {cust.notes || '—'}
                    </td>
                    <td className="px-3 text-center">
                      <span className={`badge ${cust.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2.5 py-1 rounded-pill`}>
                        {cust.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-light text-primary p-1.5 rounded-2"
                          title="Edit Customer"
                          onClick={() => {
                            setFormData(populateFormDataFromCustomer(cust));
                            setIsCreatingNew(false);
                            setIsEditingFull(true);
                            setIsModalEditMode(true);
                            setSelectedCustomer(null);
                          }}
                        >
                          <i className="ti ti-edit fs-5"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light text-danger p-1.5 rounded-2"
                          title="Delete Customer"
                          onClick={(e) => deleteCustomer(cust.id, cust.name, e)}
                        >
                          <i className="ti ti-trash fs-5"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-5 text-muted">
                      <i className="ti ti-users-minus fs-1 d-block mb-2 text-secondary opacity-50"></i>
                      No customers found matching the search or column filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
