// src/routes/learning.routes.ts
import { Router } from "express";
import {
  getCourses,
  getCourseById,
  getLessonById,
} from "../controllers/learning.controller";

const router = Router();

router.get("/courses", getCourses);
router.get("/courses/:id", getCourseById);
router.get("/courses/:courseId/lessons/:lessonId", getLessonById);

export default router;
