import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Maintenance from '../models/Maintenance.js';
import { CreateMaintenanceDTO } from '../dtos/createMaintenance.dto.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Types } from 'mongoose';
import { cloudinary } from '../config/cloudinary.js';

export class MaintenanceController {
  async create(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      date,
      responsible_id,
      device_id,
      priority,
      description,
    }: CreateMaintenanceDTO = req.body;

    try {
      const file = req.file as any;

      const maintenance = new Maintenance({
        date,
        responsible_id: new Types.ObjectId(responsible_id),
        device_id: new Types.ObjectId(device_id),
        priority: priority || 'medium',
        description,
        damage_image: file?.path || null, // URL pública
        cloudinary_id: file?.public_id || null, // Puedes guardarlo si tu modelo lo permite
      });

      const saved = await maintenance.save();
      res.status(201).json(saved);
    } catch (err) {
      const file = req.file as any;

      // Si hubo error y se subió imagen, eliminarla de Cloudinary
      if (file?.public_id) {
        try {
          await cloudinary.uploader.destroy(file.public_id);
        } catch (deleteError) {
          console.error('Error al eliminar imagen de Cloudinary:', deleteError);
        }
      }

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

  // Validar transiciones de estado válidas
  private static isValidStateTransition(currentState: string, newState: string): boolean {
    const validTransitions: { [key: string]: string[] } = {
      'pending': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': ['approved'],
      'cancelled': [], // No se puede cambiar desde cancelled
      'approved': [] // No se puede cambiar desde approved
    };

    return validTransitions[currentState]?.includes(newState) || false;
  }

  // Cambiar estado del mantenimiento
  async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;

    try {
      const maintenance = await Maintenance.findById(id);
      if (!maintenance) {
        res.status(404).json({ message: 'Mantenimiento no encontrado' });
        return;
      }

      // Validar transición de estado
      if (!MaintenanceController.isValidStateTransition(maintenance.status, status)) {
        res.status(400).json({ 
          message: `No se puede cambiar de ${maintenance.status} a ${status}`,
          currentStatus: maintenance.status,
          requestedStatus: status 
        });
        return;
      }

      // Solo técnicos y admins pueden cambiar a in_progress y completed
      if ((status === 'in_progress' || status === 'completed') && 
          !['admin', 'tech'].includes(req.user?.role || '')) {
        res.status(403).json({ message: 'No tienes permisos para cambiar a este estado' });
        return;
      }

      // Solo el responsable asignado puede cambiar su propio mantenimiento
      if (status === 'in_progress' || status === 'completed') {
        if (maintenance.responsible_id.toString() !== userId) {
          res.status(403).json({ message: 'Solo el responsable asignado puede cambiar este estado' });
          return;
        }
      }

      // Actualizar el mantenimiento
      maintenance.status = status;
      await maintenance.save();

      // Populate para respuesta completa
      const updatedMaintenance = await Maintenance.findById(id)
        // .populate('responsible_id', 'name email')
        // .populate('device_id', 'name model serialNumber')
        // .populate('approved_by', 'name email');

      res.status(200).json({
        message: `Estado cambiado a ${status}`,
        maintenance: updatedMaintenance
      });
    } catch (err) {
      res.status(500).json({ message: 'Error al actualizar el estado', error: err });
    }
  }

  // Aprobar mantenimiento (solo admins)
  async approveMaintenance(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user?.userId;

    try {
      const maintenance = await Maintenance.findById(id);
      if (!maintenance) {
        res.status(404).json({ message: 'Mantenimiento no encontrado' });
        return;
      }

      // Solo se puede aprobar si está en estado 'completed'
      if (maintenance.status !== 'completed') {
        res.status(400).json({ 
          message: 'Solo se pueden aprobar mantenimientos completados',
          currentStatus: maintenance.status 
        });
        return;
      }

      maintenance.status = 'approved';
      maintenance.approved_by = userId ? new Types.ObjectId(userId) : undefined;
      await maintenance.save();

      // Populate para respuesta completa
      const approvedMaintenance = await Maintenance.findById(id)
        // .populate('responsible_id', 'name email')
        // .populate('device_id', 'name model serialNumber')
        // .populate('approved_by', 'name email');

      res.status(200).json({
        message: 'Mantenimiento aprobado exitosamente',
        maintenance: approvedMaintenance
      });
    } catch (err) {
      res.status(500).json({ message: 'Error al aprobar el mantenimiento', error: err });
    }
  }

