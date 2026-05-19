import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class UsersBootstrapService implements OnModuleInit {
  constructor(private readonly usersService: UsersService) {}

  async onModuleInit(): Promise<void> {
    await this.usersService.ensureDemoAccount({
      email: 'basico@emprendex.app',
      password: 'Basico123!',
      firstNames: 'Carla',
      lastNames: 'Rojas',
      phone: '900111222',
      businessName: 'Dulce Taller',
      businessCategory: 'Pastelería personalizada',
      planName: 'Basic',
      enabledModuleIds: ['operaciones', 'clientes', 'contabilidad'],
    });

    await this.usersService.ensureDemoAccount({
      email: 'premium@emprendex.app',
      password: 'Pro123!',
      firstNames: 'Diego',
      lastNames: 'Mendoza',
      phone: '900333444',
      businessName: 'Taller Norte',
      businessCategory: 'Tecnología / Electrónica',
      planName: 'Pro',
      planPeriod: 'Monthly',
      enabledModuleIds: [
        'operaciones',
        'clientes',
        'productos',
        'cotizaciones',
        'contabilidad',
        'reportes',
      ],
    });

    await this.usersService.ensureProductosServiciosDefaultsForAllBusinesses();
  }
}
