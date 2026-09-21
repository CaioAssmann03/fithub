import { CreateStudentUseCase } from './create-student.use-case';
import { IStudentRepository } from '../../domain/repositories/student.repository.interface';
import { IDomainEventPublisher } from '../../../../infra/events/domain-event-publisher.service';
import { Gender } from '../../domain/value-objects/student.value-objects';

describe('CreateStudentUseCase', () => {
  const tenantId = '11111111-1111-1111-1111-111111111111';

  function buildUseCase() {
    const students: jest.Mocked<IStudentRepository> = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAllByTenant: jest.fn(),
      existsByEmail: jest.fn().mockResolvedValue(false),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    const events: jest.Mocked<IDomainEventPublisher> = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };
    return { useCase: new CreateStudentUseCase(students, events), students, events };
  }

  it('cria um aluno e publica os domain events acumulados', async () => {
    const { useCase, students, events } = buildUseCase();

    const result = await useCase.execute({
      tenantId,
      name: 'Ana Silva',
      gender: Gender.FEMALE,
      birthDate: new Date('1995-05-10'),
    });

    expect(result.isSuccess).toBe(true);
    expect(students.save).toHaveBeenCalledTimes(1);
    expect(events.publishAll).toHaveBeenCalledTimes(1);
  });

  it('rejeita e-mail já cadastrado no tenant sem chamar save()', async () => {
    const { useCase, students } = buildUseCase();
    students.existsByEmail.mockResolvedValue(true);

    const result = await useCase.execute({
      tenantId,
      name: 'Ana Silva',
      gender: Gender.FEMALE,
      birthDate: new Date('1995-05-10'),
      email: 'ana@example.com',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('EMAIL_ALREADY_EXISTS');
    expect(students.save).not.toHaveBeenCalled();
  });

  it('propaga erro de tenantId inválido sem chamar o repositório', async () => {
    const { useCase, students } = buildUseCase();

    const result = await useCase.execute({
      tenantId: 'não-é-um-uuid',
      name: 'Ana Silva',
      gender: Gender.FEMALE,
      birthDate: new Date('1995-05-10'),
    });

    expect(result.isFailure).toBe(true);
    expect(students.existsByEmail).not.toHaveBeenCalled();
  });
});
