const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const path = require('path');

// Function to split a single PDF
async function splitPDF(inputPath, outputFolder) {
    try {
        const pdfBytes = fs.readFileSync(inputPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        const fileName = path.basename(inputPath, path.extname(inputPath));

        console.log(`📄 Splitting: ${fileName} (${pdfDoc.getPageCount()} pages)`);

        for (let i = 0; i < pdfDoc.getPageCount(); i++) {
            const newPdf = await PDFDocument.create();
            const [page] = await newPdf.copyPages(pdfDoc, [i]);
            newPdf.addPage(page);

            const outputPath = path.join(outputFolder, `${fileName}_Page_${i + 1}.pdf`);
            const newPdfBytes = await newPdf.save();
            fs.writeFileSync(outputPath, newPdfBytes);

            console.log(`✅ Saved: ${path.basename(outputPath)}`);
        }

        console.log(`🎉 Finished splitting: ${fileName}`);
    } catch (error) {
        console.error(`❌ Error splitting PDF: ${error.message}`);
    }
}

// Function to process all PDFs in the folder
async function processAllPDFs(folderPath, outputFolder) {
    try {
        if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });

        const files = fs.readdirSync(folderPath);
        const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');

        if (pdfFiles.length === 0) {
            console.log('⚠️   No PDF files found! ⚠️');
            return;
        }

        for (const file of pdfFiles) {
            const inputPath = path.join(folderPath, file);
            console.log(`🔍 Processing: ${file}`);
            await splitPDF(inputPath, outputFolder);
        }

        console.log('✔️   All PDFs split successfully!');
    } catch (error) {
        console.error(`❌ Error processing PDFs: ${error.message}`);
    }
}

// Set your input folder and output folder paths
const folderPath = path.join('C:\\Users\\Kenneth\\Desktop\\ORIENTFILES\\OPCR Accomplishments 2024_Mayors signature', 'OPCR Accomplishments 2024_Mayors signature');
const outputFolder = path.join(folderPath, 'Split Files');

// Start the process
processAllPDFs(folderPath, outputFolder).catch(console.error);
