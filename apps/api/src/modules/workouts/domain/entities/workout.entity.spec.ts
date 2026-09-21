import { Workout } from './workout.entity';
import { WorkoutExercise } from './workout-exercise.entity';
import { SetBlock } from './set-block.entity';
import { WorkoutStatus, Load, RepRange, RestRange } from '../value-objects/workout.value-objects';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

const TENANT_ID = TenantId.create('11111111-1111-1111-1111-111111111111').value;
const STUDENT_ID = new UniqueEntityId('22222222-2222-2222-2222-222222222222');

/** Um exercício "normal", com um único bloco de série padrão. */
function buildExercise(order: number): WorkoutExercise {
  const exercise = WorkoutExercise.create({ exerciseId: new UniqueEntityId(), order }).value;
  const block = SetBlock.create({
    order: 0,
    technique: 'STANDARD' as never,
    sets: 3,
    reps: RepRange.range(8, 12),
    load: Load.fixedWeight(20),
    rest: RestRange.fixed(60),
  }).value;
  exercise.addSetBlock(block);
  return exercise;
}

/** Um exercício tipo cardio: sem bloco de série, só prescrição livre + frequência semanal. */
function buildCardioExercise(order: number): WorkoutExercise {
  return WorkoutExercise.create({
    exerciseId: new UniqueEntityId(),
    order,
    freeformPrescription: '30min esteira 5-6km/h',
  }).value;
}

describe('Workout', () => {
  it('cria um treino válido com version 1', () => {
    const result = Workout.create({ tenantId: TENANT_ID, studentId: STUDENT_ID, label: 'Treino A' });

    expect(result.isSuccess).toBe(true);
    expect(result.value.version).toBe(1);
    expect(result.value.status).toBe(WorkoutStatus.ACTIVE);
  });

  it('rejeita treino sem nome', () => {
    const result = Workout.create({ tenantId: TENANT_ID, studentId: STUDENT_ID, label: '' });

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('INVALID_LABEL');
  });

  describe('addExercise', () => {
    it('rejeita duas exercises na mesma posição', () => {
      const workout = Workout.create({ tenantId: TENANT_ID, studentId: STUDENT_ID, label: 'Treino A' }).value;
      workout.addExercise(buildExercise(0));

      const result = workout.addExercise(buildExercise(0));

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe('DUPLICATE_ORDER');
    });

    it('rejeita exercício sem nenhum bloco de série e sem prescrição livre', () => {
      const workout = Workout.create({ tenantId: TENANT_ID, studentId: STUDENT_ID, label: 'Treino A' }).value;
      const emptyExercise = WorkoutExercise.create({ exerciseId: new UniqueEntityId(), order: 0 }).value;

      const result = workout.addExercise(emptyExercise);

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe('EMPTY_PRESCRIPTION');
    });

    it('aceita exercício de cardio (sem bloco de série, só prescrição livre)', () => {
      const workout = Workout.create({ tenantId: TENANT_ID, studentId: STUDENT_ID, label: 'Treino A' }).value;

      const result = workout.addExercise(buildCardioExercise(0));

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('publish', () => {
    it('rejeita publicar treino vazio', () => {
      const workout = Workout.create({ tenantId: TENANT_ID, studentId: STUDENT_ID, label: 'Treino A' }).value;

      const result = workout.publish();

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe('EMPTY_WORKOUT');
    });

    it('publica um treino com ao menos 1 exercício e emite WorkoutAssignedEvent', () => {
      const workout = Workout.create({ tenantId: TENANT_ID, studentId: STUDENT_ID, label: 'Treino A' }).value;
      workout.addExercise(buildExercise(0));
      workout.pullDomainEvents();

      const result = workout.publish();

      expect(result.isSuccess).toBe(true);
      expect(workout.domainEvents[0].constructor.name).toBe('WorkoutAssignedEvent');
    });
  });

  describe('createNewVersion', () => {
    it('arquiva a versão atual e cria uma nova com version incrementado', () => {
      const workout = Workout.create({ tenantId: TENANT_ID, studentId: STUDENT_ID, label: 'Treino A' }).value;
      workout.addExercise(buildExercise(0));

      const result = workout.createNewVersion([buildExercise(0), buildExercise(1)]);

      expect(result.isSuccess).toBe(true);
      const newVersion = result.value;

      expect(workout.status).toBe(WorkoutStatus.ARCHIVED);
      expect(newVersion.version).toBe(2);
      expect(newVersion.status).toBe(WorkoutStatus.ACTIVE);
      expect(newVersion.previousVersionId?.equals(workout.id)).toBe(true);
      expect(newVersion.exercises).toHaveLength(2);
    });

    it('a nova versão mantém o mesmo label — não é um campo pedido em createNewVersion', () => {
      const workout = Workout.create({ tenantId: TENANT_ID, studentId: STUDENT_ID, label: 'Treino A' }).value;

      const newVersion = workout.createNewVersion([buildExercise(0)]).value;

      expect(newVersion.label).toBe('Treino A');
    });

    it('rejeita versionar um treino já arquivado', () => {
      const workout = Workout.create({ tenantId: TENANT_ID, studentId: STUDENT_ID, label: 'Treino A' }).value;
      workout.createNewVersion([buildExercise(0)]);

      const result = workout.createNewVersion([buildExercise(0)]);

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe('ALREADY_ARCHIVED');
    });

    // CORREÇÃO desta etapa: antes, os exercícios da nova versão eram
    // atribuídos direto no construtor, sem passar por addExercise() — a
    // checagem de ordem duplicada não rodava no caminho de versionamento,
    // só no de criação. Este teste trava a correção.
    it('rejeita nova versão com exercícios de ordem duplicada', () => {
      const workout = Workout.create({ tenantId: TENANT_ID, studentId: STUDENT_ID, label: 'Treino A' }).value;

      const result = workout.createNewVersion([buildExercise(0), buildExercise(0)]);

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe('DUPLICATE_ORDER');
    });

    it('a nova versão herda microcycleId/defaultRest da atual quando options é omitido', () => {
      const microcycleId = new UniqueEntityId();
      const workoutResult = Workout.create({
        tenantId: TENANT_ID,
        studentId: STUDENT_ID,
        label: 'Treino A',
        microcycleId,
        defaultRest: RestRange.range(90, 180),
      });
      const workout = workoutResult.value;

      const newVersion = workout.createNewVersion([buildExercise(0)]).value;

      expect(newVersion.microcycleId?.equals(microcycleId)).toBe(true);
      expect(newVersion.defaultRest).toEqual(RestRange.range(90, 180));
    });

    it('options sobrescreve microcycleId/defaultRest na nova versão (transição de fase)', () => {
      const workout = Workout.create({ tenantId: TENANT_ID, studentId: STUDENT_ID, label: 'Treino A' }).value;
      const deloadId = new UniqueEntityId();

      const newVersion = workout.createNewVersion([buildExercise(0)], {
        microcycleId: deloadId,
        defaultRest: RestRange.range(60, 120),
      }).value;

      expect(newVersion.microcycleId?.equals(deloadId)).toBe(true);
      expect(newVersion.defaultRest).toEqual(RestRange.range(60, 120));
    });
  });
});
