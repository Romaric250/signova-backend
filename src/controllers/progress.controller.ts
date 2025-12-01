// src/controllers/progress.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { NotFoundError } from "../utils/errors";
import logger from "../utils/logger";

export const getProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new NotFoundError("User not found");
    }

    let progress = await prisma.progress.findUnique({
      where: { userId: req.user.id },
    });

    if (!progress) {
      // Create initial progress record
      progress = await prisma.progress.create({
        data: {
          userId: req.user.id,
        },
      });
    }

    res.json(progress);
  } catch (error) {
    next(error);
  }
};

export const updateProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new NotFoundError("User not found");
    }

    const { signsLearned, practiceTime, streak } = req.body;

    const progress = await prisma.progress.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        signsLearned: signsLearned || 0,
        practiceTime: practiceTime || 0,
        streak: streak || 0,
        lastActive: new Date(),
      },
      update: {
        ...(signsLearned !== undefined && { signsLearned }),
        ...(practiceTime !== undefined && { practiceTime }),
        ...(streak !== undefined && { streak }),
        lastActive: new Date(),
      },
    });

    logger.info(`Progress updated for user ${req.user.id}`);

    res.json(progress);
  } catch (error) {
    next(error);
  }
};

export const updateStreak = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new NotFoundError("User not found");
    }

    const progress = await prisma.progress.findUnique({
      where: { userId: req.user.id },
    });

    if (!progress) {
      throw new NotFoundError("Progress not found");
    }

    const lastActive = progress.lastActive;
    const now = new Date();
    const daysSinceLastActive = Math.floor(
      (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newStreak = progress.streak;

    if (daysSinceLastActive === 0) {
      // Same day, no change
    } else if (daysSinceLastActive === 1) {
      // Consecutive day, increment streak
      newStreak += 1;
    } else {
      // Streak broken, reset to 1
      newStreak = 1;
    }

    const updatedProgress = await prisma.progress.update({
      where: { userId: req.user.id },
      data: {
        streak: newStreak,
        lastActive: now,
      },
    });

    logger.info(`Streak updated for user ${req.user.id}: ${newStreak}`);

    res.json(updatedProgress);
  } catch (error) {
    next(error);
  }
};

export const getAchievements = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new NotFoundError("User not found");
    }

    const progress = await prisma.progress.findUnique({
      where: { userId: req.user.id },
    });

    if (!progress) {
      return res.json({ achievements: [] });
    }

    const achievements = progress.achievements || [];

    res.json({ achievements });
  } catch (error) {
    next(error);
  }
};

