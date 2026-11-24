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
            {isChallan ? (
              /* ========================================================================= */
              /* AUTHENTIC JOB CHALLAN PAPER SLIP (Matching Page 15 & Uploaded Image)       */
              /* ========================================================================= */
              <div className="border border-dark p-3 bg-white" style={{ fontFamily: '"Courier New", Courier, monospace, -apple-system, sans-serif' }}>
                {/* Top Meta Line: GSTIN, PAN, and Book No 2412 */}
                <div className="d-flex justify-content-between align-items-start mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>
                  <div>
                    <div>GSTIN : 08BZJPD0890G1ZD</div>
                    <div>PAN No. : BZJPD0890G</div>
                  </div>
                  <div className="fs-6 fw-bold font-monospace text-dark border-bottom border-dark px-1">
                    2412
                  </div>
                </div>

                {/* Center Header: JOB CHALLAN & RAINDROP */}
                <div className="text-center mb-2">
                  <div className="fw-bold text-uppercase fs-6 tracking-wide" style={{ letterSpacing: '1px' }}>
                    JOB CHALLAN
                  </div>
                  <h2 className="fw-black text-uppercase mb-0" style={{ letterSpacing: '2px', fontWeight: 900, color: '#0f172a' }}>
                    RAINDROP
                  </h2>
                  <div className="text-muted" style={{ fontSize: '11px' }}>
                    H1-40, RIICO Industrial Area, Mansarovar, Jaipur-302020
                  </div>
                  <div className="text-muted" style={{ fontSize: '11px' }}>
                    +91 9829059529
                  </div>
                </div>

                {/* Challan No, Party Name, PO Reference & Date */}
                <div className="row g-2 pt-2 pb-2 border-top border-dark align-items-end" style={{ fontSize: '13px' }}>
                  <div className="col-7">
                    <div className="d-flex align-items-baseline mb-1">
                      <span className="fw-bold me-2" style={{ minWidth: '35px' }}>No.</span>
                      <span className="fw-bold fs-5 text-danger font-monospace">
                        {data.challan_number || '4903'}
                      </span>
                    </div>
                    <div className="d-flex align-items-baseline mb-1">
                      <span className="fw-bold me-2" style={{ minWidth: '35px' }}>M/s</span>
                      <span className="fw-bold fs-6 text-dark border-bottom border-dark border-dotted flex-grow-1 pb-0.5">
                        {data.vendor_name || 'Raju dyeing'}
                      </span>
                    </div>
                    <div className="d-flex align-items-baseline">
                      <span className="fw-bold me-2" style={{ minWidth: '35px' }}>GSTIN</span>
                      <span className="border-bottom border-dark border-dotted flex-grow-1" style={{ height: '16px' }}>
                        {data.vendor_gstin || ''}
                      </span>
                    </div>
                  </div>

                  <div className="col-5 text-end">
                    <div className="d-flex justify-content-end align-items-baseline mb-1">
                      <span className="fw-bold me-2">P.O =</span>
                      <span className="fw-bold font-monospace fs-6 text-primary">
                        {Array.isArray(data.linked_pos) && data.linked_pos.length > 0
                          ? data.linked_pos.join(', ')
                          : (data.linked_pos || '7611, 7612, 7613')}
                      </span>
                    </div>
                    <div className="d-flex justify-content-end align-items-baseline mb-1">
                      <span className="fw-bold me-2">Date</span>
                      <span className="fw-bold font-monospace fs-6">
                        {(() => {
                          const d = data.date || '2026-08-12';
                          if (d.includes('-')) {
                            const parts = d.split('-');
                            return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
                          }
                          return d;
                        })()}
                      </span>
                    </div>
                    {data.folding_notation && (
                      <div className="d-flex justify-content-end align-items-baseline">
                        <span className="text-muted me-2" style={{ fontSize: '11px' }}>Folding:</span>
                        <span className="badge bg-light text-dark border border-dark fw-bold">
                          {data.folding_notation}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table: S.No. | PARTICULARS | Mtr. | Mtr. | Mtr. */}
                <table className="table table-bordered border-dark table-sm mb-0 mt-2" style={{ fontSize: '12px' }}>
                  <thead className="text-center border-dark" style={{ backgroundColor: '#f8fafc' }}>
                    <tr>
                      <th style={{ width: '50px', border: '1px solid #000' }}>S.No.</th>
                      <th style={{ border: '1px solid #000' }}>PARTICULARS</th>
                      <th style={{ width: '85px', border: '1px solid #000' }}>Mtr.</th>
                      <th style={{ width: '85px', border: '1px solid #000' }}>Mtr.</th>
                      <th style={{ width: '85px', border: '1px solid #000' }}>Mtr.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Row 1: Particulars title line */}
                    <tr style={{ minHeight: '32px' }}>
                      <td className="text-center align-top border-dark" style={{ border: '1px solid #000' }}>1</td>
                      <td className="border-dark" style={{ border: '1px solid #000' }}>
                        <div className="fw-bold fs-13 text-dark">
                          {data.particulars || '100x100 Voil [48"] gray - fab issue for dying'}
                        </div>
                        <div className="text-secondary small mt-1">
                          B N
                        </div>
                      </td>
                      <td className="text-end border-dark" style={{ border: '1px solid #000' }}></td>
                      <td className="text-end border-dark" style={{ border: '1px solid #000' }}></td>
                      <td className="text-end border-dark" style={{ border: '1px solid #000' }}></td>
                    </tr>

                    {/* Dynamic Items / Rolls breakdown */}
                    {data.items && data.items.length > 0 ? (
                      data.items.map((item, idx) => {
                        const isBale = String(item.bale_roll_no || '').toLowerCase().includes('bale');
                        const cleanRoll = String(item.bale_roll_no || '').replace(/Roll\s*/i, '');
                        const mtrVal = Number(item.dispatched_meters || item.meters || 0).toFixed(2);
                        return (
                          <tr key={idx} style={{ height: '24px' }}>
                            <td className="text-center border-dark py-0" style={{ border: '1px solid #000' }}></td>
                            <td className="border-dark py-0 px-3" style={{ border: '1px solid #000' }}>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="font-monospace fw-semibold">
                                  {isBale ? item.bale_roll_no : cleanRoll}
                                  {item.is_partial_cut ? ' (Cut)' : ''}
                                </span>
                                {item.folding && (
                                  <span className="badge bg-light text-muted border px-1.5 py-0 fs-10">
                                    {item.folding}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="text-end font-monospace fw-bold border-dark py-0 px-2" style={{ border: '1px solid #000' }}>
                              {mtrVal}
                            </td>
                            <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                            <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          </tr>
                        );
                      })
                    ) : (
                      /* Default Page 15 slip breakdown if no explicit items */
                      <>
                        <tr style={{ height: '24px' }}>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0 px-3 font-monospace fw-bold" style={{ border: '1px solid #000' }}>
                            12384 -
                          </td>
                          <td className="text-end font-monospace fw-bold border-dark py-0 px-2" style={{ border: '1px solid #000' }}>
                            1865.50
                          </td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                        </tr>
                        <tr style={{ height: '24px' }}>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0 px-3 font-monospace fw-bold" style={{ border: '1px solid #000' }}>
                            2376 -
                          </td>
                          <td className="text-end font-monospace fw-bold border-dark py-0 px-2" style={{ border: '1px solid #000' }}>
                            119.30
                          </td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                        </tr>
                        <tr style={{ height: '24px' }}>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0 px-3 font-monospace text-muted" style={{ border: '1px solid #000' }}>
                            "
                          </td>
                          <td className="text-end font-monospace fw-bold border-dark py-0 px-2" style={{ border: '1px solid #000' }}>
                            111.00
                          </td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                        </tr>
                        <tr style={{ height: '24px' }}>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0 px-3 font-monospace" style={{ border: '1px solid #000' }}>
                            <span className="badge bg-light text-dark border px-1">L-98</span>
                          </td>
                          <td className="text-end font-monospace fw-bold border-dark py-0 px-2" style={{ border: '1px solid #000' }}>
                            78.40
                          </td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                        </tr>
                        <tr style={{ height: '24px' }}>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0 px-3" style={{ border: '1px solid #000' }}></td>
                          <td className="text-end font-monospace fw-bold border-dark py-0 px-2" style={{ border: '1px solid #000' }}>
                            97.80
                          </td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                        </tr>
                        <tr style={{ height: '24px' }}>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0 px-3" style={{ border: '1px solid #000' }}></td>
                          <td className="text-end font-monospace fw-bold border-dark py-0 px-2" style={{ border: '1px solid #000' }}>
                            113.30
                          </td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                        </tr>
                        <tr style={{ height: '24px' }}>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0 px-3 font-monospace text-muted" style={{ border: '1px solid #000' }}>
                            (Cut piece)
                          </td>
                          <td className="text-end font-monospace fw-bold border-dark py-0 px-2" style={{ border: '1px solid #000' }}>
                            20.00
                          </td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                        </tr>
                        <tr style={{ height: '24px' }}>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0 px-3" style={{ border: '1px solid #000' }}></td>
                          <td className="text-end font-monospace fw-bold border-dark py-0 px-2" style={{ border: '1px solid #000' }}>
                            13.50
                          </td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                          <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                        </tr>
                      </>
                    )}

                    {/* Blank spacer rows to give authentic ledger slip appearance */}
                    <tr style={{ height: '20px' }}>
                      <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                      <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                      <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                      <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                      <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                    </tr>
                  </tbody>

                  {/* Table Footer: Remarks, Total Pcs, Grand Total */}
                  <tfoot className="border-dark" style={{ borderTop: '2px solid #000' }}>
                    <tr>
                      <td colSpan={2} className="border-dark py-1 px-2" style={{ border: '1px solid #000' }}>
                        <span className="fw-bold">Remarks: </span>
                        <span>{data.remarks || 'Fab issue for dyeing'}</span>
                      </td>
                      <td className="fw-bold text-center border-dark py-1" style={{ border: '1px solid #000' }}>
                        Total
                      </td>
                      <td className="border-dark py-1" style={{ border: '1px solid #000' }}></td>
                      <td className="border-dark py-1" style={{ border: '1px solid #000' }}></td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="border-dark py-1.5 px-2 bg-light" style={{ border: '1px solid #000' }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="fw-bold text-uppercase">Total Pcs.</span>
                          <span className="fw-bold font-monospace fs-6 text-dark">
                            {data.total_pieces || '1 Bale + 7 th'}
                          </span>
                        </div>
                      </td>
                      <td colSpan={3} className="border-dark py-1.5 px-2 text-end bg-light" style={{ border: '1px solid #000' }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="fw-bold text-uppercase me-2">Grand Total</span>
                          <span className="fw-black fs-5 font-monospace text-dark">
                            {Number(data.grand_total_meters || 2418.80).toFixed(2)} Mtr.
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signatures matching Page 15 slip */}
                <div className="d-flex justify-content-between align-items-end mt-4 pt-3" style={{ fontSize: '13px' }}>
                  <div className="text-center" style={{ width: '220px' }}>
                    <div style={{ fontFamily: 'Brush Script MT, cursive, Georgia, serif', fontSize: '24px', fontWeight: 'bold', color: '#1e293b', minHeight: '32px' }}>
                      {data.receiver_signature || 'Anurag'}
                    </div>
                    <div className="border-top border-dark pt-1 fw-bold">
                      Receiver's Signature
                    </div>
                  </div>

                  <div className="text-center" style={{ width: '220px' }}>
                    <div className="fw-bold fs-6 mb-1">
                      For RAINDROP
                    </div>
                    <div style={{ minHeight: '26px' }}></div>
                    <div className="border-top border-dark pt-1 fw-bold">
                      Authorised Signatory
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* PURCHASE ORDER (JOB WORK) PRINT FORMAT (Page 11 Slip)                      */
              /* ========================================================================= */
              <div className="border border-dark p-3 mb-3 bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
                {/* Title */}
                <div className="text-center fw-bold fs-5 text-uppercase mb-2 text-dark" style={{ letterSpacing: '1px' }}>
                  PURCHASE ORDER
                </div>

                {/* Slip Header matching Page 11 */}
                <div className="row align-items-start pb-2">
                  <div className="col-7">
                    <div className="text-dark small fw-semibold" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                      <div>GSTIN : 08BZJPD0890G1ZD</div>
                      <div>PAN No. : BZJPD0890G</div>
                    </div>
                    <div className="fw-black text-uppercase mt-1" style={{ fontSize: '20px', letterSpacing: '1px', fontWeight: '900' }}>
                      RAINDROP
                    </div>
                    <div className="small text-muted" style={{ fontSize: '11px', lineHeight: '1.3' }}>
                      H1-40, RIICO Industrial Area, Mansarovar, Jaipur-302020<br />
                      +91 9829059529
                    </div>
                  </div>

                  <div className="col-5">
                    <div className="d-flex align-items-baseline mb-2">
                      <span className="fw-bold me-2" style={{ minWidth: '40px' }}>To,</span>
                      <span className="fw-bold fs-6 text-dark border-bottom border-dark border-dotted flex-grow-1 pb-0.5">
                        {data.vendor_name ? `M/s ${data.vendor_name}` : 'M/s Raju dyeing'}
                      </span>
                    </div>
                    <div className="d-flex align-items-baseline">
                      <span className="fw-bold me-2" style={{ minWidth: '55px' }}>CH.No =</span>
                      <span className="fw-bold font-monospace fs-6 text-danger">
                        {data.challan_number || (Array.isArray(data.linked_challans) && data.linked_challans[0]) || '4903'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Strip: ORDER No. | CODE | DATE */}
                <div className="d-flex align-items-center justify-content-between border border-dark px-3 py-1.5 my-2 fw-bold" style={{ fontSize: '13px', backgroundColor: '#fafbfc' }}>
                  <div>
                    <span className="text-secondary me-2">ORDER No.</span>
                    <span className="font-monospace text-primary fs-6">{data.po_number || data.linked_sales_order_id || '7613'}</span>
                  </div>
                  <div>
                    <span className="text-secondary me-2">CODE :</span>
                    <span className="font-monospace text-dark fs-6">{data.style_code || data.style_name || 'RD-2611'}</span>
                  </div>
                  <div>
                    <span className="text-secondary me-2">DATE :</span>
                    <span className="font-monospace text-dark fs-6">
                      {(() => {
                        const d = data.date || data.issue_date || '2026-08-12';
                        if (d.includes('-')) {
                          const parts = d.split('-');
                          return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
                        }
                        return d;
                      })()}
                    </span>
                  </div>
                </div>

                {/* Table matching Page 11 / Image 3 */}
                <table className="table table-bordered border-dark table-sm mb-0 mt-2" style={{ fontSize: '12px' }}>
                  <thead className="text-center border-dark" style={{ backgroundColor: '#f8fafc' }}>
                    <tr>
                      <th style={{ width: '45px', border: '1px solid #000' }}>S. No.</th>
                      <th style={{ border: '1px solid #000' }}>PARTICULARS</th>
                      <th style={{ width: '65px', border: '1px solid #000' }}>SIZE</th>
                      <th style={{ width: '85px', border: '1px solid #000' }}>QTY.</th>
                      <th style={{ width: '110px', border: '1px solid #000' }}>RATE Rs. P.</th>
                      <th style={{ width: '220px', border: '1px solid #000' }}>REMARKS / SAMPLE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items && data.items.length > 0 ? (
                      data.items.map((item, idx) => (
                        <tr key={idx} style={{ minHeight: '32px' }}>
                          <td className="text-center border-dark font-monospace" style={{ border: '1px solid #000' }}>
                            {idx + 1}
                          </td>
                          <td className="border-dark px-2" style={{ border: '1px solid #000' }}>
                            <div className="fw-bold fs-12 text-dark">
                              {item.fabric_name || '100x100 Voil'} ({item.width || '48'}") gray - Job issue for deying
                            </div>
                            {item.article_name && (
                              <div className="text-secondary small">
                                Article: {item.article_name}
                              </div>
                            )}
                          </td>
                          <td className="text-center border-dark font-monospace fw-semibold" style={{ border: '1px solid #000' }}>
                            {item.width ? `${item.width}"` : '48"'}
                          </td>
                          <td className="text-end border-dark font-monospace fw-bold px-2" style={{ border: '1px solid #000' }}>
                            {Number(item.quantity_meters || item.meters || 0).toFixed(2)}
                          </td>
                          <td className="text-end border-dark font-monospace fw-semibold px-2" style={{ border: '1px solid #000' }}>
                            {Number(item.dyeing_rate || item.fabric_rate || 12).toFixed(2)} /- PER Mtr
                          </td>
                          <td className="border-dark px-2 py-1" style={{ border: '1px solid #000' }}>
                            <div className="d-flex align-items-center justify-content-between gap-1">
                              <div className="d-flex align-items-center gap-1.5">
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: item.color_hex || '#d4b996',
                                    border: '1px solid #666',
                                    borderRadius: '2px'
                                  }}
                                />
                                <span className="fw-semibold text-dark fs-11">
                                  {item.color_name || 'Beige Color'} =&gt; {Number(item.quantity_meters || item.meters || 0).toFixed(2)}
                                </span>
                              </div>
                              {item.sample_photo && (
                                <img
                                  src={item.sample_photo}
                                  alt="Swatch"
                                  style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '3px', border: '1px solid #cbd5e1' }}
                                />
                              )}
                            </div>
                            <div className="small text-muted fst-italic">
                              {item.style_name || data.style_name || 'Graphic Boota'}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr style={{ minHeight: '32px' }}>
                        <td className="text-center border-dark font-monospace" style={{ border: '1px solid #000' }}>1</td>
                        <td className="border-dark px-2" style={{ border: '1px solid #000' }}>
                          <div className="fw-bold fs-12 text-dark">
                            100x100 Voil (48") gray - Job issue for deying
                          </div>
                        </td>
                        <td className="text-center border-dark font-monospace fw-semibold" style={{ border: '1px solid #000' }}>48"</td>
                        <td className="text-end border-dark font-monospace fw-bold px-2" style={{ border: '1px solid #000' }}>525.00</td>
                        <td className="text-end border-dark font-monospace fw-semibold px-2" style={{ border: '1px solid #000' }}>12 /- PER Mtr</td>
                        <td className="border-dark px-2 py-1" style={{ border: '1px solid #000' }}>
                          <div className="d-flex align-items-center gap-1.5">
                            <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#d4b996', border: '1px solid #666', borderRadius: '2px' }} />
                            <span className="fw-semibold text-dark fs-11">Beige Color =&gt; 525.00</span>
                          </div>
                          <div className="small text-muted fst-italic">Graphic Boota</div>
                        </td>
                      </tr>
                    )}

                    {/* Realistic blank receipt rows matching physical slip */}
                    {[...Array(Math.max(1, 5 - (data.items?.length || 1)))].map((_, idx) => (
                      <tr key={`blank-${idx}`} style={{ height: '28px' }}>
                        <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                        <td className="border-dark py-0 px-2" style={{ border: '1px solid #000' }}></td>
                        <td className="border-dark py-0" style={{ border: '1px solid #000' }}></td>
                        <td className="border-dark py-0 px-2" style={{ border: '1px solid #000' }}></td>
                        <td className="border-dark py-0 px-2" style={{ border: '1px solid #000' }}></td>
                        <td className="border-dark py-0 px-2" style={{ border: '1px solid #000' }}></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ backgroundColor: '#fafbfc' }}>
                    <tr className="fw-bold border-top border-dark" style={{ borderTop: '2px solid #000' }}>
                      <td colSpan={3} className="text-end border-dark py-1 px-2" style={{ border: '1px solid #000' }}>
                        Total
                      </td>
                      <td className="text-end border-dark font-monospace fs-13 py-1 px-2 text-dark" style={{ border: '1px solid #000' }}>
                        {Number(data.total_meters || (data.items || []).reduce((acc, it) => acc + (parseFloat(it.quantity_meters || it.meters) || 0), 0) || 525).toFixed(2)}
                      </td>
                      <td colSpan={2} className="text-end border-dark font-monospace fs-13 py-1 px-2 text-primary" style={{ border: '1px solid #000' }}>
                        ₹{Number(data.total_estimated_cost || (data.items || []).reduce((acc, it) => acc + (parseFloat(it.total_amount) || 0), 0) || 6300).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signatures & Footer matching Page 11 Slip */}
                <div className="d-flex justify-content-between align-items-end mt-4 pt-2" style={{ fontSize: '13px' }}>
                  <div className="text-center" style={{ width: '220px' }}>
                    <div style={{ fontFamily: 'Brush Script MT, cursive, Georgia, serif', fontSize: '26px', fontWeight: 'bold', color: '#1e293b', minHeight: '34px' }}>
                      {data.receiver_signature || 'Anurag'}
                    </div>
                    <div className="border-top border-dark pt-1 fw-bold">
                      Receiver's Signature
                    </div>
                  </div>

                  <div className="text-start" style={{ maxWidth: '420px', fontSize: '11px', lineHeight: '1.4' }}>
                    <div className="fw-bold mb-1">
                      DELIVERY DATE : <span className="font-monospace text-dark fs-12 ms-1">
                        {(() => {
                          const d = data.delivery_date || '2026-08-20';
                          if (d.includes('-')) {
                            const parts = d.split('-');
                            return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
                          }
                          return d;
                        })()}
                      </span>
                    </div>
                    <div className="text-secondary">
                      <strong>TERMS :</strong> 1 Goods delivered must be strictly as per sample and specification (within stipulated date)
                    </div>
                  </div>

                  <div className="text-center" style={{ width: '220px' }}>
                    <div className="fw-bold fs-6 mb-1">
                      For RAINDROP
                    </div>
                    <div style={{ minHeight: '34px' }}></div>
                    <div className="border-top border-dark pt-1 fw-bold">
                      Authorised Signatory
                    </div>
                  </div>
                </div>
              </div>
            )}
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
