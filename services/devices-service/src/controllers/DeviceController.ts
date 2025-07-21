import { Request, Response } from 'express';
import { Device } from '../models/Device';
import { Room } from '../models/Room';
import { v4 as uuidv4 } from 'uuid';
import { 
  RegisterDeviceRequest, 
  ActivateDeviceRequest,
  RegisterDeviceResponse,
  ActivateDeviceResponse 
} from '../types/device.types';

export class DeviceController {
  
  // POST /api/devices/register - Registrar nuevo dispositivo
  async registerDevice(req: Request<{}, RegisterDeviceResponse, RegisterDeviceRequest>, res: Response<RegisterDeviceResponse>): Promise<void> {
    try {
      const { name, description, roomId, sensorType, sensorLabel, metric, unit } = req.body;

      // Verificar que el cuarto existe
      const room = await Room.findById(roomId);
      if (!room) {
        res.status(400).json({
          success: false,
          error: 'Room not found'
        } as any);
        return;
      }

      // Generar token de activación único
      const activationToken = uuidv4();

      // Crear el dispositivo con estado 'pending'
      const deviceData = {
        name,
        description,
        roomId,
        sensors: [{
          type: sensorType,
          label: sensorLabel,
          measurements: [{ metric, unit }]
        }],
        activationToken,
        status: 'pending' as const
      };

      const device = new Device(deviceData);
      await device.save();

      res.status(201).json({
        success: true,
        message: 'Device registered successfully',
        data: {
          deviceId: device._id.toString(),
          activationToken
        }
      } as any);
    } catch (error) {
      console.error('Error registering device:', error);
      res.status(500).json({
        success: false,
        error: 'Error registering device'
      } as any);
    }
  }

  // POST /api/devices/activate - Activar dispositivo
  async activateDevice(req: Request<{}, ActivateDeviceResponse, ActivateDeviceRequest>, res: Response<ActivateDeviceResponse>): Promise<void> {
    try {
      const { token } = req.body;

      // Buscar dispositivo por token de activación
      const device = await Device.findOne({ activationToken: token });
      
      if (!device) {
        res.status(404).json({
          success: false,
          error: 'Device not found or invalid activation token'
        } as any);
        return;
      }

      if (device.status === 'active') {
        res.status(400).json({
          success: false,
          error: 'Device is already activated'
        } as any);
        return;
      }

      // Activar el dispositivo
      device.status = 'active';
      await device.save();

      res.status(200).json({
        success: true,
        message: 'Device activated successfully',
        data: {
          message: 'Activated'
        }
      } as any);
    } catch (error) {
      console.error('Error activating device:', error);
      res.status(500).json({
        success: false,
        error: 'Error activating device'
      } as any);
    }
  }

  // GET /api/devices - Lista de dispositivos con filtros opcionales
  async getDevices(req: Request, res: Response): Promise<void> {
    try {
      const { status, roomId } = req.query;
      
      // Construir filtros
      const filters: any = {};
      if (status) filters.status = status;
      if (roomId) filters.roomId = roomId;

      const devices = await Device.find(filters)
        .populate('roomId', 'number name floor')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        message: 'Devices retrieved successfully',
        data: devices
      });
    } catch (error) {
      console.error('Error retrieving devices:', error);
      res.status(500).json({
        success: false,
        error: 'Error retrieving devices'
      });
    }
  }

  // GET /api/devices/:id - Obtener dispositivo por ID
  async getDeviceById(req: Request, res: Response): Promise<void> {
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
      console.error('Error retrieving device:', error);
      res.status(500).json({
        success: false,
        error: 'Error retrieving device'
      });
    }
  }

  // GET /api/devices/room/:roomId - Obtener dispositivos por sala
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
      console.error('Error retrieving devices:', error);
      res.status(500).json({
        success: false,
        error: 'Error retrieving devices'
      });
    }
  }

  // POST /api/devices - Crear dispositivo (método directo para admin)
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

      // Si no se proporciona activationToken, generar uno
      if (!req.body.activationToken) {
        req.body.activationToken = uuidv4();
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
      console.error('Error creating device:', error);
      res.status(500).json({
        success: false,
        error: 'Error creating device'
      });
    }
  }

  // PUT /api/devices/:id - Actualizar dispositivo
  async updateDevice(req: Request, res: Response): Promise<void> {
    try {
      // No permitir actualizar el activationToken
      delete req.body.activationToken;

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
      console.error('Error updating device:', error);
      res.status(500).json({
        success: false,
        error: 'Error updating device'
      });
    }
  }

  // DELETE /api/devices/:id - Eliminar dispositivo
  async deleteDevice(req: Request, res: Response): Promise<void> {
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
      console.error('Error deleting device:', error);
      res.status(500).json({
        success: false,
        error: 'Error deleting device'
      });
    }
  }

  // PUT /api/devices/:id/reading - Actualizar lectura del dispositivo
  async updateReading(req: Request, res: Response): Promise<void> {
    try {
      const { sensorType, readings } = req.body;
      const device = await Device.findById(req.params.id);
      
      if (!device) {
        res.status(404).json({ 
          success: false, 
          error: 'Device not found' 
        });
        return;
      }

      // Validar que el dispositivo esté activo
      if (device.status !== 'active') {
        res.status(400).json({ 
          success: false, 
          error: 'Device must be active to receive readings' 
        });
        return;
      }

      // Validar sensorType
      if (!device.sensors.some(s => s.type === sensorType)) {
        res.status(400).json({ 
          success: false, 
          error: `Sensor ${sensorType} not found` 
        });
        return;
      }

      // Actualizar la lectura
      device.latestReading = {
        value: readings,
        timestamp: new Date()
      };

      device.markModified('latestReading');
      device.updatedAt = new Date();

      await device.save();

      res.json({
        success: true,
        message: 'Device readings updated successfully',
        data: device
      });
    } catch (error) {
      console.error('Error updating device readings:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error updating device readings' 
      });
    }
  }

  // POST /api/devices/:id/data -ingestión de datos
  async ingestData(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'Data ingestion not implemented yet - coming in Phase 2'
    });
  }

  async getAll(req: Request, res: Response): Promise<void> {
    return this.getDevices(req, res);
  }
  
  async getById(req: Request, res: Response): Promise<void> {
    return this.getDeviceById(req, res);
  }

  async update(req: Request, res: Response): Promise<void> {
    return this.updateDevice(req, res);
  }

  async delete(req: Request, res: Response): Promise<void> {
    return this.deleteDevice(req, res);
  }
}