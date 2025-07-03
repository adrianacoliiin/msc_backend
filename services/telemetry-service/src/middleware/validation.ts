import { query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateQueryDates = [
  query('from')
    .optional()
    .isISO8601()
    .withMessage('from must be ISO date'),
  query('to')
    .optional()
    .isISO8601()
    .withMessage('to must be ISO date')
];

export const handleValidationErrors = (
  req: Request, res: Response, next: NextFunction
) => {
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
