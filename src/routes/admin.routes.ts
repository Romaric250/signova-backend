// src/routes/admin.routes.ts
import { Router } from "express";
import {
  getAllUsers,
  updateUserSubscription,
  setUserAdmin,
  createSign,
  updateSign,
  deleteSign,
  createCourse,
  updateCourse,
  deleteCourse,
  createLesson,
  updateLesson,
  deleteLesson,
  getAdminStats,
} from "../controllers/admin.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.patch("/users/:id/subscription", updateUserSubscription);
router.patch("/users/:id/admin", setUserAdmin);

router.post("/signs", createSign);
router.patch("/signs/:id", updateSign);
router.delete("/signs/:id", deleteSign);

router.post("/courses", createCourse);
router.patch("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);
router.post("/courses/:courseId/lessons", createLesson);
router.patch("/courses/:courseId/lessons/:id", updateLesson);
router.delete("/courses/:courseId/lessons/:id", deleteLesson);

export default router;
