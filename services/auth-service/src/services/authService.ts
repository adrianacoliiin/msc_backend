// src/services/authService.ts
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { generateToken } from '../utils/jwt';

export interface RegisterData {
  email: string;
  password: string;
  role?: 'admin' | 'tech' | 'user';
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
  };
}

export class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, role = 'user' } = data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const hashPassword = await bcrypt.hash(password, 12);

    const user = new User({ email, hashPassword, role });
    await user.save();

    const token = generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
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

    const token = generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
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
        oauthProviders: { googleId: profile.id },
      });
      await user.save();
    } else if (!user.oauthProviders?.googleId) {
      user.oauthProviders = { ...user.oauthProviders, googleId: profile.id };
      await user.save();
    }

    return user;
  }
}
