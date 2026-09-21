import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../domain/repositories/student.repository.interface';
import { Student } from '../../domain/entities/student.entity';
import { Gender, StudentGoal, StudentGoalType } from '../../domain/value-objects/student.value-objects';
import { TenantId, Measurement, PhoneNumber } from '../../../../core/domain/shared-value-objects';
import {
  IDomainEventPublisher,
  DOMAIN_EVENT_PUBLISHER,
} from '../../../../infra/events/domain-event-publisher.service';

export interface CreateStudentInput {
  tenantId: string;
  name: string;
  gender: Gender;
  birthDate: Date;
  heightCm?: number;
  goalType?: StudentGoalType;
  goalDetail?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  notes?: string;
}

@Injectable()
export class CreateStudentUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY) private readonly students: IStudentRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(input: CreateStudentInput): Promise<Result<{ studentId: string }>> {
    const tenantIdResult = TenantId.create(input.tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);
    const tenantId = tenantIdResult.value;

    if (input.email) {
      const exists = await this.students.existsByEmail(input.email, tenantId);
      if (exists) {
        return Result.fail(new DomainError('Já existe aluno com este e-mail', 'EMAIL_ALREADY_EXISTS'));
      }
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

    const studentResult = Student.create({
      tenantId,
      name: input.name,
      gender: input.gender,
      birthDate: input.birthDate,
      height,
      goal: input.goalType ? StudentGoal.create(input.goalType, input.goalDetail) : undefined,
      phone,
      whatsapp,
      email: input.email,
      notes: input.notes,
    });
    if (studentResult.isFailure) return Result.fail(studentResult.error);

    const student = studentResult.value;
    await this.students.save(student);
    this.events.publishAll(student.pullDomainEvents());

    return Result.ok({ studentId: student.id.toString() });
  }
}
