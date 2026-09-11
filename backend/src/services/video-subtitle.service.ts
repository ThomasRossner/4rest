import fs from 'fs';
import path from 'path';
import { File as NodeFile } from 'node:buffer';
import OpenAI from 'openai';

type SubtitleMap = { de?: string; en?: string };

function getBaseUrl(): string {
  const baseUrl =
    process.env.BASE_URL || process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5001';
  return baseUrl.replace(/\/$/, '');
}

function publicUploadFileUrl(filename: string): string {
  return `${getBaseUrl()}/uploads/${filename}`;
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}

export async function generateAndStoreVideoSubtitles(params: {
  videoFilePath: string;
  videoFilename: string;
}): Promise<SubtitleMap | null> {
  if (typeof (globalThis as any).File === 'undefined') {
    (globalThis as any).File = NodeFile;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const stat = await fs.promises.stat(params.videoFilePath);
  const maxWhisperBytes = 24 * 1024 * 1024;
  if (stat.size > maxWhisperBytes) {
    console.warn('[VIDEO SUBTITLES] Skip (file too large for whisper-1)', {
      file: params.videoFilename,
      sizeBytes: stat.size,
    });
    return null;
  }

  const openai = new OpenAI({ apiKey });

  const deResp = await openai.audio.transcriptions.create({
    file: fs.createReadStream(params.videoFilePath),
    model: 'whisper-1',
    language: 'de',
    response_format: 'vtt',
  });
  const enResp = await openai.audio.translations.create({
    file: fs.createReadStream(params.videoFilePath),
    model: 'whisper-1',
    response_format: 'vtt',
  });

  const deVtt = asString(deResp).trim();
  const enVtt = asString(enResp).trim();
  if (!deVtt && !enVtt) {
    return null;
  }

  const parsed = path.parse(params.videoFilename);
  const deFilename = `${parsed.name}.de.vtt`;
  const enFilename = `${parsed.name}.en.vtt`;
  const targetDir = path.dirname(params.videoFilePath);

  if (deVtt) {
    await fs.promises.writeFile(path.join(targetDir, deFilename), deVtt, 'utf8');
  }
  if (enVtt) {
    await fs.promises.writeFile(path.join(targetDir, enFilename), enVtt, 'utf8');
  }

  return {
    ...(deVtt ? { de: publicUploadFileUrl(deFilename) } : {}),
    ...(enVtt ? { en: publicUploadFileUrl(enFilename) } : {}),
  };
}
