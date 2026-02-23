// src/routes/transcripts.routes.ts
import { Router } from "express";
import { getTranscripts, getTranscriptById } from "../controllers/transcripts.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", getTranscripts);
router.get("/:id", getTranscriptById);

export default router;
