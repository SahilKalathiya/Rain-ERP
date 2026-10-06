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

    // 0. Global Overview Dashboard (Section 9.4)
    if (currentRoute === '/dashboard' || currentRoute === '/') {
      return <ProcurementDashboard initialSubmodule="overview" onNavigate={setCurrentRoute} />;
    }

    // Phase 1: Raw Material Procurement & Masters (In Scope)
    if (
      currentRoute.startsWith('/procurement-pos') ||
      currentRoute.startsWith('/procurement') ||
      currentRoute.startsWith('/po')
    ) {
      return <ProcurementDashboard initialSubmodule="pos" onNavigate={setCurrentRoute} />;
    }

    if (
      currentRoute.startsWith('/goods-inward') ||
      currentRoute.startsWith('/grn')
    ) {
      return <ProcurementDashboard initialSubmodule="grn" onNavigate={setCurrentRoute} />;
    }

    if (
      currentRoute.startsWith('/quality-batches') ||
      currentRoute.startsWith('/quality') ||
      currentRoute.startsWith('/qc')
    ) {
      return <ProcurementDashboard initialSubmodule="qc" onNavigate={setCurrentRoute} />;
    }

    if (
      currentRoute.startsWith('/rejected-stock') ||
      currentRoute.includes('rejected')
    ) {
      return <ProcurementDashboard initialSubmodule="rejected_stock" onNavigate={setCurrentRoute} />;
    }

    if (currentRoute.startsWith('/vendors')) {
      return <ProcurementDashboard initialSubmodule="vendors" onNavigate={setCurrentRoute} />;
    }

    if (currentRoute.startsWith('/fabrics')) {
      return <ProcurementDashboard initialSubmodule="fabrics" onNavigate={setCurrentRoute} />;
    }

    if (currentRoute.startsWith('/transporters')) {
      return <ProcurementDashboard initialSubmodule="transporters" onNavigate={setCurrentRoute} />;
    }

    // Default to Overview Dashboard
    return <ProcurementDashboard initialSubmodule="overview" onNavigate={setCurrentRoute} />;
  };

  const [currentRoute, setCurrentRoute] = useState('/dashboard');
  
  const handleRouteNavigate = (route) => {
    setCurrentRoute(route);
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
      <Sidebar currentRoute={currentRoute} onNavigate={setCurrentRoute} />

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        <Header
          currentUser={currentUser}
          onNavigate={setCurrentRoute}
          onOpenAuth={() => setIsAuthenticated(false)}
          onLogout={handleLogout}
        />
        <main className="flex-grow-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  );
}

