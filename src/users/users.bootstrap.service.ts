import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';

@Injectable()
export class UsersBootstrapService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = this.configService.get<string>('SEED_USER_EMAIL');
    const password = this.configService.get<string>('SEED_USER_PASSWORD');

    if (!email || !password) {
      return;
    }

    await this.usersService.ensureSeedUser({
      email,
      password,
    });
  }
}
