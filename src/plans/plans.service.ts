import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly plansRepository: Repository<Plan>,
  ) {}

  async list() {
    const plans = await this.plansRepository.find({
      relations: { planPrices: true },
      order: { name: 'ASC', planPrices: { createdAt: 'ASC' } },
    });

    return plans.map((plan) => ({
      id: plan.planId,
      name: plan.name,
      description: plan.description,
      status: plan.status,
      prices: plan.planPrices.map((price) => ({
        id: price.planPriceId,
        period: price.period,
        price: price.price,
        isActive: price.isActive,
      })),
    }));
  }
}
