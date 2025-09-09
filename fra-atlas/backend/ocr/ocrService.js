// ocrService.js

import fs from "fs";
import path from "path";
import canvas from "canvas"; // Use default import for canvas
import { createWorker } from "tesseract.js";

// Destructure from the default export
const { createCanvas, DOMMatrix, ImageData, Path2D } = canvas;

// Polyfill DOM classes for pdfjs-dist in Node.js
global.DOMMatrix = DOMMatrix || global.DOMMatrix;
global.ImageData = ImageData || global.ImageData;
global.Path2D = Path2D || global.Path2D;

const __dirname = path.dirname(new URL(import.meta.url).pathname);

async function performPdfOcr(filePath) {
  console.log("[OCR] Processing:", filePath);

  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const data = new Uint8Array(fs.readFileSync(filePath));

  // ✅ Proper file URL with trailing slash
  const { pathToFileURL } = await import("url");
  const standardFontDataUrl = pathToFileURL(
    path.join(__dirname, "node_modules", "pdfjs-dist", "standard_fonts") + path.sep
  ).href+"/";
  // ##########################################

  const pdfDocument = await pdfjsLib.getDocument({
    data,
    standardFontDataUrl,
  }).promise;

  const numPages = pdfDocument.numPages;
  console.log(`[OCR Helper] PDF has ${numPages} page(s).`);

  // Extract text first
  let fullText = "";
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(" ");
    fullText += pageText + "\n\n";
  }

  if (fullText.trim().length > 20) {
    console.log("[OCR Helper] Extracted text using pdfjs-dist ✅");
    return fullText.trim();
  }

  // Fallback to OCR
  console.log("[OCR Helper] No extractable text found, falling back to OCR…");

  // Step 2: OCR fallback
  const imageBuffers = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvasInstance = createCanvas(viewport.width, viewport.height); // Use createCanvas from canvas module
    const context = canvasInstance.getContext("2d");
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    imageBuffers.push(canvasInstance.toBuffer("image/png"));
  }

  const worker = await createWorker("eng+hin");
  let fullOcrText = "";
  for (let i = 0; i < imageBuffers.length; i++) {
    console.log(`[OCR Helper] Running OCR on page ${i + 1}...`);
    const {
      data: { text },
    } = await worker.recognize(imageBuffers[i]);
    fullOcrText += text + "\n\n";
  }
  await worker.terminate();

  console.log("[OCR Helper] OCR text extraction done ✅");
  return fullOcrText.trim();
}

export { performPdfOcr };