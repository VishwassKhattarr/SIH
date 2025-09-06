// This service now handles ONLY PDF files for OCR processing.
// It uses Tesseract.js for text extraction and our pdfProcessor for PDF conversion.

import { createWorker } from 'tesseract.js';
import path from 'path';
// Use ES Module import syntax
import { convertPdfToImages } from '../utils/pdfProcessor.js';

/**
 * Performs OCR on a given PDF file.
 * @param {string} filePath - The absolute path to the PDF file.
 * @returns {Promise<string>} A promise that resolves to the extracted text.
 */
export async function performOCR(filePath) {
    console.log(`[OCR Service] --- Starting OCR process for: ${filePath} ---`);

    let extractedText = '';
    // Initialize the Tesseract worker
    const worker = await createWorker({
        logger: m => console.log(`[Tesseract] ${m.status}: ${(m.progress * 100).toFixed(2)}%`), // Detailed Tesseract progress
    });

    try {
        // Load and initialize the English language model
        await worker.loadLanguage('eng');
        await worker.initialize('eng');

        const fileExtension = path.extname(filePath).toLowerCase();
        console.log(`[OCR Service] Detected file extension: ${fileExtension}`);

        // Ensure the file is a PDF
        if (fileExtension !== '.pdf') {
            console.error(`[OCR Service] ERROR: Unsupported file type provided.`);
            throw new Error(`Unsupported file type: '${fileExtension}'. This service only processes PDF files.`);
        }

        console.log('[OCR Service] PDF confirmed. Starting conversion to images...');
        const imageBuffers = await convertPdfToImages(filePath);
        console.log(`[OCR Service] PDF conversion complete. Received ${imageBuffers.length} image(s).`);

        if (imageBuffers.length === 0) {
            console.warn('[OCR Service] PDF conversion resulted in zero images.');
            return '';
        }

        // Loop through each image buffer and perform OCR
        for (let i = 0; i < imageBuffers.length; i++) {
            const buffer = imageBuffers[i];
            console.log(`[OCR Service] Recognizing text from image buffer for page ${i + 1}...`);
            const { data: { text } } = await worker.recognize(buffer);
            extractedText += text + '\n\n'; // Add spacing between pages
        }
        console.log('[OCR Service] --- OCR process finished successfully. ---');

    } catch (error) {
        console.error('[OCR Service] --- An error occurred during OCR processing: ---', error);
        throw error; // Propagate error to the controller
    } finally {
        // Always terminate the worker to free up resources
        if (worker) {
            await worker.terminate();
            console.log('[OCR Service] Tesseract worker terminated.');
        }
    }

    return extractedText.trim();
}