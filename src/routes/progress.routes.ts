// src/routes/progress.routes.ts
import { Router } from "express";
import {
  getProgress,
  updateProgress,
  updateStreak,
  getAchievements,
} from "../controllers/progress.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { updateProgressSchema } from "../utils/validators";

const router = Router();

// All progress routes require authentication
router.use(requireAuth);

router.get("/", getProgress);
router.post("/update", validate(updateProgressSchema), updateProgress);
router.post("/streak", updateStreak);
router.get("/achievements", getAchievements);

export default router;

