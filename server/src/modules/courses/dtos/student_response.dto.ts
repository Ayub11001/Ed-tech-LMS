import { ApiProperty } from '@nestjs/swagger';

export class StudentResponseDto {
  @ApiProperty({
    example: '2f7a8b9c-1d2e-3f4a-5b6c-7d8e9f0a1b2c',
    format: 'uuid',
    description: 'Unique identifier of the student',
  })
  id: string;

  @ApiProperty({
    example: 'Ada Lovelace',
    description: 'Full name of the student',
  })
  fullName: string;

  @ApiProperty({
    example: 'ada.lovelace@example.com',
    format: 'email',
    description: 'Email address of the student',
  })
  email: string;
}
