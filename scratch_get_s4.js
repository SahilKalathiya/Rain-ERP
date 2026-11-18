const fs = require('fs');
const full = fs.readFileSync('C:/Users/Sahil Kalathiya/.gemini/antigravity/brain/28cbb30a-5a43-433e-acbe-13929ff22b8f/scratch/pdf_full_extracted.txt', 'utf8');

const s4Start = full.indexOf('4. Process Challan Module');
const s5Start = full.indexOf('5. Vendor Return');

if (s4Start !== -1 && s5Start !== -1) {
  const section4Text = full.substring(s4Start, s5Start);
  fs.writeFileSync('C:/Users/Sahil Kalathiya/.gemini/antigravity/brain/28cbb30a-5a43-433e-acbe-13929ff22b8f/scratch/section4_full.txt', section4Text);
  console.log('Saved Section 4! Length:', section4Text.length);
} else {
  console.log('Not found indexes:', s4Start, s5Start);
}
