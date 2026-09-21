import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import {
  IAssessmentRepository,
  ASSESSMENT_REPOSITORY,
} from '../../domain/repositories/assessment.repository.interface';
import { Assessment } from '../../domain/entities/assessment.entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

@Injectable()
export class ListAssessmentsUseCase {
  constructor(@Inject(ASSESSMENT_REPOSITORY) private readonly assessments: IAssessmentRepository) {}

  /** Histórico completo do aluno, mais recente primeiro — a query que alimenta o gráfico de Evolução. */
  async byStudent(studentId: string, tenantId: string): Promise<Result<Assessment[]>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const list = await this.assessments.findByStudent(new UniqueEntityId(studentId), tenantIdResult.value);
    return Result.ok(list);
  }

  async latest(studentId: string, tenantId: string): Promise<Result<Assessment>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const assessment = await this.assessments.findLatestByStudent(new UniqueEntityId(studentId), tenantIdResult.value);
    if (!assessment) return Result.fail(new DomainError('Nenhuma avaliação encontrada', 'NO_ASSESSMENTS'));

    return Result.ok(assessment);
  }
}
