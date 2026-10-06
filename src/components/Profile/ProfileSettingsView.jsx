import React, { useState } from 'react';

/**
 * Modern Profile & Settings View
 * Tabs:
 * 1. Profile Settings (Basic Info, Avatar, Address Information)
 * 2. Change Password (Security)
 * 3. Notifications (Toggles for Email, SMS, In-App for ERP events)
 */
export default function ProfileSettingsView({
  currentUser = {
    name: 'Saksham Garg',
    role: 'Procurement & Quality Manager',
    email: 'saksham.garg@rainerp.com',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
    addressLine1: 'Rain Textiles Pvt Ltd, Ring Road',
    addressLine2: 'Industrial Area',
    country: 'India',
    state: 'Gujarat',
    city: 'Surat',
    pincode: '395002'
  },
  onUpdateUser,
  onBack
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'password', 'notifications'

  // Profile Form State
  const nameParts = (currentUser.name || '').split(' ');
  const [profileForm, setProfileForm] = useState({
    firstName: nameParts[0] || 'Saksham',
    lastName: nameParts.slice(1).join(' ') || 'Garg',
    email: currentUser.email || 'saksham.garg@rainerp.com',
    phone: currentUser.phone || '+91 98765 43210',
    avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
    addressLine1: currentUser.addressLine1 || '',
    addressLine2: currentUser.addressLine2 || '',
    country: currentUser.country || 'India',
    state: currentUser.state || 'Gujarat',
    city: currentUser.city || 'Surat',
    pincode: currentUser.pincode || '395002'
  });

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Notification Preferences State (Matching user screenshot)
  const [notifications, setNotifications] = useState([
    {
      id: 'po_booking',
      title: 'New Purchase Order & GRN Booking',
      desc: 'Alert when a new purchase order or GRN inward is created',
      icon: 'ti ti-file-invoice',
      email: true,
      sms: true,
      inApp: true
    },
    {
      id: 'tolerance_hold',
      title: 'Tolerance Hold & Approval Alert',
      desc: 'Alert if buffer tolerance is exceeded and requires admin justification',
      icon: 'ti ti-alert-triangle',
      email: true,
      sms: true,
      inApp: true
    },
    {
      id: 'qc_report',
      title: 'Quality Check (QC) Report Ready',
      desc: 'Notify when fabric QC inspection outcome is recorded',
      icon: 'ti ti-circle-check',
      email: true,
      sms: false,
      inApp: true
    },
    {
      id: 'rejected_pool',
      title: 'Rejected Stock Pool Actions',
      desc: 'Follow-up alerts when defective fabric is routed to supplier return',
      icon: 'ti ti-refresh-alert',
      email: true,
      sms: true,
      inApp: true
    },
    {
      id: 'vendor_invoice',
      title: 'Vendor Billing / Invoice Notification',
      desc: 'Notify when a new invoice is generated or verified against PO',
      icon: 'ti ti-receipt-2',
      email: true,
      sms: false,
      inApp: true
    },
    {
      id: 'system_alerts',
      title: 'Security & System Alerts',
      desc: 'Login attempts, data changes, or ERP system updates',
      icon: 'ti ti-shield-lock',
      email: true,
      sms: true,
      inApp: true
    }
  ]);

  const [toastMessage, setToastMessage] = useState('');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = {
      ...currentUser,
      name: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
      email: profileForm.email,
      phone: profileForm.phone,
      avatar: profileForm.avatar,
      addressLine1: profileForm.addressLine1,
      addressLine2: profileForm.addressLine2,
      country: profileForm.country,
      state: profileForm.state,
      city: profileForm.city,
      pincode: profileForm.pincode
    };

    if (onUpdateUser) onUpdateUser(updated);
    setToastMessage('Profile information saved successfully!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New Password and Confirm Password do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setToastMessage('Password updated successfully!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleToggleNotification = (id, channel) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [channel]: !item[channel] } : item
      )
    );
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfileForm((prev) => ({ ...prev, avatar: url }));
    }
  };

  return (
    <div className="p-4" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 1099, marginTop: '60px' }}
        >
          <div className="alert alert-success shadow-lg border-0 d-flex align-items-center gap-2 py-2 px-3 fs-13 rounded-3">
            <i className="ti ti-check fs-18"></i>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-muted fs-12">
              <li className="breadcrumb-item">Account</li>
              <li className="breadcrumb-item active text-primary fw-medium">Settings</li>
            </ol>
          </nav>
          <h3 className="fw-bold text-dark mb-0 fs-22">Settings</h3>
        </div>

        {onBack && (
          <button
            type="button"
            className="btn btn-light border btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-secondary fw-medium"
            onClick={onBack}
          >
            <i className="ti ti-arrow-left fs-14"></i>
            <span>Back to Dashboard</span>
          </button>
        )}
      </div>

      <div className="row g-4">
        {/* Left Sidebar Menu */}
        <div className="col-12 col-md-3 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-2 bg-white">
            <div className="d-flex flex-column gap-1">
              <button
                type="button"
                className={`btn text-start d-flex align-items-center gap-2.5 px-3 py-2.5 rounded-3 fs-13 fw-semibold transition-all ${
                  activeTab === 'profile'
                    ? 'btn-primary text-white shadow-sm'
                    : 'btn-light text-secondary bg-transparent'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="ti ti-user fs-17"></i>
                <span>Profile Settings</span>
              </button>

              <button
                type="button"
                className={`btn text-start d-flex align-items-center gap-2.5 px-3 py-2.5 rounded-3 fs-13 fw-semibold transition-all ${
                  activeTab === 'password'
                    ? 'btn-primary text-white shadow-sm'
                    : 'btn-light text-secondary bg-transparent'
                }`}
                onClick={() => setActiveTab('password')}
              >
                <i className="ti ti-lock-password fs-17"></i>
                <span>Change Password</span>
              </button>

              <button
                type="button"
                className={`btn text-start d-flex align-items-center gap-2.5 px-3 py-2.5 rounded-3 fs-13 fw-semibold transition-all ${
                  activeTab === 'notifications'
                    ? 'btn-primary text-white shadow-sm'
                    : 'btn-light text-secondary bg-transparent'
                }`}
                onClick={() => setActiveTab('notifications')}
              >
                <i className="ti ti-bell fs-17"></i>
                <span>Notifications</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Main Content Panel */}
        <div className="col-12 col-md-9 col-lg-9">
          {/* TAB 1: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <form onSubmit={handleSaveProfile}>
                {/* Basic Information Section */}
                <h5 className="fw-bold text-dark mb-4 fs-16 pb-2 border-bottom">
                  Basic Information
                </h5>

                <div className="mb-4">
                  <label className="form-label fs-12 fw-semibold text-secondary d-block mb-2">
                    Profile Image *
                  </label>
                  <div className="d-flex align-items-center gap-3">
                    <div className="position-relative" style={{ width: '84px', height: '84px' }}>
                      <img
                        src={profileForm.avatar}
                        alt="Profile"
                        className="rounded-circle border shadow-sm w-100 h-100 object-fit-cover"
                      />
                      <label
                        htmlFor="avatarInput"
                        className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-1.5 shadow-sm d-flex align-items-center justify-content-center cursor-pointer"
                        style={{ width: '28px', height: '28px', cursor: 'pointer' }}
                        title="Upload New Photo"
                      >
                        <i className="ti ti-camera fs-14"></i>
                      </label>
                      <input
                        type="file"
                        id="avatarInput"
                        accept="image/*"
                        className="d-none"
                        onChange={handleAvatarChange}
                      />
                    </div>
                    <div>
                      <div className="fw-bold text-dark fs-14">{currentUser.name}</div>
                      <div className="text-muted fs-12">{currentUser.role}</div>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-control bg-light fs-13"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-control bg-light fs-13"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="form-control bg-light fs-13"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      className="form-control bg-light fs-13"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Address Information Section */}
                <h5 className="fw-bold text-dark mb-3 fs-16 pt-3 pb-2 border-bottom">
                  Address Information
                </h5>

                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light fs-13"
                      placeholder="e.g. Ring Road, Mill Compound"
                      value={profileForm.addressLine1}
                      onChange={(e) => setProfileForm({ ...profileForm, addressLine1: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light fs-13"
                      placeholder="e.g. Industrial Area"
                      value={profileForm.addressLine2}
                      onChange={(e) => setProfileForm({ ...profileForm, addressLine2: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                      Country
                    </label>
                    <select
                      className="form-select bg-light fs-13"
                      value={profileForm.country}
                      onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                    >
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                      State
                    </label>
                    <select
                      className="form-select bg-light fs-13"
                      value={profileForm.state}
                      onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    >
                      <option value="Gujarat">Gujarat</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Delhi">Delhi</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                      City
                    </label>
                    <select
                      className="form-select bg-light fs-13"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    >
                      <option value="Surat">Surat</option>
                      <option value="Ahmedabad">Ahmedabad</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Ichalkaranji">Ichalkaranji</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light fs-13"
                      placeholder="395002"
                      value={profileForm.pincode}
                      onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-end gap-2 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-light fs-13 px-4 py-2"
                    onClick={onBack}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fs-13 px-4 py-2 fw-semibold shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: CHANGE PASSWORD */}
          {activeTab === 'password' && (
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <form onSubmit={handleSavePassword}>
                <h5 className="fw-bold text-dark mb-4 fs-16 pb-2 border-bottom">
                  Change Password
                </h5>

                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                      New Password *
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <i className="ti ti-lock fs-14"></i>
                      </span>
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        placeholder="Enter new password"
                        className="form-control bg-light border-start-0 border-end-0 fs-13"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        className="input-group-text bg-light border-start-0 text-muted"
                        onClick={() => setShowNewPass(!showNewPass)}
                      >
                        <i className={`ti ${showNewPass ? 'ti-eye-off' : 'ti-eye'} fs-14`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                      Confirm Password *
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <i className="ti ti-lock fs-14"></i>
                      </span>
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        required
                        placeholder="Confirm new password"
                        className="form-control bg-light border-start-0 border-end-0 fs-13"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        className="input-group-text bg-light border-start-0 text-muted"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                      >
                        <i className={`ti ${showConfirmPass ? 'ti-eye-off' : 'ti-eye'} fs-14`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-end gap-2 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-light fs-13 px-4 py-2"
                    onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fs-13 px-4 py-2 fw-semibold shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold text-dark mb-4 fs-16 pb-2 border-bottom">
                Notifications
              </h5>

              <div className="d-flex flex-column gap-3">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-3 border bg-white d-flex flex-wrap align-items-center justify-content-between gap-3"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-3 bg-light text-primary"
                        style={{ width: '42px', height: '42px' }}
                      >
                        <i className={`${item.icon} fs-20`}></i>
                      </div>
                      <div>
                        <div className="fw-bold text-dark fs-14">{item.title}</div>
                        <div className="text-secondary fs-12">{item.desc}</div>
                      </div>
                    </div>

                    {/* Channel Toggles (Email, SMS, In App) matching user image */}
                    <div className="d-flex align-items-center gap-4">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fs-12 text-secondary fw-medium">Email</span>
                        <div className="form-check form-switch m-0">
                          <input
                            className="form-check-input cursor-pointer"
                            type="checkbox"
                            checked={item.email}
                            onChange={() => handleToggleNotification(item.id, 'email')}
                          />
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <span className="fs-12 text-secondary fw-medium">SMS</span>
                        <div className="form-check form-switch m-0">
                          <input
                            className="form-check-input cursor-pointer"
                            type="checkbox"
                            checked={item.sms}
                            onChange={() => handleToggleNotification(item.id, 'sms')}
                          />
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <span className="fs-12 text-secondary fw-medium">In App</span>
                        <div className="form-check form-switch m-0">
                          <input
                            className="form-check-input cursor-pointer"
                            type="checkbox"
                            checked={item.inApp}
                            onChange={() => handleToggleNotification(item.id, 'inApp')}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
