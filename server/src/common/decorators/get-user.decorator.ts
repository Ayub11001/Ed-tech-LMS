import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Request } from 'express';

interface AuthRequest extends Request {
  user?: User;
}

export const GetUser = createParamDecorator(
  (
    data: keyof User | undefined,
    context: ExecutionContext,
  ): User | User[keyof User] => {
    const req: AuthRequest = context.switchToHttp().getRequest<AuthRequest>();
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException();
    }
    if (data === undefined) return user;

    return user[data];
  },
);
