import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Role } from "@prisma/client";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import bcrypt from "bcrypt";
import { PrismaService } from "src/modules/prisma/prisma.service";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService 
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => req.cookies?.refreshToken,
                ExtractJwt.fromAuthHeaderAsBearerToken()
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>("JWT_REFRESH_SECRET")!,
            passReqToCallback: true,
        });
    }

    async validate(
        req: Request, 
        payload: {sub: string, email: string, role: Role}
    ) {
        const refreshToken: string = req.cookies?.refreshToken;
        if(!refreshToken) {
            throw new UnauthorizedException("Refresh token not found")
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                role: true,
                refreshToken: true
            }
        });
        if(!user || !user.refreshToken) {
            throw new UnauthorizedException("Invalid reafrsh-token")
        }

        const verifyRefreshToken = await bcrypt.compare(
            refreshToken, user.refreshToken
        );
        if(!verifyRefreshToken) {
            throw new UnauthorizedException("Invalid refresh-token")
        }

        return {
            id: user.id,
            email: user.email,
            role: user.role
        }
    }
}