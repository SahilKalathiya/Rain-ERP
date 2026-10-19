import React, { useState, useMemo } from 'react';
import { initialArticles, getStoredData, setStoredData } from '../../data/salesOrderData';

const PREDEFINED_EMOJIS = [
  { emoji: '👘', label: 'Kurta / Long Tunic' },
  { emoji: '👖', label: 'Pajama / Trouser' },
  { emoji: '🧥', label: 'Jacket / Modi Cut' },
  { emoji: '🎀', label: 'Dupatta / Stole' },
  { emoji: '👚', label: 'Top / Short Tunic' },
  { emoji: '🩳', label: 'Bottom / Shorts' },
  { emoji: '👗', label: 'Dress / Anarkali' },
  { emoji: '👔', label: 'Shirt / Formal' },
  { emoji: '🧣', label: 'Scarf / Shawl' },
  { emoji: '🥻', label: 'Saree / Drape' },
  { emoji: '🧵', label: 'Crafted Garment' },
  { emoji: '🎽', label: 'Inner / Lining' }
];

const ARTICLE_TYPES = [
  { id: 'Kurta', label: 'Kurta', icon: '👘' },
  { id: 'Pant', label: 'Pant', icon: '👖' },
  { id: 'Dupatta', label: 'Dupatta', icon: '🧣' },
  { id: 'Jacket', label: 'Jacket', icon: '🧥' },
  { id: 'Top', label: 'Top', icon: '👚' },
  { id: 'Bottom', label: 'Bottom', icon: '👗' },
  { id: 'Set', label: 'Set', icon: '🎁' },
  { id: 'Other', label: 'Other', icon: '✨' }
];

const WHATSAPP_EMOJI_CATEGORIES = [
  {
    id: 'fashion',
    label: 'Fashion & Garments',
    icon: '👗',
    emojis: [
      '👘', '👖', '🧥', '🎀', '👚', '🩳', '👗', '👔', '🧣', '🥻',
      '🧵', '🎽', '🥼', '🧢', '🦺', '👑', '🩱', '🧦', '🧤', '🥾',
      '🕶️', '👜', '🎒', '👞', '👟', '👠', '👡', '👢', '🪡', '🧶',
      '👕', '🩲', '🥿', '🩰', '🎩', '🎓', '🪖', '💍', '💼', '🌂',
      '☂️', '👝', '👛', '🩴', '🪭', '🪮', '💎'
    ]
  },
  {
    id: 'smileys',
    label: 'Smileys & People',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '🥺', '😢', '😭', '😤', '😠',
      '🤯', '😳', '🥵', '🥶', '😱', '🤗', '🤔', '🤭', '🤫', '😴',
      '👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '🙏', '💪'
    ]
  },
  {
    id: 'crafts',
    label: 'Crafts & Production',
    icon: '🧵',
    emojis: [
      '🧵', '🪡', '🧶', '✂️', '📏', '📐', '🏷️', '📦', '🛍️', '🎨',
      '🖌️', '🖍️', '🧷', '🔒', '🔑', '🔨', '🔧', '🛠️', '🪚', '🧰',
      '⚙️', '🧲', '📎', '📌', '📍', '🖇️', '🖊️', '🖋️', '✒️', '📝'
    ]
  },
  {
    id: 'symbols',
    label: 'Colors & Badges',
    icon: '⭐',
    emojis: [
      '✨', '⭐', '🌟', '💫', '🔥', '💥', '⚡', '🌈', '☀️', '💎',
      '🏆', '🥇', '🥈', '🥉', '🎯', '💯', '✔️', '✅', '❌', '❤️',
      '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '🔴', '🟠',
      '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🟥', '🟧', '🟨'
    ]
  }
];

