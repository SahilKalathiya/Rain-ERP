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

  // Modal form states
  const [rtvFormData, setRtvFormData] = useState({
    challanNo: `RTV-CH-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    transporter: 'Keshav Freight Carriers',
    remarks: 'Defective fabric returned due to selvedge cut and oil stains.'
  });

  const [scrapFormData, setScrapFormData] = useState({
    saleId: `SCRAP-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'To Be Sold', // 'To Be Sold' (save-in-progress) or 'Sold'
    buyerDetails: 'Local Textile Recycler (Jaipur)',
    settlementAmount: '',
    saleDate: new Date().toISOString().split('T')[0]
  });

  const [transferFormData, setTransferFormData] = useState({
    targetGrade: 'B-Grade / Seconds Stock Pool',
    remarks: 'Approved by Production Head for inner pocketing and lining usage.'
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
    alert(`Return Delivery Challan ${challan.challanNo} generated for ${totalSelectedQty} Mtrs!`);
  };

  // 2. Process Scrap Sale
  const handleProcessScrap = () => {
    if (scrapFormData.status === 'Sold' && (!scrapFormData.settlementAmount || Number(scrapFormData.settlementAmount) <= 0)) {
      alert('Settlement Amount is mandatory when status is Sold.');
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
    alert(
      scrapFormData.status === 'Sold'
        ? `Scrap Sale closed with settlement of ₹${scrapFormData.settlementAmount}!`
        : 'Stock marked as "To Be Sold" (liquidation in progress).'
    );
  };

  // 3. Process Transfer to Stock Pool
  const handleProcessTransfer = () => {
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
    alert(`${totalSelectedQty} Mtrs successfully transferred into ${transferFormData.targetGrade}!`);
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
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-danger rounded-pill px-2 py-1 fs-11">Pool Active</span>
            <h5 className="fw-bold text-dark mb-0 fs-16">Defective Inward Pieces</h5>
          </div>

          <div className="text-muted fs-13">
            Selected: <strong className="text-primary">{selectedIds.length} Pieces</strong> (
            <strong>{totalSelectedQty.toFixed(2)} Mtrs</strong>)
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-secondary">
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Rejected ID</th>
                <th>Source QC</th>
                <th>PO / Vendor</th>
                <th>Container</th>
                <th>Fabric Quality</th>
                <th className="text-end">Defective Qty</th>
                <th>Defect Reason</th>
                <th>Current Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const isSelected = selectedIds.includes(it.id);
                // 8.5 Rule: If action already initiated, cannot be simultaneously selected for another action
                const isLocked = it.status !== 'In Pool' && it.status !== 'To Be Sold';

                return (
                  <tr key={it.id} className={isSelected ? 'table-danger' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        disabled={isLocked}
                        checked={isSelected}
                        onChange={() => handleToggleSelect(it.id)}
                      />
                    </td>
                    <td className="fw-bold text-danger font-monospace">{it.id}</td>
                    <td className="font-monospace fw-semibold">{it.sourceQcRef}</td>
                    <td>
                      <div className="fw-semibold text-dark">{it.vendorName}</div>
                      <div className="text-muted fs-11">{it.poRef}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {it.baleRef} → {it.pieceRef}
                      </span>
                    </td>
                    <td>{it.fabricName}</td>
                    <td className="text-end fw-bold text-danger fs-14">
                      {Number(it.quantity).toFixed(2)} Mtrs
                    </td>
                    <td>
                      <span className="text-muted fs-12">{it.reason}</span>
                    </td>
                    <td>
                      <span
                        className={`badge px-2 py-1 ${
                          it.status === 'In Pool'
                            ? 'bg-danger-subtle text-danger'
                            : it.status === 'RTV Initiated'
                            ? 'bg-primary-subtle text-primary'
                            : it.status === 'To Be Sold'
                            ? 'bg-warning-subtle text-warning'
                            : it.status === 'Sold'
                            ? 'bg-secondary-subtle text-secondary'
                            : 'bg-success-subtle text-success'
                        }`}
                      >
                        {it.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
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
    </div>
  );
}
