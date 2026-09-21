import { BodyMetricsCalculatorService } from './body-metrics-calculator.service';
import { Skinfolds } from '../value-objects/assessment.value-objects';
import { Measurement } from '../../../../core/domain/shared-value-objects';

describe('BodyMetricsCalculatorService', () => {
  const service = new BodyMetricsCalculatorService();

  describe('calculateBmi', () => {
    it('calcula o IMC e classifica como NORMAL na faixa esperada', () => {
      const bmi = service.calculateBmi(70, 175);

      expect(bmi.value).toBeCloseTo(22.9, 1);
      expect(bmi.classification).toBe('NORMAL');
    });

    it('classifica como OVERWEIGHT acima de 25', () => {
      const bmi = service.calculateBmi(85, 175);

      expect(bmi.classification).toBe('OVERWEIGHT');
    });

    it('classifica como UNDERWEIGHT abaixo de 18,5', () => {
      const bmi = service.calculateBmi(50, 175);

      expect(bmi.classification).toBe('UNDERWEIGHT');
    });
  });

  describe('calculateBodyFatFromSkinfolds', () => {
    const buildSkinfolds = (mm: number) => Skinfolds.create({ chest: Measurement.create(mm, 'mm').value });

    it('soma maior de dobras produz percentual de gordura maior, pra mesma idade e sexo', () => {
      const lower = service.calculateBodyFatFromSkinfolds(buildSkinfolds(20), 'MALE', 30);
      const higher = service.calculateBodyFatFromSkinfolds(buildSkinfolds(60), 'MALE', 30);

      expect(higher.value).toBeGreaterThan(lower.value);
    });

    it('fórmulas de homem e mulher dão resultados diferentes pro mesmo input', () => {
      const male = service.calculateBodyFatFromSkinfolds(buildSkinfolds(40), 'MALE', 30);
      const female = service.calculateBodyFatFromSkinfolds(buildSkinfolds(40), 'FEMALE', 30);

      expect(male.value).not.toBe(female.value);
    });

    it('resultado fica numa faixa fisiologicamente plausível pra soma moderada de dobras', () => {
      const result = service.calculateBodyFatFromSkinfolds(buildSkinfolds(45), 'MALE', 30);

      expect(result.value).toBeGreaterThan(5);
      expect(result.value).toBeLessThan(35);
    });

    it('marca o método como SKINFOLD_FORMULA', () => {
      const result = service.calculateBodyFatFromSkinfolds(buildSkinfolds(40), 'FEMALE', 25);

      expect(result.method).toBe('SKINFOLD_FORMULA');
    });
  });
});
