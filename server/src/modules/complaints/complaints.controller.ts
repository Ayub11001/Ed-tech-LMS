import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { RegisterComplaintDto } from './dto/register_complaint.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UuidParam } from 'src/common/dto/uuid-param.decorator';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { ComplaintResponseDto } from './dto/complaint_response.dto';
import { ComplaintSearchQueryDto } from './dto/complaint_search_query.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { ResolveComplaintDto } from './dto/resolve_complaint.dto';
import { ApiAuth } from 'src/common/swagger/decorators/api-auth.decorator';
import { ApiErrorResponses } from 'src/common/swagger/decorators/api-error-responses.decorator';
import { ApiPaginatedResponse } from 'src/common/swagger/decorators/api-paginated-response.decorator';

@ApiTags('complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  // Students

  @Get('/students')
  @Roles(Role.STUDENT)
  @ApiAuth()
  @ApiOperation({
    summary: 'Get complaints filed by current student',
    description: 'Returns complaints submitted by the authenticated student.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of complaints',
    type: ComplaintResponseDto,
    isArray: true,
  })
  @ApiErrorResponses()
  async getStudentComplaint(
    @GetUser('id') id: string,
  ): Promise<ComplaintResponseDto[]> {
    return await this.complaintsService.getByStudent(id);
  }

  // Admin
  @Get('all')
  @Roles(Role.ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'List all complaints (admin only)',
    description:
      'Returns a paginated list of complaints with optional filters.',
  })
  @ApiPaginatedResponse(ComplaintResponseDto)
  @ApiErrorResponses()
  async getAll(
    @Query() dto: ComplaintSearchQueryDto,
  ): Promise<PaginatedResponseDto<ComplaintResponseDto>> {
    return await this.complaintsService.getAll(dto);
  }

  @Get('admin/:complaintId')
  @Roles(Role.ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'Get complaint by ID (admin only)',
    description: 'Returns details for a specific complaint.',
  })
  @ApiParam({ name: 'complaintId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Complaint details',
    type: ComplaintResponseDto,
  })
  @ApiErrorResponses()
  async getOneComplaint(
    @UuidParam('complaintId') id: string,
  ): Promise<ComplaintResponseDto> {
    return await this.complaintsService.getById(id);
  }

  @Patch('process/:id')
  @Roles(Role.ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'Mark complaint as processing (admin only)',
    description: 'Moves a pending complaint to PROCESSING status.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Complaint updated',
    type: ComplaintResponseDto,
  })
  @ApiErrorResponses({ 409: 'Complaint is not pending' })
  async processComplaint(
    @UuidParam('id') id: string,
  ): Promise<ComplaintResponseDto> {
    return await this.complaintsService.process(id);
  }

  @Patch('resolve/:id')
  @Roles(Role.ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'Resolve a complaint (admin only)',
    description:
      'Resolves the complaint as WARNED (with optional deduction) or REMOVED.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Complaint resolved',
    type: ComplaintResponseDto,
  })
  @ApiErrorResponses({ 409: 'Complaint already resolved' })
  async resolveComplaint(
    @Body() dto: ResolveComplaintDto,
    @UuidParam('id') id: string,
  ): Promise<ComplaintResponseDto> {
    return await this.complaintsService.resolve(id, dto);
  }

  // Educator
  @Get('educator')
  @Roles(Role.EDUCATOR)
  @ApiAuth()
  @ApiOperation({
    summary: 'Get complaints against current educator',
    description: 'Returns complaints filed against the authenticated educator.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of complaints',
    type: ComplaintResponseDto,
    isArray: true,
  })
  @ApiErrorResponses()
  async getEducatorComplaints(
    @GetUser('id') id: string,
  ): Promise<ComplaintResponseDto[]> {
    return await this.complaintsService.getByEducator(id);
  }

  @Post(':studentId')
  @Roles(Role.EDUCATOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiAuth()
  @ApiOperation({
    summary: 'File a complaint against a student (educator only)',
    description:
      'Creates a complaint filed by the authenticated educator against the specified student.',
  })
  @ApiParam({
    name: 'studentId',
    type: String,
    format: 'uuid',
    description: 'Student ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Complaint created',
    type: ComplaintResponseDto,
  })
  @ApiErrorResponses({
    409: 'A pending complaint already exists between this educator and student',
  })
  async create(
    @Body() dto: RegisterComplaintDto,
    @UuidParam('studentId') studentId: string,
    @GetUser('id') educatorId: string,
  ): Promise<ComplaintResponseDto> {
    return await this.complaintsService.create(dto, studentId, educatorId);
  }
}
