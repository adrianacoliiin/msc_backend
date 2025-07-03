// src/controllers/authController.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { JWTPayload } from '../utils/jwt';

const authService = new AuthService();

export class AuthController {
  // POST /register
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, role } = req.body;
      const result = await authService.register({ email, password, role });
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  }

  // POST /login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
    }
  }

  // GET /me
  async me(req: Request, res: Response): Promise<void> {
    try {
      // Acceso directo usando indexación
      const user = (req as any)['user'] as JWTPayload | undefined;
      
      if (!user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
        return;
      }

      const { userId } = user;
      const userData = await authService.findUserById(userId);
      
      if (!userData) {
        res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          createdAt: userData.createdAt
        }
      });
    } catch (error) {
      console.error('Me error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user data'
      });
    }
  }
}