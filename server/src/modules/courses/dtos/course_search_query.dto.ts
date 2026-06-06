import { Type } from "class-transformer";
import { IsInt, IsOptional, IsPositive, IsString, Max } from "class-validator";

export class CourseSearchQueryDto {
    @IsOptional()
    @IsString()
    search: string;

    @IsInt()
    @IsPositive()
    @IsOptional()
    @Max(50)
    @Type(() => Number)
    limit: number = 10;

    @IsInt()
    @IsPositive()
    @IsOptional()
    @Type(() => Number)
    page: number = 1;
}