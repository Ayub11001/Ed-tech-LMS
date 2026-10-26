import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentResponseDto } from './dto/enrollment_response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { PaginatedSearchQueryDto } from 'src/common/dto/paginated_search_query.dto';
import { Prisma, Role } from '@prisma/client';
import { DomainException } from '../../common/errors/domain.exceptions';
import { ErrorCodes } from '../../common/errors/error-codes';
import { TX_OPTIONS, lockCourse, lockUser } from 'src/common/helpers/locks';
import { releaseSeat } from 'src/common/helpers/release-seats';
import {
  assertCourseAccess,
  CourseRequester,
} from 'src/common/helpers/course-access';

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
    return await this.prisma.$transaction(async (tx) => {
      if (!(await lockUser(tx, studentId))) {
        throw new DomainException(
          ErrorCodes.RESOURCE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Student not found',
        );
      }

      const student = await tx.user.findUnique({
        where: { id: studentId, removedAt: null, role: Role.STUDENT },
        select: { id: true },
      });
      if (!student) {
        throw new DomainException(
          ErrorCodes.RESOURCE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Student not found',
        );
      }

      if (!(await lockCourse(tx, courseId))) {
        throw new DomainException(
          ErrorCodes.RESOURCE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Invalid courseId',
        );
      }

      const course = await tx.course.findUnique({
        where: { id: courseId, removedAt: null },
        select: { maxSeats: true },
      });
      if (!course) {
        throw new DomainException(
          ErrorCodes.RESOURCE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Invalid courseId',
        );
      }

      const existing = await tx.enrollment.findUnique({
        where: {
          studentId_courseId: { studentId, courseId },
        },
        select: { id: true, removedAt: true },
      });
      if (existing && existing.removedAt === null) {
        throw new DomainException(
          ErrorCodes.ALREADY_ENROLLED,
          HttpStatus.CONFLICT,
          'Already enrolled in this course',
        );
      }

      const claimed = await tx.course.updateMany({
        where: {
          id: courseId,
          removedAt: null,
          enrollmentCount: { lt: course.maxSeats },
        },
        data: {
          enrollmentCount: { increment: 1 },
        },
      });
      if (claimed.count === 0) {
        throw new DomainException(
          ErrorCodes.CAPACITY_FULL,
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Course capacity full',
        );
      }

      const include = {
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
      } as const;

      let enrollment: Prisma.EnrollmentGetPayload<{ include: typeof include }>;
      if (existing) {
        const revived = await tx.enrollment.updateMany({
          where: { id: existing.id, removedAt: { not: null } },
          data: { removedAt: null },
        });
        if (revived.count === 0) {
          throw new DomainException(
            ErrorCodes.ALREADY_ENROLLED,
            HttpStatus.CONFLICT,
            'Already enrolled in this course',
          );
        }
        enrollment = await tx.enrollment.findUniqueOrThrow({
          where: { id: existing.id },
          include,
        });
      } else {
        enrollment = await tx.enrollment.create({
          data: { studentId, courseId },
          include,
        });
      }

      await tx.attendance.upsert({
        where: {
          studentId_courseId: { studentId, courseId },
        },
        create: { studentId, courseId },
        update: { removedAt: null, totalLectures: 0, watchedLectures: 0 },
      });

      return enrollment;
    }, TX_OPTIONS);
  }

  async getById(id: string): Promise<EnrollmentResponseDto> {
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
      throw new DomainException(
        ErrorCodes.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Enrollment not found',
      );
    }
    return enrollment;
  }

  async getMyEnrollments(studentId: string): Promise<EnrollmentResponseDto[]> {
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
  }

  async getByCourse(
    courseId: string,
    dto: PaginatedSearchQueryDto,
    requester: CourseRequester,
  ): Promise<PaginatedResponseDto<EnrollmentResponseDto>> {
    const { page, limit } = dto;

    const course = await this.prisma.course.findUnique({
      where: { id: courseId, removedAt: null },
      select: { educatorId: true },
    });
    if (!course) {
      throw new DomainException(
        ErrorCodes.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Course with id not found',
      );
    }
    assertCourseAccess(course, requester);

    const [enrollments, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where: {
          courseId,
          removedAt: null,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
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
  }

  async getAll(
    dto: PaginatedSearchQueryDto,
  ): Promise<PaginatedResponseDto<EnrollmentResponseDto>> {
    const { search, page, limit } = dto;

    const where: Prisma.EnrollmentWhereInput = { removedAt: null };
    if (search)
      where.course = { name: { contains: search, mode: 'insensitive' } };

    const [enrollments, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
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
  }

  async removeById(id: string) {
    await this.prisma.$transaction(async (tx) => {
      const found = await tx.enrollment.findUnique({
        where: { id, removedAt: null },
        select: { courseId: true, studentId: true },
      });
      if (!found) {
        throw new DomainException(
          ErrorCodes.RESOURCE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Enrollment not found',
        );
      }

      const released = await releaseSeat(tx, found.studentId, found.courseId);
      if (released === 0) {
        throw new DomainException(
          ErrorCodes.RESOURCE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Enrollment not found',
        );
      }
    }, TX_OPTIONS);
  }

  async removeByStudent({
    studentId,
    courseId,
  }: {
    studentId: string;
    courseId: string;
  }) {
    await this.prisma.$transaction(async (tx) => {
      const released = await releaseSeat(tx, studentId, courseId);
      if (released === 0) {
        throw new DomainException(
          ErrorCodes.RESOURCE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Enrollment not found',
        );
      }
    }, TX_OPTIONS);
  }
}
