import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  StudentCreatedEvent,
  StudentDeactivatedEvent,
  StudentReactivatedEvent,
} from '../../../students/domain/events/student.events';
import { RedisService } from '../../../../infra/cache/redis.service';

/**
 * Primeiro Domain Event handler de ponta a ponta do sistema — fecha o
 * ciclo desenhado desde a Etapa 1 (seção 10): entidade emite evento →
 * DomainEventPublisherService publica via EventEmitter2 (Etapa 5a) →
 * handler reage → Redis atualiza. `@OnEvent` usa o nome da classe do
 * evento porque é assim que `DomainEventPublisherService.publish()` emite
 * (`this.emitter.emit(event.constructor.name, event)`).
 */
@Injectable()
export class StudentDashboardStatsHandler {
  constructor(private readonly redis: RedisService) {}

  @OnEvent(StudentCreatedEvent.name)
  async onStudentCreated(event: StudentCreatedEvent) {
    if (!event.tenantId) return;
    await this.redis.client.incr(this.key(event.tenantId));
  }

  @OnEvent(StudentDeactivatedEvent.name)
  async onStudentDeactivated(event: StudentDeactivatedEvent) {
    if (!event.tenantId) return;
    await this.redis.client.decr(this.key(event.tenantId));
  }

  @OnEvent(StudentReactivatedEvent.name)
  async onStudentReactivated(event: StudentReactivatedEvent) {
    if (!event.tenantId) return;
    await this.redis.client.incr(this.key(event.tenantId));
  }

  private key(tenantId: string): string {
    return `tenant:${tenantId}:dashboard:activeStudentCount`;
  }
}
