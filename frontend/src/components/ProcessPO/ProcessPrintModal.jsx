import React from 'react';

/**
 * Print Modal for Process PO & Process Challan
 * Matches the client's actual printed document layout (Page 11 & Page 15 of PDF)
 */
export default function ProcessPrintModal({ type = 'PO', data, onClose }) {
  if (!data) return null;

  const isChallan = type === 'CHALLAN';

  const handlePrint = () => {
    window.print();
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
