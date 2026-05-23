import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { CookieOptions, Response } from 'express';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

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

       if(tokens) {
            res.cookie("accessToken", tokens.accessToken, this.cookieOptions);
            res.cookie("refreshToken", tokens.refreshToken, this.cookieOptions);
       }
        
        return authResponse
    }

    @Post("register/educator")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async registerEducator(
        @Body() registedDto: RegisterDto,
    ): Promise<AuthResponseDto> {
        const {authResponse, tokens} = await this.authService.register(registedDto, Role.EDUCATOR, false);

        return authResponse;
    }

    @Post("login")
    async login(
        @Body() loginDto: LoginDto,
        @Res({passthrough: true}) res: Response
    ): Promise<AuthResponseDto>  {

        const {authResponse, tokens} = await this.authService.login(loginDto);

        res.cookie("accessToken", tokens.accessToken, this.cookieOptions)
        res.cookie("refreshToken", tokens.refreshToken, this.cookieOptions);
        return authResponse;

    }

    
    
}
