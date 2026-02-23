// src/routes/upload.routes.ts
import { Router } from "express";
import multer from "multer";
import {
  uploadAvatar,
  uploadSignVideo,
  uploadCourseThumbnail,
  uploadLessonVideo,
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
router.post(
  "/course-thumbnail",
  upload.single("image"),
  validateFileUpload,
  uploadCourseThumbnail
);
router.post(
  "/lesson-video",
  upload.single("video"),
  validateFileUpload,
  uploadLessonVideo
);

export default router;