function WhatsAppEmojiPicker({ onSelect, onClose }) {
  const [activeTab, setActiveTab] = useState('fashion');
  const [search, setSearch] = useState('');

  const currentCategory = WHATSAPP_EMOJI_CATEGORIES.find(c => c.id === activeTab) || WHATSAPP_EMOJI_CATEGORIES[0];
  
  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return currentCategory.emojis;
    const all = WHATSAPP_EMOJI_CATEGORIES.flatMap(c => c.emojis);
    return all.filter(e => e.includes(search.trim()));
  }, [search, activeTab, currentCategory]);

  return (
    <div
      className="card shadow-lg border rounded-3 p-2.5 mt-2 position-relative bg-white"
      style={{ zIndex: 1070, width: '100%', maxWidth: '380px' }}
    >
      {/* Search & Close */}
      <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom">
        <div className="input-group input-group-sm">
          <span className="input-group-text bg-light border-end-0 text-muted">
            <i className="ti ti-search"></i>
          </span>
          <input
            type="text"
            className="form-control form-control-sm border-start-0 ps-0 shadow-none"
            placeholder="Search emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary border-start-0"
              onClick={() => setSearch('')}
            >
              &times;
            </button>
          )}
        </div>
        <button
          type="button"
          className="btn-close btn-sm flex-shrink-0"
          onClick={onClose}
          title="Close emoji picker"
        ></button>
      </div>

      {/* WhatsApp style Category Icons Bar */}
      {!search && (
        <div className="d-flex align-items-center justify-content-between mb-2 pb-1.5 border-bottom px-1">
          {WHATSAPP_EMOJI_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`btn btn-sm py-1 px-2.5 rounded-2 ${
                activeTab === cat.id ? 'btn-primary text-white shadow-xs' : 'btn-light bg-transparent text-dark'
              }`}
              style={{ fontSize: '16px' }}
              onClick={() => setActiveTab(cat.id)}
              title={cat.label}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Category Title */}
      <div className="small fw-semibold text-muted mb-1.5 px-1" style={{ fontSize: '11px' }}>
        {search ? 'Search Results' : currentCategory.label}
      </div>

      {/* Emoji Grid */}
      <div
        className="d-flex flex-wrap gap-1 p-1 overflow-y-auto"
        style={{ maxHeight: '180px' }}
      >
        {filteredEmojis.map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            className="btn btn-sm p-1.5 rounded-2 border-0 bg-transparent text-center transition-all"
            style={{ fontSize: '20px', lineHeight: 1, minWidth: '34px', minHeight: '34px' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={() => onSelect(emoji)}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
        {filteredEmojis.length === 0 && (
          <div className="text-muted small text-center w-100 py-3">
            No matching emoji found.
          </div>
        )}
      </div>

      <div className="mt-2 pt-1.5 border-top text-center text-muted d-flex align-items-center justify-content-center gap-1.5" style={{ fontSize: '11px' }}>
        <span>😊</span> <strong>WhatsApp Emoji Picker</strong> &bull; Click any emoji to select
      </div>
    </div>
  );
}

const autoCapitalizeWords = (text) => {
  if (!text) return '';
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Normalize and ensure unique sequential priority numbers: 1, 2, 3, 4, ...
export const normalizeArticleOrders = (list) => {
  if (!list || !list.length) return [];
  const sorted = [...list].sort((a, b) => {
    const oA = Number(a.sortOrder) || 9999;
    const oB = Number(b.sortOrder) || 9999;
    if (oA !== oB) return oA - oB;
    return (a.id || '').localeCompare(b.id || '');
  });
  return sorted.map((art, idx) => ({
    ...art,
    sortOrder: idx + 1
  }));
};

// Insert / reorder an article at target priority position without any duplicate numbers
export const reorderArticlesWithTarget = (allArticles, articleToPlace, requestedOrder) => {
  const remaining = allArticles.filter((a) => a.id !== articleToPlace.id);
  
  let targetOrder = parseInt(requestedOrder, 10);
  if (isNaN(targetOrder) || targetOrder < 1) {
    targetOrder = remaining.length + 1;
  }
  const insertIndex = Math.max(0, Math.min(targetOrder - 1, remaining.length));

  remaining.splice(insertIndex, 0, articleToPlace);

  return remaining.map((art, idx) => ({
    ...art,
    sortOrder: idx + 1
  }));
};

export default function ArticleMasterView({ isInline = false, onSaveInline, onCloseInline }) {
  const [articles, setArticles] = useState(() => {
    const list = getStoredData('erp_articles_v1', initialArticles);
    const normalized = normalizeArticleOrders(list);
    setStoredData('erp_articles_v1', normalized);
    return normalized;
  });

  const [viewMode, setViewMode] = useState('tiles'); // 'tiles' | 'table'
  const [showOthers, setShowOthers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Modal / Form state for Section 4.2 popup
  const [isModalOpen, setIsModalOpen] = useState(isInline);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showInlineEmojiPicker, setShowInlineEmojiPicker] = useState(false);
  const [showSectionEmojiPicker, setShowSectionEmojiPicker] = useState(false);

  // Section-wise edit state inside View Mode (Section 11.2 & 11.5)
  const [editingSection, setEditingSection] = useState(null); // 'basic' | 'display' | 'notes'
  const [sectionData, setSectionData] = useState({});

  // Column Filters for Table View (Section 11.3)
  const [colFilters, setColFilters] = useState({
    id: '',
    name: '',
    icon: '',
    sortOrder: '',
    description: '',
    status: ''
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Form State (Section 4.1)
  const [formData, setFormData] = useState({
    id: isInline ? `ART-${String(articles.length + 1).padStart(3, '0')}` : '',
    name: '',
    articleType: '',
    icon: '',
    customIcon: '',
    sortOrder: '',
    description: '',
    active: true,
    createdBy: 'Saksham Garg (Procurement Manager)',
    createdDate: new Date().toISOString(),
    lastModifiedBy: 'Saksham Garg',
    lastModifiedDate: new Date().toISOString(),
    activityLog: []
  });

  const handleOpenAddModal = () => {
    const nextSeq = `ART-${String(articles.length + 1).padStart(3, '0')}`;
    setFormData({
      id: nextSeq,
      name: '',
      articleType: '',
      icon: '',
      customIcon: '',
      sortOrder: '',
      description: '',
      active: true,
      createdBy: 'Saksham Garg (Procurement & Quality Manager)',
      createdDate: new Date().toISOString(),
      lastModifiedBy: 'Saksham Garg',
      lastModifiedDate: new Date().toISOString(),
      activityLog: [
        {
          timestamp: new Date().toLocaleString('en-IN'),
          user: 'Saksham Garg (Procurement & Quality Manager)',
          action: 'Created Article Record',
          details: `Draft initialized with ID ${nextSeq}`
        }
      ]
    });
    setIsEditingExisting(false);
    setIsModalOpen(true);
  };

  const handleEditArticle = (art) => {
    const isPredefined = PREDEFINED_EMOJIS.some((item) => item.emoji === art.icon);
    const matchedType = ARTICLE_TYPES.find(
      (t) => t.id === art.articleType || t.label.toLowerCase() === (art.name || '').toLowerCase() || t.icon === art.icon
    );
    setFormData({
      id: art.id,
      name: art.name || '',
      articleType: art.articleType || (matchedType ? matchedType.id : ''),
      icon: art.icon || '',
      customIcon: isPredefined ? '' : (art.icon || ''),
      sortOrder: art.sortOrder !== undefined && art.sortOrder !== null ? String(art.sortOrder) : '',
      description: art.description || '',
      active: art.active !== false,
      createdBy: art.createdBy || 'Saksham Garg',
      createdDate: art.createdDate || new Date().toISOString(),
      lastModifiedBy: art.lastModifiedBy || 'Saksham Garg',
      lastModifiedDate: new Date().toISOString(),
      activityLog: art.activityLog || []
    });
    setIsEditingExisting(true);
    setIsModalOpen(true);
  };

  const logActivity = (article, action, details) => {
    const newEntry = {
      timestamp: new Date().toLocaleString('en-IN'),
      user: 'Saksham Garg (Procurement & Quality Manager)',
      action,
      details
    };
    return [newEntry, ...(article.activityLog || [])];
  };

  // Save Article (Section 4.2: Immediately stored and available with no page refresh required)
  const saveArticle = (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      alert('Article Name is required');
      return;
    }

    const finalIcon =
      (formData.customIcon && formData.customIcon.trim()) ||
      (formData.icon && formData.icon.trim()) ||
      (formData.articleType ? ARTICLE_TYPES.find((t) => t.id === formData.articleType)?.icon : '') ||
      '👕';
    const capitalizedName = autoCapitalizeWords(formData.name.trim());
    const nextId = formData.id || `ART-${String(articles.length + 1).padStart(3, '0')}`;
    const exists = articles.some((a) => a.id === nextId);

    const articleData = {
      ...formData,
      id: nextId,
      name: capitalizedName,
      articleType: formData.articleType || 'Other',
      icon: finalIcon,
      description: (formData.description || '').trim(),
      active: formData.active !== false,
      lastModifiedBy: 'Saksham Garg (Procurement & Quality Manager)',
      lastModifiedDate: new Date().toISOString()
    };

    // Guarantee unique sequential priority numbers without duplicates
    const updated = reorderArticlesWithTarget(articles, articleData, formData.sortOrder);
    const savedArticle = updated.find((a) => a.id === nextId) || articleData;

    if (exists) {
      savedArticle.activityLog = logActivity(
        savedArticle,
        'Updated Article',
        `Updated name: ${savedArticle.name}, Priority Rank: #${savedArticle.sortOrder}, Icon: ${savedArticle.icon}`
      );
      showToast(`Article "${savedArticle.name}" updated (Rank #${savedArticle.sortOrder}).`);
    } else {
      savedArticle.activityLog = logActivity(
        savedArticle,
        'Created Article',
        `New article registered: ${savedArticle.name} (${savedArticle.id}) at Rank #${savedArticle.sortOrder}`
      );
      showToast(`Article "${savedArticle.name}" created at Rank #${savedArticle.sortOrder}.`);
    }

    setArticles(updated);
    setStoredData('erp_articles_v1', updated);

    // Broadcast event for live sync across ERP
    try {
      window.dispatchEvent(new Event('erp_articles_updated'));
    } catch (err) {}

    if (isInline && onSaveInline) {
      onSaveInline(savedArticle);
      return;
    }

    setIsModalOpen(false);
    setSelectedArticle(savedArticle);
  };

  // Section-wise Save in View Mode (Section 11.2 & 11.5)
  const saveSection = (secName) => {
    if (!selectedArticle) return;
    const updatedArt = {
      ...selectedArticle,
      ...sectionData,
      lastModifiedBy: 'Saksham Garg (Procurement & Quality Manager)',
      lastModifiedDate: new Date().toISOString()
    };

    if (sectionData.name) {
      updatedArt.name = autoCapitalizeWords(sectionData.name.trim());
    }

    let updatedList;
    let savedArticle;

    if (secName === 'display') {
      updatedList = reorderArticlesWithTarget(articles, updatedArt, sectionData.sortOrder);
      savedArticle = updatedList.find((a) => a.id === updatedArt.id) || updatedArt;
    } else {
      updatedList = articles.map((a) => (a.id === updatedArt.id ? updatedArt : a));
      savedArticle = updatedArt;
    }

    const changeSummary = Object.keys(sectionData)
      .map((k) => `${k}: ${selectedArticle[k]} ➔ ${savedArticle[k]}`)
      .join(', ');

    savedArticle.activityLog = logActivity(
      savedArticle,
      `Section Edit (${secName.toUpperCase()})`,
      changeSummary || `Updated ${secName} section`
    );

    setArticles(updatedList);
    setStoredData('erp_articles_v1', updatedList);
    setSelectedArticle(savedArticle);
    setEditingSection(null);
    showToast(`${secName.toUpperCase()} section saved successfully (Rank #${savedArticle.sortOrder || '—'}).`);

    try {
      window.dispatchEvent(new Event('erp_articles_updated'));
    } catch (err) {}
  };

  const toggleArticleActive = (art, e) => {
    e?.stopPropagation();
    const updated = {
      ...art,
      active: !art.active,
      lastModifiedBy: 'Saksham Garg (Procurement & Quality Manager)',
      lastModifiedDate: new Date().toISOString()
    };
    updated.activityLog = logActivity(
      updated,
      updated.active ? 'Activated Article' : 'Deactivated Article',
      `Article marked as ${updated.active ? 'Active' : 'Inactive'}`
    );
    const updatedList = articles.map((a) => (a.id === updated.id ? updated : a));
    setArticles(updatedList);
    setStoredData('erp_articles_v1', updatedList);
    if (selectedArticle?.id === art.id) {
      setSelectedArticle(updated);
    }
    showToast(`Article "${art.name}" marked as ${updated.active ? 'Active' : 'Inactive'}.`);
  };

  const deleteArticle = (artId, artName, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete article "${artName}"?`)) return;
    const remaining = articles.filter((a) => a.id !== artId);
    const normalized = normalizeArticleOrders(remaining);
    setArticles(normalized);
    setStoredData('erp_articles_v1', normalized);
    if (selectedArticle?.id === artId) {
      setSelectedArticle(null);
    }
    showToast(`Article "${artName}" deleted from master.`);
    try {
      window.dispatchEvent(new Event('erp_articles_updated'));
    } catch (err) {}
  };

  // Section 4.2: Frequent Articles vs "Others" Tile
  const primaryArticles = useMemo(() => articles.slice(0, 6), [articles]);
  const otherArticles = useMemo(() => articles.slice(6), [articles]);

  // Filtered Articles for Table View
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const q = searchQuery.toLowerCase().trim();
      const matchGlobal =
        !q ||
        (art.id || '').toLowerCase().includes(q) ||
        (art.name || '').toLowerCase().includes(q) ||
        (art.description || '').toLowerCase().includes(q);

      if (!matchGlobal) return false;

      return (
        (art.id || '').toLowerCase().includes(colFilters.id.toLowerCase()) &&
        (art.name || '').toLowerCase().includes(colFilters.name.toLowerCase()) &&
        (art.icon || '').toLowerCase().includes(colFilters.icon.toLowerCase()) &&
        (String(art.sortOrder || '')).includes(colFilters.sortOrder) &&
        (art.description || '').toLowerCase().includes(colFilters.description.toLowerCase()) &&
        (colFilters.status === '' || (colFilters.status === 'Active' ? art.active : !art.active))
      );
    });
  }, [articles, searchQuery, colFilters]);

  // Render Clean Article Modal Form matching user mockup
  const renderArticleModalForm = (isInlineMode = false) => {
    const isPickerOpen = isInlineMode ? showInlineEmojiPicker : showEmojiPicker;
    const togglePicker = () => {
      if (isInlineMode) setShowInlineEmojiPicker((prev) => !prev);
      else setShowEmojiPicker((prev) => !prev);
    };
    const closePicker = () => {
      if (isInlineMode) setShowInlineEmojiPicker(false);
      else setShowEmojiPicker(false);
    };
    const onCancel = isInlineMode ? onCloseInline : () => setIsModalOpen(false);

    return (
      <form onSubmit={saveArticle}>
        <div className="modal-body p-4">
          {/* Article Type * (8 Grid Cards) */}
          <div className="mb-3.5">
            <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: '13.5px' }}>
              Article Type <span className="text-danger">*</span>
            </label>
            <div className="row g-2">
              {ARTICLE_TYPES.map((type) => {
                const isSelected = Boolean(formData.articleType) && formData.articleType === type.id;
                return (
                  <div key={type.id} className="col-3">
                    <button
                      type="button"
                      className="btn w-100 py-2.5 px-1 d-flex flex-column align-items-center justify-content-center text-center transition-all"
                      style={{
                        borderRadius: '12px',
                        border: isSelected ? '1.5px solid #6366f1' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#f5f7ff' : '#ffffff',
                        boxShadow: isSelected ? '0 0 0 2px rgba(99, 102, 241, 0.15)' : 'none',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setFormData({
                          ...formData,
                          articleType: type.id,
                          icon: type.icon,
                          customIcon: type.icon
                        });
                      }}
                    >
                      <span style={{ fontSize: '26px', lineHeight: 1.2 }}>{type.icon}</span>
                      <span
                        className="mt-1 text-truncate w-100"
                        style={{
                          fontSize: '12.5px',
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? '#4f46e5' : '#334155'
                        }}
                      >
                        {type.label}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row: Article Name * & Icon (Emoji) */}
          <div className="row g-3 mb-3">
            <div className="col-7">
              <label className="form-label fw-semibold text-dark mb-1.5" style={{ fontSize: '13.5px' }}>
                Article Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Classic Kurta, Palazzo Pa"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: autoCapitalizeWords(e.target.value) })}
                style={{ height: '44px', borderRadius: '8px' }}
              />
            </div>
            <div className="col-5">
              <label className="form-label fw-semibold text-dark mb-1.5" style={{ fontSize: '13.5px' }}>
                Icon (Emoji)
              </label>
              <div className="d-flex align-items-center gap-2 position-relative">
                <input
                  type="text"
                  className="form-control text-center shadow-none flex-grow-1"
                  style={{
                    height: '44px',
                    fontSize: '22px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff'
                  }}
                  placeholder="e.g., 👘"
                  value={formData.icon || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      icon: val,
                      customIcon: val
                    });
                  }}
                />
                <button
                  type="button"
                  className={`btn ${isPickerOpen ? 'btn-primary text-white shadow-xs' : 'btn-light border'} d-flex align-items-center justify-content-center flex-shrink-0`}
                  style={{
                    width: '44px',
                    height: '44px',
                    fontSize: '20px',
                    borderRadius: '8px',
                    borderColor: '#cbd5e1'
                  }}
                  onClick={togglePicker}
                  title="WhatsApp Emoji Picker"
                >
                  😊
                </button>
              </div>

              {isPickerOpen && (
                <div className="position-absolute" style={{ zIndex: 1070, right: '0px', marginTop: '6px' }}>
                  <WhatsAppEmojiPicker
                    onSelect={(emoji) => {
                      setFormData({ ...formData, customIcon: emoji, icon: emoji });
                      closePicker();
                    }}
                    onClose={closePicker}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sort Order */}
          <div className="mb-3">
            <label className="form-label fw-semibold text-dark mb-1.5" style={{ fontSize: '13.5px' }}>
              Sort Order
            </label>
            <input
              type="number"
              min="0"
              className="form-control"
              placeholder="e.g., 1"
              value={formData.sortOrder ?? ''}
              onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
              style={{ height: '42px', borderRadius: '8px' }}
            />
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="form-label fw-semibold text-dark mb-1.5" style={{ fontSize: '13.5px' }}>
              Description
            </label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Additional details about this article..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ borderRadius: '8px' }}
            />
          </div>

          {/* Active Checkbox */}
          <div className="form-check mt-3 mb-2">
            <input
              className="form-check-input"
              type="checkbox"
              id={isInlineMode ? 'inlineArticleActive' : 'modalArticleActive'}
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            />
            <label className="form-check-label fw-semibold text-dark small" htmlFor={isInlineMode ? 'inlineArticleActive' : 'modalArticleActive'}>
              Active
            </label>
          </div>
        </div>

        <div className="modal-footer border-top py-3 px-4 d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary rounded-3 px-3.5" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold">
            <i className="ti ti-check me-1"></i> {isEditingExisting ? 'Update Article' : 'Save Article'}
          </button>
        </div>
      </form>
    );
  };

  // Inline Modal Mode (Section 2.2 / 4.2)
  if (isInline) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1060 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow-lg border-0 rounded-4 bg-white">
            <div className="modal-header border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
              <h5 className="modal-title fw-bold text-dark mb-0">Add New Article</h5>
              <button type="button" className="btn-close" onClick={onCloseInline}></button>
            </div>
            {renderArticleModalForm(true)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 2000 }}>
          <div className="alert alert-success shadow-lg border-0 d-flex align-items-center gap-2 mb-0 py-2 px-3 rounded-3">
            <i className="ti ti-check fs-5"></i>
            <span className="fw-semibold small">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm flex-shrink-0"
            style={{ width: '42px', height: '42px', backgroundColor: '#6366f1' }}
          >
            <i className="ti ti-shirt fs-4"></i>
          </div>
          <div>
            <h4 className="fw-bold text-dark mb-0 fs-18">Article Master</h4>
            <p className="text-muted small mb-0">
              Route 1 (Section 4) &bull; Field-Staff Facing Cards with Emoji/Icons & Display Order Priority
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* View Mode Toggle: Field-Staff Tiles vs Detailed Table View */}
          <div className="btn-group btn-group-sm rounded-3 shadow-2xs border bg-white p-0.5">
            <button
              type="button"
              className={`btn btn-sm rounded-2 fw-semibold ${
                viewMode === 'tiles' ? 'btn-primary text-white shadow-sm' : 'btn-white text-secondary'
              }`}
              onClick={() => {
                setViewMode('tiles');
                setSelectedArticle(null);
              }}
            >
              <i className="ti ti-layout-grid me-1"></i> Field-Staff Tiles
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-2 fw-semibold ${
                viewMode === 'table' ? 'btn-primary text-white shadow-sm' : 'btn-white text-secondary'
              }`}
              onClick={() => {
                setViewMode('table');
                setSelectedArticle(null);
              }}
            >
              <i className="ti ti-list me-1"></i> Table & Audit
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm rounded-3 px-3 py-2 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm"
            onClick={handleOpenAddModal}
          >
            <i className="ti ti-plus"></i>
            <span>Add New Article</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CASE 1: SECTION-WISE VIEW MODE FOR SELECTED ARTICLE (11.2 & 11.5)         */}
      {/* ========================================================================= */}
      {selectedArticle ? (
        <div className="d-flex flex-column gap-4 mb-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-4 d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: '56px', height: '56px', backgroundColor: '#eef2ff', fontSize: '32px' }}
                >
                  {selectedArticle.icon}
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary-subtle text-primary font-monospace px-2.5 py-1 rounded-2">
                      {selectedArticle.id}
                    </span>
                    <h4 className="fw-bold text-dark mb-0">{selectedArticle.name}</h4>
                    <span className={`badge ${selectedArticle.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2.5 py-1 rounded-pill`}>
                      {selectedArticle.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-muted small mt-1">
                    Sort Order Priority: <strong>#{selectedArticle.sortOrder || '—'}</strong> &bull; {selectedArticle.description || 'No description entered'}
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-3 px-3"
                  onClick={() => setSelectedArticle(null)}
                >
                  <i className="ti ti-arrow-left me-1"></i> Close View
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm rounded-3 px-3 fw-semibold"
                  onClick={() => handleEditArticle(selectedArticle)}
                >
                  <i className="ti ti-edit me-1"></i> Edit Full Article
                </button>
              </div>
            </div>
          </div>

          {/* Section 11.2 & 11.5: Split into Logical Sections with Independent Edit Buttons */}
          <div className="row g-4">
            {/* Section 1: Article Identity & Icon */}
            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-dark fs-14">
                    <i className="ti ti-shirt text-primary me-1.5"></i> Section 1: Article Identity & Icon
                  </span>
                  {editingSection === 'basic' ? (
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
                        onClick={() => saveSection('basic')}
                      >
                        Save Section
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-xs btn-light text-primary rounded-2 px-2.5 py-1 small fw-semibold border"
                      onClick={() => {
                        setEditingSection('basic');
                        setSectionData({ ...selectedArticle });
                      }}
                    >
                      <i className="ti ti-edit me-1"></i> Edit Section
                    </button>
                  )}
                </div>
                <div className="card-body p-4">
                  {editingSection === 'basic' ? (
                    <div className="d-flex flex-column gap-3">
                      <div>
                        <label className="form-label small fw-semibold text-muted">Article Name *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={sectionData.name || ''}
                          onChange={(e) => setSectionData({ ...sectionData, name: autoCapitalizeWords(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="form-label fw-semibold text-primary mb-1.5" style={{ fontSize: '14px' }}>
                          Icon (Emoji)
                        </label>
                        <div className="d-flex align-items-center gap-2">
                          <div className="position-relative flex-grow-1">
                            <input
                              type="text"
                              className="form-control text-center fw-bold shadow-none"
                              style={{
                                height: '50px',
                                fontSize: '26px',
                                borderRadius: '12px',
                                border: '1.5px solid #2563eb',
                                backgroundColor: '#ffffff'
                              }}
                              placeholder="👘"
                              value={sectionData.icon || '👘'}
                              onChange={(e) => setSectionData({ ...sectionData, icon: e.target.value.trim() })}
                            />
                          </div>
                          <button
                            type="button"
                            className={`btn ${showSectionEmojiPicker ? 'btn-primary text-white shadow-xs' : 'btn-light border'} rounded-3 d-flex align-items-center justify-content-center flex-shrink-0`}
                            style={{
                              width: '50px',
                              height: '50px',
                              fontSize: '22px',
                              borderRadius: '12px',
                              border: '1.5px solid #cbd5e1'
                            }}
                            onClick={() => setShowSectionEmojiPicker(prev => !prev)}
                            title="Choose Emoji"
                          >
                            😊
                          </button>
                        </div>

                        {showSectionEmojiPicker && (
                          <WhatsAppEmojiPicker
                            onSelect={(emoji) => {
                              setSectionData({ ...sectionData, icon: emoji });
                              setShowSectionEmojiPicker(false);
                            }}
                            onClose={() => setShowSectionEmojiPicker(false)}
                          />
                        )}
                        <div className="d-flex align-items-center gap-1.5 mt-2 flex-wrap">
                          <span className="small text-muted fw-semibold" style={{ fontSize: '11px' }}>Quick:</span>
                          {['👘', '👕', '👔', '👗', '👖', '🥼', '🧢', '🦺', '👑', '🕶️', '👜'].map((em) => (
                            <button
                              key={em}
                              type="button"
                              className={`btn btn-xs py-0.5 px-2 border rounded-2 ${
                                sectionData.icon === em ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-dark'
                              }`}
                              style={{ fontSize: '14px' }}
                              onClick={() => setSectionData({ ...sectionData, icon: em })}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      <div>
                        <div className="text-muted small">Article ID</div>
                        <div className="fw-bold font-monospace text-primary">{selectedArticle.id}</div>
                      </div>
                      <div>
                        <div className="text-muted small">Article Name</div>
                        <div className="fw-bold text-dark fs-16">{selectedArticle.name}</div>
                      </div>
                      <div>
                        <div className="text-muted small">Assigned Emoji / Icon</div>
                        <div className="fs-2">{selectedArticle.icon}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Display Priority & Ordering */}
            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-dark fs-14">
                    <i className="ti ti-arrows-sort text-primary me-1.5"></i> Section 2: Display Priority & Notes
                  </span>
                  {editingSection === 'display' ? (
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
                        onClick={() => saveSection('display')}
                      >
                        Save Section
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-xs btn-light text-primary rounded-2 px-2.5 py-1 small fw-semibold border"
                      onClick={() => {
                        setEditingSection('display');
                        setSectionData({ ...selectedArticle });
                      }}
                    >
                      <i className="ti ti-edit me-1"></i> Edit Section
                    </button>
                  )}
                </div>
                <div className="card-body p-4">
                  {editingSection === 'display' ? (
                    <div className="d-flex flex-column gap-3">
                      <div>
                        <label className="form-label small fw-semibold text-muted">Sort Order Priority # (Unique)</label>
                        <input
                          type="number"
                          min="1"
                          className="form-control form-control-sm"
                          placeholder="e.g. 1"
                          value={sectionData.sortOrder || ''}
                          onChange={(e) => setSectionData({ ...sectionData, sortOrder: e.target.value })}
                        />
                        <div className="form-text small text-muted">Unique priority (1 to {articles.length}). Other articles shift automatically to prevent duplicate numbers.</div>
                      </div>
                      <div>
                        <label className="form-label small fw-semibold text-muted">Description / Specifications</label>
                        <textarea
                          className="form-control form-control-sm"
                          rows={2}
                          value={sectionData.description || ''}
                          onChange={(e) => setSectionData({ ...sectionData, description: e.target.value })}
                        />
                      </div>
                      <div className="form-check form-switch mt-1">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="artSecActive"
                          checked={sectionData.active}
                          onChange={(e) => setSectionData({ ...sectionData, active: e.target.checked })}
                        />
                        <label className="form-check-label small fw-semibold" htmlFor="artSecActive">
                          Active Status
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      <div>
                        <div className="text-muted small">Sort Order (Priority in Order Detail Form)</div>
                        <div className="fw-bold text-dark fs-15">
                          <span className="badge bg-purple-subtle text-purple border px-2.5 py-1">
                            Rank #{selectedArticle.sortOrder || '—'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-muted small">Description</div>
                        <div className="p-2.5 bg-light rounded-3 text-secondary small border mt-1">
                          {selectedArticle.description || 'No description entered.'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted small">Status</div>
                        <span className={`badge ${selectedArticle.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2.5 py-1 rounded-pill mt-1`}>
                          {selectedArticle.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* CASE 2: FIELD-STAFF CLICKABLE CARDS / TILES (SECTION 4.2)                 */}
      {/* ========================================================================= */}
      {viewMode === 'tiles' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold text-dark mb-0">Active Article Types (Field-Staff Tiles)</h5>
              <p className="text-muted small mb-0">
                Section 4.2 &bull; Small clickable cards showing emoji/icon and name for fast identification
              </p>
            </div>
          </div>

          <div className="row g-3">
            {/* Primary Frequently Used Articles */}
            {primaryArticles.map((art) => (
              <div key={art.id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                <div
                  className="card h-100 border text-center p-3 rounded-4 shadow-xs transition position-relative hover-elevate"
                  style={{
                    cursor: 'pointer',
                    borderColor: '#e2e8f0',
                    backgroundColor: art.active ? '#ffffff' : '#f8fafc',
                    opacity: art.active ? 1 : 0.65
                  }}
                  onClick={() => setSelectedArticle(art)}
                >
                  {/* Priority Badge */}
                  <span
                    className="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-primary"
                    style={{ left: '16px', top: '14px', fontSize: '10px' }}
                  >
                    #{art.sortOrder}
                  </span>

                  <div className="fs-1 mb-1 mt-1">{art.icon}</div>
                  <div className="fw-bold text-dark fs-14">{art.name}</div>
                  <div className="text-muted small font-monospace" style={{ fontSize: '11px' }}>
                    {art.id}
                  </div>

                  {/* Actions Bar */}
                  <div
                    className="mt-2 pt-2 border-top d-flex justify-content-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="btn btn-xs btn-light text-primary p-1 rounded-2"
                      title="Edit"
                      onClick={() => handleEditArticle(art)}
                    >
                      <i className="ti ti-edit"></i>
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs btn-light ${art.active ? 'text-success' : 'text-danger'} p-1 rounded-2`}
                      title={art.active ? 'Active' : 'Inactive'}
                      onClick={(e) => toggleArticleActive(art, e)}
                    >
                      <i className={`ti ti-${art.active ? 'check' : 'power'}`}></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-light text-danger p-1 rounded-2"
                      title="Delete"
                      onClick={(e) => deleteArticle(art.id, art.name, e)}
                    >
                      <i className="ti ti-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Section 4.2: Remaining Articles Hidden Behind "Others" Tile */}
            {otherArticles.length > 0 && !showOthers && (
              <div className="col-6 col-sm-4 col-md-3 col-lg-2">
                <div
                  className="card h-100 border border-dashed text-center p-3 rounded-4 bg-light d-flex flex-column justify-content-center align-items-center shadow-xs transition"
                  style={{ cursor: 'pointer', minHeight: '130px', borderColor: '#cbd5e1' }}
                  onClick={() => setShowOthers(true)}
                >
                  <div className="fs-2 text-secondary mb-1">+{otherArticles.length}</div>
                  <div className="fw-bold text-secondary fs-13">Others</div>
                  <div className="text-muted small" style={{ fontSize: '11px' }}>
                    Click to view
                  </div>
                </div>
              </div>
            )}

            {/* Revealed Other Articles */}
            {showOthers &&
              otherArticles.map((art) => (
                <div key={art.id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                  <div
                    className="card h-100 border text-center p-3 rounded-4 shadow-xs transition position-relative hover-elevate"
                    style={{
                      cursor: 'pointer',
                      borderColor: '#e2e8f0',
                      backgroundColor: art.active ? '#ffffff' : '#f8fafc',
                      opacity: art.active ? 1 : 0.65
                    }}
                    onClick={() => setSelectedArticle(art)}
                  >
                    <span
                      className="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-secondary"
                      style={{ left: '16px', top: '14px', fontSize: '10px' }}
                    >
                      #{art.sortOrder}
                    </span>
                    <div className="fs-1 mb-1 mt-1">{art.icon}</div>
                    <div className="fw-bold text-dark fs-14">{art.name}</div>
                    <div className="text-muted small font-monospace" style={{ fontSize: '11px' }}>
                      {art.id}
                    </div>

                    <div
                      className="mt-2 pt-2 border-top d-flex justify-content-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="btn btn-xs btn-light text-primary p-1 rounded-2"
                        title="Edit"
                        onClick={() => handleEditArticle(art)}
                      >
                        <i className="ti ti-edit"></i>
                      </button>
                      <button
                        type="button"
                        className={`btn btn-xs btn-light ${art.active ? 'text-success' : 'text-danger'} p-1 rounded-2`}
                        title={art.active ? 'Active' : 'Inactive'}
                        onClick={(e) => toggleArticleActive(art, e)}
                      >
                        <i className={`ti ti-${art.active ? 'check' : 'power'}`}></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-light text-danger p-1 rounded-2"
                        title="Delete"
                        onClick={(e) => deleteArticle(art.id, art.name, e)}
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {/* Section 4.2: Dedicated "+ Add New Article" card sits alongside the article tiles */}
            <div className="col-6 col-sm-4 col-md-3 col-lg-2">
              <div
                className="card h-100 border border-primary border-dashed text-center p-3 rounded-4 bg-primary-subtle d-flex flex-column justify-content-center align-items-center shadow-xs transition hover-elevate"
                style={{ cursor: 'pointer', minHeight: '130px' }}
                onClick={handleOpenAddModal}
              >
                <i className="ti ti-plus fs-2 text-primary mb-1"></i>
                <div className="fw-bold text-primary fs-13">Add New Article</div>
                <div className="text-muted small" style={{ fontSize: '11px' }}>
                  Popup creator
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE 3: TABLE & AUDIT TRAIL VIEW (SECTION 11.3 & 11.4)                     */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-4">
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="position-relative" style={{ minWidth: '320px', maxWidth: '420px' }}>
              <i
                className="ti ti-search text-muted"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '14px',
                  pointerEvents: 'none',
                  zIndex: 2
                }}
              ></i>
              <input
                type="text"
                className="form-control form-control-sm rounded-3 border search-input-integrated"
                placeholder="Global search articles (11.1)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '42px' }}
              />
            </div>
            <div className="text-muted small">
              Showing <strong>{filteredArticles.length}</strong> of <strong>{articles.length}</strong> articles
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '110px' }}>ARTICLE ID</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '80px' }}>ICON</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '180px' }}>ARTICLE NAME</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold text-center" style={{ minWidth: '120px' }}>SORT ORDER</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold" style={{ minWidth: '220px' }}>DESCRIPTION</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold text-center" style={{ minWidth: '100px' }}>STATUS</th>
                  <th className="py-2.5 px-3 text-muted small fw-bold text-end" style={{ minWidth: '110px' }}>ACTIONS</th>
                </tr>

                {/* Section 11.3: Column-wise Filters */}
                <tr className="bg-white border-bottom">
                  <td className="p-1.5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="ID..."
                      value={colFilters.id}
                      onChange={(e) => setColFilters({ ...colFilters, id: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Icon..."
                      value={colFilters.icon}
                      onChange={(e) => setColFilters({ ...colFilters, icon: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Filter name..."
                      value={colFilters.name}
                      onChange={(e) => setColFilters({ ...colFilters, name: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <input
                      type="text"
                      className="form-control form-control-sm text-center"
                      placeholder="Order..."
                      value={colFilters.sortOrder}
                      onChange={(e) => setColFilters({ ...colFilters, sortOrder: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Filter notes..."
                      value={colFilters.description}
                      onChange={(e) => setColFilters({ ...colFilters, description: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <select
                      className="form-select form-select-sm"
                      value={colFilters.status}
                      onChange={(e) => setColFilters({ ...colFilters, status: e.target.value })}
                    >
                      <option value="">All</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="p-1.5 text-end">
                    {(colFilters.id || colFilters.name || colFilters.icon || colFilters.sortOrder || colFilters.description || colFilters.status) && (
                      <button
                        type="button"
                        className="btn btn-xs btn-link text-muted p-0 text-decoration-none"
                        onClick={() =>
                          setColFilters({
                            id: '',
                            name: '',
                            icon: '',
                            sortOrder: '',
                            description: '',
                            status: ''
                          })
                        }
                      >
                        Clear
                      </button>
                    )}
                  </td>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((art) => (
                  <tr
                    key={art.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedArticle(art)}
                  >
                    <td className="px-3 fw-bold text-primary font-monospace fs-13">{art.id}</td>
                    <td className="px-3 fs-4">{art.icon}</td>
                    <td className="px-3 fw-bold text-dark">{art.name}</td>
                    <td className="px-3 text-center">
                      <span className="badge bg-light text-dark border px-2 py-1 font-monospace">
                        #{art.sortOrder}
                      </span>
                    </td>
                    <td className="px-3 text-secondary small">{art.description || '—'}</td>
                    <td className="px-3 text-center">
                      <span className={`badge ${art.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2.5 py-1 rounded-pill`}>
                        {art.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-light text-primary p-1 rounded-2"
                          title="View Details"
                          onClick={() => setSelectedArticle(art)}
                        >
                          <i className="ti ti-eye fs-5"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light text-secondary p-1 rounded-2"
                          title="Edit Article"
                          onClick={() => handleEditArticle(art)}
                        >
                          <i className="ti ti-edit fs-5"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light text-danger p-1 rounded-2"
                          title="Delete"
                          onClick={(e) => deleteArticle(art.id, art.name, e)}
                        >
                          <i className="ti ti-trash fs-5"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4.2 POPUP MODAL: CREATE / EDIT ARTICLE                            */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4 bg-white">
              <div className="modal-header border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-dark mb-0">
                  {isEditingExisting ? `Edit Article: ${formData.name}` : 'Add New Article'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
              </div>
              {renderArticleModalForm(false)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
