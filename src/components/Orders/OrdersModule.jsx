import React, { useState } from 'react';

export default function OrdersModule() {
  const [orders] = useState([
    {
      id: 'ORD-2026-001',
      customer: 'Zara India',
      article: 'Summer Kurti 2026',
      totalQty: '2,500 pcs',
      deliveryDate: '25/10/2026',
      status: 'Production'
    },
    {
      id: 'ORD-2026-002',
      customer: 'FabIndia Retail',
      article: 'Designer Anarkali Gown',
      totalQty: '1,200 pcs',
      deliveryDate: '15/11/2026',
      status: 'Cutting'
    },
    {
      id: 'ORD-2026-003',
      customer: 'Westside Styles',
      article: 'Festive Silk Kurta Set',
      totalQty: '3,000 pcs',
      deliveryDate: '30/11/2026',
      status: 'Procurement'
    }
  ]);

  return (
    <div className="p-4" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1 fs-24">Garment Orders</h2>
          <p className="text-secondary mb-0 fs-13">Customer Sales Orders &amp; Production Scheduling</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium rounded-3">
          <i className="ti ti-plus fs-16"></i>
          <span>New Sales Order</span>
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-secondary">
              <tr>
                <th>Order ID</th>
                <th>Client / Buyer</th>
                <th>Garment Article</th>
                <th>Total Order Qty</th>
                <th>Target Delivery</th>
                <th>Current Stage</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <tr key={ord.id}>
                  <td className="fw-bold text-primary">{ord.id}</td>
                  <td className="fw-medium">{ord.customer}</td>
                  <td>{ord.article}</td>
                  <td>{ord.totalQty}</td>
                  <td>{ord.deliveryDate}</td>
                  <td>
                    <span className="badge bg-primary-subtle text-primary px-2 py-1">
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
