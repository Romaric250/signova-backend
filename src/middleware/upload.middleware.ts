// src/middleware/upload.middleware.ts
import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../utils/errors";

export const validateFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file && !req.files) {
    return next(new BadRequestError("No file uploaded"));
  }

  // Additional validation can be added here
  // e.g., file type, size checks
  
  next();
};

export const validateAudioFile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return next(new BadRequestError("No audio file uploaded"));
  }

  const allowedMimeTypes = [
    "audio/webm",
    "audio/mp3",
    "audio/wav",
    "audio/mpeg",
    "audio/m4a", // iOS default recording format
    "audio/aac", // Android sometimes uses this
    "audio/3gpp", // Android older format
    "audio/ogg",
    "audio/flac",
    "audio/x-m4a", // Alternative MIME type for m4a
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return next(
      new BadRequestError(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`
      )
    );
  }

  // Max file size: 25MB (Whisper API limit)
  const maxSize = 25 * 1024 * 1024;
  if (req.file.size > maxSize) {
    return next(new BadRequestError("File size exceeds 25MB limit"));
  }

  next();
};

