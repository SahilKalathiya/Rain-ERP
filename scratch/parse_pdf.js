const fs = require('fs');
const text = fs.readFileSync('decompressed_pdf.txt', 'latin1');

// Match Tj and TJ
let extracted = '';
const tjMatches = text.match(/\(([^()]+)\)\s*Tj/g) || [];
for (const m of tjMatches) {
  const content = m.replace(/\)\s*Tj$/, '').replace(/^\(/, '');
  extracted += content + ' ';
}
// Also array TJ: [ (str) 12 (str2) ] TJ
const arrayMatches = text.match(/\[(.*?)\]\s*TJ/g) || [];
for (const am of arrayMatches) {
  const inner = am.match(/\(([^()]+)\)/g) || [];
  for (const im of inner) {
    extracted += im.slice(1, -1) + ' ';
  }
}

fs.writeFileSync('extracted_readable_pdf.txt', extracted);
console.log('Extracted readable chars:', extracted.length);

const keywords = ['Calculate Rate', 'Calculate', 'Rate', 'BOM', 'Consumption', 'Fabric Colour', 'Greige', 'Dyed', 'Width', 'Shrink'];
for (const kw of keywords) {
  let idx = 0;
  let count = 0;
  while ((idx = extracted.indexOf(kw, idx)) !== -1) {
    count++;
    console.log('--- Found ' + kw + ' at ' + idx + ' ---');
    console.log(extracted.slice(Math.max(0, idx - 100), Math.min(extracted.length, idx + 200)));
    idx += kw.length;
    if (count >= 3) break;
  }
  console.log('Keyword ' + kw + ' total count: ' + count);
}
