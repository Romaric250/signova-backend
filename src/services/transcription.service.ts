// src/services/transcription.service.ts
import OpenAI from "openai";
import { env } from "../config/env";
import { InternalServerError } from "../utils/errors";
import logger from "../utils/logger";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const transcribeAudio = async (audioBuffer: Buffer): Promise<string> => {
  try {
    const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "en",
    });

    return transcription.text;
  } catch (error) {
    logger.error("Transcription error:", error);
    throw new InternalServerError("Failed to transcribe audio");
  }
};

export const transcribeAudioStream = async (
  audioStream: ReadableStream
): Promise<string> => {
  try {
    const chunks: Uint8Array[] = [];
    const reader = audioStream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const audioBuffer = Buffer.concat(chunks);
    return await transcribeAudio(audioBuffer);
  } catch (error) {
    logger.error("Stream transcription error:", error);
    throw new InternalServerError("Failed to transcribe audio stream");
  }
};

