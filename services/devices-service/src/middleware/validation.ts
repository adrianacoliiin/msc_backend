import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
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

// Validaciones para Device Registration
export const validateRegisterDevice = [
  body('name')
    .notEmpty()
    .withMessage('Device name is required')
    .isString()
    .withMessage('Device name must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Device name must be between 1 and 100 characters'),
    
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
    
  body('roomId')
    .notEmpty()
    .withMessage('Room ID is required')
    .isMongoId()
    .withMessage('Room ID must be a valid MongoDB ObjectId'),
    
  body('sensorType')
    .notEmpty()
    .withMessage('Sensor type is required')
    .isIn(['mq4', 'dht22', 'pir'])
    .withMessage('Sensor type must be mq4, dht22, or pir'),
    
  body('sensorLabel')
    .notEmpty()
    .withMessage('Sensor label is required')
    .isString()
    .withMessage('Sensor label must be a string')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sensor label must be between 1 and 50 characters'),
    
  body('metric')
    .notEmpty()
    .withMessage('Metric is required')
    .isString()
    .withMessage('Metric must be a string')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Metric must be between 1 and 50 characters'),
    
  body('unit')
    .notEmpty()
    .withMessage('Unit is required')
    .isString()
    .withMessage('Unit must be a string')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Unit must be between 1 and 20 characters')
];

// Validaciones para Device Activation
export const validateActivateDevice = [
  body('token')
    .notEmpty()
    .withMessage('Activation token is required')
    .isString()
    .withMessage('Token must be a string')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Token cannot be empty')
];

export const validateRoom = [
  body('number')
    .notEmpty()
    .withMessage('Room number is required')
    .isString()
    .withMessage('Room number must be a string')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Room number must be between 1 and 10 characters'),
  
  body('name')
    .notEmpty()
    .withMessage('Room name is required')
    .isString()
    .withMessage('Room name must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Room name must be between 1 and 100 characters'),
    
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
    
  body('floor')
    .notEmpty()
    .withMessage('Floor is required')
    .isInt({ min: 1 })
    .withMessage('Floor must be a positive integer'),
    
  body('capacity')
    .notEmpty()
    .withMessage('Capacity is required')
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),
    
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance'])
    .withMessage('Status must be active, inactive, or maintenance')
];


export const validateUpdateRoom = [
  body('number')
    .optional()
    .isString()
    .withMessage('Room number must be a string')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Room number must be between 1 and 10 characters'),

  body('name')
    .optional()
    .isString()
    .withMessage('Room name must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Room name must be between 1 and 100 characters'),

  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),

  body('floor')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Floor must be a positive integer'),

  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance'])
    .withMessage('Status must be active, inactive, or maintenance')
];


// Validaciones para Device CRUD
export const validateDevice = [
  body('name')
    .notEmpty()
    .withMessage('Device name is required')
    .isString()
    .withMessage('Device name must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Device name must be between 1 and 100 characters'),
    
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
    
  body('roomId')
    .notEmpty()
    .withMessage('Room ID is required')
    .isMongoId()
    .withMessage('Room ID must be a valid MongoDB ObjectId'),
    
  body('sensors')
    .isArray({ min: 1 })
    .withMessage('At least one sensor is required'),
    
  body('sensors.*.type')
    .isIn(['mq4', 'dht22', 'pir'])
    .withMessage('Invalid sensor type'),
    
  body('sensors.*.label')
    .notEmpty()
    .withMessage('Sensor label is required')
    .isString()
    .withMessage('Sensor label must be a string'),
    
  body('sensors.*.measurements')
    .isArray({ min: 1 })
    .withMessage('At least one measurement is required per sensor'),
    
  body('status')
    .optional()
    .isIn(['pending', 'active', 'inactive', 'maintenance'])
    .withMessage('Status must be pending, active, inactive, or maintenance')
];

// Validaciones para actualizar Device
export const validateUpdateDevice = [
  body('name')
    .optional()
    .isString()
    .withMessage('Device name must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Device name must be between 1 and 100 characters'),
    
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
    
  body('roomId')
    .optional()
    .isMongoId()
    .withMessage('Room ID must be a valid MongoDB ObjectId'),
    
  body('sensors')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one sensor is required'),
    
  body('sensors.*.type')
    .optional()
    .isIn(['mq4', 'dht22', 'pir'])
    .withMessage('Invalid sensor type'),
    
  body('sensors.*.label')
    .optional()
    .notEmpty()
    .withMessage('Sensor label is required')
    .isString()
    .withMessage('Sensor label must be a string'),
    
  body('sensors.*.measurements')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one measurement is required per sensor'),
    
  body('status')
    .optional()
    .isIn(['pending', 'active', 'inactive', 'maintenance'])
    .withMessage('Status must be pending, active, inactive, or maintenance')
];

// Validaciones para Device Reading (para Fase 2)
export const validateDeviceReading = [
  body('sensorType')
    .notEmpty()
    .withMessage('Sensor type is required')
    .isIn(['mq4', 'dht22', 'pir'])
    .withMessage('Invalid sensor type'),
    
  body('readings')
    .isObject()
    .withMessage('Readings must be an object')
    .notEmpty()
    .withMessage('Readings cannot be empty')
];