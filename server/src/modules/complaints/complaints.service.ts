import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterComplaintDto } from './dto/register_complaint.dto';
import { ComplaintResponseDto } from './dto/complaint_response.dto';
import { ComplaintStatus, Prisma, Role } from '@prisma/client';
import { ComplaintSearchQueryDto } from './dto/complaint_search_query.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { ResolveComplaintDto } from './dto/resolve_complaint.dto';
import { DomainException } from '../../common/errors/domain.exceptions';
import { ErrorCodes } from '../../common/errors/error-codes';
import { releaseSeats } from 'src/common/helpers/release-seats';

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly complaintSelect = {
    id: true,
    reason: true,
    status: true,
    removedAt: true,
    createdAt: true,
    updatedAt: true,
    student: { select: { fullName: true, email: true } },
    educator: { select: { fullName: true, email: true } },
  } satisfies Prisma.ComplaintSelect;

  async create(
    dto: RegisterComplaintDto,
    studentId: string,
    educatorId: string,
  ): Promise<ComplaintResponseDto> {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId, removedAt: null, role: Role.STUDENT },
    });
    if (!student) {
      throw new DomainException(
        ErrorCodes.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Student with given id not found',
      );
    }

    const existing = await this.prisma.complaint.findFirst({
      where: {
        studentId,
        educatorId,
        status: {
          in: [ComplaintStatus.PENDING, ComplaintStatus.PROCESSING],
        },
      },
    });
    if (existing) {
      throw new DomainException(
        ErrorCodes.COMPLAINT_ALREADY_PENDING,
        HttpStatus.CONFLICT,
        'A complaint is already pending or in process',
      );
    }

    const complaint = await this.prisma.complaint.create({
      data: {
        reason: dto.reason,
        studentId,
        educatorId,
      },
      select: this.complaintSelect,
    });

    return complaint;
  }

  async getById(id: string): Promise<ComplaintResponseDto> {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id, removedAt: null },
      select: this.complaintSelect,
    });
    if (!complaint) {
      throw new DomainException(
        ErrorCodes.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Complaint with id not found',
      );
    }
    return complaint;
  }

  async getByStudent(studentId: string): Promise<ComplaintResponseDto[]> {
    const complaints = await this.prisma.complaint.findMany({
      where: { studentId, removedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      select: this.complaintSelect,
    });

    return complaints;
  }

  async getByEducator(educatorId: string): Promise<ComplaintResponseDto[]> {
    const complaints = await this.prisma.complaint.findMany({
      where: { educatorId, removedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      select: this.complaintSelect,
    });

    return complaints;
  }

  async getAll(
    dto: ComplaintSearchQueryDto,
  ): Promise<PaginatedResponseDto<ComplaintResponseDto>> {
    const { studentName, educatorName, reason, page, limit } = dto;

    const where: Prisma.ComplaintWhereInput = { removedAt: null };
    if (studentName)
      where.student = {
        fullName: { contains: studentName, mode: 'insensitive' },
      };
    if (educatorName)
      where.educator = {
        fullName: { contains: educatorName, mode: 'insensitive' },
      };
    if (reason) where.reason = { contains: reason, mode: 'insensitive' };

    const [complaints, total] = await this.prisma.$transaction([
      this.prisma.complaint.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        select: this.complaintSelect,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return {
      data: complaints,
      page,
      limit,
      total,
    };
  }

  async process(id: string): Promise<ComplaintResponseDto> {
    const updatedComplaint = await this.prisma.complaint.update({
      where: { id },
      data: { status: ComplaintStatus.PROCESSING },
      select: this.complaintSelect,
    });
    return updatedComplaint;
  }

  async resolve(
    id: string,
    dto: ResolveComplaintDto,
  ): Promise<ComplaintResponseDto> {
    const { resolution, deduction } = dto;

    const updatedComplaint = await this.prisma.$transaction(async (tx) => {
      const existingComplaint = await tx.complaint.findUnique({
        where: {
          id,
          removedAt: null,
          status: {
            in: [ComplaintStatus.PROCESSING, ComplaintStatus.PENDING],
          },
        },
        select: { studentId: true },
      });
      if (!existingComplaint) {
        throw new DomainException(
          ErrorCodes.RESOURCE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Complaint not found',
        );
      }
      const studentId = existingComplaint.studentId;

      if (resolution === 'REMOVED') {
        await releaseSeats(tx, studentId);

        await tx.complaint.updateMany({
          where: {
            studentId,
            NOT: { id },
            removedAt: null,
            status: {
              in: [ComplaintStatus.PENDING, ComplaintStatus.PROCESSING],
            },
          },
          data: { removedAt: new Date() },
        });

        await tx.user.update({
          where: { id: studentId, removedAt: null },
          data: { removedAt: new Date() },
        });
      } else {
        await tx.attendance.updateMany({
          where: { studentId: existingComplaint.studentId, removedAt: null },
          data: { watchedLectures: { decrement: deduction } },
        });

        await tx.user.update({
          where: { id: studentId, removedAt: null },
          data: { isWarned: true },
        });
      }

      const update = await tx.complaint.update({
        where: {
          id,
          removedAt: null,
          status: {
            in: [ComplaintStatus.PROCESSING, ComplaintStatus.PENDING],
          },
        },
        data: { status: ComplaintStatus.RESOLVED },
        select: this.complaintSelect,
      });
      return update;
    });
    return updatedComplaint;
  }
}
