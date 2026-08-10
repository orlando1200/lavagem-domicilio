import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from '../../users/dto/create-user.dto';

const PUBLIC_REGISTER_ROLES = [UserRole.CLIENTE, UserRole.LAVADOR] as const;

/**
 * Reaproveita o shape do CreateUserDto do modulo de usuarios para o
 * registro publico via /auth/register, mas restringe `role` a
 * CLIENTE/LAVADOR — ADMIN so pode ser concedido por um admin existente
 * via PATCH /admin/users/:id/role, nunca por auto-registro publico
 * (endpoint sem guard nenhum, achado como bug real de escalonamento de
 * privilegio: `role` aceitava qualquer valor de UserRole, inclusive
 * ADMIN, sem exigir autenticacao).
 */
export class RegisterDto extends CreateUserDto {
  @ApiProperty({ enum: PUBLIC_REGISTER_ROLES })
  @IsIn(PUBLIC_REGISTER_ROLES)
  role: UserRole;
}
