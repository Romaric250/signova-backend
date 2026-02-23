// src/services/text-processing.service.ts
import OpenAI from "openai";
import { env } from "../config/env";
import { InternalServerError } from "../utils/errors";
import logger from "../utils/logger";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

/**
 * Rearranges and improves text: corrects grammar, improves consistency, makes it coherent.
 */
export const rearrangeText = async (rawText: string): Promise<string> => {
  if (!rawText?.trim()) return rawText;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful editor. Fix grammar, improve clarity, and ensure the text flows well. Preserve the original meaning and structure. Return only the corrected text, no explanations.",
        },
        {
          role: "user",
          content: rawText,
        },
      ],
      temperature: 0.3,
    });

    const result = response.choices[0]?.message?.content?.trim();
    return result || rawText;
  } catch (error) {
    logger.error("Text rearrangement error:", error);
    throw new InternalServerError("Failed to process text");
  }
};
