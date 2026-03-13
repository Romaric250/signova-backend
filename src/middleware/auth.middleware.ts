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
        isAdmin?: boolean;
        subscriptionPlan?: string;
      };
    }
  }
}

function setUserFromSession(req: Request, session: { user: { id: string; email: string; name: string; image?: string | null } } | null) {
  if (session?.user) {
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      avatar: session.user.image || undefined,
    };
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

    setUserFromSession(req, session);
    next();
  } catch (error) {
    next(error);
  }
};

/** Attaches user to req if logged in; does not throw */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    setUserFromSession(req, session);
    next();
  } catch {
    next();
  }
};

