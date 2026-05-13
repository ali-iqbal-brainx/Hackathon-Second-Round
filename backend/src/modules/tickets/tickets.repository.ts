import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Ticket,
  TicketDocument,
  TicketPriority,
  TicketType,
} from './entities/ticket.entity.js';

export type TicketCreateInput = {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  priority: TicketPriority;
  type: TicketType;
};

@Injectable()
export class TicketsRepository {
  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<Ticket>,
  ) {}

  async insertManyForBrief(
    briefId: Types.ObjectId,
    items: TicketCreateInput[],
  ): Promise<TicketDocument[]> {
    if (items.length === 0) {
      return [];
    }
    const docs = items.map((item) => ({
      ...item,
      briefId,
    }));
    return this.ticketModel.insertMany(docs, { ordered: true });
  }

  async findByBriefId(briefId: Types.ObjectId): Promise<TicketDocument[]> {
    return this.ticketModel.find({ briefId }).sort({ createdAt: 1 }).exec();
  }

  async findByBriefIds(briefIds: Types.ObjectId[]): Promise<TicketDocument[]> {
    if (briefIds.length === 0) {
      return [];
    }
    return this.ticketModel
      .find({ briefId: { $in: briefIds } })
      .sort({ createdAt: 1 })
      .exec();
  }

  async deleteByBriefId(briefId: Types.ObjectId): Promise<void> {
    await this.ticketModel.deleteMany({ briefId }).exec();
  }
}
