import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { minutes, SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  SKIP_ALL_THROTTLERS,
  SKIP_PUBLIC_CATALOG_READ_THROTTLER,
  SKIP_PUBLIC_CATALOG_SUBMIT_THROTTLER,
} from '../common/throttling/throttler.constants';
import {
  PUBLIC_CATALOG_READ_LIMIT,
  PUBLIC_CATALOG_READ_TTL_MINUTES,
  PUBLIC_CATALOG_SUBMIT_LIMIT,
  PUBLIC_CATALOG_SUBMIT_TTL_MINUTES,
} from './public-catalog.config';
import { SubmitPublicQuotationDto } from './dto/submit-public-quotation.dto';
import { UpdateBusinessPublicCatalogDto } from './dto/update-business-public-catalog.dto';
import { PublicCatalogService } from './public-catalog.service';

const PUBLIC_CATALOG_READ_THROTTLE = {
  publicCatalogRead: {
    ttl: minutes(PUBLIC_CATALOG_READ_TTL_MINUTES),
    limit: PUBLIC_CATALOG_READ_LIMIT,
  },
};

const PUBLIC_CATALOG_SUBMIT_THROTTLE = {
  publicCatalogSubmit: {
    ttl: minutes(PUBLIC_CATALOG_SUBMIT_TTL_MINUTES),
    limit: PUBLIC_CATALOG_SUBMIT_LIMIT,
  },
};

@ApiTags('Catálogo Público')
@Controller({ version: '1' })
export class PublicCatalogController {
  constructor(private readonly publicCatalogService: PublicCatalogService) {}

  @ApiOperation({ summary: 'Catálogo público por slug', description: 'Obtiene el catálogo público y perfil del negocio por su slug.' })
  @ApiResponse({ status: 200 })
  @Get('catalogo-publico/:slug')
  @Header('Cache-Control', 'no-store')
  @SkipThrottle(SKIP_PUBLIC_CATALOG_SUBMIT_THROTTLER)
  @Throttle(PUBLIC_CATALOG_READ_THROTTLE)
  getPublicCatalog(@Param('slug') slug: string) {
    return this.publicCatalogService.getPublicCatalog(slug);
  }

  @ApiOperation({ summary: 'Perfil público del negocio' })
  @ApiResponse({ status: 200 })
  @Get('public-catalog/:slug/profile')
  @Header('Cache-Control', 'no-store')
  @SkipThrottle(SKIP_PUBLIC_CATALOG_SUBMIT_THROTTLER)
  @Throttle(PUBLIC_CATALOG_READ_THROTTLE)
  getPublicCatalogProfile(@Param('slug') slug: string) {
    return this.publicCatalogService.getPublicCatalogProfile(slug);
  }

  @ApiOperation({ summary: 'Ítems del catálogo público', description: 'Lista los productos y servicios del catálogo público por slug.' })
  @ApiResponse({ status: 200 })
  @Get('public-catalog/:slug/items')
  @Header('Cache-Control', 'no-store')
  @SkipThrottle(SKIP_PUBLIC_CATALOG_SUBMIT_THROTTLER)
  @Throttle(PUBLIC_CATALOG_READ_THROTTLE)
  getPublicCatalogItems(@Param('slug') slug: string) {
    return this.publicCatalogService.getPublicCatalogItems(slug);
  }

  @ApiOperation({ summary: 'Enviar cotización pública', description: 'Envía una cotización desde el catálogo público. Requiere token de Turnstile.' })
  @ApiResponse({ status: 201 })
  @Post('catalogo-publico/:slug/cotizaciones')
  @Header('Cache-Control', 'no-store')
  @HttpCode(HttpStatus.CREATED)
  @SkipThrottle(SKIP_PUBLIC_CATALOG_READ_THROTTLER)
  @Throttle(PUBLIC_CATALOG_SUBMIT_THROTTLE)
  submitPublicQuotation(
    @Param('slug') slug: string,
    @Body() dto: SubmitPublicQuotationDto,
    @Req() request: Request,
  ) {
    return this.publicCatalogService.submitPublicQuotation(
      slug,
      dto,
      this.resolveClientIp(request),
    );
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener mi catálogo público', description: 'Obtiene la configuración del catálogo público del negocio autenticado.' })
  @ApiResponse({ status: 200 })
  @Get('negocios/mi-catalogo-publico')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle(SKIP_ALL_THROTTLERS)
  getMyCatalogSettings(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.publicCatalogService.getMyCatalogSettings(currentUser.id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar mi catálogo público', description: 'Actualiza slug y visibilidad del catálogo público.' })
  @ApiResponse({ status: 200 })
  @Patch('negocios/mi-catalogo-publico')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle(SKIP_ALL_THROTTLERS)
  updateMyCatalogSettings(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateBusinessPublicCatalogDto,
  ) {
    return this.publicCatalogService.updateMyCatalogSettings(
      currentUser.id,
      dto,
    );
  }

  private resolveClientIp(request: Request): string | null {
    const forwardedFor = request.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0]?.trim() || null;
    }

    if (Array.isArray(forwardedFor) && forwardedFor[0]) {
      return forwardedFor[0].trim();
    }

    return request.ip ?? null;
  }
}
