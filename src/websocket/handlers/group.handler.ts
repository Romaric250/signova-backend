// src/websocket/handlers/group.handler.ts
import { Server, Socket } from "socket.io";
import { prisma } from "../../config/database";
import logger from "../../utils/logger";

export const setupGroupHandler = (io: Server, socket: Socket) => {
  socket.on("group:join", async (groupId: string) => {
    try {
      const user = (socket as any).user;
      if (!user?.id) return;

      const membership = await prisma.groupMember.findFirst({
        where: { groupId, userId: user.id },
      });

      if (!membership) {
        socket.emit("group:error", { message: "Not a member of this group" });
        return;
      }

      socket.join(`group:${groupId}`);
      logger.info(`User ${user.email} joined group ${groupId}`);
    } catch (error) {
      logger.error("Group join error:", error);
      socket.emit("group:error", { message: "Failed to join group" });
    }
  });

  socket.on("group:leave", (groupId: string) => {
    socket.leave(`group:${groupId}`);
  });
};

export const emitGroupMessage = (io: Server, groupId: string, message: any) => {
  io.to(`group:${groupId}`).emit("group:message", message);
};
