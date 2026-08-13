import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StarterKitService } from './starter-kit.service';
import {
  CreateStarterKitDto,
  ListStarterKitsQueryDto,
  UpdateStarterKitStatusDto,
} from './dto/starter-kit.dto';

@ApiTags('admin/starter-kits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/starter-kits')
export class AdminStarterKitController {
  constructor(private readonly starterKitService: StarterKitService) {}

  @Post()
  @ApiOperation({ summary: 'Cria/atribui um kit inicial para um lavador' })
  createStarterKit(@Body() dto: CreateStarterKitDto) {
    return this.starterKitService.createStarterKit(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista kits iniciais com filtros' })
  listStarterKits(@Query() query: ListStarterKitsQueryDto) {
    return this.starterKitService.listStarterKits(query);
  }

  @Get(':washerId')
  @ApiOperation({ summary: 'Detalhes do kit inicial de um lavador' })
  getStarterKit(@Param('washerId', ParseUUIDPipe) washerId: string) {
    return this.starterKitService.getStarterKitByWasherId(washerId);
  }

  @Patch(':washerId/status')
  @ApiOperation({ summary: 'Atualiza o status do kit inicial de um lavador' })
  updateStatus(
    @Param('washerId', ParseUUIDPipe) washerId: string,
    @Body() dto: UpdateStarterKitStatusDto,
  ) {
    return this.starterKitService.updateStatusAsAdmin(washerId, dto);
  }
}
