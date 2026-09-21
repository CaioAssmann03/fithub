export type AppointmentType = 'ASSESSMENT' | 'CONSULTATION' | 'WORKOUT_SESSION' | 'OTHER';
export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: string;
  studentId: string;
  type: AppointmentType;
  scheduledAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
}

export interface CreateAppointmentInput {
  studentId: string;
  type: AppointmentType;
  scheduledAt: string;
  durationMinutes?: number;
  notes?: string;
}
