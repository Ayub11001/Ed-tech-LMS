import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AttendanceService } from './attendance.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { AttendanceResponseDto } from './dto/attendance_response.dto';
import { PaginatedSearchQueryDto } from 'src/common/dto/paginated_search_query.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
    constructor(
        private readonly attendanceService: AttendanceService
    ) {}

    @Get("student")
    @Roles(Role.STUDENT)
    async getStudentAttendance(@GetUser("id") id: string)
    : Promise<AttendanceResponseDto[]> {
        return await this.attendanceService.getByStudent(id);
    }

    @Get("educator/:courseId")
    @Roles(Role.EDUCATOR, Role.ADMIN)
    async getCourseAttendance(
        @Param("courseId") id: string,
        @Query() dto: PaginatedSearchQueryDto
    ): Promise<PaginatedResponseDto<AttendanceResponseDto>> {
        return await this.attendanceService.getByCourse(id, dto);
    }

    @Get("admin")
    @Roles(Role.ADMIN)
    async getAll(@Query() dto: PaginatedSearchQueryDto)
    : Promise<PaginatedResponseDto<AttendanceResponseDto>> {
        return await this.attendanceService.getAll(dto);
    }

    @Get("admin/:id")
    @Roles(Role.ADMIN)
    async getById(@Param("id") id: string): Promise<AttendanceResponseDto> {
        return await this.attendanceService.getById(id);
    }
}
