import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorCodes, type ErrorCode } from './error-codes';

export class ErrorEnvelopeDto {
  @ApiProperty({
    example: 404,
    description: 'HTTP status code of the response',
  })
  statusCode: number;

  @ApiProperty({
    example: ErrorCodes.RESOURCE_NOT_FOUND,
    enum: Object.values(ErrorCodes),
    enumName: 'ErrorCode',
    description: 'Stable machine-readable error code',
  })
  error: ErrorCode;

  @ApiProperty({
    example: 'Course with given ID not found',
    description: 'Human-readable error description',
  })
  message: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    example: [
      { field: 'name', messages: ['name must be longer than 3 characters'] },
    ],
    description:
      'Optional structured details, e.g. per-field validation messages or conflicting fields',
  })
  details?: unknown[];

  @ApiProperty({
    example: '2026-10-21T16:20:36.000Z',
    description: 'ISO-8601 timestamp of when the error occurred',
  })
  timestamp: string;

  @ApiProperty({
    example: '/api/v1/courses/1f9c8e1a-2b3c-4d5e-8f90-abcdef123456',
    description: 'Request path that produced the error',
  })
  path: string;

  @ApiProperty({
    example: 'a1b2c3d4e5f6',
    description: 'Correlation id, also echoed in the `x-request-id` header',
  })
  requestId: string;
}
