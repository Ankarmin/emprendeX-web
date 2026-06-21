# Documentación Técnica — Swagger / OpenAPI en emprendeX API

> **Versión**: 1.0  
> **Última actualización**: 2026-06-21  
> **Framework**: NestJS 11 + `@nestjs/swagger`

---

## 1. Resumen Ejecutivo

Se implementó **Swagger (OpenAPI 3.0)** en el backend NestJS (`apps/api`) para documentar todos los endpoints de la API. La documentación se genera automáticamente a partir de decoradores en controladores, DTOs y entidades, y se expone en una interfaz interactiva (Swagger UI).

- **Paquete**: `@nestjs/swagger` (instalado como dependencia directa)
- **URL de Swagger UI**: `http://localhost:3000/api/docs` (local) o `https://{tu-dominio}/api/docs` (producción)
- **Especificación OpenAPI JSON**: `http://localhost:3000/api/docs-json`
- **Endpoints documentados**: 50 (12 controladores, 22 DTOs, 24 entidades)

---

## 2. Arquitectura de la Implementación

### 2.1 Configuración en `main.ts`

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// URL dinámica según el entorno de despliegue
const apiUrl = configService.get<string>('API_URL') ??
  (configService.get<string>('RAILWAY_PUBLIC_DOMAIN')
    ? `https://${configService.get<string>('RAILWAY_PUBLIC_DOMAIN')}`
    : undefined) ??
  `http://localhost:${Number(configService.get<string>('PORT') ?? 3000)}`;

const swaggerConfig = new DocumentBuilder()
  .setTitle('emprendeX API')
  .setDescription('API REST para la plataforma emprendeX — gestión de negocios, catálogo, ventas, finanzas y más.')
  .setVersion('1.0')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token JWT de autenticación' },
    'JWT-auth',
  )
  .addServer(apiUrl, 'Servidor actual')
  .build();

const swaggerPath = configService.get<string>('SWAGGER_DOCS_PATH') ?? 'api/docs';
const document = SwaggerModule.createDocument(app, swaggerConfig);
SwaggerModule.setup(swaggerPath, app, document, {
  swaggerOptions: {
    persistAuthorization: true,   // El token JWT persiste entre recargas
    docExpansion: 'list',         // Endpoints colapsados por defecto
    filter: true,                 // Barra de búsqueda habilitada
    showRequestDuration: true,    // Muestra duración de cada request
  },
});
```

### 2.1.1 Resolución Dinámica de la URL

El servidor de Swagger se configura automáticamente según el entorno:

| Prioridad | Fuente | Ejemplo |
|-----------|--------|---------|
| 1 | `API_URL` (variable de entorno) | `https://api.emprendex.com` |
| 2 | `RAILWAY_PUBLIC_DOMAIN` (automática en Railway) | `https://emprendex-api.up.railway.app` |
| 3 | Fallback local | `http://localhost:3000` |

### 2.2 Opciones de Swagger UI

| Opción | Valor | Descripción |
|--------|-------|-------------|
| `persistAuthorization` | `true` | El token JWT se guarda en `localStorage` y persiste al recargar la página |
| `docExpansion` | `'list'` | Las operaciones aparecen colapsadas; se expanden al hacer clic |
| `filter` | `true` | Barra de búsqueda/filtro por tag u operación |
| `showRequestDuration` | `true` | Muestra el tiempo de respuesta junto al código HTTP |

### 2.3 Esquema de Autenticación

Se configuró **Bearer JWT** como esquema de seguridad global con el identificador `JWT-auth`. Los endpoints protegidos llevan el decorador `@ApiBearerAuth('JWT-auth')`:

- **Endpoints públicos** (6): `POST /auth/login`, `POST /auth/register`, `GET /health`, `GET /catalogo-publico/:slug`, `GET /public-catalog/:slug/profile`, `GET /public-catalog/:slug/items`, `POST /catalogo-publico/:slug/cotizaciones`
- **Endpoints protegidos** (44): Requieren token JWT en el header `Authorization: Bearer <token>`

---

## 3. Decoradores Swagger Utilizados

### 3.1 En Controladores

