// src/routes/auth.routes.ts
import { Router } from "express";
import {
  signup,
  login,
  logout,
  getSession,
  refreshToken,
} from "../controllers/auth.controller";
import { validate } from "../middleware/validation.middleware";
import { requireAuth } from "../middleware/auth.middleware";
import { signupSchema, loginSchema } from "../utils/validators";

const router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/logout", requireAuth, logout);
router.get("/session", getSession);
router.post("/refresh", refreshToken);

export default router;

