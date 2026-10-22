import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { Prisma, ComplaintStatus, Role } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { DomainException } from '../../common/errors/domain.exceptions';
import { ErrorCodes } from '../../common/errors/error-codes';
import { releaseSeats } from 'src/common/helpers/release-seats';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getDetails(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, removedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isWarned: true,
        removedAt: true,
      },
    });
    if (!user) {
      throw new DomainException(
        ErrorCodes.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'User with id not found',
      );
    }

    return user;
  }

  async getMany(
    queryDto: UsersQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { isWarned, role, page = 1, limit = 10 } = queryDto;

    const where: Prisma.UserWhereInput = { removedAt: null };
    if (isWarned !== undefined) where.isWarned = isWarned;
    if (role) where.role = role;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isWarned: true,
          removedAt: true,
        },
      }),

      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      page,
      limit,
      total,
    };
  }

  async update(
    userId: string,
    updateDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId, removedAt: null },
    });
    if (!existingUser) {
      throw new DomainException(
        ErrorCodes.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'User with id not found',
      );
    }

    if (updateDto.email && updateDto.email !== existingUser.email) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email: updateDto.email },
      });
      if (emailTaken)
        throw new DomainException(
          ErrorCodes.EMAIL_TAKEN,
          HttpStatus.CONFLICT,
          'User with this email already exists',
        );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateDto,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isWarned: true,
        removedAt: true,
      },
    });
    return updatedUser;
  }

  async remove(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, removedAt: true, role: true },
      });

      if (!user) {
        throw new DomainException(
          ErrorCodes.RESOURCE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'User not found',
        );
      }
      if (user.removedAt) return;

      if (user.role === Role.EDUCATOR) {
        const ownedCourses = await tx.course.count({
          where: {
            educatorId: user.id,
            removedAt: null,
          },
        });
        if (ownedCourses > 0) {
          throw new DomainException(
            ErrorCodes.RELATED_RESOURCE_EXISTS,
            HttpStatus.CONFLICT,
            `User still owns ${ownedCourses} course(s). Reassign or delete them first.`,
          );
        }
      }

      await releaseSeats(tx, userId);

      await tx.complaint.updateMany({
        where: {
          studentId: userId,
          removedAt: null,
          status: { in: [ComplaintStatus.PENDING, ComplaintStatus.PROCESSING] },
        },
        data: { removedAt: new Date() },
      });

      await tx.user.update({
        where: { id: userId },
        data: { removedAt: new Date() },
      });
    });
  }
}
