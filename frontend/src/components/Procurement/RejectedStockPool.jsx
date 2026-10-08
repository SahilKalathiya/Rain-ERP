import React, { useState } from 'react';

/**
 * RejectedStockPool - 7.0 Rejected Stock Pool & Three Closing Actions
 * Actions:
 *   1. Return to Vendor (RTV) - Generates Return Delivery Challan
 *   2. Sell / Scrap Liquidation - "To Be Sold" save-in-progress & settlement
 *   3. Transfer to Main Stock Pool - Downgrades/approves stock into main ledger
 */
export default function RejectedStockPool({
  rejectedItems = [],
  onUpdateItemStatus,
  onRTVChallanGenerated,
  onScrapSaleCompleted,
  onTransferToStock
}) {
  const [items, setItems] = useState(rejectedItems);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeActionModal, setActiveActionModal] = useState(null); // 'rtv', 'scrap', 'transfer'
  const [toastNotification, setToastNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 3200);
  };

  // Modal form states
  const [rtvFormData, setRtvFormData] = useState({
    challanNo: `RTV-CH-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    transporter: '',
    remarks: ''
  });

  const [scrapFormData, setScrapFormData] = useState({
    saleId: `SCRAP-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'To Be Sold', // 'To Be Sold' (save-in-progress) or 'Sold'
    buyerDetails: '',
    settlementAmount: '',
    saleDate: new Date().toISOString().split('T')[0]
  });

  const [transferFormData, setTransferFormData] = useState({
    targetGrade: '',
    remarks: ''
  });

  // Toggle selection
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Sync items when parent updates
  React.useEffect(() => {
    setItems(rejectedItems);
  }, [rejectedItems]);

  const selectedItemsData = items.filter((it) => selectedIds.includes(it.id));
  const totalSelectedQty = selectedItemsData.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  // 1. Process RTV
  const handleProcessRTV = () => {
    const challan = {
      challanNo: rtvFormData.challanNo,
      date: rtvFormData.date,
      transporter: rtvFormData.transporter,
      itemsIncluded: selectedItemsData,
      totalQuantity: totalSelectedQty,
      status: 'Dispatched'
    };

    const updated = items.map((it) =>
      selectedIds.includes(it.id) ? { ...it, status: 'RTV Initiated', actionDetails: challan } : it
    );

    setItems(updated);
    setSelectedIds([]);
    setActiveActionModal(null);

    if (onUpdateItemStatus) onUpdateItemStatus(updated);
    if (onRTVChallanGenerated) onRTVChallanGenerated(challan);
    showToast(`Return Delivery Challan ${challan.challanNo} generated for ${totalSelectedQty} Mtrs!`, 'success');
  };

  // 2. Process Scrap Sale
  const handleProcessScrap = () => {
    if (scrapFormData.status === 'Sold' && (!scrapFormData.settlementAmount || Number(scrapFormData.settlementAmount) <= 0)) {
      showToast('Settlement Amount is mandatory when status is Sold.', 'warning');
      return;
    }

    const saleRecord = {
      ...scrapFormData,
      itemsIncluded: selectedItemsData,
      totalQuantity: totalSelectedQty
    };

    const updated = items.map((it) =>
      selectedIds.includes(it.id)
        ? {
            ...it,
            status: scrapFormData.status === 'Sold' ? 'Sold' : 'To Be Sold',
            actionDetails: saleRecord
          }
        : it
    );

    setItems(updated);
    setSelectedIds([]);
    setActiveActionModal(null);

    if (onUpdateItemStatus) onUpdateItemStatus(updated);
    if (onScrapSaleCompleted) onScrapSaleCompleted(saleRecord);
    showToast(
      scrapFormData.status === 'Sold'
        ? `Scrap Sale closed with settlement of ₹${scrapFormData.settlementAmount}!`
        : 'Stock marked as "To Be Sold" (liquidation in progress).',
      'success'
    );
  };

  // 3. Process Transfer to Stock Pool
  const handleProcessTransfer = () => {
    if (!transferFormData.targetGrade) {
      showToast('Please select a Target Inventory Grade.', 'warning');
      return;
    }

    const transferRecord = {
      targetGrade: transferFormData.targetGrade,
      remarks: transferFormData.remarks,
      itemsIncluded: selectedItemsData,
      totalQuantity: totalSelectedQty,
      transferDate: new Date().toLocaleDateString('en-GB')
    };

    const updated = items.map((it) =>
      selectedIds.includes(it.id)
        ? { ...it, status: 'Transferred to Stock', actionDetails: transferRecord }
        : it
    );

    setItems(updated);
    setSelectedIds([]);
    setActiveActionModal(null);

    if (onUpdateItemStatus) onUpdateItemStatus(updated);
    if (onTransferToStock) onTransferToStock(transferRecord);
    showToast(`${totalSelectedQty} Mtrs successfully transferred into ${transferFormData.targetGrade}!`, 'success');
  };

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-muted fs-12">
              <li className="breadcrumb-item">Quality &amp; Stock</li>
              <li className="breadcrumb-item active text-danger fw-medium">Rejected Stock Pool</li>
            </ol>
          </nav>
          <h2 className="fw-bold text-dark mb-1 fs-24">Rejected Stock Pool</h2>
          <p className="text-secondary mb-0 fs-13">
            Defective Fabric Disposition: Return to Vendor (RTV), Local Scrap Sale, or Stock Transfer
          </p>
        </div>

        {/* 3 Closing Actions Bar */}
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-danger d-flex align-items-center gap-2 px-3 py-2 fw-medium fs-13 rounded-3 shadow-sm"
            disabled={selectedIds.length === 0}
            onClick={() => setActiveActionModal('rtv')}
          >
            <i className="ti ti-truck-return fs-16"></i>
            <span>Return to Vendor (RTV)</span>
          </button>

          <button
            type="button"
            className="btn btn-outline-warning text-dark d-flex align-items-center gap-2 px-3 py-2 fw-medium fs-13 rounded-3 shadow-sm"
            disabled={selectedIds.length === 0}
            onClick={() => setActiveActionModal('scrap')}
          >
            <i className="ti ti-cash fs-16"></i>
            <span>Sell / Scrap Liquidation</span>
          </button>

          <button
            type="button"
            className="btn btn-outline-success d-flex align-items-center gap-2 px-3 py-2 fw-medium fs-13 rounded-3 shadow-sm"
            disabled={selectedIds.length === 0}
            onClick={() => setActiveActionModal('transfer')}
          >
            <i className="ti ti-replace fs-16"></i>
            <span>Transfer to Stock</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-danger rounded-pill px-2.5 py-1.5 fs-11">Pool Active</span>
            <h5 className="fw-bold text-dark mb-0 fs-16">Defective Inward Pieces</h5>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-muted fs-13">
              Selected: <strong className="text-primary">{selectedIds.length} Pieces</strong> (
              <strong>{totalSelectedQty.toFixed(2)} Mtrs</strong>)
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead
              className="text-secondary"
              style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
            >
              <tr>
                <th style={{ width: '52px', padding: '12px 14px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: '#5b47fb',
                      borderRadius: '4px',
                      verticalAlign: 'middle'
                    }}
                    checked={items.length > 0 && items.every((it) => selectedIds.includes(it.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(items.map((it) => it.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    title="Select / Deselect All Available"
                  />
                </th>
                <th style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', minWidth: '120px' }}>
                  REJECTED ID
                </th>
                <th style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', minWidth: '110px' }}>
                  SOURCE QC
                </th>
                <th style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', minWidth: '170px' }}>
                  PO / VENDOR
                </th>
                <th style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', minWidth: '240px' }}>
                  CONTAINER
                </th>
                <th style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', minWidth: '160px' }}>
                  FABRIC QUALITY
                </th>
                <th style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', minWidth: '130px', textAlign: 'right' }}>
                  DEFECTIVE QTY
                </th>
                <th style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', minWidth: '240px' }}>
                  DEFECT REASON
                </th>
                <th style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', minWidth: '160px' }}>
                  CURRENT STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <i className="ti ti-check-circle fs-32 d-block mb-2 text-success opacity-50"></i>
                    No defective inward pieces in pool.
                  </td>
                </tr>
              ) : (
                items.map((it) => {
                  const isSelected = selectedIds.includes(it.id);

                  return (
                    <tr
                      key={it.id}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(91, 71, 251, 0.08)' : undefined,
                        transition: 'background-color 0.15s ease'
                      }}
                      className={isSelected ? 'table-active' : ''}
                      onClick={() => handleToggleSelect(it.id)}
                    >
                      <td style={{ textAlign: 'center', width: '52px' }}>
                        <input
                          type="checkbox"
                          style={{
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            accentColor: '#5b47fb',
                            borderRadius: '4px',
                            verticalAlign: 'middle'
                          }}
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(it.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        />
                      </td>
                      <td className="fw-bold font-monospace fs-13" style={{ color: '#5b47fb' }}>
                        {it.id}
                      </td>
                      <td className="font-monospace fw-semibold text-secondary fs-13">
                        {it.sourceQcRef || 'QC-9056'}
                      </td>
                      <td>
                        <div className="fw-semibold text-dark fs-13">{it.vendorName || 'Surat Rayon & Silk Mills'}</div>
                        <div className="text-muted fs-11 font-monospace">{it.poRef || 'PO-1001'}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border px-2.5 py-1.5 fs-12 fw-normal d-inline-flex align-items-center gap-1">
                          <i className="ti ti-box text-secondary fs-12"></i>
                          <span>{it.baleRef || 'Bale 01'} &rarr; {it.pieceRef || 'Piece 1'}</span>
                        </span>
                      </td>
                      <td>
                        <span className="fw-medium text-dark fs-13">{it.fabricName || 'Modal Satin Premium'}</span>
                      </td>
                      <td className="text-end fw-bold fs-14 text-dark">
                        {Number(it.quantity).toFixed(2)} <span className="fs-12 fw-medium text-secondary">Mtrs</span>
                      </td>
                      <td>
                        <div
                          className="text-secondary fs-12"
                          style={{ maxWidth: '300px', lineHeight: '1.4' }}
                          title={it.reason}
                        >
                          {it.reason || 'Quality inspection generated for inward shipment.'}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge px-2.5 py-1 fs-11 rounded-pill ${
                            it.status === 'In Pool'
                              ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                              : it.status === 'RTV Initiated'
                              ? 'bg-primary-subtle text-primary border border-primary border-opacity-25'
                              : it.status === 'To Be Sold'
                              ? 'bg-warning-subtle text-warning border border-warning border-opacity-25'
                              : it.status === 'Sold'
                              ? 'bg-secondary-subtle text-secondary border border-secondary border-opacity-25'
                              : it.status === 'Transferred to Stock'
                              ? 'bg-info-subtle text-info border border-info border-opacity-25'
                              : it.status === 'Pending Admin Review'
                              ? 'bg-success-subtle text-success border border-success border-opacity-25'
                              : it.status === 'Reversed (treated as good)'
                              ? 'bg-success-subtle text-success border border-success border-opacity-25'
                              : 'bg-light text-secondary border'
                          }`}
                        >
                          {it.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Return to Vendor (RTV Challan) */}
      {activeActionModal === 'rtv' && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 p-4">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                <h5 className="fw-bold text-danger mb-0 fs-18">
                  <i className="ti ti-truck-return me-1"></i>
                  Generate Return to Vendor Delivery Challan
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActiveActionModal(null)}
                ></button>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label fs-12 fw-semibold">RTV Challan No.</label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-light font-monospace"
                    value={rtvFormData.challanNo}
                    onChange={(e) =>
                      setRtvFormData({ ...rtvFormData, challanNo: e.target.value })
                    }
                  />
                </div>

                <div className="col-6">
                  <label className="form-label fs-12 fw-semibold">Challan Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm bg-light"
                    value={rtvFormData.date}
                    onChange={(e) => setRtvFormData({ ...rtvFormData, date: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fs-12 fw-semibold">Logistics / Transporter</label>
                  <input
                    type="text"
                    placeholder="e.g. Keshav Freight Carriers"
                    className="form-control form-control-sm bg-light"
                    value={rtvFormData.transporter}
                    onChange={(e) =>
                      setRtvFormData({ ...rtvFormData, transporter: e.target.value })
                    }
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fs-12 fw-semibold">Return Remarks / Note</label>
                  <textarea
                    rows="2"
                    placeholder="Enter return remarks or reason..."
                    className="form-control form-control-sm bg-light fs-12"
                    value={rtvFormData.remarks}
                    onChange={(e) =>
                      setRtvFormData({ ...rtvFormData, remarks: e.target.value })
                    }
                  ></textarea>
                </div>
              </div>

              <div className="p-3 bg-light rounded-3 mb-3">
                <div className="d-flex align-items-center justify-content-between fs-13">
                  <span>Bundled Pieces Included:</span>
                  <strong>{selectedIds.length} Pieces</strong>
                </div>
                <div className="d-flex align-items-center justify-content-between fs-14 fw-bold text-danger mt-1">
                  <span>Total Quantity Returning:</span>
                  <span>{totalSelectedQty.toFixed(2)} Mtrs</span>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light btn-sm px-3"
                  onClick={() => setActiveActionModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm px-4 fw-medium shadow-sm"
                  onClick={handleProcessRTV}
                >
                  Confirm &amp; Generate RTV Challan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Scrap Sale */}
      {activeActionModal === 'scrap' && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 p-4">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                <h5 className="fw-bold text-warning text-dark mb-0 fs-18">
                  <i className="ti ti-cash me-1 text-warning"></i>
                  Local Scrap Liquidation / Sale
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActiveActionModal(null)}
                ></button>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label fs-12 fw-semibold">Sale Status *</label>
                  <select
                    className="form-select form-select-sm bg-light fs-13"
                    value={scrapFormData.status}
                    onChange={(e) =>
                      setScrapFormData({ ...scrapFormData, status: e.target.value })
                    }
                  >
                    <option value="To Be Sold">To Be Sold (Liquidation in Progress)</option>
                    <option value="Sold">Sold (Final Settlement Recorded)</option>
                  </select>
                  <div className="form-text fs-10 text-muted">
                    "To Be Sold" holds stock in pending liquidation state.
                  </div>
                </div>

                <div className="col-6">
                  <label className="form-label fs-12 fw-semibold">Sale Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm bg-light"
                    value={scrapFormData.saleDate}
                    onChange={(e) =>
                      setScrapFormData({ ...scrapFormData, saleDate: e.target.value })
                    }
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fs-12 fw-semibold">Buyer Details</label>
                  <input
                    type="text"
                    placeholder="Buyer / Recycler name and contact"
                    className="form-control form-control-sm bg-light fs-13"
                    value={scrapFormData.buyerDetails}
                    onChange={(e) =>
                      setScrapFormData({ ...scrapFormData, buyerDetails: e.target.value })
                    }
                  />
                </div>

                {scrapFormData.status === 'Sold' && (
                  <div className="col-12">
                    <label className="form-label fs-12 fw-semibold text-danger">
                      Settlement Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      required
                      placeholder="e.g. 4500"
                      className="form-control form-control-sm bg-light fs-14 fw-bold"
                      value={scrapFormData.settlementAmount}
                      onChange={(e) =>
                        setScrapFormData({ ...scrapFormData, settlementAmount: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="d-flex align-items-center justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light btn-sm px-3"
                  onClick={() => setActiveActionModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-warning text-dark btn-sm px-4 fw-medium shadow-sm"
                  onClick={handleProcessScrap}
                >
                  Save Scrap Liquidation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Transfer to Stock Pool */}
      {activeActionModal === 'transfer' && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 p-4">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                <h5 className="fw-bold text-success mb-0 fs-18">
                  <i className="ti ti-replace me-1"></i>
                  Transfer to Main Stock Pool
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActiveActionModal(null)}
                ></button>
              </div>

              <div className="mb-3">
                <label className="form-label fs-12 fw-semibold">Target Inventory Grade *</label>
                <select
                  className="form-select form-select-sm bg-light fs-13"
                  value={transferFormData.targetGrade}
                  onChange={(e) =>
                    setTransferFormData({ ...transferFormData, targetGrade: e.target.value })
                  }
                >
                  <option value="">Select target inventory grade...</option>
                  <option value="B-Grade / Seconds Stock Pool">B-Grade / Seconds Stock Pool</option>
                  <option value="Main Raw Material Stock Pool (Concession)">
                    Main Raw Material Stock Pool (Concession)
                  </option>
                  <option value="Sampling & R&D Store">Sampling &amp; R&amp;D Store</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label fs-12 fw-semibold">Approval Remarks</label>
                <textarea
                  rows="2"
                  placeholder="Enter approval remarks or note for stock transfer..."
                  className="form-control form-control-sm bg-light fs-12"
                  value={transferFormData.remarks}
                  onChange={(e) =>
                    setTransferFormData({ ...transferFormData, remarks: e.target.value })
                  }
                ></textarea>
              </div>

              <div className="d-flex align-items-center justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light btn-sm px-3"
                  onClick={() => setActiveActionModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm px-4 fw-medium shadow-sm"
                  onClick={handleProcessTransfer}
                >
                  Approve &amp; Move into Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INLINE TOAST NOTIFICATION */}
      {toastNotification && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 9999 }}
        >
          <div
            className={`toast show border-0 rounded-3 shadow-lg px-3 py-2.5 d-flex align-items-center gap-2.5 text-white ${
              toastNotification.type === 'danger'
                ? 'bg-danger'
                : toastNotification.type === 'warning'
                ? 'bg-warning text-dark'
                : 'bg-dark'
            }`}
            style={{ minWidth: '280px', animation: 'fadeIn 0.2s ease-in-out' }}
          >
            <i
              className={`fs-16 ${
                toastNotification.type === 'danger'
                  ? 'ti ti-alert-circle text-white'
                  : toastNotification.type === 'warning'
                  ? 'ti ti-alert-triangle text-dark'
                  : 'ti ti-circle-check text-success'
              }`}
            ></i>
            <span className="fs-13 fw-medium flex-grow-1">{toastNotification.message}</span>
            <button
              type="button"
              className="btn-close btn-close-white ms-auto"
              style={{ fontSize: '10px' }}
              onClick={() => setToastNotification(null)}
            ></button>
          </div>
        </div>
      )}
    </div>
  );
}
