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
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
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

@Controller({ path: 'catalogo', version: '1' })
@UseGuards(JwtAuthGuard)
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('units')
  getUnits(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('itemClass', new ParseEnumPipe(ItemClass)) itemClass: ItemClass,
  ) {
    return this.catalogService.getUnits(currentUser.id, itemClass);
  }

  @Post('units')
  @HttpCode(HttpStatus.CREATED)
  createUnit(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createUnitDto: CreateUnitDto,
  ) {
    return this.catalogService.createUnit(currentUser.id, createUnitDto);
  }

  @Patch('units/:unitId')
  updateUnit(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Body() updateUnitDto: UpdateUnitDto,
  ) {
    return this.catalogService.updateUnit(currentUser.id, unitId, updateUnitDto);
  }

  @Delete('units/:unitId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUnit(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
  ): Promise<void> {
    await this.catalogService.deleteUnit(currentUser.id, unitId);
  }

  @Get('categories')
  getCategories(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('itemClass', new ParseEnumPipe(ItemClass)) itemClass: ItemClass,
  ) {
    return this.catalogService.getCategories(currentUser.id, itemClass);
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  createCategory(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.catalogService.createCategory(currentUser.id, createCategoryDto);
  }

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

  @Delete('categories/:categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategory(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
  ): Promise<void> {
    await this.catalogService.deleteCategory(currentUser.id, categoryId);
  }

  @Get('items')
  getItems(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.catalogService.getItems(currentUser.id);
  }

  @Get('items/:itemId')
  getItemById(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ) {
    return this.catalogService.getItemById(currentUser.id, itemId);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  createItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createItemDto: CreateItemDto,
  ) {
    return this.catalogService.createItem(currentUser.id, createItemDto);
  }

  @Patch('items/:itemId')
  updateItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    return this.catalogService.updateItem(currentUser.id, itemId, updateItemDto);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<void> {
    await this.catalogService.deleteItem(currentUser.id, itemId);
  }
}
