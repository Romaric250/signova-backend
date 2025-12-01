// src/app.ts
import express, { Express } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth";
import { uploadRouter } from "./config/uploadthing";
import { createRouteHandler } from "uploadthing/express";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";
import { env } from "./config/env";
import logger from "./utils/logger";

export const createApp = (): Express => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }));

  // Better Auth handler - must be before express.json() for Express v4
  // This handles Bearer token authentication automatically for mobile apps
  app.all("/api/auth/better-auth/*", toNodeHandler(auth));

  // Express JSON middleware (after Better Auth handler)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // UploadThing routes
  app.use(
    "/api/uploadthing",
    createRouteHandler({
      router: uploadRouter,
    })
  );

  // API routes
  app.use("/api", routes);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  logger.info("Express app initialized");

  return app;
};

