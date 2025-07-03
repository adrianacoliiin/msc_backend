import { Types } from 'mongoose';

export interface SensorMeasurement {
  metric: string;
  unit: string;
}

export interface Sensor {
  type: string;
  label: string;
  measurements: SensorMeasurement[];
}

export interface LatestReadingValue {
  value: number | boolean;
  timestamp: Date;
}

export interface LatestReading {
  [sensorType: string]: {
    [metric: string]: LatestReadingValue;
  };
}

export interface IDevice {
  // _id lo aporta Mongoose.Document
  name: string;
  description?: string;
  roomId: Types.ObjectId | string; // puede ser ObjectId o string
  sensors: Sensor[];
  latestReading?: LatestReading;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRoom {
  // _id lo aporta Mongoose.Document
  number: string;
  name: string;
  description?: string;
  floor: number;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt?: Date;
  updatedAt?: Date;
}
