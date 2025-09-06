import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url'; // Import 'url' module for pathing

// Tesseract for OCR
import { createWorker } from "tesseract.js";

// PDF processing libraries
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { createCanvas } from 'canvas';

// Your custom utilities
import pool from "./config/db.js";
import { extractEntities } from "./utils/extractEntities.js";


// --- PDF Processing Helper Function ---
async function performPdfOcr(filePath) {
    console.log('[OCR Helper] Starting PDF processing...');

    // 1. Convert PDF to Image Buffers
    console.log(`[OCR Helper] Reading file from path: ${filePath}`);
    const data = new Uint8Array(fs.readFileSync(filePath));

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const standardFontDataUrl = path.join(__dirname, 'node_modules', 'pdfjs-dist', 'standard_fonts/');
    
    const pdfDocument = await pdfjsLib.default.getDocument({ 
        data,
        standardFontDataUrl: standardFontDataUrl // Pass the font path here
    }).promise;
    
    const numPages = pdfDocument.numPages;
    console.log(`[OCR Helper] PDF has ${numPages} page(s).`);
    
    const imageBuffers = [];
    for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocument.getPage(i);
        console.log(`[OCR Helper] Converting page ${i}...`);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        imageBuffers.push(canvas.toBuffer('image/png'));
    }
    console.log('[OCR Helper] PDF converted to image buffers successfully.');

    // 2. Perform OCR on each image
    console.log('[OCR Helper] Initializing Tesseract worker for English and Hindi...');
    const worker = await createWorker('eng+hin');
    
    let fullOcrText = '';
    for (let i = 0; i < imageBuffers.length; i++) {
        console.log(`[OCR Helper] Recognizing text from page ${i + 1}...`);
        const { data: { text } } = await worker.recognize(imageBuffers[i]);
        fullOcrText += text + '\n\n';
    }
    
    await worker.terminate();
    console.log('[OCR Helper] Tesseract worker terminated.');
    
    return fullOcrText.trim();
}


// --- Express App Setup ---
const app = express();
const upload = multer({ dest: "backend/uploads/" });

app.set("view engine", "ejs");
app.set("views", "../frontend/views");
app.use(express.static("frontend/public"));


// --- Routes ---

// Home route to display existing claims
app.get("/", async (req, res) => {
  try {
    const claims = await pool.query('SELECT * FROM "claims" ORDER BY "created_at" DESC');
    res.render("index", { claims: claims.rows });
  } catch (err) {
    console.error("Error fetching claims:", err);
    res.status(500).send("Could not fetch claims from database.");
  }
});

// Upload route
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file was uploaded.");
    }
    console.log("--- New Upload Request ---");
    console.log("File received:", req.file.path);

    // Use our new helper function to handle the PDF
    const ocrText = await performPdfOcr(req.file.path);

    // Extract structured data
    console.log("Extracting entities from OCR text...");
    const { name, village, district, state } = extractEntities(ocrText);

    // Save in DB
    console.log("Saving extracted data to the database...");
    // CORRECTED: The query now correctly matches the database schema.
const result = await pool.query(
  `INSERT INTO "claims"
   ("filename", "ocr_text", "name", "village", "district", "state", "latitude", "longitude", "created_at")
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
  [
    req.file.originalname,
    ocrText,
    name,
    [village],   // wrap in array
    district,
    state,
    null,
    null
  ]
);

    console.log(`Successfully saved claim with ID: ${result.rows[0].id}`);
    console.log("--- Upload Request Finished ---");

    res.redirect("/");

  } catch (err) {
    console.error("Error during the upload process:", err);
    res.status(500).send("File processing failed. Check server logs for details.");
  }
});

// Start server
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});

