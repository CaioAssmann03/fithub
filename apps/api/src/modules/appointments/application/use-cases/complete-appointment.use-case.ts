import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import {
  IAppointmentRepository,
  APPOINTMENT_REPOSITORY,
} from '../../domain/repositories/appointment.repository.interface';

@Injectable()
export class CompleteAppointmentUseCase {
  constructor(@Inject(APPOINTMENT_REPOSITORY) private readonly appointments: IAppointmentRepository) {}

  async execute(appointmentId: string, tenantId: string): Promise<Result<void>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const appointment = await this.appointments.findById(new UniqueEntityId(appointmentId), tenantIdResult.value);
    if (!appointment) return Result.fail(new DomainError('Agendamento não encontrado', 'NOT_FOUND'));

    const result = appointment.complete();
    if (result.isFailure) return result;

    await this.appointments.save(appointment);
    return Result.ok(undefined);
  }
}
