// import express from "express";
// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import { fileURLToPath } from 'url'; // Import 'url' module for pathing
// import fetch from "node-fetch";
// // Tesseract for OCR
// import { createWorker } from "tesseract.js";

// // PDF processing libraries
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
// import { createCanvas } from 'canvas';

// // Your custom utilities
// import pool from "./config/db.js";
// import { extractEntities } from "./utils/extractEntities.js";


// // --- PDF Processing Helper Function ---
// async function performPdfOcr(filePath) {
//     console.log('[OCR Helper] Starting PDF processing...');

//     // 1. Convert PDF to Image Buffers
//     console.log(`[OCR Helper] Reading file from path: ${filePath}`);
//     const data = new Uint8Array(fs.readFileSync(filePath));

//     const __filename = fileURLToPath(import.meta.url);
//     const __dirname = path.dirname(__filename);
//     const standardFontDataUrl = path.join(__dirname, 'node_modules', 'pdfjs-dist', 'standard_fonts/');
    
//     const pdfDocument = await pdfjsLib.default.getDocument({ 
//         data,
//         standardFontDataUrl: standardFontDataUrl // Pass the font path here
//     }).promise;
    
//     const numPages = pdfDocument.numPages;
//     console.log(`[OCR Helper] PDF has ${numPages} page(s).`);
    
//     const imageBuffers = [];
//     for (let i = 1; i <= numPages; i++) {
//         const page = await pdfDocument.getPage(i);
//         console.log(`[OCR Helper] Converting page ${i}...`);
//         const viewport = page.getViewport({ scale: 2.0 });
//         const canvas = createCanvas(viewport.width, viewport.height);
//         const context = canvas.getContext('2d');
//         await page.render({ canvasContext: context, viewport: viewport }).promise;
//         imageBuffers.push(canvas.toBuffer('image/png'));
//     }
//     console.log('[OCR Helper] PDF converted to image buffers successfully.');

//     // 2. Perform OCR on each image
//     console.log('[OCR Helper] Initializing Tesseract worker for English and Hindi...');
//     const worker = await createWorker('eng+hin');
    
//     let fullOcrText = '';
//     for (let i = 0; i < imageBuffers.length; i++) {
//         console.log(`[OCR Helper] Recognizing text from page ${i + 1}...`);
//         const { data: { text } } = await worker.recognize(imageBuffers[i]);
//         fullOcrText += text + '\n\n';
//     }
    
//     await worker.terminate();
//     console.log('[OCR Helper] Tesseract worker terminated.');
    
//     return fullOcrText.trim();
// }


// // --- Express App Setup ---
// const app = express();
// const upload = multer({ dest: "backend/uploads/" });

// app.set("view engine", "ejs");
// app.set("views", "../frontend/views");
// app.use(express.static("frontend/public"));


// // --- Routes ---

// // Home route to display existing claims
// app.get("/", async (req, res) => {
//   try {
//     const claims = await pool.query('SELECT * FROM "claims" ORDER BY "created_at" DESC');
//     res.render("index", { claims: claims.rows });
//   } catch (err) {
//     console.error("Error fetching claims:", err);
//     res.status(500).send("Could not fetch claims from database.");
//   }
// });

// // Upload route
// app.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).send("No file was uploaded.");
//     }
//     console.log("--- New Upload Request ---");
//     console.log("File received:", req.file.path);

//     // Use our new helper function to handle the PDF
//     const ocrText = await performPdfOcr(req.file.path);

//     // Extract structured data
//     console.log("Extracting entities from OCR text...");
//     const { name, village, district, state } = extractEntities(ocrText);

//     // Save in DB
//     console.log("Saving extracted data to the database...");
//     // CORRECTED: The query now correctly matches the database schema.
// const result = await pool.query(
//   `INSERT INTO "claims"
//    ("filename", "ocr_text", "name", "village", "district", "state", "latitude", "longitude", "created_at")
//    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
//   [
//     req.file.originalname,
//     ocrText,
//     name,
//     [village],   // wrap in array
//     district,
//     state,
//     null,
//     null
//   ]
// );

//     console.log(`Successfully saved claim with ID: ${result.rows[0].id}`);
//     console.log("--- Upload Request Finished ---");

//     res.redirect("/");

//   } catch (err) {
//     console.error("Error during the upload process:", err);
//     res.status(500).send("File processing failed. Check server logs for details.");
//   }
// });

// // Start server
// app.listen(5000, () => {
//   console.log("🚀 Server running on http://localhost:5000");
// });


// server.js
// import express from "express";
// import multer from "multer";
// import { fileURLToPath } from "url";
// import path from "path";
// import fetch from "node-fetch";

