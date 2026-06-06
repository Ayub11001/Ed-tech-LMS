import { CreateCourseDto } from "./create_course.dto";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}


