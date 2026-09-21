import { Student } from './student.entity';
import { Gender, StudentStatus } from '../value-objects/student.value-objects';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

const TENANT_ID = TenantId.create('11111111-1111-1111-1111-111111111111').value;

describe('Student', () => {
  describe('create', () => {
    it('cria um aluno válido e emite StudentCreatedEvent', () => {
      const result = Student.create({
        tenantId: TENANT_ID,
        name: 'Ana Silva',
        gender: Gender.FEMALE,
        birthDate: new Date('1995-05-10'),
      });

      expect(result.isSuccess).toBe(true);
      const student = result.value;
      expect(student.status).toBe(StudentStatus.ACTIVE);
      expect(student.domainEvents).toHaveLength(1);
      expect(student.domainEvents[0].constructor.name).toBe('StudentCreatedEvent');
    });

    it('rejeita nome com menos de 2 caracteres', () => {
      const result = Student.create({
        tenantId: TENANT_ID,
        name: 'A',
        gender: Gender.MALE,
        birthDate: new Date('1995-05-10'),
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe('INVALID_NAME');
    });

    it('rejeita data de nascimento no futuro', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = Student.create({
        tenantId: TENANT_ID,
        name: 'Ana Silva',
        gender: Gender.FEMALE,
        birthDate: futureDate,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe('INVALID_BIRTH_DATE');
    });
  });

  describe('deactivate / reactivate', () => {
    function buildActiveStudent() {
      const student = Student.create({
        tenantId: TENANT_ID,
        name: 'Ana Silva',
        gender: Gender.FEMALE,
        birthDate: new Date('1995-05-10'),
      }).value;
      student.pullDomainEvents();
      return student;
    }

    it('desativa um aluno ativo e emite StudentDeactivatedEvent', () => {
      const student = buildActiveStudent();

      const result = student.deactivate();

      expect(result.isSuccess).toBe(true);
      expect(student.status).toBe(StudentStatus.INACTIVE);
      expect(student.domainEvents[0].constructor.name).toBe('StudentDeactivatedEvent');
    });

    it('rejeita desativar um aluno que já está inativo', () => {
      const student = buildActiveStudent();
      student.deactivate();

      const result = student.deactivate();

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe('ALREADY_INACTIVE');
    });

    it('rejeita reativar um aluno que já está ativo', () => {
      const student = buildActiveStudent();

      const result = student.reactivate();

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe('ALREADY_ACTIVE');
    });
  });

  describe('reconstitute', () => {
    it('não emite nenhum domain event — diferente de create()', () => {
      const student = Student.reconstitute(
        {
          tenantId: TENANT_ID,
          name: 'Ana Silva',
          gender: Gender.FEMALE,
          birthDate: new Date('1995-05-10'),
          status: StudentStatus.ACTIVE,
          photoIds: [],
          createdAt: new Date(),
        },
        new UniqueEntityId('22222222-2222-2222-2222-222222222222'),
      );

      expect(student.domainEvents).toHaveLength(0);
    });
  });
});
