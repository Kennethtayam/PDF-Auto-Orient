const fs = require('fs');
const path = require('path');
const { PDFDocument, degrees } = require('pdf-lib');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// Configuration
const ORIENTATION_MARKERS = [
    "REPUBLIC OF THE PHILIPPINES",
    "professional regulation commission",
    "board of environmental planning",
    "republic act no",
    "certificate of registration",
    "this is to certify that"
];
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function extractPageText(pdf, pageIndex) {
    try {
        const page = await pdf.getPage(pageIndex + 1);
        const textContent = await page.getTextContent();
        return textContent.items.map(item => item.str).join(' ').toLowerCase().trim();
    } catch (error) {
        console.error(`Error extracting text from page ${pageIndex + 1}:`, error);
        return '';
    }
}

async function determinePageRotation(text) {
    if (!text || text.length < 10) {
        console.log('Insufficient text for analysis - trying OCR fallback or manual inspection');
        return degrees(0); // Default to no rotation
    }

    const markerCount = ORIENTATION_MARKERS.filter(marker => 
        text.includes(marker)
    ).length;

    if (markerCount >= 2) return degrees(0);

    // Simple rotation detection (for 180° only in this basic version)
    const reversedText = text.split('').reverse().join('');
    const reversedMarkers = ORIENTATION_MARKERS.filter(marker => 
        reversedText.includes(marker)
    ).length;

    return reversedMarkers > markerCount ? degrees(180) : degrees(0);
}

async function safeWriteFile(filePath, data, retries = MAX_RETRIES) {
    try {
        fs.writeFileSync(filePath, data);
        return true;
    } catch (error) {
        if (error.code === 'EBUSY' && retries > 0) {
            console.log(`File busy, retrying in ${RETRY_DELAY}ms... (${retries} attempts remaining)`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return safeWriteFile(filePath, data, retries - 1);
        }
        throw error;
    }
}

async function fixPdfOrientation(inputPath, outputPath) {
    let pdfData;
    try {
        console.log(`Processing file: ${inputPath}`);
        pdfData = fs.readFileSync(inputPath);

        // Load documents
        const pdfDoc = await PDFDocument.load(pdfData);
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;

        const pageCount = pdf.numPages;
        console.log(`Document has ${pageCount} pages`);

        // Process each page
        for (let i = 0; i < pageCount; i++) {
            console.log(`Processing page ${i + 1}/${pageCount}`);
            
            const originalText = await extractPageText(pdf, i);
            console.log(`Extracted ${originalText.length} chars: ${originalText.substring(0, 50)}...`);
            
            const correctRotation = await determinePageRotation(originalText);
            const page = pdfDoc.getPages()[i];
            const currentRotation = page.getRotation().angle;

            if (currentRotation !== correctRotation.angle) {
                console.log(`Rotating from ${currentRotation}° to ${correctRotation.angle}°`);
                page.setRotation(correctRotation);
            }
        }

        // Save with retry logic
        const rotatedPdfBytes = await pdfDoc.save();
        await safeWriteFile(outputPath, rotatedPdfBytes);
        console.log(`Successfully saved to: ${outputPath}`);

    } catch (error) {
        console.error('Processing failed:', error);
        
        // Provide helpful troubleshooting tips
        if (error.code === 'EBUSY') {
            console.log('\nTroubleshooting tips:');
            console.log('1. Close the output file if open in another program');
            console.log('2. Try a different output filename');
            console.log('3. Check file permissions in the output directory');
        } else if (error.message.includes('password')) {
            console.log('Document may be password protected');
        } else if (!pdfData) {
            console.log('Input file may not exist or be inaccessible');
        }
        
        throw error;
    }
}

// Example usage with additional checks
async function main() {
    const inputPdf = path.join(__dirname, 'Adviento, Jerome A._Diploma.pdf');
    const outputPdf = path.join(__dirname, 'oriented_output.pdf');

    // Check if input exists
    if (!fs.existsSync(inputPdf)) {
        console.error(`Input file not found: ${inputPdf}`);
        return;
    }

    try {
        await fixPdfOrientation(inputPdf, outputPdf);
        console.log('Orientation correction completed successfully');
    } catch (error) {
        console.error('Process failed after retries');
        process.exit(1);
    }
}

main();