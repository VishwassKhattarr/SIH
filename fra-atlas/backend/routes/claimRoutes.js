import express from "express";
import multer from "multer";
import { uploadClaim } from "../controllers/claimController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), uploadClaim);

export default router;
