import { ComplaintStatus } from "@prisma/client";
import { UserResponseDto } from "src/common/dto/user-response.dto";

export class ComplaintResponseDto {
    id: string;
    reason: string;
    status: ComplaintStatus;
    student: UserResponseDto;
    educator: UserResponseDto;
    removedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}