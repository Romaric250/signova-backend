// src/routes/groups.routes.ts
import { Router } from "express";
import multer from "multer";
import {
  createGroup,
  joinGroup,
  getMyGroups,
  getGroupById,
  getGroupByInviteCode,
  getGroupMessages,
  sendMessage,
  sendVoiceMessage,
  updateGroup,
  deleteGroup,
  leaveGroup,
} from "../controllers/groups.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateAudioFile } from "../middleware/upload.middleware";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Public: get group info by invite code (for join modal)
router.get("/by-invite/:code", getGroupByInviteCode);

router.use(requireAuth);

router.post("/", createGroup);
router.post("/join", joinGroup);
router.get("/", getMyGroups);
router.get("/:id", getGroupById);
router.get("/:id/messages", getGroupMessages);
router.post("/:id/messages", sendMessage);
router.post("/:id/messages/voice", upload.single("audio"), validateAudioFile, sendVoiceMessage);
router.patch("/:id", updateGroup);
router.delete("/:id", deleteGroup);
router.post("/:id/leave", leaveGroup);

export default router;
