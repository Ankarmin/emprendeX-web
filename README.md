# EmprendeX

Guía de arranque local para trabajar con estos dos repositorios:

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
- `pnpm dev` en `emprendeX-web` intenta levantar también `emprendeX-mobile`

## Workspace recomendado

De preferencia abre este archivo en VS Code:

```text
C:\Proyectos\emprendeX-web\project.code-workspace
```

Ese workspace abre al mismo tiempo:

- `emprendeX-web`
- `emprendeX-mobile`

También deja listas tareas y configuraciones compartidas para backend y mobile.

## Requisitos

- Node.js 22 LTS recomendado
- `pnpm` 11.5.1
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
- si existe `C:\Proyectos\emprendeX-mobile`, ejecuta también `npm install` dentro del mobile

4. Configura los `.env` copiando las plantillas:

```powershell
# Desde C:\Proyectos\emprendeX-web:
Copy-Item "apps\api\.env.example" "apps\api\.env.local"
Copy-Item "apps\web\.env.example" "apps\web\.env.local"

# Desde C:\Proyectos\emprendeX-mobile:
Copy-Item ".env.example" ".env.local"
```

> Las plantillas ya contienen los valores correctos para desarrollo local.
> Solo necesitas editar `JWT_SECRET` en `apps/api/.env.local` por un valor seguro si lo deseas.

5. Levanta todo desde `C:\Proyectos\emprendeX-web`:

```bash
pnpm dev
```

6. Cuando PostgreSQL local ya esté arriba, entra al drive compartido del grupo de desarrollo y ejecuta los scripts SQL en este orden exacto:

```text
1. TABLAS EMPRENDEX
2. DATOS EMPRENDEX
```

7. Verifica los servicios:

- API: `http://localhost:3000/api/v1/health`
- Web: `http://localhost:3001`
- Mobile: revisa el QR y la salida de Expo en la terminal

## Qué hace `pnpm dev`

Ejecutado desde `C:\Proyectos\emprendeX-web`, `pnpm dev` levanta el stack local completo:

- levanta PostgreSQL con Docker
- levanta la API NestJS en local con hot reload (`nest start --watch`)
- levanta la web Next.js en `http://localhost:3001`
- si existe `C:\Proyectos\emprendeX-mobile`, ejecuta `npm run start` en el mobile
- al hacer `Ctrl+C`, detiene todos los procesos y ejecuta `docker compose down`

Puertos locales esperados:

- API: `3000`
- Web: `3001`
- PostgreSQL: `5433`
- Expo / Metro: `8081`

Si alguno de esos puertos está ocupado, `pnpm dev` no podrá arrancar correctamente.

## Comandos principales

### Stack completo

```bash
pnpm dev              # Stack local completo (DB Docker + API local + web + mobile)
pnpm dev -c           # Igual + limpieza profunda de cachés
pnpm dev:railway      # Solo mobile contra API de Railway (sin Docker, sin API local, sin web)
pnpm dev:railway -c   # Railway + limpieza profunda de cachés
```

### Solo componentes

```bash
pnpm dev:api          # Solo API NestJS (hot reload, sin Docker)
pnpm docker:db        # Solo base de datos PostgreSQL en Docker
pnpm docker:db:down   # Detener base de datos
pnpm docker:logs      # Ver logs de PostgreSQL
```

### Validaciones

```bash
pnpm build            # Build de todos los paquetes
pnpm lint             # Lint de todos los paquetes
pnpm check-types      # TypeScript type-check
pnpm test             # Tests
```

### Solo API

```bash
pnpm build:api
pnpm lint:api
pnpm check-types:api
pnpm test:api
pnpm test:api:e2e
```

### Solo web

```bash
pnpm --filter ./apps/web dev:share   # Next.js expuesto en red
pnpm test:web
```

