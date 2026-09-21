import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { IWorkoutRepository, WORKOUT_REPOSITORY } from '../../domain/repositories/workout.repository.interface';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import {
  IDomainEventPublisher,
  DOMAIN_EVENT_PUBLISHER,
} from '../../../../infra/events/domain-event-publisher.service';

@Injectable()
export class PublishWorkoutUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY) private readonly workouts: IWorkoutRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(workoutId: string, tenantId: string): Promise<Result<void>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const workout = await this.workouts.findById(new UniqueEntityId(workoutId), tenantIdResult.value);
    if (!workout) return Result.fail(new DomainError('Treino não encontrado', 'WORKOUT_NOT_FOUND'));

    const result = workout.publish();
    if (result.isFailure) return Result.fail(result.error);

    await this.workouts.save(workout);
    this.events.publishAll(workout.pullDomainEvents());

    return Result.ok(undefined);
  }
}
