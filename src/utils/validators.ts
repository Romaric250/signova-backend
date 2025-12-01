// src/utils/validators.ts
import { z } from "zod";

// Auth validators
export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// User validators
export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().url().optional(),
});

export const updatePreferencesSchema = z.object({
  language: z.enum(["ASL", "BSL", "ISL", "LSF", "GSL"]).optional(),
  avatarSpeed: z.number().min(0.5).max(2.0).optional(),
  theme: z.enum(["light", "dark"]).optional(),
});

// Sign validators
export const createSignSchema = z.object({
  word: z.string().min(1, "Word is required"),
  language: z.enum(["ASL", "BSL", "ISL", "LSF", "GSL"]),
  category: z.string().min(1, "Category is required"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  videoUrl: z.string().url("Invalid video URL"),
  thumbnail: z.string().url("Invalid thumbnail URL"),
  description: z.string().optional(),
  relatedSigns: z.array(z.string()).optional(),
});

export const updateSignSchema = createSignSchema.partial();

export const signQuerySchema = z.object({
  language: z.enum(["ASL", "BSL", "ISL", "LSF", "GSL"]).optional(),
  category: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  search: z.string().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
});

// Translation validators
export const transcribeSchema = z.object({
  audio: z.instanceof(Buffer).optional(),
});

export const textToSignSchema = z.object({
  text: z.string().min(1, "Text is required"),
  language: z.enum(["ASL", "BSL", "ISL", "LSF", "GSL"]).default("ASL"),
});

// Progress validators
export const updateProgressSchema = z.object({
  signsLearned: z.number().int().min(0).optional(),
  practiceTime: z.number().int().min(0).optional(),
  streak: z.number().int().min(0).optional(),
});

