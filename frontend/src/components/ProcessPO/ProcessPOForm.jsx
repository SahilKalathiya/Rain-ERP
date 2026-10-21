import React, { useState, useEffect } from 'react';
import { initialVendors } from '../../data/procurementData';

/**
 * ProcessPOForm - Full creation & section-wise edit form for Module 3 Process PO
 * Strict implementation of Section 3 & 12.1 of PDF specification
 */
export default function ProcessPOForm({ initialPO, onSave, onCancel, readOnlyDefault = false }) {
  const isEditingExisting = Boolean(initialPO && initialPO.id);
  const [isReadOnly, setIsReadOnly] = useState(readOnlyDefault);

  // Header State
  const [poNumber, setPoNumber] = useState(initialPO?.po_number || `${Math.floor(1000 + Math.random() * 9000)}`);
  const [date, setDate] = useState(initialPO?.date || new Date().toISOString().split('T')[0]);
  const [issueDate, setIssueDate] = useState(initialPO?.issue_date || initialPO?.date || new Date().toISOString().split('T')[0]);
  const [vendorId, setVendorId] = useState(initialPO?.vendor_id || 'VEND-0003');
  const [vendorName, setVendorName] = useState(initialPO?.vendor_name || 'Raju Dyeing (Krishna Dyeing)');
  
  // Link to Sales Order or Standalone
  const [isOrderLinked, setIsOrderLinked] = useState(initialPO ? Boolean(initialPO.linked_sales_order_id) : true);
  const [linkedOrderId, setLinkedOrderId] = useState(initialPO?.linked_sales_order_id || 'ORD-2026-001');
  
  // Multi-Style Configuration (Section 3.1 & 3.2)
  const [numberOfStyles, setNumberOfStyles] = useState(initialPO?.number_of_styles || 1);
  const [styles, setStyles] = useState(initialPO?.style_names || ['Graphic Boota Kurta']);
  
  const [customerBrandName, setCustomerBrandName] = useState(initialPO?.customer_brand_name || 'Raindrop Signature');
  const [deliveryDate, setDeliveryDate] = useState(initialPO?.delivery_date || '2026-09-10');
  const [terms, setTerms] = useState(initialPO?.terms || 'Goods delivered must be strictly as per sample and specification within stipulated date.');
  
  // Line Items
  const [items, setItems] = useState(initialPO?.items || [
    {
      id: 1,
      style_name: 'Graphic Boota Kurta',
      fabric_id: 'FAB-001',
      fabric_name: '100x100 Voile (Grey)',
      color_id: 'COL-001',
      color_name: 'Beige',
      color_hex: '#F5F5DC',
      article_name: 'Kurta',
      width: '48',
      quantity_meters: 525.00,
      quantity_pieces: 201,
      consumption_per_piece: 2.60,
      shrinkage_percent: 4.00,
      raw_fabric_meters: 546.00,
      fabric_rate: 25.00,
      dyeing_rate: 12.00,
      total_actual_cost: 37.00,
      total_amount: 19425.00,
      remarks: 'Sample approved as per Graphic Boota swatch',
      sample_photo: null,
      status: 'Not Ordered'
    }
  ]);

  // Available Master Data for Dropdowns
  const availableStyles = ['Graphic Boota Kurta', 'A-Line Festive Kurta', 'Printed Anarkali Suit', 'Straight Cut Kurti', 'Stock Cambric Plain'];
  const availableFabrics = [
    { id: 'FAB-001', name: '100x100 Voile (Grey)', widths: ['44', '48', '58'], defaultRate: 25.00, shrinkage: 4.0 },
    { id: 'FAB-002', name: 'Rayon 14kg Liva', widths: ['44', '58'], defaultRate: 30.00, shrinkage: 5.0 },
    { id: 'FAB-003', name: 'Cotton Cambric 60*60', widths: ['44', '58'], defaultRate: 42.00, shrinkage: 3.5 }
  ];
  const availableColors = [
    { id: 'COL-001', name: 'Beige', hex: '#F5F5DC' },
    { id: 'COL-002', name: 'Off White', hex: '#FAF9F6' },
    { id: 'COL-003', name: 'Dusty Rose', hex: '#DCAE96' },
    { id: 'COL-004', name: 'Sky Blue', hex: '#87CEEB' },
    { id: 'COL-005', name: 'Sage Green', hex: '#9DC183' },
    { id: 'COL-006', name: 'Mustard Yellow', hex: '#E1AD01' }
  ];

  // Update styles list when number of styles changes
  const handleNumberOfStylesChange = (count) => {
    const num = Math.max(1, parseInt(count, 10) || 1);
    setNumberOfStyles(num);
    const newStyles = [...styles];
    while (newStyles.length < num) {
      newStyles.push(availableStyles[newStyles.length % availableStyles.length]);
    }
    setStyles(newStyles.slice(0, num));
  };

  const handleStyleChange = (index, value) => {
    const newStyles = [...styles];
    newStyles[index] = value;
    setStyles(newStyles);
  };

  const swapStylesOrder = (i, j) => {
    const newStyles = [...styles];
    const temp = newStyles[i];
    newStyles[i] = newStyles[j];
    newStyles[j] = temp;
    setStyles(newStyles);
  };

  // Recalculate row mathematics on field changes
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };

    const consumption = parseFloat(item.consumption_per_piece) || 2.60;
    const shrinkage = parseFloat(item.shrinkage_percent) || 4.00;

    // 1. Bi-directional calculation: Metres <-> Pieces
    if (field === 'quantity_meters') {
      const meters = parseFloat(value) || 0;
      // Metres / consumption = Pieces (rounded down)
      item.quantity_pieces = consumption > 0 ? Math.floor(meters / consumption) : 0;
      item.raw_fabric_meters = Number((meters * (1 + shrinkage / 100)).toFixed(2));
    } else if (field === 'quantity_pieces') {
      const pieces = parseInt(value, 10) || 0;
      // Pieces * consumption = Metres
      const calculatedMeters = Number((pieces * consumption).toFixed(2));
      item.quantity_meters = calculatedMeters;
      item.raw_fabric_meters = Number((calculatedMeters * (1 + shrinkage / 100)).toFixed(2));
    } else if (field === 'consumption_per_piece') {
      const c = parseFloat(value) || 2.60;
      if (item.quantity_meters > 0) {
        item.quantity_pieces = c > 0 ? Math.floor(item.quantity_meters / c) : 0;
      }
    }

    // 2. Cost calculations
    const fabRate = parseFloat(item.fabric_rate) || 0;
    const dyeingRate = parseFloat(item.dyeing_rate) || 0;
    item.total_actual_cost = Number((fabRate + dyeingRate).toFixed(2));
    item.total_amount = Number(((parseFloat(item.quantity_meters) || 0) * (fabRate + dyeingRate)).toFixed(2));

    newItems[index] = item;
    setItems(newItems);
  };

  // Auto-recommend dyeing rate based on width & fabric (Section 3.2)
  const applyRecommendedDyeingRate = (index) => {
    const newItems = [...items];
    const item = newItems[index];
    let recommended = 12.00;
    if (item.width === '44') recommended = 10.00;
    else if (item.width === '48') recommended = 12.00;
    else if (item.width === '58') recommended = 15.00;

    item.dyeing_rate = recommended;
    const fabRate = parseFloat(item.fabric_rate) || 0;
    item.total_actual_cost = Number((fabRate + recommended).toFixed(2));
    item.total_amount = Number(((parseFloat(item.quantity_meters) || 0) * (fabRate + recommended)).toFixed(2));
    setItems(newItems);
  };

  const addItemRow = () => {
    const nextStyle = styles[0] || 'Graphic Boota Kurta';
    setItems([
      ...items,
      {
        id: Date.now(),
        style_name: nextStyle,
        fabric_id: 'FAB-001',
        fabric_name: '100x100 Voile (Grey)',
        color_id: 'COL-002',
        color_name: 'Off White',
        color_hex: '#FAF9F6',
        article_name: 'Kurta',
        width: '48',
        quantity_meters: 500.00,
        quantity_pieces: 192,
        consumption_per_piece: 2.60,
        shrinkage_percent: 4.00,
        raw_fabric_meters: 520.00,
        fabric_rate: 25.00,
        dyeing_rate: 12.00,
        total_actual_cost: 37.00,
        total_amount: 18500.00,
        remarks: '',
        sample_photo: null,
        status: 'Not Ordered'
      }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newItems = [...items];
        newItems[index].sample_photo = reader.result;
        setItems(newItems);
      };
      reader.readAsDataURL(file);
    }
  };

  // Grand Totals
  const totalMeters = items.reduce((acc, it) => acc + (parseFloat(it.quantity_meters) || 0), 0);
  const totalPieces = items.reduce((acc, it) => acc + (parseInt(it.quantity_pieces, 10) || 0), 0);
  const grandTotalCost = items.reduce((acc, it) => acc + (parseFloat(it.total_amount) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const poPayload = {
      id: initialPO?.id || `PPO-${poNumber}`,
      po_number: poNumber,
      date,
      issue_date: issueDate,
      vendor_id: vendorId,
      vendor_name: vendorName,
      linked_sales_order_id: isOrderLinked ? linkedOrderId : null,
      style_names: styles,
      number_of_styles: numberOfStyles,
      customer_brand_name: customerBrandName,
      delivery_date: deliveryDate,
      terms,
      total_meters: Number(totalMeters.toFixed(2)),
      total_pieces: totalPieces,
      total_estimated_cost: Number(grandTotalCost.toFixed(2)),
      status: initialPO?.status || 'Draft',
      items,
      created_by: initialPO?.created_by || 'Saksham Garg',
      created_at: initialPO?.created_at || new Date().toISOString()
    };
    onSave(poPayload);
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      {/* Header Bar */}
      <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
        <div>
          <h5 className="card-title mb-0 fw-bold text-dark">
            <i className="ti ti-file-invoice me-2 text-primary"></i>
            {isEditingExisting ? (isReadOnly ? `Process PO #${poNumber} (View Mode)` : `Edit Process PO #${poNumber}`) : 'Create New Process Purchase Order (Job Work)'}
          </h5>
          <small className="text-muted">
            {isOrderLinked ? `Linked to Order ${linkedOrderId}` : 'Standalone General Stock Dyeing PO'}
          </small>
        </div>
        <div className="d-flex align-items-center gap-2">
          {isReadOnly ? (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => setIsReadOnly(false)}
            >
              <i className="ti ti-edit me-1"></i> Edit Record
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setIsReadOnly(true)}
            >
              <i className="ti ti-eye me-1"></i> Switch to View Mode
            </button>
          )}
          <button type="button" className="btn btn-light btn-sm border" onClick={onCancel}>
            <i className="ti ti-x me-1"></i> Close
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card-body p-4">
          {/* Section 1: Order Linking & Multi-Style Selector */}
          <div className="p-3 mb-4 rounded border bg-light">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-dark text-uppercase small">
                <i className="ti ti-link me-1 text-primary"></i> 1. Order Link & Style Hierarchy
              </span>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="linkOrderSwitch"
                  checked={isOrderLinked}
                  disabled={isReadOnly}
                  onChange={(e) => setIsOrderLinked(e.target.checked)}
                />
                <label className="form-check-label small fw-semibold" htmlFor="linkOrderSwitch">
                  {isOrderLinked ? 'Linked to Sales Order' : 'Standalone PO (General Stock)'}
                </label>
              </div>
            </div>

            <div className="row g-3">
              {isOrderLinked && (
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Sales Order Reference *</label>
                  <select
                    className="form-select form-select-sm"
                    value={linkedOrderId}
                    disabled={isReadOnly}
                    onChange={(e) => setLinkedOrderId(e.target.value)}
                  >
                    <option value="ORD-2026-001">ORD-2026-001 (Graphic Boota Kurta - 500 Pcs)</option>
                    <option value="ORD-2026-002">ORD-2026-002 (Festive Anarkali - 350 Pcs)</option>
                  </select>
                </div>
              )}

              <div className="col-md-3">
                <label className="form-label small fw-bold">Number of Styles on this PO *</label>
                <select
                  className="form-select form-select-sm"
                  value={numberOfStyles}
                  disabled={isReadOnly}
                  onChange={(e) => handleNumberOfStylesChange(e.target.value)}
                >
                  <option value={1}>1 Style</option>
                  <option value={2}>2 Styles (Bundled)</option>
                  <option value={3}>3 Styles (Bundled)</option>
                </select>
              </div>

              {/* Dynamic Style Inputs with Priority Swap */}
              <div className={isOrderLinked ? "col-md-6" : "col-md-9"}>
                <label className="form-label small fw-bold">Selected Style(s) & Priority Order</label>
                <div className="d-flex flex-wrap gap-2">
                  {styles.map((st, idx) => (
                    <div key={idx} className="input-group input-group-sm" style={{ width: '220px' }}>
                      <span className="input-group-text bg-white fw-bold text-muted">#{idx + 1}</span>
                      <select
                        className="form-select"
                        value={st}
                        disabled={isReadOnly}
                        onChange={(e) => handleStyleChange(idx, e.target.value)}
                      >
                        {availableStyles.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {styles.length > 1 && idx > 0 && !isReadOnly && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Move to top"
                          onClick={() => swapStylesOrder(idx, idx - 1)}
                        >
                          <i className="ti ti-arrow-up"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Header Information */}
          <div className="row g-3 mb-4">
            <div className="col-md-2">
              <label className="form-label small fw-bold">PO Number *</label>
              <input
                type="text"
                className="form-control form-control-sm fw-bold text-primary"
                value={poNumber}
                disabled={isReadOnly}
                onChange={(e) => setPoNumber(e.target.value)}
                required
              />
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-bold">PO Date *</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={date}
                disabled={isReadOnly}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-bold">Issue Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={issueDate}
                disabled={isReadOnly}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-bold">Job Work Vendor *</label>
              <select
                className="form-select form-select-sm"
                value={vendorId}
                disabled={isReadOnly}
                onChange={(e) => {
                  setVendorId(e.target.value);
                  const v = initialVendors.find(vend => vend.id === e.target.value);
                  if (v) setVendorName(v.name);
                }}
              >
                {initialVendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-bold">Delivery Due Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={deliveryDate}
                disabled={isReadOnly}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
          </div>

          {/* Section 3: Line Items Table with Bi-directional calculation */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <span className="fw-bold text-dark text-uppercase small">
                  <i className="ti ti-list-details me-1 text-primary"></i> 2. Fabric & Processing Line Items
                </span>
                <span className="badge bg-light text-muted ms-2 border">
                  Formula: Metres ↔ Pieces via consumption (2.60m/pc default) + 4% shrinkage
                </span>
              </div>
              {!isReadOnly && (
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={addItemRow}>
                  <i className="ti ti-plus me-1"></i> + Add Line Item
                </button>
              )}
            </div>

            <div className="table-responsive border rounded">
              <table className="table table-sm table-bordered align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="table-light text-center">
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Style & Fabric</th>
                    <th style={{ width: '130px' }}>Color</th>
                    <th style={{ width: '90px' }}>Article</th>
                    <th style={{ width: '70px' }}>Width</th>
                    <th style={{ width: '110px' }} className="table-primary text-primary">Metres *</th>
                    <th style={{ width: '100px' }} className="table-info text-info">Pieces *</th>
                    <th style={{ width: '90px' }}>Fab Rate (₹)</th>
                    <th style={{ width: '120px' }}>Dyeing Rate (₹)</th>
                    <th style={{ width: '90px' }}>Total/m (₹)</th>
                    <th style={{ width: '100px' }}>Amount (₹)</th>
                    <th style={{ width: '90px' }}>Sample Photo</th>
                    {!isReadOnly && <th style={{ width: '40px' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="text-center fw-bold">{idx + 1}</td>
                      <td>
                        <div className="fw-semibold text-dark">{item.style_name}</div>
                        <select
                          className="form-select form-select-sm mt-1"
                          value={item.fabric_id}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            const f = availableFabrics.find(fab => fab.id === e.target.value);
                            if (f) {
                              handleItemChange(idx, 'fabric_id', f.id);
                              handleItemChange(idx, 'fabric_name', f.name);
                              handleItemChange(idx, 'fabric_rate', f.defaultRate);
                            }
                          }}
                        >
                          {availableFabrics.map(fab => (
                            <option key={fab.id} value={fab.id}>{fab.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Color Dropdown */}
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={item.color_name}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            const c = availableColors.find(col => col.name === e.target.value);
                            handleItemChange(idx, 'color_name', e.target.value);
                            if (c) handleItemChange(idx, 'color_hex', c.hex);
                          }}
                        >
                          {availableColors.map(col => (
                            <option key={col.id} value={col.name}>{col.name}</option>
                          ))}
                        </select>
                        <div className="d-flex align-items-center gap-1 mt-1">
                          <span
                            className="rounded-circle border"
                            style={{ width: '12px', height: '12px', backgroundColor: item.color_hex || '#ddd' }}
                          ></span>
                          <small className="text-muted" style={{ fontSize: '10px' }}>{item.color_name}</small>
                        </div>
                      </td>

                      {/* Article */}
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm text-center"
                          value={item.article_name || 'Kurta'}
                          disabled={isReadOnly}
                          onChange={(e) => handleItemChange(idx, 'article_name', e.target.value)}
                        />
                      </td>

                      {/* Width */}
                      <td>
                        <select
                          className="form-select form-select-sm text-center"
                          value={item.width || '48'}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            handleItemChange(idx, 'width', e.target.value);
                            applyRecommendedDyeingRate(idx);
                          }}
                        >
                          <option value="44">44"</option>
                          <option value="48">48"</option>
                          <option value="58">58"</option>
                        </select>
                      </td>

                      {/* Metres (Auto-computes pieces) */}
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm text-end fw-bold border-primary"
                          value={item.quantity_meters}
                          disabled={isReadOnly}
                          onChange={(e) => handleItemChange(idx, 'quantity_meters', e.target.value)}
                          placeholder="Mtrs"
                        />
                        <small className="text-muted d-block text-end" style={{ fontSize: '10px' }}>
                          Shrinkage: {item.raw_fabric_meters}m
                        </small>
                      </td>

                      {/* Pieces (Auto-computes metres) */}
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm text-end fw-bold border-info"
                          value={item.quantity_pieces}
                          disabled={isReadOnly}
                          onChange={(e) => handleItemChange(idx, 'quantity_pieces', e.target.value)}
                          placeholder="Pcs"
                        />
                        <small className="text-muted d-block text-end" style={{ fontSize: '10px' }}>
                          @2.60m/pc
                        </small>
                      </td>

                      {/* Fabric Rate */}
                      <td>
                        <input
                          type="number"
                          step="0.5"
                          className="form-control form-control-sm text-end"
                          value={item.fabric_rate}
                          disabled={isReadOnly}
                          onChange={(e) => handleItemChange(idx, 'fabric_rate', e.target.value)}
                        />
                      </td>

                      {/* Dyeing Rate with Recommendation Button */}
                      <td>
                        <div className="input-group input-group-sm">
                          <input
                            type="number"
                            step="0.5"
                            className="form-control text-end"
                            value={item.dyeing_rate}
                            disabled={isReadOnly}
                            onChange={(e) => handleItemChange(idx, 'dyeing_rate', e.target.value)}
                          />
                          {!isReadOnly && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              title="Auto-recommend based on width"
                              onClick={() => applyRecommendedDyeingRate(idx)}
                            >
                              <i className="ti ti-sparkles text-warning"></i>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Total Actual Cost per Metre */}
                      <td className="text-end fw-semibold text-dark">
                        ₹{Number(item.total_actual_cost || 0).toFixed(2)}
                      </td>

                      {/* Line Total Amount */}
                      <td className="text-end fw-bold text-primary">
                        ₹{Number(item.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Sample Photo */}
                      <td className="text-center">
                        {item.sample_photo ? (
                          <div className="position-relative d-inline-block">
                            <img
                              src={item.sample_photo}
                              alt="Sample"
                              className="rounded border"
                              style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                            />
                            {!isReadOnly && (
                              <button
                                type="button"
                                className="btn btn-danger btn-xs position-absolute top-0 end-0 p-0"
                                style={{ width: '16px', height: '16px', lineHeight: 1 }}
                                onClick={() => handleItemChange(idx, 'sample_photo', null)}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ) : (
                          !isReadOnly && (
                            <label className="btn btn-light btn-xs border mb-0" style={{ cursor: 'pointer' }}>
                              <i className="ti ti-camera text-primary"></i>
                              <input
                                type="file"
                                accept="image/*"
                                className="d-none"
                                onChange={(e) => handlePhotoUpload(idx, e)}
                              />
                            </label>
                          )
                        )}
                      </td>

                      {!isReadOnly && (
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-link text-danger p-0"
                            onClick={() => removeItemRow(idx)}
                            disabled={items.length <= 1}
                          >
                            <i className="ti ti-trash"></i>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr className="fw-bold">
                    <td colSpan={5} className="text-end text-uppercase">Totals:</td>
                    <td className="text-end text-primary fs-6">{Number(totalMeters).toFixed(2)} m</td>
                    <td className="text-end text-info fs-6">{totalPieces} pcs</td>
                    <td colSpan={3} className="text-end">Estimated Value:</td>
                    <td className="text-end text-success fs-6">
                      ₹{Number(grandTotalCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td colSpan={!isReadOnly ? 2 : 1}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 4: Terms & Remarks */}
          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label small fw-bold">Terms & Instructions</label>
              <textarea
                className="form-control form-control-sm"
                rows="2"
                value={terms}
                disabled={isReadOnly}
                onChange={(e) => setTerms(e.target.value)}
              ></textarea>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold">Customer / Brand Label</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={customerBrandName}
                disabled={isReadOnly}
                onChange={(e) => setCustomerBrandName(e.target.value)}
              />
              <small className="text-muted">Will appear on printed job work paper format</small>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="card-footer bg-white border-top py-3 d-flex justify-content-between align-items-center">
          <div className="text-muted small">
            <i className="ti ti-user me-1"></i> Created By: <strong>{initialPO?.created_by || 'Saksham Garg'}</strong>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
              Cancel
            </button>
            {!isReadOnly && (
              <button type="submit" className="btn btn-primary btn-sm px-4">
                <i className="ti ti-device-floppy me-1"></i> Save Process PO
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
