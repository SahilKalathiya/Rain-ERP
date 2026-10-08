import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import VendorMasterView from './VendorMasterView';
import FabricMasterView from './FabricMasterView';
import AddColorModal from './AddColorModal';
import { initialColors } from '../../data/procurementData';

/**
 * SearchableColorInput - Custom Theme-styled Color Dropdown / Searchable Combobox
 * Uses a floating React Portal (fixed coordinates) to ensure the dropdown menu
 * is never clipped by table, card, or modal boundaries and stays completely visible.
 */
function SearchableColorInput({
  value = '',
  onChange,
  onAddNew,
  colors = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 240 });
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Dynamically position the dropdown relative to the viewport
  const updatePosition = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const dropdownHeight = 250;
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldOpenUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setCoords({
        top: shouldOpenUpwards ? Math.max(8, rect.top - dropdownHeight - 4) : rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 240)
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      const clickedInsideWrapper = wrapperRef.current && wrapperRef.current.contains(event.target);
      const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
      if (!clickedInsideWrapper && !clickedInsideDropdown) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchedColor = colors.find(
    (c) =>
      c.name.toLowerCase() === (value || '').toLowerCase() ||
      c.hex.toLowerCase() === (value || '').toLowerCase()
  );
  const swatchHex = matchedColor
    ? matchedColor.hex
    : (value?.startsWith('#') ? value : '#cbd5e1');

  const filteredColors = colors.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.hex.toLowerCase().includes(term);
  });

  return (
    <div
      ref={wrapperRef}
      className="position-relative"
      style={{ minWidth: '150px' }}
    >
      {/* Unified Seamless Container */}
      <div
        className="d-flex align-items-center bg-white rounded-2"
        style={{
          border: (isOpen || isFocused) ? '1.5px solid #6366f1' : '1px solid #cbd5e1',
          boxShadow: (isOpen || isFocused) ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none',
          padding: '2px 8px 2px 8px',
          height: '31px',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          cursor: 'text'
        }}
        onClick={() => {
          updatePosition();
          setIsOpen(true);
        }}
      >
        {/* Color Swatch */}
        <span
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '4px',
            backgroundColor: swatchHex,
            border: swatchHex?.toLowerCase() === '#ffffff' || swatchHex?.toLowerCase() === '#fffff0' ? '1px solid #cbd5e1' : '1px solid rgba(0,0,0,0.15)',
            display: 'inline-block',
            flexShrink: 0,
            marginRight: '6px',
            cursor: 'pointer'
          }}
          title="Pick or edit color"
          onClick={(e) => {
            e.stopPropagation();
            if (onAddNew) onAddNew();
          }}
        />

        {/* Text Input with NO individual inner border or outline */}
        <input
          type="text"
          style={{
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            backgroundColor: 'transparent',
            fontSize: '13px',
            color: '#1e293b',
            width: '100%',
            minWidth: 0,
            padding: 0
          }}
          placeholder="Color name..."
          value={searchTerm}
          onFocus={() => {
            updatePosition();
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            updatePosition();
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
          }}
        />

        {/* Integrated Chevron Icon inside the box on the right */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            paddingLeft: '4px',
            color: '#64748b',
            flexShrink: 0
          }}
          onClick={(e) => {
            e.stopPropagation();
            updatePosition();
            setIsOpen((prev) => !prev);
          }}
          title="Toggle color list"
        >
          <i
            className={`ti ti-chevron-${isOpen ? 'up' : 'down'} fs-12`}
            style={{ transition: 'transform 0.15s ease' }}
          ></i>
        </span>
      </div>

      {/* Floating Theme Dropdown Menu Portaled to Document Body */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            className="bg-white rounded-3 border overflow-hidden"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 999999,
              borderColor: '#e2e8f0',
              boxShadow: '0 12px 32px rgba(15, 23, 42, 0.22), 0 4px 14px rgba(0, 0, 0, 0.12)'
            }}
          >
            <div style={{ maxHeight: '220px', overflowY: 'auto' }} className="py-1">
              {filteredColors.length > 0 ? (
                filteredColors.map((col) => {
                  const isSelected = (value || '').toLowerCase() === col.name.toLowerCase();
                  return (
                    <div
                      key={col.id || col.name}
                      className="d-flex align-items-center justify-content-between px-3 py-2 fs-13"
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#f3f0ff' : 'transparent',
                        color: isSelected ? '#5b47fb' : '#1e293b',
                        fontWeight: isSelected ? 600 : 400,
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={() => {
                        onChange(col.name);
                        setSearchTerm(col.name);
                        setIsOpen(false);
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="rounded-circle shadow-sm"
                          style={{
                            width: '14px',
                            height: '14px',
                            backgroundColor: col.hex,
                            border:
                              col.hex?.toLowerCase() === '#ffffff' ||
                              col.hex?.toLowerCase() === '#fffff0'
                                ? '1px solid #cbd5e1'
                                : '1px solid rgba(0,0,0,0.1)',
                            display: 'inline-block',
                            flexShrink: 0
                          }}
                        />
                        <span>{col.name}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted fs-11 font-monospace">{col.hex}</span>
                        {isSelected && <i className="ti ti-check fs-14 text-primary"></i>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-2.5 text-muted fs-12 text-center">
                  No matching color found
                </div>
              )}
            </div>

            {/* Bottom Action: + Add New Color */}
            <div className="border-top p-1.5 bg-light d-flex align-items-center justify-content-between">
              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none w-100 text-start px-2 py-1 fs-12 fw-semibold d-flex align-items-center gap-1.5"
                style={{ color: '#5b47fb' }}
                onClick={() => {
                  setIsOpen(false);
                  if (onAddNew) onAddNew();
                }}
              >
                <i className="ti ti-plus fs-13"></i>
                <span>Add &quot;{searchTerm || 'New Color'}&quot; to Master...</span>
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

/**
 * PurchaseOrderForm - Purchase Order (PO) Creation, View & Edit Mode
 * Matches the required design with:
 * - 1. Header & Vendor Information section with clean divider lines & Buffer % toggle
 * - Fabric Line Items with full bordered grid lines (table-bordered) across both View Mode & New PO / Edit Mode
 * - Columns: FABRIC QUALITY *, COLOR NAME, WIDTH (PANNA) *, QUANTITY (MTRS) *, RATE / MTR (₹) *, FOLD %, AMOUNT (₹)
 * - PO Total Amount row in table footer with bordered cells
 * - Terms & Conditions (Auto-capitalised) / Notes container
 * - View mode by default for existing POs with "Edit Record" / "Cancel PO" / "Print PO" / "+ Inward GRN"
 * - Edit mode directly for "+ New PO" with "+ Add Line" and "+ New Fabric"
 */
export default function PurchaseOrderForm({
  po,
  vendors = [],
  fabrics = [],
  colors = [],
  orders = [],
  onBack,
  onSavePO,
  onPrintPO,
  onInwardGRN,
  onSaveVendor,
  onSaveFabric,
  onSaveColor,
  onCancelPO
}) {
  const isExisting = Boolean(po && po.id);

  // View Mode by default for existing POs, Edit Mode for new POs
  const [isEditing, setIsEditing] = useState(!isExisting);

  // Helper to auto-generate PO number in format: 1-YYYY-#### or PO-####
  const generatePONumber = () => {
    const currentYear = new Date().getFullYear();
    const random4 = Math.floor(1000 + Math.random() * 9000);
    return `1-${currentYear}-${random4}`;
  };

  // Default orders if none passed
  const orderList = orders.length > 0 ? orders : [
    { id: 'ORD-2026-001', label: 'ORD-2026-001 - Zara India (Summer Kurti 2026)' },
    { id: 'ORD-2026-002', label: 'ORD-2026-002 - FabIndia Retail (Designer Anarkali Gown)' },
    { id: 'ORD-2026-003', label: 'ORD-2026-003 - Westside Styles (Festive Silk Kurta Set)' },
    { id: 'ORD-2026-004', label: 'ORD-2026-004 - Pantaloons (Casual Printed Top)' }
  ];

  // Today's date formatted as YYYY-MM-DD for date input
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Helper to format date if already in DD-MM-YYYY or YYYY-MM-DD
  const formatInputDate = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string' && dateVal.includes('-')) {
      const parts = dateVal.split('T')[0].split('-');
      if (parts[0].length === 4) return dateVal.split('T')[0]; // already YYYY-MM-DD
      if (parts[2]?.length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY -> YYYY-MM-DD
    }
    return dateVal;
  };

  // Form State
  const [formData, setFormData] = useState(() => ({
    id: po?.id || generatePONumber(),
    vendorId: po?.vendorId || '',
    vendorName: po?.vendorName || '',
    linkedOrder: po?.linkedOrder || po?.orderRef || '',
    date: formatInputDate(po?.date) || todayDateStr,
    expectedDeliveryDate: formatInputDate(po?.expectedDeliveryDate) || '',
    discountTerms: po?.discountTerms || po?.terms || '',
    terms: po?.terms || '',
    notes: po?.notes || '',
    status: po?.status || 'Draft',
    bufferAllowed: po?.bufferAllowed || false,
    bufferPercent: po?.bufferPercent || 0,
    items: (po?.items && po.items.length > 0)
      ? po.items.map((it, idx) => ({
        id: it.id || `item-${idx + 1}`,
        fabricId: it.fabricId || '',
        fabricName: it.fabricName || it.fabricQuality || '',
        colorName: it.colorName || it.color || '',
        width: it.width || '',
        quantity: it.quantity || '',
        rate: it.rate || '',
        fold: (it.fold !== undefined && it.fold !== null && it.fold !== '') ? it.fold : '',
        amount: it.amount || (Number(it.quantity || 0) * Number(it.rate || 0)) || 0
      }))
      : [
        {
          id: `item-${Date.now()}`,
          fabricId: '',
          fabricName: '',
          colorName: '',
          width: '',
          quantity: '',
          rate: '',
          fold: '',
          amount: 0
        }
      ]
  }));

  // Sync state whenever selected `po` changes
  useEffect(() => {
    if (po && po.id) {
      setFormData({
        id: po.id,
        vendorId: po.vendorId || '',
        vendorName: po.vendorName || '',
        linkedOrder: po.linkedOrder || po.orderRef || '',
        date: formatInputDate(po.date) || todayDateStr,
        expectedDeliveryDate: formatInputDate(po.expectedDeliveryDate) || '',
        discountTerms: po.discountTerms || po.terms || '',
        terms: po.terms || '',
        notes: po.notes || '',
        status: po.status || 'Draft',
        bufferAllowed: Boolean(po.bufferAllowed),
        bufferPercent: po.bufferPercent || 0,
        items: (po.items && po.items.length > 0)
          ? po.items.map((it, idx) => ({
            id: it.id || `item-${idx + 1}`,
            fabricId: it.fabricId || '',
            fabricName: it.fabricName || it.fabricQuality || '',
            colorName: it.colorName || it.color || '',
            width: it.width || '',
            quantity: it.quantity || '',
            rate: it.rate || '',
            fold: (it.fold !== undefined && it.fold !== null && it.fold !== '') ? it.fold : '',
            amount: it.amount || (Number(it.quantity || 0) * Number(it.rate || 0)) || 0
          }))
          : [
            {
              id: `item-${Date.now()}`,
              fabricId: '',
              fabricName: '',
              colorName: '',
              width: '',
              quantity: '',
              rate: '',
              fold: '',
              amount: 0
            }
          ]
      });
      setIsEditing(false); // start in read-only view mode for existing PO
    } else {
      setIsEditing(true); // new PO starts in edit mode
    }
  }, [po]);

  // Modals for Inline Master Creation
  const [showInlineVendorModal, setShowInlineVendorModal] = useState(false);
  const [showInlineFabricModal, setShowInlineFabricModal] = useState(false);
  const [activeFabricRowId, setActiveFabricRowId] = useState(null);

  const handleOpenNewFabricModal = (rowId = null) => {
    setActiveFabricRowId(rowId);
    setShowInlineFabricModal(true);
  };

  const handleNewFabricCreated = (newFabric) => {
    if (!newFabric) return;
    if (onSaveFabric) onSaveFabric(newFabric);

    setFormData((prev) => {
      let targetRowId = activeFabricRowId;
      if (!targetRowId) {
        const emptyRow = prev.items.find((it) => !it.fabricId);
        targetRowId = emptyRow ? emptyRow.id : (prev.items[prev.items.length - 1]?.id);
      }

      const updatedItems = prev.items.map((it) => {
        if (it.id === targetRowId) {
          return {
            ...it,
            fabricId: newFabric.id,
            fabricName: newFabric.qualityName,
            width: '',
            rate: it.rate || '',
            fold: it.fold || ''
          };
        }
        return it;
      });

      return { ...prev, items: updatedItems };
    });

    setShowInlineFabricModal(false);
    setActiveFabricRowId(null);
  };

  // Modals for Inline Color Master Creation (Image 2)
  const [showInlineColorModal, setShowInlineColorModal] = useState(false);
  const [activeColorRowId, setActiveColorRowId] = useState(null);

  const handleOpenNewColorModal = (rowId = null) => {
    setActiveColorRowId(rowId);
    setShowInlineColorModal(true);
  };

  const handleNewColorCreated = (newColor) => {
    if (!newColor) return;
    if (onSaveColor) onSaveColor(newColor);

    setFormData((prev) => {
      let targetRowId = activeColorRowId;
      if (!targetRowId) {
        const emptyRow = prev.items.find((it) => !it.colorName);
        targetRowId = emptyRow ? emptyRow.id : (prev.items[prev.items.length - 1]?.id);
      }

      const updatedItems = prev.items.map((it) => {
        if (it.id === targetRowId) {
          return {
            ...it,
            colorName: newColor.name
          };
        }
        return it;
      });

      return { ...prev, items: updatedItems };
    });

    setShowInlineColorModal(false);
    setActiveColorRowId(null);
  };

  // Color catalog from Color Master
  const masterColorList = (colors && colors.length > 0) ? colors : initialColors;

  // Handle vendor dropdown change
  const handleVendorChange = (vId, vendorObj = null) => {
    if (vendorObj) {
      setFormData((prev) => ({
        ...prev,
        vendorId: vendorObj.id,
        vendorName: vendorObj.name
      }));
      return;
    }
    const found = vendors.find((v) => v.id === vId);
    setFormData((prev) => ({
      ...prev,
      vendorId: vId,
      vendorName: found ? found.name : ''
    }));
  };

  // Add line item row
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          fabricId: '',
          fabricName: '',
          colorName: '',
          width: '',
          quantity: '',
          rate: '',
          fold: '',
          amount: 0
        }
      ]
    }));
  };

  // Remove line item row
  const handleRemoveItem = (id) => {
    if (formData.items.length <= 1) {
      setFormData((prev) => ({
        ...prev,
        items: [
          {
            id: `item-${Date.now()}`,
            fabricId: '',
            fabricName: '',
            colorName: '',
            width: '',
            quantity: '',
            rate: '',
            fold: '',
            amount: 0
          }
        ]
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id)
    }));
  };

  // Line item change
  const handleItemChange = (id, field, value) => {
    setFormData((prev) => {
      const updatedItems = prev.items.map((it) => {
        if (it.id !== id) return it;

        const updated = { ...it, [field]: value };

        // Auto-fill fabric name when fabric is selected, leave width/rate/fold empty for manual entry
        if (field === 'fabricId') {
          const matchedFabric = fabrics.find((f) => f.id === value);
          if (matchedFabric) {
            updated.fabricName = matchedFabric.qualityName;
            updated.width = '';
          } else {
            updated.fabricName = '';
            updated.width = '';
          }
        }

        // Live calculation of amount = quantity * rate
        const q = Number(field === 'quantity' ? value : it.quantity) || 0;
        const r = Number(field === 'rate' ? value : it.rate) || 0;
        updated.amount = Math.round(q * r * 100) / 100;

        return updated;
      });

      return { ...prev, items: updatedItems };
    });
  };

  // Live PO Taxable Total
  const poTotalAmount = formData.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  // Submit PO (Draft, Sent, or Save Changes)
  const handleSubmit = (finalStatus = null) => {
    if (!formData.vendorId) {
      alert('Please select a vendor.');
      return;
    }

    const nextStatus = finalStatus || formData.status || 'Draft';

    const payload = {
      ...formData,
      status: nextStatus,
      totalAmount: poTotalAmount,
      terms: formData.discountTerms || formData.terms || 'Standard payment terms',
      items: formData.items.map((it) => ({
        ...it,
        fabricName: it.fabricName || (fabrics.find((f) => f.id === it.fabricId)?.qualityName || 'Fabric'),
        colorName: it.colorName || '',
        quantity: Number(it.quantity) || 0,
        rate: Number(it.rate) || 0,
        fold: Number(it.fold) || 100,
        amount: Number(it.amount) || (Number(it.quantity || 0) * Number(it.rate || 0))
      }))
    };

    if (onSavePO) {
      onSavePO(payload);
    }

    setIsEditing(false);
  };

  // Cancel action: clears all form fields and exits form
  const handleCancel = () => {
    setFormData({
      id: '',
      vendorId: '',
      vendorName: '',
      linkedOrder: '',
      date: '',
      expectedDeliveryDate: '',
      discountTerms: '',
      terms: '',
      notes: '',
      status: 'Draft',
      bufferAllowed: false,
      bufferPercent: 0,
      items: [
        {
          id: `item-${Date.now()}`,
          fabricId: '',
          fabricName: '',
          colorName: '',
          width: '44',
          quantity: '',
          rate: '',
          fold: '',
          amount: 0
        }
      ]
    });
    if (onBack) {
      onBack();
    } else {
      setIsEditing(false);
    }
  };

  const handleCancelPO = () => {
    if (window.confirm(`Are you sure you want to cancel Purchase Order ${formData.id}? This will mark it as Cancelled.`)) {
      const updated = { ...formData, status: 'Cancelled' };
      setFormData(updated);
      setIsEditing(false);
      if (onCancelPO) {
        onCancelPO(updated);
      } else if (onSavePO) {
        onSavePO(updated);
      }
    }
  };

  return (
    <div className="container-fluid p-0" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header / Action Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div className="d-flex align-items-center gap-2">
          {onBack && (
            <button
              type="button"
              className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center"
              style={{ width: '34px', height: '34px' }}
              onClick={onBack}
              title="Back to Purchase Orders"
            >
              <i className="ti ti-arrow-left fs-16 text-dark"></i>
            </button>
          )}
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold text-dark mb-0 fs-18">
                {isExisting ? `Purchase Order ${formData.id}` : 'Create Purchase Order'}
              </h4>
              {isExisting && (
                <span
                  className={`badge px-2 py-1 rounded-pill fs-12 fw-semibold ${formData.status === 'Sent'
                      ? 'bg-primary text-white'
                      : formData.status === 'Completed'
                        ? 'bg-success-subtle text-success border border-success border-opacity-25'
                        : formData.status === 'Partially Received'
                          ? 'bg-info-subtle text-info border border-info border-opacity-25'
                          : formData.status === 'Cancelled'
                            ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                            : 'bg-secondary-subtle text-secondary border'
                    }`}
                >
                  {formData.status === 'Sent'
                    ? 'Sent to Vendor'
                    : formData.status === 'Cancelled'
                      ? 'Cancelled'
                      : formData.status}
                </span>
              )}
            </div>
            <span className="text-muted fs-12">Raw Material Fabric Procurement</span>
          </div>
        </div>

        {isExisting && (
          <div className="d-flex align-items-center gap-2">
            {onPrintPO && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3 fs-13"
                onClick={() => onPrintPO(formData)}
              >
                <i className="ti ti-printer fs-15"></i>
                <span>Print PO</span>
              </button>
            )}
            {onInwardGRN && formData.status !== 'Draft' && formData.status !== 'Cancelled' && (
              <button
                type="button"
                className="btn btn-sm btn-success d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3 fs-13 text-white"
                onClick={() => onInwardGRN(formData)}
              >
                <i className="ti ti-package fs-15"></i>
                <span>+ Inward Delivery (GRN)</span>
              </button>
            )}
            {formData.status !== 'Cancelled' && (
              !isEditing ? (
                <button
                  type="button"
                  className="btn btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3 fs-13 text-white shadow-sm"
                  style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                  onClick={() => setIsEditing(true)}
                >
                  <i className="ti ti-edit fs-15"></i>
                  <span>Edit Record</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-light border d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3 fs-13 text-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  <i className="ti ti-eye fs-15"></i>
                  <span>View Mode</span>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Cancellation Notice Banner */}
      {formData.status === 'Cancelled' && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 py-2.5 px-3 mb-3 fs-13 border-danger border-opacity-25 shadow-sm">
          <i className="ti ti-ban fs-18 text-danger"></i>
          <div>
            <span className="fw-bold">Purchase Order Cancelled:</span> This purchase order has been marked as cancelled. It is closed and cannot be modified or processed for inward GRN deliveries.
          </div>
        </div>
      )}

      {/* SECTION 1: HEADER & VENDOR INFORMATION (Image 3 Style with Divider Lines) */}
      <div
        className="card mb-4 shadow-none"
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px 20px'
        }}
      >
        {/* Title bar with divider line */}
        <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
          <span
            className="fw-bold text-secondary text-uppercase"
            style={{ fontSize: '12px', letterSpacing: '0.05em' }}
          >
            1. HEADER &amp; VENDOR INFORMATION
          </span>
          {isExisting && !isEditing && (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-primary text-decoration-none fs-12 fw-medium"
              onClick={() => setIsEditing(true)}
            >
              Edit Section
            </button>
          )}
        </div>

        <div className="row g-3">
          {/* PO No. */}
          <div className="col-12 col-md-3">
            <label className="form-label fs-12 fw-semibold text-secondary mb-1">PO No.</label>
            <div className="fw-bold text-primary font-monospace fs-14">{formData.id}</div>
          </div>

          {/* PO Date * */}
          <div className="col-12 col-md-3">
            <label className="form-label fs-12 fw-semibold text-secondary mb-1">
              PO Date <span className="text-danger">*</span>
            </label>
            {isEditing ? (
              <input
                type="date"
                className="form-control form-control-sm bg-white fs-13"
                style={{ borderColor: '#cbd5e1' }}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            ) : (
              <div className="text-dark fs-13 fw-medium">{formData.date || '—'}</div>
            )}
          </div>

          {/* Vendor * */}
          <div className="col-12 col-md-3">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <label className="form-label fs-12 fw-semibold text-secondary mb-0">
                Vendor <span className="text-danger">*</span>
              </label>
              {isEditing && (
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-primary text-decoration-none fs-11"
                  onClick={() => setShowInlineVendorModal(true)}
                >
                  + New
                </button>
              )}
            </div>
            {isEditing ? (
              <select
                className="form-select form-select-sm bg-white fs-13"
                style={{ borderColor: '#cbd5e1' }}
                value={formData.vendorId}
                onChange={(e) => handleVendorChange(e.target.value)}
              >
                <option value="">Select a vendor...</option>
                {vendors
                  .filter((v) => v.active !== false || v.id === formData.vendorId)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.city ? `(${v.city})` : ''}
                    </option>
                  ))}
                {formData.vendorId && !vendors.some((v) => v.id === formData.vendorId) && (
                  <option value={formData.vendorId}>
                    {formData.vendorName || formData.vendorId}
                  </option>
                )}
              </select>
            ) : (
              <div className="fw-semibold text-dark fs-14">
                {formData.vendorName || vendors.find((v) => v.id === formData.vendorId)?.name || '—'}
              </div>
            )}
          </div>

          {/* Expected Delivery Date */}
          <div className="col-12 col-md-3">
            <label className="form-label fs-12 fw-semibold text-secondary mb-1">
              Expected Delivery Date
            </label>
            {isEditing ? (
              <input
                type="date"
                className="form-control form-control-sm bg-white fs-13"
                style={{ borderColor: '#cbd5e1' }}
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
              />
            ) : (
              <div className="text-dark fs-13">{formData.expectedDeliveryDate || 'Not specified'}</div>
            )}
          </div>

          {/* Optional: Link to Order & Discount Terms */}
          <div className="col-12 col-md-6">
            <label className="form-label fs-12 fw-semibold text-secondary mb-1">
              Link to Order (optional)
            </label>
            {isEditing ? (
              <select
                className="form-select form-select-sm bg-white fs-13"
                style={{ borderColor: '#cbd5e1' }}
                value={formData.linkedOrder}
                onChange={(e) => setFormData({ ...formData, linkedOrder: e.target.value })}
              >
                <option value="">— None —</option>
                {orderList.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.label || ord.id}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-dark fs-13">
                {orderList.find((o) => o.id === formData.linkedOrder)?.label || formData.linkedOrder || '— None —'}
              </div>
            )}
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label fs-12 fw-semibold text-secondary mb-1">
              Discount Terms
            </label>
            {isEditing ? (
              <input
                type="text"
                className="form-control form-control-sm bg-white fs-13"
                placeholder='e.g. "2% folding / 1% discount in 7 days"'
                style={{ borderColor: '#cbd5e1' }}
                value={formData.discountTerms}
                onChange={(e) => setFormData({ ...formData, discountTerms: e.target.value })}
              />
            ) : (
              <div className="text-dark fs-13">{formData.discountTerms || 'None'}</div>
            )}
          </div>

          {/* Buffer Configuration Divider */}
          <div className="col-12 border-top pt-2 mt-2">
            <div className="d-flex flex-wrap align-items-center gap-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="bufferToggle"
                  disabled={!isEditing}
                  checked={formData.bufferAllowed}
                  onChange={(e) => setFormData({ ...formData, bufferAllowed: e.target.checked })}
                />
                <label className="form-check-label fs-13 fw-medium text-dark" htmlFor="bufferToggle">
                  Buffer Quantity (+/−) Allowed
                </label>
              </div>

              {formData.bufferAllowed && (
                <div className="d-flex align-items-center gap-2">
                  <label className="fs-12 fw-semibold text-secondary mb-0">Buffer Tolerance:</label>
                  {isEditing ? (
                    <div className="input-group input-group-sm" style={{ width: '120px' }}>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="e.g. 5.0"
                        className="form-control form-control-sm bg-white no-spinner text-end"
                        value={formData.bufferPercent || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, bufferPercent: Number(e.target.value) })
                        }
                      />
                      <span className="input-group-text bg-white">%</span>
                    </div>
                  ) : (
                    <span className="badge bg-info-subtle text-info fw-bold fs-12">
                      ±{formData.bufferPercent}%
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="form-text fs-11 text-muted mt-1">
              When enabled, GRN delivery within ±{formData.bufferPercent || 0}% will be accepted automatically without requiring Admin variance sign-off.
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Fabric Line Items (FULL BORDERED GRID - Image 3 Style) */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h6 className="fw-bold text-dark mb-0 fs-15">Fabric Line Items</h6>
          {isEditing && (
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3 py-1 d-flex align-items-center gap-1 fs-12 bg-white"
                onClick={() => handleOpenNewFabricModal()}
              >
                <i className="ti ti-plus fs-13"></i>
                <span>New Fabric</span>
              </button>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm px-3 py-1 d-flex align-items-center gap-1 fs-12"
                onClick={handleAddItem}
              >
                <i className="ti ti-plus fs-13"></i>
                <span>Add Line</span>
              </button>
            </div>
          )}
        </div>

        {/* FULL BORDERED TABLE WITH LINES (table-bordered) */}
        <div className="table-responsive" style={{ overflow: 'visible', minHeight: '300px', paddingBottom: '100px', marginBottom: '-100px' }}>
          <table
            className="table table-bordered align-middle mb-0 fs-13"
            style={{
              width: '100%',
              border: '1px solid #dee2e6',
              borderCollapse: 'collapse',
              background: '#ffffff'
            }}
          >
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #dee2e6' }}>
              <tr style={{ color: '#475569', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                <th style={{ width: '23%', minWidth: '170px', padding: '10px 10px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span>FABRIC QUALITY *</span>
                    {isEditing && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-primary text-decoration-none fs-11 fw-medium"
                        onClick={() => handleOpenNewFabricModal()}
                        title="Add new fabric to master"
                      >
                        + New Fabric
                      </button>
                    )}
                  </div>
                </th>
                <th style={{ width: '18%', minWidth: '160px', padding: '10px 8px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  COLOR NAME
                </th>
                <th style={{ width: '13%', minWidth: '115px', padding: '10px 8px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }} className="text-start">
                  WIDTH (PANNA) *
                </th>
                <th style={{ width: '12%', minWidth: '95px', padding: '10px 8px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }} className="text-center">
                  QUANTITY (MTRS) *
                </th>
                <th style={{ width: '11%', minWidth: '90px', padding: '10px 8px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }} className="text-center">
                  RATE / MTR (₹) *
                </th>
                <th style={{ width: '10%', minWidth: '90px', padding: '10px 6px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }} className="text-center">
                  FOLD %
                </th>
                <th style={{ width: '12%', minWidth: '100px', padding: '10px 10px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }} className="text-end">
                  AMOUNT (₹)
                </th>
                {isEditing && (
                  <th style={{ width: '36px', padding: '10px 4px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }} className="text-center"></th>
                )}
              </tr>
            </thead>
            <tbody>
              {formData.items.map((row) => {
                const currentFabric = fabrics.find((f) => f.id === row.fabricId);
                const allowedWidths = currentFabric?.widths || (currentFabric?.pannaWidth ? [String(currentFabric.pannaWidth)] : ['44', '48', '58']);

                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    {/* Fabric Quality */}
                    <td style={{ border: '1px solid #dee2e6', padding: '6px 8px' }}>
                      {isEditing ? (
                        <select
                          className="form-select form-select-sm bg-light fs-13"
                          style={{ borderColor: '#cbd5e1' }}
                          value={row.fabricId}
                          onChange={(e) => {
                            if (e.target.value === '__NEW_FABRIC__') {
                              handleOpenNewFabricModal(row.id);
                            } else {
                              handleItemChange(row.id, 'fabricId', e.target.value);
                            }
                          }}
                        >
                          <option value="">Select fabric...</option>
                          {fabrics.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.qualityName}
                            </option>
                          ))}
                          <option value="__NEW_FABRIC__" style={{ color: '#5b47fb', fontWeight: 'bold' }}>
                            + Add New Fabric...
                          </option>
                        </select>
                      ) : (
                        <div className="fw-medium text-dark">{row.fabricName || 'Fabric'}</div>
                      )}
                    </td>

                    {/* Color Name (Custom Searchable Combobox with Theme Styling) */}
                    <td style={{ border: '1px solid #dee2e6', padding: '6px 8px' }}>
                      {isEditing ? (
                        <SearchableColorInput
                          value={row.colorName || ''}
                          colors={masterColorList}
                          onChange={(newColorName) => handleItemChange(row.id, 'colorName', newColorName)}
                          onAddNew={() => handleOpenNewColorModal(row.id)}
                        />
                      ) : (
                        <div className="d-flex align-items-center gap-2">
                          {row.colorName && (() => {
                            const matchedColor = masterColorList.find(
                              (c) =>
                                c.name.toLowerCase() === (row.colorName || '').toLowerCase() ||
                                c.hex.toLowerCase() === (row.colorName || '').toLowerCase()
                            );
                            const swatchHex = matchedColor
                              ? matchedColor.hex
                              : row.colorName?.startsWith('#')
                                ? row.colorName
                                : '#cbd5e1';
                            return (
                              <span
                                className="d-inline-block rounded-circle"
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  backgroundColor: swatchHex,
                                  border: '1px solid #cbd5e1',
                                  flexShrink: 0
                                }}
                              />
                            );
                          })()}
                          <span className="text-dark fw-medium">{row.colorName || '—'}</span>
                        </div>
                      )}
                    </td>

                    {/* Width (Panna) - Left-aligned text & variables */}
                    <td style={{ border: '1px solid #dee2e6', padding: '6px 6px' }} className="text-start">
                      {isEditing ? (
                        allowedWidths.length > 1 ? (
                          <select
                            className="form-select form-select-sm bg-light fs-13 text-start"
                            style={{ borderColor: '#cbd5e1', paddingRight: '22px' }}
                            value={row.width || ''}
                            onChange={(e) => handleItemChange(row.id, 'width', e.target.value)}
                          >
                            <option value="">Select...</option>
                            {allowedWidths.map((w) => (
                              <option key={w} value={w}>
                                {w}"
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="form-control form-control-sm bg-light fs-13 text-start"
                            style={{ borderColor: '#cbd5e1' }}
                            placeholder="44"
                            value={row.width || ''}
                            onChange={(e) => handleItemChange(row.id, 'width', e.target.value)}
                          />
                        )
                      ) : (
                        <div className="text-start text-dark">{row.width ? `${row.width}"` : '—'}</div>
                      )}
                    </td>

                    {/* Quantity (Mtrs) */}
                    <td style={{ border: '1px solid #dee2e6', padding: '6px 6px' }} className="text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          step="any"
                          className="form-control form-control-sm bg-light fs-13 text-center no-spinner"
                          style={{ borderColor: '#cbd5e1' }}
                          placeholder="1000"
                          value={row.quantity}
                          onChange={(e) => handleItemChange(row.id, 'quantity', e.target.value)}
                        />
                      ) : (
                        <div className="text-center fw-medium text-dark">
                          {Number(row.quantity || 0).toLocaleString()} Mtrs
                        </div>
                      )}
                    </td>

                    {/* Rate / Mtr (₹) */}
                    <td style={{ border: '1px solid #dee2e6', padding: '6px 6px' }} className="text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          step="any"
                          className="form-control form-control-sm bg-light fs-13 text-center no-spinner"
                          style={{ borderColor: '#cbd5e1' }}
                          placeholder="45.00"
                          value={row.rate}
                          onChange={(e) => handleItemChange(row.id, 'rate', e.target.value)}
                        />
                      ) : (
                        <div className="text-center text-dark">
                          ₹{Number(row.rate || 0).toFixed(2)}
                        </div>
                      )}
                    </td>

                    {/* Fold % */}
                    <td style={{ border: '1px solid #dee2e6', padding: '6px 6px' }} className="text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          step="any"
                          className="form-control form-control-sm bg-light fs-13 text-center no-spinner"
                          style={{ borderColor: '#cbd5e1' }}
                          placeholder="100%"
                          value={row.fold ?? ''}
                          onChange={(e) => handleItemChange(row.id, 'fold', e.target.value)}
                        />
                      ) : (
                        <div className="text-center text-dark">
                          {row.fold ? `${row.fold}%` : '—'}
                        </div>
                      )}
                    </td>

                    {/* Amount (₹) */}
                    <td style={{ border: '1px solid #dee2e6', padding: '6px 8px' }} className="text-end">
                      <div className="fw-bold text-dark fs-14">
                        ₹
                        {(Number(row.amount) || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    </td>

                    {/* Action: Trash Icon */}
                    {isEditing && (
                      <td style={{ border: '1px solid #dee2e6', padding: '6px 4px', width: '36px' }} className="text-center">
                        <button
                          type="button"
                          className="btn btn-link p-0 text-danger border-0 d-inline-flex align-items-center justify-content-center"
                          style={{ width: '28px', height: '28px', opacity: 0.8 }}
                          onClick={() => handleRemoveItem(row.id)}
                          title="Remove row"
                        >
                          <i className="ti ti-trash fs-16"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>

            {/* PO Total Amount Footer Row (Image 3 Style) */}
            <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #dee2e6' }}>
              <tr>
                <td
                  colSpan={6}
                  className="text-end fw-bold text-dark fs-14"
                  style={{ border: '1px solid #dee2e6', padding: '10px 14px' }}
                >
                  PO Total Amount:
                </td>
                <td
                  className="text-end fw-bold text-primary fs-15 font-monospace"
                  style={{ border: '1px solid #dee2e6', padding: '10px 14px' }}
                >
                  ₹
                  {poTotalAmount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
                {isEditing && <td style={{ border: '1px solid #dee2e6' }}></td>}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* GST Notice note */}
        <div className="text-end text-muted fs-11 mt-1.5" style={{ color: '#94a3b8' }}>
          GST will be added per-line based on vendor state
        </div>
      </div>

      {/* SECTION 3: Notes (Image 1 Style) */}
      <div
        className="card mb-4 shadow-none"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px 20px'
        }}
      >
        <label className="form-label fs-12 fw-semibold text-secondary mb-1">Notes</label>
        {isEditing ? (
          <textarea
            rows="3"
            className="form-control form-control-sm bg-white fs-13"
            placeholder="Internal notes (not printed on PO)"
            style={{ borderColor: '#cbd5e1' }}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          ></textarea>
        ) : (
          <div className="text-secondary fs-13 py-1">
            {formData.notes || <span className="text-muted">No internal notes</span>}
          </div>
        )}
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-5">
        {/* Left: PO number auto-generation note / PO id */}
        <div className="d-flex align-items-center gap-2 text-muted fs-12">
          <i className="ti ti-shopping-cart fs-15 text-muted"></i>
          <span>
            {isExisting
              ? `PO Number: ${formData.id}`
              : 'PO number will be auto-generated as 1-YYYY-####.'}
          </span>
        </div>

        {/* Right: Buttons */}
        <div className="d-flex align-items-center gap-2">
          {!isEditing ? (
            <>
              {formData.status !== 'Cancelled' && (
                <button
                  type="button"
                  className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium fs-13 rounded-3 text-white shadow-sm"
                  style={{
                    backgroundColor: '#5b47fb',
                    borderColor: '#5b47fb',
                    borderRadius: '8px'
                  }}
                  onClick={() => setIsEditing(true)}
                >
                  <i className="ti ti-edit fs-15"></i>
                  <span>Edit Record</span>
                </button>
              )}
              <button
                type="button"
                className="btn btn-white border px-3 py-2 fw-medium fs-13 rounded-3 text-secondary shadow-sm"
                style={{ borderRadius: '8px' }}
                onClick={handleCancel}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-semibold fs-13 rounded-3 text-white shadow-sm"
                style={{
                  backgroundColor: '#5b47fb',
                  borderColor: '#5b47fb',
                  borderRadius: '8px'
                }}
                onClick={() => handleSubmit('Sent')}
              >
                <i className="ti ti-send fs-15"></i>
                <span>Send to Vendor</span>
              </button>

              <button
                type="button"
                className="btn d-flex align-items-center gap-2 px-3 py-2 fw-semibold fs-13 rounded-3 shadow-sm"
                style={{
                  backgroundColor: '#f3f0ff',
                  borderColor: '#d8b4fe',
                  color: '#5b47fb',
                  borderRadius: '8px'
                }}
                onClick={() => handleSubmit(isExisting && formData.status && formData.status !== 'Draft' ? formData.status : 'Sent')}
              >
                <i className="ti ti-device-floppy fs-15" style={{ color: '#5b47fb' }}></i>
                <span>Save</span>
              </button>

              <button
                type="button"
                className="btn btn-white border d-flex align-items-center gap-2 px-3 py-2 fw-medium fs-13 rounded-3 text-secondary shadow-sm"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '8px'
                }}
                onClick={handleCancel}
              >
                <i className="ti ti-x fs-15 text-muted"></i>
                <span>Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline Modal: Vendor Master Creation */}
      {showInlineVendorModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 p-3">
              <VendorMasterView
                vendors={vendors}
                isInline={true}
                onSaveVendor={(newVendor) => {
                  if (onSaveVendor) onSaveVendor(newVendor);
                  if (newVendor) handleVendorChange(newVendor.id, newVendor);
                }}
                onCloseInline={(newCreatedVendor) => {
                  if (newCreatedVendor) handleVendorChange(newCreatedVendor.id, newCreatedVendor);
                  setShowInlineVendorModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Inline Modal: Fabric Master Creation */}
      {showInlineFabricModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 p-3">
              <FabricMasterView
                fabrics={fabrics}
                isInline={true}
                onSaveFabric={(newFabric) => {
                  handleNewFabricCreated(newFabric);
                }}
                onCloseInline={(newCreatedFabric) => {
                  if (newCreatedFabric) {
                    handleNewFabricCreated(newCreatedFabric);
                  } else {
                    setShowInlineFabricModal(false);
                    setActiveFabricRowId(null);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Inline Modal: Color Master Creation (Matching Image 2) */}
      {showInlineColorModal && (
        <AddColorModal
          colors={masterColorList}
          onSave={(newColor) => {
            handleNewColorCreated(newColor);
          }}
          onClose={(newColor) => {
            setShowInlineColorModal(false);
            if (newColor) {
              handleNewColorCreated(newColor);
            } else {
              setActiveColorRowId(null);
            }
          }}
        />
      )}
    </div>
  );
}
