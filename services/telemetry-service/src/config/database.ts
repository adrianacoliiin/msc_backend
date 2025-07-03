import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI!;
    await mongoose.connect(uri);
    console.log('MongoDB connected (telemetry)');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
