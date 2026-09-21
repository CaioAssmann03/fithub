import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import {
  IStudentRepository,
  STUDENT_REPOSITORY,
  StudentFilters,
} from '../../domain/repositories/student.repository.interface';
import { Student } from '../../domain/entities/student.entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

@Injectable()
export class ListStudentsUseCase {
  constructor(@Inject(STUDENT_REPOSITORY) private readonly students: IStudentRepository) {}

  async execute(tenantId: string, filters?: StudentFilters): Promise<Result<Student[]>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);
    return Result.ok(await this.students.findAllByTenant(tenantIdResult.value, filters));
  }

  async getById(studentId: string, tenantId: string): Promise<Result<Student>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const student = await this.students.findById(new UniqueEntityId(studentId), tenantIdResult.value);
    if (!student) return Result.fail(new DomainError('Aluno não encontrado', 'STUDENT_NOT_FOUND'));

    return Result.ok(student);
  }
}
