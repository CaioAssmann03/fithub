import { Entity, UniqueEntityId } from '../../../../core/domain/entity';
import { Result } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { MuscleGroup, Equipment } from '../value-objects/exercise.value-objects';

/**
 * tenantId nulo = item do catálogo global (visível pra todo tenant, só
 * PLATFORM_ADMIN cria); tenantId preenchido = exercício customizado do
 * próprio personal. Mesmo padrão híbrido de Food (ver DDD-MODEL.md).
 */
export interface ExerciseProps {
  tenantId: TenantId | null;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment[];
  description?: string;
  videoFileId?: UniqueEntityId;
  imageFileId?: UniqueEntityId;
  tags: string[];
  createdAt: Date;
}

export class Exercise extends Entity<ExerciseProps> {
  private constructor(props: ExerciseProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: {
    tenantId: TenantId | null;
    name: string;
    muscleGroup: MuscleGroup;
    equipment?: Equipment[];
    description?: string;
    tags?: string[];
  }): Result<Exercise> {
    if (!props.name || props.name.trim().length < 2) {
      return Result.fail({ code: 'INVALID_NAME', message: 'Nome do exercício precisa ter ao menos 2 caracteres.' });
    }

    return Result.ok(
      new Exercise({
        tenantId: props.tenantId,
        name: props.name.trim(),
        muscleGroup: props.muscleGroup,
        equipment: props.equipment ?? [],
        description: props.description,
        tags: props.tags ?? [],
        createdAt: new Date(),
      }),
    );
  }

  static reconstitute(props: ExerciseProps, id: UniqueEntityId): Exercise {
    return new Exercise(props, id);
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

  get muscleGroup(): MuscleGroup {
    return this.props.muscleGroup;
  }

  get equipment(): Equipment[] {
    return this.props.equipment;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get tags(): string[] {
    return this.props.tags;
  }
}
