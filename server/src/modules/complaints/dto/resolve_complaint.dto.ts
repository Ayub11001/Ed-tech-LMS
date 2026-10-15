import { IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class ResolveComplaintDto {
  @IsIn(['WARNED', 'REMOVED'])
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  resolution: 'WARNED' | 'REMOVED';

  @IsIn([1, 2, 3])
  @IsOptional()
  @Transform(({ value }) => Number(value))
  deduction?: 1 | 2 | 3 = 1;
}
