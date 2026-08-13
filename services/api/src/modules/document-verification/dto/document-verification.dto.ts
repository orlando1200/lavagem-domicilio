import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { DocumentVerificationStatus } from '@prisma/client';

export class CreateDocumentVerificationDto {
  @ApiProperty({ maxLength: 60, description: 'Tipo do documento (ex: cnh, crlv, foto_veiculo)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  docType: string;

  @ApiProperty({
    maxLength: 500,
    description:
      'URL do arquivo ja hospedado — sem infraestrutura de upload binario ainda, o lavador informa o link',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fileUrl: string;
}

export class ReviewDocumentVerificationDto {
  @ApiProperty({ enum: [DocumentVerificationStatus.approved, DocumentVerificationStatus.rejected] })
  @IsEnum(DocumentVerificationStatus)
  @IsIn([DocumentVerificationStatus.approved, DocumentVerificationStatus.rejected])
  status: DocumentVerificationStatus;
}

export class ListDocumentVerificationsQueryDto {
  @ApiPropertyOptional({ enum: DocumentVerificationStatus })
  @IsOptional()
  @IsEnum(DocumentVerificationStatus)
  status?: DocumentVerificationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Busca por nome/e-mail do usuario ou tipo do documento' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: string;
}
