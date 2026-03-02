// src/routes/feedback.routes.ts
import { Router } from "express";
import { createFeedback, getMyFeedback } from "../controllers/feedback.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", getMyFeedback);
router.post("/", createFeedback);

export default router;
