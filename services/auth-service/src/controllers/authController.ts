// src/controllers/authController.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { JWTPayload } from '../utils/jwt';
// import { NotificationService } from '../services/notificationService';
// Solo importar las instancias de los servicios
import { notificationService } from '../services/notificationServiceInstance';


const authService = new AuthService();
// const notificationService = new NotificationService();

export class AuthController {
  // POST /register
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, role, name, last_name } = req.body;
      const result = await authService.register({ email, password, role, name, last_name });
      
      // Enviar notificación en tiempo real a los administradores
      if (result.user.status === 'pending') {
        notificationService.notifyAdmins('new_user_registration', {
          userId: result.user.id,
          email: result.user.email,
          role: result.user.role,
          createdAt: result.user.createdAt,
          name: result.user.name,
          last_name: result.user.last_name
        });
      }

      const responseData: any = {
        success: true,
        message: role === 'admin' 
          ? 'Admin registered and activated successfully' 
          : 'User registered successfully. Please wait for admin approval.',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            status: result.user.status
          }
        }
      };

      // Solo incluir token si se generó (admins)
      if (result.token) {
        responseData.data.token = result.token;
      }

      res.status(201).json(responseData);
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
      
      // Manejar específicamente los errores de aprobación
      if (error instanceof Error) {
        if (error.message.includes('aún no ha sido aprobada')) {
          res.status(403).json({
            success: false,
            error: error.message,
            code: 'ACCOUNT_PENDING'
          });
          return;
        }
        if (error.message.includes('ha sido rechazada')) {
          res.status(403).json({
            success: false,
            error: error.message,
            code: 'ACCOUNT_REJECTED'
          });
          return;
        }
      }

      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
    }
  }

  // GET /me
  async me(req: Request, res: Response): Promise<void> {
    try {
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
          status: userData.status,
          createdAt: userData.createdAt,
          name:userData.name,
          last_name: userData.last_name
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

  // GET /users - Obtener lista de usuarios (solo admin)
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      
      const result = await authService.getAllUsers(
        parseInt(page as string),
        parseInt(limit as string),
        status as string
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get users'
      });
    }
  }

  // GET /users/pending - Obtener usuarios pendientes (solo admin)
  async getPendingUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await authService.getPendingUsers();
      
      res.json({
        success: true,
        data: users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt
        }))
      });
    } catch (error) {
      console.error('Get pending users error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get pending users'
      });
    }
  }

  // PATCH /users/:id/status - Actualizar estado del usuario (solo admin)
  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminUser = (req as any)['user'] as JWTPayload;

      if (!['active', 'rejected'].includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status. Must be "active" or "rejected"'
        });
        return;
      }

      const updatedUser = await authService.updateUserStatus({
        userId: id,
        status,
        updatedBy: adminUser.userId
      });

      // Notificar al usuario sobre el cambio de estado
      notificationService.notifyUser(updatedUser.id, 'status_updated', {
        status,
        message: status === 'active' 
          ? 'Tu cuenta ha sido aprobada. Ya puedes iniciar sesión.'
          : 'Tu cuenta ha sido rechazada. Contacta al administrador para más información.'
      });

      res.json({
        success: true,
        message: `User status updated to ${status}`,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status,
          updatedAt: updatedUser.updatedAt
        }
      });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user status'
      });
    }
  }
}