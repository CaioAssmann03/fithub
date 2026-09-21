import { Entity, UniqueEntityId } from '../../../../core/domain/entity';
import { Result } from '../../../../core/domain/result';
import { QuantityUnit } from '../value-objects/diet.value-objects';

export interface MealFoodProps {
  foodId: UniqueEntityId;
  quantityValue: number;
  quantityUnit: QuantityUnit;
  notes?: string;
}

export class MealFood extends Entity<MealFoodProps> {
  private constructor(props: MealFoodProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: MealFoodProps): Result<MealFood> {
    if (props.quantityValue <= 0) {
      return Result.fail({ code: 'INVALID_QUANTITY', message: 'Quantidade precisa ser maior que zero.' });
    }
    return Result.ok(new MealFood(props));
  }

  static reconstitute(props: MealFoodProps, id: UniqueEntityId): MealFood {
    return new MealFood(props, id);
  }

  get foodId(): UniqueEntityId {
    return this.props.foodId;
  }
  get quantityValue(): number {
    return this.props.quantityValue;
  }
  get quantityUnit(): QuantityUnit {
    return this.props.quantityUnit;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
}
