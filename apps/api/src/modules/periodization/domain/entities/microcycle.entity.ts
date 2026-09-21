import { AggregateRoot } from '../../../../core/domain/aggregate-root';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { Result, DomainError } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { MicrocycleCreatedEvent } from '../events/microcycle.events';

export interface MicrocycleProps {
  tenantId: TenantId;
  studentId: UniqueEntityId;
  /** Texto livre, não enum — cada personal nomeia fases do seu jeito ("Base"/"Deload" é só o vocabulário deste protocolo). */
  name: string;
  order: number;
  weeks: number;
  notes?: string;
  createdAt: Date;
}

export type CreateMicrocycleProps = Pick<MicrocycleProps, 'tenantId' | 'studentId' | 'name' | 'order' | 'weeks' | 'notes'>;

/**
 * Aggregate root flat (sem filhos), mesmo nível de simplicidade de
 * Feedback/Appointment. Fica em módulo próprio (não dentro de workouts/)
 * porque é conceito de linha-do-tempo do ALUNO, referenciado por Workout
 * via id plano — o mesmo motivo pelo qual Workout.studentId é uma
 * referência, não composição (ver ARCHITECTURE.md, seção 7, Shared Kernel
 * restrito). "Mesociclo" (soma de microciclos consecutivos) fica
 * implícito, sem entidade própria — não há ainda um caso real de mesociclo
 * com nome/meta independente da soma das fases que o compõem.
 */
export class Microcycle extends AggregateRoot<MicrocycleProps> {
  private constructor(props: MicrocycleProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: CreateMicrocycleProps, id?: UniqueEntityId): Result<Microcycle> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new DomainError('Microciclo precisa de um nome (ex: "Base", "Deload")', 'INVALID_NAME'));
    }
    if (props.weeks <= 0) {
      return Result.fail(new DomainError('Microciclo precisa de ao menos 1 semana', 'INVALID_WEEKS'));
    }

    const microcycle = new Microcycle({ ...props, createdAt: new Date() }, id);
    microcycle.addDomainEvent(
      new MicrocycleCreatedEvent(microcycle.id.toString(), props.tenantId.value, {
        studentId: props.studentId.toString(),
        name: props.name,
        weeks: props.weeks,
      }),
    );
    return Result.ok(microcycle);
  }

  /** Reidratação a partir de dado já persistido — sem validação nem eventos, diferente de create(). */
  static reconstitute(props: MicrocycleProps, id: UniqueEntityId): Microcycle {
    return new Microcycle(props, id);
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
  get order(): number {
    return this.props.order;
  }
  get weeks(): number {
    return this.props.weeks;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
