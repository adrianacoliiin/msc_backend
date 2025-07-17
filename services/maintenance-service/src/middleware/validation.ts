//src/middleware/validation.ts
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware para manejar errores de validación
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
    return;
  }
  next();
};

// Validación para crear un mantenimiento
export const validateCreateMaintenance = [
  body('date')
    .notEmpty()
    .withMessage('La fecha es obligatoria')
    .isISO8601()
    .withMessage('La fecha debe estar en formato ISO 8601 (ej. 2025-07-17T10:00:00Z)')
    .custom((value) => {
      const inputDate = new Date(value);
      const now = new Date();
      // Permitir fechas desde hoy en adelante
      if (inputDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        throw new Error('La fecha no puede ser anterior a hoy');
      }
      return true;
    }),

  body('responsible_id')
    .notEmpty()
    .withMessage('El responsable es obligatorio')
    .isMongoId()
    .withMessage('El ID del responsable no es válido'),

  body('device_id')
    .notEmpty()
    .withMessage('El dispositivo es obligatorio')
    .isMongoId()
    .withMessage('El ID del dispositivo no es válido'),

  body('damage_image')
    .optional()
    .isString()
    .withMessage('La ruta de la imagen debe ser un string'),
];

// Validación para actualizar estado
export const validateUpdateStatus = [
  body('status')
    .notEmpty()
    .withMessage('El estado es obligatorio')
    .isIn(['pending', 'in_progress', 'completed', 'cancelled', 'approved'])
    .withMessage('Estado no válido. Debe ser: pending, in_progress, completed, cancelled, approved'),
];

// Validación para cancelar mantenimiento
export const validateCancelMaintenance = [
  body('reason')
    .optional()
    .isString()
    .withMessage('La razón debe ser un string')
    .isLength({ min: 5, max: 500 })
    .withMessage('La razón debe tener entre 5 y 500 caracteres'),
];

// Validación para actualizar mantenimiento
export const validateUpdateMaintenance = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('La fecha debe estar en formato ISO 8601')
    .custom((value) => {
      if (value) {
        const inputDate = new Date(value);
        const now = new Date();
        if (inputDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
          throw new Error('La fecha no puede ser anterior a hoy');
        }
      }
      return true;
    }),

  body('responsible_id')
    .optional()
    .isMongoId()
    .withMessage('El ID del responsable no es válido'),

  body('device_id')
    .optional()
    .isMongoId()
    .withMessage('El ID del dispositivo no es válido'),

  body('damage_image')
    .optional()
    .isString()
    .withMessage('La ruta de la imagen debe ser un string'),

  // Validar que no se intente cambiar el estado directamente
  body('status')
    .not()
    .exists()
    .withMessage('No se puede cambiar el estado directamente. Usa /status, /approve o /cancel'),

  body('approved_by')
    .not()
    .exists()
    .withMessage('No se puede establecer approved_by directamente'),
];

// Middleware personalizado para validar que el usuario existe
export const validateUserExists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { responsible_id } = req.body;
  
  if (!responsible_id) {
    next();
    return;
  }

  try {
    // Aquí deberías importar tu modelo de User y verificar que existe
    // const User = await import('../models/User.js');
    // const user = await User.default.findById(responsible_id);
    
    // if (!user) {
    //   res.status(400).json({ message: 'El usuario responsable no existe' });
    //   return;
    // }

    // if (!['admin', 'tech'].includes(user.role)) {
    //   res.status(400).json({ message: 'El usuario debe tener rol de admin o tech' });
    //   return;
    // }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error al validar el usuario', error });
  }
};

// Middleware personalizado para validar que el dispositivo existe
export const validateDeviceExists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { device_id } = req.body;
  
  if (!device_id) {
    next();
    return;
  }

  try {
    // Aquí deberías importar tu modelo de Device y verificar que existe
    // const Device = await import('../models/Device.js');
    // const device = await Device.default.findById(device_id);
    
    // if (!device) {
    //   res.status(400).json({ message: 'El dispositivo no existe' });
    //   return;
    // }

    // if (device.status === 'inactive') {
    //   res.status(400).json({ message: 'No se puede programar mantenimiento para un dispositivo inactivo' });
    //   return;
    // }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error al validar el dispositivo', error });
  }
};

// Middleware para validar permisos específicos de estado
export const validateStatePermissions = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { status } = req.body;
  const userRole = (req as any).user?.role;

  // Solo admins pueden aprobar directamente
  if (status === 'approved' && userRole !== 'admin') {
    res.status(403).json({ 
      message: 'Solo los administradores pueden aprobar mantenimientos' 
    });
    return;
  }

  // Solo técnicos y admins pueden marcar como completado
  if (status === 'completed' && !['admin', 'tech'].includes(userRole)) {
    res.status(403).json({ 
      message: 'Solo técnicos y administradores pueden marcar como completado' 
    });
    return;
  }

  next();
};

// Validación para filtros de búsqueda
export const validateSearchFilters = [
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled', 'approved'])
    .withMessage('Estado de filtro no válido'),

  body('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Fecha desde debe estar en formato ISO 8601'),

  body('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Fecha hasta debe estar en formato ISO 8601'),

  body('responsible_id')
    .optional()
    .isMongoId()
    .withMessage('ID del responsable no válido'),

  body('device_id')
    .optional()
    .isMongoId()
    .withMessage('ID del dispositivo no válido'),
];