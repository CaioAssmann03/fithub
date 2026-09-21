import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { Diet } from '../../domain/entities/diet.entity';
import { DIET_REPOSITORY, IDietRepository } from '../../domain/repositories/diet.repository.interface';
import { IDomainEventPublisher, DOMAIN_EVENT_PUBLISHER } from '../../../../infra/events/domain-event-publisher.service';
import { MealDto } from '../dtos/diet.dtos';
import { buildMealsOrFail } from './create-diet.use-case';

@Injectable()
export class VersionDietUseCase {
  constructor(
    @Inject(DIET_REPOSITORY) private readonly diets: IDietRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(dietId: string, tenantId: string, mealDtos: MealDto[]): Promise<Result<Diet>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const current = await this.diets.findById(new UniqueEntityId(dietId), tenantIdResult.value);
    if (!current) return Result.fail(new DomainError('Dieta não encontrada', 'NOT_FOUND'));

    const mealsResult = buildMealsOrFail(mealDtos);
    if (mealsResult.isFailure) return Result.fail(mealsResult.error);

    const versionResult = current.createNewVersion(mealsResult.value);
    if (versionResult.isFailure) return versionResult;

    // Duas linhas (versão arquivada + nova) precisam commitar juntas — mesmo
    // raciocínio do VersionWorkoutUseCase (Etapa 5c). Aqui salvamos em
    // sequência porque save() já é atômico por dieta; se uma das duas
    // chamadas falhar, fica inconsistente — candidato a UoW se isso doer na prática.
    await this.diets.save(current);
    await this.diets.save(versionResult.value);
    this.events.publishAll([...current.pullDomainEvents(), ...versionResult.value.pullDomainEvents()]);

    return versionResult;
  }
}
