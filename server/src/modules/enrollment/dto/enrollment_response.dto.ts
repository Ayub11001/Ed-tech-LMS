import { CourseResponseDto } from "src/common/dto/course_response.dto";
import { UserResponseDto } from "src/common/dto/user-response.dto";

export class EnrollmentResponseDto {

    id: string;
    student: UserResponseDto;
    course: CourseResponseDto;
    removedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

