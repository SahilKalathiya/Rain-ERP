const fs = require('fs');
const text = fs.readFileSync('scratch/module3_pdf_text.txt', 'utf8');

console.log('=== SECTION 12 & 13: ALL POINTS & EDGE CASES ===');
const s12 = text.indexOf('12. Validations, Edge Cases & Challenges');
if (s12 !== -1) {
  console.log(text.slice(s12, s12 + 4500));
}
