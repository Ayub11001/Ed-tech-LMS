import { createHash } from 'node:crypto';
import bcrypt from 'bcrypt';

export function digestRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url');
}

export function hashRefreshToken(
  token: string,
  rounds: number,
): Promise<string> {
  return bcrypt.hash(digestRefreshToken(token), rounds);
}

export function verifyRefreshToken(
  token: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(digestRefreshToken(token), hash);
}
