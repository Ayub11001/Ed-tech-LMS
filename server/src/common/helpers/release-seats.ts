import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainException } from '../errors/domain.exceptions';
import { ErrorCodes } from '../errors/error-codes';
import { lockCourse, lockCourses } from './locks';

async function release(
  tx: Prisma.TransactionClient,
  studentId: string,
  courseId?: string,
): Promise<number> {
  const now = new Date();
  const scope = {
    studentId,
    removedAt: null,
    ...(courseId !== undefined ? { courseId } : {}),
  };

  const enrollments = await tx.enrollment.findMany({
    where: scope,
    select: { courseId: true },
    orderBy: { courseId: 'asc' },
  });

  if (courseId !== undefined) {
    await lockCourse(tx, courseId);
  } else {
    await lockCourses(tx, enrollments.map((enrollment) => enrollment.courseId));
  }

  const expected = await tx.enrollment.count({ where: scope });
  const released = await tx.course.updateMany({
    where: {
      enrollmentCount: { gt: 0 },
      enrollments: { some: scope },
    },
    data: {
      enrollmentCount: { decrement: 1 },
    },
  });

  if (released.count !== expected) {
    throw new DomainException(
      ErrorCodes.INTERNAL_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Stored course enrollment counts are inconsistent',
    );
  }

  await tx.enrollment.updateMany({
    where: scope,
    data: {
      removedAt: now,
    },
  });

  await tx.attendance.updateMany({
    where: scope,
    data: {
      removedAt: now,
    },
  });

  return expected;
}

export async function releaseSeat(
  tx: Prisma.TransactionClient,
  studentId: string,
  courseId: string,
): Promise<number> {
  return release(tx, studentId, courseId);
}

export async function releaseSeats(
  tx: Prisma.TransactionClient,
  studentId: string,
): Promise<number> {
  return release(tx, studentId);
}
