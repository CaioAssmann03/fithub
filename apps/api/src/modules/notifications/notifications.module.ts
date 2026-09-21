import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsController } from './presentation/notifications.controller';
import { CreateNotificationUseCase } from './application/use-cases/create-notification.use-case';
import { ListNotificationsUseCase } from './application/use-cases/list-notifications.use-case';
import { MarkNotificationReadUseCase } from './application/use-cases/mark-notification-read.use-case';
import { StudentEventsHandler } from './application/event-handlers/student-events.handler';
import { WorkoutEventsHandler } from './application/event-handlers/workout-events.handler';
import { FeedbackEventsHandler } from './application/event-handlers/feedback-events.handler';
import { AppointmentEventsHandler } from './application/event-handlers/appointment-events.handler';
import { AuthEventsHandler } from './application/event-handlers/auth-events.handler';
import { PrismaNotificationRepository } from './infrastructure/persistence/prisma-notification.repository';
import { PrismaTenantOwnerRepository } from './infrastructure/persistence/prisma-tenant-owner.repository';
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository.interface';
import { TENANT_OWNER_REPOSITORY } from './domain/repositories/tenant-owner.repository.interface';
import { STUDENT_REPOSITORY } from '../students/domain/repositories/student.repository.interface';
import { PrismaStudentRepository } from '../students/infrastructure/persistence/prisma-student.repository';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TenantContextService } from '../../infra/prisma/tenant-context.service';
import { TransactionContextService } from '../../infra/prisma/transaction-context.service';
import { TokenService } from '../../infra/security/token.service';

/**
 * STUDENT_REPOSITORY é injetado aqui pelo mesmo motivo do FeedbackModule
 * (CLAUDE.md, regra 2 — exceção pragmática já documentada): dois handlers
 * (Workout, Appointment) precisam resolver studentId → userId antes de
 * decidir se existe alguém pra notificar.
 */
@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [NotificationsController],
  providers: [
    CreateNotificationUseCase,
    ListNotificationsUseCase,
    MarkNotificationReadUseCase,
    StudentEventsHandler,
    WorkoutEventsHandler,
    FeedbackEventsHandler,
    AppointmentEventsHandler,
    AuthEventsHandler,
    PrismaService,
    TenantContextService,
    TransactionContextService,
    TokenService,
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
    { provide: TENANT_OWNER_REPOSITORY, useClass: PrismaTenantOwnerRepository },
    { provide: STUDENT_REPOSITORY, useClass: PrismaStudentRepository },
  ],
})
export class NotificationsModule {}
