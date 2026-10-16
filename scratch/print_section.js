const fs = require('fs');
const text = fs.readFileSync('cleaned_pdf.txt', 'utf8');

const idx = text.indexOf('summary card detailing');
if (idx !== -1) {
  console.log(text.slice(Math.max(0, idx - 800), Math.min(text.length, idx + 1500)));
} else {
  console.log('not found');
}