  // Cancelar mantenimiento
  async cancelMaintenance(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { reason } = req.body; // Razón opcional de cancelación

    try {
      const maintenance = await Maintenance.findById(id);
      if (!maintenance) {
        res.status(404).json({ message: 'Mantenimiento no encontrado' });
        return;
      }

      // Solo se puede cancelar si está en 'pending' o 'in_progress'
      if (!['pending', 'in_progress'].includes(maintenance.status)) {
        res.status(400).json({ 
          message: `No se puede cancelar un mantenimiento en estado ${maintenance.status}`,
          currentStatus: maintenance.status 
        });
        return;
      }

      // Solo admins o el responsable asignado pueden cancelar
      if (req.user?.role !== 'admin' && 
          maintenance.responsible_id.toString() !== req.user?.userId) {
        res.status(403).json({ message: 'No tienes permisos para cancelar este mantenimiento' });
        return;
      }

      maintenance.status = 'cancelled';
      if (reason) {
        // Si tienes un campo para razón de cancelación en el modelo
        (maintenance as any).cancellation_reason = reason;
      }
      await maintenance.save();

      const cancelledMaintenance = await Maintenance.findById(id)
        // .populate('responsible_id', 'name email')
        // .populate('device_id', 'name model serialNumber')
        // .populate('approved_by', 'name email');

      res.status(200).json({
        message: 'Mantenimiento cancelado exitosamente',
        maintenance: cancelledMaintenance
      });
    } catch (err) {
      res.status(500).json({ message: 'Error al cancelar el mantenimiento', error: err });
    }
  }

  // Obtener historial de cambios de estado
  async getStatusHistory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const maintenance = await Maintenance.findById(id)
        // .populate('responsible_id', 'name email')
        // .populate('device_id', 'name model serialNumber')
        // .populate('approved_by', 'name email');

      if (!maintenance) {
        res.status(404).json({ message: 'Mantenimiento no encontrado' });
        return;
      }

      // Simular historial basado en timestamps y estado actual
      const history = [
        {
          status: 'pending',
          date: maintenance.createdAt,
          user: 'Sistema'
        }
      ];

      // Si está en progreso o completado, agregar esos cambios
      if (['in_progress', 'completed', 'approved'].includes(maintenance.status)) {
        history.push({
          status: 'in_progress',
          date: maintenance.updatedAt,
          user: (maintenance as any).responsible_id?.name || 'Técnico'
        });
      }

      if (['completed', 'approved'].includes(maintenance.status)) {
        history.push({
          status: 'completed',
          date: maintenance.updatedAt,
          user: (maintenance as any).responsible_id?.name || 'Técnico'
        });
      }

      if (maintenance.status === 'approved') {
        history.push({
          status: 'approved',
          date: maintenance.updatedAt,
          user: (maintenance as any).approved_by?.name || 'Admin'
        });
      }

