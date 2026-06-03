import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import bcrypt from "bcrypt"
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {

    }
    private readonly SALT_ROUNDS = 12;

    async register(registerDto: RegisterDto, role: Role = Role.STUDENT, generateTokens: boolean = true): Promise<{
        authResponse: AuthResponseDto, 
        tokens? : {
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
            where: {email,}
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
                    password: hashedPassword,
                    role,
                },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                }
            });

            if(!generateTokens) {
                return {
                    authResponse: user
                }
            }

            const tokens = await this.generateTokens(user.id, user.email);
            const hashedToken = await bcrypt.hash(tokens.refreshToken, 8);

            await this.prisma.user.update({
                where: {id: user.id},
                data: { refreshToken: hashedToken }
            });

            return {
                authResponse: user,
                tokens
            }

        } catch (error) {
            console.error('Error during registration\n Error: ', error);
            throw new InternalServerErrorException('Registration failed')            
        }
    }

    async login(loginDto: LoginDto): Promise<{
        authResponse: AuthResponseDto, 
        tokens : {
            accessToken: string;
            refreshToken: string;
        }
    }> {
        const {email, password} = loginDto;
        const existingUser = await this.prisma.user.findUnique({
            where: {email, isSuspended: false, removedAt: null},
            select: {
                id: true,
                password: true,
            }
        });
        if(!existingUser) {
            throw new UnauthorizedException("Invalid credentials")
        }


        const validPassword = await bcrypt.compare(password, existingUser.password);
        if(!validPassword) {
            throw new UnauthorizedException("Invalid credentials")
        }

        const tokens = await this.generateTokens(existingUser.id, email);
        const hashedToken = await bcrypt.hash(tokens.refreshToken, 8)
        const user = await this.prisma.user.update({
            where: {id: existingUser.id},
            data: { refreshToken: hashedToken, },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
            }
        });

        return {
            authResponse: user,
            tokens
        }
    }

    async refreshTokens(userId: string): Promise<{
        authResponse: AuthResponseDto, 
        tokens : {
            accessToken: string;
            refreshToken: string;
        }
    }> {
        const user = await this.prisma.user.findUnique({
            where: {id: userId},
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
            }
        });
        if(!user) {
            throw new NotFoundException("user not found")
        }

        const tokens = await this.generateTokens(userId, user.email);
        const hashedToken = await bcrypt.hash(tokens.refreshToken, 8);
        try {
            await this.prisma.user.update({
                where:{id: userId},
                data: { refreshToken: hashedToken }
            });
        } catch (error) {
            throw new InternalServerErrorException("Error while updating refresh token")
        }

        return {
            authResponse: user,
            tokens
        }
    }

    async logout(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: {id: userId},
            data: { refreshToken: null }
        })
    }

    private async generateTokens(id: string, email: string): Promise<{ 
        accessToken: string, refreshToken: string 
    }> {
        const payload = {
            sub: id,
            email: email,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, { expiresIn: "60m" }),
            this.jwtService.signAsync(payload, { expiresIn: "7d", secret: this.configService.get<string>("JWT_REFRESH_SECRET") }),
        ]);

        return {
            accessToken,
            refreshToken
        }
    }
}
