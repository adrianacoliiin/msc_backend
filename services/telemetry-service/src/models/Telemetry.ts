import mongoose, { Schema, Document } from 'mongoose';

export interface ITelemetry extends Document {
  deviceId: mongoose.Types.ObjectId;
  sensorType: string;
  metric: string;
  value: number | boolean;
  timestamp: Date;
}

const TelemetrySchema = new Schema<ITelemetry>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    sensorType: { type: String, required: true },
    metric: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    timestamp: { type: Date, required: true, default: () => new Date() }
  },
  { timestamps: false }
);

// TTL: expira tras 31536000 segundos (365 días)
TelemetrySchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

export const Telemetry = mongoose.model<ITelemetry>('Telemetry', TelemetrySchema);
