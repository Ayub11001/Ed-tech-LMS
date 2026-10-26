import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    example: '2f7a8b9c-1d2e-3f4a-5b6c-7d8e9f0a1b2c',
    format: 'uuid',
    description: 'Unique identifier of the user',
  })
  id: string;

  @ApiProperty({
    example: 'Ada Lovelace',
    description: 'Full name of the user',
  })
  fullName: string;

  @ApiProperty({
    example: 'ada.lovelace@example.com',
    format: 'email',
    description: 'Email address of the user',
  })
  email: string;

  @ApiProperty({
    enum: Role,
    enumName: 'Role',
    example: Role.STUDENT,
    description: 'Role assigned to the user',
  })
  role: Role;

  @ApiProperty({
    example: false,
    description: 'Indicates whether the user has been warned by an educator',
  })
  isWarned: boolean;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    example: null,
    description: 'Timestamp when the user was soft deleted',
  })
  removedAt: Date | null;
}
