const Tesseract = require('tesseract.js');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const folderPath = 'C:/Users/Kenneth/Desktop/ORIENTFILES/images'; // 👈 Set your folder here

// Heuristic keywords to help determine if text is upside-down
const flippedWords = ['philippines', 'department', 'office', 'budget', 'mayor', 'accomplishments'];

async function detectAndFixOrientation(filePath) {
  console.log(`🔍 Scanning: ${path.basename(filePath)}`);

  const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
    logger: m => process.stdout.write('.')
  });

  const textLower = text.toLowerCase();
  const flippedCount = flippedWords.reduce((count, word) => {
    return count + (textLower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
  }, 0);

  // If no key words were found, treat it as likely rotated
  if (flippedCount < 2) {
    console.log(`\n🔄 Detected upside-down or weak text. Rotating 180°...`);

    const image = await Jimp.read(filePath);
    image.rotate(180);
    
    const newPath = filePath.replace(/(\.\w+)$/, '_fixed$1');
    await image.writeAsync(newPath);

    console.log(`✅ Saved: ${path.basename(newPath)}\n`);
  } else {
    console.log(`\n✅ Orientation seems correct.\n`);
  }
}

async function processFolder(folder) {
  const files = fs.readdirSync(folder).filter(file => /\.(png)$/i.test(file));
  console.log(`📁 Found ${files.length} PNG files to process...\n`);

  for (const file of files) {
    const fullPath = path.join(folder, file);
    try {
      await detectAndFixOrientation(fullPath);
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err.message);
    }
  }

  console.log('🎉 Done processing all images!');
}

processFolder(folderPath);
