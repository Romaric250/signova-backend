// src/controllers/groups.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { transcribeAudio } from "../services/transcription.service";
import { rearrangeText } from "../services/text-processing.service";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/errors";
import { randomBytes } from "crypto";
import logger from "../utils/logger";
import { emitGroupMessage } from "../websocket/emitter";

function generateInviteCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export const createGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { name } = req.body;
    if (!name || typeof name !== "string") {
      throw new BadRequestError("Group name is required");
    }

    let inviteCode = generateInviteCode();
    let exists = await prisma.transcriptionGroup.findUnique({ where: { inviteCode } });
    while (exists) {
      inviteCode = generateInviteCode();
      exists = await prisma.transcriptionGroup.findUnique({ where: { inviteCode } });
    }

    const group = await prisma.transcriptionGroup.create({
      data: {
        name: name.trim(),
        createdById: req.user.id,
        inviteCode,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: req.user.id,
        role: "admin",
      },
    });

    const groupWithMembers = await prisma.transcriptionGroup.findUnique({
      where: { id: group.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    logger.info(`Group created: ${group.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: groupWithMembers,
    });
  } catch (error) {
    next(error);
  }
};

export const joinGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { inviteCode } = req.body;
    if (!inviteCode || typeof inviteCode !== "string") {
      throw new BadRequestError("Invite code is required");
    }

    const group = await prisma.transcriptionGroup.findUnique({
      where: { inviteCode: inviteCode.trim().toUpperCase() },
      include: { members: true },
    });

    if (!group) throw new NotFoundError("Group not found");

    const alreadyMember = group.members.some((m) => m.userId === req.user!.id);
    if (alreadyMember) {
      return res.json({
        success: true,
        data: group,
        message: "Already a member",
      });
    }

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: req.user.id,
        role: "member",
      },
    });

    const updated = await prisma.transcriptionGroup.findUnique({
      where: { id: group.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyGroups = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const memberships = await prisma.groupMember.findMany({
      where: { userId: req.user.id },
      include: {
        group: {
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    res.json({
      success: true,
      data: memberships.map((m) => m.group),
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id } = req.params;

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: req.user.id },
    });

    if (!membership) throw new ForbiddenError("Not a member of this group");

    const group = await prisma.transcriptionGroup.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!group) throw new NotFoundError("Group not found");

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const skip = (page - 1) * limit;

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: req.user.id },
    });

    if (!membership) throw new ForbiddenError("Not a member of this group");

    const [messages, total] = await Promise.all([
      prisma.groupMessage.findMany({
        where: { groupId: id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.groupMessage.count({ where: { groupId: id } }),
    ]);

    res.json({
      success: true,
      data: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id } = req.params;
    const { content } = req.body;

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: req.user.id },
    });

    if (!membership) throw new ForbiddenError("Not a member of this group");

    if (!content || typeof content !== "string") {
      throw new BadRequestError("Message content is required");
    }

    const message = await prisma.groupMessage.create({
      data: {
        groupId: id,
        userId: req.user.id,
        content: content.trim(),
        type: "text",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    emitGroupMessage(id, message);

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

export const sendVoiceMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");
    if (!req.file) throw new BadRequestError("No audio file provided");

    const { id } = req.params;
    const processAs = req.body?.processAs || "raw";

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: req.user.id },
    });

    if (!membership) throw new ForbiddenError("Not a member of this group");

    const rawText = await transcribeAudio(req.file.buffer);
    let content = rawText;
    let rawContent: string | null = rawText;

    if (processAs === "rearranged" && rawText.trim()) {
      content = await rearrangeText(rawText);
    }

    const message = await prisma.groupMessage.create({
      data: {
        groupId: id,
        userId: req.user.id,
        content,
        rawContent,
        type: "voice",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    emitGroupMessage(id, message);

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id } = req.params;

    const group = await prisma.transcriptionGroup.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!group) throw new NotFoundError("Group not found");

    const membership = group.members.find((m) => m.userId === req.user!.id);
    if (!membership) throw new ForbiddenError("Not a member of this group");
    if (membership.role !== "admin") {
      throw new ForbiddenError("Only group admins can delete the group");
    }

    await prisma.transcriptionGroup.delete({ where: { id } });

    logger.info(`Group deleted: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      message: "Group deleted",
    });
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id } = req.params;

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: req.user.id },
    });

    if (!membership) throw new ForbiddenError("Not a member of this group");

    const group = await prisma.transcriptionGroup.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!group) throw new NotFoundError("Group not found");

    await prisma.groupMember.delete({
      where: {
        groupId_userId: { groupId: id, userId: req.user.id },
      },
    });

    const remaining = await prisma.groupMember.findMany({
      where: { groupId: id },
      orderBy: { joinedAt: "asc" },
    });
    if (remaining.length === 0) {
      await prisma.transcriptionGroup.delete({ where: { id } });
    } else if (group.createdById === req.user.id) {
      await prisma.groupMember.update({
        where: { id: remaining[0].id },
        data: { role: "admin" },
      });
      await prisma.transcriptionGroup.update({
        where: { id },
        data: { createdById: remaining[0].userId },
      });
    }

    res.json({
      success: true,
      message: "Left group",
    });
  } catch (error) {
    next(error);
  }
};
