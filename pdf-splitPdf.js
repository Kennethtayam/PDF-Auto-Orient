const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const path = require('path');

// ========== CONFIGURATION ========== //
const INPUT_PATH = path.normalize('C:\\Users\\Kenneth\\Desktop\\ORIENTFILES\\Del Valle, Ranhil M._PDS.pdf');
const OUTPUT_DIR = path.normalize('C:\\Users\\Kenneth\\Desktop\\ORIENTFILES\\Split_PDFs');

// ========== DEBUGGING CHECKS ========== //
console.log('Verifying input path:', INPUT_PATH);
console.log('Path exists:', fs.existsSync(INPUT_PATH));
console.log('Is directory:', fs.statSync(INPUT_PATH).isDirectory());
console.log('Is file:', fs.statSync(INPUT_PATH).isFile());
console.log('File extension:', path.extname(INPUT_PATH));

// ========== MAIN FUNCTION ========== //
async function splitPdf() {
  try {
    // Validate input path
    if (!fs.existsSync(INPUT_PATH)) {
      throw new Error('Input file does not exist');
    }

    const stats = fs.statSync(INPUT_PATH);
    if (stats.isDirectory()) {
      throw new Error('Input path is a directory - please specify a PDF file');
    }

    if (path.extname(INPUT_PATH).toLowerCase() !== '.pdf') {
      throw new Error('Input file is not a PDF');
    }

    // Prepare output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log(`\nSplitting PDF: ${path.basename(INPUT_PATH)}`);
    
    // Load and split PDF
    const pdfBytes = fs.readFileSync(INPUT_PATH);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const baseName = path.basename(INPUT_PATH, '.pdf');

    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const newPdf = await PDFDocument.create();
      const [page] = await newPdf.copyPages(pdfDoc, [i]);
      newPdf.addPage(page);

      const outputPath = path.join(OUTPUT_DIR, `${baseName}_page_${i+1}.pdf`);
      fs.writeFileSync(outputPath, await newPdf.save());
      console.log(`✔ Created: ${path.basename(outputPath)}`);
    }

    console.log('\n✅ PDF split successfully!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('Please verify:');
    console.log(`1. The file exists at: ${INPUT_PATH}`);
    console.log('2. The path points to a PDF file, not a folder');
    console.log('3. You have proper read/write permissions');
  }
}

// Run the script
splitPdf();