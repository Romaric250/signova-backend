// src/controllers/notes.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { transcribeAudio } from "../services/transcription.service";
import { rearrangeText } from "../services/text-processing.service";
import { BadRequestError, NotFoundError } from "../utils/errors";
import logger from "../utils/logger";

export const createNote = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { title, content, sourceType, processAs } = req.body;

    if (!title || typeof title !== "string") {
      throw new BadRequestError("Title is required");
    }

    const source = sourceType === "recorded" ? "recorded" : "typed";
    const processMode = processAs === "rearranged";
    let finalContent = content || "";
    let rawContent: string | null = null;
    let processedContent: string | null = null;

    if (source === "typed") {
      finalContent = (content || "").trim();
      if (processMode && finalContent) {
        processedContent = await rearrangeText(finalContent);
        rawContent = finalContent;
        finalContent = processedContent;
      }
    }

    const note = await prisma.note.create({
      data: {
        userId: req.user.id,
        title: title.trim(),
        content: finalContent,
        rawContent,
        processedContent,
        sourceType: source,
      },
    });

    logger.info(`Note created: ${note.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

export const createNoteFromRecording = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");
    if (!req.file) throw new BadRequestError("No audio file provided");

    const { title, processAs } = req.body;

    if (!title || typeof title !== "string") {
      throw new BadRequestError("Title is required");
    }

    const rawText = await transcribeAudio(req.file.buffer);
    const processMode = processAs === "rearranged";

    let content = rawText;
    let processedContent: string | null = null;

    if (processMode && rawText.trim()) {
      processedContent = await rearrangeText(rawText);
      content = processedContent;
    }

    const note = await prisma.note.create({
      data: {
        userId: req.user.id,
        title: title.trim(),
        content,
        rawContent: rawText,
        processedContent,
        sourceType: "recorded",
      },
    });

    logger.info(`Note from recording created: ${note.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

export const getNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where: { userId: req.user.id },
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.note.count({ where: { userId: req.user.id } }),
    ]);

    res.json({
      success: true,
      data: notes,
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

export const getNoteById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id } = req.params;

    const note = await prisma.note.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!note) throw new NotFoundError("Note not found");

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id } = req.params;
    const { title, content } = req.body;

    const existing = await prisma.note.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) throw new NotFoundError("Note not found");

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(title != null && { title: String(title).trim() }),
        ...(content != null && { content: String(content) }),
      },
    });

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id } = req.params;

    const existing = await prisma.note.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) throw new NotFoundError("Note not found");

    await prisma.note.delete({ where: { id } });

    res.json({
      success: true,
      message: "Note deleted",
    });
  } catch (error) {
    next(error);
  }
};
