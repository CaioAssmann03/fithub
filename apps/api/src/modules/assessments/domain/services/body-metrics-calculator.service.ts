import { Skinfolds, BodyFatPercentage, BodyFatMethod, Bmi } from '../value-objects/assessment.value-objects';

/**
 * Domain Service: cálculo que envolve múltiplos Value Objects e não
 * pertence naturalmente a nenhum sozinho. Zero dependência de
 * infraestrutura — função pura, testável sem mock, sem banco.
 *
 * Fórmula de Jackson & Pollock (3 dobras) + equação de Siri, o protocolo
 * mais comum na prática de personal trainers. Coeficientes conferidos
 * contra a publicação original (Jackson & Pollock, 1978; Jackson, Pollock
 * & Ward, 1980) antes de escrever este arquivo. Ainda assim: antes de ir
 * pra produção vale revisão por um profissional de Educação Física, e o
 * personal deveria poder escolher o protocolo (3 ou 7 dobras) nas
 * configurações — 7 dobras é mais preciso. Toda estimativa por dobras
 * cutâneas carrega margem de erro inerente (~3-4% segundo a literatura);
 * não é medição de precisão clínica, é estimativa de campo.
 */
export class BodyMetricsCalculatorService {
  calculateBmi(weightKg: number, heightCm: number): Bmi {
    return Bmi.fromWeightAndHeight(weightKg, heightCm);
  }

  /**
   * `biologicalSexForFormula` é deliberadamente mais estreito que o Gender
   * do Student: a fórmula só tem coeficientes validados para dois grupos,
   * por distribuição de gordura corporal. Para aluno com Gender.OTHER,
   * cabe ao personal escolher qual conjunto de coeficientes usar melhor
   * reflete o aluno, ou preferir BodyFatMethod.BIOIMPEDANCE em vez de
   * dobras cutâneas.
   */
  calculateBodyFatFromSkinfolds(
    skinfolds: Skinfolds,
    biologicalSexForFormula: 'MALE' | 'FEMALE',
    ageYears: number,
  ): BodyFatPercentage {
    const sum = skinfolds.sumOfPoints();

    // Densidade corporal (Db). Sítios: homens = peitoral+abdômen+coxa;
    // mulheres = tríceps+supra-ilíaca+coxa.
    const bodyDensity =
      biologicalSexForFormula === 'FEMALE'
        ? 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * ageYears
        : 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * ageYears;

    // Equação de Siri (1961): converte densidade corporal em % de gordura.
    const bodyFatPercent = Number((495 / bodyDensity - 450).toFixed(1));

    return BodyFatPercentage.create(bodyFatPercent, BodyFatMethod.SKINFOLD_FORMULA);
  }
}
