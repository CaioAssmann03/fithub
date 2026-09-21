import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { IStudentRepository, StudentFilters } from '../../domain/repositories/student.repository.interface';
import { Student } from '../../domain/entities/student.entity';
import { StudentMapper } from '../mappers/student.mapper';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';

@Injectable()
export class PrismaStudentRepository implements IStudentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UniqueEntityId, tenantId: TenantId): Promise<Student | null> {
    const raw = await this.prisma.currentClient.student.findFirst({
      where: { id: id.toString(), tenantId: tenantId.value },
    });
    return raw ? StudentMapper.toDomain(raw) : null;
  }

  async findByUserId(userId: UniqueEntityId, tenantId: TenantId): Promise<Student | null> {
    const raw = await this.prisma.currentClient.student.findFirst({
      where: { userId: userId.toString(), tenantId: tenantId.value },
    });
    return raw ? StudentMapper.toDomain(raw) : null;
  }

  async findAllByTenant(tenantId: TenantId, filters?: StudentFilters): Promise<Student[]> {
    const rows = await this.prisma.currentClient.student.findMany({
      where: {
        tenantId: tenantId.value,
        status: filters?.status,
        name: filters?.search ? { contains: filters.search, mode: 'insensitive' } : undefined,
      },
      orderBy: { name: 'asc' },
    });
    return rows.map(StudentMapper.toDomain);
  }

  async existsByEmail(email: string, tenantId: TenantId): Promise<boolean> {
    const count = await this.prisma.currentClient.student.count({
      where: { email, tenantId: tenantId.value },
    });
    return count > 0;
  }

  async save(student: Student): Promise<void> {
    const data = StudentMapper.toPersistence(student);
    await this.prisma.currentClient.student.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async delete(id: UniqueEntityId, tenantId: TenantId): Promise<void> {
    await this.prisma.currentClient.student.deleteMany({
      where: { id: id.toString(), tenantId: tenantId.value },
    });
  }
}
