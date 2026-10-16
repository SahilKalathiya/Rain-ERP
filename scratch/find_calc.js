const fs = require('fs');
const text = fs.readFileSync('cleaned_pdf.txt', 'utf8');

const regex = /(?:calculate|rate|cost|saving|cancel|save|consumption|fabric)/gi;
let match;
while ((match = regex.exec(text)) !== null) {
  const snippet = text.slice(Math.max(0, match.index - 80), Math.min(text.length, match.index + 160));
  if (snippet.toLowerCase().includes('calculate') || snippet.toLowerCase().includes('rate')) {
    console.log(`[${match[0]}] -> ${snippet.replace(/\s+/g, ' ')}\n---`);
  }
}
