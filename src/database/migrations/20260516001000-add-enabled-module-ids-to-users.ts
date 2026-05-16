import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnabledModuleIdsToUsers20260516001000 implements MigrationInterface {
  public readonly name = 'AddEnabledModuleIdsToUsers20260516001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD "enabled_module_ids" text[] NOT NULL DEFAULT '{}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "enabled_module_ids"
    `);
  }
}
