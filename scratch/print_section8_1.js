const fs = require('fs');
const text = fs.readFileSync('cleaned_pdf.txt', 'utf8');

const idx = text.indexOf('8.2 Functional Points');
if (idx !== -1) {
  console.log(text.slice(Math.max(0, idx - 1500), idx));
}
