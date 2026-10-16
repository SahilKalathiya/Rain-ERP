const fs = require('fs');

const filePath = 'frontend/src/components/Masters/ArticleMasterView.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add WHATSAPP_EMOJI_CATEGORIES and WhatsAppEmojiPicker before autoCapitalizeWords
const targetBeforeCapitalize = `const autoCapitalizeWords = (text) => {`;
const categoriesAndComponent = `const WHATSAPP_EMOJI_CATEGORIES = [
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
              className={\`btn btn-sm py-1 px-2.5 rounded-2 \${
                activeTab === cat.id ? 'btn-primary text-white shadow-xs' : 'btn-light bg-transparent text-dark'
              }\`}
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

const autoCapitalizeWords = (text) => {`;

if (!content.includes('WHATSAPP_EMOJI_CATEGORIES')) {
  content = content.replace(targetBeforeCapitalize, categoriesAndComponent);
}

// 2. Add showEmojiPicker states in ArticleMasterView
const targetState = `const [isEditingExisting, setIsEditingExisting] = useState(false);`;
const newState = `const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showInlineEmojiPicker, setShowInlineEmojiPicker] = useState(false);
  const [showSectionEmojiPicker, setShowSectionEmojiPicker] = useState(false);`;

if (!content.includes('showEmojiPicker')) {
  content = content.replace(targetState, newState);
}

// 3. Update Main Modal custom emoji input with WhatsApp button
const oldMainInput = `<input
                          type="text"
                          className="form-control"
                          placeholder="Paste or type any emoji (e.g. 🥼, 🧢, 🦺, 👑, 🩱, 🕶️)"
                          value={formData.customIcon}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({
                              ...formData,
                              customIcon: val,
                              icon: val.trim() ? val.trim() : formData.icon
                            });
                          }}
                        />
                        {formData.customIcon && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setFormData({ ...formData, customIcon: '', icon: '👘' });
                            }}
                            title="Clear custom emoji"
                          >
                            Clear
                          </button>
                        )}
                      </div>`;

const newMainInput = `<input
                          type="text"
                          className="form-control"
                          placeholder="Paste or type any emoji..."
                          value={formData.customIcon}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({
                              ...formData,
                              customIcon: val,
                              icon: val.trim() ? val.trim() : formData.icon
                            });
                          }}
                        />
                        {/* WhatsApp Style Emoji Picker Button */}
                        <button
                          type="button"
                          className={\`btn \${showEmojiPicker ? 'btn-primary text-white shadow-xs' : 'btn-light border'} px-3 d-flex align-items-center justify-content-center\`}
                          onClick={() => setShowEmojiPicker(prev => !prev)}
                          title="Open WhatsApp Emoji Picker"
                          style={{ fontSize: '18px' }}
                        >
                          😊
                        </button>
                        {formData.customIcon && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setFormData({ ...formData, customIcon: '', icon: '👘' });
                            }}
                            title="Clear custom emoji"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* WhatsApp Floating Emoji Picker Dialog */}
                      {showEmojiPicker && (
                        <WhatsAppEmojiPicker
                          onSelect={(emoji) => {
                            setFormData({ ...formData, customIcon: emoji, icon: emoji });
                            setShowEmojiPicker(false);
                          }}
                          onClose={() => setShowEmojiPicker(false)}
                        />
                      )}`;

if (content.includes(oldMainInput)) {
  content = content.replace(oldMainInput, newMainInput);
} else {
  console.log('oldMainInput not matched directly, checking...');
}

// 4. Update Inline Modal custom emoji input with WhatsApp button
const oldInlineInput = `<input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Paste or type any emoji (e.g. 🥼, 🧢, 🦺)"
                        value={formData.customIcon}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            customIcon: val,
                            icon: val.trim() ? val.trim() : formData.icon
                          });
                        }}
                      />
                      {formData.customIcon && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary py-0 px-2"
                          onClick={() => setFormData({ ...formData, customIcon: '', icon: '👘' })}
                        >
                          Clear
                        </button>
                      )}
                    </div>`;

const newInlineInput = `<input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Paste or type any emoji..."
                        value={formData.customIcon}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            customIcon: val,
                            icon: val.trim() ? val.trim() : formData.icon
                          });
                        }}
                      />
                      <button
                        type="button"
                        className={\`btn btn-sm \${showInlineEmojiPicker ? 'btn-primary text-white shadow-xs' : 'btn-light border'} px-2.5 d-flex align-items-center justify-content-center\`}
                        onClick={() => setShowInlineEmojiPicker(prev => !prev)}
                        title="Open WhatsApp Emoji Picker"
                        style={{ fontSize: '16px' }}
                      >
                        😊
                      </button>
                      {formData.customIcon && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary py-0 px-2"
                          onClick={() => setFormData({ ...formData, customIcon: '', icon: '👘' })}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {showInlineEmojiPicker && (
                      <WhatsAppEmojiPicker
                        onSelect={(emoji) => {
                          setFormData({ ...formData, customIcon: emoji, icon: emoji });
                          setShowInlineEmojiPicker(false);
                        }}
                        onClose={() => setShowInlineEmojiPicker(false)}
                      />
                    )}`;

if (content.includes(oldInlineInput)) {
  content = content.replace(oldInlineInput, newInlineInput);
}

// 5. Update Section-wise edit with WhatsApp button
const oldSectionInput = `<input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="e.g. 🥼, 🧢, 🦺"
                              value={sectionData.icon || ''}
                              onChange={(e) => setSectionData({ ...sectionData, icon: e.target.value.trim() })}
                            />
                          </div>`;

const newSectionInput = `<input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="e.g. 🥼, 🧢, 🦺"
                              value={sectionData.icon || ''}
                              onChange={(e) => setSectionData({ ...sectionData, icon: e.target.value.trim() })}
                            />
                            <button
                              type="button"
                              className={\`btn btn-sm \${showSectionEmojiPicker ? 'btn-primary text-white shadow-xs' : 'btn-light border'} px-2.5 d-flex align-items-center justify-content-center\`}
                              onClick={() => setShowSectionEmojiPicker(prev => !prev)}
                              title="Open WhatsApp Emoji Picker"
                              style={{ fontSize: '16px' }}
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
                          )}`;

if (content.includes(oldSectionInput)) {
  content = content.replace(oldSectionInput, newSectionInput);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully added WhatsApp Emoji Picker to ArticleMasterView.jsx!');
