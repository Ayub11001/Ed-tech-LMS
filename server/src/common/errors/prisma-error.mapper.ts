import { Prisma } from '@prisma/client';
import { DomainException } from './domain.exceptions';
import { ErrorCodes } from './error-codes';
import { HttpStatus } from '@nestjs/common';

export function mapPrismaError(
  error: unknown,
  path?: string,
): DomainException | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;

  switch (error.code) {
    case 'P2002':
      return mapUniqueViolation(error.meta?.target, path);

    case 'P2025':
      return new DomainException(
        ErrorCodes.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'The requested record no longer exists',
      );

    case 'P2003':
      return new DomainException(
        ErrorCodes.RELATED_RESOURCE_EXISTS,
        HttpStatus.CONFLICT,
        'This record is referenced by other data',
      );
    default:
      return null;
  }
}

function mapUniqueViolation(target: unknown, path?: string): DomainException {
  const fields: unknown[] = Array.isArray(target)
    ? target
    : target
      ? [target]
      : [];
  const key = [...fields].sort().join(',');

  switch (key) {
    case 'email':
      return new DomainException(
        ErrorCodes.EMAIL_TAKEN,
        HttpStatus.CONFLICT,
        'Email is already registered',
      );
    case 'educatorId,name':
      return new DomainException(
        ErrorCodes.COURSE_NAME_TAKEN,
        HttpStatus.CONFLICT,
        'You already have a course with this name',
      );
    case 'courseId,studentId':
      if (path?.includes('/attendance')) {
        return new DomainException(
          ErrorCodes.ATTENDANCE_ALREADY_RECORDED,
          HttpStatus.CONFLICT,
          'Attendance already recorded for this student and course',
        );
      }
      return new DomainException(
        ErrorCodes.ALREADY_ENROLLED,
        HttpStatus.CONFLICT,
        'Student is already enrolled in this course',
      );
    default:
      return new DomainException(
        ErrorCodes.CONFLICT,
        HttpStatus.CONFLICT,
        'A record with these values already exists',
        [{ fields }],
      );
  }
}
