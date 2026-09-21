import { Student } from '../entities/student.entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { StudentStatus } from '../value-objects/student.value-objects';

export interface StudentFilters {
  status?: StudentStatus;
  search?: string;
}

export interface IStudentRepository {
  findById(id: UniqueEntityId, tenantId: TenantId): Promise<Student | null>;
  /** Resolve o Student vinculado a um User autenticado — usado pelo FeedbackController pra nunca confiar em studentId vindo do body. */
  findByUserId(userId: UniqueEntityId, tenantId: TenantId): Promise<Student | null>;
  findAllByTenant(tenantId: TenantId, filters?: StudentFilters): Promise<Student[]>;
  existsByEmail(email: string, tenantId: TenantId): Promise<boolean>;
  save(student: Student): Promise<void>;
  delete(id: UniqueEntityId, tenantId: TenantId): Promise<void>;
}

export const STUDENT_REPOSITORY = Symbol('IStudentRepository');
