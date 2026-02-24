// src/cron/keepAlive.ts
import cron from "node-cron";
import { env } from "../config/env";
import logger from "../utils/logger";

export function startKeepAliveCron() {
  // Run every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    try {
      const res = await fetch(`${env.SERVER_URL}/health`);
      if (res.ok) {
        logger.info(
          `[Keep-Alive] Health check OK at ${new Date().toISOString()}`
        );
      } else {
        logger.warn(`[Keep-Alive] Health check returned ${res.status}`);
      }
    } catch (err) {
      logger.error("[Keep-Alive] Failed to ping health endpoint", err);
    }
  });

  logger.info("Keep-alive cron started (every 10 minutes)");
}
