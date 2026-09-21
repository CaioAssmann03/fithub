import { Controller, Get, Post, Body, Param, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { SubmitFeedbackUseCase } from '../application/use-cases/submit-feedback.use-case';
import { ListStudentFeedbackUseCase } from '../application/use-cases/list-student-feedback.use-case';
import { CreateFeedbackDto } from '../application/dtos/feedback.dtos';
import { CurrentUser } from '../../../shared/decorators/auth.decorators';
import { AccessTokenPayload } from '../../../infra/security/token.service';
import { Feedback } from '../domain/entities/feedback.entity';
import { STUDENT_REPOSITORY, IStudentRepository } from '../../students/domain/repositories/student.repository.interface';
import { UniqueEntityId } from '../../../core/domain/entity';
import { TenantId } from '../../../core/domain/shared-value-objects';

/**
 * NOTA (débito registrado, ver README.md): importa o repositório de
 * Students diretamente em vez de reagir a Domain Event, porque aqui
 * precisamos de uma leitura síncrona (resolver studentId a partir do
 * userId do token) antes de decidir se o request é válido — não dá pra
 * fazer isso por evento assíncrono.
 *
 * CORREÇÃO (descoberta completando o módulo Notifications — precisava do
 * fluxo de feedback funcionando de ponta a ponta pra testar
 * FeedbackSubmittedEvent): este controller tipava @CurrentUser() como
 * RequestContext (`{userId, tenantId, role, isPlatformAdmin}`), mas
 * `request.user` é sempre montado a partir de AccessTokenPayload
 * (`{sub, tenantId, role}, ver TenantContextMiddleware) — `user.userId`
 * era sempre `undefined` em runtime, então `findByUserId` buscava um
 * UniqueEntityId aleatório (UniqueEntityId gera um uuid novo quando
 * recebe undefined) e o check-in de feedback do aluno nunca encontrava o
 * Student vinculado. TypeScript não pega isso porque o decorator
 * `createParamDecorator` devolve `any`.
 */
@Controller()
export class FeedbackController {
  constructor(
    private readonly submitFeedback: SubmitFeedbackUseCase,
    private readonly listStudentFeedback: ListStudentFeedbackUseCase,
    @Inject(STUDENT_REPOSITORY) private readonly students: IStudentRepository,
  ) {}

  @Post('feedback')
  async submit(@Body() dto: CreateFeedbackDto, @CurrentUser() user: AccessTokenPayload) {
    // studentId NUNCA vem do body — só do registro Student vinculado ao userId do token.
    // Aceitar um studentId arbitrário no body permitiria um aluno submeter feedback em nome de outro.
    const tenantId = TenantId.create(user.tenantId!).value;
    const student = await this.students.findByUserId(new UniqueEntityId(user.sub), tenantId);
    if (!student) throw new NotFoundException('Nenhum aluno vinculado a este usuário.');

    const result = await this.submitFeedback.execute({
      tenantId: user.tenantId!,
      studentId: student.id.toString(),
      ...dto,
    });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return this.toResponse(result.value);
  }

  @Get('students/:studentId/feedback')
  async listForStudent(@Param('studentId') studentId: string) {
    const feedbacks = await this.listStudentFeedback.execute(studentId);
    return feedbacks.map((f) => this.toResponse(f));
  }

  private toResponse(feedback: Feedback) {
    return {
      id: feedback.id.toString(),
      studentId: feedback.studentId.toString(),
      submittedAt: feedback.submittedAt,
      generalRating: feedback.generalRating?.value,
      muscleSoreness: feedback.muscleSoreness?.value,
      difficulty: feedback.difficulty?.value,
      mood: feedback.mood?.value,
      energy: feedback.energy?.value,
      sleepQuality: feedback.sleepQuality?.value,
      waterIntakeL: feedback.waterIntakeL,
      selfReportedWeightKg: feedback.selfReportedWeightKg,
      notes: feedback.notes,
    };
  }
}
