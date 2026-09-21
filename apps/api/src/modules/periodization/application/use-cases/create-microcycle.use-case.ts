import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { Microcycle } from '../../domain/entities/microcycle.entity';
import {
  IMicrocycleRepository,
  MICROCYCLE_REPOSITORY,
} from '../../domain/repositories/microcycle.repository.interface';
import {
  IDomainEventPublisher,
  DOMAIN_EVENT_PUBLISHER,
} from '../../../../infra/events/domain-event-publisher.service';

export interface CreateMicrocycleInput {
  tenantId: string;
  studentId: string;
  name: string;
  order: number;
  weeks: number;
  notes?: string;
}

@Injectable()
export class CreateMicrocycleUseCase {
  constructor(
    @Inject(MICROCYCLE_REPOSITORY) private readonly microcycles: IMicrocycleRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(input: CreateMicrocycleInput): Promise<Result<{ microcycleId: string }>> {
    const tenantIdResult = TenantId.create(input.tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);
    const tenantId = tenantIdResult.value;
    const studentId = new UniqueEntityId(input.studentId);

    // Pré-check de `order` duplicado — a constraint de banco (uq_microcycles_student_order)
    // garante a invariante de qualquer forma, mas sem isso o erro chegaria como
    // exceção crua do Postgres em vez de um Result.fail decente.
    const existing = await this.microcycles.findAllByStudent(studentId, tenantId);
    if (existing.some((m) => m.order === input.order)) {
      return Result.fail(new DomainError('Já existe um microciclo nessa posição', 'DUPLICATE_MICROCYCLE_ORDER'));
    }

    const microcycleResult = Microcycle.create({
      tenantId,
      studentId,
      name: input.name,
      order: input.order,
      weeks: input.weeks,
      notes: input.notes,
    });
    if (microcycleResult.isFailure) return Result.fail(microcycleResult.error);

    const microcycle = microcycleResult.value;
    await this.microcycles.save(microcycle);
    this.events.publishAll(microcycle.pullDomainEvents());

    return Result.ok({ microcycleId: microcycle.id.toString() });
  }
}
