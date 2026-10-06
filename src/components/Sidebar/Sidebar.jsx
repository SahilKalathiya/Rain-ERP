import React, { useState } from 'react';
import { navigationMenu } from './menuConfig';

/**
 * Sidebar Navigation Component - Matches Authentic Preclinic / Rain Drop ERP Theme
 * - Clean White background with Royal Navy accents
 * - Fully persistent open accordion menus
 * - Smooth active states without collapsing menus
 */
export default function Sidebar({ currentRoute = '/dashboard', onNavigate }) {
  // Submenus are collapsible - user can click to open or close
  const [openMenus, setOpenMenus] = useState({
    'Procurement Workflow': false,
    'Master Data': false
  });

  const toggleSubmenu = (label) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <aside
      className="sidebar bg-white border-end d-flex flex-column"
      style={{
        width: '260px',
        minWidth: '260px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 1020
      }}
    >
      {/* Brand Header */}
      <div
        className="p-3 border-bottom d-flex align-items-center justify-content-between"
        style={{ height: '70px' }}
      >
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-3 text-white d-flex align-items-center justify-content-center fw-bold fs-16 shadow-sm"
            style={{
              width: '38px',
              height: '38px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
            }}
          >
            RD
          </div>
          <div>
            <div className="fw-bold fs-15 line-height-1" style={{ color: '#0f172a' }}>
              Rain Drop ERP
            </div>
            <div className="text-muted fs-11 mt-1">Garment Manufacturing</div>
          </div>
        </div>
      </div>

      {/* Nav Menu Items */}
      <div className="flex-grow-1 overflow-auto p-3 custom-scrollbar">
        {navigationMenu.map((section, sIdx) => (
          <div key={sIdx} className="mb-3">
            <div
              className="text-uppercase fw-bold fs-10 px-2 mb-2 tracking-wider"
              style={{ color: '#94a3b8', letterSpacing: '0.8px' }}
            >
              {section.title}
            </div>

            <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
              {section.items.map((item, idx) => {
                const hasSub = item.submenu && item.submenu.length > 0;
                const isOpen = !!openMenus[item.label];
                const isActive = item.link === currentRoute;

                return (
                  <li key={idx}>
                    {hasSub ? (
                      <div>
                        <button
                          type="button"
                          className="btn w-100 text-start d-flex align-items-center justify-content-between px-3 py-2 rounded-3 fs-13 border-0 bg-transparent hover-bg-light transition-all"
                          onClick={() => toggleSubmenu(item.label)}
                          style={{
                            color: '#334155',
                            fontWeight: 600
                          }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <i className={`${item.icon} fs-16`} style={{ color: '#6366f1' }}></i>
                            <span>{item.label}</span>
                          </div>
                          <i
                            className={`ti ti-chevron-${
                              isOpen ? 'down' : 'right'
                            } fs-12 text-secondary transition-all`}
                          ></i>
                        </button>

                        {isOpen && (
                          <ul className="list-unstyled ms-3 ps-2 border-start mt-1 d-flex flex-column gap-1">
                            {item.submenu.map((sub, sIdx) => {
                              const isSubActive =
                                sub.link === currentRoute ||
                                (sub.link === '/procurement-pos' && currentRoute.startsWith('/procurement-pos')) ||
                                (sub.link === '/goods-inward' && currentRoute.startsWith('/goods-inward')) ||
                                (sub.link === '/quality-batches' && currentRoute.startsWith('/quality-batches')) ||
                                (sub.link === '/rejected-stock' && currentRoute.startsWith('/rejected-stock')) ||
                                (sub.link === '/vendors' && currentRoute.startsWith('/vendors')) ||
                                (sub.link === '/fabrics' && currentRoute.startsWith('/fabrics')) ||
                                (sub.link === '/transporters' && currentRoute.startsWith('/transporters'));

                              return (
                                <li key={sIdx}>
                                  <a
                                    href={sub.link}
                                    className={`sidebar-sub-link d-block px-3 py-2 fs-13 rounded-3 text-decoration-none transition-all ${
                                      isSubActive ? 'sidebar-sub-link-active' : ''
                                    }`}
                                    style={{
                                      background: isSubActive ? '#4f46e5' : 'transparent',
                                      color: isSubActive ? '#ffffff' : '#475569',
                                      fontWeight: isSubActive ? 600 : 500
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (onNavigate) onNavigate(sub.link);
                                    }}
                                  >
                                    {sub.label}
                                  </a>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <a
                        href={item.link}
                        className={`sidebar-main-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none fs-13 transition-all ${
                          isActive ? 'sidebar-main-link-active' : ''
                        }`}
                        style={{
                          background: isActive ? '#4f46e5' : 'transparent',
                          color: isActive ? '#ffffff' : '#334155',
                          fontWeight: isActive ? 600 : 500
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          if (onNavigate) onNavigate(item.link);
                        }}
                      >
                        <i
                          className={`${item.icon} fs-16`}
                          style={{ color: isActive ? '#ffffff' : '#4f46e5' }}
                        ></i>
                        <span>{item.label}</span>
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div
        className="p-3 border-top d-flex align-items-center justify-content-between"
        style={{ background: '#f8fafc' }}
      >
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold fs-12"
            style={{ width: '34px', height: '34px', background: '#2e37a4' }}
          >
            RD
          </div>
          <div>
            <div className="fw-semibold text-dark fs-12">Raindrop Admin</div>
            <div className="text-muted fs-11">Procurement Head</div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-light text-danger p-1 rounded-2"
          title="Logout"
        >
          <i className="ti ti-power fs-15"></i>
        </button>
      </div>
    </aside>
  );
}
