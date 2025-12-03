// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { NotFoundError } from "../utils/errors";
import logger from "../utils/logger";

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new NotFoundError("User not found");
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.json({
      success: true,
      data: {
        ...user,
        avatar: user.image, // Map image to avatar for API compatibility
        learningStreak: 0, // Will be fetched from progress
        signsLearned: 0, // Will be fetched from progress
        practiceTime: 0, // Will be fetched from progress
        level: 'beginner' as const,
        joinedDate: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new NotFoundError("User not found");
    }

    const { name, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(avatar && { image: avatar }), // Map avatar to image field
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`User profile updated: ${req.user.id}`);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        ...updatedUser,
        avatar: updatedUser.image, // Map image to avatar for API compatibility
        learningStreak: 0,
        signsLearned: 0,
        practiceTime: 0,
        level: 'beginner' as const,
        joinedDate: updatedUser.createdAt?.toISOString() || new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new NotFoundError("User not found");
    }

    const { preferences } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: preferences || {},
      },
      select: {
        id: true,
        email: true,
        name: true,
        preferences: true,
        updatedAt: true,
      },
    });

    logger.info(`User preferences updated: ${req.user.id}`);

    res.json({
      success: true,
      message: "Preferences updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

