import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { StoreModule } from './modules/store/store.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { AuthModule } from './modules/auth/auth.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { AuctionsModule } from './modules/auctions/auctions.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MapsModule } from './modules/maps/maps.module';
import { ZonesModule } from './modules/zones/zones.module';
import { StarterKitModule } from './modules/starter-kit/starter-kit.module';
import { SupportModule } from './modules/support/support.module';
import { RentalModule } from './modules/rental/rental.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    HealthModule,
    AuthModule,
    MarketplaceModule,
    StoreModule,
    UsersModule,
    VehiclesModule,
    AddressesModule,
    OrdersModule,
    DriversModule,
    CouponsModule,
    PayoutsModule,
    DeliveriesModule,
    AuctionsModule,
    LoyaltyModule,
    PaymentsModule,
    MapsModule,
    ZonesModule,
    StarterKitModule,
    SupportModule,
    RentalModule,
  ],
})
export class AppModule {}
