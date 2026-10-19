import React, { useState, useMemo } from 'react';
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
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'audit'

  // Section-wise editing state for View Mode (Section 11.2 & 11.5)
  const [editingSection, setEditingSection] = useState(null); // 'basic' | 'contact' | 'location'
  const [sectionFormData, setSectionFormData] = useState({});

  // Column Filters (Section 11.3)
  const [colFilters, setColFilters] = useState({
    id: '',
    name: '',
    type: '',
    phone: '',
    city: '',
    state: '',
    gstin: '',
    status: ''
  });

  // Global search inside master (Section 11.1)
  const [searchQuery, setSearchQuery] = useState('');

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

  // GSTIN Validation helper (Section 12.1)
  const validateGSTIN = (val) => {
    if (!val || !val.trim()) return { valid: true, message: '' };
    const upper = val.trim().toUpperCase();
    if (upper.length !== 15) {
      return { valid: false, message: 'GSTIN must be exactly 15 characters' };
    }
    if (!GSTIN_REGEX.test(upper)) {
      return { valid: false, message: 'Invalid GSTIN format (e.g. 24AAACM1234F1Z1)' };
    }
    return { valid: true, message: 'Valid GSTIN format' };
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
    const nextSeq = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    setFormData({
      id: nextSeq,
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
    setEditingSection(null);
    setIsCreatingNew(true);
    setIsEditingFull(true);
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
      : (formData.type || '');

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

    const nextSeq = formData.id || `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    const cleanCustomer = {
      ...formData,
      id: nextSeq,
      name: autoCapitalizeWords(formData.name.trim()),
      type: finalCustomerType,
      city: autoCapitalizeWords(formData.city.trim()),
      gstin: (formData.gstin || '').trim().toUpperCase(),
      lastModifiedBy: 'Saksham Garg (Procurement & Quality Manager)',
      lastModifiedDate: new Date().toISOString()
    };
    delete cleanCustomer.customType;

    let updatedList;
    const exists = customers.some((c) => c.id === cleanCustomer.id);
    if (exists) {
      cleanCustomer.activityLog = logActivity(
        cleanCustomer,
        'Full Record Updated',
        `Updated customer details for ${cleanCustomer.name}`
      );
      updatedList = customers.map((c) => (c.id === cleanCustomer.id ? cleanCustomer : c));
      showToast(`Customer "${cleanCustomer.name}" updated successfully.`);
    } else {
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

    if (isInline && onSaveInline) {
      onSaveInline(cleanCustomer);
      return;
    }

    // Per Section 11.2: "Once any record is saved, it always opens in a read-only View Mode by default"
    setSelectedCustomer(cleanCustomer);
    setIsEditingFull(false);
    setIsCreatingNew(false);
    setEditingSection(null);
  };

  // Section-wise Save in View Mode (Section 11.2 & 11.5)
  const saveSection = (sectionName) => {
    if (!selectedCustomer) return;

    if (sectionName === 'basic') {
      if (!sectionFormData.name?.trim()) {
        alert('Customer Name is mandatory.');
        return;
      }
      const isOther = sectionFormData.type === 'Other';
      const resolved = isOther ? (sectionFormData.customType?.trim() || 'Other') : (sectionFormData.type || '');
      if (!resolved) {
        alert('Customer Type is mandatory.');
        return;
      }
    }

    if (sectionName === 'contact' && sectionFormData.gstin?.trim()) {
      const gCheck = validateGSTIN(sectionFormData.gstin);
      if (!gCheck.valid) {
        alert(`GSTIN Error: ${gCheck.message}`);
        return;
      }
    }

    const updatedCust = {
      ...selectedCustomer,
      ...sectionFormData,
      lastModifiedBy: 'Saksham Garg (Procurement & Quality Manager)',
      lastModifiedDate: new Date().toISOString()
    };

    if (sectionFormData.name) {
      updatedCust.name = autoCapitalizeWords(sectionFormData.name.trim());
    }
    if (sectionName === 'basic') {
      const isOther = sectionFormData.type === 'Other';
      updatedCust.type = isOther ? (sectionFormData.customType?.trim() || 'Other') : (sectionFormData.type || '');
      delete updatedCust.customType;
    }
    if (sectionFormData.city) {
      updatedCust.city = autoCapitalizeWords(sectionFormData.city.trim());
    }
    if (sectionFormData.gstin !== undefined) {
      updatedCust.gstin = (sectionFormData.gstin || '').trim().toUpperCase();
    }

    const changeSummary = Object.keys(sectionFormData)
      .map((k) => `${k}: ${selectedCustomer[k]} ➔ ${updatedCust[k]}`)
      .join(', ');

    updatedCust.activityLog = logActivity(
      updatedCust,
      `Section Edit (${sectionName.toUpperCase()})`,
      changeSummary || `Updated ${sectionName} section`
    );

    const updatedList = customers.map((c) => (c.id === updatedCust.id ? updatedCust : c));
    setCustomers(updatedList);
    setStoredData('erp_customers_v1', updatedList);
    setSelectedCustomer(updatedCust);
    setEditingSection(null);
    showToast(`${sectionName.toUpperCase()} section saved successfully.`);
  };

  const startEditSection = (sectionName) => {
    setEditingSection(sectionName);
    if (sectionName === 'basic') {
      const isStandard = STANDARD_CUSTOMER_TYPES.includes(selectedCustomer?.type);
      setSectionFormData({
        ...selectedCustomer,
        type: isStandard ? selectedCustomer?.type : (selectedCustomer?.type ? 'Other' : ''),
        customType: isStandard ? '' : (selectedCustomer?.type || '')
      });
    } else {
      setSectionFormData({ ...selectedCustomer });
    }
  };

  const cancelEditSection = () => {
    setEditingSection(null);
    setSectionFormData({});
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
      // Global Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchGlobal =
        !q ||
        (c.id || '').toLowerCase().includes(q) ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.type || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.state || '').toLowerCase().includes(q) ||
        (c.gstin || '').toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q);

      if (!matchGlobal) return false;

      // Column-wise filters (Section 11.3)
      let matchType = true;
      if (colFilters.type) {
        if (colFilters.type === 'Other') {
          matchType = !STANDARD_CUSTOMER_TYPES.includes(c.type) || (c.type || '').toLowerCase().includes('other');
        } else {
          matchType = (c.type || '').toLowerCase().includes(colFilters.type.toLowerCase());
        }
      }

      return (
        (c.id || '').toLowerCase().includes(colFilters.id.toLowerCase()) &&
        (c.name || '').toLowerCase().includes(colFilters.name.toLowerCase()) &&
        matchType &&
        (c.phone || '').toLowerCase().includes(colFilters.phone.toLowerCase()) &&
        (c.city || '').toLowerCase().includes(colFilters.city.toLowerCase()) &&
        (c.state || '').toLowerCase().includes(colFilters.state.toLowerCase()) &&
        (c.gstin || '').toLowerCase().includes(colFilters.gstin.toLowerCase()) &&
        (colFilters.status === '' || (colFilters.status === 'Active' ? c.active : !c.active))
      );
    });
  }, [customers, colFilters, searchQuery]);

  // Modal / Inline Container (Section 2.2)
  if (isInline) {
    const gCheckInline = validateGSTIN(formData.gstin);
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
                <p className="text-muted small mb-0">Create customer master record inline (Section 2.2)</p>
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
                    {formData.gstin && (
                      <div className={`form-text small ${gCheckInline.valid ? 'text-success' : 'text-danger'}`}>
                        {gCheckInline.message}
                      </div>
                    )}
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
              Route 1 (Section 2) &bull; B2B Retailers, Distributors, Direct Buyers & Online Platforms
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {selectedCustomer && !isEditingFull && (
            <button
              className="btn btn-outline-secondary btn-sm rounded-3 px-3 fw-semibold d-flex align-items-center gap-1.5"
              onClick={() => {
                setSelectedCustomer(null);
                setEditingSection(null);
              }}
            >
              <i className="ti ti-arrow-left"></i>
              <span>Back to Customers List</span>
            </button>
          )}
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
                    {isCreatingNew ? 'Create New Customer Master' : `Edit Full Customer: ${formData.name}`}
                  </h5>
                  <p className="text-muted small mb-0">Sequential ID: {formData.id}</p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setIsEditingFull(false);
                    setIsCreatingNew(false);
                  }}
                ></button>
              </div>
              <form onSubmit={saveFullCustomer}>
                <div className="modal-body p-4" style={{ maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label fw-semibold small text-muted">Customer ID (Sequential)</label>
                      <input type="text" className="form-control bg-light font-monospace" value={formData.id} readOnly />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label fw-semibold small text-muted">Customer Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Manyavar Trends Retail"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: autoCapitalizeWords(e.target.value) })}
                      />
                      <div className="form-text small text-muted">Auto-capitalised word by word</div>
                    </div>
                    <div className="col-md-4">
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

                    <div className="col-md-4">
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
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. orders@customer.com"
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
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      />
                      {formData.gstin && (
                        <div className={`form-text small ${validateGSTIN(formData.gstin).valid ? 'text-success' : 'text-danger'}`}>
                          {validateGSTIN(formData.gstin).message}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Address (Multiline)</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Street, Industrial Area / Building / Floor"
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
                        onChange={(e) => setFormData({ ...formData, city: autoCapitalizeWords(e.target.value) })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold small text-muted">State (Dropdown)</label>
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
                    <div className="col-12">
                      <label className="form-label fw-semibold small text-muted">Notes / Special Instructions</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Payment terms, fabric preferences or client-specific remarks"
                        value={formData.notes}
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
                          style={{ width: '40px', height: '22px', cursor: 'pointer' }}
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
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-3 px-4"
                    onClick={() => {
                      setIsEditingFull(false);
                      setIsCreatingNew(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold">
                    <i className="ti ti-check me-1"></i> Save Full Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedCustomer ? (
        /* ========================================================================= */
        /* CASE 2: READ-ONLY VIEW MODE WITH SECTION-WISE EDIT (SECTION 11.2 & 11.5)  */
        /* ========================================================================= */
        <div className="d-flex flex-column gap-4">
          {/* Top Banner of Record */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-4 d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                  style={{ width: '54px', height: '54px', backgroundColor: '#6366f1', fontSize: '20px' }}
                >
                  {selectedCustomer.name?.substring(0, 2).toUpperCase() || 'CU'}
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary-subtle text-primary font-monospace px-2.5 py-1 rounded-2">
                      {selectedCustomer.id}
                    </span>
                    <h4 className="fw-bold text-dark mb-0">{selectedCustomer.name}</h4>
                    <span className={`badge ${selectedCustomer.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2.5 py-1 rounded-pill`}>
                      {selectedCustomer.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-muted small mt-1">
                    <span className="fw-semibold text-secondary">{selectedCustomer.type}</span> &bull;{' '}
                    <span>{selectedCustomer.city}, {selectedCustomer.state}</span>
                  </div>
                </div>
              </div>

              {/* Overall Actions */}
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-outline-primary btn-sm rounded-3 px-3 fw-semibold d-flex align-items-center gap-1.5"
                  onClick={() => {
                    setFormData(populateFormDataFromCustomer(selectedCustomer));
                    setIsCreatingNew(false);
                    setIsEditingFull(true);
                  }}
                >
                  <i className="ti ti-edit"></i>
                  <span>Edit Full Record</span>
                </button>
                <button
                  className={`btn btn-sm rounded-3 px-3 fw-semibold ${
                    selectedCustomer.active ? 'btn-outline-warning text-warning-emphasis' : 'btn-outline-success text-success'
                  }`}
                  onClick={(e) => toggleCustomerActive(selectedCustomer, e)}
                >
                  <i className={`ti ti-${selectedCustomer.active ? 'power' : 'check'}`}></i>
                  <span>{selectedCustomer.active ? 'Deactivate' : 'Activate'}</span>
                </button>
              </div>
            </div>

            {/* View Mode Navigation Tabs */}
            <div className="d-flex gap-3 border-bottom mt-4 pt-2">
              <button
                className={`btn btn-link text-decoration-none pb-2 px-1 fw-bold fs-13 ${
                  activeTab === 'details' ? 'border-bottom border-primary border-3 text-primary' : 'text-muted'
                }`}
                onClick={() => setActiveTab('details')}
              >
                <i className="ti ti-layout-grid me-1.5"></i> Customer Sections (View & Section Edit)
              </button>
              <button
                className={`btn btn-link text-decoration-none pb-2 px-1 fw-bold fs-13 ${
                  activeTab === 'audit' ? 'border-bottom border-primary border-3 text-primary' : 'text-muted'
                }`}
                onClick={() => setActiveTab('audit')}
              >
                <i className="ti ti-history me-1.5"></i> Activity History & Audit Trail (11.4)
              </button>
            </div>
          </div>

          {activeTab === 'details' ? (
            <div className="row g-4">
              {/* ------------------------------------------------------------- */}
              {/* SECTION 1: BASIC INFORMATION (Section-wise Edit)             */}
              {/* ------------------------------------------------------------- */}
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                  <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-dark fs-14 d-flex align-items-center gap-2">
                      <i className="ti ti-info-circle text-primary fs-5"></i>
                      Section 1: Basic Information
                    </span>
                    {editingSection === 'basic' ? (
                      <div className="d-flex gap-1.5">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary rounded-2 px-2.5 py-1 small"
                          onClick={cancelEditSection}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-primary rounded-2 px-2.5 py-1 small fw-semibold"
                          onClick={() => saveSection('basic')}
                        >
                          Save Section
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-xs btn-light text-primary rounded-2 px-2.5 py-1 small fw-semibold border"
                        onClick={() => startEditSection('basic')}
                      >
                        <i className="ti ti-edit me-1"></i> Edit Section
                      </button>
                    )}
                  </div>
                  <div className="card-body p-4">
                    {editingSection === 'basic' ? (
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label small fw-semibold text-muted">Customer Name *</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={sectionFormData.name || ''}
                            onChange={(e) =>
                              setSectionFormData({ ...sectionFormData, name: autoCapitalizeWords(e.target.value) })
                            }
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label small fw-semibold text-muted">Customer Type *</label>
                          <select
                            className="form-select form-select-sm"
                            value={sectionFormData.type || ''}
                            onChange={(e) => setSectionFormData({ ...sectionFormData, type: e.target.value })}
                          >
                            <option value="">Select Customer Type</option>
                            {CUSTOMER_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          {sectionFormData.type === 'Other' && (
                            <div className="mt-2">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Specify Customer Type (e.g. Wholesaler, Boutique)"
                                required
                                value={sectionFormData.customType || ''}
                                onChange={(e) => setSectionFormData({ ...sectionFormData, customType: e.target.value })}
                                autoFocus
                              />
                            </div>
                          )}
                        </div>
                        <div className="col-12">
                          <div className="form-check form-switch mt-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="secActiveCheck"
                              checked={sectionFormData.active}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, active: e.target.checked })
                              }
                            />
                            <label className="form-check-label small fw-semibold" htmlFor="secActiveCheck">
                              Active Status
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <div className="text-muted small">Customer ID</div>
                          <div className="fw-bold font-monospace text-primary">{selectedCustomer.id}</div>
                        </div>
                        <div>
                          <div className="text-muted small">Customer Name</div>
                          <div className="fw-bold text-dark fs-15">{selectedCustomer.name}</div>
                        </div>
                        <div>
                          <div className="text-muted small">Customer Type</div>
                          <span className="badge bg-light text-dark border px-2.5 py-1.5 mt-1">
                            {selectedCustomer.type}
                          </span>
                        </div>
                        <div>
                          <div className="text-muted small">Status</div>
                          <span className={`badge ${selectedCustomer.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2.5 py-1 rounded-pill mt-1`}>
                            {selectedCustomer.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 2: CONTACT & TAX (Section-wise Edit)                  */}
              {/* ------------------------------------------------------------- */}
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                  <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-dark fs-14 d-flex align-items-center gap-2">
                      <i className="ti ti-id text-primary fs-5"></i>
                      Section 2: Contact & Tax Information
                    </span>
                    {editingSection === 'contact' ? (
                      <div className="d-flex gap-1.5">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary rounded-2 px-2.5 py-1 small"
                          onClick={cancelEditSection}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-primary rounded-2 px-2.5 py-1 small fw-semibold"
                          onClick={() => saveSection('contact')}
                        >
                          Save Section
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-xs btn-light text-primary rounded-2 px-2.5 py-1 small fw-semibold border"
                        onClick={() => startEditSection('contact')}
                      >
                        <i className="ti ti-edit me-1"></i> Edit Section
                      </button>
                    )}
                  </div>
                  <div className="card-body p-4">
                    {editingSection === 'contact' ? (
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label small fw-semibold text-muted">Phone Number</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="10-digit number"
                            maxLength={10}
                            value={sectionFormData.phone || ''}
                            onChange={(e) =>
                              setSectionFormData({ ...sectionFormData, phone: e.target.value.replace(/\D/g, '') })
                            }
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label small fw-semibold text-muted">Email Address</label>
                          <input
                            type="email"
                            className="form-control form-control-sm"
                            placeholder="orders@customer.com"
                            value={sectionFormData.email || ''}
                            onChange={(e) =>
                              setSectionFormData({ ...sectionFormData, email: e.target.value })
                            }
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label small fw-semibold text-muted">GSTIN (15 characters)</label>
                          <input
                            type="text"
                            className="form-control form-control-sm text-uppercase font-monospace"
                            placeholder="24AAACM1234F1Z1"
                            maxLength={15}
                            value={sectionFormData.gstin || ''}
                            onChange={(e) =>
                              setSectionFormData({ ...sectionFormData, gstin: e.target.value.toUpperCase() })
                            }
                          />
                          {sectionFormData.gstin && (
                            <div className={`form-text small ${validateGSTIN(sectionFormData.gstin).valid ? 'text-success' : 'text-danger'}`}>
                              {validateGSTIN(sectionFormData.gstin).message}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <div className="text-muted small">Phone Number</div>
                          <div className="fw-bold text-dark fs-14">
                            {selectedCustomer.phone ? (
                              <span className="d-flex align-items-center gap-1.5">
                                <i className="ti ti-phone text-muted"></i>
                                {selectedCustomer.phone}
                              </span>
                            ) : (
                              '—'
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted small">Email Address</div>
                          <div className="fw-semibold text-dark">
                            {selectedCustomer.email ? (
                              <a href={`mailto:${selectedCustomer.email}`} className="text-decoration-none">
                                {selectedCustomer.email}
                              </a>
                            ) : (
                              '—'
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted small">GSTIN (15 Characters)</div>
                          <div className="fw-bold font-monospace text-dark fs-14">
                            {selectedCustomer.gstin ? (
                              <span className="badge bg-light text-dark border px-2 py-1">
                                {selectedCustomer.gstin}
                              </span>
                            ) : (
                              '—'
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 3: LOCATION & NOTES (Section-wise Edit)               */}
              {/* ------------------------------------------------------------- */}
              <div className="col-12">
                <div className="card border-0 shadow-sm rounded-4 bg-white">
                  <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-dark fs-14 d-flex align-items-center gap-2">
                      <i className="ti ti-map-pin text-primary fs-5"></i>
                      Section 3: Address, Location & Notes
                    </span>
                    {editingSection === 'location' ? (
                      <div className="d-flex gap-1.5">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary rounded-2 px-2.5 py-1 small"
                          onClick={cancelEditSection}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-primary rounded-2 px-2.5 py-1 small fw-semibold"
                          onClick={() => saveSection('location')}
                        >
                          Save Section
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-xs btn-light text-primary rounded-2 px-2.5 py-1 small fw-semibold border"
                        onClick={() => startEditSection('location')}
                      >
                        <i className="ti ti-edit me-1"></i> Edit Section
                      </button>
                    )}
                  </div>
                  <div className="card-body p-4">
                    {editingSection === 'location' ? (
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold text-muted">Address (Multiline)</label>
                          <textarea
                            className="form-control form-control-sm"
                            rows={2}
                            value={sectionFormData.address || ''}
                            onChange={(e) =>
                              setSectionFormData({ ...sectionFormData, address: e.target.value })
                            }
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small fw-semibold text-muted">City</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={sectionFormData.city || ''}
                            onChange={(e) =>
                              setSectionFormData({ ...sectionFormData, city: autoCapitalizeWords(e.target.value) })
                            }
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small fw-semibold text-muted">State</label>
                          <select
                            className="form-select form-select-sm"
                            value={sectionFormData.state || 'Gujarat'}
                            onChange={(e) =>
                              setSectionFormData({ ...sectionFormData, state: e.target.value })
                            }
                          >
                            {INDIAN_STATES.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12">
                          <label className="form-label small fw-semibold text-muted">Notes</label>
                          <textarea
                            className="form-control form-control-sm"
                            rows={2}
                            value={sectionFormData.notes || ''}
                            onChange={(e) =>
                              setSectionFormData({ ...sectionFormData, notes: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="row g-4">
                        <div className="col-md-6">
                          <div className="text-muted small">Full Street Address</div>
                          <div className="fw-semibold text-dark mt-1">
                            {selectedCustomer.address || '—'}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="text-muted small">City</div>
                          <div className="fw-bold text-dark mt-1">{selectedCustomer.city || '—'}</div>
                        </div>
                        <div className="col-md-3">
                          <div className="text-muted small">State</div>
                          <div className="fw-bold text-dark mt-1">{selectedCustomer.state || '—'}</div>
                        </div>
                        <div className="col-12">
                          <div className="text-muted small">Remarks & Notes</div>
                          <div className="p-3 bg-light rounded-3 text-secondary small mt-1 border">
                            {selectedCustomer.notes || 'No special notes entered for this customer.'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ------------------------------------------------------------- */
            /* ACTIVITY HISTORY & AUDIT TRAIL (Section 11.4)                 */
            /* ------------------------------------------------------------- */
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <i className="ti ti-history text-primary"></i> Activity History & Audit Trail
              </h5>
              <p className="text-muted small mb-4">
                Section 11.4 &bull; Timeline of modifications, section-wise updates, and status changes
              </p>

              <div className="position-relative ps-4 border-start" style={{ borderColor: '#e2e8f0' }}>
                {(selectedCustomer.activityLog || [
                  {
                    timestamp: selectedCustomer.lastModifiedDate ? new Date(selectedCustomer.lastModifiedDate).toLocaleString('en-IN') : 'Recent',
                    user: selectedCustomer.lastModifiedBy || 'Saksham Garg (Procurement & Quality Manager)',
                    action: 'Record Active',
                    details: 'Customer master details maintained'
                  }
                ]).map((log, lIdx) => (
                  <div key={lIdx} className="mb-4 position-relative">
                    {/* Bullet */}
                    <div
                      className="position-absolute rounded-circle bg-primary"
                      style={{
                        width: '12px',
                        height: '12px',
                        left: '-23px',
                        top: '4px',
                        border: '2px solid #ffffff',
                        boxShadow: '0 0 0 2px #c7d2fe'
                      }}
                    />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-dark fs-14">{log.action}</span>
                      <span className="text-muted small font-monospace">{log.timestamp}</span>
                    </div>
                    <div className="text-muted small mt-0.5">
                      <i className="ti ti-user me-1 text-secondary"></i> {log.user}
                    </div>
                    <div className="p-2.5 mt-2 rounded-2 bg-light border text-secondary small font-monospace">
                      {log.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* CASE 3: TABLE LIST VIEW WITH COLUMN-WISE SEARCH (SECTION 11.3)            */
        /* ========================================================================= */
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
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '120px' }}>CUSTOMER ID</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '200px' }}>CUSTOMER NAME</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '150px' }}>TYPE</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '130px' }}>PHONE</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '130px' }}>CITY</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '130px' }}>STATE</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '160px' }}>GSTIN</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold text-center" style={{ minWidth: '100px' }}>STATUS</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold text-end" style={{ minWidth: '110px' }}>ACTIONS</th>
                </tr>

                {/* Section 11.3: Column-wise Filters on Every Table */}
                <tr className="bg-white border-bottom">
                  <td className="p-1.5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="ID..."
                      value={colFilters.id}
                      onChange={(e) => setColFilters({ ...colFilters, id: e.target.value })}
                    />
                  </td>
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
                    <select
                      className="form-select form-select-sm"
                      value={colFilters.type}
                      onChange={(e) => setColFilters({ ...colFilters, type: e.target.value })}
                    >
                      <option value="">All Types</option>
                      {CUSTOMER_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
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
                    {(colFilters.id || colFilters.name || colFilters.type || colFilters.phone || colFilters.city || colFilters.state || colFilters.gstin || colFilters.status) && (
                      <button
                        type="button"
                        className="btn btn-xs btn-link text-muted p-0 text-decoration-none"
                        onClick={() =>
                          setColFilters({
                            id: '',
                            name: '',
                            type: '',
                            phone: '',
                            city: '',
                            state: '',
                            gstin: '',
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
                      setSelectedCustomer(cust);
                      setEditingSection(null);
                      setActiveTab('details');
                    }}
                  >
                    <td className="px-3 fw-bold text-primary font-monospace fs-13">{cust.id}</td>
                    <td className="px-3 fw-bold text-dark">{cust.name}</td>
                    <td className="px-3">
                      <span className="badge bg-light text-dark border px-2 py-1">{cust.type}</span>
                    </td>
                    <td className="px-3 text-muted small">{cust.phone || '—'}</td>
                    <td className="px-3 text-dark small">{cust.city || '—'}</td>
                    <td className="px-3 text-dark small">{cust.state || '—'}</td>
                    <td className="px-3 font-monospace text-muted small">{cust.gstin || '—'}</td>
                    <td className="px-3 text-center">
                      <span className={`badge ${cust.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2.5 py-1 rounded-pill`}>
                        {cust.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-light text-primary p-1 rounded-2"
                          title="Open View Mode (Section 11.2)"
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setEditingSection(null);
                            setActiveTab('details');
                          }}
                        >
                          <i className="ti ti-eye fs-5"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light text-secondary p-1 rounded-2"
                          title="Edit Customer"
                          onClick={() => {
                            setFormData(populateFormDataFromCustomer(cust));
                            setIsCreatingNew(false);
                            setIsEditingFull(true);
                          }}
                        >
                          <i className="ti ti-edit fs-5"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light text-danger p-1 rounded-2"
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
      )}
    </div>
  );
}
