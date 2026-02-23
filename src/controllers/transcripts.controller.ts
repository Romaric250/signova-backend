// src/controllers/transcripts.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { BadRequestError, NotFoundError } from "../utils/errors";

export const getTranscripts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const [transcripts, total] = await Promise.all([
      prisma.transcript.findMany({
        where: { userId: req.user.id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.transcript.count({ where: { userId: req.user.id } }),
    ]);

    res.json({
      success: true,
      data: transcripts,
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

export const getTranscriptById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id } = req.params;

    const transcript = await prisma.transcript.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!transcript) throw new NotFoundError("Transcript not found");

    res.json({
      success: true,
      data: transcript,
    });
  } catch (error) {
    next(error);
  }
};
