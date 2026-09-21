import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../domain/repositories/student.repository.interface';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import {
  IDomainEventPublisher,
  DOMAIN_EVENT_PUBLISHER,
} from '../../../../infra/events/domain-event-publisher.service';

export type StudentStatusAction = 'DEACTIVATE' | 'REACTIVATE';

@Injectable()
export class ChangeStudentStatusUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY) private readonly students: IStudentRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(studentId: string, tenantId: string, action: StudentStatusAction): Promise<Result<void>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const student = await this.students.findById(new UniqueEntityId(studentId), tenantIdResult.value);
    if (!student) {
      return Result.fail(new DomainError('Aluno não encontrado', 'STUDENT_NOT_FOUND'));
    }

    const result = action === 'DEACTIVATE' ? student.deactivate() : student.reactivate();
    if (result.isFailure) return Result.fail(result.error);

    await this.students.save(student);
    this.events.publishAll(student.pullDomainEvents());

    return Result.ok(undefined);
  }
}
