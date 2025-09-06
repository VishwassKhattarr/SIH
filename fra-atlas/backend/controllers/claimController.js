import pool from "../db.js";
import { extractText } from "../services/ocrService.js";

// handle file upload + OCR + DB insert
export const uploadClaim = async (req, res) => {
  try {
    const filePath = req.file.path;   // multer se file mil rahi hai
    const filename = req.file.filename;

    // OCR se text nikalna
    const text = await extractText(filePath);

    // yahan simple demo extraction (regex/NER later add karenge)
    const name = "Unknown"; 
    const village = "Bastar"; 
    const district = "Bastar";
    const state = "Chhattisgarh";

    // insert query
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
      null,  // latitude
      null   // longitude
    ];

    const result = await pool.query(insertQuery, values);

    res.render("claim", { claim: result.rows[0] });
  } catch (err) {
    console.error("Error uploading claim:", err);
    res.status(500).send("Error processing claim");
  }
};
