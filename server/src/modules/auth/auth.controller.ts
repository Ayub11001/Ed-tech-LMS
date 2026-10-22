import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { CookieOptions, Response } from 'express';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenGuard } from './guards/jwt-refresh.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { ApiAuth } from 'src/common/swagger/decorators/api-auth.decorator';
import { ApiErrorResponses } from 'src/common/swagger/decorators/api-error-responses.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private readonly cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  @Post('register')
  @ApiOperation({
    summary: 'Register a new student',
    description:
      'Creates a student account and issues accessToken/refreshToken cookies on success.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Student registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already taken' })
  @ApiErrorResponses({ 409: 'Email already taken' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { authResponse, tokens } =
      await this.authService.register(registerDto);

    if (tokens) {
      res.cookie('accessToken', tokens.accessToken, this.cookieOptions);
      res.cookie('refreshToken', tokens.refreshToken, this.cookieOptions);
    }

    return authResponse;
  }

  @Post('register/educator')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'Register a new educator (admin only)',
    description:
      'Creates an educator account. Requires an authenticated admin.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Educator registered successfully',
    type: AuthResponseDto,
  })
  @ApiErrorResponses({ 409: 'Email already taken' })
  async registerEducator(
    @Body() registedDto: RegisterDto,
  ): Promise<AuthResponseDto> {
    const { authResponse } = await this.authService.register(
      registedDto,
      Role.EDUCATOR,
      false,
    );

    return authResponse;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates the user and issues accessToken/refreshToken cookies.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiErrorResponses({ 401: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { authResponse, tokens } = await this.authService.login(loginDto);

    res.cookie('accessToken', tokens.accessToken, this.cookieOptions);
    res.cookie('refreshToken', tokens.refreshToken, this.cookieOptions);
    return authResponse;
  }

  @Post('refresh-tokens')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access and refresh tokens',
    description: 'Uses the refreshToken cookie to issue new tokens.',
  })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiErrorResponses({ 401: 'Invalid or expired refresh token' })
  async refreshToken(
    @Res({ passthrough: true }) res: Response,
    @GetUser('id') userId: string,
  ): Promise<AuthResponseDto> {
    const { authResponse, tokens } =
      await this.authService.refreshTokens(userId);

    res.cookie('accessToken', tokens.accessToken, this.cookieOptions);
    res.cookie('refreshToken', tokens.refreshToken, this.cookieOptions);

    return authResponse;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiAuth()
  @ApiOperation({
    summary: 'Logout the current user',
    description: 'Revokes the refresh token and clears auth cookies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully' },
      },
      required: ['message'],
    },
  })
  @ApiErrorResponses()
  async logout(
    @Res({ passthrough: true }) res: Response,
    @GetUser('id') userId: string,
  ): Promise<{ message: string }> {
    await this.authService.logout(userId);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { message: 'Logged out successfully' };
  }
}
