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

    // Return format expected by mobile app: { data: {...}, success: true }
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          avatar: result.user.image || undefined,
          learningStreak: 0,
          signsLearned: 0,
          practiceTime: 0,
          level: 'beginner' as const,
          joinedDate: new Date().toISOString(),
        },
        token: bearerToken || '',
        refreshToken: bearerToken || '', // Better Auth uses same token, but mobile expects refreshToken
      },
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

    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

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

    // Return format expected by mobile app: { data: {...}, success: true }
    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          avatar: result.user.image || undefined,
          learningStreak: 0, // Will be fetched from progress API
          signsLearned: 0, // Will be fetched from progress API
          practiceTime: 0, // Will be fetched from progress API
          level: 'beginner' as const, // Will be calculated from progress
          joinedDate: result.user.createdAt?.toISOString() || new Date().toISOString(),
        },
        token: bearerToken,
        refreshToken: bearerToken, // Better Auth uses same token, but mobile expects refreshToken
      },
    });
  } catch (error: any) {
    // Log the error for debugging
    logger.error(`Login error: ${error.message || JSON.stringify(error)}`, {
      error: error,
      email: req.body.email,
    });

    // Handle Better Auth specific errors and convert to user-friendly messages
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || error.statusCode || error.status;
    
    // Check for authentication/credential errors
    if (errorCode === 401 || 
        errorCode === 'UNAUTHORIZED' ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("incorrect") ||
        errorMessage.includes("wrong") ||
        errorMessage.includes("credentials") ||
        errorMessage.includes("password") ||
        errorMessage.includes("authentication failed")) {
      return next(new BadRequestError("Invalid email or password"));
    }
    
    // Check for user not found errors
    if (errorCode === 404 ||
        errorMessage.includes("not found") ||
        errorMessage.includes("does not exist") ||
        errorMessage.includes("user not found")) {
      return next(new BadRequestError("No account found with this email"));
    }

    // Check for email verification errors
    if (errorMessage.includes("email") && errorMessage.includes("verify")) {
      return next(new BadRequestError("Please verify your email before logging in"));
    }

    // For any other error from Better Auth, assume it's a credential issue
    // This ensures we don't leak internal errors to users
    if (error.message || error.toString().includes("auth") || error.toString().includes("login")) {
      return next(new BadRequestError("Invalid email or password"));
    }

    // Only pass through if it's a known AppError
    if (error instanceof BadRequestError || error.statusCode) {
      return next(error);
    }

    // For unknown errors, return generic message instead of internal server error
    logger.error(`Unexpected login error:`, error);
    return next(new BadRequestError("Invalid email or password"));
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
      return res.status(401).json({ 
        success: false,
        error: "No active session" 
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          avatar: session.user.image || undefined,
          learningStreak: 0,
          signsLearned: 0,
          practiceTime: 0,
          level: 'beginner' as const,
          joinedDate: session.user.createdAt?.toISOString() || new Date().toISOString(),
        },
        session: {
          id: session.session.id,
          expiresAt: session.session.expiresAt,
        },
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
    // Extract token from Authorization header if present
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || '';

    res.json({
      success: true,
      message: "Session refreshed successfully",
      data: {
        token: token,
        refreshToken: token,
        session: {
          id: session.session.id,
          expiresAt: session.session.expiresAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

