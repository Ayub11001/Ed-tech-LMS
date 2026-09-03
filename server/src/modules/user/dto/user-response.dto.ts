import { Role } from "@prisma/client";

export class UserResponseDto {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    isWarned: boolean;
    removedAt: Date | null
}