// src/services/telemetryNotificationService.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';

interface ConnectedClient {
  socketId: string;
  deviceIds: Set<string>; // Dispositivos a los que está suscrito
  connectedAt: Date;
}

export class TelemetryNotificationService {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, ConnectedClient> = new Map();

  initialize(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*", // Ajustar según necesidades de seguridad
        methods: ["GET", "POST"]
      }
    });

    // Middleware de autenticación (opcional por ahora)
    this.io.use(async (socket: Socket, next) => {
      try {
        // Por ahora permitir todas las conexiones
        // En el futuro se puede agregar verificación de token como en auth
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected to telemetry notifications: ${socket.id}`);

      // Registrar cliente conectado
      this.connectedClients.set(socket.id, {
        socketId: socket.id,
        deviceIds: new Set(),
        connectedAt: new Date()
      });

      // Evento para suscribirse a un dispositivo específico
      socket.on('subscribe_device', (deviceId: string) => {
        if (!deviceId) {
          socket.emit('error', { message: 'Device ID is required' });
          return;
        }

        const roomName = `device_${deviceId}`;
        socket.join(roomName);
        
        // Actualizar registro del cliente
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.deviceIds.add(deviceId);
        }

        console.log(`Client ${socket.id} subscribed to device ${deviceId}`);
        socket.emit('subscribed', { 
          deviceId, 
          message: `Successfully subscribed to device ${deviceId}` 
        });
      });

      // Evento para desuscribirse de un dispositivo
      socket.on('unsubscribe_device', (deviceId: string) => {
        if (!deviceId) {
          socket.emit('error', { message: 'Device ID is required' });
          return;
        }

        const roomName = `device_${deviceId}`;
        socket.leave(roomName);
        
        // Actualizar registro del cliente
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.deviceIds.delete(deviceId);
        }

        console.log(`Client ${socket.id} unsubscribed from device ${deviceId}`);
        socket.emit('unsubscribed', { 
          deviceId, 
          message: `Successfully unsubscribed from device ${deviceId}` 
        });
      });

      // Evento para obtener dispositivos suscritos
      socket.on('get_subscriptions', () => {
        const client = this.connectedClients.get(socket.id);
        const deviceIds = client ? Array.from(client.deviceIds) : [];
        socket.emit('subscriptions', { deviceIds });
      });

      // Evento de ping para mantener conexión
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });

      // Manejar desconexión
      socket.on('disconnect', () => {
        console.log(`Client disconnected from telemetry notifications: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });

      // Enviar confirmación de conexión
      socket.emit('connected', {
        message: 'Successfully connected to telemetry notifications',
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    console.log('Telemetry Notification service initialized with Socket.IO');
  }

  /**
   * Notificar a todos los clientes suscritos a un dispositivo específico
   */
  notifyDevice(deviceId: string, event: string, data: any): void {
    if (!this.io) {
      console.warn('Socket.IO not initialized for telemetry notifications');
      return;
    }

    const roomName = `device_${deviceId}`;
    
    console.log(`Sending telemetry notification to device room ${roomName}: ${event}`);
    
    this.io.to(roomName).emit('notification', {
      type: event,
      deviceId,
      data,
      timestamp: new Date().toISOString()
    });

    // Log para debugging
    this.logNotification(roomName, event, data);
  }

  /**
   * Broadcast a todos los clientes conectados
   */
  broadcast(event: string, data: any): void {
    if (!this.io) {
      console.warn('Socket.IO not initialized for telemetry notifications');
      return;
    }

    this.io.emit('notification', {
      type: event,
      data,
      timestamp: new Date().toISOString()
    });

    this.logNotification('broadcast', event, data);
  }

  /**
   * Obtener estadísticas de conexiones
   */
  getConnectionStats() {
    const totalConnections = this.connectedClients.size;
    const deviceSubscriptions = new Map<string, number>();

    // Contar suscripciones por dispositivo
    this.connectedClients.forEach(client => {
      client.deviceIds.forEach(deviceId => {
        deviceSubscriptions.set(
          deviceId, 
          (deviceSubscriptions.get(deviceId) || 0) + 1
        );
      });
    });

    return {
      totalConnections,
      totalDeviceSubscriptions: Array.from(deviceSubscriptions.entries()).length,
      deviceSubscriptions: Object.fromEntries(deviceSubscriptions),
      connectedClients: Array.from(this.connectedClients.values()).map(client => ({
        socketId: client.socketId,
        deviceIds: Array.from(client.deviceIds),
        connectedAt: client.connectedAt
      }))
    };
  }

  /**
   * Verificar si hay clientes suscritos a un dispositivo
   */
  hasSubscribersForDevice(deviceId: string): boolean {
    if (!this.io) return false;
    
    const roomName = `device_${deviceId}`;
    const room = this.io.sockets.adapter.rooms.get(roomName);
    return room ? room.size > 0 : false;
  }

  /**
   * Obtener número de suscriptores para un dispositivo
   */
  getDeviceSubscriberCount(deviceId: string): number {
    if (!this.io) return 0;
    
    const roomName = `device_${deviceId}`;
    const room = this.io.sockets.adapter.rooms.get(roomName);
    return room ? room.size : 0;
  }

  /**
   * Método privado para logging
   */
  private logNotification(target: string, event: string, data: any): void {
    console.log(`[TELEMETRY NOTIFICATION LOG] Target: ${target}, Event: ${event}, Data:`, 
      JSON.stringify(data, null, 2));
  }
}