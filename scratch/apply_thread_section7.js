const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'Masters', 'AccessoriesMasterView.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Ensure initialArticles is imported
if (!content.includes('initialArticles')) {
  content = content.replace(
    "  setStoredThreadBrandColors\n} from '../../data/salesOrderData';",
    "  setStoredThreadBrandColors,\n  initialArticles\n} from '../../data/salesOrderData';"
  );
  if (!content.includes('initialArticles')) {
    content = content.replace(
      "  setStoredThreadBrandColors\r\n} from '../../data/salesOrderData';",
      "  setStoredThreadBrandColors,\r\n  initialArticles\r\n} from '../../data/salesOrderData';"
    );
  }
}

// 2. Add THREAD constants if not present
if (!content.includes('THREAD_SIZE_OPTIONS')) {
  const insertMarker = 'const THREAD_PATTERNS = [';
  const threadConstants = `const THREAD_SIZE_OPTIONS = ['40/2', '30/2', '20/2', '20/3', '120s', 'Tex 40', 'Ticket 120'];
const THREAD_UNIT_OPTIONS = ['Cone', 'Reel', 'Meter', 'Box', 'Kilogram', 'Dozen', 'Gross'];

`;
  content = content.replace(insertMarker, threadConstants + insertMarker);
}

// 3. Update getEmptyAccessoryForm for Thread fields
const oldThreadFormBlock = `    // Thread
    sizeValue: '',
    sizeUnit: 'mm',
    threadPattern: 'Stitching',
    threadPerStitch: 15,
    threadPerPiece: 60,
    boxes: [{ reelsPerBox: '', metersPerReel: '' }],
    coneSizes: [],
    placements: [],
    processRemarks: ''`;

const newThreadFormBlock = `    // Thread (Sections 7.1 - 7.5)
    threadSize: '40/2',
    threadSizeCustom: '',
    threadPattern: 'Stitching',
    threadPerStitch: 15,
    threadPerPiece: 60,
    boxes: [{ reelsPerBox: '15', metersPerReel: '400' }],
    coneSizes: ['5000 m', '10000 m'],
    placements: ['Sleeves', 'Front', 'Back', 'Collar', 'Hemline'],
    articlePlacements: [
      {
        article: 'Kurta',
        placements: [
          { placement: 'Sleeves', threadRequired: '4.5' },
          { placement: 'Front Placket', threadRequired: '6.0' }
        ]
      }
    ],
    globalThreadMetric: 15,
    stitchingArticles: ['Kurta', 'Pant'],
    consumptionPer100Pcs: { 'Kurta': '6000', 'Pant': '4500' },
    processRemarks: ''`;

content = content.replace(oldThreadFormBlock, newThreadFormBlock);

// 4. In AccessoriesMasterView component body, load articlesList
if (!content.includes('const [articlesList, setArticlesList]')) {
  const marker = 'const [threadColors, setThreadColors] = useState(() => getStoredThreadBrandColors());';
  const articlesCode = `\n  const [articlesList] = useState(() => {
    try {
      const stored = getStoredData('erp_articles_master', null);
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch (e) {}
    return initialArticles || [];
  });`;
  content = content.replace(marker, marker + articlesCode);
}

// 5. In handleEditAccessory, ensure all Thread fields are extracted
const editMarker = "threadPattern: acc.threadPattern || 'Kantha',";
const newEditFields = `threadPattern: acc.threadPattern || 'Kantha',
      threadSize: acc.threadSize || acc.size || '40/2',
      threadSizeCustom: acc.threadSizeCustom || '',
      globalThreadMetric: acc.globalThreadMetric !== undefined ? acc.globalThreadMetric : 15,
      articlePlacements: (acc.articlePlacements && acc.articlePlacements.length > 0)
        ? acc.articlePlacements
        : [{ article: 'Kurta', placements: [{ placement: 'Sleeves', threadRequired: '4.5' }] }],
      stitchingArticles: acc.stitchingArticles || (acc.consumptionPer100Pcs ? Object.keys(acc.consumptionPer100Pcs) : ['Kurta']),
      consumptionPer100Pcs: acc.consumptionPer100Pcs || { 'Kurta': '6000' },`;
content = content.replace(editMarker, newEditFields);

// 6. In handleSave, make sure thread fields are saved
const saveMarker = "threadSize: formData.sizeValue ? `${formData.sizeValue} ${formData.sizeUnit || 'mm'}` : (formData.threadSize || ''),";
const newSaveFields = `threadSize: formData.threadSize === 'Other' && formData.threadSizeCustom ? formData.threadSizeCustom : (formData.threadSize || '40/2'),
      threadSizeCustom: formData.threadSizeCustom || '',
      unit: formData.unit === 'Other' && formData.unitCustom ? formData.unitCustom : (formData.unit || 'Cone'),
      unitCustom: formData.unitCustom || '',
      piecesPerUnit: parseInt(formData.piecesPerUnit, 10) || 1,
      threadPattern: formData.threadPattern || 'Stitching',
      threadPerStitch: parseFloat(formData.threadPerStitch) || 15,
      threadPerPiece: parseFloat(formData.threadPerPiece) || 60,
      globalThreadMetric: parseFloat(formData.globalThreadMetric) || 15,
      articlePlacements: formData.articlePlacements || [],
      stitchingArticles: formData.stitchingArticles || [],
      consumptionPer100Pcs: formData.consumptionPer100Pcs || {},`;
content = content.replace(saveMarker, newSaveFields);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Part 1 updated: imports, constants, state & save handlers.');
