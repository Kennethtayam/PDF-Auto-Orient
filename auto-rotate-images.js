const fs = require('fs');
const path = require('path');
const { PDFDocument, degrees } = require('pdf-lib');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');  // Use legacy build for Node.js

// Extract text from a specific page of the pdfjs document
async function extractPageText(pdf, pageIndex) {
  const page = await pdf.getPage(pageIndex + 1);
  const textContent = await page.getTextContent();

  // Concatenate all text items into a single string
  const textItems = textContent.items.map(item => item.str);
  return textItems.join(' ').trim();
}

async function fixPdfOrientation(inputPath, outputPath) {
  // Read the PDF file into a buffer
  const pdfData = fs.readFileSync(inputPath);

  // Load pdf-lib document to rotate pages
  const pdfDoc = await PDFDocument.load(pdfData);

  // Load pdfjs document for text extraction (only once)
  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;

  const pageCount = pdf.numPages;

  for (let i = 0; i < pageCount; i++) {
    const text = await extractPageText(pdf, i);

    console.log(`Page ${i + 1} text length: ${text.length}`);

    // Heuristic: if page text length < 10, assume upside down and rotate 180°
    if (text.length < 10) {
      console.log(`Page ${i + 1} seems empty or unreadable, rotating 180°`);
      const page = pdfDoc.getPages()[i];
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + 180) % 360));
    }
  }

  // Save rotated PDF bytes and write to output file
  const rotatedPdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, rotatedPdfBytes);

  console.log(`Saved rotated PDF as ${outputPath}`);
}

// Example usage - replace filenames with your actual PDF paths
fixPdfOrientation(
  path.join(__dirname, 'OPCR Accomplishments 2024_Mayors signature.pdf'),
  path.join(__dirname, 'output_rotated.pdf')
).catch(console.error);
