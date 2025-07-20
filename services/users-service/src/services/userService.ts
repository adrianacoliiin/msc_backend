import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
} from '../types/user.types';

export class UserService {
  async getAllUsers(): Promise<UserResponse[]> {
    const users = await User.find({}, '-hashPassword').sort({ createdAt: -1 });
    return users.map((u) => this.mapUserToResponse(u));
  }

  async getUserById(id: string): Promise<UserResponse | null> {
    const user = await User.findById(id, '-hashPassword');
    return user ? this.mapUserToResponse(user) : null;
  }

  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    const exists = await User.findOne({ email: data.email });
    if (exists) throw new Error('User already exists with this email');
    const hash = await bcrypt.hash(data.password, 12);
    const user = new User({
      email: data.email,
      hashPassword: hash,
      role: data.role || 'user',
    });
    await user.save();
    return this.mapUserToResponse(user);
  }

  async updateUser(
    id: string,
    data: UpdateUserRequest
  ): Promise<UserResponse | null> {
    if (data.email) {
      const dup = await User.findOne({ email: data.email, _id: { $ne: id } });
      if (dup) throw new Error('Email already exists');
    }
    const user = await User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).select('-hashPassword');
    return user ? this.mapUserToResponse(user) : null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const res = await User.findByIdAndDelete(id);
    return !!res;
  }

  async updateUserRole(
    id: string,
    role: string
  ): Promise<UserResponse | null> {
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-hashPassword');
    return user ? this.mapUserToResponse(user) : null;
  }

  private mapUserToResponse(user: IUser): UserResponse {
    return {
      id: user._id?.toString() || user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      name: user.name,
      last_name: user.last_name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}