import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { IAppointmentRepository } from '../../domain/repositories/appointment.repository.interface';
import { Appointment } from '../../domain/entities/appointment.entity';
import { AppointmentMapper } from '../mappers/appointment.mapper';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';

@Injectable()
export class PrismaAppointmentRepository implements IAppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UniqueEntityId, tenantId: TenantId): Promise<Appointment | null> {
    const raw = await this.prisma.currentClient.appointment.findFirst({
      where: { id: id.toString(), tenantId: tenantId.value },
    });
    return raw ? AppointmentMapper.toDomain(raw) : null;
  }

  async findUpcomingByTenant(tenantId: TenantId, withinHours: number): Promise<Appointment[]> {
    const now = new Date();
    const until = new Date(now.getTime() + withinHours * 60 * 60 * 1000);
    const rows = await this.prisma.currentClient.appointment.findMany({
      where: { tenantId: tenantId.value, status: 'SCHEDULED', scheduledAt: { gte: now, lte: until } },
      orderBy: { scheduledAt: 'asc' },
    });
    return rows.map(AppointmentMapper.toDomain);
  }

  async save(appointment: Appointment): Promise<void> {
    const data = AppointmentMapper.toPersistence(appointment);
    await this.prisma.currentClient.appointment.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}