| Decorador | Uso | Ejemplo |
|-----------|-----|---------|
| `@ApiTags('Nombre')` | Agrupa endpoints por módulo en Swagger UI | `@ApiTags('Autenticación')` |
| `@ApiBearerAuth('JWT-auth')` | Indica que el endpoint requiere JWT | A nivel de clase o método |
| `@ApiOperation({ summary, description })` | Describe qué hace el endpoint | `summary: 'Iniciar sesión'` |
| `@ApiResponse({ status, description })` | Documenta la respuesta esperada | `status: 200, description: 'Login exitoso'` |

### 3.2 En DTOs y Entidades

| Decorador | Uso |
|-----------|-----|
| `@ApiProperty({ description, example })` | Documenta propiedades requeridas con ejemplo |
| `@ApiPropertyOptional({ description, example })` | Documenta propiedades opcionales |
| `@ApiProperty({ enum: MiEnum, enumName: 'MiEnum' })` | Documenta campos tipo enum |

### 3.3 Convenciones Aplicadas

- **Idioma**: Todos los `description` y `summary` en español
- **Ejemplos realistas**: Cada propiedad incluye un `example` representativo (UUIDs, emails, DNIs, montos, etc.)
- **Enums nombrados**: Todos los enums incluyen `enumName` para generar esquemas legibles
- **Propiedades opcionales**: Se usa `@ApiPropertyOptional` para campos con `?`
- **Entidades**: Se documentaron propiedades de columna; se omitieron relaciones (`@OneToMany`, `@ManyToOne`) para evitar referencias circulares

---

## 4. Catálogo Completo de Endpoints

> **Prefijo global**: `/api` (configurado en `main.ts` con `setGlobalPrefix('api')`)  
> **Versionado**: URI (`v1`), versión por defecto `1`  
> **Ruta completa**: `{host}/api/v1/{ruta-controlador}/{ruta-endpoint}`

### 4.1 Autenticación (`@ApiTags('Autenticación')`)

**Ruta base**: `/api/v1/auth`

| Método | Ruta | Auth | Código | Descripción |
|--------|------|:----:|:------:|-------------|
| `POST` | `/auth/login` | | `200` | Inicia sesión con email y contraseña. Retorna `accessToken` y perfil del usuario. |
| `POST` | `/auth/register` | | `201` | Registra un nuevo usuario junto con su negocio. |
| `GET` | `/auth/me` | JWT | `200` | Obtiene el perfil del usuario autenticado. |
| `PATCH` | `/auth/me` | JWT | `200` | Actualiza nombre, apellido, nombre del negocio y categoría. |

**DTOs asociados**: `LoginDto`, `RegisterDto`, `UpdateMeDto`

---

### 4.2 Catálogo (`@ApiTags('Catálogo')`)

**Ruta base**: `/api/v1/catalogo`

| Método | Ruta | Auth | Código | Descripción |
|--------|------|:----:|:------:|-------------|
| `GET` | `/catalogo/units?itemClass={PRODUCTO\|SERVICIO}` | JWT | `200` | Lista unidades de medida por clase de ítem |
| `POST` | `/catalogo/units` | JWT | `201` | Crea una nueva unidad de medida |
| `PATCH` | `/catalogo/units/:unitId` | JWT | `200` | Actualiza una unidad existente |
| `DELETE` | `/catalogo/units/:unitId` | JWT | `204` | Elimina una unidad |
| `GET` | `/catalogo/categories?itemClass={PRODUCTO\|SERVICIO}` | JWT | `200` | Lista categorías por clase de ítem |
| `POST` | `/catalogo/categories` | JWT | `201` | Crea una nueva categoría |
| `PATCH` | `/catalogo/categories/:categoryId` | JWT | `200` | Actualiza una categoría existente |
| `DELETE` | `/catalogo/categories/:categoryId` | JWT | `204` | Elimina una categoría |
| `GET` | `/catalogo/items` | JWT | `200` | Lista todos los ítems (productos y servicios) |
| `GET` | `/catalogo/items/:itemId` | JWT | `200` | Obtiene un ítem por ID |
| `POST` | `/catalogo/items` | JWT | `201` | Crea un nuevo producto o servicio |
| `PATCH` | `/catalogo/items/:itemId` | JWT | `200` | Actualiza un ítem existente |
| `DELETE` | `/catalogo/items/:itemId` | JWT | `204` | Elimina un ítem |

