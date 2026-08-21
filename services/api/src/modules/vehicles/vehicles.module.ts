import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { MockPlateLookupAdapter } from './plate-lookup/mock-plate-lookup.adapter';
import { PLATE_LOOKUP_GATEWAY } from './plate-lookup/plate-lookup-gateway.interface';
import { MockFiscalDebtAdapter } from './fiscal-debts/mock-fiscal-debt.adapter';
import { FISCAL_DEBT_GATEWAY } from './fiscal-debts/fiscal-debt-gateway.interface';

@Module({
  controllers: [VehiclesController],
  providers: [
    VehiclesService,
    MockPlateLookupAdapter,
    { provide: PLATE_LOOKUP_GATEWAY, useExisting: MockPlateLookupAdapter },
    MockFiscalDebtAdapter,
    { provide: FISCAL_DEBT_GATEWAY, useExisting: MockFiscalDebtAdapter },
  ],
})
export class VehiclesModule {}
