import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketsModule } from '../tickets/tickets.module.js';
import { BriefController } from './brief.controller.js';
import { BriefRepository } from './brief.repository.js';
import { BriefService } from './brief.service.js';
import { BriefTextExtractionService } from './brief-text-extraction.service.js';
import { Brief, BriefSchema } from './entities/brief.entity.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Brief.name, schema: BriefSchema }]),
    TicketsModule,
  ],
  controllers: [BriefController],
  providers: [BriefService, BriefRepository, BriefTextExtractionService],
})
export class BriefModule {}
