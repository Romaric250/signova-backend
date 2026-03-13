// src/routes/admin.routes.ts
import { Router } from "express";
import {
  getAllUsers,
  updateUserSubscription,
  setUserAdmin,
  getAdminStats,
  getAdminChartData,
  createSign,
  updateSign,
  deleteSign,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  getCourseEnrollments,
  getAllFeedback,
} from "../controllers/admin.controller";
import {
  getPlansAdmin,
  createPlan,
  updatePlan,
  deletePlan,
} from "../controllers/plans.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/stats", getAdminStats);
router.get("/chart-data", getAdminChartData);
router.get("/feedback", getAllFeedback);
router.get("/users", getAllUsers);
router.patch("/users/:id/subscription", updateUserSubscription);
router.patch("/users/:id/admin", setUserAdmin);

router.get("/courses", getAllCourses);
router.post("/signs", createSign);
router.patch("/signs/:id", updateSign);
router.delete("/signs/:id", deleteSign);

router.post("/courses", createCourse);
router.patch("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);
router.post("/courses/:courseId/lessons", createLesson);
router.patch("/courses/:courseId/lessons/reorder", reorderLessons);
router.patch("/courses/:courseId/lessons/:id", updateLesson);
router.delete("/courses/:courseId/lessons/:id", deleteLesson);
router.get("/courses/:id/enrollments", getCourseEnrollments);

router.get("/plans", getPlansAdmin);
router.post("/plans", createPlan);
router.patch("/plans/:id", updatePlan);
router.delete("/plans/:id", deletePlan);

export default router;
