// src/types/custom.d.ts
import { JWTPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      /** El payload que inyecta authenticateToken */
      user?: JWTPayload;
    }
  }
}

// Esto convierte el archivo en un módulo con declaraciones
export {};