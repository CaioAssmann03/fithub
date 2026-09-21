import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../core/domain/unit-of-work.interface';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { Role, PasswordHash } from '../../domain/value-objects/user.value-objects';
import { Email, TenantId } from '../../../../core/domain/shared-value-objects';
import { PasswordHasherService } from '../../../../infra/security/password-hasher.service';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import {
  IDomainEventPublisher,
  DOMAIN_EVENT_PUBLISHER,
} from '../../../../infra/events/domain-event-publisher.service';

export interface RegisterTrainerInput {
  email: string;
  password: string;
  tenantName: string;
}

export interface RegisterTrainerOutput {
  userId: string;
  tenantId: string;
}

/**
 * Resolve o bootstrap circular tenants↔users (DATABASE-MODEL.md, seção 4)
 * dentro de uma única transação: cria Tenant com ownerUserId nulo, cria o
 * User, e só então faz o UPDATE do Tenant. Se qualquer passo falhar, tudo
 * desfaz — é exatamente o caso de uso que motivou ter um Unit of Work de
 * verdade (Etapa 2, seção 8) em vez de Use Cases chamando repositório
 * solto.
 */
@Injectable()
export class RegisterTrainerUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly prisma: PrismaService,
    private readonly hasher: PasswordHasherService,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(input: RegisterTrainerInput): Promise<Result<RegisterTrainerOutput>> {
    const emailResult = Email.create(input.email);
    if (emailResult.isFailure) return Result.fail(emailResult.error);

    // Checagem global — ver a correção da Etapa 5 em database/schema.sql
    // (uq_users_email_trainer_admin): por-tenant não bastava, porque cada
    // trainer novo cria um tenant novo.
    const existing = await this.users.findByEmailGlobal(emailResult.value.value);
    if (existing) {
      return Result.fail(new DomainError('E-mail já cadastrado como personal', 'EMAIL_ALREADY_REGISTERED'));
    }

    return this.uow.run(async () => {
      const tenant = await this.prisma.currentClient.tenant.create({
        data: { name: input.tenantName },
      });

      const tenantId = TenantId.create(tenant.id).value;
      const passwordHash = PasswordHash.fromHash(await this.hasher.hash(input.password));

      const userResult = User.create({
        tenantId,
        email: emailResult.value,
        passwordHash,
        role: Role.PERSONAL_TRAINER,
      });
      if (userResult.isFailure) return Result.fail(userResult.error);

      const user = userResult.value;
      await this.users.save(user);

      await this.prisma.currentClient.tenant.update({
        where: { id: tenant.id },
        data: { ownerUserId: user.id.toString() },
      });

      this.events.publishAll(user.pullDomainEvents());

      return Result.ok<RegisterTrainerOutput>({ userId: user.id.toString(), tenantId: tenant.id });
    });
  }
}
