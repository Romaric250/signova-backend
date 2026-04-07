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
            "You are a professional editor. Fix grammar and spelling, improve clarity, and organize the text into clear paragraphs (use blank lines between paragraphs). Preserve the speaker's meaning. For spoken or messy transcripts, turn them into coherent prose. Return only the improved text, no preamble or quotes.",
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
