export class EnrollmentResponseDto {

    id: string;
    student: UserResponseDto;
    course: CourseResponseDto;
    removedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export class UserResponseDto {
    fullName: string;
    email: string;
}
export class CourseResponseDto {
    name: string;
    educator: UserResponseDto;
}