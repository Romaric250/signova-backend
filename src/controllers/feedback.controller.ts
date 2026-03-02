// src/controllers/feedback.controller.ts
import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { BadRequestError } from "../utils/errors";

export const createFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const {
      type,
      category,
      rating,
      content,
      metadata,
      usageFrequency,
      device,
      experience,
      improvements,
      otherComments,
    } = req.body;

    const validTypes = ["rating", "feature", "question", "general", "bug", "suggestion"];
    if (!type || !validTypes.includes(type)) {
      throw new BadRequestError("type must be one of: rating, feature, question, general, bug, suggestion");
    }

    if (type === "rating" && (rating == null || rating < 1 || rating > 5)) {
      throw new BadRequestError("rating must be 1-5 when type is rating");
    }

    const mergedMetadata = {
      ...(metadata || {}),
      usageFrequency: usageFrequency || null,
      device: device || null,
      experience: experience || null,
      improvements: improvements || null,
      otherComments: otherComments || null,
    } as Prisma.InputJsonValue;

    const feedback = await prisma.feedback.create({
      data: {
        userId: req.user.id,
        type,
        category: category || null,
        rating: type === "rating" ? rating : null,
        content: content || null,
        metadata: mergedMetadata,
      },
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

export const getMyFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const feedbacks = await prisma.feedback.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({ success: true, data: feedbacks });
  } catch (error) {
    next(error);
  }
};