**DTOs asociados**: `CreateUnitDto`, `UpdateUnitDto`, `CreateCategoryDto`, `UpdateCategoryDto`, `CreateItemDto`, `UpdateItemDto`

---

### 4.3 Ventas (`@ApiTags('Ventas')`)

**Ruta base**: `/api/v1`

| Método | Ruta | Auth | Código | Descripción |
|--------|------|:----:|:------:|-------------|
| `GET` | `/cotizaciones` | JWT | `200` | Lista todas las cotizaciones del negocio |
| `POST` | `/cotizaciones` | JWT | `201` | Crea una nueva cotización con sus detalles |
| `DELETE` | `/cotizaciones/:quotationId` | JWT | `204` | Elimina una cotización |
| `POST` | `/cotizaciones/:quotationId/convertir` | JWT | `201` | Convierte una cotización en pedido |
| `GET` | `/operaciones` | JWT | `200` | Lista todas las operaciones (pedidos) |
| `GET` | `/operaciones/:operationId` | JWT | `200` | Obtiene un pedido por ID |
| `GET` | `/pedidos/pendientes` | JWT | `200` | Lista pedidos en estado pendiente |

**DTOs asociados**: `CreateQuotationDto`

---

### 4.4 Finanzas (`@ApiTags('Finanzas')`)

**Ruta base**: `/api/v1/contabilidad`

| Método | Ruta | Auth | Código | Descripción |
|--------|------|:----:|:------:|-------------|
| `GET` | `/contabilidad/summary` | JWT | `200` | Resumen financiero del negocio |
| `GET` | `/contabilidad/records` | JWT | `200` | Lista todos los registros financieros |
| `GET` | `/contabilidad/payments/:paymentId/details` | JWT | `200` | Detalles de un pago específico |
| `GET` | `/contabilidad/payment-methods` | JWT | `200` | Lista métodos de pago |
| `POST` | `/contabilidad/payment-methods` | JWT | `201` | Crea un nuevo método de pago |
| `PATCH` | `/contabilidad/payment-methods/:paymentMethodId` | JWT | `200` | Actualiza un método de pago |
| `DELETE` | `/contabilidad/payment-methods/:paymentMethodId` | JWT | `204` | Elimina un método de pago |
| `GET` | `/contabilidad/financial-categories` | JWT | `200` | Lista categorías financieras |
| `POST` | `/contabilidad/financial-categories` | JWT | `201` | Crea una categoría financiera |
| `PATCH` | `/contabilidad/financial-categories/:financialCategoryId` | JWT | `200` | Actualiza una categoría financiera |
| `DELETE` | `/contabilidad/financial-categories/:financialCategoryId` | JWT | `204` | Elimina una categoría financiera |
| `POST` | `/contabilidad/payments` | JWT | `201` | Registra un pago para un pedido |
| `POST` | `/contabilidad/expenses` | JWT | `201` | Registra un nuevo gasto |

**DTOs asociados**: `CreatePaymentDto`, `CreateExpenseDto`, `CreatePaymentMethodDto`, `UpdatePaymentMethodDto`, `CreateFinancialCategoryDto`, `UpdateFinancialCategoryDto`

---

### 4.5 Clientes (`@ApiTags('Clientes')`)

**Ruta base**: `/api/v1/clientes`

| Método | Ruta | Auth | Código | Descripción |
|--------|------|:----:|:------:|-------------|
| `GET` | `/clientes` | JWT | `200` | Lista todos los clientes del negocio |
| `GET` | `/clientes/:customerId` | JWT | `200` | Obtiene un cliente por ID |
| `POST` | `/clientes` | JWT | `201` | Crea un nuevo cliente |
| `PATCH` | `/clientes/:customerId` | JWT | `200` | Actualiza datos de un cliente |
| `DELETE` | `/clientes/:customerId` | JWT | `204` | Elimina un cliente |

