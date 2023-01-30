import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { ItemsModule } from './items/items.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ProfileModule,
    ItemsModule,
    OrdersModule,
  ]
})
export class DomainsModule {}
