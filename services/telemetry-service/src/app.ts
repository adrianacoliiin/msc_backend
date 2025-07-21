import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { initMqtt, closeMqtt } from './config/mqttClient';
import { initRabbit, closeRabbit } from './utils/rabbitmq';
import telemetryRoutes from './routes/telemetryRoutes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3004;

let server: any = null;

// Función para manejar el cierre limpio de la aplicación
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}, starting graceful shutdown...`);
  
  try {
    // 1. Cerrar el servidor HTTP primero
    if (server) {
      console.log('Closing HTTP server...');
      await new Promise<void>((resolve) => {
        server.close(() => {
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
import { insertTestData, DEVICE_IDS } from './test/scriptDatos';

// Conectar a MongoDB y ejecutar
// (async () => {
//   await insertTestData();
// })();

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.use('/', telemetryRoutes);

app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      service: 'telemetry-service',
      timestamp: new Date().toISOString(),
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

server = app.listen(PORT, () => {
  console.log(`telemetry-service running on port ${PORT}`);
});

export default app;