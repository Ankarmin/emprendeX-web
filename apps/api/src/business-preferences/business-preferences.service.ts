import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Business } from '../businesses/entities/business.entity';
import { BusinessPreferencesEntity } from '../businesses/entities/business-preferences.entity';
import { normalizeOptionalText } from '../common/utils/url.util';
import { AuditAction, ColorPaletteId } from '../database/database.enums';
import { RlsContextService } from '../database/rls/rls-context.service';
import { UpdateBusinessPreferencesDto } from './dto/update-business-preferences.dto';

type BusinessPreferencesResponse = {
  businessPreferenceId: string;
  businessId: string;
  colorPaletteId: ColorPaletteId;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class BusinessPreferencesService {
  constructor(
    private readonly rlsContextService: RlsContextService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getMyPreferences(userId: string): Promise<BusinessPreferencesResponse> {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const preferences = await this.getOrCreatePreferences(
        business.businessId,
        manager,
      );
      return this.mapPreferences(preferences);
    });
  }

  async updateMyPreferences(
    userId: string,
    dto: UpdateBusinessPreferencesDto,
  ): Promise<BusinessPreferencesResponse> {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const preferences = await this.getOrCreatePreferences(
        business.businessId,
        manager,
      );
      const previousData = this.mapPreferences(preferences);

      if (dto.colorPaletteId !== undefined) {
        preferences.colorPaletteId = dto.colorPaletteId;
      }

      if (dto.logoUrl !== undefined) {
        preferences.logoUrl = normalizeOptionalText(dto.logoUrl);
      }

      const savedPreferences = await manager
        .getRepository(BusinessPreferencesEntity)
        .save(preferences);

      await this.auditLogsService.createWithManager(manager, {
        actorUserId: userId,
        businessId: business.businessId,
        action: AuditAction.Update,
        tableName: 'business_preferences',
        recordId: savedPreferences.businessPreferenceId,
        oldData: previousData,
        newData: this.mapPreferences(savedPreferences),
      });

      return this.mapPreferences(savedPreferences);
    });
  }

  private async getBusinessOrThrow(
    userId: string,
    manager: EntityManager,
  ): Promise<Business> {
    const business = await manager
      .getRepository(Business)
      .findOne({ where: { userId } });

    if (!business) {
      throw new BadRequestException('Business profile is not configured');
    }

    return business;
  }

  private async getOrCreatePreferences(
    businessId: string,
    manager: EntityManager,
  ): Promise<BusinessPreferencesEntity> {
    const repository = manager.getRepository(BusinessPreferencesEntity);
    const existingPreferences = await repository.findOne({
      where: { businessId },
    });

    if (existingPreferences) {
      return existingPreferences;
    }

    return repository.save(
      repository.create({
        businessId,
        colorPaletteId: ColorPaletteId.Violet,
        logoUrl: null,
      }),
    );
  }

  private mapPreferences(
    preferences: BusinessPreferencesEntity,
  ): BusinessPreferencesResponse {
    return {
      businessPreferenceId: preferences.businessPreferenceId,
      businessId: preferences.businessId,
      colorPaletteId: preferences.colorPaletteId,
      logoUrl: preferences.logoUrl,
      createdAt: preferences.createdAt.toISOString(),
      updatedAt: preferences.updatedAt.toISOString(),
    };
  }
}
