import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { RegisterComplaintDto } from './dto/register_complaint.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { ComplaintResponseDto } from './dto/complaint_response.dto';
import { ComplaintSearchQueryDto } from './dto/complaint_search_query.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { ResolveComplaintDto } from './dto/resolve_complaint.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('complaints')
export class ComplaintsController {
    constructor(
        private readonly complaintsService: ComplaintsService
    ) {}

    // Students

    @Get("/students")
    @Roles(Role.STUDENT)
    async getStudentComplaint(@GetUser("id") id: string)
    : Promise<ComplaintResponseDto[]> {
        return await this.complaintsService.getByStudent(id);
    };

    // Admin
    @Get("all")
    @Roles(Role.ADMIN)
    async getAll(@Query() dto: ComplaintSearchQueryDto)
    : Promise<PaginatedResponseDto<ComplaintResponseDto>> {
        return await this.complaintsService.getAll(dto);
    };

    @Get("admin/:complaintId")
    @Roles(Role.ADMIN)
    async getOneComplaint(@Param("complaintId") id: string)
    : Promise<ComplaintResponseDto> {
        return await this.complaintsService.getById(id);
    };

    @Patch("process/:id")
    @Roles(Role.ADMIN)
    async processComplaint(@Param("id") id: string)
    : Promise<ComplaintResponseDto> {
        return await this.complaintsService.process(id);
    };

    @Patch("resolve/:id")
    @Roles(Role.ADMIN)
    async resolveComplaint(
        @Body() dto: ResolveComplaintDto,
        @Param("id") id: string,
    )
    : Promise<ComplaintResponseDto> {
        return await this.complaintsService.resolve(id, dto);
    }

    // Educator
    @Get("educator")
    @Roles(Role.EDUCATOR)
    async getEducatorComplaints(@GetUser("id") id: string)
    : Promise<ComplaintResponseDto[]> {
        return await this.complaintsService.getByEducator(id);
    };
    
    @Post(":studentId")
    @Roles(Role.EDUCATOR)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: RegisterComplaintDto,
        @Param("studentId") studentId: string,
        @GetUser("id") educatorId: string
    ): Promise<ComplaintResponseDto> {
        return await this.complaintsService.create(dto, studentId, educatorId);
    };
}
