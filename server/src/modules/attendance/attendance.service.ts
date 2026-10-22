import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceResponseDto } from './dto/attendance_response.dto';
import { PaginatedSearchQueryDto } from 'src/common/dto/paginated_search_query.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { Prisma } from '@prisma/client';
import { DomainException } from '../../common/errors/domain.exceptions';
import { ErrorCodes } from '../../common/errors/error-codes';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string): Promise<AttendanceResponseDto> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id, removedAt: null },
      include: {
        student: {
          select: { fullName: true, email: true },
        },
        course: {
          select: { name: true },
        },
      },
    });
    if (!attendance) {
      throw new DomainException(
        ErrorCodes.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Attendance with id not found',
      );
    }
    return attendance;
  }

  async getByStudent(studentId: string): Promise<AttendanceResponseDto[]> {
    const attendances = await this.prisma.attendance.findMany({
      where: { studentId, removedAt: null },
      include: {
        student: { select: { fullName: true, email: true } },
        course: { select: { name: true } },
      },
    });
    return attendances;
  }

  async getByCourse(
    courseId: string,
    dto: PaginatedSearchQueryDto,
  ): Promise<PaginatedResponseDto<AttendanceResponseDto>> {
    const { page, limit } = dto;

    const existingCourse = await this.prisma.course.findUnique({
      where: { id: courseId, removedAt: null },
    });
    if (!existingCourse) {
      throw new DomainException(
        ErrorCodes.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Course with id not found',
      );
    }

    const [attendances, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where: { courseId, removedAt: null },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          student: {
            select: { fullName: true, email: true },
          },
          course: {
            select: { name: true },
          },
        },
      }),

      this.prisma.attendance.count({
        where: { courseId, removedAt: null },
      }),
    ]);

    return {
      data: attendances,
      page,
      limit,
      total,
    };
  }

  async getAll(
    dto: PaginatedSearchQueryDto,
  ): Promise<PaginatedResponseDto<AttendanceResponseDto>> {
    const { search, page, limit } = dto;
    const where: Prisma.AttendanceWhereInput = { removedAt: null };
    if (search)
      where.student = {
        fullName: { contains: search, mode: 'insensitive' },
      };

    const [attendances, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          student: {
            select: { fullName: true, email: true },
          },
          course: {
            select: {
              name: true,
              educator: {
                select: { fullName: true, email: true },
              },
            },
          },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);
    return {
      data: attendances,
      page,
      limit,
      total,
    };
  }
}
