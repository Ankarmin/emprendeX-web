import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable20260516000000 implements MigrationInterface {
  public readonly name = 'CreateUsersTable20260516000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "email" character varying(160) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "business_name" character varying(120),
        "business_category" character varying(120),
        "currency_code" character varying(10),
        "onboarding_completed" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "users"');
  }
}
