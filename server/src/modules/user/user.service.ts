import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { Prisma } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async getDetails(userId: string): Promise<UserResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId, removedAt: null },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                isWarned: true,
                removedAt: true
            }
        });
        if(!user) {
            throw new NotFoundException("User with id not found")
        }


        return user
    }

    async getMany(queryDto: UsersQueryDto): 
    Promise<UserResponseDto[]> {
        const {
            isSuspended,
            isWarned,
            role,
            page = 1,
            limit = 10
        } = queryDto;

        const where: Prisma.UserWhereInput = { removedAt: null };
        if(isWarned !== undefined) where.isWarned = isWarned;
        if(role) where.role = role;

        const users = await this.prisma.user.findMany({
            where,
            skip: ((page-1)*limit),
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                isWarned: true,
                removedAt: true
            }
        })
 
        return users
    }

    async update(userId: string, updateDto: UpdateUserDto): Promise<UserResponseDto> {
        const existingUser = await this.prisma.user.findUnique({
            where: { id: userId, removedAt: null }
        });
        if(!existingUser) {
            throw new NotFoundException("User with id not found");
        }

        if(updateDto.email && updateDto.email !== existingUser.email) {
            const emailTaken = await this.prisma.user.findUnique({
                where: { email: updateDto.email }
            });
            if(emailTaken) throw new ConflictException("User with this email already exists")
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId, },
            data: updateDto,
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                isWarned: true,
                removedAt: true
            }
        });
        return updatedUser

    }

    async remove(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { removedAt: new Date() }
        });
        return;
    }
}
