// src/routes/user.routes.ts
import { Router } from "express";
import {
  getCurrentUser,
  updateProfile,
  updatePreferences,
} from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  updateProfileSchema,
  updatePreferencesSchema,
} from "../utils/validators";

const router = Router();

// All user routes require authentication
router.use(requireAuth);

router.get("/me", getCurrentUser);
router.patch("/me", validate(updateProfileSchema), updateProfile);
router.patch("/preferences", validate(updatePreferencesSchema), updatePreferences);

export default router;

