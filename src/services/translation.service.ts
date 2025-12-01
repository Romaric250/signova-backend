// src/services/translation.service.ts
import { prisma } from "../config/database";
import { SignLanguage } from "../types/sign.types";
import { NotFoundError } from "../utils/errors";

export const textToSign = async (
  text: string,
  language: SignLanguage = "ASL"
): Promise<{
  text: string;
  signs: Array<{
    id: string;
    word: string;
    videoUrl: string;
    thumbnail: string;
  }>;
}> => {
  // Split text into words
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^\w]/g, ""))
    .filter((word) => word.length > 0);

  // Find matching signs in the database
  const signs = await prisma.sign.findMany({
    where: {
      language,
      word: {
        in: words,
      },
    },
    select: {
      id: true,
      word: true,
      videoUrl: true,
      thumbnail: true,
    },
  });

  // Create a map for quick lookup
  const signMap = new Map(signs.map((sign) => [sign.word.toLowerCase(), sign]));

  // Match words to signs
  const matchedSigns = words
    .map((word) => signMap.get(word))
    .filter((sign): sign is NonNullable<typeof sign> => sign !== undefined);

  return {
    text,
    signs: matchedSigns,
  };
};

export const getSignById = async (signId: string) => {
  const sign = await prisma.sign.findUnique({
    where: { id: signId },
  });

  if (!sign) {
    throw new NotFoundError("Sign not found");
  }

  return sign;
};

