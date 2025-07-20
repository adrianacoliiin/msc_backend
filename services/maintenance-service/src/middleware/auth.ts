// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt.js';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

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

// Middleware para verificar que el usuario puede modificar el mantenimiento
export const canModifyMaintenance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authenticatedReq = req as AuthenticatedRequest;
  const { id } = req.params;
  
  try {
    const Maintenance = await import('../models/Maintenance.js');
    const maintenance = await Maintenance.default.findById(id);
    
    if (!maintenance) {
      res.status(404).json({ error: 'Mantenimiento no encontrado' });
      return;
    }

    // Los admins pueden modificar cualquier mantenimiento
    if (authenticatedReq.user?.role === 'admin') {
      next();
      return;
    }

    // Los técnicos solo pueden modificar sus propios mantenimientos
    if (authenticatedReq.user?.role === 'tech' && 
        maintenance.responsible_id.toString() === authenticatedReq.user.userId) {
      next();
      return;
    }

    res.status(403).json({ error: 'No tienes permisos para modificar este mantenimiento' });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

// Middleware para verificar que el usuario puede ver el mantenimiento
export const canViewMaintenance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authenticatedReq = req as AuthenticatedRequest;
  const { id } = req.params;
  
  try {
    // Los admins pueden ver todo
    if (authenticatedReq.user?.role === 'admin') {
      next();
      return;
    }

    const Maintenance = await import('../models/Maintenance.js');
    const maintenance = await Maintenance.default.findById(id);
    
    if (!maintenance) {
      res.status(404).json({ error: 'Mantenimiento no encontrado' });
      return;
    }

    // Los técnicos pueden ver sus propios mantenimientos
    if (authenticatedReq.user?.role === 'tech' && 
        maintenance.responsible_id.toString() === authenticatedReq.user.userId) {
      next();
      return;
    }

    // Los usuarios normales pueden ver mantenimientos de sus dispositivos
    
    res.status(403).json({ error: 'No tienes permisos para ver este mantenimiento' });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
};