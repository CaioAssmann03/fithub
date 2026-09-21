import { Controller, Get, Post, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../../shared/guards/jwt-auth.guard';
import { Roles, CurrentUser } from '../../../shared/decorators/auth.decorators';
import { AccessTokenPayload } from '../../../infra/security/token.service';
import { CreateMicrocycleUseCase } from '../application/use-cases/create-microcycle.use-case';
import { ListMicrocyclesUseCase } from '../application/use-cases/list-microcycles.use-case';
import { CreateMicrocycleDto } from '../application/dtos/microcycle.dtos';
import { Microcycle } from '../domain/entities/microcycle.entity';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PERSONAL_TRAINER')
export class MicrocyclesController {
  constructor(
    private readonly createMicrocycle: CreateMicrocycleUseCase,
    private readonly listMicrocycles: ListMicrocyclesUseCase,
  ) {}

  @Post('students/:studentId/microcycles')
  async create(
    @Param('studentId') studentId: string,
    @Body() dto: CreateMicrocycleDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    const result = await this.createMicrocycle.execute({ tenantId: user.tenantId!, studentId, ...dto });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value;
  }

  @Get('students/:studentId/microcycles')
  async list(@Param('studentId') studentId: string, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.listMicrocycles.execute(studentId, user.tenantId!);
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value.map(toResponse);
  }
}

function toResponse(microcycle: Microcycle) {
  return {
    id: microcycle.id.toString(),
    studentId: microcycle.studentId.toString(),
    name: microcycle.name,
    order: microcycle.order,
    weeks: microcycle.weeks,
    notes: microcycle.notes,
  };
}
