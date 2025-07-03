import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const SECRET: Secret = process.env.JWT_SECRET || 'fallback-secret';
const EXPIRY: number = parseInt(process.env.JWT_EXPIRES_IN || '604800', 10);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: JWTPayload): string => {
  const opts: SignOptions = { expiresIn: EXPIRY };
  return jwt.sign(payload, SECRET, opts);
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, SECRET) as JWTPayload;
};
