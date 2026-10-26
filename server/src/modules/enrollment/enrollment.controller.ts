import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UuidParam } from 'src/common/dto/uuid-param.decorator';
import { EnrollmentResponseDto } from './dto/enrollment_response.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { PaginatedSearchQueryDto } from 'src/common/dto/paginated_search_query.dto';
import { ApiAuth } from 'src/common/swagger/decorators/api-auth.decorator';
import { ApiErrorResponses } from 'src/common/swagger/decorators/api-error-responses.decorator';
import { ApiPaginatedResponse } from 'src/common/swagger/decorators/api-paginated-response.decorator';

@ApiTags('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  // Student endpoints
  @Post(':courseId')
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiAuth()
  @ApiOperation({
    summary: 'Enroll in a course (student only)',
    description:
      'Enrolls the authenticated student in the specified course if seats are available.',
  })
  @ApiParam({ name: 'courseId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Enrolled successfully',
    type: EnrollmentResponseDto,
  })
  @ApiErrorResponses({
    404: 'Invalid courseId',
    409: 'Already enrolled in this course',
    422: 'Course capacity full',
  })
  async enroll(
    @GetUser('id') studentId: string,
    @UuidParam('courseId') courseId: string,
  ): Promise<EnrollmentResponseDto> {
    return await this.enrollmentService.create({ studentId, courseId });
  }

  @Get('')
  @Roles(Role.STUDENT)
  @ApiAuth()
  @ApiOperation({
    summary: 'Get current student enrollments',
    description:
      'Returns all active enrollments for the authenticated student.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of enrollments',
    type: EnrollmentResponseDto,
    isArray: true,
  })
  @ApiErrorResponses()
  async getMyEnrollments(
    @GetUser('id') id: string,
  ): Promise<EnrollmentResponseDto[]> {
    return await this.enrollmentService.getMyEnrollments(id);
  }

  @Delete('dropout/:courseId')
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAuth()
  @ApiOperation({
    summary: 'Drop out of a course (student only)',
    description: 'Soft deletes the enrollment and releases the seat.',
  })
  @ApiParam({ name: 'courseId', type: String, format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Dropped out successfully' })
  @ApiErrorResponses()
  async dropout(
    @UuidParam('courseId') courseId: string,
    @GetUser('id') studentId: string,
  ) {
    await this.enrollmentService.removeByStudent({ studentId, courseId });
  }

  // Educator endpoints

  @Get('course/:courseId')
  @Roles(Role.EDUCATOR)
  @ApiAuth()
  @ApiOperation({
    summary: 'Get enrollments for a course (educator only)',
    description:
      'Returns a paginated list of active students enrolled in the course.',
  })
  @ApiParam({ name: 'courseId', type: String, format: 'uuid' })
  @ApiPaginatedResponse(EnrollmentResponseDto)
  @ApiErrorResponses()
  async getCourseEnrollments(
    @UuidParam('courseId') id: string,
    @Query() dto: PaginatedSearchQueryDto,
  ): Promise<PaginatedResponseDto<EnrollmentResponseDto>> {
    return await this.enrollmentService.getByCourse(id, dto);
  }

  // Admin endpoints

  @Get('enrollments/admin')
  @Roles(Role.ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'List all enrollments (admin only)',
    description: 'Returns a paginated list of all active enrollments.',
  })
  @ApiPaginatedResponse(EnrollmentResponseDto)
  @ApiErrorResponses()
  async getAll(
    @Query() dto: PaginatedSearchQueryDto,
  ): Promise<PaginatedResponseDto<EnrollmentResponseDto>> {
    return await this.enrollmentService.getAll(dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAuth()
  @ApiOperation({
    summary: 'Remove an enrollment (admin only)',
    description: 'Soft deletes the enrollment and releases the seat.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Enrollment ID',
  })
  @ApiResponse({ status: 204, description: 'Enrollment removed successfully' })
  @ApiErrorResponses()
  async removeAdmin(@UuidParam('id') id: string) {
    await this.enrollmentService.removeById(id);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'Get enrollment by ID (admin only)',
    description: 'Returns details for a specific enrollment.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Enrollment ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollment details',
    type: EnrollmentResponseDto,
  })
  @ApiErrorResponses()
  async getById(@UuidParam('id') id: string): Promise<EnrollmentResponseDto> {
    return await this.enrollmentService.getById(id);
  }
}
