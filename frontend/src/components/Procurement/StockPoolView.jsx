import React, { useState } from 'react';

/**
 * StockPoolView - Step 5: Stock Pool
 * Fabric that has passed quality check (directly, or via admin approval),
 * or returned from processing/dyeing, and is now available for use.
 * Tracked separately by fabric, width and colour so nothing gets lumped together.
 * 
 * Supports:
 * - Main Table View: List of grouped fabric balances (Screenshot 2)
 * - Separate Detail View: Lot drilldown when row is clicked (Screenshot 3)
 */
export default function StockPoolView({
  stockPool = [],
  onNavigateToGRN,
  onNavigateToPO
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupKey, setSelectedGroupKey] = useState(null);

  // Group identical fabric + width + colour together
  const groups = {};
  stockPool.forEach((item) => {
    const fabricName = item.fabricName || 'Unknown Fabric';
    const width = item.width ? String(item.width).replace(/[^\d.]/g, '') + '"' : '44"';
    const color = item.colorName || 'Greige (undyed)';
    const key = `${fabricName}_${width}_${color}`;

    if (!groups[key]) {
      groups[key] = {
        key,
        fabricName,
        fabricId: item.fabricId,
        width,
        colorName: color,
        colorHex: item.colorHex || (item.colorName === 'Ivory' ? '#FFFFF0' : '#cccccc'),
        isGreige: !item.colorName || item.colorName.toLowerCase().includes('greige'),
        totalQty: 0,
        lots: []
      };
    }
    groups[key].totalQty += Number(item.qty) || 0;
    groups[key].lots.push(item);
  });

  const groupList = Object.values(groups).filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.fabricName.toLowerCase().includes(q) ||
      g.width.toLowerCase().includes(q) ||
      g.colorName.toLowerCase().includes(q)
    );
  });

  // Calculate high level summaries
  const totalAvailableMeters = Object.values(groups).reduce((sum, g) => sum + g.totalQty, 0);
  const totalLotsCount = stockPool.length;

  const selectedGroup = selectedGroupKey ? groups[selectedGroupKey] : null;

  // =========================================================================
  // VIEW 2: DEDICATED LOT DETAIL VIEW (Matches User Screenshot 3 & Demo)
  // When a row in the table is clicked, it opens this view separately.
  // =========================================================================
  if (selectedGroup) {
    return (
      <div className="container-fluid p-0">
        {/* Detail View Header */}
        <div className="mb-4">
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold d-inline-flex align-items-center gap-1.5 mb-2 fs-13"
            style={{ color: '#5b47fb' }}
            onClick={() => setSelectedGroupKey(null)}
          >
            <i className="ti ti-arrow-left"></i>
            <span>Back to Stock Pool</span>
          </button>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h3 className="fw-bold text-dark mb-1 fs-22 d-flex align-items-center gap-2">
                <span>{selectedGroup.fabricName}</span>
                <span className="text-muted">·</span>
                <span>{selectedGroup.width}</span>
                <span className="text-muted">·</span>
                <span className="d-inline-flex align-items-center gap-1.5">
                  <span
                    className="rounded-circle border shadow-2xs"
                    style={{
                      width: '13px',
                      height: '13px',
                      backgroundColor: selectedGroup.colorHex,
                      display: 'inline-block'
                    }}
                  />
                  <span>{selectedGroup.colorName}</span>
                </span>
              </h3>
              <p className="text-secondary fs-13 mb-0">
                <strong>{selectedGroup.totalQty.toFixed(1)}m</strong> currently available across {selectedGroup.lots.length} lot(s).
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-3 py-1.5 rounded-3 fs-13 fw-medium"
              onClick={() => setSelectedGroupKey(null)}
            >
              Close Details
            </button>
          </div>
        </div>

        {/* Lots making up this balance Card */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
          <div className="card-header bg-light border-bottom p-3.5">
            <h6 className="fw-bold text-dark mb-0 fs-14">Lots making up this balance</h6>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 fs-13">
              <thead className="table-light text-secondary fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.3px' }}>
                <tr>
                  <th className="ps-4 py-3" style={{ minWidth: '140px' }}>QUANTITY</th>
                  <th className="py-3" style={{ minWidth: '140px' }}>SOURCE</th>
                  <th className="py-3" style={{ minWidth: '200px' }}>DOCUMENT</th>
                  <th className="py-3" style={{ minWidth: '130px' }}>DATE</th>
                  <th className="pe-4 py-3 text-end" style={{ minWidth: '120px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {selectedGroup.lots.map((lot, idx) => {
                  const docLabel = lot.grnId
                    ? `${lot.grnId} / ${lot.poId || 'PO-1001'}`
                    : (lot.sourceType === 'challan' ? `Challan-${lot.poId}` : `Manual Entry`);

                  return (
                    <tr key={lot.id || idx}>
                      <td className="ps-4 py-3 fw-bold text-dark fs-14">
                        {Number(lot.qty).toFixed(1)}m
                      </td>
                      <td className="py-3">
                        <span className="badge bg-success-subtle text-success border border-success border-opacity-25 px-2.5 py-1 fs-11 rounded-pill fw-semibold">
                          {lot.source || 'QC approved'}
                        </span>
                      </td>
                      <td className="py-3 fw-semibold text-secondary">
                        {docLabel}
                      </td>
                      <td className="py-3 text-muted">
                        {lot.decidedAt || lot.date || new Date().toLocaleDateString('en-GB')}
                      </td>
                      <td className="pe-4 py-3 text-end">
                        {lot.grnId && onNavigateToGRN ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-decoration-none fw-semibold p-0 text-primary d-inline-flex align-items-center gap-1"
                            style={{ color: '#5b47fb' }}
                            onClick={() => onNavigateToGRN(lot.grnId)}
                          >
                            <span>View GRN</span>
                            <i className="ti ti-arrow-right fs-12"></i>
                          </button>
                        ) : (
                          <span className="text-muted fs-12">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: MAIN STOCK POOL TABLE VIEW (Matches User Screenshot 2)
  // =========================================================================
  return (
    <div className="container-fluid p-0">
      {/* Top Breadcrumb & Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span
            className="badge px-2.5 py-1 fs-11 fw-bold text-uppercase rounded-pill"
            style={{ backgroundColor: '#e0e7ff', color: '#4338ca', letterSpacing: '0.5px' }}
          >
            STEP 5
          </span>
          <span className="text-muted fs-12 fw-medium">Inventory &amp; Allocation</span>
        </div>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h3 className="fw-bold text-dark mb-1 fs-22">Stock Pool</h3>
            <p className="text-secondary fs-13 mb-0" style={{ maxWidth: '850px' }}>
              Fabric that has passed quality check (directly, or via admin approval), or returned from processing/dyeing, and is now available for use — tracked separately by fabric, width <strong>and colour</strong>, so nothing gets lumped together.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="d-flex align-items-center gap-2">
            <div className="px-3 py-2 bg-white rounded-3 border shadow-sm text-end">
              <span className="d-block fs-11 text-muted fw-medium">Available Fabric</span>
              <span className="fs-16 fw-bold text-success">
                {totalAvailableMeters.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}m
              </span>
            </div>
            <div className="px-3 py-2 bg-white rounded-3 border shadow-sm text-end">
              <span className="d-block fs-11 text-muted fw-medium">Active Lots</span>
              <span className="fs-16 fw-bold text-primary" style={{ color: '#5b47fb' }}>
                {totalLotsCount} lot(s)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stock Pool Table Card (Screenshot 2) */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        {/* Table Search & Toolbar */}
        <div className="card-header bg-white border-bottom p-3.5 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '420px' }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="ti ti-search fs-14"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 fs-13"
                placeholder="Search fabric name, width, or colour..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-light border border-start-0 text-muted"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="ti ti-x fs-12"></i>
                </button>
              )}
            </div>
          </div>

          <div className="text-muted fs-12">
            Showing <strong>{groupList.length}</strong> fabric group(s)
          </div>
        </div>

        {/* Table matching Screenshot 2: FABRIC | WIDTH | COLOUR | AVAILABLE QUANTITY | LOTS */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-secondary fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.3px' }}>
              <tr>
                <th className="ps-4 py-3" style={{ minWidth: '180px' }}>FABRIC</th>
                <th className="py-3" style={{ minWidth: '100px' }}>WIDTH</th>
                <th className="py-3" style={{ minWidth: '140px' }}>COLOUR</th>
                <th className="py-3 text-end" style={{ minWidth: '160px' }}>AVAILABLE QUANTITY</th>
                <th className="py-3 text-center" style={{ minWidth: '110px' }}>LOTS</th>
                <th className="pe-4 py-3 text-end" style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {groupList.length > 0 ? (
                groupList.map((g) => (
                  <tr
                    key={g.key}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedGroupKey(g.key)}
                  >
                    {/* Fabric Quality */}
                    <td className="ps-4 py-3">
                      <div className="fw-bold text-dark fs-14">{g.fabricName}</div>
                      {g.fabricId && (
                        <div className="text-muted fs-11">{g.fabricId}</div>
                      )}
                    </td>

                    {/* Width */}
                    <td className="py-3 text-secondary fw-semibold">
                      {g.width}
                    </td>

                    {/* Colour */}
                    <td className="py-3">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="rounded-circle border shadow-2xs"
                          style={{
                            width: '14px',
                            height: '14px',
                            backgroundColor: g.colorHex,
                            display: 'inline-block',
                            flexShrink: 0
                          }}
                        />
                        <span className="fw-medium text-dark">{g.colorName}</span>
                      </div>
                    </td>

                    {/* Available Quantity */}
                    <td className="py-3 text-end">
                      <span className="fw-bold text-dark fs-14">
                        {g.totalQty.toFixed(1)}m
                      </span>
                    </td>

                    {/* Lots */}
                    <td className="py-3 text-center">
                      <span className="badge bg-light text-secondary border px-2.5 py-1 fs-11 rounded-pill fw-semibold">
                        {g.lots.length} lot(s)
                      </span>
                    </td>

                    {/* Chevron */}
                    <td className="pe-4 py-3 text-end text-muted">
                      <i className="ti ti-chevron-right fs-16 text-secondary"></i>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <div className="d-flex flex-column align-items-center justify-content-center">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                        style={{ width: '56px', height: '56px', backgroundColor: '#f1f5f9' }}
                      >
                        <i className="ti ti-archive fs-24 text-secondary"></i>
                      </div>
                      <h6 className="fw-bold text-dark mb-1">Nothing in stock yet</h6>
                      <p className="fs-12 text-secondary mb-0" style={{ maxWidth: '340px' }}>
                        Complete a Quality Check (QC) with approved status to see fabric land here automatically.
                      </p>
                    </div>
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
