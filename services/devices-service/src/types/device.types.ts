// src/types/device.types.ts

export interface RegisterDeviceRequest {
  name: string;
  description?: string;
  roomId: string;  // Mongo ObjectId en forma de string
  sensorType: 'mq4' | 'dht22' | 'pir';
  sensorLabel: string;
  metric: string;
  unit: string;
}

export interface ActivateDeviceRequest {
  token: string;
}

export interface CreateDeviceRequest {
  name: string;
  description?: string;
  roomId: string;  // Mongo ObjectId en forma de string
  sensors: {
    type: 'mq4' | 'dht22' | 'pir';
    label: string;
    measurements: { metric: string; unit: string }[];
  }[];
  status?: 'pending' | 'active' | 'inactive' | 'maintenance';
}

export interface UpdateDeviceRequest extends Partial<CreateDeviceRequest> {
  activationToken?: never; // No permitir actualizar el token
}

export interface DeviceResponse {
  id: string;
  name: string;
  description?: string;
  roomId: string;
  sensors: {
    type: 'mq4' | 'dht22' | 'pir';
    label: string;
    measurements: { metric: string; unit: string }[];
  }[];
  activationToken: string;
  latestReading?: {
    value: number | boolean | object;
    timestamp: Date;
  };
  status: 'pending' | 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterDeviceResponse {
  deviceId: string;
  activationToken: string;
}

export interface ActivateDeviceResponse {
  message: string;
}