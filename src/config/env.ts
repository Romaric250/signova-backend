// src/config/env.ts
import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",
  
  // Better Auth
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  
  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  
  // UploadThing
  UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN || "",
  
  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  // Keep-alive cron (pings health endpoint to prevent Render hibernation)
  // Use base URL (e.g. https://your-app.onrender.com/) or include /api
  SERVER_URL: process.env.SERVER_URL || "https://signova-v1-backend.onrender.com",

  // Resend (email)
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "SignNova <noreply@signnova.com>",
};

// Validate required environment variables
const requiredEnvVars = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "OPENAI_API_KEY",
  "UPLOADTHING_TOKEN",
];

if (env.NODE_ENV === "production") {
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
}

