import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentResponseDto } from './dto/enrollment_response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { PaginatedSearchQueryDto } from 'src/common/dto/paginated_search_query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create({
    studentId,
    courseId,
  }: {
    studentId: string;
    courseId: string;
  }): Promise<EnrollmentResponseDto> {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });
      if (!course) throw new NotFoundException('Invalid courseId');

      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.enrollment.findUnique({
          where: {
            studentId_courseId: { studentId, courseId },
            removedAt: null,
          },
        });
        if (existing)
          throw new ConflictException('Already enrolled in this course');

        const claimed = await tx.course.updateMany({
          where: {
            id: courseId,
            enrollmentCount: { lt: course.maxSeats },
          },
          data: {
            enrollmentCount: { increment: 1 },
          },
        });
        if (claimed.count === 0) {
          throw new BadRequestException('Course capacity full');
        }

        const enrollment = await tx.enrollment.create({
          data: { studentId, courseId },
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
        });

        await tx.attendance.create({
          data: { studentId, courseId },
        });
        return enrollment;
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('');
    }
  }

  async getById(id: string): Promise<EnrollmentResponseDto> {
    try {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id, removedAt: null },
        include: {
          student: {
            select: {
              fullName: true,
              email: true,
            },
          },
          course: {
            select: {
              name: true,
              educator: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      });
      if (!enrollment) {
        throw new NotFoundException('Enrollment not found');
      }
      return enrollment;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('');
    }
  }

  async getMyEnrollments(studentId: string): Promise<EnrollmentResponseDto[]> {
    try {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { studentId, removedAt: null },
        include: {
          student: {
            select: {
              fullName: true,
              email: true,
            },
          },
          course: {
            select: {
              name: true,
              educator: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      });
      return enrollments;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async getByCourse(
    courseId: string,
    dto: PaginatedSearchQueryDto,
  ): Promise<PaginatedResponseDto<EnrollmentResponseDto>> {
    const { page, limit } = dto;

    try {
      const [enrollments, total] = await this.prisma.$transaction([
        this.prisma.enrollment.findMany({
          where: {
            courseId,
            removedAt: null,
          },
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
          skip: (page - 1) * limit,
          take: limit,
        }),

        this.prisma.enrollment.count({
          where: { courseId, removedAt: null },
        }),
      ]);

      return {
        data: enrollments,
        total,
        limit,
        page,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async getAll(
    dto: PaginatedSearchQueryDto,
  ): Promise<PaginatedResponseDto<EnrollmentResponseDto>> {
    const { search, page, limit } = dto;

    const where: Prisma.EnrollmentWhereInput = { removedAt: null };
    if (search)
      where.course = { name: { contains: search, mode: 'insensitive' } };

    try {
      const [enrollments, total] = await this.prisma.$transaction([
        this.prisma.enrollment.findMany({
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

        this.prisma.enrollment.count({ where }),
      ]);

      return {
        data: enrollments,
        page,
        limit,
        total,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async removeById(id: string) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const enrollment = await tx.enrollment.update({
          where: { id, removedAt: null },
          data: { removedAt: new Date() },
          select: { studentId: true, courseId: true },
        });

        await tx.attendance.update({
          where: {
            studentId_courseId: {
              studentId: enrollment.studentId,
              courseId: enrollment.courseId,
            },
            removedAt: null,
          },
          data: { removedAt: new Date() },
        });

        const remove = await tx.course.updateMany({
          where: {
            id: enrollment.courseId,
            enrollmentCount: { gt: 0 },
          },
          data: {
            enrollmentCount: { decrement: 1 },
          },
        });
        if (remove.count === 0) {
          throw new BadRequestException("Could'nt remove the enrollment");
        }
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('Enrollment not found');
      throw new InternalServerErrorException();
    }
  }

  async removeByStudent({
    studentId,
    courseId,
  }: {
    studentId: string;
    courseId: string;
  }) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const enrollment = await tx.enrollment.update({
          where: {
            studentId_courseId: { studentId, courseId },
            removedAt: null,
          },
          data: { removedAt: new Date() },
        });

        await tx.attendance.update({
          where: {
            studentId_courseId: { studentId, courseId },
            removedAt: null,
          },
          data: { removedAt: new Date() },
        });

        const remove = await tx.course.updateMany({
          where: {
            id: enrollment.courseId,
            enrollmentCount: { gt: 0 },
          },
          data: {
            enrollmentCount: { decrement: 1 },
          },
        });
        if (remove.count === 0) {
          throw new BadRequestException("Could'nt remove the enrollment");
        }
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('Enrollment not found');
      throw new InternalServerErrorException('');
    }
  }
}
