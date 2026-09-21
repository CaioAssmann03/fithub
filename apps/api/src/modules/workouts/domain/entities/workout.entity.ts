import { AggregateRoot } from '../../../../core/domain/aggregate-root';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { Result, DomainError } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { WorkoutStatus, RestRange } from '../value-objects/workout.value-objects';
import { WorkoutExercise } from './workout-exercise.entity';
import {
  WorkoutCreatedEvent,
  WorkoutVersionedEvent,
  WorkoutAssignedEvent,
  WorkoutArchivedEvent,
} from '../events/workout.events';

export interface WorkoutProps {
  tenantId: TenantId;
  studentId: UniqueEntityId;
  label: string;
  version: number;
  previousVersionId?: UniqueEntityId;
  status: WorkoutStatus;
  exercises: WorkoutExercise[];
  notes?: string;
  /** Fase de periodização à qual esta versão pertence (ver modules/periodization) — opcional, plano por id, igual studentId. */
  microcycleId?: UniqueEntityId;
  /** Intervalo padrão do treino inteiro (ex: "90 a 180seg") — herdado por SetBlock que não especifica o próprio rest. */
  defaultRest?: RestRange;
  createdAt: Date;
}

export interface CreateWorkoutOptions {
  microcycleId?: UniqueEntityId;
  defaultRest?: RestRange;
}

/**
 * Aggregate Root. Fronteira de consistência = Workout + suas
 * WorkoutExercise (e, um nível abaixo, os SetBlock de cada uma): ordem
 * única e "publicar exige >=1 exercício" só fazem sentido olhando a lista
 * inteira — por isso não poderiam viver isoladas em WorkoutExercise.
 *
 * Versionamento: "editar" um treino já publicado NÃO faz update in-place
 * — cria uma nova versão (createNewVersion) e arquiva a anterior. É assim
 * que "Versão" e "Histórico" do briefing original viram modelo de
 * domínio de verdade, em vez de um campo solto sem comportamento.
 */
export class Workout extends AggregateRoot<WorkoutProps> {
  private constructor(props: WorkoutProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(
    props: Pick<WorkoutProps, 'tenantId' | 'studentId' | 'label' | 'notes'> & CreateWorkoutOptions,
    id?: UniqueEntityId,
  ): Result<Workout> {
    if (!props.label || props.label.trim().length === 0) {
      return Result.fail(new DomainError('Treino precisa de um nome (ex: "Treino A")', 'INVALID_LABEL'));
    }

    const workout = new Workout(
      {
        tenantId: props.tenantId,
        studentId: props.studentId,
        label: props.label,
        notes: props.notes,
        microcycleId: props.microcycleId,
        defaultRest: props.defaultRest,
        version: 1,
        status: WorkoutStatus.ACTIVE,
        exercises: [],
        createdAt: new Date(),
      },
      id,
    );

    workout.addDomainEvent(new WorkoutCreatedEvent(workout.id.toString(), props.tenantId.value));
    return Result.ok(workout);
  }

  /**
   * Portão de entrada pra um exercício nascer no agregado: valida ordem
   * única entre exercícios E que todo exercício tem alguma prescrição de
   * verdade (bloco de série ou texto livre) — nunca nenhuma das duas.
   */
  addExercise(exercise: WorkoutExercise): Result<void> {
    const orderTaken = this.props.exercises.some((e) => e.order === exercise.order);
    if (orderTaken) {
      return Result.fail(new DomainError('Já existe exercício nessa posição', 'DUPLICATE_ORDER'));
    }
    if (!exercise.hasPrescription()) {
      return Result.fail(
        new DomainError(
          'Exercício precisa de ao menos um bloco de série ou uma prescrição livre (ex: cardio)',
          'EMPTY_PRESCRIPTION',
        ),
      );
    }
    this.props.exercises.push(exercise);
    return Result.ok(undefined);
  }

  /** Torna o treino visível pro aluno — dispara push (ver módulo Notifications). */
  publish(): Result<void> {
    if (this.props.exercises.length === 0) {
      return Result.fail(
        new DomainError('Treino precisa de ao menos 1 exercício para ser publicado', 'EMPTY_WORKOUT'),
      );
    }
    this.addDomainEvent(
      new WorkoutAssignedEvent(this.id.toString(), this.props.tenantId.value, this.props.studentId.toString()),
    );
    return Result.ok(undefined);
  }

  /**
   * NÃO muta este Workout — retorna uma NOVA instância (v+1) e arquiva a
   * atual. O Use Case é quem persiste as duas atomicamente (Unit of Work).
   * `options` ausente = a nova versão herda microcycleId/defaultRest da
   * atual (edição normal); presente = transição de fase (ex: Base→Deload).
   *
   * CORREÇÃO: antes, os exercícios da nova versão eram atribuídos direto
   * no construtor, sem passar por addExercise() — a checagem de ordem
   * duplicada (e agora EMPTY_PRESCRIPTION) não rodava no caminho de
   * versionamento, só no de criação. Populando via loop de addExercise(),
   * as mesmas invariantes valem nos dois caminhos.
   */
  createNewVersion(newExercises: WorkoutExercise[], options?: CreateWorkoutOptions): Result<Workout> {
    if (this.props.status === WorkoutStatus.ARCHIVED) {
      return Result.fail(new DomainError('Não é possível versionar um treino já arquivado', 'ALREADY_ARCHIVED'));
    }

    const newVersion = new Workout({
      tenantId: this.props.tenantId,
      studentId: this.props.studentId,
      label: this.props.label,
      version: this.props.version + 1,
      previousVersionId: this.id,
      status: WorkoutStatus.ACTIVE,
      exercises: [],
      notes: this.props.notes,
      microcycleId: options?.microcycleId ?? this.props.microcycleId,
      defaultRest: options?.defaultRest ?? this.props.defaultRest,
      createdAt: new Date(),
    });

    for (const exercise of newExercises) {
      const addResult = newVersion.addExercise(exercise);
      if (addResult.isFailure) return Result.fail(addResult.error);
    }

    this.props.status = WorkoutStatus.ARCHIVED;
    this.addDomainEvent(new WorkoutArchivedEvent(this.id.toString(), this.props.tenantId.value));
    newVersion.addDomainEvent(
      new WorkoutVersionedEvent(
        newVersion.id.toString(),
        this.props.tenantId.value,
        this.id.toString(),
        newVersion.props.version,
      ),
    );

    return Result.ok(newVersion);
  }

  /** Reidratação a partir de dado já persistido — sem eventos, diferente de create()/createNewVersion(). */
  static reconstitute(props: WorkoutProps, id: UniqueEntityId): Workout {
    return new Workout(props, id);
  }

  get studentId(): UniqueEntityId {
    return this.props.studentId;
  }
  get tenantId(): TenantId {
    return this.props.tenantId;
  }
  get version(): number {
    return this.props.version;
  }
  get status(): WorkoutStatus {
    return this.props.status;
  }
  get exercises(): ReadonlyArray<WorkoutExercise> {
    return this.props.exercises;
  }
  get label(): string {
    return this.props.label;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
  get previousVersionId(): UniqueEntityId | undefined {
    return this.props.previousVersionId;
  }
  get microcycleId(): UniqueEntityId | undefined {
    return this.props.microcycleId;
  }
  get defaultRest(): RestRange | undefined {
    return this.props.defaultRest;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
