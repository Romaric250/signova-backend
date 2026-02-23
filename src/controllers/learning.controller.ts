// src/controllers/learning.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { NotFoundError } from "../utils/errors";

export const getCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      include: { lessons: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findFirst({
      where: { id, isPublished: true },
      include: {
        lessons: { orderBy: { order: "asc" } },
      },
    });

    if (!course) throw new NotFoundError("Course not found");

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const getLessonById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId, lessonId } = req.params;

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        courseId,
        course: { isPublished: true },
      },
      include: { course: true },
    });

    if (!lesson) throw new NotFoundError("Lesson not found");

    res.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};
