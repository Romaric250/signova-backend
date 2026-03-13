// src/server.ts
import http from "http";
import cron from "node-cron";
import { createApp } from "./app";
import { initializeSocket } from "./websocket/socket";
import { setIO } from "./websocket/emitter";
import { env } from "./config/env";
import logger from "./utils/logger";
import { prisma } from "./config/database";

const app = createApp();
const httpServer = http.createServer(app);

const io = initializeSocket(httpServer);
setIO(io);

const startKeepAliveCron = () => {
  const baseUrl = env.SERVER_URL || `http://localhost:${env.PORT}`;
  const healthUrl = baseUrl.includes("/api")
    ? `${baseUrl.replace(/\/$/, "")}/health`
    : `${baseUrl.replace(/\/$/, "")}/api/health`;
  cron.schedule("*/10 * * * *", async () => {
    try {
      const res = await fetch(healthUrl);
      logger.info(`Keep-alive ping: ${res.status}`);
    } catch (err) {
      logger.warn("Keep-alive ping failed:", err);
    }
  });
  logger.info(`Keep-alive cron: pinging ${healthUrl} every 10 minutes`);
};

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
  startKeepAliveCron();
});

export { io };

