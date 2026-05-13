import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TicketDocument = HydratedDocument<Ticket>;

export enum TicketPriority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export enum TicketType {
  Frontend = 'Frontend',
  Backend = 'Backend',
  Design = 'Design',
}

@Schema({
  collection: 'tickets',
  timestamps: { createdAt: 'createdAt', updatedAt: false },
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      const out = { ...(ret as object) } as Record<string, unknown>;
      delete out.__v;
      if (
        out._id != null &&
        typeof out._id === 'object' &&
        'toString' in out._id
      ) {
        out.id = (out._id as Types.ObjectId).toString();
        delete out._id;
      }
      if (out.briefId != null) {
        const bid = out.briefId;
        if (bid instanceof Types.ObjectId) {
          out.briefId = bid.toHexString();
        } else if (typeof bid === 'string') {
          out.briefId = bid;
        } else {
          out.briefId = '';
        }
      }
      return out;
    },
  },
  toObject: { virtuals: true },
})
export class Ticket {
  @Prop({ type: Types.ObjectId, ref: 'Brief', required: true, index: true })
  briefId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  acceptanceCriteria: string[];

  @Prop({
    type: String,
    enum: TicketPriority,
    required: true,
  })
  priority: TicketPriority;

  @Prop({
    type: String,
    enum: TicketType,
    required: true,
  })
  type: TicketType;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
