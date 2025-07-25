import { Schema, model, Document, Types } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  deadline: Date;
  progress: number;
  status: 'Aktif' | 'Tamamlandı' | 'Beklemede';
  assignedEmployees: Types.ObjectId[];
  tasks: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  calculateProgress(): Promise<void>;
}

const projectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  deadline: {
    type: Date,
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Aktif', 'Tamamlandı', 'Beklemede'],
    default: 'Aktif'
  },
  assignedEmployees: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  tasks: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
projectSchema.index({ createdBy: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ deadline: 1 });
projectSchema.index({ assignedEmployees: 1 });

// Method to calculate progress
projectSchema.methods.calculateProgress = async function() {
  const Task = model('Task');
  const tasks = await Task.find({ project: this._id });
  
  if (tasks.length === 0) {
    this.progress = 0;
    this.status = 'Aktif';
    return;
  }
  
  const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
  this.progress = Math.round(totalProgress / tasks.length);
  
  // Auto-update status based on progress
  if (this.progress === 100) {
    this.status = 'Tamamlandı';
  } else if (this.progress > 0) {
    this.status = 'Aktif';
  }
};

// Pre-save middleware to calculate progress
projectSchema.pre('save', async function() {
  if (this.isModified('tasks') || this.isNew) {
    await this.calculateProgress();
  }
});

export const Project = model<IProject>('Project', projectSchema);
