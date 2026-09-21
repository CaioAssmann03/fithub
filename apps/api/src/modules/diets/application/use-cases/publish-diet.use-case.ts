import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { DIET_REPOSITORY, IDietRepository } from '../../domain/repositories/diet.repository.interface';
import { IDomainEventPublisher, DOMAIN_EVENT_PUBLISHER } from '../../../../infra/events/domain-event-publisher.service';

@Injectable()
export class PublishDietUseCase {
  constructor(
    @Inject(DIET_REPOSITORY) private readonly diets: IDietRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(dietId: string, tenantId: string): Promise<Result<void>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const diet = await this.diets.findById(new UniqueEntityId(dietId), tenantIdResult.value);
    if (!diet) return Result.fail(new DomainError('Dieta não encontrada', 'NOT_FOUND'));

    const result = diet.publish();
    if (result.isFailure) return result;

    await this.diets.save(diet);
    this.events.publishAll(diet.pullDomainEvents());
    return Result.ok(undefined);
  }
}
