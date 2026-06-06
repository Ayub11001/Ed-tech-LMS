import { ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dtos/create_course.dto';
import { CourseResponseDto } from './dtos/course_response.dto';
import { Prisma, Role } from '@prisma/client';
import { UpdateCourseDto } from './dtos/update_course.dto';
import { CourseSearchQueryDto } from './dtos/course_search_query.dto';

@Injectable()
export class CoursesService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async create(dto: CreateCourseDto)
    : Promise<CourseResponseDto> {

        const { name, description, educatorId } = dto;
        try {

            const educator = await this.prisma.user.findUnique({
                where: {
                    id: educatorId,
                    role: Role.EDUCATOR
                },
                select: {
                    fullName: true,
                    email: true
                }
            });
            if(!educator) {
                throw new NotFoundException("Educator does not exist")
            }

            const course = await this.prisma.course.create({
                data: {
                    name,
                    description,
                    educatorId
                },
            })
            return {
                ...course,
                educator
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;

            if(error.code === 'P2002') 
                throw new ConflictException("A course with this name already exists for this educator");

            else 
                throw new InternalServerErrorException()
        } 
    }

    async update(dto: UpdateCourseDto, courseId: string): Promise<CourseResponseDto> {
        try {
            const course = await this.prisma.course.findUnique({
                where: { id: courseId, },
            });
            if(!course) {
                throw new NotFoundException("Course with ID not found");
            }
    
           if(dto.educatorId) {
                const educator = await this.prisma.user.findUnique({
                    where: { id: dto.educatorId },
                    select: {
                        id: true,
                        fullName: true,
                        role: true,
                    }
                });
                if(!educator || educator.role !== Role.EDUCATOR) {
                    throw new NotFoundException("Educator with given ID not found");
                }
           }
    
            const updatedCourse = await this.prisma.course.update({
                where: { id: courseId },
                data: dto,
                include: {
                    educator: {
                        select: { fullName: true, email: true }
                    }
                }
            });
    
            return updatedCourse;
        } catch (error) {
            if (error instanceof HttpException) throw error;

            if(error.code === 'P2002') 
                throw new ConflictException("A course with this name already exists for this educator");

            else 
                throw new InternalServerErrorException()
        }
        
    }

    async delete(courseId: string): Promise<void> {
        try {
            const course = await this.prisma.course.findUnique({
                where: { id: courseId, },
                select: { _count: { select: { enrollments: true } } }
            })
            if(!course) {
                throw new NotFoundException("Course with ID not found");
            }
            if(course._count.enrollments > 0) {
                throw new ConflictException("Students are already enrolled")
            }

            await this.prisma.course.delete({
                where: { id: courseId },
            })
        } catch (error) {
            if (error instanceof HttpException) throw error;

            if(error.code === 'P2002') 
                throw new ConflictException("A course with this name already exists for this educator");

            else 
                throw new InternalServerErrorException()
        }
    }

    async getMany(queryDto: CourseSearchQueryDto): Promise<CourseResponseDto[]> {
        const where: Prisma.CourseWhereInput = {}
        const { search, page, limit } = queryDto;
        if(search) where.name = { contains: search, mode: "insensitive" };

        try {
            const courses = await this.prisma.course.findMany({
                where,
                skip: (page-1) * limit,
                take: limit,
                include: {
                    educator: {
                        select: { fullName: true, email: true }
                    }
                }
            });
    
            return courses
        } catch (error) {
            if (error instanceof HttpException) throw error;

            else 
                throw new InternalServerErrorException()
        }
    }

    async getByEducatorId(educatorId: string): Promise<CourseResponseDto[]> {
     try {
            const educator = await this.prisma.user.findUnique({
                where: {id: educatorId, role: Role.EDUCATOR}
            });
            if(!educator) throw new NotFoundException("Educator with ID not found");
   
            const courses = await this.prisma.course.findMany({
                where: { educatorId },
                include: {
                    educator: {
                        select: { fullName: true, email: true }
                    }
                }
            });
           return courses;
     } catch (error) {
         if (error instanceof HttpException) throw error;

        else 
            throw new InternalServerErrorException()
     }
    }

    async getOne(courseId: string): Promise<CourseResponseDto> {
        try {
            const course = await this.prisma.course.findUnique({
                where: { id: courseId },
                include: {
                    educator: {
                        select: { fullName: true, email: true, }
                    }
                }
            });
            if(!course) {
                throw new NotFoundException("Course with given ID not found")
            }
            return course
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException()
        }
    }
}
