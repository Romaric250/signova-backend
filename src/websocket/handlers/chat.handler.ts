// src/websocket/handlers/chat.handler.ts
import { Server, Socket } from "socket.io";
import { prisma } from "../../config/database";
import logger from "../../utils/logger";

export const setupChatHandler = (io: Server, socket: Socket) => {
  socket.on("chat:join", async (chatId: string) => {
    try {
      const user = (socket as any).user;
      if (!user?.id) return;

      const participant = await prisma.chatParticipant.findFirst({
        where: { chatId, userId: user.id },
      });

      if (!participant) {
        socket.emit("chat:error", { message: "Not a participant of this chat" });
        return;
      }

      socket.join(`chat:${chatId}`);
      logger.info(`User ${user.email} joined chat ${chatId}`);
    } catch (error) {
      logger.error("Chat join error:", error);
      socket.emit("chat:error", { message: "Failed to join chat" });
    }
  });

  socket.on("chat:leave", (chatId: string) => {
    socket.leave(`chat:${chatId}`);
  });
};
