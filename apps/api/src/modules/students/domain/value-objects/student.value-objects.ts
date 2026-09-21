export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum StudentGoalType {
  WEIGHT_LOSS = 'WEIGHT_LOSS',
  MUSCLE_GAIN = 'MUSCLE_GAIN',
  CONDITIONING = 'CONDITIONING',
  REHABILITATION = 'REHABILITATION',
  GENERAL_HEALTH = 'GENERAL_HEALTH',
  OTHER = 'OTHER',
}

/**
 * Objetivo do aluno: categoria fechada (permite filtro/relatório no
 * Dashboard) + detalhe livre (o personal registra a nuance real).
 */
export class StudentGoal {
  private constructor(
    public readonly type: StudentGoalType,
    public readonly detail?: string,
  ) {}

  static create(type: StudentGoalType, detail?: string): StudentGoal {
    return new StudentGoal(type, detail);
  }

  toString(): string {
    return this.detail ? `${this.type}: ${this.detail}` : this.type;
  }
}
