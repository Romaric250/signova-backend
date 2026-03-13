// src/controllers/plans.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { BadRequestError, NotFoundError } from "../utils/errors";

// Public: get all plans (for offers modal)
export const getPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { order: "asc" },
    });
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

// Admin: get all plans
export const getPlansAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { order: "asc" },
    });
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

// Admin: create plan
export const createPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, slug, priceCedis, features, order } = req.body;

    if (!name || !slug) {
      throw new BadRequestError("name and slug are required");
    }

    const slugLower = String(slug).toLowerCase().replace(/\s+/g, "-");
    const existing = await prisma.plan.findUnique({ where: { slug: slugLower } });
    if (existing) {
      throw new BadRequestError("A plan with this slug already exists");
    }

    const plan = await prisma.plan.create({
      data: {
        name: String(name),
        slug: slugLower,
        priceCedis: typeof priceCedis === "number" ? priceCedis : 0,
        features: Array.isArray(features) ? features : [],
        order: typeof order === "number" ? order : 0,
      },
    });

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// Admin: update plan
export const updatePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, slug, priceCedis, features, order } = req.body;

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Plan not found");
    }

    const slugLower = slug ? String(slug).toLowerCase().replace(/\s+/g, "-") : existing.slug;
    if (slugLower !== existing.slug) {
      const duplicate = await prisma.plan.findUnique({ where: { slug: slugLower } });
      if (duplicate) {
        throw new BadRequestError("A plan with this slug already exists");
      }
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...(name != null && { name: String(name) }),
        ...(slug != null && { slug: slugLower }),
        ...(typeof priceCedis === "number" && { priceCedis }),
        ...(Array.isArray(features) && { features }),
        ...(typeof order === "number" && { order }),
      },
    });

    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// Admin: delete plan
export const deletePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Plan not found");
    }

    if (existing.slug === "free") {
      throw new BadRequestError("Cannot delete the free plan");
    }

    await prisma.plan.delete({ where: { id } });
    res.json({ success: true, message: "Plan deleted" });
  } catch (error) {
    next(error);
  }
};
