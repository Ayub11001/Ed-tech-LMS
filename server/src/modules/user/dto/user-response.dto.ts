import { Role } from "@prisma/client";

export class UserResponseDto {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    isSuspended: boolean;
    isWarned: boolean;
    removedAt: Date | null
}