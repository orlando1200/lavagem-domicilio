import { Module } from '@nestjs/common';
import { LocalDiskAdapter } from './local-disk.adapter';
import { STORAGE_ADAPTER } from './storage.interface';

@Module({
  providers: [
    LocalDiskAdapter,
    { provide: STORAGE_ADAPTER, useExisting: LocalDiskAdapter },
  ],
  exports: [STORAGE_ADAPTER],
})
export class StorageModule {}
