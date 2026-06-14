import { ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { Prisma, User, ComplaintStatus } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';

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
    Promise<PaginatedResponseDto<UserResponseDto>> {
        const {
            isWarned,
            role,
            page = 1,
            limit = 10
        } = queryDto;

        const where: Prisma.UserWhereInput = { removedAt: null };
        if(isWarned !== undefined) where.isWarned = isWarned;
        if(role) where.role = role;

        const [users, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
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
            }),

            this.prisma.user.count({ where }),
        ]) 
 
        return {
            data: users,
            page,
            limit,
            total
        }
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
        try {
            await this.prisma.$transaction([
                this.prisma.enrollment.updateMany({
                    where: { studentId: userId },
                    data: { removedAt: new Date() }
                }),
                this.prisma.attendance.updateMany({
                    where: { studentId: userId },
                    data: { removedAt: new Date() }
                }),
                this.prisma.complaint.updateMany({
                    where: { 
                        studentId: userId, 
                        status: {
                            in:  [ComplaintStatus.PENDING, ComplaintStatus.PROCESSING], 
                        },
                    },
                    data: { removedAt: new Date() }
                }),
                this.prisma.user.update({
                    where: { id: userId },
                    data: { removedAt: new Date() }
                })
            ]);
        } catch (error) {
            if(error instanceof HttpException) throw error
            if(error.code === "P2025") throw new NotFoundException("User not found")
            throw new InternalServerErrorException("")
        }
    }
}
