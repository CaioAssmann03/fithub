import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../../shared/guards/jwt-auth.guard';
import { Roles, CurrentUser } from '../../../shared/decorators/auth.decorators';
import { AccessTokenPayload } from '../../../infra/security/token.service';
import { CreateStudentUseCase } from '../application/use-cases/create-student.use-case';
import { UpdateStudentUseCase } from '../application/use-cases/update-student.use-case';
import { ChangeStudentStatusUseCase } from '../application/use-cases/change-student-status.use-case';
import { ListStudentsUseCase } from '../application/use-cases/list-students.use-case';
import { EnableStudentAccessUseCase } from '../application/use-cases/enable-student-access.use-case';
import { CreateStudentDto, UpdateStudentDto, EnableStudentAccessDto } from '../application/dtos/student.dtos';
import { StudentStatus } from '../domain/value-objects/student.value-objects';
import { Student } from '../domain/entities/student.entity';

/**
 * Toda rota valida role e tenant na mesma passada (seção 14 do
 * ARCHITECTURE.md): @Roles('PERSONAL_TRAINER') + tenantId vem do JWT via
 * @CurrentUser(), nunca do body/params — um personal não escolhe em qual
 * tenant está operando, o token já diz.
 */
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PERSONAL_TRAINER')
export class StudentsController {
  constructor(
    private readonly createStudent: CreateStudentUseCase,
    private readonly updateStudent: UpdateStudentUseCase,
    private readonly changeStatus: ChangeStudentStatusUseCase,
    private readonly listStudents: ListStudentsUseCase,
    private readonly enableStudentAccess: EnableStudentAccessUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateStudentDto, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.createStudent.execute({
      tenantId: user.tenantId!,
      ...dto,
      birthDate: new Date(dto.birthDate),
    });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value;
  }

  @Get()
  async list(
    @CurrentUser() user: AccessTokenPayload,
    @Query('status') status?: StudentStatus,
    @Query('search') search?: string,
  ) {
    const result = await this.listStudents.execute(user.tenantId!, { status, search });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value.map(toResponse);
  }

  @Get(':id')
  async getById(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.listStudents.getById(id, user.tenantId!);
    if (result.isFailure) throw new NotFoundException(result.error.message);
    return toResponse(result.value);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateStudentDto, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.updateStudent.execute({ studentId: id, tenantId: user.tenantId!, ...dto });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { success: true };
  }

  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.changeStatus.execute(id, user.tenantId!, 'DEACTIVATE');
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { success: true };
  }

  @Patch(':id/reactivate')
  async reactivate(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.changeStatus.execute(id, user.tenantId!, 'REACTIVATE');
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { success: true };
  }

  /**
   * Habilita o Painel do Aluno (ARCHITECTURE.md, seção 12): cria um User
   * com role STUDENT e vincula ao Student existente. O personal define
   * e-mail/senha diretamente (sem envio de e-mail — não há provedor
   * integrado ainda, ver ARCHITECTURE.md seção 5) e repassa pro aluno.
   */
  @Post(':id/enable-access')
  async enableAccess(
    @Param('id') id: string,
    @Body() dto: EnableStudentAccessDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    const result = await this.enableStudentAccess.execute({ studentId: id, tenantId: user.tenantId!, ...dto });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value;
  }

  /**
   * DELETE mapeado pra soft-delete (deactivate), não DROP físico do
   * registro — histórico de avaliação/treino de um aluno não deveria
   * desaparecer por engano. Hard-delete de verdade (ex: direito ao
   * esquecimento, LGPD) merece um fluxo próprio, auditado, não um DELETE
   * HTTP comum sem confirmação extra.
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.changeStatus.execute(id, user.tenantId!, 'DEACTIVATE');
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { success: true };
  }
}

/**
 * CORREÇÃO (descoberta construindo apps/web contra a API real): a
 * resposta só trazia id/name/status/goal — faltava tudo que uma tela de
 * detalhe/edição de aluno precisa (nascimento, altura, contato, notas,
 * se já tem acesso ao app), mesmo esses dados já estando disponíveis via
 * getter na entidade desde a Etapa 2/5b. Enriquecido; nenhum campo novo
 * de domínio, só resposta mais completa do que já existia.
 */
function toResponse(student: Student) {
  return {
    id: student.id.toString(),
    name: student.name,
    gender: student.gender,
    birthDate: student.birthDate,
    heightCm: student.height?.value,
    goalType: student.goal?.type,
    goalDetail: student.goal?.detail,
    phone: student.phone?.toDisplay(),
    whatsapp: student.whatsapp?.toDisplay(),
    email: student.email,
    notes: student.notes,
    status: student.status,
    hasAppAccess: !!student.userId,
  };
}
