export interface CreateMaintenanceDTO {
    date: string; // Formato ISO, ejemplo: "2025-07-17T10:00:00Z"
    responsible_id: string; // ObjectId como string
    device_id: string;      // ObjectId como string
    damage_image?: string;  // Ruta o URL opcional
    priority?: 'low' | 'medium' | 'high'; // Prioridad opcional
    description?: string; // Descripción opcional
    estimated_duration?: number; // Duración estimada en minutos opcional
  }
  