import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { CookieOptions, Response } from 'express';
import { AuthResponseDto } from './dto/auth-response.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) {}

    private readonly cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }

    @Post("register")
    async register(
        @Body() registerDto: RegisterDto,
        @Res({ passthrough: true }) res: Response
    ): Promise<AuthResponseDto> {
        const {
            authResponse,
            tokens
        } = await this.authService.register(registerDto);

        res.cookie("accessToken", tokens.accessToken, this.cookieOptions);
        res.cookie("refreshToken", tokens.refreshToken, this.cookieOptions);
        
        return authResponse
    }
}
