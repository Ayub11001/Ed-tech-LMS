import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { Request } from "express";
import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => req.cookies?.accessToken,
                ExtractJwt.fromAuthHeaderAsBearerToken() 
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET')!
        });
    }

    async validate(payload: { sub: string, email: string}) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: payload.sub
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                password: false,
                refreshToken: false,
                role: true,
                createdAt: true,
                updatedAt: true,
                removedAt: true,
            }
        });
        if(!user) throw new UnauthorizedException("User not found");
        if(user.removedAt) throw new UnauthorizedException("Account removed");  
        
        return user
    }
}