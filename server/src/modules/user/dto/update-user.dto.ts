import { IsEmail, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class UpdateUserDto {
    @IsEmail()
    @IsOptional()
    email?: string

    @IsString()
    @IsOptional()
    fullName?: string
    
    @IsString()
    @MinLength(8, {message: "Password must be atleast 8 characters"})
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%.*?&])[A-Za-z\d@$!%*?.&]/,
        {
            message:
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        }
    )
    password?: string
}