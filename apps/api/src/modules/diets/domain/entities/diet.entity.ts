import { AggregateRoot } from '../../../../core/domain/aggregate-root';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { Result, DomainError } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { DietStatus } from '../value-objects/diet.value-objects';
import { Meal } from './meal.entity';
import { DietCreatedEvent, DietVersionedEvent, DietPublishedEvent, DietArchivedEvent } from '../events/diet.events';

export interface DietProps {
  tenantId: TenantId;
  studentId: UniqueEntityId;
  name: string;
  version: number;
  previousVersionId?: UniqueEntityId;
  status: DietStatus;
  meals: Meal[];
  notes?: string;
  createdAt: Date;
}

/**
 * Mesmo padrão de versionamento do Workout (ver workout.entity.ts) —
 * "editar" uma dieta publicada não faz update in-place, cria uma nova
 * versão e arquiva a anterior.
 */
export class Diet extends AggregateRoot<DietProps> {
  private constructor(props: DietProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: Pick<DietProps, 'tenantId' | 'studentId' | 'name' | 'notes'>, id?: UniqueEntityId): Result<Diet> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new DomainError('Dieta precisa de um nome', 'INVALID_NAME'));
    }

    const diet = new Diet({ ...props, version: 1, status: DietStatus.ACTIVE, meals: [], createdAt: new Date() }, id);
    diet.addDomainEvent(new DietCreatedEvent(diet.id.toString(), props.tenantId.value));
    return Result.ok(diet);
  }

  addMeal(meal: Meal): Result<void> {
    const orderTaken = this.props.meals.some((m) => m.order === meal.order);
    if (orderTaken) {
      return Result.fail(new DomainError('Já existe refeição nessa posição', 'DUPLICATE_ORDER'));
    }
    this.props.meals.push(meal);
    return Result.ok(undefined);
  }

  publish(): Result<void> {
    if (this.props.meals.length === 0) {
      return Result.fail(new DomainError('Dieta precisa de ao menos 1 refeição para ser publicada', 'EMPTY_DIET'));
    }
    this.addDomainEvent(new DietPublishedEvent(this.id.toString(), this.props.tenantId.value, this.props.studentId.toString()));
    return Result.ok(undefined);
  }

  createNewVersion(newMeals: Meal[]): Result<Diet> {
    if (this.props.status === DietStatus.ARCHIVED) {
      return Result.fail(new DomainError('Não é possível versionar uma dieta já arquivada', 'ALREADY_ARCHIVED'));
    }

    const newVersion = new Diet({
      tenantId: this.props.tenantId,
      studentId: this.props.studentId,
      name: this.props.name,
      version: this.props.version + 1,
      previousVersionId: this.id,
      status: DietStatus.ACTIVE,
      meals: newMeals,
      notes: this.props.notes,
      createdAt: new Date(),
    });

    this.props.status = DietStatus.ARCHIVED;
    this.addDomainEvent(new DietArchivedEvent(this.id.toString(), this.props.tenantId.value));
    newVersion.addDomainEvent(
      new DietVersionedEvent(newVersion.id.toString(), this.props.tenantId.value, this.id.toString(), newVersion.props.version),
    );

    return Result.ok(newVersion);
  }

  static reconstitute(props: DietProps, id: UniqueEntityId): Diet {
    return new Diet(props, id);
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }
  get studentId(): UniqueEntityId {
    return this.props.studentId;
  }
  get name(): string {
    return this.props.name;
  }
  get version(): number {
    return this.props.version;
  }
  get status(): DietStatus {
    return this.props.status;
  }
  get meals(): ReadonlyArray<Meal> {
    return this.props.meals;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
  get previousVersionId(): UniqueEntityId | undefined {
    return this.props.previousVersionId;
  }
}
