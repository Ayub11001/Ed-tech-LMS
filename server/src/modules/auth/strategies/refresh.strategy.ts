import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import bcrypt from 'bcrypt';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const cookies = req.cookies as
            | Record<string, string | undefined>
            | undefined;
          return cookies?.refreshToken ?? null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; email: string }) {
    const cookies = req.cookies as
      | Record<string, string | undefined>
      | undefined;
    const refreshToken: string | undefined = cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        refreshToken: true,
        removedAt: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    if (!user.refreshToken)
      throw new UnauthorizedException('Session expired, login again');
    if (user.removedAt) throw new UnauthorizedException('Account removed');

    const verifyRefreshToken = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!verifyRefreshToken) {
      throw new UnauthorizedException('Invalid refresh-token');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
