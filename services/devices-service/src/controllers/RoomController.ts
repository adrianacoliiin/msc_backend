import { Request, Response } from 'express';
import { Room } from '../models/Room';
import { Device } from '../models/Device';

export class RoomController {
  // GET /api/rooms
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const rooms = await Room.find().sort({ floor: 1, number: 1 });
      res.json({
        success: true,
        message: 'Rooms retrieved successfully',
        data: rooms
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error retrieving rooms'
      });
    }
  }

  // GET /api/rooms/:id
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const room = await Room.findById(req.params.id);
      if (!room) {
        res.status(404).json({
          success: false,
          error: 'Room not found'
        });
        return;
      }

      // Obtener dispositivos de este cuarto
      const devices = await Device.find({ roomId: req.params.id });

      res.json({
        success: true,
        message: 'Room retrieved successfully',
        data: {
          room,
          devices
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error retrieving room'
      });
    }
  }

  // POST /api/rooms
  async create(req: Request, res: Response): Promise<void> {
    try {
      const room = new Room(req.body);
      await room.save();

      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: room
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(400).json({
          success: false,
          error: 'Room number already exists'
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: 'Error creating room'
      });
    }
  }

  // PUT /api/rooms/:id
  async update(req: Request, res: Response): Promise<void> {
    try {
      const room = await Room.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!room) {
        res.status(404).json({
          success: false,
          error: 'Room not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Room updated successfully',
        data: room
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error updating room'
      });
    }
  }

  // DELETE /api/rooms/:id
  async delete(req: Request, res: Response): Promise<void> {
    try {
      // Verificar si hay dispositivos asociados
      const deviceCount = await Device.countDocuments({ roomId: req.params.id });
      if (deviceCount > 0) {
        res.status(400).json({
          success: false,
          error: `Cannot delete room. ${deviceCount} devices are associated with this room.`
        });
        return;
      }

      const room = await Room.findByIdAndDelete(req.params.id);
      if (!room) {
        res.status(404).json({
          success: false,
          error: 'Room not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Room deleted successfully',
        data: room
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error deleting room'
      });
    }
  }
}