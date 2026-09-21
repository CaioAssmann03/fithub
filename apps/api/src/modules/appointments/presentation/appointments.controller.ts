import { Controller, Get, Post, Patch, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { ScheduleAppointmentUseCase } from '../application/use-cases/schedule-appointment.use-case';
import { CancelAppointmentUseCase } from '../application/use-cases/cancel-appointment.use-case';
import { CompleteAppointmentUseCase } from '../application/use-cases/complete-appointment.use-case';
import { ListUpcomingAppointmentsUseCase } from '../application/use-cases/list-upcoming-appointments.use-case';
import { CreateAppointmentDto } from '../application/dtos/appointment.dtos';
import { CurrentUser } from '../../../shared/decorators/auth.decorators';
import { RequestContext } from '../../../infra/prisma/tenant-context.service';
import { Appointment } from '../domain/entities/appointment.entity';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly scheduleAppointment: ScheduleAppointmentUseCase,
    private readonly cancelAppointment: CancelAppointmentUseCase,
    private readonly completeAppointment: CompleteAppointmentUseCase,
    private readonly listUpcoming: ListUpcomingAppointmentsUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: RequestContext) {
    const result = await this.scheduleAppointment.execute({
      tenantId: user.tenantId!,
      studentId: dto.studentId,
      type: dto.type,
      scheduledAt: new Date(dto.scheduledAt),
      durationMinutes: dto.durationMinutes,
      notes: dto.notes,
    });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return this.toResponse(result.value);
  }

  @Get('upcoming')
  async upcoming(@Query('hours') hours: string | undefined, @CurrentUser() user: RequestContext) {
    const withinHours = hours ? Number(hours) : 168; // 7 dias por padrão
    const result = await this.listUpcoming.execute(user.tenantId!, withinHours);
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value.map((a) => this.toResponse(a));
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @CurrentUser() user: RequestContext) {
    const result = await this.cancelAppointment.execute(id, user.tenantId!);
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { success: true };
  }

  @Patch(':id/complete')
  async complete(@Param('id') id: string, @CurrentUser() user: RequestContext) {
    const result = await this.completeAppointment.execute(id, user.tenantId!);
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { success: true };
  }

  private toResponse(appointment: Appointment) {
    return {
      id: appointment.id.toString(),
      studentId: appointment.studentId.toString(),
      type: appointment.type,
      scheduledAt: appointment.scheduledAt,
      durationMinutes: appointment.durationMinutes,
      status: appointment.status,
      notes: appointment.notes,
    };
  }
}
