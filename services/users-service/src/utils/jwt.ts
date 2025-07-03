// src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { IUser } from '../models/User';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

dotenv.config();
const secret = process.env.JWT_SECRET as string;
const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, secret, { expiresIn } as any);
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, secret) as JWTPayload;
};