// import pool from "./config/db.js";
// import { extractEntities } from "./utils/extractEntities.js";
// // ✅ Import the corrected OCR function from your service file
// import { performPdfOcr } from "./ocr/ocrService.js";

// // -------------------------
// // CONFIG
// // -------------------------
// const OPENCAGE_API_KEY = "9bc54a47df1949e6ad2c1deb9f925d16"; // Replace with your key

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // -------------------------
// // Geocoding helper
// // -------------------------
// async function geocodeAddress(village, district, state) {
//   try {
//     const query = `${village}, ${district}, ${state}, India`;
//     const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
//       query
//     )}&key=${OPENCAGE_API_KEY}&limit=1`;

//     const res = await fetch(url);
//     const data = await res.json();

//     if (data.results && data.results.length > 0) {
//       const { lat, lng } = data.results[0].geometry;
//       return { latitude: lat, longitude: lng };
//     }
//     return null;
//   } catch (err) {
//     console.error("Geocoding error:", err);
//     return null;
//   }
// }

// // NOTE: The entire performPdfOcr function has been removed from this file.
// // It is now correctly imported from ocrService.js.

// const app = express();
// const upload = multer({ dest: "backend/uploads/" });

// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "../frontend/views"));
// app.use(express.static(path.join(__dirname, "../frontend/public")));

// app.get("/", async (req, res) => {
//   try {
//     const claims = await pool.query(
//       'SELECT * FROM "claims" ORDER BY "created_at" DESC'
//     );
//     res.render("index", { claims: claims.rows });
//   } catch (err) {
//     console.error("Error fetching claims:", err);
//     res.status(500).send("Could not fetch claims from database.");
//   }
// });
// const analysisRes = await fetch("http://localhost:5001/analyze", {
//   method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify({
//     lat: claim.latitude,
//     lon: claim.longitude,
//     radius_m: 200,
//   }),
// });

// const analysisJson = await analysisRes.json();
// await pool.query(
//   `UPDATE "claims" SET analysis = $1 WHERE id = $2`,
//   [analysisJson, claim.id]
// );

// app.get("/claim/:id", async (req, res) => {
//   try {
//     const id = req.params.id;
//     const r = await pool.query('SELECT * FROM "claims" WHERE id=$1', [id]);
//     if (!r.rows.length) return res.status(404).send("Not found");
//     res.json(r.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("DB error");
//   }
// });

// app.get("/claim-page/:id", async (req, res) => {
//   try {
//     const { rows } = await pool.query(
//       'SELECT * FROM "claims" WHERE id=$1',
//       [req.params.id]
//     );
//     if (!rows.length) return res.status(404).send("Not found");

//     const claim = rows[0];
//     if (claim.analysis && typeof claim.analysis === "string") {
//       try {
//         claim.analysis = JSON.parse(claim.analysis);
//       } catch (e) {
//         console.error("Failed to parse analysis JSON:", e);
//         claim.analysis = null;
//       }
//     }

//     res.render("claim", { claim });
//   } catch (err) {
//     console.error("Error loading claim page:", err);
//     res.status(500).send("Failed to load claim details");
//   }
// });

// app.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).send("No file uploaded");

//     console.log("--- New Upload Request ---");

//     // OCR text - Now using the imported function
//     const ocrText = await performPdfOcr(req.file.path);

//     // Extract entities
//     const { name, village, district, state } = extractEntities(ocrText);

//     // Geocode
//     let latitude = null;
//     let longitude = null;
//     const geo = await geocodeAddress(village, district, state);
//     if (geo) {
//       latitude = geo.latitude;
//       longitude = geo.longitude;
//       console.log(`📍 Geocoded => ${latitude}, ${longitude}`);
//     }

//     // Save to DB
//     const result = await pool.query(
//       `INSERT INTO "claims"
//         ("filename", "ocr_text", "name", "village", "district", "state", "latitude", "longitude", "created_at")
//         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
//       [
//         req.file.originalname,
//         ocrText,
//         name,
//         [village],
//         district,
//         state,
//         latitude,
//         longitude,
//       ]
//     );

//     const claim = result.rows[0];

//     if (claim.latitude && claim.longitude) {
//       try {
//         const analysisRes = await fetch("http://localhost:5001/analyze", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             lat: claim.latitude,
//             lon: claim.longitude,
//             radius_m: 200,
//           }),
//         });

//         const analysisJson = await analysisRes.json();
//         await pool.query(
//           `UPDATE "claims" SET analysis = $1 WHERE id = $2`,
//           [analysisJson, claim.id]
//         );
//       } catch (err) {
//         console.error("Error calling Python API:", err);
//       }
//     }

