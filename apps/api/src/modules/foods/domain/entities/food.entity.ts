import { Entity, UniqueEntityId } from '../../../../core/domain/entity';
import { Result } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';

export interface FoodProps {
  tenantId: TenantId | null;
  name: string;
  caloriesPer100g?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  createdAt: Date;
}

export class Food extends Entity<FoodProps> {
  private constructor(props: FoodProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: {
    tenantId: TenantId | null;
    name: string;
    caloriesPer100g?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
  }): Result<Food> {
    if (!props.name || props.name.trim().length < 2) {
      return Result.fail({ code: 'INVALID_NAME', message: 'Nome do alimento precisa ter ao menos 2 caracteres.' });
    }

    return Result.ok(
      new Food({
        tenantId: props.tenantId,
        name: props.name.trim(),
        caloriesPer100g: props.caloriesPer100g,
        proteinG: props.proteinG,
        carbsG: props.carbsG,
        fatG: props.fatG,
        createdAt: new Date(),
      }),
    );
  }

  static reconstitute(props: FoodProps, id: UniqueEntityId): Food {
    return new Food(props, id);
  }

  get isGlobal(): boolean {
    return this.props.tenantId === null;
  }
  get tenantId(): TenantId | null {
    return this.props.tenantId;
  }
  get name(): string {
    return this.props.name;
  }
  get caloriesPer100g(): number | undefined {
    return this.props.caloriesPer100g;
  }
  get proteinG(): number | undefined {
    return this.props.proteinG;
  }
  get carbsG(): number | undefined {
    return this.props.carbsG;
  }
  get fatG(): number | undefined {
    return this.props.fatG;
  }
}
