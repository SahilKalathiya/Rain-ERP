import React from 'react';

/**
 * Top Navbar Header Component
 */
export default function Header() {
  return (
    <header className="navbar navbar-expand bg-white border-bottom px-4 py-2 sticky-top shadow-none">
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
            title="Notifications"
          >
            <i className="ti ti-bell fs-16"></i>
          </button>

          <button
            type="button"
            className="btn btn-light btn-sm rounded-circle p-2 text-secondary"
            title="Theme Mode"
          >
            <i className="ti ti-moon fs-16"></i>
          </button>

          <div className="d-flex align-items-center gap-2 ms-2">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
              alt="Avatar"
              className="rounded-circle border"
              style={{ width: '34px', height: '34px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
