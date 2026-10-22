import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, Max } from 'class-validator';

export class PaginatedSearchQueryDto {
  @ApiPropertyOptional({
    example: 'mathematics',
    description: 'Free-text search term matched against the resource name',
  })
  @IsOptional()
  @IsString()
  search: string;

  @ApiPropertyOptional({
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
    description: 'Maximum number of items returned per page',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Max(50)
  @Type(() => Number)
  limit: number = 10;

  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    default: 1,
    description: 'Page number to return (1-based)',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  page: number = 1;
}
