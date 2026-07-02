# Implementación de Cloudinary en emprendeX

## Estado actual

La API solo acepta URLs HTTPS como string en los DTOs (`imageUrl`, `logoUrl`). No existe ningún endpoint de subida de archivos ni almacenamiento local/cloud.

### Endpoints inexistentes (requeridos por el frontend)

| Método | Ruta | Uso |
|--------|------|-----|
| `POST` | `/catalogo/items/:itemId/image` | Subir imagen de item del catálogo |
| `DELETE` | `/catalogo/items/:itemId/image` | Eliminar imagen de item |
| `PATCH` | `/business/preferences` | Ya existe, acepta `logoUrl` como string |

### Restricciones actuales en BD

- `items.image_url` → `VARCHAR(2048)`, solo acepta `https://` (CHECK constraint)
- `business_preferences.logo_url` → `VARCHAR(2048)`, solo acepta `https://`

---

## Arquitectura propuesta

```
Mobile App                    NestJS API                   Cloudinary
──────────                    ──────────                   ──────────
  │                             │                             │
  │  POST /items/:id/image      │                             │
  │  (multipart/form-data)      │                             │
  ├────────────────────────────>│                             │
  │                             │  uploader.upload(file)      │
  │                             ├────────────────────────────>│
  │                             │                             │
  │                             │  { secure_url, public_id }  │
  │                             │<────────────────────────────┤
  │                             │                             │
  │                             │  Guarda image_url en BD     │
  │                             │  ──────────────────────     │
  │                             │                             │
  │  200 { imageUrl }           │                             │
  │<────────────────────────────┤                             │
  │                             │                             │
  │  DELETE /items/:id/image    │                             │
  ├────────────────────────────>│                             │
  │                             │  uploader.destroy(publicId) │
  │                             ├────────────────────────────>│
  │                             │                             │
  │                             │  image_url = NULL en BD     │
  │                             │                             │
  │  204                        │                             │
  │<────────────────────────────┤                             │
```

---

## Paso 1: Instalar dependencias

```bash
cd apps/api
pnpm add cloudinary multer
pnpm add -D @types/multer
```

### Propósito de cada paquete

| Paquete | Uso |
|---------|-----|
| `cloudinary` | SDK oficial — subir, eliminar, transformar imágenes |
| `multer` | Middleware de Express para parsear `multipart/form-data` |
| `@types/multer` | Tipos de TypeScript para multer |

---

## Paso 2: Variables de entorno

Agregar a `.env.local` y al dashboard de Railway:

```env
# ── Cloudinary ───────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=dkpoc5z22
CLOUDINARY_API_KEY=899623718451628
CLOUDINARY_API_SECRET=5ts91y9uJoX-VN9gR8l0sSgXYCQ
CLOUDINARY_UPLOAD_FOLDER=emprendex
```

### Dónde obtener las credenciales

