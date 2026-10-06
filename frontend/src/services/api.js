const API_BASE = 'http://localhost:5000/api';

/**
 * Universal API Client for Rain ERP (Connects React frontend to Node/Express/MySQL)
 */

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn(`[API Server Offline or Network Issue at ${endpoint}]:`, err.message);
    return { success: false, offline: true, error: err.message };
  }
}

export const api = {
  // 1. Masters
  getVendors: () => request('/procurement/vendors'),
  saveVendor: (vendor) => request('/procurement/vendors', { method: 'POST', body: JSON.stringify(vendor) }),

  getFabrics: () => request('/procurement/fabrics'),
  saveFabric: (fabric) => request('/procurement/fabrics', { method: 'POST', body: JSON.stringify(fabric) }),

  getTransporters: () => request('/procurement/transporters'),
  saveTransporter: (transporter) => request('/procurement/transporters', { method: 'POST', body: JSON.stringify(transporter) }),

  // 2. Purchase Orders
  getPurchaseOrders: () => request('/procurement/purchase-orders'),
  savePurchaseOrder: (po) => request('/procurement/purchase-orders', { method: 'POST', body: JSON.stringify(po) }),

  // 3. Goods Receipt Notes (GRN)
  getGRNs: () => request('/procurement/grns'),
  saveGRN: (grn) => request('/procurement/grns', { method: 'POST', body: JSON.stringify(grn) }),

  // 4. Quality Checks (QC)
  getQualityChecks: () => request('/procurement/quality-checks'),
  saveQualityCheck: (qc) => request('/procurement/quality-checks', { method: 'POST', body: JSON.stringify(qc) }),

  // 5. Rejected Stock Pool
  getRejectedStock: () => request('/procurement/rejected-stock'),
  saveRejectedStock: (stock) => request('/procurement/rejected-stock', { method: 'POST', body: JSON.stringify(stock) }),

  // 6. Audit Logs
  getAuditLogs: () => request('/procurement/audit-logs'),
  saveAuditLog: (log) => request('/procurement/audit-logs', { method: 'POST', body: JSON.stringify(log) })
};
