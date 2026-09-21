import { Controller, Get, Post, Body, Param, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../../shared/guards/jwt-auth.guard';
import { Roles, CurrentUser } from '../../../shared/decorators/auth.decorators';
import { AccessTokenPayload } from '../../../infra/security/token.service';
import { CreateAssessmentUseCase } from '../application/use-cases/create-assessment.use-case';
import { ListAssessmentsUseCase } from '../application/use-cases/list-assessments.use-case';
import { CreateAssessmentDto } from '../application/dtos/assessment.dtos';
import { Assessment } from '../domain/entities/assessment.entity';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PERSONAL_TRAINER')
export class AssessmentsController {
  constructor(
    private readonly createAssessment: CreateAssessmentUseCase,
    private readonly listAssessments: ListAssessmentsUseCase,
  ) {}

  @Post('assessments')
  async create(@Body() dto: CreateAssessmentDto, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.createAssessment.execute({
      tenantId: user.tenantId!,
      ...dto,
      assessedAt: new Date(dto.assessedAt),
    });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value;
  }

  @Get('students/:studentId/assessments')
  async byStudent(@Param('studentId') studentId: string, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.listAssessments.byStudent(studentId, user.tenantId!);
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value.map(toResponse);
  }

  @Get('students/:studentId/assessments/latest')
  async latest(@Param('studentId') studentId: string, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.listAssessments.latest(studentId, user.tenantId!);
    if (result.isFailure) throw new NotFoundException(result.error.message);
    return toResponse(result.value);
  }
}

function toResponse(assessment: Assessment) {
  return {
    id: assessment.id.toString(),
    studentId: assessment.studentId.toString(),
    date: assessment.date,
    weightKg: assessment.weight.value,
    bmi: { value: assessment.bmi.value, classification: assessment.bmi.classification },
    bodyFatPercent: assessment.bodyFat?.value,
  };
}
