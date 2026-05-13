import * as path from 'node:path';

export const BRIEF_UPLOAD_ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.md',
  '.rtf',
]);

export const BRIEF_UPLOAD_MAX_FILE_BYTES = 20 * 1024 * 1024;

export const BRIEF_UPLOAD_MAX_FILES = 50;

export function isBriefUploadAllowedFilename(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return BRIEF_UPLOAD_ALLOWED_EXTENSIONS.has(ext);
}
