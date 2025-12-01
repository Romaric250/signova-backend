// src/types/sign.types.ts
export type SignLanguage = "ASL" | "BSL" | "ISL" | "LSF" | "GSL";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Sign {
  id: string;
  word: string;
  language: SignLanguage;
  category: string;
  difficulty: Difficulty;
  videoUrl: string;
  thumbnail: string;
  description?: string;
  relatedSigns?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSignRequest {
  word: string;
  language: SignLanguage;
  category: string;
  difficulty: Difficulty;
  videoUrl: string;
  thumbnail: string;
  description?: string;
  relatedSigns?: string[];
}

export interface SignQueryParams {
  language?: SignLanguage;
  category?: string;
  difficulty?: Difficulty;
  search?: string;
  page?: number;
  limit?: number;
}

