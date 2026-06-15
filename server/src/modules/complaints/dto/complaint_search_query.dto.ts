import { IsOptional, IsString, MaxLength } from "class-validator";
import { PaginatedSearchQueryDto } from "src/common/dto/paginated_search_query.dto";

export class ComplaintSearchQueryDto extends PaginatedSearchQueryDto {

    @IsOptional()
    @IsString()
    studentName: string;

    @IsOptional()
    @IsString()
    educatorName: string;

    @IsOptional()
    @IsString()
    @MaxLength(75)
    reason: string;
}