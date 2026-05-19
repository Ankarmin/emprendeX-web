# EmprendeX Backend

Backend en NestJS para `EmprendeX`, organizado por módulos y conectado a PostgreSQL con TypeORM.

## Estado actual

Primera entrega enfocada en autenticación:

- Login con `email` y `password`
- Registro con creación real de usuario
- JWT para sesión autenticada
- Endpoint para obtener el usuario actual
- Migración inicial de tabla `users`
- Usuario semilla configurable por entorno
- Healthcheck para despliegue y verificación

## Stack

- NestJS 11
- TypeORM
- PostgreSQL
- JWT
- bcrypt
- class-validator

## Variables de entorno

Usa `.env.example` como referencia.

Variables clave:

- `DATABASE_PUBLIC_URL`
- `DATABASE_SSL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGINS`
- `APP_PUBLIC_URL`
- `SEED_USER_EMAIL`
- `SEED_USER_PASSWORD`

## Scripts

```bash
npm install
npm run start:dev
npm run build
npm run lint:check
npm run test:e2e
```

## Endpoints disponibles

Base local:

```text
http://localhost:3000/api/v1
```

Base productiva esperada:

```text
https://emprendex-backend-production.up.railway.app/api/v1
```

### `POST /auth/login`

Request:

```json
{
  "email": "admin@emprendex.app",
  "password": "EmprendeX123!"
}
```

Response:

```json
{
  "accessToken": "jwt",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "requiresOnboarding": true,
  "user": {
    "id": "uuid",
    "email": "admin@emprendex.app",
    "onboardingCompleted": false,
    "enabledModuleIds": [],
    "businessProfile": {
      "name": null,
      "category": null,
      "currencyCode": null
    }
  }
}
```

### `POST /auth/register`

Request:

```json
{
  "email": "nuevo@emprendex.app",
  "password": "Registro123!",
  "businessName": "Dulce Taller",
  "businessCategory": "Pasteleria personalizada",
  "currencyCode": "PEN"
}
```

Response:

```json
{
  "accessToken": "jwt",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "requiresOnboarding": true,
  "user": {
    "id": "uuid",
    "email": "nuevo@emprendex.app",
    "onboardingCompleted": false,
    "enabledModuleIds": [],
    "businessProfile": {
      "name": "Dulce Taller",
      "category": "Pasteleria personalizada",
      "currencyCode": "PEN"
    }
  }
}
```

### `GET /auth/me`

Headers:

```text
Authorization: Bearer <token>
```

### `PATCH /onboarding/setup`

Request:

```json
{
  "businessName": "Taller Norte",
  "businessCategory": "Tecnología / Electrónica",
  "currencyCode": "USD"
}
```

Actualiza el perfil básico del negocio y mantiene el usuario dentro del onboarding si aún no eligió módulos.

### `PUT /onboarding/modules`

Request:

```json
{
  "selectedModuleIds": ["operaciones", "clientes", "pagos"]
}
```

Guarda los módulos elegidos y marca `onboardingCompleted=true`.

### `GET /health`

Devuelve el estado básico del servicio.

## Flujo esperado para el frontend móvil

Las pantallas `app/index.tsx` y `app/register.tsx` del frontend pueden enviar datos a `POST /auth/login` y `POST /auth/register`.

Regla inicial sugerida:

- Si `requiresOnboarding` es `true` y el negocio ya existe en perfil, navegar a `/onboarding/modules`
- Si `requiresOnboarding` es `true` y aun no hay perfil de negocio, navegar a `/onboarding`
- Si `requiresOnboarding` es `false`, navegar a `/(drawer)/(tabs)`

## Siguiente bloque recomendado

1. Hacer visibles/ocultables los módulos elegidos en drawer y tabs
2. Sincronizar reordenamiento del sidebar con backend
3. Añadir edición real del perfil de negocio desde configuración
4. Añadir recuperación de contraseña
