import { AggregateRoot } from '../../../../core/domain/aggregate-root';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { Result, DomainError } from '../../../../core/domain/result';
import { TenantId, Measurement } from '../../../../core/domain/shared-value-objects';
import { Bmi, BodyFatPercentage, Circumferences, Skinfolds } from '../value-objects/assessment.value-objects';
import { AssessmentCreatedEvent, AssessmentUpdatedEvent } from '../events/assessment.events';

export interface AssessmentProps {
  tenantId: TenantId;
  studentId: UniqueEntityId;
  date: Date;
  weight: Measurement;
  height: Measurement;
  bmi: Bmi;
  bodyFat?: BodyFatPercentage;
  circumferences?: Circumferences;
  skinfolds?: Skinfolds;
  photoIds: string[];
  notes?: string;
  createdAt: Date;
}

export type CreateAssessmentProps = Pick<
  AssessmentProps,
  | 'tenantId' | 'studentId' | 'date' | 'weight' | 'height' | 'bmi'
  | 'bodyFat' | 'circumferences' | 'skinfolds' | 'notes'
>;

/**
 * Um snapshot no tempo — imutável na prática depois de criado. "Corrigir"
 * uma avaliação dispara AssessmentUpdatedEvent, mas não recalcula o BMI a
 * partir de dado atual do Student: o BMI já veio pronto do domain service
 * no momento da criação (ver body-metrics-calculator.service.ts).
 * `studentId` é referência por id, nunca o objeto Student — Assessment
 * não atravessa a fronteira do agregado Students (seção 6 do
 * ARCHITECTURE.md).
 */
export class Assessment extends AggregateRoot<AssessmentProps> {
  private constructor(props: AssessmentProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: CreateAssessmentProps, id?: UniqueEntityId): Result<Assessment> {
    if (props.weight.value <= 0 || props.weight.value > 400) {
      return Result.fail(new DomainError('Peso fora da faixa fisiológica plausível', 'INVALID_WEIGHT'));
    }
    if (props.date.getTime() > Date.now()) {
      return Result.fail(new DomainError('Data da avaliação não pode ser no futuro', 'INVALID_DATE'));
    }

    const isNew = !id;
    const assessment = new Assessment({ ...props, photoIds: [], createdAt: new Date() }, id);

    if (isNew) {
      assessment.addDomainEvent(
        new AssessmentCreatedEvent(assessment.id.toString(), props.tenantId.value, {
          studentId: props.studentId.toString(),
          date: props.date,
          weightKg: props.weight.value,
          bmiValue: props.bmi.value,
          bodyFatPercent: props.bodyFat?.value,
        }),
      );
    }

    return Result.ok(assessment);
  }

  /** Reidratação a partir de dado já persistido — sem validação nem eventos, diferente de create(). */
  static reconstitute(props: AssessmentProps, id: UniqueEntityId): Assessment {
    return new Assessment(props, id);
  }

  updateNotes(notes: string): void {
    this.props.notes = notes;
    this.addDomainEvent(
      new AssessmentUpdatedEvent(this.id.toString(), this.props.tenantId.value, this.props.studentId.toString()),
    );
  }

  addPhoto(fileId: string): void {
    this.props.photoIds.push(fileId);
  }

  get studentId(): UniqueEntityId {
    return this.props.studentId;
  }
  get tenantId(): TenantId {
    return this.props.tenantId;
  }
  get weight(): Measurement {
    return this.props.weight;
  }
  get bmi(): Bmi {
    return this.props.bmi;
  }
  get date(): Date {
    return this.props.date;
  }
  get height(): Measurement {
    return this.props.height;
  }
  get bodyFat(): BodyFatPercentage | undefined {
    return this.props.bodyFat;
  }
  get circumferences(): Circumferences | undefined {
    return this.props.circumferences;
  }
  get skinfolds(): Skinfolds | undefined {
    return this.props.skinfolds;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
  get photoIds(): ReadonlyArray<string> {
    return this.props.photoIds;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
