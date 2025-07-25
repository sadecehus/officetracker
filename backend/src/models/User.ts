import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  surname: string;
  email: string;
  password: string;
  role: 'Admin' | 'Manager' | 'Employee';
  status: 'Aktif' | 'Pasif';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  surname: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 100
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Employee'],
    default: 'Employee'
  },
  status: {
    type: String,
    enum: ['Aktif', 'Pasif'],
    default: 'Aktif'
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

export const User = model<IUser>('User', userSchema);
