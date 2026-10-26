import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'ada.lovelace@example.com',
    format: 'email',
    description: 'New email address for the user',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'Ada Lovelace',
    description: 'New full name for the user',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    example: 'NewPassw0rd!',
    minLength: 8,
    description:
      'New password. Must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'Password must be atleast 8 characters' })
  @MaxLength(72, { message: 'Password must be at most 72 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%.*?&])[A-Za-z\d@$!%*?.&]{8,72}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password?: string;
}
