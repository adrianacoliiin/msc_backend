import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request { user?: JWTPayload }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const header = req.headers.authorization;
  const token = header?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
};
