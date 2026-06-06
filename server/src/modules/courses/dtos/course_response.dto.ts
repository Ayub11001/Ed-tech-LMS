export class CourseResponseDto {
    id: string
    name: string;
    description: string;
    educator: EducatorResponseDto;
    createdAt: Date;
    updatedAt: Date;
}

export class EducatorResponseDto {
    fullName: string;
    email: string;
}