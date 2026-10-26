import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dtos/create_course.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from '@prisma/client';
import type { CourseRequester } from 'src/common/helpers/course-access';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CourseResponseDto } from './dtos/course_response.dto';
import { UpdateCourseDto } from './dtos/update_course.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UuidParam } from 'src/common/dto/uuid-param.decorator';
import { StudentResponseDto } from './dtos/student_response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { PaginatedSearchQueryDto } from 'src/common/dto/paginated_search_query.dto';
import { ApiAuth } from 'src/common/swagger/decorators/api-auth.decorator';
import { ApiErrorResponses } from 'src/common/swagger/decorators/api-error-responses.decorator';
import { ApiPaginatedResponse } from 'src/common/swagger/decorators/api-paginated-response.decorator';

@ApiTags('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly courseService: CoursesService) {}

  // Educator and admin
  @Get('/:id/students')
  @Roles(Role.ADMIN, Role.EDUCATOR)
  @HttpCode(HttpStatus.OK)
  @ApiAuth()
  @ApiOperation({
    summary: 'Get students enrolled in a course',
    description:
      'Returns a paginated list of active students. Only accessible to the course educator or admins.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Course ID',
  })
  @ApiPaginatedResponse(StudentResponseDto)
  @ApiErrorResponses()
  async getStudents(
    @UuidParam('id') id: string,
    @Query() dto: PaginatedSearchQueryDto,
    @GetUser() requester: CourseRequester,
  ): Promise<PaginatedResponseDto<StudentResponseDto>> {
    return await this.courseService.getStudents(id, dto, requester);
  }

  // ADMIN

  @Post()
  @Roles(Role.ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'Create a new course (admin only)',
    description: 'Creates a course owned by the specified educator.',
  })
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
    type: CourseResponseDto,
  })
  @ApiErrorResponses({ 404: 'Educator does not exist' })
  async createCourse(@Body() dto: CreateCourseDto): Promise<CourseResponseDto> {
    return await this.courseService.create(dto);
  }

  @Get('/admin/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiAuth()
  @ApiOperation({
    summary: 'Get courses by educator ID (admin only)',
    description: 'Returns all active courses owned by the specified educator.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Educator user ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of courses',
    type: CourseResponseDto,
    isArray: true,
  })
  @ApiErrorResponses()
  async getEducatorCoursesAdmin(
    @UuidParam('id') id: string,
  ): Promise<CourseResponseDto[]> {
    return await this.courseService.getByEducatorId(id);
  }

  @Patch('/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiAuth()
  @ApiOperation({
    summary: 'Update a course (admin only)',
    description: 'Updates course details or reassigns the educator.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Course ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Course updated successfully',
    type: CourseResponseDto,
  })
  @ApiErrorResponses({ 404: 'Course or educator not found' })
  async update(@UuidParam('id') id: string, @Body() dto: UpdateCourseDto) {
    return await this.courseService.update(dto, id);
  }

  @Delete('/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAuth()
  @ApiOperation({
    summary: 'Delete a course (admin only)',
    description:
      'Soft deletes the course. Fails if active students are enrolled.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Course ID',
  })
  @ApiResponse({ status: 204, description: 'Course deleted successfully' })
  @ApiErrorResponses({ 409: 'Students are already enrolled' })
  async delete(@UuidParam('id') id: string): Promise<void> {
    return await this.courseService.delete(id);
  }

  // EDUCATOR

  @Get('/edu')
  @Roles(Role.EDUCATOR)
  @HttpCode(HttpStatus.OK)
  @ApiAuth()
  @ApiOperation({
    summary: 'Get current educator courses',
    description:
      'Returns all active courses owned by the authenticated educator.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of courses',
    type: CourseResponseDto,
    isArray: true,
  })
  @ApiErrorResponses()
  async getEducatorCourses(
    @GetUser('id') id: string,
  ): Promise<CourseResponseDto[]> {
    return await this.courseService.getByEducatorId(id);
  }

  // ALL ROLES

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiAuth()
  @ApiOperation({
    summary: 'List all active courses',
    description:
      'Returns a paginated list of active courses with optional search.',
  })
  @ApiPaginatedResponse(CourseResponseDto)
  @ApiErrorResponses()
  async getAll(
    @Query() dto: PaginatedSearchQueryDto,
  ): Promise<PaginatedResponseDto<CourseResponseDto>> {
    return await this.courseService.getMany(dto);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @ApiAuth()
  @ApiOperation({
    summary: 'Get course details',
    description: 'Returns details for an active course.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Course ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Course details',
    type: CourseResponseDto,
  })
  @ApiErrorResponses()
  async getCourseById(@UuidParam('id') id: string): Promise<CourseResponseDto> {
    return await this.courseService.getOne(id);
  }
}
