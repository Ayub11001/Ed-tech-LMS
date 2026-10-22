import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class ResolveComplaintDto {
  @ApiProperty({
    enum: ['WARNED', 'REMOVED'],
    enumName: 'ComplaintResolution',
    example: 'WARNED',
    description: 'Resolution action for the complaint',
  })
  @IsIn(['WARNED', 'REMOVED'])
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  resolution: 'WARNED' | 'REMOVED';

  @ApiPropertyOptional({
    enum: [1, 2, 3],
    example: 1,
    default: 1,
    description: 'Deduction applied when warning the educator (1-3)',
  })
  @IsIn([1, 2, 3])
  @IsOptional()
  @Transform(({ value }) => Number(value))
  deduction?: 1 | 2 | 3 = 1;
}
