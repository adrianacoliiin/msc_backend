// src/types/index.ts

import { Types } from 'mongoose';

export interface SensorMeasurement {
  metric: string;
  unit: string;
}

export interface Sensor {
  type: 'mq4' | 'dht22' | 'pir';
  label: string;
  measurements: SensorMeasurement[];
}

export interface LatestReading {
  value: number | boolean | object;
  timestamp: Date;
}

export interface IDevice {
  // _id lo aporta Mongoose.Document
  name: string;
  description?: string;
  roomId: Types.ObjectId | string; // puede ser ObjectId o string
  sensors: Sensor[];
  activationToken: string;
  latestReading?: LatestReading;
  status: 'pending' | 'active' | 'inactive' | 'maintenance';
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