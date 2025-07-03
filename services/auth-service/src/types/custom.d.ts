// src/types/custom.d.ts
import { Request } from 'express';
import { JWTPayload } from '../utils/jwt';

// Extender la interfaz Request de Express
declare module 'express-serve-static-core' {
  interface Request {
    user?: JWTPayload;
  }
}

// También declarar globalmente por compatibilidad
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}