1. Ir a [cloudinary.com](https://cloudinary.com) → crear cuenta gratuita
2. Dashboard → **Account Details** → copiar:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

El plan gratuito incluye 25 GB de almacenamiento y 25 GB de ancho de banda mensual.

---

## Paso 3: Módulo de Cloudinary

### `src/cloudinary/cloudinary.module.ts`

```typescript
import { Global, Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { CloudinaryService } from './cloudinary.service';

@Global()
@Module({
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
```

### `src/cloudinary/cloudinary.provider.ts`

```typescript
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name: configService.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    });
  },
};
```

### `src/cloudinary/cloudinary.service.ts`

```typescript
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private readonly folder: string;

  constructor(private readonly configService: ConfigService) {
    this.folder = configService.get<string>('CLOUDINARY_UPLOAD_FOLDER', 'emprendex');
  }

  async uploadImage(
    file: Express.Multer.File,
    publicId: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          public_id: publicId,
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              new InternalServerErrorException('Error al subir imagen a Cloudinary'),
            );
          }
          resolve(result.secure_url);
        },
      );

      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(`${this.folder}/${publicId}`);
    } catch {
      // La imagen pudo ya no existir; no es crítico
    }
  }

  extractPublicId(secureUrl: string): string | null {
    try {
      const url = new URL(secureUrl);
      const pathParts = url.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];
      return filename.split('.')[0];
    } catch {
      return null;
    }
  }
}
```

---

## Paso 4: Registrar módulo en `app.module.ts`

```typescript
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    CloudinaryModule,
    // ... resto de módulos
  ],
})
export class AppModule {}
```

---

## Paso 5: Endpoints de imagen en Catálogo

### `src/catalog/catalog.controller.ts` — Agregar rutas

```typescript
import {
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

// POST /catalogo/items/:itemId/image
@Post('items/:itemId/image')
@UseInterceptors(FileInterceptor('image'))
async uploadItemImage(
  @Param('itemId') itemId: string,
  @BusinessContext() business: BusinessContextDto,
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5 MB
        new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
      ],
    }),
  )
  file: Express.Multer.File,
) {
  const secureUrl = await this.cloudinaryService.uploadImage(
    file,
    `catalog-${business.businessId}-${itemId}`,
  );

  const item = await this.catalogService.updateItemImage(
    business.businessId,
    itemId,
    secureUrl,
  );

  return this.catalogService.mapItem(item);
}

// DELETE /catalogo/items/:itemId/image
@Delete('items/:itemId/image')
async deleteItemImage(
  @Param('itemId') itemId: string,
  @BusinessContext() business: BusinessContextDto,
) {
  const item = await this.catalogService.getItemOrThrow(
    business.businessId,
    itemId,
  );

  if (item.imageUrl) {
    const publicId = this.cloudinaryService.extractPublicId(item.imageUrl);
    if (publicId) {
      await this.cloudinaryService.deleteImage(publicId);
    }
  }

  await this.catalogService.updateItemImage(
    business.businessId,
    itemId,
    null,
  );
}
```

### `src/catalog/catalog.service.ts` — Agregar método

```typescript
async updateItemImage(
  businessId: string,
  itemId: string,
  imageUrl: string | null,
): Promise<ItemEntity> {
  const manager = this.getEntityManager();
  const itemsRepository = manager.getRepository(ItemEntity);

  const item = await this.getItemOrThrow(businessId, itemId);

  item.imageUrl = imageUrl;
  return itemsRepository.save(item);
}
```

---

## Paso 6: Endpoint de logo del negocio

### `src/business-preferences/business-preferences.controller.ts`

```typescript
@Post('preferences/logo')
@UseInterceptors(FileInterceptor('logo'))
async uploadLogo(
  @BusinessContext() business: BusinessContextDto,
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2 MB
        new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
      ],
    }),
  )
  file: Express.Multer.File,
) {
  const secureUrl = await this.cloudinaryService.uploadImage(
    file,
    `logo-${business.businessId}`,
  );

  return this.businessPreferencesService.updatePreferences(business.businessId, {
    logoUrl: secureUrl,
  });
}
```

---

## Paso 7: Transformaciones de imagen recomendadas

Cloudinary permite transformar imágenes on-the-fly agregando parámetros a la URL. No se necesita código adicional — solo modificar la URL generada.

### Formatos útiles para el frontend

| Uso | Transformación | Resultado |
|-----|---------------|-----------|
| Thumbnail del catálogo | `w_200,h_200,c_fill,q_auto,f_auto` | 200×200 recortado, calidad automática |
| Imagen detalle | `w_600,q_auto,f_auto` | 600px ancho, calidad/formato automático |
| Logo del negocio | `w_200,c_limit,q_auto,f_auto` | Máximo 200px ancho |

### Helper para generar URLs transformadas

```typescript
// src/cloudinary/cloudinary.service.ts

transformUrl(secureUrl: string, options: string): string {
  const parts = secureUrl.split('/upload/');
  return `${parts[0]}/upload/${options}/${parts[1]}`;
}
```

Uso:
```typescript
const thumbnail = this.cloudinaryService.transformUrl(
  secureUrl,
  'w_200,h_200,c_fill,q_auto,f_auto',
);
```

---

## Paso 8: Actualizar el frontend móvil

No se requieren cambios en `lib/catalog.ts` — ya usa `FormData` y llama a los endpoints correctos (`POST /catalogo/items/:itemId/image`, `DELETE /catalogo/items/:itemId/image`). Solo hay que asegurarse de que:

1. El campo del `FormData` se llame `image` (coincide con `FileInterceptor('image')` del backend).
2. El Content-Type no se configure manualmente (el navegador/fetch lo asigna con el boundary correcto para multipart).

El código actual ya cumple ambos requisitos.

---

## Paso 9: Configurar CORS y límites en Railway

Railway usa un proxy frontal. Para subidas de archivos, verificar:

1. El límite de tamaño en Railway no bloquee requests > 5 MB.
2. Si hay un timeout, ajustarlo a ≥ 30 segundos para subidas lentas.

---

## Resumen de archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `apps/api/src/cloudinary/cloudinary.module.ts` | Crear |
| `apps/api/src/cloudinary/cloudinary.provider.ts` | Crear |
| `apps/api/src/cloudinary/cloudinary.service.ts` | Crear |
| `apps/api/src/app.module.ts` | Agregar `CloudinaryModule` |
| `apps/api/src/catalog/catalog.controller.ts` | Agregar POST/DELETE image |
| `apps/api/src/catalog/catalog.service.ts` | Agregar `updateItemImage()` |
| `apps/api/src/business-preferences/business-preferences.controller.ts` | Agregar POST logo |
| `.env.local` / Railway dashboard | Agregar `CLOUDINARY_*` vars |
| `apps/api/package.json` | Agregar `cloudinary`, `multer` |

Los frontends (mobile y web) **no requieren cambios** si se mantienen los mismos nombres de ruta y estructura de respuesta.
