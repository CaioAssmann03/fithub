import { UniqueEntityId } from '../../../../core/domain/entity';
import { Feedback } from '../entities/feedback.entity';

export interface IFeedbackRepository {
  save(feedback: Feedback): Promise<void>;
  findAllByStudent(studentId: UniqueEntityId): Promise<Feedback[]>;
}

export const FEEDBACK_REPOSITORY = Symbol('FEEDBACK_REPOSITORY');
