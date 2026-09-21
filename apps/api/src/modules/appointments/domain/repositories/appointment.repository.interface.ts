import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { Appointment } from '../entities/appointment.entity';

export interface IAppointmentRepository {
  findById(id: UniqueEntityId, tenantId: TenantId): Promise<Appointment | null>;
  findUpcomingByTenant(tenantId: TenantId, withinHours: number): Promise<Appointment[]>;
  save(appointment: Appointment): Promise<void>;
}

export const APPOINTMENT_REPOSITORY = Symbol('APPOINTMENT_REPOSITORY');
