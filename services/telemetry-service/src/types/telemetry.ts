// src/types/telemetry.ts
export interface TelemetryReading {
  metric: string;
  value: number | boolean;
  timestamp: string; // ISO string
}

export interface TelemetryBatch {
  sensorType: string;
  readings: TelemetryReading[];
}

export interface TelemetrySingle {
  sensorType: string;
  metric: string;
  value: number | boolean;
  timestamp: string; // ISO string
}

export type TelemetryInput = TelemetrySingle | TelemetryBatch;

export interface LatestReadingValue {
  [metric: string]: {
    value: number | boolean;
    timestamp: string;
  };
}

export interface DeviceUpdateEvent {
  type: 'SENSOR_READING';
  deviceId: string;
  sensorType: string;
  readings: LatestReadingValue;
  timestamp: string;
}