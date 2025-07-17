// src/utils/jwt.ts
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET: Secret = process.env.JWT_SECRET || 'fallback-secret';

// TTL en segundos: si defines JWT_EXPIRES_IN en segundos, úsalo; 
// si prefieres días, convierte (ej. "7" ⇒ 7 días).
// Aquí asumimos que JWT_EXPIRES_IN viene como número de segundos.
// Si no existe, usamos 7 días por defecto.
const EXPIRY_SECONDS: number = process.env.JWT_EXPIRES_IN
  ? parseInt(process.env.JWT_EXPIRES_IN, 10)
  : 7 * 24 * 3600;

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: JWTPayload): string => {
  const options: SignOptions = { expiresIn: EXPIRY_SECONDS };
  return jwt.sign(payload, SECRET, options);
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, SECRET) as JWTPayload;
};
