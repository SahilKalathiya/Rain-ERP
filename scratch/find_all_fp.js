const fs = require('fs');
const text = fs.readFileSync('cleaned_pdf.txt', 'utf8');

let idx = text.indexOf('alP oi nt s');
while (idx !== -1) {
  console.log('=== MATCH AT ' + idx + ' ===');
  console.log(text.slice(Math.max(0, idx - 600), Math.min(text.length, idx + 400)));
  idx = text.indexOf('alP oi nt s', idx + 1);
}
