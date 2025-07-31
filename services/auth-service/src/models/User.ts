// src/models/User.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  hashPassword?: string;
  role: 'admin' | 'tech' | 'user';
  status: 'pending' | 'active' | 'rejected';
  name?: string;
  last_name?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  oauthProviders?: {
    googleId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isResetTokenValid?: () => boolean;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  hashPassword: {
    type: String,
    required: function(this: IUser) {
      return !this.oauthProviders?.googleId;
    },
  },
  role: {
    type: String,
    enum: ['admin', 'tech', 'user'],
    default: 'user',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected'],
    default: 'pending',
    required: true,
    index: true,
  },
  name: {
    type: String,
    trim: true,
    maxlength: 50,
  },
  last_name: {
    type: String,
    trim: true,
    maxlength: 50,
  },
  resetPasswordToken: {
    type: String,
    index: true,
  },
  resetPasswordExpires: {
    type: Date,
    index: true,
  },
  oauthProviders: {
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
  },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.hashPassword;
      delete ret.resetPasswordToken;
      delete ret.__v;
      return ret;
    },
  },
});

// Índices compuestos
userSchema.index({ email: 1, status: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

// Middleware de limpieza automática eliminado para evitar interferencias con operaciones de consulta.
// Se recomienda implementar limpieza manual o mediante tarea programada si es necesario.

// Método de instancia para validar tokens de restablecimiento
userSchema.methods.isResetTokenValid = function(): boolean {
  return !!(
    this.resetPasswordToken &&
    this.resetPasswordExpires &&
    this.resetPasswordExpires > new Date()
  );
};

// Virtual para nombre completo
userSchema.virtual('fullName').get(function(this: IUser) {
  return `${this.name || ''} ${this.last_name || ''}`.trim() || this.email;
});

export const User = mongoose.model<IUser>('User', userSchema);
