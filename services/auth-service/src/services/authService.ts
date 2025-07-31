// src/services/authService.ts
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, IUser } from '../models/User';
import { generateToken } from '../utils/jwt';
import { sendMail } from '../utils/mailer';
import { getWelcomeEmail, getResetPasswordEmail, getStatusUpdateEmail } from '../utils/emailTemplates';

export interface RegisterData {
  email: string;
  password: string;
  role?: 'admin' | 'tech' | 'user';
  name?: string;
  last_name?: string;
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
    name?: string;
    last_name?: string;
  };
}

export interface UpdateStatusData {
  userId: string;
  status: 'active' | 'rejected';
  updatedBy: string; // ID del administrador que hace el cambio
}

export interface ResetPasswordData {
  email: string;
}

export interface ConfirmResetPasswordData {
  token: string;
  newPassword: string;
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
      name: data.name || '',
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

    // Enviar correo de bienvenida
    try {
      const fullName = `${data.name || ''} ${data.last_name || ''}`.trim();
      const emailTemplate = getWelcomeEmail(fullName, role);
      
      await sendMail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });
      
      console.log(`Welcome email sent successfully to ${email}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // No lanzamos error aquí para no fallar el registro si el email falla
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

  async requestPasswordReset(data: ResetPasswordData): Promise<{ message: string }> {
    const { email } = data;

    const user = await User.findOne({ email });
    if (!user) {
      //no revelar si el email existe o no
      return { message: `${user}` };
    }

    // Generar token de reseteo seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Configurar expiración (1 hora por defecto)
    const resetTokenExpires = new Date(Date.now() + (parseInt(process.env.RESET_TOKEN_EXPIRES_MINUTES || '60')* 10 * 60 * 1000));

    // Guardar token hasheado en la base de datos
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // Enviar correo de recuperación
    try {
      const fullName = `${user.name || ''} ${user.last_name || ''}`.trim();
      const emailTemplate = getResetPasswordEmail(fullName, resetToken);
      
      await sendMail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });
      
      console.log(`Password reset email sent successfully to ${email}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Limpiar token si no se pudo enviar el correo
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      throw new Error('Error sending reset email. Please try again later.');
    }

    return { message: 'Si el correo existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.' };
  }

  async confirmPasswordReset(data: ConfirmResetPasswordData): Promise<{ message: string }> {
    const { token, newPassword } = data;

    // Hash del token recibido para comparar
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Token inválido o expirado');
    }

    // Validar que la nueva contraseña sea diferente (opcional)
    if (user.hashPassword) {
      const isSamePassword = await bcrypt.compare(newPassword, user.hashPassword);
      if (isSamePassword) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }
    }

    // Actualizar contraseña
    const hashPassword = await bcrypt.hash(newPassword, 12);
    user.hashPassword = hashPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log(`Password reset completed successfully for user ${user.email}`);

    return { message: 'Contraseña actualizada exitosamente' };
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

      // Enviar correo de bienvenida para usuarios de Google
      try {
        const emailTemplate = getWelcomeEmail(profile.displayName || '', 'user');
        await sendMail({
          to: profile.emails[0].value,
          subject: emailTemplate.subject,
          html: emailTemplate.html
        });
      } catch (emailError) {
        console.error('Failed to send welcome email for Google user:', emailError);
      }
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

    const previousStatus = user.status;
    user.status = status;
    await user.save();

    // Enviar correo de notificación de cambio de estado
    try {
      const fullName = `${user.name || ''} ${user.last_name || ''}`.trim();
      const emailTemplate = getStatusUpdateEmail(fullName, status);
      
      await sendMail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });
      
      console.log(`Status update email sent successfully to ${user.email} (${previousStatus} -> ${status})`);
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // No lanzamos error aquí para no fallar la actualización si el email falla
    }

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
        .select('-hashPassword -resetPasswordToken')
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