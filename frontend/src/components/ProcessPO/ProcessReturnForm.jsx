import React, { useState } from 'react';
import { initialVendors } from '../../data/procurementData';

/**
 * ProcessReturnForm - Vendor Return / Inbound Processing GRN
 * Implementation of Section 5 of PDF Specification
 * Features:
 * - Vendor external challan number & date verification
 * - Piece-wise meterage grid with auto sum validation against vendor stated summary
 * - Collapsible transport details
 * - Grey fabric return (creates Open Bale with audit trail)
 */
export default function ProcessReturnForm({ availablePOs = [], availableChallans = [], onSave, onCancel, initialReturn }) {
  const isEditing = Boolean(initialReturn);

  const [vendorId, setVendorId] = useState(initialReturn?.vendor_id || 'VEND-0003');
  const [vendorName, setVendorName] = useState(initialReturn?.vendor_name || 'Raju Dyeing (Krishna Dyeing)');
  const [externalChallanNo, setExternalChallanNo] = useState(initialReturn?.vendor_external_challan_no || '2196');
  const [externalChallanDate, setExternalChallanDate] = useState(initialReturn?.vendor_challan_date || '2026-08-27');
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState(initialReturn?.vendor_invoice_no || 'INV-RD-8841');
  const [vendorInvoiceValue, setVendorInvoiceValue] = useState(initialReturn?.vendor_invoice_value || '17731.20');
  
  const [linkedPoId, setLinkedPoId] = useState(initialReturn?.linked_po_id || 'PPO-7611');
  const [linkedChallanId, setLinkedChallanId] = useState(initialReturn?.linked_challan_id || 'PCH-4903');
  const [receivedDate, setReceivedDate] = useState(initialReturn?.received_date || new Date().toISOString().split('T')[0]);
  
  const [fabricQuality, setFabricQuality] = useState(initialReturn?.fabric_quality || '100x100 Voile Solid Dye');
  const [width, setWidth] = useState(initialReturn?.width || '48');
  const [weight, setWeight] = useState(initialReturn?.weight || '122.5');
  const [foldingStandard, setFoldingStandard] = useState(initialReturn?.folding_standard || 'Fold 100');
  
  // Stated vs Entered Validation (Section 5.2)
  const [vendorDeclaredMeters, setVendorDeclaredMeters] = useState(initialReturn?.vendor_declared_meters || 1477.60);
  const [vendorDeclaredPieces, setVendorDeclaredPieces] = useState(initialReturn?.vendor_declared_pieces || 13);
  
  // Dedicated Grey Fabric Return Section (Section 5.3)
  const [greyFabricReturned, setGreyFabricReturned] = useState(initialReturn?.grey_fabric_returned_meters || 40.00);
  const [targetInvoiceForGrey, setTargetInvoiceForGrey] = useState('INV-MS-0091 (M.S. Textiles - Largest Balance)');

  // Collapsible Transport Section (Section 5.2)
  const [showTransport, setShowTransport] = useState(false);
  const [lrNumber, setLrNumber] = useState(initialReturn?.transport_details?.lr_number || 'LR-SURAT-9981');
  const [lrDate, setLrDate] = useState(initialReturn?.transport_details?.lr_date || '2026-08-27');
  const [transporterName, setTransporterName] = useState(initialReturn?.transport_details?.transporter_name || 'Local Auto Tempo (Surat)');
  const [vehicleNo, setVehicleNo] = useState(initialReturn?.transport_details?.vehicle_no || 'GJ-05-BX-4120');

  // Piece-Wise Grid Data
  const [pieces, setPieces] = useState(initialReturn?.pieces || [
    { id: 1, piece_no: 1, meters: 104.10, color_name: 'Off White', folding: 'Fold 100' },
    { id: 2, piece_no: 2, meters: 107.00, color_name: 'Off White', folding: 'Fold 100' },
    { id: 3, piece_no: 3, meters: 108.50, color_name: 'Off White', folding: 'Fold 100' },
    { id: 4, piece_no: 4, meters: 104.15, color_name: 'Off White', folding: 'Fold 100' },
    { id: 5, piece_no: 5, meters: 104.85, color_name: 'Off White', folding: 'Fold 100' },
    { id: 6, piece_no: 6, meters: 153.00, color_name: 'Off White', folding: 'Fold 100' },
    { id: 7, piece_no: 7, meters: 109.35, color_name: 'Off White', folding: 'Fold 100' },
    { id: 8, piece_no: 8, meters: 104.40, color_name: 'Off White', folding: 'Fold 100' },
    { id: 9, piece_no: 9, meters: 100.00, color_name: 'Off White', folding: 'Fold 100' },
    { id: 10, piece_no: 10, meters: 63.10, color_name: 'Beige', folding: 'Fold 100' },
    { id: 11, piece_no: 11, meters: 104.10, color_name: 'Beige', folding: 'Fold 100' },
    { id: 12, piece_no: 12, meters: 184.60, color_name: 'Beige', folding: 'Fold 100' },
    { id: 13, piece_no: 13, meters: 119.60, color_name: 'Beige', folding: 'Fold 100' }
  ]);

  const handlePieceMeterChange = (index, value) => {
    const updated = [...pieces];
    updated[index].meters = parseFloat(value) || 0;
    setPieces(updated);
  };

  const addPieceRow = () => {
    setPieces([
      ...pieces,
      {
        id: Date.now(),
        piece_no: pieces.length + 1,
        meters: 100.00,
        color_name: 'Beige',
        folding: foldingStandard
      }
    ]);
  };

  const removePieceRow = (idx) => {
    if (pieces.length <= 1) return;
    const filtered = pieces.filter((_, i) => i !== idx).map((p, i) => ({ ...p, piece_no: i + 1 }));
    setPieces(filtered);
  };

  const calculatedTotalMeters = pieces.reduce((acc, p) => acc + (parseFloat(p.meters) || 0), 0);
  const isMeterMismatch = Math.abs(calculatedTotalMeters - parseFloat(vendorDeclaredMeters || 0)) > 0.05;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isMeterMismatch) {
      if (!window.confirm(`Warning: Calculated total (${calculatedTotalMeters.toFixed(2)}m) differs from vendor declared summary (${vendorDeclaredMeters}m). Do you want to proceed?`)) {
        return;
      }
    }

    const returnPayload = {
      id: initialReturn?.id || `PRN-${externalChallanNo}`,
      vendor_id: vendorId,
      vendor_name: vendorName,
      vendor_external_challan_no: externalChallanNo,
      vendor_challan_date: externalChallanDate,
      vendor_invoice_no: vendorInvoiceNo,
      vendor_invoice_date: externalChallanDate,
      vendor_invoice_value: parseFloat(vendorInvoiceValue) || 0,
      internal_series: 'Job Work',
      linked_po_id: linkedPoId,
      linked_challan_id: linkedChallanId,
      received_date: receivedDate,
      fabric_quality: fabricQuality,
      width,
      weight: parseFloat(weight) || 0,
      folding_standard: foldingStandard,
      total_pieces: pieces.length,
      total_meters: Number(calculatedTotalMeters.toFixed(2)),
      vendor_declared_pieces: parseInt(vendorDeclaredPieces, 10) || pieces.length,
      vendor_declared_meters: parseFloat(vendorDeclaredMeters) || calculatedTotalMeters,
      grey_fabric_returned_meters: parseFloat(greyFabricReturned) || 0,
      transport_details: {
        lr_number: lrNumber,
        lr_date: lrDate,
        transporter_name: transporterName,
        vehicle_no: vehicleNo
      },
      status: initialReturn?.status || 'Received',
      created_by: initialReturn?.created_by || 'Saksham Garg',
      created_at: initialReturn?.created_at || new Date().toISOString(),
      pieces: pieces.map(p => ({ ...p, qc_status: p.qc_status || 'Pending' }))
    };

    onSave(returnPayload);
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
        <div>
          <h5 className="card-title mb-0 fw-bold text-dark">
            <i className="ti ti-receipt-refund me-2 text-primary"></i>
            {isEditing ? `Edit Vendor Return #${externalChallanNo}` : 'Record Vendor Return / Inbound Processing GRN'}
          </h5>
          <small className="text-muted">
            Internal Series: <strong className="text-primary">Job Work</strong> (Distinct from Raw Material GRN)
          </small>
        </div>
        <button type="button" className="btn btn-light btn-sm border" onClick={onCancel}>
          <i className="ti ti-x me-1"></i> Close
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card-body p-4">
          {/* Section 1: Vendor & Document Identification */}
          <div className="row g-3 mb-4 p-3 rounded border bg-light">
            <div className="col-md-3">
              <label className="form-label small fw-bold">Job Work Vendor *</label>
              <select
                className="form-select form-select-sm"
                value={vendorId}
                onChange={(e) => {
                  setVendorId(e.target.value);
                  const v = initialVendors.find(vend => vend.id === e.target.value);
                  if (v) setVendorName(v.name);
                }}
              >
                {initialVendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-bold">Vendor's External Challan No *</label>
              <input
                type="text"
                className="form-control form-control-sm fw-bold text-dark"
                value={externalChallanNo}
                onChange={(e) => setExternalChallanNo(e.target.value)}
                placeholder="e.g. 2196 (from physical slip)"
                required
              />
              <small className="text-muted" style={{ fontSize: '10px' }}>Unique within this vendor</small>
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-bold">Vendor Challan Date *</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={externalChallanDate}
                onChange={(e) => setExternalChallanDate(e.target.value)}
                required
              />
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-bold">Received in Factory *</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                required
              />
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-bold">Linked Process PO *</label>
              <select
                className="form-select form-select-sm"
                value={linkedPoId}
                onChange={(e) => setLinkedPoId(e.target.value)}
              >
                <option value="PPO-7611">PO #7611 (Beige - 525m)</option>
                <option value="PPO-7612">PO #7612 (Off White - 1006m)</option>
                <option value="PPO-7613">PO #7613 (Cambric - 887m)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Fabric Quality & Folding Specs */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label small fw-bold">Returned Fabric Quality *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={fabricQuality}
                onChange={(e) => setFabricQuality(e.target.value)}
                required
              />
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-bold">Width</label>
              <select className="form-select form-select-sm" value={width} onChange={(e) => setWidth(e.target.value)}>
                <option value="44">44"</option>
                <option value="48">48"</option>
                <option value="58">58"</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-bold">Folding Standard</label>
              <select className="form-select form-select-sm" value={foldingStandard} onChange={(e) => setFoldingStandard(e.target.value)}>
                <option value="Fold 100">Fold 100</option>
                <option value="Fold 98">Fold 98</option>
                <option value="Fold 97">Fold 97</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-bold">Weight (Kg)</label>
              <input
                type="number"
                step="0.1"
                className="form-control form-control-sm"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-bold">Vendor Stated Mtrs *</label>
              <input
                type="number"
                step="0.01"
                className="form-control form-control-sm text-end fw-bold"
                value={vendorDeclaredMeters}
                onChange={(e) => setVendorDeclaredMeters(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Section 3: Piece-Wise Meterage Breakdown (Section 5.2 - e.g. 13 thans) */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <span className="fw-bold text-dark text-uppercase small">
                  <i className="ti ti-layout-grid me-1 text-primary"></i> 2. Piece-Wise Meterage Breakdown
                </span>
                <span className="badge bg-light text-muted ms-2 border">
                  Must match vendor stated total of {vendorDeclaredMeters} m ({pieces.length} thans)
                </span>
              </div>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={addPieceRow}>
                <i className="ti ti-plus me-1"></i> + Add Than / Roll
              </button>
            </div>

            {/* Validation Alert if Mismatched */}
            {isMeterMismatch && (
              <div className="alert alert-warning py-2 small d-flex align-items-center mb-2">
                <i className="ti ti-alert-circle me-2 fs-5"></i>
                <div>
                  <strong>Meterage Discrepancy:</strong> Entered pieces total <strong>{calculatedTotalMeters.toFixed(2)} m</strong>,
                  which differs from Vendor Stated Summary of <strong>{vendorDeclaredMeters} m</strong> (Diff: {(calculatedTotalMeters - vendorDeclaredMeters).toFixed(2)}m).
                </div>
              </div>
            )}

            <div className="table-responsive border rounded">
              <table className="table table-sm table-bordered align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="table-light text-center">
                  <tr>
                    <th style={{ width: '50px' }}>Than #</th>
                    <th>Color</th>
                    <th style={{ width: '150px' }} className="table-primary text-primary">Length (Mtrs) *</th>
                    <th style={{ width: '120px' }}>Folding</th>
                    <th style={{ width: '120px' }}>Status</th>
                    <th style={{ width: '40px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pieces.map((p, idx) => (
                    <tr key={p.id || idx}>
                      <td className="text-center fw-bold">#{p.piece_no}</td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={p.color_name}
                          onChange={(e) => {
                            const updated = [...pieces];
                            updated[idx].color_name = e.target.value;
                            setPieces(updated);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm text-end fw-bold border-primary"
                          value={p.meters}
                          onChange={(e) => handlePieceMeterChange(idx, e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm text-center"
                          value={p.folding || foldingStandard}
                          onChange={(e) => {
                            const updated = [...pieces];
                            updated[idx].folding = e.target.value;
                            setPieces(updated);
                          }}
                        />
                      </td>
                      <td className="text-center">
                        <span className="badge bg-light text-muted border">Feeds QC</span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-link text-danger p-0"
                          onClick={() => removePieceRow(idx)}
                          disabled={pieces.length <= 1}
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr className="fw-bold">
                    <td colSpan={2} className="text-end text-uppercase">Sum of Individual Pieces:</td>
                    <td className="text-end text-primary fs-6">{calculatedTotalMeters.toFixed(2)} m</td>
                    <td colSpan={3} className="text-muted small">
                      Total: {pieces.length} Pieces / Thans
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 4: Dedicated Grey Fabric Return (Section 5.3) */}
          <div className="p-3 mb-4 rounded border border-secondary-subtle bg-light">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-dark text-uppercase small">
                <i className="ti ti-archive me-1 text-secondary"></i> 3. Grey Fabric / Unprocessed Stock Return (Open Bale)
              </span>
              <span className="badge bg-secondary text-white">Section 5.3 Rule</span>
            </div>
            <p className="small text-muted mb-2">
              When vendor returns uncut/unutilised grey fabric alongside dyed goods, it is logged here to generate an <strong>Open Bale</strong> in warehouse stock:
            </p>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small fw-bold">Grey Fabric Returned (Metres)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm text-end fw-bold"
                  value={greyFabricReturned}
                  onChange={(e) => setGreyFabricReturned(e.target.value)}
                  placeholder="e.g. 40.00"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">Target Purchase Invoice for Return Restock</label>
                <select
                  className="form-select form-select-sm"
                  value={targetInvoiceForGrey}
                  onChange={(e) => setTargetInvoiceForGrey(e.target.value)}
                >
                  <option value="INV-MS-0091 (M.S. Textiles - Largest Balance)">INV-MS-0091 (M.S. Textiles - Auto Assigned Largest Balance)</option>
                  <option value="INV-SR-0042 (Surat Rayon & Silk Mills)">INV-SR-0042 (Surat Rayon & Silk Mills)</option>
                </select>
                <small className="text-muted" style={{ fontSize: '10px' }}>Auto-assigned to invoice with largest balance; manual override supported</small>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <span className="small text-success fw-bold">
                  <i className="ti ti-check me-1"></i> Will create Open Bale #OB-0001
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Collapsible Transport Details (Section 5.2) */}
          <div className="mb-3">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              onClick={() => setShowTransport(!showTransport)}
            >
              <i className={`ti ${showTransport ? 'ti-chevron-up' : 'ti-chevron-down'}`}></i>
              {showTransport ? 'Hide Transport Details' : '+ Show Collapsible Transport Details (Optional for Local Trips)'}
            </button>

            {showTransport && (
              <div className="row g-3 mt-1 p-3 border rounded bg-white">
                <div className="col-md-3">
                  <label className="form-label small fw-bold">LR Number</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={lrNumber}
                    onChange={(e) => setLrNumber(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold">LR Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={lrDate}
                    onChange={(e) => setLrDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Transporter Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={transporterName}
                    onChange={(e) => setTransporterName(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Vehicle No</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card-footer bg-white border-top py-3 d-flex justify-content-between align-items-center">
          <div className="text-muted small">
            Automatically sends all {pieces.length} thans to <strong>Quality Control (QC)</strong>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm px-4">
              <i className="ti ti-check me-1"></i> Save Inward & Proceed to QC
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
