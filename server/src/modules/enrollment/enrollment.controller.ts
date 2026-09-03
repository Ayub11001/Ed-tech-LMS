import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { EnrollmentResponseDto } from './dto/enrollment_response.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { PaginatedSearchQueryDto } from 'src/common/dto/paginated_search_query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollment')
export class EnrollmentController {
    constructor(
        private readonly enrollmentService: EnrollmentService
    ) {}

    // Student endpoints
    @Post(":courseId")
    @Roles(Role.STUDENT)
    @HttpCode(HttpStatus.CREATED)
    async enroll(
        @GetUser("id") studentId: string,
        @Param("courseId") courseId: string,
    ): Promise<EnrollmentResponseDto> {
        return await this.enrollmentService.create(studentId, courseId);
    };

    @Get("")
    @Roles(Role.STUDENT)
    async getMyEnrollments(@GetUser("id") id: string): Promise<EnrollmentResponseDto[]> {
        return await this.enrollmentService.getMyEnrollments(id);
    }

    @Delete("dropout/:courseId")
    @Roles(Role.STUDENT)
    @HttpCode(HttpStatus.NO_CONTENT)
    async dropout( 
        @Param("courseId") courseId: string,
        @GetUser("id") studentId: string
    ) {
        await this.enrollmentService.removeByStudent(studentId, courseId)
    }

    // Educator endpoints

    @Get("course/:courseId")
    @Roles(Role.EDUCATOR)
    async getCourseEnrollments(
        @Param("courseId") id: string, 
        @Query() dto: PaginatedSearchQueryDto,
    )
    : Promise<PaginatedResponseDto<EnrollmentResponseDto>> {
        return await this.enrollmentService.getByCourse(id, dto);
    }

    // Admin endpoints

    @Get("enrollments/admin")
    @Roles(Role.ADMIN)
    async getAll(
        @Query() dto: PaginatedSearchQueryDto 
    )
    : Promise<PaginatedResponseDto<EnrollmentResponseDto>> {
        return await this.enrollmentService.getAll(dto);
    }

    @Delete(":id")
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeAdmin(@Param("id") id: string) {
        await this.enrollmentService.removeById(id);
    }

    @Get(":id")
    @Roles(Role.ADMIN)
    async getById(@Param("id") id: string): Promise<EnrollmentResponseDto> {
        return await this.enrollmentService.getById(id);
    }

}
