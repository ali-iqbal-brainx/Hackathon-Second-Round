import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { TicketsRepository, TicketCreateInput } from './tickets.repository.js';
import type { TicketDocument } from './entities/ticket.entity.js';

@Injectable()
export class TicketsService {
  constructor(private readonly ticketsRepository: TicketsRepository) {}

  insertManyForBrief(
    briefId: Types.ObjectId,
    items: TicketCreateInput[],
  ): Promise<TicketDocument[]> {
    return this.ticketsRepository.insertManyForBrief(briefId, items);
  }

  findByBriefId(briefId: Types.ObjectId): Promise<TicketDocument[]> {
    return this.ticketsRepository.findByBriefId(briefId);
  }

  findByBriefIds(briefIds: Types.ObjectId[]): Promise<TicketDocument[]> {
    return this.ticketsRepository.findByBriefIds(briefIds);
  }

  deleteByBriefId(briefId: Types.ObjectId): Promise<void> {
    return this.ticketsRepository.deleteByBriefId(briefId);
  }
}
