const fs = require('fs');
const text = fs.readFileSync('cleaned_pdf.txt', 'utf8');

const idx = 15275;
console.log(text.slice(idx - 1000, idx + 1000));
