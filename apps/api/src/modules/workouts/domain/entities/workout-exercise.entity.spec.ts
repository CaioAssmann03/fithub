import { WorkoutExercise } from './workout-exercise.entity';
import { SetBlock } from './set-block.entity';
import { Load, RepRange, SetTechnique } from '../value-objects/workout.value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

function buildBlock(order: number): SetBlock {
  return SetBlock.create({
    order,
    technique: SetTechnique.STANDARD,
    sets: 3,
    reps: RepRange.range(8, 12),
    load: Load.fixedWeight(20),
  }).value;
}

describe('WorkoutExercise', () => {
  it('nasce sem blocos de série', () => {
    const exercise = WorkoutExercise.create({ exerciseId: new UniqueEntityId(), order: 0 }).value;

    expect(exercise.setBlocks).toHaveLength(0);
    expect(exercise.hasPrescription()).toBe(false);
  });

  describe('addSetBlock', () => {
    it('adiciona blocos com ordens diferentes', () => {
      const exercise = WorkoutExercise.create({ exerciseId: new UniqueEntityId(), order: 0 }).value;

      exercise.addSetBlock(buildBlock(0));
      const result = exercise.addSetBlock(buildBlock(1));

      expect(result.isSuccess).toBe(true);
      expect(exercise.setBlocks).toHaveLength(2);
      expect(exercise.hasPrescription()).toBe(true);
    });

    it('rejeita dois blocos na mesma posição', () => {
      const exercise = WorkoutExercise.create({ exerciseId: new UniqueEntityId(), order: 0 }).value;
      exercise.addSetBlock(buildBlock(0));

      const result = exercise.addSetBlock(buildBlock(0));

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe('DUPLICATE_BLOCK_ORDER');
    });
  });

  describe('hasPrescription', () => {
    it('é true com freeformPrescription mesmo sem blocos (cardio)', () => {
      const exercise = WorkoutExercise.create({
        exerciseId: new UniqueEntityId(),
        order: 0,
        freeformPrescription: '30min esteira 5-6km/h',
      }).value;

      expect(exercise.hasPrescription()).toBe(true);
    });

    it('é false sem blocos e sem freeformPrescription', () => {
      const exercise = WorkoutExercise.create({ exerciseId: new UniqueEntityId(), order: 0 }).value;

      expect(exercise.hasPrescription()).toBe(false);
    });
  });
});
