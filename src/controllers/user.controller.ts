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
        avatar: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.json(user);
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
        ...(avatar && { avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        preferences: true,
        updatedAt: true,
      },
    });

    logger.info(`User profile updated: ${req.user.id}`);

    res.json(updatedUser);
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

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

