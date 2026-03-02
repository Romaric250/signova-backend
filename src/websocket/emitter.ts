// src/websocket/emitter.ts
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export const setIO = (socketServer: SocketIOServer) => {
  io = socketServer;
};

export const getIO = () => io;

export const emitGroupMessage = (groupId: string, message: any) => {
  if (io) {
    io.to(`group:${groupId}`).emit("group:message", message);
  }
};

export const emitChatMessage = (chatId: string, message: any) => {
  if (io) {
    io.to(`chat:${chatId}`).emit("chat:message", message);
  }
};
