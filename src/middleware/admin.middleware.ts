// src/middleware/admin.middleware.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        avatar?: string;
        isAdmin?: boolean;
        subscriptionPlan?: string;
      };
    }
  }
}

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new UnauthorizedError("Unauthorized");
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isAdmin: true, subscriptionPlan: true },
    });

    if (!dbUser?.isAdmin) {
      throw new ForbiddenError("Admin access required");
    }

    req.user.isAdmin = dbUser.isAdmin;
    req.user.subscriptionPlan = dbUser.subscriptionPlan;
    next();
  } catch (error) {
    next(error);
  }
};
