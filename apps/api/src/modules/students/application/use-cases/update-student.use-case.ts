import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../domain/repositories/student.repository.interface';
import { StudentGoal, StudentGoalType } from '../../domain/value-objects/student.value-objects';
import { TenantId, Measurement, PhoneNumber } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import {
  IDomainEventPublisher,
  DOMAIN_EVENT_PUBLISHER,
} from '../../../../infra/events/domain-event-publisher.service';

export interface UpdateStudentInput {
  studentId: string;
  tenantId: string;
  name?: string;
  heightCm?: number;
  goalType?: StudentGoalType;
  goalDetail?: string;
  phone?: string;
  whatsapp?: string;
  notes?: string;
}

@Injectable()
export class UpdateStudentUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY) private readonly students: IStudentRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(input: UpdateStudentInput): Promise<Result<void>> {
    const tenantIdResult = TenantId.create(input.tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const student = await this.students.findById(new UniqueEntityId(input.studentId), tenantIdResult.value);
    if (!student) {
      return Result.fail(new DomainError('Aluno não encontrado', 'STUDENT_NOT_FOUND'));
    }

    let height: Measurement | undefined;
    if (input.heightCm !== undefined) {
      const heightResult = Measurement.create(input.heightCm, 'cm');
      if (heightResult.isFailure) return Result.fail(heightResult.error);
      height = heightResult.value;
    }

    let phone: PhoneNumber | undefined;
    if (input.phone) {
      const phoneResult = PhoneNumber.create(input.phone);
      if (phoneResult.isFailure) return Result.fail(phoneResult.error);
      phone = phoneResult.value;
    }

    let whatsapp: PhoneNumber | undefined;
    if (input.whatsapp) {
      const whatsappResult = PhoneNumber.create(input.whatsapp);
      if (whatsappResult.isFailure) return Result.fail(whatsappResult.error);
      whatsapp = whatsappResult.value;
    }

    const updateResult = student.updateProfile({
      name: input.name,
      height,
      goal: input.goalType ? StudentGoal.create(input.goalType, input.goalDetail) : undefined,
      phone,
      whatsapp,
      notes: input.notes,
    });
    if (updateResult.isFailure) return Result.fail(updateResult.error);

    await this.students.save(student);
    this.events.publishAll(student.pullDomainEvents());

    return Result.ok(undefined);
  }
}
