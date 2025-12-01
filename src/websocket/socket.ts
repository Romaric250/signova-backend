// src/websocket/socket.ts
import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupTranscribeHandler } from "./handlers/transcribe.handler";
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

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const session = await auth.api.getSession({
        headers: socket.handshake.headers,
      });

      if (!session || !session.user) {
        return next(new Error("Unauthorized"));
      }

      // Attach user info to socket
      (socket as any).user = session.user;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user;
    logger.info(`Client connected: ${socket.id} (User: ${user?.email})`);

    // Setup transcription handler
    setupTranscribeHandler(io, socket);
  });

  return io;
};

