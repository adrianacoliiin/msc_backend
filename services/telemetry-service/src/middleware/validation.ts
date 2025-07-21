// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';

export const validateQueryDates = [
  query('from')
    .optional()
    .isISO8601()
    .withMessage('from must be a valid ISO 8601 date'),
  query('to')
    .optional()
    .isISO8601()
    .withMessage('to must be a valid ISO 8601 date'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('limit must be between 1 and 10000'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be >= 1'),
];

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