### Mobile (desde `C:\Proyectos\emprendeX-mobile`)

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
npm test -- --passWithNoTests
```

## Modos de desarrollo

### Modo local (`pnpm dev`)

Todo corre en tu máquina. Solo PostgreSQL va en Docker:

```
┌─────────────┐    ┌──────────┐    ┌──────────┐
│  Docker DB  │    │  NestJS  │    │  Next.js │    ┌───────┐
│  :5433      │◄───│  :3000   │◄───│  :3001   │    │ Expo  │
│  postgres   │    │  watch   │    │  dev     │◄───│ :8081 │
└─────────────┘    └──────────┘    └──────────┘    └───────┘
```

El script `dev-local.mjs` copia automáticamente `mobile/.env.example` → `mobile/.env.local` para restaurar la configuración local del mobile.

### Modo Railway (`pnpm dev:railway`)

Solo la app mobile se conecta a la API desplegada en Railway. El backend, la base de datos y la web ya están en Railway/Vercel, por lo que no se usa Docker ni API local:

```
┌──────────────────┐
│  Railway API     │
│  :443 (HTTPS)    │
└────────┬─────────┘
         │
    ┌────┴────┐
    │  Expo   │
    │  :8081  │
    └─────────┘
```

El script `dev-railway.mjs` copia `mobile/.env.railway.example` → `mobile/.env.local` y arranca Expo.

**Para configurar Railway por primera vez:**

1. Edita `emprendeX-mobile/.env.railway.example` con la URL pública de tu API en Railway.
2. Ejecuta `pnpm dev:railway`.

La URL se guarda en ese archivo y no necesitas volver a configurarla.

## Variables de entorno

### Backend (`apps/api`)

El backend lee `apps/api/.env.local`.

**No** uses `apps/api/.env`. Usa como base `apps/api/.env.example` y cópialo a `.env.local`.

El archivo `.env.example` ya está documentado con secciones LOCAL y RAILWAY. Para desarrollo local solo necesitas:

```env
DATABASE_PUBLIC_URL=postgresql://postgres:password@localhost:5433/emprendex
DATABASE_SSL=false
CORS_ORIGINS=http://localhost:3001,http://localhost:8081,http://localhost:19006
WEB_PUBLIC_URL=http://localhost:3001

DATABASE_URL=
DATABASE_TARGET=auto
PORT=3000

JWT_SECRET=dev-secret-change-in-production-abc123
JWT_EXPIRES_IN=86400

PUBLIC_CATALOG_READ_TTL_MINUTES=1
PUBLIC_CATALOG_READ_LIMIT=60
PUBLIC_CATALOG_SUBMIT_TTL_MINUTES=10
PUBLIC_CATALOG_SUBMIT_LIMIT=5
PUBLIC_CATALOG_MAX_ITEMS=25
PUBLIC_CATALOG_MAX_ITEM_QUANTITY=100

