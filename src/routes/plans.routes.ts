// src/routes/plans.routes.ts
import { Router } from "express";
import { getPlans } from "../controllers/plans.controller";

const router = Router();

// Public: get plans (for offers modal)
router.get("/", getPlans);

export default router;
