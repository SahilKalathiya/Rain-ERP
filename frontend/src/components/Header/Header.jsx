import React, { useState, useRef, useEffect } from 'react';
import { resetExampleDataToDefaults } from '../../utils/dataReset';

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const profileDropdownRef = useRef(null);

  const [searchGlobalQuery, setSearchGlobalQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Section 11.1 Platform-wide Search Calculation
  const searchResults = React.useMemo(() => {
    const q = (searchGlobalQuery || '').trim().toLowerCase();
    if (!q) return [];

    const results = [];

    // Helper to get array from localStorage
    const getSaved = (key) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
      } catch (e) {
        return [];
      }
    };

    // 1. Customers
    const customers = getSaved('erp_customers_v1');
    customers.forEach((c) => {
      if (
        (c.name || '').toLowerCase().includes(q) ||
        (c.id || '').toLowerCase().includes(q) ||
        (c.type || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q)
      ) {
        results.push({
          icon: '👥',
          title: c.name,
          subtitle: `${c.id} • ${c.type} • ${c.city || ''}`,
          category: 'Customer',
          route: '/customers'
        });
      }
    });

    // 2. Colors
    const colors = getSaved('erp_colors_master_v1');
    colors.forEach((col) => {
      if (
        (col.name || '').toLowerCase().includes(q) ||
        (col.hexCode || '').toLowerCase().includes(q) ||
        (col.pantoneCode || '').toLowerCase().includes(q)
      ) {
        results.push({
          icon: '🎨',
          title: col.name,
          subtitle: `${col.id} • ${col.hexCode} • ${col.pantoneCode || ''}`,
          category: 'Color',
          route: '/colors'
        });
      }
    });

    // 3. Articles
    const articles = getSaved('erp_articles_v1');
    articles.forEach((art) => {
      if (
        (art.name || '').toLowerCase().includes(q) ||
        (art.id || '').toLowerCase().includes(q) ||
        (art.description || '').toLowerCase().includes(q)
      ) {
        results.push({
          icon: art.icon || '👕',
          title: art.name,
          subtitle: `${art.id} • Priority #${art.sortOrder || '—'}`,
          category: 'Article',
          route: '/articles'
        });
      }
    });

    // 4. Size Series
    const sizeSeries = getSaved('erp_size_series_v1');
    sizeSeries.forEach((ser) => {
      if (
        (ser.name || '').toLowerCase().includes(q) ||
        (ser.id || '').toLowerCase().includes(q) ||
        (ser.sizes || []).some((sz) => String(sz).toLowerCase().includes(q))
      ) {
        results.push({
          icon: '📏',
          title: ser.name,
          subtitle: `${ser.id} • Sizes: ${(ser.sizes || []).slice(0, 5).join(', ')}...`,
          category: 'Size Series',
          route: '/sizes'
        });
      }
    });

    // 5. Accessories
    const accessories = getSaved('erp_accessories_master_v1');
    accessories.forEach((acc) => {
      if (
        (acc.name || '').toLowerCase().includes(q) ||
        (acc.id || '').toLowerCase().includes(q) ||
        (acc.category || '').toLowerCase().includes(q) ||
        (acc.threadPattern || '').toLowerCase().includes(q)
      ) {
        results.push({
          icon: '🧵',
          title: acc.name,
          subtitle: `${acc.id} • ${acc.category} ${acc.threadPattern ? `(${acc.threadPattern})` : ''}`,
          category: 'Accessory',
          route: '/accessories'
        });
      }
    });

    return results.slice(0, 10);
  }, [searchGlobalQuery]);

  return (
    <header className="navbar navbar-expand bg-white border-bottom px-4 py-2 sticky-top shadow-none" style={{ zIndex: 1040 }}>
      <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
        {/* Section 11.1: Platform-wide Global Search Bar */}
        <div className="position-relative" style={{ width: '420px' }}>
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
              backgroundColor: '#f8fafc',
              paddingLeft: '38px',
              paddingRight: searchGlobalQuery ? '32px' : '14px'
            }}
            placeholder="Search across customers, colors, articles, sizes, accessories..."
            value={searchGlobalQuery}
            onChange={(e) => setSearchGlobalQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
          />
          {searchGlobalQuery && (
            <button
              type="button"
              className="btn btn-xs btn-link text-muted position-absolute p-0 text-decoration-none"
              style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}
              onClick={() => {
                setSearchGlobalQuery('');
                setIsSearchFocused(false);
              }}
            >
              <i className="ti ti-x"></i>
            </button>
          )}

          {/* Global Search Results Dropdown */}
          {isSearchFocused && searchGlobalQuery.trim().length > 0 && (
            <div
              className="position-absolute start-0 end-0 mt-1 bg-white rounded-3 shadow-xl border overflow-hidden"
              style={{
                zIndex: 1060,
                maxHeight: '380px',
                overflowY: 'auto',
                borderColor: '#cbd5e1'
              }}
            >
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-muted small">
                  No records found matching "{searchGlobalQuery}"
                </div>
              ) : (
                <div className="py-1">
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between hover-bg-light cursor-pointer"
                      style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                      onMouseDown={() => {
                        setIsSearchFocused(false);
                        setSearchGlobalQuery('');
                        if (onNavigate) onNavigate(item.route);
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span className="fs-5">{item.icon}</span>
                        <div>
                          <div className="fw-bold text-dark fs-13">{item.title}</div>
                          <span className="text-muted" style={{ fontSize: '11px' }}>
                            {item.subtitle}
                          </span>
                        </div>
                      </div>
                      <span className="badge bg-light text-secondary border font-monospace small">
                        {item.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

          {/* User Profile Trigger & Dropdown Menu */}
          <div className="position-relative ms-1" ref={profileDropdownRef}>
            <div
              className="d-flex align-items-center gap-2 cursor-pointer p-1 rounded-pill hover-bg-light transition-all"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
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
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none text-warning-emphasis d-flex align-items-center gap-2.5 px-3 py-2 rounded-3 fs-13 text-start transition-all"
                    style={{ width: '100%', textAlign: 'left', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fffbeb')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to remove all example/test data and restore original defaults?')) {
                        resetExampleDataToDefaults(true);
                        setShowProfileDropdown(false);
                        window.location.reload();
                      }
                    }}
                    title="Remove all test data and restore default seed data"
                  >
                    <i className="ti ti-refresh fs-17 text-warning" style={{ width: '20px', textAlign: 'center' }}></i>
                    <span className="fw-medium text-dark">Reset to Default Data</span>
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

