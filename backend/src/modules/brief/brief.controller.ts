import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { memoryStorage } from 'multer';
import { Types } from 'mongoose';
import {
  BRIEF_UPLOAD_MAX_FILE_BYTES,
  BRIEF_UPLOAD_MAX_FILES,
  isBriefUploadAllowedFilename,
} from './brief-upload.constants.js';
import { BriefService } from './brief.service.js';
import { SubmitBriefAnswersDto } from './dto/submit-brief-answers.dto.js';

function briefUploadMulterOptions() {
  return {
    storage: memoryStorage(),
    limits: { fileSize: BRIEF_UPLOAD_MAX_FILE_BYTES },
    fileFilter(
      _req: Express.Request,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) {
      if (!isBriefUploadAllowedFilename(file.originalname)) {
        cb(
          new BadRequestException(
            `Unsupported file type for "${file.originalname}". Allowed: .pdf, .doc, .docx, .txt, .md, .rtf`,
          ),
          false,
        );
        return;
      }
      cb(null, true);
    },
  };
}

@Controller('brief')
export class BriefController {
  constructor(private readonly briefService: BriefService) {}

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor(
      'files',
      BRIEF_UPLOAD_MAX_FILES,
      briefUploadMulterOptions(),
    ),
  )
  upload(@UploadedFiles() files: Express.Multer.File[]) {
    return this.briefService.upload(files ?? []);
  }

  @Post(':id/answers')
  submitAnswers(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: SubmitBriefAnswersDto,
  ) {
    return this.briefService.submitAnswers(id, dto.answers);
  }

  @Get('history')
  history() {
    return this.briefService.getHistory();
  }

  @Get(':id')
  getOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.briefService.getOne(id);
  }
}
