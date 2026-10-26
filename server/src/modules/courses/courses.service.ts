import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dtos/create_course.dto';
import { CourseResponseDto } from './dtos/course_response.dto';
import { Prisma, Role } from '@prisma/client';
import { UpdateCourseDto } from './dtos/update_course.dto';
import { StudentResponseDto } from './dtos/student_response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { PaginatedSearchQueryDto } from 'src/common/dto/paginated_search_query.dto';
import { DomainException } from '../../common/errors/domain.exceptions';
import { ErrorCodes } from '../../common/errors/error-codes';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto): Promise<CourseResponseDto> {
    const { name, description, educatorId } = dto;

    const educator = await this.prisma.user.findUnique({
      where: {
        id: dto.educatorId,
        role: Role.EDUCATOR,
        removedAt: null,
      },
      select: {
        fullName: true,
        email: true,
      },
    });
    if (!educator) {
      throw new DomainException(
        ErrorCodes.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Educator does not exist',
      );
    }

    const course = await this.prisma.course.create({
      data: {
        name,
        description,
        educatorId,
      },
    });
    return {
      ...course,
      educator,
    };
  }

  async update(
    dto: UpdateCourseDto,
    courseId: string,
  ): Promise<CourseResponseDto> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId, removedAt: null },
    });
    if (!course) {
      throw new DomainException(
        ErrorCodes.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Course with ID not found',
      );
    }

    if (dto.educatorId) {
      const educator = await this.prisma.user.findUnique({
        where: { id: dto.educatorId, removedAt: null },
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      });
      if (!educator || educator.role !== Role.EDUCATOR) {
        throw new DomainException(
          ErrorCodes.RESOURCE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Educator with given ID not found',
        );
      }
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: dto,
      include: {
        educator: {
          select: { fullName: true, email: true },
        },
      },
    });

    return updatedCourse;
  }

  async delete(courseId: string): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId, removedAt: null },
      select: {
        _count: {
          select: { enrollments: { where: { removedAt: null } } },
        },
      },
    });
    if (!course) {
      throw new DomainException(
        ErrorCodes.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Course with ID not found',
      );
    }
    if (course._count.enrollments > 0) {
      throw new DomainException(
        ErrorCodes.RELATED_RESOURCE_EXISTS,
        HttpStatus.CONFLICT,
        'Students are already enrolled',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.attendance.updateMany({
        where: { courseId, removedAt: null },
        data: { removedAt: new Date() },
      });

      await tx.course.update({
        where: { id: courseId },
        data: { removedAt: new Date(), enrollmentCount: 0 },
      });
    });
  }

  async getMany(
    queryDto: PaginatedSearchQueryDto,
  ): Promise<PaginatedResponseDto<CourseResponseDto>> {
    const where: Prisma.CourseWhereInput = { removedAt: null };
    const { search, page, limit } = queryDto;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          educator: {
            select: { fullName: true, email: true },
          },
        },
      }),

      this.prisma.course.count({ where }),
    ]);

    return { data: courses, page, limit, total };
  }

  async getByEducatorId(educatorId: string): Promise<CourseResponseDto[]> {
    const educator = await this.prisma.user.findUnique({
      where: { id: educatorId, role: Role.EDUCATOR, removedAt: null },
    });
    if (!educator) {
      throw new DomainException(
        ErrorCodes.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Educator with ID not found',
      );
    }

    const courses = await this.prisma.course.findMany({
      where: { educatorId, removedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      include: {
        educator: {
          select: { fullName: true, email: true },
        },
      },
    });
    return courses;
  }

  async getOne(courseId: string): Promise<CourseResponseDto> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId, removedAt: null },
      include: {
        educator: {
          select: { fullName: true, email: true },
        },
      },
    });
    if (!course) {
      throw new DomainException(
        ErrorCodes.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Course with given ID not found',
      );
    }
    return course;
  }

  // paginate
  async getStudents(
    courseId: string,
    dto: PaginatedSearchQueryDto,
  ): Promise<PaginatedResponseDto<StudentResponseDto>> {
    const { page, limit } = dto;

    const course = await this.prisma.course.findUnique({
      where: { id: courseId, removedAt: null },
    });
    if (!course) {
      throw new DomainException(
        ErrorCodes.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Course with id not found',
      );
    }
    const [students, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where: { courseId, removedAt: null },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        select: {
          student: {
            select: { id: true, fullName: true, email: true },
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
      data: students.map((s) => s.student),
      page,
      limit,
      total,
    };
  }
}
