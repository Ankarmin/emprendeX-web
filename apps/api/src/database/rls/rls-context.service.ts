import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class RlsContextService {
  constructor(private readonly dataSource: DataSource) {}

  async runAsUser<T>(
    userId: string,
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      await this.setUserContext(manager, userId);
      return work(manager);
    });
  }

  async setUserContext(manager: EntityManager, userId: string): Promise<void> {
    await manager.query(`SELECT set_config('app.current_user_id', $1, true)`, [
      userId,
    ]);
  }
}
