// src/controllers/admin.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { BadRequestError, NotFoundError } from "../utils/errors";

// Users
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || "";

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          subscriptionPlan: true,
          isAdmin: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
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

export const updateUserSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { subscriptionPlan } = req.body;

    if (!subscriptionPlan || !["free", "premium"].includes(subscriptionPlan)) {
      throw new BadRequestError("subscriptionPlan must be 'free' or 'premium'");
    }

    const user = await prisma.user.update({
      where: { id },
      data: { subscriptionPlan },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const setUserAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;

    if (typeof isAdmin !== "boolean") {
      throw new BadRequestError("isAdmin must be a boolean");
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isAdmin },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Signs (Dictionary) - Admin CRUD
export const createSign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { word, language, category, difficulty, videoUrl, thumbnail, description, relatedSigns } =
      req.body;

    if (!word || !language || !category || !difficulty || !videoUrl || !thumbnail) {
      throw new BadRequestError("word, language, category, difficulty, videoUrl, thumbnail are required");
    }

    const sign = await prisma.sign.create({
      data: {
        word,
        language,
        category,
        difficulty,
        videoUrl,
        thumbnail,
        description: description || "",
        relatedSigns: relatedSigns || [],
      },
    });

    res.status(201).json({
      success: true,
      data: sign,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const sign = await prisma.sign.update({
      where: { id },
      data: {
        ...(body.word != null && { word: body.word }),
        ...(body.language != null && { language: body.language }),
        ...(body.category != null && { category: body.category }),
        ...(body.difficulty != null && { difficulty: body.difficulty }),
        ...(body.videoUrl != null && { videoUrl: body.videoUrl }),
        ...(body.thumbnail != null && { thumbnail: body.thumbnail }),
        ...(body.description != null && { description: body.description }),
        ...(body.relatedSigns != null && { relatedSigns: body.relatedSigns }),
      },
    });

    res.json({
      success: true,
      data: sign,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.sign.delete({ where: { id } });

    res.json({
      success: true,
      message: "Sign deleted",
    });
  } catch (error) {
    next(error);
  }
};

// Courses - Admin CRUD
export const createCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, thumbnailUrl, order } = req.body;

    if (!title) throw new BadRequestError("title is required");

    const course = await prisma.course.create({
      data: {
        title,
        description: description || null,
        thumbnailUrl: thumbnailUrl || null,
        order: order ?? 0,
      },
    });

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title, description, thumbnailUrl, order, isPublished } = req.body;

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(title != null && { title }),
        ...(description != null && { description }),
        ...(thumbnailUrl != null && { thumbnailUrl }),
        ...(order != null && { order }),
        ...(typeof isPublished === "boolean" && { isPublished }),
      },
    });

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.course.delete({ where: { id } });

    res.json({
      success: true,
      message: "Course deleted",
    });
  } catch (error) {
    next(error);
  }
};

export const createLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.params;
    const { title, content, videoUrl, order } = req.body;

    if (!title) throw new BadRequestError("title is required");

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundError("Course not found");

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title,
        content: content || null,
        videoUrl: videoUrl || null,
        order: order ?? 0,
      },
    });

    res.status(201).json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: lessonId } = req.params;
    const { title, content, videoUrl, order } = req.body;

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(title != null && { title }),
        ...(content != null && { content }),
        ...(videoUrl != null && { videoUrl }),
        ...(order != null && { order }),
      },
    });

    res.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: lessonId } = req.params;

    await prisma.lesson.delete({ where: { id: lessonId } });

    res.json({
      success: true,
      message: "Lesson deleted",
    });
  } catch (error) {
    next(error);
  }
};

// Admin dashboard stats
export const getAdminStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [usersCount, premiumCount, signsCount, coursesCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { subscriptionPlan: "premium" } }),
      prisma.sign.count(),
      prisma.course.count(),
    ]);

    res.json({
      success: true,
      data: {
        usersCount,
        premiumCount,
        signsCount,
        coursesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
