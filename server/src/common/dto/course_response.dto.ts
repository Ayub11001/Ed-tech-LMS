import { UserResponseDto } from "./user-response.dto";

export class CourseResponseDto {
    name: string;
    educator?: UserResponseDto; // null for a simpler return value in modules other than course and enrollment
}