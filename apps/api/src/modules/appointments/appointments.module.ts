import { Module } from '@nestjs/common';
import { AppointmentsController } from './presentation/appointments.controller';
import { ScheduleAppointmentUseCase } from './application/use-cases/schedule-appointment.use-case';
import { CancelAppointmentUseCase } from './application/use-cases/cancel-appointment.use-case';
import { CompleteAppointmentUseCase } from './application/use-cases/complete-appointment.use-case';
import { ListUpcomingAppointmentsUseCase } from './application/use-cases/list-upcoming-appointments.use-case';
import { APPOINTMENT_REPOSITORY } from './domain/repositories/appointment.repository.interface';
import { PrismaAppointmentRepository } from './infrastructure/persistence/prisma-appointment.repository';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TenantContextService } from '../../infra/prisma/tenant-context.service';
import { TransactionContextService } from '../../infra/prisma/transaction-context.service';
import { DomainEventPublisherService, DOMAIN_EVENT_PUBLISHER } from '../../infra/events/domain-event-publisher.service';

@Module({
  controllers: [AppointmentsController],
  providers: [
    ScheduleAppointmentUseCase,
    CancelAppointmentUseCase,
    CompleteAppointmentUseCase,
    ListUpcomingAppointmentsUseCase,
    { provide: APPOINTMENT_REPOSITORY, useClass: PrismaAppointmentRepository },
    { provide: DOMAIN_EVENT_PUBLISHER, useClass: DomainEventPublisherService },
    PrismaService,
    TenantContextService,
    TransactionContextService,
  ],
})
export class AppointmentsModule {}
