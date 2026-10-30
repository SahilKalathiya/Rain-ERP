import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import VendorMasterView from './VendorMasterView';
import FabricMasterView from './FabricMasterView';
import AddColorModal from './AddColorModal';
import { initialColors } from '../../data/procurementData';

/**
 * SearchableColorInput - Custom Theme-styled Color Dropdown / Searchable Combobox
 * Uses non-clipping portal positioned directly below the box for 100% precision.
 */
function SearchableColorInput({
  value = '',
  onChange,
  onAddNew,
  colors = [],
  placeholder = 'Color name...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 220, openUp: false, maxHeight: 220 });
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || '');
    setIsTyping(false);
  }, [value]);

  const updatePosition = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 130 && rect.top > spaceBelow;
      const maxHeight = openUp ? Math.min(220, Math.max(120, rect.top - 16)) : Math.min(220, Math.max(120, spaceBelow - 16));

      setCoords({
        openUp,
        top: rect.bottom + 3,
        bottom: window.innerHeight - rect.top + 3,
        left: rect.left,
        width: Math.max(rect.width, 220),
        maxHeight
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
        setIsTyping(false);
        setSearchTerm(value || '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const matchedColor = colors.find(
    (c) =>
      c.name.toLowerCase() === (value || '').toLowerCase() ||
      c.hex.toLowerCase() === (value || '').toLowerCase()
  );
  const swatchHex = matchedColor
    ? matchedColor.hex
    : (value?.startsWith('#') ? value : '#cbd5e1');

  // Show all colors when opening or if not actively typing a filter
  const filteredColors = colors.filter((c) => {
    if (!isTyping || !searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.hex.toLowerCase().includes(term);
  });

  return (
    <div
      ref={wrapperRef}
      className="position-relative"
      style={{ width: '100%', minWidth: '100px' }}
    >
      {/* Unified Seamless Container */}
      <div
        className="d-flex align-items-center bg-white rounded-2"
        style={{
          border: (isOpen || isFocused) ? '1.5px solid #6366f1' : '1px solid #cbd5e1',
          boxShadow: (isOpen || isFocused) ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none',
          padding: '2px 6px',
          height: '32px',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          cursor: 'text'
        }}
        onClick={() => {
          setIsTyping(false);
          updatePosition();
          setIsOpen(true);
        }}
      >
        {/* Color Swatch */}
        <span
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '3px',
            backgroundColor: swatchHex,
            border: swatchHex?.toLowerCase() === '#ffffff' || swatchHex?.toLowerCase() === '#fffff0' ? '1px solid #cbd5e1' : '1px solid rgba(0,0,0,0.15)',
            display: 'inline-block',
            flexShrink: 0,
            marginRight: '5px',
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
            fontSize: '12px',
            color: '#1e293b',
            width: '100%',
            minWidth: 0,
            padding: 0
          }}
          placeholder={placeholder}
          value={searchTerm}
          onFocus={(e) => {
            e.target.select();
            setIsTyping(false);
            updatePosition();
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          onChange={(e) => {
            setIsTyping(true);
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            updatePosition();
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              setIsTyping(false);
              setSearchTerm(value || '');
            }
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
            setIsTyping(false);
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

      {/* Floating Theme Dropdown Menu Portaled to Document Body (Never Clipped) */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            className="bg-white rounded-3 border overflow-hidden shadow-lg"
            style={{
              position: 'fixed',
              top: coords.openUp ? 'auto' : `${coords.top}px`,
              bottom: coords.openUp ? `${coords.bottom}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 999999,
              borderColor: '#cbd5e1',
              boxShadow: '0 12px 28px rgba(15, 23, 42, 0.22), 0 4px 12px rgba(0, 0, 0, 0.12)'
            }}
          >
            <div style={{ maxHeight: `${coords.maxHeight}px`, overflowY: 'auto' }} className="py-1">
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
                        setIsTyping(false);
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
                  setIsTyping(false);
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
 * SearchableFabricInput - Custom Theme-styled Searchable Fabric Dropdown / Combobox
 * Uses non-clipping portal positioned directly below the box for 100% precision.
 */
function SearchableFabricInput({
  value = '',
  onChange,
  onAddNew,
  fabrics = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedFabric = fabrics.find((f) => f.id === value || f.qualityName?.toLowerCase() === (value || '').toLowerCase());
  const [searchTerm, setSearchTerm] = useState(selectedFabric ? selectedFabric.qualityName : (value || ''));
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 260, openUp: false, maxHeight: 220 });
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const matched = fabrics.find((f) => f.id === value || f.qualityName?.toLowerCase() === (value || '').toLowerCase());
    setSearchTerm(matched ? matched.qualityName : (value || ''));
    setIsTyping(false);
  }, [value, fabrics]);

  const updatePosition = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 130 && rect.top > spaceBelow;
      const maxHeight = openUp ? Math.min(220, Math.max(120, rect.top - 16)) : Math.min(220, Math.max(120, spaceBelow - 16));

      setCoords({
        openUp,
        top: rect.bottom + 3,
        bottom: window.innerHeight - rect.top + 3,
        left: rect.left,
        width: Math.max(rect.width, 260),
        maxHeight
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
        setIsTyping(false);
        const matched = fabrics.find((f) => f.id === value || f.qualityName?.toLowerCase() === (value || '').toLowerCase());
        setSearchTerm(matched ? matched.qualityName : (value || ''));
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, fabrics]);

  const filteredFabrics = fabrics.filter((f) => {
    if (!isTyping || !searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = (f.qualityName || '').toLowerCase();
    const code = (f.code || f.fabricCode || '').toLowerCase();
    const type = (f.fabricType || f.type || '').toLowerCase();
    return name.includes(term) || code.includes(term) || type.includes(term);
  });

  return (
    <div
      ref={wrapperRef}
      className="position-relative"
      style={{ width: '100%', minWidth: '115px' }}
    >
      {/* Unified Seamless Container */}
      <div
        className="d-flex align-items-center bg-white rounded-2"
        style={{
          border: (isOpen || isFocused) ? '1.5px solid #6366f1' : '1px solid #cbd5e1',
          boxShadow: (isOpen || isFocused) ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none',
          padding: '2px 6px',
          height: '32px',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          cursor: 'text'
        }}
        onClick={() => {
          setIsTyping(false);
          updatePosition();
          setIsOpen(true);
        }}
      >
        {/* Text Input directly inside the box */}
        <input
          type="text"
          style={{
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            backgroundColor: 'transparent',
            fontSize: '12px',
            color: '#1e293b',
            width: '100%',
            minWidth: 0,
            padding: 0
          }}
          placeholder="Select fabric..."
          value={searchTerm}
          onFocus={(e) => {
            e.target.select();
            setIsTyping(false);
            updatePosition();
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          onChange={(e) => {
            const val = e.target.value;
            setIsTyping(true);
            setSearchTerm(val);
            updatePosition();
            setIsOpen(true);
            const matched = fabrics.find(
              (f) => f.qualityName.toLowerCase() === val.toLowerCase() || f.id === val
            );
            if (matched) {
              onChange(matched.id);
            } else if (!val) {
              onChange('');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              setIsTyping(false);
              const matched = fabrics.find((f) => f.id === value || f.qualityName?.toLowerCase() === (value || '').toLowerCase());
              setSearchTerm(matched ? matched.qualityName : (value || ''));
            }
            if (e.key === 'Enter' && filteredFabrics.length > 0) {
              const top = filteredFabrics[0];
              onChange(top.id);
              setSearchTerm(top.qualityName);
              setIsTyping(false);
              setIsOpen(false);
            }
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
            setIsTyping(false);
            updatePosition();
            setIsOpen((prev) => !prev);
          }}
          title="Toggle fabric list"
        >
          <i
            className={`ti ti-chevron-${isOpen ? 'up' : 'down'} fs-12`}
            style={{ transition: 'transform 0.15s ease' }}
          ></i>
        </span>
      </div>

      {/* Floating Theme Dropdown Menu Portaled to Document Body (Never Clipped) */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            className="bg-white rounded-3 border overflow-hidden shadow-lg"
            style={{
              position: 'fixed',
              top: coords.openUp ? 'auto' : `${coords.top}px`,
              bottom: coords.openUp ? `${coords.bottom}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 999999,
              borderColor: '#cbd5e1',
              boxShadow: '0 12px 28px rgba(15, 23, 42, 0.22), 0 4px 12px rgba(0, 0, 0, 0.12)'
            }}
          >
            <div style={{ maxHeight: `${coords.maxHeight}px`, overflowY: 'auto' }} className="py-1">
              {filteredFabrics.length > 0 ? (
                filteredFabrics.map((fab) => {
                  const isSelected = fab.id === value || fab.qualityName.toLowerCase() === (searchTerm || '').toLowerCase();
                  return (
                    <div
                      key={fab.id}
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
                        onChange(fab.id);
                        setSearchTerm(fab.qualityName);
                        setIsTyping(false);
                        setIsOpen(false);
                      }}
                    >
                      <div className="d-flex flex-column text-truncate me-2" style={{ minWidth: 0 }}>
                        <span className="text-truncate">{fab.qualityName}</span>
                        {(fab.code || fab.pannaWidth || (fab.widths && fab.widths.length > 0)) && (
                          <span className="text-muted fs-11">
                            {fab.code ? `Code: ${fab.code}` : ''}
                            {fab.code && (fab.pannaWidth || (fab.widths && fab.widths.length > 0)) ? ' • ' : ''}
                            {fab.widths && fab.widths.length > 0
                              ? `Width: ${fab.widths.map(w => String(w).replace(/"/g, '') + '"').join(', ')}`
                              : (fab.pannaWidth ? `Width: ${fab.pannaWidth}"` : '')
                            }
                          </span>
                        )}
                      </div>
                      {isSelected && <i className="ti ti-check fs-14 text-primary flex-shrink-0"></i>}
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-2.5 text-muted fs-12 text-center">
                  No matching fabric found
                </div>
              )}
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
/**
 * Helper to detect if a fabric is raw / greige fabric
 */
export const isRawFabricQuality = (fabricName, fabricObj) => {
  const str = `${fabricName || ''} ${fabricObj?.qualityName || ''} ${fabricObj?.fabricType || ''} ${fabricObj?.fabric_type || ''} ${fabricObj?.type || ''} ${fabricObj?.category || ''} ${fabricObj?.description || ''}`.toLowerCase();
  return (
    str.includes('grey') ||
    str.includes('greige') ||
    str.includes('gray') ||
    str.includes('raw') ||
    str.includes('undyed') ||
    str.includes('kora') ||
    str.includes('unbleached') ||
    str.includes('loomstate')
  );
};

/**
 * Helper to detect if any items in the PO have a color assigned
 */
export const checkHasColors = (itemsList) => {
  return Array.isArray(itemsList) && itemsList.some((it) => it && (it.colorName || it.color) && String(it.colorName || it.color).trim().length > 0);
};

/**
 * Helper to detect if all items in the PO are raw/greige fabrics
 */
export const checkAllRawFabrics = (itemsList, fabricMasterList = []) => {
  if (!Array.isArray(itemsList) || itemsList.length === 0) return false;
  return itemsList.every((it) => {
    const curFab = Array.isArray(fabricMasterList) ? fabricMasterList.find(
      (f) => f && (f.id === it.fabricId || (f.qualityName && f.qualityName.toLowerCase() === (it.fabricName || '').toLowerCase()))
    ) : null;
    return isRawFabricQuality(it.fabricName || it.fabricQuality, curFab);
  });
};


export default function PurchaseOrderForm({
  po,
  vendors = [],
  fabrics = [],
  colors = [],
  orders = [],
  grns = [],
  qualityChecks = [],
  onBack,
  onSavePO,
  onPrintPO,
  onInwardGRN,
  onViewGRN,
  onViewQC,
  onSaveVendor,
  onSaveFabric,
  onSaveColor,
  onCancelPO
}) {
  const isExisting = Boolean(po && po.id && !po.isAutoGenerated && !po.isNew);

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
        fabricType: it.fabricType || (isRawFabricQuality(it.fabricName || it.fabricQuality) ? 'Greige Fabric' : 'Process'),
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
          fabricType: 'Process',
          colorName: '',
          width: '',
          quantity: '',
          rate: '',
          fold: '',
          amount: 0
        }
      ]
  }));

  // Requirement 15: Once a Purchase Order is sent to the vendor and its GRN process has started, the Purchase Order should no longer be editable.
  const poNumbersToCheck = [
    po?.id,
    po?.poNumber,
    po?.po_number,
    formData?.id
  ].filter(Boolean);

  const currentStatus = String(po?.status || formData?.status || '').trim();
  const isSentOrBeyond = /sent|partially|received|completed/i.test(currentStatus);

  const isGrnLinkedToPo = (g) => {
    if (!g) return false;
    return poNumbersToCheck.some((pid) =>
      (Array.isArray(g.linkedPOs) && g.linkedPOs.includes(pid)) ||
      g.poId === pid ||
      g.poNumber === pid ||
      g.againstPo === pid ||
      g.poRef === pid ||
      g.purchaseOrderId === pid ||
      g.purchaseOrderNumber === pid
    );
  };

  const linkedGrn = poNumbersToCheck.length > 0 ? (grns || []).find(isGrnLinkedToPo) : null;

  // Requirement 17: Complete GRN & QC History after GRN starts
  const allPoGrns = poNumbersToCheck.length > 0 ? (grns || []).filter(isGrnLinkedToPo) : [];

  const hasGrnStarted = Boolean(
    linkedGrn ||
    allPoGrns.length > 0 ||
    /partially|received|completed/i.test(currentStatus) ||
    (Number(po?.receivedQty) > 0) ||
    (Number(formData?.receivedQty) > 0)
  );

  const isPoLocked = Boolean(hasGrnStarted || (isSentOrBeyond && hasGrnStarted));

  const totalOrderedMtrs = (formData.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  // 1. Quantity received
  const totalQuantityReceived = allPoGrns.reduce(
    (sum, g) => sum + (Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0),
    0
  ) || Number(po?.receivedQty) || Number(formData?.receivedQty) || 0;

  const pendingQuantityToReceive = Math.max(0, totalOrderedMtrs - totalQuantityReceived);
  const fulfillmentPercent = totalOrderedMtrs > 0 ? Math.min(100, Math.round((totalQuantityReceived / totalOrderedMtrs) * 100)) : 0;

  // 2. Number of GRNs created
  const numGrnsCreated = allPoGrns.length;

  // Helper to find QC inspection for a GRN
  const findQcForGrn = (g) => {
    if (!g) return null;
    return (qualityChecks || []).find(
      (q) => q && (
        q.grnRef === g.id ||
        (Array.isArray(q.linkedGRNs) && q.linkedGRNs.includes(g.id)) ||
        q.id === g.qcId ||
        q.grnId === g.id ||
        (g.id && q.id && q.id.startsWith(`QC-${String(g.id).replace('GRN-', '')}`))
      )
    );
  };

  // 3. Quantity pending in QC
  const quantityPendingInQC = allPoGrns.reduce((sum, g) => {
    const gMeters = Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0;
    const qc = findQcForGrn(g);
    const isDone = qc && (
      ['Passed', 'Passed with Deviation', 'Rejected', 'Approved'].includes(qc.qcStatus) ||
      ['Passed', 'Passed with Deviation', 'Rejected', 'Approved'].includes(qc.status) ||
      Boolean(qc.adminDecision)
    );
    return isDone ? sum : sum + gMeters;
  }, 0);

  const quantityPassedQC = Math.max(0, totalQuantityReceived - quantityPendingInQC);

  // 4. QC completion status
  let qcCompletionStatus = 'Not Started';
  let qcCompletionBadgeClass = 'bg-secondary-subtle text-secondary border';

  if (numGrnsCreated === 0) {
    qcCompletionStatus = 'Awaiting Inward GRN';
    qcCompletionBadgeClass = 'bg-light text-muted border';
  } else {
    const completedQcGrns = allPoGrns.filter((g) => {
      const qc = findQcForGrn(g);
      return qc && (
        ['Passed', 'Passed with Deviation', 'Rejected', 'Approved'].includes(qc.qcStatus) ||
        ['Passed', 'Passed with Deviation', 'Rejected', 'Approved'].includes(qc.status) ||
        Boolean(qc.adminDecision)
      );
    });

    if (completedQcGrns.length === numGrnsCreated && numGrnsCreated > 0) {
      qcCompletionStatus = '100% Completed (All GRNs Inspected)';
      qcCompletionBadgeClass = 'bg-success-subtle text-success border border-success border-opacity-25';
    } else if (completedQcGrns.length > 0) {
      qcCompletionStatus = `Partially Completed (${completedQcGrns.length} of ${numGrnsCreated} GRNs)`;
      qcCompletionBadgeClass = 'bg-info-subtle text-info border border-info border-opacity-25';
    } else {
      qcCompletionStatus = 'Pending QC Inspection';
      qcCompletionBadgeClass = 'bg-warning-subtle text-warning-emphasis border border-warning border-opacity-50';
    }
  }

  // View Mode by default for existing POs, Edit Mode for new POs. If PO is locked, strictly view mode.
  const [isEditing, setIsEditing] = useState(!isExisting && !isPoLocked);
  const userToggledColorRef = useRef(false);

  // Live computed check: show color column if at least one item is "Process"
  const showColorColumn = useMemo(() => {
    return (formData.items || []).some(
      (it) => (it.fabricType || 'Process') === 'Process'
    );
  }, [formData.items]);

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
            fabricType: it.fabricType || (isRawFabricQuality(it.fabricName || it.fabricQuality) ? 'Greige Fabric' : 'Process'),
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
              fabricType: 'Process',
              colorName: '',
              width: '',
              quantity: '',
              rate: '',
              fold: '',
              amount: 0
            }
          ]
      });
      setIsEditing(isPoLocked ? false : Boolean(po.isAutoGenerated || po.isNew)); // auto-generated or new PO starts in edit mode, existing starts in read-only
      userToggledColorRef.current = false;
    } else {
      setIsEditing(!isPoLocked);
    }
  }, [po, isPoLocked, fabrics]);

  // Strict enforcement: Locked PO can NEVER enter edit mode
  useEffect(() => {
    if (isPoLocked && isEditing) {
      setIsEditing(false);
    }
  }, [isPoLocked, isEditing]);

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

    if (!userToggledColorRef.current) {
      const isRaw = isRawFabricQuality(newFabric.qualityName, newFabric);
      if (isRaw) {
        setShowColorColumn(false);
      }
    }

    setFormData((prev) => {
      let targetRowId = activeFabricRowId;
      if (!targetRowId) {
        const emptyRow = prev.items.find((it) => !it.fabricId);
        targetRowId = emptyRow ? emptyRow.id : (prev.items[prev.items.length - 1]?.id);
      }

      const updatedItems = prev.items.map((it) => {
        if (it.id === targetRowId) {
          const wList = newFabric.widths || (newFabric.pannaWidth ? [String(newFabric.pannaWidth)] : []);
          const defaultWidth = (wList && wList.length === 1) ? String(wList[0]).replace(/"/g, '') : '';
          const isRaw = isRawFabricQuality(newFabric.qualityName, newFabric);
          return {
            ...it,
            fabricId: newFabric.id,
            fabricName: newFabric.qualityName,
            fabricType: isRaw ? 'Greige Fabric' : (it.fabricType || 'Process'),
            colorName: isRaw ? '' : (it.colorName || ''),
            width: defaultWidth,
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
          fabricType: prev.items?.[prev.items.length - 1]?.fabricType || 'Process',
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
            fabricType: 'Process',
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

        // If fabricType changed to Greige Fabric, clear colorName
        if (field === 'fabricType') {
          if (value === 'Greige Fabric') {
            updated.colorName = '';
          }
        }

        // Auto-fill fabric name when fabric is selected, auto-select width if only 1 width configured
        if (field === 'fabricId') {
          const matchedFabric = fabrics.find(
            (f) => f.id === value || (f.qualityName && f.qualityName.toLowerCase() === String(value).toLowerCase())
          );
          if (matchedFabric) {
            updated.fabricName = matchedFabric.qualityName;
            const isRaw = isRawFabricQuality(matchedFabric.qualityName, matchedFabric);
            if (isRaw) {
              updated.fabricType = 'Greige Fabric';
              updated.colorName = '';
            } else if (!updated.fabricType) {
              updated.fabricType = 'Process';
            }

            const wList = matchedFabric.widths || (matchedFabric.pannaWidth ? [String(matchedFabric.pannaWidth)] : []);
            if (wList && wList.length === 1) {
              updated.width = String(wList[0]).replace(/"/g, '');
            } else {
              updated.width = '';
            }

            // Auto pre-fill buffer tolerance from Fabric Master if available
            const fabBuf = matchedFabric.maxBuffer ?? matchedFabric.bufferPercent ?? matchedFabric.buffer;
            if (fabBuf !== undefined && fabBuf !== null && fabBuf !== '') {
              const parsedBuf = parseFloat(fabBuf);
              if (!isNaN(parsedBuf) && parsedBuf > 0 && (!prev.bufferPercent || prev.bufferPercent === 0)) {
                setTimeout(() => {
                  setFormData(fd => ({
                    ...fd,
                    bufferAllowed: true,
                    bufferPercent: parsedBuf
                  }));
                }, 0);
              }
            }
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
    if (isPoLocked) {
      alert('This Purchase Order is locked because its GRN inward process has already started. Edits cannot be saved.');
      return;
    }

    if (!formData.vendorId) {
      alert('Please select a vendor.');
      return;
    }

    // Line items validation
    for (let i = 0; i < formData.items.length; i++) {
      const it = formData.items[i];
      const curFab = fabrics.find(
        (f) => f.id === it.fabricId || (f.qualityName && f.qualityName.toLowerCase() === (it.fabricName || '').toLowerCase())
      );
      const isRaw = isRawFabricQuality(it.fabricName, curFab);

      if (!it.fabricId && !it.fabricName) {
        alert(`Line ${i + 1}: Please select a fabric quality.`);
        return;
      }
      if (!it.quantity || Number(it.quantity) <= 0) {
        alert(`Line ${i + 1}: Please enter a valid quantity in meters.`);
        return;
      }
      if (!it.rate || Number(it.rate) <= 0) {
        alert(`Line ${i + 1}: Please enter a valid rate per meter.`);
        return;
      }
      // Requirement 14: While creating a Purchase Order, if ordering raw fabric, the Color column should not be required.
      // Color is purely optional across all fabric types and is never a required field.
    }

    const nextStatus = finalStatus || formData.status || 'Draft';

    const payload = {
      ...formData,
      status: nextStatus,
      totalAmount: poTotalAmount,
      terms: formData.discountTerms || formData.terms || 'Standard payment terms',
      items: formData.items.map((it) => {
        const curFab = fabrics.find(
          (f) => f.id === it.fabricId || (f.qualityName && f.qualityName.toLowerCase() === (it.fabricName || '').toLowerCase())
        );
        const isRaw = isRawFabricQuality(it.fabricName, curFab);
        return {
          ...it,
          fabricName: it.fabricName || (curFab?.qualityName || 'Fabric'),
          fabricType: it.fabricType || (isRaw ? 'Greige Fabric' : 'Process'),
          colorName: it.fabricType === 'Greige Fabric' ? '' : (it.colorName ? it.colorName.trim() : ''),
          quantity: Number(it.quantity) || 0,
          rate: Number(it.rate) || 0,
          fold: Number(it.fold) || 100,
          amount: Number(it.amount) || (Number(it.quantity || 0) * Number(it.rate || 0))
        };
      })
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
    setShowColorColumn(true);
    userToggledColorRef.current = false;
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
            {allPoGrns.length > 0 && allPoGrns.map((g) => {
              const gMeters = Number(g.totalMetersEntered) || Number(g.declaredTotalMeters) || 0;
              return (
                <button
                  key={g.id}
                  type="button"
                  className="btn btn-sm btn-outline-success d-flex align-items-center gap-1.5 px-2.5 py-1.5 rounded-3 fs-12 fw-semibold"
                  title={`GRN ${g.id} (${gMeters.toLocaleString()}m). Click to view.`}
                  onClick={() => {
                    if (onViewGRN) {
                      onViewGRN(g);
                    } else if (onInwardGRN) {
                      onInwardGRN(formData);
                    }
                  }}
                >
                  <i className="ti ti-check fs-14"></i>
                  <span>{g.id} ({gMeters.toLocaleString()}m)</span>
                </button>
              );
            })}

            {/* As long as PO is not fully fulfilled, allow creating multiple installment GRNs */}
            {pendingQuantityToReceive > 0 && formData.status !== 'Draft' && formData.status !== 'Cancelled' && formData.status !== 'Completed' ? (
              onInwardGRN && (
                <button
                  type="button"
                  className="btn btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3 fs-13 text-white shadow-xs fw-semibold"
                  style={{
                    backgroundColor: allPoGrns.length > 0 ? '#2563eb' : '#059669',
                    borderColor: allPoGrns.length > 0 ? '#2563eb' : '#059669'
                  }}
                  title={allPoGrns.length > 0
                    ? `Inward next installment: ${pendingQuantityToReceive.toLocaleString()}m pending to receive`
                    : "Create Inward Delivery GRN for this PO"}
                  onClick={() => onInwardGRN({ ...formData, pendingQtyToReceive: pendingQuantityToReceive })}
                >
                  <i className={allPoGrns.length > 0 ? "ti ti-truck-delivery fs-15" : "ti ti-package fs-15"}></i>
                  <span>
                    {allPoGrns.length > 0
                      ? `+ Inward Next GRN (${pendingQuantityToReceive.toLocaleString()}m Pending)`
                      : '+ Inward Delivery (GRN)'}
                  </span>
                </button>
              )
            ) : ((pendingQuantityToReceive <= 0 && totalOrderedMtrs > 0) || formData.status === 'Completed') ? (
              <span
                className="badge bg-success-subtle text-success border border-success border-opacity-25 px-3 py-2 fs-12 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
                title={`PO 100% Fulfilled: All ${totalOrderedMtrs.toLocaleString()}m received across ${allPoGrns.length} GRN(s). No further GRN can be created.`}
              >
                <i className="ti ti-circle-check fs-14"></i>
                <span>✓ Fully Received ({totalOrderedMtrs.toLocaleString()}m — Complete)</span>
              </span>
            ) : null}
            {formData.status !== 'Cancelled' && (
              isPoLocked ? (
                <span
                  className="badge bg-light text-secondary border px-3 py-2 fs-12 d-flex align-items-center gap-1.5 shadow-xs"
                  title="GRN process has started. This Purchase Order is locked and cannot be edited."
                >
                  <i className="ti ti-lock text-warning fs-14"></i>
                  <span>Locked (GRN Started)</span>
                </span>
              ) : !isEditing ? (
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
          {isExisting && !isEditing && !isPoLocked && (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-primary text-decoration-none fs-12 fw-medium"
              onClick={() => {
                if (isPoLocked) return;
                setIsEditing(true);
              }}
            >
              Edit Section
            </button>
          )}
        </div>

        <div className="row g-3">
          {/* PO No. */}
          <div className="col-12 col-md-4">
            <label className="form-label fs-12 fw-semibold text-secondary mb-1">PO No.</label>
            <div className="fw-bold text-primary font-monospace fs-14">{formData.id}</div>
          </div>

          {/* PO Date * */}
          <div className="col-12 col-md-4">
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
          <div className="col-12 col-md-4">
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
        </div>
      </div>


      {/* SECTION 2: Fabric Line Items (FULL BORDERED GRID - Image 3 Style) */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <h6 className="fw-bold text-dark mb-0 fs-15">Fabric Line Items</h6>
          </div>
          <div className="d-flex align-items-center gap-2">
            {isEditing && (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm px-3 py-1 d-flex align-items-center gap-1 fs-12"
                onClick={handleAddItem}
              >
                <i className="ti ti-plus fs-13"></i>
                <span>Add Line</span>
              </button>
            )}
          </div>
        </div>

        {/* FULL BORDERED TABLE WITH LINES (table-bordered) */}
        <div className="table-responsive" style={{ overflowX: 'auto', minHeight: '260px' }}>
          <table
            className="table table-bordered align-middle mb-0 fs-12"
            style={{
              width: '100%',
              border: '1px solid #dee2e6',
              borderCollapse: 'collapse',
              background: '#ffffff'
            }}
          >
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #dee2e6' }}>
              <tr style={{ color: '#475569', fontSize: '11.5px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                {/* 1st Column: FABRIC TYPE * */}
                <th style={{ width: showColorColumn ? '13%' : '16%', minWidth: '115px', padding: '8px 6px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  <span>FABRIC TYPE *</span>
                </th>

                {/* 2nd Column: FABRIC QUALITY * */}
                <th style={{ width: showColorColumn ? '18%' : '24%', minWidth: showColorColumn ? '130px' : '145px', padding: '8px 6px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  <div className="d-flex align-items-center justify-content-between gap-1">
                    <span>FABRIC QUALITY *</span>
                    {isEditing && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-primary text-decoration-none fs-11 fw-medium"
                        onClick={() => handleOpenNewFabricModal()}
                        title="Add new fabric to master"
                      >
                        + New
                      </button>
                    )}
                  </div>
                </th>
                {showColorColumn && (
                  <th style={{ width: '14%', minWidth: '110px', padding: '8px 6px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <div className="d-flex align-items-center gap-1">
                      <span>COLOR NAME</span>
                      <span className="badge bg-light text-muted border fs-10 px-1 py-0 fw-normal">Opt</span>
                    </div>
                  </th>
                )}
                <th style={{ width: showColorColumn ? '11%' : '13%', minWidth: '80px', padding: '8px 6px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }} className="text-start">
                  WIDTH *
                </th>
                <th style={{ width: showColorColumn ? '12%' : '13%', minWidth: '85px', padding: '8px 6px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }} className="text-center">
                  QTY (MTRS) *
                </th>
                <th style={{ width: showColorColumn ? '11%' : '12%', minWidth: '80px', padding: '8px 6px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }} className="text-center">
                  RATE (₹) *
                </th>
                <th style={{ width: showColorColumn ? '8%' : '9%', minWidth: '65px', padding: '8px 4px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }} className="text-center">
                  FOLD %
                </th>
                <th style={{ width: showColorColumn ? '13%' : '13%', minWidth: '85px', padding: '8px 6px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }} className="text-end">
                  AMOUNT (₹)
                </th>
                {isEditing && (
                  <th style={{ width: '32px', minWidth: '32px', padding: '8px 2px', border: '1px solid #dee2e6', verticalAlign: 'middle', whiteSpace: 'nowrap' }} className="text-center"></th>
                )}
              </tr>
            </thead>
            <tbody>
              {formData.items.map((row) => {
                const currentFabric = fabrics.find(
                  (f) => f.id === row.fabricId || (f.qualityName && f.qualityName.toLowerCase() === (row.fabricName || '').toLowerCase())
                );
                const hasFabricSelected = Boolean(row.fabricId || (row.fabricName && row.fabricName.trim()));
                const isRaw = hasFabricSelected ? isRawFabricQuality(row.fabricName, currentFabric) : false;

                let allowedWidths = [];
                if (hasFabricSelected) {
                  let rawWidths = currentFabric?.widths;
                  if (!rawWidths && currentFabric?.pannaWidth) rawWidths = [String(currentFabric.pannaWidth)];
                  if (!rawWidths || rawWidths.length === 0) rawWidths = ['44', '48', '58'];
                  allowedWidths = Array.from(new Set(rawWidths.map((w) => String(w).trim().replace(/"/g, '')).filter(Boolean)));
                }

                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    {/* 1st Column: Fabric Type (Process / Greige Fabric) */}
                    <td style={{ border: '1px solid #dee2e6', padding: '4px 6px', minWidth: '115px' }}>
                      {isEditing && !isPoLocked ? (
                        <select
                          className="form-select form-select-sm bg-white text-start fw-medium"
                          style={{
                            borderColor: '#cbd5e1',
                            height: '32px',
                            minHeight: '35px',
                            fontSize: '12px',
                            lineHeight: '1.2',
                            paddingTop: '2px',
                            paddingBottom: '2px',
                            paddingLeft: '8px',
                            paddingRight: '22px',
                            minWidth: '105px',
                            width: '100%',
                            cursor: 'pointer'
                          }}
                          value={row.fabricType || 'Process'}
                          onChange={(e) => handleItemChange(row.id, 'fabricType', e.target.value)}
                        >
                          <option value="Process">Dyed Fabric</option>
                          <option value="Greige Fabric">Greige Fabric</option>
                        </select>
                      ) : (
                        <span
                          className={`badge ${
                            (row.fabricType || 'Process') === 'Greige Fabric'
                              ? 'bg-secondary-subtle text-secondary border'
                              : 'bg-primary-subtle text-primary border'
                          } fs-11 fw-medium px-2 py-0.5`}
                        >
                          {row.fabricType || 'Process'}
                        </span>
                      )}
                    </td>

                    {/* 2nd Column: Fabric Quality */}
                    <td style={{ border: '1px solid #dee2e6', padding: '4px 6px', minWidth: showColorColumn ? '130px' : '145px' }}>
                      {isEditing ? (
                        <SearchableFabricInput
                          value={row.fabricId || ''}
                          fabrics={fabrics}
                          onChange={(newFabricId) => handleItemChange(row.id, 'fabricId', newFabricId)}
                          onAddNew={() => handleOpenNewFabricModal(row.id)}
                        />
                      ) : (
                        <div className="fw-medium text-dark fs-12">{row.fabricName || 'Fabric'}</div>
                      )}
                    </td>

                    {/* Color Name (Shown only when showColorColumn is true) */}
                    {showColorColumn && (
                      <td style={{ border: '1px solid #dee2e6', padding: '4px 6px', minWidth: '110px' }}>
                        {(row.fabricType || 'Process') === 'Greige Fabric' ? (
                          <span className="badge bg-secondary-subtle text-secondary border fs-11 fw-normal px-2 py-0.5">
                            Greige (No color)
                          </span>
                        ) : isEditing && !isPoLocked ? (
                          <div>
                            <SearchableColorInput
                              value={row.colorName || ''}
                              placeholder={!hasFabricSelected ? "Color name (optional)..." : "Color name (optional)..."}
                              colors={masterColorList}
                              onChange={(newColorName) => handleItemChange(row.id, 'colorName', newColorName)}
                              onAddNew={() => handleOpenNewColorModal(row.id)}
                            />
                          </div>
                        ) : (
                          <div className="d-flex align-items-center gap-2">
                            {row.colorName ? (() => {
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
                                <>
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
                                  <span className="text-dark fw-medium">{row.colorName}</span>
                                </>
                              );
                            })() : (
                              <span className="badge bg-secondary-subtle text-secondary border fs-11 fw-normal px-2 py-0.5">
                                —
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Width (Panna) - Left-aligned text & variables */}
                    <td style={{ border: '1px solid #dee2e6', padding: '4px 6px', minWidth: '80px' }} className="text-start">
                      {isEditing ? (
                        !hasFabricSelected ? (
                          <select
                            className="form-select form-select-sm bg-light fs-12 text-start text-muted"
                            style={{ borderColor: '#cbd5e1', paddingRight: '18px', height: '32px', cursor: 'not-allowed', opacity: 0.8 }}
                            disabled
                            value=""
                            title="Please select a fabric quality first"
                          >
                            <option value="">Select fabric first...</option>
                          </select>
                        ) : allowedWidths && allowedWidths.length > 0 ? (
                          <select
                            className="form-select form-select-sm bg-white fs-12 text-start"
                            style={{ borderColor: '#cbd5e1', paddingRight: '18px', height: '32px' }}
                            value={String(row.width || '').replace(/"/g, '')}
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
                            className="form-control form-control-sm bg-white fs-12 text-start"
                            style={{ borderColor: '#cbd5e1', height: '32px' }}
                            placeholder="44"
                            value={row.width || ''}
                            onChange={(e) => handleItemChange(row.id, 'width', e.target.value)}
                          />
                        )
                      ) : (
                        <div className="text-start text-dark fs-12">{row.width ? `${String(row.width).replace(/"/g, '')}"` : '—'}</div>
                      )}
                    </td>

                    {/* Quantity (Mtrs) */}
                    <td style={{ border: '1px solid #dee2e6', padding: '4px 6px', minWidth: '85px' }} className="text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          step="any"
                          className="form-control form-control-sm bg-light fs-12 text-center no-spinner"
                          style={{ borderColor: '#cbd5e1', height: '32px' }}
                          placeholder="1000"
                          value={row.quantity}
                          onChange={(e) => handleItemChange(row.id, 'quantity', e.target.value)}
                        />
                      ) : (
                        <div className="text-center fw-medium text-dark fs-12">
                          {Number(row.quantity || 0).toLocaleString()} Mtrs
                        </div>
                      )}
                    </td>

                    {/* Rate / Mtr (₹) */}
                    <td style={{ border: '1px solid #dee2e6', padding: '4px 6px', minWidth: '80px' }} className="text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          step="any"
                          className="form-control form-control-sm bg-light fs-12 text-center no-spinner"
                          style={{ borderColor: '#cbd5e1', height: '32px' }}
                          placeholder="45.00"
                          value={row.rate}
                          onChange={(e) => handleItemChange(row.id, 'rate', e.target.value)}
                        />
                      ) : (
                        <div className="text-center text-dark fs-12">
                          ₹{Number(row.rate || 0).toFixed(2)}
                        </div>
                      )}
                    </td>

                    {/* Fold % */}
                    <td style={{ border: '1px solid #dee2e6', padding: '4px 4px', minWidth: '65px' }} className="text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          step="any"
                          className="form-control form-control-sm bg-light fs-12 text-center no-spinner"
                          style={{ borderColor: '#cbd5e1', height: '32px' }}
                          placeholder="100%"
                          value={row.fold ?? ''}
                          onChange={(e) => handleItemChange(row.id, 'fold', e.target.value)}
                        />
                      ) : (
                        <div className="text-center text-dark fs-12">
                          {row.fold ? `${row.fold}%` : '—'}
                        </div>
                      )}
                    </td>

                    {/* Amount (₹) */}
                    <td style={{ border: '1px solid #dee2e6', padding: '4px 6px', minWidth: '85px' }} className="text-end">
                      <div className="fw-bold text-dark fs-13">
                        ₹
                        {(Number(row.amount) || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    </td>

                    {/* Action: Trash Icon */}
                    {isEditing && (
                      <td style={{ border: '1px solid #dee2e6', padding: '4px 2px', width: '32px', minWidth: '32px' }} className="text-center">
                        <button
                          type="button"
                          className="btn btn-link p-0 text-danger border-0 d-inline-flex align-items-center justify-content-center"
                          style={{ width: '26px', height: '26px', opacity: 0.8 }}
                          onClick={() => handleRemoveItem(row.id)}
                          title="Remove row"
                        >
                          <i className="ti ti-trash fs-15"></i>
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
                  colSpan={showColorColumn ? 7 : 6}
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
        {!showColorColumn ? (
          <div className="d-flex align-items-center justify-content-between mt-1.5 text-muted fs-11 px-1">
            <span className="d-flex align-items-center gap-1">
              <i className="ti ti-info-circle text-primary"></i>
              <span>Color column is hidden for Greige fabric. Select &quot;Process&quot; in Fabric Type to add colors.</span>
            </span>
            <span style={{ color: '#94a3b8' }}>
              GST will be added per-line based on vendor state
            </span>
          </div>
        ) : (
          <div className="text-end text-muted fs-11 mt-1.5" style={{ color: '#94a3b8' }}>
            GST will be added per-line based on vendor state
          </div>
        )}
      </div>

      {/* SECTION 3: Delivery, Terms & Buffer Settings */}
      <div
        className="card mb-4 shadow-none"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px 24px'
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <span className="fs-12 fw-bold text-uppercase text-secondary" style={{ letterSpacing: '0.5px' }}>
            3. DELIVERY, ORDER &amp; BUFFER TERMS
          </span>
        </div>

        <div className="row g-3">
          {/* Expected Delivery Date */}
          <div className="col-12 col-md-4">
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

          {/* Link to Order (optional) */}
          <div className="col-12 col-md-4">
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
                {formData.linkedOrder && !orderList.some((ord) => ord.id === formData.linkedOrder) && (
                  <option value={formData.linkedOrder}>
                    {formData.linkedOrder}
                  </option>
                )}
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

          {/* Discount Terms */}
          <div className="col-12 col-md-4">
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
          <div className="col-12 border-top pt-3 mt-1">
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

      {/* SECTION 4: Notes (Image 1 Style) */}
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
                isPoLocked ? (
                  <span
                    className="badge bg-light text-secondary border px-3 py-2 fs-12 d-flex align-items-center gap-1.5"
                    title="GRN process has started. This Purchase Order is locked and cannot be edited."
                  >
                    <i className="ti ti-lock text-warning fs-14"></i>
                    <span>Locked (GRN Started)</span>
                  </span>
                ) : (
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
                )
              )}
              <button
                type="button"
                className="btn btn-white border px-3 py-2 fw-medium fs-13 rounded-3 text-secondary shadow-sm"
                style={{ borderRadius: '8px' }}
                onClick={handleCancel}
              >
                Back to List
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
                onClick={() => handleSubmit(isExisting && formData.status ? formData.status : 'Draft')}
              >
                <i className="ti ti-device-floppy fs-15" style={{ color: '#5b47fb' }}></i>
                <span>Save Draft</span>
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
      )}

      {/* Inline Modal: Fabric Master Creation */}
      {showInlineFabricModal && (
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
