import Tesseract from "tesseract.js";
import fs from "fs";

export const extractTextFromPDF = async (filePath) => {
  const image = fs.readFileSync(filePath);
  const { data: { text } } = await Tesseract.recognize(image, "hin+eng");
  return text;
};
