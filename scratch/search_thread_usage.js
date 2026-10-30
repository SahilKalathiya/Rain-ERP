const fs = require('fs');
const path = require('path');

function searchUsage(dir) {
  for (const f of fs.readdirSync(dir)) {
    if (f === 'node_modules' || f === '.git' || f === 'dist') continue;
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) searchUsage(full);
    else if (f.endsWith('.jsx') || f.endsWith('.js')) {
      const c = fs.readFileSync(full, 'utf8');
      if (c.includes('threadPerPiece') || c.includes('consumptionPer100Pcs') || c.includes('metersPerMeterStitching')) {
        console.log('Match in:', full);
      }
    }
  }
}

searchUsage('frontend/src');

