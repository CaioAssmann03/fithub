import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AssessmentsController } from './presentation/assessments.controller';
import { CreateAssessmentUseCase } from './application/use-cases/create-assessment.use-case';
import { ListAssessmentsUseCase } from './application/use-cases/list-assessments.use-case';
import { PrismaAssessmentRepository } from './infrastructure/persistence/prisma-assessment.repository';
import { ASSESSMENT_REPOSITORY } from './domain/repositories/assessment.repository.interface';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TenantContextService } from '../../infra/prisma/tenant-context.service';
import { TransactionContextService } from '../../infra/prisma/transaction-context.service';
import {
  DomainEventPublisherService,
  DOMAIN_EVENT_PUBLISHER,
} from '../../infra/events/domain-event-publisher.service';
import { TokenService } from '../../infra/security/token.service';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [AssessmentsController],
  providers: [
    CreateAssessmentUseCase,
    ListAssessmentsUseCase,
    PrismaService,
    TenantContextService,
    TransactionContextService,
    TokenService,
    { provide: ASSESSMENT_REPOSITORY, useClass: PrismaAssessmentRepository },
    { provide: DOMAIN_EVENT_PUBLISHER, useClass: DomainEventPublisherService },
  ],
})
export class AssessmentsModule {}
