// src/controllers/authController.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { JWTPayload } from '../utils/jwt';
import { notificationService } from '../services/notificationServiceInstance';

const authService = new AuthService();

export class AuthController {
  // POST /register
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, role, name, last_name } = req.body;
      const result = await authService.register({ email, password, role, name, last_name });

      // Notificación en tiempo real a administradores cuando corresponde
      if (result.user.status === 'pending') {
        notificationService.notifyAdmins('new_user_registration', {
          userId: result.user.id,
          email: result.user.email,
          role: result.user.role,
          createdAt: result.user.createdAt,
          name: result.user.name,
          last_name: result.user.last_name,
        });
      }

      const responseData: any = {
        success: true,
        message:
          role === 'admin'
            ? 'Admin registered and activated successfully. Welcome email sent.'
            : 'User registered successfully. Please wait for admin approval. Check your email for further instructions.',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            status: result.user.status,
          },
        },
      };

      if (result.token) {
        responseData.data.token = result.token;
      }

      res.status(201).json(responseData);
    } catch (error) {
      console.error('Register error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
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
        data: result,
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        if (error.message.includes('aún no ha sido aprobada')) {
          res.status(403).json({ success: false, error: error.message, code: 'ACCOUNT_PENDING' });
          return;
        }
        if (error.message.includes('ha sido rechazada')) {
          res.status(403).json({ success: false, error: error.message, code: 'ACCOUNT_REJECTED' });
          return;
        }
      }
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
    }
  }

  // POST /forgot-password
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset({ email });
      res.json({ success: true, message: result.message });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process password reset request',
      });
    }
  }

  // POST /reset-password
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.confirmPasswordReset({ token, newPassword });
      res.json({ success: true, message: result.message });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset password',
      });
    }
  }

  // GET /me
  async me(req: Request, res: Response): Promise<void> {
    try {
      const userToken = (req as any).user as JWTPayload | undefined;
      if (!userToken) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const userData = await authService.findUserById(userToken.userId);
      if (!userData) {
        res.status(404).json({ success: false, error: 'User not found' });
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
          name: userData.name,
          last_name: userData.last_name,
        },
      });
    } catch (error) {
      console.error('Me error:', error);
      res.status(500).json({ success: false, error: 'Failed to get user data' });
    }
  }

  // GET /users
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { status, page = '1', limit = '10' } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const result = await authService.getAllUsers(pageNum, limitNum, status as string);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ success: false, error: 'Failed to get users' });
    }
  }

  // GET /users/pending
  async getPendingUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await authService.getPendingUsers();
      res.json({
        success: true,
        data: users.map(u => ({
          id: u.id,
          name: u.name,
          last_name: u.last_name,
          email: u.email,
          role: u.role,
          status: u.status,
          createdAt: u.createdAt,
        })),
      });
    } catch (error) {
      console.error('Get pending users error:', error);
      res.status(500).json({ success: false, error: 'Failed to get pending users' });
    }
  }

  // PATCH /users/:id/status
  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminUser = (req as any).user as JWTPayload;

      if (!['active', 'rejected'].includes(status)) {
        res.status(400).json({ success: false, error: 'Invalid status. Must be "active" or "rejected"' });
        return;
      }

      const updated = await authService.updateUserStatus({ userId: id, status, updatedBy: adminUser.userId });

      // Notificar al usuario vía WebSocket
      notificationService.notifyUser(updated.id, 'status_updated', {
        status,
        message:
          status === 'active'
            ? 'Tu cuenta ha sido aprobada. Ya puedes iniciar sesión.'
            : 'Tu cuenta ha sido rechazada. Contacta al administrador para más información.',
      });

      res.json({
        success: true,
        message: `User status updated to ${status}`,
        data: {
          id: updated.id,
          email: updated.email,
          role: updated.role,
          status: updated.status,
          updatedAt: updated.updatedAt,
        },
      });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user status',
      });
    }
  }
}
