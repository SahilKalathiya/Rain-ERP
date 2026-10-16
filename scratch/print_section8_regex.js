const fs = require('fs');
const text = fs.readFileSync('cleaned_pdf.txt', 'utf8');

const match = /8[\s.]*2[\s]*Functional[\s]*Points/i.exec(text);
if (match) {
  console.log(text.slice(Math.max(0, match.index - 1200), match.index + 200));
} else {
  console.log('not found regex');
}
