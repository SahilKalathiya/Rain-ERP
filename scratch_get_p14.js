const fs = require('fs');
const full = fs.readFileSync('C:/Users/Sahil Kalathiya/.gemini/antigravity/brain/28cbb30a-5a43-433e-acbe-13929ff22b8f/scratch/pdf_full_extracted.txt', 'utf8');

const p14 = full.indexOf('-- 14 of 32 --');
const p17 = full.indexOf('-- 17 of 32 --');

if (p14 !== -1 && p17 !== -1) {
  const pageText = full.substring(p14, p17);
  fs.writeFileSync('C:/Users/Sahil Kalathiya/.gemini/antigravity/brain/28cbb30a-5a43-433e-acbe-13929ff22b8f/scratch/pages_14_16.txt', pageText);
  console.log('Saved Pages 14-16! Length:', pageText.length);
} else {
  console.log('Not found:', p14, p17);
}
