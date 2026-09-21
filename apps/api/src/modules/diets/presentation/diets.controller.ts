import { Controller, Get, Post, Patch, Body, Param, BadRequestException } from '@nestjs/common';
import { CreateDietUseCase } from '../application/use-cases/create-diet.use-case';
import { PublishDietUseCase } from '../application/use-cases/publish-diet.use-case';
import { VersionDietUseCase } from '../application/use-cases/version-diet.use-case';
import { ListDietsUseCase } from '../application/use-cases/list-diets.use-case';
import { CreateDietDto, VersionDietDto } from '../application/dtos/diet.dtos';
import { CurrentUser } from '../../../shared/decorators/auth.decorators';
import { RequestContext } from '../../../infra/prisma/tenant-context.service';
import { Diet } from '../domain/entities/diet.entity';

@Controller()
export class DietsController {
  constructor(
    private readonly createDiet: CreateDietUseCase,
    private readonly publishDiet: PublishDietUseCase,
    private readonly versionDiet: VersionDietUseCase,
    private readonly listDiets: ListDietsUseCase,
  ) {}

  /**
   * CORREÇÃO (descoberta construindo o cliente HTTP do apps/web contra
   * este endpoint): o parâmetro chegou a ser tipado como
   * `CreateDietDto & { studentId: string }`. Tipo interseção não tem
   * representação de classe em runtime — o `design:paramtypes` que o
   * Nest usa pra decidir "isto é um DTO, valide com class-validator"
   * não reconhece uma interseção como tal, então o ValidationPipe
   * pulava a validação inteira desta rota (nenhum @IsString/@IsArray
   * rodava, e um `studentId` ausente virava um UniqueEntityId
   * aleatório — dado corrompido silencioso, não um 400 limpo).
   * `studentId` agora é campo de verdade no DTO.
   */
  @Post('diets')
  async create(@Body() dto: CreateDietDto, @CurrentUser() user: RequestContext) {
    const result = await this.createDiet.execute({ tenantId: user.tenantId!, ...dto });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return this.toResponse(result.value);
  }

  @Get('students/:studentId/diets')
  async listForStudent(@Param('studentId') studentId: string, @CurrentUser() user: RequestContext) {
    const result = await this.listDiets.execute(studentId, user.tenantId!);
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value.map((d) => this.toResponse(d));
  }

  @Patch('diets/:id/publish')
  async publish(@Param('id') id: string, @CurrentUser() user: RequestContext) {
    const result = await this.publishDiet.execute(id, user.tenantId!);
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { success: true };
  }

  @Post('diets/:id/versions')
  async version(@Param('id') id: string, @Body() dto: VersionDietDto, @CurrentUser() user: RequestContext) {
    const result = await this.versionDiet.execute(id, user.tenantId!, dto.meals);
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return this.toResponse(result.value);
  }

  private toResponse(diet: Diet) {
    return {
      id: diet.id.toString(),
      studentId: diet.studentId.toString(),
      name: diet.name,
      version: diet.version,
      status: diet.status,
      notes: diet.notes,
      meals: diet.meals.map((meal) => ({
        id: meal.id.toString(),
        name: meal.name,
        time: meal.time,
        order: meal.order,
        notes: meal.notes,
        foods: meal.foods.map((f) => ({
          id: f.id.toString(),
          foodId: f.foodId.toString(),
          quantityValue: f.quantityValue,
          quantityUnit: f.quantityUnit,
          notes: f.notes,
        })),
      })),
    };
  }
}
