import { AggregateRoot } from '../../../../core/domain/aggregate-root';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { Result, DomainError } from '../../../../core/domain/result';
import { TenantId, Measurement, PhoneNumber } from '../../../../core/domain/shared-value-objects';
import { Gender, StudentStatus, StudentGoal } from '../value-objects/student.value-objects';
import {
  StudentCreatedEvent,
  StudentDeactivatedEvent,
  StudentReactivatedEvent,
  StudentLinkedToUserEvent,
  StudentProfileUpdatedEvent,
} from '../events/student.events';

export interface StudentProps {
  tenantId: TenantId;
  name: string;
  gender: Gender;
  birthDate: Date;
  height?: Measurement;
  goal?: StudentGoal;
  phone?: PhoneNumber;
  whatsapp?: PhoneNumber;
  email?: string;
  notes?: string;
  status: StudentStatus;
  userId?: UniqueEntityId;
  photoIds: string[];
  createdAt: Date;
}

export type CreateStudentProps = Pick<
  StudentProps,
  'tenantId' | 'name' | 'gender' | 'birthDate' | 'height' | 'goal' | 'phone' | 'whatsapp' | 'email' | 'notes'
>;

/**
 * Aggregate Root do Core Domain. Deliberadamente NÃO guarda "peso atual":
 * peso é dado longitudinal e vive em Assessment (formal) e Feedback
 * (self-report informal) — ver "Decisões desta etapa" no DDD-MODEL.md.
 * Guardar peso aqui seria duplicar uma leitura que fica velha na hora.
 */
export class Student extends AggregateRoot<StudentProps> {
  private constructor(props: StudentProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: CreateStudentProps, id?: UniqueEntityId): Result<Student> {
    if (!props.name || props.name.trim().length < 2) {
      return Result.fail(new DomainError('Nome do aluno deve ter ao menos 2 caracteres', 'INVALID_NAME'));
    }
    if (props.birthDate.getTime() > Date.now()) {
      return Result.fail(new DomainError('Data de nascimento não pode ser no futuro', 'INVALID_BIRTH_DATE'));
    }

    const isNew = !id;
    const student = new Student(
      { ...props, status: StudentStatus.ACTIVE, photoIds: [], createdAt: new Date() },
      id,
    );

    if (isNew) {
      student.addDomainEvent(
        new StudentCreatedEvent(student.id.toString(), props.tenantId.value, {
          name: props.name,
          goal: props.goal?.toString(),
        }),
      );
    }

    return Result.ok(student);
  }

  /**
   * Reidratação a partir de dado já persistido — sem validação nem
   * eventos, diferente de create(). O dado já é confiável (veio do
   * banco); rodar as mesmas checagens de negócio de novo a cada leitura
   * seria trabalho sem propósito, e reemitir StudentCreatedEvent numa
   * leitura seria um bug sério (evento duplicado).
   */
  static reconstitute(props: StudentProps, id: UniqueEntityId): Student {
    return new Student(props, id);
  }

  deactivate(): Result<void> {
    if (this.props.status === StudentStatus.INACTIVE) {
      return Result.fail(new DomainError('Aluno já está inativo', 'ALREADY_INACTIVE'));
    }
    this.props.status = StudentStatus.INACTIVE;
    this.addDomainEvent(new StudentDeactivatedEvent(this.id.toString(), this.props.tenantId.value));
    return Result.ok(undefined);
  }

  reactivate(): Result<void> {
    if (this.props.status === StudentStatus.ACTIVE) {
      return Result.fail(new DomainError('Aluno já está ativo', 'ALREADY_ACTIVE'));
    }
    this.props.status = StudentStatus.ACTIVE;
    this.addDomainEvent(new StudentReactivatedEvent(this.id.toString(), this.props.tenantId.value));
    return Result.ok(undefined);
  }

  /** Habilita o aluno a logar no Painel do Aluno (ver seção 12 do ARCHITECTURE.md). */
  linkToUser(userId: UniqueEntityId): Result<void> {
    if (this.props.userId) {
      return Result.fail(new DomainError('Aluno já possui acesso ao app', 'ALREADY_LINKED'));
    }
    this.props.userId = userId;
    this.addDomainEvent(
      new StudentLinkedToUserEvent(this.id.toString(), this.props.tenantId.value, userId.toString()),
    );
    return Result.ok(undefined);
  }

  updateProfile(
    changes: Partial<Pick<StudentProps, 'name' | 'height' | 'goal' | 'phone' | 'whatsapp' | 'notes'>>,
  ): Result<void> {
    Object.assign(this.props, changes);
    this.addDomainEvent(new StudentProfileUpdatedEvent(this.id.toString(), this.props.tenantId.value));
    return Result.ok(undefined);
  }

  addPhoto(fileId: string): void {
    this.props.photoIds.push(fileId);
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }
  get name(): string {
    return this.props.name;
  }
  get status(): StudentStatus {
    return this.props.status;
  }
  get userId(): UniqueEntityId | undefined {
    return this.props.userId;
  }
  get goal(): StudentGoal | undefined {
    return this.props.goal;
  }
  get gender(): Gender {
    return this.props.gender;
  }
  get birthDate(): Date {
    return this.props.birthDate;
  }
  get height(): Measurement | undefined {
    return this.props.height;
  }
  get phone(): PhoneNumber | undefined {
    return this.props.phone;
  }
  get whatsapp(): PhoneNumber | undefined {
    return this.props.whatsapp;
  }
  get email(): string | undefined {
    return this.props.email;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
}
