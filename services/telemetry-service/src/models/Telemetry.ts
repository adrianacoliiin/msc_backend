// src/models/Telemetry.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITelemetryReading {
  metric: string;
  value: number | boolean;
  timestamp: Date;
}

export interface ITelemetry extends Document {
  deviceId: mongoose.Types.ObjectId;
  sensorType: string;
  readings: ITelemetryReading[];
  timestamp: Date; // Timestamp general del mensaje
}

const TelemetryReadingSchema = new Schema<ITelemetryReading>({
  metric: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
  timestamp: { type: Date, required: true }
}, { _id: false });

const TelemetrySchema = new Schema<ITelemetry>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    sensorType: { type: String, required: true },
    readings: [TelemetryReadingSchema],
    timestamp: { type: Date, required: true, default: () => new Date() }
  },
  { timestamps: false }
);

// TTL: expira tras 31536000 segundos (365 días)
TelemetrySchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });
// Index para consultas por dispositivo y fecha
TelemetrySchema.index({ deviceId: 1, timestamp: -1 });
// Index para consultas por tipo de sensor
TelemetrySchema.index({ deviceId: 1, sensorType: 1, timestamp: -1 });

export const Telemetry = mongoose.model<ITelemetry>('Telemetry', TelemetrySchema);