import React, { useState, useEffect } from 'react';
import { initialVendors } from '../../data/procurementData';

/**
 * ProcessPOForm - Clean, intuitive, enterprise-grade creation & edit form for Module 3 Process PO
 * All pre-filled dummy data removed: starts completely clean and blank for new entries.
 * Clear Sales Order Reference with zero truncation.
 * Simple, standard Style selection without confusing priority hierarchies.
 * Removed Section 3.1 technical disclaimer notes.
 */
export default function ProcessPOForm({ initialPO, onSave, onCancel, readOnlyDefault = false }) {
  const isEditingExisting = Boolean(initialPO && initialPO.id);
  const [isReadOnly, setIsReadOnly] = useState(readOnlyDefault);

  // Available Sales Orders for rich linking
  const availableSalesOrders = [
    {
      id: 'ORD-2026-001',
      customer: 'Zara India (Inditex Retail)',
      style: 'Graphic Boota Kurta',
      article: 'Kurta',
      targetPcs: 500,
      deliveryDate: '2026-09-10',
      brand: 'Raindrop Signature',
      fabricReq: '100x100 Voile (Grey)',
      status: 'In Production'
    },
    {
      id: 'ORD-2026-002',
      customer: 'FabIndia Overseas',
      style: 'Festive Anarkali Suit',
      article: 'Anarkali Gown',
      targetPcs: 350,
      deliveryDate: '2026-09-18',
      brand: 'Raindrop Heritage',
      fabricReq: 'Rayon 14kg Liva',
      status: 'In Production'
    },
    {
      id: 'ORD-2026-003',
      customer: 'Westside Trends',
      style: 'Festive Silk Kurta Set',
      article: 'Kurta Set',
      targetPcs: 600,
      deliveryDate: '2026-09-25',
      brand: 'Raindrop Studio',
      fabricReq: 'Cotton Cambric 60*60',
      status: 'Planned'
    },
    {
      id: 'ORD-2026-004',
      customer: 'Pantaloons Fashion',
      style: 'Casual Printed Top',
      article: 'Top',
      targetPcs: 450,
      deliveryDate: '2026-10-05',
      brand: 'Raindrop Everyday',
      fabricReq: '100x100 Voile (Grey)',
      status: 'New Order'
    }
  ];

  // Available Master Data for Dropdowns
  const availableStyles = [
    'Graphic Boota Kurta',
    'A-Line Festive Kurta',
    'Printed Anarkali Suit',
    'Straight Cut Kurti',
    'Casual Printed Top',
    'Stock Cambric Plain'
  ];

  const availableFabrics = [
    { id: 'FAB-001', name: '100x100 Voile (Grey)', widths: ['44', '48', '58'], defaultRate: 25.00, shrinkage: 4.0 },
    { id: 'FAB-002', name: 'Rayon 14kg Liva', widths: ['44', '48', '58'], defaultRate: 30.00, shrinkage: 5.0 },
    { id: 'FAB-003', name: 'Cotton Cambric 60*60', widths: ['44', '58'], defaultRate: 42.00, shrinkage: 3.5 }
  ];

  const availableColors = [
    { id: 'COL-001', name: 'Beige', hex: '#F5F5DC' },
    { id: 'COL-002', name: 'Off White', hex: '#FAF9F6' },
    { id: 'COL-003', name: 'Dusty Rose', hex: '#DCAE96' },
    { id: 'COL-004', name: 'Sky Blue', hex: '#87CEEB' },
    { id: 'COL-005', name: 'Sage Green', hex: '#9DC183' },
    { id: 'COL-006', name: 'Mustard Yellow', hex: '#E1AD01' },
    { id: 'COL-007', name: 'Navy Blue', hex: '#000080' },
    { id: 'COL-008', name: 'Maroon', hex: '#800000' }
  ];

  // Quick instruction presets for fast addition to terms
  const instructionPresets = [
    'Strict Swatch Match Required',
    'Zero Weft Distortion',
    'Shrinkage < 4% Mandatory',
    'Color Rub Fastness Grade 4+',
    'Lot Separation for Dye Variance'
  ];

  // Clean empty initial row
  const createEmptyRow = (customStyle = '') => ({
    id: Date.now() + Math.random(),
    style_name: customStyle || '',
    fabric_id: '',
    fabric_name: '',
    color_id: '',
    color_name: '',
    color_hex: '#cbd5e1',
    article_name: '',
    width: '48',
    quantity_meters: '',
    quantity_pieces: '',
    consumption_per_piece: 2.60,
    shrinkage_percent: 4.00,
    raw_fabric_meters: 0,
    fabric_rate: '',
    dyeing_rate: '',
    total_actual_cost: 0,
    total_amount: 0,
    remarks: '',
    sample_photo: null,
    status: 'Not Ordered'
  });

  // Header State - ZERO PRE-FILLED DUMMY DATA!
  const [poNumber, setPoNumber] = useState(
    initialPO?.po_number || `${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [date, setDate] = useState(
    initialPO?.date || new Date().toISOString().split('T')[0]
  );
  const [issueDate, setIssueDate] = useState(
    initialPO?.issue_date || initialPO?.date || new Date().toISOString().split('T')[0]
  );
  const [vendorId, setVendorId] = useState(initialPO?.vendor_id || '');
  const [vendorName, setVendorName] = useState(initialPO?.vendor_name || '');

  // Link to Sales Order or Standalone
  const [isOrderLinked, setIsOrderLinked] = useState(
    initialPO ? Boolean(initialPO.linked_sales_order_id) : true
  );
  const [linkedOrderId, setLinkedOrderId] = useState(
    initialPO?.linked_sales_order_id || ''
  );

  // Style State - Simple and direct
  const [selectedStyle, setSelectedStyle] = useState(
    initialPO?.style_names?.[0] || ''
  );
  const [customerBrandName, setCustomerBrandName] = useState(
    initialPO?.customer_brand_name || ''
  );
  const [deliveryDate, setDeliveryDate] = useState(
    initialPO?.delivery_date || ''
  );
  const [terms, setTerms] = useState(initialPO?.terms || '');

  // Line Items - starts completely empty if not editing
  const [items, setItems] = useState(() => {
    if (initialPO?.items && initialPO.items.length > 0) {
      return initialPO.items;
    }
    return [createEmptyRow()];
  });

  // Find currently selected order details (null if unselected)
  const currentSelectedOrder = availableSalesOrders.find(o => o.id === linkedOrderId) || null;

  // When order changes, suggest brand and style
  const handleSelectOrder = (orderId) => {
    setLinkedOrderId(orderId);
    const ord = availableSalesOrders.find(o => o.id === orderId);
    if (ord) {
      setCustomerBrandName(ord.brand || '');
      setDeliveryDate(ord.deliveryDate || '');
      setSelectedStyle(ord.style || '');
      if (items.length > 0 && !items[0].style_name) {
        const updated = [...items];
        updated[0].style_name = ord.style;
        setItems(updated);
      }
    }
  };

  const handleStyleChange = (styleValue) => {
    setSelectedStyle(styleValue);
    // Update first item's style if it is blank or matches previous style
    if (items.length > 0 && (!items[0].style_name || items[0].style_name === selectedStyle)) {
      const updated = [...items];
      updated[0].style_name = styleValue;
      setItems(updated);
    }
  };

  const handleAddPreset = (preset) => {
    if (!terms.includes(preset)) {
      setTerms(prev => prev ? `${prev} • ${preset}` : preset);
    }
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
      item.quantity_pieces = (meters > 0 && consumption > 0) ? Math.floor(meters / consumption) : '';
      item.raw_fabric_meters = meters > 0 ? Number((meters * (1 + shrinkage / 100)).toFixed(2)) : 0;
    } else if (field === 'quantity_pieces') {
      const pieces = parseInt(value, 10) || 0;
      const calculatedMeters = pieces > 0 ? Number((pieces * consumption).toFixed(2)) : '';
      item.quantity_meters = calculatedMeters;
      item.raw_fabric_meters = calculatedMeters > 0 ? Number((calculatedMeters * (1 + shrinkage / 100)).toFixed(2)) : 0;
    } else if (field === 'consumption_per_piece') {
      const c = parseFloat(value) || 2.60;
      const m = parseFloat(item.quantity_meters) || 0;
      if (m > 0 && c > 0) {
        item.quantity_pieces = Math.floor(m / c);
      }
    }

    // 2. Cost calculations
    const fabRate = parseFloat(item.fabric_rate) || 0;
    const dyeingRate = parseFloat(item.dyeing_rate) || 0;
    const totalUnitCost = fabRate + dyeingRate;
    item.total_actual_cost = Number(totalUnitCost.toFixed(2));

    const totalMtrs = parseFloat(item.quantity_meters) || 0;
    item.total_amount = Number((totalMtrs * totalUnitCost).toFixed(2));

    newItems[index] = item;
    setItems(newItems);
  };

  // Auto-recommend dyeing rate based on width
  const applyRecommendedDyeingRate = (index) => {
    const newItems = [...items];
    const item = newItems[index];
    let recommended = 12.00;
    if (item.width === '44') recommended = 10.00;
    else if (item.width === '48') recommended = 12.00;
    else if (item.width === '58') recommended = 15.00;

    item.dyeing_rate = recommended;
    const fabRate = parseFloat(item.fabric_rate) || 0;
    const totalUnitCost = fabRate + recommended;
    item.total_actual_cost = Number(totalUnitCost.toFixed(2));
    const totalMtrs = parseFloat(item.quantity_meters) || 0;
    item.total_amount = Number((totalMtrs * totalUnitCost).toFixed(2));
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, createEmptyRow(selectedStyle)]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, idx) => idx !== index);
    setItems(newItems);
  };

  const handlePhotoUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleItemChange(index, 'sample_photo', event.target.result);
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
    if (!vendorId) {
      alert('Please select a Job Work Vendor.');
      return;
    }

    const poPayload = {
      id: initialPO?.id || `PPO-${poNumber}`,
      po_number: poNumber,
      date,
      issue_date: issueDate || date,
      vendor_id: vendorId,
      vendor_name: vendorName,
      linked_sales_order_id: (isOrderLinked && linkedOrderId) ? linkedOrderId : null,
      style_names: selectedStyle ? [selectedStyle] : (items.map(it => it.style_name).filter(Boolean)),
      number_of_styles: 1,
      customer_brand_name: customerBrandName,
      delivery_date: deliveryDate,
      terms,
      total_meters: Number(totalMeters.toFixed(2)),
      total_pieces: totalPieces,
      total_estimated_cost: Number(grandTotalCost.toFixed(2)),
      status: initialPO?.status || 'Draft',
      items: items.map(it => ({
        ...it,
        quantity_meters: parseFloat(it.quantity_meters) || 0,
        quantity_pieces: parseInt(it.quantity_pieces, 10) || 0,
        fabric_rate: parseFloat(it.fabric_rate) || 0,
        dyeing_rate: parseFloat(it.dyeing_rate) || 0,
        total_actual_cost: parseFloat(it.total_actual_cost) || 0,
        total_amount: parseFloat(it.total_amount) || 0
      })),
      created_by: initialPO?.created_by || 'Saksham Garg',
      created_at: initialPO?.created_at || new Date().toISOString()
    };
    onSave(poPayload);
  };

  return (
    <div className="card shadow-sm border mb-4" style={{ borderRadius: '12px', borderColor: '#e2e8f0', background: '#ffffff' }}>
      {/* Top Banner Header */}
      <div
        className="card-header bg-white py-3 px-4 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3"
        style={{ borderColor: '#e2e8f0' }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
            style={{
              width: '42px',
              height: '42px',
              background: '#4f46e5',
              color: '#ffffff'
            }}
          >
            <i className="ti ti-file-invoice fs-22"></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="card-title mb-0 fw-bold text-dark fs-18">
                {isEditingExisting
                  ? (isReadOnly ? `Process PO #${poNumber} (View Mode)` : `Edit Process PO #${poNumber}`)
                  : 'Create Process Purchase Order (Job Work)'}
              </h5>
              <span className={`badge rounded-pill px-2.5 py-1 fs-11 fw-bold ${
                initialPO?.status === 'Approved' ? 'bg-success-subtle text-success border border-success-subtle' :
                initialPO?.status === 'Partial Dispatched' ? 'bg-primary-subtle text-primary border border-primary-subtle' :
                'bg-amber-subtle text-warning border border-warning-subtle'
              }`}>
                {initialPO?.status || 'Draft'}
              </span>
            </div>
            <div className="text-muted fs-12 mt-0.5 d-flex align-items-center gap-2">
              <span>Job Work Dyeing & Processing</span>
              <span>•</span>
              <span className="fw-semibold text-primary">
                {isOrderLinked && linkedOrderId ? `Linked to ${linkedOrderId}` : (isOrderLinked ? 'Order Linking (Optional)' : 'Standalone Stock PO')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="d-flex align-items-center gap-2">
          {isReadOnly ? (
            <button
              type="button"
              className="btn btn-primary btn-sm px-3 rounded-2 shadow-xs d-flex align-items-center gap-1.5"
              onClick={() => setIsReadOnly(false)}
            >
              <i className="ti ti-edit fs-15"></i>
              <span>Edit Record</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-3 rounded-2 d-flex align-items-center gap-1.5"
              onClick={() => setIsReadOnly(true)}
            >
              <i className="ti ti-eye fs-15"></i>
              <span>Preview Mode</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-light btn-sm border px-3 rounded-2 d-flex align-items-center gap-1.5 text-secondary"
            onClick={onCancel}
          >
            <i className="ti ti-x fs-15"></i>
            <span>Close</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card-body p-4" style={{ background: '#f8fafc' }}>

          {/* ========================================================================= */}
          {/* SECTION 1: ORDER LINK & STYLE SELECTION (CLEAN, SIMPLE & ATTRACTIVE)       */}
          {/* ========================================================================= */}
          <div
            className="card border mb-4 shadow-sm"
            style={{
              borderRadius: '10px',
              borderColor: '#e2e8f0',
              background: '#ffffff'
            }}
          >
            <div
              className="p-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3"
              style={{
                borderColor: '#e2e8f0',
                background: '#fafbfc'
              }}
            >
              <div className="d-flex align-items-center gap-2.5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'rgba(79, 70, 229, 0.1)',
                    color: '#4f46e5'
                  }}
                >
                  <i className="ti ti-link fs-16"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark fs-14">
                    1. Order Linkage & Style Details
                  </h6>
                  <p className="text-muted fs-11 mb-0">
                    Connect with a Sales Order or create a standalone Job Work PO
                  </p>
                </div>
              </div>

              {/* Segmented Switch */}
              <div
                className="btn-group p-1 rounded-pill border"
                style={{ background: '#f1f5f9', borderColor: '#e2e8f0' }}
              >
                <button
                  type="button"
                  disabled={isReadOnly}
                  className={`btn btn-sm rounded-pill px-3 py-1 transition-all d-flex align-items-center gap-1.5 ${
                    isOrderLinked
                      ? 'btn-primary text-white shadow-sm'
                      : 'text-secondary border-0 bg-transparent'
                  }`}
                  style={{ fontWeight: 600, fontSize: '12px' }}
                  onClick={() => setIsOrderLinked(true)}
                >
                  <i className="ti ti-package fs-14"></i>
                  <span>Linked to Sales Order</span>
                </button>
                <button
                  type="button"
                  disabled={isReadOnly}
                  className={`btn btn-sm rounded-pill px-3 py-1 transition-all d-flex align-items-center gap-1.5 ${
                    !isOrderLinked
                      ? 'btn-dark text-white shadow-sm'
                      : 'text-secondary border-0 bg-transparent'
                  }`}
                  style={{ fontWeight: 600, fontSize: '12px' }}
                  onClick={() => {
                    setIsOrderLinked(false);
                    setLinkedOrderId('');
                  }}
                >
                  <i className="ti ti-building-warehouse fs-14"></i>
                  <span>Standalone PO (General Stock)</span>
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="row g-4 align-items-start">
                
                {/* Sales Order Reference - Clean, spacious, NO truncation, NOT pre-filled */}
                {isOrderLinked ? (
                  <div className="col-lg-6 col-md-12">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1.5 d-flex align-items-center justify-content-between">
                      <span>Sales Order Reference</span>
                      {currentSelectedOrder && (
                        <span className="badge bg-indigo-subtle text-primary border border-indigo-200 fs-10 fw-semibold px-2">
                          {currentSelectedOrder.status}
                        </span>
                      )}
                    </label>

                    <select
                      className="form-select bg-white fs-13"
                      style={{ borderColor: '#cbd5e1', borderRadius: '8px', height: '42px' }}
                      value={linkedOrderId}
                      disabled={isReadOnly}
                      onChange={(e) => handleSelectOrder(e.target.value)}
                    >
                      <option value="">-- Select Sales Order (Optional) --</option>
                      {availableSalesOrders.map((ord) => (
                        <option key={ord.id} value={ord.id}>
                          {ord.id} — {ord.customer} • {ord.style} ({ord.targetPcs} Pcs)
                        </option>
                      ))}
                    </select>

                    {/* Order Details Badge Card - Only displayed when an order is actively chosen */}
                    {currentSelectedOrder && (
                      <div
                        className="mt-2.5 p-3 rounded-3 d-flex flex-column gap-1.5 border"
                        style={{
                          background: '#f8faff',
                          borderColor: '#c7d2fe'
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-primary text-white fs-11 fw-bold px-2 py-0.5">
                              {currentSelectedOrder.id}
                            </span>
                            <span className="fw-bold text-dark fs-13">
                              {currentSelectedOrder.style}
                            </span>
                          </div>
                          <span className="badge bg-white text-primary border border-indigo-200 fs-11 fw-semibold">
                            Target: {currentSelectedOrder.targetPcs} pcs
                          </span>
                        </div>
                        <div className="d-flex flex-wrap align-items-center justify-content-between text-muted fs-11 pt-1 border-top border-indigo-100">
                          <div>
                            <i className="ti ti-user me-1 text-primary"></i>
                            <strong>Client:</strong> {currentSelectedOrder.customer}
                          </div>
                          <div>
                            <i className="ti ti-calendar me-1 text-primary"></i>
                            <strong>Delivery:</strong> {currentSelectedOrder.deliveryDate}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="col-lg-6 col-md-12">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-1.5">
                      Stock Category
                    </label>
                    <div className="p-3 rounded-3 border bg-light d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white"
                        style={{ width: '38px', height: '38px', background: '#334155' }}
                      >
                        <i className="ti ti-building-warehouse fs-18"></i>
                      </div>
                      <div>
                        <div className="fw-bold text-dark fs-13">Buffer Stock Procurement</div>
                        <div className="text-muted fs-11">
                          No order constraint. Fabric rolls will be dyed for warehouse stock pool.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Style Name - Simple, Clean & Intuitive (Replaces confusing priority hierarchy) */}
                <div className="col-lg-6 col-md-12">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1.5 d-flex align-items-center justify-content-between">
                    <span>Style Name</span>
                    <span className="text-muted fs-11">Garment style to be processed</span>
                  </label>

                  <div className="d-flex gap-2">
                    <select
                      className="form-select bg-white fs-13"
                      style={{ borderColor: '#cbd5e1', borderRadius: '8px', height: '42px', flex: '1 1 50%' }}
                      value={selectedStyle}
                      disabled={isReadOnly}
                      onChange={(e) => handleStyleChange(e.target.value)}
                    >
                      <option value="">-- Select Master Style --</option>
                      {availableStyles.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      className="form-control bg-white fs-13"
                      placeholder="Or enter custom style name..."
                      style={{ borderColor: '#cbd5e1', borderRadius: '8px', height: '42px', flex: '1 1 50%' }}
                      value={selectedStyle}
                      disabled={isReadOnly}
                      onChange={(e) => handleStyleChange(e.target.value)}
                    />
                  </div>

                  <small className="text-muted fs-11 mt-1.5 d-block">
                    Choose from predefined style masters or enter custom style name.
                  </small>
                </div>

              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: PO HEADER DETAILS & VENDOR ASSIGNMENT                           */}
          {/* ========================================================================= */}
          <div
            className="card border mb-4 shadow-sm"
            style={{
              borderRadius: '10px',
              borderColor: '#e2e8f0',
              background: '#ffffff'
            }}
          >
            <div
              className="p-3 px-4 border-bottom d-flex align-items-center gap-2.5"
              style={{ borderColor: '#e2e8f0', background: '#fafbfc' }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669'
                }}
              >
                <i className="ti ti-clipboard-text fs-16"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-dark fs-14">
                  2. Purchase Order Details & Processing Vendor
                </h6>
                <p className="text-muted fs-11 mb-0">
                  Assign job worker factory, specify issue dates and delivery schedule
                </p>
              </div>
            </div>

            <div className="p-4">
              <div className="row g-3">
                {/* PO Number */}
                <div className="col-lg-3 col-md-4 col-sm-6">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    PO Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace fw-bold text-primary bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={poNumber}
                    disabled={isReadOnly}
                    onChange={(e) => setPoNumber(e.target.value)}
                    required
                  />
                </div>

                {/* PO Date */}
                <div className="col-lg-3 col-md-4 col-sm-6">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    PO Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={date}
                    disabled={isReadOnly}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                {/* Issue Date */}
                <div className="col-lg-3 col-md-4 col-sm-6">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={issueDate}
                    disabled={isReadOnly}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>

                {/* Delivery Due Date */}
                <div className="col-lg-3 col-md-6 col-sm-6">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Delivery Due Date
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={deliveryDate}
                    disabled={isReadOnly}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>

                {/* Job Work Vendor - Blank by default */}
                <div className="col-lg-6 col-md-6">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Job Work Vendor <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-select-sm bg-white fw-semibold text-dark fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={vendorId}
                    disabled={isReadOnly}
                    onChange={(e) => {
                      const vId = e.target.value;
                      setVendorId(vId);
                      const v = initialVendors.find(vend => vend.id === vId);
                      if (v) setVendorName(`${v.name} (${v.city})`);
                      else setVendorName('');
                    }}
                    required
                  >
                    <option value="">-- Select Job Work Vendor --</option>
                    {initialVendors.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} • {v.city} ({v.type || 'Job Worker'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer / Brand Label */}
                <div className="col-lg-6 col-md-6">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Customer / Brand Label
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white fs-13"
                    placeholder="e.g. Raindrop Signature"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={customerBrandName}
                    disabled={isReadOnly}
                    onChange={(e) => setCustomerBrandName(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: FABRIC & PROCESSING LINE ITEMS (POLISHED & SPACIOUS)           */}
          {/* ========================================================================= */}
          <div
            className="card border mb-4 shadow-sm"
            style={{
              borderRadius: '10px',
              borderColor: '#e2e8f0',
              background: '#ffffff'
            }}
          >
            <div
              className="p-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3"
              style={{ borderColor: '#e2e8f0', background: '#fafbfc' }}
            >
              <div className="d-flex align-items-center gap-2.5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#2563eb'
                  }}
                >
                  <i className="ti ti-layers-linked fs-16"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark fs-14">
                    3. Fabric & Processing Line Items
                  </h6>
                  <p className="text-muted fs-11 mb-0">
                    Bi-directional Metres ↔ Pieces calculation (@2.60 m/pc default) + 4% shrinkage
                  </p>
                </div>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm px-3 rounded-2 d-flex align-items-center gap-1.5 shadow-xs"
                  onClick={addItemRow}
                >
                  <i className="ti ti-plus fs-14"></i>
                  <span>+ Add Line Item</span>
                </button>
              )}
            </div>

            <div className="p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <tr className="text-secondary fw-semibold">
                      <th className="text-center py-2.5" style={{ width: '40px' }}>#</th>
                      <th style={{ minWidth: '220px' }}>Style & Base Fabric</th>
                      <th style={{ width: '160px', minWidth: '160px' }}>Color Shade</th>
                      <th style={{ width: '100px' }} className="text-center">Article</th>
                      <th style={{ width: '85px' }} className="text-center">Width</th>
                      <th style={{ width: '115px' }} className="text-end text-primary">
                        Metres *
                      </th>
                      <th style={{ width: '105px' }} className="text-end text-info">
                        Pieces *
                      </th>
                      <th style={{ width: '95px' }} className="text-end">Fab Rate (₹)</th>
                      <th style={{ width: '125px' }} className="text-end">Dye Rate (₹)</th>
                      <th style={{ width: '95px' }} className="text-end">Total/m (₹)</th>
                      <th style={{ width: '120px' }} className="text-end text-success">Total Amount (₹)</th>
                      <th style={{ width: '70px' }} className="text-center">Swatch</th>
                      {!isReadOnly && <th style={{ width: '45px' }} className="text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="text-center fw-bold text-muted">{idx + 1}</td>
                        
                        {/* Style & Fabric */}
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm fw-semibold fs-12 mb-1"
                            placeholder="Style Name"
                            value={item.style_name || selectedStyle || ''}
                            disabled={isReadOnly}
                            style={{ borderColor: '#cbd5e1', borderRadius: '6px', height: '32px' }}
                            onChange={(e) => handleItemChange(idx, 'style_name', e.target.value)}
                          />
                          <select
                            className="form-select form-select-sm fs-12"
                            value={item.fabric_id}
                            disabled={isReadOnly}
                            style={{ borderColor: '#cbd5e1', borderRadius: '6px', height: '34px' }}
                            onChange={(e) => {
                              const f = availableFabrics.find(fab => fab.id === e.target.value);
                              if (f) {
                                handleItemChange(idx, 'fabric_id', f.id);
                                handleItemChange(idx, 'fabric_name', f.name);
                                handleItemChange(idx, 'fabric_rate', f.defaultRate);
                              } else {
                                handleItemChange(idx, 'fabric_id', '');
                                handleItemChange(idx, 'fabric_name', '');
                                handleItemChange(idx, 'fabric_rate', '');
                              }
                            }}
                          >
                            <option value="">-- Select Fabric --</option>
                            {availableFabrics.map(fab => (
                              <option key={fab.id} value={fab.id}>{fab.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* Color Shade - Spacious with NO text cutting */}
                        <td style={{ minWidth: '160px' }}>
                          <select
                            className="form-select form-select-sm fs-12"
                            value={item.color_name}
                            disabled={isReadOnly}
                            style={{ borderColor: '#cbd5e1', borderRadius: '6px', height: '34px' }}
                            onChange={(e) => {
                              const colVal = e.target.value;
                              const c = availableColors.find(col => col.name === colVal);
                              handleItemChange(idx, 'color_name', colVal);
                              if (c) handleItemChange(idx, 'color_hex', c.hex);
                              else handleItemChange(idx, 'color_hex', '#cbd5e1');
                            }}
                          >
                            <option value="">-- Select Color --</option>
                            {availableColors.map(col => (
                              <option key={col.id} value={col.name}>{col.name}</option>
                            ))}
                          </select>
                          {item.color_name && (
                            <div className="d-flex align-items-center gap-1.5 mt-1">
                              <span
                                className="rounded-circle border shadow-xs"
                                style={{ width: '12px', height: '12px', backgroundColor: item.color_hex || '#cbd5e1', flexShrink: 0 }}
                              ></span>
                              <span className="text-secondary fs-11 fw-medium">{item.color_name}</span>
                            </div>
                          )}
                        </td>

                        {/* Article */}
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm text-center fs-12 px-1"
                            placeholder="e.g. Kurta"
                            value={item.article_name || ''}
                            disabled={isReadOnly}
                            style={{ borderColor: '#cbd5e1', borderRadius: '6px', height: '34px' }}
                            onChange={(e) => handleItemChange(idx, 'article_name', e.target.value)}
                          />
                        </td>

                        {/* Width */}
                        <td>
                          <select
                            className="form-select form-select-sm text-center fs-12 px-1"
                            value={item.width || '48'}
                            disabled={isReadOnly}
                            style={{ borderColor: '#cbd5e1', borderRadius: '6px', height: '34px' }}
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

                        {/* Metres */}
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="form-control form-control-sm text-end fw-bold fs-13 px-1.5"
                            style={{ borderColor: '#3b82f6', color: '#1d4ed8', borderRadius: '6px', height: '34px' }}
                            value={item.quantity_meters}
                            disabled={isReadOnly}
                            onChange={(e) => handleItemChange(idx, 'quantity_meters', e.target.value)}
                          />
                          {item.quantity_meters > 0 && (
                            <small className="text-muted d-block text-end fs-10 mt-0.5">
                              Shrink: {item.raw_fabric_meters}m
                            </small>
                          )}
                        </td>

                        {/* Pieces */}
                        <td>
                          <input
                            type="number"
                            placeholder="0"
                            className="form-control form-control-sm text-end fw-bold fs-13 px-1.5"
                            style={{ borderColor: '#06b6d4', color: '#0e7490', borderRadius: '6px', height: '34px' }}
                            value={item.quantity_pieces}
                            disabled={isReadOnly}
                            onChange={(e) => handleItemChange(idx, 'quantity_pieces', e.target.value)}
                          />
                          {item.quantity_pieces > 0 && (
                            <small className="text-muted d-block text-end fs-10 mt-0.5">
                              @2.60m/pc
                            </small>
                          )}
                        </td>

                        {/* Fab Rate */}
                        <td>
                          <input
                            type="number"
                            step="0.5"
                            placeholder="0.00"
                            className="form-control form-control-sm text-end fs-12 px-1"
                            style={{ borderColor: '#cbd5e1', borderRadius: '6px', height: '34px' }}
                            value={item.fabric_rate}
                            disabled={isReadOnly}
                            onChange={(e) => handleItemChange(idx, 'fabric_rate', e.target.value)}
                          />
                        </td>

                        {/* Dyeing Rate with Auto Recommend */}
                        <td>
                          <div className="input-group input-group-sm">
                            <input
                              type="number"
                              step="0.5"
                              placeholder="0.00"
                              className="form-control text-end fs-12 px-1"
                              style={{ borderColor: '#cbd5e1', height: '34px' }}
                              value={item.dyeing_rate}
                              disabled={isReadOnly}
                              onChange={(e) => handleItemChange(idx, 'dyeing_rate', e.target.value)}
                            />
                            {!isReadOnly && (
                              <button
                                type="button"
                                className="btn btn-outline-warning btn-sm px-1.5"
                                title="Auto-recommend dyeing rate for width"
                                onClick={() => applyRecommendedDyeingRate(idx)}
                              >
                                <i className="ti ti-sparkles text-amber-600"></i>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Total per Metre */}
                        <td className="text-end fw-semibold text-dark fs-13">
                          ₹{Number(item.total_actual_cost || 0).toFixed(2)}
                        </td>

                        {/* Line Total Amount */}
                        <td className="text-end fw-bold text-success fs-13">
                          ₹{Number(item.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Swatch Photo */}
                        <td className="text-center">
                          {item.sample_photo ? (
                            <div className="position-relative d-inline-block">
                              <img
                                src={item.sample_photo}
                                alt="Sample"
                                className="rounded border shadow-xs"
                                style={{ width: '34px', height: '34px', objectFit: 'cover' }}
                              />
                              {!isReadOnly && (
                                <button
                                  type="button"
                                  className="btn btn-danger btn-xs position-absolute top-0 end-0 p-0 rounded-circle"
                                  style={{ width: '16px', height: '16px', lineHeight: 1 }}
                                  onClick={() => handleItemChange(idx, 'sample_photo', null)}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ) : (
                            !isReadOnly && (
                              <label className="btn btn-light btn-xs border mb-0 text-primary" style={{ cursor: 'pointer' }}>
                                <i className="ti ti-camera"></i>
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

                        {/* Delete Row */}
                        {!isReadOnly && (
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-link text-danger p-0"
                              onClick={() => removeItemRow(idx)}
                              disabled={items.length <= 1}
                              title="Delete Item"
                            >
                              <i className="ti ti-trash fs-16"></i>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  
                  {/* Totals Footer Bar */}
                  <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                    <tr className="fw-bold">
                      <td colSpan={5} className="text-end text-uppercase text-secondary py-3 fs-12">
                        Grand Totals:
                      </td>
                      <td className="text-end text-primary fs-14 py-3">
                        {Number(totalMeters).toFixed(2)} m
                      </td>
                      <td className="text-end text-info fs-14 py-3">
                        {totalPieces} pcs
                      </td>
                      <td colSpan={3} className="text-end text-secondary py-3 fs-12">
                        Total Job Work Value:
                      </td>
                      <td className="text-end text-success fs-15 py-3">
                        ₹{Number(grandTotalCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td colSpan={!isReadOnly ? 2 : 1}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: INSTRUCTIONS & TERMS (CLEAN & ELEGANT)                          */}
          {/* ========================================================================= */}
          <div
            className="card border mb-2 shadow-sm"
            style={{
              borderRadius: '10px',
              borderColor: '#e2e8f0',
              background: '#ffffff'
            }}
          >
            <div
              className="p-3 px-4 border-bottom d-flex align-items-center gap-2.5"
              style={{ borderColor: '#e2e8f0', background: '#fafbfc' }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#d97706'
                }}
              >
                <i className="ti ti-notes fs-16"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-dark fs-14">
                  4. Processing Instructions & Quality Compliance
                </h6>
                <p className="text-muted fs-11 mb-0">
                  Specify quality compliance directives, shrinkage tolerance and job work terms
                </p>
              </div>
            </div>

            <div className="p-4">
              <div className="row g-3">
                <div className="col-12">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label fs-12 fw-semibold text-secondary mb-0">
                      Execution Instructions & Terms
                    </label>
                    <div className="d-flex flex-wrap gap-1">
                      {instructionPresets.map((p, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => handleAddPreset(p)}
                          className="badge bg-light text-secondary border hover-bg-primary-subtle transition-all"
                          style={{ cursor: 'pointer', fontSize: '11px', padding: '4px 8px' }}
                        >
                          + {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    className="form-control fs-13"
                    rows="3"
                    placeholder="Enter vendor job work processing instructions, shrinkage tolerances, colorfastness standards..."
                    style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                    value={terms}
                    disabled={isReadOnly}
                    onChange={(e) => setTerms(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bar */}
        <div
          className="card-footer bg-white border-top py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-3"
          style={{ borderColor: '#e2e8f0' }}
        >
          <div className="text-muted fs-12 d-flex align-items-center gap-2">
            <i className="ti ti-user-check text-primary fs-16"></i>
            <span>Created by: <strong>{initialPO?.created_by || 'Saksham Garg'}</strong></span>
          </div>
          
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-light border px-4 rounded-2 text-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                className="btn btn-primary px-4 rounded-2 shadow-sm d-flex align-items-center gap-2"
                style={{ background: '#4f46e5', border: 'none' }}
              >
                <i className="ti ti-device-floppy fs-16"></i>
                <span className="fw-semibold">Save Process PO</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
