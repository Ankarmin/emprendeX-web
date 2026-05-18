import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ProductosServiciosService } from './catalog.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Controller({ path: 'productos-servicios', version: '1' })
@UseGuards(JwtAuthGuard)
export class ProductosServiciosController {
  constructor(
    private readonly productosServiciosService: ProductosServiciosService,
  ) {}

  @Get('units')
  getUnits(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.productosServiciosService.getUnits(currentUser.id);
  }

  @Get('categories')
  getCategories(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.productosServiciosService.getCategories(currentUser.id);
  }

  @Get('items')
  getItems(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.productosServiciosService.getItems(currentUser.id);
  }

  @Get('items/:itemId')
  getItemById(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ) {
    return this.productosServiciosService.getItemById(currentUser.id, itemId);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  createItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createItemDto: CreateItemDto,
  ) {
    return this.productosServiciosService.createItem(
      currentUser.id,
      createItemDto,
    );
  }

  @Patch('items/:itemId')
  updateItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    return this.productosServiciosService.updateItem(
      currentUser.id,
      itemId,
      updateItemDto,
    );
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<void> {
    await this.productosServiciosService.deleteItem(currentUser.id, itemId);
  }
}
