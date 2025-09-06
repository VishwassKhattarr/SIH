// This utility converts a PDF file into an array of image buffers.
// It uses pdfjs-dist to parse the PDF and the canvas library to render pages.
// This is a necessary step before performing OCR, as Tesseract works on images.

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';

/**
 * Converts each page of a PDF file into a high-quality image buffer.
 * @param {string} pdfPath - The absolute path to the PDF file.
 * @returns {Promise<Buffer[]>} A promise that resolves to an array of image buffers.
 */
export async function convertPdfToImages(pdfPath) {
    console.log(`[PDF Processor] Reading file from path: ${pdfPath}`);
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const pdfDocument = await pdfjsLib.getDocument({ data }).promise;
    const numPages = pdfDocument.numPages;
    console.log(`[PDF Processor] PDF has ${numPages} page(s).`);
    
    const imageBuffers = [];

    for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocument.getPage(i);
        console.log(`[PDF Processor] Converting page ${i}...`);

        // Set a higher scale for better image quality, which improves OCR accuracy.
        const scale = 2;
        const viewport = page.getViewport({ scale });

        // Create a canvas to draw the PDF page on.
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        // Render the page onto the canvas.
        await page.render({
            canvasContext: context,
            viewport: viewport,
        }).promise;

        // Convert the canvas to a PNG image buffer.
        const buffer = canvas.toBuffer('image/png');
        imageBuffers.push(buffer);
    }
    
    console.log('[PDF Processor] All pages converted successfully.');
    return imageBuffers;
}