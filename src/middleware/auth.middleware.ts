// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { auth } from "../config/auth";
import { UnauthorizedError } from "../utils/errors";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        avatar?: string;
      };
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session || !session.user) {
      throw new UnauthorizedError("Unauthorized");
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      avatar: session.user.image || undefined,
    };

    next();
  } catch (error) {
    next(error);
  }
};

