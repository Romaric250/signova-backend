// src/routes/index.ts
import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import signsRoutes from "./signs.routes";
import translateRoutes from "./translate.routes";
import progressRoutes from "./progress.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/signs", signsRoutes);
router.use("/translate", translateRoutes);
router.use("/progress", progressRoutes);
router.use("/upload", uploadRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;

