import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { initMqtt } from './config/mqttClient';
import './utils/rabbitmq';
import telemetryRoutes from './routes/telemetryRoutes';
import { initRabbit } from './utils/rabbitmq';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3004;

(async () => {
  await connectDB();  
  await initRabbit()
  initMqtt();
})();

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

app.listen(PORT, () => {
  console.log(`telemetry-service running on port ${PORT}`);
});

export default app;
