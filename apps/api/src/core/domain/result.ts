export class DomainError {
  constructor(
    public readonly message: string,
    public readonly code: string = 'DOMAIN_ERROR',
  ) {}
}

/**
 * Erros de negócio esperados (ex: "aluno já está inativo") retornam
 * Result, não lançam exception. Exception fica reservada para o
 * inesperado — falha de infra, bug. Ver seção 8 do ARCHITECTURE.md.
 */
export class Result<T, E = DomainError> {
  private constructor(
    public readonly isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  static ok<T, E = DomainError>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  static fail<T, E = DomainError>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  get isFailure(): boolean {
    return !this.isSuccess;
  }

  get value(): T {
    if (!this.isSuccess) {
      throw new Error('Não é possível ler o valor de um Result com falha. Verifique isSuccess antes.');
    }
    return this._value as T;
  }

  get error(): E {
    return this._error as E;
  }
}
