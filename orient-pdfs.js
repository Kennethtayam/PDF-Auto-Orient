const fs = require('fs');
const { PDFDocument, degrees } = require('pdf-lib');
const path = require('path');

// ========== CONFIGURATION ========== //
const INPUT_FOLDER = path.join('C:', 'Users', 'Kenneth', 'Desktop', 'ORIENTFILES');
const OUTPUT_FOLDER = path.join(INPUT_FOLDER, 'ORIENTED_FILES');

// ========== MAIN FUNCTION ========== //
async function correctPdfOrientation() {
  try {
    // Create output folder if it doesn't exist
    if (!fs.existsSync(OUTPUT_FOLDER)) {
      fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
    }

    // Get all PDF files in input folder
    const files = fs.readdirSync(INPUT_FOLDER).filter(file => file.toLowerCase().endsWith('.pdf'));

    if (files.length === 0) {
      console.log('No PDF files found in input folder');
      return;
    }

    for (const file of files) {
      const inputPath = path.join(INPUT_FOLDER, file);
      const outputPath = path.join(OUTPUT_FOLDER, file);

      console.log(`\nProcessing: ${file}`);

      // Load the PDF document
      const pdfBytes = fs.readFileSync(inputPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      let rotationApplied = false;
      const pages = pdfDoc.getPages();

      // Check each page's orientation
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Detect portrait/landscape (assuming standard sizes)
        const isPortrait = height > width;
        
        // Check if page needs rotation (you can adjust these thresholds)
        if (!isPortrait && width > height) {
          console.log(`- Rotating page ${i + 1} (${width}x${height})`);
          page.setRotation(degrees(270));
          rotationApplied = true;
        }
      }

      if (rotationApplied) {
        // Save the modified PDF
        const correctedPdfBytes = await pdfDoc.save();
        fs.writeFileSync(outputPath, correctedPdfBytes);
        console.log(`✅ Saved corrected file: ${file}`);
      } else {
        console.log('✔ All pages already properly oriented');
        // Copy original if no changes needed
        fs.copyFileSync(inputPath, outputPath);
      }
    }

    console.log('\n🎉 All files processed!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run the tool
correctPdfOrientation();