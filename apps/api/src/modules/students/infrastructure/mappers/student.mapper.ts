import { Student as PrismaStudent } from '@prisma/client';
import { Student } from '../../domain/entities/student.entity';
import { Gender, StudentStatus, StudentGoal, StudentGoalType } from '../../domain/value-objects/student.value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId, Measurement, PhoneNumber } from '../../../../core/domain/shared-value-objects';

export class StudentMapper {
  static toDomain(raw: PrismaStudent): Student {
    const tenantId = TenantId.create(raw.tenantId).value;
    const height = raw.heightCm ? Measurement.create(Number(raw.heightCm), 'cm').value : undefined;
    const goal = raw.goalType
      ? StudentGoal.create(raw.goalType as unknown as StudentGoalType, raw.goalDetail ?? undefined)
      : undefined;
    const phone = raw.phone ? PhoneNumber.create(raw.phone).value : undefined;
    const whatsapp = raw.whatsapp ? PhoneNumber.create(raw.whatsapp).value : undefined;

    return Student.reconstitute(
      {
        tenantId,
        name: raw.name,
        gender: raw.gender as unknown as Gender,
        birthDate: raw.birthDate,
        height,
        goal,
        phone,
        whatsapp,
        email: raw.email ?? undefined,
        notes: raw.notes ?? undefined,
        status: raw.status as unknown as StudentStatus,
        userId: raw.userId ? new UniqueEntityId(raw.userId) : undefined,
        photoIds: [], // fotos vêm de StudentPhoto (tabela própria) — carregadas à parte quando necessário
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPersistence(student: Student) {
    return {
      id: student.id.toString(),
      tenantId: student.tenantId.value,
      userId: student.userId?.toString() ?? null,
      name: student.name,
      gender: student.gender,
      birthDate: student.birthDate,
      heightCm: student.height?.value ?? null,
      goalType: student.goal?.type ?? null,
      goalDetail: student.goal?.detail ?? null,
      phone: student.phone?.value ?? null,
      whatsapp: student.whatsapp?.value ?? null,
      email: student.email ?? null,
      notes: student.notes ?? null,
      status: student.status,
    };
  }
}
