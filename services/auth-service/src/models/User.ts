// src/models/User.ts - auth
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  hashPassword?: string;
  role: 'admin' | 'tech' | 'user';
  status: 'pending' | 'active' | 'rejected';
  oauthProviders?: {
    googleId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  hashPassword: {
    type: String,
    required: function() {
      return !this.oauthProviders?.googleId;
    }
  },
  role: {
    type: String,
    enum: ['admin', 'tech', 'user'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected'],
    default: 'pending'
  },
  oauthProviders: {
    googleId: {
      type: String,
      sparse: true
    }
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 });
userSchema.index({ 'oauthProviders.googleId': 1 });
userSchema.index({ status: 1 });

export const User = mongoose.model<IUser>('User', userSchema);