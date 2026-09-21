import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import {
  IAppointmentRepository,
  APPOINTMENT_REPOSITORY,
} from '../../domain/repositories/appointment.repository.interface';
import { Appointment } from '../../domain/entities/appointment.entity';

@Injectable()
export class ListUpcomingAppointmentsUseCase {
  constructor(@Inject(APPOINTMENT_REPOSITORY) private readonly appointments: IAppointmentRepository) {}

  async execute(tenantId: string, withinHours: number): Promise<Result<Appointment[]>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const appointments = await this.appointments.findUpcomingByTenant(tenantIdResult.value, withinHours);
    return Result.ok(appointments);
  }
}
