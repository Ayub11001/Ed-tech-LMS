import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AuthResponseDto {
  @ApiProperty({
    example: '2f7a8b9c-1d2e-3f4a-5b6c-7d8e9f0a1b2c',
    format: 'uuid',
    description: 'Unique identifier of the authenticated user',
  })
  id: string;

  @ApiProperty({
    example: 'ada.lovelace@example.com',
    format: 'email',
    description: 'Email address of the authenticated user',
  })
  email: string;

  @ApiProperty({
    example: 'Ada Lovelace',
    description: 'Full name of the authenticated user',
  })
  fullName: string;

  @ApiProperty({
    enum: Role,
    enumName: 'Role',
    example: Role.STUDENT,
    description: 'Role of the authenticated user',
  })
  role: Role;
}
