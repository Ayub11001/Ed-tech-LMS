import { ApiProperty } from '@nestjs/swagger';
import { CourseResponseDto } from 'src/common/dto/course_response.dto';
import { UserResponseDto } from 'src/common/dto/user-response.dto';

export class EnrollmentResponseDto {
  @ApiProperty({
    example: '5d4c3b2a-1e0f-9a8b-7c6d-5e4f3a2b1c0d',
    format: 'uuid',
    description: 'Unique identifier of the enrollment',
  })
  id: string;

  @ApiProperty({
    type: UserResponseDto,
    description: 'Student enrolled in the course',
  })
  student: UserResponseDto;

  @ApiProperty({
    type: CourseResponseDto,
    description: 'Course the student is enrolled in',
  })
  course: CourseResponseDto;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: null,
    description: 'Timestamp when the enrollment was soft deleted',
  })
  removedAt: Date | null;

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
