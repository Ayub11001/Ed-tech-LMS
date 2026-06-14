import { CourseResponseDto } from "src/common/dto/course_response.dto";
import { UserResponseDto } from "src/common/dto/user-response.dto";

export class AttendanceResponseDto {
    id: string;
    totalLectures: number;
    watchedLectures: number;
    student: UserResponseDto;
    course: CourseResponseDto
    removedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}