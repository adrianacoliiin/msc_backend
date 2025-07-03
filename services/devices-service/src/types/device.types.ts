// src/types/device.types.ts

export interface CreateDeviceRequest {
    name: string;
    description?: string;
    roomId: string;  // Mongo ObjectId en forma de string
    sensors: {
      type: string;
      label: string;
      measurements: { metric: string; unit: string }[];
    }[];
    status?: 'active' | 'inactive' | 'maintenance';
  }
  
  export interface UpdateDeviceRequest extends Partial<CreateDeviceRequest> {}
  
  export interface DeviceResponse {
    id: string;
    name: string;
    description?: string;
    roomId: string;
    sensors: {
      type: string;
      label: string;
      measurements: { metric: string; unit: string }[];
    }[];
    latestReading: any;
    status: 'active' | 'inactive' | 'maintenance';
    createdAt: Date;
    updatedAt: Date;
  }
  