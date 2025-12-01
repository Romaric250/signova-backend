// src/routes/translate.routes.ts
import { Router } from "express";
import multer from "multer";
import {
  transcribe,
  textToSignTranslation,
  getTranslationHistory,
} from "../controllers/translate.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { validateAudioFile } from "../middleware/upload.middleware";
import { textToSignSchema } from "../utils/validators";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
});

// All translation routes require authentication
router.use(requireAuth);

router.post(
  "/transcribe",
  upload.single("audio"),
  validateAudioFile,
  transcribe
);
router.post("/text-to-sign", validate(textToSignSchema), textToSignTranslation);
router.get("/history", getTranslationHistory);

export default router;

