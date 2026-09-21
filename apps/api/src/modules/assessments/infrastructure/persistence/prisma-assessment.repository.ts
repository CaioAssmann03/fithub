import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { IAssessmentRepository } from '../../domain/repositories/assessment.repository.interface';
import { Assessment } from '../../domain/entities/assessment.entity';
import { AssessmentMapper } from '../mappers/assessment.mapper';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId, DateRange } from '../../../../core/domain/shared-value-objects';

@Injectable()
export class PrismaAssessmentRepository implements IAssessmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UniqueEntityId, tenantId: TenantId): Promise<Assessment | null> {
    const raw = await this.prisma.currentClient.assessment.findFirst({
      where: { id: id.toString(), tenantId: tenantId.value },
    });
    return raw ? AssessmentMapper.toDomain(raw) : null;
  }

  async findByStudent(studentId: UniqueEntityId, tenantId: TenantId, range?: DateRange): Promise<Assessment[]> {
    const rows = await this.prisma.currentClient.assessment.findMany({
      where: {
        studentId: studentId.toString(),
        tenantId: tenantId.value,
        assessedAt: range ? { gte: range.from, lte: range.to } : undefined,
      },
      orderBy: { assessedAt: 'desc' },
    });
    return rows.map(AssessmentMapper.toDomain);
  }

  async findLatestByStudent(studentId: UniqueEntityId, tenantId: TenantId): Promise<Assessment | null> {
    const raw = await this.prisma.currentClient.assessment.findFirst({
      where: { studentId: studentId.toString(), tenantId: tenantId.value },
      orderBy: { assessedAt: 'desc' },
    });
    return raw ? AssessmentMapper.toDomain(raw) : null;
  }

  async save(assessment: Assessment): Promise<void> {
    const data = AssessmentMapper.toPersistence(assessment);
    await this.prisma.currentClient.assessment.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async delete(id: UniqueEntityId, tenantId: TenantId): Promise<void> {
    await this.prisma.currentClient.assessment.deleteMany({
      where: { id: id.toString(), tenantId: tenantId.value },
    });
  }
}
