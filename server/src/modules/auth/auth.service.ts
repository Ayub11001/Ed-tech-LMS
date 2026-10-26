import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { DomainException } from '../../common/errors/domain.exceptions';
import { ErrorCodes } from '../../common/errors/error-codes';
import { lockUser, TX_OPTIONS } from '../../common/helpers/locks';
import { hashRefreshToken, verifyRefreshToken } from './helpers/refresh-token';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  private readonly SALT_ROUNDS = 12;

  async register(
    registerDto: RegisterDto,
    role: Role = Role.STUDENT,
    generateTokens: boolean = true,
  ): Promise<{
    authResponse: AuthResponseDto;
    tokens?: {
      accessToken: string;
      refreshToken: string;
    };
  }> {
    const { email, fullName, password } = registerDto;

    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });
    if (existingUser) {
      throw new DomainException(
        ErrorCodes.EMAIL_TAKEN,
        HttpStatus.CONFLICT,
        'User with email already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    if (!generateTokens) {
      return {
        authResponse: user,
      };
    }

    const tokens = await this.generateTokens(user.id, user.email);
    const hashedToken = await hashRefreshToken(
      tokens.refreshToken,
      this.SALT_ROUNDS,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedToken },
    });

    return {
      authResponse: user,
      tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<{
    authResponse: AuthResponseDto;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  }> {
    const { email, password } = loginDto;
    const existingUser = await this.prisma.user.findUnique({
      where: { email, removedAt: null },
      select: {
        id: true,
        password: true,
      },
    });
    if (!existingUser) {
      throw new DomainException(
        ErrorCodes.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
        'Invalid credentials',
      );
    }

    const validPassword = await bcrypt.compare(password, existingUser.password);
    if (!validPassword) {
      throw new DomainException(
        ErrorCodes.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
        'Invalid credentials',
      );
    }

    const tokens = await this.generateTokens(existingUser.id, email);
    const hashedToken = await hashRefreshToken(
      tokens.refreshToken,
      this.SALT_ROUNDS,
    );
    const user = await this.prisma.user.update({
      where: { id: existingUser.id },
      data: { refreshToken: hashedToken },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    return {
      authResponse: user,
      tokens,
    };
  }

  async refreshTokens(
    userId: string,
    presentedToken: string | undefined,
  ): Promise<{
    authResponse: AuthResponseDto;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  }> {
    return await this.prisma.$transaction(async (tx) => {
      if (!(await lockUser(tx, userId))) {
        throw new DomainException(
          ErrorCodes.UNAUTHORIZED,
          HttpStatus.UNAUTHORIZED,
          'Invalid or expired refresh token',
        );
      }

      const user = await tx.user.findUnique({
        where: { id: userId, removedAt: null },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          refreshToken: true,
        },
      });
      if (!user || !user.refreshToken || !presentedToken) {
        throw new DomainException(
          ErrorCodes.UNAUTHORIZED,
          HttpStatus.UNAUTHORIZED,
          'Invalid or expired refresh token',
        );
      }

      const validToken = await verifyRefreshToken(
        presentedToken,
        user.refreshToken,
      );
      if (!validToken) {
        throw new DomainException(
          ErrorCodes.UNAUTHORIZED,
          HttpStatus.UNAUTHORIZED,
          'Invalid or expired refresh token',
        );
      }

      const tokens = await this.generateTokens(user.id, user.email);
      const hashedToken = await hashRefreshToken(
        tokens.refreshToken,
        this.SALT_ROUNDS,
      );
      await tx.user.update({
        where: { id: user.id },
        data: { refreshToken: hashedToken },
      });

      const authResponse: AuthResponseDto = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      };

      return {
        authResponse,
        tokens,
      };
    }, TX_OPTIONS);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  private async generateTokens(
    id: string,
    email: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = {
      sub: id,
      email: email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '60m' }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
