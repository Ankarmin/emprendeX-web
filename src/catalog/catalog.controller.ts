import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CatalogService } from './catalog.service';
import { CreateItemDto } from './dto/create-item.dto';

@Controller({ path: 'catalog', version: '1' })
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('units')
  getUnits(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.catalogService.getUnits(currentUser.id);
  }

  @Get('categories')
  getCategories(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.catalogService.getCategories(currentUser.id);
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
}
