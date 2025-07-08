//user service
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  hashPassword: string;
  role: 'admin' | 'tech' | 'user';
  oauthProviders?: {
    googleId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    hashPassword: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'tech', 'user'],
      default: 'user',
    },
    oauthProviders: {
      googleId: {
        type: String,
        required: false,
      },
    },
  },
  { timestamps: true }
);

// Índices
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
