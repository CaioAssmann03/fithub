import { ValueObject } from './value-object';
import { Result, DomainError } from './result';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class TenantId extends ValueObject<{ value: string }> {
  private constructor(props: { value: string }) {
    super(props);
  }

  static create(value: string): Result<TenantId> {
    if (!value || !UUID_REGEX.test(value)) {
      return Result.fail(new DomainError('tenantId inválido', 'INVALID_TENANT_ID'));
    }
    return Result.ok(new TenantId({ value }));
  }

  get value(): string {
    return this.props.value;
  }
}

export type MeasurementUnit = 'kg' | 'cm' | 'mm' | 'l' | 'ml' | 'percent' | 'seconds' | 'minutes' | 'years';

export class Measurement extends ValueObject<{ value: number; unit: MeasurementUnit }> {
  private constructor(props: { value: number; unit: MeasurementUnit }) {
    super(props);
  }

  static create(value: number, unit: MeasurementUnit): Result<Measurement> {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return Result.fail(new DomainError('Medida inválida', 'INVALID_MEASUREMENT'));
    }
    if (value < 0) {
      return Result.fail(new DomainError('Medida não pode ser negativa', 'NEGATIVE_MEASUREMENT'));
    }
    return Result.ok(new Measurement({ value, unit }));
  }

  get value(): number {
    return this.props.value;
  }

  get unit(): MeasurementUnit {
    return this.props.unit;
  }
}

export class DateRange extends ValueObject<{ from: Date; to: Date }> {
  private constructor(props: { from: Date; to: Date }) {
    super(props);
  }

  static create(from: Date, to: Date): Result<DateRange> {
    if (from > to) {
      return Result.fail(new DomainError('Data inicial não pode ser depois da final', 'INVALID_DATE_RANGE'));
    }
    return Result.ok(new DateRange({ from, to }));
  }

  get from(): Date {
    return this.props.from;
  }
  get to(): Date {
    return this.props.to;
  }

  contains(date: Date): boolean {
    return date >= this.props.from && date <= this.props.to;
  }
}

export class Email extends ValueObject<{ value: string }> {
  private constructor(props: { value: string }) {
    super(props);
  }

  static create(raw: string): Result<Email> {
    const normalized = raw?.trim().toLowerCase();
    if (!normalized || !EMAIL_REGEX.test(normalized)) {
      return Result.fail(new DomainError('E-mail inválido', 'INVALID_EMAIL'));
    }
    return Result.ok(new Email({ value: normalized }));
  }

  get value(): string {
    return this.props.value;
  }
}

export class PhoneNumber extends ValueObject<{ value: string }> {
  private constructor(props: { value: string }) {
    super(props);
  }

  static create(raw: string): Result<PhoneNumber> {
    const digits = (raw ?? '').replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) {
      return Result.fail(new DomainError('Telefone inválido', 'INVALID_PHONE'));
    }
    return Result.ok(new PhoneNumber({ value: digits }));
  }

  get value(): string {
    return this.props.value;
  }

  /** Formato de exibição: (XX) XXXXX-XXXX */
  toDisplay(): string {
    const d = this.props.value;
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return d;
  }
}
