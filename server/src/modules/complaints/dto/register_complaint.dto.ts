import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterComplaintDto {
  @ApiProperty({
    example: 'The course material does not match the syllabus at all.',
    minLength: 20,
    maxLength: 500,
    description: 'Reason for filing the complaint',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @MinLength(20)
  reason: string;
}
