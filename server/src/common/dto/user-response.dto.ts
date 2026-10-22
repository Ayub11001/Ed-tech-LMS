import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
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
}
