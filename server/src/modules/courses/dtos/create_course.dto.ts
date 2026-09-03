import { IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateCourseDto {
    @IsNotEmpty()
    @IsUUID()
    educatorId: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(5)
    @MaxLength(75)
    name: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(50)
    @MaxLength(150)
    description: string;
}