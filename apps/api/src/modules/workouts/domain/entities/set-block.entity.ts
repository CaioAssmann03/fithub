import { Entity, UniqueEntityId } from '../../../../core/domain/entity';
import { Result, DomainError } from '../../../../core/domain/result';
import { SetTechnique, RepRange, Load, RestRange } from '../value-objects/workout.value-objects';

export interface SetBlockProps {
  order: number;
  technique: SetTechnique;
  sets: number;
  reps: RepRange;
  load: Load;
  /** Ausente = herda o intervalo padrão do Workout pai (ver Workout.defaultRest). */
  rest?: RestRange;
  notes?: string;
}

/**
 * Entity, não Aggregate Root — filha de WorkoutExercise (que por sua vez
 * é filha de Workout), nunca existe isolada, sem repositório próprio.
 * Um exercício como "Remada baixa (FS) + 3x8~10 + 1x6~8" vira DOIS
 * SetBlock dentro do mesmo WorkoutExercise, cada um com sua técnica.
 */
export class SetBlock extends Entity<SetBlockProps> {
  private constructor(props: SetBlockProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: SetBlockProps, id?: UniqueEntityId): Result<SetBlock> {
    if (props.sets <= 0) {
      return Result.fail(new DomainError('Bloco de série precisa de ao menos 1 série', 'INVALID_SETS'));
    }
    if (props.reps.max < props.reps.min) {
      return Result.fail(new DomainError('Faixa de repetições inválida', 'INVALID_REP_RANGE'));
    }
    return Result.ok(new SetBlock(props, id));
  }

  /** Reidratação a partir de dado já persistido — sem validação, diferente de create(). */
  static reconstitute(props: SetBlockProps, id: UniqueEntityId): SetBlock {
    return new SetBlock(props, id);
  }

  get order(): number {
    return this.props.order;
  }
  get technique(): SetTechnique {
    return this.props.technique;
  }
  get sets(): number {
    return this.props.sets;
  }
  get reps(): RepRange {
    return this.props.reps;
  }
  get load(): Load {
    return this.props.load;
  }
  get rest(): RestRange | undefined {
    return this.props.rest;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
}
