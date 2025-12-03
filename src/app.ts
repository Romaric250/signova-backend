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

  // Middleware - CORS configuration
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) {
        return callback(null, true);
      }

      // In development, allow common localhost origins
      if (env.NODE_ENV === 'development') {
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:8081', // Expo web
          'http://localhost:19006', // Expo web alternative
          'http://127.0.0.1:3000',
          'http://127.0.0.1:8081',
          env.FRONTEND_URL,
        ];
        
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
      }

      // In production, only allow configured frontend URL
      if (origin === env.FRONTEND_URL) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(cors(corsOptions));

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

