import mongoose, { Schema, Types, Document } from 'mongoose';
import { IDevice } from '../types';

export type DeviceDocument = Document<unknown, any, IDevice> & IDevice;

const sensorMeasurementSchema = new Schema(
  {
    metric: { type: String, required: true },
    unit: { type: String, required: true }
  },
  { _id: false }
);

const sensorSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['mq4', 'dht11', 'pir', 'mq2', 'ds18b20', 'bmp280']
    },
    label: { type: String, required: true },
    measurements: [sensorMeasurementSchema]
  },
  { _id: false }
);

const deviceSchema = new Schema<DeviceDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    sensors: [sensorSchema],
    latestReading: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active'
    }
  },
  { timestamps: true }
);

// Índices
deviceSchema.index({ roomId: 1 });
deviceSchema.index({ status: 1 });
deviceSchema.index({ 'sensors.type': 1 });

export const Device = mongoose.model<DeviceDocument>('Device', deviceSchema);
