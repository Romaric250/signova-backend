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

    const slug = String(subscriptionPlan || "").toLowerCase().trim();
    if (!slug) {
      throw new BadRequestError("subscriptionPlan is required");
    }
    const planExists = await prisma.plan.findUnique({ where: { slug } });
    if (!planExists) {
      throw new BadRequestError("Invalid plan slug. Plan must exist in plans table.");
    }

    const user = await prisma.user.update({
      where: { id },
      data: { subscriptionPlan: slug },
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

    if (!word || !category || !thumbnail) {
      throw new BadRequestError("word, category, and image (thumbnail) are required");
    }

    const imageUrl = thumbnail;
    const videoUrlFinal = videoUrl || imageUrl;

    const sign = await prisma.sign.create({
      data: {
        word,
        language: language || "ASL",
        category,
        difficulty: difficulty || "beginner",
        videoUrl: videoUrlFinal,
        thumbnail: imageUrl,
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

// Courses - Admin list all (including unpublished)
export const getAllCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const courses = await prisma.course.findMany({
      include: { lessons: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });
    res.json({ success: true, data: courses });
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
        ashesiOnly: req.body.ashesiOnly === true,
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
    const { title, description, thumbnailUrl, order, isPublished, ashesiOnly } = req.body;

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(title != null && { title }),
        ...(description != null && { description }),
        ...(thumbnailUrl != null && { thumbnailUrl }),
        ...(order != null && { order }),
        ...(typeof isPublished === "boolean" && { isPublished }),
        ...(typeof ashesiOnly === "boolean" && { ashesiOnly }),
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
    const { title, content, videoUrl, imageUrl, links, order, quizContent } = req.body;

    if (!title) throw new BadRequestError("title is required");

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundError("Course not found");

    const linksData = Array.isArray(links) && links.length > 0
      ? links.filter((l: unknown) => l && typeof l === "object" && "url" in l && typeof (l as { url: string }).url === "string")
      : null;

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title,
        content: content || null,
        videoUrl: videoUrl || null,
        imageUrl: imageUrl || null,
        links: linksData,
        order: order ?? 0,
        quizContent: quizContent || null,
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
    const { title, content, videoUrl, imageUrl, links, order, quizContent } = req.body;

    const linksData = Array.isArray(links)
      ? links.length > 0
        ? links.filter((l: unknown) => l && typeof l === "object" && "url" in l && typeof (l as { url: string }).url === "string")
        : []
      : undefined;

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(title != null && { title }),
        ...(content != null && { content }),
        ...(videoUrl != null && { videoUrl }),
        ...(imageUrl != null && { imageUrl }),
        ...(links !== undefined && { links: linksData }),
        ...(order != null && { order }),
        ...(quizContent != null && { quizContent }),
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

export const reorderLessons = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.params;
    const { lessonIds } = req.body as { lessonIds: string[] };

    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      throw new BadRequestError("lessonIds array is required");
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundError("Course not found");

    await Promise.all(
      lessonIds.map((lessonId, index) =>
        prisma.lesson.updateMany({
          where: { id: lessonId, courseId },
          data: { order: index },
        })
      )
    );

    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    });

    res.json({
      success: true,
      data: lessons,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseEnrollments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: courseId } = req.params;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundError("Course not found");

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    res.json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    next(error);
  }
};

// Feedback - Admin list all
export const getAllFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const skip = (page - 1) * limit;
    const type = req.query.type as string | undefined;

    const where = type ? { type } : {};

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.feedback.count({ where }),
    ]);

    res.json({
      success: true,
      data: feedbacks,
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

// Admin dashboard stats
export const getAdminStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      usersCount,
      premiumCount,
      signsCount,
      coursesCount,
      enrollmentsCount,
      feedbackCount,
      transcriptionsCount,
      groupsCount,
      chatMessagesCount,
      groupMessagesCount,
      notesCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { subscriptionPlan: "premium" } }),
      prisma.sign.count(),
      prisma.course.count(),
      prisma.courseEnrollment.count(),
      prisma.feedback.count(),
      prisma.transcript.count(),
      prisma.transcriptionGroup.count(),
      prisma.chatMessage.count(),
      prisma.groupMessage.count(),
      prisma.note.count(),
    ]);

    const totalMessagesCount = chatMessagesCount + groupMessagesCount;

    res.json({
      success: true,
      data: {
        usersCount,
        premiumCount,
        signsCount,
        coursesCount,
        enrollmentsCount,
        feedbackCount,
        transcriptionsCount,
        groupsCount,
        chatMessagesCount,
        groupMessagesCount,
        totalMessagesCount,
        notesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Chart data for admin dashboard
export const getAdminChartData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const [users, transcripts, chatMessages, groupMessages, groups, notes] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      prisma.transcript.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      prisma.chatMessage.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      prisma.groupMessage.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      prisma.transcriptionGroup.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      prisma.note.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
    ]);

    const dateCounts: Record<
      string,
      { users: number; transcriptions: number; messages: number; groups: number; notes: number }
    > = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      dateCounts[key] = { users: 0, transcriptions: 0, messages: 0, groups: 0, notes: 0 };
    }

    users.forEach((u) => {
      const key = new Date(u.createdAt).toISOString().split("T")[0];
      if (dateCounts[key]) dateCounts[key].users++;
    });
    transcripts.forEach((t) => {
      const key = new Date(t.createdAt).toISOString().split("T")[0];
      if (dateCounts[key]) dateCounts[key].transcriptions++;
    });
    chatMessages.forEach((m) => {
      const key = new Date(m.createdAt).toISOString().split("T")[0];
      if (dateCounts[key]) dateCounts[key].messages++;
    });
    groupMessages.forEach((m) => {
      const key = new Date(m.createdAt).toISOString().split("T")[0];
      if (dateCounts[key]) dateCounts[key].messages++;
    });
    groups.forEach((g) => {
      const key = new Date(g.createdAt).toISOString().split("T")[0];
      if (dateCounts[key]) dateCounts[key].groups++;
    });
    notes.forEach((n) => {
      const key = new Date(n.createdAt).toISOString().split("T")[0];
      if (dateCounts[key]) dateCounts[key].notes++;
    });

    const labels = Object.keys(dateCounts).sort();
    const usersData = labels.map((l) => dateCounts[l].users);
    const transcriptionsData = labels.map((l) => dateCounts[l].transcriptions);
    const messagesData = labels.map((l) => dateCounts[l].messages);
    const groupsData = labels.map((l) => dateCounts[l].groups);
    const notesData = labels.map((l) => dateCounts[l].notes);

    res.json({
      success: true,
      data: {
        labels,
        usersData,
        transcriptionsData,
        messagesData,
        groupsData,
        notesData,
      },
    });
  } catch (error) {
    next(error);
  }
};
