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
      planPeriod: 'Monthly',
      enabledModuleIds: ['operaciones', 'clientes', 'pagos'],
    });

    await this.usersService.ensureDemoAccount({
      email: 'premium@emprendex.app',
      password: 'Premium123!',
      firstNames: 'Diego',
      lastNames: 'Mendoza',
      phone: '900333444',
      businessName: 'Taller Norte',
      businessCategory: 'Tecnología / Electrónica',
      planName: 'Premium',
      planPeriod: 'Monthly',
      enabledModuleIds: [
        'operaciones',
        'clientes',
        'productos',
        'cotizaciones',
        'pagos',
        'reportes',
      ],
    });
  }
}
