import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';
export const SAFE_REQUEST_ID = /^[A-Za-z0-9_-]{1,64}$/;

@Injectable()
export class RequestMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const reqWithId = req as Request & { id?: string };

    const rawHeader = req.headers[REQUEST_ID_HEADER];
    const clientId = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    const requestId =
      reqWithId.id ??
      (clientId && SAFE_REQUEST_ID.test(clientId) ? clientId : randomUUID());

    reqWithId.id = requestId;
    req.headers[REQUEST_ID_HEADER] = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}
