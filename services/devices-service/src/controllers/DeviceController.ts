import { Request, Response } from 'express';
import { Device } from '../models/Device';
import { Room } from '../models/Room';

export class DeviceController {
  // GET /api/devices
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const devices = await Device.find()
        .populate('roomId', 'number name floor')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        message: 'Devices retrieved successfully',
        data: devices
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error retrieving devices'
      });
    }
  }

  // GET /api/devices/:id
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const device = await Device.findById(req.params.id)
        .populate('roomId', 'number name floor description');

      if (!device) {
        res.status(404).json({
          success: false,
          error: 'Device not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Device retrieved successfully',
        data: device
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error retrieving device'
      });
    }
  }

  // GET /api/devices/room/:roomId
  async getByRoom(req: Request, res: Response): Promise<void> {
    try {
      const devices = await Device.find({ roomId: req.params.roomId })
        .populate('roomId', 'number name floor')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        message: 'Devices retrieved successfully',
        data: devices
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error retrieving devices'
      });
    }
  }

  // POST /api/devices
  async create(req: Request, res: Response): Promise<void> {
    try {
      // Verificar que el cuarto existe
      const room = await Room.findById(req.body.roomId);
      if (!room) {
        res.status(400).json({
          success: false,
          error: 'Room not found'
        });
        return;
      }

      const device = new Device(req.body);
      await device.save();

      // Populate room info
      await device.populate('roomId', 'number name floor');

      res.status(201).json({
        success: true,
        message: 'Device created successfully',
        data: device
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error creating device'
      });
    }
  }

  // PUT /api/devices/:id
  async update(req: Request, res: Response): Promise<void> {
    try {
      if (req.body.roomId) {
        const room = await Room.findById(req.body.roomId);
        if (!room) {
          res.status(400).json({
            success: false,
            error: 'Room not found'
          });
          return;
        }
      }

      const device = await Device.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('roomId', 'number name floor');

      if (!device) {
        res.status(404).json({
          success: false,
          error: 'Device not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Device updated successfully',
        data: device
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error updating device'
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const device = await Device.findByIdAndDelete(req.params.id);
      if (!device) {
        res.status(404).json({
          success: false,
          error: 'Device not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Device deleted successfully',
        data: device
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error deleting device'
      });
    }
  }

  async updateReading(req: Request, res: Response): Promise<void> {
    try {
      const { sensorType, readings } = req.body;
      const device = await Device.findById(req.params.id);
      if (!device) {
        res.status(404).json({ success: false, error: 'Device not found' });
        return;
      }

      // Validar sensorType…
      if (!device.sensors.some(s => s.type === sensorType)) {
        res.status(400).json({ success: false, error: `Sensor ${sensorType} not found` });
        return;
      }

      // Inicializar si no existe
      if (!device.latestReading) device.latestReading = {};

      // Asignar la nueva lectura
      device.latestReading[sensorType] = readings;

      device.markModified('latestReading');

      device.updatedAt = new Date();

      await device.save();

      res.json({
        success: true,
        message: 'Device readings updated successfully',
        data: device
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Error updating device readings' });
    }
  }
}