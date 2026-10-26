import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({
    example: '1f9c8e1a-2b3c-4d5e-8f90-abcdef123456',
    format: 'uuid',
    description: 'Identifier of the educator who will own the course',
  })
  @IsNotEmpty()
  @IsUUID()
  educatorId: string;

  @ApiProperty({
    example: 'Introduction to Algebra',
    minLength: 5,
    maxLength: 75,
    description: 'Name of the course, unique per educator',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(75)
  name: string;

  @ApiProperty({
    example: 'Covers linear equations, polynomials and basic graphing.',
    minLength: 50,
    maxLength: 150,
    description: 'Description of the course',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(50)
  @MaxLength(150)
  description: string;
}
