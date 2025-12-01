// src/websocket/handlers/transcribe.handler.ts
import { Server, Socket } from "socket.io";
import { transcribeAudio } from "../../services/transcription.service";
import logger from "../../utils/logger";

export const setupTranscribeHandler = (io: Server, socket: Socket) => {
  socket.on("transcribe:start", () => {
    logger.info(`Transcription session started: ${socket.id}`);
    socket.emit("transcribe:ready");
  });

  socket.on("transcribe:audio", async (audioChunk: ArrayBuffer) => {
    try {
      // Convert ArrayBuffer to Buffer
      const buffer = Buffer.from(audioChunk);
      
      // Transcribe the audio chunk
      const text = await transcribeAudio(buffer);
      
      socket.emit("transcribe:result", { text });
    } catch (error) {
      logger.error("Transcription error:", error);
      socket.emit("transcribe:error", {
        message: "Failed to transcribe audio",
      });
    }
  });

  socket.on("transcribe:stop", () => {
    logger.info(`Transcription session stopped: ${socket.id}`);
    socket.emit("transcribe:stopped");
  });

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
};

