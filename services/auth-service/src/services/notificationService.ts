// src/services/notificationService.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import { User } from '../models/User';
import { verifyToken } from '../utils/jwt';

interface ConnectedUser {
  userId: string;
  role: string;
  socketId: string;
}

export class NotificationService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, ConnectedUser> = new Map();

  initialize(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*", //ajustar
        methods: ["GET", "POST"]
      }
    });

    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        // Añadir información del usuario al socket
        (socket as any).userId = user.id;
        (socket as any).userRole = user.role;
        (socket as any).userEmail = user.email;
        
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const userId = (socket as any).userId;
      const userRole = (socket as any).userRole;
      const userEmail = (socket as any).userEmail;

      console.log(`User connected: ${userEmail} (${userRole}) - Socket: ${socket.id}`);

      // Guardar conexión del usuario
      this.connectedUsers.set(socket.id, {
        userId,
        role: userRole,
        socketId: socket.id
      });

      // Unir a sala específica según rol
      if (userRole === 'admin') {
        socket.join('admins');
      }
      socket.join(`user_${userId}`);

      // Eventos del cliente
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });

      // Manejar desconexión
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${userEmail} - Socket: ${socket.id}`);
        this.connectedUsers.delete(socket.id);
      });

      // Enviar estado de conexión
      socket.emit('connected', {
        message: 'Successfully connected to notifications',
        userId,
        role: userRole
      });
    });

    console.log('Notification service initialized with Socket.IO');
  }

  // Notificar a todos los administradores
  notifyAdmins(event: string, data: any) {
    if (!this.io) {
      console.warn('Socket.IO not initialized');
      return;
    }

    console.log(`Sending notification to admins: ${event}`, data);
    
    this.io.to('admins').emit('notification', {
      type: event,
      data,
      timestamp: new Date().toISOString()
    });

    // También registrar en logs o base de datos si es necesario
    this.logNotification('admins', event, data);
  }

  // Notificar a un usuario específico
  notifyUser(userId: string, event: string, data: any) {
    if (!this.io) {
      console.warn('Socket.IO not initialized');
      return;
    }

    console.log(`Sending notification to user ${userId}: ${event}`, data);
    
    this.io.to(`user_${userId}`).emit('notification', {
      type: event,
      data,
      timestamp: new Date().toISOString()
    });

    this.logNotification(userId, event, data);
  }

  // Broadcast a todos los usuarios conectados
  broadcast(event: string, data: any) {
    if (!this.io) {
      console.warn('Socket.IO not initialized');
      return;
    }

    this.io.emit('notification', {
      type: event,
      data,
      timestamp: new Date().toISOString()
    });

    this.logNotification('broadcast', event, data);
  }

  // Obtener estadísticas de conexiones
  getConnectionStats() {
    const stats = {
      totalConnections: this.connectedUsers.size,
      admins: 0,
      users: 0,
      techs: 0
    };

    this.connectedUsers.forEach(user => {
      switch (user.role) {
        case 'admin':
          stats.admins++;
          break;
        case 'tech':
          stats.techs++;
          break;
        case 'user':
          stats.users++;
          break;
      }
    });

    return stats;
  }

  // Obtener usuarios conectados (solo para admins)
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  // Método privado para logging
  private logNotification(target: string, event: string, data: any) {
    // Aquí puedes implementar logging a base de datos, archivo, etc.
    console.log(`[NOTIFICATION LOG] Target: ${target}, Event: ${event}, Data:`, JSON.stringify(data, null, 2));
  }

  // Método para verificar si un usuario está conectado
  isUserConnected(userId: string): boolean {
    return Array.from(this.connectedUsers.values()).some(user => user.userId === userId);
  }

  // Método para obtener el socket de un usuario específico
  getUserSocket(userId: string): string | null {
    const user = Array.from(this.connectedUsers.values()).find(user => user.userId === userId);
    return user ? user.socketId : null;
  }
}