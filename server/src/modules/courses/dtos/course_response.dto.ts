import { ApiProperty } from '@nestjs/swagger';

export class EducatorResponseDto {
  @ApiProperty({
    example: 'Ada Lovelace',
    description: 'Full name of the educator',
  })
  fullName: string;

  @ApiProperty({
    example: 'ada.lovelace@example.com',
    format: 'email',
    description: 'Email address of the educator',
  })
  email: string;
}

export class CourseResponseDto {
  @ApiProperty({
    example: '1f9c8e1a-2b3c-4d5e-8f90-abcdef123456',
    format: 'uuid',
    description: 'Unique identifier of the course',
  })
  id: string;

  @ApiProperty({
    example: 'Introduction to Algebra',
    description: 'Name of the course',
  })
  name: string;

  @ApiProperty({
    example: 'Covers linear equations, polynomials and basic graphing.',
    description: 'Description of the course',
  })
  description: string;

  @ApiProperty({
    type: EducatorResponseDto,
    description: 'Educator owning the course',
  })
  educator: EducatorResponseDto;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-21T16:20:36.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-21T16:20:36.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
