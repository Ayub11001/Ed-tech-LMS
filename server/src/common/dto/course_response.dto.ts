import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class CourseResponseDto {
  @ApiProperty({
    example: 'Introduction to Algebra',
    description: 'Name of the course',
  })
  name: string;

  @ApiPropertyOptional({
    type: UserResponseDto,
    description: 'Educator owning the course (omitted in some responses)',
  })
  educator?: UserResponseDto; // null for a simpler return value in modules other than course and enrollment
}
