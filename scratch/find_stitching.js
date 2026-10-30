const fs = require('fs');
const content = fs.readFileSync('frontend/src/components/Masters/AccessoriesMasterView.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes("category === 'Thread'") || l.includes('metersPerMeterStitching') || l.includes('threadPerPiece') || l.includes("threadPattern === 'Stitching'")) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 110));
  }
});

