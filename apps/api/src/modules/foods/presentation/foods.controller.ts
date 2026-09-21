import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { CreateFoodUseCase } from '../application/use-cases/create-food.use-case';
import { ListFoodsUseCase } from '../application/use-cases/list-foods.use-case';
import { CreateFoodDto } from '../application/dtos/food.dtos';
import { CurrentUser } from '../../../shared/decorators/auth.decorators';
import { RequestContext } from '../../../infra/prisma/tenant-context.service';
import { Food } from '../domain/entities/food.entity';

@Controller('foods')
export class FoodsController {
  constructor(
    private readonly createFood: CreateFoodUseCase,
    private readonly listFoods: ListFoodsUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateFoodDto, @CurrentUser() user: RequestContext) {
    const tenantId = user.role === 'PLATFORM_ADMIN' ? null : user.tenantId;
    const result = await this.createFood.execute({ ...dto, tenantId });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return this.toResponse(result.value);
  }

  @Get()
  async list() {
    const foods = await this.listFoods.execute();
    return foods.map((f) => this.toResponse(f));
  }

  private toResponse(food: Food) {
    return {
      id: food.id.toString(),
      name: food.name,
      caloriesPer100g: food.caloriesPer100g,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
      isGlobal: food.isGlobal,
    };
  }
}
