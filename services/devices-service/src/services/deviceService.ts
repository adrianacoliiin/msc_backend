// src/services/deviceService.ts

import { Device, DeviceDocument } from '../models/Device';
import {
  CreateDeviceRequest,
  UpdateDeviceRequest,
  DeviceResponse
} from '../types/device.types';

export class DeviceService {
  private readonly ROOM_POPULATE_FIELDS = 'number name floor description';

  async getAll(): Promise<DeviceResponse[]> {
    const devices = await Device.find()
      .populate('roomId', this.ROOM_POPULATE_FIELDS)
      .sort({ createdAt: -1 });
    return devices.map(d => this.mapToResponse(d));
  }

  async getById(id: string): Promise<DeviceResponse | null> {
    const device = await Device.findById(id)
      .populate('roomId', this.ROOM_POPULATE_FIELDS);
    return device ? this.mapToResponse(device) : null;
  }

  async getByRoom(roomId: string): Promise<DeviceResponse[]> {
    const devices = await Device.find({ roomId })
      .populate('roomId', this.ROOM_POPULATE_FIELDS)
      .sort({ createdAt: -1 });
    return devices.map(d => this.mapToResponse(d));
  }

  async create(data: CreateDeviceRequest): Promise<DeviceResponse> {
    const device = new Device(data);
    await device.save();
    await device.populate('roomId', this.ROOM_POPULATE_FIELDS);
    return this.mapToResponse(device);
  }

  async update(
    id: string,
    data: UpdateDeviceRequest
  ): Promise<DeviceResponse | null> {
    const device = await Device.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    }).populate('roomId', this.ROOM_POPULATE_FIELDS);
    
    return device ? this.mapToResponse(device) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await Device.findByIdAndDelete(id);
    return !!result;
  }

  async updateReading(
    id: string, 
    sensorType: string, 
    readings: any
  ): Promise<DeviceResponse | null> {
    const device = await Device.findById(id);
    if (!device) {
      return null;
    }

    // Validar que el sensor existe
    if (!device.sensors.some(s => s.type === sensorType)) {
      throw new Error(`Sensor ${sensorType} not found in device`);
    }

    // Inicializar si no existe
    if (!device.latestReading) {
      device.latestReading = {};
    }

    // Asignar la nueva lectura
    device.latestReading[sensorType] = readings;
    device.markModified('latestReading');
    device.updatedAt = new Date();

    await device.save();
    await device.populate('roomId', this.ROOM_POPULATE_FIELDS);

    return this.mapToResponse(device);
  }

  private mapToResponse(device: DeviceDocument): DeviceResponse {
    return {
      id: device.id,
      name: device.name,
      description: device.description,
      roomId: this.extractRoomId(device.roomId),
      sensors: device.sensors,
      latestReading: device.latestReading || {},
      status: device.status,
      createdAt: device.createdAt!,
      updatedAt: device.updatedAt!
    };
  }

  private extractRoomId(roomId: any): string {
    if (typeof roomId === 'string') {
      return roomId;
    }
    return roomId._id ? roomId._id.toString() : roomId.toString();
  }
}