import { CreateUserDto } from '../../users/dto/create-user.dto';

/**
 * Reaproveita o shape do CreateUserDto do modulo de usuarios para o
 * registro publico via /auth/register.
 */
export class RegisterDto extends CreateUserDto {}
