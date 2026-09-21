import { Entity, UniqueEntityId } from '../../../../core/domain/entity';
import { TenantPlan, TenantStatus } from '../value-objects/tenancy.value-objects';

export interface TenantProps {
  ownerUserId?: UniqueEntityId;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  createdAt: Date;
}

/**
 * Entity, não AggregateRoot: este módulo cobre só auto-gestão (GET
 * /tenancy/me, PUT /tenancy/profile) — leitura do próprio tenant, nunca
 * criação nem troca de plano. `TenantCreatedEvent` continua nascendo em
 * `RegisterTrainerUseCase` (Auth), que resolve o bootstrap circular
 * tenant↔user via transação direta no Prisma (ver BACKEND-AUTH.md, seção
 * 4) — reconstruir esse fluxo aqui em cima de um agregado novo estava
 * fora do escopo pedido. `TenantPlanChangedEvent` (catálogo do
 * DDD-MODEL.md) não tem nenhum Use Case que o dispare ainda; quando
 * existir uma ação de trocar plano, Tenant deveria migrar para
 * AggregateRoot nesse momento — ver docs/BACKEND-TENANCY-ADMIN-NOTIFICATIONS.md.
 */
export class Tenant extends Entity<TenantProps> {
  private constructor(props: TenantProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static reconstitute(props: TenantProps, id: UniqueEntityId): Tenant {
    return new Tenant(props, id);
  }

  get ownerUserId(): UniqueEntityId | undefined {
    return this.props.ownerUserId;
  }
  get name(): string {
    return this.props.name;
  }
  get plan(): TenantPlan {
    return this.props.plan;
  }
  get status(): TenantStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
