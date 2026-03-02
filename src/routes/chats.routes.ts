// src/routes/chats.routes.ts
import { Router } from "express";
import {
  getMyChats,
  searchUsers,
  getOrCreateChat,
  getChatById,
  getChatMessages,
  sendChatMessage,
  sendVoiceMessage,
  updateChatMessage,
  deleteChatMessage,
} from "../controllers/chats.controller";
import { requireAuth } from "../middleware/auth.middleware";
import multer from "multer";
import { validateAudioFile } from "../middleware/upload.middleware";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.use(requireAuth);

router.get("/", getMyChats);
router.get("/search-users", searchUsers);
router.post("/with/:userId", getOrCreateChat);
router.get("/:id", getChatById);
router.get("/:id/messages", getChatMessages);
router.post("/:id/messages", sendChatMessage);
router.post("/:id/messages/voice", upload.single("audio"), validateAudioFile, sendVoiceMessage);
router.patch("/:id/messages/:messageId", updateChatMessage);
router.delete("/:id/messages/:messageId", deleteChatMessage);

export default router;
