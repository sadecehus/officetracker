import { Schema, model, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  userId: Types.ObjectId;
  action: string;
  details: string;
  type: 'success' | 'info' | 'warning' | 'error';
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    maxlength: 200
  },
  details: {
    type: String,
    required: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['success', 'info', 'warning', 'error'],
    default: 'info'
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ type: 1 });
activityLogSchema.index({ createdAt: -1 });

export const ActivityLog = model<IActivityLog>('ActivityLog', activityLogSchema);
