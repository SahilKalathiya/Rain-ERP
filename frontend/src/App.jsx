import React, { useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import ProductionModule from './components/Production/ProductionModule';
import OrdersModule from './components/Orders/OrdersModule';
import CuttingModule from './components/Cutting/CuttingModule';
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

  const [currentRoute, setCurrentRoute] = useState('/dashboard');
  const [sidebarClickCount, setSidebarClickCount] = useState(0);

  // When user clicks explicitly in the Sidebar menu
  const handleSidebarNavigate = (route) => {
    setCurrentRoute(route);
    setSidebarClickCount((prev) => prev + 1);
  };

  // When internal submodules synchronize route (e.g. +GRN from PO, Run QC from GRN)
  const handleRouteNavigate = (route) => {
    setCurrentRoute(route);
  };

  const renderContent = () => {
    // Profile & Settings View
    if (currentRoute === '/profile-settings' || currentRoute === '/settings' || currentRoute === '/profile') {
      return (
        <ProfileSettingsView
          currentUser={currentUser}
          onUpdateUser={(updated) => setCurrentUser(updated)}
          onBack={() => setCurrentRoute('/dashboard')}
        />
      );
    }

    // Determine submodule from route
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

