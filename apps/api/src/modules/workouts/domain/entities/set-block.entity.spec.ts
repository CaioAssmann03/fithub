import { SetBlock } from './set-block.entity';
import { Load, RepRange, SetTechnique } from '../value-objects/workout.value-objects';

function validProps(overrides: Partial<Parameters<typeof SetBlock.create>[0]> = {}) {
  return {
    order: 0,
    technique: SetTechnique.STANDARD,
    sets: 3,
    reps: RepRange.range(8, 12),
    load: Load.fixedWeight(20),
    ...overrides,
  };
}

describe('SetBlock', () => {
  it('cria um bloco válido', () => {
    const result = SetBlock.create(validProps());

    expect(result.isSuccess).toBe(true);
    expect(result.value.sets).toBe(3);
  });

  it('rejeita sets <= 0', () => {
    const result = SetBlock.create(validProps({ sets: 0 }));

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('INVALID_SETS');
  });

  it('rejeita faixa de repetições inválida (max < min)', () => {
    const result = SetBlock.create(validProps({ reps: RepRange.range(12, 8) }));

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('INVALID_REP_RANGE');
  });

  it('aceita bloco sem rest (herda o padrão do Workout pai)', () => {
    const result = SetBlock.create(validProps());

    expect(result.isSuccess).toBe(true);
    expect(result.value.rest).toBeUndefined();
  });
});
