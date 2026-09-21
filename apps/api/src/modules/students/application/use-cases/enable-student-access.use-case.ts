import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../domain/repositories/student.repository.interface';
import { TenantId, Email } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../core/domain/unit-of-work.interface';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/domain/repositories/user.repository.interface';
import { User } from '../../../auth/domain/entities/user.entity';
import { Role, PasswordHash } from '../../../auth/domain/value-objects/user.value-objects';
import { PasswordHasherService } from '../../../../infra/security/password-hasher.service';
import {
  IDomainEventPublisher,
  DOMAIN_EVENT_PUBLISHER,
} from '../../../../infra/events/domain-event-publisher.service';

export interface EnableStudentAccessInput {
  studentId: string;
  tenantId: string;
  email: string;
  password: string;
}

/**
 * Cross-module: injeta USER_REPOSITORY/UNIT_OF_WORK do Auth diretamente —
 * mesma exceção pragmática de STUDENT_REPOSITORY no FeedbackModule
 * (CLAUDE.md, regra 2), na direção oposta. Habilitar acesso ao app
 * (ARCHITECTURE.md, seção 12) cria um User novo (role STUDENT) E atualiza
 * o Student existente (linkToUser) — dois agregados, uma transação, igual
 * ao bootstrap circular tenant↔user do RegisterTrainerUseCase.
 *
 * Endpoint não existia até esta etapa: Student.linkToUser() já estava no
 * domínio (Etapa 2) mas nenhum Use Case/Controller o expunha — sem isso a
 * tela de check-in do aluno (apps/web) não tinha como ser testada de
 * ponta a ponta, porque nenhum aluno conseguia logar.
 */
@Injectable()
export class EnableStudentAccessUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY) private readonly students: IStudentRepository,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    private readonly hasher: PasswordHasherService,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(input: EnableStudentAccessInput): Promise<Result<{ userId: string }>> {
    const tenantIdResult = TenantId.create(input.tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);
    const tenantId = tenantIdResult.value;

    const emailResult = Email.create(input.email);
    if (emailResult.isFailure) return Result.fail(emailResult.error);

    const student = await this.students.findById(new UniqueEntityId(input.studentId), tenantId);
    if (!student) return Result.fail(new DomainError('Aluno não encontrado', 'STUDENT_NOT_FOUND'));

    if (student.userId) {
      return Result.fail(new DomainError('Aluno já possui acesso ao app', 'ALREADY_LINKED'));
    }

    const existingUser = await this.users.findByEmailInTenant(emailResult.value.value, tenantId);
    if (existingUser) {
      return Result.fail(new DomainError('Já existe um usuário com este e-mail neste tenant', 'EMAIL_ALREADY_REGISTERED'));
    }

    return this.uow.run(async () => {
      const passwordHash = PasswordHash.fromHash(await this.hasher.hash(input.password));
      const userResult = User.create({ tenantId, email: emailResult.value, passwordHash, role: Role.STUDENT });
      if (userResult.isFailure) return Result.fail(userResult.error);
      const user = userResult.value;
      await this.users.save(user);

      const linkResult = student.linkToUser(user.id);
      if (linkResult.isFailure) return Result.fail(linkResult.error);
      await this.students.save(student);

      this.events.publishAll([...user.pullDomainEvents(), ...student.pullDomainEvents()]);

      return Result.ok({ userId: user.id.toString() });
    });
  }
}
