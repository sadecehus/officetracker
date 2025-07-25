import { Schema, model, Document, Types } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  project: Types.ObjectId;
  assignedTo: Types.ObjectId[]; // Array yapıyoruz birden fazla kişi için
  assignedBy: Types.ObjectId;
  priority: 'Düşük' | 'Orta' | 'Yüksek';
  status: 'Bekliyor' | 'Devam Ediyor' | 'Tamamlandı';
  progress: number;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignedTo: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['Düşük', 'Orta', 'Yüksek'],
    default: 'Orta'
  },
  status: {
    type: String,
    enum: ['Bekliyor', 'Devam Ediyor', 'Tamamlandı'],
    default: 'Bekliyor'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  deadline: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ project: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ assignedBy: 1 });

// Post-save middleware to update project progress
taskSchema.post('save', async function() {
  const Project = model('Project');
  const project = await Project.findById(this.project);
  if (project) {
    await (project as any).calculateProgress();
    await project.save();
  }
});

// Post-remove middleware to update project progress
taskSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Project = model('Project');
    const project = await Project.findById(doc.project);
    if (project) {
      await (project as any).calculateProgress();
      await project.save();
    }
  }
});

export const Task = model<ITask>('Task', taskSchema);
