import { Entity, UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';

export interface AuditLogProps {
  tenantId?: TenantId;
  actorUserId?: UniqueEntityId;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type CreateAuditLogProps = Omit<AuditLogProps, 'createdAt'>;

/**
 * Entity simples, append-only (ver schema.prisma, model AuditLog — sem
 * updatedAt de propósito). Registra ações sensíveis de Platform Admin,
 * principalmente acesso assistido cross-tenant (ARCHITECTURE.md, seção
 * 11) — nunca é o efeito de um Domain Event de outro módulo (diferente
 * de Notification), é escrito diretamente pelo Use Case que executa a
 * ação sendo auditada.
 */
export class AuditLog extends Entity<AuditLogProps> {
  private constructor(props: AuditLogProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: CreateAuditLogProps, id?: UniqueEntityId): AuditLog {
    return new AuditLog({ ...props, createdAt: new Date() }, id);
  }

  static reconstitute(props: AuditLogProps, id: UniqueEntityId): AuditLog {
    return new AuditLog(props, id);
  }

  get tenantId(): TenantId | undefined {
    return this.props.tenantId;
  }
  get actorUserId(): UniqueEntityId | undefined {
    return this.props.actorUserId;
  }
  get action(): string {
    return this.props.action;
  }
  get targetType(): string | undefined {
    return this.props.targetType;
  }
  get targetId(): string | undefined {
    return this.props.targetId;
  }
  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
