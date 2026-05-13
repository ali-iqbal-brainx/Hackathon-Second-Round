import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brief, BriefDocument } from './entities/brief.entity.js';

@Injectable()
export class BriefRepository {
  constructor(
    @InjectModel(Brief.name) private readonly briefModel: Model<Brief>,
  ) {}

  create(data: Partial<Brief>): Promise<BriefDocument> {
    return this.briefModel.create(data);
  }

  findById(id: Types.ObjectId): Promise<BriefDocument | null> {
    return this.briefModel.findById(id).exec();
  }

  findAllSortedByCreatedDesc(): Promise<BriefDocument[]> {
    return this.briefModel.find().sort({ createdAt: -1 }).exec();
  }

  updateById(
    id: Types.ObjectId,
    update: Partial<Pick<Brief, keyof Brief>>,
  ): Promise<BriefDocument | null> {
    return this.briefModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }
}
