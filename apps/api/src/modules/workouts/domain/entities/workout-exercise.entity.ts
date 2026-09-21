import { Entity, UniqueEntityId } from '../../../../core/domain/entity';
import { Result, DomainError } from '../../../../core/domain/result';
import { WeeklyFrequency } from '../value-objects/workout.value-objects';
import { SetBlock } from './set-block.entity';

export interface WorkoutExerciseProps {
  exerciseId: UniqueEntityId;
  order: number;
  setBlocks: SetBlock[];
  /** Coexiste com setBlocks — "Abdominal 5x12~15 3x na semana" tem os dois ao mesmo tempo. */
  weeklyFrequency?: WeeklyFrequency;
  /** Só pra itens sem sets/reps de verdade (cardio puro: "30min esteira 5-6km/h"). Nunca junto de setBlocks vazio E ausente. */
  freeformPrescription?: string;
  /** Dica de execução (ex: "Com retração escapular") — diferente de freeformPrescription, que é a prescrição em si. */
  notes?: string;
  videoUrl?: string;
}

export type CreateWorkoutExerciseProps = Omit<WorkoutExerciseProps, 'setBlocks'>;

/**
 * Entity, não Aggregate Root — não existe fora de um Workout, não tem
 * repositório próprio, é sempre lida/salva junto com o pai. A checagem de
 * "ordem de exercício duplicada" mora no Workout (workout.entity.ts), que
 * também valida que todo exercício tem setBlocks OU freeformPrescription
 * — uma WorkoutExercise isolada não enxerga as irmãs, mas valida sua
 * própria prescrição (não pode ficar sem nenhuma das duas).
 */
export class WorkoutExercise extends Entity<WorkoutExerciseProps> {
  private constructor(props: WorkoutExerciseProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: CreateWorkoutExerciseProps, id?: UniqueEntityId): Result<WorkoutExercise> {
    return Result.ok(new WorkoutExercise({ ...props, setBlocks: [] }, id));
  }

  /** Reidratação a partir de dado já persistido — sem validação, diferente de create(). */
  static reconstitute(props: WorkoutExerciseProps, id: UniqueEntityId): WorkoutExercise {
    return new WorkoutExercise(props, id);
  }

  addSetBlock(block: SetBlock): Result<void> {
    const orderTaken = this.props.setBlocks.some((b) => b.order === block.order);
    if (orderTaken) {
      return Result.fail(new DomainError('Já existe bloco de série nessa posição', 'DUPLICATE_BLOCK_ORDER'));
    }
    this.props.setBlocks.push(block);
    return Result.ok(undefined);
  }

  /** true se este exercício tem alguma prescrição de verdade (bloco ou texto livre) — checado pelo Workout pai em addExercise(). */
  hasPrescription(): boolean {
    return this.props.setBlocks.length > 0 || !!this.props.freeformPrescription?.trim();
  }

  get exerciseId(): UniqueEntityId {
    return this.props.exerciseId;
  }
  get order(): number {
    return this.props.order;
  }
  get setBlocks(): ReadonlyArray<SetBlock> {
    return this.props.setBlocks;
  }
  get weeklyFrequency(): WeeklyFrequency | undefined {
    return this.props.weeklyFrequency;
  }
  get freeformPrescription(): string | undefined {
    return this.props.freeformPrescription;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
  get videoUrl(): string | undefined {
    return this.props.videoUrl;
  }
}
