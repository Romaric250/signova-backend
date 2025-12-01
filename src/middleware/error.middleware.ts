// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import logger from "../utils/logger";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error(`AppError: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    return res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  logger.error(`Unhandled Error: ${err.message}`, {
    error: err,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { message: err.message }),
  });
};

