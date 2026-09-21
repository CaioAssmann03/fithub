import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent, IDomainEventPublisher } from '../../core/domain/domain-event';

export type { IDomainEventPublisher };
export const DOMAIN_EVENT_PUBLISHER = Symbol('IDomainEventPublisher');

/**
 * Ponte entre o domínio (que só conhece a interface IDomainEventPublisher,
 * seção 10 do ARCHITECTURE.md) e o EventEmitter2 de verdade. Trocar por um
 * message broker (RabbitMQ, SQS) no futuro mexe só aqui — nenhuma entidade
 * ou Use Case muda.
 */
@Injectable()
export class DomainEventPublisherService implements IDomainEventPublisher {
  constructor(private readonly emitter: EventEmitter2) {}

  publish(event: DomainEvent): void {
    this.emitter.emit(event.constructor.name, event);
  }

  publishAll(events: DomainEvent[]): void {
    events.forEach((event) => this.publish(event));
  }
}
