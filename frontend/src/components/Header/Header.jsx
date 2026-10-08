import React, { useState, useRef, useEffect } from 'react';

/**
 * Top Navbar Header Component with Interactive User Profile & Notification Dropdowns
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
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const profileDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const notificationsList = [
    { id: 1, title: 'PO-TEST-01 Delivered', time: '10 mins ago', icon: 'ti-truck', bg: 'bg-primary-subtle text-primary' },
    { id: 2, title: 'QC Inspection Batch #204 Passed', time: '1 hour ago', icon: 'ti-check', bg: 'bg-success-subtle text-success' },
    { id: 3, title: 'New Vendor Surat Rayon Added', time: 'Yesterday', icon: 'ti-building', bg: 'bg-info-subtle text-info' }
  ];

  return (
    <header className="navbar navbar-expand bg-white border-bottom px-4 py-2 sticky-top shadow-none" style={{ zIndex: 1040 }}>
      <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
        {/* Search */}
        <div className="position-relative" style={{ width: '380px' }}>
          <i
            className="ti ti-search position-absolute text-muted fs-15"
            style={{
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              zIndex: 2
            }}
          ></i>
          <input
            type="text"
            className="form-control bg-light fs-13 search-input-integrated"
            style={{
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}
            placeholder="Search anything across ERP..."
          />
        </div>

        {/* Right Tools & Menus */}
        <div className="d-flex align-items-center gap-2.5">
          {/* AI Assistance Button */}
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-2 rounded-pill px-3 py-1 fs-12 shadow-sm"
          >
            <i className="ti ti-sparkles fs-13"></i>
            <span>AI Assistance</span>
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center border"
            style={{ width: '36px', height: '36px', color: '#64748b' }}
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            <i className={`ti ti-${isDarkMode ? 'sun' : 'moon'} fs-16`}></i>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center border"
            style={{ width: '36px', height: '36px', color: '#64748b' }}
            title="Toggle Fullscreen"
            onClick={toggleFullscreen}
          >
            <i className="ti ti-maximize fs-16"></i>
          </button>

          {/* Notifications Dropdown */}
          <div className="position-relative" ref={notifDropdownRef}>
            <button
              type="button"
              className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center border position-relative"
              style={{ width: '36px', height: '36px', color: '#64748b' }}
              title="Notifications"
              onClick={() => {
                setShowNotificationDropdown(!showNotificationDropdown);
                setShowProfileDropdown(false);
              }}
            >
              <i className="ti ti-bell fs-16"></i>
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white"
                style={{ fontSize: '9px', padding: '3px 5px', transform: 'translate(-30%, 15%)' }}
              >
                3
              </span>
            </button>

            {showNotificationDropdown && (
              <div
                className="position-absolute end-0 mt-2 bg-white rounded-4 shadow-xl border overflow-hidden transition-all"
                style={{
                  width: '320px',
                  zIndex: 1050,
                  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
                  borderColor: '#e2e8f0'
                }}
              >
                <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-light">
                  <div className="fw-bold text-dark fs-14">Notifications</div>
                  <span className="badge bg-primary-subtle text-primary fw-semibold">3 New</span>
                </div>
                <div className="p-2 d-flex flex-column gap-1" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notificationsList.map((n) => (
                    <div
                      key={n.id}
                      className="d-flex align-items-start gap-2.5 p-2 rounded-3 hover-bg-light cursor-pointer transition-all"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${n.bg}`} style={{ width: '32px', height: '32px' }}>
                        <i className={`ti ${n.icon} fs-14`}></i>
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="fs-13 fw-semibold text-dark text-truncate">{n.title}</div>
                        <div className="fs-11 text-muted">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-top text-center bg-light">
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-primary p-0 fs-12 text-decoration-none fw-semibold"
                    onClick={() => setShowNotificationDropdown(false)}
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Trigger & Dropdown Menu */}
          <div className="position-relative ms-1" ref={profileDropdownRef}>
            <div
              className="d-flex align-items-center gap-2 cursor-pointer p-1 rounded-pill hover-bg-light transition-all"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowNotificationDropdown(false);
              }}
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

            {/* Profile Dropdown */}
            {showProfileDropdown && (
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
                <div className="d-flex align-items-center gap-3 pb-3 mb-2 border-bottom text-start">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="rounded-circle border shadow-xs"
                    style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                  />
                  <div style={{ minWidth: 0, textAlign: 'left' }}>
                    <h6 className="fw-bold text-dark mb-0 fs-14 text-truncate">{currentUser.name}</h6>
                    <span className="text-secondary fs-12 text-truncate d-block">{currentUser.role}</span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="d-flex flex-column gap-1">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none text-dark d-flex align-items-center gap-2.5 px-3 py-2 rounded-3 fs-13 text-start transition-all"
                    style={{ width: '100%', textAlign: 'left', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      if (onNavigate) onNavigate('/profile-settings');
                    }}
                  >
                    <i className="ti ti-user-circle fs-17 text-secondary" style={{ width: '20px', textAlign: 'center' }}></i>
                    <span className="fw-medium text-dark">Profile Settings</span>
                  </button>

                  <div
                    className="d-flex align-items-center justify-content-between px-3 py-2 rounded-3 fs-13 transition-all"
                    style={{ transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div className="d-flex align-items-center gap-2.5 text-dark" style={{ textAlign: 'left' }}>
                      <i className="ti ti-bell fs-17 text-secondary" style={{ width: '20px', textAlign: 'center' }}></i>
                      <span className="fw-medium">Notifications</span>
                    </div>
                    <div className="form-check form-switch m-0 d-flex align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="headerNotificationToggle"
                        style={{ cursor: 'pointer', width: '38px', height: '20px' }}
                        checked={notificationsEnabled}
                        onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-link text-decoration-none text-dark d-flex align-items-center gap-2.5 px-3 py-2 rounded-3 fs-13 text-start transition-all"
                    style={{ width: '100%', textAlign: 'left', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      if (onNavigate) onNavigate('/dashboard');
                    }}
                  >
                    <i className="ti ti-notes fs-17 text-secondary" style={{ width: '20px', textAlign: 'center' }}></i>
                    <span className="fw-medium text-dark">Activity Logs</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-link text-decoration-none text-dark d-flex align-items-center gap-2.5 px-3 py-2 rounded-3 fs-13 text-start transition-all"
                    style={{ width: '100%', textAlign: 'left', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      alert('Help & Support: Call +91 98765 43210 or email support@rainerp.com');
                    }}
                  >
                    <i className="ti ti-help-circle fs-17 text-secondary" style={{ width: '20px', textAlign: 'center' }}></i>
                    <span className="fw-medium text-dark">Help &amp; Support</span>
                  </button>
                </div>

                {/* Logout Divider & Action */}
                <div className="pt-2 mt-2 border-top">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none text-danger d-flex align-items-center gap-2.5 px-3 py-2 rounded-3 fs-13 w-100 text-start transition-all"
                    style={{ textAlign: 'left', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    <i className="ti ti-logout fs-17 text-danger" style={{ width: '20px', textAlign: 'center' }}></i>
                    <span className="fw-semibold text-danger">Log Out</span>
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

