import { Appointment } from '../../domain/entities/appointment.entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

export class AppointmentMapper {
  static toDomain(raw: any): Appointment {
    return Appointment.reconstitute(
      {
        tenantId: TenantId.create(raw.tenantId).value,
        studentId: new UniqueEntityId(raw.studentId),
        type: raw.type,
        scheduledAt: raw.scheduledAt,
        durationMinutes: raw.durationMinutes,
        status: raw.status,
        notes: raw.notes ?? undefined,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPersistence(appointment: Appointment) {
    return {
      id: appointment.id.toString(),
      tenantId: appointment.tenantId.value,
      studentId: appointment.studentId.toString(),
      type: appointment.type,
      scheduledAt: appointment.scheduledAt,
      durationMinutes: appointment.durationMinutes,
      status: appointment.status,
      notes: appointment.notes,
    };
  }
}
