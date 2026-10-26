import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'ada.lovelace@example.com',
    format: 'email',
    description: 'Email address used for registration',
  })
  @IsEmail({}, { message: 'Enter valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
