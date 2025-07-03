import { Request, Response } from 'express';
import { UserService } from '../services/userService';

export class UserController {
  private svc = new UserService();

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const user = await this.svc.getUserById(userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.json({ success: true, data: user });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const updated = await this.svc.updateUser(userId, req.body);
      if (!updated) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res
        .status(400)
        .json({ success: false, error: err.message || 'Internal server error' });
    }
  };

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const list = await this.svc.getAllUsers();
      res.json({ success: true, data: list });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.svc.getUserById(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.json({ success: true, data: user });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const newU = await this.svc.createUser(req.body);
      res.status(201).json({ success: true, data: newU });
    } catch (err: any) {
      res
        .status(400)
        .json({ success: false, error: err.message || 'Internal server error' });
    }
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const upd = await this.svc.updateUser(req.params.id, req.body);
      if (!upd) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.json({ success: true, data: upd });
    } catch (err: any) {
      res
        .status(400)
        .json({ success: false, error: err.message || 'Internal server error' });
    }
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const ok = await this.svc.deleteUser(req.params.id);
      if (!ok) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.json({ success: true, message: 'User deleted' });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  updateUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const upd = await this.svc.updateUserRole(req.params.id, req.body.role);
      if (!upd) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.json({ success: true, data: upd });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
}