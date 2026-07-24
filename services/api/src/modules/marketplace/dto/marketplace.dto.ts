import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CatalogTarget, ProductStatus } from '@prisma/client';
import { CursorPaginationDto } from '../../../common/dto/pagination.dto';

export class CatalogQueryDto extends CursorPaginationDto {
  @ApiPropertyOptional({ description: 'Filtra por categoria do produto' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Busca por nome do produto' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateProductStatusDto {
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  status!: ProductStatus;

  @ApiPropertyOptional({
    description: 'Motivo obrigatorio quando status = rejected',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export { CatalogTarget };
