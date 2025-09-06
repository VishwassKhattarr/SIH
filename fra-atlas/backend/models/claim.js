import pool from "../config/db.js";

export const saveClaim = async (text, villages, coords) => {
  const result = await pool.query(
    "INSERT INTO claims (raw_text, villages, coordinates) VALUES ($1, $2, $3) RETURNING *",
    [text, JSON.stringify(villages), JSON.stringify(coords)]
  );
  return result.rows[0];
};

export const getClaims = async () => {
  const result = await pool.query("SELECT * FROM claims ORDER BY id DESC");
  return result.rows;
};
