// src/routes/notes.routes.ts
import { Router } from "express";
import multer from "multer";
import {
  createNote,
  createNoteFromRecording,
  addRecordingToNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from "../controllers/notes.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateAudioFile } from "../middleware/upload.middleware";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.use(requireAuth);

router.post("/", createNote);
router.post("/from-recording", upload.single("audio"), validateAudioFile, createNoteFromRecording);
router.get("/", getNotes);
router.get("/:id", getNoteById);
router.post("/:id/from-recording", upload.single("audio"), validateAudioFile, addRecordingToNote);
router.patch("/:id", updateNote);
router.delete("/:id", deleteNote);

export default router;
