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
import { SkipThrottle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SKIP_ALL_THROTTLERS } from '../common/throttling/throttler.constants';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('Clientes')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'clientes', version: '1' })
@UseGuards(JwtAuthGuard)
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({ summary: 'Listar clientes' })
  @ApiResponse({ status: 200, description: 'Lista de clientes.' })
  @Get()
  list(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.customersService.list(currentUser.id);
  }

  @ApiOperation({ summary: 'Obtener cliente' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado.' })
  @Get(':customerId')
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
  ) {
    return this.customersService.findOne(currentUser.id, customerId);
  }

  @ApiOperation({ summary: 'Crear cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado.' })
  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(currentUser.id, dto);
  }

  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente actualizado.' })
  @Patch(':customerId')
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(currentUser.id, customerId, dto);
  }

  @ApiOperation({ summary: 'Eliminar cliente' })
  @ApiResponse({ status: 204, description: 'Cliente eliminado.' })
  @Delete(':customerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
  ): Promise<void> {
    await this.customersService.remove(currentUser.id, customerId);
  }
}
