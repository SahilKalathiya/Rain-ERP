import React, { useState, useEffect, useRef } from 'react';
import OrdersListView from './OrdersListView';
import OrderDetailView from './OrderDetailView';
import OrderCreationWizard from './OrderCreationWizard';
import { initialSalesOrders, getStoredData, setStoredData } from '../../data/salesOrderData';

import ProcurementModal from './ProcurementModal';

export default function OrdersModule({ currentRoute, sidebarClickCount = 0, onNavigate, onNavigateToProcurement }) {
  const [orders, setOrders] = useState(() => getStoredData('erp_sales_orders_v1', initialSalesOrders));
  const [procurementModal, setProcurementModal] = useState({ isOpen: false });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [selectedOrder, setSelectedOrder] = useState(() => {
    const routeToCheck = currentRoute || (typeof window !== 'undefined' ? window.location.pathname : '');
    const editMatch = routeToCheck.match(/\/orders\/edit\/([^/]+)/);
    if (editMatch && editMatch[1]) {
      const stored = getStoredData('erp_sales_orders_v1', initialSalesOrders);
      return stored.find((o) => o.id === editMatch[1]) || null;
    }
    const match = routeToCheck.match(/\/orders\/([^/]+)/);
    if (match && match[1] && match[1] !== 'new' && match[1] !== 'edit' && match[1] !== 'create') {
      const stored = getStoredData('erp_sales_orders_v1', initialSalesOrders);
      return stored.find((o) => o.id === match[1]) || null;
    }
    return null;
  });

  const [viewMode, setViewMode] = useState(() => {
    const routeToCheck = currentRoute || (typeof window !== 'undefined' ? window.location.pathname : '');
    if (routeToCheck.includes('/orders/edit/')) return 'create';
    if (routeToCheck.includes('/new') || routeToCheck.includes('/create')) return 'create';
    const match = routeToCheck.match(/\/orders\/([^/]+)/);
    if (match && match[1] && match[1] !== 'new' && match[1] !== 'edit') return 'detail';
    return 'list';
  });

  const prevSidebarCount = useRef(sidebarClickCount);

  // When user clicks "Orders" in the sidebar, reset viewMode to 'list' and clear selectedOrder
  useEffect(() => {
    if (sidebarClickCount > prevSidebarCount.current) {
      prevSidebarCount.current = sidebarClickCount;
      setSelectedOrder(null);
      setViewMode('list');
      if (onNavigate) {
        onNavigate('/orders');
      } else if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, '', '/react/orders');
      }
    }
  }, [sidebarClickCount, onNavigate]);

  // Sync state whenever currentRoute prop changes (e.g. from Dashboard or Sidebar)
  useEffect(() => {
    if (currentRoute) {
      const editMatch = currentRoute.match(/\/orders\/edit\/([^/]+)/);
      if (editMatch && editMatch[1]) {
        const stored = getStoredData('erp_sales_orders_v1', initialSalesOrders);
        const found = stored.find((o) => o.id === editMatch[1]);
        if (found) {
          setSelectedOrder(found);
        }
        setViewMode('create');
      } else if (currentRoute.includes('/orders/new') || currentRoute.includes('/orders/create')) {
        setSelectedOrder(null);
        setViewMode('create');
      } else {
        const match = currentRoute.match(/\/orders\/([^/]+)/);
        if (match && match[1] && match[1] !== 'new' && match[1] !== 'edit' && match[1] !== 'create') {
          const stored = getStoredData('erp_sales_orders_v1', initialSalesOrders);
          const found = stored.find((o) => o.id === match[1]);
          if (found) {
            setSelectedOrder(found);
            setViewMode('detail');
          }
        } else if (currentRoute === '/orders' || currentRoute === '/orders/' || currentRoute === '/sales' || currentRoute.endsWith('/orders')) {
          setSelectedOrder(null);
          setViewMode('list');
        }
      }
    }
  }, [currentRoute]);

  // Listen to cross-module storage updates
  useEffect(() => {
    const handleSync = () => {
      const updated = getStoredData('erp_sales_orders_v1', initialSalesOrders);
      setOrders(updated);
      setSelectedOrder((prev) => {
        if (!prev) return prev;
        return updated.find((o) => o.id === prev.id) || prev;
      });
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('erp_sales_order_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('erp_sales_order_updated', handleSync);
    };
  }, []);

  const handleNewOrder = () => {
    setSelectedOrder(null);
    setViewMode('create');
    if (onNavigate) {
      onNavigate('/orders/new');
    } else if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState(null, '', '/react/orders/new');
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setViewMode('detail');
    if (onNavigate) {
      onNavigate(`/orders/${order.id}`);
    } else if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState(null, '', `/react/orders/${order.id}`);
    }
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    if (order?.hasProceededToNextStep && order?.status === 'Draft') {
      setViewMode('detail');
      if (onNavigate) {
        onNavigate(`/orders/${order.id}`, order);
      } else if (typeof window !== 'undefined' && window.history?.pushState) {
        window.history.pushState(null, '', `/react/orders/${order.id}`);
      }
      return;
    }
    setViewMode('create');
    if (onNavigate) {
      onNavigate(`/orders/edit/${order.id}`, order);
    } else if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState(null, '', `/react/orders/edit/${order.id}`);
    }
  };

  const handleSaveOrder = (newOrder, action, shouldScroll = false) => {
    const isDraftAction = action === 'Draft';
    const isAlreadyConfirmed = (newOrder?.status === 'Confirmed' || newOrder?.stage === 'Confirmed') && !isDraftAction;
    const finalStatus = isDraftAction ? 'Draft' : (isAlreadyConfirmed ? 'Confirmed' : 'Pending Confirmation');
    const finalStage = isDraftAction ? 'Draft' : (isAlreadyConfirmed ? 'Confirmed' : 'Pending Confirmation');
    const finalOrder = {
      ...newOrder,
      status: finalStatus,
      stage: finalStage,
      hasProceededToNextStep: !isDraftAction
    };

    const updated = [finalOrder, ...orders.filter((o) => o.id !== finalOrder.id)];
    setOrders(updated);
    setStoredData('erp_sales_orders_v1', updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('erp_sales_order_updated', { detail: updated }));
    }

    if (isDraftAction) {
      // Save as Draft: Return to Orders List view instead of navigating to Next Step (OrderDetailView)
      setSelectedOrder(null);
      setViewMode('list');
      setToast({
        show: true,
        message: `Sales Order #${finalOrder.id} saved as Draft successfully!`,
        type: 'info'
      });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 4000);

      if (typeof window !== 'undefined') {
        if (shouldScroll) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (onNavigate) {
          onNavigate('/orders');
        } else if (window.history?.pushState) {
          window.history.pushState(null, '', '/react/orders');
        }
      }
      return;
    }

    if (action === 'Create PO' && onNavigateToProcurement) {
      onNavigateToProcurement('/procurement-pos', finalOrder);
    } else {
      setSelectedOrder(finalOrder);
      setViewMode('detail');
      if (typeof window !== 'undefined') {
        if (shouldScroll) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (onNavigate) {
          onNavigate(`/orders/${finalOrder.id}`);
        } else if (window.history?.pushState) {
          window.history.pushState(null, '', `/react/orders/${finalOrder.id}`);
        }
      }
    }
  };

  const handleUpdateOrder = (updatedOrder) => {
    const updated = [updatedOrder, ...orders.filter((o) => o.id !== updatedOrder.id)];
    setOrders(updated);
    setStoredData('erp_sales_orders_v1', updated);
    setSelectedOrder(updatedOrder);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('erp_sales_order_updated', { detail: updatedOrder }));
    }
  };

  const handleTriggerProcurement = (actionType, order) => {
    let title = 'Material Request & Accessories Order';
    let message = `Material Request & Accessories Order generated for ${order?.styleName || 'Kurta Style'} (${order?.id || ''})!`;
    let icon = '📦';
    let badgeText = 'Requisition Queued';
    let details = [
      { label: 'Order ID', value: `#${order?.id || ''}` },
      { label: 'Style Name', value: order?.styleName || 'Kurta Style' },
      { label: 'Greige Fabric', value: `${order?.totalFabricGreige || 0}m` },
      { label: 'Total Garments', value: `${order?.totalGarments || 100} pcs` },
      { label: 'Accessories BOM', value: 'Requisition Sent to Stores' }
    ];

    if (actionType === 'Create PO') {
      title = 'Purchase Order Auto-Populated';
      message = `Auto-populating PO for Order #${order?.id} with ${order?.totalFabricGreige || 0}m Greige Fabric!`;
      icon = '🚀';
      badgeText = 'Procurement PO Generated';
    } else if (actionType === 'QC Batch') {
      title = 'Quality Check (QC) Batch';
      message = `Opening Quality Inspection module for Order #${order?.id} (${order?.styleName})!`;
      icon = '🛡️';
      badgeText = 'QC Module Ready';
    } else if (actionType === 'Send to Process') {
      title = 'Fabric Sent to Dyeing Process';
      message = `Sending ${order?.totalFabricGreige || 0}m Greige Fabric to Dyeing Process for ${order?.styleName}!`;
      icon = '🎨';
      badgeText = 'Dyeing Job Work';
    } else if (actionType === 'Order Material') {
      title = 'Material Requisition Queued';
      message = `Material procurement requisition queued for Order #${order?.id} (${order?.styleName})!`;
      icon = '📦';
      badgeText = 'Material Indent';
    } else if (actionType === 'Button PO') {
      title = 'Accessories PO — Buttons';
      message = `Button accessories purchase requisition created for Order #${order?.id} (${order?.styleName})!`;
      icon = '🔘';
      badgeText = 'Button PO Queued';
    } else if (actionType === 'Lace PO') {
      title = 'Accessories PO — Lace';
      message = `Lace accessories purchase requisition created for Order #${order?.id} (${order?.styleName})!`;
      icon = '✂️';
      badgeText = 'Lace PO Queued';
    }

    setProcurementModal({
      isOpen: true,
      actionType,
      order,
      title,
      message,
      icon,
      badgeText,
      details
    });
  };

  return (
    <>
      {viewMode === 'create' && (
        <OrderCreationWizard
          editingOrder={selectedOrder}
          onSaveOrder={(newOrder, action) => handleSaveOrder(newOrder, action, true)}
          onCancel={() => {
            setSelectedOrder(null);
            setViewMode('list');
            if (onNavigate) {
              onNavigate('/orders');
            } else if (typeof window !== 'undefined' && window.history?.pushState) {
              window.history.pushState(null, '', '/react/orders');
            }
          }}
        />
      )}

      {viewMode === 'detail' && selectedOrder && (
        <OrderDetailView
          order={selectedOrder}
          onBack={() => {
            setSelectedOrder(null);
            setViewMode('list');
            if (onNavigate) {
              onNavigate('/orders');
            } else if (typeof window !== 'undefined' && window.history?.pushState) {
              window.history.pushState(null, '', '/react/orders');
            }
          }}
          onEditSection={(section) => {
            setViewMode('create');
            if (selectedOrder) {
              if (onNavigate) {
                onNavigate(`/orders/edit/${selectedOrder.id}`, selectedOrder);
              } else if (typeof window !== 'undefined' && window.history?.pushState) {
                window.history.pushState(null, '', `/react/orders/edit/${selectedOrder.id}`);
              }
            }
          }}
          onTriggerProcurement={handleTriggerProcurement}
          onNavigateToProcurement={onNavigateToProcurement}
          onUpdateOrder={handleUpdateOrder}
        />
      )}

      {(viewMode === 'list' || (viewMode === 'detail' && !selectedOrder)) && (
        <OrdersListView
          orders={orders}
          onNewOrder={handleNewOrder}
          onViewOrder={handleViewOrder}
          onEditOrder={handleEditOrder}
        />
      )}

      {/* Modern Custom Procurement & Action Modal */}
      {procurementModal.isOpen && (
        <ProcurementModal
          data={procurementModal}
          onClose={() => setProcurementModal(prev => ({ ...prev, isOpen: false }))}
          onNavigate={() => {
            if (procurementModal.actionType === 'Create PO' && onNavigateToProcurement) {
              onNavigateToProcurement('/procurement-pos', procurementModal.order);
            } else if (procurementModal.actionType === 'QC Batch' && onNavigateToProcurement) {
              onNavigateToProcurement('/quality-batches', procurementModal.order);
            }
          }}
        />
      )}
      {/* Toast Notification */}
      {toast.show && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1080 }}>
          <div className="toast show align-items-center text-white bg-dark border-0 shadow-lg rounded-3">
            <div className="d-flex">
              <div className="toast-body d-flex align-items-center gap-2 py-2.5 px-3 fs-13">
                <i className="ti ti-circle-check text-success fs-5"></i>
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToast({ show: false, message: '', type: 'success' })}
              ></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