**DTOs asociados**: `CreateCustomerDto`, `UpdateCustomerDto`

---

### 4.6 Reportes (`@ApiTags('Reportes')`)

**Ruta base**: `/api/v1/reportes`

| Método | Ruta | Auth | Código | Descripción |
|--------|------|:----:|:------:|-------------|
| `GET` | `/reportes/overview` | JWT | `200` | Resumen general del negocio |
| `GET` | `/reportes/kpis?timezone=America/Lima` | JWT | `200` | KPIs con ajuste de zona horaria |

---

### 4.7 Catálogo Público (`@ApiTags('Catálogo Público')`)

**Rutas**: `/api/v1/catalogo-publico/:slug/*` y `/api/v1/public-catalog/:slug/*` y `/api/v1/negocios/mi-catalogo-publico`

| Método | Ruta | Auth | Código | Descripción |
|--------|------|:----:|:------:|-------------|
| `GET` | `/catalogo-publico/:slug` | | `200` | Catálogo público y perfil del negocio por slug |
| `GET` | `/public-catalog/:slug/profile` | | `200` | Perfil público del negocio |
| `GET` | `/public-catalog/:slug/items` | | `200` | Ítems del catálogo público |
| `POST` | `/catalogo-publico/:slug/cotizaciones` | | `201` | Envía cotización desde catálogo público (requiere Turnstile) |
| `GET` | `/negocios/mi-catalogo-publico` | JWT | `200` | Configuración del catálogo público del negocio autenticado |
| `PATCH` | `/negocios/mi-catalogo-publico` | JWT | `200` | Actualiza slug y visibilidad del catálogo público |

**DTOs asociados**: `SubmitPublicQuotationDto`, `UpdateBusinessPublicCatalogDto`

---

### 4.8 Planes (`@ApiTags('Planes')`)

**Ruta base**: `/api/v1/planes`

| Método | Ruta | Auth | Código | Descripción |
|--------|------|:----:|:------:|-------------|
| `GET` | `/planes` | JWT | `200` | Lista todos los planes de suscripción disponibles |

---

### 4.9 Health Check (`@ApiTags('Health Check')`)

**Ruta base**: `/api/v1/health`

| Método | Ruta | Auth | Código | Descripción |
|--------|------|:----:|:------:|-------------|
| `GET` | `/health` | | `200` | Health check. Retorna `{ status, service, timestamp }` |

---

### 4.10 Calendario (`@ApiTags('Calendario')`)

**Ruta base**: `/api/v1/calendario`

| Método | Ruta | Auth | Código | Descripción |
|--------|------|:----:|:------:|-------------|
| `GET` | `/calendario/events` | JWT | `200` | Lista eventos del calendario del negocio |

---

### 4.11 Preferencias del Negocio (`@ApiTags('Preferencias del Negocio')`)

**Ruta base**: `/api/v1/business/preferences`

| Método | Ruta | Auth | Código | Descripción |
|--------|------|:----:|:------:|-------------|
| `GET` | `/business/preferences` | JWT | `200` | Obtiene preferencias del negocio (paleta de colores, logo) |
| `PATCH` | `/business/preferences` | JWT | `200` | Actualiza paleta de colores y logo del negocio |

**DTOs asociados**: `UpdateBusinessPreferencesDto`

---

### 4.12 Onboarding (`@ApiTags('Onboarding')`)

**Ruta base**: `/api/v1/onboarding`

| Método | Ruta | Auth | Código | Descripción |
|--------|------|:----:|:------:|-------------|
| `PATCH` | `/onboarding/setup` | JWT | `200` | Configura nombre y categoría del negocio durante onboarding |
| `PUT` | `/onboarding/modules` | JWT | `200` | Marca módulos de onboarding como completados |

**DTOs asociados**: `UpdateOnboardingSetupDto`

---

## 5. Entidades Documentadas (Schemas)

Todas las entidades TypeORM fueron instrumentadas con `@ApiProperty` y `@ApiPropertyOptional`, generando 24 schemas en OpenAPI:

