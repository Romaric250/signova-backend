// src/config/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/express";

const f = createUploadthing();

export const uploadRouter = {
  avatarUpload: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ file }) => {
    return { url: file.url };
  }),

  signVideoUpload: f({
    video: { maxFileSize: "16MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ file }) => {
    return { url: file.url };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;

