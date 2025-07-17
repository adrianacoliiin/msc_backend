import mongoose, { Schema, Document, Types } from 'mongoose';

export interface MaintenanceDocument extends Document {
  date: Date;
  responsible_id: Types.ObjectId;
  device_id: Types.ObjectId;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'approved';
  approved_by?: Types.ObjectId;
  damage_image?: string;
  priority?: 'low' | 'medium' | 'high';
  description?: string;
  estimated_duration?: number; // Duración estimada en minutos
  createdAt: Date;
  updatedAt: Date;
}

const maintenanceSchema = new Schema<MaintenanceDocument>({
  date: {
    type: Date,
    required: true,
  },
  responsible_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  device_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'approved'],
    default: 'pending',
  },
  approved_by: {
    type: Schema.Types.ObjectId,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  description: {
    type: String,
    maxlength: 500,
  },
  estimated_duration: {
    type: Number, // Duración en minutos
  },
  damage_image: {
    type: String,
  },
}, {
  timestamps: true, // añade createdAt y updatedAt automáticamente
});

export default mongoose.model<MaintenanceDocument>('Maintenance', maintenanceSchema);
