import { IsEmail, IsOptional } from "class-validator";

export class UpdateUserDto {
    @IsEmail()
    @IsOptional()
    email?: string

    @IsEmail()
    @IsOptional()
    fullName?: string
    
    @IsEmail()
    @IsOptional()
    password?: string
}