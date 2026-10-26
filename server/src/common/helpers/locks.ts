import { Prisma } from '@prisma/client';

export const TX_OPTIONS = {
  maxWait: 10_000,
  timeout: 20_000,
} as const;

export async function lockCourse(
  tx: Prisma.TransactionClient,
  courseId: string,
): Promise<boolean> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM "courses" WHERE id = ${courseId}::uuid FOR UPDATE
  `;
  return rows.length > 0;
}

export async function lockCourses(
  tx: Prisma.TransactionClient,
  courseIds: string[],
): Promise<void> {
  if (courseIds.length === 0) return;
  const ids = Prisma.join(courseIds.map((id) => Prisma.sql`${id}::uuid`));
  await tx.$queryRaw`
    SELECT id FROM "courses"
    WHERE id IN (${ids})
    ORDER BY id
    FOR UPDATE
  `;
}

export async function lockUser(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<boolean> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM "users" WHERE id = ${userId}::uuid FOR UPDATE
  `;
  return rows.length > 0;
}
