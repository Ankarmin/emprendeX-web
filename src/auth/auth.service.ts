import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { AuthStateResponse } from './types/auth-state-response.type';
import { AuthSessionResponse } from './types/auth-session-response.type';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthSessionResponse> {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await compare(loginDto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildSessionResponse(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthSessionResponse> {
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      businessName: registerDto.businessName,
      businessCategory: registerDto.businessCategory,
      currencyCode: registerDto.currencyCode,
    });

    return this.buildSessionResponse(user);
  }

  async me(userId: string): Promise<AuthStateResponse> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    return this.buildAuthStateResponse(user);
  }

  private async buildSessionResponse(user: {
    id: string;
    email: string;
    businessName: string | null;
    businessCategory: string | null;
    currencyCode: string | null;
    onboardingCompleted: boolean;
    enabledModuleIds: string[];
  }): Promise<AuthSessionResponse> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    const publicUser = this.usersService.toPublicUser(user);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: Number(
        this.configService.get<number>('JWT_EXPIRES_IN', 86400),
      ),
      requiresOnboarding: !publicUser.onboardingCompleted,
      user: publicUser,
    };
  }

  private buildAuthStateResponse(user: {
    id: string;
    email: string;
    businessName: string | null;
    businessCategory: string | null;
    currencyCode: string | null;
    onboardingCompleted: boolean;
    enabledModuleIds: string[];
  }): AuthStateResponse {
    const publicUser = this.usersService.toPublicUser(user);

    return {
      requiresOnboarding: !publicUser.onboardingCompleted,
      user: publicUser,
    };
  }
}
