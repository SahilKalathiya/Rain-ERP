const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const dataBuffer = fs.readFileSync('C:/Users/Sahil Kalathiya/.gemini/antigravity/brain/28cbb30a-5a43-433e-acbe-13929ff22b8f/.user_uploaded/media_1794977418917_6d2d1de7.pdf');
const uint8 = new Uint8Array(dataBuffer);

const parser = new PDFParse(uint8);

parser.getText().then(result => {
  const text = typeof result === 'string' ? result : (result.text || JSON.stringify(result));
  console.log('Got text, length:', text.length);
  fs.writeFileSync('C:/Users/Sahil Kalathiya/.gemini/antigravity/brain/28cbb30a-5a43-433e-acbe-13929ff22b8f/scratch/pdf_full_extracted.txt', text);
  
  // Search for Challan or Section 4
  const lines = text.split('\n');
  const matches = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('challan') || lines[i].toLowerCase().includes('section 4')) {
      matches.push(`[LINE ${i}] ` + lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 15)).join('\n'));
      i += 8;
    }
  }
  fs.writeFileSync('C:/Users/Sahil Kalathiya/.gemini/antigravity/brain/28cbb30a-5a43-433e-acbe-13929ff22b8f/scratch/challan_extracted_sections.txt', matches.join('\n\n---\n\n'));
  console.log('Done searching challan, found matches:', matches.length);
}).catch(err => {
  console.error('getText error:', err);
});
