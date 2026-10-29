import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import OrdersModule from './components/Orders/OrdersModule';
import CustomerMasterView from './components/Masters/CustomerMasterView';
import ArticleMasterView from './components/Masters/ArticleMasterView';
import SizeMasterView from './components/Masters/SizeMasterView';
import AccessoriesMasterView from './components/Masters/AccessoriesMasterView';
import ColorMasterView from './components/Masters/ColorMasterView';
import ProcurementDashboard from './components/Procurement/ProcurementDashboard';
import ProcessModule from './components/ProcessPO/ProcessModule';
import ActivityLogView from './components/ActivityLog/ActivityLogView';
import ProfileSettingsView from './components/Profile/ProfileSettingsView';
import AuthPage from './components/Auth/AuthPage';

/**
 * Error Boundary to catch render errors and prevent white blank screen
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ERP ErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4 mx-auto" style={{ maxWidth: 600 }}>
          <i className="ti ti-alert-triangle fs-40 text-danger mb-3 d-block"></i>
          <h5 className="fw-bold text-dark mb-2">Something went wrong</h5>
          <p className="text-secondary fs-13 mb-3">{this.state.error?.message || 'An unexpected error occurred while rendering this page.'}</p>
          <div className="d-flex justify-content-center gap-2">
            <button
              type="button"
              className="btn btn-primary px-4 py-2 rounded-3"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              <i className="ti ti-refresh me-1"></i> Reload Page
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary px-4 py-2 rounded-3"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
            >
              <i className="ti ti-arrow-left me-1"></i> Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Main ERP Rain Application Component
 */
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('erp_auth_status') === 'authenticated';
    } catch (e) {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('erp_user');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return {
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
    };
  });

  // Default route is always /dashboard on page reload / initial load
  const [currentRoute, setCurrentRoute] = useState('/dashboard');
  const [sidebarClickCount, setSidebarClickCount] = useState(0);
  const [routeExtraData, setRouteExtraData] = useState(() => {
    try {
      const s = sessionStorage.getItem('erp_route_extra_data');
      if (s) return JSON.parse(s);
    } catch (e) { }
    return null;
  });

  // On initial page load / refresh, always land on Dashboard
  useEffect(() => {
    setCurrentRoute('/dashboard');
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', '/react/dashboard');
    }
  }, []);

  // Sync route with browser navigation (Back / Forward)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined' && window.location.pathname) {
        const p = window.location.pathname.replace(/^\/react/, '') || '/dashboard';
        setCurrentRoute((p === '/' || p === '') ? '/dashboard' : p);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // When user clicks explicitly in the Sidebar menu
  const handleSidebarNavigate = (route) => {
    setCurrentRoute(route);
    setRouteExtraData(null);
    try {
      sessionStorage.removeItem('erp_route_extra_data');
    } catch (e) { }
    setSidebarClickCount((prev) => prev + 1);
    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState(null, '', `/react${route}`);
    }
  };

  // When internal submodules synchronize route (e.g. +GRN from PO, Run QC from GRN, Proceed to PO from Order)
  const handleRouteNavigate = (route, extraData) => {
    setCurrentRoute(route);
    setRouteExtraData(extraData || null);
    try {
      if (extraData) {
        sessionStorage.setItem('erp_route_extra_data', JSON.stringify(extraData));
      } else {
        sessionStorage.removeItem('erp_route_extra_data');
      }
    } catch (e) { }
    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState(null, '', `/react${route}`);
    }
  };

  const renderContent = () => {
    // 1. Profile & Settings View
    if (currentRoute === '/profile-settings' || currentRoute === '/settings' || currentRoute === '/profile') {
      return (
        <ProfileSettingsView
          currentUser={currentUser}
          onUpdateUser={(updated) => setCurrentUser(updated)}
          onBack={() => setCurrentRoute('/dashboard')}
        />
      );
    }

    // 2. Route 1 Sales Orders Module
    if (currentRoute.startsWith('/orders') || currentRoute.startsWith('/sales')) {
      return (
        <OrdersModule
          currentRoute={currentRoute}
          sidebarClickCount={sidebarClickCount}
          onNavigate={handleRouteNavigate}
          onNavigateToProcurement={handleRouteNavigate}
        />
      );
    }

    // 3. Route 1 Sales Masters
    if (currentRoute === '/customers') {
      return <CustomerMasterView />;
    }
    if (currentRoute === '/articles') {
      return <ArticleMasterView />;
    }
    if (currentRoute === '/sizes') {
      return <SizeMasterView />;
    }
    if (currentRoute === '/accessories') {
      return <AccessoriesMasterView />;
    }
    if (currentRoute === '/colors') {
      return <ColorMasterView />;
    }

    // 4. Module 3: Process PO & Job Work Module
    if (currentRoute.startsWith('/process') || currentRoute.startsWith('/job-work')) {
      let processTab = 'pos';
      if (currentRoute.includes('challan')) processTab = 'challans';
      else if (currentRoute.includes('return') || currentRoute.includes('inward')) processTab = 'returns';
      else if (currentRoute.includes('qc') || currentRoute.includes('quality')) processTab = 'qc';
      else if (currentRoute.includes('tracking') || currentRoute.includes('bale')) processTab = 'tracking';

      return (
        <ProcessModule
          initialTab={processTab}
          currentRoute={currentRoute}
          onNavigate={handleRouteNavigate}
        />
      );
    }

    // 5. Activity Log & Audit Trail (Section 13.4)
    if (currentRoute.startsWith('/activity-log') || currentRoute.startsWith('/audit-log') || currentRoute.startsWith('/activity')) {
      return <ActivityLogView onNavigate={handleRouteNavigate} />;
    }

    // 6. Route 2 Raw Material Procurement Dashboard
    let submodule = 'overview';
    if (currentRoute.startsWith('/procurement-pos') || currentRoute.startsWith('/po')) {
      submodule = 'pos';
    } else if (currentRoute.startsWith('/goods-inward') || currentRoute.startsWith('/grn')) {
      submodule = 'grn';
    } else if (currentRoute.startsWith('/quality-batches') || currentRoute.startsWith('/quality') || currentRoute.startsWith('/qc')) {
      submodule = 'qc';
    } else if (currentRoute.startsWith('/stock-pool') || currentRoute.startsWith('/stock')) {
      submodule = 'stock_pool';
    } else if (currentRoute.startsWith('/rejected-stock') || currentRoute.includes('rejected')) {
      submodule = 'rejected_stock';
    } else if (currentRoute.startsWith('/vendors')) {
      submodule = 'vendors';
    } else if (currentRoute.startsWith('/fabrics')) {
      submodule = 'fabrics';
    } else if (currentRoute.startsWith('/colors')) {
      submodule = 'colors';
    } else if (currentRoute.startsWith('/transporters')) {
      submodule = 'transporters';
    }

    return (
      <ProcurementDashboard
        currentRoute={currentRoute}
        initialSubmodule={submodule}
        onNavigate={handleRouteNavigate}
        sidebarClickCount={sidebarClickCount}
        extraData={routeExtraData}
      />
    );
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('erp_auth_status');
      localStorage.removeItem('erp_user');
      localStorage.removeItem('auth');
    } catch (e) { }
    setIsAuthenticated(false);
  };

  // If unauthenticated, display the full standalone Login / Register page
  if (!isAuthenticated) {
    return (
      <AuthPage
        onLoginSuccess={(user) => {
          try {
            localStorage.setItem('erp_auth_status', 'authenticated');
            if (user) {
              localStorage.setItem('erp_user', JSON.stringify(user));
            }
          } catch (e) { }
          if (user) setCurrentUser(user);
          setIsAuthenticated(true);
          setCurrentRoute('/dashboard');
        }}
      />
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Sidebar */}
      <Sidebar currentRoute={currentRoute} onNavigate={handleSidebarNavigate} />

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        <Header
          currentUser={currentUser}
          onNavigate={handleSidebarNavigate}
          onOpenAuth={() => setIsAuthenticated(false)}
          onLogout={handleLogout}
        />
        <main className="flex-grow-1 overflow-auto">
          <ErrorBoundary onReset={() => setCurrentRoute('/dashboard')}>
            {renderContent()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
