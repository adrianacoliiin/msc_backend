// src/utils/rabbitmq.ts
import * as amqp from 'amqplib';

let conn: any = null;
let channel: any = null;
let isReconnecting = false;

export const initRabbit = async (): Promise<void> => {
  if (isReconnecting) return;
  try {
    const url = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
    console.log('🔗 Connecting to RabbitMQ:', url.replace(/:\/\/.*@/, '://***:***@'));

    conn = await amqp.connect(url, { heartbeat: 30, connectionTimeout: 10000 });

    conn.on('error', (err: any) => {
      if (err.message.includes('ECONNRESET')) return;
      console.error('🚨 RabbitMQ connection error:', err.message);
    });
    conn.on('close', () => {
      console.warn('⚠️ RabbitMQ connection closed, reconnecting in 5s');
      conn = null;
      channel = null;
      isReconnecting = true;
      setTimeout(async () => {
        isReconnecting = false;
        await initRabbit();
      }, 5000);
    });

    channel = await conn.createChannel();
    channel.on('error', (err: any) => {
      console.error('🚨 RabbitMQ channel error:', err.message);
    });
    channel.on('close', () => {
      console.warn('⚠️ RabbitMQ channel closed');
    });

    await channel.assertExchange('alerts', 'fanout', { durable: true });
    console.log('✅ RabbitMQ connected successfully');
  } catch (err: any) {
    console.error('❌ initRabbit failed:', err.message);
    isReconnecting = true;
    setTimeout(async () => {
      isReconnecting = false;
      await initRabbit();
    }, 5000);
  }
};

export const publishAlert = (payload: object): void => {
  if (!channel) {
    console.warn('⚠️ Cannot publishAlert, channel not ready');
    return;
  }
  channel.publish('alerts', '', Buffer.from(JSON.stringify(payload)));
};
