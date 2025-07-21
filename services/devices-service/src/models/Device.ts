import mongoose, { Schema, Types, Document } from 'mongoose';
import { IDevice } from '../types';

// export type DeviceDocument = Document<unknown, any, IDevice> & IDevice;
export type DeviceDocument = IDevice & Document<Types.ObjectId>;
//para que funcione lo del _id cuando sale unknown

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
      enum: ['mq4', 'dht22', 'pir']
    },
    label: { type: String, required: true },
    measurements: [sensorMeasurementSchema]
  },
  { _id: false }
);

const latestReadingSchema = new Schema(
  {
    value: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const deviceSchema = new Schema<DeviceDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    sensors: [sensorSchema],
    activationToken: { 
      type: String, 
      required: true, 
      unique: true 
    },
    latestReading: {
      type: latestReadingSchema,
      default: () => ({ value: {}, timestamp: new Date() })
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'inactive', 'maintenance'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

// Índices
deviceSchema.index({ roomId: 1 });
deviceSchema.index({ status: 1 });
deviceSchema.index({ activationToken: 1 });
deviceSchema.index({ 'sensors.type': 1 });

export const Device = mongoose.model<DeviceDocument>('Device', deviceSchema);