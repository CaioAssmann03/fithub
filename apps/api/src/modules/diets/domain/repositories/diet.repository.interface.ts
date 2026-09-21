import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { Diet } from '../entities/diet.entity';

export interface IDietRepository {
  findById(id: UniqueEntityId, tenantId: TenantId): Promise<Diet | null>;
  findAllByStudent(studentId: UniqueEntityId, tenantId: TenantId): Promise<Diet[]>;
  save(diet: Diet): Promise<void>;
}

export const DIET_REPOSITORY = Symbol('DIET_REPOSITORY');
