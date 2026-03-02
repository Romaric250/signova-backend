// src/controllers/chats.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/errors";
import { transcribeAudio } from "../services/transcription.service";
import { rearrangeText } from "../services/text-processing.service";
import { emitChatMessage } from "../websocket/emitter";
import { sendNewChatEmail } from "../services/email.service";
import logger from "../utils/logger";

export const getMyChats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const chats = await prisma.chatParticipant.findMany({
      where: { userId: req.user.id },
      include: {
        chat: {
          include: {
            participants: {
              include: { user: { select: { id: true, name: true, email: true, image: true } } },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: "desc" },
              include: { user: { select: { id: true, name: true } } },
            },
            _count: { select: { messages: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const result = await Promise.all(
      chats.map(async (p) => {
        const other = p.chat.participants.find((x) => x.userId !== req.user!.id);
        const lastMsg = p.chat.messages[0];
        const lastReadAt = p.lastReadAt;
        const totalCount = p.chat._count.messages;
        const unreadCount = await prisma.chatMessage.count({
          where: {
            chatId: p.chat.id,
            userId: { not: req.user!.id },
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });

        return {
          id: p.chat.id,
          otherUser: other?.user,
          lastMessage: lastMsg
            ? {
                content: lastMsg.content,
                createdAt: lastMsg.createdAt,
                fromUser: lastMsg.user,
              }
            : null,
          joinedAt: p.joinedAt,
          totalCount,
          unreadCount,
        };
      })
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const q = ((req.query.q as string) || "").trim();
    if (!q) {
      return res.json({ success: true, data: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true, image: true },
      take: 20,
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const getOrCreateChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { userId: otherUserId } = req.params;

    if (otherUserId === req.user.id) {
      throw new BadRequestError("Cannot chat with yourself");
    }

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, email: true, image: true },
    });
    if (!otherUser) throw new NotFoundError("User not found");

    let chat = await prisma.chat.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: req.user.id } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    });

    if (!chat) {
      const participants = await prisma.user.findMany({
        where: { id: { in: [req.user.id, otherUserId] } },
      });
      if (participants.length !== 2) throw new NotFoundError("User not found");

      chat = await prisma.chat.create({
        data: {
          participants: {
            create: [
              { userId: req.user.id },
              { userId: otherUserId },
            ],
          },
        },
        include: {
          participants: {
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
          },
        },
      });

      if (otherUser.email) {
        const me = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { name: true },
        });
        sendNewChatEmail(
          otherUser.email,
          otherUser.name,
          me?.name || "Someone"
        ).catch((e) => logger.error("Failed to send new chat email:", e));
      }
    }

    res.json({ success: true, data: chat });
  } catch (error) {
    next(error);
  }
};

export const getChatById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id } = req.params;

    const participant = await prisma.chatParticipant.findFirst({
      where: { chatId: id, userId: req.user.id },
    });
    if (!participant) throw new ForbiddenError("Not a participant of this chat");

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    });

    if (!chat) throw new NotFoundError("Chat not found");

    res.json({ success: true, data: chat });
  } catch (error) {
    next(error);
  }
};

export const getChatMessages = async (
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

    const participant = await prisma.chatParticipant.findFirst({
      where: { chatId: id, userId: req.user.id },
    });
    if (!participant) throw new ForbiddenError("Not a participant of this chat");

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { chatId: id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.chatMessage.count({ where: { chatId: id } }),
    ]);

    await prisma.chatParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() },
    });

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

export const sendChatMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id } = req.params;
    const { content } = req.body;

    const participant = await prisma.chatParticipant.findFirst({
      where: { chatId: id, userId: req.user.id },
    });
    if (!participant) throw new ForbiddenError("Not a participant of this chat");

    if (!content || typeof content !== "string" || !content.trim()) {
      throw new BadRequestError("Message content is required");
    }

    const message = await prisma.chatMessage.create({
      data: {
        chatId: id,
        userId: req.user.id,
        content: content.trim(),
        type: "text",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    emitChatMessage(id, message);

    res.status(201).json({ success: true, data: message });
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

    const participant = await prisma.chatParticipant.findFirst({
      where: { chatId: id, userId: req.user.id },
    });
    if (!participant) throw new ForbiddenError("Not a participant of this chat");

    const rawText = await transcribeAudio(req.file.buffer);
    let content = rawText;
    let rawContent: string | null = rawText;

    if (processAs === "rearranged" && rawText.trim()) {
      content = await rearrangeText(rawText);
    }

    const message = await prisma.chatMessage.create({
      data: {
        chatId: id,
        userId: req.user.id,
        content,
        rawContent,
        type: "voice",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    emitChatMessage(id, message);

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

export const updateChatMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id, messageId } = req.params;
    const { content } = req.body;

    const participant = await prisma.chatParticipant.findFirst({
      where: { chatId: id, userId: req.user.id },
    });
    if (!participant) throw new ForbiddenError("Not a participant of this chat");

    const message = await prisma.chatMessage.findFirst({
      where: { id: messageId, chatId: id },
    });
    if (!message) throw new NotFoundError("Message not found");
    if (message.userId !== req.user.id) {
      throw new ForbiddenError("You can only edit your own messages");
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      throw new BadRequestError("Message content is required");
    }

    const updated = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { content: content.trim() },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    emitChatMessage(id, { ...updated, _action: "update" });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteChatMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new BadRequestError("User not found");

    const { id, messageId } = req.params;

    const participant = await prisma.chatParticipant.findFirst({
      where: { chatId: id, userId: req.user.id },
    });
    if (!participant) throw new ForbiddenError("Not a participant of this chat");

    const message = await prisma.chatMessage.findFirst({
      where: { id: messageId, chatId: id },
    });
    if (!message) throw new NotFoundError("Message not found");
    if (message.userId !== req.user.id) {
      throw new ForbiddenError("You can only delete your own messages");
    }

    await prisma.chatMessage.delete({ where: { id: messageId } });

    emitChatMessage(id, { id: messageId, _action: "delete" });

    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    next(error);
  }
};
