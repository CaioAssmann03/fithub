export enum WorkoutStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum LoadType {
  FIXED_WEIGHT = 'FIXED_WEIGHT',
  BODYWEIGHT = 'BODYWEIGHT',
  PERCENTAGE_1RM = 'PERCENTAGE_1RM',
}

/**
 * Técnica de série que o personal prescreve dentro de um exercício — ex:
 * "Remada baixa (FS) + 3x8~10 + 1x6~8" são DOIS SetBlock, o primeiro
 * FEEDER_SET e o segundo (a série de trabalho seguinte) STANDARD. Enum
 * fechado + OTHER como válvula de escape, mesmo padrão de StudentGoalType.
 * REST_PAUSE não ganha subestrutura própria pra sequência "10+5+5" — vive
 * como texto livre em SetBlock.notes (mesmo raciocínio de
 * circumferences/skinfolds como JSON no DDD-MODEL.md: lido inteiro).
 */
export enum SetTechnique {
  STANDARD = 'STANDARD',
  FEEDER_SET = 'FEEDER_SET',
  WORKING_SET = 'WORKING_SET',
  TOP_SET = 'TOP_SET',
  BACK_OFF_SET = 'BACK_OFF_SET',
  DROP_SET = 'DROP_SET',
  REST_PAUSE = 'REST_PAUSE',
  OTHER = 'OTHER',
}

export class Load {
  private constructor(
    public readonly type: LoadType,
    public readonly value?: number,
  ) {}

  static fixedWeight(kg: number): Load {
    return new Load(LoadType.FIXED_WEIGHT, kg);
  }
  static bodyweight(): Load {
    return new Load(LoadType.BODYWEIGHT);
  }
  static percentageOf1RM(percent: number): Load {
    return new Load(LoadType.PERCENTAGE_1RM, percent);
  }
}

/** Cobre tanto "12 repetições fixas" quanto "faixa de 8 a 12". */
export class RepRange {
  private constructor(
    public readonly min: number,
    public readonly max: number,
  ) {}

  static fixed(reps: number): RepRange {
    return new RepRange(reps, reps);
  }
  static range(min: number, max: number): RepRange {
    return new RepRange(min, max);
  }

  toString(): string {
    return this.min === this.max ? `${this.min}` : `${this.min}-${this.max}`;
  }
}

/**
 * Substitui o antigo RestPeriod (valor único) — unifica com o requisito
 * de faixa no nível do treino inteiro ("Intervalo de 90 a 180seg").
 * `.fixed(n)` cobre o caso de valor único, que era tudo que RestPeriod
 * fazia antes.
 */
export class RestRange {
  private constructor(
    public readonly min: number,
    public readonly max: number,
  ) {}

  static fixed(seconds: number): RestRange {
    return new RestRange(seconds, seconds);
  }
  static range(min: number, max: number): RestRange {
    return new RestRange(min, max);
  }
}

/**
 * Frequência semanal de um exercício (ex: "Cardio 4~5x na semana") —
 * coexiste com SetBlock, não o substitui: "Abdominal 5x12~15 3x na
 * semana" tem sets/reps E frequência semanal ao mesmo tempo.
 */
export class WeeklyFrequency {
  private constructor(
    public readonly min: number,
    public readonly max: number,
  ) {}

  static fixed(times: number): WeeklyFrequency {
    return new WeeklyFrequency(times, times);
  }
  static range(min: number, max: number): WeeklyFrequency {
    return new WeeklyFrequency(min, max);
  }
}
