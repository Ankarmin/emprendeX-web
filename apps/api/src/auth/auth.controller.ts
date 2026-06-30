import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SKIP_ALL_THROTTLERS } from '../common/throttling/throttler.constants';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './types/authenticated-user.type';

@ApiTags('Autenticación')
@Controller({ path: 'auth', version: '1' })
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Iniciar sesión', description: 'Autentica al usuario con email y contraseña. Retorna token JWT y datos del perfil.' })
  @ApiResponse({ status: 200, description: 'Login exitoso. Retorna accessToken y datos del usuario.' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Registrar nuevo negocio', description: 'Crea un nuevo usuario junto con su negocio.' })
  @ApiResponse({ status: 201, description: 'Registro exitoso.' })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener mi perfil', description: 'Retorna el perfil del usuario autenticado.' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario.' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.authService.me(currentUser.id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar mi perfil', description: 'Actualiza los datos del perfil del usuario autenticado.' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado.' })
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() updateMeDto: UpdateMeDto,
  ) {
    return this.authService.updateMe(currentUser.id, updateMeDto);
  }
}
