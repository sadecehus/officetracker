import { Schema, model, Document, Types } from 'mongoose';

export interface IHelpRequest extends Document {
  taskId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  helpedBy?: Types.ObjectId;
  status: 'Bekliyor' | 'Kabul Edildi' | 'Tamamlandı';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const helpRequestSchema = new Schema<IHelpRequest>({
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  helpedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Bekliyor', 'Kabul Edildi', 'Tamamlandı'],
    default: 'Bekliyor'
  },
  message: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes
helpRequestSchema.index({ requestedBy: 1 });
helpRequestSchema.index({ helpedBy: 1 });
helpRequestSchema.index({ status: 1 });
helpRequestSchema.index({ taskId: 1 });

export const HelpRequest = model<IHelpRequest>('HelpRequest', helpRequestSchema);
