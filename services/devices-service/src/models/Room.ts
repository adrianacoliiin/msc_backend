import mongoose, { Schema, Document } from 'mongoose';
import { IRoom } from '../types';

interface RoomDocument extends IRoom, Document {}

const roomSchema = new Schema<RoomDocument>({
  number: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  floor: {
    type: Number,
    required: true,
    min: 1
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Índices
roomSchema.index({ number: 1 });
roomSchema.index({ floor: 1 });
roomSchema.index({ status: 1 });

export const Room = mongoose.model<RoomDocument>('Room', roomSchema);