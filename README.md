# EmprendeX

Guia de arranque local para trabajar con estos dos repositorios:

- `C:\Proyectos\emprendeX-web`
- `C:\Proyectos\emprendeX-mobile`

`emprendeX-web` contiene:

- `apps/api`: backend NestJS + PostgreSQL
- `apps/web`: frontend web Next.js

`emprendeX-mobile` contiene la app mobile en Expo.

## Estructura local obligatoria

Los dos repositorios deben estar en la misma carpeta padre.

```text
C:\Proyectos\
|- emprendeX-web
\- emprendeX-mobile
```

Esto es importante porque:

- `C:\Proyectos\emprendeX-web\project.code-workspace` apunta a `..\emprendeX-mobile`
- `pnpm install` en `emprendeX-web` intenta instalar dependencias del mobile vecino
- `pnpm dev` en `emprendeX-web` intenta levantar tambien `emprendeX-mobile`

## Workspace recomendado

De preferencia abre este archivo en VS Code:

```text
C:\Proyectos\emprendeX-web\project.code-workspace
```

Ese workspace abre al mismo tiempo:

- `emprendeX-web`
- `emprendeX-mobile`

Tambien deja listas tareas y configuraciones compartidas para backend y mobile.

## Requisitos

- Node.js 22 LTS recomendado
- `pnpm` `11.5.1`
- `npm` disponible para el proyecto mobile
- Docker Desktop
- Acceso al drive compartido del grupo de desarrollo
- TablePlus, DBeaver, pgAdmin o cliente equivalente para ejecutar los scripts SQL

## Flujo recomendado

Este es el flujo recomendado para levantar todo por primera vez.

1. Verifica que existan ambos repositorios en la misma carpeta padre.
2. Abre `C:\Proyectos\emprendeX-web\project.code-workspace`.
3. Desde `C:\Proyectos\emprendeX-web`, instala dependencias:

```bash
pnpm i
```

`pnpm i` en `emprendeX-web` hace dos cosas:

- instala las dependencias del monorepo `emprendeX-web`
- si existe `C:\Proyectos\emprendeX-mobile`, ejecuta tambien `npm install` dentro del mobile

4. Crea y completa los archivos de entorno:

```text
C:\Proyectos\emprendeX-web\apps\api\.env.local
C:\Proyectos\emprendeX-web\apps\web\.env.local
C:\Proyectos\emprendeX-mobile\.env.local
```

5. Levanta todo desde `C:\Proyectos\emprendeX-web`:

```bash
pnpm dev
```

6. Cuando PostgreSQL local ya este arriba, entra al drive compartido del grupo de desarrollo y ejecuta los scripts SQL en este orden exacto:

```text
1. TABLAS EMPRENDEX
2. DATOS EMPRENDEX
```

7. Verifica los servicios:

- API: `http://localhost:3000/api/v1/health`
- Web: `http://localhost:3001`
- Mobile: revisa el QR y la salida de Expo en la terminal

## Que hace `pnpm dev`

Ejecutado desde `C:\Proyectos\emprendeX-web`, `pnpm dev` levanta el stack local completo:

- levanta PostgreSQL con Docker
- levanta la API en Docker
- levanta la web en `http://localhost:3001`
- si existe `C:\Proyectos\emprendeX-mobile`, ejecuta `npm run start` en el mobile

Puertos locales esperados:

- API: `3000`
- Web: `3001`
- PostgreSQL: `5433`
- Expo / Metro: `8081`

Si alguno de esos puertos esta ocupado, `pnpm dev` no podra arrancar correctamente.

## Variables de entorno

### Backend (`emprendeX-web/apps/api`)

El backend lee `apps/api/.env.local`.

No uses `apps/api/.env`.

Usa como base:

```text
C:\Proyectos\emprendeX-web\apps\api\.env.example
```

Ejemplo local:

