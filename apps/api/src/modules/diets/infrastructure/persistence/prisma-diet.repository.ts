import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { IDietRepository } from '../../domain/repositories/diet.repository.interface';
import { Diet } from '../../domain/entities/diet.entity';
import { DietMapper } from '../mappers/diet.mapper';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';

// O campo de relação em Meal pro model MealFood chama-se "foods" (ver
// schema.prisma, model Meal) — não "mealFoods".
const DIET_INCLUDE = { meals: { include: { foods: true } } };

@Injectable()
export class PrismaDietRepository implements IDietRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UniqueEntityId, tenantId: TenantId): Promise<Diet | null> {
    const raw = await this.prisma.currentClient.diet.findFirst({
      where: { id: id.toString(), tenantId: tenantId.value },
      include: DIET_INCLUDE,
    });
    return raw ? DietMapper.toDomain(raw) : null;
  }

  async findAllByStudent(studentId: UniqueEntityId, tenantId: TenantId): Promise<Diet[]> {
    const rows = await this.prisma.currentClient.diet.findMany({
      where: { studentId: studentId.toString(), tenantId: tenantId.value },
      include: DIET_INCLUDE,
      orderBy: [{ name: 'asc' }, { version: 'desc' }],
    });
    return rows.map(DietMapper.toDomain);
  }

  /**
   * Estratégia delete+recreate pros filhos (Meal, MealFood) em vez de
   * diffing granular — mais simples, e o volume por dieta é baixo o
   * suficiente pra não doer em performance. Ordem importa: MealFood tem
   * FK pra Meal, então apaga filho antes de pai, cria pai antes de filho.
   */
  async save(diet: Diet): Promise<void> {
    const dietData = DietMapper.toPersistence(diet);
    const mealsData = DietMapper.mealsToPersistence(diet);
    const mealFoodsData = DietMapper.mealFoodsToPersistence(diet);

    // Usa `.client` (não `.currentClient`) de propósito: esta operação abre
    // sua própria transação, e $transaction() não existe num client que já
    // é ele mesmo uma transação ativa (não há suporte a transação aninhada).
    await this.prisma.client.$transaction([
      this.prisma.client.diet.upsert({ where: { id: dietData.id }, create: dietData, update: dietData }),
      this.prisma.client.mealFood.deleteMany({ where: { meal: { dietId: dietData.id } } }),
      this.prisma.client.meal.deleteMany({ where: { dietId: dietData.id } }),
      ...(mealsData.length ? [this.prisma.client.meal.createMany({ data: mealsData })] : []),
      ...(mealFoodsData.length ? [this.prisma.client.mealFood.createMany({ data: mealFoodsData })] : []),
    ]);
  }
}
