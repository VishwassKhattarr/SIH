import pool from "../db.js";
// Correctly import 'performOCR' from the ocrService.
import { performOCR } from "../ocr/ocrService.js";

// handle file upload + OCR + DB insert
export const uploadClaim = async (req, res) => {
    console.log("\n[Controller] Received a new file upload request.");
  try {
    // Check if a file was actually uploaded.
    if (!req.file) {
        console.error("[Controller] No file was included in the request.");
        return res.status(400).send("No file uploaded.");
    }

    const filePath = req.file.path;
    const filename = req.file.filename;

    console.log(`[Controller] File details: Original Name='${req.file.originalname}', Saved As='${filename}', Path='${filePath}'`);
    console.log(`[Controller] Handing off to OCR Service...`);

    // Call the correct OCR function: performOCR
    const text = await performOCR(filePath);

    console.log(`[Controller] OCR successful. Extracted text length: ${text.length}`);

    // yahan simple demo extraction (regex/NER later add karenge)
    const name = "Unknown";
    const village = "Bastar";
    const district = "Bastar";
    const state = "Chhattisgarh";
    console.log("[Controller] Extracted entities (demo):", { name, village, district, state });

    // insert query
    console.log("[Controller] Preparing to insert data into the database...");
    const insertQuery = `
      INSERT INTO claims (filename, ocr_text, name, village, district, state, latitude, longitude)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *;
    `;

    const values = [
      filename,
      text,
      name,
      village,
      district,
      state,
      null,  // latitude
      null   // longitude
    ];

    const result = await pool.query(insertQuery, values);
    console.log(`[Controller] Database insert successful. New claim ID: ${result.rows[0].id}`);

    // Assuming you have a view named 'result.ejs' to display the final data
    res.render("result", { claim: result.rows[0] });

  } catch (err) {
    console.error("[Controller] An error occurred in the uploadClaim process:", err);
    res.status(500).send("Error processing your claim. Please check the server logs for details.");
  }
};