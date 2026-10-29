import React, { useState, useEffect } from 'react';
import { initialVendors } from '../../data/procurementData';
import { initialArticles, getStoredColorsMaster, getStoredData } from '../../data/salesOrderData';
import VendorMasterView from '../Procurement/VendorMasterView';
import FabricMasterView from '../Procurement/FabricMasterView';
import AddColorModal from '../Procurement/AddColorModal';

/**
 * ProcessPOForm - Production-ready implementation of PDF Section 3 & 12.1
 * Features:
 * - Master-driven: Fabric, Color, Article, Width directly rendered from system masters
 * - Zero pre-filled defaults on new creation: clean, empty inputs by default
 * - Section titles without 1, 2, 3 numerical prefixes
 * - Modern, executive Style Scope redesign (Single Garment vs Multi-Style Set Combo)
 * - Fixed generous column widths (min-width 1440px): eliminates all squishing/truncation
 * - Strict Workflow Locking: locked read-only when Challan is generated or PO is dispatched
 */
export default function ProcessPOForm({
  initialPO,
  onSave,
  onCancel,
  readOnlyDefault = false,
  onCreateChallan,
  onPrintPO,
  challans = []
}) {
  const isEditingExisting = Boolean(initialPO && initialPO.id);

  // Workflow Locking: PO cannot be edited once a Challan has been created or if status is not Draft
  const isLocked = Boolean(
    initialPO && (
      initialPO.is_locked ||
      initialPO.status === 'Sent to Vendor' ||
      initialPO.status === 'Partially Dispatched' ||
      initialPO.status === 'Completed' ||
      (challans && challans.some(c => c.linked_pos && (
        c.linked_pos.includes(initialPO.id) ||
        c.linked_pos.includes(initialPO.po_number) ||
        c.linked_pos.includes(`PPO-${initialPO.po_number}`)
      )))
    )
  );

  const [isReadOnly, setIsReadOnly] = useState(readOnlyDefault || isLocked);
  const [editingSection, setEditingSection] = useState((readOnlyDefault || initialPO || isLocked) ? null : 'all');

  // Starting Direction Choice
  const [startDirection, setStartDirection] = useState('style');

  // Available Sales Orders
  const availableSalesOrders = [
    {
      id: 'ORD-2026-001',
      customer: 'Zara India (Inditex Retail)',
      brand: 'Raindrop Signature',
      deliveryDate: '2026-09-10',
      status: 'In Production',
      styles: ['Graphic Boota Kurta', 'A-Line Festive Kurta'],
      items: [
        {
          id: 'ORD1-IT1',
          style: 'Graphic Boota Kurta',
          fabric: '100x100 Voile (Grey)',
          fabricId: 'FAB-001',
          color: 'Beige',
          colorHex: '#F5F5DC',
          article: 'Kurta',
          width: '48',
          requiredMeters: 525.00,
          alreadyReceivedMeters: 471.40,
          orderedMeters: 525.00,
          pendingMeters: 0.00,
          status: 'Already Ordered',
          consumption: 2.60,
          shrinkage: 4.0
        },
        {
          id: 'ORD1-IT2',
          style: 'Graphic Boota Kurta',
          fabric: 'Rayon 14kg Liva',
          fabricId: 'FAB-002',
          color: 'Navy Blue',
          colorHex: '#000080',
          article: 'Kurta Set',
          width: '58',
          requiredMeters: 800.00,
          alreadyReceivedMeters: 300.00,
          orderedMeters: 500.00,
          pendingMeters: 300.00,
          status: 'Partially Ordered',
          consumption: 2.80,
          shrinkage: 5.0
        },
        {
          id: 'ORD1-IT3',
          style: 'A-Line Festive Kurta',
          fabric: 'Cotton Cambric 60*60',
          fabricId: 'FAB-003',
          color: 'Dusty Rose',
          colorHex: '#DCAE96',
          article: 'Kurta',
          width: '44',
          requiredMeters: 450.00,
          alreadyReceivedMeters: 0.00,
          orderedMeters: 0.00,
          pendingMeters: 450.00,
          status: 'Not Ordered',
          consumption: 2.50,
          shrinkage: 3.5
        }
      ]
    },
    {
      id: 'ORD-2026-002',
      customer: 'FabIndia Overseas',
      brand: 'Raindrop Ethnic',
      deliveryDate: '2026-09-18',
      status: 'Cutting Ready',
      styles: ['Straight Cut Kurti', 'Casual Printed Top'],
      items: [
        {
          id: 'ORD2-IT1',
          style: 'Straight Cut Kurti',
          fabric: '100x100 Voile (Grey)',
          fabricId: 'FAB-001',
          color: 'White',
          colorHex: '#FFFFFF',
          article: 'Top',
          width: '48',
          requiredMeters: 300.00,
          alreadyReceivedMeters: 0.00,
          orderedMeters: 0.00,
          pendingMeters: 300.00,
          status: 'Not Ordered',
          consumption: 2.20,
          shrinkage: 4.0
        }
      ]
    }
  ];

  // Helper function to read Fabric Master from localStorage
  const loadFabricsFromMaster = () => {
    try {
      const s = localStorage.getItem('raindrop_fabrics_v1');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(f => ({
            id: f.id,
            name: f.qualityName || f.name,
            widths: Array.isArray(f.widths) && f.widths.length > 0 ? f.widths : ['44', '48', '58'],
            shrinkage: parseFloat(f.defaultShrinkage) || 4.0,
            defaultRate: f.defaultRate || ''
          }));
        }
      }
    } catch (e) {}
    return [
      { id: 'FAB-001', name: '100x100 Voile (Grey)', widths: ['44', '48', '58'], defaultRate: '', shrinkage: 4.0 },
      { id: 'FAB-002', name: 'Rayon 14kg Liva', widths: ['44', '48', '58'], defaultRate: '', shrinkage: 5.0 },
      { id: 'FAB-003', name: 'Cotton Cambric 60*60', widths: ['44', '58'], defaultRate: '', shrinkage: 3.5 }
    ];
  };

  // Helper function to read Color Master from localStorage
  const loadColorsFromMaster = () => {
    const list = getStoredColorsMaster();
    if (list && list.length > 0) return list;
    return [
      { id: 'COL-001', name: 'White', hex: '#FFFFFF' },
      { id: 'COL-002', name: 'Black', hex: '#000000' },
      { id: 'COL-003', name: 'Navy Blue', hex: '#000080' },
      { id: 'COL-004', name: 'Beige', hex: '#F5F5DC' },
      { id: 'COL-005', name: 'Dusty Rose', hex: '#DCAE96' }
    ];
  };

  // Helper function to read Article Master from localStorage
  const loadArticlesFromMaster = () => {
    try {
      const s = localStorage.getItem('erp_articles_v1') || localStorage.getItem('erp_articles_master');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(a => ({
            id: a.id || a.articleNo,
            name: a.name || a.articleName || a.title
          })).filter(a => Boolean(a.name));
        }
      }
    } catch (e) {}
    return [
      { id: 'ART-001', name: 'Kurta' },
      { id: 'ART-002', name: 'Pant' },
      { id: 'ART-003', name: 'Dupatta' },
      { id: 'ART-004', name: 'Top' },
      { id: 'ART-005', name: 'Anarkali' },
      { id: 'ART-006', name: 'Pyjama' },
      { id: 'ART-007', name: 'Kurta Set' }
    ];
  };

  // Helper function to read Vendors from localStorage
  const loadVendorsFromMaster = () => {
    try {
      const s = localStorage.getItem('raindrop_vendors_v1');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialVendors;
  };

  // Master State Hooks
  const [vendorList, setVendorList] = useState(loadVendorsFromMaster);
  const [fabricList, setFabricList] = useState(loadFabricsFromMaster);
  const [colorList, setColorList] = useState(loadColorsFromMaster);
  const [articleList, setArticleList] = useState(loadArticlesFromMaster);

  // Sync event listeners for dynamic masters
  useEffect(() => {
    const handleFabricsUpdate = () => setFabricList(loadFabricsFromMaster());
    const handleColorsUpdate = () => setColorList(loadColorsFromMaster());
    const handleArticlesUpdate = () => setArticleList(loadArticlesFromMaster());
    const handleVendorsUpdate = () => setVendorList(loadVendorsFromMaster());

    window.addEventListener('raindrop_fabrics_updated', handleFabricsUpdate);
    window.addEventListener('raindrop_colors_updated', handleColorsUpdate);
    window.addEventListener('erp_colors_updated', handleColorsUpdate);
    window.addEventListener('erp_articles_updated', handleArticlesUpdate);
    window.addEventListener('raindrop_vendors_updated', handleVendorsUpdate);

    return () => {
      window.removeEventListener('raindrop_fabrics_updated', handleFabricsUpdate);
      window.removeEventListener('raindrop_colors_updated', handleColorsUpdate);
      window.removeEventListener('erp_colors_updated', handleColorsUpdate);
      window.removeEventListener('erp_articles_updated', handleArticlesUpdate);
      window.removeEventListener('raindrop_vendors_updated', handleVendorsUpdate);
    };
  }, []);

  // Modal states for inline creation
  const [showInlineVendorModal, setShowInlineVendorModal] = useState(false);
  const [showInlineFabricModal, setShowInlineFabricModal] = useState(false);
  const [showInlineColorModal, setShowInlineColorModal] = useState(false);
  const [activeColorRowIndex, setActiveColorRowIndex] = useState(null);

  // Header State - Zero Pre-filled defaults when creating new
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

  // Order Linkage
  const [isOrderLinked, setIsOrderLinked] = useState(
    initialPO ? Boolean(initialPO.linked_sales_order_id) : false
  );
  const [linkedOrderId, setLinkedOrderId] = useState(
    initialPO?.linked_sales_order_id || ''
  );

  // Style State
  const [styleCountOption, setStyleCountOption] = useState(() => {
    if (initialPO?.style_names && initialPO.style_names.length > 1) return '2+';
    return '1';
  });

  const [selectedStyles, setSelectedStyles] = useState(() => {
    if (initialPO?.style_names && initialPO.style_names.length > 0) {
      return initialPO.style_names;
    }
    return [];
  });

  const [customerBrandName, setCustomerBrandName] = useState(
    initialPO?.customer_brand_name || ''
  );
  const [deliveryDate, setDeliveryDate] = useState(
    initialPO?.delivery_date || ''
  );

  // Terms State - Zero Pre-filled text by default
  const [terms, setTerms] = useState(initialPO?.terms || '');

  // Line Items Template
  const createBlankRow = (customStyle = '') => ({
    id: Date.now() + Math.random(),
    style_name: customStyle || (selectedStyles[0] || ''),
    fabric_id: '',
    fabric_name: '',
    color_id: '',
    color_name: '',
    color_hex: '#cbd5e1',
    article_name: '',
    width: '',
    quantity_meters: '',
    quantity_pieces: '',
    consumption_per_piece: '',
    shrinkage_percent: '',
    raw_fabric_meters: '',
    fabric_rate: '',
    dyeing_rate: '',
    total_actual_cost: '',
    total_amount: '',
    remarks: '',
    sample_photo: null,
    status: 'Not Ordered'
  });

  // Line Items - 1 blank row open by default for new PO
  const [items, setItems] = useState(() => {
    if (initialPO?.items && initialPO.items.length > 0) {
      return initialPO.items;
    }
    return [createBlankRow()];
  });

  const currentSelectedOrder = availableSalesOrders.find(o => o.id === linkedOrderId) || null;

  // Master Style Options (compiled dynamically)
  const masterStyleOptions = Array.from(new Set([
    ...availableSalesOrders.flatMap(o => o.styles || []),
    ...articleList.map(a => a.name),
    'Graphic Boota Kurta',
    'A-Line Festive Kurta',
    'Straight Cut Kurti',
    'Festive Anarkali Suit',
    'Casual Printed Top'
  ])).filter(Boolean);

  // Style handlers
  const handleStyleCountChange = (opt) => {
    if (isLocked) return;
    setStyleCountOption(opt);
    if (opt === '1') {
      setSelectedStyles(selectedStyles.length > 0 ? [selectedStyles[0]] : ['']);
    } else if (selectedStyles.length < 2) {
      setSelectedStyles([selectedStyles[0] || '', '']);
    }
  };

  const handleUpdateStyleAt = (idx, value) => {
    if (isLocked) return;
    const updated = [...selectedStyles];
    updated[idx] = value;
    setSelectedStyles(updated);
  };

  const handleAddStyleSlot = () => {
    if (isLocked) return;
    setSelectedStyles([...selectedStyles, '']);
  };

  const handleRemoveStyleSlot = (idx) => {
    if (isLocked) return;
    if (selectedStyles.length <= 1) {
      setSelectedStyles([]);
    } else {
      setSelectedStyles(selectedStyles.filter((_, i) => i !== idx));
    }
  };

  const handleMoveStyleOrder = (fromIdx, toIdx) => {
    if (isLocked) return;
    if (toIdx < 0 || toIdx >= selectedStyles.length) return;
    const updated = [...selectedStyles];
    const temp = updated[fromIdx];
    updated[fromIdx] = updated[toIdx];
    updated[toIdx] = temp;
    setSelectedStyles(updated);
  };

  // Order selection handler
  const handleSelectOrder = (orderId) => {
    if (isLocked) return;
    setLinkedOrderId(orderId);
    const ord = availableSalesOrders.find(o => o.id === orderId);
    if (ord) {
      if (ord.brand) setCustomerBrandName(ord.brand);
      if (ord.deliveryDate) setDeliveryDate(ord.deliveryDate);
      if (ord.styles && ord.styles.length > 0) {
        setSelectedStyles(ord.styles);
        setStyleCountOption(ord.styles.length > 1 ? '2+' : '1');
      }
    }
  };

  // Section editable helper
  const isSectionEditable = (section) => {
    if (isLocked) return false;
    if (!isReadOnly) return true;
    return editingSection === section || editingSection === 'all';
  };

  // Get available widths for a specific item row from Fabric Master
  const getAvailableWidthsForItem = (item) => {
    if (item.fabric_id) {
      const matched = fabricList.find(f => f.id === item.fabric_id);
      if (matched && Array.isArray(matched.widths) && matched.widths.length > 0) {
        return matched.widths;
      }
    }
    return ['44', '48', '50', '54', '58', '60'];
  };

  // Row update calculation
  const updateItem = (index, updates) => {
    if (isLocked) return;
    const updated = [...items];
    const item = { ...updated[index], ...updates };

    // If fabric changed, lookup master shrinkage and default width
    if (updates.fabric_id && updates.fabric_id !== updated[index].fabric_id) {
      const matchedFab = fabricList.find(f => f.id === updates.fabric_id);
      if (matchedFab) {
        item.shrinkage_percent = matchedFab.shrinkage || 4.0;
        if (!item.width && matchedFab.widths && matchedFab.widths.length > 0) {
          item.width = String(matchedFab.widths[0]).replace(/"/g, '');
        }
      }
    }

    const shrinkage = parseFloat(item.shrinkage_percent) || 0;
    const consumption = parseFloat(item.consumption_per_piece) || 2.60;

    // Bi-directional calculation
    if ('quantity_meters' in updates) {
      const meters = parseFloat(updates.quantity_meters);
      if (!isNaN(meters) && meters > 0) {
        item.quantity_pieces = Math.round(meters / consumption);
        item.raw_fabric_meters = Number((meters * (1 + shrinkage / 100)).toFixed(2));
      } else {
        item.quantity_pieces = '';
        item.raw_fabric_meters = '';
      }
    } else if ('quantity_pieces' in updates) {
      const pcs = parseFloat(updates.quantity_pieces);
      if (!isNaN(pcs) && pcs > 0) {
        const calculatedMeters = Number((pcs * consumption).toFixed(2));
        item.quantity_meters = calculatedMeters;
        item.raw_fabric_meters = Number((calculatedMeters * (1 + shrinkage / 100)).toFixed(2));
      } else {
        item.quantity_meters = '';
        item.raw_fabric_meters = '';
      }
    }

    // Cost calculations
    const fabRate = parseFloat(item.fabric_rate) || 0;
    const dyeRate = parseFloat(item.dyeing_rate) || 0;
    const totalCostPerMeter = fabRate + dyeRate;
    item.total_actual_cost = Number(totalCostPerMeter.toFixed(2));

    const qMeters = parseFloat(item.quantity_meters) || 0;
    item.total_amount = Number((qMeters * totalCostPerMeter).toFixed(2));

    updated[index] = item;
    setItems(updated);
  };

  const addItemRow = () => {
    if (isLocked) return;
    setItems([...items, createBlankRow()]);
  };

  const removeItemRow = (index) => {
    if (isLocked) return;
    const remaining = items.filter((_, i) => i !== index);
    setItems(remaining.length > 0 ? remaining : [createBlankRow()]);
  };

  // Add Item from Order Requirement
  const handleSelectOrderItem = (orderItem) => {
    if (isLocked) return;
    const newRow = {
      id: Date.now() + Math.random(),
      style_name: orderItem.style || selectedStyles[0] || '',
      fabric_id: orderItem.fabricId || 'FAB-001',
      fabric_name: orderItem.fabric || '100x100 Voile (Grey)',
      color_id: 'COL-001',
      color_name: orderItem.color || 'Beige',
      color_hex: orderItem.colorHex || '#F5F5DC',
      article_name: orderItem.article || 'Kurta',
      width: String(orderItem.width || '48').replace(/"/g, ''),
      quantity_meters: orderItem.pendingMeters || orderItem.requiredMeters || '',
      quantity_pieces: Math.round((orderItem.pendingMeters || orderItem.requiredMeters || 0) / (orderItem.consumption || 2.60)) || '',
      consumption_per_piece: orderItem.consumption || 2.60,
      shrinkage_percent: orderItem.shrinkage || 4.0,
      raw_fabric_meters: Number(((orderItem.pendingMeters || orderItem.requiredMeters || 0) * (1 + (orderItem.shrinkage || 4) / 100)).toFixed(2)) || '',
      fabric_rate: '',
      dyeing_rate: '',
      total_actual_cost: 0,
      total_amount: 0,
      remarks: `Linked to Order requirement: ${orderItem.id}`,
      sample_photo: null,
      status: 'Partially Ordered'
    };

    setItems([...items, newRow]);
  };

  // Auto-recommend dyeing rate
  const handleAutoRecommendRate = (index) => {
    if (isLocked) return;
    const item = items[index];
    let recommended = 22.00;
    const w = String(item.width || '').replace(/"/g, '');
    if (w === '58' || w === '60') recommended = 28.50;
    else if (w === '48' || w === '50') recommended = 25.00;
    else if (w === '44') recommended = 22.00;

    updateItem(index, { dyeing_rate: recommended });
  };

  // Standard terms insertion
  const handleInsertStandardTerms = () => {
    if (isLocked) return;
    setTerms('Goods delivered must be strictly as per sample and specification, within stipulated date. Any shade variance or defect exceeding standard tolerance will be subject to reprocessing or debit.');
  };

  // Grand Totals
  const grandTotalMeters = items.reduce((acc, it) => acc + (parseFloat(it.quantity_meters) || 0), 0);
  const grandTotalPieces = items.reduce((acc, it) => acc + (parseInt(it.quantity_pieces, 10) || 0), 0);
  const grandTotalCost = items.reduce((acc, it) => acc + (parseFloat(it.total_amount) || 0), 0);

  // Submit Handler
  const handleSubmit = (andCreateChallan = false) => {
    if (isLocked) return;

    if (!vendorName) {
      alert('Please select or specify a Job Work Vendor.');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one fabric line item.');
      return;
    }

    const payload = {
      id: initialPO?.id || `PPO-${poNumber}`,
      po_number: poNumber,
      date: date,
      issue_date: issueDate,
      vendor_id: vendorId,
      vendor_name: vendorName,
      linked_sales_order_id: isOrderLinked ? linkedOrderId : null,
      customer_brand_name: customerBrandName,
      delivery_date: deliveryDate,
      style_names: selectedStyles.filter(Boolean),
      fabric_quality: items[0]?.fabric_name || '100x100 Voile (Grey)',
      total_meters: Number(grandTotalMeters.toFixed(2)),
      total_pieces: grandTotalPieces,
      total_estimated_cost: Number(grandTotalCost.toFixed(2)),
      status: initialPO?.status || 'Draft',
      terms: terms,
      items: items,
      created_by: 'Saksham Garg',
      created_at: initialPO?.created_at || new Date().toISOString()
    };

    onSave(payload, andCreateChallan);
  };

  return (
    <div className="process-po-form-container">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & WORKFLOW STATUS BAR                                       */}
      {/* ========================================================================= */}
      <div className="card border mb-3 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
        <div className="p-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-light btn-sm border d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2"
              onClick={onCancel}
              style={{ borderColor: '#cbd5e1' }}
            >
              <i className="ti ti-arrow-left fs-14"></i>
              <span className="fw-semibold">Back to PO List</span>
            </button>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0 fw-bold text-dark fs-16">
                  {initialPO ? `Process PO #${poNumber}` : 'New Process PO'}
                </h5>
                <span className={`badge px-2.5 py-1 fs-11 ${
                  isLocked ? 'bg-secondary text-white' : (initialPO?.status === 'Sent to Vendor' ? 'bg-primary-subtle text-primary border' : 'bg-success-subtle text-success border')
                }`}>
                  {isLocked ? '🔒 Locked (Workflow Progressed)' : (initialPO?.status || 'Draft')}
                </span>
              </div>
              <p className="text-muted fs-11 mb-0">Job Work Procurement &amp; Fabric Dyeing Order</p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {initialPO && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3 d-flex align-items-center gap-1.5 rounded-2 shadow-xs"
                onClick={() => onPrintPO && onPrintPO(initialPO)}
              >
                <i className="ti ti-printer fs-14"></i>
                <span>Print Slip</span>
              </button>
            )}

            {!isLocked && (
              <>
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-3.5 d-flex align-items-center gap-1.5 rounded-2 shadow-xs"
                  onClick={() => handleSubmit(false)}
                >
                  <i className="ti ti-device-floppy fs-14"></i>
                  <span className="fw-semibold">Save PO</span>
                </button>

                <button
                  type="button"
                  className="btn btn-dark btn-sm px-3.5 d-flex align-items-center gap-1.5 rounded-2 shadow-xs"
                  onClick={() => handleSubmit(true)}
                  title="Saves this PO and immediately opens Dispatch Challan"
                >
                  <i className="ti ti-truck-delivery fs-14"></i>
                  <span className="fw-semibold">Save &amp; Create Challan</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* WORKFLOW LOCK BANNER (If Record is Locked)                                */}
      {/* ========================================================================= */}
      {isLocked && (
        <div className="alert alert-warning border-warning d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 shadow-xs">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-warning text-dark p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              <i className="ti ti-lock fs-20"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-dark fs-14">PO Workflow Locked — Read Only</h6>
              <p className="mb-0 fs-12 text-secondary">
                This Process PO has already progressed in the workflow (Challan Dispatched / Sent to Vendor). In accordance with ERP audit rules, modifications to this PO are permanently disabled.
              </p>
            </div>
          </div>
          <span className="badge bg-warning text-dark fs-12 px-3 py-2 fw-bold">
            <i className="ti ti-lock me-1"></i> LOCKED
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: BASIC DETAILS & PROCESS TYPE                                     */}
      {/* ========================================================================= */}
      <div className="card border mb-4 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
        <div className="p-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: '#fafbfc' }}>
          <div className="d-flex align-items-center gap-2.5">
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
              <i className="ti ti-file-description fs-16"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-dark fs-14">Basic Details &amp; Process Type</h6>
              <p className="text-muted fs-11 mb-0">Header information, Job Work Dyeing Vendor &amp; optional Sales Order Link</p>
            </div>
          </div>

          {!isLocked && isReadOnly && editingSection !== 'header' && (
            <button
              type="button"
              className="btn btn-light btn-sm border text-primary px-2.5 py-1 rounded fs-12 fw-semibold"
              onClick={() => setEditingSection('header')}
            >
              <i className="ti ti-edit me-1"></i> Edit Header
            </button>
          )}
          {!isLocked && isReadOnly && editingSection === 'header' && (
            <button
              type="button"
              className="btn btn-success btn-sm px-2.5 py-1 rounded fs-12 fw-semibold"
              onClick={() => setEditingSection(null)}
            >
              <i className="ti ti-check me-1"></i> Done
            </button>
          )}
        </div>

        <div className="p-4">
          <div className="row g-3">
            {/* PO Number */}
            <div className="col-md-3">
              <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                Process PO Number <span className="text-danger">*</span>
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted border-end-0 font-monospace">PPO-</span>
                <input
                  type="text"
                  className="form-control form-control-sm bg-white font-monospace fw-bold text-dark fs-13"
                  style={{ borderColor: '#cbd5e1', height: '36px' }}
                  value={poNumber}
                  disabled={!isSectionEditable('header')}
                  onChange={(e) => setPoNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Date */}
            <div className="col-md-3">
              <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                PO Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className="form-control form-control-sm bg-white fs-13"
                style={{ borderColor: '#cbd5e1', height: '36px' }}
                value={date}
                disabled={!isSectionEditable('header')}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Job Work Vendor */}
            <div className="col-md-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label fs-12 fw-semibold text-secondary mb-0">
                  Dyeing / Processing Vendor <span className="text-danger">*</span>
                </label>
                {isSectionEditable('header') && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-primary text-decoration-none fs-11"
                    onClick={() => setShowInlineVendorModal(true)}
                  >
                    + New Vendor
                  </button>
                )}
              </div>
              <select
                className="form-select form-select-sm bg-white fs-13"
                style={{ borderColor: '#cbd5e1', height: '36px' }}
                value={vendorName}
                disabled={!isSectionEditable('header')}
                onChange={(e) => {
                  setVendorName(e.target.value);
                  const matched = vendorList.find(v => (v.name || v.vendorName) === e.target.value);
                  if (matched) setVendorId(matched.id || '');
                }}
              >
                <option value="">-- Select Dyeing Vendor --</option>
                {vendorList.map(v => (
                  <option key={v.id || v.name} value={v.name || v.vendorName}>
                    {v.name || v.vendorName}
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery Date */}
            <div className="col-md-3">
              <label className="form-label fs-12 fw-semibold text-secondary mb-1">Target Delivery Date</label>
              <input
                type="date"
                className="form-control form-control-sm bg-white fs-13"
                style={{ borderColor: '#cbd5e1', height: '36px' }}
                value={deliveryDate}
                disabled={!isSectionEditable('header')}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>

            {/* Link Sales Order Toggle */}
            <div className="col-md-6 mt-3">
              <div className="p-3 border rounded bg-light d-flex align-items-center justify-content-between" style={{ borderColor: '#e2e8f0' }}>
                <div>
                  <span className="fw-semibold text-dark fs-13 d-block">Link to Sales Order</span>
                  <small className="text-muted fs-11">Automatically tracks Required vs Received balance per Order</small>
                </div>
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="linkOrderSwitch"
                    style={{ width: '38px', height: '20px', cursor: 'pointer' }}
                    checked={isOrderLinked}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => {
                      setIsOrderLinked(e.target.checked);
                      if (!e.target.checked) setLinkedOrderId('');
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Order Select Dropdown (If Linked) */}
            <div className="col-md-6 mt-3">
              {isOrderLinked ? (
                <div>
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                    Select Sales Order to Link <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-select-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '36px' }}
                    value={linkedOrderId}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => handleSelectOrder(e.target.value)}
                  >
                    <option value="">-- Select Order --</option>
                    {availableSalesOrders.map(ord => (
                      <option key={ord.id} value={ord.id}>
                        {ord.id} — {ord.customer} ({ord.brand || 'Raindrop'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">Customer / Brand Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white fs-13"
                    placeholder="Enter brand or customer reference..."
                    style={{ borderColor: '#cbd5e1', height: '36px' }}
                    value={customerBrandName}
                    disabled={!isSectionEditable('header')}
                    onChange={(e) => setCustomerBrandName(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: STYLE SCOPE & GARMENT ASSOCIATION                                */}
      {/* ========================================================================= */}
      <div className="card border mb-4 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
        <div className="p-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: '#fafbfc' }}>
          <div className="d-flex align-items-center gap-2.5">
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <i className="ti ti-hanger fs-16"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-dark fs-14">Style Scope &amp; Garment Association</h6>
              <p className="text-muted fs-11 mb-0">Define single garment style or multi-piece combo set (Top, Bottom, Layer)</p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Redesigned Style Count Selector */}
            <div className="btn-group btn-group-sm p-1 bg-light border rounded-2" style={{ borderColor: '#e2e8f0' }}>
              <button
                type="button"
                disabled={!isSectionEditable('styles')}
                className={`btn btn-sm px-3 rounded-1 d-flex align-items-center gap-1.5 ${
                  styleCountOption === '1' ? 'btn-primary text-white shadow-xs fw-semibold' : 'btn-light text-secondary border-0'
                }`}
                onClick={() => handleStyleCountChange('1')}
              >
                <i className="ti ti-shirt fs-13"></i>
                <span>Single Style</span>
              </button>
              <button
                type="button"
                disabled={!isSectionEditable('styles')}
                className={`btn btn-sm px-3 rounded-1 d-flex align-items-center gap-1.5 ${
                  styleCountOption === '2+' ? 'btn-primary text-white shadow-xs fw-semibold' : 'btn-light text-secondary border-0'
                }`}
                onClick={() => handleStyleCountChange('2+')}
              >
                <i className="ti ti-layers-subtract fs-13"></i>
                <span>Multi-Style Set (Combo)</span>
              </button>
            </div>

            {!isLocked && isReadOnly && editingSection !== 'styles' && (
              <button
                type="button"
                className="btn btn-light btn-sm border text-primary px-2.5 py-1 rounded fs-12 fw-semibold"
                onClick={() => setEditingSection('styles')}
              >
                <i className="ti ti-edit me-1"></i> Edit Styles
              </button>
            )}
            {!isLocked && isReadOnly && editingSection === 'styles' && (
              <button
                type="button"
                className="btn btn-success btn-sm px-2.5 py-1 rounded fs-12 fw-semibold"
                onClick={() => setEditingSection(null)}
              >
                <i className="ti ti-check me-1"></i> Done
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          {/* Dynamic Style Inputs */}
          {styleCountOption === '1' ? (
            /* Single Style Layout */
            <div className="p-3 border rounded-3 bg-light-subtle" style={{ borderColor: '#e2e8f0' }}>
              <label className="form-label fs-12 fw-semibold text-secondary mb-2 d-flex align-items-center justify-content-between">
                <span>Garment Style Name</span>
                <span className="badge bg-indigo-subtle text-primary border border-indigo-200 fs-11">
                  🎯 Primary Style
                </span>
              </label>
              <div className="row g-2 align-items-center">
                <div className="col-md-6">
                  <select
                    className="form-select form-select-sm bg-white fs-13"
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={selectedStyles[0] || ''}
                    disabled={!isSectionEditable('styles')}
                    onChange={(e) => handleUpdateStyleAt(0, e.target.value)}
                  >
                    <option value="">-- Choose Style from Masters / Order --</option>
                    {masterStyleOptions.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white fs-13"
                    placeholder="Or type custom style name here..."
                    style={{ borderColor: '#cbd5e1', height: '38px', borderRadius: '6px' }}
                    value={selectedStyles[0] || ''}
                    disabled={!isSectionEditable('styles')}
                    onChange={(e) => handleUpdateStyleAt(0, e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Multi-Style Combo Set Layout */
            <div>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fs-12 fw-semibold text-secondary">
                  Combo Set Components (Sets Top vs Bottom display order priority)
                </span>
                {isSectionEditable('styles') && (
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded fs-12 d-flex align-items-center gap-1"
                    onClick={handleAddStyleSlot}
                  >
                    <i className="ti ti-plus fs-13"></i>
                    <span>Add Component</span>
                  </button>
                )}
              </div>

              <div className="d-flex flex-column gap-2.5">
                {selectedStyles.map((styleVal, sIdx) => {
                  const roleLabel = sIdx === 0 ? 'Top / Upper Garment' : (sIdx === 1 ? 'Bottom / Lower Garment' : 'Layer / Accent');
                  return (
                    <div
                      key={sIdx}
                      className="p-3 border rounded-3 bg-white d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-2xs"
                      style={{ borderColor: '#e2e8f0' }}
                    >
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: '180px' }}>
                        <span className="badge bg-primary text-white px-2.5 py-1.5 fs-11 font-monospace rounded-pill">
                          #{sIdx + 1}
                        </span>
                        <div>
                          <span className="fw-semibold text-dark fs-13 d-block">{roleLabel}</span>
                          <small className="text-muted fs-11">Display priority {sIdx + 1}</small>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: '300px' }}>
                        <select
                          className="form-select form-select-sm bg-white fs-13 flex-grow-1"
                          style={{ borderColor: '#cbd5e1', height: '36px', borderRadius: '6px' }}
                          value={styleVal}
                          disabled={!isSectionEditable('styles')}
                          onChange={(e) => handleUpdateStyleAt(sIdx, e.target.value)}
                        >
                          <option value="">-- Choose from Master --</option>
                          {masterStyleOptions.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>

                        <input
                          type="text"
                          className="form-control form-control-sm bg-white fs-13 flex-grow-1"
                          placeholder="Or type custom name..."
                          style={{ borderColor: '#cbd5e1', height: '36px', borderRadius: '6px' }}
                          value={styleVal}
                          disabled={!isSectionEditable('styles')}
                          onChange={(e) => handleUpdateStyleAt(sIdx, e.target.value)}
                        />
                      </div>

                      {/* Display Order Controls (Top/Bottom) */}
                      {isSectionEditable('styles') && (
                        <div className="d-flex align-items-center gap-1.5">
                          <button
                            type="button"
                            className="btn btn-light btn-sm border px-2 py-1 rounded"
                            disabled={sIdx === 0}
                            title="Move to Higher Priority"
                            onClick={() => handleMoveStyleOrder(sIdx, sIdx - 1)}
                          >
                            <i className="ti ti-arrow-up fs-13 text-secondary"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-light btn-sm border px-2 py-1 rounded"
                            disabled={sIdx === selectedStyles.length - 1}
                            title="Move to Lower Priority"
                            onClick={() => handleMoveStyleOrder(sIdx, sIdx + 1)}
                          >
                            <i className="ti ti-arrow-down fs-13 text-secondary"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-light btn-sm border text-danger px-2 py-1 rounded"
                            title="Remove this component"
                            onClick={() => handleRemoveStyleSlot(sIdx)}
                          >
                            <i className="ti ti-trash fs-13"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Linked Sales Order Item Selection Matrix */}
          {isOrderLinked && currentSelectedOrder && (
            <div className="mt-4 p-3 border rounded-3 bg-light" style={{ borderColor: '#e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fs-12 fw-bold text-dark d-flex align-items-center gap-1.5">
                  <i className="ti ti-clipboard-list text-primary"></i>
                  Fabric Requirements for {currentSelectedOrder.id} ({currentSelectedOrder.customer})
                </span>
                <span className="badge bg-white text-secondary border fs-11">
                  Required vs Received Balance
                </span>
              </div>

              <div className="table-responsive">
                <table className="table table-sm table-bordered bg-white align-middle mb-0" style={{ fontSize: '12px' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Style</th>
                      <th>Fabric Quality</th>
                      <th>Color</th>
                      <th>Article</th>
                      <th>Width</th>
                      <th className="text-end">Required (m)</th>
                      <th className="text-end">Already Received (m)</th>
                      <th className="text-end">Pending (m)</th>
                      <th className="text-center">Status</th>
                      <th className="text-center" style={{ width: '90px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSelectedOrder.items.map((ordIt) => {
                      const isFullyOrdered = ordIt.status === 'Already Ordered' || ordIt.pendingMeters <= 0;
                      return (
                        <tr key={ordIt.id} className={isFullyOrdered ? 'table-light text-muted' : ''}>
                          <td className="fw-medium">{ordIt.style}</td>
                          <td>{ordIt.fabric}</td>
                          <td>
                            <span className="d-inline-flex align-items-center gap-1">
                              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: ordIt.colorHex, border: '1px solid #999' }} />
                              {ordIt.color}
                            </span>
                          </td>
                          <td>{ordIt.article}</td>
                          <td>{ordIt.width}"</td>
                          <td className="text-end fw-semibold">{ordIt.requiredMeters.toFixed(2)}</td>
                          <td className="text-end text-success">{ordIt.alreadyReceivedMeters.toFixed(2)}</td>
                          <td className="text-end fw-bold text-primary">{ordIt.pendingMeters.toFixed(2)}</td>
                          <td className="text-center">
                            {isFullyOrdered ? (
                              <span className="badge bg-secondary-subtle text-secondary border fs-10">
                                🔒 Already Ordered
                              </span>
                            ) : (
                              <span className="badge bg-warning-subtle text-warning border fs-10">
                                Partially Ordered
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            {isFullyOrdered ? (
                              <button type="button" className="btn btn-sm btn-light border py-0 px-2 fs-11 text-muted" disabled>
                                Locked
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isLocked}
                                className="btn btn-sm btn-outline-primary py-0 px-2 fs-11 fw-semibold"
                                onClick={() => handleSelectOrderItem(ordIt)}
                              >
                                <i className="ti ti-plus me-1"></i> Select
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: FABRIC & PROCESSING LINE ITEMS (SQUISH-PROOF MIN-WIDTH 1440PX)   */}
      {/* ========================================================================= */}
      <div className="card border mb-4 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
        <div className="p-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: '#fafbfc' }}>
          <div className="d-flex align-items-center gap-2.5">
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
              <i className="ti ti-layers-linked fs-16"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-dark fs-14">Fabric &amp; Processing Line Items</h6>
              <p className="text-muted fs-11 mb-0">Bi-directional calculation, shrinkage %, dyeing rate recommendation &amp; swatch</p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {!isLocked && isSectionEditable('items') && (
              <button
                type="button"
                className="btn btn-primary btn-sm px-3 rounded-2 d-flex align-items-center gap-1.5 shadow-xs"
                onClick={addItemRow}
              >
                <i className="ti ti-plus fs-14"></i>
                <span>Add Manual Line Item</span>
              </button>
            )}

            {!isLocked && isReadOnly && editingSection !== 'items' && (
              <button
                type="button"
                className="btn btn-light btn-sm border text-primary px-2.5 py-1 rounded fs-12 fw-semibold"
                onClick={() => setEditingSection('items')}
              >
                <i className="ti ti-edit me-1"></i> Edit Items
              </button>
            )}
            {!isLocked && isReadOnly && editingSection === 'items' && (
              <button
                type="button"
                className="btn btn-success btn-sm px-2.5 py-1 rounded fs-12 fw-semibold"
                onClick={() => setEditingSection(null)}
              >
                <i className="ti ti-check me-1"></i> Done
              </button>
            )}
          </div>
        </div>

        <div className="p-0">
          {/* Table Responsive Wrapper with Min-Width Guarantee */}
          <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table
              className="table table-bordered align-middle mb-0"
              style={{ minWidth: '1440px', tableLayout: 'fixed', fontSize: '13px' }}
            >
              <thead style={{ background: '#f8fafc' }}>
                <tr style={{ color: '#475569', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th className="text-center py-2" style={{ width: '45px' }}>#</th>
                  <th style={{ width: '240px' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <span>FABRIC QUALITY *</span>
                      {!isLocked && isSectionEditable('items') && (
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 text-primary text-decoration-none fs-11"
                          onClick={() => setShowInlineFabricModal(true)}
                        >
                          + New
                        </button>
                      )}
                    </div>
                  </th>
                  <th style={{ width: '220px' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <span>COLOR SHADE *</span>
                      {!isLocked && isSectionEditable('items') && (
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 text-primary text-decoration-none fs-11"
                          onClick={() => {
                            setActiveColorRowIndex(0);
                            setShowInlineColorModal(true);
                          }}
                        >
                          + New
                        </button>
                      )}
                    </div>
                  </th>
                  <th style={{ width: '170px' }}>ARTICLE</th>
                  <th style={{ width: '110px' }}>WIDTH</th>
                  <th style={{ width: '120px' }} className="text-end text-primary">METRES *</th>
                  <th style={{ width: '110px' }} className="text-end text-dark">PIECES *</th>
                  <th style={{ width: '110px' }} className="text-end">FAB RATE (₹)</th>
                  <th style={{ width: '135px' }} className="text-end">DYE RATE (₹)</th>
                  <th style={{ width: '110px' }} className="text-end">TOTAL/M (₹)</th>
                  <th style={{ width: '130px' }} className="text-end text-success">TOTAL AMOUNT (₹)</th>
                  <th style={{ width: '75px' }} className="text-center">SWATCH</th>
                  {!isLocked && isSectionEditable('items') && (
                    <th style={{ width: '50px' }} className="text-center">ACT</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={!isLocked && isSectionEditable('items') ? 13 : 12} className="text-center py-5 bg-white">
                      <div className="py-4">
                        <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center p-3 mb-2 text-muted" style={{ width: '54px', height: '54px' }}>
                          <i className="ti ti-layers-linked fs-24"></i>
                        </div>
                        <h6 className="fw-semibold text-dark fs-14 mb-1">No Line Items Added Yet</h6>
                        <p className="text-muted fs-12 mb-3">Click "+ Add Manual Line Item" or select requirements from a linked Sales Order above.</p>
                        {!isLocked && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm px-3 shadow-xs"
                            onClick={addItemRow}
                          >
                            <i className="ti ti-plus me-1"></i> Add First Line Item
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const rowWidthOptions = getAvailableWidthsForItem(item);

                    return (
                      <tr key={item.id || idx}>
                        <td className="text-center fw-bold text-muted">{idx + 1}</td>

                        {/* Fabric Quality from Master */}
                        <td>
                          <select
                            className="form-select form-select-sm fs-13 bg-white w-100"
                            value={item.fabric_id || ''}
                            disabled={!isSectionEditable('items')}
                            style={{ borderColor: '#cbd5e1', height: '36px' }}
                            onChange={(e) => {
                              const f = fabricList.find(fab => fab.id === e.target.value);
                              if (f) {
                                updateItem(idx, {
                                  fabric_id: f.id,
                                  fabric_name: f.name,
                                  shrinkage_percent: f.shrinkage || 4.0
                                });
                              } else {
                                updateItem(idx, { fabric_id: '', fabric_name: '' });
                              }
                            }}
                          >
                            <option value="">-- Select Fabric from Master --</option>
                            {fabricList.map(fab => (
                              <option key={fab.id} value={fab.id}>{fab.name}</option>
                            ))}
                          </select>
                          <div className="text-muted fs-11 mt-1 text-truncate">
                            Style: <strong className="text-dark">{item.style_name || selectedStyles[0] || 'Standard'}</strong>
                          </div>
                        </td>

                        {/* Color Shade from Master */}
                        <td>
                          <div className="d-flex align-items-center bg-white border rounded px-2 w-100" style={{ borderColor: '#cbd5e1', height: '36px' }}>
                            <span style={{ width: '16px', height: '16px', borderRadius: '3px', background: item.color_hex || '#cbd5e1', marginRight: '8px', border: '1px solid #999', flexShrink: 0 }} />
                            <select
                              className="border-0 p-0 fs-13 bg-transparent text-dark fw-medium w-100"
                              style={{ outline: 'none' }}
                              value={item.color_name || ''}
                              disabled={!isSectionEditable('items')}
                              onChange={(e) => {
                                const c = colorList.find(col => col.name === e.target.value);
                                if (c) {
                                  updateItem(idx, { color_id: c.id, color_name: c.name, color_hex: c.hex || '#cbd5e1' });
                                } else {
                                  updateItem(idx, { color_name: e.target.value });
                                }
                              }}
                            >
                              <option value="">Select Color from Master...</option>
                              {colorList.map(c => (
                                <option key={c.id || c.name} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* Article from Master */}
                        <td>
                          <select
                            className="form-select form-select-sm bg-white fs-13 w-100"
                            style={{ borderColor: '#cbd5e1', height: '36px' }}
                            value={item.article_name || ''}
                            disabled={!isSectionEditable('items')}
                            onChange={(e) => updateItem(idx, { article_name: e.target.value })}
                          >
                            <option value="">Select Article...</option>
                            {articleList.map(a => (
                              <option key={a.id || a.name} value={a.name}>{a.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* Width from Fabric Master */}
                        <td>
                          <select
                            className="form-select form-select-sm bg-white fs-13 w-100"
                            style={{ borderColor: '#cbd5e1', height: '36px' }}
                            value={item.width || ''}
                            disabled={!isSectionEditable('items')}
                            onChange={(e) => updateItem(idx, { width: e.target.value })}
                          >
                            <option value="">Width</option>
                            {rowWidthOptions.map(w => {
                              const cleanW = String(w).replace(/"/g, '');
                              return <option key={cleanW} value={cleanW}>{cleanW}"</option>;
                            })}
                          </select>
                        </td>

                        {/* Metres */}
                        <td>
                          <input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            className="form-control form-control-sm text-end fw-semibold text-primary bg-white fs-13 w-100"
                            style={{ borderColor: '#cbd5e1', height: '36px' }}
                            value={item.quantity_meters}
                            disabled={!isSectionEditable('items')}
                            onChange={(e) => updateItem(idx, { quantity_meters: e.target.value })}
                          />
                          {parseFloat(item.quantity_meters) > 0 && (
                            <div className="text-muted text-end fs-10 mt-0.5">
                              Raw: {item.raw_fabric_meters}m ({item.shrinkage_percent}%)
                            </div>
                          )}
                        </td>

                        {/* Pieces (Calculated / Editable) */}
                        <td>
                          <input
                            type="number"
                            placeholder="0"
                            className="form-control form-control-sm text-end fw-semibold text-dark bg-white fs-13 w-100"
                            style={{ borderColor: '#cbd5e1', height: '36px' }}
                            value={item.quantity_pieces}
                            disabled={!isSectionEditable('items')}
                            onChange={(e) => updateItem(idx, { quantity_pieces: e.target.value })}
                          />
                          <div className="text-muted text-end fs-10 mt-0.5">@2.60m/pc</div>
                        </td>

                        {/* Fabric Rate */}
                        <td>
                          <input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            className="form-control form-control-sm text-end bg-white fs-13 w-100"
                            style={{ borderColor: '#cbd5e1', height: '36px' }}
                            value={item.fabric_rate}
                            disabled={!isSectionEditable('items')}
                            onChange={(e) => updateItem(idx, { fabric_rate: e.target.value })}
                          />
                        </td>

                        {/* Dyeing Rate with Auto-Recommend Button */}
                        <td>
                          <div className="input-group input-group-sm w-100">
                            <input
                              type="number"
                              step="any"
                              placeholder="0.00"
                              className="form-control form-control-sm text-end bg-white fs-13"
                              style={{ borderColor: '#cbd5e1', height: '36px' }}
                              value={item.dyeing_rate}
                              disabled={!isSectionEditable('items')}
                              onChange={(e) => updateItem(idx, { dyeing_rate: e.target.value })}
                            />
                            {!isLocked && isSectionEditable('items') && (
                              <button
                                type="button"
                                className="btn btn-outline-secondary px-2"
                                title="Auto-recommend dyeing rate based on Width"
                                onClick={() => handleAutoRecommendRate(idx)}
                              >
                                <i className="ti ti-wand fs-13"></i>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Total per Metre */}
                        <td className="text-end fw-semibold text-dark fs-13">
                          ₹{Number(item.total_actual_cost || 0).toFixed(2)}
                        </td>

                        {/* Total Line Amount */}
                        <td className="text-end fw-bold text-success fs-13">
                          ₹{Number(item.total_amount || 0).toFixed(2)}
                        </td>

                        {/* Swatch Photo Upload / Camera */}
                        <td className="text-center">
                          <label className={`btn btn-sm btn-light border p-1 rounded-2 mb-0 ${isLocked ? 'disabled' : ''}`} style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }} title="Capture / Upload Fabric Swatch">
                            <i className={`ti ${item.sample_photo ? 'ti-photo-check text-success' : 'ti-camera text-muted'} fs-15`}></i>
                            {!isLocked && (
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="d-none"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (re) => updateItem(idx, { sample_photo: re.target.result });
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            )}
                          </label>
                        </td>

                        {/* Action: Delete Row */}
                        {!isLocked && isSectionEditable('items') && (
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-link btn-sm text-danger p-0 text-decoration-none"
                              title="Delete row"
                              onClick={() => removeItemRow(idx)}
                            >
                              <i className="ti ti-trash fs-14"></i>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                  <tr>
                    <td colSpan={5} className="text-end text-secondary fs-12 py-2">
                      GRAND TOTALS:
                    </td>
                    <td className="text-end text-primary fs-13 py-2">
                      {grandTotalMeters.toFixed(2)} m
                    </td>
                    <td className="text-end text-dark fs-13 py-2">
                      {grandTotalPieces} pcs
                    </td>
                    <td colSpan={2} className="text-end text-secondary fs-12 py-2">
                      Total Actual Job Cost:
                    </td>
                    <td colSpan={2} className="text-end text-success fs-14 py-2">
                      ₹{grandTotalCost.toFixed(2)}
                    </td>
                    <td colSpan={!isLocked && isSectionEditable('items') ? 2 : 1}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Running PO Summary Table below items */}
        {items.length > 0 && (
          <div className="p-3 border-top bg-light" style={{ borderColor: '#e2e8f0' }}>
            <span className="fs-11 fw-bold text-secondary text-uppercase d-block mb-1.5">
              <i className="ti ti-table me-1"></i> Running PO Summary:
            </span>
            <div className="d-flex flex-wrap gap-2">
              {items.map((it, i) => (
                <div key={i} className="badge bg-white text-dark border p-2 d-flex align-items-center gap-2 shadow-2xs" style={{ borderColor: '#cbd5e1' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: it.color_hex || '#cbd5e1', border: '1px solid #999' }} />
                  <span><strong>{it.color_name || 'Standard'}</strong>:</span>
                  <span>{it.fabric_name || 'Voile'} ({it.width || '48'}")</span>
                  <span className="text-primary fw-bold">[{it.quantity_meters || 0}m / {it.quantity_pieces || 0}pcs]</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION: TERMS, SPECIAL INSTRUCTIONS & REMARKS                            */}
      {/* ========================================================================= */}
      <div className="card border mb-4 shadow-sm" style={{ borderRadius: '10px', borderColor: '#e2e8f0', background: '#ffffff' }}>
        <div className="p-3 px-4 border-bottom d-flex align-items-center justify-content-between" style={{ background: '#fafbfc' }}>
          <div className="d-flex align-items-center gap-2.5">
            <i className="ti ti-notes text-secondary fs-16"></i>
            <h6 className="mb-0 fw-bold text-dark fs-14">Terms, Special Instructions &amp; Remarks</h6>
          </div>
          {!isLocked && (
            <button
              type="button"
              className="btn btn-link btn-sm text-primary text-decoration-none p-0 fs-11 fw-semibold"
              onClick={handleInsertStandardTerms}
            >
              + Insert Standard Terms
            </button>
          )}
        </div>
        <div className="p-4">
          <textarea
            className="form-control form-control-sm bg-white fs-13"
            rows={3}
            placeholder="Enter terms, tolerance limits, dyeing instructions, or remarks..."
            style={{ borderColor: '#cbd5e1', borderRadius: '6px' }}
            value={terms}
            disabled={isLocked || (!isSectionEditable('terms') && !isSectionEditable('all'))}
            onChange={(e) => setTerms(e.target.value)}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM ACTION BAR                                                         */}
      {/* ========================================================================= */}
      <div className="d-flex align-items-center justify-content-between pb-5">
        <button
          type="button"
          className="btn btn-light border px-4 py-2 text-secondary fs-13 fw-semibold rounded-2"
          onClick={onCancel}
          style={{ borderColor: '#cbd5e1' }}
        >
          {isLocked ? 'Close' : 'Cancel'}
        </button>

        <div className="d-flex align-items-center gap-2">
          {initialPO && (
            <button
              type="button"
              className="btn btn-outline-secondary px-3.5 py-2 fs-13 rounded-2 shadow-xs d-flex align-items-center gap-1.5"
              onClick={() => onPrintPO && onPrintPO(initialPO)}
            >
              <i className="ti ti-printer fs-15"></i>
              <span>Print PO Slip</span>
            </button>
          )}

          {!isLocked && (
            <>
              <button
                type="button"
                className="btn btn-primary px-4 py-2 fs-13 fw-semibold rounded-2 shadow-xs d-flex align-items-center gap-1.5"
                onClick={() => handleSubmit(false)}
              >
                <i className="ti ti-device-floppy fs-15"></i>
                <span>Save Process PO</span>
              </button>

              <button
                type="button"
                className="btn btn-dark px-4 py-2 fs-13 fw-semibold rounded-2 shadow-xs d-flex align-items-center gap-1.5"
                onClick={() => handleSubmit(true)}
              >
                <i className="ti ti-truck-delivery fs-15"></i>
                <span>Save &amp; Create Dispatch Challan</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INLINE MASTER MODALS                                                      */}
      {/* ========================================================================= */}
      {showInlineVendorModal && (
        <VendorMasterView
          isInline={true}
          onCloseInline={() => setShowInlineVendorModal(false)}
          onSaveVendor={(newVendor) => {
            const updated = [newVendor, ...vendorList];
            setVendorList(updated);
            setVendorId(newVendor.id);
            setVendorName(newVendor.name || newVendor.vendorName);
            setShowInlineVendorModal(false);
          }}
        />
      )}

      {showInlineFabricModal && (
        <FabricMasterView
          isInline={true}
          onCloseInline={() => setShowInlineFabricModal(false)}
          onSaveFabric={(newFabric) => {
            const formatted = {
              id: newFabric.id,
              name: newFabric.qualityName || newFabric.name,
              widths: newFabric.widths || ['44', '48', '58'],
              shrinkage: parseFloat(newFabric.defaultShrinkage) || 4.0,
              defaultRate: ''
            };
            setFabricList([formatted, ...fabricList]);
            setShowInlineFabricModal(false);
          }}
        />
      )}

      {showInlineColorModal && (
        <AddColorModal
          isOpen={showInlineColorModal}
          onClose={() => setShowInlineColorModal(false)}
          onAddColor={(newColor) => {
            const formatted = {
              id: newColor.id,
              name: newColor.name,
              hex: newColor.hex || '#333333'
            };
            setColorList([formatted, ...colorList]);
            if (activeColorRowIndex !== null && items[activeColorRowIndex]) {
              updateItem(activeColorRowIndex, {
                color_id: formatted.id,
                color_name: formatted.name,
                color_hex: formatted.hex
              });
            }
            setShowInlineColorModal(false);
          }}
        />
      )}
    </div>
  );
}
