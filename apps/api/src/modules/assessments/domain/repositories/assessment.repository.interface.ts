import { Assessment } from '../entities/assessment.entity';
import { TenantId, DateRange } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

export interface IAssessmentRepository {
  findById(id: UniqueEntityId, tenantId: TenantId): Promise<Assessment | null>;
  findByStudent(studentId: UniqueEntityId, tenantId: TenantId, range?: DateRange): Promise<Assessment[]>;
  findLatestByStudent(studentId: UniqueEntityId, tenantId: TenantId): Promise<Assessment | null>;
  save(assessment: Assessment): Promise<void>;
  delete(id: UniqueEntityId, tenantId: TenantId): Promise<void>;
}

export const ASSESSMENT_REPOSITORY = Symbol('IAssessmentRepository');
