import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';
import { connectDB } from './config/database';
import { initMqtt, closeMqtt } from './config/mqttClient';
import { initRabbit, closeRabbit } from './utils/rabbitmq';
import { telemetryNotificationService } from './services/telemetryNotificationServiceInstance';
import telemetryRoutes from './routes/telemetryRoutes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3004;

let server: http.Server | null = null;

// Función para manejar el cierre limpio de la aplicación
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}, starting graceful shutdown...`);
  
  try {
    // 1. Cerrar el servidor HTTP primero
    if (server) {
      console.log('Closing HTTP server...');
      await new Promise<void>((resolve) => {
        server!.close(() => {
          console.log('HTTP server closed');
          resolve();
        });
      });
    }

    // 2. Cerrar conexiones MQTT y RabbitMQ
    await Promise.all([
      closeMqtt(),
      closeRabbit()
    ]);

    console.log('All connections closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Configurar manejadores de señales
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Para nodemon

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Configuración de middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Crear servidor HTTP
server = http.createServer(app);

// INICIALIZAR SERVICIO DE NOTIFICACIONES DE TELEMETRÍA
telemetryNotificationService.initialize(server);

// Inicialización de servicios
(async () => {
  try {
    await connectDB();  
    await initRabbit();
    initMqtt();
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
})();

// En tu proyecto Node.js
// import { insertTestData, DEVICE_IDS } from './test/scriptDatos';

// Conectar a MongoDB y ejecutar
// (async () => {
//   await insertTestData();
// })();

// Rutas
app.use('/', telemetryRoutes);

app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      service: 'telemetry-service',
      timestamp: new Date().toISOString(),
    });
});

// RUTAS PARA ESTADÍSTICAS DE WEBSOCKET
app.get('/api/telemetry/connections/stats', (req, res) => {
  const stats = telemetryNotificationService.getConnectionStats();
  res.json({
    success: true,
    data: stats
  });
});

app.get('/api/telemetry/device/:deviceId/subscribers', (req, res) => {
  const { deviceId } = req.params;
  const count = telemetryNotificationService.getDeviceSubscriberCount(deviceId);
  const hasSubscribers = telemetryNotificationService.hasSubscribersForDevice(deviceId);
  
  res.json({
    success: true,
    data: {
      deviceId,
      subscriberCount: count,
      hasSubscribers
    }
  });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`telemetry-service running on port ${PORT}`);
  console.log(`Telemetry WebSocket notifications available`);
  console.log(`MQTT telemetry processing active`);
});

export default app;