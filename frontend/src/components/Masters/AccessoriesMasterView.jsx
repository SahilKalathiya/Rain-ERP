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
  setStoredThreadBrandColors,
  initialArticles
} from '../../data/salesOrderData';
import { initialFabrics } from '../../data/procurementData';

export const DEFAULT_TARGETED_ARTICLES = [
  { id: 'ART-001', name: 'Kurta', icon: '👘' },
  { id: 'ART-002', name: 'Pant', icon: '👖' },
  { id: 'ART-003', name: 'Dupatta', icon: '🎀' },
  { id: 'ART-004', name: 'Shirt', icon: '👔' },
  { id: 'ART-005', name: 'Top', icon: '👚' },
  { id: 'ART-006', name: 'Tunic', icon: '👗' },
  { id: 'ART-007', name: 'Jacket', icon: '🧥' }
];

export const getStoredArticlesList = () => {
  try {
    const stored = getStoredData('erp_articles_v1', null) || getStoredData('erp_articles_master', null);
    if (Array.isArray(stored) && stored.length > 0) {
      return stored.map((a, idx) => ({
        id: a.id || `ART-${idx + 1}`,
        name: a.name || a.label || `Article ${idx + 1}`,
        icon: a.icon || a.emoji || '👕'
      }));
    }
  } catch (e) {}
  return DEFAULT_TARGETED_ARTICLES;
};

const autoCapitalizeWords = (text) => {
  if (!text) return '';
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};

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

const THREAD_SIZE_OPTIONS = ['40/2', '30/2', '20/2', '20/3', '120s', 'Tex 40', 'Ticket 120'];
const THREAD_UNIT_OPTIONS = ['Meter', 'Cone', 'Reel', 'Box', 'Kilogram', 'Dozen', 'Gross'];

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

const FABRIC_QUALITIES = [];

const STANDARD_WIDTHS = ['42"', '44"', '48"', '58"'];

function TagInput({ label, tags = [], onChange, placeholder = 'Type a value, press Enter', suggestions = [], disabled = false }) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = React.useRef(null);

  const addTag = (val) => {
    if (disabled) return;
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
    if (disabled) return;
    e?.stopPropagation();
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
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
          cursor: disabled ? 'default' : 'text',
          borderRadius: '8px',
          borderColor: isFocused ? '#6366f1' : '#cbd5e1',
          backgroundColor: disabled ? '#f8fafc' : '#ffffff',
          boxShadow: isFocused ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none',
          padding: '6px 12px',
          transition: 'all 0.15s ease'
        }}
        onClick={() => !disabled && inputRef.current?.focus()}
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
            {!disabled && (
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
            )}
          </span>
        ))}

        {!disabled && (
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
        )}
      </div>
    </div>
  );
}

