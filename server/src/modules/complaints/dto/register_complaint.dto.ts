import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterComplaintDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    @MinLength(20)
    reason: string;
}