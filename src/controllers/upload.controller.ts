// src/controllers/upload.controller.ts
import { Request, Response, NextFunction } from "express";
import { uploadFile } from "../services/upload.service";
import { BadRequestError } from "../utils/errors";
import logger from "../utils/logger";

export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      throw new BadRequestError("No file uploaded");
    }

    // Convert buffer to File object
    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype,
    });

    const url = await uploadFile(file);

    logger.info(`Avatar uploaded: ${url}`);

    res.json({ url });
  } catch (error) {
    next(error);
  }
};

export const uploadSignVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      throw new BadRequestError("No video file uploaded");
    }

    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype,
    });

    const url = await uploadFile(file);

    logger.info(`Sign video uploaded: ${url}`);

    res.json({ url });
  } catch (error) {
    next(error);
  }
};

export const uploadCourseThumbnail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) throw new BadRequestError("No image uploaded");

    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype,
    });

    const url = await uploadFile(file);
    logger.info(`Course thumbnail uploaded: ${url}`);
    res.json({ url });
  } catch (error) {
    next(error);
  }
};

export const uploadLessonVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) throw new BadRequestError("No video uploaded");

    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype,
    });

    const url = await uploadFile(file);
    logger.info(`Lesson video uploaded: ${url}`);
    res.json({ url });
  } catch (error) {
    next(error);
  }
};

