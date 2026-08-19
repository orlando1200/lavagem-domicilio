import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { MarketplaceService } from './marketplace.service';
import { FitmentImportService } from './fitment-import.service';
import {
  AdminListProductsDto,
  ReplaceFitmentsDto,
  UpdateProductStatusDto,
  UpdateStoreStatusDto,
} from './dto/marketplace.dto';

const MAX_CSV_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

@ApiTags('admin-marketplace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/marketplace')
export class MarketplaceAdminController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly fitmentImportService: FitmentImportService,
  ) {}

  @Get('stores')
  listStores() {
    return this.marketplaceService.listStoresForAdmin();
  }

  @Patch('stores/:id/status')
  updateStoreStatus(@Param('id') id: string, @Body() dto: UpdateStoreStatusDto) {
    return this.marketplaceService.updateStoreStatus(id, dto);
  }

  @Get('products')
  listProducts(@Query() query: AdminListProductsDto) {
    return this.marketplaceService.listProductsForAdmin(query);
  }

  @Patch('products/:id/status')
  updateProductStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProductStatusDto,
  ) {
    return this.marketplaceService.updateProductStatus(id, dto);
  }

  @Get('products/:id/fitments')
  listProductFitments(@Param('id') id: string) {
    return this.marketplaceService.listProductFitments(id);
  }

  @Post('products/:id/fitments')
  replaceProductFitments(@Param('id') id: string, @Body() dto: ReplaceFitmentsDto) {
    return this.marketplaceService.replaceProductFitments(id, dto);
  }

  @Delete('products/:id/fitments/:fitmentId')
  removeProductFitment(@Param('id') id: string, @Param('fitmentId') fitmentId: string) {
    return this.marketplaceService.removeProductFitment(id, fitmentId);
  }

  @Post('fitments/import')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Import CSV de compatibilidade em massa (colunas: sku, marca, modelo, ano_de, ano_ate, universal). ' +
      'Aditivo — adiciona regras novas sem apagar as ja cadastradas.',
  })
  @UseInterceptors(FileInterceptor('file'))
  importFitments(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio');
    }
    if (file.size > MAX_CSV_SIZE_BYTES) {
      throw new BadRequestException('Arquivo excede o tamanho maximo de 2MB');
    }

    return this.fitmentImportService.importCsv(file.buffer);
  }
}
