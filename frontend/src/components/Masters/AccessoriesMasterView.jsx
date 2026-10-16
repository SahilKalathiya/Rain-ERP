import React, { useState, useEffect, useMemo } from 'react';
import {
  initialAccessoryMasters,
  getStoredData,
  setStoredData,
  getStoredAccessoriesMaster,
  initialThreadSizes,
  getStoredThreadSizes,
  setStoredThreadSizes,
  initialThreadBrandColors,
  getStoredThreadBrandColors,
  setStoredThreadBrandColors
} from '../../data/salesOrderData';

const ACCESSORY_CATEGORIES = [
  'Button',
  'Lace',
  'Tassel',
  'Thread',
  'Dori',
  'Elastic',
  'Beads & Sequins',
  'Hook',
  'Zipper',
  'Label',
  'Packaging',
  'Other'
];

const BASE_CATEGORIES = [
  'Buttons',
  'Lace',
  'Tassels',
  'Thread',
  'Dori',
  'Elastic',
  'Beads & Sequins',
  'Hook',
  'Zipper',
  'Label',
  'Packaging',
  'Other'
];

const ALL_TABS = [
  'All',
  ...BASE_CATEGORIES,
  'Thread Sizes',
  'Thread Brand & Colors'
];

const getCategoryIcon = (cat) => {
  switch (cat) {
    case 'Buttons': return 'ti ti-circle-dot';
    case 'Lace': return 'ti ti-cut';
    case 'Tassels': return 'ti ti-archive';
    case 'Thread': return 'ti ti-needle-thread';
    case 'Dori': return 'ti ti-wave-sine';
    case 'Elastic': return 'ti ti-arrows-horizontal';
    case 'Beads & Sequins': return 'ti ti-sparkles';
    case 'Hook': return 'ti ti-anchor';
    case 'Zipper': return 'ti ti-link';
    case 'Label': return 'ti ti-tag';
    case 'Packaging': return 'ti ti-package';
    case 'Other': return 'ti ti-paperclip';
    default: return 'ti ti-tag';
  }
};

const getCategoryColor = (cat) => {
  switch (cat) {
    case 'Buttons': return '#2e37a4';
    case 'Lace': return '#2563eb';
    case 'Tassels': return '#ea580c';
    case 'Thread': return '#0284c7';
    case 'Dori': return '#9333ea';
    case 'Elastic': return '#0284c7';
    case 'Beads & Sequins': return '#db2777';
    case 'Hook': return '#0d9488';
    case 'Zipper': return '#4f46e5';
    case 'Label': return '#b45309';
    case 'Packaging': return '#0369a1';
    case 'Other': return '#64748b';
    default: return '#2e37a4';
  }
};

const THREAD_PATTERNS = [
  'Stitching',
  'Kantha',
  'Couching',
  'Embroidery',
  'Button Tacking',
  'Handwork'
];

const ACCESSORY_UNITS = ['Piece', 'Meter', 'Packet', 'Box', 'Cone', 'Kilogram', 'Dozen', 'Gross'];
const CONTINUOUS_UNITS = ['Meter', 'Kilogram', 'Cone', 'Box', 'Packet'];
const SIZE_UNITS = ['mm', 'cm', 'inch'];

const FABRIC_QUALITIES = [
  'Grey Cotton Fabrics (100*100)',
  'Mulmul Cotton (100/100)',
  'Tussar Silk 42"',
  'Chanderi Silk 44"',
  'Suh Cotton 44"',
  '2.40/20s CF Cotton 47"',
  'Cotton Cambric 60*60'
];

const STANDARD_WIDTHS = ['42"', '44"', '48"', '58"'];

