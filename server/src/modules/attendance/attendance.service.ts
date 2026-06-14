import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceResponseDto } from './dto/attendance_response.dto';
import { PaginatedSearchQueryDto } from 'src/common/dto/paginated_search_query.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { Prisma } from '@prisma/client';


@Injectable()
export class AttendanceService {
    constructor(
        private readonly prisma: PrismaService 
    ) {}

    async getById(id: string): Promise<AttendanceResponseDto> {
        try {
            const attendance = await this.prisma.attendance.findUnique({
                where:{ id, removedAt: null },
                include: {
                    student: {
                        select: { fullName: true, email: true, },
                    },
                    course: {
                        select: { name: true }
                    }
                },
            });
            if(!attendance) throw new NotFoundException("Attendance with id not found");
            return attendance;
        } catch (error) {
            if(error instanceof HttpException) throw error
            throw new InternalServerErrorException("Failed to fetch attendance")
        }
    }

    async getByStudent(studentId: string): Promise<AttendanceResponseDto[]> {
        try {
            const attendances = await this.prisma.attendance.findMany({
                where: { studentId, removedAt: null, },
                include: {
                    student: { select: { fullName: true, email: true, }, },
                    course: { select: { name: true } }
                },
            });
            return attendances
        } catch (error) {
            if(error instanceof HttpException) throw error
            throw new InternalServerErrorException("Failed to fetch attendance")
        }
    }

    async getByCourse(courseId: string, dto: PaginatedSearchQueryDto)
    : Promise<PaginatedResponseDto<AttendanceResponseDto>> {
        try {
            const { page, limit } = dto;

            const existingCourse = await this.prisma.course.findUnique({
                where: {id: courseId}
            });
            if(!existingCourse) throw new NotFoundException("Course with id not found");

            const [attendances, total] = await this.prisma.$transaction([
                this.prisma.attendance.findMany({
                    where: { courseId, removedAt: null },
                    skip: (page-1) * limit,
                    take: limit,
                    include: {
                        student: {
                            select: { fullName: true, email: true, },
                        },
                        course: {
                            select: { name: true, },
                        },
                    },
                }),

                this.prisma.attendance.count({
                    where: { courseId, removedAt: null, },
                })
            ]);

            return {
                data: attendances,
                page,
                limit,
                total
            };
        } catch (error) {
            if(error instanceof HttpException) throw error
            throw new InternalServerErrorException("Failed to fetch attendance")
        }
    } 

    async getAll(dto: PaginatedSearchQueryDto)
    : Promise<PaginatedResponseDto<AttendanceResponseDto>> {
        const { search, page, limit } = dto;
        try {
            const where: Prisma.AttendanceWhereInput = { removedAt: null };
            if(search) where.student = { 
                fullName: { contains: search, mode: "insensitive" },
            }

            const [attendances, total] = await this.prisma.$transaction([
                this.prisma.attendance.findMany({
                    where,
                    skip: (page-1)*limit,
                    take: limit,
                    include: {
                        student: { 
                            select: { fullName: true, email: true },
                        },
                        course: {
                            select: {
                                name: true,
                                educator: {
                                    select: { fullName: true, email: true, },
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
                total
            }
        } catch (error) {
            if(error instanceof HttpException) throw error
            throw new InternalServerErrorException("Failed to fetch attendance")
        }
    }
}
