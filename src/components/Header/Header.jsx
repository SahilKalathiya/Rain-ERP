import React, { useState, useRef, useEffect } from 'react';

/**
 * Top Navbar Header Component with Interactive User Profile Dropdown
 */
export default function Header({
  currentUser = {
    name: 'Saksham Garg',
    role: 'Procurement & Quality Manager',
    email: 'saksham.garg@rainerp.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
  },
  onNavigate,
  onOpenAuth,
  onLogout
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="navbar navbar-expand bg-white border-bottom px-4 py-2 sticky-top shadow-none" style={{ zIndex: 1040 }}>
      <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
        {/* Search */}
        <div className="d-flex align-items-center gap-2" style={{ width: '380px' }}>
          <div className="input-group">
            <span className="input-group-text bg-light border-0 text-muted">
              <i className="ti ti-search fs-15"></i>
            </span>
            <input
              type="text"
              className="form-control bg-light border-0 fs-13"
              placeholder="Search anything across ERP..."
            />
            <span className="input-group-text bg-light border-0 text-muted fs-11">
              <kbd className="bg-white border text-secondary px-1 rounded">⌘K</kbd>
            </span>
          </div>
        </div>

        {/* Right Tools */}
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-2 rounded-pill px-3 py-1 fs-12 shadow-sm"
          >
            <i className="ti ti-sparkles fs-13"></i>
            <span>AI Assistance</span>
          </button>

          <button
            type="button"
            className="btn btn-light btn-sm rounded-circle p-2 text-secondary"
            title="Theme Mode"
          >
            <i className="ti ti-moon fs-16"></i>
          </button>

          {/* User Profile Trigger & Dropdown Menu */}
          <div className="position-relative ms-2" ref={dropdownRef}>
            <div
              className="d-flex align-items-center gap-2 cursor-pointer p-1 rounded-pill hover-bg-light transition-all"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="rounded-circle border"
                style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces';
                }}
              />
            </div>

            {/* Custom Dropdown matching Image 1 */}
            {showDropdown && (
              <div
                className="position-absolute end-0 mt-2 bg-white rounded-4 shadow-xl border p-3 transition-all"
                style={{
                  width: '280px',
                  zIndex: 1050,
                  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15)',
                  borderColor: '#e2e8f0'
                }}
              >
                {/* User Info Header */}
                <div className="d-flex align-items-center gap-3 pb-3 mb-2 border-bottom">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="rounded-circle border shadow-xs"
                    style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <h6 className="fw-bold text-dark mb-0 fs-14 text-truncate">{currentUser.name}</h6>
                    <span className="text-secondary fs-12 text-truncate d-block">{currentUser.role}</span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="d-flex flex-column gap-1">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none text-dark d-flex align-items-center gap-2.5 px-2.5 py-2 rounded-2 fs-13 text-start hover-bg transition-all"
                    onClick={() => {
                      setShowDropdown(false);
                      if (onNavigate) onNavigate('/profile-settings');
                    }}
                  >
                    <i className="ti ti-user-circle fs-17 text-secondary"></i>
                    <span className="fw-medium">Profile Settings</span>
                  </button>

                  <div className="d-flex align-items-center justify-content-between px-2.5 py-2 rounded-2 fs-13 hover-bg transition-all">
                    <div className="d-flex align-items-center gap-2.5 text-dark">
                      <i className="ti ti-bell fs-17 text-secondary"></i>
                      <span className="fw-medium">Notifications</span>
                    </div>
                    <div className="form-check form-switch m-0 d-flex align-items-center">
                      <input
                        className="form-check-input cursor-pointer"
                        type="checkbox"
                        id="headerNotificationToggle"
                        style={{ cursor: 'pointer', width: '36px', height: '20px' }}
                        checked={notificationsEnabled}
                        onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-link text-decoration-none text-dark d-flex align-items-center gap-2.5 px-2.5 py-2 rounded-2 fs-13 text-start hover-bg transition-all"
                    onClick={() => {
                      setShowDropdown(false);
                      if (onNavigate) onNavigate('/dashboard');
                    }}
                  >
                    <i className="ti ti-notes fs-17 text-secondary"></i>
                    <span className="fw-medium">Activity Logs</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-link text-decoration-none text-dark d-flex align-items-center gap-2.5 px-2.5 py-2 rounded-2 fs-13 text-start hover-bg transition-all"
                    onClick={() => {
                      setShowDropdown(false);
                      alert('Help & Support: Call +91 98765 43210 or email support@rainerp.com');
                    }}
                  >
                    <i className="ti ti-help-circle fs-17 text-secondary"></i>
                    <span className="fw-medium">Help &amp; Support</span>
                  </button>
                </div>

                {/* Logout Divider & Action */}
                <div className="pt-2 mt-2 border-top">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none text-danger d-flex align-items-center gap-2 px-2 py-2 rounded-2 fs-13 w-100 text-start"
                    onClick={() => {
                      setShowDropdown(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    <i className="ti ti-logout fs-17 text-danger"></i>
                    <span className="fw-semibold">Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

