import React, { useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import ProductionModule from './components/Production/ProductionModule';
import OrdersModule from './components/Orders/OrdersModule';
import CuttingModule from './components/Cutting/CuttingModule';
import ProcurementDashboard from './components/Procurement/ProcurementDashboard';

/**
 * Main ERP Rain Application Component
 */
export default function App() {
  const [currentRoute, setCurrentRoute] = useState('/dashboard');

  const renderContent = () => {
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

    /* =========================================================================
     * OUT OF SCOPE FOR MODULE 1 (Deferred to Future Stages - Section 2.2 / 10)
     * =========================================================================
    if (
      currentRoute.startsWith('/production') ||
      currentRoute.includes('embroidery') ||
      currentRoute.includes('single-cut') ||
      currentRoute.includes('stitching')
    ) {
      let initialTab = 'embroidery';
      if (currentRoute.includes('single-cut') || currentRoute.includes('single-cuts')) {
        initialTab = 'single_cuts';
      } else if (currentRoute.includes('stitching')) {
        initialTab = 'stitching';
      }
      return <ProductionModule initialTab={initialTab} />;
    }

    if (currentRoute.startsWith('/orders')) {
      return <OrdersModule />;
    }

    if (currentRoute.startsWith('/cutting')) {
      return <CuttingModule />;
    }
    ========================================================================= */

    // Default to Overview Dashboard
    return <ProcurementDashboard initialSubmodule="overview" onNavigate={setCurrentRoute} />;
  };

  const handleRouteNavigate = (route) => {
    setCurrentRoute(route);
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Sidebar */}
      <Sidebar currentRoute={currentRoute} onNavigate={setCurrentRoute} />

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        <Header />
        <main className="flex-grow-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  );
}
