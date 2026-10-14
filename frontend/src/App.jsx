import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import OrdersModule from './components/Orders/OrdersModule';
import CustomerMasterView from './components/Masters/CustomerMasterView';
import ArticleMasterView from './components/Masters/ArticleMasterView';
import SizeMasterView from './components/Masters/SizeMasterView';
import AccessoriesMasterView from './components/Masters/AccessoriesMasterView';
import ProcurementDashboard from './components/Procurement/ProcurementDashboard';
import ProfileSettingsView from './components/Profile/ProfileSettingsView';
import AuthPage from './components/Auth/AuthPage';

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
    } catch (e) {}
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

  const [currentRoute, setCurrentRoute] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname) {
      const p = window.location.pathname.replace(/^\/react/, '') || '/orders';
      return (p === '/' || p === '') ? '/orders' : p;
    }
    return '/orders';
  });
  const [sidebarClickCount, setSidebarClickCount] = useState(0);
  const [routeExtraData, setRouteExtraData] = useState(() => {
    try {
      const s = sessionStorage.getItem('erp_route_extra_data');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return null;
  });

  // Sync route with browser navigation (Back / Forward)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined' && window.location.pathname) {
        const p = window.location.pathname.replace(/^\/react/, '') || '/orders';
        setCurrentRoute((p === '/' || p === '') ? '/orders' : p);
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
    } catch (e) {}
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
    } catch (e) {}
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
      return <OrdersModule currentRoute={currentRoute} onNavigateToProcurement={handleRouteNavigate} />;
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

    // 4. Route 2 Raw Material Procurement Dashboard
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
    } catch (e) {}
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
          } catch (e) {}
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
        <main className="flex-grow-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  );
}
