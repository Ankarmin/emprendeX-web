# EmprendeX

Monorepo de EmprendeX gestionado con `pnpm` y `turbo`.

Actualmente el repositorio contiene:

- `apps/api`: backend principal en NestJS con PostgreSQL y TypeORM
- `apps/web`: frontend web en Next.js 16, todavia en estado base/scaffold

## Estado actual

El backend ya esta integrado en el monorepo y es la parte operativa principal del proyecto.

Capacidades backend actualmente presentes:

- autenticacion con JWT
- registro e inicio de sesion
- onboarding inicial
- catalogo
- clientes
- ventas
- finanzas
- planes
- reportes
- calendario
- healthcheck

El frontend `apps/web` todavia no representa el producto final y sigue siendo una base inicial de Next.js.

## Stack

- Node.js 18+
- pnpm 9
- Turborepo
- NestJS 11
- TypeORM
- PostgreSQL 16
- Next.js 16
- React 19

## Estructura

```text
.
|- apps/
|  |- api/
|  |  |- src/
|  |  |- test/
|  |  |- .env
|  |  |- .env.example
|  |  \- package.json
|  \- web/
|     |- app/
|     \- package.json
|- docker-compose.yaml
|- Dockerfile
|- package.json
|- pnpm-workspace.yaml
\- turbo.json
```

## Regla operativa

Todos los comandos del proyecto deben ejecutarse desde la raiz del repositorio.

No se recomienda operar entrando a `apps/api` o `apps/web` para tareas normales del dia a dia.

## Requisitos

- Node.js `>= 18`
- pnpm `9.x`
- Docker Desktop si vas a usar contenedores

## Instalacion

```bash
pnpm install
```

## Variables de entorno

Las variables del backend viven en `apps/api`.

Archivo plantilla:

```bash
apps/api/.env.example
```

Archivo local esperado:

```bash
apps/api/.env
```

Variables principales:

- `PORT`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_PUBLIC_URL`
- `DATABASE_SSL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGINS`
- `APP_PUBLIC_URL`

## Desarrollo

Levanta todos los paquetes que tengan script `dev` en el workspace:

```bash
pnpm dev
```

Levanta solo el backend:

```bash
pnpm run dev:api
```

Levanta solo el frontend web:

```bash
pnpm --filter ./apps/web dev
```

## Docker

La infraestructura Docker esta centralizada en la raiz:

- `docker-compose.yaml`
- `Dockerfile`
- `.dockerignore`

Las variables usadas por Docker para el backend se leen desde `apps/api/.env`.

Levantar API + PostgreSQL:

```bash
pnpm run docker:up
```

Levantar en segundo plano:

```bash
pnpm run docker:up:detached
```

Ver logs:

```bash
pnpm run docker:logs
```

Apagar stack:

```bash
pnpm run docker:down
```

## Scripts raiz

### Generales

```bash
pnpm dev
pnpm build
pnpm lint
pnpm check-types
pnpm format
```

### Backend

```bash
pnpm run dev:api
pnpm run start:api
pnpm run build:api
pnpm run lint:api
pnpm run check-types:api
pnpm run test:api
pnpm run test:api:ci
pnpm run test:api:e2e
```

### Docker

```bash
pnpm run docker:up
pnpm run docker:up:detached
pnpm run docker:logs
pnpm run docker:down
```

## Backend API

El backend NestJS:

- expone base path `api`
- usa versionado por URI con version por defecto `v1`
- valida DTOs con `ValidationPipe`
- configura CORS desde `CORS_ORIGINS`

Base URL local esperada:

```text
http://localhost:3000/api/v1
```

### Modulos principales

- `auth`
- `users`
- `catalog`
- `customers`
- `sales`
- `finance`
- `plans`
- `reports`
- `calendar`
- `onboarding`
- `health`

### Endpoint de health

```text
GET /api/v1/health
```

## Base de datos

- Motor: PostgreSQL 16
- Contenedor: `db`
- Puerto host por defecto: `5433`
- Puerto interno del contenedor: `5432`

Cuando usas Docker Compose, el backend se conecta a Postgres dentro de la red interna usando `db:5432`.

### Conexion desde TablePlus

Si estas levantando la base local con `pnpm run docker:up`, puedes conectarte desde TablePlus usando:

```text
postgresql://postgres:password@localhost:5433/emprendex
```

Campos equivalentes:

- Host: `localhost`
- Port: `5433`
- Database: `emprendex`
- User: `postgres`
- Password: `password`

Esto es una buena practica solo para desarrollo local. En otros entornos, usa credenciales distintas por ambiente y no compartas ni subas secretos reales al repositorio.

## Calidad y validacion

Validaciones principales del backend:

```bash
pnpm run build:api
pnpm run check-types:api
pnpm run lint:api
pnpm run test:api:e2e
```

Validaciones globales del monorepo:

```bash
pnpm build
pnpm lint
pnpm check-types
```

## Flujo recomendado

### Backend con Docker

1. Crear o revisar `apps/api/.env`
2. Ejecutar `pnpm run docker:up`
3. Probar `http://localhost:3000/api/v1/health`

### Backend sin Docker

1. Levantar una instancia de PostgreSQL accesible por `DATABASE_PUBLIC_URL`
2. Crear o revisar `apps/api/.env`
3. Ejecutar `pnpm run dev:api`

### Trabajo general en el monorepo

1. Ejecutar `pnpm install`
2. Ejecutar `pnpm dev` si quieres levantar los apps con script `dev`
3. Ejecutar comandos especificos desde raiz segun el paquete que estes tocando

## Notas

- `apps/web` ya no contiene la pantalla por defecto de Next, pero sigue siendo una base inicial y puede requerir desarrollo adicional para integrarse al backend.
- El backend es hoy la parte mas madura del repositorio.
- Si cambias dependencias del workspace, hazlo desde la raiz para mantener consistente el lockfile de `pnpm`.
