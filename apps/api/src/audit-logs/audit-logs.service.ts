import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuditAction } from '../database/database.enums';
import { AuditLogEntity } from './entities/audit-log.entity';

type CreateAuditLogInput = {
  actorUserId?: string | null;
  businessId?: string | null;
  action: AuditAction;
  tableName?: string | null;
  recordId?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogsRepository: Repository<AuditLogEntity>,
  ) {}

  async create(input: CreateAuditLogInput) {
    return this.auditLogsRepository.save(
      this.auditLogsRepository.create({
        actorUserId: input.actorUserId ?? null,
        businessId: input.businessId ?? null,
        action: input.action,
        tableName: input.tableName ?? null,
        recordId: input.recordId ?? null,
        oldData: input.oldData ?? null,
        newData: input.newData ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      }),
    );
  }

  async createWithManager(manager: EntityManager, input: CreateAuditLogInput) {
    const auditLogsRepository = manager.getRepository(AuditLogEntity);

    return auditLogsRepository.save(
      auditLogsRepository.create({
        actorUserId: input.actorUserId ?? null,
        businessId: input.businessId ?? null,
        action: input.action,
        tableName: input.tableName ?? null,
        recordId: input.recordId ?? null,
        oldData: input.oldData ?? null,
        newData: input.newData ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      }),
    );
  }
}
