import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
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
      jwtFromRequest: (req: Request): string | null => {
        const cookies = req.cookies as
          | Record<string, string | undefined>
          | undefined;
        return cookies?.refreshToken ?? null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET')!,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        removedAt: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.removedAt) throw new UnauthorizedException('Account removed');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
