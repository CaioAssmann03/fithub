import { Entity, UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { NotificationChannel, NotificationStatus } from '../value-objects/notification.value-objects';

/**
 * Entity simples, não AggregateRoot — Notification é o efeito colateral de
 * outros eventos de domínio (StudentCreated, WorkoutAssigned, etc.), não
 * uma fonte própria de regra de negócio que precise emitir eventos.
 */
export interface NotificationProps {
  tenantId: TenantId;
  recipientUserId: UniqueEntityId;
  channel: NotificationChannel;
  type: string;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export class Notification extends Entity<NotificationProps> {
  private constructor(props: NotificationProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: {
    tenantId: TenantId;
    recipientUserId: UniqueEntityId;
    channel: NotificationChannel;
    type: string;
    payload?: Record<string, unknown>;
  }): Notification {
    return new Notification({
      tenantId: props.tenantId,
      recipientUserId: props.recipientUserId,
      channel: props.channel,
      type: props.type,
      payload: props.payload ?? {},
      status: NotificationStatus.PENDING,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: NotificationProps, id: UniqueEntityId): Notification {
    return new Notification(props, id);
  }

  markRead(): void {
    this.props.status = NotificationStatus.READ;
    this.props.readAt = new Date();
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }
  get recipientUserId(): UniqueEntityId {
    return this.props.recipientUserId;
  }
  get channel(): NotificationChannel {
    return this.props.channel;
  }
  get type(): string {
    return this.props.type;
  }
  get payload(): Record<string, unknown> {
    return this.props.payload;
  }
  get status(): NotificationStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
