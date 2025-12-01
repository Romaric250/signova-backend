// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { auth } from "../config/auth";
import { BadRequestError, ConflictError } from "../utils/errors";
import logger from "../utils/logger";

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name } = req.body;

    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
      headers: req.headers,
    });

    if (!result || !result.user) {
      throw new BadRequestError("Signup failed");
    }

    // For mobile apps: return Bearer token if auto-signin occurred
    const bearerToken = result.token || null;
    
    if (bearerToken) {
      res.setHeader("set-auth-token", bearerToken);
    }

    logger.info(`New user signed up: ${email}`);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        avatar: result.user.image || undefined,
      },
      ...(bearerToken && { token: bearerToken }), // Include token if available
    });
  } catch (error: any) {
    if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
      return next(new ConflictError("User with this email already exists"));
    }
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      headers: req.headers,
    });

    if (!result || !result.user || !result.token) {
      throw new BadRequestError("Invalid email or password");
    }

    // For mobile apps: return Bearer token in response header
    const bearerToken = result.token;
    
    if (bearerToken) {
      res.setHeader("set-auth-token", bearerToken);
    }

    logger.info(`User logged in: ${email}`);

    // Get session to include session details
    const session = await auth.api.getSession({ headers: req.headers });

    res.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        avatar: result.user.image || undefined,
      },
      session: session ? {
        id: session.session.id,
        expiresAt: session.session.expiresAt,
      } : undefined,
      token: bearerToken, // Include token in response body for mobile apps
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await auth.api.signOut({
      headers: req.headers,
    });

    logger.info(`User logged out: ${req.user?.email}`);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const getSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session || !session.user) {
      return res.status(401).json({ error: "No active session" });
    }

    res.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatar: session.user.image || undefined,
      },
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Better Auth doesn't have refreshSession API method
    // Instead, we can get the current session which will refresh it automatically
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session || !session.user) {
      throw new BadRequestError("No active session to refresh");
    }

    // For mobile apps: Bearer token is handled automatically by Better Auth
    // The token can be obtained from the Authorization header or session
    res.json({
      message: "Session refreshed successfully",
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

