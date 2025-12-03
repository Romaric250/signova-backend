// src/config/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";
import { prisma } from "./database";
import { env } from "./env";
import { ObjectId } from "mongodb";

// Generate valid MongoDB ObjectID for Better Auth
const generateObjectId = () => {
  return new ObjectId().toString();
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mongodb",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set true for production
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [
    bearer(), // Enable Bearer token authentication for mobile apps
  ],
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  advanced: {
    database: {
      // Generate valid MongoDB ObjectIDs for all models
      generateId: generateObjectId,
    },
  },
});

export type Session = typeof auth.$Infer.Session;

