import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { StoreModule } from './modules/store/store.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { AuthModule } from './modules/auth/auth.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    MarketplaceModule,
    StoreModule,
    UsersModule,
    OrdersModule,
    DriversModule,
    CouponsModule,
    PayoutsModule,
    DeliveriesModule,
  ],
})
export class AppModule {}