      res.status(200).json({
        maintenance: maintenance,
        statusHistory: history
      });
    } catch (err) {
      res.status(500).json({ message: 'Error al obtener el historial', error: err });
    }
  }

  //Actualizar mantenimiento 
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const updates = req.body;

    try {
      const maintenance = await Maintenance.findById(id);
      if (!maintenance) {
        res.status(404).json({ message: 'Mantenimiento no encontrado' });
        return;
      }

      // No permitir actualizar si ya está aprobado
      if (maintenance.status === 'approved') {
        res.status(400).json({ message: 'No se puede modificar un mantenimiento aprobado' });
        return;
      }

      // Solo permitir actualizar ciertos campos según el estado
      const allowedFields = MaintenanceController.getAllowedUpdateFields(maintenance.status);
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      // Si se sube nueva imagen, reemplazar la anterior
      if (req.file) {
        const file = req.file as any;
        filteredUpdates.damage_image = file.path;

        // Eliminar imagen anterior de Cloudinary si existe
        if (maintenance.damage_image) {
          try {
            const imageUrl = maintenance.damage_image;
            const base = 'upload/';
            const startIndex = imageUrl.indexOf(base);
            if (startIndex !== -1) {
              let publicIdWithExtension = decodeURIComponent(imageUrl.slice(startIndex + base.length));
              publicIdWithExtension = publicIdWithExtension.replace(/^v\d+\//, '');
              const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');
              await cloudinary.uploader.destroy(publicId);
              console.log('Imagen anterior eliminada:', publicId);
            }
          } catch (deleteError) {
            console.error('Error al eliminar imagen anterior:', deleteError);
          }
        }
      }

      // Guardar cambios
      const updatedMaintenance = await Maintenance.findByIdAndUpdate(
        id,
        filteredUpdates,
        { new: true, runValidators: true }
      );

      res.status(200).json({
        message: 'Mantenimiento actualizado exitosamente',
        maintenance: updatedMaintenance,
      });
    } catch (err) {
      // Si hubo error y se subió nueva imagen, eliminarla
      if (req.file) {
        try {
          const file = req.file as any;
          if (file.public_id) {
            await cloudinary.uploader.destroy(file.public_id);
            console.log('Imagen subida eliminada por error:', file.public_id);
          }
        } catch (deleteError) {
          console.error('Error al eliminar imagen subida tras fallo:', deleteError);
        }
      }
      console.error('Error al actualizar el mantenimiento:', err);
      res.status(500).json({ message: 'Error al actualizar el mantenimiento', error: err });
    }
  }
  // Método para eliminar imagen específica
  async deleteImage(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const maintenance = await Maintenance.findById(id);
      if (!maintenance) {
        res.status(404).json({ message: 'Mantenimiento no encontrado' });
        return;
      }

      if (!maintenance.damage_image) {
        res.status(404).json({ message: 'No hay imagen para eliminar' });
        return;
      }

      const imageUrl = maintenance.damage_image;

      //localizar la parte después de 'upload/'
      const base = 'upload/';
      const startIndex = imageUrl.indexOf(base);
      if (startIndex === -1) {
        res.status(400).json({ message: 'URL de imagen inválida o no compatible' });
        return;
      }

      //obtener el path completo después de 'upload/', con decodificación
      let publicIdWithExtension = decodeURIComponent(imageUrl.slice(startIndex + base.length));

      // Eliminar prefijo de versión si exist
      publicIdWithExtension = publicIdWithExtension.replace(/^v\d+\//, '');

      //eliminar extensión (.jpg, .png, .webp, etc.)
      const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');

      console.log('public_id para eliminar:', publicId);

      //eliminar en Cloudinary
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result !== 'ok') {
        res.status(500).json({ message: 'No se pudo eliminar la imagen de Cloudinary', cloudinaryResult: result });
        return;
      }

      //eliminar referencia en la base de datos
      maintenance.damage_image = undefined;
      await maintenance.save();

      res.status(200).json({
        message: 'Imagen eliminada exitosamente',
        maintenance,
      });
    } catch (err) {
      console.error('Error al eliminar imagen:', err);
      res.status(500).json({ message: 'Error al eliminar la imagen', error: err });
    }
  }

  //Voy a cambiar esto para poder meter la descripcio e imagenes sin importar el status 0_0
private static getAllowedUpdateFields(status: string): string[] {
  const fieldsByStatus: { [key: string]: string[] } = {
    'pending': ['date', 'responsible_id', 'device_id', 'damage_image', 'priority', 'description'],
    'in_progress': ['damage_image', 'description'],  // 👈 cambio clave aquí
    'completed': [],
    'cancelled': [],
    'approved': []
  };

  return fieldsByStatus[status] || [];
}
//_____________________________________________

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const maintenance = await Maintenance.findById(id);
      if (!maintenance) {
        res.status(404).json({ message: 'Mantenimiento no encontrado' });
        return;
      }

      // Solo permitir eliminar si está en estado 'pending' o 'cancelled'
      if (!['pending', 'cancelled'].includes(maintenance.status)) {
        res.status(400).json({ 
          message: `No se puede eliminar un mantenimiento en estado ${maintenance.status}`,
          currentStatus: maintenance.status 
        });
        return;
      }

      // Eliminar imagen de Cloudinary si existe
      if (maintenance.damage_image) {
        try {
          const urlParts = maintenance.damage_image.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = publicIdWithExtension.split('.')[0];
          await cloudinary.uploader.destroy(`maintenance_images/${publicId}`);
        } catch (deleteError) {
          console.error('Error al eliminar imagen de Cloudinary:', deleteError);
        }
      }

      await Maintenance.findByIdAndDelete(id);
      res.status(200).json({ message: 'Mantenimiento eliminado exitosamente' });
    } catch (err) {
      res.status(500).json({ message: 'Error al eliminar el mantenimiento', error: err });
    }
  }
}