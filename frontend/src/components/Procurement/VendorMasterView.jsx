import React, { useState } from 'react';
import { api } from '../../services/api';
import { STANDARD_VENDOR_TYPES, getVendorTypes, vendorMatchesType } from '../../utils/vendorUtils';

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export { STANDARD_VENDOR_TYPES };

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
  onCloseInline,
  defaultTypes = []
}) {
  const [vendorList, setVendorList] = useState(() => {
    if (Array.isArray(vendors) && vendors.length > 0) return vendors;
    try {
      const stored = localStorage.getItem('raindrop_vendors_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isEditing, setIsEditing] = useState(isInline);
  const [activeSection, setActiveSection] = useState(isInline ? 'all' : 'none'); // 'all', 'basic', 'contact', 'tax', 'bank'
  const [isCreatingNew, setIsCreatingNew] = useState(isInline);
  const [isModalEditMode, setIsModalEditMode] = useState(isInline);

  // Available Vendor Types for "Click to Add" (Pre-populated with STANDARD_VENDOR_TYPES + custom types)
  const [availableTypes, setAvailableTypes] = useState(() => {
    try {
      const stored = localStorage.getItem('raindrop_user_vendor_types_v2');
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...STANDARD_VENDOR_TYPES, ...parsed]));
        }
      }
    } catch (e) {}
    return [...STANDARD_VENDOR_TYPES];
  });

  React.useEffect(() => {
    if (Array.isArray(vendors) && vendors.length > 0) {
      setVendorList(vendors);
    }
  }, [vendors]);

  // Sync available vendor types across tabs/instances
  React.useEffect(() => {
    const syncTypes = () => {
      try {
        const stored = localStorage.getItem('raindrop_user_vendor_types_v2');
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAvailableTypes(Array.from(new Set([...STANDARD_VENDOR_TYPES, ...parsed])));
            return;
          }
        }
      } catch (err) {}
      setAvailableTypes([...STANDARD_VENDOR_TYPES]);
    };
    window.addEventListener('storage', syncTypes);
    window.addEventListener('raindrop_vendor_types_updated', syncTypes);
    return () => {
      window.removeEventListener('storage', syncTypes);
      window.removeEventListener('raindrop_vendor_types_updated', syncTypes);
    };
  }, []);

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

  const getInitialTypes = () => {
    if (Array.isArray(defaultTypes) && defaultTypes.length > 0) {
      return [...defaultTypes];
    }
    return [];
  };

  // Form State
  const [formData, setFormData] = useState(() => {
    const initTypes = getInitialTypes();
    const currentList = (Array.isArray(vendors) && vendors.length > 0)
      ? vendors
      : (() => {
          try {
            const s = localStorage.getItem('raindrop_vendors_v1');
            if (s) {
              const p = JSON.parse(s);
              if (Array.isArray(p)) return p;
            }
          } catch (e) {}
          return [];
        })();
    const maxNum = currentList.reduce((max, v) => {
      const match = (v.id || '').match(/\d+/);
      return match ? Math.max(max, parseInt(match[0], 10)) : max;
    }, 0);
    const nextId = `VEND-${String(maxNum + 1).padStart(4, '0')}`;

    if (isInline) {
      return {
        id: nextId,
        name: '',
        types: initTypes,
        type: initTypes.join(', '),
        customTypeInput: '',
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
      types: initTypes,
      type: initTypes.join(', '),
      customTypeInput: '',
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
    try {
      const stored = localStorage.getItem('raindrop_user_vendor_types_v2');
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAvailableTypes(Array.from(new Set([...STANDARD_VENDOR_TYPES, ...parsed])));
        }
      }
    } catch (e) {}
    const initTypes = getInitialTypes();
    setFormData({
      id: `VEND-${String(vendorList.length + 1).padStart(4, '0')}`,
      name: '',
      types: initTypes,
      type: initTypes.join(', '),
      customTypeInput: '',
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
    setIsModalEditMode(true);
    setActiveSection('all');
    setSelectedVendor(null);
  };

  const handleSelectVendor = (vendor, editDirectly = false) => {
    try {
      const stored = localStorage.getItem('raindrop_user_vendor_types_v2');
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAvailableTypes(Array.from(new Set([...STANDARD_VENDOR_TYPES, ...parsed])));
        }
      }
    } catch (e) {}
    setSelectedVendor(vendor);
    const vendorTypes = getVendorTypes(vendor);
    setFormData({
      ...vendor,
      types: vendorTypes,
      type: vendorTypes.join(', '),
      customTypeInput: ''
    });
    setFormErrors({});
    setIsCreatingNew(false);
    setIsEditing(editDirectly);
    setIsModalEditMode(editDirectly);
    setActiveSection('all');
  };

  const handleCloseModal = () => {
    setSelectedVendor(null);
    setIsCreatingNew(false);
    setIsEditing(false);
    setIsModalEditMode(false);
    setFormErrors({});
    if (isInline && onCloseInline) onCloseInline(null);
  };

  // Capitalize all letters (UPPERCASE) with 18L and 3 MM formatting
  const capitalizeWords = (str) => {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase())
      .replace(/(\d+)\s*L\b/gi, '$1L')
      .replace(/(\d+(?:\.\d+)?)\s*MM\b/gi, '$1 MM')
      .replace(/(\d+(?:\.\d+)?)\s*CM\b/gi, '$1 CM');
  };

  const handleTextChange = (field, val, autoCap = false) => {
    const value = autoCap ? capitalizeWords(val) : val;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Multi-select Vendor Type helpers
  const toggleVendorType = (typeItem) => {
    if (!isModalEditMode) return;
    setFormData((prev) => {
      const cur = Array.isArray(prev.types) ? [...prev.types] : (prev.type ? getVendorTypes(prev) : []);
      const exists = cur.some((t) => t.toLowerCase() === typeItem.toLowerCase());
      let updated;
      if (exists) {
        updated = cur.filter((t) => t.toLowerCase() !== typeItem.toLowerCase());
      } else {
        updated = [...cur, typeItem];
      }
      return {
        ...prev,
        types: updated,
        type: updated.join(', ')
      };
    });
    if (formErrors.type) {
      setFormErrors((prev) => ({ ...prev, type: null }));
    }
  };

  const handleRemoveType = (typeItem) => {
    if (!isModalEditMode) return;
    setFormData((prev) => {
      const cur = Array.isArray(prev.types) ? [...prev.types] : (prev.type ? getVendorTypes(prev) : []);
      const updated = cur.filter((t) => t.toLowerCase() !== typeItem.toLowerCase());
      return {
        ...prev,
        types: updated,
        type: updated.join(', ')
      };
    });
  };

  const handleDeleteAvailableType = (typeToDelete) => {
    // If it's a standard system type, don't delete from available choices, just unselect from current form
    if (STANDARD_VENDOR_TYPES.some((st) => st.toLowerCase() === typeToDelete.toLowerCase())) {
      handleRemoveType(typeToDelete);
      return;
    }
    setAvailableTypes((prev) => {
      const updated = prev.filter((t) => t.toLowerCase() !== typeToDelete.toLowerCase());
      try {
        localStorage.setItem('raindrop_user_vendor_types_v2', JSON.stringify(updated));
        window.dispatchEvent(new Event('raindrop_vendor_types_updated'));
      } catch (e) {}
      return updated;
    });
    // Also remove from selected vendor types if currently selected
    handleRemoveType(typeToDelete);
  };

  const handleResetAvailableTypes = () => {
    setAvailableTypes([...STANDARD_VENDOR_TYPES]);
    try {
      localStorage.setItem('raindrop_user_vendor_types_v2', JSON.stringify([...STANDARD_VENDOR_TYPES]));
      window.dispatchEvent(new Event('raindrop_vendor_types_updated'));
    } catch (e) {}
  };

  const handleAddCustomType = () => {
    if (!isModalEditMode) return;
    const val = (formData.customTypeInput || '').trim();
    if (!val) return;
    const capped = capitalizeWords(val);

    // 1. FIRST: Add to Available Types in "Click to Add" list and persist so it is saved permanently
    setAvailableTypes((prev) => {
      if (!prev.some((t) => t.toLowerCase() === capped.toLowerCase())) {
        const updated = [...prev, capped];
        try {
          localStorage.setItem('raindrop_user_vendor_types_v2', JSON.stringify(updated));
          window.dispatchEvent(new Event('raindrop_vendor_types_updated'));
        } catch (e) {}
        return updated;
      }
      return prev;
    });

    // 2. Select it for the current vendor form
    setFormData((prev) => {
      const cur = Array.isArray(prev.types) ? [...prev.types] : (prev.type ? getVendorTypes(prev) : []);
      if (!cur.some((t) => t.toLowerCase() === capped.toLowerCase())) {
        cur.push(capped);
      }
      return {
        ...prev,
        types: cur,
        type: cur.join(', '),
        customTypeInput: ''
      };
    });
    if (formErrors.type) {
      setFormErrors((prev) => ({ ...prev, type: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Vendor Name is mandatory';
    
    const curTypes = Array.isArray(formData.types) && formData.types.length > 0
      ? formData.types
      : (formData.type ? getVendorTypes(formData) : []);

    if (curTypes.length === 0) {
      errors.type = 'At least one Vendor Type must be selected';
    }
    if (formData.phone && formData.phone.length < 10)
      errors.phone = 'Phone Number must be 10 digits';
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email))
      errors.email = 'Invalid Email address format';
    if (formData.gstin && formData.gstin.length > 15)
      errors.gstin = 'GSTIN cannot exceed 15 characters';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const curTypes = Array.isArray(formData.types) && formData.types.length > 0
      ? formData.types
      : (formData.type ? getVendorTypes(formData) : ['Other']);
    const finalTypeString = curTypes.join(', ');

    const updatedVendor = {
      ...formData,
      name: capitalizeWords((formData.name || '').trim()),
      type: finalTypeString,
      types: curTypes,
      contactPerson: capitalizeWords((formData.contactPerson || '').trim()),
      address: (formData.address || '').trim(),
      city: capitalizeWords((formData.city || '').trim()),
      bankName: capitalizeWords((formData.bankName || '').trim()),
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
    setIsModalEditMode(false);

    if (api && api.saveVendor) {
      try {
        api.saveVendor(updatedVendor).catch((err) => {
          console.warn('API saveVendor error (falling back to localStorage):', err);
        });
      } catch (err) {}
    }

    try {
      localStorage.setItem('raindrop_vendors_v1', JSON.stringify(updatedList));
      if (curTypes && curTypes.length > 0) {
        setAvailableTypes((prev) => {
          const combined = Array.from(new Set([...prev, ...curTypes]));
          try {
            localStorage.setItem('raindrop_user_vendor_types_v2', JSON.stringify(combined));
            window.dispatchEvent(new Event('raindrop_vendor_types_updated'));
          } catch (e) {}
          return combined;
        });
      }
      window.dispatchEvent(new Event('raindrop_vendors_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {}

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
      setIsModalEditMode(false);
    }
    try {
      localStorage.setItem('raindrop_vendors_v1', JSON.stringify(updated));
      window.dispatchEvent(new Event('raindrop_vendors_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (err) { }
    if (api && api.deleteVendor) {
      try {
        api.deleteVendor(id);
      } catch (err) { }
    }
    if (onDeleteVendor) {
      onDeleteVendor(id);
    }
  };

  // Filtered List
  const filteredVendors = vendorList.filter((v) => {
    const vTypes = getVendorTypes(v);
    const matchesType = !colFilters.type ||
      vTypes.some((t) => t.toLowerCase() === colFilters.type.toLowerCase()) ||
      (v.type || '').toLowerCase().includes(colFilters.type.toLowerCase());

    return (
      v.id.toLowerCase().includes(colFilters.id.toLowerCase()) &&
      v.name.toLowerCase().includes(colFilters.name.toLowerCase()) &&
      matchesType &&
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
        {!isInline && (
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
                        {Array.from(new Set([
                          ...STANDARD_VENDOR_TYPES.filter(t => t !== 'Other'),
                          ...vendorList.flatMap(v => getVendorTypes(v))
                        ])).map((t) => (
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
                        onClick={() => handleSelectVendor(v, false)}
                      >
                        <td className="fw-medium text-dark">{v.name}</td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {getVendorTypes(v).map((t, idx) => (
                              <span key={idx} className="badge bg-primary-subtle text-primary border border-primary-subtle fs-11 fw-medium">
                                {t}
                              </span>
                            ))}
                            {getVendorTypes(v).length === 0 && (
                              <span className="text-muted fs-11">—</span>
                            )}
                          </div>
                        </td>
                        <td>{v.phone}</td>
                        <td className="font-monospace fs-12">{v.gstin || '-'}</td>
                        <td className="text-center text-warning">
                          {'★'.repeat(v.rating || 5)}
                          <span className="text-muted">{'☆'.repeat(5 - (v.rating || 5))}</span>
                        </td>
                        <td>
                          <span
                            className={`badge px-2 py-1 ${v.active
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
                            className="btn btn-sm btn-light text-primary p-1.5 rounded-2 me-1"
                            title="Edit Vendor"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectVendor(v, true);
                            }}
                          >
                            <i className="ti ti-edit fs-5"></i>
                          </button>
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
                      <td colSpan={7} className="text-center py-4 text-muted">
                        No vendors found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

        {/* POPUP MODAL: View / Edit / Create Vendor Dialog */}
        {(selectedVendor || isCreatingNew) && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1060, backdropFilter: 'blur(3px)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg rounded-4 p-4 bg-white">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary-subtle text-primary p-2 rounded-3">
                      <i className="ti ti-building fs-5"></i>
                    </span>
                    <div>
                      <h5 className="fw-bold text-dark mb-0 fs-18">
                        {isCreatingNew
                          ? 'Create New Vendor'
                          : (isModalEditMode ? `Edit Vendor: ${formData.name || ''}` : (formData.name || 'Vendor Details'))}
                      </h5>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {!isCreatingNew && (
                      !isModalEditMode ? (
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm rounded-3 px-3 fw-semibold d-flex align-items-center gap-1.5"
                          onClick={() => {
                            setIsModalEditMode(true);
                            setIsEditing(true);
                            setActiveSection('all');
                          }}
                        >
                          <i className="ti ti-edit"></i>
                          <span>Edit</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-light border text-secondary btn-sm rounded-3 px-3 fw-semibold d-flex align-items-center gap-1.5"
                          onClick={() => {
                            if (selectedVendor) {
                              const standardOptions = STANDARD_VENDOR_TYPES.filter(t => t !== 'Other');
                              const isStandard = standardOptions.includes(selectedVendor.type);
                              setFormData({
                                ...selectedVendor,
                                type: isStandard ? selectedVendor.type : (selectedVendor.type ? 'Other' : ''),
                                customType: isStandard ? '' : (selectedVendor.type || '')
                              });
                            }
                            setFormErrors({});
                            setIsModalEditMode(false);
                            setIsEditing(false);
                          }}
                        >
                          <i className="ti ti-eye"></i>
                          <span>View Mode</span>
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      className="btn-close ms-2"
                      onClick={handleCloseModal}
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
                        {!isModalEditMode && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-primary fs-12 text-decoration-none fw-semibold"
                            onClick={() => {
                              setIsModalEditMode(true);
                              setIsEditing(true);
                              setActiveSection('all');
                            }}
                          >
                            <i className="ti ti-edit me-1"></i>Edit
                          </button>
                        )}
                      </div>

                      <div className="row g-2">
                        <div className="col-12">
                          <label className="form-label fs-12 fw-semibold mb-1">Vendor Name *</label>
                          <input
                            type="text"
                            required
                            disabled={!isModalEditMode}
                            style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                            className={`form-control form-control-sm ${formErrors.name ? 'is-invalid' : ''
                              }`}
                            placeholder="e.g. Sahil Textile Mill"
                            value={formData.name || ''}
                            onChange={(e) => handleTextChange('name', e.target.value, true)}
                          />
                          {isModalEditMode && (
                            <div className="form-text small text-muted">Title Case (e.g. Sahil Textile Mill)</div>
                          )}
                          {formErrors.name && (
                            <div className="invalid-feedback fs-11 d-block">{formErrors.name}</div>
                          )}
                        </div>

                        <div className="col-12">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <label className="form-label fs-12 fw-semibold mb-0">
                              Vendor Types * <span className="text-muted fw-normal fs-11">(Multi-select: select all that apply)</span>
                            </label>
                            {isModalEditMode && (
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-11 fw-semibold">
                                {(formData.types || []).length} selected
                              </span>
                            )}
                          </div>

                          {/* 1. Selected Types Badges */}
                          <div
                            className="border rounded-2 mb-2"
                            style={{
                              backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc',
                              minHeight: '38px',
                              padding: '5px 8px',
                              borderColor: formErrors.type ? '#dc3545' : '#cbd5e1'
                            }}
                          >
                            <div className="d-flex flex-wrap gap-1.5 align-items-center">
                              {(formData.types && formData.types.length > 0) ? (
                                formData.types.map((t) => (
                                  <span
                                    key={t}
                                    className="badge d-inline-flex align-items-center rounded-pill"
                                    style={{
                                      backgroundColor: '#eff6ff',
                                      color: '#1e40af',
                                      border: '1px solid #bfdbfe',
                                      fontSize: '11.5px',
                                      fontWeight: 600,
                                      padding: '3px 8px 3px 10px',
                                      gap: '6px'
                                    }}
                                  >
                                    <span>{t}</span>
                                    {isModalEditMode && (
                                      <button
                                        type="button"
                                        className="btn p-0 border-0 bg-transparent text-danger d-inline-flex align-items-center justify-content-center"
                                        style={{
                                          width: '15px',
                                          height: '15px',
                                          borderRadius: '50%',
                                          backgroundColor: '#fee2e2',
                                          cursor: 'pointer',
                                          lineHeight: 1
                                        }}
                                        title={`Remove ${t}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveType(t);
                                        }}
                                      >
                                        <i className="ti ti-x" style={{ fontSize: '9px', fontWeight: 'bold' }}></i>
                                      </button>
                                    )}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted fs-11 fst-italic">
                                  {isModalEditMode ? 'No vendor types selected. Click options below to add.' : '—'}
                                </span>
                              )}
                            </div>
                          </div>

                          {formErrors.type && (
                            <div className="invalid-feedback fs-11 d-block mb-1">{formErrors.type}</div>
                          )}

                          {/* 2. "CLICK TO ADD" Quick Suggestions (Clean, Proper Chips) */}
                          {isModalEditMode && (
                            <div
                              className="rounded-3 mb-2 border"
                              style={{
                                backgroundColor: '#f8fafc',
                                borderColor: '#e2e8f0',
                                padding: '8px 12px'
                              }}
                            >
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <div className="d-flex align-items-center gap-1.5">
                                  <i className="ti ti-hand-click text-primary" style={{ fontSize: '13px' }}></i>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                    Click to Add / Remove:
                                  </span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  {availableTypes.length > 0 && (
                                    <>
                                      <span className="text-muted" style={{ fontSize: '11px' }}>
                                        Click tag to select | (×) delete
                                      </span>
                                      <button
                                        type="button"
                                        className="btn btn-link p-0 text-muted text-decoration-none d-inline-flex align-items-center gap-1"
                                        style={{ fontSize: '11px' }}
                                        onClick={handleResetAvailableTypes}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                                        title="Clear all saved vendor types"
                                      >
                                        <i className="ti ti-trash" style={{ fontSize: '11px' }}></i>
                                        <span>Clear All</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {availableTypes.length > 0 ? (
                                <div className="d-flex flex-wrap gap-1.5">
                                  {availableTypes.map((typeItem) => {
                                    const isSelected = (formData.types || []).some(
                                      (t) => t.toLowerCase() === typeItem.toLowerCase()
                                    );

                                    const isStandardType = STANDARD_VENDOR_TYPES.some((st) => st.toLowerCase() === typeItem.toLowerCase());

                                    return (
                                      <div
                                        key={typeItem}
                                        className="d-inline-flex align-items-center transition-all"
                                        style={{
                                          fontSize: '12px',
                                          fontWeight: isSelected ? 600 : 500,
                                          borderRadius: '16px',
                                          border: isSelected ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                                          color: isSelected ? '#1d4ed8' : '#0f172a',
                                          height: '30px',
                                          boxShadow: isSelected ? '0 1px 3px rgba(37, 99, 235, 0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        <div
                                          className={`d-inline-flex align-items-center py-0 ps-2.5 ${isStandardType ? 'pe-2.5' : 'pe-1'}`}
                                          style={{ cursor: 'pointer', gap: '5px', height: '100%' }}
                                          onClick={() => toggleVendorType(typeItem)}
                                          title={isSelected ? `Click to unselect ${typeItem}` : `Click to select ${typeItem}`}
                                        >
                                          <i
                                            className={isSelected ? "ti ti-check text-primary" : "ti ti-plus text-muted"}
                                            style={{ fontSize: '11px', fontWeight: 'bold' }}
                                          />
                                          <span style={{ color: isSelected ? '#1d4ed8' : '#0f172a', fontWeight: isSelected ? 600 : 500 }}>{typeItem}</span>
                                        </div>
                                        {!isStandardType && (
                                          <button
                                            type="button"
                                            className="btn p-0 border-0 bg-transparent d-inline-flex align-items-center justify-content-center"
                                            style={{
                                              cursor: 'pointer',
                                              color: '#94a3b8',
                                              width: '18px',
                                              height: '18px',
                                              borderRadius: '50%',
                                              marginLeft: '4px',
                                              marginRight: '6px',
                                              lineHeight: 1,
                                              transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.backgroundColor = '#fee2e2';
                                              e.currentTarget.style.color = '#ef4444';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.backgroundColor = 'transparent';
                                              e.currentTarget.style.color = '#94a3b8';
                                            }}
                                            title={`Delete custom type "${typeItem}"`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteAvailableType(typeItem);
                                            }}
                                          >
                                            <i className="ti ti-x" style={{ fontSize: '10px', fontWeight: 'bold' }}></i>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-muted fst-italic py-1 d-flex align-items-center gap-1.5" style={{ fontSize: '11px' }}>
                                  <i className="ti ti-info-circle text-primary"></i>
                                  <span>No vendor types yet. Type below and click <strong>+ Add Type</strong> to create.</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 3. Custom Vendor Type Input + Button */}
                          {isModalEditMode && (
                            <div className="mb-2">
                              <div className="input-group">
                                <input
                                  type="text"
                                  list="vendorTypesSuggestions"
                                  className="form-control bg-white shadow-none"
                                  style={{ fontSize: '12px', height: '35px', color: '#0f172a', borderColor: '#cbd5e1', padding: '4px 12px' }}
                                  placeholder="Type custom type (e.g. Printing, Dyeing)..."
                                  value={formData.customTypeInput || ''}
                                  onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, customTypeInput: capitalizeWords(e.target.value) }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddCustomType();
                                    }
                                  }}
                                />
                                <datalist id="vendorTypesSuggestions">
                                  {availableTypes.map((t) => (
                                    <option key={t} value={t} />
                                  ))}
                                </datalist>
                                <button
                                  type="button"
                                  className="btn btn-primary px-3 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
                                  style={{ height: '35px', fontSize: '12px', backgroundColor: '#2563eb', borderColor: '#2563eb' }}
                                  onClick={handleAddCustomType}
                                >
                                  <i className="ti ti-plus" style={{ fontSize: '12px', fontWeight: 'bold' }}></i>
                                  <span>Add Type</span>
                                </button>
                              </div>
                              <div className="text-muted mt-1" style={{ fontSize: '11px' }}>
                                Type any vendor type (or choose from suggestions) and click <strong>+ Add Type</strong>.
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="col-6">
                          <label className="form-label fs-12 fw-semibold mb-1">Rating (1-5 ★)</label>
                          <div
                            className="d-flex align-items-center gap-1 text-warning fs-18"
                            style={{
                              cursor: isModalEditMode ? 'pointer' : 'default',
                              pointerEvents: isModalEditMode ? 'auto' : 'none'
                            }}
                          >
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                onClick={() => isModalEditMode && setFormData({ ...formData, rating: star })}
                              >
                                {star <= (formData.rating || 5) ? '★' : '☆'}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="col-12 mt-2">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="activeToggle"
                              disabled={!isModalEditMode}
                              style={{ cursor: isModalEditMode ? 'pointer' : 'default' }}
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
                        {!isModalEditMode && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-primary fs-12 text-decoration-none fw-semibold"
                            onClick={() => {
                              setIsModalEditMode(true);
                              setIsEditing(true);
                              setActiveSection('all');
                            }}
                          >
                            <i className="ti ti-edit me-1"></i>Edit
                          </button>
                        )}
                      </div>

                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label fs-12 fw-semibold mb-1">Phone Number</label>
                          <input
                            type="text"
                            maxLength="10"
                            placeholder="e.g. 9876543210"
                            disabled={!isModalEditMode}
                            style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                            className={`form-control form-control-sm ${formErrors.phone ? 'is-invalid' : ''
                              }`}
                            value={formData.phone || ''}
                            onChange={(e) => handleTextChange('phone', e.target.value.replace(/\D/g, ''))}
                          />
                          {formErrors.phone && (
                            <div className="invalid-feedback fs-11 d-block">{formErrors.phone}</div>
                          )}
                        </div>

                        <div className="col-6">
                          <label className="form-label fs-12 fw-semibold mb-1">Contact Person</label>
                          <input
                            type="text"
                            placeholder="e.g. Rajesh Shah"
                            disabled={!isModalEditMode}
                            style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                            className="form-control form-control-sm"
                            value={formData.contactPerson || ''}
                            onChange={(e) => handleTextChange('contactPerson', e.target.value, true)}
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label fs-12 fw-semibold mb-1">Email</label>
                          <input
                            type="email"
                            placeholder="e.g. contact@supplier.com"
                            disabled={!isModalEditMode}
                            style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                            className={`form-control form-control-sm ${formErrors.email ? 'is-invalid' : ''
                              }`}
                            value={formData.email || ''}
                            onChange={(e) => handleTextChange('email', e.target.value)}
                          />
                          {formErrors.email && (
                            <div className="invalid-feedback fs-11 d-block">{formErrors.email}</div>
                          )}
                        </div>

                        <div className="col-12">
                          <label className="form-label fs-12 fw-semibold mb-1">Address</label>
                          <textarea
                            rows="2"
                            placeholder="e.g. Plot No. 42, GIDC Industrial Estate"
                            disabled={!isModalEditMode}
                            style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                            className="form-control form-control-sm fs-12"
                            value={formData.address || ''}
                            onChange={(e) => handleTextChange('address', e.target.value)}
                          ></textarea>
                        </div>

                        <div className="col-6">
                          <label className="form-label fs-12 fw-semibold mb-1">City</label>
                          <input
                            type="text"
                            placeholder="e.g. Surat"
                            disabled={!isModalEditMode}
                            style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                            className="form-control form-control-sm"
                            value={formData.city || ''}
                            onChange={(e) => handleTextChange('city', e.target.value, true)}
                          />
                        </div>

                        <div className="col-6">
                          <label className="form-label fs-12 fw-semibold mb-1">State</label>
                          <select
                            disabled={!isModalEditMode}
                            style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                            className="form-select form-select-sm"
                            value={formData.state || ''}
                            onChange={(e) => handleTextChange('state', e.target.value)}
                          >
                            <option value="">Select State</option>
                            {INDIAN_STATES.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: Tax & Banking Information */}
                    <div className="mb-4 p-3 bg-light rounded-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-bold text-secondary fs-12 text-uppercase tracking-wider">
                          3. GSTIN &amp; Banking Details
                        </span>
                        {!isModalEditMode && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-primary fs-12 text-decoration-none fw-semibold"
                            onClick={() => {
                              setIsModalEditMode(true);
                              setIsEditing(true);
                              setActiveSection('all');
                            }}
                          >
                            <i className="ti ti-edit me-1"></i>Edit
                          </button>
                        )}
                      </div>

                      <div className="row g-2">
                        <div className="col-12">
                          <label className="form-label fs-12 fw-semibold mb-1">GSTIN (15 characters)</label>
                          <input
                            type="text"
                            maxLength="15"
                            placeholder="e.g. 24AFQPA0986G1ZA"
                            disabled={!isModalEditMode}
                            style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                            className={`form-control form-control-sm font-monospace text-uppercase ${formErrors.gstin ? 'is-invalid' : ''
                              }`}
                            value={formData.gstin || ''}
                            onChange={(e) => handleTextChange('gstin', e.target.value.toUpperCase())}
                          />
                          {formErrors.gstin && (
                            <div className="invalid-feedback fs-11 d-block">{formErrors.gstin}</div>
                          )}
                        </div>

                        <div className="col-12">
                          <label className="form-label fs-12 fw-semibold mb-1">Bank Name</label>
                          <input
                            type="text"
                            placeholder="e.g. HDFC Bank"
                            disabled={!isModalEditMode}
                            style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                            className="form-control form-control-sm"
                            value={formData.bankName || ''}
                            onChange={(e) => handleTextChange('bankName', e.target.value, true)}
                          />
                        </div>

                        <div className="col-6">
                          <label className="form-label fs-12 fw-semibold mb-1">Account Number</label>
                          <input
                            type="text"
                            placeholder="e.g. 50200012345678"
                            disabled={!isModalEditMode}
                            style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                            className="form-control form-control-sm font-monospace"
                            value={formData.accountNumber || ''}
                            onChange={(e) => handleTextChange('accountNumber', e.target.value)}
                          />
                        </div>

                        <div className="col-6">
                          <label className="form-label fs-12 fw-semibold mb-1">IFSC Code</label>
                          <input
                            type="text"
                            maxLength="11"
                            placeholder="e.g. HDFC0001234"
                            disabled={!isModalEditMode}
                            style={{ backgroundColor: isModalEditMode ? '#ffffff' : '#f8fafc' }}
                            className="form-control form-control-sm font-monospace text-uppercase"
                            value={formData.ifscCode || ''}
                            onChange={(e) => handleTextChange('ifscCode', e.target.value.toUpperCase())}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer Buttons */}
                  <div className="d-flex align-items-center justify-content-end gap-2 pt-3 border-top mt-3">
                    {!isModalEditMode ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-light px-4 rounded-3"
                          onClick={handleCloseModal}
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary rounded-3 px-4 fw-semibold d-flex align-items-center gap-1.5"
                          onClick={() => {
                            setIsModalEditMode(true);
                            setIsEditing(true);
                            setActiveSection('all');
                          }}
                        >
                          <i className="ti ti-edit me-1"></i> Edit Vendor
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-light px-4 rounded-3"
                          onClick={() => {
                            if (isCreatingNew) {
                              handleCloseModal();
                            } else {
                              if (selectedVendor) {
                                const standardOptions = STANDARD_VENDOR_TYPES.filter(t => t !== 'Other');
                                const isStandard = standardOptions.includes(selectedVendor.type);
                                setFormData({
                                  ...selectedVendor,
                                  type: isStandard ? selectedVendor.type : (selectedVendor.type ? 'Other' : ''),
                                  customType: isStandard ? '' : (selectedVendor.type || '')
                                });
                              }
                              setFormErrors({});
                              setIsModalEditMode(false);
                              setIsEditing(false);
                            }
                          }}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary px-4 fw-semibold rounded-3 shadow-sm">
                          <i className="ti ti-check me-1"></i> Save Vendor
                        </button>
                      </>
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
