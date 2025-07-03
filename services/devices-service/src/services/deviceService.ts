// src/services/deviceService.ts

import { Device, DeviceDocument } from '../models/Device';
import {
  CreateDeviceRequest,
  UpdateDeviceRequest,
  DeviceResponse
} from '../types/device.types';

export class DeviceService {
  async getAll(): Promise<DeviceResponse[]> {
    const devices = await Device.find().sort({ createdAt: -1 });
    return devices.map(d => this.map(d));
  }

  async getById(id: string): Promise<DeviceResponse | null> {
    const d = await Device.findById(id).populate('roomId', 'number name floor');
    return d ? this.map(d) : null;
  }

  async getByRoom(roomId: string): Promise<DeviceResponse[]> {
    const devices = await Device.find({ roomId })
      .populate('roomId', 'number name floor')
      .sort({ createdAt: -1 });
    return devices.map(d => this.map(d));
  }

  async create(data: CreateDeviceRequest): Promise<DeviceResponse> {
    const d = await new Device(data).save();
    await d.populate('roomId', 'number name floor');
    return this.map(d);
  }

  async update(
    id: string,
    data: UpdateDeviceRequest
  ): Promise<DeviceResponse | null> {
    const d = await Device.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    }).populate('roomId', 'number name floor');
    return d ? this.map(d) : null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await Device.findByIdAndDelete(id);
    return !!res;
  }

  private map(d: DeviceDocument): DeviceResponse {
    return {
      // Usa la propiedad virtual `id` en vez de `_id.toString()`
      id: d.id,
      name: d.name,
      description: d.description,
      roomId:
        // Si está poblado, toma el _id del objeto; si no, la cadena
        (d.roomId as any)._id
          ? (d.roomId as any)._id.toString()
          : d.roomId.toString(),
      sensors: d.sensors,
      latestReading: d.latestReading || {},
      status: d.status,
      createdAt: d.createdAt!,
      updatedAt: d.updatedAt!
    };
  }
}
