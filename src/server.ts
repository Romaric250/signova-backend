// src/server.ts
import http from "http";
import { createApp } from "./app";
import { initializeSocket } from "./websocket/socket";
import { env } from "./config/env";
import logger from "./utils/logger";
import { prisma } from "./config/database";

const app = createApp();
const httpServer = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(httpServer);

// Graceful shutdown
const shutdown = async () => {
  logger.info("Shutting down server...");
  
  httpServer.close(() => {
    logger.info("HTTP server closed");
  });

  io.close(() => {
    logger.info("Socket.io server closed");
  });

  await prisma.$disconnect();
  logger.info("Database disconnected");
  
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start server
const PORT = env.PORT;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`Frontend URL: ${env.FRONTEND_URL}`);
});

export { io };