```env
DATABASE_TARGET=local
PORT=3000
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=emprendex
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
DATABASE_SSL=false
JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=86400
CORS_ORIGINS=http://localhost:3001,http://localhost:8081,http://localhost:19006
WEB_PUBLIC_URL=http://localhost:3001
PUBLIC_CATALOG_READ_TTL_MINUTES=1
PUBLIC_CATALOG_READ_LIMIT=60
PUBLIC_CATALOG_SUBMIT_TTL_MINUTES=10
PUBLIC_CATALOG_SUBMIT_LIMIT=5
PUBLIC_CATALOG_MAX_ITEMS=25
PUBLIC_CATALOG_MAX_ITEM_QUANTITY=100
PUBLIC_CATALOG_TURNSTILE_SECRET_KEY=
```

Variables importantes:

- `DATABASE_TARGET`
- `DATABASE_URL`
- `DATABASE_PUBLIC_URL`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_SSL`
- `PORT`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGINS`
- `WEB_PUBLIC_URL`
- `PUBLIC_CATALOG_READ_TTL_MINUTES`
- `PUBLIC_CATALOG_READ_LIMIT`
- `PUBLIC_CATALOG_SUBMIT_TTL_MINUTES`
- `PUBLIC_CATALOG_SUBMIT_LIMIT`
- `PUBLIC_CATALOG_MAX_ITEMS`
- `PUBLIC_CATALOG_MAX_ITEM_QUANTITY`

Reglas practicas:

- Para desarrollo local usa `DATABASE_TARGET=local`.
- Para Railway usa `DATABASE_TARGET=railway` y configura `DATABASE_URL` o `DATABASE_PUBLIC_URL`.
- `JWT_SECRET` es obligatorio y debe tener al menos 16 caracteres.

### Frontend web (`emprendeX-web/apps/web`)

La web usa:

```text
C:\Proyectos\emprendeX-web\apps\web\.env.local
```

Usa como base:

```text
C:\Proyectos\emprendeX-web\apps\web\.env.example
```

Ejemplo local:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
NEXT_ALLOWED_DEV_ORIGINS=
NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL=S/
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

Variable importante:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_ALLOWED_DEV_ORIGINS`
- `NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL`

### Mobile (`emprendeX-mobile`)

Para desarrollo local usa de preferencia:

```text
C:\Proyectos\emprendeX-mobile\.env.local
```

Plantillas disponibles:

```text
C:\Proyectos\emprendeX-mobile\.env.example
C:\Proyectos\emprendeX-mobile\.env.railway.example
```

La app mobile resuelve la API en este orden:

1. `EXPO_PUBLIC_API_BASE_URL`
2. `EXPO_PUBLIC_API_TARGET=railway`
3. `EXPO_PUBLIC_API_TARGET=local`
4. `EXPO_PUBLIC_API_TARGET=auto`

Ejemplo para desarrollo local contra tu API local:

```env
EXPO_PUBLIC_API_TARGET=local
EXPO_PUBLIC_API_SCHEME=http
EXPO_PUBLIC_API_HOST=tu-host-local
EXPO_PUBLIC_API_PORT=3000
EXPO_PUBLIC_API_PATH=/api/v1
EXPO_PUBLIC_API_RAILWAY_BASE_URL=https://tu-api-publica.example.com/api/v1
EXPO_PUBLIC_DEFAULT_CURRENCY_SYMBOL=S/
EXPO_PUBLIC_PASSWORD_MIN_LENGTH=8
```

Ejemplo para usar Railway:

```env
EXPO_PUBLIC_API_TARGET=railway
EXPO_PUBLIC_API_RAILWAY_BASE_URL=https://tu-api-publica.example.com/api/v1
EXPO_PUBLIC_DEFAULT_CURRENCY_SYMBOL=S/
EXPO_PUBLIC_PASSWORD_MIN_LENGTH=8
```

Notas para mobile:

- Si pruebas desde celular, `EXPO_PUBLIC_API_HOST` debe ser la IP LAN de tu maquina.
- Si pruebas en emulador Android, normalmente puedes usar `10.0.2.2` en lugar de tu IP LAN.
- Si cambias variables de entorno del mobile, reinicia Expo.

## Base de datos local

La base local corre en Docker Compose desde `emprendeX-web`.

Conexion local esperada:

```text
Host: localhost
Port: 5433
Database: emprendex
User: postgres
Password: password
```

URL equivalente:

```text
postgresql://postgres:password@localhost:5433/emprendex
```

### Carga inicial de estructura y datos

Una vez levantado PostgreSQL local, debes entrar al drive compartido del grupo de desarrollo y ejecutar:

1. `TABLAS EMPRENDEX`
2. `DATOS EMPRENDEX`

Ese orden es obligatorio.

Si eliminas el volumen de PostgreSQL o recreas la base desde cero, debes volver a correr esos scripts.

## Comandos principales

### Desde `C:\Proyectos\emprendeX-web`

Instalacion e inicio completo:

```bash
pnpm i
pnpm dev
```

Solo backend y PostgreSQL con Docker:

```bash
pnpm run docker:up
pnpm run docker:up:detached
pnpm run docker:logs
pnpm run docker:down
```

Solo API:

```bash
pnpm run dev:api
```

Solo web:

```bash
pnpm --filter ./apps/web dev:share
```

Validaciones:

```bash
pnpm build
pnpm lint
pnpm check-types
pnpm test
```

Validaciones de API:

```bash
pnpm run build:api
pnpm run lint:api
pnpm run check-types:api
pnpm run test:api
pnpm run test:api:e2e
```

### Desde `C:\Proyectos\emprendeX-mobile`

Si necesitas operar el mobile manualmente:

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
npm test -- --passWithNoTests
```

