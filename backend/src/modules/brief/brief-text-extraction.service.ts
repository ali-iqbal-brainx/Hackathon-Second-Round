import { BadRequestException, Injectable } from '@nestjs/common';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import * as path from 'node:path';
import { BRIEF_UPLOAD_ALLOWED_EXTENSIONS } from './brief-upload.constants.js';

@Injectable()
export class BriefTextExtractionService {
  private getExtension(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    return ext;
  }

  async extractFromFiles(
    files: Express.Multer.File[],
  ): Promise<{ originalText: string; fileNames: string[] }> {
    const fileNames = files.map((f) => f.originalname);
    const parts: string[] = [];

    for (const file of files) {
      const ext = this.getExtension(file.originalname);
      if (!BRIEF_UPLOAD_ALLOWED_EXTENSIONS.has(ext)) {
        throw new BadRequestException(
          `Unsupported file type for "${file.originalname}". Allowed: .pdf, .doc, .docx, .txt, .md, .rtf`,
        );
      }

      let text: string;
      try {
        text = await this.extractBuffer(file.buffer, ext, file.originalname);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown extraction error';
        throw new BadRequestException(
          `Could not extract text from "${file.originalname}": ${message}`,
        );
      }

      parts.push(`\n\n--- ${file.originalname} ---\n\n${text}`);
    }

    const originalText = parts.join('').trim();
    return { originalText, fileNames };
  }

  private async extractBuffer(
    buffer: Buffer,
    ext: string,
    originalname: string,
  ): Promise<string> {
    if (ext === '.pdf') {
      const parser = new PDFParse({ data: buffer });
      try {
        const textResult = await parser.getText();
        return textResult.text ?? '';
      } finally {
        await parser.destroy();
      }
    }

    if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value ?? '';
    }

    if (ext === '.txt' || ext === '.md' || ext === '.rtf') {
      return buffer.toString('utf8');
    }

    throw new BadRequestException(
      `Unsupported file type for "${originalname}". Allowed: .pdf, .doc, .docx, .txt, .md, .rtf`,
    );
  }
}
