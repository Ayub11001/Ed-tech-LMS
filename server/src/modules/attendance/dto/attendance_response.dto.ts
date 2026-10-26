import { ApiProperty } from '@nestjs/swagger';
import { CourseResponseDto } from 'src/common/dto/course_response.dto';
import { UserResponseDto } from 'src/common/dto/user-response.dto';

export class AttendanceResponseDto {
  @ApiProperty({
    example: '9b8a7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
    format: 'uuid',
    description: 'Unique identifier of the attendance record',
  })
  id: string;

  @ApiProperty({
    example: 12,
    description: 'Total number of lectures in the course',
  })
  totalLectures: number;

  @ApiProperty({
    example: 8,
    description: 'Number of lectures watched by the student',
  })
  watchedLectures: number;

  @ApiProperty({
    type: UserResponseDto,
    description: 'Student for this attendance record',
  })
  student: UserResponseDto;

  @ApiProperty({
    type: CourseResponseDto,
    description: 'Course for this attendance record',
  })
  course: CourseResponseDto;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: null,
    description: 'Timestamp when the attendance record was soft deleted',
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
