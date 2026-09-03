import { 
    ConflictException, 
    HttpException, 
    Injectable, 
    InternalServerErrorException, 
    NotFoundException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterComplaintDto } from './dto/register_complaint.dto';
import { ComplaintResponseDto } from './dto/complaint_response.dto';
import { ComplaintStatus, Prisma, Role } from '@prisma/client';
import { ComplaintSearchQueryDto } from './dto/complaint_search_query.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { ResolveComplaintDto } from './dto/resolve_complaint.dto';

@Injectable()
export class ComplaintsService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

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
        educatorId: string
    ): Promise<ComplaintResponseDto> {
        try {

            const student = await this.prisma.user.findUnique({
                where: { id: studentId, removedAt: null, role: Role.STUDENT }
            });
            if(!student) throw new NotFoundException("Studnet with given Id not found");

            const existing = await this.prisma.complaint.findFirst({
                where: { 
                    studentId, 
                    educatorId,
                    status: {
                        in: [ComplaintStatus.PENDING, ComplaintStatus.PROCESSING]
                    },
                },
            });
            if(existing) throw new ConflictException("A complaint is already pending or in process");

            const complaint = await this.prisma.complaint.create({
                data: {
                    reason: dto.reason,
                    studentId,
                    educatorId,
                },
                select: this.complaintSelect
            });

            return complaint
        } catch (error) {
            if(error instanceof HttpException) throw error
            throw new InternalServerErrorException("Failed to register complaint")
        }
    };

    async getById(id: string): Promise<ComplaintResponseDto> {
        try {
            const complaint = await this.prisma.complaint.findUnique({
                where: { id, removedAt: null },
                select: this.complaintSelect
            });
            if(!complaint) throw new NotFoundException("Complaint with id not found") 
            return complaint;
        } catch (error) {
            if(error instanceof HttpException) throw error;
            throw new InternalServerErrorException("Failed to retrieve complaint");
        }
    };

    async getByStudent(studentId: string): Promise<ComplaintResponseDto[]> {
        try {
            const complaints = await this.prisma.complaint.findMany({
                where: { studentId, removedAt: null },
                orderBy: { createdAt: "desc" },
                select: this.complaintSelect,
            });

            return complaints;
        } catch (error) {
            if(error instanceof HttpException) throw error;
            throw new InternalServerErrorException("Failed to retrieve complaint");
        }
    };

    async getByEducator(educatorId: string): Promise<ComplaintResponseDto[]> {
        try {
            const complaints = await this.prisma.complaint.findMany({
                where: { educatorId, removedAt: null },
                orderBy: { createdAt: "desc" },
                select: this.complaintSelect,
            });

            return complaints;
        } catch (error) {
            if(error instanceof HttpException) throw error;
            throw new InternalServerErrorException("Failed to retrieve complaint"); 
        }
    };

    async getAll(dto: ComplaintSearchQueryDto)
    : Promise<PaginatedResponseDto<ComplaintResponseDto>> {
        try {
            const {
                studentName,
                educatorName,
                reason,
                page,
                limit,
            } = dto;

            const where: Prisma.ComplaintWhereInput = { removedAt: null };
            if(studentName) where.student = {
                fullName: { contains: studentName, mode: "insensitive" }
            };
            if(educatorName) where.educator = {
                fullName: { contains: educatorName, mode: "insensitive" }
            };
            if(reason) where.reason = { contains: reason, mode: "insensitive" }

            const [complaints, total] = await this.prisma.$transaction([
                this.prisma.complaint.findMany({
                    where,
                    select: this.complaintSelect,
                    skip: (page-1) * limit,
                    take: limit,
                }),
                this.prisma.complaint.count({ where })
            ]);

            return {
                data: complaints,
                page,
                limit,
                total
            }
        } catch (error) {
            if(error instanceof HttpException) throw error;
            throw new InternalServerErrorException("Failed to retrieve complaint"); 
        }
    };

    async process(id: string): Promise<ComplaintResponseDto>  {
        try {
            const updatedComplaint = await this.prisma.complaint.update({
                where: { id },
                data: { status: ComplaintStatus.PROCESSING },
                select: this.complaintSelect
            });
            return updatedComplaint;

        } catch (error) {
            if(error instanceof HttpException) throw error;
            if(error instanceof Prisma.PrismaClientKnownRequestError 
                &&
            error.code === "P2025")
                throw new NotFoundException("Complaint with id not found");
            throw new InternalServerErrorException("Failed to process complaint"); 
        }
    };

    async resolve(id: string, dto: ResolveComplaintDto)
    : Promise<ComplaintResponseDto>  {
        try {
            const { resolution, deduction } = dto;

            const updatedComplaint = await this.prisma.$transaction(
                async (tx) => {
                    const existingComplaint = await tx.complaint.findUnique({
                        where: { 
                            id, 
                            removedAt: null, 
                            status: { 
                                in: [ComplaintStatus.PROCESSING, ComplaintStatus.PENDING]
                            },
                        },
                        select: { studentId: true, }
                    });
                    if(!existingComplaint) throw new NotFoundException("Complaint not found");
                    const studentId = existingComplaint.studentId;

                    if(resolution === "REMOVED") {
                        await tx.enrollment.updateMany({
                            where: { studentId, removedAt: null },
                            data: { removedAt: new Date() }
                        });

                        await tx.attendance.updateMany({
                            where: { studentId, removedAt: null },
                            data: { removedAt: new Date() }
                        });

                        await tx.complaint.updateMany({
                            where: { 
                                studentId,
                                NOT: { id }, 
                                removedAt: null, 
                                status: {
                                    in: [
                                        ComplaintStatus.PENDING, 
                                        ComplaintStatus.PROCESSING,
                                    ], 
                                },
                            },
                            data: { removedAt: new Date() }
                        });

                        await tx.user.update({
                            where: { id: studentId, removedAt: null },
                            data: { removedAt: new Date() }
                        });

                    } else {
                        await tx.attendance.updateMany({
                            where: { studentId: existingComplaint.studentId, removedAt: null },
                            data: { watchedLectures: { decrement: deduction } }
                        });

                         await tx.user.update({
                            where: { id: studentId, removedAt: null },
                            data: { isWarned: true, },
                        });
                    }

                    const update = await tx.complaint.update({
                        where: { 
                            id, 
                            removedAt: null, 
                            status: { 
                                in: [
                                    ComplaintStatus.PROCESSING, 
                                    ComplaintStatus.PENDING,
                                ],
                            },
                        },
                        data: { status: ComplaintStatus.RESOLVED },
                        select: this.complaintSelect,
                    });
                    return update;
                },
            );
            return updatedComplaint;

        } catch (error) {

            if(error instanceof HttpException) throw error;
            if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
                throw new NotFoundException("Complaint not found");
            throw new InternalServerErrorException("Failed to resolve complaint");
        }
    };

}
 