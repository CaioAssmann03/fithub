import { Entity, UniqueEntityId } from '../../../../core/domain/entity';
import { Result } from '../../../../core/domain/result';
import { MealFood } from './meal-food.entity';

export interface MealProps {
  name: string;
  /** "HH:mm" no domínio — vira Date(1970-01-01T...) só na camada Prisma (ver mapper). */
  time: string;
  order: number;
  foods: MealFood[];
  notes?: string;
}

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class Meal extends Entity<MealProps> {
  private constructor(props: MealProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: {
    name: string;
    time: string;
    order: number;
    foods?: MealFood[];
    notes?: string;
  }): Result<Meal> {
    if (!props.name || props.name.trim().length < 2) {
      return Result.fail({ code: 'INVALID_NAME', message: 'Nome da refeição precisa ter ao menos 2 caracteres.' });
    }
    if (!TIME_REGEX.test(props.time)) {
      return Result.fail({ code: 'INVALID_TIME', message: 'Horário precisa estar no formato HH:mm.' });
    }

    return Result.ok(
      new Meal({ name: props.name.trim(), time: props.time, order: props.order, foods: props.foods ?? [], notes: props.notes }),
    );
  }

  static reconstitute(props: MealProps, id: UniqueEntityId): Meal {
    return new Meal(props, id);
  }

  addFood(mealFood: MealFood): void {
    this.props.foods.push(mealFood);
  }

  get name(): string {
    return this.props.name;
  }
  get time(): string {
    return this.props.time;
  }
  get order(): number {
    return this.props.order;
  }
  get foods(): MealFood[] {
    return this.props.foods;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
}
