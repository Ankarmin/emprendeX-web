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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@Controller({ path: 'clientes', version: '1' })
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.customersService.list(currentUser.id);
  }

  @Get(':customerId')
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
  ) {
    return this.customersService.findOne(currentUser.id, customerId);
  }

  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(currentUser.id, dto);
  }

  @Patch(':customerId')
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(currentUser.id, customerId, dto);
  }

  @Delete(':customerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
  ): Promise<void> {
    await this.customersService.remove(currentUser.id, customerId);
  }
}
