// src/routes/index.ts
import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import signsRoutes from "./signs.routes";
import translateRoutes from "./translate.routes";
import transcriptsRoutes from "./transcripts.routes";
import notesRoutes from "./notes.routes";
import groupsRoutes from "./groups.routes";
import chatsRoutes from "./chats.routes";
import learningRoutes from "./learning.routes";
import adminRoutes from "./admin.routes";
import progressRoutes from "./progress.routes";
import feedbackRoutes from "./feedback.routes";
import uploadRoutes from "./upload.routes";
import plansRoutes from "./plans.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/signs", signsRoutes);
router.use("/translate", translateRoutes);
router.use("/transcripts", transcriptsRoutes);
router.use("/notes", notesRoutes);
router.use("/groups", groupsRoutes);
router.use("/chats", chatsRoutes);
router.use("/learning", learningRoutes);
router.use("/admin", adminRoutes);
router.use("/progress", progressRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/upload", uploadRoutes);
router.use("/plans", plansRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;

