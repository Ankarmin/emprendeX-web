import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitializePlatformSchema20260517000000 implements MigrationInterface {
  public readonly name = 'InitializePlatformSchema20260517000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    await queryRunner.query('DROP TABLE IF EXISTS "business_modules" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "customers" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "businesses" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "subscriptions" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "plan_prices" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "plans" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "modules" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "users" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "negocios_modulos" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "clientes" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "negocios" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "subscripciones" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "precio_planes" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "planes" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "modulos" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "usuarios" CASCADE');

    await queryRunner.query(
      'DROP TYPE IF EXISTS "business_module_status_enum" CASCADE',
    );
    await queryRunner.query('DROP TYPE IF EXISTS "module_type_enum" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "plan_period_enum" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "plan_status_enum" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "user_status_enum" CASCADE');
    await queryRunner.query(
      'DROP TYPE IF EXISTS "estado_negocio_modulo_enum" CASCADE',
    );
    await queryRunner.query('DROP TYPE IF EXISTS "tipo_modulo_enum" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "periodo_plan_enum" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "estado_plan_enum" CASCADE');
    await queryRunner.query(
      'DROP TYPE IF EXISTS "estado_usuario_enum" CASCADE',
    );

    await queryRunner.query(`
      CREATE TYPE "user_status_enum" AS ENUM ('Inactive', 'Active', 'Blocked')
    `);
    await queryRunner.query(`
      CREATE TYPE "plan_status_enum" AS ENUM ('Enabled', 'Disabled')
    `);
    await queryRunner.query(`
      CREATE TYPE "plan_period_enum" AS ENUM ('Monthly', 'Yearly')
    `);
    await queryRunner.query(`
      CREATE TYPE "module_type_enum" AS ENUM ('Basic', 'Premium')
    `);
    await queryRunner.query(`
      CREATE TYPE "business_module_status_enum" AS ENUM ('Enabled', 'Blocked')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "user_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "first_names" VARCHAR(100) NOT NULL,
        "last_names" VARCHAR(100) NOT NULL,
        "password" VARCHAR(255),
        "email" VARCHAR(150) NOT NULL UNIQUE,
        "phone" VARCHAR(20) NOT NULL,
        "status" "user_status_enum" NOT NULL DEFAULT 'Active',
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "plans" (
        "plan_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) NOT NULL,
        "description" VARCHAR(100) NOT NULL,
        "status" "plan_status_enum" NOT NULL DEFAULT 'Enabled'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "plan_prices" (
        "plan_price_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "plan_id" UUID NOT NULL REFERENCES "plans"("plan_id"),
        "period" "plan_period_enum" NOT NULL,
        "status" BOOLEAN NOT NULL DEFAULT TRUE,
        "price" NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "subscription_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "plan_price_id" UUID NOT NULL REFERENCES "plan_prices"("plan_price_id"),
        "user_id" UUID NOT NULL REFERENCES "users"("user_id"),
        "start_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "end_date" TIMESTAMP NOT NULL,
        "status" BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "businesses" (
        "business_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("user_id"),
        "business_name" VARCHAR(100) NOT NULL,
        "industry" VARCHAR(100) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "customers" (
        "customer_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "business_id" UUID NOT NULL REFERENCES "businesses"("business_id"),
        "first_names" VARCHAR(100) NOT NULL,
        "last_names" VARCHAR(100),
        "email" VARCHAR(150),
        "phone" VARCHAR(20),
        "address" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "modules" (
        "module_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "module_name" VARCHAR(100) NOT NULL,
        "module_type" "module_type_enum" NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "business_modules" (
        "business_id" UUID NOT NULL REFERENCES "businesses"("business_id"),
        "module_id" UUID NOT NULL REFERENCES "modules"("module_id"),
        "status" "business_module_status_enum" NOT NULL DEFAULT 'Enabled',
        PRIMARY KEY ("business_id", "module_id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "modules" ("module_name", "module_type")
      VALUES
        ('operaciones', 'Basic'),
        ('clientes', 'Basic'),
        ('productos', 'Basic'),
        ('cotizaciones', 'Basic'),
        ('pagos', 'Basic'),
        ('reportes', 'Premium')
    `);

    await queryRunner.query(`
      INSERT INTO "plans" ("name", "description", "status")
      VALUES
        ('Basic', 'Acceso a los módulos esenciales del negocio', 'Enabled'),
        ('Premium', 'Acceso ampliado a módulos avanzados y premium', 'Enabled')
    `);

    await queryRunner.query(`
      INSERT INTO "plan_prices" ("plan_id", "period", "status", "price")
      SELECT "plan_id", 'Monthly', TRUE,
        CASE WHEN "name" = 'Basic' THEN 29.90 ELSE 79.90 END
      FROM "plans"
    `);

    await queryRunner.query(`
      INSERT INTO "plan_prices" ("plan_id", "period", "status", "price")
      SELECT "plan_id", 'Yearly', TRUE,
        CASE WHEN "name" = 'Basic' THEN 299.90 ELSE 799.90 END
      FROM "plans"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "business_modules" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "customers" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "businesses" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "subscriptions" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "plan_prices" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "plans" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "modules" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "users" CASCADE');
    await queryRunner.query(
      'DROP TYPE IF EXISTS "business_module_status_enum" CASCADE',
    );
    await queryRunner.query('DROP TYPE IF EXISTS "module_type_enum" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "plan_period_enum" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "plan_status_enum" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "user_status_enum" CASCADE');
  }
}