| # | Entidad | Tabla | Propiedades documentadas |
|---|---------|-------|--------------------------|
| 1 | `User` | `users` | `userId`, `firstNames`, `lastNames`, `dni`, `passwordHash`, `email`, `phone` |
| 2 | `Business` | `businesses` | `businessId`, `userId`, `businessName`, `businessCategory`, `publicCatalogSlug`, `catalogIsPublic` |
| 3 | `BusinessPreferences` | `business_preferences` | `businessPreferenceId`, `businessId`, `colorPaletteId`, `logoUrl` |
| 4 | `BusinessModule` | `business_modules` | `businessModuleId`, `businessId`, `moduleId`, `status` |
| 5 | `Customer` | `customers` | `customerId`, `businessId`, `firstNames`, `lastNames`, `dni`, `email`, `phone`, `address` |
| 6 | `Item` | `items` | `itemId`, `businessId`, `itemClass`, `categoryId`, `unitId`, `name`, `description`, `sku`, `imageUrl`, `price` |
| 7 | `Product` | `products` | `itemId`, `businessId`, `itemClass`, `stock` |
| 8 | `Service` | `services` | `itemId`, `businessId`, `itemClass` |
| 9 | `Category` | `categories` | `categoryId`, `businessId`, `itemClass`, `categoryName` |
| 10 | `Unit` | `units` | `unitId`, `businessId`, `itemClass`, `unitName` |
| 11 | `Quotation` | `quotations` | `quotationId`, `businessId`, `customerId`, `origin`, `description`, `deliveryDate`, `deliveryMethod`, `total` |
| 12 | `QuotationDetail` | `quotation_details` | `quotationDetailId`, `businessId`, `quotationId`, `itemId`, `quantity`, `unitPrice`, `discount` |
| 13 | `Order` | `orders` | `orderId`, `businessId`, `quotationId`, `status`, `notes` |
| 14 | `Payment` | `payments` | `paymentId`, `businessId`, `orderId`, `status`, `remainingTotal` |
| 15 | `PaymentMethod` | `payment_methods` | `paymentMethodId`, `businessId`, `name` |
| 16 | `PaymentDetail` | `payment_details` | `paymentDetailId`, `businessId`, `paymentId`, `paymentMethodId`, `subtotal` |
| 17 | `Expense` | `expenses` | `expenseId`, `businessId`, `financialCategoryId`, `paymentMethodId`, `description`, `total` |
| 18 | `ExpenseDetail` | `expense_details` | `expenseDetailId`, `businessId`, `expenseId`, `paymentMethodId`, `subtotal` |
| 19 | `FinancialCategory` | `financial_categories` | `financialCategoryId`, `businessId`, `name` |
| 20 | `Plan` | `plans` | `planId`, `name`, `description`, `status` |
| 21 | `PlanPrice` | `plan_prices` | `planPriceId`, `planId`, `period`, `isActive`, `price` |
| 22 | `Subscription` | `subscriptions` | `subscriptionId`, `planPriceId`, `userId`, `startDate`, `endDate`, `status` |
| 23 | `FeatureModule` | `modules` | `moduleId`, `moduleName`, `code`, `moduleType` |
| 24 | `AuditLogEntity` | `audit_logs` | `auditLogId`, `actorUserId`, `businessId`, `action`, `tableName`, `recordId`, `oldData`, `newData`, `ipAddress`, `userAgent` |

> **Nota**: Las propiedades de relación (`@OneToMany`, `@ManyToOne`, `@OneToOne`) no se incluyeron en Swagger para evitar referencias circulares y mantener los schemas limpios.

---

## 6. Cómo Usar Swagger UI

### 6.1 Acceso

1. Iniciar el servidor: `pnpm dev:api` (o `pnpm start:api`)
2. Abrir navegador en: `http://localhost:3000/api/docs`
3. En producción (Railway): `https://{tu-app}.up.railway.app/api/docs`

La URL del servidor en el selector de Swagger se adapta automáticamente al entorno gracias a la resolución dinámica (`API_URL` → `RAILWAY_PUBLIC_DOMAIN` → localhost).

### 6.2 Autenticación en Swagger UI

