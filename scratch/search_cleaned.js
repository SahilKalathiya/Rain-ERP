const fs = require('fs');
const text = fs.readFileSync('extracted_readable_pdf.txt', 'utf8');

// Collapse single letter spaces: "s i m p l y" -> "simply"
function normalize(str) {
  // replace sequences of " a b c " with "abc"
  return str.replace(/\b([A-Za-z0-9])\s+(?=[A-Za-z0-9]\b)/g, '$1')
            .replace(/\s+/g, ' ');
}

const cleaned = normalize(text);
fs.writeFileSync('cleaned_pdf.txt', cleaned);
console.log('Cleaned text length:', cleaned.length);

// Search for calculate or rate or fabric or section 6
const keywords = ['calculate', 'rate', 'cancel', 'save', 'width', 'shrink', 'greige', 'dyed', 'fabric', 'section 6', 'section'];
for (const kw of keywords) {
  let idx = 0;
  let count = 0;
  const lower = cleaned.toLowerCase();
  while ((idx = lower.indexOf(kw, idx)) !== -1) {
    count++;
    console.log(`=== Found "${kw}" ===`);
    console.log(cleaned.slice(Math.max(0, idx - 100), Math.min(cleaned.length, idx + 250)));
    console.log('\n');
    idx += kw.length;
    if (count >= 4) break;
  }
}
