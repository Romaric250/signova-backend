import { Request, Response, NextFunction } from 'express';
import openAIService from '../services/openAIService';

class TranslateController {
  // ...existing methods...

  transcribe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No audio file provided'
        });
        return;
      }

      console.log('[Transcribe] Received file:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        bufferLength: file.buffer?.length
      });

      // Use original filename if available, otherwise construct one from mimetype
      let filename = file.originalname || 'audio.wav';
      
      // If filename doesn't have a proper extension, try to infer from mimetype
      if (!filename.includes('.') || filename.endsWith('.')) {
        const mimeToExt: Record<string, string> = {
          'audio/m4a': 'm4a',
          'audio/mp4': 'm4a',
          'audio/x-m4a': 'm4a',
          'audio/mpeg': 'mp3',
          'audio/mp3': 'mp3',
          'audio/wav': 'wav',
          'audio/wave': 'wav',
          'audio/x-wav': 'wav',
          'audio/webm': 'webm',
          'audio/ogg': 'ogg',
          'audio/aac': 'aac',
          'audio/3gpp': '3gp',
          'audio/flac': 'flac',
        };
        const ext = mimeToExt[file.mimetype] || 'wav';
        filename = `audio.${ext}`;
      }

      console.log('[Transcribe] Using filename for OpenAI:', filename);

      const result = await openAIService.transcribeAudio(file.buffer, filename);
      // ...existing code...
    } catch (error) {
      next(error);
    }
  };

  // ...existing methods...
}

export default new TranslateController();