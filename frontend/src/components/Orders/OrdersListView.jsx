import React, { useState, useEffect } from 'react';
import { initialSalesOrders, getStoredData } from '../../data/salesOrderData';

export default function OrdersListView({ orders: propOrders, onNewOrder, onViewOrder, onEditOrder }) {
  const [orders, setOrders] = useState(() => {
    if (propOrders && propOrders.length > 0) return propOrders;
    return getStoredData('erp_sales_orders_v1', initialSalesOrders);
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  useEffect(() => {
    if (propOrders && propOrders.length > 0) {
      setOrders(propOrders);
    }
  }, [propOrders]);

  useEffect(() => {
    const handleSync = () => {
      setOrders(getStoredData('erp_sales_orders_v1', initialSalesOrders));
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('erp_sales_order_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('erp_sales_order_updated', handleSync);
    };
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      (o.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.styleName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.createdBy || '').toLowerCase().includes(searchQuery.toLowerCase());

    const effectiveStatus = o.status || 'Confirmed';
    const matchesStatus = statusFilter === 'All' || effectiveStatus === statusFilter;
    const matchesPriority = priorityFilter === 'All' || o.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="ti ti-shopping-bag text-primary"></i> Sales Orders & Styles
          </h4>
          <p className="text-muted small mb-0">Route 1: Manage customer orders, size-wise matrices, fabric BOM and procurement basket</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2 rounded-3 px-4 fw-semibold shadow-sm" onClick={onNewOrder}>
          <i className="ti ti-plus"></i> Create New Sales Order
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <i className="ti ti-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search style name, order ID, created by..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="In Production">In Production</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="All">All Priorities</option>
              <option value="Normal">Normal Priority</option>
              <option value="High">High Priority</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div className="col-md-1 text-end">
            <span className="badge bg-light text-secondary border p-2 rounded-3">
              {filteredOrders.length} Orders
            </span>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="py-3 px-3 text-muted small fw-bold">ORDER ID</th>
                <th className="py-3 px-3 text-muted small fw-bold">STYLE NAME</th>
                <th className="py-3 px-3 text-muted small fw-bold">ORDER DATE</th>
                <th className="py-3 px-3 text-muted small fw-bold">EXPECTED DELIVERY</th>
                <th className="py-3 px-3 text-muted small fw-bold">TOTAL PCS</th>
                <th className="py-3 px-3 text-muted small fw-bold">FABRIC GREIGE</th>
                <th className="py-3 px-3 text-muted small fw-bold text-center">PRIORITY</th>
                <th className="py-3 px-3 text-muted small fw-bold text-center">STATUS</th>
                <th className="py-3 px-3 text-muted small fw-bold text-end">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => (
                <tr key={ord.id} style={{ cursor: 'pointer' }} onClick={() => onViewOrder(ord)}>
                  <td className="px-3 fw-bold text-primary font-monospace">{ord.id}</td>
                  <td className="px-3">
                    <div className="fw-semibold text-dark">{ord.styleName}</div>
                    <div className="text-muted small">{ord.sizeSeriesName || 'Alphabetic Series'}</div>
                  </td>
                  <td className="px-3 text-muted">{ord.orderDate}</td>
                  <td className="px-3 text-dark fw-medium">{ord.expectedDelivery || '—'}</td>
                  <td className="px-3">
                    <span className="badge bg-primary-subtle text-primary px-2 py-1 fs-7">
                      {ord.totalGarments || 0} pcs
                    </span>
                  </td>
                  <td className="px-3 font-monospace">{ord.totalFabricGreige ? `${ord.totalFabricGreige} m` : '—'}</td>
                  <td className="px-3 text-center">
                    <span
                      className={`badge ${
                        ord.priority === 'Urgent'
                          ? 'bg-danger text-white'
                          : ord.priority === 'High'
                          ? 'bg-warning-subtle text-warning border border-warning'
                          : 'bg-light text-secondary border'
                      } px-2 py-1 rounded-pill`}
                    >
                      {ord.priority}
                    </span>
                  </td>
                  <td className="px-3 text-center">
                    <span
                      className={`badge px-2.5 py-1 rounded-pill fw-medium ${
                        ord.status === 'Draft'
                          ? 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                          : ord.status === 'In Production'
                          ? 'bg-info-subtle text-info border border-info-subtle'
                          : ord.status === 'Completed'
                          ? 'bg-primary-subtle text-primary border border-primary-subtle'
                          : 'bg-success-subtle text-success border border-success-subtle'
                      }`}
                      style={{ fontSize: '12px' }}
                    >
                      {ord.status || 'Confirmed'}
                    </span>
                  </td>
                  <td className="px-3 text-end" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-sm btn-light text-primary me-1"
                      title="View Details"
                      onClick={() => onViewOrder(ord)}
                    >
                      <i className="ti ti-eye"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-light text-secondary"
                      title="Edit Sections"
                      onClick={() => onEditOrder(ord)}
                    >
                      <i className="ti ti-edit"></i>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    <i className="ti ti-shopping-bag-off fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    No sales orders found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
