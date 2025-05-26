const fs = require('fs');
const path = require('path');
const pdfPoppler = require('pdf-poppler');

// 📁 Input & output directories
const inputDir = path.join(__dirname, 'pdfs');     // Folder containing PDFs
const outputDir = path.join(__dirname, 'images');  // Folder for images

// 🔧 Ensure output folder exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const convertPdfToImages = async (pdfPath, baseName) => {
  const options = {
    format: 'png',
    out_dir: outputDir,
    out_prefix: baseName,
    page: null,
    scale: 1024,
  };

  try {
    await pdfPoppler.convert(pdfPath, options);
    console.log(`✅ Converted: ${baseName}`);
  } catch (err) {
    console.error(`❌ Failed to convert ${baseName}:`, err.message);
  }
};

const convertAllPdfs = async () => {
  const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.pdf'));

  if (files.length === 0) {
    console.log('📭 No PDF files found in input folder.');
    return;
  }

  for (const file of files) {
    const fullPath = path.join(inputDir, file);
    const baseName = path.parse(file).name;
    await convertPdfToImages(fullPath, baseName);
  }

  console.log('\n🎉 All PDFs converted!');
};

convertAllPdfs();
