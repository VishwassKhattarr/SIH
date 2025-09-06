import express from "express";
import multer from "multer";
import { createWorker } from "tesseract.js";
import pool from "./config/db.js";
import { extractEntities } from "./utils/extractEntities.js";

const app = express();
const upload = multer({ dest: "backend/uploads/" });

app.set("view engine", "ejs");
app.set("views", "../frontend/views");

// Serve static files (CSS, JS, images)
app.use(express.static("frontend/public"));

// Home route
app.get("/", async (req, res) => {
  const claims = await pool.query("SELECT * FROM claims ORDER BY created_at DESC");
  res.render("index", { claims: claims.rows });
});

// Upload route
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("Running OCR on:", req.file.path);

    const worker = await createWorker("eng+hin");
    const {
      data: { text: ocrText }
    } = await worker.recognize(req.file.path);
    await worker.terminate();

    // Extract structured data
    const { name, village, district, state } = extractEntities(ocrText);

    // Save in DB
    const result = await pool.query(
      `INSERT INTO claims 
       (filename, ocr_text, name, village, district, state, latitude, longitude, created_at) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
      [
        req.file.originalname, // filename
        ocrText,               // ocr_text
        name,
        village,
        district,
        state,
        null, // latitude
        null  // longitude
      ]
    );

    res.redirect("/");
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).send("OCR processing failed");
  }
});

// Start server
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
