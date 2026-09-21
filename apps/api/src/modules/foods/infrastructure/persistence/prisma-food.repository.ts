import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { IFoodRepository } from '../../domain/repositories/food.repository.interface';
import { Food } from '../../domain/entities/food.entity';
import { FoodMapper } from '../mappers/food.mapper';
import { UniqueEntityId } from '../../../../core/domain/entity';

@Injectable()
export class PrismaFoodRepository implements IFoodRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UniqueEntityId): Promise<Food | null> {
    const raw = await this.prisma.client.food.findUnique({ where: { id: id.toString() } });
    return raw ? FoodMapper.toDomain(raw) : null;
  }

  async findAllVisibleToTenant(): Promise<Food[]> {
    const rows = await this.prisma.client.food.findMany({ orderBy: { name: 'asc' } });
    return rows.map(FoodMapper.toDomain);
  }

  async save(food: Food): Promise<void> {
    const data = FoodMapper.toPersistence(food);
    await this.prisma.client.food.upsert({ where: { id: data.id }, create: data, update: data });
  }
}
