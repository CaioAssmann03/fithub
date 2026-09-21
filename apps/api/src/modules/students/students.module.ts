import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StudentsController } from './presentation/students.controller';
import { CreateStudentUseCase } from './application/use-cases/create-student.use-case';
import { UpdateStudentUseCase } from './application/use-cases/update-student.use-case';
import { ChangeStudentStatusUseCase } from './application/use-cases/change-student-status.use-case';
import { ListStudentsUseCase } from './application/use-cases/list-students.use-case';
import { EnableStudentAccessUseCase } from './application/use-cases/enable-student-access.use-case';
import { PrismaStudentRepository } from './infrastructure/persistence/prisma-student.repository';
import { STUDENT_REPOSITORY } from './domain/repositories/student.repository.interface';
import { PrismaUserRepository } from '../auth/infrastructure/persistence/prisma-user.repository';
import { USER_REPOSITORY } from '../auth/domain/repositories/user.repository.interface';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TenantContextService } from '../../infra/prisma/tenant-context.service';
import { TransactionContextService } from '../../infra/prisma/transaction-context.service';
import { PrismaUnitOfWork } from '../../infra/prisma/prisma-unit-of-work';
import { UNIT_OF_WORK } from '../../core/domain/unit-of-work.interface';
import {
  DomainEventPublisherService,
  DOMAIN_EVENT_PUBLISHER,
} from '../../infra/events/domain-event-publisher.service';
import { TokenService } from '../../infra/security/token.service';
import { PasswordHasherService } from '../../infra/security/password-hasher.service';

/**
 * Mesma nota do AuthModule (BACKEND-AUTH.md, seção 6): PrismaService,
 * TenantContextService e TransactionContextService repetidos aqui só
 * porque cada sub-etapa ainda é standalone — migram pra um InfraModule
 * global quando o AppModule fechar a fiação completa (Etapa 5 final).
 */
@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [StudentsController],
  providers: [
    CreateStudentUseCase,
    UpdateStudentUseCase,
    ChangeStudentStatusUseCase,
    ListStudentsUseCase,
    EnableStudentAccessUseCase,
    PrismaService,
    TenantContextService,
    TransactionContextService,
    TokenService,
    PasswordHasherService,
    { provide: STUDENT_REPOSITORY, useClass: PrismaStudentRepository },
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository }, // cross-module — ver nota em enable-student-access.use-case.ts
    { provide: UNIT_OF_WORK, useClass: PrismaUnitOfWork },
    { provide: DOMAIN_EVENT_PUBLISHER, useClass: DomainEventPublisherService },
  ],
})
export class StudentsModule {}