//     res.redirect("/");
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).send("File processing failed");
//   }
// });

// app.listen(5000, () => {
//   console.log("🚀 Server running on http://localhost:5000");
// });
import express from "express";
import multer from "multer";
import { fileURLToPath } from "url";
import path from "path";
import fetch from "node-fetch";

import pool from "./config/db.js";
import { extractEntities } from "./utils/extractEntities.js";
import { performPdfOcr } from "./ocr/ocrService.js";

// -------------------------
// CONFIG
// -------------------------
const OPENCAGE_API_KEY = "9bc54a47df1949e6ad2c1deb9f925d16"; // Replace with your key

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ESA_CLASS_MAP = {
  10: "Tree cover / Forest",
  20: "Shrubland",
  30: "Grassland",
  40: "Cropland",
  50: "Built-up / Settlement",
  60: "Bare / Sparse vegetation",
  80: "Permanent water",
  90: "Herbaceous Wetland",
  95: "Mangroves",
  100: "Snow/Ice or Moss/Lichen",
};

// -------------------------
// Geocoding helper
// -------------------------
async function geocodeAddress(village, district, state) {
  try {
    const query = `${village}, ${district}, ${state}, India`;
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
      query
    )}&key=${OPENCAGE_API_KEY}&limit=1`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry;
      return { latitude: lat, longitude: lng };
    }
    return null;
  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
}

const app = express();
const upload = multer({ dest: "backend/uploads/" });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));
app.use(express.static(path.join(__dirname, "../frontend/public")));

// -------------------------
// ROUTES
// -------------------------
app.get("/", async (req, res) => {
  try {
    const claims = await pool.query(
      'SELECT * FROM "claims" ORDER BY "created_at" DESC'
    );
    res.render("index", { claims: claims.rows });
  } catch (err) {
    console.error("Error fetching claims:", err);
    res.status(500).send("Could not fetch claims from database.");
  }
});

app.get("/claim/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const r = await pool.query('SELECT * FROM "claims" WHERE id=$1', [id]);
    if (!r.rows.length) return res.status(404).send("Not found");
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

app.get("/claim-page/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM "claims" WHERE id=$1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).send("Not found");

    const claim = rows[0];
    if (claim.analysis && typeof claim.analysis === "string") {
      try {
        claim.analysis = JSON.parse(claim.analysis);
      } catch (e) {
        console.error("Failed to parse analysis JSON:", e);
        claim.analysis = null;
      }
    }

    res.render("claim", { claim });
  } catch (err) {
    console.error("Error loading claim page:", err);
    res.status(500).send("Failed to load claim details");
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");

    console.log("--- New Upload Request ---");

    // OCR text
    const ocrText = await performPdfOcr(req.file.path);

    // Extract entities
    const { name, village, district, state } = extractEntities(ocrText);

    // Geocode
    let latitude = null;
    let longitude = null;
    const geo = await geocodeAddress(village, district, state);
    if (geo) {
      latitude = geo.latitude;
      longitude = geo.longitude;
      console.log(`📍 Geocoded => ${latitude}, ${longitude}`);
    }

    // Save to DB
    const result = await pool.query(
      `INSERT INTO "claims"
        ("filename", "ocr_text", "name", "village", "district", "state", "latitude", "longitude", "created_at")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
      [
        req.file.originalname,
        ocrText,
        name,
        [village],
        district,
        state,
        latitude,
        longitude,
      ]
    );

    const claim = result.rows[0];

    // Call Python GEE API if coordinates exist
    if (claim.latitude && claim.longitude) {
      try {
        const analysisRes = await fetch("http://localhost:5001/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: claim.latitude,
            lon: claim.longitude,
            radius_m: 200,
          }),
        });

        let analysisJson = await analysisRes.json();

        // ✅ Normalize for frontend (classes[], total_area_ha, etc.)
        const classes = (analysisJson.classes || []).map((c) => ({
          class_code: c.class_code,
          class_name: ESA_CLASS_MAP[c.class_code] || c.class_name,
          area_ha: c.area_ha,
          percent: c.percent,
        }));

        analysisJson = {
          total_area_ha: analysisJson.total_area_ha,
          mean_elevation_m: analysisJson.mean_elevation_m,
          mean_slope_deg: analysisJson.mean_slope_deg,
          buffer_radius_m: analysisJson.buffer_radius_m,
          classes,
        };

        await pool.query(
  `UPDATE "claims" SET analysis = $1 WHERE id = $2`,
  [JSON.stringify(analysisJson), claim.id]
);

      } catch (err) {
        console.error("Error calling Python API:", err);
      }
    }

    res.redirect("/");
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).send("File processing failed");
  }
});

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
