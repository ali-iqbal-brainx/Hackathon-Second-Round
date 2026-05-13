import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BriefDocument = HydratedDocument<Brief>;

export enum BriefStatus {
  PendingAnswers = 'pending_answers',
  Generating = 'generating',
  Completed = 'completed',
}

@Schema({
  collection: 'briefs',
  timestamps: { createdAt: 'createdAt', updatedAt: false },
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      const out = ret as Record<string, unknown> & {
        _id?: { toString(): string };
        __v?: number;
      };
      delete out.__v;
      if (out._id != null) {
        out.id = out._id.toString();
        delete out._id;
      }
      return out;
    },
  },
  toObject: { virtuals: true },
})
export class Brief {
  @Prop({ required: true })
  originalText: string;

  @Prop({ type: [String], default: [] })
  fileNames: string[];

  @Prop({ type: [String], default: [] })
  clarifyingQuestions: string[];

  @Prop({ type: [String], default: [] })
  userAnswers: string[];

  @Prop({
    type: String,
    enum: BriefStatus,
    default: BriefStatus.PendingAnswers,
  })
  status: BriefStatus;
}

export const BriefSchema = SchemaFactory.createForClass(Brief);
