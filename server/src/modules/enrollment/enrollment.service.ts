import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentResponseDto } from './dto/enrollment_response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { PaginatedSearchQueryDto } from 'src/common/dto/paginated_search_query.dto';
import { Prisma } from '@prisma/client';

const MAX_SEATS = 60;

@Injectable()
export class EnrollmentService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async create(
        courseId: string, 
        studentId: string
    ): Promise<EnrollmentResponseDto> {
        try {
            const course = await this.prisma.course.findUnique({
                where: { id: courseId, }
            });
            if(!course) throw new NotFoundException("Invalid courseId");
    
            const enrollment = await this.prisma.$transaction(
                async (tx) => {
                    
                    const existing = await tx.enrollment.findUnique({
                        where: { 
                            studentId_courseId: { studentId, courseId }, 
                            removedAt: null
                        }
                    });
                    if(existing) throw new ConflictException("Already enrolled in this course");
                    
                    const count = await tx.enrollment.count({
                        where: { courseId, removedAt: null }
                    });
                    if(count >= MAX_SEATS) throw new BadRequestException("Course capacity full");
    
                    const enrollment = await tx.enrollment.create({
                        data: { studentId, courseId },
                        include: {
                            student: {
                                select: { fullName: true, email: true }
                            },
                            course: {
                                select: { 
                                    name: true,
                                    educator: {
                                        select: { fullName: true, email: true }
                                    }
                                }
                            },
                        }
                    });
    
                    await tx.attendance.create({
                        data: { studentId, courseId, }
                    });
                    return enrollment;
                } 
            );
            return enrollment
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException("")
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
                            email: true
                        }
                    },
                    course: {
                        select: {
                            name: true,
                            educator: {
                                select: {
                                    fullName: true,
                                    email: true
                                }
                            }
                        }
                    }
                },
            });
            if(!enrollment) {
                throw new NotFoundException("Enrollment not found")
            }
            return enrollment;
        } catch (error) {
            if(error instanceof HttpException) throw error;
            throw new InternalServerErrorException("")
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
                            email: true
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
            return enrollments
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Something went wrong');
        }
    }

    async getByCourse(courseId: string, dto: PaginatedSearchQueryDto)
    : Promise<PaginatedResponseDto<EnrollmentResponseDto>> {
        const { page, limit } = dto;

        try {
            const [enrollments, total] = await this.prisma.$transaction([
                this.prisma.enrollment.findMany({
                    where: {
                        courseId, removedAt: null
                    },
                    include: {
                        student: {
                            select: { fullName: true, email: true }
                        },
                        course: {
                            select: {
                                name: true,
                                educator: {
                                    select: { fullName: true, email: true}
                                }
                            }
                        }
                    },
                    skip: (page-1) * limit,
                    take: limit
                }),
    
                this.prisma.enrollment.count({
                    where: { courseId, removedAt: null }
                })
            ]);
    
            return {
                data: enrollments,
                total,
                limit,
                page
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Something went wrong');
        }

    }

    async getAll(dto: PaginatedSearchQueryDto)
    : Promise<PaginatedResponseDto<EnrollmentResponseDto>> {
        const { search, page, limit } = dto;

        const where: Prisma.EnrollmentWhereInput = { removedAt: null };
        if(search) where.course = { name: { contains: search, mode: "insensitive" } };
        
        try {
            const [enrollments, total] = await this.prisma.$transaction([
                this.prisma.enrollment.findMany({
                    where,
                    skip: (page-1) * limit,
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
    
                this.prisma.enrollment.count({where})
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
            await this.prisma.$transaction(
                async (tx) => {
                    const enrollment = await tx.enrollment.update({
                        where: { id },
                        data: { removedAt: new Date() },
                        select: { studentId: true, courseId: true }
                    });

                    await tx.attendance.update({
                        where: { 
                            studentId_courseId: { 
                                studentId: enrollment.studentId, 
                                courseId: enrollment.courseId
                            },
                        },
                        data: { removedAt: new Date() }
                    });
                }
            );
        } catch (error) {

            if(error instanceof HttpException) throw error;
            if(error.code === "P2025") throw new NotFoundException("Enrollment not found");
            throw new InternalServerErrorException("")
        }
    }

    async removeByStudent(
        studentId: string,
        courseId: string
    ) {
        try {
            await this.prisma.$transaction(
                async (tx) => {
                    await tx.enrollment.update({
                        where: {
                            studentId_courseId: { studentId, courseId, },
                        },
                        data: { removedAt: new Date() },
                    });
    
                    await tx.attendance.update({
                         where: {
                            studentId_courseId: { studentId, courseId, },
                        },
                        data: { removedAt: new Date() },
                    });
                }
            );
        } catch (error) {

            if(error instanceof HttpException) throw error;
            if(error.code === "P2025") throw new NotFoundException("Enrollment not found");
            throw new InternalServerErrorException("")
        }
    }

}
