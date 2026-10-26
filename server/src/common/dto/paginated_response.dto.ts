import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description: 'Items of the current page',
  })
  data: T[];

  @ApiProperty({ example: 1, description: 'Current page number (1-based)' })
  page: number;

  @ApiProperty({ example: 10, description: 'Maximum number of items per page' })
  limit: number;

  @ApiProperty({
    example: 42,
    description: 'Total number of items matching the query',
  })
  total: number;
}
