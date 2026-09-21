import { Inject, Injectable } from '@nestjs/common';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { IFeedbackRepository, FEEDBACK_REPOSITORY } from '../../domain/repositories/feedback.repository.interface';
import { Feedback } from '../../domain/entities/feedback.entity';

@Injectable()
export class ListStudentFeedbackUseCase {
  constructor(@Inject(FEEDBACK_REPOSITORY) private readonly feedbacks: IFeedbackRepository) {}

  async execute(studentId: string): Promise<Feedback[]> {
    return this.feedbacks.findAllByStudent(new UniqueEntityId(studentId));
  }
}
