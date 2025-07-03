import { Room } from '../models/Room';
import { Device } from '../models/Device';
import { IRoom } from '../types';

export class RoomService {
  async getAll(): Promise<IRoom[]> {
    return await Room.find().sort({ floor: 1, number: 1 }).lean();
  }

  async getById(id: string): Promise<IRoom | null> {
    return await Room.findById(id).lean();
  }

  async create(data: Partial<IRoom>): Promise<IRoom> {
    const room = new Room(data);
    return await room.save();
  }

  async update(id: string, data: Partial<IRoom>): Promise<IRoom | null> {
    return await Room.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  }

  async delete(id: string): Promise<IRoom | null> {
    return await Room.findByIdAndDelete(id).lean();
  }

  async countDevices(id: string): Promise<number> {
    return await Device.countDocuments({ roomId: id });
  }
}