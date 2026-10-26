import React, { useState, useEffect, useMemo } from 'react';

/**
 * GRNDetailView - Step 3: GRN Details
 * Displays Receipt details, Bale-wise breakdown (with locked/editable status),
 * Quality check by item card (clickable), and audit History.
 * Supports Edit Header modal matching the exact specifications with all 10 receipt-level fields.
 */
export default function GRNDetailView({
  grn,
  vendors = [],
  transporters = [],
  purchaseOrders = [],
  qualityChecks = [],
  onBack,
  onEditHeader,
  onEditBales,
  onSelectQCItem
}) {
  const [showEditHeaderModal, setShowEditHeaderModal] = useState(false);
  const [editHeaderForm, setEditHeaderForm] = useState({
    challan: '',
    challanDate: '',
    invoice: '',
    invoiceDate: '',
    invoiceValue: '',
    transporter: '',
    lrNumber: '',
    lrDate: '',
    weightKg: '',
    foldingCms: '',
    totalQty: ''
  });

  useEffect(() => {
    if (grn) {
      setEditHeaderForm({
        challan: grn.vendorChallanNo || '',
        challanDate: grn.vendorChallanDate ? (typeof grn.vendorChallanDate === 'string' && grn.vendorChallanDate.includes('T') ? grn.vendorChallanDate.split('T')[0] : grn.vendorChallanDate) : '',
        invoice: grn.vendorInvoiceNo || '',
        invoiceDate: grn.vendorInvoiceDate ? (typeof grn.vendorInvoiceDate === 'string' && grn.vendorInvoiceDate.includes('T') ? grn.vendorInvoiceDate.split('T')[0] : grn.vendorInvoiceDate) : '',
        invoiceValue: grn.invoiceValue !== undefined && grn.invoiceValue !== null ? String(grn.invoiceValue) : (grn.totalAmount ? String(grn.totalAmount) : ''),
        transporter: grn.transporterName || grn.transporterId || '',
        lrNumber: grn.lrNumber || grn.lrNo || '',
        lrDate: grn.lrDate ? (typeof grn.lrDate === 'string' && grn.lrDate.includes('T') ? grn.lrDate.split('T')[0] : grn.lrDate) : '',
        weightKg: grn.weightKg !== undefined && grn.weightKg !== null ? String(grn.weightKg) : (grn.weight ? String(grn.weight) : ''),
        foldingCms: grn.foldingCms !== undefined && grn.foldingCms !== null ? String(grn.foldingCms) : (grn.fabricFolding ? String(grn.fabricFolding) : ''),
        totalQty: grn.totalQty !== undefined && grn.totalQty !== null && grn.totalQty !== ''
          ? String(grn.totalQty)
          : (grn.declaredTotalMeters ? String(grn.declaredTotalMeters) : '')
      });
    }
  }, [grn, showEditHeaderModal]);

  if (!grn) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4">
        <i className="ti ti-package-off fs-40 text-muted mb-3 d-block"></i>
        <h5 className="fw-bold text-dark mb-2">GRN Record Not Found</h5>
        <p className="text-secondary fs-13 mb-4">The selected Goods Receipt Note could not be loaded.</p>
        <div>
          <button type="button" className="btn btn-primary px-4 py-2 rounded-3" onClick={onBack}>
            Back to GRN Register
          </button>
        </div>
      </div>
    );
  }

  // Find linked PO
  const linkedPoId = grn.linkedPOs?.[0];
  const linkedPO = purchaseOrders.find((p) => p.id === linkedPoId);

  // Find transporter
  const transporterObj = transporters.find((t) => t.id === grn.transporterId || t.name === grn.transporterName);

  // Build full transporter options
  const defaultTransporterOptions = [
    'Bhiwandi Roadlines',
    'Keshav Freight Carriers',
    'Masood Transport Broker',
    'Surat Gujarat Transport',
    'Jaipur Golden Transport',
    'V-Trans India Ltd.'
  ];
  const allTransporterNames = Array.from(
    new Set([
      ...transporters.map((t) => t.name).filter(Boolean),
      ...defaultTransporterOptions,
      grn.transporterName
    ].filter(Boolean))
  );

  // Find all QC records matching this GRN (both main and partitioned QC IDs)
  const qcRecs = qualityChecks.filter((q) => q && (q.grnRef === grn.id || (grn.id && q.id && q.id.startsWith(`QC-${grn.id.replace('GRN-', '')}`))));
  const mainQC = qcRecs[0];

  const declaredBaleCount = Math.max(0, parseInt(grn.totalBales || grn.numBales || 0, 10));
  const rawBales = grn.bales || [];
  let bales = [...rawBales];
  if (declaredBaleCount > bales.length) {
    for (let i = bales.length; i < declaredBaleCount; i++) {
      bales.push({
        baleNo: String(i + 1),
        fabricItemLabel: grn.fabricName || 'Fabric Item',
        piecesCount: 0,
        totalLength: 0,
        pieces: []
      });
    }
  }

  // Calculate declared total quantity entered
  const declaredTotalQty = Number(grn.totalQty) || Number(grn.declaredTotalMeters) || 0;

  // Calculate actual total meters entered across bales and pieces
  const baleMetersEntered = (grn.bales || []).reduce((s, b) => {
    const pLen = (b.pieces || []).reduce((ps, p) => ps + (Number(p.length) || 0), 0);
    return s + (pLen > 0 ? pLen : (Number(b.totalLength) || 0));
  }, 0);

  // Requirement 21: QC should not proceed until the total quantity entered in GRN has complete bale entries.
  const isBaleEntriesComplete = declaredTotalQty > 0 &&
    (grn.bales && grn.bales.length > 0) &&
    baleMetersEntered > 0 &&
    Math.abs(baleMetersEntered - declaredTotalQty) < 0.01;

  const baleIncompleteReason = declaredTotalQty <= 0
    ? 'Total quantity is not specified in GRN'
    : (grn.bales || []).length === 0
    ? 'No bales entered in GRN'
    : Math.abs(baleMetersEntered - declaredTotalQty) >= 0.01
    ? `Bale entries total (${baleMetersEntered}m) does not match total quantity (${declaredTotalQty}m)`
    : '';

  // Requirement 21 & Header Lock: Only once QC inspection actually starts or is actioned are both bale entries and receipt details locked.
  const isQcPassedOrApproved = Boolean(
    grn.status === 'QC Approved' ||
    grn.status === 'QC Passed' ||
    (qcRecs.length > 0 && qcRecs.every((q) => q.qcStatus === 'Passed' || q.qcStatus === 'QC Approved' || q.qcStatus === 'Approved'))
  );

  const isQcStarted = Boolean(
    isQcPassedOrApproved ||
    grn.isQcActioned ||
    (qcRecs.some((q) => q.qcStatus && q.qcStatus !== 'Pending' && q.qcStatus !== 'Awaiting QC' && q.qcStatus !== 'Draft')) ||
    (qcRecs.some((q) => q.startedAt || q.isStarted || q.actualWidth || q.actualFold || (q.inspectedPieces && q.inspectedPieces.length > 0) || (q.pieceInspections && Object.keys(q.pieceInspections).length > 0))) ||
    grn.status === 'QC Rejected' ||
    grn.status === 'QC In Progress' ||
    grn.status === 'Pending Admin Approval' ||
    (grn.status && (grn.status.includes('QC') || grn.status === 'Under QC'))
  );

  const canEditHeader = !isQcStarted;
  const canEditBales = !isQcStarted;

  const anyPending = !isQcStarted;

  const totalMeters = Number(grn.totalMetersEntered) || (bales.reduce((s, b) => s + (Number(b.totalLength) || 0), 0)) || Number(grn.declaredTotalMeters) || Number(grn.totalQty) || 0;
  const totalPiecesCount = bales.reduce((sum, b) => sum + (b.pieces?.length || Number(b.piecesCount) || 0), 0) || grn.totalPieces || 0;

  // Expected Width & Fold
  const expectedWidth = mainQC?.expectedWidth || linkedPO?.items?.[0]?.width || '42"';
  const expectedFold = mainQC?.expectedFold || grn.foldingCms || linkedPO?.items?.[0]?.fold || '100';

  const poItems = linkedPO?.items || [];
  const baleFabrics = Array.from(new Set((grn.bales || []).map((b) => b.fabricItemLabel).filter(Boolean)));

  // Requirement 38: Generate distinct QC inspection batches for each fabric quality
  const qcInspectionBatches = useMemo(() => {
    // If we have explicit multi-QC records in qualityChecks
    if (qcRecs.length > 1) {
      return qcRecs.map((q, idx) => {
        let fName = q.fabricName || '';
        if (!fName && poItems[idx]) {
          fName = poItems[idx].fabricName || poItems[idx].fabricQuality || '';
        }
        if (!fName && baleFabrics[idx]) {
          fName = baleFabrics[idx];
        }
        if (!fName) {
          fName = grn.fabricName || `Fabric Quality ${idx + 1}`;
        }
        const bMeters = (grn.bales || []).reduce((sum, b) => {
          const bLbl = (b.fabricItemLabel || '').toLowerCase();
          const qLbl = fName.toLowerCase();
          if (b.itemIdx === idx || (bLbl && (bLbl.includes(qLbl) || qLbl.includes(bLbl)))) {
            const bLen = (b.pieces || []).reduce((ps, p) => ps + (Number(typeof p === 'object' ? p.length : p) || 0), 0);
            return sum + (bLen > 0 ? bLen : (Number(b.totalLength) || 0));
          }
          return sum;
        }, 0);

        return {
          id: q.id,
          fabricName: fName,
          totalReceivedMeters: q.totalReceivedMeters || q.receivedQty || bMeters || 0,
          expectedWidth: q.expectedWidth || linkedPO?.items?.[idx]?.width || grn.pannaWidth || '44',
          expectedFold: q.expectedFold || linkedPO?.items?.[idx]?.fold || grn.fabricFolding || '100',
          qcStatus: q.qcStatus || (grn.status === 'QC Approved' ? 'Approved' : 'Pending'),
          qcRecord: q
        };
      });
    }

    // If multiple PO items exist
    if (poItems.length > 1) {
      return poItems.map((it, idx) => {
        const fName = it.fabricName || it.fabricQuality || `Fabric Quality ${idx + 1}`;
        const partitionId = `QC-${grn.id.replace('GRN-', '')}-F${idx + 1}`;
        const existingQc = qcRecs.find((q) => q.id === partitionId || q.fabricName === fName) || (idx === 0 ? qcRecs[0] : null);

        let fMeters = 0;
        (grn.bales || []).forEach((b) => {
          const bLbl = (b.fabricItemLabel || '').toLowerCase();
          const itLbl = fName.toLowerCase();
          if (b.itemIdx === idx || (bLbl && (bLbl.includes(itLbl) || itLbl.includes(bLbl)))) {
            const bLen = (b.pieces || []).reduce((s, p) => s + (Number(typeof p === 'object' ? p.length : p) || 0), 0);
            fMeters += bLen > 0 ? bLen : (Number(b.totalLength) || 0);
          }
        });
        if (fMeters <= 0) {
          fMeters = Number(it.quantity) || Math.round((Number(grn.declaredTotalMeters || grn.totalQty || 0)) / poItems.length);
        }

        const qcObj = existingQc ? {
          ...existingQc,
          id: existingQc.id || partitionId,
          fabricName: existingQc.fabricName || fName,
          totalReceivedMeters: existingQc.totalReceivedMeters || fMeters,
          expectedWidth: existingQc.expectedWidth || String(it.width || '44'),
          expectedFold: existingQc.expectedFold || String(it.fold || '100')
        } : {
          id: partitionId,
          grnRef: grn.id,
          againstRef: linkedPO?.id || grn.poId || '',
          fabricName: fName,
          fabricId: it.fabricId || '',
          colorName: it.color || it.colorName || it.shade || grn.colorName || 'Grey / Natural',
          expectedWidth: String(it.width || '44'),
          expectedFold: String(it.fold || '100'),
          totalReceivedMeters: fMeters,
          receivedQty: fMeters,
          qcStatus: grn.status === 'QC Approved' ? 'Approved' : 'Pending',
          originalQcId: qcRecs[0]?.id
        };

        return {
          id: qcObj.id,
          fabricName: fName,
          totalReceivedMeters: fMeters,
          expectedWidth: it.width ? String(it.width) : (qcObj.expectedWidth || '44'),
          expectedFold: it.fold ? String(it.fold) : (qcObj.expectedFold || '100'),
          qcStatus: qcObj.qcStatus || (grn.status === 'QC Approved' ? 'Approved' : 'Pending'),
          qcRecord: qcObj
        };
      });
    }

    // If multiple bale fabric labels exist
    if (baleFabrics.length > 1) {
      return baleFabrics.map((fLbl, idx) => {
        const partitionId = `QC-${grn.id.replace('GRN-', '')}-F${idx + 1}`;
        const existingQc = qcRecs.find((q) => q.id === partitionId || q.fabricName === fLbl) || (idx === 0 ? qcRecs[0] : null);

        let fMeters = 0;
        (grn.bales || []).forEach((b) => {
          if (b.fabricItemLabel === fLbl) {
            const bLen = (b.pieces || []).reduce((s, p) => s + (Number(typeof p === 'object' ? p.length : p) || 0), 0);
            fMeters += bLen > 0 ? bLen : (Number(b.totalLength) || 0);
          }
        });
        if (fMeters <= 0) {
          fMeters = Math.round((Number(grn.declaredTotalMeters || grn.totalQty || 0)) / baleFabrics.length);
        }

        const qcObj = existingQc ? {
          ...existingQc,
          id: existingQc.id || partitionId,
          fabricName: existingQc.fabricName || fLbl,
          totalReceivedMeters: existingQc.totalReceivedMeters || fMeters
        } : {
          id: partitionId,
          grnRef: grn.id,
          againstRef: linkedPO?.id || grn.poId || '',
          fabricName: fLbl,
          expectedWidth: String(grn.pannaWidth || '44'),
          expectedFold: String(grn.fabricFolding || '100'),
          totalReceivedMeters: fMeters,
          receivedQty: fMeters,
          qcStatus: grn.status === 'QC Approved' ? 'Approved' : 'Pending',
          originalQcId: qcRecs[0]?.id
        };

        return {
          id: qcObj.id,
          fabricName: fLbl,
          totalReceivedMeters: fMeters,
          expectedWidth: qcObj.expectedWidth || grn.pannaWidth || '44',
          expectedFold: qcObj.expectedFold || grn.fabricFolding || '100',
          qcStatus: qcObj.qcStatus || (grn.status === 'QC Approved' ? 'Approved' : 'Pending'),
          qcRecord: qcObj
        };
      });
    }

    // Fallback: Single fabric item
    const singleQc = qcRecs[0] || {
      id: `QC-${grn.id.replace('GRN-', '')}`,
      grnRef: grn.id,
      againstRef: linkedPO?.id || grn.poId || '',
      fabricName: grn.fabricName || 'Modal Satin Premium',
      totalReceivedMeters: totalMeters,
      receivedQty: totalMeters,
      expectedWidth: String(expectedWidth).replace(/"/g, ''),
      expectedFold: String(expectedFold).replace(/%/g, ''),
      qcStatus: grn.status === 'QC Approved' ? 'Approved' : 'Pending'
    };

    return [
      {
        id: singleQc.id,
        fabricName: grn.fabricName || singleQc.fabricName || 'Modal Satin Premium',
        totalReceivedMeters: totalMeters,
        expectedWidth: singleQc.expectedWidth || expectedWidth || '44',
        expectedFold: singleQc.expectedFold || expectedFold || '100',
        qcStatus: singleQc.qcStatus || (grn.status === 'QC Approved' ? 'Approved' : 'Pending'),
        qcRecord: singleQc
      }
    ];
  }, [qcRecs, poItems, baleFabrics, grn, linkedPO, totalMeters, expectedWidth, expectedFold]);

  const handleSaveHeader = (e) => {
    e.preventDefault();
    if (!canEditHeader) {
      alert('Receipt details cannot be edited because Quality Check has already started or been approved for this GRN.');
      setShowEditHeaderModal(false);
      return;
    }
    if (onEditHeader) {
      onEditHeader({
        ...grn,
        vendorChallanNo: editHeaderForm.challan,
        vendorChallanDate: editHeaderForm.challanDate,
        vendorInvoiceNo: editHeaderForm.invoice,
        vendorInvoiceDate: editHeaderForm.invoiceDate,
        invoiceValue: editHeaderForm.invoiceValue,
        transporterName: editHeaderForm.transporter,
        lrNumber: editHeaderForm.lrNumber,
        lrNo: editHeaderForm.lrNumber,
        lrDate: editHeaderForm.lrDate,
        weightKg: editHeaderForm.weightKg,
        weight: editHeaderForm.weightKg,
        foldingCms: editHeaderForm.foldingCms,
        fabricFolding: editHeaderForm.foldingCms,
        totalQty: editHeaderForm.totalQty,
        declaredTotalMeters: Number(editHeaderForm.totalQty) || 0
      });
    }
    setShowEditHeaderModal(false);
  };

  return (
    <div className="container-fluid p-0">
      {/* Top Header & Breadcrumb */}
      <div className="mb-4">
        <button
          type="button"
          className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold d-inline-flex align-items-center gap-1.5 mb-2 fs-13"
          style={{ color: '#5b47fb' }}
          onClick={onBack}
        >
          <i className="ti ti-arrow-left"></i>
          <span>Back to GRN Register</span>
        </button>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-1 fs-24 d-flex align-items-center gap-2.5">
              <span>{grn.id}</span>
              <span
                className={`badge px-2.5 py-1 fs-11 rounded-pill ${
                  grn.status === 'QC Approved'
                    ? 'bg-success-subtle text-success border border-success border-opacity-25'
                    : grn.status === 'QC Rejected'
                    ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                    : grn.status === 'Completed'
                    ? 'bg-primary-subtle text-primary border border-primary border-opacity-25'
                    : 'bg-secondary-subtle text-secondary border border-secondary border-opacity-25'
                }`}
              >
                {grn.status || 'Draft'}
              </span>
              {!isQcStarted && (
                <span className="badge bg-success-subtle text-success border border-success border-opacity-25 px-2.5 py-1 fs-11 rounded-pill fw-medium">
                  <i className="ti ti-check me-1"></i> Editable (Awaiting Inspection)
                </span>
              )}
            </h2>
            <p className="text-secondary fs-13 mb-0">
              Against <strong>{linkedPoId ? `${linkedPoId}` : 'Direct Inward'}</strong> · {grn.vendorName || 'Vendor'}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            {!isQcStarted && (
              <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center gap-2 px-3 py-1.5 fw-semibold fs-13 rounded-2 shadow-sm text-white"
                style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                onClick={() => onEditBales && onEditBales(grn)}
                title="Edit GRN record and container bales"
              >
                <i className="ti ti-edit fs-15"></i>
                <span>Edit GRN</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CARD 1: Receipt details */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
          <h5 className="fw-bold text-dark mb-0 fs-16">Receipt details</h5>
          {canEditHeader ? (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-3 py-1 rounded-3 fs-12 fw-medium"
              onClick={() => setShowEditHeaderModal(true)}
            >
              <i className="ti ti-edit me-1"></i>
              Edit
            </button>
          ) : (
            <span className="badge bg-light text-secondary border px-3 py-1.5 fs-12 rounded-3 d-inline-flex align-items-center gap-1.5">
              <i className="ti ti-lock fs-13 text-muted"></i>
              <span>Locked ({isQcPassedOrApproved ? 'QC Approved' : 'QC Actioned'} &mdash; Non-editable)</span>
            </span>
          )}
        </div>

        <div className="row g-4 fs-13">
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">RECEIVED DATE</div>
            <div className="fw-bold text-dark">{grn.date || '2026-10-07'}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">VENDOR CHALLAN</div>
            <div className="fw-bold text-dark">
              {grn.vendorChallanNo || '—'}
              {grn.vendorChallanDate && (
                <div className="text-muted fs-11 fw-normal">{grn.vendorChallanDate}</div>
              )}
            </div>
          </div>
          <div className="col-6 col-sm-4 col-md-3">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">VENDOR INVOICE</div>
            <div className="fw-bold text-dark">
              {grn.vendorInvoiceNo || '—'}
              {grn.vendorInvoiceDate && (
                <div className="text-muted fs-11 fw-normal">{grn.vendorInvoiceDate}</div>
              )}
              {grn.invoiceValue && (
                <div className="text-success fs-11 fw-semibold">₹{Number(grn.invoiceValue).toLocaleString()}</div>
              )}
            </div>
          </div>
          <div className="col-6 col-sm-4 col-md-3">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">TRANSPORTER</div>
            <div className="fw-bold text-dark">{grn.transporterName || transporterObj?.name || 'Bhiwandi Roadlines'}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">LR NO. / DATE</div>
            <div className="fw-bold text-dark">
              {grn.lrNumber || grn.lrNo || '—'}
              {grn.lrDate && (
                <div className="text-muted fs-11 fw-normal">{grn.lrDate}</div>
              )}
            </div>
          </div>

          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">WEIGHT</div>
            <div className="fw-bold text-dark">{grn.weightKg || grn.weight || '—'} kg</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">FABRIC FOLDING</div>
            <div className="fw-bold text-dark">{grn.foldingCms || grn.fabricFolding || expectedFold || '—'} cms</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">TOTAL QUANTITY</div>
            <div className="fw-bold text-dark">{totalMeters}m</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">NO. OF BALES</div>
            <div className="fw-bold text-dark">{bales.length || grn.totalBales || 0}</div>
          </div>
          <div className="col-6 col-sm-4 col-md-2">
            <div className="text-muted fs-11 text-uppercase fw-semibold mb-1">TOTAL PIECES</div>
            <div className="fw-bold text-dark">{totalPiecesCount}</div>
          </div>
        </div>
      </div>

      {/* CARD 2: Bale-wise breakdown */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
        <div className="card-header bg-white border-bottom p-3.5 d-flex align-items-center justify-content-between">
          <h5 className="fw-bold text-dark mb-0 fs-16">Bale-wise breakdown</h5>
          {canEditBales && onEditBales ? (
            <button
              type="button"
              className="btn btn-sm btn-primary px-3 py-1 text-white rounded-3 fs-12 fw-semibold"
              style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
              onClick={() => onEditBales(grn)}
            >
              <i className="ti ti-edit me-1"></i> Edit Bale Entries
            </button>
          ) : (
            <span className="badge bg-light text-secondary border px-3 py-1.5 fs-12 rounded-3 d-inline-flex align-items-center gap-1.5">
              <i className="ti ti-lock fs-13 text-muted"></i>
              <span>Locked (QC Started &mdash; Non-editable)</span>
            </span>
          )}
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-secondary fs-12 text-uppercase fw-bold">
              <tr>
                <th className="ps-4 py-3" style={{ minWidth: '100px' }}>BALE NO.</th>
                <th className="py-3" style={{ minWidth: '220px' }}>FABRIC ITEM</th>
                <th className="py-3 text-center" style={{ minWidth: '90px' }}>PIECES</th>
                <th className="py-3 text-end" style={{ minWidth: '120px' }}>METERS</th>
                <th className="py-3 text-center" style={{ minWidth: '120px' }}>QC STATUS</th>
                <th className="pe-4 py-3 text-end" style={{ minWidth: '110px' }}>LOCK STATUS</th>
              </tr>
            </thead>
            <tbody>
              {bales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No bales entered yet.
                  </td>
                </tr>
              ) : (
                bales.map((bale, idx) => {
                  const bNo = bale.baleNo || `Bale ${idx + 1}`;
                  const fabricLabel = bale.fabricItemLabel || bale.fabric || grn.fabricName || 'Grey Cotton Rayon';
                  const pcsCount = (bale.pieces && bale.pieces.length > 0)
                    ? bale.pieces.length
                    : (Number(bale.piecesCount) || 0);
                  const bMeters = (bale.pieces && bale.pieces.length > 0)
                    ? bale.pieces.reduce((s, p) => s + (Number(p.length) || 0), 0)
                    : (Number(bale.totalLength) || 0);
                  const isQcLocked = isQcStarted || bale.qcStatus === 'Approved' || bale.qcStatus === 'OK';

                  return (
                    <tr key={idx}>
                      <td className="ps-4 py-3 fw-bold text-dark">{bNo}</td>
                      <td className="py-3 text-secondary">{fabricLabel}</td>
                      <td className="py-3 text-center">{pcsCount}</td>
                      <td className="py-3 text-end fw-semibold text-dark">{Number(bMeters).toFixed(1)}m</td>
                      <td className="py-3 text-center">
                        <span
                          className={`badge rounded-pill px-2.5 py-1 fs-11 ${
                            isQcLocked
                              ? 'bg-success-subtle text-success border border-success border-opacity-25'
                              : 'bg-primary-subtle text-primary border border-primary border-opacity-25'
                          }`}
                        >
                          {bale.qcStatus || (isQcLocked ? 'QC Approved' : 'Pending QC')}
                        </span>
                      </td>
                      <td className="pe-4 py-3 text-end">
                        <span
                          className={`badge rounded-pill px-2.5 py-1 fs-11 ${
                            isQcLocked
                              ? 'bg-secondary-subtle text-secondary border border-secondary border-opacity-25'
                              : 'bg-info-subtle text-info border border-info border-opacity-25'
                          }`}
                        >
                          <i className={`ti ${isQcLocked ? 'ti-lock' : 'ti-pencil'} me-1 fs-10`}></i>
                          {isQcLocked ? 'Locked (QC started)' : 'Editable'}
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

      {/* CARD 3: Quality Check by Item (Clickable - Redirects to QC inspection) */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
          <div className="d-flex align-items-center gap-2">
            <h5 className="fw-bold text-dark mb-0 fs-16">Quality check by item</h5>
            {qcInspectionBatches.length > 1 && (
              <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 px-2.5 py-1 fs-11 rounded-pill fw-semibold">
                {qcInspectionBatches.length} Fabric Qualities
              </span>
            )}
          </div>
          {!isBaleEntriesComplete && !isQcStarted && (
            <span className="badge bg-warning-subtle text-dark border border-warning border-opacity-50 px-2.5 py-1 fs-11 rounded-pill d-inline-flex align-items-center gap-1">
              <i className="ti ti-alert-triangle text-warning"></i>
              <span>QC Locked: Complete Bale Entries Required ({baleMetersEntered}m / {declaredTotalQty}m)</span>
            </span>
          )}
        </div>

        <div className="d-flex flex-column gap-3">
          {qcInspectionBatches.map((item, idx) => {
            const isItemQcDone = item.qcStatus === 'OK' || item.qcStatus === 'Approved' || item.qcStatus === 'Partial OK';
            const isItemReject = item.qcStatus === 'Reject' || item.qcStatus === 'Rejected';
            const isItemAdmin = item.qcStatus === 'Send for Admin Approval' || item.qcStatus === 'Pending Admin Approval' || item.qcStatus === 'Admin Approval';

            return (
              <div
                key={item.id || idx}
                className="border rounded-4 p-3.5 d-flex flex-wrap align-items-center justify-content-between gap-3 bg-white"
                style={{
                  borderColor: !isBaleEntriesComplete && !isQcStarted ? '#fde68a' : '#e2e8f0',
                  cursor: !isBaleEntriesComplete && !isQcStarted ? 'not-allowed' : 'pointer',
                  backgroundColor: !isBaleEntriesComplete && !isQcStarted ? '#fffdf0' : '#ffffff',
                  transition: 'all 0.15s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  if (isBaleEntriesComplete || isQcStarted) {
                    e.currentTarget.style.borderColor = '#5b47fb';
                    e.currentTarget.style.backgroundColor = '#faf9ff';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(91, 71, 251, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = !isBaleEntriesComplete && !isQcStarted ? '#fde68a' : '#e2e8f0';
                  e.currentTarget.style.backgroundColor = !isBaleEntriesComplete && !isQcStarted ? '#fffdf0' : '#ffffff';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => {
                  if (!isBaleEntriesComplete && !isQcStarted) {
                    alert(`QC cannot proceed: Total quantity entered in GRN (${declaredTotalQty}m) has incomplete bale entries (${baleMetersEntered}m). Please complete all bale entries in GRN first.`);
                    return;
                  }
                  if (onSelectQCItem) {
                    onSelectQCItem(item.qcRecord);
                  }
                }}
                title={!isBaleEntriesComplete && !isQcStarted ? baleIncompleteReason : `Click anywhere on this card to run quality check for ${item.fabricName}`}
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 p-2.5 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      backgroundColor: isItemQcDone ? '#dcfce7' : isItemReject ? '#fee2e2' : '#e0e7ff',
                      color: isItemQcDone ? '#15803d' : isItemReject ? '#b91c1c' : '#4338ca'
                    }}
                  >
                    <i className={`ti ${isItemQcDone ? 'ti-check' : isItemReject ? 'ti-x' : 'ti-checklist'} fs-22`}></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark fs-15 mb-0.5 d-flex align-items-center gap-2 flex-wrap">
                      <span>{item.fabricName} · {String(item.expectedWidth).replace(/"/g, '')}&quot;</span>
                      {qcInspectionBatches.length > 1 && (
                        <span className="badge bg-light text-secondary border px-2 py-0.5 fs-11 rounded-pill">
                          Item {idx + 1}
                        </span>
                      )}
                    </div>
                    <div className="text-secondary fs-13 mb-1">
                      Received: <strong>{Number(item.totalReceivedMeters || item.receivedQty || 0).toLocaleString()}m</strong> · Expected width {String(item.expectedWidth).replace(/"/g, '')}&quot;, expected fold {String(item.expectedFold).replace(/%/g, '')}%
                    </div>
                    <div className="d-inline-flex align-items-center gap-1.5 fs-13 text-secondary">
                      <i className="ti ti-sparkles fs-15" style={{ color: '#5b47fb' }}></i>
                      <span>
                        {isItemQcDone
                          ? 'QC Inspection Completed'
                          : isItemReject
                          ? 'QC Inspection Rejected'
                          : isItemAdmin
                          ? 'Submitted for Admin Approval'
                          : (!isBaleEntriesComplete && !isQcStarted ? `Awaiting complete bale entries (${baleMetersEntered}m of ${declaredTotalQty}m)` : 'Awaiting quality check')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <span
                    className={`badge rounded-pill px-3 py-1.5 fs-12 fw-semibold ${
                      isItemQcDone
                        ? 'bg-success-subtle text-success border border-success border-opacity-25'
                        : (!isBaleEntriesComplete && !isQcStarted)
                        ? 'bg-warning-subtle text-dark border border-warning border-opacity-50'
                        : isItemReject
                        ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                        : isItemAdmin
                        ? 'bg-warning-subtle text-warning-emphasis border border-warning'
                        : 'bg-primary-subtle text-primary border border-primary border-opacity-25'
                    }`}
                  >
                    {!isBaleEntriesComplete && !isQcStarted ? 'Incomplete Bales' : (item.qcStatus || (grn.status === 'QC Approved' ? 'Approved' : 'Awaiting QC'))}
                  </span>
                  <button
                    type="button"
                    className={`btn btn-sm rounded-3 px-3 py-1.5 fs-12 fw-semibold shadow-2xs d-inline-flex align-items-center gap-1.5 text-white ${!isBaleEntriesComplete && !isQcStarted ? 'btn-secondary opacity-75' : 'btn-primary'}`}
                    style={{
                      backgroundColor: !isBaleEntriesComplete && !isQcStarted ? '#6b7280' : '#5b47fb',
                      borderColor: !isBaleEntriesComplete && !isQcStarted ? '#6b7280' : '#5b47fb'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isBaleEntriesComplete && !isQcStarted) {
                        alert(`QC cannot proceed: Total quantity entered in GRN (${declaredTotalQty}m) has incomplete bale entries (${baleMetersEntered}m). Please complete all bale entries in GRN first.`);
                        return;
                      }
                      if (onSelectQCItem) {
                        onSelectQCItem(item.qcRecord);
                      }
                    }}
                    title={!isBaleEntriesComplete && !isQcStarted ? baleIncompleteReason : `Inspect ${item.fabricName}`}
                  >
                    <span>{isItemQcDone ? 'View QC' : (!isBaleEntriesComplete && !isQcStarted ? 'Run Inspection (Bales Incomplete)' : 'Run Inspection')}</span>
                    <i className="ti ti-arrow-right fs-13"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EDIT HEADER MODAL (Matches User Image 2 with all 10 Receipt-level fields) */}
      {/* ========================================================================= */}
      {canEditHeader && showEditHeaderModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden bg-white" style={{ border: '1px solid #e2e8f0' }}>
              <form onSubmit={handleSaveHeader}>
                {/* Modal Header */}
                <div className="modal-header border-0 pb-1 pt-3.5 px-4 d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="modal-title fw-bold text-dark fs-17 mb-0" style={{ letterSpacing: '-0.2px' }}>
                      Edit {grn.id} header
                    </h5>
                    <div className="text-secondary fs-11 mt-0.5" style={{ lineHeight: '1.4' }}>
                      Bale/piece quantities are locked — only receipt-level fields can change here.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close fs-12 text-muted"
                    onClick={() => setShowEditHeaderModal(false)}
                    aria-label="Close"
                  ></button>
                </div>

                {/* Modal Body with 10 fields */}
                <div className="modal-body px-4 py-2.5">
                  <div className="row g-2.5">
                    {/* 1. Vendor challan no. */}
                    <div className="col-12 col-sm-7">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Vendor challan no.</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.challan}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, challan: e.target.value })}
                        placeholder=""
                      />
                    </div>

                    {/* 2. Challan date */}
                    <div className="col-12 col-sm-5">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Challan date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.challanDate}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, challanDate: e.target.value })}
                      />
                    </div>

                    {/* 3. Vendor invoice no. */}
                    <div className="col-12 col-sm-7">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Vendor invoice no.</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.invoice}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, invoice: e.target.value })}
                        placeholder=""
                      />
                    </div>

                    {/* 4. Invoice date */}
                    <div className="col-12 col-sm-5">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Invoice date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.invoiceDate}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, invoiceDate: e.target.value })}
                      />
                    </div>

                    {/* 5. Invoice value (₹) */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Invoice value (₹)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.invoiceValue}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, invoiceValue: e.target.value })}
                        placeholder=""
                      />
                    </div>

                    {/* Empty column spacer */}
                    <div className="col-12 col-sm-6"></div>

                    {/* 6. Transporter */}
                    <div className="col-12 col-sm-7">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Transporter</label>
                      <select
                        className="form-select form-select-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.transporter}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, transporter: e.target.value })}
                      >
                        <option value="">Select Transporter...</option>
                        {allTransporterNames.map((name, idx) => (
                          <option key={idx} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 7. LR no. */}
                    <div className="col-12 col-sm-5">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">LR no.</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.lrNumber}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, lrNumber: e.target.value })}
                        placeholder=""
                      />
                    </div>

                    {/* 8. LR date */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">LR date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.lrDate}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, lrDate: e.target.value })}
                      />
                    </div>

                    {/* Empty spacer */}
                    <div className="col-12 col-sm-6"></div>

                    {/* 9. Weight (kg) */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Weight (kg)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.weightKg}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, weightKg: e.target.value })}
                        placeholder=""
                      />
                    </div>

                    {/* 10. Fabric folding (cms) */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Fabric folding (cms)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.foldingCms}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, foldingCms: e.target.value })}
                        placeholder=""
                      />
                    </div>

                    {/* 11. Total quantity (m) */}
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-11 fw-medium text-dark mb-1">Total quantity (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control form-control-sm fs-12 rounded-3 bg-white"
                        style={{ borderColor: '#d1d5db', minHeight: '34px' }}
                        value={editHeaderForm.totalQty}
                        onChange={(e) => setEditHeaderForm({ ...editHeaderForm, totalQty: e.target.value })}
                        placeholder="e.g. 500"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer with Theme Buttons */}
                <div className="modal-footer border-0 pt-2 pb-3.5 px-4 d-flex align-items-center justify-content-start gap-2">
                  <button
                    type="submit"
                    className="btn btn-sm px-4 py-1.5 rounded-3 fs-13 text-white fw-semibold shadow-sm d-inline-flex align-items-center gap-1.5"
                    style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                  >
                    <i className="ti ti-check fs-14"></i>
                    <span>Save Changes</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3.5 py-1.5 rounded-3 fs-13 fw-medium bg-white"
                    style={{ borderColor: '#cbd5e1', color: '#475569' }}
                    onClick={() => setShowEditHeaderModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