1. Ejecutar `POST /api/v1/auth/login` con credenciales válidas
2. Copiar el `accessToken` de la respuesta
3. Clic en el botón **Authorize** (candado) en la esquina superior derecha
4. Pegar el token en el campo `Value` (sin el prefijo `Bearer`)
5. Clic en **Authorize** y luego **Close**

El token persiste entre recargas gracias a `persistAuthorization: true`.

### 6.3 Probando Endpoints Protegidos

Una vez autorizado, todos los endpoints con candado se pueden ejecutar directamente desde Swagger UI. El header `Authorization: Bearer <token>` se envía automáticamente.

### 6.4 Endpoints Públicos

Los siguientes endpoints no requieren autenticación y se pueden probar directamente:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/health`
- `GET /api/v1/catalogo-publico/{slug}`
- `GET /api/v1/public-catalog/{slug}/profile`
- `GET /api/v1/public-catalog/{slug}/items`
- `POST /api/v1/catalogo-publico/{slug}/cotizaciones`

---

## 7. Buenas Prácticas Aplicadas

| Práctica | Implementación |
|----------|---------------|
| **Separación de responsabilidades** | Los decoradores Swagger se agregaron sin modificar la lógica de negocio |
| **Idioma consistente** | Todas las descripciones, summaries y ejemplos en español |
| **Ejemplos realistas** | Cada propiedad tiene un `example` representativo del dominio |
| **Enums tipados** | Todos los enums incluyen `enum` + `enumName` para schemas autodescriptivos |
| **DTOs vs Entidades** | Los DTOs documentan el request; las entidades documentan el response |
| **Persistencia de auth** | `persistAuthorization: true` evita reingresar el token en cada recarga |
| **Filtro de búsqueda** | `filter: true` permite buscar endpoints por nombre o tag |
| **Seguridad** | `passwordHash` usa `writeOnly: true` para no aparecer en schemas de respuesta |
| **Códigos HTTP** | Cada endpoint especifica el código de respuesta esperado (200, 201, 204) |
| **Versionado** | La API usa versionado por URI (`v1`), reflejado correctamente en Swagger |

---

## 8. Mantenimiento Futuro

### 8.1 Agregar un Nuevo Endpoint

Al crear un nuevo endpoint, seguir este patrón:

```typescript
// 1. En el DTO
import { ApiProperty } from '@nestjs/swagger';

export class CreateSomethingDto {
  @ApiProperty({ description: 'Nombre del recurso', example: 'Ejemplo' })
  @IsString()
  name!: string;
}

// 2. En el Controller
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Módulo Nuevo')
@Controller({ path: 'nuevo-modulo', version: '1' })
export class NewController {
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear recurso', description: 'Descripción detallada.' })
  @ApiResponse({ status: 201, description: 'Recurso creado exitosamente.' })
  create(@Body() dto: CreateSomethingDto) {
    return this.service.create(dto);
  }
}
```

### 8.2 Agregar un Nuevo Servidor

Para documentar múltiples entornos, agregar más llamadas `.addServer()` en `main.ts`:

```typescript
.addServer('http://localhost:3000', 'Desarrollo local')
.addServer('https://api.emprendex.com', 'Producción')
.addServer('https://staging.emprendex.com', 'Staging')
```

### 8.3 Incluir Tags Adicionales en el DocumentBuilder

```typescript
.addTag('Autenticación', 'Registro e inicio de sesión')
.addTag('Catálogo', 'Gestión de productos, servicios, categorías y unidades')
```

---

## 9. Archivos Modificados

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `apps/api/package.json` | Config | Agregado `@nestjs/swagger` como dependencia |
| `apps/api/src/main.ts` | Config | Configuración de `DocumentBuilder` y `SwaggerModule.setup()` |
| `apps/api/src/**/*.dto.ts` (22 archivos) | DTOs | Agregados `@ApiProperty` / `@ApiPropertyOptional` |
| `apps/api/src/**/*.entity.ts` (24 archivos) | Entidades | Agregados `@ApiProperty` / `@ApiPropertyOptional` |
| `apps/api/src/**/*.controller.ts` (12 archivos) | Controladores | Agregados `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse` |

**Total de archivos modificados**: 58 (más `package.json` y `main.ts`)