export default function AccessoriesMasterView({ isInline = false, onSaveInline, onCloseInline }) {
  const [accessories, setAccessories] = useState(() => getStoredAccessoriesMaster());
  const [selectedCategory, setSelectedCategory] = useState('Buttons');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(isInline);
  const [isCreatingNew, setIsCreatingNew] = useState(isInline);
  const [isModalEditMode, setIsModalEditMode] = useState(isInline);
  const [toastMessage, setToastMessage] = useState('');

  // Section 11.2 & 11.5 View Mode with Section-wise Edit State
  const [selectedAccessory, setSelectedAccessory] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionFormData, setSectionFormData] = useState({});

  // Section 8 State: Thread Sizes & Thread Brand Colors
  const [threadSizes, setThreadSizes] = useState(() => getStoredThreadSizes());
  const [threadColors, setThreadColors] = useState(() => getStoredThreadBrandColors());
  const [articlesList, setArticlesList] = useState(() => getStoredArticlesList());
  const [customArticleInput, setCustomArticleInput] = useState('');

  const [masterFabrics, setMasterFabrics] = useState(() => {
    try {
      const stored = getStoredData('raindrop_fabrics_v1', null);
      if (Array.isArray(stored)) return stored;
    } catch (e) {}
    return initialFabrics || [];
  });

  useEffect(() => {
    const handleFabricsUpdate = () => {
      try {
        const stored = getStoredData('raindrop_fabrics_v1', null);
        if (Array.isArray(stored)) {
          setMasterFabrics(stored);
        }
      } catch (e) {}
    };
    const handleAccessoriesUpdate = () => {
      try {
        setAccessories(getStoredAccessoriesMaster());
        setThreadSizes(getStoredThreadSizes());
        setThreadColors(getStoredThreadBrandColors());
      } catch (e) {}
    };
    const handleArticlesUpdate = () => {
      try {
        const stored = getStoredData('erp_articles_v1', null) || getStoredData('erp_articles_master', null);
        if (Array.isArray(stored) && stored.length > 0) {
          setArticlesList(stored.map((a, idx) => ({
            id: a.id || `ART-${idx + 1}`,
            name: a.name || a.label || `Article ${idx + 1}`,
            icon: a.icon || a.emoji || '👕'
          })));
        }
      } catch (e) {}
    };
    window.addEventListener('storage', handleFabricsUpdate);
    window.addEventListener('raindrop_fabrics_updated', handleFabricsUpdate);
    window.addEventListener('storage', handleAccessoriesUpdate);
    window.addEventListener('erp_accessories_master_updated', handleAccessoriesUpdate);
    window.addEventListener('storage', handleArticlesUpdate);
    window.addEventListener('erp_articles_updated', handleArticlesUpdate);
    return () => {
      window.removeEventListener('storage', handleFabricsUpdate);
      window.removeEventListener('raindrop_fabrics_updated', handleFabricsUpdate);
      window.removeEventListener('storage', handleAccessoriesUpdate);
      window.removeEventListener('erp_accessories_master_updated', handleAccessoriesUpdate);
      window.removeEventListener('storage', handleArticlesUpdate);
      window.removeEventListener('erp_articles_updated', handleArticlesUpdate);
    };
  }, []);

  const formatWidthTag = (w) => {
    if (w === undefined || w === null || w === '') return '';
    const clean = String(w).trim().replace(/"/g, '');
    return clean ? `${clean}"` : '';
  };

  const getFabricWidths = (qualityName) => {
    if (!qualityName) return [];
    const norm = qualityName.trim().toLowerCase();
    const found = masterFabrics.find(f => 
      (f.qualityName && f.qualityName.trim().toLowerCase() === norm) ||
      (f.quality && f.quality.trim().toLowerCase() === norm) ||
      (f.name && f.name.trim().toLowerCase() === norm)
    );
    let wArr = [];
    if (found) {
      if (Array.isArray(found.widths) && found.widths.length > 0) {
        wArr = found.widths;
      } else if (found.pannaWidth) {
        wArr = [found.pannaWidth];
      } else if (found.width) {
        wArr = [found.width];
      }
    }
    if (wArr.length === 0) {
      const match = qualityName.match(/(\d{2,3})"/);
      if (match) {
        wArr = [match[1]];
      }
    }
    return Array.from(new Set(wArr.map(formatWidthTag).filter(Boolean)));
  };

  const allAvailableFabrics = useMemo(() => {
    const names = [];
    masterFabrics.forEach(f => {
      const n = f.qualityName || f.quality || f.name;
      if (n && !names.includes(n)) names.push(n);
    });
    return names;
  }, [masterFabrics]);

  // Thread Suggestion Engine State (Section 8.1)
  const [calcMetres, setCalcMetres] = useState(1100);
  const [calcSuggestions, setCalcSuggestions] = useState(null);

  // Custom Input Mode with Dropdown Toggle Button (Matching Fabric Type design)
  const [isCustomThreadSize, setIsCustomThreadSize] = useState(false);
  const [isCustomThreadUnit, setIsCustomThreadUnit] = useState(false);
  const [isCustomPackaging, setIsCustomPackaging] = useState(false);

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
    unit: cat === 'Thread' ? 'Meter' : (cat === 'Beads & Sequins' ? 'Gram' : (CONTINUOUS_UNITS.includes(cat) ? 'Meter' : 'Piece')),
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
    laceSizesList: [],
    defaultShrinkage: '',
    fabricPerMeterLace: '',

    // Tassels
    tasselType: 'Ready Made',
    jobWorkRows: [{ size: '', threadConsumption: '' }],

    // Dori (Section 6.4)
    doriRequiredSize: '',
    doriUnit: 'Meter',
    doriFabricEntries: [{ fabricQuality: '', widthSizes: [], consumptions: {} }],

    // Elastic (Section 6.5) & Beads & Sequins (Section 6.6)
    fabricRows: [{ fabricQuality: '', fabricName: '', size: '', unit: cat === 'Beads & Sequins' ? 'Gram' : 'Meter', consumption: '' }],
    fabricEntries: [],

    // Thread (PDF Section 7.1 - 7.5): Start clean without hardcoded prefilled values
    threadSize: '',
    threadSizeCustom: '',
    threadPattern: '',
    threadPerStitch: '',
    metersPerMeterStitching: '',
    threadPerPiece: '',
    boxes: [{ reelsPerBox: '', metersPerReel: '' }],
    coneSizes: [],
    placements: [],
    articlePlacements: [],
    globalThreadMetric: '',
    stitchingArticles: [],
    consumptionPer100Pcs: {},
    processRemarks: ''
  });

  const [formData, setFormData] = useState(() => getEmptyAccessoryForm('Buttons'));
  const [laceSizeInput, setLaceSizeInput] = useState('');

  // Requirement 25: Duplicate names should not be allowed across Accessories
  const isDuplicateAccessoryName = (name, excludeId = null) => {
    if (!name || typeof name !== 'string') return false;
    const clean = name.trim().toLowerCase();
    if (!clean) return false;
    return accessories.some(
      (a) => a && a.id !== excludeId && (a.name || '').trim().toLowerCase() === clean
    );
  };

  const isNameDuplicate = Boolean(
    formData?.name &&
    formData.name.trim() &&
    isDuplicateAccessoryName(formData.name, formData.id)
  );

  const isSectionNameDuplicate = Boolean(
    sectionFormData?.name &&
    sectionFormData.name.trim() &&
    selectedAccessory &&
    isDuplicateAccessoryName(sectionFormData.name, selectedAccessory.id)
  );

  const availableTargetArticles = useMemo(() => {
    const list = [...articlesList];
    const selectedNames = formData?.stitchingArticles || [];
    selectedNames.forEach(name => {
      if (name && !list.some(a => a.name.toLowerCase() === name.toLowerCase())) {
        list.push({ id: `art-${name}`, name, icon: '👕' });
      }
    });
    return list;
  }, [articlesList, formData?.stitchingArticles]);

  const handleAddCustomArticle = () => {
    const trimmed = (customArticleInput || '').trim();
    if (!trimmed) return;
    const formatted = autoCapitalizeWords(trimmed);
    if (!articlesList.some(a => a.name.toLowerCase() === formatted.toLowerCase())) {
      setArticlesList(prev => [...prev, { id: `ART-custom-${Date.now()}`, name: formatted, icon: '👕' }]);
    }
    const current = formData.stitchingArticles || [];
    if (!current.includes(formatted)) {
      setFormData({
        ...formData,
        stitchingArticles: [...current, formatted],
        consumptionPer100Pcs: {
          ...(formData.consumptionPer100Pcs || {}),
          [formatted]: ''
        }
      });
    }
    setCustomArticleInput('');
  };

  const handleAddLaceSize = () => {
    if (!laceSizeInput.trim()) return;
    const items = laceSizeInput.split(',').map((s) => s.trim()).filter(Boolean);
    const unit = formData.laceSizeUnit || 'mm';
    const newSizes = [...(formData.laceSizesList || [])];
    items.forEach((it) => {
      const formatted = it.endsWith('mm') || it.endsWith('cm') || it.endsWith('inch') || it.endsWith('"')
        ? it
        : `${it} ${unit}`;
      if (!newSizes.includes(formatted)) {
        newSizes.push(formatted);
      }
    });
    setFormData((prev) => ({
      ...prev,
      laceSizesList: newSizes,
      laceSizeValue: newSizes[0] ? parseFloat(newSizes[0]) || '' : ''
    }));
    setLaceSizeInput('');
  };

  const handleRemoveLaceSize = (idxToRemove) => {
    setFormData((prev) => ({
      ...prev,
      laceSizesList: (prev.laceSizesList || []).filter((_, i) => i !== idxToRemove)
    }));
  };

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
    setLaceSizeInput('');
    setIsCustomThreadSize(false);
    setIsCustomThreadUnit(false);
    setIsCreatingNew(true);
    setIsEditing(true);
    setIsModalEditMode(true);
    setSelectedAccessory(null);
  };

  const handleEditAccessory = (acc, forceEdit = false) => {
    const szList = acc.buttonSizesList?.length
      ? acc.buttonSizesList
      : (acc.buttonSizes ? acc.buttonSizes.split(',').map(s => s.trim()).filter(Boolean) : (acc.sizes?.length ? acc.sizes : (acc.size ? [acc.size] : [])));
    const clList = acc.buttonColorsList?.length
      ? acc.buttonColorsList
      : (acc.buttonColors ? acc.buttonColors.split(',').map(s => s.trim()).filter(Boolean) : (acc.colors?.length ? acc.colors : (acc.color ? [acc.color] : [])));

    const laceList = acc.laceSizesList?.length
      ? acc.laceSizesList
      : (acc.laceSize ? acc.laceSize.split(',').map((s) => s.trim()).filter(Boolean) : (acc.sizes?.length ? acc.sizes : (acc.laceSizeValue ? [`${acc.laceSizeValue} ${acc.laceSizeUnit || 'mm'}`] : [])));

    const isCustomSz = Boolean(acc.threadSize && !THREAD_SIZE_OPTIONS.includes(acc.threadSize) && !(threadSizes || []).some(ts => {
      const label = `${ts.brandName ? ts.brandName + ' - ' : ''}${ts.packagingType || 'Reel'}${ts.threadLengthPerPiece ? ` (${ts.threadLengthPerPiece}m)` : ''}`;
      return ts.id === acc.threadSize || label === acc.threadSize;
    }));
    const isCustomU = Boolean(acc.unit && !THREAD_UNIT_OPTIONS.includes(acc.unit));
    setIsCustomThreadSize(isCustomSz);
    setIsCustomThreadUnit(isCustomU);
    setLaceSizeInput('');

    setFormData({
      ...acc,
      name: acc.name || '',
      category: acc.category || 'Buttons',
      laceSizesList: laceList,
      laceSizeValue: acc.laceSizeValue !== undefined ? acc.laceSizeValue : (acc.laceSize ? parseFloat(acc.laceSize) || '' : ''),
      laceSizeUnit: acc.laceSizeUnit || (acc.laceSize && acc.laceSize.includes('cm') ? 'cm' : (acc.laceSize && acc.laceSize.includes('inch') ? 'inch' : 'mm')),
      defaultShrinkage: acc.defaultShrinkage || '',
      fabricPerMeterLace: acc.fabricPerMeterLace || '',
      sizeValue: acc.sizeValue !== undefined ? acc.sizeValue : (acc.threadSize ? parseFloat(acc.threadSize) || '' : ''),
      sizeUnit: acc.sizeUnit || 'mm',
      unit: acc.unit || (acc.category === 'Thread' ? 'Meter' : (CONTINUOUS_UNITS.includes(cat => cat === acc.category) ? 'Meter' : 'Piece')),
      piecesPerUnit: acc.piecesPerUnit !== undefined && acc.piecesPerUnit !== '' ? acc.piecesPerUnit : 1,
      threadPattern: acc.threadPattern || '',
      threadSize: acc.threadSize || acc.size || '',
      threadSizeCustom: acc.threadSizeCustom || '',
      globalThreadMetric: acc.globalThreadMetric !== undefined ? acc.globalThreadMetric : '',
      articlePlacements: acc.articlePlacements || [],
      stitchingArticles: acc.stitchingArticles || (acc.consumptionPer100Pcs ? Object.keys(acc.consumptionPer100Pcs) : []),
      consumptionPer100Pcs: acc.consumptionPer100Pcs || {},
      metersPerMeterStitching: acc.metersPerMeterStitching !== undefined ? acc.metersPerMeterStitching : (acc.threadPerStitch !== undefined ? acc.threadPerStitch : ''),
      threadPerStitch: acc.threadPerStitch !== undefined ? acc.threadPerStitch : '',
      threadPerPiece: acc.threadPerPiece !== undefined ? acc.threadPerPiece : '',
      boxes: (acc.boxes && acc.boxes.length > 0) ? acc.boxes : (acc.boxesConfig && acc.boxesConfig.length > 0 ? acc.boxesConfig : [{ reelsPerBox: '', metersPerReel: '' }]),
      coneSizes: acc.coneSizes || [],
      placements: acc.placements || acc.availablePlacements || [],
      processRemarks: acc.processRemarks || '',
      jobWorkRows: (acc.jobWorkRows && acc.jobWorkRows.length > 0)
        ? acc.jobWorkRows
        : [{ size: '', threadConsumption: '' }],
      doriRequiredSize: acc.doriRequiredSize || acc.requiredSize || acc.size || '',
      doriUnit: acc.doriUnit || acc.unit || 'Meter',
      doriFabricEntries: (acc.doriFabricEntries && acc.doriFabricEntries.length > 0)
        ? acc.doriFabricEntries
        : (acc.category === 'Dori' && acc.fabricEntries && acc.fabricEntries.length > 0
            ? acc.fabricEntries
            : [{ fabricQuality: '', widthSizes: [], consumptions: {} }]),
      fabricRows: (acc.fabricRows && acc.fabricRows.length > 0)
        ? acc.fabricRows
        : (acc.fabricEntries && acc.fabricEntries.length > 0 && acc.category !== 'Dori'
            ? acc.fabricEntries
            : [{ fabricQuality: '', fabricName: '', size: acc.requiredSize || '', unit: acc.category === 'Beads & Sequins' ? 'Gram' : 'Meter', consumption: acc.fabricConsumption || '' }]),
      buttonSizesList: szList,
      buttonColorsList: clList,
      variants: acc.variants || szList,
      colors: acc.colors || clList
    });
    setIsCreatingNew(false);
    setIsEditing(true);
    setIsModalEditMode(forceEdit);
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

    const capitalizedName = formData.name.replace(/\b\w/g, (c) => c.toUpperCase()).trim();

    // Requirement 25: Prevent duplicate names across accessories
    if (isDuplicateAccessoryName(capitalizedName, formData.id)) {
      alert(`Duplicate Error: An accessory with the name "${capitalizedName}" already exists. Duplicate names are not allowed across Accessories.`);
      showToast(`Accessory name "${capitalizedName}" already exists!`, 'error');
      return;
    }

    const accObj = {
      ...formData,
      buttonSizes: (formData.buttonSizesList || []).join(', '),
      buttonColors: (formData.buttonColorsList || []).join(', '),
      buttonSizesList: formData.buttonSizesList || [],
      buttonColorsList: formData.buttonColorsList || [],
      variants: formData.variants || formData.buttonSizesList || [],
      colors: formData.colors || formData.buttonColorsList || [],
      laceSizesList: formData.laceSizesList || [],
      laceSize: (formData.laceSizesList && formData.laceSizesList.length > 0)
        ? formData.laceSizesList.join(', ')
        : (formData.laceSizeValue ? `${formData.laceSizeValue} ${formData.laceSizeUnit || 'mm'}` : (formData.laceSize || '')),
      sizes: (formData.laceSizesList && formData.laceSizesList.length > 0)
        ? formData.laceSizesList
        : (formData.sizes || []),
      threadSize: formData.threadSize === 'Other' && formData.threadSizeCustom ? formData.threadSizeCustom : (formData.threadSize || ''),
      threadSizeCustom: formData.threadSizeCustom || '',
      unit: formData.unit === 'Other' && formData.unitCustom ? formData.unitCustom : (formData.unit || (formData.category === 'Beads & Sequins' ? 'Gram' : (formData.category === 'Elastic' || formData.category === 'Dori' || formData.category === 'Thread' ? 'Meter' : 'Piece'))),
      unitCustom: formData.unitCustom || '',
      piecesPerUnit: parseInt(formData.piecesPerUnit, 10) || 1,
      threadPattern: formData.threadPattern || 'Stitching',
      metersPerMeterStitching: (formData.metersPerMeterStitching !== undefined && formData.metersPerMeterStitching !== '') ? (parseFloat(formData.metersPerMeterStitching) || 0) : ((formData.threadPerStitch !== undefined && formData.threadPerStitch !== '') ? (parseFloat(formData.threadPerStitch) || 0) : ''),
      threadPerStitch: (formData.metersPerMeterStitching !== undefined && formData.metersPerMeterStitching !== '') ? (parseFloat(formData.metersPerMeterStitching) || 0) : ((formData.threadPerStitch !== undefined && formData.threadPerStitch !== '') ? (parseFloat(formData.threadPerStitch) || 0) : ''),
      threadPerPiece: (formData.threadPerPiece !== undefined && formData.threadPerPiece !== '') ? (parseFloat(formData.threadPerPiece) || 0) : '',
      globalThreadMetric: (formData.globalThreadMetric !== undefined && formData.globalThreadMetric !== '') ? (parseFloat(formData.globalThreadMetric) || 0) : '',
      articlePlacements: formData.articlePlacements || [],
      stitchingArticles: formData.stitchingArticles || [],
      consumptionPer100Pcs: formData.consumptionPer100Pcs || {},
      boxesConfig: (formData.boxes || []).filter(b => b && (b.reelsPerBox || b.metersPerReel)),
      boxes: (formData.boxes || []).filter(b => b && (b.reelsPerBox || b.metersPerReel)),
      doriRequiredSize: formData.doriRequiredSize || formData.size || '',
      doriUnit: formData.doriUnit || formData.unit || 'Meter',
      doriFabricEntries: formData.doriFabricEntries || [],
      fabricRows: formData.fabricRows || [],
      fabricEntries: formData.category === 'Dori'
        ? (formData.doriFabricEntries || [])
        : (formData.fabricRows || []),
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

    // Return straight to accessories grid
    setSelectedAccessory(null);
    setIsEditing(false);
    setIsCreatingNew(false);
    setIsModalEditMode(false);
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
      laceSizesList: sectionFormData.laceSizesList || selectedAccessory.laceSizesList || [],
      laceSize: (sectionFormData.laceSizesList && sectionFormData.laceSizesList.length > 0)
        ? sectionFormData.laceSizesList.join(', ')
        : (sectionFormData.laceSize || selectedAccessory.laceSize),
      sizes: sectionFormData.laceSizesList || sectionFormData.buttonSizesList || selectedAccessory.sizes || [],
      lastModified: new Date().toISOString()
    };
    if (sectionFormData.name) {
      const cleanSecName = sectionFormData.name.replace(/\b\w/g, (c) => c.toUpperCase()).trim();
      if (!cleanSecName) {
        alert('Accessory Name is required');
        return;
      }
      if (isDuplicateAccessoryName(cleanSecName, selectedAccessory.id)) {
        alert(`Duplicate Error: An accessory with the name "${cleanSecName}" already exists. Duplicate names are not allowed across Accessories.`);
        showToast(`Accessory name "${cleanSecName}" already exists!`, 'error');
        return;
      }
      updated.name = cleanSecName;
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
            className="form-control rounded-pill bg-white search-input-integrated"
            placeholder="Search accessories, sub types, HSN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ borderColor: '#cbd5e1', fontSize: '13.5px', height: '40px', paddingLeft: '44px' }}
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
                  {isCreatingNew
                    ? 'New Accessory'
                    : (isModalEditMode ? 'Edit Accessory' : `Accessory: ${formData.name || ''}`)}
                </h5>
                <div className="d-flex align-items-center gap-2">
                  {!isCreatingNew && (
                    !isModalEditMode ? (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm rounded-3 px-3 fw-semibold d-flex align-items-center gap-1.5"
                        onClick={() => setIsModalEditMode(true)}
                      >
                        <i className="ti ti-edit"></i>
                        <span>Edit</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-light border text-secondary btn-sm rounded-3 px-3 fw-semibold d-flex align-items-center gap-1.5"
                        onClick={() => setIsModalEditMode(false)}
                      >
                        <i className="ti ti-eye"></i>
                        <span>View Mode</span>
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    className="btn-close shadow-none"
                    onClick={() => {
                      setIsEditing(false);
                      setIsModalEditMode(false);
                    }}
                    aria-label="Close"
                  ></button>
                </div>
              </div>

              <form onSubmit={saveAccessory}>
                <div className="modal-body p-4" style={{ maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
                  <fieldset disabled={!isModalEditMode} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                  {/* Row 1: Accessory Name & Category */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark small mb-1.5">
                        Accessory name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${isNameDuplicate ? 'is-invalid border-danger' : ''}`}
                        required
                        placeholder="e.g. Shell Button, Metallic Lace"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: autoCapitalizeWords(e.target.value) })}
                        style={{ height: '42px', borderRadius: '8px' }}
                      />
                      {isNameDuplicate ? (
                        <div className="invalid-feedback d-block text-danger fw-semibold small mt-1">
                          <i className="ti ti-alert-circle me-1"></i>
                          Duplicate name not allowed: An accessory named &quot;{formData.name.trim()}&quot; already exists.
                        </div>
                      ) : (
                        <div className="form-text small text-muted">Auto-capitalised word by word</div>
                      )}
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
                            unit: cat === 'Thread' ? 'Meter' : (cat === 'Beads & Sequins' ? 'Gram' : (CONTINUOUS_UNITS.includes(cat) ? 'Meter' : 'Piece')),
                            fabricRows: (!formData.fabricRows || formData.fabricRows.length === 0)
                              ? [{ fabricName: '', fabricQuality: '', size: '', unit: cat === 'Beads & Sequins' ? 'Gram' : 'Meter', consumption: '' }]
                              : formData.fabricRows,
                            doriFabricEntries: (!formData.doriFabricEntries || formData.doriFabricEntries.length === 0)
                              ? [{ fabricQuality: '', widthSizes: [], consumptions: {} }]
                              : formData.doriFabricEntries,
                            boxes: (!formData.boxes || formData.boxes.length === 0)
                              ? [{ reelsPerBox: '', metersPerReel: '' }]
                              : formData.boxes
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
                      <div className="mb-3">
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
                      <div className="mb-3">
                        <TagInput
                          label="Button variants (sizes, e.g. 18L, 20L, 22L)"
                          tags={formData.variants?.length ? formData.variants : (formData.buttonSizesList || [])}
                          onChange={(newTags) => setFormData({ ...formData, variants: newTags, buttonSizesList: newTags })}
                          placeholder="Type a value, press Enter"
                          disabled={!isModalEditMode}
                        />
                      </div>
                      <div className="mb-3">
                        <TagInput
                          label="Button colors"
                          tags={formData.colors?.length ? formData.colors : (formData.buttonColorsList || [])}
                          onChange={(newTags) => setFormData({ ...formData, colors: newTags, buttonColorsList: newTags })}
                          placeholder="Type a value, press Enter"
                          disabled={!isModalEditMode}
                        />
                      </div>
                    </>
                  )}

                  {/* ============================================================== */}
                  {/* CATEGORY 2: LACE (SCREENSHOT 1)                                */}
                  {/* ============================================================== */}
                  {formData.category === 'Lace' && (
                    <>
                      <div className="mb-3">
                        <TagInput
                          label="Lace variants (sizes, e.g. 10 mm, 20 mm, 1 inch)"
                          tags={formData.variants?.length ? formData.variants : (formData.laceSizesList || [])}
                          onChange={(newTags) => setFormData({ ...formData, variants: newTags, laceSizesList: newTags })}
                          placeholder="Type a value, press Enter"
                          suggestions={['10 mm', '15 mm', '20 mm', '25 mm', '30 mm', '40 mm', '50 mm', '1 inch']}
                          disabled={!isModalEditMode}
                        />
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
                    </>
                  )}

                  {/* ============================================================== */}
                  {/* CATEGORY 3: TASSEL (SCREENSHOT 2)                              */}
                  {/* ============================================================== */}
                  {(formData.category === 'Tassel' || formData.category === 'Tassels') && (
                    <>
                      <div className="mb-3">
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

                      <div className="mb-3">
                        <label className="form-label fw-semibold text-dark small mb-1.5">Tassel type</label>
                        <select
                          className="form-select"
                          disabled={!isModalEditMode}
                          value={formData.tasselType || 'Ready Made'}
                          onChange={(e) => {
                            const newType = e.target.value;
                            setFormData({
                              ...formData,
                              tasselType: newType,
                              jobWorkRows: (newType === 'Job Work' && (!formData.jobWorkRows || formData.jobWorkRows.length === 0))
                                ? [{ size: '', threadConsumption: '' }]
                                : (formData.jobWorkRows || [{ size: '', threadConsumption: '' }])
                            });
                          }}
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
                          {((formData.jobWorkRows && formData.jobWorkRows.length > 0)
                            ? formData.jobWorkRows
                            : [{ size: '', threadConsumption: '' }]
                          ).map((r, i) => (
                            <div key={i} className="row g-2 align-items-end mb-2">
                              <div className="col-5">
                                <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>Size</label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="e.g. Small / 2 inch"
                                  disabled={!isModalEditMode}
                                  value={r.size || ''}
                                  onChange={(e) => {
                                    const currentRows = (formData.jobWorkRows && formData.jobWorkRows.length > 0)
                                      ? [...formData.jobWorkRows]
                                      : [{ size: '', threadConsumption: '' }];
                                    currentRows[i] = { ...currentRows[i], size: e.target.value };
                                    setFormData({ ...formData, jobWorkRows: currentRows });
                                  }}
                                  style={{ height: '36px', borderRadius: '6px' }}
                                />
                              </div>
                              <div className="col-5">
                                <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>Thread consumption</label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="e.g. 5m / piece"
                                  disabled={!isModalEditMode}
                                  value={r.threadConsumption || ''}
                                  onChange={(e) => {
                                    const currentRows = (formData.jobWorkRows && formData.jobWorkRows.length > 0)
                                      ? [...formData.jobWorkRows]
                                      : [{ size: '', threadConsumption: '' }];
                                    currentRows[i] = { ...currentRows[i], threadConsumption: e.target.value };
                                    setFormData({ ...formData, jobWorkRows: currentRows });
                                  }}
                                  style={{ height: '36px', borderRadius: '6px' }}
                                />
                              </div>
                              <div className="col-2 pb-1 text-end">
                                {isModalEditMode && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                    onClick={() => {
                                      const currentRows = (formData.jobWorkRows && formData.jobWorkRows.length > 0)
                                        ? [...formData.jobWorkRows]
                                        : [{ size: '', threadConsumption: '' }];
                                      const updated = currentRows.filter((_, idx) => idx !== i);
                                      setFormData({
                                        ...formData,
                                        jobWorkRows: updated.length > 0 ? updated : [{ size: '', threadConsumption: '' }]
                                      });
                                    }}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          {isModalEditMode && (
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-primary p-0 text-decoration-none fw-semibold"
                              onClick={() => {
                                const currentRows = (formData.jobWorkRows && formData.jobWorkRows.length > 0)
                                  ? [...formData.jobWorkRows]
                                  : [{ size: '', threadConsumption: '' }];
                                setFormData({
                                  ...formData,
                                  jobWorkRows: [...currentRows, { size: '', threadConsumption: '' }]
                                });
                              }}
                            >
                              + Add more
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* ============================================================== */}
                  {/* CATEGORY 4: THREAD CONFIGURATION (PDF SECTION 7.1 - 7.5)       */}
                  {/* ============================================================== */}
                  {formData.category === 'Thread' && (() => {
                    const isKanthaCouching = formData.threadPattern === 'Kantha' || formData.threadPattern === 'Couching';
                    const isStitching = formData.threadPattern === 'Stitching';
                    const isProcessOnly = formData.threadPattern === 'Button Tacking' || formData.threadPattern === 'Handwork';

                    return (
                      <>
                        {/* 7.1 Base Thread Configuration (Data Structure) */}
                        <div className="card p-3 rounded-3 mb-3 border bg-white shadow-2xs" style={{ borderColor: '#e2e8f0' }}>
                          <div className="fw-bold text-dark fs-14 mb-2.5 d-flex align-items-center gap-2">
                            <i className="ti ti-needle-thread text-primary"></i>
                            <span>Base Thread Configuration</span>
                          </div>

                          <div className="mb-2.5">
                            {/* Unit (Dropdown with Other - Default: Meter) */}
                            <label className="form-label fw-semibold text-dark small mb-1">
                              Unit <span className="text-danger">*</span>
                            </label>
                            {isCustomThreadUnit ? (
                              <div className="input-group input-group-sm">
                                <input
                                  type="text"
                                  className="form-control form-control-sm bg-white fw-bold"
                                  placeholder="Type custom unit..."
                                  autoFocus
                                  value={formData.unitCustom ?? (formData.unit === 'Other' ? '' : (formData.unit || 'Meter'))}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData({ ...formData, unitCustom: val, unit: val });
                                  }}
                                  style={{ height: '38px', borderRadius: '7px 0 0 7px' }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5"
                                  onClick={() => {
                                    setIsCustomThreadUnit(false);
                                    setFormData({ ...formData, unit: 'Meter', unitCustom: '' });
                                  }}
                                  title="Switch back to dropdown list"
                                  style={{ borderRadius: '0 7px 7px 0', borderColor: '#cbd5e1' }}
                                >
                                  <i className="ti ti-chevron-down"></i>
                                </button>
                              </div>
                            ) : (
                              <select
                                className="form-select form-select-sm"
                                value={formData.unit || 'Meter'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'Other') {
                                    setIsCustomThreadUnit(true);
                                    setFormData({ ...formData, unit: '', unitCustom: '' });
                                  } else {
                                    setIsCustomThreadUnit(false);
                                    setFormData({ ...formData, unit: val, unitCustom: '' });
                                  }
                                }}
                                style={{ height: '38px', borderRadius: '7px' }}
                              >
                                {THREAD_UNIT_OPTIONS.map((u) => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                                <option value="Other">Other (Custom Unit)...</option>
                              </select>
                            )}
                          </div>

                          {/* Thread Pattern (Dropdown - Mandatory: Yes, drives pattern-specific fields below) */}
                          <div className="mt-2 pt-2 border-top">
                            <label className="form-label fw-semibold text-dark small mb-1">
                              Thread Pattern <span className="text-danger">*</span> (Kantha / Couching / Stitching / Embroidery / Button Tacking / Handwork)
                            </label>
                            <select
                              className="form-select form-select-sm fw-bold"
                              value={formData.threadPattern || ''}
                              onChange={(e) => {
                                const pat = e.target.value;
                                // Section 12.4: Changing thread pattern must not carry incompatible data across
                                setFormData(prev => ({
                                  ...prev,
                                  threadPattern: pat
                                }));
                              }}
                              style={{ height: '40px', borderRadius: '7px', borderColor: '#2e37a4', color: '#1e293b' }}
                            >
                              <option value="">-- Select Thread Pattern --</option>
                              {THREAD_PATTERNS.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 7.2 Kantha & 7.3 Couching Pattern (Shared Configuration Definition - Section 12.4) */}
                        {isKanthaCouching && (
                          <div className="card p-3.5 rounded-3 mb-3 border shadow-2xs" style={{ backgroundColor: '#f8faff', borderColor: '#c7d2fe' }}>
                            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge rounded-pill px-2.5 py-1 text-white" style={{ backgroundColor: '#2e37a4' }}>
                                  {formData.threadPattern}
                                </span>
                                <span className="fw-bold text-dark fs-14">Pattern Configuration</span>
                              </div>
                              <span className="small text-muted" style={{ fontSize: '11.5px' }}>
                                {formData.threadPattern === 'Kantha' ? 'Running Stitch Pattern' : 'Surface Thread Pattern'}
                              </span>
                            </div>

                            {/* Thread Per Stitch (metres) - Default 15m, editable */}
                            <div className="mb-3">
                              <label className="form-label fw-semibold text-dark small mb-1">
                                Thread Per Stitch (metres required for 1m of stitching) <span className="text-danger">*</span>
                              </label>
                              <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="form-control fw-bold"
                                  placeholder="e.g. 15"
                                  value={formData.threadPerStitch !== undefined && formData.threadPerStitch !== null ? formData.threadPerStitch : ''}
                                  onChange={(e) => setFormData({ ...formData, threadPerStitch: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) })}
                                  style={{ height: '36px' }}
                                />
                                <span className="input-group-text bg-white text-muted">m / stitch</span>
                              </div>
                              <div className="form-text text-muted" style={{ fontSize: '11.5px' }}>
                                Default: 15 m per metre of stitching, remains editable.
                              </div>
                            </div>

                            {/* Available Boxes (Reels Per Box x Metres Per Reel = 6000 m) */}
                            <div className="mb-3 p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <label className="form-label fw-bold text-dark small mb-0">
                                  Available Boxes (Each box = 6000 m)
                                </label>
                                <span className="badge bg-light text-muted border" style={{ fontSize: '11px' }}>
                                  Reels Per Box &times; Metres Per Reel
                                </span>
                              </div>
                              {(() => {
                                const boxList = (formData.boxes && formData.boxes.length > 0)
                                  ? formData.boxes
                                  : [{ reelsPerBox: '', metersPerReel: '' }];
                                return boxList.map((b, i, arr) => {
                                  const totalBoxMetres = (parseFloat(b.reelsPerBox) || 0) * (parseFloat(b.metersPerReel) || 0);
                                  return (
                                    <div key={i} className="row g-2 align-items-center mb-2 p-2 bg-light rounded-2 border">
                                      <div className="col-4">
                                        <label className="form-label small text-muted mb-0" style={{ fontSize: '11px' }}>Reels Per Box</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm fw-bold"
                                          placeholder="e.g. 15"
                                          value={b.reelsPerBox ?? ''}
                                          onChange={(e) => {
                                            const updated = [...arr];
                                            updated[i] = { ...updated[i], reelsPerBox: e.target.value };
                                            setFormData({ ...formData, boxes: updated });
                                          }}
                                        />
                                      </div>
                                      <div className="col-4">
                                        <label className="form-label small text-muted mb-0" style={{ fontSize: '11px' }}>Metres Per Reel</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm fw-bold"
                                          placeholder="e.g. 400"
                                          value={b.metersPerReel ?? ''}
                                          onChange={(e) => {
                                            const updated = [...arr];
                                            updated[i] = { ...updated[i], metersPerReel: e.target.value };
                                            setFormData({ ...formData, boxes: updated });
                                          }}
                                        />
                                      </div>
                                      <div className="col-3 text-center">
                                        <span className={`badge ${totalBoxMetres === 6000 ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-dark'}`} style={{ fontSize: '11px' }}>
                                          = {totalBoxMetres || 0} m
                                        </span>
                                      </div>
                                      <div className="col-1 text-end">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                          onClick={() => {
                                            const updated = arr.filter((_, idx) => idx !== i);
                                            setFormData({
                                              ...formData,
                                              boxes: updated.length ? updated : [{ reelsPerBox: '', metersPerReel: '' }]
                                            });
                                          }}
                                        >
                                          <i className="ti ti-trash"></i>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-primary d-inline-flex align-items-center gap-1 mt-1"
                                style={{ fontSize: '12px' }}
                                onClick={() => {
                                  const current = (formData.boxes && formData.boxes.length > 0)
                                    ? formData.boxes
                                    : [{ reelsPerBox: '', metersPerReel: '' }];
                                  setFormData({ ...formData, boxes: [...current, { reelsPerBox: '', metersPerReel: '' }] });
                                }}
                              >
                                <i className="ti ti-plus"></i> Add Box Configuration
                              </button>
                            </div>

                            {/* Available Cone Sizes (Repeatable) */}
                            <div className="mb-3 p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <TagInput
                                label="Available Cone Sizes (e.g. 5000 m, 10000 m)"
                                tags={formData.coneSizes || []}
                                onChange={(newTags) => setFormData({ ...formData, coneSizes: newTags })}
                                placeholder="Type cone size (e.g. 5000 m) and press Enter"
                                suggestions={['5000 m', '10000 m', '20000 m']}
                                disabled={!isModalEditMode}
                              />
                            </div>

                            {/* Available Placements (Repeatable chips/buttons) */}
                            <div className="mb-3 p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <label className="form-label fw-bold text-dark small mb-1">
                                Available Placements (Predefined & Manufacturing Defaults)
                              </label>
                              <TagInput
                                label=""
                                tags={formData.placements || []}
                                onChange={(newTags) => setFormData({ ...formData, placements: newTags })}
                                placeholder="Add placement (e.g. Sleeves, Collar) and press Enter"
                                suggestions={['Sleeves', 'Front', 'Back', 'Collar', 'Hemline', 'Pocket', 'Placket']}
                                disabled={!isModalEditMode}
                              />
                            </div>

                            {/* Article -> Placement -> Thread Line Chain (Section 7.2 table, Page 12 functional points, Section 10.2 wireframe) */}
                            <div className="mb-3 p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <div>
                                  <span className="fw-bold text-dark fs-13 d-block">
                                    Article &rarr; Placement &rarr; Thread Line Chain
                                  </span>
                                  <span className="text-muted small" style={{ fontSize: '11px' }}>
                                    Section 10.2: Configure thread required per placement line for each article
                                  </span>
                                </div>
                              </div>

                              {/* Repeatable Article Blocks */}
                              {(!formData.articlePlacements || formData.articlePlacements.length === 0) ? (
                                <div className="text-muted small py-2.5 mb-2.5 bg-light rounded-2 p-3 border" style={{ fontSize: '12px', borderColor: '#e2e8f0' }}>
                                  No article placement blocks configured yet. Click &quot;+ Add Article Block&quot; below to configure thread requirements per placement line for an article.
                                </div>
                              ) : (
                                formData.articlePlacements.map((artBlock, abIdx, allBlocks) => (
                                  <div key={abIdx} className="p-3 mb-2.5 rounded-3 border bg-light position-relative" style={{ borderColor: '#cbd5e1' }}>
                                    <div className="d-flex align-items-center justify-content-between mb-2.5 flex-wrap gap-2">
                                      <div className="d-flex align-items-center gap-2">
                                        <span className="badge rounded-circle p-1.5" style={{ backgroundColor: '#2e37a4', color: '#fff', fontSize: '11px', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                          {abIdx + 1}
                                        </span>
                                        <label className="form-label fw-bold text-dark small mb-0">Article:</label>
                                        <select
                                          className="form-select form-select-sm fw-semibold"
                                          value={artBlock.article || ''}
                                          onChange={(e) => {
                                            const updated = [...allBlocks];
                                            updated[abIdx] = { ...updated[abIdx], article: e.target.value };
                                            setFormData({ ...formData, articlePlacements: updated });
                                          }}
                                          style={{ width: '160px', height: '34px' }}
                                        >
                                          {articlesList.map(a => (
                                            <option key={a.id || a.name} value={a.name}>{a.icon || '👕'} {a.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <button
                                        type="button"
                                        className="btn btn-xs btn-outline-danger d-inline-flex align-items-center gap-1"
                                        style={{ fontSize: '11px' }}
                                        onClick={() => {
                                          const updated = allBlocks.filter((_, idx) => idx !== abIdx);
                                          setFormData({ ...formData, articlePlacements: updated });
                                        }}
                                      >
                                        <i className="ti ti-trash"></i> Remove Article Block
                                      </button>
                                    </div>

                                    {/* Placements for this article */}
                                    <div className="table-responsive bg-white rounded-2 border mb-2">
                                      <table className="table table-sm align-middle mb-0" style={{ fontSize: '12px' }}>
                                        <thead className="bg-light">
                                          <tr>
                                            <th style={{ width: '50%' }}>Placement (e.g. Sleeves, Front)</th>
                                            <th style={{ width: '35%' }}>Thread Required (metres)</th>
                                            <th style={{ width: '15%' }} className="text-center">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(artBlock.placements || []).map((pLine, plIdx, plArr) => (
                                            <tr key={plIdx}>
                                              <td>
                                                <input
                                                  type="text"
                                                  className="form-control form-control-sm"
                                                  placeholder="e.g. Sleeves"
                                                  value={pLine.placement || ''}
                                                  onChange={(e) => {
                                                    const updatedBlocks = [...allBlocks];
                                                    const updatedPlacements = [...artBlock.placements];
                                                    updatedPlacements[plIdx] = { ...updatedPlacements[plIdx], placement: e.target.value };
                                                    updatedBlocks[abIdx] = { ...updatedBlocks[abIdx], placements: updatedPlacements };
                                                    setFormData({ ...formData, articlePlacements: updatedBlocks });
                                                  }}
                                                />
                                              </td>
                                              <td>
                                                <div className="input-group input-group-sm">
                                                  <input
                                                    type="number"
                                                    step="0.1"
                                                    className="form-control fw-bold"
                                                    placeholder="e.g. 4.5"
                                                    value={pLine.threadRequired || ''}
                                                    onChange={(e) => {
                                                      const updatedBlocks = [...allBlocks];
                                                      const updatedPlacements = [...artBlock.placements];
                                                      updatedPlacements[plIdx] = { ...updatedPlacements[plIdx], threadRequired: e.target.value };
                                                      updatedBlocks[abIdx] = { ...updatedBlocks[abIdx], placements: updatedPlacements };
                                                      setFormData({ ...formData, articlePlacements: updatedBlocks });
                                                    }}
                                                  />
                                                  <span className="input-group-text bg-white text-muted">m</span>
                                                </div>
                                              </td>
                                              <td className="text-center">
                                                {plArr.length > 1 && (
                                                  <button
                                                    type="button"
                                                    className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                                    onClick={() => {
                                                      const updatedBlocks = [...allBlocks];
                                                      const updatedPlacements = artBlock.placements.filter((_, idx) => idx !== plIdx);
                                                      updatedBlocks[abIdx] = { ...updatedBlocks[abIdx], placements: updatedPlacements };
                                                      setFormData({ ...formData, articlePlacements: updatedBlocks });
                                                    }}
                                                  >
                                                    <i className="ti ti-x"></i>
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>

                                    <button
                                      type="button"
                                      className="btn btn-xs btn-link text-primary p-0 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                                      style={{ fontSize: '11.5px' }}
                                      onClick={() => {
                                        const updatedBlocks = [...allBlocks];
                                        const updatedPlacements = [...(artBlock.placements || []), { placement: '', threadRequired: '' }];
                                        updatedBlocks[abIdx] = { ...updatedBlocks[abIdx], placements: updatedPlacements };
                                        setFormData({ ...formData, articlePlacements: updatedBlocks });
                                      }}
                                    >
                                      <i className="ti ti-plus"></i> Add Placement Line
                                    </button>
                                  </div>
                                ))
                              )}

                              {/* Add More Article Button */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 fw-semibold"
                                style={{ fontSize: '12px' }}
                                onClick={() => {
                                  const current = formData.articlePlacements || [];
                                  const nextArticleName = articlesList[current.length % articlesList.length]?.name || 'Kurta';
                                  setFormData({
                                    ...formData,
                                    articlePlacements: [
                                      ...current,
                                      { article: nextArticleName, placements: [{ placement: '', threadRequired: '' }] }
                                    ]
                                  });
                                }}
                              >
                                <i className="ti ti-plus"></i> Add Article Block
                              </button>
                            </div>

                            {/* One-Time Global Thread Stitching Metric (Page 12, Page 18) */}
                            <div className="p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <label className="form-label fw-bold text-dark small mb-1">
                                One-Time Global Thread Stitching Metric <span className="text-danger">*</span>
                              </label>
                              <div className="input-group input-group-sm" style={{ maxWidth: '280px' }}>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="form-control fw-bold"
                                  placeholder="e.g. 15"
                                  value={formData.globalThreadMetric !== undefined && formData.globalThreadMetric !== null ? formData.globalThreadMetric : ''}
                                  onChange={(e) => setFormData({ ...formData, globalThreadMetric: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) })}
                                  style={{ height: '36px' }}
                                />
                                <span className="input-group-text bg-white text-muted">m / stitch metre</span>
                              </div>
                              <div className="form-text text-muted" style={{ fontSize: '11px' }}>
                                Entered once and applies to both Kantha and Couching — separate from and in addition to per-placement Thread Required values.
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 7.4 Stitching Pattern */}
                        {isStitching && (
                          <div className="card p-3.5 rounded-3 mb-3 border shadow-2xs" style={{ backgroundColor: '#f8faff', borderColor: '#c7d2fe' }}>
                            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge rounded-pill px-2.5 py-1 text-white" style={{ backgroundColor: '#2e37a4' }}>
                                  Stitching
                                </span>
                                <span className="fw-bold text-dark fs-14">Pattern Configuration</span>
                              </div>
                              <span className="small text-muted" style={{ fontSize: '11.5px' }}>Garment Assembly</span>
                            </div>

                            {/* Meters of thread required for 1m stitching (single-time entry) */}
                            <div className="mb-3">
                              <label className="form-label fw-semibold text-dark small mb-1">
                                Meters of thread required for 1m stitching (single‑time entry) <span className="text-danger">*</span>
                              </label>
                              <div className="input-group input-group-sm" style={{ maxWidth: '260px' }}>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="form-control fw-bold"
                                  placeholder="e.g. 15"
                                  value={formData.metersPerMeterStitching !== undefined && formData.metersPerMeterStitching !== null && formData.metersPerMeterStitching !== '' ? formData.metersPerMeterStitching : (formData.threadPerStitch !== undefined && formData.threadPerStitch !== null && formData.threadPerStitch !== '' ? formData.threadPerStitch : '')}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
                                    setFormData({ ...formData, metersPerMeterStitching: val, threadPerStitch: val });
                                  }}
                                  style={{ height: '36px' }}
                                />
                                <span className="input-group-text bg-white text-muted">m / 1m stitch</span>
                              </div>
                              <div className="form-text text-muted" style={{ fontSize: '11.5px' }}>
                                Single-time entry: Metres of thread required for 1m stitching.
                              </div>
                            </div>

                            {/* Thread Per Piece - Default 60m, editable */}
                            <div className="mb-3">
                              <label className="form-label fw-semibold text-dark small mb-1">
                                Thread Per Piece (metres) <span className="text-danger">*</span>
                              </label>
                              <div className="input-group input-group-sm" style={{ maxWidth: '220px' }}>
                                <input
                                  type="number"
                                  step="1"
                                  className="form-control fw-bold"
                                  placeholder="e.g. 60"
                                  value={formData.threadPerPiece !== undefined && formData.threadPerPiece !== null ? formData.threadPerPiece : ''}
                                  onChange={(e) => setFormData({ ...formData, threadPerPiece: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) })}
                                  style={{ height: '36px' }}
                                />
                                <span className="input-group-text bg-white text-muted">m / piece</span>
                              </div>
                              <div className="form-text text-muted" style={{ fontSize: '11.5px' }}>
                                Auto-populates BOM Quantity per Piece (editable).
                              </div>
                            </div>

                            {/* Available Boxes (Same structure as Kantha) */}
                            <div className="mb-3 p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <label className="form-label fw-bold text-dark small mb-0">
                                  Available Boxes (Each box = 6000 m)
                                </label>
                                <span className="badge bg-light text-muted border" style={{ fontSize: '11px' }}>
                                  Reels Per Box &times; Metres Per Reel
                                </span>
                              </div>
                              {(() => {
                                const boxList = (formData.boxes && formData.boxes.length > 0)
                                  ? formData.boxes
                                  : [{ reelsPerBox: '', metersPerReel: '' }];
                                return boxList.map((b, i, arr) => {
                                  const totalBoxMetres = (parseFloat(b.reelsPerBox) || 0) * (parseFloat(b.metersPerReel) || 0);
                                  return (
                                    <div key={i} className="row g-2 align-items-center mb-2 p-2 bg-light rounded-2 border">
                                      <div className="col-4">
                                        <label className="form-label small text-muted mb-0" style={{ fontSize: '11px' }}>Reels Per Box</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm fw-bold"
                                          placeholder="e.g. 15"
                                          value={b.reelsPerBox ?? ''}
                                          onChange={(e) => {
                                            const updated = [...arr];
                                            updated[i] = { ...updated[i], reelsPerBox: e.target.value };
                                            setFormData({ ...formData, boxes: updated });
                                          }}
                                        />
                                      </div>
                                      <div className="col-4">
                                        <label className="form-label small text-muted mb-0" style={{ fontSize: '11px' }}>Metres Per Reel</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm fw-bold"
                                          placeholder="e.g. 400"
                                          value={b.metersPerReel ?? ''}
                                          onChange={(e) => {
                                            const updated = [...arr];
                                            updated[i] = { ...updated[i], metersPerReel: e.target.value };
                                            setFormData({ ...formData, boxes: updated });
                                          }}
                                        />
                                      </div>
                                      <div className="col-3 text-center">
                                        <span className={`badge ${totalBoxMetres === 6000 ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-dark'}`} style={{ fontSize: '11px' }}>
                                          = {totalBoxMetres || 0} m
                                        </span>
                                      </div>
                                      <div className="col-1 text-end">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                          onClick={() => {
                                            const updated = arr.filter((_, idx) => idx !== i);
                                            setFormData({
                                              ...formData,
                                              boxes: updated.length ? updated : [{ reelsPerBox: '', metersPerReel: '' }]
                                            });
                                          }}
                                        >
                                          <i className="ti ti-trash"></i>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-primary d-inline-flex align-items-center gap-1 mt-1"
                                style={{ fontSize: '12px' }}
                                onClick={() => {
                                  const current = (formData.boxes && formData.boxes.length > 0)
                                    ? formData.boxes
                                    : [{ reelsPerBox: '', metersPerReel: '' }];
                                  setFormData({ ...formData, boxes: [...current, { reelsPerBox: '', metersPerReel: '' }] });
                                }}
                              >
                                <i className="ti ti-plus"></i> Add Box Configuration
                              </button>
                            </div>

                            {/* Available Cone Sizes (Repeatable) */}
                            <div className="mb-3 p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <TagInput
                                label="Available Cone Sizes (e.g. 5000 m, 10000 m)"
                                tags={formData.coneSizes || []}
                                onChange={(newTags) => setFormData({ ...formData, coneSizes: newTags })}
                                placeholder="Type cone size (e.g. 5000 m) and press Enter"
                                suggestions={['5000 m', '10000 m', '20000 m']}
                              />
                            </div>

                            {/* Targeted Articles (Multi-Select) & Dynamic Thread Consumption per 100 Pieces (per Article) */}
                            <div className="p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
                                <label className="form-label fw-bold text-dark small mb-0">
                                  Targeted Articles &amp; Consumption per 100 Pieces <span className="text-danger">*</span>
                                </label>
                                <div className="d-flex align-items-center gap-1.5">
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                                    style={{ fontSize: '11px' }}
                                    onClick={() => {
                                      const allNames = availableTargetArticles.map(a => a.name);
                                      const newConsumption = { ...(formData.consumptionPer100Pcs || {}) };
                                      allNames.forEach(name => {
                                        if (newConsumption[name] === undefined) newConsumption[name] = '';
                                      });
                                      setFormData({
                                        ...formData,
                                        stitchingArticles: allNames,
                                        consumptionPer100Pcs: newConsumption
                                      });
                                    }}
                                  >
                                    Select All
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                                    style={{ fontSize: '11px' }}
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        stitchingArticles: [],
                                        consumptionPer100Pcs: {}
                                      });
                                    }}
                                  >
                                    Deselect All
                                  </button>
                                </div>
                              </div>
                              <div className="form-text text-muted mb-2.5" style={{ fontSize: '11.5px' }}>
                                Select targeted articles via multi-select; for each article, record Thread Consumption per 100 Pieces (strictly in metres).
                              </div>

                              {/* Multi-select chips for articles */}
                              <div className="d-flex flex-wrap gap-1.5 mb-2.5">
                                {availableTargetArticles.map((art) => {
                                  const isSelected = (formData.stitchingArticles || []).includes(art.name);
                                  return (
                                    <button
                                      key={art.id || art.name}
                                      type="button"
                                      className={`btn btn-sm d-inline-flex align-items-center gap-1.5 py-1 px-2.5 rounded-pill border transition-all ${
                                        isSelected ? 'btn-primary text-white shadow-xs fw-semibold' : 'bg-light text-secondary'
                                      }`}
                                      style={{ fontSize: '12px' }}
                                      onClick={() => {
                                        const current = formData.stitchingArticles || [];
                                        const next = isSelected
                                          ? current.filter(a => a !== art.name)
                                          : [...current, art.name];
                                        
                                        const nextConsumption = { ...(formData.consumptionPer100Pcs || {}) };
                                        if (isSelected) {
                                          delete nextConsumption[art.name];
                                        } else {
                                          if (nextConsumption[art.name] === undefined) {
                                            nextConsumption[art.name] = '';
                                          }
                                        }
                                        setFormData({
                                          ...formData,
                                          stitchingArticles: next,
                                          consumptionPer100Pcs: nextConsumption
                                        });
                                      }}
                                    >
                                      <span>{art.icon || '👕'}</span>
                                      <span>{art.name}</span>
                                      <i className={`ti ti-${isSelected ? 'check' : 'plus'} small`}></i>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Quick add custom article */}
                              <div className="d-flex align-items-center gap-2 mb-3">
                                <div className="input-group input-group-sm" style={{ maxWidth: '280px' }}>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Add custom article (e.g. Gown)"
                                    value={customArticleInput}
                                    onChange={(e) => setCustomArticleInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCustomArticle();
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={handleAddCustomArticle}
                                  >
                                    <i className="ti ti-plus"></i> Add
                                  </button>
                                </div>
                                <span className="text-muted" style={{ fontSize: '11px' }}>
                                  (Add garment type if not in the list)
                                </span>
                              </div>

                              {/* Dynamic input boxes per selected article */}
                              {(formData.stitchingArticles || []).length > 0 ? (
                                <div className="p-2.5 bg-light rounded-3 border">
                                  <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="small fw-semibold text-dark">
                                      Thread Consumption per 100 Pieces (strictly in metres):
                                    </div>
                                    <span className="badge bg-primary-subtle text-primary border" style={{ fontSize: '11px' }}>
                                      {(formData.stitchingArticles || []).length} Selected
                                    </span>
                                  </div>
                                  <div className="row g-2">
                                    {(formData.stitchingArticles || []).map((artName) => (
                                      <div key={artName} className="col-md-6">
                                        <div className="p-2 bg-white rounded-2 border d-flex align-items-center justify-content-between gap-2 shadow-2xs">
                                          <div className="d-flex align-items-center gap-1.5 text-truncate" style={{ maxWidth: '140px' }}>
                                            <span className="fw-semibold text-dark small" style={{ fontSize: '12.5px' }} title={artName}>
                                              {artName}:
                                            </span>
                                          </div>
                                          <div className="d-flex align-items-center gap-1">
                                            <div className="input-group input-group-sm" style={{ width: '150px' }}>
                                              <input
                                                type="number"
                                                className="form-control fw-bold"
                                                placeholder="e.g. 6000"
                                                value={formData.consumptionPer100Pcs?.[artName] ?? ''}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  setFormData({
                                                    ...formData,
                                                    consumptionPer100Pcs: {
                                                      ...(formData.consumptionPer100Pcs || {}),
                                                      [artName]: val
                                                    }
                                                  });
                                                }}
                                              />
                                              <span className="input-group-text bg-light text-muted" style={{ fontSize: '11px' }}>m / 100pcs</span>
                                            </div>
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-link text-danger p-0 ms-1 text-decoration-none"
                                              title={`Remove ${artName}`}
                                              onClick={() => {
                                                const current = formData.stitchingArticles || [];
                                                const next = current.filter(a => a !== artName);
                                                const nextConsumption = { ...(formData.consumptionPer100Pcs || {}) };
                                                delete nextConsumption[artName];
                                                setFormData({
                                                  ...formData,
                                                  stitchingArticles: next,
                                                  consumptionPer100Pcs: nextConsumption
                                                });
                                              }}
                                            >
                                              <i className="ti ti-x"></i>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="alert alert-warning py-2 px-3 rounded-2 small mb-0 d-flex align-items-center gap-2">
                                  <i className="ti ti-alert-triangle"></i>
                                  <span>No articles selected yet. Click any of the article chips above to enter consumption per 100 pieces.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 7.5 Embroidery, Button Tacking & Handwork */}
                        {formData.threadPattern === 'Embroidery' && (
                          <div className="alert alert-info py-2.5 px-3 rounded-3 small mb-3 d-flex align-items-center gap-2">
                            <i className="ti ti-info-circle fs-5"></i>
                            <span>No additional measurements are required for <strong>Embroidery</strong>.</span>
                          </div>
                        )}

                        {isProcessOnly && (
                          <div className="card p-3 rounded-3 mb-3 border bg-light shadow-2xs" style={{ borderColor: '#e2e8f0' }}>
                            <div className="fw-bold text-dark small mb-1">
                              {formData.threadPattern}
                            </div>
                            <p className="form-text text-muted mb-2" style={{ fontSize: '12px' }}>
                              No special measurements required — the BOM only records that this process is required.
                            </p>
                            <label className="form-label fw-semibold text-dark small mb-1">Remarks (optional)</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder={`Optional remarks for ${formData.threadPattern}`}
                              value={formData.processRemarks || ''}
                              onChange={(e) => setFormData({ ...formData, processRemarks: e.target.value })}
                              style={{ height: '38px', borderRadius: '7px' }}
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* ============================================================== */}
                  {/* CATEGORY 5: DORI (DRAWSTRING) CONFIGURATION (SECTION 6.4 & 10.1) */}
                  {/* ============================================================== */}
                  {formData.category === 'Dori' && (() => {
                    const doriEntries = (formData.doriFabricEntries && formData.doriFabricEntries.length > 0)
                      ? formData.doriFabricEntries
                      : [{ fabricQuality: '', widthSizes: [], consumptions: {} }];

                    return (
                      <div className="mb-3">
                        {/* Top Level: Required Size & Unit */}
                        <div className="row g-3 mb-3">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold text-dark small mb-1.5">
                              Required size <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. 35 cm, 40 cm"
                              value={formData.doriRequiredSize || formData.size || ''}
                              onChange={(e) => setFormData({ ...formData, doriRequiredSize: e.target.value, size: e.target.value })}
                              style={{ height: '42px', borderRadius: '8px' }}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-semibold text-dark small mb-1.5">
                              Unit <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              value={formData.doriUnit || formData.unit || 'Meter'}
                              onChange={(e) => setFormData({ ...formData, doriUnit: e.target.value, unit: e.target.value })}
                              style={{ height: '42px', borderRadius: '8px' }}
                            >
                              <option value="Meter">Meter</option>
                              <option value="Piece">Piece</option>
                              <option value="cm">cm</option>
                              <option value="inch">inch</option>
                            </select>
                          </div>
                        </div>

                        {/* Fabric Entry Section (Step 1 -> Step 2 -> Step 3) */}
                        <div className="p-3 bg-light rounded-3 border mb-3">
                          <div className="fw-semibold text-dark small mb-2 d-flex justify-content-between align-items-center">
                            <span>Fabric Entry Flow (Fabric Quality &rarr; Widths &rarr; Consumption):</span>
                            <span className="badge bg-purple-subtle text-purple border" style={{ fontSize: '11px' }}>
                              Section 6.4
                            </span>
                          </div>

                          {doriEntries.map((fe, idx) => {
                            const selectedWidths = fe.widthSizes || [];
                            return (
                              <div key={idx} className="p-3 bg-white rounded-3 border mb-3 shadow-2xs">
                                <div className="d-flex justify-content-between align-items-center mb-2.5 pb-2 border-bottom">
                                  <span className="fw-bold text-dark small">
                                    Fabric Entry #{idx + 1}
                                  </span>
                                  {doriEntries.length > 1 && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                      onClick={() => {
                                        const updated = doriEntries.filter((_, i) => i !== idx);
                                        setFormData({ ...formData, doriFabricEntries: updated });
                                      }}
                                    >
                                      <i className="ti ti-trash me-1"></i> Remove Fabric
                                    </button>
                                  )}
                                </div>

                                {/* Step 1: Fabric Quality */}
                                <div className="mb-3">
                                  <label className="form-label text-muted small mb-1 fw-medium">
                                    Step 1: Fabric Quality <span className="text-danger">*</span>
                                  </label>
                                  <select
                                    className="form-select form-select-sm"
                                    value={fe.fabricQuality || ''}
                                    onChange={(e) => {
                                      const selectedQuality = e.target.value;
                                      const widthsForFab = getFabricWidths(selectedQuality);
                                      const updated = [...doriEntries];
                                      const curSelected = fe.widthSizes || [];
                                      let newSelectedWidths = curSelected.filter(w =>
                                        widthsForFab.some(wf => wf.replace(/"/g, '') === String(w).replace(/"/g, ''))
                                      );
                                      if (newSelectedWidths.length === 0 && widthsForFab.length === 1) {
                                        newSelectedWidths = [widthsForFab[0]];
                                      }
                                      updated[idx] = {
                                        ...updated[idx],
                                        fabricQuality: selectedQuality,
                                        widthSizes: newSelectedWidths
                                      };
                                      setFormData({ ...formData, doriFabricEntries: updated });
                                    }}
                                    style={{ height: '38px', borderRadius: '7px' }}
                                  >
                                    <option value="">-- Select Fabric Quality --</option>
                                    {allAvailableFabrics.map((fq) => {
                                      const wList = getFabricWidths(fq);
                                      const wLabel = wList.length > 0 ? ` (${wList.join(', ')})` : '';
                                      return (
                                        <option key={fq} value={fq}>
                                          {fq}{wLabel}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>

                                {/* Step 2: Width Size(s) Multi-select Chips */}
                                <div className="mb-3">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <label className="form-label text-muted small mb-0 fw-medium">
                                      Step 2: Width Size(s) <span className="text-danger">*</span>
                                    </label>
                                    {fe.fabricQuality && (
                                      <span className="text-muted" style={{ fontSize: '11px' }}>
                                        {getFabricWidths(fe.fabricQuality).length > 0
                                          ? `Configured in Master: ${getFabricWidths(fe.fabricQuality).join(', ')}`
                                          : 'Standard Widths'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="d-flex flex-wrap gap-2">
                                    {(() => {
                                      if (!fe.fabricQuality) {
                                        return (
                                          <span className="text-muted small fst-italic" style={{ fontSize: '12px' }}>
                                            Please select a Fabric Quality in Step 1 first
                                          </span>
                                        );
                                      }
                                      const availableWidths = getFabricWidths(fe.fabricQuality);
                                      const displayWidths = availableWidths.length > 0 ? availableWidths : STANDARD_WIDTHS;
                                      return displayWidths.map((w) => {
                                        const cleanW = String(w).replace(/"/g, '');
                                        const isSelected = selectedWidths.some(
                                          (sw) => String(sw).replace(/"/g, '') === cleanW
                                        );
                                        return (
                                          <button
                                            key={w}
                                            type="button"
                                            className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold font-monospace ${
                                              isSelected ? 'btn-primary text-white' : 'btn-outline-secondary bg-white text-dark'
                                            }`}
                                            style={{ fontSize: '12px' }}
                                            onClick={() => {
                                              const updated = [...doriEntries];
                                              const curWidths = fe.widthSizes || [];
                                              const curCons = { ...(fe.consumptions || {}) };
                                              if (isSelected) {
                                                const nextWidths = curWidths.filter(
                                                  (x) => String(x).replace(/"/g, '') !== cleanW
                                                );
                                                delete curCons[w];
                                                delete curCons[cleanW];
                                                delete curCons[`${cleanW}"`];
                                                updated[idx] = { ...updated[idx], widthSizes: nextWidths, consumptions: curCons };
                                              } else {
                                                const nextWidths = [...curWidths, w];
                                                updated[idx] = { ...updated[idx], widthSizes: nextWidths, consumptions: curCons };
                                              }
                                              setFormData({ ...formData, doriFabricEntries: updated });
                                            }}
                                          >
                                            {isSelected ? `✓ ${w}` : `+ ${w}`}
                                          </button>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>

                                {/* Step 3: Consumption per Width (cm) */}
                                {selectedWidths.length > 0 && (
                                  <div className="p-3 rounded-3 bg-light border">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                      <label className="form-label text-dark small mb-0 fw-semibold">
                                        Step 3: Fabric required per 1m Dori <span className="text-danger">*</span>
                                      </label>
                                      {/* <span className="text-muted" style={{ fontSize: '11px' }}>
                                        Enter consumption in cm per dori
                                      </span> */}
                                    </div>
                                    <div className="row g-2.5">
                                      {selectedWidths.map((w) => (
                                        <div key={w} className="col-12 col-sm-6">
                                          <div className="input-group shadow-xs rounded-2 overflow-hidden border bg-white">
                                            <span
                                              className="input-group-text bg-white fw-bold font-monospace text-primary border-0 border-end px-3"
                                              style={{ fontSize: '13px', minWidth: '52px', justifyContent: 'center' }}
                                            >
                                              {w}
                                            </span>
                                            <input
                                              type="number"
                                              step="any"
                                              className="form-control border-0 text-center font-monospace fw-semibold px-2"
                                              placeholder="e.g. 0.025"
                                              value={fe.consumptions?.[w] ?? ''}
                                              onChange={(e) => {
                                                const updated = [...doriEntries];
                                                const cons = { ...(fe.consumptions || {}) };
                                                cons[w] = e.target.value;
                                                updated[idx] = { ...updated[idx], consumptions: cons };
                                                setFormData({ ...formData, doriFabricEntries: updated });
                                              }}
                                              style={{ height: '38px', fontSize: '13px' }}
                                            />
                                            <span
                                              className="input-group-text bg-light text-muted border-0 border-start px-3 fw-medium"
                                              style={{ fontSize: '12px' }}
                                            >
                                              cm
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          <button
                            type="button"
                            className="btn btn-sm btn-link text-primary p-0 text-decoration-none fw-semibold d-inline-flex align-items-center gap-1"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                doriFabricEntries: [
                                  ...doriEntries,
                                  { fabricQuality: '', widthSizes: [], consumptions: {} }
                                ]
                              });
                            }}
                          >
                            <i className="ti ti-plus"></i> Add More Fabric
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ============================================================== */}
                  {/* CATEGORY 6: ELASTIC CONFIGURATION (SECTION 6.5)                */}
                  {/* ============================================================== */}
                  {formData.category === 'Elastic' && (() => {
                    const elasticEntries = (formData.fabricRows && formData.fabricRows.length > 0)
                      ? formData.fabricRows
                      : [{ fabricQuality: '', fabricName: '', size: '', unit: 'Meter', consumption: '' }];

                    return (
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <div className="fw-semibold text-dark small">
                              Elastic Configuration (per 1m fabric):
                            </div>
                            <div className="text-muted" style={{ fontSize: '11.5px' }}>
                              Define associated fabric and elastic consumption required per 1 metre of fabric
                            </div>
                          </div>
                          <span className="badge bg-primary-subtle text-primary border" style={{ fontSize: '11px' }}>
                            Section 6.5
                          </span>
                        </div>

                        {elasticEntries.map((r, i, arr) => (
                          <div key={i} className="row g-2 align-items-end mb-2 p-2.5 bg-light rounded-3 border">
                            <div className="col-md-4">
                              <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>
                                Associated fabric <span className="text-danger">*</span>
                              </label>
                              <select
                                className="form-select form-select-sm"
                                value={r.fabricQuality || r.fabricName || ''}
                                onChange={(e) => {
                                  const updated = [...elasticEntries];
                                  updated[i] = { ...updated[i], fabricQuality: e.target.value, fabricName: e.target.value };
                                  setFormData({ ...formData, fabricRows: updated });
                                }}
                                style={{ height: '36px', borderRadius: '6px' }}
                              >
                                <option value="">-- Select Associated Fabric --</option>
                                {allAvailableFabrics.map((fq) => {
                                  const wList = getFabricWidths(fq);
                                  const wLabel = wList.length > 0 ? ` (${wList.join(', ')})` : '';
                                  return (
                                    <option key={fq} value={fq}>{fq}{wLabel}</option>
                                  );
                                })}
                              </select>
                            </div>
                            <div className="col-md-2">
                              <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>
                                Required size <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="e.g. 1/2&quot;, 1&quot;, 20mm"
                                value={r.size || ''}
                                onChange={(e) => {
                                  const updated = [...elasticEntries];
                                  updated[i] = { ...updated[i], size: e.target.value };
                                  setFormData({ ...formData, fabricRows: updated });
                                }}
                                style={{ height: '36px', borderRadius: '6px' }}
                              />
                            </div>
                            <div className="col-md-2">
                              <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>
                                Unit <span className="text-danger">*</span>
                              </label>
                              <select
                                className="form-select form-select-sm"
                                value={r.unit || 'Meter'}
                                onChange={(e) => {
                                  const updated = [...elasticEntries];
                                  updated[i] = { ...updated[i], unit: e.target.value };
                                  setFormData({ ...formData, fabricRows: updated });
                                }}
                                style={{ height: '36px', borderRadius: '6px' }}
                              >
                                <option value="Meter">Meter</option>
                                <option value="Piece">Piece</option>
                                <option value="Yard">Yard</option>
                                <option value="Roll">Roll</option>
                                <option value="Packet">Packet</option>
                              </select>
                            </div>
                            <div className="col-md-3">
                              <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>
                                Elastic consumption <span className="text-danger">*</span>
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                className="form-control form-control-sm"
                                placeholder="e.g. 0.85"
                                value={r.consumption ?? ''}
                                onChange={(e) => {
                                  const updated = [...elasticEntries];
                                  updated[i] = { ...updated[i], consumption: e.target.value };
                                  setFormData({ ...formData, fabricRows: updated });
                                }}
                                style={{ height: '36px', borderRadius: '6px' }}
                              />
                            </div>
                            <div className="col-md-1 pb-1 text-end">
                              {arr.length > 1 ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                  onClick={() => {
                                    const updated = elasticEntries.filter((_, idx) => idx !== i);
                                    setFormData({ ...formData, fabricRows: updated });
                                  }}
                                >
                                  Remove
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                                  title="Clear row"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      fabricRows: [{ fabricQuality: '', fabricName: '', size: '', unit: 'Meter', consumption: '' }]
                                    });
                                  }}
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-primary p-0 text-decoration-none fw-semibold d-inline-flex align-items-center gap-1"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              fabricRows: [
                                ...elasticEntries,
                                { fabricQuality: '', fabricName: '', size: '', unit: 'Meter', consumption: '' }
                              ]
                            });
                          }}
                        >
                          <i className="ti ti-plus"></i> Add More Entry
                        </button>
                      </div>
                    );
                  })()}

                  {/* ============================================================== */}
                  {/* CATEGORY 7: BEADS & SEQUINS CONFIGURATION (SECTION 6.6)         */}
                  {/* ============================================================== */}
                  {formData.category === 'Beads & Sequins' && (() => {
                    const beadsEntries = (formData.fabricRows && formData.fabricRows.length > 0)
                      ? formData.fabricRows
                      : [{ fabricQuality: '', fabricName: '', size: '', unit: 'Gram', consumption: '' }];

                    return (
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <div className="fw-semibold text-dark small">
                              Beads &amp; Sequins Configuration (per 1m fabric):
                            </div>
                            <div className="text-muted" style={{ fontSize: '11.5px' }}>
                              Define associated fabric and beads &amp; sequins consumption required per 1 metre of fabric
                            </div>
                          </div>
                          <span className="badge bg-danger-subtle text-danger border" style={{ fontSize: '11px' }}>
                            Section 6.6
                          </span>
                        </div>

                        {beadsEntries.map((r, i, arr) => (
                          <div key={i} className="row g-2 align-items-end mb-2 p-2.5 bg-light rounded-3 border">
                            <div className="col-md-4">
                              <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>
                                Associated fabric <span className="text-danger">*</span>
                              </label>
                              <select
                                className="form-select form-select-sm"
                                value={r.fabricQuality || r.fabricName || ''}
                                onChange={(e) => {
                                  const updated = [...beadsEntries];
                                  updated[i] = { ...updated[i], fabricQuality: e.target.value, fabricName: e.target.value };
                                  setFormData({ ...formData, fabricRows: updated });
                                }}
                                style={{ height: '36px', borderRadius: '6px' }}
                              >
                                <option value="">-- Select Associated Fabric --</option>
                                {allAvailableFabrics.map((fq) => {
                                  const wList = getFabricWidths(fq);
                                  const wLabel = wList.length > 0 ? ` (${wList.join(', ')})` : '';
                                  return (
                                    <option key={fq} value={fq}>{fq}{wLabel}</option>
                                  );
                                })}
                              </select>
                            </div>
                            <div className="col-md-2">
                              <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>
                                Required size <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="e.g. 2mm, 4mm, Size 11/0"
                                value={r.size || ''}
                                onChange={(e) => {
                                  const updated = [...beadsEntries];
                                  updated[i] = { ...updated[i], size: e.target.value };
                                  setFormData({ ...formData, fabricRows: updated });
                                }}
                                style={{ height: '36px', borderRadius: '6px' }}
                              />
                            </div>
                            <div className="col-md-2">
                              <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>
                                Unit <span className="text-danger">*</span>
                              </label>
                              <select
                                className="form-select form-select-sm"
                                value={r.unit || 'Gram'}
                                onChange={(e) => {
                                  const updated = [...beadsEntries];
                                  updated[i] = { ...updated[i], unit: e.target.value };
                                  setFormData({ ...formData, fabricRows: updated });
                                }}
                                style={{ height: '36px', borderRadius: '6px' }}
                              >
                                <option value="Gram">Gram</option>
                                <option value="Packet">Packet</option>
                                <option value="Piece">Piece</option>
                                <option value="Gross">Gross</option>
                                <option value="Meter">Meter</option>
                              </select>
                            </div>
                            <div className="col-md-3">
                              <label className="form-label text-muted mb-1" style={{ fontSize: '11.5px' }}>
                                Consumption / 1m fabric <span className="text-danger">*</span>
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                className="form-control form-control-sm"
                                placeholder="e.g. 25"
                                value={r.consumption ?? ''}
                                onChange={(e) => {
                                  const updated = [...beadsEntries];
                                  updated[i] = { ...updated[i], consumption: e.target.value };
                                  setFormData({ ...formData, fabricRows: updated });
                                }}
                                style={{ height: '36px', borderRadius: '6px' }}
                              />
                            </div>
                            <div className="col-md-1 pb-1 text-end">
                              {arr.length > 1 ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                  onClick={() => {
                                    const updated = beadsEntries.filter((_, idx) => idx !== i);
                                    setFormData({ ...formData, fabricRows: updated });
                                  }}
                                >
                                  Remove
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                                  title="Clear row"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      fabricRows: [{ fabricQuality: '', fabricName: '', size: '', unit: 'Gram', consumption: '' }]
                                    });
                                  }}
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-primary p-0 text-decoration-none fw-semibold d-inline-flex align-items-center gap-1"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              fabricRows: [
                                ...beadsEntries,
                                { fabricQuality: '', fabricName: '', size: '', unit: 'Gram', consumption: '' }
                              ]
                            });
                          }}
                        >
                          <i className="ti ti-plus"></i> Add More Entry
                        </button>
                      </div>
                    );
                  })()}

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
                        min="0"
                        max="5"
                        step="any"
                        className="form-control"
                        placeholder="e.g. 5"
                        value={formData.maxBuffer ?? ''}
                        onKeyDown={(e) => {
                          if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setFormData({ ...formData, maxBuffer: '' });
                            return;
                          }
                          const num = parseFloat(val);
                          if (isNaN(num)) {
                            setFormData({ ...formData, maxBuffer: '' });
                          } else if (num > 5) {
                            setFormData({ ...formData, maxBuffer: 5 });
                          } else if (num < 0) {
                            setFormData({ ...formData, maxBuffer: 0 });
                          } else {
                            setFormData({ ...formData, maxBuffer: val });
                          }
                        }}
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
                  </fieldset>
                </div>

                {/* Modal Footer with Clean Theme Buttons */}
                <div className="modal-footer border-top py-3 px-4 d-flex justify-content-end gap-2 bg-light">
                  {!isModalEditMode ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-theme-close rounded-3 px-4 fw-medium"
                        onClick={() => {
                          setIsEditing(false);
                          setIsModalEditMode(false);
                        }}
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary rounded-3 px-4 fw-semibold"
                        onClick={() => setIsModalEditMode(true)}
                      >
                        <i className="ti ti-edit me-1"></i> Edit Accessory
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-theme-close rounded-3 px-4 fw-medium"
                        onClick={() => {
                          if (isCreatingNew) {
                            setIsEditing(false);
                            setIsModalEditMode(false);
                          } else {
                            setIsModalEditMode(false);
                          }
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary rounded-3 px-4 fw-semibold"
                        disabled={isNameDuplicate}
                        title={isNameDuplicate ? 'Duplicate accessory names are not allowed' : ''}
                      >
                        <i className="ti ti-check me-1"></i> Save Accessory
                      </button>
                    </>
                  )}
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

      {/* POPUP MODAL: READ-ONLY VIEW MODE REMOVED */}
      {false && selectedAccessory && !isEditing && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060, backdropFilter: 'blur(3px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable" style={{ maxWidth: '1080px', maxHeight: '92vh' }}>
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden bg-light">
              {/* Modal Header */}
              <div className="modal-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-4 d-flex align-items-center justify-content-center text-white shadow-sm flex-shrink-0"
                    style={{ width: '48px', height: '48px', backgroundColor: getCategoryColor(selectedAccessory.category), fontSize: '22px' }}
                  >
                    <i className={getCategoryIcon(selectedAccessory.category)}></i>
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-purple-subtle text-purple font-monospace px-2.5 py-1 rounded-2">
                        {selectedAccessory.id}
                      </span>
                      <h5 className="fw-bold text-dark mb-0">{selectedAccessory.name}</h5>
                      <span className={`badge ${selectedAccessory.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2.5 py-1 rounded-pill`}>
                        {selectedAccessory.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-muted small mt-0.5">
                      Category: <strong>{selectedAccessory.category}</strong> &bull; Unit: {selectedAccessory.unit || 'Piece'}{!['Button', 'Buttons', 'Tassel', 'Tassels', 'Thread'].includes(selectedAccessory.category) && ` (${selectedAccessory.piecesPerUnit || 1} pcs/unit)`}
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm rounded-3 px-3 fw-semibold d-flex align-items-center gap-1.5"
                    onClick={() => {
                      handleEditAccessory(selectedAccessory);
                      setSelectedAccessory(null);
                    }}
                  >
                    <i className="ti ti-edit"></i>
                    <span>Edit Full Accessory</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-theme-close btn-sm rounded-3 px-3 d-flex align-items-center gap-1"
                    onClick={() => {
                      setSelectedAccessory(null);
                      setEditingSection(null);
                    }}
                  >
                    <i className="ti ti-x"></i>
                    <span>Close</span>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4" style={{ maxHeight: 'calc(90vh - 110px)', overflowY: 'auto' }}>

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
                        disabled={isSectionNameDuplicate}
                        title={isSectionNameDuplicate ? 'Duplicate accessory names are not allowed' : ''}
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
                          className={`form-control form-control-sm ${isSectionNameDuplicate ? 'is-invalid border-danger' : ''}`}
                          value={sectionFormData.name || ''}
                          onChange={(e) => setSectionFormData({ ...sectionFormData, name: autoCapitalizeWords(e.target.value) })}
                        />
                        {isSectionNameDuplicate ? (
                          <div className="invalid-feedback d-block text-danger fw-semibold small mt-1">
                            <i className="ti ti-alert-circle me-1"></i>
                            Duplicate name not allowed: An accessory named &quot;{sectionFormData.name.trim()}&quot; already exists.
                          </div>
                        ) : (
                          <div className="form-text small text-muted">Auto-capitalised word by word</div>
                        )}
                      </div>
                      <div className="row g-2">
                        <div className={!['Button', 'Buttons', 'Tassel', 'Tassels', 'Thread'].includes(sectionFormData.category) ? 'col-6' : 'col-12'}>
                          <label className="form-label small fw-semibold text-muted">Unit</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={sectionFormData.unit || ''}
                            onChange={(e) => setSectionFormData({ ...sectionFormData, unit: e.target.value })}
                          />
                        </div>
                        {!['Button', 'Buttons', 'Tassel', 'Tassels', 'Thread'].includes(sectionFormData.category) && (
                          <div className="col-6">
                            <label className="form-label small fw-semibold text-muted">Pieces Per Unit</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={sectionFormData.piecesPerUnit || ''}
                              onChange={(e) => setSectionFormData({ ...sectionFormData, piecesPerUnit: parseInt(e.target.value) || 1 })}
                            />
                          </div>
                        )}
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
                        <div className="text-muted small">{!['Button', 'Buttons', 'Tassel', 'Tassels', 'Thread'].includes(selectedAccessory.category) ? 'Unit & Pieces' : 'Unit'}</div>
                        <div className="fw-semibold text-dark">
                          {selectedAccessory.unit || 'Piece'}{!['Button', 'Buttons', 'Tassel', 'Tassels', 'Thread'].includes(selectedAccessory.category) && ` • ${selectedAccessory.piecesPerUnit || 1} pcs per unit`}
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
                    editingSection === 'category' ? (
                      <div className="d-flex flex-column gap-3">
                        <TagInput
                          label="Lace Sizes / Variants"
                          tags={sectionFormData.laceSizesList?.length ? sectionFormData.laceSizesList : (sectionFormData.laceSize ? sectionFormData.laceSize.split(',').map(s => s.trim()).filter(Boolean) : (sectionFormData.size ? [sectionFormData.size] : []))}
                          onChange={(newTags) => {
                            setSectionFormData({
                              ...sectionFormData,
                              laceSizesList: newTags,
                              laceSize: newTags.join(', '),
                              size: newTags[0] || ''
                            });
                          }}
                          placeholder="Type size and press Enter (e.g. 15 mm, 20 mm)"
                          suggestions={['10 mm', '15 mm', '20 mm', '25 mm', '30 mm', '40 mm', '1 inch']}
                        />
                        <div>
                          <label className="form-label small fw-semibold text-muted">Default Shrinkage (%)</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={sectionFormData.defaultShrinkage || ''}
                            onChange={(e) => setSectionFormData({ ...sectionFormData, defaultShrinkage: e.target.value })}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <div className="text-muted small">Lace Sizes / Variants</div>
                          <div className="d-flex flex-wrap gap-1.5 mt-1">
                            {((selectedAccessory.laceSizesList && selectedAccessory.laceSizesList.length > 0)
                              ? selectedAccessory.laceSizesList
                              : (selectedAccessory.laceSize ? selectedAccessory.laceSize.split(',').map(s => s.trim()).filter(Boolean) : [selectedAccessory.size || '15 mm'])
                            ).map((sz, i) => (
                              <span
                                key={i}
                                className="d-inline-flex align-items-center px-2.5 py-1 rounded-pill font-monospace"
                                style={{
                                  backgroundColor: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  color: '#1d4ed8',
                                  fontSize: '12.5px',
                                  fontWeight: 600
                                }}
                              >
                                <i className="ti ti-cut me-1"></i>
                                {sz}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted small">Default Shrinkage (%)</div>
                          <div className="fw-semibold text-secondary">{selectedAccessory.defaultShrinkage ? `${selectedAccessory.defaultShrinkage}%` : '0%'}</div>
                        </div>
                      </div>
                    )
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

                  {selectedAccessory.category === 'Elastic' && (
                    <div className="d-flex flex-column gap-2.5">
                      <div className="text-muted small fw-semibold">Elastic Configuration Entries:</div>
                      {((selectedAccessory.fabricRows && selectedAccessory.fabricRows.length > 0)
                        ? selectedAccessory.fabricRows
                        : [{
                            fabricQuality: selectedAccessory.associatedFabric || 'Mulmul Cotton',
                            size: selectedAccessory.requiredSize || '1 inch',
                            unit: selectedAccessory.unit || 'Meter',
                            consumption: selectedAccessory.fabricConsumption || 0.85
                          }]
                      ).map((row, rIdx) => (
                        <div key={rIdx} className="p-2.5 bg-light rounded-3 border small">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="fw-bold text-dark">{row.fabricQuality || row.fabricName || '—'}</span>
                            <span className="badge bg-primary-subtle text-primary border">{row.size || '—'}</span>
                          </div>
                          <div className="text-muted">
                            Consumption: <strong className="text-primary">{row.consumption || '—'} {row.unit || 'Meter'}</strong> per 1m fabric
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedAccessory.category === 'Beads & Sequins' && (
                    <div className="d-flex flex-column gap-2.5">
                      <div className="text-muted small fw-semibold">Beads &amp; Sequins Configuration Entries:</div>
                      {((selectedAccessory.fabricRows && selectedAccessory.fabricRows.length > 0)
                        ? selectedAccessory.fabricRows
                        : [{
                            fabricQuality: selectedAccessory.associatedFabric || 'Mulmul Cotton',
                            size: selectedAccessory.requiredSize || '4mm',
                            unit: selectedAccessory.unit || 'Gram',
                            consumption: selectedAccessory.fabricConsumption || 25
                          }]
                      ).map((row, rIdx) => (
                        <div key={rIdx} className="p-2.5 bg-light rounded-3 border small">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="fw-bold text-dark">{row.fabricQuality || row.fabricName || '—'}</span>
                            <span className="badge bg-danger-subtle text-danger border">{row.size || '—'}</span>
                          </div>
                          <div className="text-muted">
                            Consumption: <strong className="text-danger">{row.consumption || '—'} {row.unit || 'Gram'}</strong> per 1m fabric
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedAccessory.category === 'Thread' && (
                    <div className="d-flex flex-column gap-3">
                      <div className="row g-2">
                        <div className="col-12">
                          <div className="text-muted small">Ordering Unit</div>
                          <div className="fw-semibold text-dark small">{selectedAccessory.unit || 'Meter'}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-muted small mb-1">Thread Pattern</div>
                        <span className="badge rounded-pill px-3 py-1 text-white fw-semibold" style={{ backgroundColor: '#2e37a4' }}>
                          {selectedAccessory.threadPattern || 'Stitching'}
                        </span>
                      </div>

                      {['Kantha', 'Couching'].includes(selectedAccessory.threadPattern) && (
                        <div className="d-flex flex-column gap-2.5 pt-2 border-top">
                          <div className="row g-2">
                            <div className="col-6">
                              <div className="text-muted small">Thread Per Stitch</div>
                              <div className="fw-bold text-dark">{selectedAccessory.threadPerStitch || '—'} m / stitch</div>
                            </div>
                            <div className="col-6">
                              <div className="text-muted small">Global Stitching Metric</div>
                              <div className="fw-bold text-primary">{selectedAccessory.globalThreadMetric || '—'} m / stitch metre</div>
                            </div>
                          </div>

                          {selectedAccessory.boxes && selectedAccessory.boxes.length > 0 && (
                            <div>
                              <div className="text-muted small mb-1">Available Boxes:</div>
                              <div className="d-flex flex-wrap gap-1.5">
                                {selectedAccessory.boxes.map((b, i) => (
                                  <span key={i} className="badge bg-light text-dark border px-2 py-1 small">
                                    {b.reelsPerBox} reels &times; {b.metersPerReel}m ({(parseFloat(b.reelsPerBox)||0)*(parseFloat(b.metersPerReel)||0)}m)
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedAccessory.coneSizes && selectedAccessory.coneSizes.length > 0 && (
                            <div>
                              <div className="text-muted small mb-1">Cone Sizes:</div>
                              <div className="d-flex flex-wrap gap-1">
                                {selectedAccessory.coneSizes.map((cs, i) => (
                                  <span key={i} className="badge rounded-pill bg-white text-secondary border px-2 py-0.5" style={{ fontSize: '11px' }}>
                                    {cs}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedAccessory.placements && selectedAccessory.placements.length > 0 && (
                            <div>
                              <div className="text-muted small mb-1">Available Placements:</div>
                              <div className="d-flex flex-wrap gap-1">
                                {selectedAccessory.placements.map((p, i) => (
                                  <span key={i} className="badge rounded-pill bg-light text-dark border px-2 py-0.5" style={{ fontSize: '11px' }}>
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedAccessory.articlePlacements && selectedAccessory.articlePlacements.length > 0 && (
                            <div>
                              <div className="text-muted small mb-1.5 fw-semibold">Article &rarr; Placement &rarr; Thread Line Chain:</div>
                              {selectedAccessory.articlePlacements.map((ap, apIdx) => (
                                <div key={apIdx} className="p-2.5 bg-light rounded-2 border mb-2 shadow-2xs">
                                  <div className="fw-bold text-dark small mb-1">👘 {ap.article}</div>
                                  <div className="d-flex flex-wrap gap-1.5">
                                    {(ap.placements || []).map((p, pIdx) => (
                                      <span key={pIdx} className="badge bg-white text-dark border px-2 py-1 shadow-2xs" style={{ fontSize: '11.5px' }}>
                                        <span className="text-muted">{p.placement}:</span> <strong className="text-primary">{p.threadRequired}m</strong>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {selectedAccessory.threadPattern === 'Stitching' && (
                        <div className="d-flex flex-column gap-2.5 pt-2 border-top">
                          <div className="row g-2">
                            <div className="col-sm-6">
                              <div className="text-muted small">Meters of Thread for 1m Stitching</div>
                              <div className="fw-bold text-dark fs-14">
                                {selectedAccessory.metersPerMeterStitching || selectedAccessory.threadPerStitch || '—'} m / 1m stitch
                              </div>
                            </div>
                            <div className="col-sm-6">
                              <div className="text-muted small">Thread Per Piece (BOM Default)</div>
                              <div className="fw-bold text-dark fs-14">{selectedAccessory.threadPerPiece || '—'} m / piece</div>
                            </div>
                          </div>

                          {((selectedAccessory.stitchingArticles && selectedAccessory.stitchingArticles.length > 0) || (selectedAccessory.consumptionPer100Pcs && Object.keys(selectedAccessory.consumptionPer100Pcs).length > 0)) && (
                            <div>
                              <div className="text-muted small mb-1.5 fw-semibold">Targeted Articles &amp; Consumption per 100 pcs:</div>
                              <div className="d-flex flex-wrap gap-2">
                                {(selectedAccessory.stitchingArticles && selectedAccessory.stitchingArticles.length > 0
                                  ? selectedAccessory.stitchingArticles
                                  : Object.keys(selectedAccessory.consumptionPer100Pcs || {})
                                ).map((art) => {
                                  const m = selectedAccessory.consumptionPer100Pcs?.[art];
                                  return (
                                    <span key={art} className="badge bg-white text-dark border px-2.5 py-1.5 shadow-2xs d-inline-flex align-items-center gap-1.5" style={{ fontSize: '12px' }}>
                                      <span className="fw-bold">{art}:</span>
                                      <span className="text-primary font-monospace fw-bold">{m !== undefined && m !== '' ? `${m} m` : '—'}</span>
                                      <span className="text-muted" style={{ fontSize: '10.5px' }}>/ 100 pcs</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {selectedAccessory.boxes && selectedAccessory.boxes.length > 0 && (
                            <div>
                              <div className="text-muted small mb-1">Available Boxes:</div>
                              <div className="d-flex flex-wrap gap-1.5">
                                {selectedAccessory.boxes.map((b, i) => (
                                  <span key={i} className="badge bg-light text-dark border px-2 py-1 small">
                                    {b.reelsPerBox} reels &times; {b.metersPerReel}m ({(parseFloat(b.reelsPerBox)||0)*(parseFloat(b.metersPerReel)||0)}m)
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedAccessory.threadPattern === 'Embroidery' && (
                        <div className="alert alert-info py-2 px-3 rounded-2 small mb-0">
                          Process required — no additional measurements needed for Embroidery.
                        </div>
                      )}

                      {['Button Tacking', 'Handwork'].includes(selectedAccessory.threadPattern) && (
                        <div className="p-2.5 bg-light rounded-2 border">
                          <div className="small fw-semibold text-dark mb-1">{selectedAccessory.threadPattern} (Process Requirement)</div>
                          <div className="text-muted small">
                            Remarks: {selectedAccessory.processRemarks || 'Standard process specification'}
                          </div>
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
                      <div className="fw-bold text-dark mt-1">{selectedAccessory.maxBuffer !== undefined && selectedAccessory.maxBuffer !== null && selectedAccessory.maxBuffer !== '' ? `${selectedAccessory.maxBuffer}%` : '—'}</div>
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
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STANDARD ACCESSORIES GRID                                                 */}
      {/* ========================================================================= */}
      {selectedCategory !== 'Thread Sizes' && selectedCategory !== 'Thread Brand & Colors' && !isEditing && (
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
                    handleEditAccessory(acc, false);
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
                          handleEditAccessory(acc, true);
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
                        onChange={(e) => setThreadSizeForm({ ...threadSizeForm, brandName: autoCapitalizeWords(e.target.value) })}
                      />
                      <div className="form-text small text-muted">Auto-capitalised word by word</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Packaging Type *</label>
                      {isCustomPackaging ? (
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control bg-white fw-semibold"
                            placeholder="Type custom packaging..."
                            autoFocus
                            value={threadSizeForm.packagingTypeOther || (threadSizeForm.packagingType === 'Other' ? '' : threadSizeForm.packagingType)}
                            onChange={(e) => setThreadSizeForm({ ...threadSizeForm, packagingType: e.target.value, packagingTypeOther: e.target.value })}
                            style={{ height: '38px', borderRadius: '7px 0 0 7px' }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary d-flex align-items-center justify-content-center px-3"
                            onClick={() => {
                              setIsCustomPackaging(false);
                              setThreadSizeForm({ ...threadSizeForm, packagingType: 'Reel', packagingTypeOther: '' });
                            }}
                            title="Switch back to dropdown list"
                            style={{ borderRadius: '0 7px 7px 0', borderColor: '#cbd5e1' }}
                          >
                            <i className="ti ti-chevron-down"></i>
                          </button>
                        </div>
                      ) : (
                        <select
                          className="form-select"
                          value={['Reel', 'Cone', 'Box'].includes(threadSizeForm.packagingType) ? threadSizeForm.packagingType : 'Reel'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'Other') {
                              setIsCustomPackaging(true);
                              setThreadSizeForm({ ...threadSizeForm, packagingType: '', packagingTypeOther: '' });
                            } else {
                              setIsCustomPackaging(false);
                              setThreadSizeForm({ ...threadSizeForm, packagingType: val, packagingTypeOther: '' });
                            }
                          }}
                          style={{ height: '38px', borderRadius: '7px' }}
                        >
                          <option value="Reel">Reel</option>
                          <option value="Cone">Cone</option>
                          <option value="Box">Box</option>
                          <option value="Other">Other (Custom)...</option>
                        </select>
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
                  <button type="button" className="btn btn-theme-close rounded-3 px-4 fw-medium" onClick={() => setThreadSizeModal(false)}>
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
                        onChange={(e) => setThreadColorForm({ ...threadColorForm, brandName: autoCapitalizeWords(e.target.value) })}
                      />
                      <div className="form-text small text-muted">Auto-capitalised word by word</div>
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
                  <button type="button" className="btn btn-theme-close rounded-3 px-4 fw-medium" onClick={() => setThreadColorModal(false)}>
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
