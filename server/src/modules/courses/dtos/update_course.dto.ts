import { PartialType } from '@nestjs/swagger';
import { CreateCourseDto } from './create_course.dto';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