function TagInput({ label, tags = [], onChange, placeholder = 'Type a value, press Enter', suggestions = [] }) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = React.useRef(null);

  const addTag = (val) => {
    const items = (val || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!items.length) return;
    const newTags = [...tags];
    items.forEach((item) => {
      if (!newTags.includes(item)) {
        newTags.push(item);
      }
    });
    onChange(newTags);
    setInputValue('');
  };

  const removeTag = (indexToRemove, e) => {
    e?.stopPropagation();
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  return (
    <div className="mb-3">
      {label && (
        <label className="form-label fw-semibold text-dark small mb-1.5" style={{ fontSize: '13px' }}>
          {label}
        </label>
      )}
      <div
        className="form-control d-flex flex-wrap align-items-center gap-2"
        style={{
          minHeight: '42px',
          cursor: 'text',
          borderRadius: '8px',
          borderColor: isFocused ? '#6366f1' : '#cbd5e1',
          backgroundColor: '#ffffff',
          boxShadow: isFocused ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none',
          padding: '6px 12px',
          transition: 'all 0.15s ease'
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="d-inline-flex align-items-center px-2.5 py-1 rounded-pill"
            style={{
              backgroundColor: '#eef2ff',
              border: '1px solid #c7d2fe',
              color: '#4338ca',
              fontSize: '12px',
              fontWeight: 600,
              lineHeight: 1.2
            }}
          >
            <span>{tag}</span>
            <span
              role="button"
              tabIndex={0}
              className="d-inline-flex align-items-center justify-content-center rounded-circle ms-1.5"
              style={{
                width: '16px',
                height: '16px',
                fontSize: '12px',
                lineHeight: 1,
                cursor: 'pointer',
                backgroundColor: 'rgba(79, 70, 229, 0.12)',
                color: '#4338ca',
                transition: 'all 0.15s ease'
              }}
              onClick={(e) => removeTag(idx, e)}
              title={`Remove ${tag}`}
            >
              &times;
            </span>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          className="border-0 bg-transparent flex-grow-1 shadow-none text-dark"
          style={{
            minWidth: '160px',
            outline: 'none',
            fontSize: '13.5px',
            padding: '2px 4px'
          }}
          placeholder={tags.length === 0 ? placeholder : 'Type a value, press Enter'}
          value={inputValue}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="d-flex align-items-center gap-1.5 mt-2 flex-wrap">
          <span className="text-muted fw-semibold" style={{ fontSize: '11px' }}>Quick:</span>
          {suggestions.map((sug) => {
            const isSelected = tags.includes(sug);
            return (
              <button
                key={sug}
                type="button"
                className={`btn btn-xs py-0.5 px-2.5 rounded-pill border ${
                  isSelected
                    ? 'btn-primary text-white shadow-xs fw-semibold'
                    : 'bg-white text-secondary'
                }`}
                style={{
                  fontSize: '11.5px',
                  borderColor: isSelected ? '#6366f1' : '#e2e8f0'
                }}
                onClick={() => {
                  if (isSelected) {
                    onChange(tags.filter((t) => t !== sug));
                  } else {
                    onChange([...tags, sug]);
                  }
                }}
              >
                {isSelected ? `✓ ${sug}` : `+ ${sug}`}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AccessoriesMasterView({ isInline = false, onSaveInline, onCloseInline }) {
  const [accessories, setAccessories] = useState(() => getStoredAccessoriesMaster());
  const [selectedCategory, setSelectedCategory] = useState('Buttons');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(isInline);
  const [isCreatingNew, setIsCreatingNew] = useState(isInline);
  const [toastMessage, setToastMessage] = useState('');

  // Section 11.2 & 11.5 View Mode with Section-wise Edit State
  const [selectedAccessory, setSelectedAccessory] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionFormData, setSectionFormData] = useState({});

  // Section 8 State: Thread Sizes & Thread Brand Colors
  const [threadSizes, setThreadSizes] = useState(() => getStoredThreadSizes());
  const [threadColors, setThreadColors] = useState(() => getStoredThreadBrandColors());

  // Thread Suggestion Engine State (Section 8.1)
  const [calcMetres, setCalcMetres] = useState(1100);
  const [calcSuggestions, setCalcSuggestions] = useState(null);

  useEffect(() => {
    const handleUpdate = () => {
      setAccessories(getStoredAccessoriesMaster());
      setThreadSizes(getStoredThreadSizes());
      setThreadColors(getStoredThreadBrandColors());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('erp_accessories_master_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('erp_accessories_master_updated', handleUpdate);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Form State for Accessories (Matching Demo 5) - Starts completely clean and blank
  const getEmptyAccessoryForm = (cat = 'Buttons') => ({
    id: isInline ? `ACC-${Date.now().toString().slice(-4)}` : '',
    name: '',
    category: cat,
    unit: CONTINUOUS_UNITS.includes(cat) ? 'Meter' : 'Piece',
    piecesPerUnit: 1,
    maxBuffer: '',
    hsnCode: '',
    description: '',
    active: true,

    // Buttons
    buttonSizesList: [],
    buttonColorsList: [],
    variants: [],
    colors: [],

    // Lace
    laceSizeValue: '',
    laceSizeUnit: 'mm',
    defaultShrinkage: '',
    fabricPerMeterLace: '',

    // Tassels
    tasselType: 'Ready Made',
    jobWorkRows: [],

    // Dori / Elastic / Beads & Sequins
    fabricRows: [],
    fabricEntries: [],

    // Thread
    sizeValue: '',
    sizeUnit: 'mm',
    threadPattern: 'Stitching',
    threadPerStitch: 15,
    threadPerPiece: 60,
    boxes: [],
    coneSizes: [],
    placements: [],
    processRemarks: ''
  });

  const [formData, setFormData] = useState(() => getEmptyAccessoryForm('Buttons'));

  // Modal State for Section 8
  const [threadSizeModal, setThreadSizeModal] = useState(false);
  const [threadSizeForm, setThreadSizeForm] = useState({
    id: '',
    brandName: '',
    packagingType: 'Reel',
    packagingTypeOther: '',
    piecesPerBox: '',
    threadLengthPerPiece: '',
    boxCapacity: '',
    cones: '',
    active: true
  });

  const [threadColorModal, setThreadColorModal] = useState(false);
  const [threadColorForm, setThreadColorForm] = useState({
    id: '',
    brandName: '',
    colorNumber: '',
    colorCode: '',
    active: true
  });

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
  };

  const handleAddNew = () => {
    const targetCat = ALL_TABS.includes(selectedCategory) && selectedCategory !== 'Thread Sizes' && selectedCategory !== 'Thread Brand & Colors' && selectedCategory !== 'All'
      ? selectedCategory
      : 'Buttons';

    setFormData(getEmptyAccessoryForm(targetCat));
    setIsCreatingNew(true);
    setIsEditing(true);
    setSelectedAccessory(null);
  };

  const handleEditAccessory = (acc) => {
    const szList = acc.buttonSizesList?.length
      ? acc.buttonSizesList
      : (acc.buttonSizes ? acc.buttonSizes.split(',').map(s => s.trim()).filter(Boolean) : (acc.sizes?.length ? acc.sizes : (acc.size ? [acc.size] : [])));
    const clList = acc.buttonColorsList?.length
      ? acc.buttonColorsList
      : (acc.buttonColors ? acc.buttonColors.split(',').map(s => s.trim()).filter(Boolean) : (acc.colors?.length ? acc.colors : (acc.color ? [acc.color] : [])));

    setFormData({
      ...acc,
      name: acc.name || '',
      category: acc.category || 'Buttons',
      laceSizeValue: acc.laceSizeValue !== undefined ? acc.laceSizeValue : (acc.laceSize ? parseFloat(acc.laceSize) || '' : ''),
      laceSizeUnit: acc.laceSizeUnit || (acc.laceSize && acc.laceSize.includes('cm') ? 'cm' : (acc.laceSize && acc.laceSize.includes('inch') ? 'inch' : 'mm')),
      defaultShrinkage: acc.defaultShrinkage || '',
      fabricPerMeterLace: acc.fabricPerMeterLace || '',
      sizeValue: acc.sizeValue !== undefined ? acc.sizeValue : (acc.threadSize ? parseFloat(acc.threadSize) || '' : ''),
      sizeUnit: acc.sizeUnit || 'mm',
      unit: acc.unit || (CONTINUOUS_UNITS.includes(acc.category) ? 'Meter' : 'Piece'),
      piecesPerUnit: acc.piecesPerUnit !== undefined && acc.piecesPerUnit !== '' ? acc.piecesPerUnit : 1,
      threadPattern: acc.threadPattern || 'Kantha',
      threadPerStitch: acc.threadPerStitch !== undefined ? acc.threadPerStitch : 15,
      threadPerPiece: acc.threadPerPiece !== undefined ? acc.threadPerPiece : 60,
      boxes: acc.boxes || acc.boxesConfig || [],
      coneSizes: acc.coneSizes || [],
      placements: acc.placements || acc.availablePlacements || [],
      processRemarks: acc.processRemarks || '',
      jobWorkRows: acc.jobWorkRows || [],
      fabricRows: acc.fabricRows || acc.fabricEntries || [],
      buttonSizesList: szList,
      buttonColorsList: clList,
      variants: acc.variants || szList,
      colors: acc.colors || clList
    });
    setIsCreatingNew(false);
    setIsEditing(true);
  };

  const handleDeleteAccessory = (accId) => {
    if (!window.confirm('Are you sure you want to delete this accessory?')) return;
    const updated = accessories.filter((a) => a.id !== accId);
    setAccessories(updated);
    setStoredData('erp_accessories_master_v1', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('erp_accessories_master_updated', { detail: updated }));
    }
    showToast('Accessory deleted');
  };

  const saveAccessory = (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      alert('Accessory Name is required');
      return;
    }

    const capitalizedName = formData.name.replace(/\b\w/g, (c) => c.toUpperCase());
    const accObj = {
      ...formData,
      buttonSizes: (formData.buttonSizesList || []).join(', '),
      buttonColors: (formData.buttonColorsList || []).join(', '),
      buttonSizesList: formData.buttonSizesList || [],
      buttonColorsList: formData.buttonColorsList || [],
      variants: formData.variants || formData.buttonSizesList || [],
      colors: formData.colors || formData.buttonColorsList || [],
      laceSize: formData.laceSizeValue ? `${formData.laceSizeValue} ${formData.laceSizeUnit || 'mm'}` : (formData.laceSize || ''),
      threadSize: formData.sizeValue ? `${formData.sizeValue} ${formData.sizeUnit || 'mm'}` : (formData.threadSize || ''),
      boxesConfig: formData.boxes || formData.boxesConfig || [],
      fabricEntries: formData.fabricRows || formData.fabricEntries || [],
      name: capitalizedName,
      id: formData.id || `ACC-${Date.now().toString().slice(-4)}`
    };

    let updated;
    if (accessories.some((a) => a.id === accObj.id)) {
      updated = accessories.map((a) => (a.id === accObj.id ? accObj : a));
      showToast(`Accessory "${accObj.name}" updated`);
    } else {
      updated = [accObj, ...accessories];
      showToast(`Accessory "${accObj.name}" created`);
    }

    setAccessories(updated);
    setStoredData('erp_accessories_master_v1', updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('erp_accessories_master_updated', { detail: updated }));
    }

    if (isInline && onSaveInline) {
      onSaveInline(accObj);
      return;
    }

    // Section 11.2: Record opens in read-only View Mode by default
    setSelectedAccessory(accObj);
    setIsEditing(false);
    setIsCreatingNew(false);
    setEditingSection(null);
  };

  // Section 11.2 & 11.5 Section-wise Save in View Mode
  const saveAccessorySection = (secName) => {
    if (!selectedAccessory) return;
    const updated = {
      ...selectedAccessory,
      ...sectionFormData,
      buttonSizes: sectionFormData.buttonSizesList ? sectionFormData.buttonSizesList.join(', ') : selectedAccessory.buttonSizes,
      buttonColors: sectionFormData.buttonColorsList ? sectionFormData.buttonColorsList.join(', ') : selectedAccessory.buttonColors,
      buttonSizesList: sectionFormData.buttonSizesList || selectedAccessory.buttonSizesList || [],
      buttonColorsList: sectionFormData.buttonColorsList || selectedAccessory.buttonColorsList || [],
      lastModified: new Date().toISOString()
    };
    if (sectionFormData.name) {
      updated.name = sectionFormData.name.replace(/\b\w/g, (c) => c.toUpperCase());
    }

    const updatedList = accessories.map((a) => (a.id === updated.id ? updated : a));
    setAccessories(updatedList);
    setStoredData('erp_accessories_master_v1', updatedList);
    setSelectedAccessory(updated);
    setEditingSection(null);
    showToast(`Accessory ${secName.toUpperCase()} section saved`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('erp_accessories_master_updated', { detail: updatedList }));
    }
  };

  // Section 8.1 Intelligent Procurement Suggestion Engine (Page 14 & 22)
  const calculateThreadProcurement = (metres) => {
    const req = parseFloat(metres) || 0;
    if (req <= 0) return null;

    const results = [];
    threadSizes.forEach((tsz) => {
      const pieceLen = parseFloat(tsz.threadLengthPerPiece) || 20;
      const pcsPerBox = parseInt(tsz.piecesPerBox) || 1;
      const boxTotalLen = pcsPerBox * pieceLen;

      if (tsz.packagingType === 'Cone') {
        const conesNeeded = Math.ceil(req / pieceLen);
        const totalYield = conesNeeded * pieceLen;
        results.push({
          type: 'Cones',
          brand: tsz.brandName,
          text: `Order ${conesNeeded} Cone(s) of ${pieceLen}m (${tsz.brandName})`,
          totalMetres: totalYield,
          surplus: totalYield - req,
          optimal: totalYield >= req && (totalYield - req) < pieceLen
        });
      } else {
        const boxesNeeded = Math.ceil(req / boxTotalLen);
        const totalYield = boxesNeeded * boxTotalLen;
        results.push({
          type: 'Boxes',
          brand: tsz.brandName,
          text: `Order ${boxesNeeded} Box(es) of ${pcsPerBox} reels (${boxTotalLen}m/box, ${tsz.brandName})`,
          totalMetres: totalYield,
          surplus: totalYield - req,
          optimal: totalYield >= req && (totalYield - req) < boxTotalLen
        });
      }
    });

    results.sort((a, b) => a.surplus - b.surplus);
    return results;
  };

  // Filtered Accessories
  const filteredAccessories = useMemo(() => {
    return accessories.filter((acc) => {
      const matchCat =
        selectedCategory === 'All' ||
        selectedCategory === 'Thread Sizes' ||
        selectedCategory === 'Thread Brand & Colors' ||
        acc.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (acc.name && acc.name.toLowerCase().includes(q)) ||
        (acc.category && acc.category.toLowerCase().includes(q)) ||
        (acc.subType && acc.subType.toLowerCase().includes(q)) ||
        (acc.color && acc.color.toLowerCase().includes(q)) ||
        (acc.size && acc.size.toLowerCase().includes(q)) ||
        (acc.hsnCode && acc.hsnCode.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [accessories, selectedCategory, searchQuery]);

  return (
    <div className="p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 1100, transform: 'translateY(10px)' }}
        >
          <div className="toast show align-items-center text-white bg-dark border-0 rounded-3 shadow px-3 py-2">
            <div className="d-flex align-items-center gap-2">
              <i className="ti ti-check text-success"></i>
              <span className="small fw-medium">{toastMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Header & Search Bar (Matching Image 2 & Section 11.1) */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
        {/* Search Bar */}
        <div className="position-relative" style={{ minWidth: '280px', maxWidth: '380px', flex: 1 }}>
          <i
            className="ti ti-search text-muted"
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '15px',
              pointerEvents: 'none',
              zIndex: 2
            }}
          ></i>
          <input
            type="text"
            className="form-control rounded-pill bg-white"
            placeholder="Search accessories, sub types, HSN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ borderColor: '#cbd5e1', fontSize: '13.5px', height: '40px', paddingLeft: '40px' }}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn btn-sm btn-link position-absolute top-50 end-0 translate-middle-y me-2 text-muted p-0 text-decoration-none"
              onClick={() => setSearchQuery('')}
            >
              &times;
            </button>
          )}
        </div>

        {/* Category Dropdown & Add Button */}
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center bg-white border rounded-pill px-3 py-1.5 shadow-xs"
            style={{ borderColor: '#cbd5e1', height: '40px' }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#9333ea',
                display: 'inline-block',
                marginRight: '8px'
              }}
            />
            <select
              className="form-select border-0 bg-transparent p-0 pe-3 fw-semibold text-dark"
              style={{ boxShadow: 'none', cursor: 'pointer', fontSize: '13.5px', outline: 'none' }}
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              {ALL_TABS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {!isEditing && selectedCategory !== 'Thread Sizes' && selectedCategory !== 'Thread Brand & Colors' && (
            <button
              className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-3.5 py-2 fw-semibold"
              onClick={handleAddNew}
              style={{ height: '40px', fontSize: '13px' }}
            >
              <i className="ti ti-plus"></i> Add New Accessory
            </button>
          )}

          {selectedCategory === 'Thread Sizes' && (
            <button
              className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-3.5 py-2 fw-semibold"
              onClick={() => {
                setThreadSizeForm({
                  id: `TSZ-${String(threadSizes.length + 1).padStart(3, '0')}`,
                  brandName: '',
                  packagingType: 'Reel',
                  packagingTypeOther: '',
                  piecesPerBox: 15,
                  threadLengthPerPiece: 20,
                  boxCapacity: 300,
                  cones: 0,
                  active: true
                });
                setThreadSizeModal(true);
              }}
              style={{ height: '40px', fontSize: '13px' }}
            >
              <i className="ti ti-plus"></i> Add Thread Size
            </button>
          )}

          {selectedCategory === 'Thread Brand & Colors' && (
            <button
              className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-3.5 py-2 fw-semibold"
              onClick={() => {
                setThreadColorForm({
                  id: `TBC-${String(threadColors.length + 1).padStart(3, '0')}`,
                  brandName: 'Coats Astra',
                  colorNumber: '',
                  colorCode: '#2e37a4',
                  active: true
                });
                setThreadColorModal(true);
              }}
              style={{ height: '40px', fontSize: '13px' }}
            >
              <i className="ti ti-plus"></i> Add Thread Color
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="d-flex gap-2 mb-4 overflow-auto pb-2">
        {ALL_TABS.map((cat) => {
          const isThreadTab = cat === 'Thread Sizes' || cat === 'Thread Brand & Colors';
          const count = cat === 'All'
            ? accessories.length
            : !isThreadTab
            ? accessories.filter(a => a.category === cat).length
            : null;
          return (
            <button
              key={cat}
              className={`btn rounded-4 px-3.5 py-2 fw-semibold transition ${
                selectedCategory === cat ? 'btn-primary shadow-sm' : 'btn-white border text-secondary bg-white'
              }`}
              onClick={() => handleCategoryChange(cat)}
              style={{ fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              {cat} {count !== null ? `(${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
            {/* ========================================================================= */}
      {/* EDIT / ADD FORM MODAL FOR ACCESSORIES (THEME-WISE PRECLINIC ERP REPLICA)  */}
      {/* ========================================================================= */}
      {isEditing && (
        <div
          className="modal show d-block"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 1060,
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditing(false);
          }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '620px', width: '100%' }}>
            <div className="modal-content shadow-lg border-0 rounded-4 bg-white overflow-hidden">
              {/* Modal Header */}
              <div className="modal-header border-bottom py-3 px-4 d-flex justify-content-between align-items-center bg-white">
                <h5 className="modal-title fw-bold text-dark mb-0 fs-18">
                  {isCreatingNew ? 'New Accessory' : 'Edit Accessory'}
                </h5>
                <button
                  type="button"
                  className="btn-close shadow-none"
                  onClick={() => setIsEditing(false)}
                  aria-label="Close"
                ></button>
              </div>

              <form onSubmit={saveAccessory}>
                <div className="modal-body p-4" style={{ maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
                  {/* Row 1: Accessory Name & Category */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark small mb-1.5">
                        Accessory name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="e.g. Shell Button, Metallic Lace"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{ height: '42px', borderRadius: '8px' }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark small mb-1.5">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={formData.category === 'Buttons' ? 'Button' : (formData.category === 'Tassels' ? 'Tassel' : formData.category)}
                        onChange={(e) => {
                          const cat = e.target.value;
                          setFormData({
                            ...formData,
                            category: cat,
                            unit: CONTINUOUS_UNITS.includes(cat) ? 'Meter' : 'Piece'
                          });
                        }}
                        style={{ height: '42px', borderRadius: '8px' }}
                      >
                        {ACCESSORY_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ============================================================== */}
                  {/* CATEGORY 1: BUTTON / BUTTONS                                   */}
                  {/* ============================================================== */}
                  {(formData.category === 'Button' || formData.category === 'Buttons') && (
                    <>
                      <div className="row g-3 mb-3">
                        <div className="col-md-7">
                          <label className="form-label fw-semibold text-dark small mb-1.5">Unit</label>
                          <select
                            className="form-select"
                            value={formData.unit || 'Piece'}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            style={{ height: '42px', borderRadius: '8px' }}
                          >
                            {ACCESSORY_UNITS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-5">
                          <label className="form-label fw-semibold text-dark small mb-1.5">Pieces per unit</label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.piecesPerUnit ?? 1}
                            onChange={(e) => setFormData({ ...formData, piecesPerUnit: e.target.value })}
                            style={{ height: '42px', borderRadius: '8px' }}
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <TagInput
                          label="Button variants (sizes, e.g. 18L, 20L, 22L)"
                          tags={formData.variants?.length ? formData.variants : (formData.buttonSizesList || [])}
                          onChange={(newTags) => setFormData({ ...formData, variants: newTags, buttonSizesList: newTags })}
                          placeholder="Type a value, press Enter"
                        />
                      </div>
                      <div className="mb-3">
                        <TagInput
                          label="Button colors"
                          tags={formData.colors?.length ? formData.colors : (formData.buttonColorsList || [])}
                          onChange={(newTags) => setFormData({ ...formData, colors: newTags, buttonColorsList: newTags })}
                          placeholder="Type a value, press Enter"
                        />
                      </div>
                    </>
                  )}

                  {/* ============================================================== */}
                  {/* CATEGORY 2: LACE (SCREENSHOT 1)                                */}
                  {/* ============================================================== */}
                  {formData.category === 'Lace' && (
                    <>
                      <div className="row g-3 mb-3 align-items-end">
                        <div className="col-md-4">
                          <label className="form-label fw-semibold text-dark small mb-1.5">Lace size</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="e.g. 15"
                            value={formData.laceSizeValue ?? ''}
                            onChange={(e) => setFormData({ ...formData, laceSizeValue: e.target.value })}
                            style={{ height: '42px', borderRadius: '8px' }}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold text-dark small mb-1.5">Unit of size</label>
                          <select
                            className="form-select"
                            value={formData.laceSizeUnit || 'mm'}
                            onChange={(e) => setFormData({ ...formData, laceSizeUnit: e.target.value })}
                            style={{ height: '42px', borderRadius: '8px' }}
                          >
                            {SIZE_UNITS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4 pb-2">
                          <span
                            className="badge px-3 py-2 rounded-pill fw-semibold"
                            style={{
                              backgroundColor: '#eef2ff',
                              border: '1px solid #c7d2fe',
                              color: '#4338ca',
                              fontSize: '12px'
                            }}
                          >
                            = {formData.laceSizeValue || '—'} {formData.laceSizeUnit || 'mm'}
                          </span>
                        </div>
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-md-7">
                          <label className="form-label fw-semibold text-dark small mb-1.5">Ordering unit</label>
                          <select
                            className="form-select"
                            value={formData.unit || 'Meter'}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            style={{ height: '42px', borderRadius: '8px' }}
                          >
                            {CONTINUOUS_UNITS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-5">
                          <label className="form-label fw-semibold text-dark small mb-1.5">Default shrinkage (%)</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="e.g. 2"
                            value={formData.defaultShrinkage ?? ''}
                            onChange={(e) => setFormData({ ...formData, defaultShrinkage: e.target.value })}
                            style={{ height: '42px', borderRadius: '8px' }}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold text-dark small mb-1.5">Fabric required for 1m of lace</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 0.05"
                          value={formData.fabricPerMeterLace ?? ''}
                          onChange={(e) => setFormData({ ...formData, fabricPerMeterLace: e.target.value })}
                          style={{ height: '42px', borderRadius: '8px' }}
                        />
                      </div>

                      <p className="form-text text-muted mb-3" style={{ fontSize: '12.5px', lineHeight: 1.4 }}>
                        Lace is measured continuously, not counted per piece — there's no "pieces per unit" here.
                      </p>
                    </>
                  )}

                  {/* ============================================================== */}
                  {/* CATEGORY 3: TASSEL (SCREENSHOT 2)                              */}
                  {/* ============================================================== */}
                  {(formData.category === 'Tassel' || formData.category === 'Tassels') && (
                    <>
                      <div className="row g-3 mb-3">
                        <div className="col-md-7">
                          <label className="form-label fw-semibold text-dark small mb-1.5">Unit</label>
                          <select
                            className="form-select"
                            value={formData.unit || 'Piece'}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            style={{ height: '42px', borderRadius: '8px' }}
                          >
                            {ACCESSORY_UNITS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-5">
                          <label className="form-label fw-semibold text-dark small mb-1.5">Pieces per unit</label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.piecesPerUnit ?? 1}
                            onChange={(e) => setFormData({ ...formData, piecesPerUnit: e.target.value })}
                            style={{ height: '42px', borderRadius: '8px' }}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold text-dark small mb-1.5">Tassel type</label>
                        <select
                          className="form-select"
                          value={formData.tasselType || 'Ready Made'}
                          onChange={(e) => setFormData({ ...formData, tasselType: e.target.value })}
                          style={{ height: '42px', borderRadius: '8px' }}
                        >
                          <option value="Ready Made">Ready Made</option>
                          <option value="Job Work">Job Work</option>
                        </select>
                      </div>

                      {formData.tasselType === 'Job Work' && (
                        <div className="mb-3 p-3 bg-light rounded-3 border">
                          <div className="fw-semibold text-dark small mb-2">
                            Size &amp; thread consumption:
                          </div>
                          {(formData.jobWorkRows || []).map((r, i) => (
                            <div key={i} className="row g-2 align-items-end mb-2">
                              <div className="col-5">
                                <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>Size</label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={r.size || ''}
                                  onChange={(e) => {
                                    const updated = [...(formData.jobWorkRows || [])];
                                    updated[i] = { ...updated[i], size: e.target.value };
                                    setFormData({ ...formData, jobWorkRows: updated });
                                  }}
                                  style={{ height: '36px', borderRadius: '6px' }}
                                />
                              </div>
                              <div className="col-5">
                                <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>Thread consumption</label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={r.threadConsumption || ''}
                                  onChange={(e) => {
                                    const updated = [...(formData.jobWorkRows || [])];
                                    updated[i] = { ...updated[i], threadConsumption: e.target.value };
                                    setFormData({ ...formData, jobWorkRows: updated });
                                  }}
                                  style={{ height: '36px', borderRadius: '6px' }}
                                />
                              </div>
                              <div className="col-2 pb-1 text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                  onClick={() => {
                                    const updated = (formData.jobWorkRows || []).filter((_, idx) => idx !== i);
                                    setFormData({ ...formData, jobWorkRows: updated });
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-primary p-0 text-decoration-none fw-semibold"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                jobWorkRows: [...(formData.jobWorkRows || []), { size: '', threadConsumption: '' }]
                              });
                            }}
                          >
                            + Add more
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* ============================================================== */}
                  {/* CATEGORY 4: THREAD (SIZE AND EXTRA PROCESSES REMOVED)       */}
                  {/* ============================================================== */}
                  {formData.category === 'Thread' && (() => {
                    const showBoxCone = ['Kantha', 'Couching', 'Stitching'].includes(formData.threadPattern);
                    const showPlacements = ['Kantha', 'Couching'].includes(formData.threadPattern);
                    const showProcessOnly = ['Button Tacking', 'Handwork'].includes(formData.threadPattern);

                    return (
                      <>
                        <div className="row g-3 mb-3">
                          <div className="col-12">
                            <label className="form-label fw-semibold text-dark small mb-1.5">Ordering unit</label>
                            <select
                              className="form-select"
                              value={formData.unit || 'Meter'}
                              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                              style={{ height: '42px', borderRadius: '8px' }}
                            >
                              {CONTINUOUS_UNITS.map((u) => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <p className="form-text text-muted mb-3" style={{ fontSize: '12.5px', lineHeight: 1.4 }}>
                          Thread is measured continuously, not counted per piece — there's no "pieces per unit" here.
                        </p>

                        <div className="mb-3">
                          <label className="form-label fw-semibold text-dark small mb-1.5">Thread pattern</label>
                          <select
                            className="form-select"
                            value={formData.threadPattern || 'Stitching'}
                            onChange={(e) => {
                              const pat = e.target.value;
                              setFormData({
                                ...formData,
                                threadPattern: pat,
                                threadPerStitch: formData.threadPerStitch || 15,
                                threadPerPiece: formData.threadPerPiece || 60
                              });
                            }}
                            style={{ height: '42px', borderRadius: '8px' }}
                          >
                            {THREAD_PATTERNS.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>

                        {formData.threadPattern === 'Stitching' && (
                          <div className="mb-3">
                            <label className="form-label fw-semibold text-dark small mb-1.5">
                              Thread per piece (m)
                            </label>
                            <input
                              type="number"
                              className="form-control mb-1.5"
                              style={{ width: '130px', height: '42px', borderRadius: '8px' }}
                              value={formData.threadPerPiece ?? 60}
                              onChange={(e) => setFormData({ ...formData, threadPerPiece: e.target.value })}
                            />
                            <div className="form-text text-muted" style={{ fontSize: '12px' }}>
                              Auto-fills the BOM quantity per piece; remains editable there.
                            </div>
                          </div>
                        )}

                        {(formData.threadPattern === 'Kantha' || formData.threadPattern === 'Couching') && (
                          <div className="mb-3">
                            <label className="form-label fw-semibold text-dark small mb-1.5">
                              Thread per stitch (m per 1m of stitching)
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              style={{ width: '130px', height: '42px', borderRadius: '8px' }}
                              value={formData.threadPerStitch ?? 15}
                              onChange={(e) => setFormData({ ...formData, threadPerStitch: e.target.value })}
                            />
                          </div>
                        )}

                        {showBoxCone && (
                          <div className="mb-3 p-3 bg-light rounded-3 border">
                            <div className="fw-semibold text-dark small mb-2">
                              Available boxes (each box = 6000 m):
                            </div>
                            {(formData.boxes || []).map((b, i) => (
                              <div key={i} className="row g-2 align-items-end mb-2">
                                <div className="col-5">
                                  <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>Reels per box</label>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    value={b.reelsPerBox ?? ''}
                                    onChange={(e) => {
                                      const updated = [...(formData.boxes || [])];
                                      updated[i] = { ...updated[i], reelsPerBox: e.target.value };
                                      setFormData({ ...formData, boxes: updated });
                                    }}
                                    style={{ height: '36px', borderRadius: '6px' }}
                                  />
                                </div>
                                <div className="col-5">
                                  <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>Meters per reel</label>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    value={b.metersPerReel ?? ''}
                                    onChange={(e) => {
                                      const updated = [...(formData.boxes || [])];
                                      updated[i] = { ...updated[i], metersPerReel: e.target.value };
                                      setFormData({ ...formData, boxes: updated });
                                    }}
                                    style={{ height: '36px', borderRadius: '6px' }}
                                  />
                                </div>
                                <div className="col-2 pb-1 text-end">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                    onClick={() => {
                                      const updated = (formData.boxes || []).filter((_, idx) => idx !== i);
                                      setFormData({ ...formData, boxes: updated });
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-primary p-0 text-decoration-none fw-semibold"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  boxes: [...(formData.boxes || []), { reelsPerBox: '', metersPerReel: '' }]
                                });
                              }}
                            >
                              + Add more
                            </button>

                            <div className="mt-3">
                              <TagInput
                                label="Available cone sizes (m)"
                                tags={formData.coneSizes || []}
                                onChange={(newTags) => setFormData({ ...formData, coneSizes: newTags })}
                                placeholder="Type a value, press Enter"
                              />
                            </div>
                          </div>
                        )}

                        {showPlacements && (
                          <div className="mb-3">
                            <TagInput
                              label="Available placements"
                              tags={formData.placements || []}
                              onChange={(newTags) => setFormData({ ...formData, placements: newTags })}
                              placeholder="Type a value, press Enter"
                            />
                            <div className="form-text text-muted mt-1" style={{ fontSize: '12px' }}>
                              e.g. Sleeves, Front, Back — some may be predefined via Manufacturing Defaults.
                            </div>
                          </div>
                        )}
                        {formData.threadPattern === 'Embroidery' && (
                          <div className="form-text text-muted mb-3" style={{ fontSize: '12.5px' }}>
                            No additional measurements required for Embroidery.
                          </div>
                        )}

                        {showProcessOnly && (
                          <div className="mb-3">
                            <p className="form-text text-muted mb-2" style={{ fontSize: '12.5px' }}>
                              No special measurements required — the BOM only records that this process is required.
                            </p>
                            <label className="form-label fw-semibold text-dark small mb-1.5">Remarks (optional)</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Optional process remarks"
                              value={formData.processRemarks || ''}
                              onChange={(e) => setFormData({ ...formData, processRemarks: e.target.value })}
                              style={{ height: '42px', borderRadius: '8px' }}
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}

                                    {/* ============================================================== */}
                  {/* CATEGORY 5: DORI / ELASTIC / BEADS & SEQUINS (SCREENSHOT 3)     */}
                  {/* ============================================================== */}
                  {(formData.category === 'Dori' || formData.category === 'Elastic' || formData.category === 'Beads & Sequins') && (
                    <div className="mb-3">
                      <div className="fw-semibold text-dark small mb-2">
                        Fabric consumption (e.g. how much is needed per 1 m of fabric):
                      </div>
                      {(formData.fabricRows || []).map((r, i) => (
                        <div key={i} className="row g-2 align-items-end mb-2 p-2.5 bg-light rounded-3 border">
                          <div className="col-md-4">
                            <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>Associated fabric</label>
                            <select
                              className="form-select form-select-sm"
                              value={r.fabricName || r.fabricQuality || FABRIC_QUALITIES[0]}
                              onChange={(e) => {
                                const updated = [...(formData.fabricRows || [])];
                                updated[i] = { ...updated[i], fabricName: e.target.value, fabricQuality: e.target.value };
                                setFormData({ ...formData, fabricRows: updated });
                              }}
                              style={{ height: '36px', borderRadius: '6px' }}
                            >
                              {FABRIC_QUALITIES.map((fq) => (
                                <option key={fq} value={fq}>{fq}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-2">
                            <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>Required size</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={r.size || ''}
                              onChange={(e) => {
                                const updated = [...(formData.fabricRows || [])];
                                updated[i] = { ...updated[i], size: e.target.value };
                                setFormData({ ...formData, fabricRows: updated });
                              }}
                              style={{ height: '36px', borderRadius: '6px' }}
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>Unit</label>
                            <select
                              className="form-select form-select-sm"
                              value={r.unit || 'Meter'}
                              onChange={(e) => {
                                const updated = [...(formData.fabricRows || [])];
                                updated[i] = { ...updated[i], unit: e.target.value };
                                setFormData({ ...formData, fabricRows: updated });
                              }}
                              style={{ height: '36px', borderRadius: '6px' }}
                            >
                              {ACCESSORY_UNITS.map((u) => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-3">
                            <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>Consumption / 1m fabric</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={r.consumption ?? ''}
                              onChange={(e) => {
                                const updated = [...(formData.fabricRows || [])];
                                updated[i] = { ...updated[i], consumption: e.target.value };
                                setFormData({ ...formData, fabricRows: updated });
                              }}
                              style={{ height: '36px', borderRadius: '6px' }}
                            />
                          </div>
                          <div className="col-md-1 pb-1 text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                              onClick={() => {
                                const updated = (formData.fabricRows || []).filter((_, idx) => idx !== i);
                                setFormData({ ...formData, fabricRows: updated });
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-primary p-0 text-decoration-none fw-semibold"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            fabricRows: [
                              ...(formData.fabricRows || []),
                              { fabricName: FABRIC_QUALITIES[0], fabricQuality: FABRIC_QUALITIES[0], size: '', unit: 'Meter', consumption: '' }
                            ]
                          });
                        }}
                      >
                        + Add more
                      </button>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* OTHER CATEGORIES (HOOK, ZIPPER, LABEL, PACKAGING, OTHER)       */}
                  {/* ============================================================== */}
                  {!['Button', 'Buttons', 'Lace', 'Tassel', 'Tassels', 'Thread', 'Dori', 'Elastic', 'Beads & Sequins'].includes(formData.category) && (
                    <div className="row g-3 mb-3">
                      <div className="col-md-7">
                        <label className="form-label fw-semibold text-dark small mb-1.5">Unit</label>
                        <select
                          className="form-select"
                          value={formData.unit || 'Piece'}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          style={{ height: '42px', borderRadius: '8px' }}
                        >
                          {ACCESSORY_UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-5">
                        <label className="form-label fw-semibold text-dark small mb-1.5">Pieces per unit</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.piecesPerUnit ?? 1}
                          onChange={(e) => setFormData({ ...formData, piecesPerUnit: e.target.value })}
                          style={{ height: '42px', borderRadius: '8px' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* COMMON FIELDS: MAXIMUM BUFFER, HSN, ACTIVE (ALL 5 SCREENSHOTS) */}
                  {/* ============================================================== */}
                  <div className="row g-3 mb-3 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-dark small mb-1.5">Maximum buffer (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 5"
                        value={formData.maxBuffer ?? ''}
                        onChange={(e) => setFormData({ ...formData, maxBuffer: e.target.value })}
                        style={{ height: '42px', borderRadius: '8px' }}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-dark small mb-1.5">HSN code</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 9606"
                        value={formData.hsnCode || formData.hsn || ''}
                        onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value, hsn: e.target.value })}
                        style={{ height: '42px', borderRadius: '8px' }}
                      />
                    </div>
                    <div className="col-md-4 pb-2">
                      <div className="form-check d-flex align-items-center gap-2 m-0">
                        <input
                          className="form-check-input mt-0"
                          type="checkbox"
                          id="accThemeActiveCheckbox"
                          checked={!!formData.active}
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        />
                        <label className="form-check-label fw-semibold text-dark small" htmlFor="accThemeActiveCheckbox">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-1">
                    <label className="form-label fw-semibold text-dark small mb-1.5">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Enter accessory notes or details..."
                      value={formData.description || formData.desc || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value, desc: e.target.value })}
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                </div>

                {/* Modal Footer with Clean Theme Buttons */}
                <div className="modal-footer border-top py-3 px-4 d-flex justify-content-end gap-2 bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-3 px-4 fw-medium"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-3 px-4 fw-semibold"
                  >
                    <i className="ti ti-check me-1"></i> Save Accessory
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THREAD SIZES MASTER (PACKAGING & UNITS)                                   */}
      {/* ========================================================================= */}
      {selectedCategory === 'Thread Sizes' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold text-dark mb-1">
                Thread Sizes Master (Packaging & Units)
              </h5>
              <p className="text-muted small mb-0">
                Packaging types, piece lengths and intelligent procurement suggestion calculations
              </p>
            </div>
          </div>

          {/* Interactive Procurement Suggestion Engine Box */}
          <div className="p-3.5 mb-4 rounded-3 border" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <i className="ti ti-calculator fs-5 text-success"></i>
              <span className="fw-bold text-success">Intelligent Procurement Suggestion Engine</span>
            </div>
            <p className="text-muted small mb-2">
              Enter thread consumption required in Sales Order; evaluates available sizes and suggests optimal purchase packages:
            </p>
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="input-group" style={{ maxWidth: '240px' }}>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="e.g. 1100"
                  value={calcMetres}
                  onChange={(e) => setCalcMetres(e.target.value)}
                />
                <span className="input-group-text bg-white small">metres</span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-success fw-semibold"
                onClick={() => setCalcSuggestions(calculateThreadProcurement(calcMetres))}
              >
                Calculate Suggestions
              </button>
            </div>

            {calcSuggestions && (
              <div className="d-flex flex-column gap-1.5 mt-2">
                {calcSuggestions.map((sug, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-2.5 rounded-2 bg-white border d-flex justify-content-between align-items-center"
                    style={{ borderColor: sug.optimal ? '#86efac' : '#e2e8f0' }}
                  >
                    <div>
                      <span className="fw-bold text-dark small">{sug.text}</span>
                      <span className="text-muted small ms-2">
                        Yield: {sug.totalMetres}m ({sug.surplus > 0 ? `+${sug.surplus}m surplus` : 'exact'})
                      </span>
                    </div>
                    {sug.optimal && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        Optimal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table of Thread Sizes */}
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-uppercase fw-bold text-muted">
                <tr>
                  <th>ID</th>
                  <th>Brand Name</th>
                  <th>Packaging Type</th>
                  <th>Pieces / Box</th>
                  <th>Length / Piece</th>
                  <th>Box Capacity</th>
                  <th>Cones</th>
                  <th>Status</th>
                  <th style={{ width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {threadSizes.map((tsz) => (
                  <tr key={tsz.id}>
                    <td className="font-monospace small">{tsz.id}</td>
                    <td className="fw-bold text-dark">{tsz.brandName}</td>
                    <td>
                      <span className="badge bg-purple-subtle text-purple border px-2 py-1">
                        {tsz.packagingType}
                      </span>
                    </td>
                    <td>{tsz.piecesPerBox} pcs</td>
                    <td>{tsz.threadLengthPerPiece} m</td>
                    <td>{tsz.boxCapacity ? `${tsz.boxCapacity} m` : '—'}</td>
                    <td>{tsz.cones || 0}</td>
                    <td>
                      <span style={{ color: tsz.active ? '#16a34a' : '#94a3b8', fontWeight: 600, fontSize: '12px' }}>
                        {tsz.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={() => {
                          if (window.confirm('Delete thread size?')) {
                            const upd = threadSizes.filter((x) => x.id !== tsz.id);
                            setThreadSizes(upd);
                            setStoredThreadSizes(upd);
                          }
                        }}
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THREAD BRAND & COLOR CODE MASTER                                          */}
      {/* ========================================================================= */}
      {selectedCategory === 'Thread Brand & Colors' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold text-dark mb-1">
                Thread Brand & Color Code Master
              </h5>
              <p className="text-muted small mb-0">
                Brand thread catalog with Color Number, HEX code, and live visual swatch preview
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-uppercase fw-bold text-muted">
                <tr>
                  <th>ID</th>
                  <th>Brand Name</th>
                  <th>Color Number</th>
                  <th>Color Code (Hex)</th>
                  <th>Visual Swatch Preview</th>
                  <th>Status</th>
                  <th style={{ width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {threadColors.map((tbc) => (
                  <tr key={tbc.id}>
                    <td className="font-monospace small">{tbc.id}</td>
                    <td className="fw-bold text-dark">{tbc.brandName}</td>
                    <td className="font-monospace fw-semibold">{tbc.colorNumber}</td>
                    <td className="font-monospace">{tbc.colorCode}</td>
                    <td>
                      {/* Small colored square preview box displayed immediately (Section 8.2 & 12.5) */}
                      <div className="d-flex align-items-center gap-2">
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            backgroundColor: tbc.colorCode || '#333333',
                            border: '1px solid rgba(0,0,0,0.15)',
                            display: 'inline-block'
                          }}
                        />
                        <span className="small text-muted">{tbc.colorCode}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: tbc.active ? '#16a34a' : '#94a3b8', fontWeight: 600, fontSize: '12px' }}>
                        {tbc.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={() => {
                          if (window.confirm('Delete thread color?')) {
                            const upd = threadColors.filter((x) => x.id !== tbc.id);
                            setThreadColors(upd);
                            setStoredThreadBrandColors(upd);
                          }
                        }}
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 11.2 & 11.5: READ-ONLY VIEW MODE WITH SECTION-WISE EDIT           */}
      {/* ========================================================================= */}
      {selectedAccessory && !isEditing && (
        <div className="d-flex flex-column gap-4 mb-4">
          {/* Top Banner */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-4 d-flex align-items-center justify-content-center text-white shadow-sm"
                  style={{ width: '56px', height: '56px', backgroundColor: '#a855f7', fontSize: '26px' }}
                >
                  <i className={
                    selectedAccessory.category === 'Lace' ? 'ti ti-cut' :
                    selectedAccessory.category === 'Tassels' ? 'ti ti-archive' :
                    selectedAccessory.category === 'Thread' ? 'ti ti-needle-thread' :
                    selectedAccessory.category === 'Dori' ? 'ti ti-wave-sine' :
                    selectedAccessory.category === 'Elastic' ? 'ti ti-arrows-horizontal' :
                    selectedAccessory.category === 'Buttons' ? 'ti ti-circle-dot' : 'ti ti-tag'
                  }></i>
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-purple-subtle text-purple font-monospace px-2.5 py-1 rounded-2">
                      {selectedAccessory.id}
                    </span>
                    <h4 className="fw-bold text-dark mb-0">{selectedAccessory.name}</h4>
                    <span className={`badge ${selectedAccessory.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2.5 py-1 rounded-pill`}>
                      {selectedAccessory.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-muted small mt-1">
                    Category: <strong>{selectedAccessory.category}</strong> &bull; Unit: {selectedAccessory.unit || 'Piece'} ({selectedAccessory.piecesPerUnit || 1} pcs/unit)
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-3 px-3"
                  onClick={() => {
                    setSelectedAccessory(null);
                    setEditingSection(null);
                  }}
                >
                  <i className="ti ti-arrow-left me-1"></i> Back to Grid
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm rounded-3 px-3 fw-semibold"
                  onClick={() => {
                    handleEditAccessory(selectedAccessory);
                    setSelectedAccessory(null);
                  }}
                >
                  <i className="ti ti-edit me-1"></i> Edit Full Accessory
                </button>
              </div>
            </div>
          </div>

          {/* Logical Sections */}
          <div className="row g-4">
            {/* Section 1: Base Identity & Unit Details */}
            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-dark fs-14">
                    <i className="ti ti-info-circle text-primary me-1.5"></i> Base Identity & Unit Details
                  </span>
                  {editingSection === 'base' ? (
                    <div className="d-flex gap-1.5">
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary rounded-2 px-2 py-1 small"
                        onClick={() => setEditingSection(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-primary rounded-2 px-2.5 py-1 small fw-semibold"
                        onClick={() => saveAccessorySection('base')}
                      >
                        Save Section
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-xs btn-light text-primary rounded-2 px-2.5 py-1 small fw-semibold border"
                      onClick={() => {
                        setEditingSection('base');
                        setSectionFormData({ ...selectedAccessory });
                      }}
                    >
                      <i className="ti ti-edit me-1"></i> Edit Section
                    </button>
                  )}
                </div>
                <div className="card-body p-4">
                  {editingSection === 'base' ? (
                    <div className="d-flex flex-column gap-3">
                      <div>
                        <label className="form-label small fw-semibold text-muted">Accessory Name *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={sectionFormData.name || ''}
                          onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })}
                        />
                      </div>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label small fw-semibold text-muted">Unit</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={sectionFormData.unit || ''}
                            onChange={(e) => setSectionFormData({ ...sectionFormData, unit: e.target.value })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold text-muted">Pieces Per Unit</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={sectionFormData.piecesPerUnit || ''}
                            onChange={(e) => setSectionFormData({ ...sectionFormData, piecesPerUnit: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>
                      <div className="form-check form-switch mt-1">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="accBaseActive"
                          checked={sectionFormData.active}
                          onChange={(e) => setSectionFormData({ ...sectionFormData, active: e.target.checked })}
                        />
                        <label className="form-check-label small fw-semibold" htmlFor="accBaseActive">
                          Active Status
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      <div>
                        <div className="text-muted small">Accessory ID</div>
                        <div className="fw-bold font-monospace text-primary">{selectedAccessory.id}</div>
                      </div>
                      <div>
                        <div className="text-muted small">Accessory Name</div>
                        <div className="fw-bold text-dark fs-15">{selectedAccessory.name}</div>
                      </div>
                      <div>
                        <div className="text-muted small">Category</div>
                        <span className="badge bg-purple-subtle text-purple border px-2.5 py-1">
                          {selectedAccessory.category}
                        </span>
                      </div>
                      <div>
                        <div className="text-muted small">Unit & Pieces</div>
                        <div className="fw-semibold text-dark">
                          {selectedAccessory.unit || 'Piece'} &bull; {selectedAccessory.piecesPerUnit || 1} pcs per unit
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Category Specification */}
            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-dark fs-14">
                    <i className="ti ti-adjustments text-primary me-1.5"></i> {selectedAccessory.category} Configuration
                  </span>
                  {editingSection === 'category' ? (
                    <div className="d-flex gap-1.5">
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary rounded-2 px-2 py-1 small"
                        onClick={() => setEditingSection(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-primary rounded-2 px-2.5 py-1 small fw-semibold"
                        onClick={() => saveAccessorySection('category')}
                      >
                        Save Section
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-xs btn-light text-primary rounded-2 px-2.5 py-1 small fw-semibold border"
                      onClick={() => {
                        setEditingSection('category');
                        setSectionFormData({ ...selectedAccessory });
                      }}
                    >
                      <i className="ti ti-edit me-1"></i> Edit Section
                    </button>
                  )}
                </div>
                <div className="card-body p-4">
                  {selectedAccessory.category === 'Buttons' && (
                    editingSection === 'category' ? (
                      <div className="d-flex flex-column gap-3">
                        <TagInput
                          label="Primary Size / Ligne"
                          tags={sectionFormData.buttonSizesList?.length ? sectionFormData.buttonSizesList : (sectionFormData.buttonSizes ? sectionFormData.buttonSizes.split(',').map(s => s.trim()).filter(Boolean) : (sectionFormData.size ? [sectionFormData.size] : []))}
                          onChange={(newTags) => {
                            setSectionFormData({
                              ...sectionFormData,
                              buttonSizesList: newTags,
                              buttonSizes: newTags.join(', '),
                              size: newTags[0] || ''
                            });
                          }}
                          placeholder="Type a value, press Enter"
                          suggestions={['14L', '16L', '18L', '20L', '22L', '24L', '28L', '32L']}
                        />
                        <TagInput
                          label="Primary Color"
                          tags={sectionFormData.buttonColorsList?.length ? sectionFormData.buttonColorsList : (sectionFormData.buttonColors ? sectionFormData.buttonColors.split(',').map(s => s.trim()).filter(Boolean) : (sectionFormData.color ? [sectionFormData.color] : []))}
                          onChange={(newTags) => {
                            setSectionFormData({
                              ...sectionFormData,
                              buttonColorsList: newTags,
                              buttonColors: newTags.join(', '),
                              color: newTags[0] || ''
                            });
                          }}
                          placeholder="Type a value, press Enter"
                          suggestions={['Natural', 'Dark Brown', 'Gold', 'Silver', 'Black', 'White', 'Tortoise']}
                        />
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-2.5">
                        {selectedAccessory.subType && (
                          <div>
                            <div className="text-muted small">Sub Type</div>
                            <span className="badge bg-light text-dark border px-2 py-1">{selectedAccessory.subType}</span>
                          </div>
                        )}
                        <div>
                          <div className="text-muted small">Button Variants (Sizes)</div>
                          <div className="d-flex flex-wrap gap-1.5 mt-1">
                            {(selectedAccessory.buttonSizesList || (selectedAccessory.buttonSizes ? selectedAccessory.buttonSizes.split(',').map(s => s.trim()).filter(Boolean) : [selectedAccessory.size || '18L'])).map((sz, i) => (
                              <span
                                key={i}
                                className="d-inline-flex align-items-center px-2.5 py-0.5 rounded-pill font-monospace"
                                style={{
                                  backgroundColor: '#eef2ff',
                                  border: '1px solid #c7d2fe',
                                  color: '#4338ca',
                                  fontSize: '12.5px',
                                  fontWeight: 600
                                }}
                              >
                                {sz}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted small">Button Colors</div>
                          <div className="d-flex flex-wrap gap-1.5 mt-1">
                            {(selectedAccessory.buttonColorsList || (selectedAccessory.buttonColors ? selectedAccessory.buttonColors.split(',').map(s => s.trim()).filter(Boolean) : [selectedAccessory.color || 'Natural'])).map((cl, i) => (
                              <span
                                key={i}
                                className="d-inline-flex align-items-center px-2.5 py-0.5 rounded-pill"
                                style={{
                                  backgroundColor: '#eef2ff',
                                  border: '1px solid #c7d2fe',
                                  color: '#4338ca',
                                  fontSize: '12.5px',
                                  fontWeight: 600
                                }}
                              >
                                {cl}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {selectedAccessory.category === 'Lace' && (
                    <div className="d-flex flex-column gap-2.5">
                      <div>
                        <div className="text-muted small">Lace Size (Free text)</div>
                        <div className="fw-bold text-dark">{selectedAccessory.laceSize || selectedAccessory.size || '18 mm'}</div>
                      </div>
                      <div>
                        <div className="text-muted small">Default Shrinkage (%)</div>
                        <div className="fw-semibold text-secondary">{selectedAccessory.defaultShrinkage ? `${selectedAccessory.defaultShrinkage}%` : '0%'}</div>
                      </div>
                      <div className="p-2 bg-light rounded text-muted small">
                        Note: Fabric requirement calculation is automated in BOM.
                      </div>
                    </div>
                  )}

                  {selectedAccessory.category === 'Tassels' && (
                    <div className="d-flex flex-column gap-2.5">
                      <div>
                        <div className="text-muted small">Tassel Type</div>
                        <span className="badge bg-primary-subtle text-primary px-2.5 py-1">{selectedAccessory.tasselType || 'Ready Made'}</span>
                      </div>
                      {selectedAccessory.tasselType === 'Job Work' && (
                        <div>
                          <div className="text-muted small mb-1">Job Work Sizes & Thread Consumption:</div>
                          {(selectedAccessory.jobWorkRows || []).map((row, rIdx) => (
                            <div key={rIdx} className="p-2 bg-light rounded border mb-1 small d-flex justify-content-between">
                              <span>Size: <strong>{row.size}</strong></span>
                              <span>Consumption: <strong>{row.threadConsumption} m</strong></span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedAccessory.category === 'Dori' && (
                    <div className="d-flex flex-column gap-2.5">
                      <div>
                        <div className="text-muted small">Required Size & Unit</div>
                        <div className="fw-bold text-dark">{selectedAccessory.doriRequiredSize || '40 cm'} ({selectedAccessory.unit || 'Meter'})</div>
                      </div>
                      <div>
                        <div className="text-muted small mb-1">Fabric Consumption Entries:</div>
                        {(selectedAccessory.fabricEntries || []).map((fe, fIdx) => (
                          <div key={fIdx} className="p-2 bg-light rounded border mb-1.5 small">
                            <div className="fw-bold text-dark mb-1">{fe.fabricQuality}</div>
                            <div className="text-muted">
                              Widths: {(fe.widthSizes || []).map(w => `${w} (${fe.consumptions?.[w] || '—'} cm)`).join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedAccessory.category === 'Elastic' || selectedAccessory.category === 'Beads & Sequins') && (
                    <div className="d-flex flex-column gap-2.5">
                      <div>
                        <div className="text-muted small">Associated Fabric Quality</div>
                        <div className="fw-bold text-dark">{selectedAccessory.associatedFabric || 'Mulmul Cotton'}</div>
                      </div>
                      <div>
                        <div className="text-muted small">Required Size</div>
                        <div className="fw-semibold text-secondary">{selectedAccessory.requiredSize || '1 inch'}</div>
                      </div>
                      <div>
                        <div className="text-muted small">Fabric Consumption</div>
                        <div className="fw-bold text-primary">{selectedAccessory.fabricConsumption || 0.85} per 1m fabric</div>
                      </div>
                    </div>
                  )}

                  {selectedAccessory.category === 'Thread' && (
                    <div className="d-flex flex-column gap-2.5">
                      <div>
                        <div className="text-muted small">Thread Pattern</div>
                        <span className="badge bg-purple-subtle text-purple border px-2.5 py-1">{selectedAccessory.threadPattern || 'Kantha'}</span>
                      </div>
                      {['Kantha', 'Couching'].includes(selectedAccessory.threadPattern) && (
                        <div>
                          <div className="text-muted small">Global Thread Stitching Metric</div>
                          <div className="fw-bold text-dark">{selectedAccessory.globalThreadMetric || 15} m / stitch metre</div>
                          <div className="text-muted small mt-2">Article Placements:</div>
                          {(selectedAccessory.articlePlacements || []).map((ap, apIdx) => (
                            <div key={apIdx} className="p-2 bg-light rounded border mb-1 small">
                              <strong>{ap.article}</strong>: {(ap.placements || []).map(p => `${p.placement} (${p.threadRequired}m)`).join(', ')}
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedAccessory.threadPattern === 'Stitching' && (
                        <div>
                          <div className="text-muted small">Thread Per Piece (BOM Default)</div>
                          <div className="fw-bold text-dark">{selectedAccessory.threadPerPiece || 60} m / piece</div>
                          <div className="text-muted small mt-2">Consumption per 100 pcs:</div>
                          {Object.entries(selectedAccessory.consumptionPer100Pcs || {}).map(([art, m]) => (
                            <div key={art} className="badge bg-light text-dark border me-1 mt-1">{art}: {m}m / 100 pcs</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Common Fields */}
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4 bg-white">
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-dark fs-14">
                    <i className="ti ti-shield-check text-primary me-1.5"></i> Common ERP & Compliance Fields
                  </span>
                  {editingSection === 'common' ? (
                    <div className="d-flex gap-1.5">
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary rounded-2 px-2 py-1 small"
                        onClick={() => setEditingSection(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-primary rounded-2 px-2.5 py-1 small fw-semibold"
                        onClick={() => saveAccessorySection('common')}
                      >
                        Save Section
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-xs btn-light text-primary rounded-2 px-2.5 py-1 small fw-semibold border"
                      onClick={() => {
                        setEditingSection('common');
                        setSectionFormData({ ...selectedAccessory });
                      }}
                    >
                      <i className="ti ti-edit me-1"></i> Edit Section
                    </button>
                  )}
                </div>
                <div className="card-body p-4">
                  <div className="row g-4">
                    <div className="col-md-3">
                      <div className="text-muted small">Maximum Buffer</div>
                      <div className="fw-bold text-dark mt-1">{selectedAccessory.maxBuffer ? `${selectedAccessory.maxBuffer}%` : '—'}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-muted small">HSN Code</div>
                      <div className="fw-bold font-monospace text-dark mt-1">{selectedAccessory.hsnCode || '—'}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-muted small">Status</div>
                      <span className={`badge ${selectedAccessory.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2.5 py-1 rounded-pill mt-1`}>
                        {selectedAccessory.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="col-md-3">
                      <div className="text-muted small">Last Modified</div>
                      <div className="small text-secondary mt-1">{selectedAccessory.lastModified ? new Date(selectedAccessory.lastModified).toLocaleDateString() : 'Active'}</div>
                    </div>
                    <div className="col-12">
                      <div className="text-muted small">Description / Specifications</div>
                      <div className="p-2.5 bg-light rounded text-secondary small border mt-1">
                        {selectedAccessory.description || 'No description entered.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STANDARD ACCESSORIES GRID                                                 */}
      {/* ========================================================================= */}
      {selectedCategory !== 'Thread Sizes' && selectedCategory !== 'Thread Brand & Colors' && !isEditing && !selectedAccessory && (
        <div className="row g-3">
          {filteredAccessories.map((acc) => {
            const isButton = acc.category === 'Buttons';
            return (
              <div key={acc.id} className="col-md-6 col-lg-4">
                <div
                  className="card border-0 shadow-xs h-100 transition-all hover-elevate"
                  style={{
                    borderRadius: '14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '210px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedAccessory(acc);
                    setEditingSection(null);
                  }}
                >
                  {/* Top: Icon + Title/Subtitle + Actions (Matching Image 2) */}
                  <div className="d-flex justify-content-between align-items-start mb-2.5">
                    <div className="d-flex align-items-center gap-2.5">
                      {/* Squircle Icon */}
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '11px',
                          backgroundColor: getCategoryColor(acc.category),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: `0 2px 5px ${getCategoryColor(acc.category)}40`
                        }}
                      >
                        {isButton ? (
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              border: '2px solid rgba(255, 255, 255, 0.7)'
                            }}
                          />
                        ) : (
                          <i
                            className={`${getCategoryIcon(acc.category)} text-white`}
                            style={{ fontSize: '18px' }}
                          />
                        )}
                      </div>

                      <div>
                        <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '15px', lineHeight: 1.25 }}>
                          {acc.name}
                        </h6>
                        <span className="text-muted" style={{ fontSize: '12.5px' }}>
                          {isButton ? 'Button' : acc.category}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-light p-1 rounded-2 text-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAccessory(acc);
                        }}
                        title="Edit Accessory"
                        style={{ width: '28px', height: '28px' }}
                      >
                        <i className="ti ti-edit" style={{ fontSize: '14px' }}></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-light p-1 rounded-2 text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAccessory(acc.id);
                        }}
                        title="Delete Accessory"
                        style={{ width: '28px', height: '28px' }}
                      >
                        <i className="ti ti-trash" style={{ fontSize: '14px' }}></i>
                      </button>
                    </div>
                  </div>

                  {/* Attribute Badges */}
                  <div className="d-flex flex-wrap gap-2 mb-2.5">
                    {acc.subType && (
                      <div
                        style={{
                          backgroundColor: '#eff6ff',
                          border: '1px solid #dbeafe',
                          borderRadius: '8px',
                          padding: '3px 8px',
                          fontSize: '11.5px',
                          color: '#1d4ed8',
                          fontWeight: 600
                        }}
                      >
                        Sub Type: {acc.subType}
                      </div>
                    )}
                    {(acc.size || acc.laceSize || acc.requiredSize || acc.doriRequiredSize) && (
                      <div
                        style={{
                          backgroundColor: '#fefce8',
                          border: '1px solid #fef08a',
                          borderRadius: '8px',
                          padding: '3px 8px',
                          fontSize: '11.5px',
                          color: '#854d0e',
                          fontWeight: 600
                        }}
                      >
                        Size: {acc.size || acc.laceSize || acc.requiredSize || acc.doriRequiredSize}
                      </div>
                    )}
                    {acc.color && (
                      <div
                        style={{
                          backgroundColor: '#fdf2f8',
                          border: '1px solid #fbcfe8',
                          borderRadius: '8px',
                          padding: '3px 8px',
                          fontSize: '11.5px',
                          color: '#9d174d',
                          fontWeight: 600
                        }}
                      >
                        Color: {acc.color}
                      </div>
                    )}
                    {acc.threadPattern && (
                      <div
                        style={{
                          backgroundColor: '#f5f3ff',
                          border: '1px solid #ddd6fe',
                          borderRadius: '8px',
                          padding: '3px 8px',
                          fontSize: '11.5px',
                          color: '#5b21b6',
                          fontWeight: 600
                        }}
                      >
                        Pattern: {acc.threadPattern}
                      </div>
                    )}
                    {acc.tasselType && (
                      <div
                        style={{
                          backgroundColor: '#fff7ed',
                          border: '1px solid #ffedd5',
                          borderRadius: '8px',
                          padding: '3px 8px',
                          fontSize: '11.5px',
                          color: '#c2410c',
                          fontWeight: 600
                        }}
                      >
                        Type: {acc.tasselType}
                      </div>
                    )}
                  </div>

                  {/* Unit Tag */}
                  <div className="mb-3">
                    <span
                      style={{
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        color: '#475569',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2.5px 8px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}
                    >
                      {acc.unit || 'PCS'}
                    </span>
                  </div>

                  {/* Bottom Footer: Active + HSN (Matching Image 2) */}
                  <div
                    className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center"
                    style={{ borderColor: '#f1f5f9' }}
                  >
                    <span style={{ color: acc.active ? '#16a34a' : '#94a3b8', fontWeight: 600, fontSize: '12px' }}>
                      {acc.active ? 'Active' : 'Inactive'}
                    </span>
                    {acc.hsnCode && (
                      <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}>
                        HSN: {acc.hsnCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAccessories.length === 0 && (
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted bg-white">
                <i className="ti ti-box fs-1 d-block mb-2 opacity-50"></i>
                No accessories found matching your filter. Click "+ Add New Accessory" above.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD THREAD SIZE (SECTION 8.1)                                      */}
      {/* ========================================================================= */}
      {threadSizeModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark">Add Thread Size (Packaging & Units)</h5>
                <button type="button" className="btn-close" onClick={() => setThreadSizeModal(false)}></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!threadSizeForm.brandName.trim()) {
                    alert('Brand Name is required');
                    return;
                  }
                  const pkg = threadSizeForm.packagingType === 'Other'
                    ? (threadSizeForm.packagingTypeOther || 'Custom')
                    : threadSizeForm.packagingType;

                  const newTsz = {
                    ...threadSizeForm,
                    packagingType: pkg,
                    id: threadSizeForm.id || `TSZ-${String(threadSizes.length + 1).padStart(3, '0')}`
                  };
                  const upd = [...threadSizes, newTsz];
                  setThreadSizes(upd);
                  setStoredThreadSizes(upd);
                  setThreadSizeModal(false);
                  showToast('Thread Size added');
                }}
              >
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold small text-muted">Brand Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Coats India, Vardhman"
                        required
                        value={threadSizeForm.brandName}
                        onChange={(e) => setThreadSizeForm({ ...threadSizeForm, brandName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Packaging Type *</label>
                      <select
                        className="form-select"
                        value={threadSizeForm.packagingType}
                        onChange={(e) => setThreadSizeForm({ ...threadSizeForm, packagingType: e.target.value })}
                      >
                        <option value="Reel">Reel</option>
                        <option value="Cone">Cone</option>
                        <option value="Box">Box</option>
                        <option value="Other">Other (Custom)</option>
                      </select>
                      {threadSizeForm.packagingType === 'Other' && (
                        <input
                          type="text"
                          className="form-control form-control-sm mt-1"
                          placeholder="Enter custom packaging"
                          value={threadSizeForm.packagingTypeOther}
                          onChange={(e) => setThreadSizeForm({ ...threadSizeForm, packagingTypeOther: e.target.value })}
                        />
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Pieces per Box *</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="15"
                        required
                        value={threadSizeForm.piecesPerBox}
                        onChange={(e) => setThreadSizeForm({ ...threadSizeForm, piecesPerBox: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Thread Length per Piece (metres) *</label>
                      <input
                        type="number"
                        step="0.5"
                        className="form-control"
                        placeholder="20"
                        required
                        value={threadSizeForm.threadLengthPerPiece}
                        onChange={(e) => setThreadSizeForm({ ...threadSizeForm, threadLengthPerPiece: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Box Capacity (metres)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="300"
                        value={threadSizeForm.boxCapacity}
                        onChange={(e) => setThreadSizeForm({ ...threadSizeForm, boxCapacity: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top py-3 px-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setThreadSizeModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-semibold">
                    Save Thread Size
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD THREAD BRAND & COLOR (SECTION 8.2)                             */}
      {/* ========================================================================= */}
      {threadColorModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark">Add Thread Brand & Color Code</h5>
                <button type="button" className="btn-close" onClick={() => setThreadColorModal(false)}></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!threadColorForm.colorNumber.trim()) {
                    alert('Color Number is required');
                    return;
                  }
                  const newTbc = {
                    ...threadColorForm,
                    id: threadColorForm.id || `TBC-${String(threadColors.length + 1).padStart(3, '0')}`
                  };
                  const upd = [...threadColors, newTbc];
                  setThreadColors(upd);
                  setStoredThreadBrandColors(upd);
                  setThreadColorModal(false);
                  showToast('Thread Color added');
                }}
              >
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold small text-muted">Brand Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Coats Astra, Vardhman Poly"
                        required
                        value={threadColorForm.brandName}
                        onChange={(e) => setThreadColorForm({ ...threadColorForm, brandName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Color Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 4001, 1002"
                        required
                        value={threadColorForm.colorNumber}
                        onChange={(e) => setThreadColorForm({ ...threadColorForm, colorNumber: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Color Code (HEX) *</label>
                      <div className="input-group">
                        <span className="input-group-text p-1 bg-white">
                          <input
                            type="color"
                            value={threadColorForm.colorCode || '#2e37a4'}
                            onChange={(e) => setThreadColorForm({ ...threadColorForm, colorCode: e.target.value })}
                            style={{ width: '28px', height: '28px', border: 'none', cursor: 'pointer' }}
                          />
                        </span>
                        <input
                          type="text"
                          className="form-control font-monospace"
                          placeholder="#333333"
                          required
                          value={threadColorForm.colorCode}
                          onChange={(e) => setThreadColorForm({ ...threadColorForm, colorCode: e.target.value.toUpperCase() })}
                        />
                      </div>
                    </div>

                    {/* Live Swatch Preview (Section 8.2 & 12.5) */}
                    <div className="col-12 mt-2">
                      <div className="d-flex align-items-center gap-2 p-2 rounded-2 bg-light border">
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            backgroundColor: threadColorForm.colorCode || '#333333',
                            border: '1px solid rgba(0,0,0,0.15)',
                            display: 'inline-block'
                          }}
                        />
                        <span className="small text-muted font-monospace">
                          Live Swatch Preview: {threadColorForm.colorCode || '#333333'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top py-3 px-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setThreadColorModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-semibold">
                    Save Thread Color
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
