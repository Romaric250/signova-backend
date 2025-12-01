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
  UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET || "",
  UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID || "",
  
  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};

// Validate required environment variables
const requiredEnvVars = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "OPENAI_API_KEY",
  "UPLOADTHING_SECRET",
];

if (env.NODE_ENV === "production") {
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
}

