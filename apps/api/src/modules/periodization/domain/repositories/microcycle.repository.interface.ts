import { Microcycle } from '../entities/microcycle.entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

export interface IMicrocycleRepository {
  findAllByStudent(studentId: UniqueEntityId, tenantId: TenantId): Promise<Microcycle[]>;
  save(microcycle: Microcycle): Promise<void>;
}

export const MICROCYCLE_REPOSITORY = Symbol('IMicrocycleRepository');
