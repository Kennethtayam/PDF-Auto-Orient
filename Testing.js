const fs = require('fs');
const path = require('path');
const { PDFDocument, degrees, rgb } = require('pdf-lib');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { createWorker } = require('tesseract.js');
const readline = require('readline');

// Configuration
const ORIENTATION_MARKERS = [
    "republic of the philippines",
    "professional regulation commission",
    "board of environmental planning",
    "republic act no",
    "certificate of registration",
    "this is to certify that"
];
const MIN_TEXT_LENGTH = 20;
const CONFIDENCE_THRESHOLD = 70;

// Create interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function extractTextWithOCR(pageImage) {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text, confidence } } = await worker.recognize(pageImage);
    await worker.terminate();
    return { text: text.toLowerCase().trim(), confidence };
}

async function analyzePageOrientation(page, pageIndex) {
    console.log(`\nAnalyzing page ${pageIndex + 1}...`);

    // Try standard text extraction first
    const textContent = await page.getTextContent();
    const pdfText = textContent.items.map(item => item.str).join(' ').toLowerCase().trim();

    if (pdfText.length >= MIN_TEXT_LENGTH) {
        console.log(`Extracted ${pdfText.length} characters from PDF text layer`);
        const rotation = determineRotationFromText(pdfText);
        if (rotation !== null) return rotation;
    }

    // Fallback to OCR if needed
    console.log('Attempting OCR analysis...');
    const { text: ocrText, confidence } = await extractTextWithOCR(await extractPageAsImage(page));
    
    if (confidence > CONFIDENCE_THRESHOLD && ocrText.length >= MIN_TEXT_LENGTH) {
        console.log(`OCR extracted ${ocrText.length} characters with ${confidence}% confidence`);
        const rotation = determineRotationFromText(ocrText);
        if (rotation !== null) return rotation;
    }

    // Final fallback to layout analysis
    console.log('Using layout analysis...');
    return determineRotationFromLayout(page);
}

function determineRotationFromText(text) {
    // Check for orientation markers in normal orientation
    const normalMatches = ORIENTATION_MARKERS.filter(marker => 
        text.includes(marker)
    ).length;

    if (normalMatches >= 2) {
        console.log(`Found ${normalMatches} orientation markers - page is correctly oriented`);
        return 0;
    }

    // Check for upside-down text (180° rotation)
    const reversedText = text.split('').reverse().join('');
    const reversedMatches = ORIENTATION_MARKERS.filter(marker => 
        reversedText.includes(marker)
    ).length;

    if (reversedMatches > normalMatches) {
        console.log(`Found ${reversedMatches} markers in reversed text - page is upside down`);
        return 180;
    }

    // Couldn't determine from text
    return null;
}

async function determineRotationFromLayout(page) {
    // Simple layout analysis - check if text is mostly in top half (normal)
    // or bottom half (possibly upside down)
    const textContent = await page.getTextContent();
    const verticalPositions = textContent.items.map(item => 
        item.transform[5] / page.getHeight()
    );

    const avgPosition = verticalPositions.reduce((sum, pos) => sum + pos, 0) / verticalPositions.length;
    
    if (avgPosition < 0.5) {
        console.log('Text appears in top half - assuming correct orientation');
        return 0;
    } else {
        console.log('Text appears in bottom half - trying 180° rotation');
        return 180;
    }
}

async function autoRotatePdf(inputPath, outputPath) {
    try {
        console.log(`\nProcessing file: ${inputPath}`);
        const pdfBytes = fs.readFileSync(inputPath);

        // Load the PDF document
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const pdf = await loadingTask.promise;

        const pageCount = pdf.numPages;
        console.log(`Document has ${pageCount} page(s)`);

        // Process each page
        for (let i = 0; i < pageCount; i++) {
            const page = pdfDoc.getPages()[i];
            const pdfjsPage = await pdf.getPage(i + 1);

            // Get current rotation
            const currentRotation = page.getRotation().angle;

            // Analyze page to determine correct rotation
            let newRotation = await analyzePageOrientation(pdfjsPage, i);

            // If automatic detection failed, prompt user
            if (newRotation === null) {
                newRotation = await new Promise(resolve => {
                    rl.question(`Could not determine orientation for page ${i + 1}. Enter rotation (0/90/180/270): `, answer => {
                        resolve(parseInt(answer) || 0);
                    });
                });
            }

            // Apply rotation if needed
            if (newRotation !== currentRotation) {
                console.log(`Rotating page ${i + 1} to ${newRotation}°`);
                page.setRotation(degrees(newRotation));
            } else {
                console.log(`Page ${i + 1} orientation is correct`);
            }
        }

        // Save the rotated PDF
        const rotatedPdfBytes = await pdfDoc.save();
        fs.writeFileSync(outputPath, rotatedPdfBytes);
        console.log(`\nSuccessfully saved rotated PDF to: ${outputPath}`);

    } catch (error) {
        console.error('Error processing PDF:', error);
        throw error;
    }
}

// Helper function to extract page as image (simplified)
async function extractPageAsImage(page) {
    // In a real implementation, you would render the page to an image buffer
    // This is a placeholder for the concept
    return {
        width: page.view[2],
        height: page.view[3],
        data: Buffer.alloc(0) // Actual implementation would contain image data
    };
}

// Main function
async function main() {
    try {
        console.log('=== Automatic PDF Orientation Tool ===');
        
        const inputPath = await new Promise(resolve => {
            rl.question('Enter input PDF file path: ', resolve);
        });

        if (!fs.existsSync(inputPath)) {
            console.error('Error: Input file does not exist');
            return;
        }

        const outputPath = await new Promise(resolve => {
            rl.question('Enter output PDF file path: ', resolve);
        });

        await autoRotatePdf(inputPath, outputPath);
        
    } catch (error) {
        console.error('Process failed:', error);
    } finally {
        rl.close();
    }
}

// Start the program
main();