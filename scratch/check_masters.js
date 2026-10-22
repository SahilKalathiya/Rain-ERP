const fs = require('fs');
const text = fs.readFileSync('scratch/module3_pdf_text.txt', 'utf8');
const lines = text.split('\n');
console.log('Total lines:', lines.length);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/master|new master|cutting|data structure/i.test(line)) {
    console.log(`[${i}] ${line.trim()}`);
  }
}
