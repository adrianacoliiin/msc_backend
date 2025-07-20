// src/services/authService.ts
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { generateToken } from '../utils/jwt';

export interface RegisterData {
  email: string;
  password: string;
  role?: 'admin' | 'tech' | 'user';
  name?:string;
  last_name?:string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
    name?:string;
    last_name?:string;
  };
}

export interface UpdateStatusData {
  userId: string;
  status: 'active' | 'rejected';
  updatedBy: string; // ID del administrador que hace el cambio
}

export class AuthService {
  async register(data: RegisterData): Promise<{ user: IUser; token?: string }> {
    const { email, password, role = 'user' } = data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const hashPassword = await bcrypt.hash(password, 12);

    const user = new User({ 
      email, 
      hashPassword, 
      role,
      name: data.name ||'',
      last_name: data.last_name || '',
      status: 'pending' // Por defecto pending para aprobación manual
    });
    await user.save();

    // Solo generar token si es admin (los admins pueden acceder inmediatamente)
    let token;
    if (role === 'admin') {
      user.status = 'active';
      await user.save();
      token = generateToken(user);
    }

    return {
      user,
      token
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const { email, password } = data;

    const user = await User.findOne({ email });
    if (!user || !user.hashPassword) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.hashPassword);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Validar que el usuario esté aprobado
    if (user.status !== 'active') {
      if (user.status === 'pending') {
        throw new Error('Tu cuenta aún no ha sido aprobada por un administrador.');
      } else if (user.status === 'rejected') {
        throw new Error('Tu cuenta ha sido rechazada. Contacta al administrador.');
      }
    }

    const token = generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }

  async findUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  async findOrCreateGoogleUser(profile: any): Promise<IUser> {
    let user = await User.findOne({
      $or: [
        { 'oauthProviders.googleId': profile.id },
        { email: profile.emails[0].value },
      ],
    });

    if (!user) {
      user = new User({
        email: profile.emails[0].value,
        role: 'user',
        status: 'pending', // Google users también necesitan aprobación
        oauthProviders: { googleId: profile.id },
      });
      await user.save();
    } else if (!user.oauthProviders?.googleId) {
      user.oauthProviders = { ...user.oauthProviders, googleId: profile.id };
      await user.save();
    }

    return user;
  }

  // Nuevos métodos para gestión de usuarios

  async getPendingUsers(): Promise<IUser[]> {
    return User.find({ status: 'pending' }).sort({ createdAt: -1 });
  }

  async getUsersByStatus(status: 'pending' | 'active' | 'rejected'): Promise<IUser[]> {
    return User.find({ status }).sort({ createdAt: -1 });
  }

  async updateUserStatus(data: UpdateStatusData): Promise<IUser> {
    const { userId, status } = data;

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status === status) {
      throw new Error(`User status is already ${status}`);
    }

    user.status = status;
    await user.save();

    return user;
  }

  async getAllUsers(page: number = 1, limit: number = 10, status?: string): Promise<{
    users: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-hashPassword')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}