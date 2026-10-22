import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainException } from '../errors/domain.exceptions';
import { ErrorCodes } from '../errors/error-codes';

export async function releaseSeats(
  tx: Prisma.TransactionClient,
  studentId: string,
): Promise<void> {
  const now = new Date();

  // Seats currently held by this student. One per course, guaranteed by
  // @@unique([studentId, courseId]) on Enrollment. Used for the strict check.
  const expected = await tx.enrollment.count({
    where: {
      studentId,
      removedAt: null,
    },
  });

  // Release every seat in one set-based statement. The relation filter is
  // evaluated by the database and the decrement is atomic at the row level.
  const released = await tx.course.updateMany({
    where: {
      enrollmentCount: { gt: 0 },
      enrollments: { some: { studentId, removedAt: null } },
    },
    data: {
      enrollmentCount: { decrement: 1 },
    },
  });

  if (released.count !== expected) {
    throw new DomainException(
      ErrorCodes.CONFLICT,
      HttpStatus.CONFLICT,
      'Stored course enrollment counts are inconsistent',
    );
  }

  await tx.enrollment.updateMany({
    where: {
      studentId,
      removedAt: null,
    },
    data: {
      removedAt: now,
    },
  });

  await tx.attendance.updateMany({
    where: {
      studentId,
      removedAt: null,
    },
    data: {
      removedAt: now,
    },
  });
}
