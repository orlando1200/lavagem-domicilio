import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { CreateStoreProductDto } from './dto/create-store-product.dto';

@ApiTags('stores')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  createStore(@Body() dto: CreateStoreDto) {
    return this.storeService.createStore(dto);
  }

  @Get(':id')
  getStore(@Param('id') id: string) {
    return this.storeService.findStoreById(id);
  }

  @Post(':id/products')
  createProduct(
    @Param('id') storeId: string,
    @Body() dto: CreateStoreProductDto,
  ) {
    return this.storeService.createProduct(storeId, dto);
  }

  @Get(':id/products')
  listProducts(@Param('id') storeId: string) {
    return this.storeService.listProductsByStore(storeId);
  }
}
