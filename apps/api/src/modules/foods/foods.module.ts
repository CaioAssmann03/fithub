import { Module } from '@nestjs/common';
import { FoodsController } from './presentation/foods.controller';
import { CreateFoodUseCase } from './application/use-cases/create-food.use-case';
import { ListFoodsUseCase } from './application/use-cases/list-foods.use-case';
import { FOOD_REPOSITORY } from './domain/repositories/food.repository.interface';
import { PrismaFoodRepository } from './infrastructure/persistence/prisma-food.repository';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TenantContextService } from '../../infra/prisma/tenant-context.service';
import { TransactionContextService } from '../../infra/prisma/transaction-context.service';

@Module({
  controllers: [FoodsController],
  providers: [
    CreateFoodUseCase,
    ListFoodsUseCase,
    { provide: FOOD_REPOSITORY, useClass: PrismaFoodRepository },
    PrismaService,
    TenantContextService,
    TransactionContextService,
  ],
})
export class FoodsModule {}
