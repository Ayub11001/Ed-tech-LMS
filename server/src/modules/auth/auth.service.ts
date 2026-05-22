import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import bcrypt from "bcrypt"
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService
    ) {

    }
    private readonly SALT_ROUNDS = 12;

    async register(registerDto: RegisterDto): Promise<{
        authResponse: AuthResponseDto, 
        tokens : {
            accessToken: string;
            refreshToken: string
        }
    }> {
        const {
            email,
            fullName,
            password
        } = registerDto;

        const existingUser = await this.prisma.user.findFirst({
            where: {email, fullName}
        });
        if(existingUser) {
            throw new ConflictException("User with email and name already exists")
        }

        try {

            const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS)
            
            const user = await this.prisma.user.create({
                data: {
                    fullName,
                    email,
                    password: hashedPassword
                },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                }
            });

            const tokens = await this.generateTokens(user.id, user.email, user.role);
            const hashedToken = await bcrypt.hash(tokens.refreshToken, this.SALT_ROUNDS);

            await this.prisma.user.update({
                where: {id: user.id},
                data: { refreshToken: hashedToken }
            });

            return {
                authResponse: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role
                },
                tokens
            }

        } catch (error) {
            console.error('Error during registration\n Error: ', error);
            throw new InternalServerErrorException('Registration failed')            
        }
    }

    private async generateTokens(id: string, email: string, role: Role): Promise<{ 
        accessToken: string, refreshToken: string 
    }> {
        const payload = {
            sub: id,
            email: email,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync({...payload, role: role}, { expiresIn: "60m" }),
            this.jwtService.signAsync(payload, { expiresIn: "7d" }),
        ]);

        return {
            accessToken,
            refreshToken
        }
    }
}
