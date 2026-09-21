import { Result } from '../../../../core/domain/result';

export class RatingScale {
  private constructor(private readonly _value: number) {}

  static create(value: number): Result<RatingScale> {
    if (value < 0 || value > 10 || !Number.isInteger(value)) {
      return Result.fail({ code: 'INVALID_RATING', message: 'Nota precisa ser um inteiro entre 0 e 10.' });
    }
    return Result.ok(new RatingScale(value));
  }

  get value(): number {
    return this._value;
  }
}
