import path from 'node:path';

const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  avi: 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
};

export function getMimeType(file: string): string {
  return MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
}
