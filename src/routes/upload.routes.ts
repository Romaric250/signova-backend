// src/routes/upload.routes.ts
import { Router } from "express";
import multer from "multer";
import {
  uploadAvatar,
  uploadSignVideo,
} from "../controllers/upload.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateFileUpload } from "../middleware/upload.middleware";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB limit
  },
});

// All upload routes require authentication
router.use(requireAuth);

router.post(
  "/avatar",
  upload.single("avatar"),
  validateFileUpload,
  uploadAvatar
);
router.post(
  "/sign-video",
  upload.single("video"),
  validateFileUpload,
  uploadSignVideo
);

export default router;

