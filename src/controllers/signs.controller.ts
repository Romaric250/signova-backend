// src/controllers/signs.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { SignQueryParams } from "../types/sign.types";
import logger from "../utils/logger";

export const getSigns = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query as unknown as SignQueryParams;
    const {
      language,
      category,
      difficulty,
      search,
      page = 1,
      limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (language) where.language = language;
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (search) {
      where.word = {
        contains: search,
        mode: "insensitive",
      };
    }

    const [signs, total] = await Promise.all([
      prisma.sign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.sign.count({ where }),
    ]);

    res.json({
      success: true,
      data: signs,
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

export const getSignById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const sign = await prisma.sign.findUnique({
      where: { id },
      include: {
        favorites: {
          where: req.user ? { userId: req.user.id } : undefined,
          select: { id: true },
        },
      },
    });

    if (!sign) {
      throw new NotFoundError("Sign not found");
    }

    res.json({
      success: true,
      data: sign,
    });
  } catch (error) {
    next(error);
  }
};

export const searchSigns = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      throw new BadRequestError("Search query is required");
    }

    const signs = await prisma.sign.findMany({
      where: {
        word: {
          contains: q,
          mode: "insensitive",
        },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: signs,
    });
  } catch (error) {
    next(error);
  }
};

export const addToFavorites = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new NotFoundError("User not found");
    }

    const { signId } = req.body;

    if (!signId) {
      throw new BadRequestError("Sign ID is required");
    }

    // Check if sign exists
    const sign = await prisma.sign.findUnique({
      where: { id: signId },
    });

    if (!sign) {
      throw new NotFoundError("Sign not found");
    }

    // Create favorite (or ignore if already exists)
    const favorite = await prisma.favorite.upsert({
      where: {
        userId_signId: {
          userId: req.user.id,
          signId,
        },
      },
      create: {
        userId: req.user.id,
        signId,
      },
      update: {},
    });

    logger.info(`Sign added to favorites: ${signId} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: "Added to favorites",
      data: favorite,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromFavorites = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new NotFoundError("User not found");
    }

    const { id } = req.params;

    await prisma.favorite.delete({
      where: {
        userId_signId: {
          userId: req.user.id,
          signId: id,
        },
      },
    });

    logger.info(`Sign removed from favorites: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      message: "Removed from favorites",
    });
  } catch (error) {
    next(error);
  }
};

export const getFavorites = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new NotFoundError("User not found");
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        sign: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: favorites.map((fav) => fav.sign),
    });
  } catch (error) {
    next(error);
  }
};

