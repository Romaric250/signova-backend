// src/routes/signs.routes.ts
import { Router } from "express";
import {
  getSigns,
  getSignById,
  searchSigns,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
} from "../controllers/signs.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateQuery } from "../middleware/validation.middleware";
import { signQuerySchema } from "../utils/validators";

const router = Router();

router.get("/", validateQuery(signQuerySchema), getSigns);
router.get("/search", searchSigns);
router.get("/:id", getSignById);

// Favorite routes require authentication
router.post("/favorites", requireAuth, addToFavorites);
router.delete("/favorites/:id", requireAuth, removeFromFavorites);
router.get("/favorites/all", requireAuth, getFavorites);

export default router;

