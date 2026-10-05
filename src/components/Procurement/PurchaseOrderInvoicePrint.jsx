import React from 'react';

/**
 * PurchaseOrderInvoicePrint - 4.2 Professional Invoice-Style PO Print
 * Renders print-ready purchase order matching client documents (M.S. Textiles style)
 */
export default function PurchaseOrderInvoicePrint({ po, onBack }) {
  if (!po) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalAmount = (po.items || []).reduce(
    (sum, it) => sum + (Number(it.amount) || Number(it.quantity) * Number(it.rate) || 0),
    0
  );

  return (
    <div className="container p-0 my-3">
      {/* Action Bar (hidden on print) */}
      <div className="d-flex align-items-center justify-content-between mb-4 d-print-none">
        <button
          type="button"
          className="btn btn-light rounded-pill px-3 py-2 d-flex align-items-center gap-2"
          onClick={onBack}
        >
          <i className="ti ti-arrow-left fs-16"></i>
          <span>Back to PO Details</span>
        </button>

        <button
          type="button"
          className="btn btn-primary rounded-pill px-4 py-2 d-flex align-items-center gap-2 shadow-sm"
          onClick={handlePrint}
        >
          <i className="ti ti-printer fs-16"></i>
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Printable Invoice Container */}
      <div
        className="card border bg-white p-5 mx-auto rounded-3 shadow-sm print-area"
        style={{ maxWidth: '900px', minHeight: '1100px' }}
      >
        {/* Header */}
        <div className="d-flex align-items-start justify-content-between border-bottom pb-4 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <div
                className="bg-primary text-white fw-bold rounded-2 px-2 py-1 fs-18"
                style={{ width: '38px', height: '38px', textAlign: 'center' }}
              >
                RD
              </div>
              <h2 className="fw-bold text-dark mb-0 fs-24">Rain Drop Garments</h2>
            </div>
            <p className="text-secondary fs-12 mb-0">Order &amp; Stock Management System</p>
            <div className="text-muted fs-12 mt-1">
              H1-40, RIICO Industrial Area, Mansarovar, Jaipur 302020, Rajasthan<br />
              <strong>GSTIN:</strong> 08BZJPD0890G1ZD | <strong>State:</strong> Rajasthan (08)<br />
              <strong>Email:</strong> purchase@raindroperp.com | <strong>Contact:</strong> +91 98290 12345
            </div>
          </div>

          <div className="text-end">
            <h3 className="fw-bold text-primary mb-1 fs-20">PURCHASE ORDER</h3>
            <div className="font-monospace fw-bold text-dark fs-16 mb-1">{po.id}</div>
            <div className="text-muted fs-12">
              <strong>PO Date:</strong> {po.date}<br />
              <strong>Delivery Target:</strong> {po.expectedDeliveryDate || 'Immediate'}<br />
              <strong>Status:</strong> {po.status}
            </div>
          </div>
        </div>

        {/* Vendor and Delivery Block */}
        <div className="row g-3 mb-4">
          <div className="col-6">
            <div className="p-3 border rounded-3 bg-light h-100">
              <span className="text-uppercase text-secondary fw-bold fs-11 tracking-wider d-block mb-1">
                Vendor Details (Supplier)
              </span>
              <h5 className="fw-bold text-dark mb-1 fs-15">{po.vendorName}</h5>
              <div className="text-muted fs-12">
                ID: {po.vendorId}<br />
                Bhiwandi / Surat Fabric Hub<br />
                <strong>GSTIN:</strong> 27AFQPA0986G1ZA
              </div>
            </div>
          </div>

          <div className="col-6">
            <div className="p-3 border rounded-3 bg-light h-100">
              <span className="text-uppercase text-secondary fw-bold fs-11 tracking-wider d-block mb-1">
                Delivery &amp; Buffer Terms
              </span>
              <div className="text-muted fs-12">
                <strong>Delivery To:</strong> Central Fabric Godown #2, Jaipur<br />
                <strong>Buffer (+/-) Allowed:</strong>{' '}
                {po.bufferAllowed ? `Yes (±${po.bufferPercent}%)` : 'No (Strict Quantity)'}<br />
                <strong>Payment Terms:</strong> 20 Days from Delivery<br />
                <strong>Transport Mode:</strong> Keshav Freight / Road Transport
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="table-responsive mb-4">
          <table className="table table-bordered border-dark align-middle mb-0 fs-13">
            <thead className="table-light border-dark text-dark fw-bold">
              <tr>
                <th style={{ width: '5%' }} className="text-center">
                  #
                </th>
                <th style={{ width: '40%' }}>Description of Goods (Fabric Quality)</th>
                <th style={{ width: '10%' }} className="text-center">
                  Width
                </th>
                <th style={{ width: '15%' }} className="text-end">
                  Quantity
                </th>
                <th style={{ width: '15%' }} className="text-end">
                  Rate / Mtr
                </th>
                <th style={{ width: '15%' }} className="text-end">
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {(po.items || []).map((it, idx) => (
                <tr key={idx}>
                  <td className="text-center">{idx + 1}</td>
                  <td>
                    <div className="fw-semibold text-dark">{it.fabricName}</div>
                    <div className="text-muted fs-11">
                      HSN: 520811 | Fold Standard: {it.fold || 97}%
                    </div>
                  </td>
                  <td className="text-center">{it.width}"</td>
                  <td className="text-end fw-bold">
                    {Number(it.quantity).toLocaleString()} Mtrs
                  </td>
                  <td className="text-end">₹{Number(it.rate).toFixed(2)}</td>
                  <td className="text-end fw-bold">
                    ₹
                    {(Number(it.amount) || Number(it.quantity) * Number(it.rate)).toLocaleString(
                      'en-IN',
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="5" className="text-end fw-bold fs-13">
                  Sub-Total:
                </td>
                <td className="text-end fw-bold fs-13">
                  ₹
                  {totalAmount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
              </tr>
              <tr>
                <td colSpan="5" className="text-end fw-bold fs-13">
                  Output IGST (5%):
                </td>
                <td className="text-end fw-bold fs-13">
                  ₹
                  {(totalAmount * 0.05).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
              </tr>
              <tr className="table-light">
                <td colSpan="5" className="text-end fw-bold fs-15 text-primary">
                  Total Chargeable Amount:
                </td>
                <td className="text-end fw-bold fs-16 text-primary">
                  ₹
                  {(totalAmount * 1.05).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Terms */}
        <div className="mb-5 p-3 border rounded-3 bg-light fs-12">
          <div className="fw-bold text-dark mb-1">Terms &amp; Instructions:</div>
          <div>{po.terms || '1. Claims for shortage or quality must be notified within 24 hours of delivery.'}</div>
          <div>2. Every bale packing slip with piece-wise meters must accompany delivery.</div>
          <div>3. Subject to Jaipur Jurisdiction.</div>
        </div>

        {/* Signatures */}
        <div className="row g-4 mt-auto pt-4 border-top">
          <div className="col-4 text-center">
            <div className="border-bottom pb-4 mb-2"></div>
            <span className="fs-12 text-muted">Prepared By</span>
          </div>
          <div className="col-4 text-center">
            <div className="border-bottom pb-4 mb-2"></div>
            <span className="fs-12 text-muted">Verified &amp; Checked By</span>
          </div>
          <div className="col-4 text-center">
            <div className="border-bottom pb-4 mb-2"></div>
            <span className="fs-12 fw-bold text-dark">For Rain Drop Garments (Authorised)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
