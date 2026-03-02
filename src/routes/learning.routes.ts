// src/routes/learning.routes.ts
import { Router } from "express";
import {
  getCourses,
  getCourseById,
  getLessonById,
  enrollInCourse,
  getMyEnrollments,
  getEnrolledCourse,
  completeLesson,
  getLessonProgress,
} from "../controllers/learning.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/courses", getCourses);
router.get("/courses/:id", getCourseById);
router.get("/courses/:courseId/lessons/:lessonId", getLessonById);

router.use(requireAuth);
router.get("/enrollments", getMyEnrollments);
router.post("/courses/:id/enroll", enrollInCourse);
router.get("/my-courses/:id", getEnrolledCourse);
router.post("/lessons/:id/complete", completeLesson);
router.get("/lessons/:id/progress", getLessonProgress);

export default router;
