// src/server.ts
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes';
// import { NotificationService } from './services/notificationService';

// Evitar doble instancia
import { notificationService } from './services/notificationServiceInstance';
// notificationService.initialize(server);
//

dotenv.config();

const app = express();
const server = createServer(app); // necesario para websockets

// Notificaciones en tiempo real - solo iniciar una vez
// const notificationService = new NotificationService();
notificationService.initialize(server);
//aaaaaaaaaaaaaaaa


// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Rutas
app.use('/auth', authRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    notifications: notificationService.getConnectionStats()
  });
});

// estadísticas del socket
app.get('/notifications/stats', (req, res) => {
  const stats = notificationService.getConnectionStats();
  res.json({
    success: true,
    data: stats
  });
});

// Manejador de errores
app.use(
  (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err.stack);
    res.status(500).json({
      success: false,
      error: 'Something went wrong!',
    });
  }
);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Socket.IO notifications enabled`);
});

export default app;
