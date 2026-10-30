const fs = require('fs');

const content = fs.readFileSync('frontend/src/components/Procurement/GRNDetailView.jsx', 'utf8');

// Find all occurrences of grn.id. or g.id.
const regex = /grn\.id\.\w+/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log('Match:', match[0], 'at index', match.index);
}

// Find all .replace
const replaceRegex = /(\w+)\.replace\(/g;
while ((match = replaceRegex.exec(content)) !== null) {
  console.log('Replace on:', match[1]);
}

