/**
 * Base para todo Value Object. Igualdade por valor (todas as props),
 * imutável após criação — o oposto de Entity (entity.ts).
 */
export abstract class ValueObject<Props extends Record<string, unknown>> {
  protected readonly props: Props;

  protected constructor(props: Props) {
    this.props = Object.freeze({ ...props });
  }

  equals(other?: ValueObject<Props>): boolean {
    if (other === null || other === undefined) return false;
    if (!(other instanceof ValueObject)) return false;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
