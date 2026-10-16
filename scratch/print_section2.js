const fs = require('fs');
const text = fs.readFileSync('cleaned_pdf.txt', 'utf8');

const idx = text.indexOf('arm ent and ov erall');
if (idx !== -1) {
  console.log(text.slice(Math.max(0, idx - 1200), Math.min(text.length, idx + 1800)));
}
