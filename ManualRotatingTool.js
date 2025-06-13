const fs = require('fs');
const path = require('path');
const { PDFDocument, degrees } = require('pdf-lib');
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function rotatePdfPages(inputPath, outputPath, rotations) {
  try {
    // Read the input PDF file
    const pdfBytes = fs.readFileSync(inputPath);
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    // Apply rotations to each page
    rotations.forEach((rotation, index) => {
      if (index < pages.length) {
        pages[index].setRotation(degrees(rotation));
        console.log(`Page ${index + 1} rotated to ${rotation} degrees`);
      }
    });
    
    // Save the rotated PDF
    const rotatedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, rotatedPdfBytes);
    
    console.log(`\nSuccessfully saved rotated PDF to: ${outputPath}`);
  } catch (error) {
    console.error('Error rotating PDF:', error);
    throw error;
  }
}

async function getUserRotationChoices(pageCount) {
  const rotations = [];
  
  console.log(`\nThe PDF has ${pageCount} page(s). Enter rotation for each page (0, 90, 180, or 270 degrees):`);
  
  for (let i = 0; i < pageCount; i++) {
    const rotation = await new Promise((resolve) => {
      rl.question(`Rotation for page ${i + 1} (0/90/180/270): `, (answer) => {
        const num = parseInt(answer);
        resolve([0, 90, 180, 270].includes(num) ? num : 0);
      });
    });
    rotations.push(rotation);
  }
  
  return rotations;
}

async function main() {
  try {
    console.log('=== PDF Rotation Tool ===');
    
    // Get input file path
    const inputPath = await new Promise((resolve) => {
      rl.question('Enter input PDF file path: ', resolve);
    });
    
    // Verify file exists
    if (!fs.existsSync(inputPath)) {
      console.error('Error: Input file does not exist');
      rl.close();
      return;
    }
    
    // Get output file path
    const outputPath = await new Promise((resolve) => {
      rl.question('Enter output PDF file path: ', resolve);
    });
    
    // Load PDF to get page count
    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPages().length;
    
    // Get rotation choices
    const rotations = await getUserRotationChoices(pageCount);
    
    // Apply rotations
    await rotatePdfPages(inputPath, outputPath, rotations);
    
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    rl.close();
  }
}

// Start the program
main();