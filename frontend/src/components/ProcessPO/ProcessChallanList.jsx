import React, { useState } from 'react';

export default function ProcessChallanList({ challans = [], onNewChallan, onPrintChallan, onRecordReturnFromChallan }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = challans.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      (c.challan_number && c.challan_number.toLowerCase().includes(term)) ||
      (c.vendor_name && c.vendor_name.toLowerCase().includes(term)) ||
      (c.company_representative && c.company_representative.toLowerCase().includes(term))
    );
  });

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2" style={{ maxWidth: '400px' }}>
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-light border-end-0">
              <i className="ti ti-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search Challan #, vendor, representative..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <button className="btn btn-danger btn-sm px-3 shadow-sm" onClick={onNewChallan}>
          <i className="ti ti-truck-delivery me-1"></i> + New Job Challan (Dispatch)
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
          <thead className="table-light">
            <tr>
              <th>Challan No</th>
              <th>Dispatch Date</th>
              <th>Job Work Vendor</th>
              <th>Linked POs</th>
              <th>Stock Rolls/Bales</th>
              <th>Folding</th>
              <th className="text-end">Dispatched Mtrs</th>
              <th className="text-center">PO Link Status</th>
              <th>Authorised By</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-4 text-muted">
                  No Job Challans found.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const isEmergency = c.po_link_status === 'Pending PO Link';

                return (
                  <tr key={c.id}>
                    <td className="fw-bold text-danger">
                      <span className="badge bg-light text-danger border me-1">#{c.challan_number || c.id}</span>
                    </td>
                    <td>{c.date}</td>
                    <td>
                      <div className="fw-semibold text-dark">{c.vendor_name}</div>
                      <small className="text-muted">{c.remarks || 'Job Issue for Dyeing'}</small>
                    </td>
                    <td>
                      {Array.isArray(c.linked_pos) && c.linked_pos.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                          {c.linked_pos.map((p, i) => (
                            <span key={i} className="badge bg-primary-subtle text-primary border" style={{ fontSize: '10px' }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="badge bg-danger text-white">None (Emergency)</span>
                      )}
                    </td>
                    <td>
                      <div><strong>{c.total_bales || 1} Bale</strong> ({c.total_pieces || c.items?.length || 7} Pcs)</div>
                      <small className="text-muted">{c.items?.[0]?.bale_roll_no || 'Roll 12304'}</small>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{c.folding_notation || 'L100'}</span>
                    </td>
                    <td className="text-end fw-bold text-danger fs-6">
                      {Number(c.grand_total_meters || 0).toFixed(2)} m
                    </td>
                    <td className="text-center">
                      {isEmergency ? (
                        <span className="badge bg-danger text-white border border-danger">
                          <i className="ti ti-alert-triangle me-1"></i> Pending PO Link
                        </span>
                      ) : (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          <i className="ti ti-check me-1"></i> Linked
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="fw-medium text-dark">{c.company_representative || 'Anurag'}</div>
                      <small className="text-muted">Signatory</small>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          title="Print Physical Challan Paper Slip"
                          onClick={() => onPrintChallan(c)}
                        >
                          <i className="ti ti-printer"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-success"
                          title="Record Vendor Inbound Return against this Challan"
                          onClick={() => onRecordReturnFromChallan(c)}
                        >
                          <i className="ti ti-receipt-refund"></i> Inward Return
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
