// src/controllers/translate.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { transcribeAudio } from "../services/transcription.service";
import { textToSign } from "../services/translation.service";
import { BadRequestError } from "../utils/errors";
import logger from "../utils/logger";

export const transcribe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new BadRequestError("User not found");
    }

    if (!req.file) {
      throw new BadRequestError("No audio file provided");
    }

    const audioBuffer = req.file.buffer;
    const transcribedText = await transcribeAudio(audioBuffer);

    // Save translation history
    await prisma.translation.create({
      data: {
        userId: req.user.id,
        inputText: transcribedText,
        inputType: "speech",
        language: "ASL", // Default, can be made configurable
      },
    });

    logger.info(`Audio transcribed for user ${req.user.id}`);

    res.json({
      text: transcribedText,
    });
  } catch (error) {
    next(error);
  }
};

export const textToSignTranslation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new BadRequestError("User not found");
    }

    const { text, language = "ASL" } = req.body;

    if (!text) {
      throw new BadRequestError("Text is required");
    }

    const result = await textToSign(text, language);

    // Save translation history
    await prisma.translation.create({
      data: {
        userId: req.user.id,
        inputText: text,
        inputType: "text",
        language,
      },
    });

    logger.info(`Text translated to signs for user ${req.user.id}`);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getTranslationHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new BadRequestError("User not found");
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [translations, total] = await Promise.all([
      prisma.translation.findMany({
        where: {
          userId: req.user.id,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.translation.count({
        where: {
          userId: req.user.id,
        },
      }),
    ]);

    res.json({
      translations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

