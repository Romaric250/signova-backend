import { Injectable } from '@nestjs/common';
import { Configuration, OpenAIApi } from 'openai';

@Injectable()
export class OpenaiService {
  private openai: OpenAIApi;

  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
    // Determine MIME type from filename extension
    const extension = filename.split('.').pop()?.toLowerCase() || 'wav';
    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'm4a': 'audio/m4a',
      'aac': 'audio/aac',
      '3gp': 'audio/3gpp',
      'ogg': 'audio/ogg',
      'webm': 'audio/webm',
      'flac': 'audio/flac',
      'mp4': 'audio/mp4',
      'mpeg': 'audio/mpeg',
      'mpga': 'audio/mpeg',
    };
    const mimeType = mimeTypes[extension] || 'audio/wav';
    
    console.log('[OpenAI] Transcribing audio:', { filename, extension, mimeType, bufferSize: audioBuffer.length });
    
    const file = new File([audioBuffer], filename, { type: mimeType });
    // ...existing code...
  }
}