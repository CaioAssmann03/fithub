import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { IFeedbackRepository } from '../../domain/repositories/feedback.repository.interface';
import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackMapper } from '../mappers/feedback.mapper';
import { UniqueEntityId } from '../../../../core/domain/entity';

@Injectable()
export class PrismaFeedbackRepository implements IFeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(feedback: Feedback): Promise<void> {
    const data = FeedbackMapper.toPersistence(feedback);
    await this.prisma.client.feedback.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findAllByStudent(studentId: UniqueEntityId): Promise<Feedback[]> {
    const rows = await this.prisma.client.feedback.findMany({
      where: { studentId: studentId.toString() },
      orderBy: { submittedAt: 'desc' },
    });
    return rows.map(FeedbackMapper.toDomain);
  }
}
