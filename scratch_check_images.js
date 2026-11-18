const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const dataBuffer = fs.readFileSync('C:/Users/Sahil Kalathiya/.gemini/antigravity/brain/28cbb30a-5a43-433e-acbe-13929ff22b8f/.user_uploaded/media_1794977418917_6d2d1de7.pdf');
const uint8 = new Uint8Array(dataBuffer);

const parser = new PDFParse(uint8);

async function run() {
  await parser.load();
  console.log('Total pages:', parser.doc.numPages);
  // Check page 14 and 15
  for (let p = 13; p <= 16; p++) {
    const page = await parser.doc.getPage(p);
    const ops = await page.getOperatorList();
    console.log(`Page ${p} ops count:`, ops.fnArray.length);
    // Find image operators
    const imgKeys = Object.keys(page.objs._objs || {});
    console.log(`Page ${p} objs keys:`, imgKeys.length);
  }
}

run().catch(console.error);
