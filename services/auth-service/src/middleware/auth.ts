// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';

// Interfaz extendida para el Request
interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

/**
 * Extrae el Bearer token, lo verifica y guarda el payload en req.user.
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = verifyToken(token) as JWTPayload;
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware de autorización por roles.
 */
export const requireRole = (roles: string[]) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authenticatedReq = req as AuthenticatedRequest;
  
  if (!authenticatedReq.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!roles.includes(authenticatedReq.user.role)) {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }
  next();
};