## Flujo recomendado de trabajo diario

1. Abre `project.code-workspace`.
2. Desde `C:\Proyectos\emprendeX-web`, ejecuta `pnpm dev`.
3. Espera a que levanten API, web y Expo.
4. Si es una base nueva, carga `TABLAS EMPRENDEX` y luego `DATOS EMPRENDEX`.
5. Trabaja normalmente en estos paths:

`emprendeX-web/apps/api`

`emprendeX-web/apps/web`

`emprendeX-mobile`

## Solucion rapida de problemas

### `pnpm dev` no levanta mobile

Revisa que exista:

```text
C:\Proyectos\emprendeX-mobile\package.json
```

Si el repo mobile no existe o no esta junto a `emprendeX-web`, el backend y la web pueden arrancar, pero mobile se omitira.

### Mobile no conecta con la API

Revisa:

1. que la API responda en `http://localhost:3000/api/v1/health`
2. que `EXPO_PUBLIC_API_TARGET` sea el esperado
3. que `EXPO_PUBLIC_API_HOST` apunte a una IP accesible desde el dispositivo
4. que hayas reiniciado Expo despues de cambiar el `.env.local`

### Web no conecta con la API

Revisa que `C:\Proyectos\emprendeX-web\apps\web\.env.local` tenga:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

### Backend no arranca por configuracion

Revisa que `C:\Proyectos\emprendeX-web\apps\api\.env.local` tenga:

- `JWT_SECRET` valido
- `DATABASE_TARGET=local` para desarrollo local
- variables `POSTGRES_*` completas si vas contra Docker local

## Resumen corto

- Pon `emprendeX-web` y `emprendeX-mobile` en `C:\Proyectos\`.
- Abre `C:\Proyectos\emprendeX-web\project.code-workspace`.
- Ejecuta `pnpm i` en `C:\Proyectos\emprendeX-web`.
- Configura los `.env.local` de backend, web y mobile.
- Ejecuta `pnpm dev` en `C:\Proyectos\emprendeX-web`.
- Carga la base desde el drive compartido en este orden: `TABLAS EMPRENDEX`, luego `DATOS EMPRENDEX`.
