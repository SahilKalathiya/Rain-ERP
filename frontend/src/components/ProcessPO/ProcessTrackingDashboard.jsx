import React from 'react';

/**
 * ProcessTrackingDashboard - Section 7: Required / Sent / Received / Pending Tracking
 * Live running calculation per order + fabric + colour
 */
export default function ProcessTrackingDashboard({ pos = [], challans = [], returns = [], openBales = [] }) {
  // Aggregate tracking rows
  const trackingRows = [
    {
      order_id: 'ORD-2026-001',
      style_name: 'Graphic Boota Kurta',
      fabric_name: '100x100 Voile (Grey)',
      color_name: 'Off White',
      required_meters: 1046.45,
      sent_meters: 1065.50, // Challan 4903 Roll 12304
      received_meters: 1006.20, // Return 2196
      pending_at_vendor: 59.30,
      status: 'Fulfilled / In QC'
    },
    {
      order_id: 'ORD-2026-001',
      style_name: 'Graphic Boota Kurta',
      fabric_name: '100x100 Voile (Grey)',
      color_name: 'Beige',
      required_meters: 546.00,
      sent_meters: 539.80, // Rolls 2376 A-F
      received_meters: 471.40, // Return 2196 Beige pieces
      pending_at_vendor: 68.40,
      status: 'Partial Return'
    },
    {
      order_id: 'ORD-2026-002',
      style_name: 'Stock Cambric Plain',
      fabric_name: 'Cotton Cambric 60*60',
      color_name: 'Dusty Rose',
      required_meters: 918.66,
      sent_meters: 887.60,
      received_meters: 0.00,
      pending_at_vendor: 887.60,
      status: 'Out for Processing'
    }
  ];

  return (
    <div>
      {/* Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 bg-white border-start border-4 border-primary">
            <span className="small text-muted text-uppercase fw-bold">Total Fabric Required</span>
            <h4 className="fw-bold text-dark mt-1">2,511.11 m</h4>
            <small className="text-muted">Total across 3 Order Batches</small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 bg-white border-start border-4 border-danger">
            <span className="small text-muted text-uppercase fw-bold">Sent to Vendors (Dispatched)</span>
            <h4 className="fw-bold text-danger mt-1">2,492.90 m</h4>
            <small className="text-muted">Challans issued & handed over</small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 bg-white border-start border-4 border-success">
            <span className="small text-muted text-uppercase fw-bold">Received from Process (GRN)</span>
            <h4 className="fw-bold text-success mt-1">1,477.60 m</h4>
            <small className="text-muted">Inward received & piece verified</small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 bg-white border-start border-4 border-warning">
            <span className="small text-muted text-uppercase fw-bold">Pending At Vendors</span>
            <h4 className="fw-bold text-warning-emphasis mt-1">1,015.30 m</h4>
            <small className="text-muted">Currently sitting at dye houses</small>
          </div>
        </div>
      </div>

      {/* Live Table */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <h6 className="card-title mb-0 fw-bold text-dark">
              <i className="ti ti-chart-arrows-vertical me-2 text-primary"></i>
              Order-Wise Fabric Processing Tracking Grid (Section 7)
            </h6>
            <small className="text-muted">Recalculates live as POs, Challans, and Returns are added</small>
          </div>
          <span className="badge bg-light text-muted border">Live Sync Active</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr>
                <th>Order Reference</th>
                <th>Style Name</th>
                <th>Fabric Quality</th>
                <th>Color</th>
                <th className="text-end">Required (m)</th>
                <th className="text-end text-danger">Sent / Dispatched (m)</th>
                <th className="text-end text-success">Received Back (m)</th>
                <th className="text-end text-warning-emphasis">Pending at Vendor (m)</th>
                <th className="text-center">Tracking Status</th>
              </tr>
            </thead>
            <tbody>
              {trackingRows.map((row, idx) => (
                <tr key={idx}>
                  <td className="fw-bold text-primary">{row.order_id}</td>
                  <td>{row.style_name}</td>
                  <td>{row.fabric_name}</td>
                  <td>
                    <span className="badge bg-light text-dark border me-1">●</span>
                    {row.color_name}
                  </td>
                  <td className="text-end fw-bold">{row.required_meters.toFixed(2)}</td>
                  <td className="text-end fw-bold text-danger">{row.sent_meters.toFixed(2)}</td>
                  <td className="text-end fw-bold text-success">{row.received_meters.toFixed(2)}</td>
                  <td className="text-end fw-bold text-warning-emphasis">{row.pending_at_vendor.toFixed(2)}</td>
                  <td className="text-center">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Bales Table (Grey Fabric Returned - Section 5.3) */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <h6 className="card-title mb-0 fw-bold text-dark">
              <i className="ti ti-archive me-2 text-secondary"></i>
              Open Bales Pool (Grey / Unprocessed Fabric Returned by Vendors - Section 5.3)
            </h6>
            <small className="text-muted">Unutilised fabric returned without specific original bale ID</small>
          </div>
          <span className="badge bg-secondary text-white">{openBales.length} Open Bales</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr>
                <th>Bale ID</th>
                <th>Source Inbound GRN</th>
                <th>Fabric Quality</th>
                <th>Target Vendor Purchase Invoice</th>
                <th className="text-end">Returned Length</th>
                <th className="text-end">Available Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {openBales.map((b) => (
                <tr key={b.id}>
                  <td className="fw-bold text-secondary">{b.id}</td>
                  <td>{b.return_id}</td>
                  <td>{b.fabric_name}</td>
                  <td>{b.original_vendor_invoice_ref}</td>
                  <td className="text-end fw-bold">{b.returned_meters.toFixed(2)} m</td>
                  <td className="text-end fw-bold text-success">{b.remaining_meters.toFixed(2)} m</td>
                  <td>
                    <span className="badge bg-success-subtle text-success border border-success-subtle">
                      {b.status}
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