PUBLIC_CATALOG_TURNSTILE_SECRET_KEY=
```

**Una sola variable de conexión:** `DATABASE_PUBLIC_URL` reemplaza a los 5 `POSTGRES_*` individuales. Con `DATABASE_TARGET=auto` (default), el sistema detecta la URL directa y la usa sin necesidad de configurar `POSTGRES_HOST`, `POSTGRES_PORT`, etc.

**Para Railway:** Railway asigna `DATABASE_URL` y `DATABASE_PUBLIC_URL` automáticamente. Solo necesitas configurar en el dashboard: `DATABASE_SSL=true`, `JWT_SECRET`, `CORS_ORIGINS` (con la URL de Vercel) y `WEB_PUBLIC_URL`.

### Frontend web (`apps/web`)

La web lee `apps/web/.env.local`. Para desarrollo local:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
NEXT_ALLOWED_DEV_ORIGINS=
NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL=S/
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

**Para Vercel:** Configura `NEXT_PUBLIC_API_BASE_URL` con la URL de Railway en Settings > Environment Variables.

### Mobile (`emprendeX-mobile`)

La app resuelve la API en este orden:

1. `EXPO_PUBLIC_API_BASE_URL` (si está definida, se usa directamente)
2. `EXPO_PUBLIC_API_TARGET=railway` → usa `EXPO_PUBLIC_API_RAILWAY_BASE_URL`
3. `EXPO_PUBLIC_API_TARGET=local` → construye URL desde `HOST` + `PORT` + `PATH`
4. `EXPO_PUBLIC_API_TARGET=auto` → prueba local primero, luego railway

**Desarrollo local** (`.env.local`):

```env
EXPO_PUBLIC_API_TARGET=local
EXPO_PUBLIC_API_HOST=192.168.18.9
EXPO_PUBLIC_API_PORT=3000
EXPO_PUBLIC_API_SCHEME=http
EXPO_PUBLIC_API_PATH=/api/v1
EXPO_PUBLIC_DEFAULT_CURRENCY_SYMBOL=S/
EXPO_PUBLIC_PASSWORD_MIN_LENGTH=8
```

**Railway** (`.env.railway.example`):

```env
EXPO_PUBLIC_API_TARGET=railway
EXPO_PUBLIC_API_RAILWAY_BASE_URL=https://api-production-xxxx.up.railway.app/api/v1
EXPO_PUBLIC_DEFAULT_CURRENCY_SYMBOL=S/
EXPO_PUBLIC_PASSWORD_MIN_LENGTH=8
```

> `pnpm dev:railway` copia automáticamente `.env.railway.example` → `.env.local`.
> `pnpm dev` (`dev:local`) restaura la configuración local desde `.env.example`.

**Notas para mobile:**

- `EXPO_PUBLIC_API_HOST` debe ser la IP LAN de tu máquina si pruebas desde celular físico.
- Para emulador, cambia a `localhost` (o `10.0.2.2` en Android).
- Si cambias variables de entorno del mobile, reinicia Expo.

## Base de datos local

La base local corre en Docker Compose desde `emprendeX-web`.

Conexión local esperada:

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

## Solución rápida de problemas

### `pnpm dev` no levanta mobile

Revisa que exista:

```text
C:\Proyectos\emprendeX-mobile\package.json
```

Si el repo mobile no existe o no está junto a `emprendeX-web`, el backend y la web pueden arrancar, pero mobile se omitirá.

### Mobile no conecta con la API

Revisa:

1. que la API responda en `http://localhost:3000/api/v1/health`
2. que `EXPO_PUBLIC_API_TARGET` sea el esperado
3. que `EXPO_PUBLIC_API_HOST` apunte a una IP accesible desde el dispositivo
4. que hayas reiniciado Expo después de cambiar el `.env.local`

> Si usas `pnpm dev:local`, el script restaura automáticamente la IP desde `.env.example`. Si tu IP cambió, edita `mobile/.env.example` con la nueva IP.

### Web no conecta con la API

Revisa que `apps/web/.env.local` tenga:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

### Backend no arranca por configuración

Revisa que `apps/api/.env.local` tenga:

- `JWT_SECRET` válido (mínimo 16 caracteres)
- `DATABASE_PUBLIC_URL` apuntando a `localhost:5433`
- Base de datos Docker corriendo (`docker compose ps`)

### Puerto ocupado

```bash
# Ver qué ocupa un puerto (Windows)
netstat -ano | findstr :5433

# Detener y limpiar contenedores
pnpm docker:db:down
```

## Resumen corto

- Pon `emprendeX-web` y `emprendeX-mobile` en `C:\Proyectos\`.
- Abre `C:\Proyectos\emprendeX-web\project.code-workspace`.
- Ejecuta `pnpm i` en `C:\Proyectos\emprendeX-web`.
- Copia los `.env.example` a `.env.local` (api, web, mobile).
- Ejecuta `pnpm dev` en `C:\Proyectos\emprendeX-web`.
- Carga la base desde el drive compartido: `TABLAS EMPRENDEX`, luego `DATOS EMPRENDEX`.
- Para probar contra Railway: edita `mobile/.env.railway.example` y ejecuta `pnpm dev:railway`.
