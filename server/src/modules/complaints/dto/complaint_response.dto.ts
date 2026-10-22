import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintStatus } from '@prisma/client';
import { UserResponseDto } from 'src/common/dto/user-response.dto';

export class ComplaintResponseDto {
  @ApiProperty({
    example: '7a6b5c4d-3e2f-1a0b-9c8d-7e6f5a4b3c2d',
    format: 'uuid',
    description: 'Unique identifier of the complaint',
  })
  id: string;

  @ApiProperty({
    example: 'The course material does not match the syllabus.',
    description: 'Reason provided by the student',
  })
  reason: string;

  @ApiProperty({
    enum: ComplaintStatus,
    enumName: 'ComplaintStatus',
    example: ComplaintStatus.PENDING,
    description: 'Current status of the complaint',
  })
  status: ComplaintStatus;

  @ApiProperty({
    type: UserResponseDto,
    description: 'Student who filed the complaint',
  })
  student: UserResponseDto;

  @ApiProperty({
    type: UserResponseDto,
    description: 'Educator the complaint is against',
  })
  educator: UserResponseDto;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    example: null,
    description: 'Timestamp when the complaint was soft deleted',
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
