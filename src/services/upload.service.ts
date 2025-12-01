// src/services/upload.service.ts
import { UTApi } from "uploadthing/server";
import { env } from "../config/env";
import { InternalServerError } from "../utils/errors";
import logger from "../utils/logger";

// UTApi reads from UPLOADTHING_SECRET environment variable automatically
const utapi = new UTApi();

export const uploadFile = async (file: File): Promise<string> => {
  try {
    const response = await utapi.uploadFiles(file);
    
    if (!response.data || !response.data.url) {
      throw new Error("Upload failed: No URL returned");
    }

    return response.data.url;
  } catch (error) {
    logger.error("Upload error:", error);
    throw new InternalServerError("Failed to upload file");
  }
};

export const deleteFile = async (fileKey: string): Promise<void> => {
  try {
    await utapi.deleteFiles(fileKey);
  } catch (error) {
    logger.error("Delete file error:", error);
    throw new InternalServerError("Failed to delete file");
  }
};

export const getFileKeyFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const fileKey = pathParts[pathParts.length - 1];
    return fileKey || null;
  } catch {
    return null;
  }
};

