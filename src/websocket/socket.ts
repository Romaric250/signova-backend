// src/websocket/socket.ts
import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupTranscribeHandler } from "./handlers/transcribe.handler";
import { setupGroupHandler } from "./handlers/group.handler";
import { setupChatHandler } from "./handlers/chat.handler";
import { auth } from "../config/auth";
import logger from "../utils/logger";
import { env } from "../config/env";

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware for Socket.io (supports Bearer token from auth object)
  io.use(async (socket, next) => {
    try {
      const token = (socket.handshake.auth as any)?.token;
      const headers: Record<string, string> = { ...socket.handshake.headers } as any;
      if (token) {
        headers.authorization = `Bearer ${token}`;
      }
      const session = await auth.api.getSession({ headers });

      if (!session || !session.user) {
        return next(new Error("Unauthorized"));
      }

      (socket as any).user = session.user;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user;
    logger.info(`Client connected: ${socket.id} (User: ${user?.email})`);

    setupTranscribeHandler(io, socket);
    setupGroupHandler(io, socket);
    setupChatHandler(io, socket);
  });

  return io;
};

