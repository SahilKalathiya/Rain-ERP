import React from 'react';

/**
 * Print Modal for Process PO & Process Challan
 * Matches the client's actual printed document layout (Page 11 & Page 15 of PDF)
 */
export default function ProcessPrintModal({ type = 'PO', data, onClose }) {
  if (!data) return null;

  const isChallan = type === 'CHALLAN';

  const handlePrint = () => {
    const printElem = document.getElementById('printable-process-doc');
    if (!printElem) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${isChallan ? `Challan_${data.challan_number || data.id}` : `Purchase_Order_${data.po_number || data.id}`}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 8mm 10mm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              font-size: 12px !important;
              line-height: 1.4 !important;
              margin: 0 !important;
              padding: 6px !important;
            }
            .border { border: 1px solid #111827 !important; }
            .border-bottom { border-bottom: 1px solid #111827 !important; }
            .border-top { border-top: 1px solid #111827 !important; }
            .border-end { border-right: 1px solid #111827 !important; }
            .border-dark { border-color: #111827 !important; }
            .p-3 { padding: 12px !important; }
            .p-4 { padding: 16px !important; }
            .pt-1 { padding-top: 4px !important; }
            .pt-2 { padding-top: 8px !important; }
            .pt-4 { padding-top: 18px !important; }
            .pb-2 { padding-bottom: 8px !important; }
            .pe-3 { padding-right: 12px !important; }
            .ps-3 { padding-left: 12px !important; }
            .mb-0 { margin-bottom: 0 !important; }
            .mb-1 { margin-bottom: 4px !important; }
            .mb-2 { margin-bottom: 8px !important; }
            .mb-3 { margin-bottom: 12px !important; }
            .mt-1 { margin-top: 4px !important; }
            .mt-3 { margin-top: 14px !important; }
            .row { display: flex; flex-wrap: wrap; margin-right: -8px; margin-left: -8px; }
            .col-4 { flex: 0 0 33.3333%; max-width: 33.3333%; padding: 0 8px; }
            .col-5 { flex: 0 0 41.6666%; max-width: 41.6666%; padding: 0 8px; }
            .col-6 { flex: 0 0 50%; max-width: 50%; padding: 0 8px; }
            .col-7 { flex: 0 0 58.3333%; max-width: 58.3333%; padding: 0 8px; }
            .col-8 { flex: 0 0 66.6666%; max-width: 66.6666%; padding: 0 8px; }
            .text-end { text-align: right !important; }
            .text-center { text-align: center !important; }
            .fw-bold { font-weight: 700 !important; }
            .fw-black { font-weight: 900 !important; }
            .text-uppercase { text-transform: uppercase !important; }
            .text-muted { color: #475569 !important; }
            .text-danger { color: #dc2626 !important; }
            .text-primary { color: #2563eb !important; }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              font-size: 11px;
              font-weight: 700;
              border-radius: 4px;
              background-color: #1e293b !important;
              color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin-bottom: 12px;
              font-size: 11px !important;
            }
            th, td {
              border: 1px solid #111827 !important;
              padding: 5px 7px !important;
            }
            thead th {
              background-color: #f1f5f9 !important;
              font-weight: 700 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            tfoot tr {
              background-color: #f8fafc !important;
              font-weight: 700 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          ${printElem.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow.print();
      } catch (e) {
        window.print();
      }
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch (e) {}
      }, 2000);
    }, 250);
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} tabIndex="-1">
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header bg-dark text-white d-flex justify-content-between align-items-center py-2">
            <h6 className="modal-title mb-0 fw-bold">
              <i className="ti ti-printer me-2"></i>
              {isChallan ? `Challan Print — #${data.challan_number || data.id}` : `Purchase Order Print — #${data.po_number || data.id}`}
            </h6>
            <div>
              <button className="btn btn-sm btn-primary me-2" onClick={handlePrint}>
                <i className="ti ti-printer me-1"></i> Print / Save PDF
              </button>
              <button className="btn btn-sm btn-outline-light" onClick={onClose}>
                <i className="ti ti-x"></i>
              </button>
            </div>
          </div>

          <div className="modal-body p-4 bg-white" id="printable-process-doc">
            {/* Header matching Raindrop paper format */}
            <div className="border border-dark p-3 mb-3">
              <div className="row align-items-center border-bottom border-dark pb-2 mb-2">
                <div className="col-7">
                  <h4 className="fw-black text-uppercase tracking-wider mb-0" style={{ letterSpacing: '1px' }}>RAINDROP</h4>
                  <small className="text-muted d-block" style={{ fontSize: '11px' }}>
                    H1-40, RIICO Industrial Area, Mansarovar, Jaipur - 302020<br />
                    Ph: +91 9829059529 | GSTIN: 08BZJPD0890G1ZD
                  </small>
                </div>
                <div className="col-5 text-end">
                  <span className="badge bg-dark text-white px-3 py-1 fs-6 text-uppercase">
                    {isChallan ? 'JOB CHALLAN' : 'PURCHASE ORDER (JOB WORK)'}
                  </span>
                  <div className="mt-1 fw-bold fs-5 text-danger">
                    {isChallan ? `CH-NO: ${data.challan_number || data.id}` : `PO NO: ${data.po_number || data.id}`}
                  </div>
                  <div className="small text-muted">Date: {data.date || new Date().toISOString().split('T')[0]}</div>
                </div>
              </div>

              {/* Vendor & Ref section */}
              <div className="row mb-3" style={{ fontSize: '13px' }}>
                <div className="col-6 border-end border-dark pe-3">
                  <div className="text-muted small">To (M/s):</div>
                  <div className="fw-bold fs-6 text-dark">{data.vendor_name || 'Raju Dyeing (Krishna Dyeing)'}</div>
                  <div className="text-muted small">Job Issue for Dyeing / Processing</div>
                </div>
                <div className="col-6 ps-3">
                  {isChallan ? (
                    <div>
                      <div><span className="text-muted">Linked PO(s):</span> <strong className="text-primary">{Array.isArray(data.linked_pos) ? data.linked_pos.join(', ') : 'PPO-7611, PPO-7612, PPO-7613'}</strong></div>
                      <div><span className="text-muted">Folding Notation:</span> <strong>{data.folding_notation || 'L100'}</strong></div>
                      <div><span className="text-muted">Total Bales / Rolls:</span> <strong>{data.total_bales || 1} Bale ({data.total_pieces || 7} Pcs)</strong></div>
                    </div>
                  ) : (
                    <div>
                      <div><span className="text-muted">Sales Order:</span> <strong>{data.linked_sales_order_id || 'Standalone PO (General Stock)'}</strong></div>
                      <div><span className="text-muted">Styles:</span> <strong>{Array.isArray(data.style_names) ? data.style_names.join(', ') : (data.style_name || 'Graphic Boota Kurta')}</strong></div>
                      <div><span className="text-muted">Expected Delivery:</span> <strong>{data.delivery_date || 'Within 14 Days'}</strong></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <table className="table table-bordered border-dark table-sm mb-3" style={{ fontSize: '12px' }}>
                <thead className="table-light border-dark text-center">
                  {isChallan ? (
                    <tr>
                      <th style={{ width: '40px' }}>S.No.</th>
                      <th>Bale / Roll No</th>
                      <th>Particulars / Fabric Quality</th>
                      <th>Color</th>
                      <th>Invoice Ref</th>
                      <th>Folding</th>
                      <th className="text-end">Meters</th>
                    </tr>
                  ) : (
                    <tr>
                      <th style={{ width: '40px' }}>S.No.</th>
                      <th>Particulars (Fabric & Quality)</th>
                      <th>Style / Article</th>
                      <th>Color</th>
                      <th>Width</th>
                      <th className="text-end">Mtrs</th>
                      <th className="text-end">Rate/m</th>
                      <th className="text-end">Amount (₹)</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {isChallan ? (
                    (data.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-center">{idx + 1}</td>
                        <td className="fw-bold">{item.bale_roll_no}</td>
                        <td>{item.fabric_name}</td>
                        <td>{item.color_name}</td>
                        <td>{item.invoice_no || 'INV-MS-0091'}</td>
                        <td className="text-center">{item.folding || 'L100'}</td>
                        <td className="text-end fw-bold">{Number(item.dispatched_meters || item.meters || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    (data.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-center">{idx + 1}</td>
                        <td className="fw-bold">{item.fabric_name} ({item.width}")</td>
                        <td>{item.style_name} - {item.article_name}</td>
                        <td>
                          <span className="badge border me-1" style={{ backgroundColor: item.color_hex || '#eee', color: '#000' }}>●</span>
                          {item.color_name}
                        </td>
                        <td className="text-center">{item.width}"</td>
                        <td className="text-end fw-bold">{Number(item.quantity_meters || 0).toFixed(2)}</td>
                        <td className="text-end">₹{Number(item.dyeing_rate || 12).toFixed(2)}</td>
                        <td className="text-end fw-bold">₹{Number(item.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="fw-bold border-top border-dark table-light">
                    <td colSpan={isChallan ? 6 : 5} className="text-end text-uppercase">Grand Total:</td>
                    <td className="text-end fs-6 text-dark">
                      {isChallan ? `${Number(data.grand_total_meters || 2418.80).toFixed(2)} Mtrs` : `${Number(data.total_meters || 0).toFixed(2)} Mtrs`}
                    </td>
                    {!isChallan && (
                      <td className="text-end fs-6 text-primary">
                        ₹{Number(data.total_estimated_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    )}
                  </tr>
                </tfoot>
              </table>

              {/* Terms and Remarks */}
              <div className="row border-top border-dark pt-2 mb-3" style={{ fontSize: '11px' }}>
                <div className="col-8">
                  <div className="fw-bold text-uppercase">Terms & Conditions:</div>
                  <p className="mb-0 text-muted">
                    {data.terms || '1. Goods delivered must be strictly as per sample and specification within stipulated date.\n2. Any variation in shade or quality must be reported immediately.'}
                  </p>
                  {data.remarks && (
                    <div className="mt-1 text-dark">
                      <strong>Remarks:</strong> {data.remarks}
                    </div>
                  )}
                </div>
                <div className="col-4 text-end">
                  <div className="text-muted small">Total Pieces: <strong>{data.total_pieces || data.items?.length || 1} Pcs</strong></div>
                </div>
              </div>

              {/* Signature Blocks as required by Section 9 & client's slips */}
              <div className="row pt-4 mt-3 border-top border-dark text-center" style={{ fontSize: '12px' }}>
                <div className="col-4">
                  <div style={{ height: '35px' }}></div>
                  <div className="border-top border-dark pt-1 fw-bold">Receiver's Signature</div>
                  <small className="text-muted">{data.receiver_signature || '(Vendor Representative)'}</small>
                </div>
                <div className="col-4">
                  <div style={{ height: '35px' }} className="fw-bold text-primary">{data.created_by || 'Saksham Garg'}</div>
                  <div className="border-top border-dark pt-1 fw-bold">Prepared By / Logged User</div>
                  <small className="text-muted">Raindrop Procurement Desk</small>
                </div>
                <div className="col-4">
                  <div style={{ height: '35px' }} className="fw-bold">{data.company_representative || 'Anurag'}</div>
                  <div className="border-top border-dark pt-1 fw-bold">For RAINDROP (Authorised Signatory)</div>
                  <small className="text-muted">Company Representative</small>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer bg-light py-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
              <i className="ti ti-printer me-1"></i> Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
