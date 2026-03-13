// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { auth } from "../config/auth";
import { env } from "../config/env";
import { prisma } from "../config/database";
import { BadRequestError, ConflictError } from "../utils/errors";
import { sendOTPEmail } from "../services/email.service";
import logger from "../utils/logger";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    const bearerToken = result.token || null;
    if (bearerToken) {
      res.setHeader("set-auth-token", bearerToken);
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.emailVerificationOtp.create({
      data: {
        userId: result.user.id,
        email: result.user.email,
        code: otp,
        expiresAt,
      },
    });

    await sendOTPEmail(result.user.email, otp);

    logger.info(`New user signed up: ${email}, OTP sent`);

    res.status(201).json({
      success: true,
      message: "Account created. Please verify your email with the code sent to you.",
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          avatar: result.user.image || undefined,
          isAdmin: false,
          emailVerified: false,
          subscriptionPlan: "free",
          learningStreak: 0,
          signsLearned: 0,
          practiceTime: 0,
          level: "beginner" as const,
          joinedDate: new Date().toISOString(),
        },
        token: bearerToken || "",
        refreshToken: bearerToken || "",
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

    const dbUser = await prisma.user.findUnique({
      where: { id: result.user.id },
      select: { isAdmin: true, emailVerified: true, subscriptionPlan: true },
    });

    // If email is not verified, send OTP so user can verify (same as signup flow)
    if (dbUser && !dbUser.emailVerified) {
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await prisma.emailVerificationOtp.deleteMany({
        where: { userId: result.user.id },
      });
      await prisma.emailVerificationOtp.create({
        data: {
          userId: result.user.id,
          email: result.user.email,
          code: otp,
          expiresAt,
        },
      });
      await sendOTPEmail(result.user.email, otp);
      logger.info(`Verification OTP sent on login to: ${result.user.email}`);
    }

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
          isAdmin: dbUser?.isAdmin ?? false,
          emailVerified: dbUser?.emailVerified ?? false,
          subscriptionPlan: dbUser?.subscriptionPlan ?? "free",
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

    // Extract token from Authorization header for mobile apps
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || '';

    logger.info(`Session retrieved for user: ${session.user.email}`);

    // Fetch isAdmin, emailVerified, subscriptionPlan from DB (Better Auth user may not include it)
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, emailVerified: true, subscriptionPlan: true },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          avatar: session.user.image || undefined,
          isAdmin: dbUser?.isAdmin ?? false,
          emailVerified: dbUser?.emailVerified ?? false,
          subscriptionPlan: dbUser?.subscriptionPlan ?? "free",
          learningStreak: 0,
          signsLearned: 0,
          practiceTime: 0,
          level: 'beginner' as const,
          joinedDate: session.user.createdAt?.toISOString() || new Date().toISOString(),
        },
        token: token, // Return token so mobile app can store it
        refreshToken: token, // Better Auth uses same token
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

export const requestPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      throw new BadRequestError("Email is required");
    }

    const redirectTo = `${env.FRONTEND_URL}/reset-password`;
    await auth.api.requestPasswordReset({
      body: { email: email.trim(), redirectTo },
      headers: req.headers,
    });

    logger.info(`Password reset requested for: ${email}`);

    res.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link",
    });
  } catch (error: any) {
    logger.error(`Password reset error: ${error.message}`);
    res.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link",
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      throw new BadRequestError("Token and new password are required");
    }
    if (newPassword.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters");
    }

    await auth.api.resetPassword({
      body: { token, newPassword },
      headers: req.headers,
    });

    logger.info("Password reset successful");

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error: any) {
    next(error);
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      throw new BadRequestError("You must be logged in to verify");
    }

    const { code } = req.body;
    if (!code || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
      throw new BadRequestError("Please enter a valid 6-digit code");
    }

    const otpRecord = await prisma.emailVerificationOtp.findFirst({
      where: {
        userId: session.user.id,
        code: code.trim(),
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      throw new BadRequestError("Invalid or expired code. Please request a new one.");
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { emailVerified: true },
    });

    await prisma.emailVerificationOtp.deleteMany({
      where: { userId: session.user.id },
    });

    logger.info(`Email verified for user: ${session.user.email}`);

    res.json({
      success: true,
      message: "Email verified successfully",
      data: { emailVerified: true },
    });
  } catch (error: any) {
    next(error);
  }
};

export const resendVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      throw new BadRequestError("You must be logged in to resend verification code");
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    });
    if (dbUser?.emailVerified) {
      throw new BadRequestError("Email is already verified");
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailVerificationOtp.deleteMany({
      where: { userId: session.user.id },
    });

    await prisma.emailVerificationOtp.create({
      data: {
        userId: session.user.id,
        email: session.user.email,
        code: otp,
        expiresAt,
      },
    });

    await sendOTPEmail(session.user.email, otp);

    logger.info(`Verification OTP resent to: ${session.user.email}`);

    res.json({
      success: true,
      message: "Verification code sent. Check your inbox.",
    });
  } catch (error: any) {
    next(error);
  }
};

export const sendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return resendVerificationCode(req, res, next);
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

