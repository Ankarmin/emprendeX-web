import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { SKIP_ALL_THROTTLERS } from '../common/throttling/throttler.constants';
import { ItemClass } from '../database/database.enums';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@ApiTags('Catálogo')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'catalogo', version: '1' })
@UseGuards(JwtAuthGuard)
@SkipThrottle(SKIP_ALL_THROTTLERS)
@UseInterceptors(CacheInterceptor)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @ApiOperation({
    summary: 'Listar unidades',
    description: 'Lista unidades de medida filtradas por clase de ítem.',
  })
  @ApiResponse({ status: 200, description: 'Lista de unidades.' })
  @Get('units')
  getUnits(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('itemClass', new ParseEnumPipe(ItemClass)) itemClass: ItemClass,
  ) {
    return this.catalogService.getUnits(currentUser.id, itemClass);
  }

  @ApiOperation({ summary: 'Crear unidad' })
  @ApiResponse({ status: 201, description: 'Unidad creada.' })
  @Post('units')
  @HttpCode(HttpStatus.CREATED)
  createUnit(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createUnitDto: CreateUnitDto,
  ) {
    return this.catalogService.createUnit(currentUser.id, createUnitDto);
  }

  @ApiOperation({ summary: 'Actualizar unidad' })
  @ApiResponse({ status: 200, description: 'Unidad actualizada.' })
  @Patch('units/:unitId')
  updateUnit(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Body() updateUnitDto: UpdateUnitDto,
  ) {
    return this.catalogService.updateUnit(
      currentUser.id,
      unitId,
      updateUnitDto,
    );
  }

  @ApiOperation({ summary: 'Eliminar unidad' })
  @ApiResponse({ status: 204, description: 'Unidad eliminada.' })
  @Delete('units/:unitId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUnit(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
  ): Promise<void> {
    await this.catalogService.deleteUnit(currentUser.id, unitId);
  }

  @ApiOperation({
    summary: 'Listar categorías',
    description: 'Lista categorías filtradas por clase de ítem.',
  })
  @ApiResponse({ status: 200, description: 'Lista de categorías.' })
  @Get('categories')
  getCategories(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('itemClass', new ParseEnumPipe(ItemClass)) itemClass: ItemClass,
  ) {
    return this.catalogService.getCategories(currentUser.id, itemClass);
  }

  @ApiOperation({ summary: 'Crear categoría' })
  @ApiResponse({ status: 201, description: 'Categoría creada.' })
  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  createCategory(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.catalogService.createCategory(
      currentUser.id,
      createCategoryDto,
    );
  }

  @ApiOperation({ summary: 'Actualizar categoría' })
  @ApiResponse({ status: 200, description: 'Categoría actualizada.' })
  @Patch('categories/:categoryId')
  updateCategory(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.catalogService.updateCategory(
      currentUser.id,
      categoryId,
      updateCategoryDto,
    );
  }

  @ApiOperation({ summary: 'Eliminar categoría' })
  @ApiResponse({ status: 204, description: 'Categoría eliminada.' })
  @Delete('categories/:categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategory(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
  ): Promise<void> {
    await this.catalogService.deleteCategory(currentUser.id, categoryId);
  }

  @ApiOperation({
    summary: 'Listar ítems',
    description: 'Lista todos los productos y servicios del negocio.',
  })
  @ApiResponse({ status: 200, description: 'Lista de ítems.' })
  @Get('items')
  getItems(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.catalogService.getItems(currentUser.id);
  }

  @ApiOperation({
    summary: 'Obtener ítem',
    description: 'Obtiene un producto o servicio por ID.',
  })
  @ApiResponse({ status: 200, description: 'Ítem encontrado.' })
  @Get('items/:itemId')
  getItemById(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ) {
    return this.catalogService.getItemById(currentUser.id, itemId);
  }

  @ApiOperation({ summary: 'Crear ítem' })
  @ApiResponse({ status: 201, description: 'Ítem creado.' })
  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  createItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createItemDto: CreateItemDto,
  ) {
    return this.catalogService.createItem(currentUser.id, createItemDto);
  }

  @ApiOperation({ summary: 'Actualizar ítem' })
  @ApiResponse({ status: 200, description: 'Ítem actualizado.' })
  @Patch('items/:itemId')
  updateItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    return this.catalogService.updateItem(
      currentUser.id,
      itemId,
      updateItemDto,
    );
  }

  @ApiOperation({ summary: 'Eliminar ítem' })
  @ApiResponse({ status: 204, description: 'Ítem eliminado.' })
  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<void> {
    await this.catalogService.deleteItem(currentUser.id, itemId);
  }
}
