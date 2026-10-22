import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginatedSearchQueryDto } from 'src/common/dto/paginated_search_query.dto';

export class ComplaintSearchQueryDto extends PaginatedSearchQueryDto {
  @ApiPropertyOptional({
    example: 'Ada',
    description: 'Filter complaints by student full name',
  })
  @IsOptional()
  @IsString()
  studentName: string;

  @ApiPropertyOptional({
    example: 'Lovelace',
    description: 'Filter complaints by educator full name',
  })
  @IsOptional()
  @IsString()
  educatorName: string;

  @ApiPropertyOptional({
    example: 'syllabus',
    maxLength: 75,
    description: 'Filter complaints by reason text',
  })
  @IsOptional()
  @IsString()
  @MaxLength(75)
  reason: string;
}
