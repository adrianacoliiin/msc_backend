import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Maintenance from '../models/Maintenance.js';
import { CreateMaintenanceDTO } from '../dtos/createMaintenance.dto.js';

export class MaintenanceController {
  async create(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { date, responsible_id, device_id, damage_image }: CreateMaintenanceDTO = req.body;

    try {
      const maintenance = new Maintenance({
        date,
        responsible_id,
        device_id,
        damage_image,
      });

      const saved = await maintenance.save();
      res.status(201).json(saved);
    } catch (err) {
      res.status(500).json({ message: 'Error al crear el mantenimiento', error: err });
    }
  }

  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const maintenances = await Maintenance.find()
      res.status(200).json(maintenances);
    } catch (err) {
      res.status(500).json({ message: 'Error al obtener los mantenimientos', error: err });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const maintenance = await Maintenance.findById(req.params.id)
      if (!maintenance) {
        res.status(404).json({ message: 'Mantenimiento no encontrado' });
        return;
      }

      res.status(200).json(maintenance);
    } catch (err) {
      res.status(500).json({ message: 'Error al obtener el mantenimiento', error: err });
    }
  }

  // Opcionales
  async update(req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: 'No implementado aún' });
  }

  async delete(req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: 'No implementado aún' });
  }
}