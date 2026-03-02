// src/controllers/learning.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/errors";

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

export const enrollInCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id: courseId } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { lessons: { orderBy: { order: "asc" } } },
    });
    if (!course) throw new NotFoundError("Course not found");
    if (!course.isPublished) throw new ForbiddenError("Course is not available for enrollment");

    const existing = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: { userId: req.user.id, courseId },
      },
    });
    if (existing) {
      return res.json({ success: true, data: existing, alreadyEnrolled: true });
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId: req.user.id,
        courseId,
      },
    });

    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    next(error);
  }
};

export const getMyEnrollments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: req.user.id },
      include: {
        course: {
          include: {
            lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    const withProgress = await Promise.all(
      enrollments.map(async (e) => {
        const completedLessons = await prisma.lessonProgress.count({
          where: {
            userId: req.user!.id,
            lesson: { courseId: e.courseId },
            completedAt: { not: null },
          },
        });
        const totalLessons = e.course.lessons?.length ?? 0;
        return {
          ...e,
          completedLessons,
          totalLessons,
        };
      })
    );

    res.json({ success: true, data: withProgress });
  } catch (error) {
    next(error);
  }
};

export const getEnrolledCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id } = req.params;

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: { userId: req.user.id, courseId: id },
      },
      include: {
        course: {
          include: { lessons: { orderBy: { order: "asc" } } },
        },
      },
    });
    if (!enrollment) throw new ForbiddenError("You are not enrolled in this course");

    const progress = await prisma.lessonProgress.findMany({
      where: {
        userId: req.user.id,
        lesson: { courseId: id },
      },
      select: { lessonId: true, completedAt: true, quizScore: true, quizPassed: true },
    });
    const progressMap = Object.fromEntries(progress.map((p) => [p.lessonId, p]));

    res.json({
      success: true,
      data: {
        ...enrollment.course,
        enrollment: { enrolledAt: enrollment.enrolledAt, completedAt: enrollment.completedAt },
        lessonProgress: progressMap,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const completeLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id: lessonId } = req.params;
    const { quizAnswers } = req.body;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });
    if (!lesson) throw new NotFoundError("Lesson not found");

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: { userId: req.user.id, courseId: lesson.courseId },
      },
    });
    if (!enrollment) throw new ForbiddenError("You are not enrolled in this course");

    const quizContent = lesson.quizContent as { questions?: Array<{ id: string; options: Array<{ id: string; isCorrect: boolean }> }> } | null;
    const hasQuiz = quizContent?.questions && quizContent.questions.length > 0;

    let completedAt: Date | null = new Date();
    let quizScore: number | null = null;
    let quizPassed: boolean | null = null;

    if (hasQuiz && quizAnswers && Array.isArray(quizAnswers)) {
      const questions = quizContent.questions!;
      let correct = 0;
      for (const q of questions) {
        const userAnswer = quizAnswers.find((a: { questionId: string }) => a.questionId === q.id);
        const correctOption = q.options?.find((o) => o.isCorrect);
        if (correctOption && userAnswer?.optionId === correctOption.id) correct++;
      }
      quizScore = questions.length > 0 ? (correct / questions.length) * 100 : 100;
      quizPassed = quizScore >= 50;
      if (!quizPassed) completedAt = null;
    }

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: req.user.id, lessonId },
      },
      create: {
        userId: req.user.id,
        lessonId,
        completedAt,
        quizScore,
        quizPassed,
      },
      update: {
        completedAt,
        quizScore,
        quizPassed,
      },
    });

    const allLessons = await prisma.lesson.findMany({
      where: { courseId: lesson.courseId },
      select: { id: true },
    });
    const completedCount = await prisma.lessonProgress.count({
      where: {
        userId: req.user.id,
        lesson: { courseId: lesson.courseId },
        completedAt: { not: null },
      },
    });
    if (completedCount >= allLessons.length) {
      await prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: { completedAt: new Date() },
      });
    }

    res.json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};

export const unenrollFromCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id: courseId } = req.params;

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: { userId: req.user.id, courseId },
      },
    });
    if (!enrollment) throw new NotFoundError("You are not enrolled in this course");

    await prisma.lessonProgress.deleteMany({
      where: { userId: req.user.id, lesson: { courseId } },
    });
    await prisma.courseEnrollment.delete({
      where: { id: enrollment.id },
    });

    res.json({ success: true, data: { unenrolled: true } });
  } catch (error) {
    next(error);
  }
};

export const getLessonProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id: lessonId } = req.params;

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: { userId: req.user.id, lessonId },
      },
    });

    res.json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};
