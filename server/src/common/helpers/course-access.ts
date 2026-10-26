import { HttpStatus } from '@nestjs/common';
import { Role } from '@prisma/client';
import { DomainException } from '../errors/domain.exceptions';
import { ErrorCodes } from '../errors/error-codes';

export interface CourseRequester {
  id: string;
  role: Role;
}

export function assertCourseAccess(
  course: { educatorId: string },
  requester: CourseRequester,
): void {
  if (requester.role !== Role.ADMIN && course.educatorId !== requester.id) {
    throw new DomainException(
      ErrorCodes.FORBIDDEN,
      HttpStatus.FORBIDDEN,
      'You do not have access to this course',
    );
  }
}
