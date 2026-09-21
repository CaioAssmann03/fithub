import { Module } from '@nestjs/common';
import { FeedbackController } from './presentation/feedback.controller';
import { SubmitFeedbackUseCase } from './application/use-cases/submit-feedback.use-case';
import { ListStudentFeedbackUseCase } from './application/use-cases/list-student-feedback.use-case';
import { FEEDBACK_REPOSITORY } from './domain/repositories/feedback.repository.interface';
import { PrismaFeedbackRepository } from './infrastructure/persistence/prisma-feedback.repository';
import { STUDENT_REPOSITORY } from '../students/domain/repositories/student.repository.interface';
import { PrismaStudentRepository } from '../students/infrastructure/persistence/prisma-student.repository';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TenantContextService } from '../../infra/prisma/tenant-context.service';
import { TransactionContextService } from '../../infra/prisma/transaction-context.service';
import {
  DomainEventPublisherService,
  DOMAIN_EVENT_PUBLISHER,
} from '../../infra/events/domain-event-publisher.service';

@Module({
  controllers: [FeedbackController],
  providers: [
    SubmitFeedbackUseCase,
    ListStudentFeedbackUseCase,
    { provide: FEEDBACK_REPOSITORY, useClass: PrismaFeedbackRepository },
    { provide: STUDENT_REPOSITORY, useClass: PrismaStudentRepository }, // cross-module — ver nota no controller
    { provide: DOMAIN_EVENT_PUBLISHER, useClass: DomainEventPublisherService },
    PrismaService,
    TenantContextService,
    TransactionContextService,
  ],
})
export class FeedbackModule {}
