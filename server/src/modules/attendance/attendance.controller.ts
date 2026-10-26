import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AttendanceService } from './attendance.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UuidParam } from 'src/common/dto/uuid-param.decorator';
import { AttendanceResponseDto } from './dto/attendance_response.dto';
import { PaginatedSearchQueryDto } from 'src/common/dto/paginated_search_query.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { ApiAuth } from 'src/common/swagger/decorators/api-auth.decorator';
import { ApiErrorResponses } from 'src/common/swagger/decorators/api-error-responses.decorator';
import { ApiPaginatedResponse } from 'src/common/swagger/decorators/api-paginated-response.decorator';

@ApiTags('attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('student')
  @Roles(Role.STUDENT)
  @ApiAuth()
  @ApiOperation({
    summary: 'Get attendance for current student',
    description: 'Returns attendance records for the authenticated student.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of attendance records',
    type: AttendanceResponseDto,
    isArray: true,
  })
  @ApiErrorResponses()
  async getStudentAttendance(
    @GetUser('id') id: string,
  ): Promise<AttendanceResponseDto[]> {
    return await this.attendanceService.getByStudent(id);
  }

  @Get('educator/:courseId')
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'Get attendance for a course',
    description:
      'Returns a paginated list of attendance records for the course. Accessible to educators and admins.',
  })
  @ApiParam({ name: 'courseId', type: String, format: 'uuid' })
  @ApiPaginatedResponse(AttendanceResponseDto)
  @ApiErrorResponses()
  async getCourseAttendance(
    @UuidParam('courseId') id: string,
    @Query() dto: PaginatedSearchQueryDto,
  ): Promise<PaginatedResponseDto<AttendanceResponseDto>> {
    return await this.attendanceService.getByCourse(id, dto);
  }

  @Get('admin')
  @Roles(Role.ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'List all attendance records (admin only)',
    description: 'Returns a paginated list of all attendance records.',
  })
  @ApiPaginatedResponse(AttendanceResponseDto)
  @ApiErrorResponses()
  async getAll(
    @Query() dto: PaginatedSearchQueryDto,
  ): Promise<PaginatedResponseDto<AttendanceResponseDto>> {
    return await this.attendanceService.getAll(dto);
  }

  @Get('admin/:id')
  @Roles(Role.ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'Get attendance record by ID (admin only)',
    description: 'Returns details for a specific attendance record.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Attendance ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Attendance record details',
    type: AttendanceResponseDto,
  })
  @ApiErrorResponses()
  async getById(@UuidParam('id') id: string): Promise<AttendanceResponseDto> {
    return await this.attendanceService.getById(id);
  }
}
