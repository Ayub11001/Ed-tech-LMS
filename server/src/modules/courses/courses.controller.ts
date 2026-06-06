import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dtos/create_course.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CourseResponseDto } from './dtos/course_response.dto';
import { CourseSearchQueryDto } from './dtos/course_search_query.dto';
import { UpdateCourseDto } from './dtos/update_course.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { StudentResponseDto } from './dtos/student_response.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly courseService: CoursesService) {}

  // Educator and admin
  @Get("/:id/students")
  @Roles(Role.ADMIN, Role.EDUCATOR)
  @HttpCode(HttpStatus.OK) 
  async getStudents(@Param("id") id: string): Promise<StudentResponseDto[]> {
    return await this.courseService.getStudents(id);
  }

  // ADMIN

  @Post()
  @Roles(Role.ADMIN)
  async createCourse(@Body() dto: CreateCourseDto): Promise<CourseResponseDto> {
    return await this.courseService.create(dto);
  }

  @Get("/admin/:id")
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getEducatorCoursesAdmin(@Param("id") id: string): Promise<CourseResponseDto[]> {
    return await this.courseService.getByEducatorId(id);
  }

  @Patch("/:id")
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async update(@Param("id") id: string, @Body() dto: UpdateCourseDto) {
    return await this.courseService.update(dto, id);
  }

  @Delete("/:id")
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string): Promise<void> {
    return await this.courseService.delete(id)
  }

  // EDUCATOR

  @Get("/edu")
  @Roles(Role.EDUCATOR)
  @HttpCode(HttpStatus.OK)
  async getEducatorCourses(@GetUser("id") id: string): Promise<CourseResponseDto[]> {
    return await this.courseService.getByEducatorId(id);
  }

  // ALL ROLES

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(@Query() dto: CourseSearchQueryDto): Promise<CourseResponseDto[]> {
    return await this.courseService.getMany(dto);
  }

  @Get("/:id")
  @HttpCode(HttpStatus.OK)
  async getCourseById(@Param("id") id: string): Promise<CourseResponseDto> {
    return await this.courseService.getOne(id);
  }
}
